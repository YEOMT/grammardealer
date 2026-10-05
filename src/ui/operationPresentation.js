import {presentationClock} from '../engine/presentationClock.js';
/** Presentation consumes a committed result; it never draws, grants or mutates a run. */
export async function presentOperation(effect,{sourceElement,showAfter,audio,document=globalThis.document,reducedMotion=false,effectsOff=false,signal}={}){
 const clock=presentationClock({document,signal,budget:1600});
 try{
  audio?.play('operation');
  if(!reducedMotion&&!effectsOff){sourceElement?.classList.add('operation-used');await clock.wait(240);}
  const root=showAfter();
  const label=root?.querySelector('[data-presentation="label"]');if(label)label.textContent=`${effect.operationType==='SUPPLY'?'보급':'탐색'} · 실제 ${effect.actualDrawCount}장 획득 · 다음 전투에 복귀`;
  const arrivals=[...(root?.querySelectorAll('[data-card-id]')??[])].filter(n=>effect.drawnCardIds.includes(n.dataset.cardId));
  if(!reducedMotion&&!effectsOff){arrivals.forEach(n=>n.classList.add('operation-arrival'));await clock.wait(220);}
  return {status:signal?.aborted?'INTERRUPTED':'FINISHED',effectId:effect.effectId};
 }finally{sourceElement?.classList.remove('operation-used');clock.close();}
}
