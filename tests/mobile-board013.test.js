import test from 'node:test';
import assert from 'node:assert/strict';
import {sentenceRows,mobileBoardLayout,handheldBoardColumns} from '../src/ui/boardLayout.js';
import {handPageWindow} from '../src/ui/viewport.js';

test('mobile visual rows contain eight cards across the physical twelve-card boundary', () => {
 const expectedRows = [[0,0], [1,1], [5,1], [8,1], [9,2], [12,2], [13,2], [16,2], [17,3], [24,3]];
 for (const [count, rows] of expectedRows) {
  const cards = Array.from({length: count}, (_, id) => ({id}));
  assert.deepEqual(sentenceRows(cards).flat(), cards);
  const layout = mobileBoardLayout({width: 540, height: 128, count});
  assert.equal(layout.columns, 8);
  assert.equal(layout.lines, rows);
  assert.ok(layout.bodyHeight >= 30);
  assert.equal(layout.formHeight, 28);
 }
});
test('full mobile rows fill the width and retain slot size when another row begins', () => {
 for (const width of [452.5, 540, 720, 818.25]) {
  let previousWidth = Infinity;
  for (let count = 1; count <= 24; count++) {
   const {cardWidth, rowSlots} = mobileBoardLayout({width, height: 128, count});
   const occupied = cardWidth * rowSlots + 4 * (rowSlots - 1);
   assert.ok(occupied <= width + .001);
   assert.ok(cardWidth <= previousWidth + .001);
   if (count > 1) assert.ok(cardWidth >= previousWidth * .8);
   if (count >= 8) assert.ok(Math.abs(occupied - width) < .001);
   if (count > 8) assert.equal(cardWidth, previousWidth);
   previousWidth = cardWidth;
  }
 }
});
test('mobile board keeps a usable form target while scrolling the third row when needed', () => {
 const two = mobileBoardLayout({width: 540, height: 128, count: 16});
 // The requested 28px form target preserves its size and scrolls instead of shrinking.
 assert.equal(two.cardHeight * two.lines + 4, 132);
 assert.equal(two.bodyHeight, 30);
 assert.equal(two.overflow, true);
 const three = mobileBoardLayout({width: 540, height: 128, count: 24});
 assert.equal(three.overflow, true);
 assert.equal(three.lines, 3);
 assert.equal(three.formHeight, 28);
 assert.equal(mobileBoardLayout({width: 540, height: 200, count: 24}).overflow, false);
});
test('narrow touch rows preserve all 24 words in six columns without reacting to height',()=>{
 assert.equal(handheldBoardColumns(667),6);
 assert.equal(handheldBoardColumns(719),6);
 assert.equal(handheldBoardColumns(720),8);
 assert.equal(handheldBoardColumns(844),8);
 const columns=handheldBoardColumns(667);
 const layouts=[90,128,180].map(height=>mobileBoardLayout({width:432,height,count:24,columns}));
 for(const layout of layouts){
  assert.equal(layout.columns,6);assert.equal(layout.lines,4);
  assert.equal(layout.rowSlots,6);assert.equal(layout.formHeight,28);
  assert.equal(layout.cardWidth,layouts[0].cardWidth);
  assert.ok(layout.cardWidth*6+4*5<=432);
 }
 assert.deepEqual(sentenceRows(Array.from({length:24},(_,id)=>id)).flat(),Array.from({length:24},(_,id)=>id));
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
