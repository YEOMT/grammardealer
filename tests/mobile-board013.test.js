import test from 'node:test';
import assert from 'node:assert/strict';
import {sentenceRows,mobileBoardLayout} from '../src/ui/boardLayout.js';
import {handPageWindow} from '../src/ui/viewport.js';

test('0.13 mobile: twelve-card groups remain physically ordered across readability wrapping',()=>{
 for(const count of [1,5,8,11,12,13,24]){
  const cards=Array.from({length:count},(_,id)=>({id}));assert.deepEqual(sentenceRows(cards).flat(),cards);
  const compact=mobileBoardLayout({width:540,height:128,count,longestWord:11});
  assert.equal(compact.columns,6);assert.equal(compact.fallback,true);assert.equal(compact.lines,Math.ceil(count/6));
  assert.ok(compact.cardWidth* Math.min(count,6)+4*(Math.min(count,6)-1)<=540+.001);assert.ok(compact.formHeight>=24);assert.ok(compact.bodyHeight>=32);
 }
 assert.equal(mobileBoardLayout({width:720,height:128,count:12,longestWord:4}).columns,12);
});
test('0.13 mobile: count changes reduce card width gradually rather than fixed size bands',()=>{
 for(const width of [540,720])for(const longestWord of [4,11]){
  let previous=Infinity;
  for(let count=1;count<=12;count++){
   const {cardWidth}=mobileBoardLayout({width,height:128,count,longestWord});
   assert.ok(cardWidth<=previous+.001);if(previous!==Infinity)assert.ok(cardWidth>=previous*.8);previous=cardWidth;
  }
 }
 const long=mobileBoardLayout({width:600,height:128,count:12,longestWord:11});assert.ok((long.cardWidth-8)/(11*.66)>=11);
});
test('0.13 mobile: insufficient height scrolls real rows without reducing touch controls',()=>{
 const layout=mobileBoardLayout({width:540,height:128,count:24,longestWord:11});assert.equal(layout.overflow,true);assert.equal(layout.lines,4);assert.equal(layout.formHeight,24);
 assert.equal(mobileBoardLayout({width:720,height:128,count:12,longestWord:4}).overflow,false);
});
test('0.13 hand: measured pages keep copied IDs outside calculations and clamp after edits',()=>{
 const cards=Array.from({length:14},(_,i)=>'physical.'+i),before=[...cards];let page=0,seen=[];
 for(;;){const view=handPageWindow({count:cards.length,width:500,cardWidth:82,page,mobile:true});seen.push(...cards.slice(view.start,view.end));if(page===view.pages-1)break;page++;}
 assert.deepEqual(seen,before);assert.deepEqual(cards,before);
 assert.equal(handPageWindow({count:14,width:900,cardWidth:82,mobile:true}).size,7);
 assert.equal(handPageWindow({count:14,width:900,cardWidth:82,mobile:false}).size,10);
 assert.equal(handPageWindow({count:5,width:500,cardWidth:82,page:2,mobile:true}).page,0);
 assert.deepEqual(handPageWindow({count:0,width:1,cardWidth:82,page:3,mobile:true}),{size:1,pages:1,page:0,start:0,end:0});
});
