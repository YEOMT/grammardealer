import test from 'node:test';
import assert from 'node:assert/strict';
import {RunController} from './helpers/legacy-controller.js';
import {registry,registryForVersion} from '../src/data/language/index.js';
import {getEncounter} from '../src/data/stages.js';
import {validateRunState,canSaveRun,applyProfileEvent,newProfile} from '../src/services/localStore.js';
import {assertRunInvariants} from '../src/game/invariants.js';

const go=(c,command)=>{const r=c.dispatch(command);assert.equal(r.ok,true,`${command.type}: ${r.message}`);return r;};
// Explicit state fixture for transition/transaction testing, not real play or balance evidence.
function bossPresentation(version='0.2.0'){
 const c=new RunController();go(c,{type:'NEW_RUN',config:{seed:'v02-transactions'}});go(c,{type:'START_BATTLE'});go(c,{type:'SKIP_GUIDE'});
 const s=c.getState();s.version=version;s.progress={stageId:'stage.01',roundIndex:2,battleNumber:3,contentBoundary:null};
 s.combat.enemyState={...getEncounter('stage.01',2,version),hp:0,maxHp:286};s.combat.phase='PRESENTING';s.combat.pendingAttackId='fixture.last-hit';s.combat.battleDirty=true;
 return new RunController({initialState:s,profile:c.getProfile()});
}
function toShop(){const c=bossPresentation();go(c,{type:'FINISH_PRESENTATION',attackId:'fixture.last-hit'});go(c,{type:'SKIP_REWARD',offerId:c.getState().reward.offerId});go(c,{type:'NEXT_STAGE'});go(c,{type:'ENTER_STAGE'});return c;}
function fundedShop(){const original=toShop(),s=original.getState();s.economy.gold=100;return new RunController({initialState:s,profile:original.getProfile()});}
function unchanged(c,command){const before=c.getState();assert.equal(c.dispatch(command).ok,false);assert.deepEqual(c.getState(),before);}

