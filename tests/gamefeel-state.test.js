import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioManager} from '../src/services/audio.js';
import {createMusicDirector,musicManifest} from '../src/services/musicContext.js';
import {scoreFeedback} from '../src/engine/scoreFeedback.js';
import {buildPresentationTimeline} from '../src/engine/presentation.js';
import {lobbyAddress} from '../src/ui/viewport.js';
const flush=()=>new Promise(r=>setImmediate(r));
function context(){const param=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.target=v;},cancelScheduledValues(){}});return {state:'suspended',currentTime:0,destination:{},resumes:0,async resume(){this.resumes++;this.state='running';},createGain(){return{gain:param(),connect(){},disconnect(){}};},async decodeAudioData(){return{duration:90};},createBufferSource(){return{connect(){},disconnect(){},start(when,offset){this.offset=offset;},stop(){}};}};}
test('audio interruption resumes the same source; closed context restores session offset once',async()=>{
 const first=context(),second=context();let made=0;const a=new AudioManager({contextFactory:()=>++made===1?first:second,fetchAudio:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})});
 a.setBgmAsset('lobby',musicManifest);await Promise.all([a.unlock(),a.unlock()]);await flush();const source=a.currentBgm;assert.equal(made,1);
 first.currentTime=17;first.state='interrupted';await a.unlock();assert.equal(a.currentBgm,source);assert.equal(first.resumes,2);
 first.state='closed';first.onstatechange();a.configure({muted:true,volume:0,bgmVolume:.5});await Promise.all([a.unlock(),a.unlock()]);await flush();
 assert.equal(made,2);assert.equal(a.currentBgm.source.offset,17);assert.equal(a.bgmSources.size,1);assert.equal(a.bgmBus.gain.value,0);assert.equal(a.volume,0);
 a.configure({muted:false});assert.equal(a.bgmBus.gain.value,.4);assert.equal(a.currentBgm.source.offset,17);
});
test('audio rejection clears initialization; subsequent tap retries without resetting user settings',async()=>{
 const ctx=context();let reject=true;ctx.resume=async()=>{if(reject)throw Error('NotAllowed');ctx.state='running';};const a=new AudioManager({contextFactory:()=>ctx});a.configure({volume:0,muted:true});
 assert.equal(await a.unlock(),false);assert.equal(a.initializing,null);reject=false;assert.equal(await a.unlock(),true);assert.equal(a.volume,0);assert.equal(a.muted,true);
});
test('music grace deadline survives fast entry, cancels on lobby/load, never starts an unregistered URL',()=>{
 let now=0,id=0;const jobs=new Map(),calls=[],audio={currentBgm:{assetId:'stage.01'},setBgmAsset(key){calls.push([now,key]);}},director=createMusicDirector(audio,{schedule:(fn,ms)=>{jobs.set(++id,{fn,at:now+ms});return id;},cancel:key=>jobs.delete(key)});
 const tick=ms=>{now+=ms;for(const [key,job]of jobs)if(job.at<=now){jobs.delete(key);job.fn();}};
 const run={runId:'qa',version:'0.11.0',config:{shopFlowPolicy:'BOSS_REWARD_FIRST_V1'},progress:{stageId:'stage.01'},status:'REWARD'},owner={};
 director.sync('#game',run,owner);run.progress.stageId='stage.02';run.status='SHOP';director.sync('#game',run,owner);assert.equal(jobs.size,0);
 run.status='STAGE_INTRO';run.shop={stageId:'stage.02',closed:true};director.sync('#game',run,owner);tick(1800);run.status='BATTLE';director.sync('#game',run,owner);tick(1199);assert.equal(calls.length,1);tick(1);assert.deepEqual(calls.at(-1),[3000,'stage.02']);
 run.progress.stageId='stage.03';director.sync('#game',run,owner);director.sync('#lobby',run,owner);tick(4000);assert.equal(calls.at(-1)[1],'lobby');assert.equal(jobs.size,0);
 director.sync('#game',run,{});assert.equal(calls.at(-1)[1],'stage.03');assert.equal(musicManifest['stage.03'],undefined);assert.equal(jobs.size,0);
});
test('negative display uses real delta, separates defense and grammar, HP protection is neutral',()=>{
 assert.deepEqual(scoreFeedback({before:90,after:80,phase:'ACCURACY',sourceType:'GRAMMAR'}),{kind:'grammar-loss',delta:-10,amount:'−10',color:'#ff956d'});
 assert.equal(scoreFeedback({before:100,after:25,phase:'BOSS',sourceType:'BOSS'}).kind,'defense');
 assert.equal(scoreFeedback({before:100,after:70,phase:'RESISTANCE',sourceType:'STAGE'}).kind,'defense');
 assert.equal(scoreFeedback({before:100,after:100,phase:'BOSS',sourceType:'BOSS'}).kind,'neutral');
 assert.equal(scoreFeedback({before:20,after:37,phase:'RUNE',sourceType:'RUNE'}).amount,'');
 const resolution={finalPower:80,enemyHpBefore:90,enemyHpAfter:10,actualHpLoss:80,scoreTimeline:[{before:90,after:80,phase:'ACCURACY',sourceType:'GRAMMAR'}]};
 const timeline=buildPresentationTimeline(resolution,{speed:2});assert.ok(timeline.find(s=>s.kind==='SCORE').duration>=350);assert.ok(timeline.find(s=>s.kind==='CHARGE').duration>=180);assert.ok(timeline.find(s=>s.kind==='LUNGE').duration>=140);
});
test('fullscreen share address keeps deployment base, no QA query/profile',()=>{
 assert.equal(lobbyAddress('https://yeomt.github.io','/grammardealer/'),'https://yeomt.github.io/grammardealer/#lobby');
 assert.equal(lobbyAddress('https://yeomt.github.io/grammardealer/?debug=1#game','./'),'https://yeomt.github.io/grammardealer/#lobby');
});
