import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioManager} from '../src/services/audio.js';
import {resolveMusicContext,musicManifest} from '../src/services/musicContext.js';
import {MONSTER_ASSETS,SCENE_ASSETS,sceneAssetUrl} from '../src/services/sceneAssets.js';
import {SHOP_FLOW_POLICY} from '../src/game/shopFlow.js';
import fs from 'node:fs';

test('scene assets: seven explicit pairs and 22 original files, no stage 3 guessed paths',()=>{
  const files=[...Object.values(SCENE_ASSETS).flatMap(v=>[v.background,v.entry,v.combat,v.bgm].filter(Boolean)),...Object.values(MONSTER_ASSETS).flatMap(v=>[v.idle,v.hit])];
  assert.equal(files.length,22);assert.equal(new Set(files).size,22);for(const path of files)assert.ok(fs.statSync('public/'+path).size>0);
  assert.equal(SCENE_ASSETS['stage.03'],undefined);assert.equal(sceneAssetUrl(undefined),null);
  assert.ok(MONSTER_ASSETS['enemy.stage2.03'].idle.endsWith('06_idle.png'));
});
test('music context: boss reward/shop/choices retain source region, actual intro switches; legacy preserved',()=>{
  const run={version:'0.11.0',config:{shopFlowPolicy:SHOP_FLOW_POLICY},progress:{stageId:'stage.01'},status:'REWARD'};
  assert.equal(resolveMusicContext('#lobby',run),'lobby');assert.equal(resolveMusicContext('#game',run),'stage.01');
  for(const [next,previous]of [['stage.02','stage.01'],['stage.04','stage.03'],['stage.06','stage.05'],['stage.08','stage.07'],['stage.10','stage.09'],['stage.final','stage.10']]){
    run.progress.stageId=next;run.status='SHOP';assert.equal(resolveMusicContext('#game',run),previous);
    run.status='STAGE_INTRO';run.shop={stageId:next,closed:true};run.combat=null;assert.equal(resolveMusicContext('#game',run),next);
  }
  for(const [stage,field,previous]of [['stage.04','entryChoice','stage.03'],['stage.08','waterwaysEntryChoice','stage.07']]){
    run.progress.stageId=stage;run.shop=null;run[field]={pending:true};assert.equal(resolveMusicContext('#game',run),previous);
  }
  run.config={};run.status='SHOP';run.progress.stageId='stage.02';assert.equal(resolveMusicContext('#game',run),'stage.02');
  assert.equal(musicManifest['stage.03'],undefined);
});
const flush=()=>new Promise(r=>setImmediate(r));
function context(){const parameter=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.target=v;},cancelScheduledValues(){}});return {state:'running',currentTime:0,destination:{},createGain(){return{gain:parameter(),connect(target){this.target=target;},disconnect(){}};},async decodeAudioData(){return{duration:90};},createBufferSource(){return{connect(){},disconnect(){},start(){this.starts=(this.starts??0)+1;},stop(){}};}};}
test('BGM independent 0.8 bus, stable source/position on renders, mute/settings/SFX cleanup',async()=>{
  const ctx=context(),a=new AudioManager({contextFactory:()=>ctx,fetchAudio:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})});
  a.setBgmAsset('lobby',musicManifest);assert.equal(a.bgmSources.size,0);await a.unlock();await flush();
  const source=a.currentBgm;assert.equal(a.bgmBus.gain.value,.8);assert.equal(a.bgmBus.target,ctx.destination);assert.equal(a.master.gain.value,.7);
  ctx.currentTime=12;a.setBgmAsset('lobby',musicManifest);a.configure({muted:true});a.stopAll();assert.equal(a.bgmBus.gain.value,0);a.configure({muted:false,volume:.1});
  assert.equal(a.currentBgm,source);assert.equal(a.bgmSnapshot().sources[0].position,12);assert.equal(a.bgmBus.gain.value,.8);a.configure({bgmVolume:.5});assert.equal(a.bgmBus.gain.value,.4);
});
test('BGM late loads cannot resurrect stale requests; crossfade is bounded and failed/unregistered regions fade out',async()=>{
  const pending=[],ctx=context(),a=new AudioManager({contextFactory:()=>ctx,fetchAudio:(url)=>new Promise(resolve=>pending.push({url,resolve}))});await a.unlock();
  const ready=async i=>{pending[i].resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});await flush();};
  a.setBgmAsset('lobby',musicManifest);a.setBgmAsset('stage.01',musicManifest);await ready(1);await ready(0);assert.equal(a.currentBgm.assetId,'stage.01');assert.equal(a.bgmSources.size,1);
  ctx.currentTime=2;a.setBgmAsset('stage.02',musicManifest);await ready(2);assert.equal(a.bgmSources.size,2);assert.equal(a.currentBgm.gain.gain.target,1);
  a.setBgmAsset('lobby',musicManifest);await ready(3);assert.equal(a.bgmSources.size,2);
  a.setBgmAsset('bad',{bad:'assets/missing.mp3'});pending[4].resolve({ok:false,status:404});await flush();assert.equal(a.bgmStatus,'ERROR');assert.equal(a.currentBgm,null);
  for(const voice of [...a.bgmSources])voice.source.onended();assert.equal(a.bgmSources.size,0);
  a.setBgmAsset('stage.03',musicManifest);assert.equal(a.bgm,null);assert.equal(pending.length,5);
});
