/** Transient display only. Events come from the committed deck operation, not set differences. */
const visible=node=>{const r=node?.getBoundingClientRect();return !!r?.width&&!!r.height&&getComputedStyle(node).visibility!=='hidden';};
const rect=node=>node?.getBoundingClientRect();
const center=r=>({x:r.left+r.width/2,y:r.top+r.height/2});
export function captureCardMovement(root){
 const cards=new Map();
 for(const n of root.querySelectorAll('.hand-cards .word-card'))if(visible(n))cards.set(n.dataset.cardId,{node:n.cloneNode(true),rect:rect(n)});
 return {cards,hand:rect(root.querySelector('.hand-page-row')),discard:rect(root.querySelector('.pile-discard')),draw:rect(root.querySelector('.pile-button'))};
}
export async function presentCardMovement(root,receipt,before,{signal,speed=1,effectsOff=false,reducedMotion=false}={}){
 if(!receipt?.events.length||effectsOff||reducedMotion||signal?.aborted)return {status:'SKIPPED',actionKey:receipt?.actionKey};
 const doc=root.ownerDocument,layer=doc.createElement('div');layer.className='card-transfer-layer';layer.dataset.actionKey=receipt.actionKey;
 (doc.fullscreenElement??doc.body).append(layer);
 const animations=new Set(),hidden=new Set();let cancelled=false;
 const cancel=()=>{cancelled=true;for(const a of animations)a.cancel();};
 const hide=()=>{if(doc.hidden)cancel();};
 const listeners=[[doc,'atlas:viewport',cancel],[doc,'fullscreenchange',cancel],[doc,'visibilitychange',hide],[window,'resize',cancel],[window,'blur',cancel],[window,'pagehide',cancel]];
 listeners.forEach(([n,k,f])=>n.addEventListener(k,f));signal?.addEventListener('abort',cancel,{once:true});
 const arrivals=new Map([...root.querySelectorAll('.hand-cards .word-card')].filter(visible).map(n=>[n.dataset.cardId,n]));
 const drawnIds=new Set(receipt.events.filter(e=>e.type==='DRAW').flatMap(e=>e.ids));
 for(const [id,n]of arrivals)if(drawnIds.has(id)){n.classList.add('transfer-awaiting');hidden.add(n);}
 const fly=async(node,from,to,duration)=>{
  if(cancelled||!from||!to)return;
  const clone=node?.cloneNode(true)??doc.createElement('div');
  if(!node){clone.className='transfer-card-back';clone.textContent='◆';}
  clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));clone.removeAttribute('id');clone.removeAttribute('hidden');clone.classList.remove('transfer-awaiting');
  clone.classList.add('transfer-copy');clone.setAttribute('aria-hidden','true');clone.inert=true;
  const a=center(from),b=center(to),origin=layer.getBoundingClientRect();
  Object.assign(clone.style,{left:`${a.x-origin.left-from.width/2}px`,top:`${a.y-origin.top-from.height/2}px`,width:`${from.width}px`,height:`${from.height}px`});layer.append(clone);
  try{const animation=clone.animate?.([{transform:'translate(0,0) scale(1)',opacity:.92},{transform:`translate(${b.x-a.x}px,${b.y-a.y}px) scale(.65)`,opacity:.15}],{duration,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'});if(animation){animations.add(animation);await animation.finished.catch(()=>{});animations.delete(animation);}}
  finally{clone.remove();}
 };
 try{
  // All selected cards in a batch overlap; even a reshuffle never queues per-card waits.
  const duration=Math.min(600,480/Math.max(.5,Number(speed)||1))/receipt.events.length;
  for(const event of receipt.events){
   if(cancelled)break;layer.dataset.phase=event.type;
   const hand=rect(root.querySelector('.hand-page-row'))??before.hand,draw=rect(root.querySelector('.pile-button'))??before.draw,discard=rect(root.querySelector('.pile-discard'))??before.discard;
   if(event.type==='DISCARD')await Promise.all(event.ids.map(id=>{const item=before.cards.get(id);return fly(item?.node,item?.rect??hand,discard,duration);}));
   if(event.type==='RESHUFFLE')await fly(null,discard,draw,duration);
   if(event.type==='DRAW'){
    await Promise.all(event.ids.map(id=>{const target=arrivals.get(id);const r=target?rect(target):hand;return fly(target,draw,r,duration);}));
    for(const id of event.ids){const n=arrivals.get(id);n?.classList.remove('transfer-awaiting');hidden.delete(n);}
   }
  }
  return {status:cancelled?'INTERRUPTED':'FINISHED',actionKey:receipt.actionKey};
 }finally{
  cancel();for(const n of hidden)n.classList.remove('transfer-awaiting');layer.remove();
  listeners.forEach(([n,k,f])=>n.removeEventListener(k,f));signal?.removeEventListener('abort',cancel);
 }
}
