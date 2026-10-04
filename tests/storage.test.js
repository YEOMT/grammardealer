import test from 'node:test';
import assert from 'node:assert/strict';
import { newProfile, applyProfileEvent, canSaveRun, validateRunState, LocalStore } from '../src/services/localStore.js';
import { RunController } from '../src/game/runController.js';
import { registry } from '../src/data/language/index.js';

// Start through the real controller, then use its actual physical deck checkpoint.
function checkpoint() {
  const controller=new RunController();
  const start=controller.dispatch({type:'NEW_RUN',config:{seed:'qa-storage',vocabularyMode:'BEGINNER',character:'traveler',difficulty:1}});
  assert.equal(start.ok,true,start.message);
  const battle=controller.dispatch({type:'START_BATTLE'});assert.equal(battle.ok,true,battle.message);
  return controller.getState();
}

class MemoryBoundaryStore extends LocalStore {
  constructor(){super({registry});this.rows=new Map();}
  async _transaction(_store, _mode, operation){
    const request = operation({
      put:row=>{this.rows.set(row.key,structuredClone(row));return {result:row.key};},
      get:key=>({result:structuredClone(this.rows.get(key))}),
      getAll:()=>({result:[...this.rows.values()].map(x=>structuredClone(x))}),
    });
    return structuredClone(request.result);
  }
}

test('P01 three manual slots accept only safe checkpoints; dirty/undo cannot reopen saving',async()=>{
  const run=checkpoint(),store=new MemoryBoundaryStore();
  assert.equal(validateRunState(run,registry),true);
  assert.equal(canSaveRun(run),true);
  for(const slot of [1,2,3])await store.saveRun('profile',slot,run);
  for(const slot of [0,4])await assert.rejects(store.saveRun('profile',slot,run));
  const dirty=structuredClone(run);dirty.combat.battleDirty=true;
  assert.equal(canSaveRun(dirty),false);
  await assert.rejects(store.saveRun('profile',1,dirty));
  for(const phase of ['EXCHANGE_SELECT','RESOLVING','PRESENTING']){
    const busy=structuredClone(run);busy.combat.phase=phase;assert.equal(canSaveRun(busy),false);
  }
  for(const status of ['REWARD','BETWEEN_BATTLES','CONTENT_COMPLETE'])assert.equal(canSaveRun({...run,status}),true);
  assert.equal(canSaveRun({...run,status:'DEFEAT'}),false);
});

test('P02 P03 saved piles, forms, resources, RNG and frozen rewards round-trip without rerolls',async()=>{
  const store=new MemoryBoundaryStore(),run=checkpoint();
  run.rng.reward.cursor=27;
  await store.saveRun('profile',1,run);
  const restored=await store.loadRun('profile',1);assert.deepEqual(restored,run);
  restored.economy.gold=999;assert.equal((await store.loadRun('profile',1)).economy.gold,0);
  const reward={...structuredClone(run),status:'REWARD',reward:{offerId:'qa.offer',battleNumber:1,skipGold:2,type:'RUNE',choices:[{choiceId:'qa.choice',runeId:'rune.short'}],resolved:false}};
  await store.saveRun('profile',2,reward);assert.deepEqual(await store.loadRun('profile',2),reward);
});

test('P04 restoring an old slot preserves its own unlock baseline',async()=>{
  const store=new MemoryBoundaryStore(),run=checkpoint();
  run.eligibility={runStartUnlockBaseline:['rune.short'],runOwnUnlocks:[]};
  await store.saveRun('profile',1,run);
  const later=newProfile('QA');later.unlocks=['rune.relative'];
  assert.deepEqual((await store.loadRun('profile',1)).eligibility,run.eligibility);
  assert.equal((await store.loadRun('profile',1)).eligibility.runStartUnlockBaseline.includes('rune.relative'),false);
});

