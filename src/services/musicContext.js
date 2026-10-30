import {usesPostBossShop,isPreparedShopIntro} from '../game/shopFlow.js';
import {SCENE_ASSETS} from './sceneAssets.js';
const previous={'stage.02':'stage.01','stage.04':'stage.03','stage.06':'stage.05','stage.08':'stage.07','stage.10':'stage.09','stage.final':'stage.10'};
/** Derive the visible region even on a direct saved-shop load, not from the last song. */
export function resolveMusicContext(route,run){
  if(route!=='#game'||!run)return route==='#sandbox'?null:'lobby';
  const stage=run.progress?.stageId;
  const preparing=run.status==='SHOP'||(run.status==='STAGE_INTRO'&&!isPreparedShopIntro(run)&&
    ((stage==='stage.04'&&run.entryChoice?.pending)||(stage==='stage.08'&&run.waterwaysEntryChoice?.pending)));
  return usesPostBossShop(run)&&preparing?(previous[stage]??stage):stage;
}
export const musicManifest=Object.fromEntries(Object.entries(SCENE_ASSETS).filter(([,v])=>v.bgm).map(([id,v])=>[id,v.bgm]));

/** One pending region transition. Re-renders and fast entry keep the original deadline. */
export function createMusicDirector(audio,{delay=3000,schedule=setTimeout,cancel=clearTimeout}={}){
 let key=null,target=null,owner=null,timer=null,epoch=0;
 return {sync(route,run,session=null){
   const next=resolveMusicContext(route,run),nextKey=`${route==='#game'?run?.runId??'':route}:${next}`;
   if(nextKey===key&&owner===session)return;
   const prior=target,changedSession=owner!==session;key=nextKey;target=next;owner=session;epoch++;cancel(timer);timer=null;
   const token=epoch;
   if(!changedSession&&prior?.startsWith('stage.')&&next?.startsWith('stage.')&&prior!==next&&audio.currentBgm){
     audio.holdCurrentBgm?.();
     timer=schedule(()=>{timer=null;if(token===epoch)audio.setBgmAsset(next,musicManifest);},delay);
   }else audio.setBgmAsset(next,musicManifest);
 },cancel(){epoch++;cancel(timer);timer=null;key=null;target=null;owner=null;},get pending(){return timer!==null;}};
}
