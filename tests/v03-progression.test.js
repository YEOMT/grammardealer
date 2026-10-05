import test from 'node:test';
import assert from 'node:assert/strict';
import {RunController} from './helpers/legacy-03-controller.js';
import {newProfile,validateRunState,canSaveRun,applyProfileEvent} from '../src/services/localStore.js';
import {registry,registryForVersion} from '../src/data/language/index.js';
import {TIME_PACKS} from '../src/data/language/timeLanguage.js';
import {grantStage3Entry} from '../src/game/timeCanyon.js';
import {grantStage2Entry,createShop} from '../src/game/shop.js';
import {snapshotFromText} from '../src/engine/grammar/index.js';
import {getEncounter} from '../src/data/stages.js';
import {resolveReward} from '../src/game/rewards.js';
import {firstAttack,secondAttack,action} from './guided-tutorial.test.js';
const profile=()=>({...newProfile('0.3 fixture'),guidedTutorialCompletedVersion:'0.2.1'});
function canyon(){const c=new RunController({profile:profile()});assert.equal(c.dispatch({type:'NEW_RUN',config:{seed:'v03.entry'}}).ok,true);const s=c.getState();
 s.progress={stageId:'stage.02',roundIndex:0,battleNumber:4,contentBoundary:null};s.milestoneIds=['STAGE1_CLEAR','STAGE2_CLEAR'];s.eligibility.runOwnUnlocks=['pack.svoo','rune.svoo',...TIME_PACKS];grantStage2Entry(s);s.shop=createShop(s);s.shop.closed=true;
 s.progress={stageId:'stage.03',roundIndex:0,battleNumber:8,contentBoundary:null};c._state=s;return c;
}
test('0.3 Stage 3 entry is missing-only, once, before shuffle; all eight be/have/will ownership combinations',()=>{
 for(let bits=0;bits<8;bits++){
  const c=canyon(),s=c.getState(),defs=['card.be','card.have','card.will'];s.activeCardIds=s.activeCardIds.filter(id=>!defs.includes(s.cardInstances[id].cardDefId));
  for(let i=0;i<3;i++)if(bits&(1<<i)){const id=`owned.${i}`;s.activeCardIds.push(id);s.cardInstances[id]={instanceId:id,cardDefId:defs[i],polishLevel:3,specialEffectId:null};}
  const rng=structuredClone(s.rng),grant=grantStage3Entry(s);assert.equal(grant.cardInstanceIds.length,3-defs.filter((_,i)=>bits&(1<<i)).length);assert.deepEqual(s.rng,rng);
  const frozen=structuredClone(s);assert.deepEqual(grantStage3Entry(s),grant);assert.deepEqual(s,frozen);
  // A later removal must never trigger replacement, even with a retained dictionary instance.
  s.activeCardIds=s.activeCardIds.filter(id=>s.cardInstances[id].cardDefId!=='card.will');grantStage3Entry(s);assert.equal(s.activeCardIds.some(id=>s.cardInstances[id].cardDefId==='card.will'),false);
 }
 const c=canyon();assert.equal(c.dispatch({type:'ENTER_STAGE'}).ok,true);const s=c.getState();assert.equal(s.status,'BATTLE');assert.equal(s.combat.enemyState.hp,320);assert.equal(s.shop.closed,true);assert.equal(s.progress.battleNumber,8);assert.equal(s.runes.slotLimit,3);assert.equal(canSaveRun(s),true);assert.equal(validateRunState(s,registry),true);assert.deepEqual(new RunController({initialState:s}).getState(),s);
 const before=c.getState();assert.equal(c.dispatch({type:'ENTER_STAGE'}).ok,false);assert.deepEqual(c.getState(),before);
});
function golemSubmission(text,{active=0,turns=6}={}){
 const c=canyon();c.dispatch({type:'ENTER_STAGE'});const s=c.getState();s.progress={stageId:'stage.03',roundIndex:4,battleNumber:12,contentBoundary:null};c._beginBattle(s);
 s.combat.enemyState=getEncounter('stage.03',4,'0.3.0');s.combat.enemyState.maxHp=720;
 for(let i=0;i<active;i++)Object.assign(s.combat.enemyState.bossMechanic.phases[i],{hp:0,broken:true});s.combat.enemyState.bossMechanic.activePhase=active;s.combat.enemyState.hp=720-240*active;
 const snap=snapshotFromText(text);s.combat.handIds=[];s.combat.discardIds=[];s.combat.sentenceSlots=[];
 for(const[t,i]of snap.orderedTokens.map((t,i)=>[t,i])){const id=s.activeCardIds[i];s.cardInstances[id].cardDefId=t.cardDefId;s.cardInstances[id].polishLevel=3;s.combat.sentenceSlots.push({cardInstanceId:id,selection:{formId:t.selectionId}});}
 s.combat.drawIds=s.activeCardIds.slice(snap.orderedTokens.length);s.combat.turnsRemaining=turns;s.combat.battleDirty=true;c._state=s;return c;
}
test('0.3 golem controller: last-action phase break is defeat unless third; duplicate finish has no rewards',()=>{
 for(const[active,text]of [[0,'I had played games'],[1,'I have played games'],[2,'I will have played games']]){
  const c=golemSubmission(text,{active,turns:1}),before=c.getState(),r=c.dispatch({type:'SUBMIT',commandId:'one'});assert.equal(r.ok,true,r.message);assert.equal(r.resolution.phaseBreak,true);
  assert.equal(c.getState().combat.enemyState.hp,480-active*240);assert.equal(c.getState().economy.gold,before.economy.gold);assert.equal(c.dispatch({type:'SUBMIT',commandId:'one'}).ok,false);
  assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:r.resolution.attackId}).ok,true);const s=c.getState();
  assert.equal(s.status,active===2?'REWARD':'DEFEAT');assert.equal(s.runes.slotLimit,active===2?4:3);
  if(active===2){assert.equal(s.reward.battleNumber,12);assert.equal(c.getProfile().highestCompletedStage,3);assert.equal(c.getProfile().stage3CompletedRunIds.length,1);assert.equal(c.dispatch({type:'SKIP_REWARD',offerId:s.reward.offerId}).ok,true);assert.equal(c.getState().progress.contentBoundary,'STAGE3_END');assert.equal(c.getProfile().stage3CompletedRunIds.length,1);assert.equal(c.getProfile().storyClearCount,0);assert.equal(validateRunState(c.getState(),registry),true);}
  const frozen=c.getState();assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:r.resolution.attackId}).ok,false);assert.deepEqual(c.getState(),frozen);
 }
});
test('0.3 profile unlock backfill needs real Stage2 history; existing run eligibility is immutable',()=>{
 const p=profile(),old=structuredClone(p);p.stage2CompletedRunIds=['old.done'];const c=new RunController({profile:p});c.dispatch({type:'NEW_RUN',config:{seed:'backfill'}});assert.ok(TIME_PACKS.every(id=>c.getState().eligibility.runStartUnlockBaseline.includes(id)));
 const s=c.getState();c.setProfile(applyProfileEvent(c.getProfile(),{type:'STAGE2_CLEAR',runId:'another'}));assert.deepEqual(c.getState(),s);
 const fresh=new RunController({profile:old});fresh.dispatch({type:'NEW_RUN'});assert.ok(TIME_PACKS.every(id=>!fresh.getState().eligibility.runStartUnlockBaseline.includes(id)));
});
test('0.3 old saved guided contracts still score 30 / 87 without changing completion policy',()=>{
 for(const version of ['0.2.1','0.2.2']){
  const c=new RunController();c.dispatch({type:'NEW_RUN',config:{seed:'old.saved.guided'}});let s=c.getState();s.version=version;s.contentManifest.id='campaign.0.2';s.contentManifest.stageIds=['stage.01','stage.02'];s.contentManifest.cardDefIds=registryForVersion(version).cards.filter(c=>c.runtimeReady).map(c=>c.id);s.contentManifest.runeIds=s.contentManifest.runeIds.filter(id=>id!=='rune.longSentence');Object.assign(s.contentVersions,{game:version,save:version,language:version,grammar:version,balance:'0.2.0',runes:'0.2.0'});c._state=s;
  c.dispatch({type:'START_BATTLE'});s=c.getState();const loaded=new RunController({initialState:s}),r1=firstAttack(loaded);assert.equal(r1.finalPower,30);action(loaded,{type:'FINISH_PRESENTATION',attackId:r1.attackId});const r2=secondAttack(loaded);assert.equal(r2.finalPower,87);
 }
});
test('0.3 corrupt phase and fourth-slot boundaries reject instead of silently repairing',()=>{
 const c=golemSubmission('I played games'),s=c.getState();assert.equal(validateRunState(s,registry),true);
 for(const change of [s=>s.runes.slotLimit=4,s=>s.combat.enemyState.bossMechanic.activePhase=1,s=>s.combat.enemyState.bossMechanic.phases[1].hp=100,s=>s.combat.enemyState.hp--,s=>s.combat.enemyState.bossMechanic.phases[0].broken=true]){const bad=structuredClone(s);change(bad);assert.throws(()=>validateRunState(bad,registry));}
});

