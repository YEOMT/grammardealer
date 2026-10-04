import test from 'node:test';
import assert from 'node:assert/strict';
import { RunController } from './helpers/legacy-controller.js';
import { findPlayableSentences } from '../src/game/deck.js';
import { registry, formsForCard } from '../src/data/language/index.js';
import { resolveAttack } from '../src/engine/stage.js';
import { assertRunInvariants } from '../src/game/invariants.js';
import { canSaveRun, validateRunState, newProfile } from '../src/services/localStore.js';

function command(controller,cmd){const result=controller.dispatch(cmd);assert.equal(result.ok,true,result.message??JSON.stringify(cmd));return result;}
function fresh(seed='qa-behavior',profile=newProfile('QA')){
  const controller=new RunController({profile});
  command(controller,{type:'NEW_RUN',config:{seed,vocabularyMode:'BEGINNER',character:'traveler',difficulty:1},profile});
  command(controller,{type:'START_BATTLE'});if(controller.getState().tutorial.visible)command(controller,{type:'ACK_ATTACK_GUIDE'});return controller;
}
function prepared({frame='frame.sv',turns=6,hp=70,options={}}={}){
  const original=fresh();const state=original.getState();
  const path=findPlayableSentences(state.activeCardIds,state.cardInstances,{perFrame:2,maxChecks:4000}).find(p=>p.frameId===frame);
  assert.ok(path,`Real physical deck has ${frame} path`);
  const used=new Set(path.slots.map(s=>s.cardInstanceId));const remaining=state.activeCardIds.filter(id=>!used.has(id));
  state.combat.sentenceSlots=structuredClone(path.slots);state.combat.handIds=remaining.slice(0,6);state.combat.drawIds=remaining.slice(6);state.combat.discardIds=[];
  state.combat.turnsRemaining=turns;state.combat.turnIndex=7-turns;state.combat.actionSequence=6-turns;state.combat.battleDirty=true;state.combat.enemyState.hp=hp;
  return new RunController({initialState:state,profile:original.getProfile(),...options});
}
function resources(state){return{active:state.activeCardIds,cards:state.cardInstances,combat:state.combat,economy:state.economy,rng:state.rng,stats:state.stats};}
function finish(controller,result){command(controller,{type:'FINISH_PRESENTATION',attackId:result.resolution.attackId});}

test('D14 full hand and full sentence recover by physical-card swap without breaking either limit',()=>{
  const source=fresh(),state=source.getState(),ids=state.activeCardIds;
  state.combat.handIds=ids.slice(0,10);state.combat.sentenceSlots=ids.slice(10,26).map(cardInstanceId=>({cardInstanceId,selection:null}));state.combat.drawIds=ids.slice(26);state.combat.discardIds=[];state.combat.battleDirty=true;
  const controller=new RunController({initialState:state});const before=controller.getState();
  assert.equal(controller.dispatch({type:'RETURN_CARD',cardId:ids[10]}).ok,false);assert.deepEqual(controller.getState(),before);
  command(controller,{type:'SWAP_CARDS',handCardId:ids[0],sentenceCardId:ids[10]});
  const after=controller.getState();assert.equal(after.combat.handIds.length,10);assert.equal(after.combat.sentenceSlots.length,16);assert.equal(after.combat.sentenceSlots[0].cardInstanceId,ids[0]);assert.equal(after.combat.handIds[0],ids[10]);assertRunInvariants(after,registry);
});

test('D15 prepare preserves the assembled sentence and spends one turn before drawing up to three',()=>{
  const controller=prepared();const before=controller.getState();command(controller,{type:'PREPARE'});const after=controller.getState();
  assert.deepEqual(after.combat.sentenceSlots,before.combat.sentenceSlots);assert.equal(after.combat.turnsRemaining,before.combat.turnsRemaining-1);assert.equal(after.combat.handIds.length,before.combat.handIds.length+3);assertRunInvariants(after,registry);
});

test('D16 real normal attack discards only submitted cards and preserves unused hand until turn draw',()=>{
  const controller=prepared(),before=controller.getState();const result=command(controller,{type:'SUBMIT',commandId:'one-normal'}),after=controller.getState();
  assert.equal(after.combat.sentenceSlots.length,0);assert.deepEqual(after.combat.handIds,before.combat.handIds);
  assert.deepEqual(new Set(after.combat.discardIds),new Set(before.combat.sentenceSlots.map(s=>s.cardInstanceId)));
  assert.equal(after.combat.phase,'PRESENTING');assert.equal(after.combat.turnsRemaining,5);assert.equal(result.resolution.finalPower,50);assertRunInvariants(after,registry);
});

