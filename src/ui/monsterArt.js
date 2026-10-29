import {MONSTER_ASSETS,sceneAssetUrl,warnAsset} from '../services/sceneAssets.js';
const views=new WeakMap();
export const monsterViewFor=element=>views.get(element);

/** One fixed slot, a common transform for both original canvases, no game callbacks. */
export function attachMonster(element,enemy,name){
  const art=MONSTER_ASSETS[enemy.enemyId];if(!art)return()=>{};
  const doc=element.ownerDocument,slot=doc.createElement('div');slot.className='monster-slot';element.replaceWith(slot);slot.append(element);
  element.classList.add('has-monster-art');element.setAttribute('role','img');element.setAttribute('aria-label',name);
  const fallback=doc.createElement('span');fallback.className='monster-fallback';fallback.textContent=enemy.emoji||'✦';
  const motion=doc.createElement('div');motion.className='monster-art-motion';motion.dataset.motion=art.motion;motion.style.setProperty('--monster-scale',art.scale);
  element.replaceChildren(fallback,motion);
  let alive=true,epoch=0,timer=null,pose='idle',dead=enemy.hp===0,animation=null;const seen=new Set(),images={};
  const show=()=>{if(!alive)return;const image=images[pose]?.dataset.ready==='true'?images[pose]:images.idle?.dataset.ready==='true'?images.idle:null;
    for(const img of Object.values(images))img.style.visibility=img===image?'visible':'hidden';fallback.hidden=!!image;element.dataset.monsterPose=dead?'dead':pose;};
  for(const kind of ['idle','hit']){const img=doc.createElement('img');images[kind]=img;img.alt='';img.draggable=false;img.className='monster-image';img.style.objectPosition=art.anchor;img.decoding='async';
    img.onload=()=>{if(alive){img.dataset.ready='true';show();}};img.onerror=()=>{if(alive){warnAsset(img.src);show();}};motion.append(img);img.src=sceneAssetUrl(art[kind]);}
  const reset=killed=>{epoch++;clearTimeout(timer);animation?.cancel();animation=null;dead=!!killed;pose=dead?'hit':'idle';motion.style.opacity=dead?'0':'1';show();};
  const view={begin(options={}){reset(false);element.dataset.staticMotion=String(!!(options.effectsOff||options.reducedMotion));},
    impact({attackId,actualHpLoss,killed,staticMotion=false}){
      if(!alive||seen.has(attackId)||actualHpLoss<=0)return;seen.add(attackId);const token=++epoch;clearTimeout(timer);animation?.cancel();dead=killed;pose='hit';show();
      if(killed){motion.style.opacity='0';animation=motion.animate([{opacity:1},{opacity:0}],{duration:staticMotion?100:360});}
      else{if(!staticMotion)animation=motion.animate([{translate:'0 0',filter:'brightness(1.25)'},{translate:'3px 0'},{translate:'0 0',filter:'brightness(1)'}],{duration:200});timer=setTimeout(()=>{if(alive&&token===epoch){pose='idle';show();}},220);}
    },reset,cleanup(){alive=false;epoch++;clearTimeout(timer);animation?.cancel();for(const img of Object.values(images)){img.onload=null;img.onerror=null;}views.delete(element);}};
  views.set(element,view);reset(dead);return view.cleanup;
}
