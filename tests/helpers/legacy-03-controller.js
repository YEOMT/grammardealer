import {RunController as CurrentController} from '../../src/game/runController.js';
import {registryForVersion} from '../../src/data/language/index.js';
import {restoreLegacyStarter} from './legacy-starter.js';
/** Execute historical 12-battle assertions against the real versioned controller. */
export class RunController extends CurrentController{
 dispatch(command){const r=super.dispatch(command);if(command.type==='NEW_RUN'&&r.ok){const s=this.getState();restoreLegacyStarter(s);s.version='0.3.0';s.contentVersions={"game":"0.3.0","save":"0.3.0","language":"0.3.0","grammar":"0.3.0","balance":"0.3.0","comboEligibility":"0.3.0","learningRecord":"0.3.0","generator":"0.1.1","reward":"0.2.0","meaning":"0.2.0","tutorial":"0.2.1","runes":"0.3.0","presentation":"0.2.1"};s.contentManifest.id='campaign.0.3';s.contentManifest.stageIds=['stage.01','stage.02','stage.03'];s.contentManifest.cardDefIds=registryForVersion('0.3.0').cards.filter(c=>c.runtimeReady).map(c=>c.id);s.config.contentProfile='STAGE1_STAGE2_STAGE3';delete s.entryChoice;this._state=s;}return r;}
}
