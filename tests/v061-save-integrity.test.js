import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RunController} from '../src/game/runController.js';
import {newProfile,validateRunState,canSaveRun} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';
import {grantStage5Entry,DESERT_PACKS} from '../src/game/wishDesert.js';
import {SNOW_PACKS} from '../src/game/mirrorSnowfield.js';
import {cardKind} from '../src/data/cardCatalog.js';
import {RUNE_SLOT_LIMIT} from '../src/data/runes.js';
import {cleanupFrost} from '../src/game/frostCards.js';
import {assigned061,grantOperation,assignPiles,checked} from './helpers/ui-061-state.js';

const registry=registryForVersion('0.6.1');
function restored(c){const s=c.getState();assert.equal(canSaveRun(s),true);assert.equal(validateRunState(s,registry),true);const copy=new RunController({profile:c.getProfile()});assert.equal(copy.restoreRun(JSON.parse(JSON.stringify(s))).ok,true);assert.deepEqual(copy.getState(),s);return copy;}
/** Assigned campaign boundaries; entry, purchasing, polish and save/restore use real commands. */
function nextShop(c,stage){
 const s=c.getState();cleanupFrost(s);s.combat=null;s.reward=null;s.status='STAGE_INTRO';s.economy.gold=100;s.runes.slotLimit=stage>=4?4:RUNE_SLOT_LIMIT;
 s.milestoneIds=Array.from({length:stage-1},(_,i)=>`STAGE${i+1}_CLEAR`);
 s.eligibility.runOwnUnlocks=['pack.svoo','rune.svoo','pack.time.past','pack.time.progressive','pack.time.perfect','pack.time.futureWill','pack.clauseLink',...DESERT_PACKS,...(stage===6?SNOW_PACKS:[])];
 if(stage===6){s.progress={stageId:'stage.05',roundIndex:0,battleNumber:18,contentBoundary:null};grantStage5Entry(s);}
 s.progress={stageId:`stage.0${stage}`,roundIndex:0,battleNumber:{2:4,4:13,6:23}[stage],contentBoundary:null};c._state=s;
 checked(c,{type:'ENTER_STAGE'});
 const pending=c.getState();if(pending.entryChoice?.pending)checked(c,{type:'CHOOSE_STAGE4_CONNECTOR',...pending.entryChoice,cardDefId:'card.but',expectedRevision:pending.revision,commandId:'save.integrity.connector'});
 assert.equal(c.getState().status,'SHOP');return c.getState().shop;
}
test('0.6.1 P021/P023/P025 three actual shop transactions restore inventory, RNG, prices, purchases and polish exactly',()=>{
 let c=new RunController({profile:{...newProfile('061 shop serialization'),guidedTutorialCompletedVersion:'0.2.1'}});checked(c,{type:'NEW_RUN',config:{seed:'061.saved.three.shops'}});
 for(const stage of [2,4,6]){
  const shop=nextShop(c,stage);c=restored(c);const offer=shop.inventory.find(i=>i.role==='DEDICATED_OPERATION'),before=c.getState();
  checked(c,{type:'SHOP_BUY',shopId:shop.shopId,itemId:offer.itemId});let s=c.getState(),bought=s.shop.inventory.find(i=>i.itemId===offer.itemId),id=bought.resolution.cardInstanceId;assert.equal(bought.purchased,true);assert.equal(s.cardInstances[id].cardDefId,offer.cardDefId);assert.equal(s.economy.gold,before.economy.gold-offer.price);assert.deepEqual(s.rng,before.rng);c=restored(c);
  checked(c,{type:'SHOP_SERVICE',shopId:shop.shopId,serviceKind:'POLISH',targetCardInstanceId:id});s=c.getState();assert.equal(s.cardInstances[id].polishLevel,1);assert.equal(s.economy.gold,before.economy.gold-offer.price-8);assert.equal(s.shop.services.POLISH.used,true);assert.deepEqual(s.rng,before.rng);c=restored(c);
  const frozen=c.getState();assert.equal(c.dispatch({type:'SHOP_BUY',shopId:shop.shopId,itemId:offer.itemId}).ok,false);assert.deepEqual(c.getState(),frozen);checked(c,{type:'LEAVE_SHOP',shopId:shop.shopId});
 }
});

