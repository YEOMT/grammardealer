import {usesPostBossShop,isPreparedShopIntro} from '../game/shopFlow.js';

const previous={'stage.02':'stage.01','stage.04':'stage.03','stage.06':'stage.05','stage.08':'stage.07','stage.10':'stage.09','stage.final':'stage.10'};
/** Place only: never change the shop's supply target, grants or persisted state. */
export function resolvePresentationRegion(run){
 const stage=run?.progress?.stageId;
 const target=run?.status==='SHOP'?(run.shop?.stageId??stage):stage;
 const preparing=run?.status==='SHOP'||(run?.status==='STAGE_INTRO'&&!isPreparedShopIntro(run)&&
  ((stage==='stage.04'&&run.entryChoice?.pending)||(stage==='stage.08'&&run.waterwaysEntryChoice?.pending)));
 return usesPostBossShop(run)&&preparing?(previous[target]??target):target;
}
