import {RunController as Current} from '../../src/game/runController.js';
import {campaignCards} from '../../src/data/cardCatalog.js';
/** Original 0.6 policy fixture. New-run defaults must not alter historical assertions. */
export class RunController extends Current {
 dispatch(command){
  const result=super.dispatch(command);
  if(command.type==='NEW_RUN'&&result.ok){
   const s=this.getState();s.version='0.6.0';
   s.contentVersions={game:'0.6.0',save:'0.6.0',language:'0.6.0',grammar:'0.6.0',balance:'0.6.0',comboEligibility:'0.6.0',learningRecord:'0.6.0',generator:'0.4.0',reward:'0.6.0',meaning:'0.2.0',tutorial:'0.2.1',runes:'0.3.0',presentation:'0.6.0'};
   s.contentManifest={...s.contentManifest,id:'campaign.0.6',stageIds:['stage.01','stage.02','stage.03','stage.04','stage.05','stage.06'],cardDefIds:campaignCards(s.version).filter(c=>c.runtimeReady).map(c=>c.id)};
   s.config.contentProfile='STAGE1_STAGE2_STAGE3_STAGE4_STAGE5_STAGE6';delete s.entryChoice;this._state=s;
  }
  return result;
 }
}
