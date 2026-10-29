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
