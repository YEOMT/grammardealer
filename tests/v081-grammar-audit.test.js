import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registryForVersion} from '../src/data/language/index.js';
import {analyzeSentence,snapshotFromText} from '../src/engine/grammar/index.js';
import {relativeSealPair} from '../src/engine/dualRelativeSeal.js';
import {RunController} from '../src/game/runController.js';
import {validateRunState} from '../src/services/localStore.js';
import {assignedWaterways,assignSentence,checked} from './helpers/waterways-state.js';
const registry=registryForVersion('0.8.0');
const analyze=text=>analyzeSentence(snapshotFromText(text,{registry}),registry);
const read=name=>JSON.parse(fs.readFileSync(new URL('./fixtures/v081/'+name,import.meta.url)));
const cards=snapshot=>snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId}));
test('0.8.1 reported physical submission and text fixture reject the spurious personal-pronoun zero relative',()=>{
 const fixture=read('reported-relative-snapshot.json');assert.equal(fixture.beforeStatus,'VALID');assert.ok(fixture.beforeSealPair);
 for(const snapshot of [fixture.snapshot,snapshotFromText('they environments that will be thinking knew live',{registry})]){
  const a=analyzeSentence(snapshot,registry);assert.equal(a.status,'INVALID_CORE');assert.equal(a.mainFrameId,null);assert.deepEqual(a.grammarHits,[]);assert.equal(relativeSealPair(a,cards(snapshot)),null);
 }
});
for(const [valid,invalid]of [
 ['The people you know run.','I you know run.'],
 ['The friends I know live.','They I know live.'],
 ['A child who runs likes a book I made.','A child who runs likes a book I made it.'],
 ['The book I made is good.','The book I made is good runs.'],
 ['The child who likes a book I made runs.','The child who likes a book I made it runs.'],
 ['The room where I work is good.','The room where I like is good.'],
])test('0.8.1 structural minimal pair: '+valid,()=>{
 const a=analyze(valid);assert.equal(a.status,'VALID',valid);assert.equal(a.coverage.consumedCardIds.length,snapshotFromText(valid,{registry}).orderedTokens.length);
 const b=analyze(invalid);assert.equal(b.status,'INVALID_CORE',invalid);assert.equal(relativeSealPair(b,cards(snapshotFromText(invalid,{registry}))),null);
});
test('0.8.1 normal nested and separate dual relatives still release with one selected graph',()=>{
 for(const text of ['A child who runs likes a book I made.','The child who likes a book I made runs.','The child who runs is happy and the book I made is good.']){const snapshot=snapshotFromText(text,{registry}),a=analyzeSentence(snapshot,registry);assert.equal(a.status,'VALID');assert.ok(relativeSealPair(a,cards(snapshot)));const copy=structuredClone(a);copy.relativeClauses[1].nodeId=copy.relativeClauses[0].nodeId;assert.equal(relativeSealPair(copy,cards(snapshot)),null);}
});
test('0.8.1 nominal nonfinite clauses are not silently promoted to lexical relative antecedents',()=>{
 const text='they that were living environments will know think',snapshot=snapshotFromText(text,{registry});assert.equal(analyzeSentence(snapshot,registry,{historicalReceipt:true}).status,'VALID');const a=analyzeSentence(snapshot,registry);assert.equal(a.status,'INVALID_CORE');assert.equal(relativeSealPair(a,cards(snapshot)),null);
 for(const text of ['Living is good.','Living in the room I like is good.','The people that were living in rooms I know think.','The help I need is good.'])assert.equal(analyze(text).status,'VALID',text);
});
test('0.8.1 old already settled receipt loads unchanged; the same input cannot unlock a new submission',()=>{
 const {state,profile,resolution}=read('legacy08-reported-receipt.json');assert.equal(validateRunState(state,registry),true);const c=new RunController({initialState:state,profile});assert.deepEqual(c.getState(),state);assert.deepEqual(c.getProfile(),profile);
 const a=analyzeSentence(resolution.sentenceSnapshot,registry);assert.equal(a.status,'INVALID_CORE');assert.equal(relativeSealPair(a,resolution.cardScoringSnapshot),null);
 const forged=structuredClone(state);forged.combat.relativeSealUnlockReceipt.grammarPatchVersion='0.8.1';assert.throws(()=>validateRunState(forged,registry));
});
test('0.8.1 lexical more does not expand unsupported nominal comparison',()=>{
 const a=analyze('She is more than the problem.');assert.ok(!a.status.startsWith('VALID'));assert.ok(!a.grammarHits.some(h=>h.tag.startsWith('COMPARISON.')));
});
test('0.8.1 independently recreated original-main Ember release save retains its settled receipt',()=>{
 const {state,profile,sourceMain,oldReleased,currentLoad}=read('legacy08-ember-receipt.json');assert.equal(sourceMain,'587fa1b681c5fcd0ac8090111e7e9850dac95f08');assert.equal(oldReleased,true);assert.equal(currentLoad,'Invalid ember release receipt');assert.equal(validateRunState(state,registry),true);const c=new RunController({initialState:state,profile});assert.deepEqual(c.getState(),state);assert.deepEqual(c.getProfile(),profile);
 const forged=structuredClone(state),receipt=forged.stats.history.find(r=>r.attackId===forged.combat.enemyState.bossMechanic.releasedAttackId);receipt.analysis.grammarPatchVersion='0.8.1';assert.throws(()=>validateRunState(forged,registry));
});
test('0.8.1 new unlock receipts cannot opt into historical parsing by deleting the patch marker',()=>{
 const c=assignedWaterways({round:4});assignSentence(c,'A child who runs likes a book I made.');const r=checked(c,{type:'SUBMIT'});checked(c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});const s=c.getState();assert.equal(s.combat.relativeSealUnlockReceipt.grammarPatchVersion,'0.8.1');assert.equal(validateRunState(s,registry),true);delete s.combat.relativeSealUnlockReceipt.grammarPatchVersion;assert.throws(()=>validateRunState(s,registry));
});
test('0.8.1 reported malformed sentence settles once as a real zero-damage submission without unlocking',()=>{
 const c=assignedWaterways({round:4});const ids=assignSentence(c,'they environments that will be thinking knew live'),before=c.getState();
 const r=checked(c,{type:'SUBMIT'}),after=c.getState();assert.equal(r.resolution.status,'INVALID_CORE');assert.equal(r.resolution.actualHpLoss,0);assert.equal(after.combat.turnsRemaining,before.combat.turnsRemaining-1);assert.equal(after.combat.enemyState.bossMechanic.unlocked,false);assert.deepEqual(r.resolution.analysis.grammarHits,[]);
 for(const id of ids)assert.ok(after.combat.discardIds.includes(id));checked(c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});const settled=c.getState();c.dispatch({type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});assert.deepEqual(c.getState(),settled);
});
test('0.8.1 independently captured 306 pre-edit cases retain status, frame, hits, diagnostics and full coverage',()=>{
 const data=read('grammar-audit-baseline.json');
 for(const c of data.cases){const a=analyze(c.text);assert.deepEqual({status:a.status,frame:a.mainFrameId,tags:a.grammarHits.map(h=>h.tag),issues:a.issues.map(i=>i.code),covered:a.coverage.consumedCardIds},c.expected,c.file+': '+c.text);}
});