test('0.2 P03 P04 P06: Stage 1 milestone is committed before reward and independently of content completion',()=>{
 const c=bossPresentation();go(c,{type:'FINISH_PRESENTATION',attackId:'fixture.last-hit'});
 const reward=c.getState();assert.equal(reward.status,'REWARD');assert.equal(c.getProfile().qualifiedRunIds.length,1);assert.ok(reward.eligibility.runOwnUnlocks.includes('rune.svoo'));
 unchanged(c,{type:'FINISH_PRESENTATION',attackId:'fixture.last-hit'});
 go(c,{type:'SKIP_REWARD',offerId:reward.reward.offerId});assert.equal(c.getState().status,'STAGE_CLEAR');assert.equal(c.getProfile().qualifiedRunIds.length,1);assert.equal(canSaveRun(c.getState()),true);assert.equal(validateRunState(c.getState(),registry),true);
});
test('0.2 P03 P24: legacy 0.1.1 run ends at its original Stage 1 boundary',()=>{
 const c=bossPresentation('0.1.1');go(c,{type:'FINISH_PRESENTATION',attackId:'fixture.last-hit'});go(c,{type:'SKIP_REWARD',offerId:c.getState().reward.offerId});
 assert.equal(c.getState().status,'CONTENT_COMPLETE');assert.equal(c.getState().progress.contentBoundary,'STAGE1_END');assert.equal(validateRunState(c.getState(),registry),true);unchanged(c,{type:'NEXT_STAGE'});
 assert.equal(registryForVersion('0.1.1').cardById['card.send'],undefined);assert.equal(registryForVersion('0.1.0').cardById['card.for'],undefined);
});
test('0.2 P07 P08 P22: preview then grant then shop, without consuming deck or reward RNG',()=>{
 const c=bossPresentation();go(c,{type:'FINISH_PRESENTATION',attackId:'fixture.last-hit'});go(c,{type:'SKIP_REWARD',offerId:c.getState().reward.offerId});
 const cleared=c.getState();go(c,{type:'NEXT_STAGE'});const intro=c.getState();assert.equal(intro.status,'STAGE_INTRO');assert.equal(intro.combat,null);assert.equal(intro.progress.battleNumber,4);assert.deepEqual(intro.rng,cleared.rng);
 unchanged(c,{type:'START_BATTLE'});go(c,{type:'ENTER_STAGE'});const shop=c.getState();assert.equal(shop.status,'SHOP');assert.equal(shop.combat,null);assert.deepEqual(shop.rng.deck,intro.rng.deck);assert.deepEqual(shop.rng.reward,intro.rng.reward);
 assert.ok(shop.entryGrants['stage.02'].cardInstanceIds.length<=2);assert.equal(new Set(shop.activeCardIds).size,shop.activeCardIds.length);assertRunInvariants(shop,registry);assert.equal(validateRunState(shop,registry),true);
 unchanged(c,{type:'ENTER_STAGE'});assert.equal(canSaveRun(shop),true);
});
test('0.2 P11 P13 P16: shop card purchase is atomic, and stale/duplicate/unaffordable commands do nothing',()=>{
 const c=fundedShop(),before=c.getState(),item=before.shop.inventory.find(x=>x.kind==='CARD');
 const cmd={type:'SHOP_BUY',shopId:before.shop.shopId,itemId:item.itemId,expectedRevision:before.revision,commandId:'buy-once'};
 go(c,cmd);const after=c.getState();assert.equal(after.economy.gold,before.economy.gold-item.price);assert.equal(after.activeCardIds.length,before.activeCardIds.length+1);assert.ok(after.vocabulary.encounteredLexemeIds.includes(registry.cardById[item.cardDefId].lexemeId));assert.equal(after.shop.inventory.find(x=>x.itemId===item.itemId).purchased,true);
 unchanged(c,cmd);unchanged(c,{...cmd,commandId:'stale'});unchanged(c,{...cmd,expectedRevision:after.revision,commandId:'second-copy'});unchanged(c,{...cmd,shopId:'old-shop',expectedRevision:after.revision});
 unchanged(c,{type:'SHOP_BUY',shopId:before.shop.shopId,itemId:before.shop.inventory.find(x=>x.kind==='CARD'&&x.itemId!==item.itemId).itemId,commandId:{invalid:'object'}});
 const poor=c.getState();poor.economy.gold=0;const p=new RunController({initialState:poor});const other=poor.shop.inventory.find(x=>!x.purchased);unchanged(p,{type:'SHOP_BUY',shopId:poor.shop.shopId,itemId:other.itemId});
});
test('0.2 P14 P15 P17: independent polish/removal services each once; failed selection preserves every RNG',()=>{
 const c=fundedShop(),before=c.getState(),shopId=before.shop.shopId,id=before.activeCardIds[0];
 unchanged(c,{type:'SHOP_SERVICE',shopId,serviceKind:'POLISH'});unchanged(c,{type:'SHOP_SERVICE',shopId,serviceKind:'REMOVE',targetCardInstanceId:'absent'});
 go(c,{type:'SHOP_SERVICE',shopId,serviceKind:'POLISH',targetCardInstanceId:id});assert.equal(c.getState().cardInstances[id].polishLevel,1);unchanged(c,{type:'SHOP_SERVICE',shopId,serviceKind:'POLISH',targetCardInstanceId:id});
 go(c,{type:'SHOP_SERVICE',shopId,serviceKind:'REMOVE',targetCardInstanceId:id,confirmRemoval:true});const after=c.getState();assert.equal(after.economy.gold,86);assert.equal(after.economy.paidRemovalCount,1);assert.equal(after.activeCardIds.includes(id),false);assert.equal(after.shop.services.POLISH.used,true);assert.equal(after.shop.services.REMOVE.used,true);assert.deepEqual(after.rng,before.rng);unchanged(c,{type:'SHOP_SERVICE',shopId,serviceKind:'REMOVE',targetCardInstanceId:after.activeCardIds[0],confirmRemoval:true});assert.equal(validateRunState(after,registry),true);
});
test('0.2 P18 P23: SHOP save roundtrip retains inventory/services, then identical next shuffle and draw',()=>{
 const a=fundedShop(),s=a.getState();const item=s.shop.inventory.find(i=>i.kind==='CARD');go(a,{type:'SHOP_BUY',shopId:s.shop.shopId,itemId:item.itemId});
 const saved=a.getState();assert.equal(canSaveRun(saved),true);assert.equal(validateRunState(saved,registry),true);const b=new RunController({initialState:JSON.parse(JSON.stringify(saved)),profile:a.getProfile()});
 assert.deepEqual(b.getState(),saved);for(const c of [a,b])go(c,{type:'LEAVE_SHOP',shopId:s.shop.shopId});assert.deepEqual(a.getState(),b.getState());assert.equal(a.getState().combat.enemyState.hp,220);assert.equal(a.getState().progress.battleNumber,4);assert.equal(validateRunState(a.getState(),registry),true);unchanged(a,{type:'ENTER_STAGE'});unchanged(a,{type:'LEAVE_SHOP',shopId:s.shop.shopId});
});
test('0.2 P23: corrupt stage/shop/manifest/entry saves are rejected without repair',()=>{
 const valid=toShop().getState();
 for(const corrupt of [s=>s.progress.battleNumber=5,s=>s.progress.roundIndex=4,s=>s.shop.inventory[0].price=0,s=>s.shop.inventory[1].cardDefId='foreign.card',s=>s.shop.inventory[0].itemId=s.shop.inventory[1].itemId,s=>s.entryGrants['stage.02'].cardInstanceIds.push('a','b','c'),s=>s.shop.closed=true,s=>s.contentManifest.cardDefIds.push('unknown'),s=>s.milestoneIds=[]]){const s=structuredClone(valid);corrupt(s);assert.throws(()=>validateRunState(s,registry));}
 assert.equal(validateRunState(valid,registry),true);
 const corruptService=structuredClone(valid);corruptService.shop.services.REMOVE.used=true;corruptService.shop.services.REMOVE.price=4;assert.throws(()=>validateRunState(corruptService,registry));
 const corruptCommands=structuredClone(valid);corruptCommands.appliedCommandIds=[{invalid:'object'}];assert.throws(()=>validateRunState(corruptCommands,registry));
});
test('0.2 P05 P26: Stage 2 third round is normal; fourth boss completion is not a story clear',()=>{
 const c=toShop();go(c,{type:'LEAVE_SHOP',shopId:c.getState().shop.shopId});
 for(const roundIndex of [2,3]){const s=c.getState();s.progress={stageId:'stage.02',roundIndex,battleNumber:4+roundIndex,contentBoundary:null};const enemy=getEncounter('stage.02',roundIndex,s.version);s.combat.enemyState={...enemy,hp:0,maxHp:enemy.hpMax};s.combat.phase='PRESENTING';s.combat.pendingAttackId='fixture.stage2';s.combat.battleDirty=true;
  const end=new RunController({initialState:s,profile:c.getProfile()});go(end,{type:'FINISH_PRESENTATION',attackId:'fixture.stage2'});assert.equal(end.getState().combat.victorySummary.baseGold,roundIndex===3?6:2);assert.equal(end.getState().reward.type,'MIXED');go(end,{type:'SKIP_REWARD',offerId:end.getState().reward.offerId});
  if(roundIndex===2)assert.equal(end.getState().status,'BETWEEN_BATTLES');else {const complete=end.getState();assert.equal(complete.status,'CONTENT_COMPLETE');assert.equal(complete.progress.contentBoundary,'STAGE2_END');assert.equal(validateRunState(complete,registry),true);assert.equal(end.getProfile().qualifiedRunIds.length,1);assert.equal(end.getProfile().stage2CompletedRunIds.length,1);assert.equal(end.getProfile().storyClearCount,0);const once=end.getProfile();assert.deepEqual(applyProfileEvent(once,{type:'STAGE2_CLEAR',runId:complete.runId}),once);}
 }
});
test('0.2 P25: run eligibility snapshots profile unlocks, never all runtime runes or later profile changes',()=>{
 const p=newProfile('QA'),c=new RunController({profile:p});go(c,{type:'NEW_RUN',config:{seed:'eligibility'}});assert.equal(c.getState().eligibility.runStartUnlockBaseline.includes('rune.svoo'),false);
 const changed={...p,unlocks:['rune.svoo','rune.relative']};c.setProfile(changed);assert.equal(c.getState().eligibility.runStartUnlockBaseline.includes('rune.svoo'),false);go(c,{type:'NEW_RUN',config:{seed:'eligibility'}});assert.ok(c.getState().eligibility.runStartUnlockBaseline.includes('rune.svoo'));assert.ok(c.getState().eligibility.runStartUnlockBaseline.includes('rune.relative'));assert.equal(c.getState().runes.orderedInstanceIds.length,0);
});
test('0.2 P23 P24: forged frozen Topaz reward cannot enter legacy or unqualified current saves',()=>{
 for(const version of ['0.1.1','0.2.0']){
  const c=new RunController();go(c,{type:'NEW_RUN',config:{seed:'forged-offer'}});go(c,{type:'START_BATTLE'});const s=c.getState();s.version=version;s.status='REWARD';
  s.reward={offerId:'forged.offer',battleNumber:1,skipGold:2,type:'RUNE',choices:[{choiceId:'forged.choice',runeId:'rune.svoo'}],resolved:false};
  assert.throws(()=>validateRunState(s,registry),/룬 보상/);
  s.reward={...s.reward,type:'MIXED',rewardVersion:version==='0.2.0'?'0.2.0':'0.1.1',skipGold:3,choices:[{choiceId:'a',kind:'RUNE',runeId:'rune.svoo',rarity:'UNCOMMON',ownedLevel:0,offeredLevel:1},{choiceId:'b',kind:'CARD',cardDefId:'card.i',rarity:'COMMON'},{choiceId:'c',kind:'CARD',cardDefId:'card.you',rarity:'COMMON'}]};
  assert.throws(()=>validateRunState(s,registry),/룬 보상/);
 }
});
