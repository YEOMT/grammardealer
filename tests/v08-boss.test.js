import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {registryForVersion} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {resolveDualRelativeSeal,relativeSealPair,validateRelativeSealReceipt} from '../src/engine/dualRelativeSeal.js';
import {STAGE8} from '../src/data/stage8.js';
import {assignedWaterways,assignSentence,checked} from './helpers/waterways-state.js';
import {RunController} from '../src/game/runController.js';
import {validateRunState} from '../src/services/localStore.js';
const registry=registryForVersion('0.8.0'),dual='A child who runs likes a book I made.';
function material(text){const snapshot=snapshotFromText(text,{registry});return {analysis:analyzeSentence(snapshot,registry),cards:snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId}))};}
const fresh=()=>structuredClone(STAGE8.rounds[4]);
function textFor(c){const x=c.input;if(c.id==='B011')return 'A child who run likes a book I made.';if(c.id==='B010')return 'A child who runs like a book I made.';if(c.id==='B014')return 'This is the school where I work.';if(c.id==='B015')return 'Who runs?';if(c.id==='B021')return 'The child who likes a book I made runs.';if(c.id==='B022')return 'The child who runs is happy and the book I made is good.';if(c.id==='B024')return 'The book which was made helps a child I like.';if(x.analysisStatus==='INVALID_CORE')return 'The child who runs.';const roles=x.eligibleRolesInThisAttack;if(roles.join()==='SUBJECT,SUBJECT')return 'A child who runs likes a dog which plays.';if(roles.join()==='OBJECT,OBJECT')return 'A child I like shows a book you made.';if(x.qualifyingPair)return dual;if(roles.includes('SUBJECT'))return 'The child who runs is happy.';if(roles.includes('OBJECT'))return 'The book I made is good.';return 'I run.';}
for(const c of JSON.parse(fs.readFileSync(new URL('./fixtures/v08/05_Boss_Cases_0.8.json',import.meta.url))).cases)test(`0.8 synthetic boss arithmetic ${c.id}`,()=>{
 const x=c.input,enemy=fresh(),m=material(textFor(c));enemy.hp=x.hpBefore;
 if(x.unlockedBefore){const d=material(dual);enemy.bossMechanic=resolveDualRelativeSeal(d.analysis,700,fresh(),{attackId:'earlier',submittedCards:d.cards}).bossStateAfter;}
 const attackId=x.replayedAttackId?'earlier':'current';
 const r=resolveDualRelativeSeal(m.analysis,x.powerAfterRegion,enemy,{attackId,submittedCards:m.cards});
 assert.deepEqual({hpAfter:r.enemyHpAfter,unlockedAfter:r.bossStateAfter.unlocked,actualHpLoss:r.actualHpLoss,preventedDamage:r.preventedDamage,overkill:r.overkill,replayed:r.replayed},c.expected);
});
test('0.8 pair needs distinct selected finite relative nodes and physical cards, never merged candidates',()=>{
 const m=material(dual);assert.ok(relativeSealPair(m.analysis,m.cards));assert.equal(relativeSealPair(m.analysis,m.cards.slice(1)),null);
 const bad=structuredClone(m.analysis);bad.relativeClauses[1].nodeId=bad.relativeClauses[0].nodeId;assert.equal(relativeSealPair(bad,m.cards),null);
 const cross=structuredClone(m.analysis);cross.relativeClauses[1].rootSentenceId='another';assert.equal(relativeSealPair(cross,m.cards),null);
 for(const text of ['Who do you like?','The book made today is good.','This is the school where I work.']){const q=material(text);assert.equal(relativeSealPair(q.analysis,q.cards),null);}
});
test('0.8 controller commits unlock once, persists a replayable witness independently of rolling history',()=>{
 const c=assignedWaterways({round:4});assignSentence(c,dual);const before=c.getState();assert.equal(c.dispatch({type:'SUBMIT',expectedRevision:before.revision-1}).ok,false);assert.deepEqual(c.getState(),before);
 const r=checked(c,{type:'SUBMIT'});assert.equal(r.resolution.bossStateAfter.unlocked,true);assert.ok(r.resolution.enemyHpAfter>0);checked(c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});
 const s=c.getState();assert.equal(validateRunState(s,registry),true);assert.ok(s.combat.relativeSealUnlockReceipt);assert.deepEqual(new RunController({initialState:JSON.parse(JSON.stringify(s)),profile:c.getProfile()}).getState(),s);
 const saved=c.getState();c.dispatch({type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});assert.deepEqual(c.getState(),saved);
 const independent=structuredClone(s);independent.stats.history=[];assert.equal(validateRelativeSealReceipt(independent),true);
 for(const mutate of [x=>x.combat.relativeSealUnlockReceipt.battleId='battle.07.05',x=>x.combat.relativeSealUnlockReceipt.attackId='other',x=>x.combat.relativeSealUnlockReceipt.preBossScore=0,x=>x.combat.relativeSealUnlockReceipt.cardScoringSnapshot[0].instanceId='fake',x=>x.combat.enemyState.bossMechanic.unlockWitness.objectRelativeId=x.combat.enemyState.bossMechanic.unlockWitness.subjectRelativeId,x=>x.combat.enemyState.bossMechanic.unlockWitness.subjectEvidenceDigest='forged']){const x=structuredClone(s);mutate(x);assert.throws(()=>validateRunState(x,registry));}
});
test('0.8 different attacks cannot accumulate; locked HP1 is BOSS_BLOCKED without overkill',()=>{
 const c=assignedWaterways({round:4});c._state.combat.enemyState.hp=1;
 for(const text of ['The child who runs is happy.','The book I made is good.']){assignSentence(c,text);const r=checked(c,{type:'SUBMIT'});assert.equal(r.resolution.enemyHpAfter,1);assert.equal(r.resolution.actualHpLoss,0);assert.equal(r.resolution.overkill,0);assert.equal(r.resolution.zeroReason,'BOSS_BLOCKED');checked(c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});assert.equal(c.getState().combat.enemyState.bossMechanic.unlocked,false);validateRunState(c.getState(),registry);}
 assignSentence(c,dual);const r=checked(c,{type:'SUBMIT'});assert.equal(r.resolution.enemyHpAfter,0);assert.ok(r.resolution.overkill>0);checked(c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});assert.equal(c.getState().status,'REWARD');validateRunState(c.getState(),registry);
 const profile=c.getProfile();assert.equal(profile.highestCompletedStage,8);assert.equal(profile.storyClearCount,0);assert.equal(profile.stage8CompletedRunIds.length,1);
 checked(c,{type:'CHOOSE_REWARD',offerId:c.getState().reward.offerId,choiceId:'SKIP'});assert.equal(c.getState().progress.contentBoundary,'STAGE8_END');validateRunState(c.getState(),registry);
 const end=c.getState();c.dispatch({type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});assert.deepEqual(c.getState(),end);assert.deepEqual(c.getProfile(),profile);
});

