import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {skyController,giveOperation,operationCommand} from './helpers/sky-state.js';
import {operationAvailability,searchCandidates} from '../src/game/operations.js';
import {validateRunState,canSaveRun} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';
import {assertRunInvariants} from '../src/game/invariants.js';
import {createRewardOffer,resolveReward} from '../src/game/rewards.js';
import {createShop,grantStage2Entry,useShopService,buyShopItem} from '../src/game/shop.js';
import {isOperation} from '../src/data/cardCatalog.js';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/v04-operations-expectations.json',import.meta.url))).cases;
const finish=(c,r)=>{assert.ok(r.ok,JSON.stringify(r));assert.ok(c.dispatch({type:'FINISH_OPERATION',effectId:r.operationEffect.effectId}).ok);};
function assign(c,row){
 const s=c.getState(),p=s.combat,all=[...new Set([...row.hand,...row.draw,...row.discard,...row.exhausted])];
 s.activeCardIds=all;s.cardInstances=Object.fromEntries(all.map(id=>[id,{instanceId:id,cardDefId:row.operation_ids.includes(id)?`card.operation.${id===row.source?row.kind:id==='s'?'supply':'search'}`:'card.book',polishLevel:0,specialEffectId:null}]));
 Object.assign(p,{handIds:[...row.hand],drawIds:[...row.draw],discardIds:[...row.discard],sentenceSlots:[],exhaustedIds:[...row.exhausted],operationSequence:0,operationHistory:[],pendingOperationId:null});p.rulesSnapshot.handLimit=row.hand_limit;
 // Supplied models explicitly begin with an already-used copy. Build a consistent assigned prior receipt.
 for(const id of row.exhausted){const index=++p.operationSequence,drawn=row.hand.find(x=>x!==id),rng=structuredClone(s.rng.deck);p.operationHistory.push({effectId:`${s.runId}:battle.1:operation.${index}`,operationSequence:index,runId:s.runId,battleId:p.enemyState.id,sourceCardId:id,cardDefId:s.cardInstances[id].cardDefId,operationType:id==='s'?'SUPPLY':'SEARCH',expectedRevision:0,drawnCardIds:[drawn],actualDrawCount:1,...(id==='s'?{}:{targetCardId:drawn}),before:{handIds:[id],exhaustedIds:[],rng},after:{handIds:[drawn],exhaustedIds:[id],rng},versions:{game:'0.4.0',operation:'0.4.0'}});}
 c._state=s;
}
for(const row of fixtures)test(`0.4 actual operation transaction expectation ${row.id}`,()=>{
 const c=skyController();assign(c,row);const before=c.getState(),undo=structuredClone(c.undo),r=c.dispatch(operationCommand(c,row.source,row.target)),after=c.getState();assert.equal(r.ok,row.expected.ok,JSON.stringify(r));
 for(const [key,expected]of [['handIds','hand'],['drawIds','draw'],['discardIds','discard'],['exhaustedIds','exhausted']])assert.deepEqual(after.combat[key],row.expected[expected]);
 for(const key of ['turnIndex','actionSequence','turnsRemaining','exchangesRemaining','enemyState'])assert.deepEqual(after.combat[key],before.combat[key]);assert.deepEqual(after.stats,before.stats);assert.deepEqual(after.economy,before.economy);assert.deepEqual(after.activeCardIds,before.activeCardIds);
 if(!r.ok){assert.deepEqual(after,before);assert.deepEqual(c.undo,undo);}else{assert.equal(r.operationEffect.actualDrawCount,row.expected.hand.length-row.hand.length+1);assertRunInvariants(after,registryForVersion('0.4.0'));}
});
test('0.4 supply reshuffles only discarded cards, records real RNG, cannot duplicate on stale confirm/finish',()=>{
 const c=skyController(),id=giveOperation(c),s=c.getState();s.combat.discardIds=s.combat.drawIds;s.combat.drawIds=[];c._state=s;
 const cmd=operationCommand(c,id),before=c.getState(),r=c.dispatch(cmd);assert.equal(r.ok,true);assert.equal(r.operationEffect.drawnCardIds.length,2);assert.notDeepEqual(c.getState().rng.deck,before.rng.deck);assert.deepEqual(c.getState().rng.reward,before.rng.reward);assert.deepEqual(c.getState().rng.shop,before.rng.shop);
 assert.equal(canSaveRun(c.getState()),false);const committed=c.getState();assert.equal(c.dispatch(cmd).ok,false);assert.deepEqual(c.getState(),committed);
 finish(c,r);assert.equal(c.dispatch({type:'FINISH_OPERATION',effectId:r.operationEffect.effectId}).ok,false);assert.equal(canSaveRun(c.getState()),true);validateRunState(c.getState(),registryForVersion('0.4.0'));
 const bad=c.getState();bad.combat.operationHistory[0].actualDrawCount=9;assert.throws(()=>validateRunState(bad,registryForVersion('0.4.0')));
});
test('0.4 search open/cancel preserves all persistent state, undo and RNG; confirm uses drawn WORD only',()=>{
 const c=skyController(),id=giveOperation(c,'search'),word=c.getState().combat.handIds[0];assert.ok(c.dispatch({type:'ADD_CARD',cardId:word}).ok);const before=c.getState(),undo=structuredClone(c.undo);
 const open=c.dispatch({type:'OPEN_OPERATION',sourceCardId:id});assert.equal(open.ok,true);assert.deepEqual(c.getState(),before);assert.deepEqual(c.undo,undo);assert.equal(c.dispatch({type:'PREPARE'}).ok,false);assert.ok(c.dispatch({type:'CANCEL_OPERATION'}).ok);assert.deepEqual(c.getState(),before);assert.deepEqual(c.undo,undo);
 const target=searchCandidates(before)[0].cardInstanceId,r=c.dispatch(operationCommand(c,id,target));assert.ok(r.ok);assert.deepEqual(c.getState().rng,before.rng);assert.deepEqual(c.getState().combat.drawIds,before.combat.drawIds.filter(x=>x!==target));assert.equal(c.undo.length,0);finish(c,r);
});
test('0.4 operations cannot enter/swap/form the sentence, can be exchanged normally, reset for next battle',()=>{
 const c=skyController(),id=giveOperation(c),word=c.getState().combat.handIds[0];assert.ok(c.dispatch({type:'ADD_CARD',cardId:word}).ok);
 for(const cmd of [{type:'ADD_CARD',cardId:id},{type:'SET_FORM',cardId:id,formId:'form.be.is'},{type:'SWAP_CARDS',handCardId:id,sentenceCardId:word}]){const before=c.getState();assert.equal(c.dispatch(cmd).ok,false);assert.deepEqual(c.getState(),before);}
 const before=c.getState();assert.ok(c.dispatch({type:'EXCHANGE',cardIds:[id]}).ok);assert.equal(c.getState().combat.exchangesRemaining,before.combat.exchangesRemaining-1);assert.deepEqual(c.getState().combat.exhaustedIds,[]);
 const id2=giveOperation(c,'supply','second'),r=c.dispatch(operationCommand(c,id2));finish(c,r);const next=c.getState();next.status='BETWEEN_BATTLES';c._state=next;assert.ok(c.dispatch({type:'NEXT_BATTLE'}).ok);assert.deepEqual(c.getState().combat.exhaustedIds,[]);assert.deepEqual(c.getState().combat.operationHistory,[]);assert.ok([...c.getState().combat.handIds,...c.getState().combat.drawIds].includes(id2));
});
test('0.4 internal operation pools preserve protected WORD slots, external weights, max one and purchase/remove/polish rules',()=>{
 let supply=false,search=false;
 for(let seed=0;seed<220;seed++){
  const c=skyController(`operations.pool.${seed}`),s=c.getState();s.progress.battleNumber=3;s.progress.roundIndex=2;s.combat=null;s.reward=null;const offer=createRewardOffer(s,c.getProfile());
  const ops=offer.choices.filter(x=>x.kind==='CARD'&&isOperation(x.cardDefId,s.version));assert.ok(ops.length<=1);assert.ok(ops.every(x=>x.role!=='LOCAL_SYNTAX_RELEVANT'));for(const x of ops){supply ||= x.cardDefId.endsWith('supply');search ||= x.cardDefId.endsWith('search');}
  if(ops.length){s.status='REWARD';assert.ok(resolveReward(s,offer.offerId,ops[0].choiceId).ok);const owned=Object.values(s.cardInstances).find(x=>x.cardDefId===ops[0].cardDefId);assert.equal(owned.polishLevel,0);}
  s.progress={stageId:'stage.02',roundIndex:0,battleNumber:4,contentBoundary:null};s.milestoneIds=['STAGE1_CLEAR'];s.eligibility.runOwnUnlocks=['pack.svoo','rune.svoo'];grantStage2Entry(s);s.reward=null;const shop=createShop(s);s.status='SHOP';s.economy.gold=100;
  const opItems=shop.inventory.filter(x=>x.kind==='CARD'&&isOperation(x.cardDefId,s.version));assert.ok(opItems.length<=1);assert.ok(opItems.every(x=>x.role!=='LOCAL_SYNTAX_RELEVANT'));
  if(opItems.length){const item=opItems[0];assert.ok(buyShopItem(s,shop.shopId,item.itemId).ok);const targetCardInstanceId=item.itemId+'.owned';const old=structuredClone(s);assert.equal(useShopService(s,shop.shopId,'POLISH',{targetCardInstanceId}).ok,false);assert.deepEqual(s,old);assert.ok(useShopService(s,shop.shopId,'REMOVE',{targetCardInstanceId,confirmRemoval:true}).ok);}
 }
 assert.ok(supply&&search,'both rarities were observed in real seeded reward generation');
});
