import {scoreFeedback} from '../engine/scoreFeedback.js';
import {comboFeel,meaningfulComboEvent,runeFeel} from '../engine/comboFeel.js';

/** Bounded WAAPI overlays. Only physical evidence IDs from the committed score event are read. */
export function createScoreEffects(root){
 let settings={},seen=new Set(),animations=new Set(),particles=new Set();
 const pool=[];
 const release=n=>{particles.delete(n);n.remove();if(pool.length<48&&!pool.includes(n))pool.push(n);};
 const animate=(node,frames,options)=>{
  if(!node?.animate||settings.effectsOff||settings.reducedMotion)return;
  const a=node.animate(frames,{duration:280,easing:'ease-out',...options});animations.add(a);
  a.finished.catch(()=>{}).finally(()=>{animations.delete(a);a.cancel();});return a;
 };
 const clear=()=>{for(const a of animations)a.cancel();animations.clear();for(const n of particles)n.remove();particles.clear();root.querySelectorAll('.evidence-static,.combo-static').forEach(n=>n.classList.remove('evidence-static','combo-static'));root.querySelectorAll('[data-feedback]').forEach(n=>{delete n.dataset.feedback;delete n.dataset.comboTier;n.style.removeProperty('color');n.style.removeProperty('text-shadow');});};
 return {
  begin(options){clear();seen.clear();settings=options;},
  score(event,count){
   if(seen.has(event.eventId))return;
   seen.add(event.eventId);const feedback=scoreFeedback(event),meaningful=meaningfulComboEvent(event);const feel=comboFeel(count),weight=event.sourceType==='RUNE'?runeFeel(event.runeRarity??[...root.querySelectorAll('[data-rune-id]')].find(n=>n.dataset.runeId===event.sourceId)?.dataset.rarity,event.runeLevel):1;
   const score=root.querySelector('[data-presentation="score"]'),label=root.querySelector('[data-presentation="label"]');
   const rune=[...root.querySelectorAll('[data-rune-id]')].find(n=>n.dataset.runeId===event.sourceId),color=feedback.kind==='rune'?getComputedStyle(rune??root).getPropertyValue('--rune-color').trim()||feedback.color:feedback.color;
   for(const n of [score,label])if(n){n.classList.remove('combo-static');n.dataset.feedback=feedback.kind;n.style.color=feedback.color;n.style.textShadow='';}
   if(feedback.delta<=0){
    if(feedback.delta<0){animate(score,[{transform:'scale(1)'},{transform:feedback.kind==='defense'?'scale(.94)':'translateY(2px) scale(.93)',offset:.45},{transform:'scale(1)'}],{duration:350});}
    return;
   }
   const pulse=feedback.kind==='card'?1.045:feedback.kind==='rune'?Math.min(1.18,1.11+.02*weight+feel.tier*.006):Math.min(1.12,1.07+feel.tier*.01);
   for(const n of [score,label])if(n){n.dataset.combo=String(count);n.dataset.comboTier=String(feel.tier);n.style.setProperty('--combo-glow',`${(meaningful?feel.glow*weight:3)}px`);n.style.textShadow=`0 0 ${meaningful?feel.glow*weight:3}px ${color}`;n.classList.add('combo-static');animate(n,[{transform:'scale(1)'},{transform:`scale(${pulse})`,offset:.4},{transform:'scale(1)'}],{duration:280});}
   let hidden=0;const ids=[...new Set(event.highlightCardIds??[])];
   ids.forEach((id,i)=>{
    const card=[...root.querySelectorAll('.combat-sentence [data-card-id]')].find(n=>n.dataset.cardId===id);
    if(!card||card.hidden){hidden++;return;}
    const visual=card.querySelector('.card-motion')??card;visual.classList.add('evidence-static');
    animate(visual,[{transform:'translateY(0) scale(1) rotate(0)'},{transform:'translateY(1px) scale(.97)',offset:.18},{transform:`translateY(${meaningful?-4:-2}px) scale(${meaningful?1.045:1.02}) rotate(${meaningful?(i%2?1.2:-1.2):0}deg)`,offset:.46},{transform:'translateY(1px) scale(.99) rotate(0)',offset:.72},{transform:'translateY(0) scale(1) rotate(0)'}],{delay:Math.min(90,i*18)});
   });
   const summary=root.querySelector('[data-presentation="sentence-summary"]');if(hidden&&summary){summary.classList.add('evidence-static');summary.dataset.evidenceCount=String(hidden);}
   if(!meaningful||settings.effectsOff||settings.reducedMotion||!score)return;
   const limit=window.innerWidth<940||matchMedia('(pointer: coarse)').matches?24:48,rect=score.getBoundingClientRect();
   const available=Math.min(feel.particles,limit-particles.size);
   for(let i=0;i<available;i++){
    const n=pool.pop()??document.createElement('i');n.className='combo-particle';n.setAttribute('aria-hidden','true');n.style.left=`${rect.left+rect.width/2}px`;n.style.top=`${rect.top+rect.height/2}px`;
    // Deterministic geometry avoids touching either game or presentation RNG.
    const angle=(i*137.5+count*31)*Math.PI/180,distance=18+feel.tier*5+(i%3)*4;
    (document.fullscreenElement??document.body).append(n);particles.add(n);
    const a=animate(n,[{transform:'translate(0,0) scale(1)',opacity:.8},{transform:`translate(${Math.cos(angle)*distance}px,${Math.sin(angle)*distance}px) scale(.2)`,opacity:0}],{duration:300});
    if(a)a.finished.catch(()=>{}).finally(()=>release(n));else release(n);
   }
  },
  clearEvidence(){root.querySelectorAll('.evidence-static').forEach(n=>n.classList.remove('evidence-static'));},
  pause(paused){for(const a of animations)paused?a.pause():a.play();},
  clear,
 };
}
