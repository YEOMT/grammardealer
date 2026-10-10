import {RunController as Current} from '../../src/game/runController.js';
import {EMBER_VERSIONS} from '../../src/contracts.js';
import {campaignCards} from '../../src/data/cardCatalog.js';
/** Pin historical regression fixtures to their original policy, without changing assertions. */
export class RunController extends Current {
 dispatch(command){const result=super.dispatch(command);if(command.type==='NEW_RUN'&&result.ok){const s=this.getState();s.version='0.7.0';s.contentVersions=structuredClone(EMBER_VERSIONS);s.contentManifest={...s.contentManifest,id:'campaign.0.7',stageIds:['stage.01','stage.02','stage.03','stage.04','stage.05','stage.06','stage.07'],cardDefIds:campaignCards(s.version).filter(c=>c.runtimeReady).map(c=>c.id)};s.config.contentProfile='STAGE1_STAGE2_STAGE3_STAGE4_STAGE5_STAGE6_STAGE7';this._state=s;}return result;}
}
