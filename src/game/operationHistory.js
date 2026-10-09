import {hasSkyCampaign,hasPolishCampaign} from '../data/campaignFeatures.js';
import {cardDefinition,maxPolish} from '../data/cardCatalog.js';
import {assertStream} from './rng.js';
import {operationSpec} from '../data/operationSpec.js';
import {operationLifetime,operationPileSnapshot,resolveOperationMovement} from './operationResolution.js';
/** A save cannot invent exhausted words or replay an effect as a fresh use. Read only. */
export function validateOperationHistory(run){
 const c=run.combat;if(!c)return true;
 if(hasPolishCampaign(run))return validatePolishedHistory(run);
 const fail=()=>{throw Error('운영 카드 사용 기록이 잘못되었습니다.');};
 if(!hasSkyCampaign(run)){if(c.operationHistory?.length||c.pendingOperationId||c.phase==='OPERATION_PRESENTING')fail();return true;}
 if(!Array.isArray(c.exhaustedIds)||!Array.isArray(c.operationHistory)||!Number.isSafeInteger(c.operationSequence)||c.operationSequence!==c.operationHistory.length)fail();
 const sources=new Set();
 for(const [i,e]of c.operationHistory.entries()){
  const def=cardDefinition(e.cardDefId,run.version);
  if(e.effectId!==`${run.runId}:battle.${run.progress.battleNumber}:operation.${i+1}`||e.operationSequence!==i+1||e.runId!==run.runId||e.battleId!==c.enemyState.id||def?.cardKind!=='OPERATION'||e.operationType!==def.operationType||sources.has(e.sourceCardId))fail();
  if(!Number.isSafeInteger(e.expectedRevision)||e.expectedRevision<0||e.expectedRevision>=run.revision||e.versions?.game!==run.version||e.versions?.operation!=='0.4.0')fail();
  if(!Array.isArray(e.drawnCardIds)||![1,2].includes(e.actualDrawCount)||e.actualDrawCount!==e.drawnCardIds.length||new Set(e.drawnCardIds).size!==e.drawnCardIds.length||e.drawnCardIds.includes(e.sourceCardId))fail();
  if(e.operationType==='SEARCH'&&(e.actualDrawCount!==1||e.targetCardId!==e.drawnCardIds[0]||JSON.stringify(e.before.rng)!==JSON.stringify(e.after.rng)))fail();
  const before=e.before,after=e.after;for(const ids of [before.handIds,after.handIds,before.exhaustedIds,after.exhaustedIds])if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!id))fail();if(run.cardInstances[e.sourceCardId]&&run.cardInstances[e.sourceCardId].cardDefId!==e.cardDefId)fail();if(after.handIds.length>c.rulesSnapshot.handLimit||JSON.stringify(before.exhaustedIds)!==JSON.stringify([...sources]))fail();assertStream(before.rng);assertStream(after.rng);
  if(!before.handIds.includes(e.sourceCardId)||JSON.stringify(after.handIds)!==JSON.stringify([...before.handIds.filter(id=>id!==e.sourceCardId),...e.drawnCardIds])||JSON.stringify(after.exhaustedIds)!==JSON.stringify([...before.exhaustedIds,e.sourceCardId]))fail();
  if(before.exhaustedIds.includes(e.sourceCardId)||before.exhaustedIds.some(id=>!sources.has(id)))fail();
  sources.add(e.sourceCardId);
 }
 if(c.exhaustedIds.some(id=>!sources.has(id))||[...sources].some(id=>run.activeCardIds.includes(id)&&!c.exhaustedIds.includes(id)))fail();
 if(c.phase==='OPERATION_PRESENTING'?c.pendingOperationId!==c.operationHistory.at(-1)?.effectId:c.pendingOperationId!==null)fail();
 return true;
}

