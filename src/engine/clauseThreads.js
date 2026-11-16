import {safeInteger} from './numeric.js';
import {mainFrameEvidence} from './foresight.js';

export const CLAUSE_THREAD_KEYS=Object.freeze(['ACTIVE','PASSIVE','COUNTERFACTUAL']);
export const clauseThreadLabel=key=>({ACTIVE:'행동',PASSIVE:'흔적',COUNTERFACTUAL:'가능성'})[key];
export const initialClauseThreads=()=>({id:'FATE_CLAUSE_THREADS',policyVersion:'0.14.0',threads:{ACTIVE:null,PASSIVE:null,COUNTERFACTUAL:null},appliedAttackIds:[]});

/** Evidence is from the submitted graph and unlock-qualified hits, never spellings. */
export function clauseThreadEvidence(analysis,eligibleAnalysis=analysis){
 if(!['VALID','VALID_WITH_ISSUES'].includes(analysis?.status))return {};
 const main=mainFrameEvidence(analysis);if(!main)return {};
 const hits=(eligibleAnalysis.grammarHits??[]).filter(h=>h.validity==='VALID'&&h.bonusEligible!==false);
 const evidence={};
 for(const key of ['ACTIVE','PASSIVE']){
  const good=hits.filter(h=>h.tag===`CLAUSE.PARTICIPIAL.${key}`&&(analysis.participialAdjuncts??[]).some(a=>a.id===h.participialAdjunctId&&a.voice===key&&a.validity==='VALID'&&!(a.issueIds??[]).length&&a.mainClauseId===main.clauseId&&a.controllerSubjectNodeId&&Number.isInteger(a.commaBoundary?.gapIndex)));
  if(good.length)evidence[key]={evidenceRefs:[...new Set(good.flatMap(h=>[h.id,h.participialAdjunctId]))],highlightCardIds:[...new Set(good.flatMap(h=>h.cardIds))]};
 }
 const counterfactual=hits.filter(h=>['CORRIDOR.UNREAL_PRESENT','CORRIDOR.UNREAL_PAST'].includes(h.tag)&&h.resultClauseId===main.clauseId&&(analysis.corridorStructures??[]).some(c=>c.id===h.corridorEvidenceId&&c.validity==='VALID'&&c.resultClauseId===main.clauseId));
 if(counterfactual.length)evidence.COUNTERFACTUAL={evidenceRefs:counterfactual.map(h=>h.id),highlightCardIds:[...new Set(counterfactual.flatMap(h=>h.cardIds))]};
 return evidence;
}

/** Release first, then apply this same attack to the remaining HP floor. */
export function resolveClauseThreads(analysis,power,enemy,{attackId,eligibleAnalysis=analysis}={}){
 safeInteger(power,'thread pre-boss power',{min:0});safeInteger(enemy.hp,'thread HP',{min:0});
 const before=enemy.bossMechanic;
 if(before?.id!=='FATE_CLAUSE_THREADS'||before.policyVersion!=='0.14.0'||!attackId||!before.threads||!Array.isArray(before.appliedAttackIds))throw Error('Invalid clause threads context');
 if(before.appliedAttackIds.includes(attackId))throw Error('Duplicate clause threads attack');
 const after=structuredClone(before),evidence=power>0?clauseThreadEvidence(analysis,eligibleAnalysis):{},unlockedThreads=[];
 for(const key of CLAUSE_THREAD_KEYS)if(!after.threads[key]&&evidence[key]){after.threads[key]={attackId,evidenceRefs:evidence[key].evidenceRefs};unlockedThreads.push(key);}
 after.appliedAttackIds.push(attackId);
 const remaining=CLAUSE_THREAD_KEYS.filter(key=>!after.threads[key]).length,floorHp=remaining?1:0;
 const actualHpLoss=Math.min(power,Math.max(0,enemy.hp-floorHp)),enemyHpAfter=enemy.hp-actualHpLoss;
 return {attackId,unlockedThreads,remainingThreads:remaining,preBossPower:power,finalPower:power,actualHpLoss,enemyHpAfter,preventedDamage:remaining?power-actualHpLoss:0,overkill:remaining?0:Math.max(0,power-enemy.hp),killed:enemy.hp>0&&enemyHpAfter===0,
  evidenceRefs:[...new Set(unlockedThreads.flatMap(k=>evidence[k].evidenceRefs))],highlightCardIds:[...new Set(unlockedThreads.flatMap(k=>evidence[k].highlightCardIds))],bossStateBefore:structuredClone(before),bossStateAfter:after,
  labelKo:unlockedThreads.length?`${unlockedThreads.map(clauseThreadLabel).join('·')}의 실 해제 · ${remaining}개 남음`:remaining?'세 실 · 체력 1 보호':'세 실 모두 해제'};
}