for(const [choice,text]of [['WHO','A child who runs likes a book I made.'],['WHICH','The book which was made helps a child I like.'],['NONE','A child that runs likes a book I made.']])test(`0.8 assigned Controller ${choice} material strategy unlocks without a second marker`,()=>{const c=assignedWaterways({round:4,choice});assignSentence(c,text);const r=checked(c,{type:'SUBMIT'});assert.equal(r.resolution.bossStateAfter.unlocked,true);checked(c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});assert.equal(validateRunState(c.getState(),registry),true);});

test('0.8 B005 actual final reward removal keeps immutable unlocking card snapshot valid',()=>{
 let executed=false;
 for(let seed=0;seed<40&&!executed;seed++){
  const c=assignedWaterways({round:4,seed:'waterways.removal.'+seed});c._state.combat.enemyState.hp=1;const ids=assignSentence(c,dual);const r=checked(c,{type:'SUBMIT'});checked(c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});const s=c.getState(),offer=s.reward,remove=offer.choices.find(x=>x.kind==='SERVICE'&&x.serviceKind==='REMOVE');if(!remove)continue;
  const target=ids.find(id=>remove.targetCardIds.includes(id));assert.ok(target);const receipt=structuredClone(s.combat.relativeSealUnlockReceipt);checked(c,{type:'CHOOSE_REWARD',offerId:offer.offerId,choiceId:remove.choiceId,targetCardInstanceId:target,confirmRemoval:true});const end=c.getState();assert.equal(end.status,'CONTENT_COMPLETE');assert.ok(!end.activeCardIds.includes(target));assert.equal(end.cardInstances[target],undefined);assert.deepEqual(end.combat.relativeSealUnlockReceipt,receipt);assert.equal(validateRunState(end,registry),true);assert.deepEqual(new RunController({initialState:JSON.parse(JSON.stringify(end)),profile:c.getProfile()}).getState(),end);executed=true;
 }
 assert.equal(executed,true,'A real generated REMOVE reward must be exercised');
});
