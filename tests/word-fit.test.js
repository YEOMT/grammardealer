import test from 'node:test';
import assert from 'node:assert/strict';
import {fitMeasuredWord} from '../src/ui/wordFit.js';

test('word fitting uses supplied font width, independent of letter count',()=>{
 const narrow=fitMeasuredWord({available:62,measure:size=>size*2});
 const wide=fitMeasuredWord({available:62,measure:size=>size*5});
 assert.equal(narrow.size,22);assert.equal(narrow.scale,1);
 assert.ok(wide.size>=12&&wide.size<22);assert.ok(wide.width<=62);
});
test('word fitting keeps readable floor with only bounded horizontal fitting',()=>{
 const fit=fitMeasuredWord({available:54,measure:size=>size*5});
 assert.equal(fit.size,12);assert.equal(fit.scale,.9);assert.equal(fit.readable,true);assert.equal(fit.width,54);
});
test('genuinely insufficient width is exposed, not reported as a readable result',()=>{
 const fit=fitMeasuredWord({available:40,measure:size=>size*5});
 assert.equal(fit.readable,false);assert.ok(fit.scale>=.8);assert.ok(fit.width<=40);
});
