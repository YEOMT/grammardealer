import {TIME_GOLEM_PHASES,TIME_GOLEM_BREAKS} from '../data/stage3.js';
/** Validate both saved and proposed boss states. Never repairs a corrupt boundary. */
export function validateTimeGolem(enemy){
 const b=enemy.bossMechanic,fail=()=>{throw Error('Invalid TIME_GOLEM phase state');};
 if(b?.id!=='TIME_GOLEM'||!Number.isInteger(b.activePhase)||b.activePhase<0||b.activePhase>3||b.phaseOrder?.join('|')!==TIME_GOLEM_PHASES.join('|')||b.phases?.length!==3)fail();
 for(const[p,i]of b.phases.map((p,i)=>[p,i])){
  if(p.id!==TIME_GOLEM_PHASES[i]||p.maxHp!==240||!Number.isSafeInteger(p.hp)||p.hp<0||p.hp>p.maxHp||p.broken!==(p.hp===0))fail();
  if(i<b.activePhase&&p.hp!==0||i>b.activePhase&&p.hp!==p.maxHp||i===b.activePhase&&p.hp===0)fail();
 }
 if(b.phases.reduce((n,p)=>n+p.hp,0)!==enemy.hp||(enemy.maxHp??enemy.hpMax??720)!==720)fail();return true;
}
/** One attack freezes one active phase. No overflow loop, RNG, or state mutation. */
export function resolveTimeGolem(analysis,power,enemy){
 validateTimeGolem(enemy);const before=structuredClone(enemy.bossMechanic),after=structuredClone(before),phase=before.phases[before.activePhase];
 if(!phase)throw Error('Cannot attack an already defeated time golem');
 const evidence=(analysis.verbPhrases??[]).filter(v=>v.temporalEvidenceEligible&&v.chainWellFormed&&v.finiteCardId&&v.tenseFamily===phase.id);
 const blocked=!evidence.length,actualHpLoss=blocked?0:Math.min(power,phase.hp),phaseExcess=blocked?0:Math.max(0,power-phase.hp);
 const target=after.phases[before.activePhase];target.hp-=actualHpLoss;target.broken=target.hp===0;
 if(target.broken)after.activePhase++;
 const labelKo=blocked?['공격이 막혔습니다! 과거의 갑옷을 깨려면 과거 계열 문장이 필요합니다.','공격이 막혔습니다! 현재의 엔진을 멈추려면 현재 계열 문장이 필요합니다.','공격이 막혔습니다! 미래의 신경을 끊으려면 미래 표현이 필요합니다.'][before.activePhase]:target.broken?TIME_GOLEM_BREAKS[before.activePhase]:'활성 시간 부위 적중';
 return {bossStateBefore:before,bossStateAfter:after,phaseId:phase.id,phaseBreak:target.broken,phaseExcess,blocked,labelKo,actualHpLoss,enemyHpAfter:enemy.hp-actualHpLoss,evidenceRefs:evidence.map(v=>v.id),highlightCardIds:[...new Set(evidence.flatMap(v=>v.cardIds))]};
}
