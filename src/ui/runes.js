import {el,button,modal} from './dom.js';
import {runeForVersion} from '../data/runes.js';
import {describeRune} from '../engine/runes.js';
export function runeView(instance,{index=0,total=1,onOrder,readonly=false,entry=false,version='0.3.0'}={}){
 const rune=runeForVersion(instance.runeId,version);
 const node=el('div',{class:`rune-slot ${entry&&rune.scope==='AT_BATTLE_RULES_SNAPSHOT'?'utility-entry':''}`,dataset:{runeId:rune.id,runeInstanceId:instance.instanceId,runeIndex:String(index)},style:`--rune-color:${rune.color}`});
 const info=()=>modal(`${rune.nameKo} · Lv.${instance.level}`,[el('p',{text:rune.conditionDescriptionKo}),el('p',{text:describeRune(rune.id,instance.level,version)})]);
 node.append(el('div',{class:'rune-slot-head'},el('span',{class:'rune-order-number',text:index+1}),el('span',{class:'rune-gem',text:'◆'}),button(`${rune.nameKo} · Lv.${instance.level}`,info,'rune-info',{disabled:readonly})),el('div',{class:'rune-effect',text:describeRune(rune.id,instance.level,version)}));
 const move=to=>{if(!readonly&&!document.querySelector('dialog[open]'))onOrder?.(index,to);};
 node.append(el('div',{class:'rune-order-controls'},button('▲',()=>move(index-1),'rune-up',{'aria-label':`${rune.nameKo} 위로`,disabled:readonly||index===0}),button('▼',()=>move(index+1),'rune-down',{'aria-label':`${rune.nameKo} 아래로`,disabled:readonly||index===total-1}),button('⠿',()=>{},'rune-drag-handle',{'aria-label':`${rune.nameKo} 끌어서 순서 변경 · 방향키도 사용 가능`,disabled:readonly,onkeydown:e=>{if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const to=index+(e.key==='ArrowUp'?-1:1);if(to>=0&&to<total)move(to);}}})));
 return node;
}
/** Dedicated vertical handle; DOM order stays unchanged until controller acceptance. */
export function bindRuneDrag(panel,onOrder,{enabled=()=>true}={}){
 let active=null;
 const clear=()=>{if(active){try{active.handle.releasePointerCapture(active.id);}catch{}active=null;}panel.querySelectorAll('.rune-drop-before,.rune-drop-after,.rune-drag-source').forEach(n=>n.classList.remove('rune-drop-before','rune-drop-after','rune-drag-source'));};
 const down=e=>{const handle=e.target.closest('.rune-drag-handle');if(!handle||handle.disabled||e.button!==0||!enabled()||document.querySelector('dialog[open]'))return;const node=handle.closest('[data-rune-index]');active={handle,node,id:e.pointerId,x:e.clientX,y:e.clientY,from:Number(node.dataset.runeIndex),to:null,moved:false};handle.setPointerCapture(e.pointerId);};
 const move=e=>{if(!active||e.pointerId!==active.id)return;if(!enabled()||document.querySelector('dialog[open]')){clear();return;}if(!active.moved&&Math.hypot(e.clientX-active.x,e.clientY-active.y)<8)return;active.moved=true;e.preventDefault();active.node.classList.add('rune-drag-source');panel.querySelectorAll('.rune-drop-before,.rune-drop-after').forEach(n=>n.classList.remove('rune-drop-before','rune-drop-after'));
  const nodes=[...panel.querySelectorAll('[data-rune-index]')],rect=panel.getBoundingClientRect();active.to=null;
  if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)return;
  const target=nodes.find(n=>e.clientY<n.getBoundingClientRect().bottom)??nodes.at(-1);if(!target)return;
  const r=target.getBoundingClientRect(),after=e.clientY>r.top+r.height/2,insertion=Number(target.dataset.runeIndex)+(after?1:0);active.to=insertion-(active.from<insertion?1:0);target.classList.add(after?'rune-drop-after':'rune-drop-before');
 };
 const up=e=>{if(!active||e.pointerId!==active.id)return;const a=active;clear();if(a.moved&&a.to!==null&&a.to!==a.from&&enabled()&&!document.querySelector('dialog[open]'))onOrder(a.from,a.to);};
 const escape=e=>{if(e.key==='Escape')clear();};
 panel.addEventListener('pointerdown',down);panel.addEventListener('pointermove',move);panel.addEventListener('pointerup',up);panel.addEventListener('pointercancel',clear);window.addEventListener('scroll',clear,true);window.addEventListener('blur',clear);window.addEventListener('keydown',escape);
 return()=>{clear();panel.removeEventListener('pointerdown',down);panel.removeEventListener('pointermove',move);panel.removeEventListener('pointerup',up);panel.removeEventListener('pointercancel',clear);window.removeEventListener('scroll',clear,true);window.removeEventListener('blur',clear);window.removeEventListener('keydown',escape);};
}
