import {safeInteger} from './numeric.js';
import {FRAME_KEYS,mainFrameEvidence,frameLabel} from './foresight.js';
import {clauseThreadEvidence} from './clauseThreads.js';

export const FATE_POLICY='fate.foresight-two-threads.v1';
export const FATE_KEYS=Object.freeze(['PARTICIPIAL','COUNTERFACTUAL']);
export const initialFateThreads=()=>({id:'FATE_FORESIGHT_THREADS',policyVersion:FATE_POLICY,rememberedFrame:null,threads:{PARTICIPIAL:null,COUNTERFACTUAL:null},appliedAttackIds:[]});
export const fateThreadLabel=key=>key==='PARTICIPIAL'?'분사구문':'가정법';

/** Arithmetic only: callers supply proven structure. Foresight precedes release and HP floor. */
export function fateDecision({memory=null,frame=null,validMain=false,evidence={},power,hp,threads,action='SUBMIT'}){
 safeInteger(power,'fate power',{min:0});safeInteger(hp,'fate hp',{min:0});
 if([memory,frame].some(k=>k!==null&&!Object.values(FRAME_KEYS).includes(k)))throw Error('Invalid fate frame');
 const eligible=action==='SUBMIT'&&validMain&&frame!==null&&power>0;
 const bypassed=eligible&&!!evidence.COUNTERFACTUAL,blocked=eligible&&!bypassed&&memory===frame;
 const finalPower=action==='SUBMIT'&&!blocked?power:0;
 const unlockedThreads=eligible&&finalPower>0?FATE_KEYS.filter(k=>!threads[k]&&evidence[k]):[];
 const remainingThreads=FATE_KEYS.filter(k=>!threads[k]&&!unlockedThreads.includes(k)).length;
 const actualHpLoss=Math.min(finalPower,Math.max(0,hp-(remainingThreads?1:0))),enemyHpAfter=hp-actualHpLoss;
 return {rememberedFrameBefore:memory,rememberedFrameAfter:eligible?frame:memory,validMain:eligible,bypassed,blocked,preBossPower:power,finalPower,unlockedThreads,remainingThreads,actualHpLoss,enemyHpAfter,preventedDamage:remainingThreads?finalPower-actualHpLoss:0,overkill:remainingThreads?0:Math.max(0,finalPower-hp),killed:hp>0&&enemyHpAfter===0};
}
export function resolveFateThreads(analysis,power,enemy,{attackId,eligibleAnalysis=analysis}={}){
 const before=enemy.bossMechanic;
 if(before?.id!=='FATE_FORESIGHT_THREADS'||before.policyVersion!==FATE_POLICY||!attackId||!before.threads||!Array.isArray(before.appliedAttackIds))throw Error('Invalid fate context');
 if(before.appliedAttackIds.includes(attackId))throw Error('Duplicate fate attack');
 const main=mainFrameEvidence(analysis),raw=clauseThreadEvidence(analysis,eligibleAnalysis),evidence={};
 const participles=[raw.ACTIVE,raw.PASSIVE].filter(Boolean);
 if(participles.length)evidence.PARTICIPIAL={evidenceRefs:[...new Set(participles.flatMap(e=>e.evidenceRefs))],highlightCardIds:[...new Set(participles.flatMap(e=>e.highlightCardIds))]};
 if(raw.COUNTERFACTUAL)evidence.COUNTERFACTUAL=raw.COUNTERFACTUAL;
 const result=fateDecision({memory:before.rememberedFrame,frame:main?.key??null,validMain:!!main,evidence,power,hp:enemy.hp,threads:before.threads});
 const after=structuredClone(before);after.rememberedFrame=result.rememberedFrameAfter;after.appliedAttackIds.push(attackId);
 for(const key of result.unlockedThreads)after.threads[key]={attackId,evidenceRefs:evidence[key].evidenceRefs};
 const refs=[...result.unlockedThreads,...(result.bypassed?['COUNTERFACTUAL']:[])];
 return {attackId,...result,evidenceRefs:[...new Set(refs.flatMap(k=>evidence[k].evidenceRefs))],highlightCardIds:[...new Set(refs.flatMap(k=>evidence[k].highlightCardIds))],bossStateBefore:structuredClone(before),bossStateAfter:after,
  labelKo:result.blocked?'예견 · 같은 주절 문형, 피해 0':`${result.bypassed?'가정법 · 예견 우회':`예견: ${frameLabel(after.rememberedFrame)}`} · ${result.unlockedThreads.length?result.unlockedThreads.map(fateThreadLabel).join('·')+'의 실 해제':result.remainingThreads?'두 실 · 체력 1 보호':'두 실 해제됨'}`};
}

export const fateStatusText=m=>`예견 · ${frameLabel(m.rememberedFrame)} | 분사구문 ${m.threads.PARTICIPIAL?'●':'○'} · 가정법 ${m.threads.COUNTERFACTUAL?'●':'○'}`;