test('0.6.1 live and defeated receipt snapshots cannot invent a physical card absent from the battle',()=>{
 for(const ended of [false,true]){
 const c=assigned061('audit.missing.snapshot'),source=grantOperation(c,'supply');assignPiles(c,{hand:[source]});let s=c.getState();const effect=checked(c,{type:'USE_OPERATION',sourceCardId:source,commandId:'audit.missing',expectedRevision:s.revision,battleId:s.combat.enemyState.id}).operationEffect;checked(c,{type:'FINISH_OPERATION',effectId:effect.effectId});if(ended)while(c.getState().status==='BATTLE')checked(c,{type:'PREPARE',confirmed:true});s=c.getState();assert.equal(validateRunState(s,registry),true);
 const receipt=s.combat.operationHistory[0],old=receipt.drawnCardIds[0],ghost='forged.nonexistent.word';
 for(const side of ['before','after'])for(const key of ['handIds','drawIds','discardIds','exhaustedIds','shatteredTemporaryIds'])receipt[side][key]=receipt[side][key].map(x=>x===old?ghost:x);
 receipt.cardSnapshots[ghost]={...receipt.cardSnapshots[old],instanceId:ghost};delete receipt.cardSnapshots[old];receipt.drawnCardIds=receipt.drawnCardIds.map(x=>x===old?ghost:x);
 assert.ok(s.cardInstances[old]);assert.equal(s.cardInstances[ghost],undefined);assert.throws(()=>validateRunState(s,registry));
 }
});

test('0.6.1 a legitimate reward removal of a used operation preserves readable historical receipts',()=>{
 let checkedRemoval=false;
 for(let n=0;n<100&&!checkedRemoval;n++){
  const c=assigned061('audit.reward.removal.'+n),source=grantOperation(c,'supply');const s=c.getState(),[i,run]=s.activeCardIds;s.tutorial.isIntroRun=false;s.cardInstances[i].cardDefId='card.i';s.cardInstances[i].polishLevel=3;s.cardInstances[run].cardDefId='card.run';s.cardInstances[run].polishLevel=3;c._state=s;assignPiles(c,{hand:[source,i,run]});
  const before=c.getState(),effect=checked(c,{type:'USE_OPERATION',sourceCardId:source,commandId:'reward.removal.source',expectedRevision:before.revision,battleId:before.combat.enemyState.id}).operationEffect;checked(c,{type:'FINISH_OPERATION',effectId:effect.effectId});checked(c,{type:'ADD_CARD',cardId:i});checked(c,{type:'ADD_CARD',cardId:run});const resolution=checked(c,{type:'SUBMIT'}).resolution;assert.equal(resolution.killed,true);checked(c,{type:'FINISH_PRESENTATION',attackId:resolution.attackId});const offer=c.getState().reward,choice=offer.choices.find(x=>x.kind==='SERVICE'&&x.serviceKind==='REMOVE');if(!choice)continue;
  checked(c,{type:'CHOOSE_REWARD',offerId:offer.offerId,choiceId:choice.choiceId,targetCardInstanceId:source,confirmRemoval:true});const removed=c.getState();assert.equal(removed.cardInstances[source],undefined);assert.ok(removed.combat.operationHistory[0].cardSnapshots[source]);assert.equal(removed.reward.resolution.cardInstanceId,source);restored(c);checkedRemoval=true;
 }
 assert.equal(checkedRemoval,true);
});

test('0.6.1 P047 an original 0.6 save rejects every new operation definition',()=>{
 const golden=JSON.parse(readFileSync(new URL('./fixtures/v061-legacy-060-golden.json',import.meta.url),'utf8'));
 for(const kind of ['nounSearch','verbSearch','adjectiveSearch','connectorSearch','recycle']){const s=structuredClone(golden.states[0]);s.cardInstances[s.activeCardIds[0]].cardDefId='card.operation.'+kind;assert.throws(()=>validateRunState(s,registryForVersion('0.6.0')));}
});

test('0.6.1 P041 an unused temporary support can exchange then recycle as the same live physical instance',()=>{
 const c=new RunController({profile:{...newProfile('061 support exchange'),guidedTutorialCompletedVersion:'0.2.1'}});checked(c,{type:'NEW_RUN',config:{seed:'061.support.exchange'}});
 for(const stage of [2,4,6]){const shop=nextShop(c,stage);checked(c,{type:'LEAVE_SHOP',shopId:shop.shopId});}
 const s=c.getState();cleanupFrost(s);s.combat=null;s.status='STAGE_INTRO';s.progress={stageId:'stage.06',roundIndex:4,battleNumber:27,contentBoundary:null};c._beginBattle(s);c._state=s;
 const recycle=grantOperation(c,'recycle'),initial=c.getState(),support=initial.combat.temporaryCardIds.find(id=>cardKind(initial.cardInstances[id],initial.version)==='OPERATION'),physical=structuredClone(initial.cardInstances[support]);assignPiles(c,{hand:[support,recycle]});checked(c,{type:'EXCHANGE',cardIds:[support]});assert.deepEqual(c.getState().combat.discardIds,[support]);
 const before=c.getState(),effect=checked(c,{type:'USE_OPERATION',sourceCardId:recycle,commandId:'support.recycled',expectedRevision:before.revision,battleId:before.combat.enemyState.id}).operationEffect;assert.deepEqual(effect.drawnCardIds,[support]);checked(c,{type:'FINISH_OPERATION',effectId:effect.effectId});assert.deepEqual(c.getState().cardInstances[support],physical);assert.ok(c.getState().combat.handIds.includes(support));assert.equal(c.getState().combat.temporaryCardIds.filter(id=>id===support).length,1);restored(c);
});
