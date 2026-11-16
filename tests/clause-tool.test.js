import test from 'node:test';
import assert from 'node:assert/strict';
import {RunController} from '../src/game/runController.js';
import {RunController as Legacy} from './helpers/legacy-0121-controller.js';
import {assignedCorridor,checked,assignPiles} from './helpers/corridor-state.js';
import {newProfile,canSaveRun,validateRunState,applyProfileEvent,profileRecordsForVersion} from '../src/services/localStore.js';
import {registryForVersion,createSentenceSnapshot} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {formatSentence} from '../src/punctuation.js';
import {assertRunInvariants} from '../src/game/invariants.js';
import {buildBestAttackSnapshot,rulesetForVersion} from '../src/services/clearLeaderboard.js';

function battle({round=0,sentences=['Seeing you, I smiled.'],version='0.14.0'}={}){
  return assignedCorridor({version,round,sentences,seed:'comma.tools'});
}
function place(c,slots,gap){assignPiles(c,{sentence:slots});if(gap!==undefined)checked(c,{type:'SET_COMMA',afterCardInstanceId:gap===0?null:slots[gap-1].cardInstanceId});}

test('comma unlocks only new battle15; tool and edit consume no card, turn, exchange or RNG',()=>{
  const {c}=battle();let s=c.getState();
  for(const [number,available]of [[14,false],[15,true],[16,true]]){
    s=c.getState();for(const id of s.combat.temporaryCardIds??[])delete s.cardInstances[id];
    s.progress={stageId:'stage.04',roundIndex:number-13,battleNumber:number,contentBoundary:null};s.combat=null;c._beginBattle(s);c._state=s;
    assert.equal(s.combat.commaUnlocked,available);
    assert.equal(c.dispatch({type:'SET_COMMA',afterCardInstanceId:null}).ok,false);
  }
  const id=c.getState().combat.handIds.find(id=>!c.getState().cardInstances[id].cardDefId.startsWith('card.operation'));
  checked(c,{type:'ADD_CARD',cardId:id});const before=c.getState();
  checked(c,{type:'SET_COMMA',afterCardInstanceId:id});checked(c,{type:'REMOVE_COMMA'});
  const after=c.getState();
  for(const key of ['activeCardIds','cardInstances','rng'])assert.deepEqual(after[key],before[key]);
  for(const key of ['handIds','drawIds','discardIds','sentenceSlots','turnsRemaining','exchangesRemaining'])assert.deepEqual(after.combat[key],before.combat[key]);
  assertRunInvariants(after,registryForVersion(after.version));
});

test('comma follows anchor reorder, same-slot swap, return, partial clear, undo and prepare',()=>{
  const {c,slots}=battle();place(c,slots[0],2);
  const anchor=slots[0][1].cardInstanceId;
  checked(c,{type:'REORDER_SENTENCE',cardId:anchor,index:4});
  assert.equal(c.getState().combat.punctuation.comma.afterCardInstanceId,anchor);
  let s=c.getState(),replacement=s.combat.drawIds.find(id=>!s.cardInstances[id].cardDefId.startsWith('card.operation'));
  s.combat.drawIds.splice(s.combat.drawIds.indexOf(replacement),1);s.combat.handIds.push(replacement);c._state=s;
  checked(c,{type:'SWAP_CARDS',sentenceCardId:anchor,handCardId:replacement});
  assert.equal(c.getState().combat.punctuation.comma.afterCardInstanceId,replacement);
  checked(c,{type:'RETURN_CARD',cardId:replacement});assert.equal(c.getState().combat.punctuation.comma,null);
  checked(c,{type:'UNDO'});assert.equal(c.getState().combat.punctuation.comma.afterCardInstanceId,replacement);
  checked(c,{type:'CLEAR_SENTENCE'});assert.equal(c.getState().combat.punctuation.comma,null);
  checked(c,{type:'UNDO'});checked(c,{type:'PREPARE'});assert.equal(c.getState().combat.punctuation.comma,null);
});