test('C01 sixth-turn kill wins before exhausted-turn defeat and does not draw a new hand',()=>{
  const controller=prepared({turns:1,hp:1});const before=controller.getState();const result=command(controller,{type:'SUBMIT'});finish(controller,result);const after=controller.getState();
  assert.equal(after.status,'REWARD');assert.equal(after.combat.enemyState.hp,0);assert.equal(after.combat.turnsRemaining,0);assert.deepEqual(after.combat.handIds,before.combat.handIds);assert.equal(after.economy.gold,2);
});

test('C02 sixth-turn surviving enemy defeats without turn-seven draw',()=>{
  const controller=prepared({turns:1,hp:70}),before=controller.getState(),result=command(controller,{type:'SUBMIT'});finish(controller,result);const after=controller.getState();
  assert.equal(after.status,'DEFEAT');assert.equal(after.combat.enemyState.hp,20);assert.equal(after.combat.turnsRemaining,0);assert.deepEqual(after.combat.handIds,before.combat.handIds);assert.equal(after.economy.gold,0);
});

test('C03 last prepare requires confirmation and then settles defeat once',()=>{
  const controller=prepared({turns:1}),before=controller.getState();const rejected=controller.dispatch({type:'PREPARE'});
  assert.equal(rejected.needsConfirmation,true);assert.deepEqual(controller.getState(),before);
  command(controller,{type:'PREPARE',confirmed:true,commandId:'last-prepare'});const after=controller.getState();assert.equal(after.status,'DEFEAT');assert.equal(after.combat.turnsRemaining,0);assert.deepEqual(after.combat.handIds,before.combat.handIds);
  assert.equal(controller.dispatch({type:'PREPARE',confirmed:true,commandId:'last-prepare'}).ok,false);assert.deepEqual(controller.getState(),after);
});

test('C04 actual missing-verb submission preserves all resources and returns to editing',()=>{
  const source=prepared(),state=source.getState();const moved=state.combat.sentenceSlots.splice(1);state.combat.drawIds.push(...moved.map(s=>s.cardInstanceId));
  const controller=new RunController({initialState:state}),before=controller.getState();const result=controller.dispatch({type:'SUBMIT'});
  assert.equal(result.ok,false);assert.equal(result.analysis.status,'INVALID_CORE');assert.deepEqual(resources(controller.getState()),resources(before));assert.equal(controller.getState().combat.phase,'EDIT');
});

test('C05 actual agreement error consumes cards and turn with no perfect bonus',()=>{
  const source=prepared(),state=source.getState();const verb=state.combat.sentenceSlots[1];
  const forms=formsForCard(state.cardInstances[verb.cardInstanceId]);const selected=forms.find(f=>f.id!==verb.selection.formId);assert.ok(selected);verb.selection={formId:selected.id};
  const controller=new RunController({initialState:state});const result=command(controller,{type:'SUBMIT'});
  assert.equal(result.analysis.status,'VALID_WITH_ISSUES');assert.equal(controller.getState().combat.turnsRemaining,5);assert.equal(controller.getState().combat.sentenceSlots.length,0);assert.ok(result.resolution.finalPower<50);assert.equal(result.resolution.scoreTimeline.some(e=>e.phase==='COMPLETE_BONUS'),false);
});

test('C06 unsupported-analysis outcome is resource-neutral and is never treated as a wrong attack',()=>{
  const controller=prepared({options:{analyzer:()=>({status:'UNSUPPORTED',messageKo:'이 구조는 0.1에서 아직 판정하지 않습니다.'})}}),before=controller.getState();const result=controller.dispatch({type:'SUBMIT'});
  assert.equal(result.ok,false);assert.equal(result.analysis.status,'UNSUPPORTED');assert.deepEqual(resources(controller.getState()),resources(before));
});

test('C07 analyzer exception produces ENGINE_ERROR and preserves all resources',()=>{
  const controller=prepared({options:{analyzer:()=>{throw Error('Injected parser fault');}}}),before=controller.getState();const result=controller.dispatch({type:'SUBMIT'});
  assert.equal(result.ok,false);assert.equal(result.analysis.status,'ENGINE_ERROR');assert.ok(result.analysis.diagnostics.errorId);assert.deepEqual(resources(controller.getState()),resources(before));
});

test('C08 rapid repeated submit and completion apply damage, turn and settlement only once',()=>{
  const controller=prepared({hp:1}),result=command(controller,{type:'SUBMIT',commandId:'double'}),committed=controller.getState();
  assert.equal(controller.dispatch({type:'SUBMIT',commandId:'double'}).ok,false);assert.deepEqual(controller.getState(),committed);finish(controller,result);const done=controller.getState();
  assert.equal(controller.dispatch({type:'FINISH_PRESENTATION',attackId:result.resolution.attackId}).ok,false);assert.deepEqual(controller.getState(),done);assert.equal(done.stats.attacks,1);assert.equal(done.economy.gold,7);assert.equal(done.settlementIds.length,1);
});

