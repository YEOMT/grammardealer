import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {campaignCards,cardDefinition,canPolish} from '../src/data/cardCatalog.js';
import {operationCardsForVersion} from '../src/data/operationSpec.js';
import {RUNES} from '../src/data/runes.js';
import {createRng} from '../src/game/rng.js';
import {grantStage2Entry,createShop,buyShopItem,useShopService,closeShop} from '../src/game/shop.js';
import {getStage4EntryChoice,grantStage4Entry} from '../src/game/skyIslands.js';
import {grantStage6Entry} from '../src/game/mirrorSnowfield.js';
import {validateSkyShops} from '../src/game/skyShopValidation.js';
import {createRewardOffer,resolveReward} from '../src/game/rewards.js';
import {selectOperation} from '../src/game/operationPool.js';
import {RunController} from './helpers/legacy-061-controller.js';
import {newProfile,validateRunState,canSaveRun} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';

const expectations=JSON.parse(readFileSync(new URL('./fixtures/v061-05_Progression_Save_Cases_0.6.1.json',import.meta.url),'utf8'));
const permanentIds=operationCardsForVersion('0.6.1').map(c=>c.id);
function own(run,cardDefId,polishLevel=0){const instanceId=`owned.${run.activeCardIds.length}.${cardDefId}`;run.cardInstances[instanceId]={instanceId,cardDefId,polishLevel,specialEffectId:null};run.activeCardIds.push(instanceId);return instanceId;}
function runFor(seed='061.progression',version='0.6.1'){
 const run={version,runId:seed,status:'STAGE_INTRO',progress:{stageId:'stage.02',roundIndex:0,battleNumber:4},combat:null,reward:null,shop:null,shopHistory:[],entryGrants:{},activeCardIds:[],cardInstances:{},rng:createRng(seed),vocabulary:{encounteredLexemeIds:[]},economy:{gold:100,paidRemovalCount:0},runes:{instances:{},orderedInstanceIds:[],slotLimit:4},contentManifest:{cardDefIds:campaignCards(version).filter(c=>c.runtimeReady).map(c=>c.id),runeIds:RUNES.filter(r=>r.runtimeReady).map(r=>r.id)},eligibility:{runStartUnlockBaseline:['rune.svoo','pack.snowWords.reward'],runOwnUnlocks:[]},tutorial:{isIntroRun:false}};
 for(const id of ['card.i','card.give','card.you','card.a','card.book'])own(run,id);return run;
}
function enter(run,stage){run.status='STAGE_INTRO';run.progress={stageId:stage,roundIndex:0,battleNumber:{'stage.02':4,'stage.04':13,'stage.06':23}[stage]};if(stage==='stage.02')grantStage2Entry(run);else if(stage==='stage.04')grantStage4Entry(run,{connectorCardDefId:getStage4EntryChoice(run)?'card.and':null});else grantStage6Entry(run);createShop(run);run.status='SHOP';return run.shop;}
const act=(c,command)=>{const result=c.dispatch(command);assert.equal(result.ok,true,command.type+': '+result.message);return result;};
const noChange=(c,command)=>{const before=c.getState();assert.equal(c.dispatch(command).ok,false);assert.deepEqual(c.getState(),before);};
/** Assigned stage boundary only. The entry/choice/shop/save transactions below are real commands. */
function assignedStage4Intro({connector=null}={}){
 const c=new RunController({profile:{...newProfile('0.6.1 assigned entry QA'),guidedTutorialCompletedVersion:'0.2.1'}});act(c,{type:'NEW_RUN',config:{seed:'061.entry.command'}});const s=c.getState();s.economy.gold=100;
 s.progress={stageId:'stage.02',roundIndex:0,battleNumber:4,contentBoundary:null};grantStage2Entry(s);createShop(s);s.status='SHOP';closeShop(s,s.shop.shopId);
 s.progress={stageId:'stage.04',roundIndex:0,battleNumber:13,contentBoundary:null};s.status='STAGE_INTRO';s.milestoneIds=['STAGE1_CLEAR','STAGE2_CLEAR','STAGE3_CLEAR'];s.eligibility.runOwnUnlocks=['pack.svoo','rune.svoo','pack.time.past','pack.time.progressive','pack.time.perfect','pack.time.futureWill','pack.clauseLink'];s.runes.slotLimit=4;
 for(const id of s.activeCardIds)if(['card.and','card.but','card.or','card.because','card.when','card.if'].includes(s.cardInstances[id].cardDefId))s.cardInstances[id].cardDefId='card.book';
 if(connector)own(s,'card.'+connector);
 assert.equal(validateRunState(s,registryForVersion('0.6.1')),true);return new RunController({initialState:s,profile:c.getProfile()});
}