test('24 real word tokens plus separate comma and malformed punctuation rejection',()=>{
  const r=registryForVersion('0.14.0'),source=snapshotFromText('I smile.',{registry:r});
  const cards={},slots=Array.from({length:24},(_,i)=>{const t=source.orderedTokens[i%2],id='copy.'+i;cards[id]={instanceId:id,cardDefId:t.cardDefId,polishLevel:0,specialEffectId:null};return {cardInstanceId:id,selection:t.selectionId};});
  const make=punctuation=>createSentenceSnapshot(slots,cards,{languageVersion:'0.14.0',punctuation});
  const a=make([{kind:'COMMA',gapIndex:8}]),b=make([{kind:'COMMA',gapIndex:12}]);
  assert.equal(a.schemaVersion,2);assert.equal(a.orderedTokens.length,24);assert.notEqual(analyzeSentence(a,r).inputFingerprint,analyzeSentence(b,r).inputFingerprint);
  for(const p of [[{kind:'COMMA',gapIndex:25}],[{kind:'COMMA',gapIndex:1},{kind:'COMMA',gapIndex:2}],[{kind:'WORD',gapIndex:2}]])assert.throws(()=>make(p));
});

test('new edit save retains comma anchor and snapshot; old save stays byte-equivalent',()=>{
  const {c,slots}=battle();place(c,slots[0],2);const s=c.getState();
  assert.equal(canSaveRun(s),true);validateRunState(s,registryForVersion(s.version));
  const restored=new RunController({initialState:JSON.parse(JSON.stringify(s))});assert.deepEqual(restored.getState(),s);
  const invalid=structuredClone(s);invalid.combat.punctuation.comma.afterCardInstanceId='absent';assert.throws(()=>validateRunState(invalid,registryForVersion(s.version)));
  const legacy=new Legacy({profile:{...newProfile('legacy'),guidedTutorialCompletedVersion:'0.2.1'}});
  checked(legacy,{type:'NEW_RUN',config:{seed:'legacy.comma'}});checked(legacy,{type:'START_BATTLE'});
  const old=legacy.getState();assert.equal(old.version,'0.12.1');assert.equal(old.combat.punctuation,undefined);
  assert.deepEqual(new RunController({initialState:JSON.parse(JSON.stringify(old))}).getState(),old);
  assert.equal(legacy.dispatch({type:'SET_COMMA',afterCardInstanceId:null}).ok,false);
});

test('committed real attack clears marker once, preserves immutable punctuation and separates records',()=>{
  const {c,slots}=battle();place(c,slots[0],2);const before=c.getState();
  const result=checked(c,{type:'SUBMIT',commandId:'comma.submit'}),r=result.resolution;
  assert.equal(r.status,'VALID');assert.equal(formatSentence(r.sentenceSnapshot),'seeing you, I smiled');
  assert.equal(r.sentenceSnapshot.orderedTokens.length,4);assert.equal(r.cardScoringSnapshot.length,4);
  assert.equal(c.getState().combat.punctuation.comma,null);assert.equal(c.getState().combat.turnsRemaining,before.combat.turnsRemaining-1);
  const once=c.getState();assert.equal(c.dispatch({type:'SUBMIT',commandId:'comma.submit'}).ok,false);assert.deepEqual(c.getState(),once);
  const profile={...newProfile('records'),bestAttack:123,grammarRecords:{old:{bestPower:123}},nominalRecords:{THAT:{bestPower:100}}};
  const updated=applyProfileEvent(profile,{type:'ATTACK',resolution:r});
  assert.equal(updated.bestAttack,123);assert.deepEqual(updated.grammarRecords,profile.grammarRecords);
  assert.equal(profileRecordsForVersion(updated,'0.14.0').bestAttack,r.finalPower);
  assert.deepEqual(profileRecordsForVersion(updated,'0.14.0').nominalRecords,{});
  assert.deepEqual(updated.nominalRecords,profile.nominalRecords);
  const best=buildBestAttackSnapshot({run:before,resolution:r});assert.equal(best.rulesetId,rulesetForVersion('0.14.0'));assert.equal(best.sentenceText,'seeing you, I smiled');assert.deepEqual(best.punctuation,[{kind:'COMMA',gapIndex:2}]);
});

test('engine error and unsupported preserve editor; invalid core commits and clears comma',()=>{
  for(const status of ['ENGINE_ERROR','UNSUPPORTED']){
    const {c,slots}=battle();place(c,slots[0],2);c.analyzer=()=>({status});const s=c.getState();
    assert.equal(c.dispatch({type:'SUBMIT'}).ok,false);assert.deepEqual(c.getState(),s);
  }
  const {c,slots}=battle({sentences:['Seeing you, I happy.']});place(c,slots[0],2);
  const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.status,'INVALID_CORE');assert.equal(r.finalPower,0);assert.equal(c.getState().combat.punctuation.comma,null);
});
