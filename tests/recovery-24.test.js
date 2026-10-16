import test from 'node:test';import assert from 'node:assert/strict';
import {RunController} from '../src/game/runController.js';
import {registryForVersion} from '../src/data/language/index.js';
import {analyzeSentence,snapshotFromText} from '../src/engine/grammar/index.js';
import {validateRunState} from '../src/services/localStore.js';
import {assertCardConservation} from '../src/game/invariants.js';
import {scoreBalanceForVersion,combatBalanceForVersion} from '../src/data/balance.js';
import {scoreAttack} from '../src/engine/scoring.js';
import {applyRunes,describeRune} from '../src/engine/runes.js';
import {runesForVersion} from '../src/data/runes.js';
import {getEncounter} from '../src/data/stages.js';
import {campaignBattleCount} from '../src/data/campaignFeatures.js';
import {assignedCorridor,checked,assignPiles,place} from './helpers/corridor-state.js';
import {assignedWaterways,assignSentence} from './helpers/waterways-state.js';
export const sentence17='I read a good book in the park and you read a useful book in the room.';
export const sentence24='I often read a good book in the park and you often read a useful book in the room with a good old friend.';
const finish=(c,r)=>checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});
function roundTrip(c){const s=c.getState();assert.equal(validateRunState(s,registryForVersion(s.version)),true);const restored=new RunController({initialState:JSON.parse(JSON.stringify(s)),profile:c.getProfile()});assert.deepEqual(restored.getState(),s);return restored;}
for(const [count,text]of [[17,sentence17],[24,sentence24]])test('recovery: real registered '+count+'-card grammar, contribution, diamond and exactly-once submission',()=>{
 const registry=registryForVersion('0.10.2'),snap=snapshotFromText(text,{registry}),a=analyzeSentence(snap,registry);assert.equal(snap.orderedTokens.length,count);assert.equal(a.status,'VALID');assert.equal(a.coverage.consumedCardIds.length,count);assert.equal(a.diagnostics.limits.depth,6);
 assert.equal(analyzeSentence(snap,registryForVersion('0.10.1')).status,'UNSUPPORTED');
 const {c,slots}=assignedCorridor({version:'0.10.2',sentences:[text],runes:['rune.longSentence']});place(c,slots[0]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.cardScoringSnapshot.length,count);assert.ok(r.finalPower>0);assert.equal(r.runeSnapshot[0].runeId,'rune.longSentence');assert.equal(r.scoreTimeline.find(e=>e.sourceId==='rune.longSentence').operand.num,16);
 finish(c,r);roundTrip(c);const after=c.getState();assert.equal(after.stats.attacks,1);assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:r.attackId}).ok,false);assert.deepEqual(c.getState(),after);assertCardConservation(after.activeCardIds,after.combat);
});
test('recovery: ADD 17 and 24, reject 25 transactionally, move/return/form across row boundary',()=>{
 const {c,slots}=assignedCorridor({version:'0.10.2',sentences:[sentence24],words:['be']});const s=slots[0];place(c,s.slice(0,16));assignPiles(c,{sentence:s.slice(0,16),hand:s.slice(16).map(x=>x.cardInstanceId)});
 for(const slot of s.slice(16))checked(c,{type:'ADD_CARD',cardId:slot.cardInstanceId});assert.equal(c.getState().combat.sentenceSlots.length,24);const extra=c.getState().combat.drawIds[0];assignPiles(c,{sentence:c.getState().combat.sentenceSlots,hand:[extra]});const before=c.getState();assert.equal(c.dispatch({type:'ADD_CARD',cardId:extra}).ok,false);assert.deepEqual(c.getState(),before);
 checked(c,{type:'REORDER_SENTENCE',cardId:s[11].cardInstanceId,index:12});assert.equal(c.getState().combat.sentenceSlots[12].cardInstanceId,s[11].cardInstanceId);
 checked(c,{type:'RETURN_CARD',cardId:s[11].cardInstanceId});assert.equal(c.getState().combat.sentenceSlots.length,23);assert.ok(c.getState().combat.handIds.includes(s[11].cardInstanceId));roundTrip(c);
});
test('recovery: 25 grammar/scoring fail closed and 24 invalid-core still settles',()=>{
 const r=registryForVersion('0.10.2'),snap=snapshotFromText(sentence24.replace('friend.','old friend.'),{registry:r});assert.equal(snap.orderedTokens.length,25);assert.equal(analyzeSentence(snap,r).diagnostics.maximum,24);
 const cards=snap.orderedTokens.map(t=>({instanceId:t.cardInstanceId,baseScore:10,polishLevel:0}));assert.throws(()=>scoreAttack({status:'VALID',grammarVersion:'0.10.0'},cards,{balance:scoreBalanceForVersion('0.10.2')}),/1\.\.24/);
 const {c,slots}=assignedCorridor({version:'0.10.2',sentences:[Array(24).fill('books').join(' ')]});place(c,slots[0]);const res=checked(c,{type:'SUBMIT'}).resolution;assert.equal(res.analysis.status,'INVALID_CORE');assert.equal(res.finalPower,0);finish(c,res);assert.equal(c.getState().combat.turnsRemaining,5);roundTrip(c);
});
test('recovery: historical 0.10 and 0.10.1 retain 16, frozen shops/RNG, reject forged limit',()=>{
 for(const version of ['0.10.0','0.10.1']){const {c,slots}=assignedCorridor({version,sentences:[sentence17]});assert.equal(c.getState().combat.rulesSnapshot.sentenceLimit,16);place(c,slots[0].slice(0,16));assignPiles(c,{sentence:slots[0].slice(0,16),hand:[slots[0][16].cardInstanceId]});const before=c.getState();assert.equal(c.dispatch({type:'ADD_CARD',cardId:slots[0][16].cardInstanceId}).ok,false);assert.deepEqual(c.getState(),before);roundTrip(c);const forged=c.getState();forged.combat.rulesSnapshot.sentenceLimit=24;assert.throws(()=>validateRunState(forged,registryForVersion(forged.version)));}
 const {c}=assignedCorridor({version:'0.10.2',entry:true});checked(c,{type:'ENTER_STAGE'});roundTrip(c);const forged=c.getState();forged.version='0.10.1';assert.throws(()=>validateRunState(forged,registryForVersion(forged.version)));
});
test('recovery: unchanged HP, resources, 22 runes, multipliers and 47 encounters; only description/limit differs',()=>{
 assert.deepEqual(combatBalanceForVersion('0.10.2'),{...combatBalanceForVersion('0.10.1'),sentenceLimit:24});assert.equal(campaignBattleCount('0.10.2'),47);
 for(let stage=1;stage<=10;stage++)for(let round=0;round<(stage===1?3:stage===2?4:5);round++)assert.deepEqual(getEncounter('stage.'+String(stage).padStart(2,'0'),round,'0.10.2'),getEncounter('stage.'+String(stage).padStart(2,'0'),round,'0.10.1'));
 const old=runesForVersion('0.10.1'),now=runesForVersion('0.10.2');assert.equal(now.length,22);now.forEach((r,i)=>assert.deepEqual({...r,conditionDescriptionKo:old[i].conditionDescriptionKo,displayEffectSummaryKo:old[i].displayEffectSummaryKo},old[i]));assert.match(describeRune('rune.longSentence',3,'0.10.2'),/10~24장 ×3.2/);assert.match(describeRune('rune.longSentence',3,'0.10.1'),/10~16장 ×3.2/);
});
test('recovery: long same-submission dual-relative witness revalidates after save',()=>{
 const c=assignedWaterways({version:'0.10.2',round:4});assignSentence(c,'The good teacher who often works in the park reads the good book I really like in the room.');const r=checked(c,{type:'SUBMIT'}).resolution;assert.ok(r.cardScoringSnapshot.length>16);assert.equal(r.bossStateAfter.unlocked,true);finish(c,r);roundTrip(c);
});
test('recovery: final-turn victory and frozen reward still end exactly at battle 47',()=>{
 const {c,slots}=assignedCorridor({version:'0.10.2',sentences:['I really like good books and you really like good books.'],polish:3,runes:['rune.longSentence','rune.svo','rune.perfectSentence','rune.polished']});for(let i=0;i<5;i++)checked(c,{type:'PREPARE'});place(c,slots[0]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.killed,true);finish(c,r);roundTrip(c);const offer=c.getState().reward;checked(c,{type:'SKIP_REWARD',offerId:offer.offerId});roundTrip(c);const s=c.getState();assert.equal(s.status,'CONTENT_COMPLETE');assert.equal(s.progress.contentBoundary,'STAGE10_END');assert.equal(s.progress.battleNumber,47);assert.equal(c.getProfile().stage10CompletedRunIds.length,1);assert.equal(c.dispatch({type:'SKIP_REWARD',offerId:offer.offerId}).ok,false);assert.deepEqual(c.getState(),s);
});