for(const item of expectations.cases.filter(c=>Number(c.id.slice(1))<=15))test(`0.6.1 progression ${item.id}: ${item.name}`,()=>{
 const run=runFor(item.id);run.progress={stageId:'stage.04',roundIndex:0,battleNumber:13};run.activeCardIds=[];run.cardInstances={};
 for(const lemma of item.ownedPermanentLemmas??[])own(run,'card.'+lemma);
 run.vocabulary.encounteredLexemeIds=(item.encounteredOnly??[]).map(x=>'lex.'+x);
 const before=structuredClone(run),choice=getStage4EntryChoice(run);assert.deepEqual(run,before,'choice preview is pure');
 if('expectedChoiceRequired'in item)assert.equal(Boolean(choice),item.expectedChoiceRequired);
 if(item.expectedGrants){const grant=grantStage4Entry(run,{connectorCardDefId:item.selected?'card.'+item.selected:null});assert.deepEqual(grant.cardDefIds,item.expectedGrants.map(x=>'card.'+x));assert.ok(grant.cardInstanceIds.length<=3);assert.deepEqual(run.rng,before.rng);assert.equal(grant.entryVersion,'0.6.1');const after=structuredClone(run);grantStage4Entry(run);assert.deepEqual(run,after);}
});
test('0.6.1 Stage4 invalid/cancelled choice never grants; removal does not regrant; old 0.6 grants remain original',()=>{
 const run=runFor();run.progress={stageId:'stage.04',roundIndex:0,battleNumber:13};const before=structuredClone(run);
 for(const connectorCardDefId of [null,'card.that','card.or']){assert.throws(()=>grantStage4Entry(run,{connectorCardDefId}));assert.deepEqual(run,before);}
 assert.deepEqual(getStage4EntryChoice(run),{entryVersion:'0.6.1',entryId:run.runId+':stage.04.entryGrant',choiceId:run.runId+':stage.04.connectorChoice',stageId:'stage.04',pending:true,cardDefIds:['card.and','card.but','card.because']});
 const grant=grantStage4Entry(run,{connectorCardDefId:'card.but'}),remove=grant.cardInstanceIds[0];delete run.cardInstances[remove];run.activeCardIds=run.activeCardIds.filter(id=>id!==remove);const after=structuredClone(run);assert.equal(getStage4EntryChoice(run),null);grantStage4Entry(run);assert.deepEqual(run,after);
 const legacy=runFor('legacy','0.6.0');legacy.progress=before.progress;assert.equal(getStage4EntryChoice(legacy),null);assert.deepEqual(grantStage4Entry(legacy).cardDefIds,['card.and','card.because','card.think','card.that']);
});
test('0.6.1 all three shops have exactly one final operation; previews/reentry do not reroll, removal prices carry forward',()=>{
 const run=runFor(),initial=structuredClone(run.rng);for(const [stage,expectedRunes,expectedWords,removalPrice]of [['stage.02',1,1,6],['stage.04',2,2,8],['stage.06',2,2,10]]){
  const shop=enter(run,stage),cards=shop.inventory.filter(x=>x.kind==='CARD');assert.equal(shop.shopVersion,'0.6.1');assert.equal(shop.inventory.filter(x=>x.kind==='RUNE').length,expectedRunes);assert.equal(cards.filter(x=>cardDefinition(x.cardDefId,run.version).cardKind!=='OPERATION').length,expectedWords);assert.equal(cards.filter(x=>cardDefinition(x.cardDefId,run.version).cardKind==='OPERATION').length,1);assert.equal(cards.at(-1).role,'DEDICATED_OPERATION');assert.equal(cards[0].role,'LOCAL_SYNTAX_RELEVANT');assert.equal(shop.services.REMOVE.price,removalPrice);assert.equal(validateSkyShops(run),true);
  const frozen=structuredClone(run);createShop(run);assert.deepEqual(run,frozen);const item=cards.at(-1);assert.equal(item.price,cardDefinition(item.cardDefId,run.version).price);assert.equal(buyShopItem(run,'stale',item.itemId).ok,false);assert.deepEqual(run,frozen);
  const target=run.activeCardIds.at(-1);assert.equal(useShopService(run,shop.shopId,'REMOVE',{targetCardInstanceId:target,confirmRemoval:true}).ok,true);assert.equal(validateSkyShops(run),true);assert.equal(closeShop(run,shop.shopId).ok,true);
 }
 for(const key of ['deck','reward','encounter'])assert.deepEqual(run.rng[key],initial[key]);
});
test('0.6.1 uniform dedicated slot draws once and all seven definitions are reachable across deterministic seeds',()=>{
 const seen=new Set();for(let i=0;i<140;i++){const run=runFor('shop.pool.'+i),shop=enter(run,'stage.02'),trace=shop.trace.find(t=>t.kind==='DEDICATED_OPERATION_DRAW');assert.deepEqual(trace.candidateIds,permanentIds);seen.add(trace.cardDefId);assert.equal(shop.trace.filter(t=>t.kind==='DEDICATED_OPERATION_DRAW').length,1);assert.ok(!shop.trace.some(t=>t.kind==='CARD_KIND_DRAW'));}
 assert.deepEqual([...seen].sort(),[...permanentIds].sort());
});
test('0.6.1 each operation buys/polishes once for 8 gold, stops at +1 and never advertises WORD attack score',()=>{
 for(const id of permanentIds){const run=runFor(id),target=own(run,id),word=own(run,'card.book',2);const shop=enter(run,'stage.02'),before=structuredClone(run);assert.equal(useShopService(run,shop.shopId,'POLISH').needsTarget,true);assert.deepEqual(run,before);const result=useShopService(run,shop.shopId,'POLISH',{targetCardInstanceId:target});assert.equal(result.ok,true);assert.equal(run.economy.gold,before.economy.gold-8);assert.equal(run.cardInstances[target].polishLevel,1);assert.equal(result.rewardEffect.cardKind,'OPERATION');assert.equal(result.rewardEffect.beforeScore,undefined);assert.equal(result.rewardEffect.afterScore,undefined);assert.equal(validateSkyShops(run),true);assert.equal(canPolish(run.cardInstances[target],run.version),false);const done=structuredClone(run);assert.equal(useShopService(run,shop.shopId,'POLISH',{targetCardInstanceId:word}).ok,false);assert.deepEqual(run,done);
  // A later visit cannot raise an operation to +2 but still permits WORD +2 -> +3.
  closeShop(run,shop.shopId);const next=enter(run,'stage.04'),nextBefore=structuredClone(run);assert.equal(useShopService(run,next.shopId,'POLISH',{targetCardInstanceId:target}).ok,false);assert.deepEqual(run,nextBefore);assert.equal(useShopService(run,next.shopId,'POLISH',{targetCardInstanceId:word}).ok,true);assert.equal(run.cardInstances[word].polishLevel,3);assert.equal(validateSkyShops(run),true);
 }
});
test('0.6.1 shop validation rejects missing/second operation slots, bad prices and forged polish levels',()=>{
 const run=runFor();enter(run,'stage.02');for(const tamper of [r=>r.shop.inventory.at(-1).cardDefId='card.book',r=>r.shop.inventory[1].cardDefId='card.operation.recycle',r=>r.shop.inventory.at(-1).price=99]){const bad=structuredClone(run);tamper(bad);assert.throws(()=>validateSkyShops(bad));}
 const target=own(run,'card.operation.supply');assert.equal(useShopService(run,run.shop.shopId,'POLISH',{targetCardInstanceId:target}).ok,true);const bad=structuredClone(run);bad.shop.services.POLISH.afterLevel=2;assert.throws(()=>validateSkyShops(bad));
});
test('0.6.1 reward operation branch retains 20/80, reaches every rarity member and never enters protected/intro slots',()=>{
 const seen=new Set();for(let i=0;i<240;i++){const run=runFor('reward.pool.'+i);for(const rarity of ['COMMON','UNCOMMON','RARE']){const trace=[],card=selectOperation(run,rarity,'IMPLEMENTED_POOL_WILDCARD',new Set(),run.rng.reward,trace);assert.deepEqual(trace[0].weights,{OPERATION:20,WORD:80});if(card)seen.add(card.id);const before=structuredClone(run.rng.reward);assert.equal(selectOperation(run,rarity,'LOCAL_SYNTAX_RELEVANT',new Set(),run.rng.reward,[]),null);assert.deepEqual(run.rng.reward,before);}
  const intro=runFor('intro.'+i);intro.progress={stageId:'stage.01',roundIndex:0,battleNumber:1};intro.tutorial.isIntroRun=true;const offer=createRewardOffer(intro,{firstRuneIntroSeen:false});assert.ok(offer.choices.every(c=>c.kind==='CARD'&&cardDefinition(c.cardDefId,intro.version).cardKind!=='OPERATION'));assert.ok(!offer.trace.some(t=>t.kind==='CARD_KIND_DRAW'));
 }
 assert.deepEqual([...seen].sort(),[...permanentIds].sort());
});
test('0.6.1 mixed reward targets include all +0 operations, exclude +1 and commit polish only once',()=>{
 let tested=false;for(let i=0;i<100;i++){const run=runFor('reward.polish.'+i);const targets=permanentIds.map(id=>own(run,id)),maxed=own(run,'card.operation.supply',1),word=own(run,'card.book',2);const offer=createRewardOffer(run,{firstRuneIntroSeen:true}),operations=offer.choices.filter(c=>c.kind==='CARD'&&cardDefinition(c.cardDefId,run.version).cardKind==='OPERATION');assert.ok(operations.length<=1);const choice=offer.choices.find(c=>c.kind==='SERVICE'&&c.serviceKind==='POLISH');if(!choice)continue;assert.ok(targets.every(id=>choice.targetCardIds.includes(id)));assert.ok(!choice.targetCardIds.includes(maxed));assert.ok(choice.targetCardIds.includes(word));const before=structuredClone(run);assert.equal(resolveReward(run,offer.offerId,choice.choiceId).needsTarget,true);assert.deepEqual(run,before);const result=resolveReward(run,offer.offerId,choice.choiceId,{targetCardInstanceId:targets[0]});assert.equal(result.ok,true);assert.equal(run.cardInstances[targets[0]].polishLevel,1);assert.equal(result.rewardEffect.cardKind,'OPERATION');assert.equal(result.rewardEffect.beforeScore,undefined);const after=structuredClone(run);assert.equal(resolveReward(run,offer.offerId,choice.choiceId,{targetCardInstanceId:targets[0]}).ok,false);assert.deepEqual(run,after);tested=true;break;}
 assert.equal(tested,true);
});

