/** Screen orientation (not the keyboard's visual viewport) gates portable play. */
export function needsRotation({touchPoints=0,coarse=false,mobile=false,type='',width,height}) {
 const portable=touchPoints>0&&(coarse||mobile);
 const portrait=type?type.startsWith('portrait'):height>width;
 return portable&&portrait;
}
export function installOrientationGate(win=window,doc=document) {
 const gate=doc.createElement('dialog');gate.className='orientation-gate';
 gate.setAttribute('aria-labelledby','rotation-title');
 gate.innerHTML='<h2 id="rotation-title">가로로 플레이해 주세요</h2><p>문장 전체를 읽고 조합하려면 기기를 가로로 돌려 주세요.</p><button type="button" class="primary">가로로 플레이하기</button><p role="status">방향 잠금을 지원하지 않는 브라우저에서는 직접 회전해 주세요.</p>';
 doc.body.append(gate);let previousFocus=null,frame=0;
 gate.addEventListener('cancel',e=>e.preventDefault());
 gate.querySelector('button').addEventListener('click',async()=>{
  try{if(!doc.fullscreenElement)await doc.documentElement.requestFullscreen?.();await win.screen.orientation?.lock?.('landscape');}
  catch{/* A refusal is a supported manual-rotation fallback. */}
  gate.querySelector('[role=status]').textContent='기기를 가로로 돌려 주세요. 전체화면이나 방향 잠금 없이도 가로로 플레이할 수 있습니다.';schedule();
 });
 const update=()=>{
  frame=0;const blocked=!!doc.querySelector('.responsive-battle')&&needsRotation({touchPoints:win.navigator.maxTouchPoints,coarse:win.matchMedia('(pointer: coarse)').matches,mobile:/Android|iPhone|iPad|Mobile/i.test(win.navigator.userAgent),type:win.screen.orientation?.type??'',width:win.innerWidth,height:win.innerHeight});
  if(blocked&&!gate.open){previousFocus=doc.activeElement;doc.dispatchEvent(new Event('atlas:cancel-drag'));gate.showModal();}
  if(!blocked&&gate.open){gate.close();if(previousFocus?.isConnected)previousFocus.focus();}
 };
 const schedule=()=>{if(!frame)frame=win.requestAnimationFrame(update);};
 // Capture guard also protects against a later app dialog entering the top layer.
 const guard=e=>{if(gate.open&&!gate.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();}};
 const events=['pointerdown','pointerup','click','touchstart','keydown'];events.forEach(t=>doc.addEventListener(t,guard,true));
 const observer=new MutationObserver(changes=>{if(gate.open&&changes.some(c=>[...c.addedNodes].some(n=>n.matches?.('dialog.app-dialog')))){gate.close();gate.showModal();}schedule();});observer.observe(doc.body,{childList:true});observer.observe(doc.querySelector('#app')??doc.body,{childList:true});
 win.addEventListener('resize',schedule);win.screen.orientation?.addEventListener('change',schedule);doc.addEventListener('atlas:viewport',schedule);schedule();
 return ()=>{observer.disconnect();win.removeEventListener('resize',schedule);win.screen.orientation?.removeEventListener('change',schedule);doc.removeEventListener('atlas:viewport',schedule);events.forEach(t=>doc.removeEventListener(t,guard,true));if(frame)win.cancelAnimationFrame(frame);gate.remove();};
}
