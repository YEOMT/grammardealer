import test from 'node:test';
import assert from 'node:assert/strict';
import {FINALE_VERSIONS,RECOVERY_VERSIONS} from '../src/contracts.js';
import {campaignBattleCount,hasFinaleCampaign} from '../src/data/campaignFeatures.js';
import {STAGE_FINAL,FINALE_CONFIRMED,FINALE_INITIAL} from '../src/data/finalePolicy.js';
import {getEncounter,stageForRun} from '../src/data/stages.js';
import {combatBalanceForVersion,scoreBalanceForVersion} from '../src/data/balance.js';
import {registryForVersion} from '../src/data/language/index.js';
import {runesForVersion} from '../src/data/runes.js';
import {createRng} from '../src/game/rng.js';
import {assertCardConservation} from '../src/game/invariants.js';
import {createFinaleDustSupply,limitFinaleOpeningDust,issueFinaleFrost,validateFinaleCards,cleanupFinaleCards,applyFinaleHandSeal,validateFinaleHandSeal,isFinaleHandSealed} from '../src/game/finaleCards.js';
import {shatterSubmittedFrost} from '../src/game/frostCards.js';
import {isTurnSealed} from '../src/game/turnHandSeal.js';

function assigned(phase=0,wordCount=10){
 const words=Array.from({length:wordCount},(_,i)=>['she','be','give','room','the','have','will','kind','i','help'][i%10]),defs=[...words.map(w=>'card.'+w),'card.operation.supply'];
 const activeCardIds=defs.map((_,i)=>'owned.'+i),cardInstances=Object.fromEntries(defs.map((cardDefId,i)=>[activeCardIds[i],{instanceId:activeCardIds[i],cardDefId,polishLevel:0,specialEffectId:null}]));
 return {version:'0.11.0',runId:'qa.finale.cards',revision:1,status:'BATTLE',progress:{stageId:'stage.final',roundIndex:phase,battleNumber:48+phase},activeCardIds,cardInstances,rng:createRng('finale.cards'),vocabulary:{encounteredLexemeIds:[]},stats:{history:[]},combat:{enemyState:getEncounter('stage.final',phase,'0.11.0'),handIds:[...activeCardIds],drawIds:[],discardIds:[],exhaustedIds:[],sentenceSlots:[],rulesSnapshot:{handLimit:14,turnLimit:6},turnIndex:1,turnsRemaining:6}};
}
function surface(count=4){const s=assigned(),combat=s.combat;s.combat=null;const supply=createFinaleDustSupply(s,count);s.combat={...combat,...supply,drawIds:[...supply.temporaryCardIds]};return s;}
const check=s=>{validateFinaleCards(s);assertCardConservation(s.activeCardIds,s.combat,s.cardInstances);};

