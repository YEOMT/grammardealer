import {RunController as CurrentController} from '../../src/game/runController.js';
import {campaignCards} from '../../src/data/cardCatalog.js';
/** Historical assertions execute the real persisted 0.4 path, never regenerate expected results. */
export class RunController extends CurrentController{
 dispatch(command){const r=super.dispatch(command);if(command.type==='NEW_RUN'&&r.ok){const s=this.getState();s.version='0.4.0';s.contentVersions={"game":"0.4.0","save":"0.4.0","language":"0.4.0","grammar":"0.4.0","balance":"0.4.0","comboEligibility":"0.4.0","learningRecord":"0.4.0","generator":"0.4.0","reward":"0.4.0","meaning":"0.2.0","tutorial":"0.2.1","runes":"0.3.0","presentation":"0.2.1"};s.contentManifest.id='campaign.0.4';s.contentManifest.stageIds=['stage.01','stage.02','stage.03','stage.04'];s.contentManifest.cardDefIds=campaignCards('0.4.0').filter(c=>c.runtimeReady).map(c=>c.id);s.config.contentProfile='STAGE1_STAGE2_STAGE3_STAGE4';delete s.entryChoice;this._state=s;}return r;}
}
