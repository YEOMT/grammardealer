import test from 'node:test';import assert from 'node:assert/strict';
import {assignedCorridor,checked,place,assignPiles} from './helpers/corridor-state.js';
import {assignedLibrary} from './helpers/library-state.js';
import {getEncounter,stageForRun} from '../src/data/stages.js';
import {registryForVersion} from '../src/data/language/index.js';
import {validateRunState} from '../src/services/localStore.js';
import {RunController} from '../src/game/runController.js';
import {comboEligibility,scoreableAnalysis} from '../src/engine/comboEligibility.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {resolveAttack} from '../src/engine/stage.js';
import {createCorridorFrost} from '../src/game/corridorFrost.js';
import {grantOperation,use} from './helpers/waterways-state.js';
const registry=registryForVersion('0.10.0'),valid=c=>validateRunState(c.getState(),registry),finish=(c,r)=>checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});
const powerRunes=['rune.longSentence','rune.svo','rune.perfectSentence','rune.polished'];
test('0.10 profile baseline cannot unlock corridor before actual entry; old nine bosses unchanged',()=>{
 const run={version:'0.10.0',eligibility:{runStartUnlockBaseline:['pack.corridor'],runOwnUnlocks:[]}};assert.ok(!comboEligibility(run).unlocks.includes('pack.corridor'));
 for(let i=1;i<=9;i++){const stageId='stage.'+String(i).padStart(2,'0'),stage=stageForRun({version:'0.9.0',progress:{stageId}});assert.deepEqual(getEncounter(stageId,stage.rounds.length-1,'0.10.0'),getEncounter(stageId,stage.rounds.length-1,'0.9.0'));}
});
test('0.10 real Stage9 boss victory, reward and exact transition into one fifth shop',()=>{
 const {c,slots}=assignedLibrary({version:'0.10.0',sentences:['I really like what you really make today.'],polish:3,runes:powerRunes});place(c,slots[0]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.killed,true);finish(c,r);assert.equal(valid(c),true);checked(c,{type:'SKIP_REWARD',offerId:c.getState().reward.offerId});assert.equal(c.getState().status,'STAGE_CLEAR');checked(c,{type:'NEXT_STAGE'});const intro=c.getState();assert.equal(intro.progress.battleNumber,43);assert.equal(valid(c),true);checked(c,{type:'ENTER_STAGE'});assert.equal(c.getState().shop.stageId,'stage.10');assert.equal(valid(c),true);checked(c,{type:'LEAVE_SHOP',shopId:c.getState().shop.shopId});assert.equal(c.getState().combat.enemyState.hp,2500);assert.equal(valid(c),true);
});
for(const [text,frame,bypass]of [['I am happy.','SVC',false],['I am a student.','SVC',false],['I think that you like books.','SVO',false],['If I work I will like books.','SVO',false],['I had liked books.','SVO',false],['I have been reading books.','SVO',false],['I could like books.','SVO',false],['I would like books.','SVO',false],['I know if you work.','SVO',false],['If I had worked I would have liked books.','SVO',true]])test('0.10 structural foresight key and no false bypass: '+text,()=>{
 const {c,slots}=assignedCorridor({sentences:[text,text]});for(let i=0;i<2;i++){place(c,slots[i]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.status,'VALID');assert.equal(r.foresightResult.rememberedFrameAfter,frame);assert.equal(r.foresightResult.bypassed,bypass);assert.equal(r.foresightResult.blocked,i===1&&!bypass);finish(c,r);assert.equal(valid(c),true);}
});
test('0.10 operation, exchange, edit, malformed main and technical errors never reset memory',()=>{
 const {c,slots}=assignedCorridor({sentences:['I like books.','I likes books.']});const op=grantOperation(c,'supply',1);place(c,slots[0]);let r=checked(c,{type:'SUBMIT'}).resolution;finish(c,r);assignPiles(c,{hand:[op]});use(c,op);assert.equal(c.getState().combat.enemyState.bossMechanic.rememberedFrame,'SVO');const id=c.getState().combat.handIds[0];checked(c,{type:'EXCHANGE',cardIds:[id]});place(c,slots[1]);const before=c.getState();c.analyzer=()=>{throw Error('test unavailable');};assert.equal(c.dispatch({type:'SUBMIT'}).ok,false);assert.deepEqual(c.getState(),before);c.analyzer=analyzeSentence;r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.status,'VALID_WITH_ISSUES');assert.equal(r.foresightResult.validMain,false);finish(c,r);assert.equal(c.getState().combat.enemyState.bossMechanic.rememberedFrame,'SVO');assert.equal(valid(c),true);
});
test('0.10 same frame on last turn stays blocked and loses; actual changed frame updates memory',()=>{
 const {c,slots}=assignedCorridor({sentences:['I like books.','I am happy.','I am a student.']});for(let i=0;i<2;i++){place(c,slots[i]);finish(c,checked(c,{type:'SUBMIT'}).resolution);}assert.equal(c.getState().combat.enemyState.bossMechanic.rememberedFrame,'SVC');for(let i=0;i<3;i++)checked(c,{type:'PREPARE'});place(c,slots[2]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.finalPower,0);assert.equal(r.killed,false);finish(c,r);assert.equal(c.getState().status,'DEFEAT');assert.equal(valid(c),true);
});
test('0.10 supplied-state sequential 43–47 real scoring, rewards, cleanup, save and no battle48',()=>{
 const text='If I worked I would like good books today.',{c,slots}=assignedCorridor({round:0,sentences:[text],polish:3,runes:powerRunes});
 for(let i=0;i<5;i++){assert.equal(c.getState().progress.battleNumber,43+i);place(c,slots[0]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.killed,true);finish(c,r);assert.equal(valid(c),true);checked(c,{type:'SKIP_REWARD',offerId:c.getState().reward.offerId});assert.equal(valid(c),true);const s=c.getState();assert.deepEqual(new RunController({initialState:s,profile:c.getProfile()}).getState(),s);if(i<4)checked(c,{type:'NEXT_BATTLE'});}
 assert.equal(c.getState().progress.contentBoundary,'STAGE10_END');assert.equal(c.dispatch({type:'NEXT_BATTLE'}).ok,false);
});
test('0.10 duplicate supply and corrupt temporary partition reject; stable actual replay after load',()=>{
 const {c}=assignedCorridor({round:3,removeWords:['if','will','have']});const s=c.getState();assert.throws(()=>createCorridorFrost(s));const original=c.getState(),restored=new RunController({initialState:original,profile:c.getProfile()});for(const ctrl of [c,restored])checked(ctrl,{type:'PREPARE'});assert.deepEqual(c.getState(),restored.getState());const corrupt=c.getState();corrupt.combat.handIds.push(corrupt.combat.temporaryCardIds[0]);assert.throws(()=>validateRunState(corrupt,registry));
});
test('0.10 region excludes PPC alone; actual stage7/8/9/10 attacks apply resistance once after runes and region',()=>{
 for(const n of [7,8,9,10]){const stageId='stage.'+String(n).padStart(2,'0'),snapshot=snapshotFromText('I have been reading good books.',{registry}),analysis=analyzeSentence(snapshot,registry),cards=snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:0,baseScore:10})),r=resolveAttack({analysis,cards,enemy:getEncounter(stageId,0,'0.10.0'),stage:stageForRun({version:'0.10.0',progress:{stageId}}),sentenceSnapshot:snapshot,policyVersion:'0.10.0',equippedRunes:[{instanceId:'qa.rune',runeId:'rune.perfectSentence',level:1}]});assert.equal(r.resistanceResult.percent,{7:30,8:35,9:40,10:30}[n]);assert.equal(r.finalPower,r.postResistancePower);assert.equal(r.scoreTimeline.filter(e=>e.phase==='RESISTANCE').length,1);assert.equal(r.scoreTimeline.filter(e=>e.phase==='REGION').length,0);assert.ok(r.postRuneScore>r.preRuneScore);}
});

