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
  const fit=()=>{
    const r=slot.getBoundingClientRect(),stage=slot.closest('.enemy-area');if(!stage||!r.width||!r.height)return;
    const [w,h,left,top,right,bottom]=art.bounds,unit=Math.min(r.width/w,r.height/h);
    const x=(r.width-w*unit)/2,y=r.height-h*unit,foot=y+bottom*unit;
    // Preserve the previous 1.12x canvas's ground line, using one common foot anchor for both poses.
    const shift=(foot-r.height)*.12,ground=r.top+foot+shift,center=r.left+r.width/2;
    const l=stage.querySelector('.enemy-tactics').getBoundingClientRect(),rr=stage.querySelector('.enemy-info').getBoundingClientRect();
    const boss=enemy.kind==='REGIONAL_BOSS'||enemy.kind==='FINAL_BOSS';
    // Two normal-sized bodies is a target, constrained by this unchanged stage.
    const normalArt=MONSTER_ASSETS[enemy.enemyId==='boss.stage1'?'enemy.stage1.01':'enemy.stage2.01'];
    const normalBody=(normalArt.bounds[5]-normalArt.bounds[3])*Math.min(r.width/normalArt.bounds[0],r.height/normalArt.bounds[1])*normalArt.scale;
    const desired=boss?normalBody*2/((bottom-top)*unit):art.scale;
    const scale=Math.max(0,Math.min(desired,
      (center-l.right-8)/(r.width/2-x-left*unit),
      (rr.left-center-8)/(x+right*unit-r.width/2),
      (ground-stage.getBoundingClientRect().top-8)/((bottom-top)*unit)));
    motion.style.transformOrigin=`50% ${foot}px`;
    motion.style.setProperty('--monster-foot-shift',`${shift}px`);
    motion.style.setProperty('--monster-scale',scale);
    if(boss){motion.dataset.bodyTarget=String(normalBody*2);motion.dataset.bodyHeight=String((bottom-top)*unit*scale);motion.dataset.safetyCapped=String(scale<desired);}
  };
  const resize=new ResizeObserver(fit);resize.observe(slot);fit();
  let alive=true,epoch=0,timer=null,pose='idle',dead=enemy.hp===0,animation=null;const seen=new Set(),images={};
  const show=()=>{if(!alive)return;const image=images[pose]?.dataset.ready==='true'?images[pose]:images.idle?.dataset.ready==='true'?images.idle:null;
    for(const img of Object.values(images))img.style.visibility=img===image?'visible':'hidden';fallback.hidden=!!image;element.dataset.monsterPose=dead?'dead':pose;};
  for(const kind of ['idle','hit']){const img=doc.createElement('img');images[kind]=img;img.alt='';img.draggable=false;img.className='monster-image';img.style.objectPosition=art.anchor;img.decoding='async';
    img.onload=()=>{if(alive){img.dataset.ready='true';show();}};img.onerror=()=>{if(alive){warnAsset(img.src);show();}};motion.append(img);img.src=sceneAssetUrl(art[kind]);}
  const reset=killed=>{epoch++;clearTimeout(timer);animation?.cancel();animation=null;dead=!!killed;pose=dead?'hit':'idle';motion.style.opacity=dead?'0':'1';show();};
  const view={impactPoint(){
      if(!art.impactAnchor){const b=this.visibleRect();return {x:b.left+b.width/2,y:b.top+b.height/2};}
      const r=images.idle.getBoundingClientRect(),[w,h]=art.bounds,u=Math.min(r.width/w,r.height/h);
      return {x:r.left+(r.width-w*u)/2+art.impactAnchor[0]*w*u,y:r.bottom-h*u+art.impactAnchor[1]*h*u};
    },visibleRect(){
      const img=images.idle,r=img.getBoundingClientRect(),[w,h,left,top,right,bottom]=art.bounds,unit=Math.min(r.width/w,r.height/h);
      const x=r.left+(r.width-w*unit)/2,y=r.bottom-h*unit;
      return {left:x+left*unit,top:y+top*unit,width:(right-left)*unit,height:(bottom-top)*unit};
    },begin(options={}){reset(false);element.dataset.staticMotion=String(!!(options.effectsOff||options.reducedMotion));},
    impact({attackId,actualHpLoss,killed,staticMotion=false}){
      if(!alive||seen.has(attackId)||actualHpLoss<=0)return;seen.add(attackId);const token=++epoch;clearTimeout(timer);animation?.cancel();dead=killed;pose='hit';show();
      if(killed){motion.style.opacity='0';animation=motion.animate([{opacity:1},{opacity:0}],{duration:staticMotion?100:360});}
      else{if(!staticMotion)animation=motion.animate([{translate:'0 0',filter:'brightness(1.25)'},{translate:'3px 0'},{translate:'0 0',filter:'brightness(1)'}],{duration:200});timer=setTimeout(()=>{if(alive&&token===epoch){pose='idle';show();}},220);}
    },reset,cleanup(){alive=false;epoch++;clearTimeout(timer);animation?.cancel();resize.disconnect();for(const img of Object.values(images)){img.onload=null;img.onerror=null;}views.delete(element);}};
  views.set(element,view);reset(dead);return view.cleanup;
}
