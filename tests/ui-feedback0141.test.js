import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreFeedbackLabel} from '../src/engine/scoreFeedback.js';
import {prepareImages,bindPreparedImage} from '../src/services/imagePreparation.js';

test('loss label uses committed numbers once, defense and no-change stay distinct',()=>{
 const loss={phase:'ACCURACY',sourceType:'GRAMMAR',before:111,after:99,labelKo:'쉼표 위치 오류 · −12'};
 assert.equal(scoreFeedbackLabel(loss),'111 → 99 · 쉼표 위치 오류 · −12');
 assert.equal(scoreFeedbackLabel({...loss,labelKo:'문법 정확도'}),'111 → 99 · 문법 정확도 · −12');
 assert.equal(scoreFeedbackLabel({...loss,phase:'RESISTANCE',sourceType:'STAGE',labelKo:'일반전 저항'}),'🛡 111 → 99 · 일반전 저항 · −12');
 assert.equal(scoreFeedbackLabel({...loss,after:111,labelKo:'HP 1 보호'}),'HP 1 보호');
});

test('image requests coalesce, decode fallback checks dimensions, bounded scenes retry only on reentry',async()=>{
 const original=globalThis.Image;let requests=0,decodes=0;
 class FakeImage{
  naturalWidth=100;naturalHeight=100;complete=false;
  set src(url){this.url=url;requests++;queueMicrotask(()=>{this.complete=true;if(url==='broken'){this.naturalWidth=0;this.onerror?.();}else this.onload?.();});}
  async decode(){decodes++;if(this.url==='decode-fallback')throw Error('decode rejected');}
 }
 globalThis.Image=FakeImage;
 try{
  const a=prepareImages('a',{background:'shared',idle:'decode-fallback'}),same=prepareImages('a',{background:'shared',idle:'decode-fallback'});
  assert.equal(a,same);assert.equal(await a.assets.idle.promise,true);await a.gate;assert.equal(requests,2);assert.ok(decodes>=2);
  const b=prepareImages('b',{background:'shared',idle:'broken'});await b.gate;assert.equal(b.assets.idle.status,'failed');assert.equal(requests,3);
  const retry=prepareImages('b',{background:'shared',idle:'broken'});await retry.gate;assert.equal(requests,4);
  await prepareImages('c',{background:'third'}).gate;
  await prepareImages('d',{background:'fourth'}).gate;
  await prepareImages('a',{background:'shared',idle:'decode-fallback'}).gate;
  assert.equal(requests,8,'evicted scenes do not retain bitmap/request references');
  let applied=0;const img=new FakeImage();const stop=bindPreparedImage(img,a.assets.idle,()=>applied++);stop();await new Promise(r=>setImmediate(r));assert.equal(applied,0,'disposed view ignores late decoding');
 }finally{globalThis.Image=original;}
});
