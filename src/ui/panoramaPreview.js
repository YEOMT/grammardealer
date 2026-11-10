import {SCENE_ASSETS,MONSTER_ASSETS,sceneAssetUrl,warnAsset} from '../services/sceneAssets.js';
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
 let alive=true,scene=null,img=null;
 // Current Stage 1/2 originals are both 2172×724, not the handoff's approximate 1900×330.
 if(url){
  scene=el('img',{class:'preparation-scene',alt:'',width:2172,height:724,draggable:false,decoding:'async'});
  scene.onload=()=>{if(!alive)return;stage.style.setProperty('--panorama-ratio',String(scene.naturalWidth/scene.naturalHeight));scene.dataset.ready='true';};
  scene.onerror=()=>{if(alive){scene.style.visibility='hidden';stage.dataset.assetFailed='true';warnAsset(url);}};
  stage.append(scene);scene.src=url;
 }else stage.dataset.fallback='true';
 const monster=el('div',{class:'preparation-monster monster-preview',role:'img','aria-label':name,dataset:{boss:String(boss)}}),fallback=el('span',{class:'preparation-monster-fallback',text:enemy.emoji||'✦','aria-hidden':'true'});
 monster.append(fallback);stage.append(monster);
 const fit=()=>{
  if(!alive||!art||!stage.isConnected)return;const r=stage.getBoundingClientRect();if(!r.width||!r.height)return;
  const box=previewMonsterGeometry(art.bounds,r.width,r.height,boss);
  Object.assign(img.style,{left:box.imageLeft+'px',top:box.imageTop+'px',width:box.imageWidth+'px',height:box.imageHeight+'px'});
  for(const key of ['bodyLeft','bodyTop','bodyWidth','bodyHeight','normalTargetHeight','targetHeight','safetyCapped'])monster.dataset[key]=String(box[key]);
 };
 if(art){
  img=el('img',{class:'monster-preview-image',alt:'',draggable:false,decoding:'async'});
  img.onload=()=>{if(alive){img.dataset.ready='true';fallback.hidden=true;fit();}};
  img.onerror=()=>{if(alive){img.style.visibility='hidden';fallback.hidden=false;warnAsset(img.src);}};
  monster.append(img);img.src=sceneAssetUrl(art.idle);
 }
 const observer=art?new ResizeObserver(fit):null;observer?.observe(stage);
 return {element:stage,cleanup(){if(!alive)return;alive=false;observer?.disconnect();for(const image of [scene,img])if(image){image.onload=null;image.onerror=null;}}};
}
