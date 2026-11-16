import {SCENE_ASSETS,MONSTER_ASSETS,sceneAssetUrl,warnAsset,prepareSceneImages} from '../services/sceneAssets.js';
import {bindPreparedImage} from '../services/imagePreparation.js';
import {el} from './dom.js';

/** Preview-only alpha-body fit; no battle pose/impact or run-state changes. */
export function previewMonsterGeometry(bounds,width,height,boss=false){
 const [w,h,left,top,right,bottom]=bounds,bodyWidth=right-left,bodyHeight=bottom-top;
 const normalTargetHeight=Math.min(180,Math.max(0,height-16)*.47),targetHeight=normalTargetHeight*(boss?2:1);
 const scale=Math.max(0,Math.min(targetHeight/bodyHeight,Math.max(0,width-32)/bodyWidth,Math.max(0,height-16)/bodyHeight));
 const imageLeft=width/2-(left+right)*scale/2,imageTop=height-8-bottom*scale;
 return {imageLeft,imageTop,imageWidth:w*scale,imageHeight:h*scale,bodyLeft:imageLeft+left*scale,bodyTop:imageTop+top*scale,bodyWidth:bodyWidth*scale,bodyHeight:bodyHeight*scale,normalTargetHeight,targetHeight,safetyCapped:scale*bodyHeight<targetHeight-.01};
}

/** Existing originals, one mounted instance through viewport changes. */
export function panoramaPreview(stageId,enemy,name){
 const stage=el('div',{class:'preparation-panorama',dataset:{scene:stageId}}),art=MONSTER_ASSETS[enemy.enemyId];
 const url=sceneAssetUrl(SCENE_ASSETS[stageId]?.combat),boss=['REGIONAL_BOSS','FINAL_BOSS'].includes(enemy.kind);
 let alive=true,scene=null,img=null,fitted=false,revealed=false;
 const prepared=prepareSceneImages(stageId,enemy.enemyId),unbind=[];
 const reveal=()=>{
  if(!alive)return;
  if(scene)scene.style.visibility=revealed&&scene.dataset.ready==='true'?'visible':'hidden';
  if(img)img.style.visibility=revealed&&fitted&&img.dataset.ready==='true'?'visible':'hidden';
 };
 // Current Stage 1/2 originals are both 2172×724, not the handoff's approximate 1900×330.
 if(url){
  scene=el('img',{class:'preparation-scene',alt:'',width:2172,height:724,draggable:false,decoding:'async'});
  scene.style.visibility='hidden';stage.append(scene);
  unbind.push(bindPreparedImage(scene,prepared.assets.background,ok=>{if(!alive)return;if(ok)scene.dataset.ready='true';else{stage.dataset.assetFailed='true';warnAsset(url);}reveal();}));
 }else stage.dataset.fallback='true';
 const monster=el('div',{class:'preparation-monster monster-preview',role:'img','aria-label':name,dataset:{boss:String(boss)}}),fallback=el('span',{class:'preparation-monster-fallback',text:enemy.emoji||'✦','aria-hidden':'true'});
 fallback.hidden=!!art;monster.append(fallback);stage.append(monster);
 const fit=()=>{
  if(!alive||!art||!stage.isConnected)return;const r=stage.getBoundingClientRect();if(!r.width||!r.height)return;
  const box=previewMonsterGeometry(art.bounds,r.width,r.height,boss);
  Object.assign(img.style,{left:box.imageLeft+'px',top:box.imageTop+'px',width:box.imageWidth+'px',height:box.imageHeight+'px'});
  for(const key of ['bodyLeft','bodyTop','bodyWidth','bodyHeight','normalTargetHeight','targetHeight','safetyCapped'])monster.dataset[key]=String(box[key]);
  fitted=true;reveal();
 };
 if(art){
  img=el('img',{class:'monster-preview-image',alt:'',draggable:false,decoding:'async'});
  img.style.visibility='hidden';monster.append(img);
  unbind.push(bindPreparedImage(img,prepared.assets.idle,ok=>{if(!alive)return;if(ok){img.dataset.ready='true';fallback.hidden=true;}else{fallback.hidden=false;warnAsset(img.src);}fit();reveal();}));
 }
 const observer=art?new ResizeObserver(fit):null;observer?.observe(stage);
 prepared.gate.then(()=>{if(alive){revealed=true;fit();reveal();}});
 return {element:stage,cleanup(){if(!alive)return;alive=false;observer?.disconnect();unbind.forEach(stop=>stop());}};
}
