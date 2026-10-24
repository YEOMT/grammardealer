import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBestAttackSnapshot,updateBestAttackSnapshot,buildClearRecord,validateClearRecord,validateBestAttackSnapshot,FINALE_RULESET_ID,MemoryLeaderboardRepository,RemoteLeaderboardRepository,LocalLeaderboardRepository,topClearRecords,clearStorageKey,bestStorageKey,FINALE_SEQUENCE_KEY} from '../src/services/clearLeaderboard.js';
import {LocalStore,newProfile} from '../src/services/localStore.js';
import {finaleStatusText} from '../src/ui/finale.js';
import {validateFinaleRun} from '../src/game/finaleState.js';

const run=(runId='run.clear')=>({runId,version:'0.11.0',config:{qaFixture:false},revision:10,progress:{battleNumber:4,stageId:'stage.02'}});
const resolution=(power=12000,attackId='attack.best')=>({attackId,accepted:true,status:'VALID',finalPower:power,actualHpLoss:200,overkill:power-200,versions:{language:'0.10.0',balance:'balance.0.10.2'},sentenceSnapshot:{orderedTokens:[{cardDefId:'card.i',lexemeId:'lex.i',selectionId:'form.i',surface:'I'},{cardDefId:'card.run',lexemeId:'lex.run',selectionId:'form.run.past',surface:'ran'}]}});
function clear({playerId='player.first',runId='run.clear',power=12000,displayName='여행자',rulesetId=FINALE_RULESET_ID}={}){
  return buildClearRecord({runId,playerId,displayName,rulesetId,campaignVersion:'0.11.0',bestAttackSnapshot:buildBestAttackSnapshot({run:run(runId),resolution:resolution(power),rulesetId}),completionEvidence:{boundary:'FINAL50_CLEAR',phaseClearReceipts:[48,49,50].map(battleNumber=>({battleNumber,runId,settlementId:`${runId}:${battleNumber}:VICTORY`}))},eligible:true});
}

