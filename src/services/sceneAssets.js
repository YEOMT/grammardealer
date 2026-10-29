import {assetUrl} from './assets.js';

// Original user files. Presentation metadata never enters a RunState or RNG stream.
export const SCENE_ASSETS = Object.freeze({
  lobby:{background:'assets/lobby/background.png',bgm:'assets/lobby/bgm.mp3',position:'50% 50%'},
  'stage.01':{entry:'assets/stages/stage-01/entry.png',combat:'assets/stages/stage-01/combat.png',bgm:'assets/stages/stage-01/bgm.mp3',position:'50% 60%'},
  'stage.02':{entry:'assets/stages/stage-02/entry.png',combat:'assets/stages/stage-02/combat.png',bgm:'assets/stages/stage-02/bgm.mp3',position:'50% 60%'},
});
const pair=(stage,number,motion='float')=>({idle:`assets/stages/${stage}/monsters/${number}_idle.png`,hit:`assets/stages/${stage}/monsters/${number}_hit.png`,scale:1.12,anchor:'50% 100%',motion});
export const MONSTER_ASSETS=Object.freeze({
  'enemy.stage1.01':pair('stage-01','01'),
  'enemy.stage1.02':pair('stage-01','02','breathe'),
  'boss.stage1':pair('stage-01','03','breathe'),
  'enemy.stage2.01':pair('stage-02','04'),
  'enemy.stage2.02':pair('stage-02','05','breathe'),
  'enemy.stage2.03':pair('stage-02','06'),
  'boss.stage2':pair('stage-02','07','breathe'),
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
