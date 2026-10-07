import test from 'node:test';
import assert from 'node:assert/strict';
import {newDesert,advanceAssigned,assignedAttack,act} from './helpers/desert-state.js';
import {RunController} from './helpers/legacy-05-controller.js';
import {RunController as LegacyController} from './helpers/legacy-04-controller.js';
import {newProfile,validateRunState,canSaveRun,applyProfileEvent,reviewDesertUnlocks} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';
import {grantStage5Entry,DESERT_PACKS} from '../src/game/wishDesert.js';
import {generateStarterDeck,VOCABULARY_MODES} from '../src/game/deck.js';
import {createShop} from '../src/game/shop.js';
import {getEncounter,stageForRun} from '../src/data/stages.js';
import {eligibleRewardCards,isStageRelevantCard,createRewardOffer} from '../src/game/rewards.js';
const language=registryForVersion('0.5.0');
test('0.5 assigned real-engine 22 boundaries keep two shops, four rune slots and idempotent Stage4/Stage5 events',()=>{
 const events=[],c=newDesert('desert.boundaries',{onProfileEvent:event=>events.push(event)}),r=advanceAssigned(c);
 assert.deepEqual(r.battles,Array.from({length:22},(_,i)=>i+1));assert.deepEqual(r.shops.map(s=>[s.stageId,s.inventory.length]),[['stage.02',3],['stage.04',5]]);
 assert.equal(r.state.status,'CONTENT_COMPLETE');assert.equal(r.state.progress.contentBoundary,'STAGE5_END');assert.equal(r.state.runes.slotLimit,4);assert.equal(r.state.shopHistory.length,1);assert.equal(r.state.shop.stageId,'stage.04');assert.equal(r.state.shop.closed,true);
 assert.equal(events.filter(e=>e.type==='STAGE4_CLEAR').length,1);assert.equal(events.filter(e=>e.type==='STAGE5_CLEAR').length,1);assert.ok(DESERT_PACKS.every(id=>r.state.eligibility.runOwnUnlocks.includes(id)));
 const p=c.getProfile();assert.equal(p.highestCompletedStage,5);assert.equal(p.stage4CompletedRunIds.length,1);assert.equal(p.stage5CompletedRunIds.length,1);assert.equal(p.storyClearCount,0);assert.ok(DESERT_PACKS.every(id=>p.unlocks.includes(id)));
 const before=c.getState();for(const command of [{type:'SKIP_REWARD',offerId:before.reward.offerId},{type:'NEXT_STAGE'},{type:'FINISH_PRESENTATION',attackId:before.stats.lastAttack.attackId},{type:'FINISH_OPERATION',effectId:'old'}]){assert.equal(c.dispatch(command).ok,false);assert.deepEqual(c.getState(),before);}
 assert.deepEqual(applyProfileEvent(p,{type:'STAGE5_CLEAR',runId:before.runId}),p);
 for(const s of r.states)if(canSaveRun(s)){assert.deepEqual(new RunController({initialState:JSON.parse(JSON.stringify(s))}).getState(),s);assert.equal(validateRunState(s,language),true);}
});
test('0.5 Stage4 victory grants packs before frozen boss reward; Stage5 enters directly without third shop or RNG grant',()=>{
 const c=newDesert('desert.entry-flow');advanceAssigned(c,{stopAtBattle:17});const before=c.getState();assert.ok(!before.milestoneIds.includes('STAGE4_CLEAR'));assert.ok(DESERT_PACKS.every(id=>!before.eligibility.runOwnUnlocks.includes(id)));
 assignedAttack(c,'I had played games and she will have played music');let s=c.getState();assert.equal(s.status,'REWARD');assert.ok(s.milestoneIds.includes('STAGE4_CLEAR'));assert.ok(DESERT_PACKS.every(id=>s.eligibility.runOwnUnlocks.includes(id)));const offer=structuredClone(s.reward),rng=structuredClone(s.rng);assert.equal(createRewardOffer(s,c.getProfile()).offerId,offer.offerId);assert.deepEqual(s.reward,offer);assert.deepEqual(s.rng,rng);
 act(c,{type:'SKIP_REWARD',offerId:s.reward.offerId});assert.equal(c.getState().status,'STAGE_CLEAR');act(c,{type:'NEXT_STAGE'});s=c.getState();assert.equal(s.status,'STAGE_INTRO');assert.equal(s.progress.battleNumber,18);assert.equal(canSaveRun(s),false);const shop=structuredClone(s.shop),history=structuredClone(s.shopHistory),shopRng=structuredClone(s.rng.shop),rewardRng=structuredClone(s.rng.reward);assert.throws(()=>createShop(s));act(c,{type:'ENTER_STAGE'});s=c.getState();assert.equal(s.status,'BATTLE');assert.equal(s.combat.enemyState.hp,520);assert.deepEqual(s.shop,shop);assert.deepEqual(s.shopHistory,history);assert.deepEqual(s.rng.shop,shopRng);assert.deepEqual(s.rng.reward,rewardRng);assert.equal(s.rng.encounter.cursor,0);assert.equal(canSaveRun(s),true);const entered=c.getState();assert.equal(c.dispatch({type:'ENTER_STAGE'}).ok,false);assert.deepEqual(c.getState(),entered);
});
test('0.5 entry checks every to / want-or-need / direct-gerund alternative and never regrants after removal',()=>{
 const candidates=['card.to','card.want','card.need','card.like','card.enjoy','card.finish'];
 for(const to of [false,true])for(const wish of [null,'card.want','card.need'])for(const gerund of [null,'card.like','card.enjoy','card.finish']){
  const c=newDesert(),s=c.getState();s.progress={stageId:'stage.05',roundIndex:0,battleNumber:18,contentBoundary:null};s.activeCardIds=s.activeCardIds.filter(id=>!candidates.includes(s.cardInstances[id].cardDefId));
  const owned=[...(to?['card.to']:[]),...(wish?[wish]:[]),...(gerund?[gerund]:[])];owned.forEach((cardDefId,i)=>{const id='capability.'+i;s.activeCardIds.push(id);s.cardInstances[id]={instanceId:id,cardDefId,polishLevel:0,specialEffectId:null};});
  // The dictionary and inactive instances are deliberately not proof of actual ownership.
  s.vocabulary.encounteredLexemeIds.push(...candidates.map(id=>language.cardById[id].lexemeId));const rng=structuredClone(s.rng),grant=grantStage5Entry(s);assert.deepEqual(grant.cardDefIds,[...(!to?['card.to']:[]),...(!wish?['card.want']:[]),...(!gerund?['card.enjoy']:[])]);assert.ok(grant.cardDefIds.length<=3);assert.deepEqual(s.rng,rng);for(const [i,id]of grant.cardInstanceIds.entries()){assert.ok(s.activeCardIds.includes(id));assert.equal(s.cardInstances[id].cardDefId,grant.cardDefIds[i]);assert.ok(s.vocabulary.encounteredLexemeIds.includes(language.cardById[grant.cardDefIds[i]].lexemeId));}
  const after=structuredClone(s);assert.deepEqual(grantStage5Entry(s),grant);assert.deepEqual(s,after);s.activeCardIds=s.activeCardIds.filter(id=>!grant.cardInstanceIds.includes(id));const removed=structuredClone(s);grantStage5Entry(s);assert.deepEqual(s,removed);
 }
});
test('0.5 entry duplicate ID failure is atomic before first addition and corrupt persisted grants fail closed',()=>{
 const c=newDesert(),s=c.getState();s.progress={stageId:'stage.05',roundIndex:0,battleNumber:18,contentBoundary:null};s.activeCardIds=[];s.cardInstances[`entry.${s.runId}.stage.05.card.1`]={instanceId:`entry.${s.runId}.stage.05.card.1`,cardDefId:'card.book',polishLevel:0,specialEffectId:null};const before=structuredClone(s);assert.throws(()=>grantStage5Entry(s));assert.deepEqual(s,before);
 advanceAssigned(c,{stopAtBattle:18});for(const mutate of [s=>delete s.entryGrants['stage.05'],s=>s.entryGrants['stage.05'].cardDefIds.push('card.will'),s=>s.entryGrants['stage.05'].applied=false,s=>s.milestoneIds=s.milestoneIds.filter(id=>id!=='STAGE4_CLEAR'),s=>s.eligibility.runOwnUnlocks=s.eligibility.runOwnUnlocks.filter(id=>id!=='pack.gerund'),s=>s.progress.contentBoundary='STAGE4_END']){const bad=c.getState();mutate(bad);assert.throws(()=>validateRunState(bad,language));}
});
test('0.5 fresh starter reuses unchanged 0.4 generator, resources and no new-word candidates',()=>{
 for(const vocabularyMode of VOCABULARY_MODES){const seed='desert.starter.'+vocabularyMode,profile={...newProfile('starter'),guidedTutorialCompletedVersion:'0.2.1'},c=new RunController({profile});act(c,{type:'NEW_RUN',config:{seed,vocabularyMode}});let s=c.getState();assert.equal(s.version,'0.5.0');const old=generateStarterDeck({seed,vocabularyMode,version:'0.4.0'});for(const key of ['cardInstances','activeCardIds','generationTrace','rng'])assert.deepEqual(s[key],old[key]);assert.equal(s.activeCardIds.length,28);assert.ok(s.activeCardIds.every(id=>!['card.enjoy','card.finish','card.hobby'].includes(s.cardInstances[id].cardDefId)));act(c,{type:'START_BATTLE'});s=c.getState();assert.equal(s.combat.enemyState.hp,77);assert.deepEqual(s.combat.rulesSnapshot,{startingDeckSize:28,initialHand:6,handLimit:10,turnDraw:3,discardActions:4,turnLimit:6,sentenceLimit:16,drawOnFirstTurnBeyondOpening:false,discardConsumesTurn:false,exchangeScope:'HAND_ONLY',drawClipping:'NO_DEFERRED_DRAW_CREDIT',discardRecycle:'MAY_INCLUDE_JUST_DISCARDED',winBeforeTurnExhaustion:true});assert.equal(s.rng.encounter.cursor,0);}
});
test('0.5 new campaign imports only explicit Stage4 completion, never changes a loaded slot snapshot',()=>{
 const clean={...newProfile('new'),guidedTutorialCompletedVersion:'0.2.1'},c=new RunController({profile:clean});act(c,{type:'NEW_RUN',config:{seed:'before.other.slot'}});act(c,{type:'START_BATTLE'});const frozen=c.getState(),profile=applyProfileEvent(c.getProfile(),{type:'STAGE4_CLEAR',version:'0.5.0',runId:'completed.other.slot'});assert.ok(c.setProfile(profile).ok);assert.deepEqual(c.getState(),frozen);assert.ok(c.restoreRun(frozen).ok);assert.ok(DESERT_PACKS.every(id=>!c.getState().eligibility.runStartUnlockBaseline.includes(id)));act(c,{type:'NEW_RUN',config:{seed:'after.other.slot'}});assert.ok(DESERT_PACKS.every(id=>c.getState().eligibility.runStartUnlockBaseline.includes(id)));
 const legitimate={...clean,stage4CompletedRunIds:['old.04.completed']};assert.ok(DESERT_PACKS.every(id=>reviewDesertUnlocks(legitimate).unlocks.includes(id)));for(const fake of [{...clean,highestCompletedStage:4},{...clean,displayName:'Stage4_CLEAR',bestAttack:99999}])assert.ok(DESERT_PACKS.every(id=>!reviewDesertUnlocks(fake).unlocks.includes(id)));
});
test('0.5 keeps 0.4 endpoint and encounter/rune/shop policies; new reward words and Stage5 relevance are versioned',()=>{
 const legacy=new LegacyController({profile:{...newProfile('old'),guidedTutorialCompletedVersion:'0.2.1'}});act(legacy,{type:'NEW_RUN',config:{seed:'old-four'}});assert.equal(legacy.getState().version,'0.4.0');assert.throws(()=>stageForRun({...legacy.getState(),progress:{stageId:'stage.05'}}));assert.deepEqual([0,1,2,3,4].map(i=>getEncounter('stage.05',i,'0.5.0').hp),[520,560,600,640,840]);
 const c=newDesert(),s=c.getState();s.progress.stageId='stage.05';const cards=eligibleRewardCards(s);for(const id of ['card.enjoy','card.finish','card.hobby']){assert.ok(cards.some(card=>card.id===id));assert.ok(!eligibleRewardCards(legacy.getState()).some(card=>card.id===id));assert.equal(isStageRelevantCard(s,language.cardById[id]),true);}
 assert.equal(getEncounter('stage.05',4,'0.5.0').bossMechanic.id,'TURN_HAND_SEAL');assert.equal(getEncounter('stage.05',4,'0.5.0').bossMechanic.multiplier,undefined);
});