test('finale records: score and actual sentence are one deep snapshot, not HP loss or recent history',()=>{
  const attack=resolution(),state=run(),snapshot=buildBestAttackSnapshot({run:state,resolution:attack});
  assert.equal(snapshot.finalPower,12000);assert.equal(snapshot.actualHpLoss,200);assert.equal(snapshot.sentenceText,'I ran');assert.equal(snapshot.submittedTokens[1].selectedFormId,'form.run.past');
  attack.sentenceSnapshot.orderedTokens[1].surface='runs';assert.equal(snapshot.sentenceText,'I ran');
  state.history=[];let best=snapshot;for(let i=0;i<13;i++){const candidate=buildBestAttackSnapshot({run:state,resolution:resolution(500,`attack.${i}`)});state.history.unshift(candidate);state.history=state.history.slice(0,12);best=updateBestAttackSnapshot(best,candidate);}
  assert.equal(state.history.length,12);assert.equal(best.attackId,'attack.best');assert.equal(best.sentenceText,'I ran');
  const tie=buildBestAttackSnapshot({run:state,resolution:resolution(12000,'attack.tie')});assert.equal(updateBestAttackSnapshot(best,tie).attackId,'attack.best');
  assert.equal(updateBestAttackSnapshot(best,buildBestAttackSnapshot({run:state,resolution:resolution(12500,'attack.higher')})).attackId,'attack.higher');
});
test('finale records: QA, guided, sandbox, legacy, rejected, failed and synthetic attacks are excluded',()=>{
  for(const state of [{...run(),version:'0.10.2'},{...run(),config:{qaFixture:true}},{...run(),config:{sandbox:true}},{...run(),config:{practice:true}},{...run(),tutorialSession:{active:true}}])assert.equal(buildBestAttackSnapshot({run:state,resolution:resolution()}),null);
  for(const change of [{accepted:false},{status:'INVALID_CORE'},{status:'UNSUPPORTED'},{visualBasis:{synthetic:true}},{finalPower:0}])assert.equal(buildBestAttackSnapshot({run:run(),resolution:{...resolution(),...change}}),null);
  assert.equal(buildClearRecord({eligible:false}),null);
});
test('finale records: bounded data rejects missing/altered sentence, unsafe numbers, overflow and different run',()=>{
  const valid=clear();for(const change of [s=>s.finalPower=Infinity,s=>s.finalPower=Number.MAX_SAFE_INTEGER+1,s=>s.sentenceText='a different sentence',s=>s.submittedTokens[0].position=2,s=>s.submittedTokens[0].selectedFormId='',s=>s.submittedTokens=Array(25).fill(s.submittedTokens[0])]){const snapshot=structuredClone(valid.bestAttackSnapshot);change(snapshot);assert.throws(()=>validateBestAttackSnapshot(snapshot));}
  assert.throws(()=>updateBestAttackSnapshot(valid.bestAttackSnapshot,buildBestAttackSnapshot({run:run('run.other'),resolution:resolution()})));
});
test('finale records: explicit QA display snapshot carries an exclusion marker rejected by clear registration',()=>{
  const state={...run(),config:{qaFixture:true}},attack=resolution();
  assert.equal(buildBestAttackSnapshot({run:state,resolution:attack}),null);
  const qa=buildBestAttackSnapshot({run:state,resolution:attack,allowQA:true});assert.equal(qa.qaFixture,true);assert.equal(qa.sentenceText,'I ran');assert.equal(qa.finalPower,12000);
  const record=clear();record.bestAttackSnapshot=qa;assert.throws(()=>validateClearRecord(record),/QA/);
  assert.equal(buildBestAttackSnapshot({run:{...state,tutorialSession:{active:true}},resolution:attack,allowQA:true}),null);
});
test('finale records: 47 completion, 49 loss, duplicate or foreign phase receipts do not qualify',()=>{
  const valid=clear();assert.equal(validateClearRecord(valid),true);
  for(const change of [r=>r.completionEvidence.boundary='STAGE10_END',r=>r.completionEvidence.phaseClearReceipts.pop(),r=>r.completionEvidence.phaseClearReceipts[2]=r.completionEvidence.phaseClearReceipts[1],r=>r.completionEvidence.phaseClearReceipts[0].runId='other',r=>r.completionEvidence.phaseClearReceipts[2].settlementId='forged',r=>r.clearId='fresh.random.clear',r=>r.bestAttackSnapshot.runId='other']){const record=structuredClone(valid);change(record);assert.throws(()=>validateClearRecord(record));}
});
test('finale records: duplicate clear and equal/lower repeat preserve the first score and sentence; higher replaces',async()=>{
  const repo=new MemoryLeaderboardRepository(),first=clear();const once=await repo.upsertClear(first),twice=await repo.upsertClear(first);
  assert.equal(once.duplicate,false);assert.equal(twice.duplicate,true);assert.equal(twice.record.storedSequence,1);
  for(const [runId,power]of [['equal',12000],['lower',500]])await repo.upsertClear(clear({runId,power}));
  assert.equal((await repo.getOwnBest({playerKey:first.playerId})).clearId,first.clearId);
  const higher=clear({runId:'higher',power:13000});await repo.upsertClear(higher);assert.equal((await repo.getOwnBest({playerKey:first.playerId})).clearId,higher.clearId);
  assert.equal((await repo.listClears(first.playerId)).length,4);await assert.rejects(repo.upsertClear(first,{idempotencyKey:'changed'}));
  await assert.rejects(repo.upsertClear({...first,playerId:'player.someone-else'}));
});
test('finale records: 21 actual ledger entries show 20 players, retain outsider and separate rulesets',async()=>{
  const repo=new MemoryLeaderboardRepository();for(let i=0;i<21;i++)await repo.upsertClear(clear({playerId:`player.${i}`,runId:`run.${i}`,power:1000+i,displayName:i===20?'<img src=x onerror=alert(1)>':'same nickname'}));
  const top=await repo.listTop();assert.equal(top.length,20);assert.equal(top[0].playerId,'player.20');assert.equal(top[19].playerId,'player.1');assert.equal(top[0].displayName,'<img src=x onerror=alert(1)>');
  assert.equal((await repo.listClears('player.0')).length,1);assert.equal((await repo.getOwnBest({playerKey:'player.0'})).bestAttackSnapshot.finalPower,1000);
  assert.deepEqual(await repo.listTop({rulesetId:'separate.ruleset'}),[]);
  top[0].bestAttackSnapshot.sentenceText='mutation';assert.equal((await repo.listTop())[0].bestAttackSnapshot.sentenceText,'I ran');
});
test('finale records: equal score order uses stored sequence then stable clear ID',()=>{
  const records=[{...clear({runId:'c',playerId:'c'}),storedSequence:3},{...clear({runId:'b',playerId:'b'}),storedSequence:1},{...clear({runId:'a',playerId:'a'}),storedSequence:1}];
  assert.deepEqual(topClearRecords(records).map(r=>r.runId),['a','b','c']);
});

