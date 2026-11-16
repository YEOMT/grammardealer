import {button, el, modal, toast} from './dom.js';
import {installInputGuard, inputRevision} from './inputGuard.js';
import './commaTool.css';

/** Presentation/input for a reusable tool. Only controller commands change punctuation. */
export function attachCommaTool(shell, combat, {command, locked=false}={}) {
  if (!combat.commaUnlocked) return {cleanup(){}, get placing(){return false;}};
  const doc=shell.ownerDocument, win=doc.defaultView, guard=installInputGuard(doc,win);
  const sentence=shell.querySelector('.combat-sentence');
  const cards=()=>[...sentence.querySelectorAll('.word-card')];
  shell.classList.add('comma-enabled');
  let placing=false, active=null, disposed=false;
  const tool=button('',()=>toggle(),'comma-tool',{disabled:locked,'aria-label':'쉼표 도구 · 배치 또는 이동','aria-pressed':'false'});
  tool.append(el('strong',{class:'comma-symbol',text:',','aria-hidden':'true'}),el('span',{text:'쉼표'}));
  const dock=el('aside',{class:'comma-dock','aria-label':'재사용 문장부호'},tool);
  const controls=el('div',{class:'comma-controls',hidden:true},el('span',{text:'단어의 왼쪽 또는 오른쪽을 선택하세요.'}),
    button('위치 목록',()=>chooseGap(),'secondary'),button('회수',()=>{setPlacing(false);command({type:'REMOVE_COMMA'});},'secondary',{disabled:locked||!combat.punctuation?.comma}),button('취소',()=>setPlacing(false),'quiet'));
  shell.querySelector('.hand-section').insertBefore(dock,shell.querySelector('.pile-discard'));
  dock.append(controls);
  function setPlacing(value){placing=value;shell.classList.toggle('comma-placing',value);tool.setAttribute('aria-pressed',String(value));controls.hidden=!value;}
  function toggle(){if(locked)return;if(!cards().length){toast('단어를 먼저 놓아 주세요.');return;}setPlacing(!placing);}
  function put(gap){const nodes=cards();if(!nodes.length)return;setPlacing(false);command({type:'SET_COMMA',afterCardInstanceId:gap===0?null:nodes[gap-1].dataset.cardId});}
  function chooseGap(){setPlacing(false);let view;view=modal('쉼표 위치',[
    el('p',{text:'문법 검사는 공격 확정 뒤에 진행합니다. 원하는 단어 경계를 선택하세요.'}),
    el('div',{class:'comma-gap-list'},button('문장 맨 앞',()=>{view.close();put(0);},'secondary'),...cards().map((card,i)=>button(`${i+1}. ${card.querySelector('.card-word').textContent} 뒤`,()=>{view.close();put(i+1);},'secondary')))
  ]);}
  function markerMenu(){if(locked)return;setPlacing(true);}
  const anchor=combat.punctuation?.comma;
  let marker=null;
  if(anchor){
    const nodes=cards(),host=anchor.afterCardInstanceId===null?nodes[0]:nodes.find(n=>n.dataset.cardId===anchor.afterCardInstanceId);
    if(host){marker=button(',',markerMenu,'comma-marker',{'aria-label':'배치된 쉼표 · 이동 또는 회수',disabled:locked,dataset:{commaAnchor:anchor.afterCardInstanceId??'START'}});marker.classList.toggle('comma-before',anchor.afterCardInstanceId===null);host.append(marker);}
  }
  const gapAt=(x,y)=>{
    const zone=sentence.getBoundingClientRect();
    if(x<zone.left||x>zone.right||y<zone.top||y>zone.bottom)return null;
    let near=null,distance=Infinity;
    cards().forEach((card,i)=>{const r=card.getBoundingClientRect();if(r.bottom<=zone.top||r.top>=zone.bottom)return;const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom),d=dx*dx+dy*dy;if(d<distance){near={card,index:i+(x>=r.left+r.width/2?1:0)};distance=d;}});
    return near;
  };
  function clearHint(){sentence.querySelectorAll('.comma-drop-before,.comma-drop-after').forEach(n=>n.classList.remove('comma-drop-before','comma-drop-after'));}
  function cleanupDrag(cancelled=true){if(!active)return;const saved=active;active=null;if(cancelled)guard.suppress(saved.id);saved.ghost?.remove();clearHint();try{saved.source.releasePointerCapture(saved.id);}catch{}}
  const valid=()=>active&&!disposed&&!locked&&!guard.blocked&&shell.isConnected&&active.revision===inputRevision(shell)&&!doc.querySelector('dialog[open]');
  const down=e=>{
    if(placing&&e.target.closest('.word-card[data-zone=sentence]')){e.stopPropagation();return;}
    const source=e.target.closest('.comma-tool,.comma-marker');
    if(!source||!shell.contains(source)||locked||guard.blocked||active||e.button!==0||doc.querySelector('dialog[open]'))return;
    active={id:e.pointerId,source,x:e.clientX,y:e.clientY,revision:inputRevision(shell),dragging:false};
    try{source.setPointerCapture(e.pointerId);}catch{cleanupDrag();}
    e.stopPropagation();
  };
  const move=e=>{
    if(!active||active.id!==e.pointerId)return;
    if(!valid()){cleanupDrag();return;}
    if(!active.dragging&&Math.hypot(e.clientX-active.x,e.clientY-active.y)>=8){active.dragging=true;setPlacing(false);active.ghost=el('span',{class:'comma-ghost',text:',','aria-hidden':'true'});(doc.fullscreenElement??doc.body).append(active.ghost);}
    if(!active.dragging)return;
    e.preventDefault();Object.assign(active.ghost.style,{left:e.clientX+'px',top:e.clientY+'px'});clearHint();const target=gapAt(e.clientX,e.clientY);target?.card.classList.add(target.index===cards().indexOf(target.card)?'comma-drop-before':'comma-drop-after');
  };
  const up=e=>{if(!active||active.id!==e.pointerId)return;if(!valid()){cleanupDrag();return;}const drag=active.dragging,target=drag?gapAt(e.clientX,e.clientY):null;if(drag){e.preventDefault();guard.suppress(e.pointerId);}cleanupDrag(false);if(drag&&target)put(target.index);};
  const cancel=e=>{if(!e.pointerId||active?.id===e.pointerId)cleanupDrag();};
  const click=e=>{
    if(!placing||locked)return;const card=e.target.closest('.word-card[data-zone=sentence]');if(!card||!sentence.contains(card))return;
    if(e.target.closest('.form-button,.card-info')){setPlacing(false);return;}
    if(e.target.closest('.comma-marker'))return;
    e.preventDefault();e.stopPropagation();const rect=card.getBoundingClientRect();put(cards().indexOf(card)+(e.detail===0||e.clientX>=rect.left+rect.width/2?1:0));
  };
  const key=e=>{if(e.key==='Escape'){setPlacing(false);cleanupDrag();return;}if(placing&&['Enter',' '].includes(e.key)&&e.target.closest('.card-body')){if(e.target.closest('button')){setPlacing(false);return;}e.preventDefault();e.stopPropagation();put(cards().indexOf(e.target.closest('.word-card'))+1);}};
  shell.addEventListener('pointerdown',down,true);shell.addEventListener('pointermove',move);shell.addEventListener('pointerup',up);shell.addEventListener('pointercancel',cancel);shell.addEventListener('lostpointercapture',cancel);shell.addEventListener('click',click,true);shell.addEventListener('keydown',key,true);doc.addEventListener('atlas:cancel-drag',cancel);
  return {get placing(){return placing;},cleanup(){disposed=true;cleanupDrag();setPlacing(false);shell.removeEventListener('pointerdown',down,true);shell.removeEventListener('pointermove',move);shell.removeEventListener('pointerup',up);shell.removeEventListener('pointercancel',cancel);shell.removeEventListener('lostpointercapture',cancel);shell.removeEventListener('click',click,true);shell.removeEventListener('keydown',key,true);doc.removeEventListener('atlas:cancel-drag',cancel);}};
}
