import test from 'node:test';
import assert from 'node:assert/strict';
import {sentenceRows} from '../src/ui/boardLayout.js';
test('recovery: fixed twelve-card rows preserve absolute order at each boundary',()=>{
 for(const count of [0,1,3,12,13,16,17,24]){
  const cards=Array.from({length:count},(_,i)=>({id:i})), rows=sentenceRows(cards);
  assert.equal(rows.length,Math.ceil(count/12));assert.ok(rows.every(r=>r.length<=12));assert.deepEqual(rows.flat(),cards);
  if(count>12){assert.equal(rows[0].length,12);assert.equal(rows[1].length,count-12);}
 }
});