// Controlled IDB transaction boundary: reads/writes stay pending until explicit
// completion. This tests commit/abort behavior, not a successful browser opening.
function transactionStore(){
  const store=new LocalStore(),tables={profiles:new Map(),slots:new Map()};let current;
  store.db={transaction(names,mode){const pending=[],writes=[];const tx={error:null,aborted:false,objectStore(name){return {get(key){const req={};pending.push(()=>{req.result=structuredClone(tables[name].get(key));req.onsuccess?.();});return req;},put(row){writes.push([name,structuredClone(row)]);return {};}};},abort(){this.aborted=true;queueMicrotask(()=>this.onabort?.());}};current={names,mode,tx,read(){pending.splice(0).forEach(fn=>fn());},commit(){if(tx.aborted)return;writes.forEach(([name,row])=>tables[name].set(name==='profiles'?row.playerId:row.key,row));tx.oncomplete();},fail(){tx.error=Error('Injected quota failure');tx.abort();}};return tx;}};
  return{store,tables,get transaction(){return current;}};
}
test('finale records: clear ledger, own best, sequence and profile commit atomically using existing stores',async()=>{
  const db=transactionStore(),profile={...newProfile('QA'),playerId:'player.first'},record=clear();let resolved=false;
  const saving=db.store.saveFinaleClear(profile,record).then(result=>{resolved=true;return result;});
  assert.deepEqual(db.transaction.names,['profiles','slots']);assert.equal(db.transaction.mode,'readwrite');db.transaction.read();await Promise.resolve();assert.equal(resolved,false);assert.equal(db.tables.slots.size,0);
  db.transaction.commit();const result=await saving;assert.equal(result.record.storedSequence,1);assert.equal(db.tables.slots.get(clearStorageKey(record.clearId)).record.clearId,record.clearId);assert.equal(db.tables.slots.get(bestStorageKey(record.playerId,record.rulesetId)).record.clearId,record.clearId);assert.equal(db.tables.slots.get(FINALE_SEQUENCE_KEY).sequence,1);assert.equal(db.tables.profiles.get(profile.playerId).displayName,'QA');
  const again=db.store.saveFinaleClear(profile,record);db.transaction.read();db.transaction.commit();assert.equal((await again).duplicate,true);assert.equal(db.tables.slots.get(FINALE_SEQUENCE_KEY).sequence,1);
  // A later ordinary profile write cannot overwrite the independent clear rows.
  const later=db.store.saveProfile({...profile,bestAttack:999});const row=db.transaction;row.commit();await later;assert.equal(db.tables.slots.get(clearStorageKey(record.clearId)).record.bestAttackSnapshot.finalPower,12000);
});
test('finale records: transaction abort leaves all previous rows intact and does not report success',async()=>{
  const db=transactionStore(),profile={...newProfile('QA'),playerId:'player.first'},record=clear();const saving=db.store.saveFinaleClear(profile,record);db.transaction.read();db.transaction.fail();await assert.rejects(saving,/quota/);assert.equal(db.tables.profiles.size,0);assert.equal(db.tables.slots.size,0);
  await assert.rejects(db.store.saveFinaleClear({...profile,playerId:'other'},record),/프로필/);
});
test('finale records: remote absence/failure does not erase local completion; retry uses same clearId',async()=>{
  const local=new MemoryLeaderboardRepository(),record=clear();await local.upsertClear(record);
  const absent=new RemoteLeaderboardRepository();assert.equal(absent.mode,'REMOTE');assert.equal(absent.connected,false);await assert.rejects(absent.upsertClear(record),/미연결/);
  const keys=[],remote=new RemoteLeaderboardRepository({transport:{upsertClear(_record,{idempotencyKey}){keys.push(idempotencyKey);throw Error('offline');}}});
  for(let i=0;i<2;i++)await assert.rejects(remote.upsertClear(record),/offline/);assert.deepEqual(keys,[record.clearId,record.clearId]);assert.equal((await local.listTop()).length,1);assert.equal(local.persistence,'MEMORY');
});
test('finale records: local adapter forwards profile and explicit idempotency without a network dependency',async()=>{
  const record=clear(),profile={playerId:record.playerId};let call;
  const adapter=new LocalLeaderboardRepository({saveFinaleClear(...args){call=args;return Promise.resolve('stored');},listClearTop:options=>options,getOwnClearBest:options=>options},{profile});
  assert.equal(await adapter.upsertClear(record),'stored');assert.deepEqual(call,[profile,record]);assert.equal(adapter.mode,'LOCAL');assert.deepEqual(adapter.listTop({limit:20}),{limit:20});await assert.rejects(adapter.upsertClear(record,{idempotencyKey:'changed'}));
});
test('finale status: committed active task, pending next turn and pure-firepower wording are distinct',()=>{
  const surface=finaleStatusText({id:'FINALE_SURFACE',layersRemaining:1,activeTask:{type:'GRAMMAR',target:'PASSIVE'}});assert.match(surface,/방어막 1겹/);assert.match(surface,/수동태/);assert.match(surface,/회복 \+400/);
  const deep=finaleStatusText({id:'FINALE_DEEP',sealedRuneInstanceId:'rune.a',activeTask:{type:'TENSE',target:'PRESENT_PERFECT'},orderedSealTargets:[{instanceId:'rune.a',runeId:'rune.short',level:1}],completedRuneSeals:0});assert.match(deep,/주절 현재완료/);assert.match(deep,/최대 2장/);assert.match(deep,/×1.25/);
  assert.match(finaleStatusText({id:'FINALE_DEEP',pendingNextRuneSeal:true,completedRuneSeals:1,orderedSealTargets:[{},{}]}),/다음 턴/);
  const universal=finaleStatusText({id:'FINALE_UNIVERSAL'});assert.match(universal,/모든 방해 해제/);assert.doesNotMatch(universal,/24장|방어막|봉인/);
});
const incompleteRun=()=>({...run(),status:'BATTLE',stats:{bestAttack:12000},settlementIds:[],finale:{version:'0.11.0',bossPolicyVersion:'0.11.0',phaseClearReceipts:[],runeContributions:{},bestAttackSnapshot:null}});
test('finale persisted record cannot be attached to an unfinished campaign',()=>{
  const state=incompleteRun();assert.equal(validateFinaleRun(state),true);
  state.finale.bestAttackSnapshot=clear().bestAttackSnapshot;state.finale.clearRecord=clear();
  assert.throws(()=>validateFinaleRun(state),/clear record reference/);
});
test('finale persisted real and QA best snapshots cannot be mixed or relabeled',()=>{
  const state=incompleteRun(),qa=buildBestAttackSnapshot({run:{...run(),config:{qaFixture:true}},resolution:resolution(),allowQA:true});
  const cases=[
    s=>{s.finale.bestAttackSnapshot=qa;},
    s=>{s.finale.qaBestAttackSnapshot=qa;},
    s=>{s.config.qaFixture=true;s.finale.bestAttackSnapshot=clear().bestAttackSnapshot;},
    s=>{s.config.qaFixture=true;s.finale.qaBestAttackSnapshot=clear().bestAttackSnapshot;},
  ];
  for(const mutate of cases){const copy=structuredClone(state);mutate(copy);assert.throws(()=>validateFinaleRun(copy),/QA/);}
  state.config.qaFixture=true;state.finale.qaBestAttackSnapshot=qa;assert.equal(validateFinaleRun(state),true);
});
