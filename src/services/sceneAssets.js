import {assetUrl} from './assets.js';

// Original user files. Presentation metadata never enters a RunState or RNG stream.
export const SCENE_ASSETS = Object.freeze({
  lobby:{background:'assets/lobby/background.png',bgm:'assets/lobby/bgm.mp3',position:'50% 50%'},
  'stage.01':{entry:'assets/stages/stage-01/entry.png',combat:'assets/stages/stage-01/combat.png',bgm:'assets/stages/stage-01/bgm.mp3',position:'50% 60%'},
  'stage.02':{entry:'assets/stages/stage-02/entry.png',combat:'assets/stages/stage-02/combat.png',bgm:'assets/stages/stage-02/bgm.mp3',position:'50% 60%'},
});
// Union of idle/hit alpha bounds in the ORIGINAL canvases: [width,height,left,top,right,bottom].
// These bounds fit the visual layer only; neither image is cropped or altered.
const pair=(stage,number,scale,bounds,motion='float')=>({idle:`assets/stages/${stage}/monsters/${number}_idle.png`,hit:`assets/stages/${stage}/monsters/${number}_hit.png`,scale,bounds,anchor:'50% 100%',motion});
export const MONSTER_ASSETS=Object.freeze({
  'enemy.stage1.01':pair('stage-01','01',1.848,[1254,1254,248,251,1032,1048]),
  'enemy.stage1.02':pair('stage-01','02',1.8,[1254,1254,193,293,1166,1015],'breathe'),
  'boss.stage1':pair('stage-01','03',1.5,[1254,1254,36,47,1248,1207],'breathe'),
  'enemy.stage2.01':pair('stage-02','04',1.8,[1254,1254,125,222,1162,1091]),
  'enemy.stage2.02':pair('stage-02','05',1.65,[1536,1024,122,93,1499,930],'breathe'),
  'enemy.stage2.03':pair('stage-02','06',1.7,[1254,1254,136,130,1186,1120]),
  'boss.stage2':pair('stage-02','07',1.5,[1254,1254,12,76,1250,1199],'breathe'),
});
export const sceneAssetUrl=path=>path?assetUrl('file',{file:path}):null;
const warned=new Set();
export function warnAsset(url){if(!warned.has(url)){warned.add(url);console.warn('Optional scene asset unavailable:',url);}}

/** Backgrounds paint behind existing boxes; their natural dimensions cannot affect layout. */
export function sceneBackdrop(parent,scene,kind,{full=false}={}){
  const art=SCENE_ASSETS[scene],url=sceneAssetUrl(art?.[kind]);if(!url)return;
  const layer=parent.ownerDocument.createElement('div');layer.className=full?'scene-backdrop scene-backdrop-full':'scene-backdrop';layer.setAttribute('aria-hidden','true');
  layer.style.backgroundPosition=art.position;parent.prepend(layer);
  const image=new Image();image.onload=()=>{if(layer.isConnected){layer.style.backgroundImage=`url("${url}")`;layer.dataset.ready='true';}};
  image.onerror=()=>{if(layer.isConnected)warnAsset(url);};image.src=url;
  return layer;
}
