import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioManager} from '../src/services/audio.js';
import {musicManifest} from '../src/services/musicContext.js';
const flush=()=>new Promise(r=>setImmediate(r)),tick=()=>new Promise(r=>setTimeout(r,35));
function context(){const parameter=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.target=v;},cancelScheduledValues(){}});return {state:'running',currentTime:0,destination:{},createGain(){return{gain:parameter(),connect(){},disconnect(){}};},async decodeAudioData(){return{duration:90};},createBufferSource(){return{connect(){},disconnect(){},start(when){this.started=when;},stop(when){this.stopped=when;}};}};}
test('0.12.1 BGM: actual source-ended boundary, 1 audio-second gap, mute/suspend, stale cancellation',async()=>{
 const ctx=context(),a=new AudioManager({contextFactory:()=>ctx,fetchAudio:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})});
 try{
  await a.unlock();a.setBgmAsset('stage.01',musicManifest);await flush();const old=a.currentBgm;ctx.currentTime=5;
  a.setBgmAsset('stage.02',musicManifest,{sequential:true});await flush();assert.equal(a.currentBgm,old);assert.equal(old.source.stopped,6.5);assert.equal(a.bgmStatus,'FADING_OUT');assert.equal(a.bgmSources.size,1);
  ctx.currentTime=6.5;old.source.onended();await flush();assert.equal(a.bgmSources.size,0);assert.equal(a.bgmStatus,'SILENT_GAP');assert.equal(a.sfx!==null,true);
  ctx.state='suspended';ctx.currentTime=7;await tick();assert.equal(a.bgmSources.size,0);
  ctx.state='running';a.configure({muted:true});ctx.currentTime=8;await tick();assert.equal(a.bgmSources.size,0);
  a.configure({muted:false});ctx.currentTime=8.99;await tick();assert.equal(a.bgmSources.size,0);ctx.currentTime=9.01;await tick();assert.equal(a.currentBgm.assetId,'stage.02');assert.equal(a.bgmSources.size,1);assert.equal(a.bgmBus.gain.value,.8);
  const second=a.currentBgm;a.setBgmAsset('stage.01',musicManifest,{sequential:true});await flush();const staleEnd=second.source.onended;
  a.setBgmAsset('lobby',musicManifest);await flush();staleEnd();ctx.currentTime+=5;await tick();assert.equal(a.currentBgm.assetId,'lobby');assert.equal(a.bgmSources.size,1);assert.equal(a.bgmTransition,null);
  a.setBgmAsset('stage.03',musicManifest,{sequential:true});const last=a.currentBgm;ctx.currentTime+=1.5;last.source.onended();ctx.currentTime+=1.01;await tick();assert.equal(a.bgmSources.size,0);assert.equal(a.bgm,null);
  a.setBgmAsset('stage.01',musicManifest);await flush();a.fetchAudio=async()=>({ok:false,status:404});a.setBgmAsset('missing',{missing:'assets/test-missing.mp3'},{sequential:true});await flush();assert.equal(a.bgmStatus,'ERROR');assert.equal(a.bgmTransition,null);assert.equal(a.bgmSources.size,0);
  a.fetchAudio=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});assert.equal(await a.retryBgm(),true);await flush();assert.equal(a.currentBgm.assetId,'missing');assert.equal(a.bgmSources.size,1);
 }finally{a.disposeClosedContext();}
});