function validatePolishedHistory(run){
 const c=run.combat,fail=()=>{throw Error('운영 카드 0.6.1 사용 기록이 잘못되었습니다.');},equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const list=x=>Array.isArray(x)&&x.every(id=>typeof id==='string'&&id)&&new Set(x).size===x.length;
 if(!list(c.exhaustedIds)||!Array.isArray(c.operationHistory)||!Number.isSafeInteger(c.operationSequence)||c.operationSequence!==c.operationHistory.length)fail();
 const exhausted=[],uses=new Map(),commands=new Set();
 const frostDefinitions=new Map((c.frostSupplyTrace?.[0]?.cardDefIds??[]).map((def,i)=>[`frost.${run.runId}.battle.${run.progress.battleNumber}.${String(i).padStart(2,'0')}`,def]));
 for(const [i,e]of c.operationHistory.entries()){
  const def=cardDefinition(e.cardDefId,run.version),ss=e.sourceSnapshot;
  if(e.operationVersion!=='0.6.1'||e.versions?.operation!=='0.6.1'||e.versions?.game!==run.version||e.effectId!==`${run.runId}:battle.${run.progress.battleNumber}:operation.${i+1}`||e.operationSequence!==i+1||e.runId!==run.runId||e.battleId!==c.enemyState.id||def?.cardKind!=='OPERATION'||!ss)fail();
  if(typeof e.commandId!=='string'||!e.commandId||commands.has(e.commandId)||!run.appliedCommandIds.includes(e.commandId)||!Number.isSafeInteger(e.expectedRevision)||e.expectedRevision<0||e.expectedRevision>=run.revision)fail();
  commands.add(e.commandId);
  const spec=operationSpec(e.cardDefId,ss.polishLevel,ss.lifetime,run.version);
  if(!spec||e.operationType!==spec.type||e.requestedCount!==spec.requestedCount||e.sourcePile!==spec.sourcePile||e.filterId!==spec.filterId||e.selectionMode!==spec.selectionMode||e.postUseDestination!==spec.afterUseDestination||ss.afterUseDestination!==spec.afterUseDestination)fail();
  if(uses.has(e.sourceCardId)&&(spec.afterUseDestination!=='DISCARD'||!equal(uses.get(e.sourceCardId),ss)))fail();
  const keys=['handIds','drawIds','discardIds','exhaustedIds','shatteredTemporaryIds'];
  for(const state of [e.before,e.after]){
   if(!state||keys.some(k=>!list(state[k])))fail();
   const all=keys.flatMap(k=>state[k]);if(new Set(all).size!==all.length||state.handIds.length>c.rulesSnapshot.handLimit)fail();assertStream(state.rng);
  }
  if(!equal(e.before.exhaustedIds,exhausted)||e.before.exhaustedIds.includes(e.sourceCardId)||!list(e.drawnCardIds)||e.actualDrawCount!==e.drawnCardIds.length||e.actualDrawCount<1)fail();
  const beforeIds=keys.flatMap(k=>e.before[k]);
  if(!e.cardSnapshots||!equal(Object.keys(e.cardSnapshots).sort(),[...beforeIds].sort()))fail();
  for(const [id,card]of Object.entries(e.cardSnapshots)){
   if(card?.instanceId!==id||!cardDefinition(card,run.version)||run.cardInstances[id]&&run.cardInstances[id].cardDefId!==card.cardDefId)fail();
   if(!Number.isSafeInteger(card.polishLevel)||card.polishLevel<0||card.polishLevel>maxPolish(card,run.version)||card.specialEffectId!==null)fail();
   const current=run.cardInstances[id];
   const removedByReward=run.reward?.resolved&&run.reward.resolution?.kind==='REMOVE'&&run.reward.resolution.cardInstanceId===id;
   if(!current&&(run.status==='BATTLE'||!frostDefinitions.has(id)&&!removedByReward))fail();
   if(current&&(operationLifetime(current)!==operationLifetime(card)||(run.status==='BATTLE'?current.polishLevel!==card.polishLevel:current.polishLevel<card.polishLevel)))fail();
   // Cleanup deletes temporary objects, but the fixed supply trace still proves
   // which physical IDs were battle-only and what each of those cards was.
   if(frostDefinitions.has(id)){
    if(card.cardDefId!==frostDefinitions.get(id)||card.polishLevel!==0||card.temporary?.source!=='MIRROR_SNOWFIELD'||card.temporary.battleId!==c.enemyState.id)fail();
   }else if(card.temporary)fail();
  }
  const source=e.cardSnapshots[e.sourceCardId];if(!source||source.cardDefId!==e.cardDefId||source.polishLevel!==ss.polishLevel||operationLifetime(source)!==ss.lifetime)fail();
  const proposed=structuredClone(e.before),stream=structuredClone(e.before.rng);
  const drawn=resolveOperationMovement(proposed,e.cardSnapshots,run.version,spec,e.sourceCardId,e.targetCardId,c.rulesSnapshot.handLimit,stream);
  if(!equal(drawn,e.drawnCardIds)||!equal(operationPileSnapshot(proposed,stream),e.after))fail();
  if(spec.selectionMode!=='DIRECT'&&e.targetCardId!==null)fail();
  if(spec.afterUseDestination==='EXHAUSTED')exhausted.push(e.sourceCardId);
  uses.set(e.sourceCardId,ss);
 }
 // Battle cleanup may remove temporary sources, while their immutable receipts survive.
 if(!equal(c.exhaustedIds,exhausted.filter(id=>run.cardInstances[id])))fail();
 if(c.phase==='OPERATION_PRESENTING'?c.pendingOperationId!==c.operationHistory.at(-1)?.effectId:c.pendingOperationId!==null)fail();
 return true;
}