test('0.11 new campaign only extends 47 to 50 and inherits every existing policy',()=>{
 assert.deepEqual(FINALE_VERSIONS,{...RECOVERY_VERSIONS,game:'0.11.0',save:'0.11.0'});
 assert.equal(campaignBattleCount('0.10.2'),47);assert.equal(campaignBattleCount('0.11.0'),50);assert.equal(hasFinaleCampaign('0.10.4'),false);
 for(const f of [combatBalanceForVersion,scoreBalanceForVersion,registryForVersion,runesForVersion])assert.equal(f('0.11.0'),f('0.10.2'));
 assert.equal(combatBalanceForVersion('0.11.0').sentenceLimit,24);
 for(let stage=1;stage<=10;stage++)for(let round=0;round<(stage===1?3:stage===2?4:5);round++)assert.deepEqual(getEncounter(`stage.${String(stage).padStart(2,'0')}`,round,'0.11.0'),getEncounter(`stage.${String(stage).padStart(2,'0')}`,round,'0.10.2'));
 assert.equal(stageForRun({version:'0.10.2',progress:{stageId:'stage.10'}}).nextStageImplemented,false);
 assert.equal(stageForRun({version:'0.11.0',progress:{stageId:'stage.10'}}).nextStageImplemented,true);
 assert.throws(()=>getEncounter('stage.final',0,'0.10.2'));
 assert.deepEqual(STAGE_FINAL.rounds.map(x=>[x.battleNumber,x.nameKo,x.hp]),[[48,'Surface Structure',5000],[49,'Deep Structure',6000],[50,'Universal Grammar',10000]]);
 assert.equal(STAGE_FINAL.contentBoundary,'FINAL50_CLEAR');assert.deepEqual(STAGE_FINAL.regionMultiplier,{num:1,den:1});
 assert.equal(FINALE_CONFIRMED.deep.maxRuneSeals,2);assert.equal(FINALE_INITIAL.surface.regenPerConsumedSurvivingTurn,400);
});
test('0.11 Surface dust starts once and consumes only encounter RNG for its 4/5 choice',()=>{
 const s=assigned();s.combat=null;const before=structuredClone(s.rng),supply=createFinaleDustSupply(s);
 assert.ok([4,5].includes(supply.temporaryCardIds.length));assert.equal(s.rng.encounter.cursor,before.encounter.cursor+1);
 for(const key of ['deck','shop','reward'])assert.deepEqual(s.rng[key],before[key]);
 assert.throws(()=>createFinaleDustSupply(s));
 const old={...assigned(),version:'0.10.2',combat:null};assert.equal(createFinaleDustSupply(old),null);
});
test('0.11 Surface opening dust limiting preserves real WORD witness and mixed support metadata',()=>{
 const s=surface(5),c=s.combat,ids=c.finaleDustTrace.cardIds;c.handIds=[s.activeCardIds[0],...ids];c.drawIds=s.activeCardIds.slice(1);c.openingTrace={witnessSlots:[{cardInstanceId:s.activeCardIds[0]}]};
 limitFinaleOpeningDust(c,c);assert.equal(c.handIds.filter(id=>ids.includes(id)).length,1);assert.ok(c.handIds.includes(s.activeCardIds[0]));check(s);
});
test('0.11 layer frost appends without losing dust; full hand goes to draw top; duplicate activation is inert',()=>{
 const s=surface(),c=s.combat,permanent=[...s.activeCardIds],dust=[...c.temporaryCardIds],rng=structuredClone(s.rng);
 c.rulesSnapshot.handLimit=c.handIds.length+1;
 const first=issueFinaleFrost(s,{layerIndex:0,cardDefId:'card.to'});assert.equal(first.destination,'HAND');assert.ok(c.handIds.includes(first.cardInstanceId));
 const second=issueFinaleFrost(s,{layerIndex:1,cardDefId:'card.have'});assert.equal(second.destination,'DRAW_TOP');assert.equal(c.drawIds[0],second.cardInstanceId);
 assert.deepEqual(c.temporaryCardIds,[...dust,first.cardInstanceId,second.cardInstanceId]);assert.deepEqual(s.activeCardIds,permanent);assert.deepEqual(s.rng,rng);
 const before=structuredClone(s);assert.deepEqual(issueFinaleFrost(s,{layerIndex:1,cardDefId:'card.have'}),second);assert.deepEqual(s,before);
 assert.throws(()=>issueFinaleFrost(s,{layerIndex:1,cardDefId:'card.to'}));assert.throws(()=>issueFinaleFrost(s,{layerIndex:2,cardDefId:'card.to'}));check(s);
});
test('0.11 accepted invalid submission shatters frost; mixed cleanup is once and permanent cards survive',()=>{
 const s=surface(),c=s.combat,first=issueFinaleFrost(s,{layerIndex:0,cardDefId:'card.to'});c.handIds=c.handIds.filter(id=>id!==first.cardInstanceId);c.sentenceSlots=[{cardInstanceId:first.cardInstanceId,selection:null}];
 const shattered=shatterSubmittedFrost(c);assert.deepEqual(shattered,[first.cardInstanceId]);assert.equal(c.temporaryCardIds.length,5);
 s.stats.history.push({battleId:c.enemyState.id,consumedTemporaryCardIds:shattered});check(s);
 const permanent=structuredClone(s.activeCardIds.map(id=>s.cardInstances[id]));s.status='DEFEAT';cleanupFinaleCards(s);check(s);
 assert.deepEqual(s.activeCardIds.map(id=>s.cardInstances[id]),permanent);assert.equal(Object.values(s.cardInstances).some(x=>x.temporary),false);
 const cleaned=structuredClone(s);cleanupFinaleCards(s);assert.deepEqual(s,cleaned);
});
test('0.11 support checks permanent witness multiplicity, not absence from the current hand',()=>{
 const s=surface(),m=s.combat.enemyState.bossMechanic;
 m.taskPlan=[{supportCardDefId:'card.have',witnessCardDefIds:['card.she','card.have','card.have']}];
 assert.ok(issueFinaleFrost(s,{layerIndex:0,cardDefId:'card.have'}));check(s);
 const owned=surface();owned.combat.enemyState.bossMechanic.taskPlan=[{supportCardDefId:'card.have',witnessCardDefIds:['card.she','card.have']}];
 owned.combat.handIds=owned.combat.handIds.filter(id=>owned.cardInstances[id].cardDefId!=='card.have');
 assert.throws(()=>issueFinaleFrost(owned,{layerIndex:0,cardDefId:'card.have'}),/exactly one/);
 const twoMissing=surface();twoMissing.combat.enemyState.bossMechanic.taskPlan=[{supportCardDefId:'card.to',witnessCardDefIds:['card.to','card.to']}];
 assert.throws(()=>issueFinaleFrost(twoMissing,{layerIndex:0,cardDefId:'card.to'}),/exactly one/);
});
test('0.11 mixed temporary validation rejects orphan/type/receipt corruption',()=>{
 const base=surface();issueFinaleFrost(base,{layerIndex:0,cardDefId:'card.to'});check(base);
 for(const mutate of [s=>s.combat.temporaryCardIds.pop(),s=>s.activeCardIds.push(s.combat.temporaryCardIds[0]),s=>s.combat.temporaryCardMeta[s.combat.temporaryCardIds[0]].cardKind='WORD',s=>s.combat.finaleFrostTrace[0].layerIndex=1,s=>s.combat.shatteredTemporaryIds.push(s.combat.temporaryCardIds[0])]){const bad=structuredClone(base);mutate(bad);assert.throws(()=>check(bad));}
});
test('0.11 Deep seals 0/1/2/2 distinct WORDs, excludes OPERATION and board cards',()=>{
 for(const count of [0,1,2,10]){
  const s=assigned(1,count),before=structuredClone(s.rng);applyFinaleHandSeal(s);const m=s.combat.enemyState.bossMechanic;
  assert.equal(m.sealedWordIds.length,Math.min(2,count));assert.equal(new Set(m.sealedWordIds).size,m.sealedWordIds.length);assert.ok(m.sealedWordIds.every(id=>s.cardInstances[id].cardDefId!=='card.operation.supply'));
  assert.equal(s.rng.encounter.cursor-before.encounter.cursor,Math.min(2,count));validateFinaleHandSeal(s);
 }
 const s=assigned(1,2),id=s.combat.handIds.shift();s.combat.sentenceSlots=[{cardInstanceId:id,selection:null}];applyFinaleHandSeal(s);assert.equal(s.combat.enemyState.bossMechanic.sealedWordIds.includes(id),false);
});
test('0.11 Deep same-turn redraw and reload retain sealed instances without RNG advance',()=>{
 const s=assigned(1),c=s.combat;applyFinaleHandSeal(s);const ids=[...c.enemyState.bossMechanic.sealedWordIds],rng=structuredClone(s.rng);
 for(const id of ids){c.handIds=c.handIds.filter(x=>x!==id);c.discardIds.push(id);assert.equal(isTurnSealed(s,id),true);}
 for(const id of ids){c.discardIds=c.discardIds.filter(x=>x!==id);c.handIds.push(id);assert.equal(isFinaleHandSealed(s,id),true);}
 applyFinaleHandSeal(s);assert.deepEqual(s.rng,rng);assert.deepEqual(c.enemyState.bossMechanic.sealedWordIds,ids);validateFinaleHandSeal(JSON.parse(JSON.stringify(s)));
 const copy=structuredClone(s);copy.combat.turnIndex++;copy.combat.turnsRemaining--;applyFinaleHandSeal(copy);assert.equal(copy.combat.enemyState.bossMechanic.cardSealHistory.length,2);validateFinaleHandSeal(copy);
});
test('0.11 Deep death clears hand/rune restrictions while preserving their receipts',()=>{
 const s=assigned(1);applyFinaleHandSeal(s);const m=s.combat.enemyState.bossMechanic,ids=[...m.sealedWordIds];m.sealedRuneInstanceId='rune.instance';m.pendingNextRuneSeal={index:1};
 s.status='BETWEEN_BATTLES';s.combat.settled=true;s.combat.enemyState.hp=0;cleanupFinaleCards(s);assert.deepEqual(m.sealedWordIds,[]);assert.equal(m.sealedRuneInstanceId,null);assert.equal(m.pendingNextRuneSeal,null);assert.equal(m.cardSealHistory.length,1);validateFinaleHandSeal(s);assert.ok(ids.every(id=>!isTurnSealed(s,id)));
});
