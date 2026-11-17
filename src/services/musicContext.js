import {resolvePresentationRegion} from './presentationRegion.js';
import {SCENE_ASSETS} from './sceneAssets.js';
/** Derive the visible region even on a direct saved-shop load, not from the last song. */
export function resolveMusicContext(route,run){
  if(route!=='#game'||!run)return route==='#sandbox'?null:'lobby';
  return resolvePresentationRegion(run);
}
export const musicManifest=Object.fromEntries(Object.entries(SCENE_ASSETS).filter(([,v])=>v.bgm).map(([id,v])=>[id,v.bgm]));

/** Region requests are immediate; AudioManager owns the playback-clock sequence. */
export function createMusicDirector(audio){
 let key=null,target=null,owner=null;
 return {sync(route,run,session=null){
   const next=resolveMusicContext(route,run),nextKey=`${route==='#game'?run?.runId??'':route}:${next}`;
   if(nextKey===key&&owner===session)return;
   const prior=target,changedSession=owner!==session;key=nextKey;target=next;owner=session;
   audio.setBgmAsset(next,musicManifest,{sequential:!changedSession&&prior?.startsWith('stage.')&&next?.startsWith('stage.')&&prior!==next});
 },cancel(){audio.cancelBgmTransition?.();key=null;target=null;owner=null;},get pending(){return !!audio.bgmTransition;}};
}
