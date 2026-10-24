import {RunController as Current} from '../../src/game/runController.js';
import {RECOVERY_VERSIONS} from '../../src/contracts.js';
import {removeFinaleFromHistoricalFixture} from './legacy-finale-boundary.js';
/** Explicit 0.10.2 regression fixture: 24 cards, 47 battles and no final clear. */
export class RunController extends Current {
 dispatch(command){
  const result=super.dispatch(command);
  if(command.type==='NEW_RUN'&&result.ok){
   const s=this.getState();s.version='0.10.2';s.contentVersions=structuredClone(RECOVERY_VERSIONS);
   this._state=removeFinaleFromHistoricalFixture(s);
  }
  return result;
 }
}