test('0.3 removed entry instance remains removed across storage and subsequent battle preparation',()=>{
 const c=canyon();c.dispatch({type:'ENTER_STAGE'});const s=c.getState(),grant=structuredClone(s.entryGrants['stage.03']),will=s.activeCardIds.find(id=>s.cardInstances[id].cardDefId==='card.will');assert.ok(will);
 // Assigned public removal offer; the real removal reducer deletes the physical instance and pile membership.
 s.reward={offerId:'removal.fixture',type:'CARD_REMOVE',choices:[{choiceId:'remove',cardInstanceId:will}],resolved:false};assert.equal(resolveReward(s,s.reward.offerId,'remove',{confirmRemoval:true}).ok,true);s.reward=null;
 assert.equal(s.cardInstances[will],undefined);assert.equal(validateRunState(s,registry),true);assert.equal(canSaveRun(s),true);
 const loaded=new RunController({initialState:JSON.parse(JSON.stringify(s))});assert.deepEqual(loaded.getState(),s);const next=loaded.getState();next.progress.roundIndex=1;next.progress.battleNumber=9;loaded._beginBattle(next);
 assert.equal(next.activeCardIds.some(id=>next.cardInstances[id].cardDefId==='card.will'),false);assert.deepEqual(next.entryGrants['stage.03'],grant);
});

test('0.3 saved rune order retains battle rules, resources and RNG without operational regrant',()=>{
 const c=canyon();c.dispatch({type:'ENTER_STAGE'});const s=c.getState();const ids=['rune.openingHand','rune.discards','rune.longSentence'];s.runes={slotLimit:3,orderedInstanceIds:ids,instances:Object.fromEntries(ids.map(id=>[id,{instanceId:id,runeId:id,level:1}]))};c._state=s;
 assert.equal(c.dispatch({type:'REORDER_RUNES',instanceIds:[...ids].reverse()}).ok,true);const after=c.getState();assert.deepEqual(after.combat,{...s.combat,battleDirty:true});assert.deepEqual(after.rng,s.rng);assert.deepEqual(after.economy,s.economy);assert.equal(validateRunState(after,registry),true);assert.equal(canSaveRun(after),true);
 assert.deepEqual(new RunController({initialState:JSON.parse(JSON.stringify(after))}).getState(),after);
});
