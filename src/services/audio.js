import { assetUrl } from './assets.js';

const TYPES = Object.freeze({
  operation: { frequency: 780, duration: .18, wave: 'sine', gain: .075 },
  card: { frequency: 330, duration: .065, wave: 'triangle', gain: .09 },
  score: { frequency: 440, duration: .12, wave: 'sine', gain: .11 },
  rune: { frequency: 660, duration: .2, wave: 'triangle', gain: .12 },
  charge: { frequency: 125, duration: .18, wave: 'sawtooth', gain: .055 },
  impact: { frequency: 100, duration: .21, wave: 'triangle', gain: .2 },
  impactLow: { frequency: 64, duration: .24, wave: 'sine', gain: .10 },
  penalty: { frequency: 320, duration: .24, wave: 'triangle', gain: .085 },
  blocked: { frequency: 160, duration: .12, wave: 'square', gain: .05 },
});
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** One AudioContext / Master / SFX bus, bounded synthesis, and an independent persistent BGM bus. */
export class AudioManager {
  /** @param {{contextFactory?: Function, maxVoices?: number}} [options] */
  constructor({ contextFactory, maxVoices = 8, fetchAudio = (...args) => fetch(...args), fadeSeconds = 1.5 } = {}) {
    this.contextFactory = contextFactory ?? (() => {
      const Constructor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      return Constructor ? new Constructor() : null;
    });
    this.maxVoices = clamp(Number.isInteger(maxVoices) ? maxVoices : 8, 1, 12);
    this.context = null; this.master = null; this.sfx = null; this.bgm = null;
    this.voices = new Set(); this.muted = false; this.volume = .65;
    this.failed = false; this.initializing = null;
    this.bgmBus=null;this.bgmVolume=1;this.bgmSources=new Set();this.currentBgm=null;
    this.bgmEpoch=0;this.bgmLoad=null;this.bgmLoadingEpoch=null;this.fetchAudio=fetchAudio;this.fadeSeconds=fadeSeconds;
    this.bgmStatus='IDLE';this.bgmWarnings=new Set();this.listeners=new Set();this.resumeOffsets=new Map();
  }

