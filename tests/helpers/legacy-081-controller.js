import {runesForVersion} from '../../src/data/runes.js';
import {RunController as Current} from '../../src/game/runController.js';
import {PATCH081_VERSIONS} from '../../src/contracts.js';
import {campaignCards} from '../../src/data/cardCatalog.js';
/** Historical campaign fixture: keep 37 battles, old balance and generator, with unchanged assertions. */
export class RunController extends Current {
 dispatch(command){const result=super.dispatch(command);if(command.type==='NEW_RUN'&&result.ok){const s=this.getState();s.version='0.8.1';s.contentVersions=structuredClone(PATCH081_VERSIONS);s.contentManifest={...s.contentManifest,id:'campaign.0.8',stageIds:s.contentManifest.stageIds.filter(id=>!['stage.09','stage.10'].includes(id)),runeIds:runesForVersion(s.version).map(r=>r.id),cardDefIds:campaignCards(s.version).filter(c=>c.runtimeReady).map(c=>c.id)};s.config.contentProfile='STAGE1_STAGE2_STAGE3_STAGE4_STAGE5_STAGE6_STAGE7_STAGE8';s.eligibility.runStartUnlockBaseline=s.eligibility.runStartUnlockBaseline.filter(id=>!id.startsWith('rune.')||s.contentManifest.runeIds.includes(id));this._state=s;}return result;}
}
