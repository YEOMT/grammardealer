import test from 'node:test';
import assert from 'node:assert/strict';
import {installInputGuard} from '../src/ui/inputGuard.js';
import {installViewport} from '../src/ui/viewport.js';
import {APP_VERSION} from '../src/appVersion.js';

function fixture(){
 const doc=new EventTarget(),win=new EventTarget();
 const target=(edit=false)=>({isConnected:true,closest(s){if(s.startsWith('input'))return edit?this:null;if(s.startsWith('#app')||s.startsWith('button'))return this;return null;}});
 const a=target(),b=target(),input=target(true);const guard=installInputGuard(doc,win);
 const fire=(type,node=a,id=1,extra={})=>{const e=new Event(type,{cancelable:true});Object.defineProperties(e,Object.fromEntries(Object.entries({target:node,pointerId:id,pointerType:'touch',button:0,detail:1,...extra}).map(([k,value])=>[k,{value}])));doc.dispatchEvent(e);return e;};
 return {doc,win,guard,a,b,input,fire};
}
test('device: fresh rapid taps survive while repeated compatibility clicks do not',()=>{
 const f=fixture();try{for(let i=0;i<3;i++){f.fire('pointerdown');f.fire('pointerup');assert.equal(f.fire('click').defaultPrevented,false);assert.equal(f.fire('click').defaultPrevented,true);}}finally{f.guard.dispose();}
});
test('device: second touch cancels once and all releases restore immediate input',()=>{
 const f=fixture();let cancels=0;f.doc.addEventListener('atlas:cancel-drag',()=>cancels++);
 try{f.fire('pointerdown');f.fire('pointerdown',f.b,2);assert.equal(f.guard.blocked,true);assert.equal(cancels,1);f.fire('pointerup');assert.equal(f.guard.blocked,true);assert.equal(f.fire('click').defaultPrevented,true);f.fire('pointerup',f.b,2);assert.equal(f.guard.blocked,false);f.fire('pointerdown');f.fire('pointerup');assert.equal(f.fire('click').defaultPrevented,false);}finally{f.guard.dispose();}
});
test('device: a second finger on an input cancels the card without swallowing native input',()=>{
 const f=fixture();try{f.fire('pointerdown');assert.equal(f.fire('pointerdown',f.input,2).defaultPrevented,false);assert.equal(f.guard.blocked,true);f.fire('pointerup');f.fire('pointerup',f.input,2);assert.equal(f.fire('click',f.input,2).defaultPrevented,false);}finally{f.guard.dispose();}
});
test('device: cancel, focus loss, return, modal and detached targets cannot produce stale commands',()=>{
 for(const mode of ['pointercancel','blur','pagehide','pageshow','hashchange','hidden','modal','detached']){
  const f=fixture();try{f.fire('pointerdown');if(mode==='pointercancel')f.fire(mode);else if(mode==='hidden'){f.doc.hidden=true;f.doc.dispatchEvent(new Event('visibilitychange'));}else if(mode==='modal')f.doc.dispatchEvent(new Event('atlas:cancel-drag'));else if(mode==='detached')f.a.isConnected=false;else f.win.dispatchEvent(new Event(mode));f.fire('pointerup');assert.equal(f.fire('click').defaultPrevented,true,mode);f.a.isConnected=true;f.fire('pointerdown');f.fire('pointerup');assert.equal(f.fire('click').defaultPrevented,false,mode);}finally{f.guard.dispose();}
 }
});
test('device: keyboard and text editing stay native; cancelled touch still reaches document audio listener',()=>{
 const f=fixture();let gestures=0;f.doc.addEventListener('pointerup',()=>gestures++);
 try{f.fire('pointerdown');f.guard.suppress(1);f.fire('pointerup');assert.equal(gestures,1);assert.equal(f.fire('click',f.a,1,{detail:0,pointerType:''}).defaultPrevented,false);assert.equal(f.fire('click',f.input).defaultPrevented,false);}finally{f.guard.dispose();}
});
test('device: unchanged viewport notifications preserve gesture; real size/host changes cancel',()=>{
 const win=new EventTarget(),doc=new EventTarget();Object.assign(win,{innerWidth:1366,innerHeight:768,requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}});doc.documentElement={style:{setProperty(){}},dataset:{}};
 let cancels=0;doc.addEventListener('atlas:cancel-drag',()=>cancels++);const cleanup=installViewport(win,doc);
 try{win.dispatchEvent(new Event('resize'));assert.equal(cancels,0);win.innerHeight=800;win.dispatchEvent(new Event('resize'));assert.equal(cancels,1);win.dispatchEvent(new Event('resize'));assert.equal(cancels,1);doc.fullscreenElement={};doc.dispatchEvent(new Event('fullscreenchange'));assert.equal(cancels,2);}finally{cleanup();}
});
test('device: release labels are distinct from unchanged content contracts',async()=>{
 const fs=await import('node:fs/promises');const pkg=JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url)));
 assert.equal(APP_VERSION,'0.13.0');assert.equal(pkg.version,APP_VERSION);
 const {RunController}=await import('../src/game/runController.js');
 const c=new RunController();assert.equal(c.dispatch({type:'NEW_RUN',config:{seed:'device.version'}}).ok,true);const run=c.getState();
 assert.equal(run.version,'0.12.1');assert.equal(run.activeCardIds.length,28);
});
