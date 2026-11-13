/** Gesture ownership survives view replacement; it never mutates a run. */
const guards=new WeakMap();
const editable=n=>n?.closest?.('input,textarea,select,[contenteditable=true]');
const scope=n=>n?.closest?.('#app,dialog.app-dialog,dialog.orientation-gate,.fullscreen-help');
const action=n=>n?.closest?.('button,[role=button],a,summary')??n;
export const inputRevision=n=>n.closest('[data-input-revision]')?.dataset.inputRevision;
export function installInputGuard(doc=document,win=window){
 if(guards.has(doc))return guards.get(doc);
 const active=new Map(),ended=new Map();let multiple=false,lastEnd=null;
 const remember=(id,row)=>{ended.set(id,row);lastEnd=row;if(ended.size>32)ended.delete(ended.keys().next().value);};
 const suppress=id=>{const row=active.get(id)??ended.get(id);if(row)row.blocked=true;};
 const block=()=>{for(const row of active.values())row.blocked=true;};
 const cancel=()=>{block();doc.dispatchEvent(new Event('atlas:cancel-drag'));};
 const releaseAll=()=>{cancel();for(const [id,row]of active)remember(id,row);active.clear();multiple=false;};
 const stop=e=>{if(e.cancelable)e.preventDefault();e.stopPropagation();};
 const down=e=>{
  if((!scope(e.target)&&!active.size)||e.button!==0)return;
  ended.delete(e.pointerId);lastEnd=null;
  const row={target:action(e.target),touch:e.pointerType==='touch',blocked:multiple};active.set(e.pointerId,row);
  if(row.touch&&[...active.values()].filter(r=>r.touch).length>1){multiple=true;cancel();}
  if(row.blocked&&!editable(e.target))stop(e);
 };
 const end=e=>{
  const row=active.get(e.pointerId);if(!row)return;
  if(e.type==='pointercancel')cancel();
  if(!row.target.isConnected)row.blocked=true;
  active.delete(e.pointerId);remember(e.pointerId,row);
  if(![...active.values()].some(r=>r.touch))multiple=false;
  if(row.blocked&&!editable(e.target))stop(e);
 };
 const click=e=>{
  // Keyboard activation and text/slider editing retain their native path.
  if(editable(e.target)||e.detail===0&&!e.pointerType)return;
  const row=ended.get(e.pointerId)??lastEnd;
  if(row&&(row.blocked||!row.target.isConnected||row.target!==action(e.target)))stop(e);
  if(row)row.blocked=true; // A repeated compatibility click is still this gesture.
 };
 const hidden=()=>{if(doc.hidden)releaseAll();};
 doc.addEventListener('pointerdown',down,true);doc.addEventListener('pointerup',end,true);doc.addEventListener('pointercancel',end,true);doc.addEventListener('click',click,true);
 doc.addEventListener('atlas:cancel-drag',block);doc.addEventListener('visibilitychange',hidden);
 for(const t of ['blur','pagehide','pageshow','hashchange'])win.addEventListener(t,releaseAll);
 const guard={suppress,get blocked(){return multiple;},dispose(){releaseAll();doc.removeEventListener('pointerdown',down,true);doc.removeEventListener('pointerup',end,true);doc.removeEventListener('pointercancel',end,true);doc.removeEventListener('click',click,true);doc.removeEventListener('atlas:cancel-drag',block);doc.removeEventListener('visibilitychange',hidden);for(const t of ['blur','pagehide','pageshow','hashchange'])win.removeEventListener(t,releaseAll);guards.delete(doc);}};
 guards.set(doc,guard);return guard;
}
