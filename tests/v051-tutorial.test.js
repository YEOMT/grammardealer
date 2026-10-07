import test from 'node:test';import assert from 'node:assert/strict';
import {RunController} from '../src/game/runController.js';
import {newProfile,validateRunState,canSaveRun} from '../src/services/localStore.js';
import {registry} from '../src/data/language/index.js';
import {tutorialCommand} from '../src/game/guidedTutorial.js';
import {firstAttack,secondAttack,action} from './guided-tutorial.test.js';
const start=profile=>{const c=new RunController({profile});assert.ok(c.dispatch({type:'NEW_RUN',config:{seed:'skip.same',vocabularyMode:'STANDARD'}}).ok);assert.ok(c.dispatch({type:'START_BATTLE'}).ok);return c;};
const normalized=s=>Object.fromEntries(['activeCardIds','cardInstances','vocabulary','rng','openingFrames','combat','stats','economy','reward','settlementIds','eligibility'].map(k=>[k,s[k]]));
for(const step of [1,2,12,13,26,27,28,30,31])test(`0.5.1 skip at real tutorial step ${step} restores identical normal first battle without reward`,()=>{
 const p=newProfile('skip'),c=start(p),normal=start({...p,guidedTutorialCompletedVersion:'0.2.1'});
 if(step===2)action(c,{type:'TUTORIAL_ACK'});
 if(step>=12){const r=firstAttack(c);assert.equal(r.finalPower,40);if(step>12)action(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});}
 if(step>=26){const r=secondAttack(c);assert.equal(r.finalPower,126);for(let i=26;i<Math.min(step,29);i++)action(c,{type:'TUTORIAL_GATE_ACK',attackId:r.attackId});if(step>=30)action(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});if(step===31)action(c,{type:'TUTORIAL_ACK'});}
 const before=c.getState(),profile=c.getProfile(),cmd=tutorialCommand(before,{type:'SKIP_TUTORIAL',confirmed:true,commandId:'skip.once'});
 assert.equal(before.tutorialSession.step,step);
 assert.equal(c.dispatch({...cmd,confirmed:false}).ok,false);assert.deepEqual(c.getState(),before);
 assert.ok(c.dispatch(cmd).ok);const s=c.getState();assert.deepEqual(normalized(s),normalized(normal.getState()));
 assert.equal(s.tutorialSession.endReason,'SKIPPED');assert.equal(s.tutorialSession.step,step);assert.equal(s.tutorialSession.active,false);assert.equal(s.status,'BATTLE');assert.equal(s.progress.battleNumber,1);
 assert.deepEqual(c.getProfile(),{...profile,guidedTutorialSkippedVersion:'0.2.1'});assert.equal(c.getProfile().guidedTutorialCompletedVersion,undefined);
 for(const stale of [cmd,{type:'TUTORIAL_GATE_ACK',attackId:before.tutorialSession.attackId,sessionId:before.tutorialSession.sessionId},{type:'FINISH_PRESENTATION',attackId:before.tutorialSession.attackId}]){assert.equal(c.dispatch(stale).ok,false);assert.deepEqual(c.getState(),s);}
 assert.equal(canSaveRun(s),true);assert.equal(validateRunState(s,registry),true);assert.deepEqual(new RunController({initialState:JSON.parse(JSON.stringify(s))}).getState(),s);
 assert.ok(c.dispatch({type:'NEW_RUN',config:{seed:'another'}}).ok);assert.equal(c.getState().tutorialSession,undefined);
});
test('0.5.1 skip older guided save preserves its original version, and does not overwrite unrelated profile settings',()=>{
 for(const version of ['0.2.1','0.3.0','0.4.0','0.5.0']){
  const c=start(newProfile('old')),s=c.getState();s.version=version;
  // Actual historical safe save structure is covered by prior guided tests; this adds the skip transaction.
  c._state=s;const p=c.getProfile();p.settings.muted=true;p.bestAttack=987;c.profile=p;
  assert.ok(c.dispatch(tutorialCommand(s,{type:'SKIP_TUTORIAL',confirmed:true,commandId:'legacy.skip'})).ok);
  assert.equal(c.getState().version,version);assert.equal(c.getState().combat.enemyState.hp,77);assert.equal(c.getProfile().bestAttack,987);assert.equal(c.getProfile().settings.muted,true);
 }
});
