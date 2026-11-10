import test from 'node:test';
import assert from 'node:assert/strict';
import {previewMonsterGeometry} from '../src/ui/panoramaPreview.js';
import {MONSTER_ASSETS} from '../src/services/sceneAssets.js';

test('panorama preview keeps alpha bodies centered, grounded and wholly inside the stage',()=>{
 for(const [width,height]of [[667,667/3],[844,844/3],[932,932/3],[1366,1366/3],[1920,640]]){
  for(const [id,art]of Object.entries(MONSTER_ASSETS)){
   const before=JSON.stringify(art),boss=id.startsWith('boss.'),g=previewMonsterGeometry(art.bounds,width,height,boss);
   assert.ok(g.bodyLeft>=0&&g.bodyLeft+g.bodyWidth<=width);
   assert.ok(g.bodyTop>=0&&g.bodyTop+g.bodyHeight<=height);
   assert.ok(Math.abs(g.bodyLeft+g.bodyWidth/2-width/2)<.001);
   assert.ok(Math.abs(g.bodyTop+g.bodyHeight-(height-8))<.001);
   assert.ok(Math.abs(g.imageWidth/g.imageHeight-art.bounds[0]/art.bounds[1])<.001);
   assert.equal(JSON.stringify(art),before);
  }
 }
});
test('panorama boss targets twice the normal body height, capped only by the actual safe area',()=>{
 const art=MONSTER_ASSETS['boss.stage2'];
 for(const [width,height]of [[667,222],[1366,455],[100,80]]){
  const normal=previewMonsterGeometry(art.bounds,width,height),boss=previewMonsterGeometry(art.bounds,width,height,true);
  assert.equal(boss.targetHeight,normal.targetHeight*2);
  assert.ok(boss.bodyHeight<=boss.targetHeight);
  if(!boss.safetyCapped)assert.ok(Math.abs(boss.bodyHeight/normal.bodyHeight-2)<.001);
 }
});
