import {hasEmberCampaign,hasSkyCampaign,hasPolishCampaign} from '../data/campaignFeatures.js';
import {operationSpec} from '../data/operationSpec.js';
import {operationLifetime,operationTargetIds,operationPileSnapshot,resolveOperationMovement} from './operationResolution.js';
import {cardDefinition,cardKind} from '../data/cardCatalog.js';
import {registryForVersion} from '../data/language/index.js';
import {drawCards} from './deck.js';
import {isGuided} from './guidedTutorial.js';
import {assertRunInvariants} from './invariants.js';
const fail=message=>({ok:false,message});

/** Public order, not draw order. Instances remain distinct even for identical words. */
export function searchCandidates(run){
 const language=registryForVersion(run.version);
 return (run.combat?.drawIds??[]).filter(id=>cardKind(run.cardInstances[id],run.version)==='WORD')
  .map(id=>{const c=run.cardInstances[id],word=language.lexemeById[cardDefinition(c,run.version).lexemeId];return {cardInstanceId:id,name:word.lemma,polishLevel:c.polishLevel};})
  .sort((a,b)=>a.name.localeCompare(b.name,'en')||a.polishLevel-b.polishLevel||a.cardInstanceId.localeCompare(b.cardInstanceId));
}
export function operationAvailability(run,sourceId){
 const c=run?.combat,card=run?.cardInstances?.[sourceId],def=cardDefinition(card,run?.version);
 if(!hasSkyCampaign(run)||run.status!=='BATTLE'||c?.phase!=='EDIT'||isGuided(run)||!c.handIds.includes(sourceId)||def?.cardKind!=='OPERATION')return fail('지금은 이 운영 카드를 사용할 수 없습니다.');
 if(hasPolishCampaign(run)){
  let spec;try{spec=operationSpec(def.id,card.polishLevel,operationLifetime(card),run.version);}catch{return fail('운영 카드의 연마·수명 정보가 잘못되었습니다.');}
  const count=Math.min(spec.requestedCount,operationTargetIds(c,run.cardInstances,run.version,spec).length,Math.max(0,c.rulesSnapshot.handLimit-c.handIds.length+1));
  return count>0?{ok:true,actualDrawCount:count,operationType:spec.type,spec}:fail('가져올 수 있는 카드가 없습니다. 이 카드는 교환할 수 있습니다.');
 }
 const count=def.operationType==='SUPPLY'?Math.min(2,c.rulesSnapshot.handLimit-c.handIds.length+1,c.drawIds.length+c.discardIds.length):searchCandidates(run).length?1:0;
 return count>0?{ok:true,actualDrawCount:count,operationType:def.operationType}:fail(def.operationType==='SUPPLY'?'뽑을 수 있는 카드가 없습니다.':'드로우 더미에 탐색할 단어 카드가 없습니다.');
}
/** Mutates only a controller-owned proposal. All preconditions precede RNG and movement. */
export function useOperation(run,command){
 const {sourceCardId,expectedRevision,battleId,targetCardId,commandId}=command;
 const available=operationAvailability(run,sourceCardId);
 if(!available.ok)return available;
 const c=run.combat;
 if(expectedRevision!==run.revision||battleId!==c.enemyState.id)return fail('이전 상태의 운영 카드 요청입니다. 다시 선택하세요.');
 if(hasPolishCampaign(run)){
  if(typeof commandId!=='string'||!commandId||run.appliedCommandIds.includes(commandId))return fail('운영 카드 명령 식별자를 확인하세요.');
  const spec=available.spec;if(spec.selectionMode==='DIRECT'&&!searchCandidates(run).some(x=>x.cardInstanceId===targetCardId))return fail('드로우 더미의 단어 카드를 선택하세요.');
  assertRunInvariants(run,registryForVersion(run.version));
  const before=operationPileSnapshot(c,run.rng.deck),source=run.cardInstances[sourceCardId];
  const cardSnapshots=Object.fromEntries([...new Set([...before.handIds,...before.drawIds,...before.discardIds,...before.exhaustedIds,...before.shatteredTemporaryIds])].map(id=>[id,structuredClone(run.cardInstances[id])]));
  const drawnCardIds=resolveOperationMovement(c,run.cardInstances,run.version,spec,sourceCardId,targetCardId,c.rulesSnapshot.handLimit,run.rng.deck);
  c.operationSequence++;const effectId=`${run.runId}:battle.${run.progress.battleNumber}:operation.${c.operationSequence}`;
  const effect={operationVersion:hasEmberCampaign(run)?'0.7.0':'0.6.1',effectId,commandId,runId:run.runId,battleId,expectedRevision,operationSequence:c.operationSequence,sourceCardId,cardDefId:source.cardDefId,operationType:spec.type,sourceSnapshot:{polishLevel:source.polishLevel,lifetime:operationLifetime(source),afterUseDestination:spec.afterUseDestination},requestedCount:spec.requestedCount,actualDrawCount:drawnCardIds.length,drawnCardIds,sourcePile:spec.sourcePile,selectionMode:spec.selectionMode,filterId:spec.filterId,targetCardId:targetCardId??null,postUseDestination:spec.afterUseDestination,before,after:operationPileSnapshot(c,run.rng.deck),cardSnapshots,versions:{game:run.version,operation:hasEmberCampaign(run)?'0.7.0':'0.6.1'}};
  c.operationHistory.push(effect);c.pendingOperationId=effectId;c.phase='OPERATION_PRESENTING';c.battleDirty=true;
  return {ok:true,operationEffect:effect};
 }
 if(available.operationType==='SEARCH'&&!searchCandidates(run).some(x=>x.cardInstanceId===targetCardId))return fail('드로우 더미의 단어 카드를 선택하세요.');
 assertRunInvariants(run,registryForVersion(run.version));
 const before={handIds:[...c.handIds],exhaustedIds:[...(c.exhaustedIds??[])],rng:structuredClone(run.rng.deck)};
 c.handIds=c.handIds.filter(id=>id!==sourceCardId);c.exhaustedIds=[...(c.exhaustedIds??[]),sourceCardId];
 let drawnCardIds;
 if(available.operationType==='SUPPLY')drawnCardIds=drawCards(c,2,c.rulesSnapshot.handLimit,run.rng.deck);
 else {c.drawIds=c.drawIds.filter(id=>id!==targetCardId);c.handIds.push(targetCardId);drawnCardIds=[targetCardId];}
 if(!drawnCardIds.length)throw Error('Operation promised a draw but produced none');
 c.operationSequence=(c.operationSequence??0)+1;
 const effectId=`${run.runId}:battle.${run.progress.battleNumber}:operation.${c.operationSequence}`;
 const effect={effectId,runId:run.runId,battleId,sourceCardId,cardDefId:run.cardInstances[sourceCardId].cardDefId,operationType:available.operationType,expectedRevision,operationSequence:c.operationSequence,drawnCardIds,actualDrawCount:drawnCardIds.length,...(targetCardId?{targetCardId}:{}),before,after:{handIds:[...c.handIds],exhaustedIds:[...c.exhaustedIds],rng:structuredClone(run.rng.deck)},versions:{game:run.version,operation:'0.4.0'}};
 c.operationHistory=[...(c.operationHistory??[]),effect];c.pendingOperationId=effectId;c.phase='OPERATION_PRESENTING';c.battleDirty=true;
 return {ok:true,operationEffect:effect};
}
