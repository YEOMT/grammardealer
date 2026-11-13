import test from 'node:test';
import assert from 'node:assert/strict';
import {installViewport} from '../src/ui/visualViewport.js';
import {handheldLayout} from '../src/ui/deviceLayout.js';
import {installOrientationGate} from '../src/ui/orientation.js';

function viewportFixture(){
 const win=new EventTarget(),doc=new EventTarget(),coarse=new EventTarget(),orientation=new EventTarget(),frames=new Map();let id=0;
 coarse.matches=true;orientation.type='portrait-primary';
 Object.assign(win,{innerWidth:390,innerHeight:844,navigator:{maxTouchPoints:5,userAgent:'iPhone'},screen:{orientation},matchMedia:()=>coarse,requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)});
 doc.documentElement={style:{setProperty(){}},dataset:{}};
 return {win,doc,coarse,orientation,flush(){const pending=[...frames.values()];frames.clear();for(const fn of pending)fn();},pending:()=>frames.size};
}

test('handheld view accepts target phones in both orientations, excluding narrow desktops and wide tablets',()=>{
 for(const [width,height] of [[667,375],[844,390],[932,430]])for(const dimensions of [{width,height},{width:height,height:width}]){
  assert.equal(handheldLayout({...dimensions,touchPoints:5,coarse:true}),true);
  assert.equal(handheldLayout({...dimensions,touchPoints:0,coarse:true,mobile:true}),false);
  assert.equal(handheldLayout({...dimensions,touchPoints:5,coarse:false,mobile:false}),false);
 }
 for(const [width,height] of [[1024,768],[1180,820],[1366,768],[1920,1080]])assert.equal(handheldLayout({width,height,touchPoints:5,coarse:true,mobile:true}),false);
 assert.equal(handheldLayout({width:844,height:390,touchPoints:5,coarse:false,mobile:true}),true);
});

test('phone classification recovers when desktop minimum width inflates mobile innerWidth',()=>{
 const f=viewportFixture();f.win.innerWidth=1160;f.win.innerHeight=652;
 Object.assign(f.doc.documentElement,{clientWidth:667,clientHeight:375});
 const cleanup=installViewport(f.win,f.doc);
 try{assert.equal(f.doc.documentElement.dataset.handheld,'true');f.flush();}finally{cleanup();}
});

test('view classification cancels an in-flight drag before layout change and publishes one deferred viewport event',()=>{
 const f=viewportFixture(),events=[];
 f.doc.addEventListener('atlas:cancel-drag',()=>events.push(['cancel',f.doc.documentElement.dataset.handheld]));
 f.doc.addEventListener('atlas:viewport',()=>events.push(['viewport',f.doc.documentElement.dataset.handheld]));
 const cleanup=installViewport(f.win,f.doc);
 try{
  assert.equal(f.doc.documentElement.dataset.handheld,'true');assert.deepEqual(events,[['viewport','true']]);
  f.flush();assert.deepEqual(events,[['viewport','true']]);
  f.win.dispatchEvent(new Event('resize'));f.flush();assert.deepEqual(events,[['viewport','true']]);
  f.win.innerWidth=1024;f.win.innerHeight=768;f.win.dispatchEvent(new Event('resize'));f.flush();
  assert.equal(f.doc.documentElement.dataset.handheld,'false');assert.deepEqual(events.at(-2),['cancel','true']);
  f.flush();assert.deepEqual(events.at(-1),['viewport','false']);
 }finally{cleanup();}
 f.win.innerWidth=844;f.win.innerHeight=390;f.win.dispatchEvent(new Event('resize'));f.coarse.dispatchEvent(new Event('change'));
 assert.equal(f.doc.documentElement.dataset.handheld,'false');assert.equal(f.pending(),0);
});

