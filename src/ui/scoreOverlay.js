import {createScoreHeat,SCORE_HEAT_SCALES,scoreHeatTier} from '../engine/scoreHeat.js';
import {scoreFeedback} from '../engine/scoreFeedback.js';

/** A single, input-transparent display above clipping panels, below native dialogs. */
export function createScoreOverlay(root){
 const doc=root.ownerDocument,heat=createScoreHeat();let host=null,number=null,label=null,settings={},burst=null;
 const anchor=()=>root.querySelector('[data-presentation="score"]');
 function position(){if(!host)return;const a=anchor();if(!a?.isConnected){clear();return;}
  const r=a.getBoundingClientRect(),parent=doc.fullscreenElement??doc.body;if(host.parentNode!==parent)parent.append(host);
  host.style.left=`${r.left+r.width/2}px`;host.style.top=`${r.top+r.height/2}px`;
 }
 function tier(value){const n=scoreHeatTier(value);host.dataset.tier=String(n);host.style.setProperty('--heat-scale',SCORE_HEAT_SCALES[n]);host.style.setProperty('--heat-glow',`${4+n*2}px`);host.style.setProperty('--heat-color',['#f6eed8','#f6e2b1','#ffdb85','#ffd173','#ffc168','#ffaf61','#ffa255','#ff9455','#ffaf73','#ffd297','#ffe1b2','#fff1d0'][n]);
  number.style.setProperty('--heat-digit-fit',Math.min(1,8/Math.max(1,String(value).length)));number.textContent=String(value);position();
 }
 function clear(){heat.reset();burst?.cancel();burst=null;host?.remove();host=number=label=null;root.classList.remove('has-score-overlay');doc.removeEventListener('fullscreenchange',position);doc.removeEventListener('atlas:viewport',position);globalThis.removeEventListener('resize',position);}
 return {
  get number(){return number;},get label(){return label;},
  begin(id,options){if(host&&!heat.begin(id))return;clear();heat.begin(id);settings=options;
   host=doc.createElement('div');host.className='score-overlay';host.setAttribute('aria-hidden','true');host.inert=true;host.dataset.attackId=id;host.dataset.static=String(!!(options.effectsOff||options.reducedMotion));
   number=doc.createElement('strong');number.className='score-overlay-number';label=doc.createElement('span');label.className='score-overlay-label';host.append(number,label);(doc.fullscreenElement??doc.body).append(host);root.classList.add('has-score-overlay');
   doc.addEventListener('fullscreenchange',position);doc.addEventListener('atlas:viewport',position);globalThis.addEventListener('resize',position);tier(0);
  },
  text(name,value){if(!host)return;if(name==='score')tier(Number(value));if(name==='label')label.textContent=String(value);},
  score(event){if(!host)return;const state=heat.apply(event);if(state.duplicate)return;const feedback=scoreFeedback(event);host.dataset.feedback=feedback.kind;tier(state.value);
   if(state.burst&&!settings.effectsOff&&!settings.reducedMotion){burst?.cancel();burst=host.animate([{filter:'brightness(1)'},{filter:'brightness(1.65)',offset:.35},{filter:'brightness(1)'}],{duration:300,easing:'ease-out'});burst.finished.catch(()=>{});}
  },
  position,clear,
 };
}