test('replaying an attack updates local grammar accomplishments only once',()=>{
  const p=newProfile('QA');
  const attack={attackId:'qa.attack',finalPower:93,actualHpLoss:70,
    sentenceSnapshot:{orderedTokens:[{surface:'I'},{surface:'like'},{surface:'dogs'}]},
    analysis:{grammarHits:[{tag:'FRAME.SVO'},{tag:'FRAME.SVO'}]}};
  const once=applyProfileEvent(p,{type:'ATTACK',resolution:attack});
  const twice=applyProfileEvent(once,{type:'ATTACK',resolution:attack});
  assert.deepEqual(once,twice);assert.equal(twice.grammarRecords['FRAME.SVO'].count,1);
  assert.equal(twice.totalActualDamage,70);assert.equal(twice.bestAttack,93);
  assert.deepEqual(p.qualifiedRunIds,[]);
});

test('P07 IndexedDB request success is not reported as transaction success; abort preserves prior record',async()=>{
  const store=new LocalStore({registry});
  const previous={version:'previous-record'};const rows=new Map([['profile:1',previous]]);
  let transaction,request,pending;
  store.db={transaction(){
    request={};transaction={error:null,objectStore(){return{put(record){pending=record;return request;}}},abort(){transaction.onabort?.();}};
    return transaction;
  }};
  const run=checkpoint(),before=structuredClone(run);
  let resolved=false,rejected=false;
  const saving=store.saveRun('profile',1,run).then(()=>{resolved=true;},()=>{rejected=true;});
  request.result=pending.key;request.onsuccess();
  await Promise.resolve();await Promise.resolve();
  assert.equal(resolved,false);assert.equal(rejected,false);
  transaction.error=new Error('Injected quota failure');transaction.onabort();
  await saving;
  assert.equal(resolved,false);assert.equal(rejected,true);
  assert.equal(rows.get('profile:1'),previous);assert.deepEqual(run,before);
});

test('P08 malformed or future saves are rejected without deleting their old slot',async()=>{
  const valid=checkpoint();
  const corruptors=[
    run=>{run.version='99.0.0';},
    run=>{run.activeCardIds.push(run.activeCardIds[0]);},
    run=>{run.cardInstances[run.activeCardIds[0]].cardDefId='foreign.card';},
    run=>{run.combat.drawIds.push(run.combat.handIds[0]);},
    run=>{run.economy.gold=-1;},
    run=>{run.economy.gold=NaN;},
    run=>{run.cardInstances[run.activeCardIds[0]].polishLevel=4;},
    run=>{run.rng.deck.cursor=-1;},
  ];
  const store=new MemoryBoundaryStore();await store.saveRun('profile',1,valid);
  for(const corrupt of corruptors){const run=structuredClone(valid);corrupt(run);assert.throws(()=>validateRunState(run,registry));await assert.rejects(store.saveRun('profile',1,run));assert.deepEqual(await store.loadRun('profile',1),valid);}
  for(const corrupt of corruptors){const run=structuredClone(valid);corrupt(run);const row={key:'profile:2',slot:2,playerId:'profile',version:'0.1.0',run};store.rows.set(row.key,structuredClone(row));await assert.rejects(store.loadRun('profile',2));assert.deepEqual(store.rows.get(row.key),row);}
  const future={key:'profile:3',slot:3,playerId:'profile',version:'99.0.0',run:valid};store.rows.set(future.key,structuredClone(future));await assert.rejects(store.loadRun('profile',3));assert.deepEqual(store.rows.get(future.key),future);
});


test('persisted snapshots reject unknown rune content, RNG versions and impossible battle limits',()=>{
  const corruptors=[
    ['future rune',run=>{run.runes.orderedInstanceIds=['qa.rune'];run.runes.instances={'qa.rune':{instanceId:'qa.rune',runeId:'rune.relative',level:1}};}],
    ['unknown rune',run=>{run.runes.orderedInstanceIds=['qa.rune'];run.runes.instances={'qa.rune':{instanceId:'qa.rune',runeId:'foreign.rune',level:1}};}],
    ['RNG algorithm',run=>{run.rng.algorithmVersion='foreign-generator';}],
    ['round index',run=>{run.progress.roundIndex=99;}],
    ['negative initial hand',run=>{run.combat.rulesSnapshot.initialHand=-3;}],
    ['excess turns',run=>{run.combat.turnsRemaining=99;}],
  ];
  for(const [name,corrupt] of corruptors){const run=checkpoint();corrupt(run);assert.throws(()=>validateRunState(run,registry),name);}
});
