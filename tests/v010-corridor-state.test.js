import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {assignedCorridor,checked,assignPiles,place} from './helpers/corridor-state.js';
import {RunController} from './helpers/legacy-010-controller.js';
import {registryForVersion} from '../src/data/language/index.js';
import {analyzeSentence} from '../src/engine/grammar/index.js';
import {newProfile,validateRunState} from '../src/services/localStore.js';
import {campaignBattleCount} from '../src/data/campaignFeatures.js';
import {eligibleRewardCards} from '../src/game/rewards.js';
import {resolveNormalResistance,normalResistanceRatio} from '../src/engine/normalResistance.js';
import {foresightDecision} from '../src/engine/foresight.js';
import {corridorFrostDefinitions} from '../src/game/corridorFrost.js';
import {getEncounter} from '../src/data/stages.js';
import {battleLearningGuide} from '../src/data/battleLearningGuide.js';
import {playAttack} from '../src/engine/presentation.js';
const registry=registryForVersion('0.10.0'),valid=c=>validateRunState(c.getState(),registry);
const read=name=>JSON.parse(fs.readFileSync(new URL('./fixtures/v010/'+name,import.meta.url))),encounters=read('encounter_cases.json');
for(const x of encounters.resistance_cases)test('0.10 synthetic arithmetic '+x.id,()=>{
 if(x.kind==='ELIGIBILITY_ONLY'){assert.equal(!!normalResistanceRatio(x.version,'stage.'+String(x.stage).padStart(2,'0'),x.enemy_kind),x.expected_new_resistance);return;}
 const r=resolveNormalResistance({version:'0.10.0',stageId:'stage.'+String(x.stage).padStart(2,'0'),kind:x.enemy_kind,power:x.pre_resistance_power,hp:x.enemy_hp_before});
 for(const [key,expect]of [['finalPower','expected_final_power'],['actualHpLoss','expected_hp_loss'],['enemyHpAfter','expected_hp_after'],['overkill','expected_overkill']])assert.equal(r[key],x[expect]);
});
for(const x of encounters.weaver_cases)test('0.10 synthetic foresight '+x.id,()=>{
 const r=foresightDecision({attackId:x.id,memory:x.memory_before,frame:x.resolved_main_frame,validMain:x.valid_main_frame,counterfactual:x.valid_counterfactual,power:x.pre_boss_power,hp:x.enemy_hp_before,action:x.action});
 for(const [key,expect]of [['blocked','expected_blocked'],['finalPower','expected_final_power'],['enemyHpAfter','expected_hp_after'],['rememberedFrameAfter','expected_memory_after'],['killed','expected_killed']])assert.equal(r[key],x[expect]);
});
for(const x of read('frost_cases.json').cases)test('0.10 pure supply '+x.id,()=>{
 const defs=Object.entries(x.permanent_active_counts).flatMap(([word,n])=>Array(n).fill('card.'+word)),actual=corridorFrostDefinitions(x.round-1,defs),expected=Object.entries(x.expected_temporary_grant).flatMap(([word,n])=>Array(n).fill('card.'+word));assert.deepEqual(actual,expected);
});
test('0.10 new run preserves starter, resources and only expands new campaign',()=>{
 const c=new RunController({profile:{...newProfile('corridor QA'),guidedTutorialCompletedVersion:'0.2.1'}});checked(c,{type:'NEW_RUN',config:{seed:'corridor.start'}});let s=c.getState();assert.equal(s.version,'0.10.0');assert.equal(s.activeCardIds.length,28);assert.equal(campaignBattleCount(s),47);assert.equal(campaignBattleCount('0.9.0'),42);assert.ok(!s.activeCardIds.some(id=>s.cardInstances[id].cardDefId==='card.can'));checked(c,{type:'START_BATTLE'});s=c.getState();assert.equal(s.combat.turnsRemaining,6);assert.equal(s.combat.rulesSnapshot.sentenceLimit,16);assert.equal(valid(c),true);
 for(let i=0;i<5;i++){assert.equal(getEncounter('stage.10',i,'0.10.0').hp,[2500,2900,3300,3800,5000][i]);assert.ok(battleLearningGuide({version:'0.10.0',progress:{stageId:'stage.10',roundIndex:i}}).description);}
 assert.throws(()=>getEncounter('stage.10',0,'0.9.0'));
 for(const version of ['0.8.1','0.9.0'])for(const stageId of ['stage.07','stage.08','stage.09'])assert.equal(resolveNormalResistance({version,stageId,kind:'NORMAL',power:101,hp:200}).finalPower,101);
});
for(let round=0;round<5;round++)test(`0.10 assigned round ${round+1} actual frost, opener, save and defeat cleanup`,()=>{
 const {c}=assignedCorridor({round,removeWords:['if','will','can','have']});let s=c.getState(),ids=s.combat.temporaryCardIds??[];assert.equal(ids.length,[2,3,1,4,0][round]);assert.ok(ids.every(id=>!s.activeCardIds.includes(id)));if(ids.length)assert.ok(ids.some(id=>s.combat.handIds.includes(id)));assert.ok(s.combat.openingTrace.witnessSlots.every(slot=>s.combat.handIds.includes(slot.cardInstanceId)));assert.equal(valid(c),true);assert.deepEqual(new RunController({initialState:s,profile:c.getProfile()}).getState(),s);
 for(let i=0;i<6;i++)checked(c,{type:'PREPARE',confirmed:true});s=c.getState();assert.equal(s.status,'DEFEAT');assert.ok(!Object.values(s.cardInstances).some(x=>x.temporary));assert.equal(valid(c),true);
});
test('0.10 fifth shop unlocks can before offers, grants zero cards and saves frozen stock/RNG',()=>{
 const {c}=assignedCorridor({entry:true});const before=c.getState();assert.ok(!eligibleRewardCards(before).some(x=>x.id==='card.can'));checked(c,{type:'ENTER_STAGE'});const s=c.getState();assert.equal(s.status,'SHOP');assert.equal(s.shop.stageId,'stage.10');assert.equal(s.shopHistory.length,4);assert.deepEqual(s.activeCardIds,before.activeCardIds);assert.deepEqual(s.entryGrants['stage.10'].cardInstanceIds,[]);assert.ok(eligibleRewardCards(s).some(x=>x.id==='card.can'));assert.equal(valid(c),true);assert.deepEqual(new RunController({initialState:s,profile:c.getProfile()}).getState(),s);assert.equal(c.dispatch({type:'ENTER_STAGE'}).ok,false);assert.deepEqual(c.getState(),s);
});
test('0.10 invalid submission shatters actual frost once; stale/error leaves card, turn and RNG unchanged',()=>{
 const {c}=assignedCorridor({round:0,removeWords:['if','will']});const id=c.getState().combat.temporaryCardIds[0];assignPiles(c,{hand:[id]});checked(c,{type:'ADD_CARD',cardId:id});const before=c.getState();c.analyzer=()=>{throw Error('test analyzer unavailable');};assert.equal(c.dispatch({type:'SUBMIT'}).ok,false);assert.deepEqual(c.getState(),before);c.analyzer=analyzeSentence;assert.equal(c.dispatch({type:'SUBMIT',expectedRevision:before.revision-1}).ok,false);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.status,'INVALID_CORE');assert.deepEqual(c.getState().combat.shatteredTemporaryIds,[id]);checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});assert.equal(valid(c),true);assert.ok(!c.getState().combat.handIds.includes(id));
});
test('0.10 real main frame memory, blocked attack, conditional bypass, prepare, invalid and duplicate completion',async()=>{
 const {c,slots}=assignedCorridor({sentences:['I like books.','I like books.','If I worked I would like books.','I']});
 const fire=i=>{place(c,slots[i]);return checked(c,{type:'SUBMIT'}).resolution;},finish=r=>checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});
 let r=fire(0);assert.equal(r.foresightResult.rememberedFrameAfter,'SVO');assert.ok(r.finalPower>0);finish(r);assert.equal(valid(c),true);
 r=fire(1);assert.equal(r.finalPower,0);assert.equal(r.foresightResult.blocked,true);const committed=c.getState();await playAttack(r,{}, {document:null,wait:()=>Promise.resolve()});assert.deepEqual(c.getState(),committed);finish(r);const after=c.getState();assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:r.attackId}).ok,false);assert.deepEqual(c.getState(),after);
 checked(c,{type:'PREPARE'});r=fire(2);assert.equal(r.analysis.mainFrameId,'frame.svo');assert.equal(r.foresightResult.bypassed,true);assert.ok(r.finalPower>0);finish(r);r=fire(3);assert.equal(r.status,'INVALID_CORE');finish(r);assert.equal(c.getState().combat.enemyState.bossMechanic.rememberedFrame,'SVO');assert.equal(valid(c),true);
 const restored=new RunController({initialState:c.getState(),profile:c.getProfile()});assert.deepEqual(restored.getState(),c.getState());const forged=c.getState();forged.combat.enemyState.bossMechanic.rememberedFrame='SVC';assert.throws(()=>validateRunState(forged,registry));
});
test('0.10 assigned final-turn kill and reward once lead to exact STAGE10_END',()=>{
 const {c,slots}=assignedCorridor({sentences:['I really like good books and you really like good books.'],polish:3,runes:['rune.longSentence','rune.svo','rune.perfectSentence','rune.polished']});for(let i=0;i<5;i++)checked(c,{type:'PREPARE'});place(c,slots[0]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.ok(r.finalPower>=5000);assert.equal(r.killed,true);checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});assert.equal(c.getState().status,'REWARD');assert.equal(valid(c),true);const offer=c.getState().reward;checked(c,{type:'SKIP_REWARD',offerId:offer.offerId});const end=c.getState();assert.equal(end.status,'CONTENT_COMPLETE');assert.equal(end.progress.contentBoundary,'STAGE10_END');assert.equal(end.progress.battleNumber,47);assert.equal(c.getProfile().stage10CompletedRunIds.length,1);assert.equal(c.getProfile().storyClearCount,0);assert.equal(valid(c),true);assert.equal(c.dispatch({type:'SKIP_REWARD',offerId:offer.offerId}).ok,false);assert.equal(c.dispatch({type:'NEXT_STAGE'}).ok,false);
});
test('0.10 actual normal attack resistance is last and exactly once; frost supply not based on hand',()=>{
 const {c,slots}=assignedCorridor({round:3,sentences:['If I had worked I would have helped you.']});assert.equal(c.getState().combat.temporaryCardIds.length,0);place(c,slots[0]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.resistanceResult.percent,30);assert.equal(r.postResistancePower,Math.floor(r.postRegionScore*7/10));assert.equal(r.finalPower,r.postResistancePower);assert.equal(r.actualHpLoss,Math.min(3800,r.finalPower));assert.equal(r.overkill,Math.max(0,r.finalPower-3800));assert.equal(r.scoreTimeline.filter(e=>e.phase==='REGION').length,1);assert.equal(r.scoreTimeline.filter(e=>e.phase==='RESISTANCE').length,1);checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});assert.equal(valid(c),true);
});
