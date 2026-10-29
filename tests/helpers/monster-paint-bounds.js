import {MONSTER_ASSETS} from '../../src/services/sceneAssets.js';
/** Painted union of the original idle/hit pair, after contain and the common visual transform. */
export function monsterPaintBounds(root=document){
  const image=root.querySelector('.monster-image'),r=image.getBoundingClientRect();
  const art=Object.values(MONSTER_ASSETS).find(a=>image.src.endsWith(a.idle));
  const [w,h,left,top,right,bottom]=art.bounds,unit=Math.min(r.width/w,r.height/h);
  const x=r.left+(r.width-w*unit)/2,y=r.bottom-h*unit;
  return {left:x+left*unit,top:y+top*unit,right:x+right*unit,bottom:y+bottom*unit,
    scale:Number(root.querySelector('.monster-art-motion').style.getPropertyValue('--monster-scale')),
    desiredScale:art.scale};
}