test('0.10 real submissions normalize all five main frames and retain alternating memory',()=>{
 const sentences=['I work.','I am happy.','I like books.','I give you books.','I make you happy.','I like books.'],keys=['SV','SVC','SVO','SVOO','SVOC','SVO'],{c,slots}=assignedCorridor({sentences});
 for(let i=0;i<slots.length;i++){place(c,slots[i]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.status,'VALID');assert.equal(r.foresightResult.rememberedFrameAfter,keys[i]);assert.equal(r.foresightResult.blocked,false);finish(c,r);assert.equal(valid(c),true);}
});

test('0.10 actual 10-4 frost forms shatter on a winning submission and cannot enter boss',()=>{
 const sentence='If I had worked I would have liked books.',{c}=assignedCorridor({round:3,removeWords:['if','will','have'],sentences:['I worked I liked books.'],polish:3,runes:powerRunes});const s=c.getState(),used=new Set(),slots=snapshotFromText(sentence,{registry}).orderedTokens.map(t=>{const id=[...s.activeCardIds,...s.combat.temporaryCardIds].find(id=>!used.has(id)&&s.cardInstances[id].cardDefId===t.cardDefId);assert.ok(id);used.add(id);return {cardInstanceId:id,selection:t.selectionId};});assert.equal(s.combat.temporaryCardIds.length,4);place(c,slots);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.status,'VALID');assert.deepEqual([...r.consumedTemporaryCardIds].sort(),[...s.combat.temporaryCardIds].sort());assert.equal(r.killed,true);finish(c,r);assert.equal(valid(c),true);assert.ok(!Object.values(c.getState().cardInstances).some(x=>x.temporary));checked(c,{type:'SKIP_REWARD',offerId:c.getState().reward.offerId});checked(c,{type:'NEXT_BATTLE'});assert.equal(c.getState().progress.battleNumber,47);assert.equal(c.getState().combat.temporaryCardIds,undefined);assert.ok(!Object.values(c.getState().cardInstances).some(x=>x.temporary));assert.equal(valid(c),true);
});