function orientationFixture(t){
 const f=viewportFixture(),primary=new EventTarget(),escape=new EventTarget(),status={textContent:''},gate=new EventTarget(),observers=[];
 Object.assign(gate,{open:false,isConnected:true,setAttribute(){},querySelector:s=>s==='button'?primary:s==='.rotation-continue'?escape:status,showModal(){this.open=true;},close(){this.open=false;},contains:n=>[gate,primary,escape,status].includes(n),remove(){this.isConnected=false;this.open=false;}});
 f.doc.createElement=()=>gate;f.doc.body={append(){}};f.doc.querySelector=()=>({});
 let restores=0,requests=0,locks=0;
 f.doc.activeElement={isConnected:true,focus(){restores++;}};
 f.doc.documentElement.requestFullscreen=async()=>{requests++;throw new Error('Unavailable in this browser');};
 f.orientation.lock=async()=>{locks++;};
 const previous=globalThis.MutationObserver;
 globalThis.MutationObserver=class{constructor(fn){this.fn=fn;this.disconnected=false;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
 t.after(()=>{globalThis.MutationObserver=previous;});
 const cleanup=installOrientationGate(f.win,f.doc);t.after(cleanup);
 return {...f,gate,primary,escape,status,cleanup,observers,counts:()=>({restores,requests,locks})};
}

test('orientation escape survives screen rendering, then rearms only after a landscape rotation',t=>{
 const f=orientationFixture(t);f.flush();assert.equal(f.gate.open,true);
 assert.deepEqual(f.counts(),{restores:0,requests:0,locks:0});
 const cancel=new Event('cancel',{cancelable:true});f.gate.dispatchEvent(cancel);
 assert.equal(cancel.defaultPrevented,true);assert.equal(f.gate.open,false);assert.equal(f.counts().restores,1);
 f.observers[0].fn([{addedNodes:[]}]);f.doc.dispatchEvent(new Event('atlas:viewport'));f.flush();assert.equal(f.gate.open,false);
 f.orientation.type='landscape-primary';f.orientation.dispatchEvent(new Event('change'));f.flush();assert.equal(f.gate.open,false);
 f.orientation.type='portrait-primary';f.orientation.dispatchEvent(new Event('change'));f.flush();assert.equal(f.gate.open,true);
 f.escape.dispatchEvent(new Event('click'));assert.equal(f.gate.open,false);
 f.win.dispatchEvent(new Event('resize'));f.flush();assert.equal(f.gate.open,false);
 assert.equal(f.counts().requests,0);
});

test('refused orientation request leaves manual continuation and does not repeat fullscreen requests',async t=>{
 const f=orientationFixture(t);f.flush();f.primary.dispatchEvent(new Event('click'));
 await new Promise(resolve=>setImmediate(resolve));f.flush();
 assert.equal(f.gate.open,true);assert.equal(f.counts().requests,1);assert.equal(f.counts().locks,0);
 assert.match(f.status.textContent,/직접|기기를 가로/);
 f.doc.dispatchEvent(new Event('atlas:viewport'));f.flush();assert.equal(f.counts().requests,1);
 f.escape.dispatchEvent(new Event('click'));assert.equal(f.gate.open,false);
});

test('orientation guard protects underlying controls but leaves trusted gate events available to audio listeners',t=>{
 const f=orientationFixture(t);f.flush();let delivered=0;
 f.doc.addEventListener('pointerup',()=>delivered++);
 const fire=target=>{const e=new Event('pointerup',{cancelable:true});Object.defineProperty(e,'target',{value:target});f.doc.dispatchEvent(e);return e;};
 assert.equal(fire({}).defaultPrevented,true);assert.equal(delivered,0);
 assert.equal(fire(f.escape).defaultPrevented,false);assert.equal(delivered,1);
 f.escape.dispatchEvent(new Event('click'));
 assert.equal(fire({}).defaultPrevented,false);assert.equal(delivered,2);
 f.win.dispatchEvent(new Event('resize'));f.cleanup();f.flush();
 assert.equal(f.gate.isConnected,false);assert.ok(f.observers.every(o=>o.disconnected));assert.equal(f.pending(),0);
});
