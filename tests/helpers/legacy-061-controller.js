import {runesForVersion} from '../../src/data/runes.js';
import {restore04Starter} from './legacy-04-starter.js';
import {RunController as Current} from '../../src/game/runController.js';
import {POLISH_VERSIONS} from '../../src/contracts.js';
import {campaignCards} from '../../src/data/cardCatalog.js';
/** Pin historical regression fixtures to their original policy, without changing assertions. */
export class RunController extends Current {
 dispatch(command){const result=super.dispatch(command);if(command.type==='NEW_RUN'&&result.ok){const s=this.getState();restore04Starter(s);s.version='0.6.1';s.contentVersions=structuredClone(POLISH_VERSIONS);s.contentManifest={...s.contentManifest,id:'campaign.0.6.1',stageIds:['stage.01','stage.02','stage.03','stage.04','stage.05','stage.06'],runeIds:runesForVersion(s.version).map(r=>r.id),cardDefIds:campaignCards(s.version).filter(c=>c.runtimeReady).map(c=>c.id)};s.config.contentProfile='STAGE1_STAGE2_STAGE3_STAGE4_STAGE5_STAGE6';s.eligibility.runStartUnlockBaseline=s.eligibility.runStartUnlockBaseline.filter(id=>!id.startsWith('rune.')||s.contentManifest.runeIds.includes(id));this._state=s;}return result;}
}