test('0.6.1 P016/P017 pending Stage4 choice serializes and safely restores without granting or rerolling',()=>{
 const c=assignedStage4Intro(),before=c.getState();act(c,{type:'ENTER_STAGE',expectedRevision:before.revision,commandId:'entry.pending'});const pending=c.getState();assert.equal(pending.status,'STAGE_INTRO');assert.equal(pending.entryChoice.pending,true);assert.equal(pending.entryGrants['stage.04'],undefined);assert.deepEqual(pending.activeCardIds,before.activeCardIds);assert.deepEqual(pending.rng,before.rng);assert.deepEqual(pending.shop,before.shop);assert.equal(canSaveRun(pending),true);assert.equal(validateRunState(pending,registryForVersion('0.6.1')),true);
 const restored=new RunController({profile:c.getProfile()});assert.equal(restored.restoreRun(JSON.parse(JSON.stringify(pending))).ok,true);assert.deepEqual(restored.getState(),pending);assert.deepEqual(getStage4EntryChoice(restored.getState()),pending.entryChoice);assert.deepEqual(restored.getState(),pending,'view/close/resume leaves pending choice unchanged');
 for(const tamper of [r=>r.entryChoice.cardDefIds.pop(),r=>r.entryChoice.choiceId='foreign',r=>r.entryChoice.entryId='foreign',r=>r.entryChoice.pending=false]){const bad=structuredClone(pending);tamper(bad);assert.throws(()=>validateRunState(bad,registryForVersion('0.6.1')));}
});
test('0.6.1 P018/P019 connector command is atomic, revision checked, one-shot and never regrants after shop removal',()=>{
 const c=assignedStage4Intro();act(c,{type:'ENTER_STAGE'});const pending=c.getState(),choice=pending.entryChoice;
 const command={type:'CHOOSE_STAGE4_CONNECTOR',entryId:choice.entryId,choiceId:choice.choiceId,cardDefId:'card.but',expectedRevision:pending.revision,commandId:'connector.once'};
 for(const invalid of [{...command,choiceId:'wrong'},{...command,entryId:'wrong'},{...command,expectedRevision:pending.revision-1},{...command,cardDefId:'card.that'}])noChange(c,invalid);
 act(c,command);const chosen=c.getState();assert.equal(chosen.status,'SHOP');assert.equal(chosen.entryChoice.pending,false);assert.equal(chosen.entryChoice.selectedCardDefId,'card.but');assert.ok(chosen.entryGrants['stage.04'].cardDefIds.includes('card.but'));assert.ok(chosen.entryGrants['stage.04'].cardDefIds.length<=3);assert.equal(chosen.shopHistory.length,1);assert.equal(validateRunState(chosen,registryForVersion('0.6.1')),true);
 for(const stream of ['deck','reward','encounter'])assert.deepEqual(chosen.rng[stream],pending.rng[stream]);noChange(c,command);noChange(c,{...command,commandId:'connector.new',expectedRevision:chosen.revision});noChange(c,{type:'ENTER_STAGE'});
 const target=chosen.entryGrants['stage.04'].cardInstanceIds[chosen.entryGrants['stage.04'].cardDefIds.indexOf('card.but')];act(c,{type:'SHOP_SERVICE',shopId:chosen.shop.shopId,serviceKind:'REMOVE',targetCardInstanceId:target,confirmRemoval:true});const removed=c.getState();assert.ok(!removed.activeCardIds.includes(target));noChange(c,{...command,commandId:'regrant',expectedRevision:removed.revision});assert.equal(getStage4EntryChoice(removed),null);assert.equal(validateRunState(removed,registryForVersion('0.6.1')),true);
 const restored=new RunController({initialState:JSON.parse(JSON.stringify(removed)),profile:c.getProfile()});assert.deepEqual(restored.getState(),removed);noChange(restored,{type:'ENTER_STAGE'});
});
test('0.6.1 existing direct connector enters shop immediately, with no pending choice or duplicate grant',()=>{
 const c=assignedStage4Intro({connector:'or'}),before=c.getState();act(c,{type:'ENTER_STAGE'});const after=c.getState();assert.equal(after.status,'SHOP');assert.ok(!after.entryChoice?.pending);assert.equal(after.entryGrants['stage.04'].selectedConnectorCardDefId,null);assert.ok(after.entryGrants['stage.04'].cardDefIds.every(id=>['card.think','card.that'].includes(id)));assert.ok(after.activeCardIds.length-before.activeCardIds.length<=2);assert.equal(validateRunState(after,registryForVersion('0.6.1')),true);noChange(c,{type:'ENTER_STAGE'});
});
test('0.6.1 saved manifest and policy tags cannot silently reduce the seven-operation scope or inherit old policies',()=>{
 const c=assignedStage4Intro(),valid=c.getState();for(const tamper of [s=>s.contentManifest.cardDefIds=s.contentManifest.cardDefIds.filter(id=>id!=='card.operation.nounSearch'),s=>s.contentVersions.operation='0.4.0',s=>delete s.contentVersions.entry,s=>s.contentVersions.runes='0.3.0']){const bad=structuredClone(valid);tamper(bad);assert.throws(()=>validateRunState(bad,registryForVersion('0.6.1')));}
});