test('C09 old revision and battle results are discarded with no resource change',()=>{
  for(const stale of ['revision','battle']){
    const controller=prepared({options:{attackResolver:args=>({...resolveAttack(args),...(stale==='revision'?{expectedRevision:args.expectedRevision-1}:{battleId:'old.battle'})})}}),before=controller.getState();
    assert.equal(controller.dispatch({type:'SUBMIT'}).ok,false);assert.deepEqual(resources(controller.getState()),resources(before));
  }
});

test('C10 fast-forward after a failed presentation settles the committed attack once',()=>{
  const controller=prepared({hp:1}),result=command(controller,{type:'SUBMIT'}),committed=controller.getState();
  try{throw Error('Injected presentation cancellation');}catch{finish(controller,result);}
  const after=controller.getState();assert.equal(after.combat.enemyState.hp,committed.combat.enemyState.hp);assert.equal(after.stats.attacks,1);assert.equal(after.economy.gold,7);assert.equal(after.status,'REWARD');
});

test('C14 synthetic zero-damage future rule consumes a valid submitted attack without exposing a game mode',()=>{
  const controller=prepared({options:{attackResolver:args=>resolveAttack({...args,syntheticBossFixture:'IMMUNE_ZERO_DAMAGE_TEST_ONLY'})}}),before=controller.getState();const result=command(controller,{type:'SUBMIT'});
  assert.equal(result.resolution.finalPower,0);assert.equal(result.resolution.actualHpLoss,0);assert.equal(controller.getState().combat.enemyState.hp,before.combat.enemyState.hp);assert.equal(controller.getState().combat.turnsRemaining,5);assert.equal(controller.getState().combat.sentenceSlots.length,0);
});

test('R11 reordering operational runes never regrants cards or exchanges in the current combat',()=>{
  const source=fresh(),state=source.getState();state.runes={slotLimit:3,orderedInstanceIds:['qa.opening','qa.exchange'],instances:{'qa.opening':{instanceId:'qa.opening',runeId:'rune.openingHand',level:1},'qa.exchange':{instanceId:'qa.exchange',runeId:'rune.discards',level:1}}};
  // Legitimate: runes may have been gained after prior encounter entry. Snapshot is immutable until next battle.
  const controller=new RunController({initialState:state}),before=controller.getState();command(controller,{type:'REORDER_RUNES',instanceIds:['qa.exchange','qa.opening']});const after=controller.getState();
  assert.deepEqual(after.combat.rulesSnapshot,before.combat.rulesSnapshot);assert.deepEqual(after.combat.handIds,before.combat.handIds);assert.equal(after.combat.exchangesRemaining,before.combat.exchangesRemaining);assert.deepEqual(after.rng,before.rng);
});

test('P01 undo restores only edits and never clears the battle-dirty save lock',()=>{
  const controller=fresh(),before=controller.getState();assert.equal(canSaveRun(before),true);command(controller,{type:'ADD_CARD',cardId:before.combat.handIds[0]});command(controller,{type:'UNDO'});const after=controller.getState();
  assert.deepEqual(after.combat.handIds,before.combat.handIds);assert.deepEqual(after.combat.sentenceSlots,[]);assert.equal(after.combat.battleDirty,true);assert.equal(canSaveRun(after),false);assert.deepEqual(after.rng,before.rng);
});

test('form change stays with a reordered sentence card but resets after hand return',()=>{
  const controller=prepared(),before=controller.getState(),slot=before.combat.sentenceSlots[1];command(controller,{type:'REORDER_SENTENCE',cardId:slot.cardInstanceId,index:0});assert.deepEqual(controller.getState().combat.sentenceSlots[0].selection,slot.selection);
  command(controller,{type:'RETURN_CARD',cardId:slot.cardInstanceId});command(controller,{type:'ADD_CARD',cardId:slot.cardInstanceId});assert.equal(controller.getState().combat.sentenceSlots.at(-1).selection,null);
});

test('invalid edit, duplicate exchange IDs and state reads leave RNG and physical cards unchanged',()=>{
  const controller=fresh(),before=controller.getState(),id=before.combat.handIds[0];
  for(const cmd of [{type:'ADD_CARD',cardId:'foreign'},{type:'EXCHANGE',cardIds:[id,id]},{type:'EXCHANGE',cardIds:[]},{type:'REORDER_SENTENCE',cardId:id,index:99}]){assert.equal(controller.dispatch(cmd).ok,false);assert.deepEqual(controller.getState(),before);}
  const copy=controller.getState();copy.combat.handIds=[];assert.deepEqual(controller.getState(),before);validateRunState(controller.getState(),registry);
});
