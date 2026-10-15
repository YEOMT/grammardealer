import test from 'node:test';
import assert from 'node:assert/strict';
import {boardRows} from '../src/ui/boardLayout.js';
import {needsRotation} from '../src/ui/orientation.js';
test('board capacity uses common width, stable count boundaries and zero state',()=>{
 for(const [width,size,gap,columns] of [[1200,96,6,11],[960,96,6,9],[650,82,6,7],[500,82,6,5],[390,82,6,4]]){
  for(const n of [0,1,8,16,columns,columns+1,2*columns,2*columns+1]){
   assert.deepEqual(boardRows(width,size,gap,n),{columns,rows:n?Math.ceil(n/columns):0});
  }
 }
 assert.deepEqual(boardRows(30,82,6,16),{columns:1,rows:16});
});
test('portable orientation uses physical screen information, not keyboard geometry',()=>{
 const mobile={touchPoints:5,coarse:true,width:844,height:390};
 assert.equal(needsRotation({...mobile,type:'portrait-primary'}),true);
 assert.equal(needsRotation({...mobile,type:'landscape-primary',width:390,height:844}),false);
 assert.equal(needsRotation({...mobile,type:'',width:390,height:844}),true);
 assert.equal(needsRotation({touchPoints:0,coarse:false,type:'portrait-primary',width:720,height:1000}),false);
 assert.equal(needsRotation({touchPoints:10,coarse:false,mobile:false,type:'portrait-primary',width:720,height:1000}),false);
});
