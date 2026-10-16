import test from 'node:test';import assert from 'node:assert/strict';
import {RunController} from './helpers/legacy-0101-controller.js';
import {RunController as Legacy010} from './helpers/legacy-010-controller.js';
import {newProfile,validateRunState} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';
import {snapshotFromText} from '../src/engine/grammar/index.js';
import {grantStage2Entry,createShop,closeShop} from '../src/game/shop.js';
import {TIME_PACKS} from '../src/data/language/timeLanguage.js';
import {assignedCorridor,checked,place} from './helpers/corridor-state.js';
import {assignedLibrary} from './helpers/library-state.js';
import {assignedWaterways,assignSentence} from './helpers/waterways-state.js';
const valid=c=>{const s=c.getState();assert.equal(validateRunState(s,registryForVersion(s.version)),true);assert.deepEqual(new RunController({initialState:JSON.parse(JSON.stringify(s)),profile:c.getProfile()}).getState(),s);};
const finish=(c,r)=>checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});
test('0.10.1 versus 0.10 actual golem three attacks, phase loss, saves and fourth slot',()=>{
 for(const [Controller,hp,part]of [[RunController,780,260],[Legacy010,840,280]]){
  const c=new Controller({profile:{...newProfile('Golem QA'),guidedTutorialCompletedVersion:'0.2.1'}});checked(c,{type:'NEW_RUN',config:{seed:'0101.golem'}});const s=c.getState();
  s.progress={stageId:'stage.02',roundIndex:0,battleNumber:4,contentBoundary:null};s.status='STAGE_INTRO';s.milestoneIds=['STAGE1_CLEAR','STAGE2_CLEAR'];s.eligibility.runOwnUnlocks=['pack.svoo','rune.svoo',...TIME_PACKS];grantStage2Entry(s);createShop(s);s.status='SHOP';closeShop(s,s.shop.shopId);s.status='STAGE_INTRO';s.progress={stageId:'stage.03',roundIndex:0,battleNumber:8,contentBoundary:null};c._state=s;checked(c,{type:'ENTER_STAGE'});
  const entered=c.getState();entered.combat=null;entered.progress={stageId:'stage.03',roundIndex:4,battleNumber:12,contentBoundary:null};entered.runes.orderedInstanceIds=['short','perfect','sv'];entered.runes.instances=Object.fromEntries(['rune.short','rune.perfectSentence','rune.sv'].map((r,i)=>[entered.runes.orderedInstanceIds[i],{instanceId:entered.runes.orderedInstanceIds[i],runeId:r,level:3}]));
  const slots=['I had played games.','I have played games.','I will have played games.'].map((text,n)=>snapshotFromText(text).orderedTokens.map((t,i)=>{const id=`assigned.golem.${n}.${i}`;entered.cardInstances[id]={instanceId:id,cardDefId:t.cardDefId,polishLevel:3,specialEffectId:null};entered.activeCardIds.push(id);return {cardInstanceId:id,selection:t.selectionId};}));
  c._beginBattle(entered);c._state=entered;assert.equal(entered.combat.enemyState.hp,hp);valid(c);
  for(let i=0;i<3;i++){place(c,slots[i]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.actualHpLoss,part);assert.equal(r.enemyHpAfter,hp-part*(i+1));assert.equal(r.phaseBreak,true);assert.ok(r.phaseExcess>0);finish(c,r);valid(c);}
  assert.equal(c.getState().status,'REWARD');assert.equal(c.getState().runes.slotLimit,4);assert.deepEqual(c.getState().combat.enemyState.bossMechanic.phases.map(p=>p.hp),[0,0,0]);
 }
});
test('0.10.1 same-submission dual relative seal and library receipt survive grammar-version alias',()=>{
 const c=assignedWaterways({version:'0.10.1',round:4});assignSentence(c,'The teacher who works reads the book I like.');let r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.bossStateAfter.unlocked,true);finish(c,r);valid(c);
 const lib=assignedLibrary({version:'0.10.1',sentences:['I like what you make.']});place(lib.c,lib.slots[0]);r=checked(lib.c,{type:'SUBMIT'}).resolution;assert.equal(r.turnEndReceipt.suppressed,true);finish(lib.c,r);valid(lib.c);assert.equal(lib.c.getState().combat.temporaryCardIds,undefined);
});
test('0.10.1 fifth shop exact stock/RNG and single rune purchase/service settlement',()=>{
 const {c}=assignedCorridor({version:'0.10.1',entry:true});checked(c,{type:'ENTER_STAGE'});const before=c.getState(),item=before.shop.inventory.find(x=>x.kind==='RUNE');assert.ok(item);valid(c);checked(c,{type:'SHOP_BUY',shopId:before.shop.shopId,itemId:item.itemId});const after=c.getState();assert.equal(after.economy.gold,before.economy.gold-item.price);assert.deepEqual(after.rng,before.rng);assert.equal(after.runes.orderedInstanceIds.length,1);assert.equal(c.dispatch({type:'SHOP_BUY',shopId:before.shop.shopId,itemId:item.itemId}).ok,false);assert.deepEqual(c.getState(),after);valid(c);
});
test('0.10.1 assigned final-turn victory preserves 47/STAGE10_END, frozen reward, profile once',()=>{
 const {c,slots}=assignedCorridor({version:'0.10.1',sentences:['I really like good books and you really like good books.'],polish:3,runes:['rune.longSentence','rune.svo','rune.perfectSentence','rune.polished']});for(let i=0;i<5;i++)checked(c,{type:'PREPARE'});place(c,slots[0]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.killed,true);finish(c,r);valid(c);const before=c.getState(),offer=before.reward;assert.equal(c.dispatch({type:'SKIP_REWARD',offerId:'stale'}).ok,false);assert.deepEqual(c.getState(),before);checked(c,{type:'SKIP_REWARD',offerId:offer.offerId});valid(c);const end=c.getState();assert.equal(end.status,'CONTENT_COMPLETE');assert.equal(end.progress.contentBoundary,'STAGE10_END');assert.equal(end.progress.battleNumber,47);assert.equal(c.getProfile().stage10CompletedRunIds.length,1);assert.equal(c.getProfile().storyClearCount,0);assert.equal(c.dispatch({type:'SKIP_REWARD',offerId:offer.offerId}).ok,false);assert.deepEqual(c.getState(),end);
});
