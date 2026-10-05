import {cardDefinition} from '../data/cardCatalog.js';
import {assertStream} from './rng.js';
/** A save cannot invent exhausted words or replay an effect as a fresh use. Read only. */
export function validateOperationHistory(run){
 const c=run.combat;if(!c)return true;
 const fail=()=>{throw Error('운영 카드 사용 기록이 잘못되었습니다.');};
 if(run.version!=='0.4.0'){if(c.operationHistory?.length||c.pendingOperationId||c.phase==='OPERATION_PRESENTING')fail();return true;}
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