test('0.10 fifth shop actual card purchase, polish, removal and restored history retain service rules',()=>{
 const {c}=assignedCorridor({entry:true});checked(c,{type:'ENTER_STAGE'});const before=c.getState(),shopId=before.shop.shopId,item=before.shop.inventory.find(x=>x.kind==='CARD'&&!x.cardDefId.startsWith('card.operation.'));assert.ok(item);checked(c,{type:'SHOP_BUY',shopId,itemId:item.itemId});let s=c.getState();assert.equal(s.economy.gold,before.economy.gold-item.price);assert.equal(s.activeCardIds.length,before.activeCardIds.length+1);assert.equal(valid(c),true);const bought=s.activeCardIds.find(id=>!before.activeCardIds.includes(id));checked(c,{type:'SHOP_SERVICE',shopId,serviceKind:'POLISH',targetCardInstanceId:bought});assert.equal(c.getState().cardInstances[bought].polishLevel,1);checked(c,{type:'SHOP_SERVICE',shopId,serviceKind:'REMOVE',targetCardInstanceId:bought,confirmRemoval:true});s=c.getState();assert.equal(s.economy.paidRemovalCount,before.economy.paidRemovalCount+1);assert.ok(!s.activeCardIds.includes(bought));assert.deepEqual(s.shopHistory,before.shopHistory);assert.equal(valid(c),true);assert.deepEqual(new RunController({initialState:s,profile:c.getProfile()}).getState(),s);
});


test('0.10 replacing temporal score evidence preserves only the existing canyon region eligibility',()=>{
 for(const [text,unlocks]of [['I have been reading books.',['pack.time.perfect','pack.time.progressive']],['I had read books.',['pack.corridor','pack.time.past','pack.time.perfect']]]){
  const snapshot=snapshotFromText(text,{registry}),analysis=analyzeSentence(snapshot,registry),cards=snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:0,baseScore:10})),r=resolveAttack({analysis,cards,sentenceSnapshot:snapshot,policyVersion:'0.10.0',comboEligibility:{version:'0.10.0',unlocks},enemy:getEncounter('stage.03',0,'0.10.0'),stage:stageForRun({version:'0.10.0',progress:{stageId:'stage.03'}})});
  const region=r.scoreTimeline.filter(e=>e.phase==='REGION');assert.equal(region.length,1);assert.deepEqual(region[0].operand,{num:5,den:4});assert.equal(region[0].after,Math.floor(r.postRuneScore*5/4));assert.ok(region[0].evidenceRefs.every(id=>analysis.grammarHits.find(h=>h.id===id)?.tag.startsWith('CORRIDOR.')));assert.equal(r.scoreTimeline.filter(e=>['TIME.PAST','TIME.PERFECT','TIME.PROGRESSIVE'].includes(e.sourceId)).length,0);
 }
});
