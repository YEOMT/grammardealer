import test from 'node:test';
import assert from 'node:assert/strict';
import {installViewport} from '../src/ui/visualViewport.js';
import {enterLandscape, lobbyAddress} from '../src/ui/immersive.js';

function viewportFixture() {
  const win = new EventTarget(), doc = new EventTarget(), visual = new EventTarget();
  const frames = new Map(), styles = new Map(), pointer = new EventTarget();
  let id = 0;
  Object.assign(visual, {width:844, height:390, scale:1, offsetLeft:0, offsetTop:0});
  Object.assign(win, {innerWidth:844, innerHeight:390, visualViewport:visual,
    navigator:{maxTouchPoints:5, userAgent:'Mobile'}, screen:{width:390,height:844},
    matchMedia:() => pointer, requestAnimationFrame:callback => {frames.set(++id,callback);return id;},
    cancelAnimationFrame:key => frames.delete(key)});
  doc.documentElement = {dataset:{},style:{setProperty:(key,value) => styles.set(key,value)}};
  return {win,doc,visual,styles,frames,flush() {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(fn => fn());
  }};
}

test('bar movement, host changes and pan offsets invalidate geometry once per frame', () => {
  const f = viewportFixture(), events = [];
  for (const name of ['atlas:cancel-drag','atlas:viewport']) f.doc.addEventListener(name,() => events.push(name));
  const cleanup = installViewport(f.win,f.doc);
  try {
    assert.equal(installViewport(f.win,f.doc),cleanup);
    f.visual.height = 310;
    f.visual.offsetTop = 9;
    for (let i=0;i<30;i++) f.visual.dispatchEvent(new Event(i%2 ? 'resize':'scroll'));
    assert.equal(f.frames.size,1);
    f.flush();
    assert.deepEqual(events,['atlas:viewport','atlas:cancel-drag','atlas:viewport']);
    assert.equal(f.styles.get('--visual-height'),'310px');
    assert.equal(f.styles.get('--visual-top'),'9px');
    for (const name of ['resize','scroll']) f.visual.dispatchEvent(new Event(name));
    f.flush();
    assert.equal(events.length,3);
    f.doc.fullscreenElement = {};
    f.doc.dispatchEvent(new Event('fullscreenchange'));
    f.flush();
    assert.equal(events.length,5);
  } finally {cleanup();}
  f.win.dispatchEvent(new Event('pageshow'));
  assert.equal(f.frames.size,0);
});

test('invalid samples and pinch zoom retain the last layout; keyboard changes only the visible area', () => {
  const f = viewportFixture();
  f.win.screen = {width:1024,height:768};
  f.win.innerWidth = f.visual.width = 1024;
  f.win.innerHeight = f.visual.height = 768;
  const cleanup = installViewport(f.win,f.doc);
  const resize = () => {f.visual.dispatchEvent(new Event('resize'));f.flush();};
  try {
    for (const height of [0,NaN,Infinity]) {
      f.visual.height = height;resize();
      assert.equal(f.styles.get('--visual-height'),'768px');
    }
    f.visual.height = 280;f.visual.scale = 2;resize();
    assert.equal(f.styles.get('--visual-height'),'768px');
    f.doc.activeElement = {matches:() => true};
    f.visual.scale = 1;resize();
    assert.equal(f.doc.documentElement.dataset.handheld,'false');
    assert.equal(f.doc.documentElement.dataset.keyboard,'true');
    assert.equal(f.styles.get('--visual-height'),'280px');
    f.visual.height = 768;resize();
    assert.equal(f.doc.documentElement.dataset.keyboard,'false');
    f.doc.activeElement = null;
    Object.assign(f.win,{innerWidth:820,innerHeight:650});
    Object.assign(f.visual,{width:820,height:530});
    resize();
    assert.equal(f.doc.documentElement.dataset.handheld,'false');
    assert.equal(f.styles.get('--visual-width'),'820px');
    f.doc.hidden = true;
    f.visual.height = 490;resize();
    assert.equal(f.styles.get('--visual-height'),'530px');
    f.doc.hidden = false;
    f.win.dispatchEvent(new Event('pageshow'));f.flush();
    assert.equal(f.styles.get('--visual-height'),'490px');
  } finally {cleanup();}
});

test('one synchronous fullscreen request precedes optional orientation lock; rejection is independent', async () => {
  const events = [];
  let granted;
  const doc = {fullscreenEnabled:true,fullscreenElement:null,documentElement:{
    requestFullscreen() { events.push('request');return new Promise(resolve => {granted=resolve;}); }
  }};
  const win = {screen:{orientation:{lock:async mode => {events.push(mode);throw Error('denied');}}}};
  const first = enterLandscape(win,doc);
  assert.deepEqual(events,['request']);
  assert.equal(first,enterLandscape(win,doc));
  doc.fullscreenElement=doc.documentElement;granted();
  assert.equal(await first,'active');
  assert.deepEqual(events,['request','landscape']);
  doc.fullscreenElement=null;
  doc.documentElement.requestFullscreen=async () => {throw Error('permission');};
  assert.equal(await enterLandscape(win,doc),'denied');
  doc.fullscreenEnabled=false;
  assert.equal(await enterLandscape(win,doc),'unavailable');
  assert.deepEqual(events,['request','landscape']);
  assert.equal(lobbyAddress(),'https://yeomt.github.io/grammardealer/#lobby');
});

test('a prefixed void request waits for the actual host and calls landscape lock once', async () => {
  const doc = new EventTarget();
  const calls = [];
  doc.documentElement = {webkitRequestFullscreen() {calls.push('enter');}};
  const win = {screen:{orientation:{lock:async mode => calls.push(mode)}}};
  const pending = enterLandscape(win,doc);
  assert.deepEqual(calls,['enter']);
  doc.webkitFullscreenElement = doc.documentElement;
  doc.dispatchEvent(new Event('webkitfullscreenchange'));
  assert.equal(await pending,'active');
  assert.deepEqual(calls,['enter','landscape']);
});
