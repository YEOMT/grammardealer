import {RunController as Current} from '../../src/game/runController.js';
import {POLISH0121_VERSIONS} from '../../src/contracts.js';
import {campaignCards} from '../../src/data/cardCatalog.js';
/** Freeze pre-comma campaign fixtures; generator/RNG remain their actual 0.12.1 values. */
export class RunController extends Current {
 dispatch(command){
  const result=super.dispatch(command);
  if(command.type==='NEW_RUN'&&result.ok){const s=this.getState();s.version='0.12.1';s.contentVersions=structuredClone(POLISH0121_VERSIONS);s.contentManifest.id='campaign.0.12.1';s.contentManifest.cardDefIds=campaignCards(s.version).filter(c=>c.runtimeReady).map(c=>c.id);this._state=s;}
  return result;
 }
}