  /** Call from a real user gesture. Autoplay rejection is a silent, recoverable false result. */
  async unlock() {
    if(this.context?.state==='running'){this.failed=false;void this.loadBgm(this.bgmEpoch);return true;}
    if (this.initializing) return this.initializing;
    this.initializing = (async () => {
      try {
        if(this.context?.state==='closed')this.disposeClosedContext();
        if (!this.context) {
          const context = this.contextFactory();
          if (!context) return false;
          this.context = context;
          context.onstatechange=()=>{if(this.context===context){if(context.state==='closed'&&this.currentBgm)this.resumeOffsets.set(this.currentBgm.assetId,(context.currentTime-this.currentBgm.startedAt)%this.currentBgm.duration);this.notify();}};
          this.master = context.createGain(); this.sfx = context.createGain();
          this.master.gain.value = this.muted ? 0 : .7;
          this.sfx.gain.value = this.volume;
          this.sfx.connect(this.master); this.master.connect(context.destination);
          this.bgmBus=context.createGain();this.bgmBus.gain.value=this.muted?0:.8*this.bgmVolume;this.bgmBus.connect(context.destination);
        }
        if(['suspended','interrupted'].includes(this.context.state)){
          let timer;try{await Promise.race([this.context.resume(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Audio resume needs another tap')),1500);})]);}finally{clearTimeout(timer);}
        }
        this.failed = this.context.state!=='running';
        if(this.context.state==='running')void this.loadBgm(this.bgmEpoch);
        return this.context.state === 'running';
      } catch { this.failed = true; return false; }
    })();
    try { return await this.initializing; } finally { this.initializing = null;this.notify(); }
  }

  /** @param {{muted?: boolean, volume?: number}} settings */
  configure({ muted = this.muted, volume = this.volume, bgmVolume = this.bgmVolume } = {}) {
    this.muted = Boolean(muted);
    this.volume = Number.isFinite(volume) ? clamp(volume, 0, 1) : this.volume;
    this.bgmVolume=Number.isFinite(bgmVolume)?clamp(bgmVolume,0,1):this.bgmVolume;
    if(this.bgmBus)this.bgmBus.gain.value=this.muted?0:.8*this.bgmVolume;
    if (this.master) this.master.gain.value = this.muted ? 0 : .7;
    if (this.sfx) this.sfx.gain.value = this.volume;
    if (this.muted) this.stopAll();
    this.notify();
  }

  /** Synchronous and best effort; no audio failure can hold up a presentation. */
  play(name, { step = 0, intensity = 1 } = {}) {
    const spec = TYPES[name];
    if (!spec || this.muted || this.volume === 0 || !this.context || this.context.state !== 'running' || !this.sfx) return false;
    try {
      while (this.voices.size >= this.maxVoices) this.stopVoice(this.voices.values().next().value);
      const context = this.context, now = context.currentTime;
      const oscillator = context.createOscillator(), gain = context.createGain();
      const note = clamp(Number.isFinite(step) ? step : 0, 0, 12);
      const strength = clamp(Number.isFinite(intensity) ? intensity : 1, .5, 2);
      const frequency = spec.frequency * Math.pow(2, note / 24);
      oscillator.type = spec.wave;
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(name === 'impact' ? 35 : name === 'penalty'?frequency*.55:name === 'charge' ? frequency * 2 : frequency * 1.12, now + spec.duration);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.min(.22, spec.gain * strength), now + .009);
      gain.gain.exponentialRampToValueAtTime(.0001, now + spec.duration);
      oscillator.connect(gain); gain.connect(this.sfx);
      const voice = { oscillator, gain };
      this.voices.add(voice);
      oscillator.onended = () => this.stopVoice(voice);
      oscillator.start(now); oscillator.stop(now + spec.duration + .01);
      return true;
    } catch { return false; }
  }

  stopVoice(voice) {
    if (!voice || !this.voices.has(voice)) return;
    this.voices.delete(voice);
    try { voice.oscillator.onended = null; voice.oscillator.stop(); voice.oscillator.disconnect(); voice.gain.disconnect(); } catch { /* already ended */ }
  }

  stopAll() { for (const voice of [...this.voices]) this.stopVoice(voice); }

  /** Idempotent scene request; resolves immediately and never gates a game transition. */
  setBgmAsset(assetId, manifest = {}) {
    const url=assetId?assetUrl(assetId,manifest):null;
    if((this.bgm?.url??null)===url&&(!url||this.bgm?.assetId===assetId))return this.bgm;
    this.bgm=url?{assetId,url}:null;this.bgmEpoch++;this.bgmLoad?.abort();this.bgmLoad=null;
    this.bgmStatus=url?'REQUESTED':'SILENT';
    if(!url)this.fadeBgm(null);else if(this.context?.state==='running')void this.loadBgm(this.bgmEpoch);
    this.notify();return this.bgm;
  }

  async loadBgm(epoch){
    const requested=this.bgm;
    if(!requested||epoch!==this.bgmEpoch||this.bgmLoadingEpoch===epoch||this.bgmStatus==='ERROR')return;
    if(this.currentBgm?.url===requested.url)return;
    this.bgmLoadingEpoch=epoch;const abort=new AbortController();this.bgmLoad=abort;
    const timeout=setTimeout(()=>abort.abort(),15000);this.bgmStatus='LOADING';this.notify();
    try{
      const response=await this.fetchAudio(requested.url,{signal:abort.signal});if(!response.ok)throw Error('HTTP '+response.status);
      const bytes=await response.arrayBuffer();if(epoch!==this.bgmEpoch)return;
      const buffer=await this.context.decodeAudioData(bytes);if(epoch!==this.bgmEpoch)return;
      const source=this.context.createBufferSource(),gain=this.context.createGain();
      source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(this.bgmBus);gain.gain.value=0;
      const voice={...requested,source,gain,startedAt:this.context.currentTime-(this.resumeOffsets.get(requested.assetId)??0),duration:buffer.duration};
      source.onended=()=>this.releaseBgm(voice);source.start(0,(this.resumeOffsets.get(requested.assetId)??0)%buffer.duration);this.resumeOffsets.delete(requested.assetId);this.fadeBgm(voice);this.bgmStatus='PLAYING';
    }catch(error){if(epoch===this.bgmEpoch){this.bgmStatus='ERROR';this.fadeBgm(null);if(!this.bgmWarnings.has(requested.url)){this.bgmWarnings.add(requested.url);console.warn('BGM unavailable:',requested.url,error.message);}}}
    finally{clearTimeout(timeout);if(this.bgmLoadingEpoch===epoch)this.bgmLoadingEpoch=null;if(this.bgmLoad===abort)this.bgmLoad=null;this.notify();}
  }

  holdCurrentBgm(){
    this.bgmEpoch++;this.bgmLoad?.abort();this.bgmLoad=null;
    this.bgm=this.currentBgm?{assetId:this.currentBgm.assetId,url:this.currentBgm.url}:null;
    this.bgmStatus=this.currentBgm?'PLAYING':'IDLE';this.notify();
  }

  releaseBgm(voice){
    if(!this.bgmSources.delete(voice))return;
    voice.source.onended=null;try{voice.source.stop();}catch{}voice.source.disconnect();voice.gain.disconnect();voice.source.buffer=null;
    if(this.currentBgm===voice)this.currentBgm=null;
  }

  fadeBgm(next){
    if(!this.context)return;
    const now=this.context.currentTime,seconds=this.fadeSeconds;
    // Retain at most the current voice plus its replacement, including rapid requests.
    for(const voice of [...this.bgmSources])if(voice!==this.currentBgm)this.releaseBgm(voice);
    const previous=this.currentBgm;
    if(previous){const ramp=previous.ramp;const value=ramp?clamp((now-ramp.start)/ramp.duration,0,1):1;
      previous.gain.gain.cancelScheduledValues(now);previous.gain.gain.setValueAtTime(value,now);previous.gain.gain.linearRampToValueAtTime(0,now+seconds);previous.source.stop(now+seconds);}
    this.currentBgm=next;
    if(next){this.bgmSources.add(next);next.ramp={start:now,duration:seconds};next.gain.gain.setValueAtTime(0,now);next.gain.gain.linearRampToValueAtTime(1,now+seconds);}
  }

  subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  notify(){for(const listener of this.listeners)listener();}
  disposeClosedContext(){
    this.bgmEpoch++;this.bgmLoad?.abort();this.bgmLoad=null;this.bgmLoadingEpoch=null;this.stopAll();
    for(const voice of [...this.bgmSources])this.releaseBgm(voice);
    for(const node of [this.master,this.sfx,this.bgmBus])try{node?.disconnect();}catch{}
    if(this.context)this.context.onstatechange=null;this.context=null;this.master=null;this.sfx=null;this.bgmBus=null;
    this.bgmStatus=this.bgm?'REQUESTED':'IDLE';
  }
  async retryBgm(){
    if(this.bgmStatus==='ERROR'){this.bgmEpoch++;this.bgmStatus='REQUESTED';}
    const ok=await this.unlock();if(ok)void this.loadBgm(this.bgmEpoch);return ok;
  }
  /** Install once. Real gestures start/resume directly; visibility recovery is one best-effort attempt. */
  installLifecycle(doc=globalThis.document,win=globalThis.window){
    const gesture=e=>{if(e.isTrusted&&!(e.type==='pointerdown'&&e.pointerType!=='mouse')&&!(e.type==='pointerup'&&e.pointerType==='mouse')&&!e.repeat)void this.unlock();};
    const recover=()=>{if(!doc.hidden&&!this.muted&&this.context&&['suspended','interrupted'].includes(this.context.state))void this.unlock();};
    for(const type of ['pointerdown','pointerup','touchend','keydown'])doc.addEventListener(type,gesture,{capture:true,passive:true});
    doc.addEventListener('visibilitychange',recover);win.addEventListener('pageshow',recover);
    return()=>{for(const type of ['pointerdown','pointerup','touchend','keydown'])doc.removeEventListener(type,gesture,true);doc.removeEventListener('visibilitychange',recover);win.removeEventListener('pageshow',recover);};
  }

  bgmSnapshot(){return {requested:this.bgm?.assetId??null,status:this.bgmStatus,context:this.context?.state??'locked',gain:this.bgmBus?.gain.value??(this.muted?0:.8*this.bgmVolume),sources:[...this.bgmSources].map(v=>({assetId:v.assetId,url:v.url,startedAt:v.startedAt,position:(this.context.currentTime-v.startedAt)%v.duration,duration:v.duration,loop:v.source.loop}))};}

}

export const audio = new AudioManager();
