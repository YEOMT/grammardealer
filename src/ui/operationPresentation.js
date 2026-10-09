import {operationCardsForVersion} from '../data/operationSpec.js';
import {presentationClock} from '../engine/presentationClock.js';
/** Presentation consumes a committed result; it never draws, grants or mutates a run. */
export async function presentOperation(effect,{sourceElement,showAfter,audio,document=globalThis.document,reducedMotion=false,effectsOff=false,signal}={}){
 const clock=presentationClock({document,signal,budget:1600});
 try{
  audio?.play('operation');
  if(!reducedMotion&&!effectsOff){sourceElement?.classList.add('operation-used');await clock.wait(240);}
  const root=showAfter();
  const label=root?.querySelector('[data-presentation="label"]');if(label){const name=effect.sourceSnapshot?.lifetime==='BATTLE'?'빙정 탐색':operationCardsForVersion(effect.operationVersion??'0.6.0').find(c=>c.id===effect.cardDefId)?.nameKo??(effect.operationType==='SUPPLY'?'보급':'탐색');const destination=effect.postUseDestination==='DISCARD'?'버린 더미로 이동 · 다시 뽑아 재사용':effect.sourceSnapshot?.lifetime==='BATTLE'?'사용 완료 · 이번 전투 한정':'사용 완료 · 다음 전투에 복귀';label.textContent=`${name} · 실제 ${effect.actualDrawCount}장 획득 · ${destination}`;}
  const arrivals=[...(root?.querySelectorAll('[data-card-id]')??[])].filter(n=>effect.drawnCardIds.includes(n.dataset.cardId));
  if(!reducedMotion&&!effectsOff){arrivals.forEach(n=>n.classList.add('operation-arrival'));await clock.wait(220);}
  // Keep the committed destination readable even when decorative effects are reduced.
  await clock.wait(360);
  return {status:signal?.aborted?'INTERRUPTED':'FINISHED',effectId:effect.effectId};
 }finally{sourceElement?.classList.remove('operation-used');clock.close();}
}
