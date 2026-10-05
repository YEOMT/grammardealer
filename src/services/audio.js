import { assetUrl } from './assets.js';

const TYPES = Object.freeze({
  operation: { frequency: 780, duration: .18, wave: 'sine', gain: .075 },
  card: { frequency: 330, duration: .065, wave: 'triangle', gain: .09 },
  score: { frequency: 440, duration: .12, wave: 'sine', gain: .11 },
  rune: { frequency: 660, duration: .2, wave: 'triangle', gain: .12 },
  charge: { frequency: 125, duration: .18, wave: 'sawtooth', gain: .055 },
  impact: { frequency: 100, duration: .21, wave: 'triangle', gain: .2 },
  impactLow: { frequency: 64, duration: .24, wave: 'sine', gain: .10 },
  blocked: { frequency: 160, duration: .12, wave: 'square', gain: .05 },
});
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** One AudioContext / Master / SFX bus, bounded synthesis, and a future local BGM asset hook. */
export class AudioManager {
  /** @param {{contextFactory?: Function, maxVoices?: number}} [options] */
  constructor({ contextFactory, maxVoices = 8 } = {}) {
    this.contextFactory = contextFactory ?? (() => {
      const Constructor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      return Constructor ? new Constructor() : null;
    });
    this.maxVoices = clamp(Number.isInteger(maxVoices) ? maxVoices : 8, 1, 12);
    this.context = null; this.master = null; this.sfx = null; this.bgm = null;
    this.voices = new Set(); this.muted = false; this.volume = .65;
    this.failed = false; this.initializing = null;
  }

  /** Call from a real user gesture. Autoplay rejection is a silent, recoverable false result. */
  async unlock() {
    if (this.initializing) return this.initializing;
    this.initializing = (async () => {
      try {
        if (!this.context) {
          const context = this.contextFactory();
          if (!context) return false;
          this.context = context;
          this.master = context.createGain(); this.sfx = context.createGain();
          this.master.gain.value = this.muted ? 0 : .7;
          this.sfx.gain.value = this.volume;
          this.sfx.connect(this.master); this.master.connect(context.destination);
        }
        if (this.context.state === 'suspended') await this.context.resume();
        this.failed = false;
        return this.context.state === 'running';
      } catch { this.failed = true; return false; }
    })();
    try { return await this.initializing; } finally { this.initializing = null; }
  }

  /** @param {{muted?: boolean, volume?: number}} settings */
  configure({ muted = this.muted, volume = this.volume } = {}) {
    this.muted = Boolean(muted);
    this.volume = Number.isFinite(volume) ? clamp(volume, 0, 1) : this.volume;
    if (this.master) this.master.gain.value = this.muted ? 0 : .7;
    if (this.sfx) this.sfx.gain.value = this.volume;
    if (this.muted) this.stopAll();
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
      oscillator.frequency.exponentialRampToValueAtTime(name === 'impact' ? 35 : name === 'charge' ? frequency * 2 : frequency * 1.12, now + spec.duration);
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

  /** Replacement hook only: no BGM is loaded unless a real local file is registered. */
  setBgmAsset(assetId, manifest = {}) {
    const url = assetUrl(assetId, manifest);
    this.bgm = url ? { assetId, url } : null;
    return this.bgm;
  }
}

export const audio = new AudioManager();
