import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RunController} from './helpers/legacy-061-controller.js';
import {validateRunState,canSaveRun,newProfile} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';
import {cardKind,canPolish} from '../src/data/cardCatalog.js';
import {operationSpec,operationCardsForVersion} from '../src/data/operationSpec.js';
import {operationAvailability,searchCandidates} from '../src/game/operations.js';
import {assertRunInvariants} from '../src/game/invariants.js';
import {randomInt} from '../src/game/rng.js';
import {isTurnSealed} from '../src/game/turnHandSeal.js';
import {assigned061,grantOperation,assignPiles} from './helpers/ui-061-state.js';
import {grantStage2Entry,createShop,closeShop} from '../src/game/shop.js';
import {getStage4EntryChoice,grantStage4Entry} from '../src/game/skyIslands.js';
import {grantStage5Entry,DESERT_PACKS} from '../src/game/wishDesert.js';
import {grantStage6Entry,SNOW_PACKS} from '../src/game/mirrorSnowfield.js';
import {operationTargetIds} from '../src/game/operationResolution.js';
import {createFrostSupply} from '../src/game/frostCards.js';

const language=registryForVersion('0.6.1'),cases=JSON.parse(readFileSync(new URL('./fixtures/v061-04_Operation_Cases_0.6.1.json',import.meta.url),'utf8')).cases;
const act=(c,command)=>{const result=c.dispatch(command);assert.equal(result.ok,true,`${command.type}: ${result.message}`);return result;};
const noChange=(c,command)=>{const before=c.getState(),undo=structuredClone(c.undo);assert.equal(c.dispatch(command).ok,false);assert.deepEqual(c.getState(),before);assert.deepEqual(c.undo,undo);};
/** Assigned physical piles, never a natural campaign/starting-deck claim. Real Controller effects follow. */
function fixture({cards,hand=[],draw=[],discard=[],seed='ops061'}={}){
 const c=assigned061(seed),s=c.getState();s.activeCardIds=Object.keys(cards);s.cardInstances=Object.fromEntries(Object.entries(cards).map(([id,value])=>{const [cardDefId,polishLevel=0]=Array.isArray(value)?value:[value];return[id,{instanceId:id,cardDefId,polishLevel,specialEffectId:null}];}));Object.assign(s.combat,{handIds:[...hand],drawIds:[...draw],discardIds:[...discard],sentenceSlots:[],exhaustedIds:[],operationHistory:[],operationSequence:0,pendingOperationId:null,battleDirty:true});c._state=s;assertRunInvariants(s,language);assert.equal(validateRunState(s,language),true);return c;
}
function command(c,sourceCardId,targetCardId){const s=c.getState();return {type:'USE_OPERATION',sourceCardId,...(targetCardId?{targetCardId}:{}),expectedRevision:s.revision,battleId:s.combat.enemyState.id,commandId:`ops.${s.revision}.${sourceCardId}`};}
function use(c,source,target){const result=act(c,command(c,source,target));assert.equal(canSaveRun(c.getState()),false);act(c,{type:'FINISH_OPERATION',effectId:result.operationEffect.effectId});assertRunInvariants(c.getState(),language);assert.equal(validateRunState(c.getState(),language),true);return result.operationEffect;}
function genericCase(item){
 const type=item.cardDefId.split('.').at(-1),polish=item.polish??0,handBefore=item.handBefore??6,cards={source:[item.cardDefId,polish]},hand=['source'];
 for(let i=1;i<handBefore;i++){cards['h'+i]='card.book';hand.push('h'+i);}
 const targetDefs={supply:['card.book','card.operation.search','card.good'],search:['card.book','card.good','card.run'],nounSearch:['card.book','card.she','card.friend'],verbSearch:['card.be','card.have','card.read'],adjectiveSearch:['card.good','card.big','card.happy'],connectorSearch:['card.and','card.because','card.that'],recycle:['card.book','card.operation.search','card.good']}[type];
 let targetIds=[];if(item.matchingTargets!==0)for(const [i,def]of targetDefs.entries()){const id='t'+i;cards[id]=def;targetIds.push(id);}
 const c=fixture({cards,hand,draw:type==='recycle'?[]:targetIds,discard:type==='recycle'?targetIds:[],seed:item.id});return {c,target:targetIds[0]};
}
function assignedLateBattle(stage=6,{openingLevel=0,noDegreeMaterial=false,permanentSearch=false}={}){
 const c=assigned061('061.late.'+stage),s=c.getState();s.combat=null;s.economy.gold=100;s.status='STAGE_INTRO';s.runes.slotLimit=4;s.milestoneIds=['STAGE1_CLEAR','STAGE2_CLEAR','STAGE3_CLEAR','STAGE4_CLEAR',...(stage===6?['STAGE5_CLEAR']:[])];s.eligibility.runOwnUnlocks=['pack.svoo','rune.svoo','pack.clauseLink',...DESERT_PACKS,...(stage===6?SNOW_PACKS:[])];
 for(const [id,battle]of [['stage.02',4],['stage.04',13]]){s.progress={stageId:id,roundIndex:0,battleNumber:battle,contentBoundary:null};if(id==='stage.02')grantStage2Entry(s);else {const choice=getStage4EntryChoice(s);grantStage4Entry(s,{connectorCardDefId:choice?'card.and':null});if(choice)s.entryChoice={...choice,pending:false,selectedCardDefId:'card.and'};}createShop(s);s.status='SHOP';closeShop(s,s.shop.shopId);s.status='STAGE_INTRO';}
 s.progress={stageId:'stage.05',roundIndex:0,battleNumber:18,contentBoundary:null};grantStage5Entry(s);
 if(stage===6){s.progress={stageId:'stage.06',roundIndex:0,battleNumber:23,contentBoundary:null};grantStage6Entry(s);createShop(s);s.status='SHOP';closeShop(s,s.shop.shopId);}
 s.progress={stageId:'stage.0'+stage,roundIndex:4,battleNumber:stage===6?27:22,contentBoundary:null};s.status='STAGE_INTRO';
 if(openingLevel){s.runes.orderedInstanceIds=['opening.rune'];s.runes.instances={'opening.rune':{instanceId:'opening.rune',runeId:'rune.openingHand',level:openingLevel}};}
 if(noDegreeMaterial)for(const id of s.activeCardIds){const def=language.cardById[s.cardInstances[id].cardDefId];if(language.lexemeById[def?.lexemeId]?.comparisonPolicy?.gradable)s.cardInstances[id].cardDefId='card.book';}
 if(permanentSearch){const id='owned.permanent.search';s.activeCardIds.push(id);s.cardInstances[id]={instanceId:id,cardDefId:'card.operation.search',polishLevel:1,specialEffectId:null};}
 c._beginBattle(s);c._state=s;assert.equal(validateRunState(s,language),true);return c;
}
for(const item of cases.slice(0,35))test(`0.6.1 ${item.id}: ${item.name}`,()=>{
 const {c,target}=genericCase(item),before=c.getState(),source=before.cardInstances.source;
 if(item.attemptedPolish){assert.equal(canPolish(source,before.version),false);const bad=structuredClone(before);bad.cardInstances.source.polishLevel=item.attemptedPolish;assert.throws(()=>validateRunState(bad,language));assert.deepEqual(c.getState(),before);return;}
 if(item.matchingTargets===0){assert.equal(operationAvailability(before,'source').ok,false);noChange(c,command(c,'source',target));return;}
 const e=use(c,'source',item.cardDefId==='card.operation.search'?target:undefined),after=c.getState();assert.equal(e.actualDrawCount,item.expectedCount);assert.equal(after.combat.handIds.length,item.expectedHandAfter);if(item.expectedDestination)assert.equal(e.postUseDestination,item.expectedDestination);assert.equal(after.combat.turnsRemaining,before.combat.turnsRemaining);assert.equal(after.combat.exchangesRemaining,before.combat.exchangesRemaining);assert.equal(after.economy.gold,before.economy.gold);assert.deepEqual(after.activeCardIds,before.activeCardIds);assert.equal(e.drawnCardIds.includes('source'),false);
 for(const stream of ['reward','shop','encounter'])assert.deepEqual(after.rng[stream],before.rng[stream]);
 if(!['card.operation.supply','card.operation.recycle'].includes(item.cardDefId))assert.deepEqual(after.rng.deck,before.rng.deck);
});
const wordMap={v1:'run',n1:'book',a1:'good',p1:'she',n2:'friend',c1:'and',be1:'be',have1:'have',and1:'and',reading1:'read',big1:'big',happy1:'happy',to1:'to',than1:'than',as1:'as',because1:'because'};
for(const item of cases.slice(35,41))test(`0.6.1 ${item.id}: ${item.name}`,()=>{
 const cards={source:[item.cardDefId,item.polish],...Object.fromEntries(item.before.drawIds.map(id=>[id,'card.'+wordMap[id]]))},c=fixture({cards,hand:['source'],draw:item.before.drawIds,seed:item.id}),before=c.getState(),e=use(c,'source');assert.deepEqual(e.drawnCardIds,item.expectedDrawnIds);assert.deepEqual(c.getState().combat.drawIds,item.expectedRemainingDrawIds);assert.deepEqual(c.getState().rng,before.rng);
});
test('0.6.1 O042 canonical pronoun/degree/ING lexemes drive filters rather than old surface roles',()=>{
 for(const [operation,expected]of [['nounSearch',['her']],['verbSearch',['reading','be']],['adjectiveSearch',['bigger']]]){const c=fixture({cards:{source:['card.operation.'+operation,1],her:'card.she',bigger:'card.big',reading:'card.read',be:'card.be'},hand:['source'],draw:['her','bigger','reading','be']});assert.deepEqual(use(c,'source').drawnCardIds,expected);}
});
test('0.6.1 O043 DRAW-only adjective search does not reshuffle discard',()=>{const c=fixture({cards:{source:'card.operation.adjectiveSearch',n:'card.book',a:'card.good'},hand:['source'],draw:['n'],discard:['a']});noChange(c,command(c,'source'));});
test('0.6.1 O044/O045 resolving source stays out of its own reshuffle, or no-ops when alone',()=>{
 const c=fixture({cards:{supply1:['card.operation.supply',1],noun1:'card.book'},hand:['supply1'],discard:['noun1']}),e=use(c,'supply1');assert.deepEqual(e.drawnCardIds,['noun1']);assert.deepEqual(c.getState().combat.handIds,['noun1']);assert.deepEqual(c.getState().combat.discardIds,['supply1']);assert.deepEqual(c.getState().combat.exhaustedIds,[]);
 const alone=fixture({cards:{supply1:['card.operation.supply',1]},hand:['supply1']});noChange(alone,command(alone,'supply1'));
});
test('0.6.1 O046/O069 60 finite same-turn manual supply reuses have unique receipts and no forced cooldown',()=>{
 const c=fixture({cards:{s1:['card.operation.supply',1],s2:['card.operation.supply',1]},hand:['s1'],draw:['s2']}),before=c.getState();
 for(let i=0;i<60;i++){const id=i%2?'s2':'s1',e=use(c,id);assert.ok(!e.drawnCardIds.includes(id));assert.equal(e.postUseDestination,'DISCARD');}
 const after=c.getState();assert.equal(after.combat.operationHistory.length,60);assert.equal(new Set(after.combat.operationHistory.map(e=>e.effectId)).size,60);assert.equal(new Set(after.combat.operationHistory.map(e=>e.commandId)).size,60);assert.equal(after.combat.operationHistory.filter(e=>e.sourceCardId==='s1').length,30);assert.deepEqual(after.combat.exhaustedIds,[]);assert.equal(after.combat.turnsRemaining,before.combat.turnsRemaining);assert.equal(after.combat.exchangesRemaining,before.combat.exchangesRemaining);assert.deepEqual(after.activeCardIds,before.activeCardIds);
 const copy=new RunController({initialState:JSON.parse(JSON.stringify(after)),profile:c.getProfile()});assert.deepEqual(copy.getState(),after);use(copy,'s1');assert.equal(copy.getState().combat.operationHistory.length,61);
});
test('0.6.1 O047/O060 direct-search +1 can be recovered by recycle then reused with repeated source history',()=>{
 const c=fixture({cards:{s1:['card.operation.search',1],r1:'card.operation.recycle',w1:'card.book',w2:'card.friend'},hand:['s1','r1'],draw:['w1','w2']});use(c,'s1','w1');assert.deepEqual(use(c,'r1').drawnCardIds,['s1']);use(c,'s1','w2');const after=c.getState();assert.deepEqual(after.combat.operationHistory.map(e=>e.sourceCardId),['s1','r1','s1']);assert.deepEqual(after.combat.exhaustedIds,['r1']);assert.deepEqual(after.combat.discardIds,['s1']);assert.equal(validateRunState(after,language),true);
});
test('0.6.1 O048/O049 exhausted one-shot sources reject another use; different copies each work once',()=>{
 const c=fixture({cards:{s1:'card.operation.supply',s2:'card.operation.supply',n1:'card.book',n2:'card.friend',n3:'card.school',n4:'card.music'},hand:['s1','s2'],draw:['n1','n2','n3','n4']});use(c,'s1');noChange(c,command(c,'s1'));use(c,'s2');assert.deepEqual(c.getState().combat.exhaustedIds,['s1','s2']);
 for(const name of ['nounSearch','verbSearch','adjectiveSearch','connectorSearch','recycle']){const item={cardDefId:'card.operation.'+name,polish:1,handBefore:6},f=genericCase(item);use(f.c,'source');noChange(f.c,command(f.c,'source'));}
});
test('0.6.1 O050/O051/O068 committed operation settles once through duplicate commands, cancel and repeated finish',()=>{
 const c=fixture({cards:{s:['card.operation.supply',1],n:'card.book',n2:'card.friend'},hand:['s'],draw:['n','n2']}),cmd=command(c,'s'),e=act(c,cmd).operationEffect,committed=c.getState();assert.equal(canSaveRun(committed),false);noChange(c,cmd);act(c,{type:'CANCEL_OPERATION'});assert.deepEqual(c.getState(),committed);act(c,{type:'FINISH_OPERATION',effectId:e.effectId});const done=c.getState();assert.deepEqual(done.combat.handIds,committed.combat.handIds);assert.deepEqual(done.combat.discardIds,committed.combat.discardIds);assert.deepEqual(done.rng,committed.rng);noChange(c,{type:'FINISH_OPERATION',effectId:e.effectId});noChange(c,cmd);
});
test('0.6.1 O052/O053 direct search open/cancel is state/RNG/Undo neutral and stale target/revision fails',()=>{
 const c=fixture({cards:{s:'card.operation.search',h:'card.i',n:'card.book',n2:'card.friend'},hand:['s','h'],draw:['n2','n']});act(c,{type:'ADD_CARD',cardId:'h'});const before=c.getState(),undo=structuredClone(c.undo);const open=act(c,{type:'OPEN_OPERATION',sourceCardId:'s'});assert.deepEqual(open.candidates.map(x=>x.cardInstanceId),['n','n2']);assert.deepEqual(c.getState(),before);act(c,{type:'CANCEL_OPERATION'});assert.deepEqual(c.getState(),before);assert.deepEqual(c.undo,undo);noChange(c,{...command(c,'s','n'),expectedRevision:before.revision-1});noChange(c,command(c,'s','h'));noChange(c,command(c,'s','unknown'));
});
test('0.6.1 O055 ordinary supply reshuffles unused and reusable operations together with WORD cards',()=>{
 const c=fixture({cards:{s:['card.operation.supply',1],unused:'card.operation.search',reusable:['card.operation.supply',1],w:'card.book'},hand:['s'],discard:['unused','reusable','w']}),before=c.getState();const e=use(c,'s');assert.equal(e.actualDrawCount,2);assert.ok(e.drawnCardIds.every(id=>['unused','reusable','w'].includes(id)));assert.equal(c.getState().rng.deck.cursor-before.rng.deck.cursor,2);assert.equal(c.getState().combat.discardIds[0],'s');
});
test('0.6.1 O056/O058/O059 recycle clips partial targets and samples uniformly without replacement on deck RNG',()=>{
 const one=fixture({cards:{r:['card.operation.recycle',1],w:'card.book'},hand:['r'],discard:['w']});assert.deepEqual(use(one,'r').drawnCardIds,['w']);
 const a=fixture({cards:{r:['card.operation.recycle',1],x1:'card.book',x2:'card.friend',x3:'card.good',draw:'card.run'},hand:['r'],draw:['draw'],discard:['x1','x2','x3'],seed:'recycle.deterministic'}),saved=a.getState(),b=new RunController({initialState:JSON.parse(JSON.stringify(saved)),profile:a.getProfile()});
 const stream=structuredClone(saved.rng.deck),pool=['x1','x2','x3'],expected=[];for(let i=0;i<2;i++)expected.push(pool.splice(randomInt(stream,pool.length),1)[0]);
 const ea=use(a,'r'),eb=use(b,'r');assert.deepEqual(ea.drawnCardIds,expected);assert.deepEqual(eb,ea);assert.deepEqual(a.getState().rng.deck,stream);assert.deepEqual(a.getState().combat.drawIds,['draw']);assert.deepEqual(a.getState().combat.discardIds,pool);assert.deepEqual(a.getState(),b.getState());
 const two=fixture({cards:{r:['card.operation.recycle',1],x1:'card.book',x2:'card.friend'},hand:['r'],discard:['x1','x2']});assert.deepEqual([...use(two,'r').drawnCardIds].sort(),['x1','x2']);
});
test('0.6.1 O061/O062 stored receipts reject source/target/pile/count/RNG forgery',()=>{
 const c=fixture({cards:{s:['card.operation.search',1],r:'card.operation.recycle',w:'card.book',w2:'card.friend'},hand:['s','r'],draw:['w','w2']});use(c,'s','w');const valid=c.getState();
 for(const change of [e=>e.sourceSnapshot.polishLevel=0,e=>e.sourceSnapshot.lifetime='BATTLE',e=>e.sourceSnapshot.afterUseDestination='EXHAUSTED',e=>e.after.handIds.push('foreign'),e=>e.after.discardIds=[],e=>e.actualDrawCount=3,e=>e.drawnCardIds=['w2'],e=>e.targetCardId='w2',e=>e.after.rng.cursor++,e=>e.before.rng.state++,e=>e.cardSnapshots.s.polishLevel=0,e=>e.commandId='missing']){const bad=structuredClone(valid);change(bad.combat.operationHistory[0]);assert.throws(()=>validateRunState(bad,language));}
 assert.equal(validateRunState(valid,language),true);
});
test('0.6.1 O063 successful operation clears editing Undo without rolling back acquisition',()=>{
 const c=fixture({cards:{s:'card.operation.supply',h:'card.i',w:'card.book',w2:'card.friend'},hand:['s','h'],draw:['w','w2']});act(c,{type:'ADD_CARD',cardId:'h'});assert.equal(c.undo.length,1);use(c,'s');assert.equal(c.undo.length,0);noChange(c,{type:'UNDO'});
});
test('0.6.1 O064 operation copies cannot be submitted as attack WORDs or acquire forms',()=>{
 const c=fixture({cards:{s:'card.operation.supply',h:'card.i',w:'card.book'},hand:['s','h'],draw:['w']});noChange(c,{type:'ADD_CARD',cardId:'s'});noChange(c,{type:'SET_FORM',cardId:'s',formId:'form.i.subject'});use(c,'s');assert.equal(c.getState().combat.sentenceSlots.length,0);assert.ok(!c.getState().combat.handIds.includes('s'));
});
test('0.6.1 O054 direct search lists physical normal/frost WORDs only, excluding permanent/temporary operations',()=>{
 const c=assignedLateBattle(),search=grantOperation(c,'search'),recycle=grantOperation(c,'recycle'),s=c.getState(),support=s.combat.temporaryCardIds.find(id=>cardKind(s.cardInstances[id],s.version)==='OPERATION'),frost=s.combat.temporaryCardIds.find(id=>s.cardInstances[id].cardDefId==='card.too');assignPiles(c,{hand:[search],draw:[...s.activeCardIds,...s.combat.temporaryCardIds].filter(id=>id!==search)});
 const candidates=searchCandidates(c.getState());assert.ok(candidates.some(x=>x.cardInstanceId===frost));assert.ok(candidates.some(x=>s.activeCardIds.includes(x.cardInstanceId)));assert.ok(!candidates.some(x=>[support,recycle,search].includes(x.cardInstanceId)));assert.ok(candidates.every(x=>cardKind(c.getState().cardInstances[x.cardInstanceId],s.version)==='WORD'));assert.deepEqual(use(c,search,frost).drawnCardIds,[frost]);
});
test('0.6.1 O057 recycle only samples live discard: used reusable, unused operations and both temporary types',()=>{
 const c=assignedLateBattle(),recycle=grantOperation(c,'recycle',1),supply=grantOperation(c,'supply',1),unused=grantOperation(c,'nounSearch'),s=c.getState(),support=s.combat.temporaryCardIds.find(id=>cardKind(s.cardInstances[id],s.version)==='OPERATION'),frost=s.combat.temporaryCardIds.find(id=>s.cardInstances[id].cardDefId==='card.too'),word=s.activeCardIds.find(id=>cardKind(s.cardInstances[id],s.version)==='WORD');
 assignPiles(c,{hand:[supply,recycle]});use(c,supply);
 const afterSupply=c.getState();const discard=[supply,unused,word,support,frost];assignPiles(c,{hand:[recycle],discard});const before=c.getState(),spec=operationSpec('card.operation.recycle',1,'PERMANENT','0.6.1');assert.deepEqual(operationTargetIds(before.combat,before.cardInstances,before.version,spec),discard);const e=use(c,recycle);assert.equal(e.drawnCardIds.length,2);assert.equal(new Set(e.drawnCardIds).size,2);assert.ok(e.drawnCardIds.every(id=>discard.includes(id)));assert.ok(!e.drawnCardIds.includes(recycle));assert.deepEqual(c.getState().combat.exhaustedIds,[recycle]);assert.ok(afterSupply.combat.operationHistory[0].postUseDestination==='DISCARD');
 const bad=c.getState();const temp=bad.cardInstances[support];temp.temporary.battleId='battle.06.04';assert.throws(()=>validateRunState(bad,language));
});
test('0.6.1 O065 Sphinx sealed WORD can exchange/recycle, and remains sealed without rerolling',()=>{
 const c=assignedLateBattle(5),recycle=grantOperation(c,'recycle'),s=c.getState(),sealed=s.combat.enemyState.bossMechanic.sealedCardId;assert.ok(sealed);const beforeSeal=structuredClone(s.combat.enemyState.bossMechanic),rng=structuredClone(s.rng.encounter);assignPiles(c,{hand:[sealed,recycle]});act(c,{type:'EXCHANGE',cardIds:[sealed]});assert.ok(c.getState().combat.discardIds.includes(sealed));assert.deepEqual(use(c,recycle).drawnCardIds,[sealed]);assert.ok(c.getState().combat.handIds.includes(sealed));assert.equal(isTurnSealed(c.getState(),sealed),true);noChange(c,{type:'ADD_CARD',cardId:sealed});assert.deepEqual(c.getState().combat.enemyState.bossMechanic,beforeSeal);assert.deepEqual(c.getState().rng.encounter,rng);
});
test('0.6.1 O066/O067 support search uses one live WORD, never breaks crystals, cannot polish and survives save until cleanup',()=>{
 const c=assignedLateBattle(),s=c.getState(),support=s.combat.temporaryCardIds.find(id=>cardKind(s.cardInstances[id],s.version)==='OPERATION'),frost=s.combat.temporaryCardIds.find(id=>s.cardInstances[id].cardDefId==='card.too'),permanent=[...s.activeCardIds],mechanic=structuredClone(s.combat.enemyState.bossMechanic);assert.ok(s.combat.handIds.includes(support));assert.equal(s.combat.handIds.length,7);assert.equal(canPolish(s.cardInstances[support],s.version),false);noChange(c,{type:'ADD_CARD',cardId:support});
 assignPiles(c,{hand:[support]});const e=use(c,support,frost);assert.equal(e.postUseDestination,'EXHAUSTED');assert.equal(e.sourceSnapshot.lifetime,'BATTLE');assert.deepEqual(e.drawnCardIds,[frost]);assert.deepEqual(c.getState().combat.enemyState.bossMechanic,mechanic);assert.deepEqual(c.getState().activeCardIds,permanent);assert.ok(c.getState().combat.exhaustedIds.includes(support));
 const saved=c.getState(),restored=new RunController({initialState:JSON.parse(JSON.stringify(saved)),profile:c.getProfile()});assert.deepEqual(restored.getState(),saved);assert.equal(restored.getState().combat.temporaryCardIds.filter(id=>cardKind(restored.getState().cardInstances[id],saved.version)==='OPERATION').length,1);const bad=structuredClone(saved);bad.cardInstances[support].polishLevel=1;assert.throws(()=>validateRunState(bad,language));
 while(c.getState().status==='BATTLE')act(c,{type:'PREPARE',confirmed:true});const ended=c.getState();assert.equal(ended.status,'DEFEAT');assert.deepEqual(ended.combat.temporaryCardIds,[]);assert.ok(!ended.cardInstances[support]);assert.ok(ended.combat.operationHistory[0].cardSnapshots[support]);assert.equal(validateRunState(ended,language),true);assert.deepEqual(ended.activeCardIds,permanent);
});
test('0.6.1 O055/O057 real shatter/exhausted cards stay out of recycle while unused frost reshuffles normally',()=>{
 const c=assignedLateBattle(),recycle=grantOperation(c,'recycle',1),supply=grantOperation(c,'supply',1),s=c.getState(),support=s.combat.temporaryCardIds.find(id=>cardKind(s.cardInstances[id],s.version)==='OPERATION'),broken=s.combat.temporaryCardIds.find(id=>s.cardInstances[id].cardDefId==='card.too'),unused=s.combat.temporaryCardIds.find(id=>s.cardInstances[id].cardDefId==='card.than');
 assignPiles(c,{hand:[support]});use(c,support,broken);act(c,{type:'ADD_CARD',cardId:broken});const attack=act(c,{type:'SUBMIT'}).resolution;assert.equal(attack.finalPower,0);act(c,{type:'FINISH_PRESENTATION',attackId:attack.attackId});assert.ok(c.getState().combat.shatteredTemporaryIds.includes(broken));assert.ok(c.getState().combat.exhaustedIds.includes(support));
 const word=c.getState().activeCardIds.find(id=>cardKind(c.getState().cardInstances[id],'0.6.1')==='WORD');assignPiles(c,{hand:[recycle],discard:[unused,word]});let state=c.getState(),spec=operationSpec('card.operation.recycle',1,'PERMANENT','0.6.1');assert.deepEqual(operationTargetIds(state.combat,state.cardInstances,state.version,spec),[unused,word]);const e=use(c,recycle);assert.deepEqual([...e.drawnCardIds].sort(),[unused,word].sort());assert.ok(c.getState().combat.shatteredTemporaryIds.includes(broken));
 for(const tamper of [r=>{r.combat.shatteredTemporaryIds=[];r.combat.discardIds.push(broken);},r=>{r.combat.exhaustedIds=r.combat.exhaustedIds.filter(id=>id!==support);r.combat.discardIds.push(support);}]){const bad=c.getState();tamper(bad);assert.throws(()=>validateRunState(bad,language));}
 // Separate valid scene: keep the original unused frost copy in the pre-existing discard.
 const d=assignedLateBattle(),supplyId=grantOperation(d,'supply',1),ds=d.getState(),frost=ds.combat.temporaryCardIds.find(id=>ds.cardInstances[id].cardDefId==='card.too'),all=[...ds.activeCardIds,...ds.combat.temporaryCardIds].filter(id=>id!==supplyId);assignPiles(d,{hand:[supplyId],draw:[],discard:all});const effect=use(d,supplyId);assert.ok(effect.before.discardIds.includes(frost));assert.ok(!effect.before.discardIds.includes(supplyId));assert.ok(effect.drawnCardIds.every(id=>all.includes(id)));assert.ok(!effect.drawnCardIds.includes(supplyId));
});
test('0.6.1 live source polish must agree with its committed receipt while still in the same battle',()=>{
 const c=fixture({cards:{s:['card.operation.supply',1],w:'card.book'},hand:['s'],draw:['w']});use(c,'s');const bad=c.getState();bad.cardInstances.s.polishLevel=0;assert.throws(()=>validateRunState(bad,language));
 const ordinary=fixture({cards:{s:'card.operation.supply',w:'card.book'},hand:['s'],draw:['w']});use(ordinary,'s');const raised=ordinary.getState();raised.cardInstances.s.polishLevel=1;assert.throws(()=>validateRunState(raised,language));
});
test('0.6.1 frost operation receipt cannot relabel an actual temporary source as permanent',()=>{
 const c=assignedLateBattle(),s=c.getState(),source=s.combat.temporaryCardIds.find(id=>cardKind(s.cardInstances[id],s.version)==='OPERATION'),word=s.combat.temporaryCardIds.find(id=>s.cardInstances[id].cardDefId==='card.too');assignPiles(c,{hand:[source]});use(c,source,word);const bad=c.getState(),e=bad.combat.operationHistory[0];e.sourceSnapshot.lifetime='PERMANENT';delete e.cardSnapshots[source].temporary;assert.throws(()=>validateRunState(bad,language));
});
test('0.6.1 cleanup retains enough frost identity to reject relabelled historical temporary snapshots',()=>{
 const c=assignedLateBattle(),s=c.getState(),source=s.combat.temporaryCardIds.find(id=>cardKind(s.cardInstances[id],s.version)==='OPERATION'),word=s.combat.temporaryCardIds.find(id=>s.cardInstances[id].cardDefId==='card.too');assignPiles(c,{hand:[source]});use(c,source,word);while(c.getState().status==='BATTLE')act(c,{type:'PREPARE',confirmed:true});const valid=c.getState();assert.equal(validateRunState(valid,language),true);
 for(const change of [e=>{e.sourceSnapshot.lifetime='PERMANENT';delete e.cardSnapshots[source].temporary;},e=>{e.cardSnapshots[word].cardDefId='card.book';}]){const bad=structuredClone(valid);change(bad.combat.operationHistory[0]);assert.throws(()=>validateRunState(bad,language));}
});
test('0.6.1 P034/P035 initial-hand rune keeps expansion, support respects cap and protects two crystal WORDs',()=>{
 for(const [level,base,count]of [[1,8,9],[3,10,10]]){const s=assignedLateBattle(6,{openingLevel:level}).getState(),c=s.combat,support=c.temporaryCardIds.find(id=>c.temporaryCardMeta[id].cardKind==='OPERATION'),trace=c.frostSupplyTrace.find(e=>e.kind==='FROST_SUPPORT_HAND');assert.equal(c.rulesSnapshot.initialHand,base);assert.equal(c.handIds.length,count);assert.ok(c.handIds.includes(support));assert.ok(c.handIds.filter(id=>c.temporaryCardMeta[id]?.crystalBearing).length>=2);assert.equal(new Set([...c.handIds,...c.drawIds]).size,s.activeCardIds.length+c.temporaryCardIds.length);if(base===10){assert.ok(trace.movedCardId);assert.equal(c.drawIds[0],trace.movedCardId);assert.ok(!c.temporaryCardMeta[trace.movedCardId]?.crystalBearing);}else assert.equal(trace.movedCardId,null);}
});
test('0.6.1 P036/P037/P038 permanent search never suppresses support; good fallback makes exactly nine or ten temporary copies',()=>{
 for(const noDegreeMaterial of [false,true]){const s=assignedLateBattle(6,{noDegreeMaterial,permanentSearch:true}).getState(),c=s.combat,operations=c.temporaryCardIds.filter(id=>c.temporaryCardMeta[id].cardKind==='OPERATION'),good=c.temporaryCardIds.filter(id=>s.cardInstances[id].cardDefId==='card.good');assert.equal(operations.length,1);assert.ok(c.handIds.includes(operations[0]));assert.equal(c.temporaryCardIds.filter(id=>c.temporaryCardMeta[id].crystalBearing).length,8);assert.equal(good.length,noDegreeMaterial?1:0);assert.equal(c.temporaryCardIds.length,noDegreeMaterial?10:9);assert.ok(s.activeCardIds.includes('owned.permanent.search'));assert.ok(!s.activeCardIds.includes(operations[0]));}
});
test('0.6.1 P043 a used permanent operation returns in the next actual battle',()=>{
 const c=fixture({cards:{s:'card.operation.supply',i:['card.i',3],run:['card.run',3],b:'card.book',b2:'card.friend'},hand:['s','i','run'],draw:['b','b2']});use(c,'s');assert.deepEqual(c.getState().combat.exhaustedIds,['s']);act(c,{type:'ADD_CARD',cardId:'i'});act(c,{type:'ADD_CARD',cardId:'run'});const result=act(c,{type:'SUBMIT'}).resolution;assert.equal(result.killed,true);act(c,{type:'FINISH_PRESENTATION',attackId:result.attackId});act(c,{type:'SKIP_REWARD',offerId:c.getState().reward.offerId});act(c,{type:'NEXT_BATTLE'});const s=c.getState();assert.equal(s.progress.battleNumber,2);assert.ok([...s.combat.handIds,...s.combat.drawIds].includes('s'));assert.deepEqual(s.combat.exhaustedIds,[]);assert.equal(s.cardInstances.s.cardDefId,'card.operation.supply');assert.equal(validateRunState(s,language),true);
});
test('0.6.1 P044/P046 legacy operation/frost policy and historical profile best score remain untouched',()=>{
 const old=operationCardsForVersion('0.6.0');assert.equal(old.length,2);for(const def of old){assert.equal(canPolish({cardDefId:def.id,polishLevel:0},'0.6.0'),false);assert.equal(operationSpec(def.id,0,'PERMANENT','0.6.0').afterUseDestination,'EXHAUSTED');}
 const r={version:'0.6.0',runId:'legacy.frost',progress:{stageId:'stage.06',roundIndex:4,battleNumber:27},activeCardIds:['good'],cardInstances:{good:{instanceId:'good',cardDefId:'card.good',polishLevel:0,specialEffectId:null}},vocabulary:{encounteredLexemeIds:[]}};const supply=createFrostSupply(r);assert.equal(supply.temporaryCardIds.length,8);assert.ok(supply.temporaryCardIds.every(id=>cardKind(r.cardInstances[id],r.version)==='WORD'));
 const profile={...newProfile('historical 8618'),version:'0.6.0',bestAttack:8618,grammarRecords:{'FRAME.SVOO':{count:1,firstSentence:'I give you a book.',bestSentence:'I give you a book.',bestPower:8618}},guidedTutorialCompletedVersion:'0.2.1'},c=new RunController({profile});act(c,{type:'NEW_RUN',config:{seed:'old.profile'}});assert.equal(c.getProfile().bestAttack,8618);assert.equal(c.getProfile().grammarRecords['FRAME.SVOO'].bestPower,8618);
});
