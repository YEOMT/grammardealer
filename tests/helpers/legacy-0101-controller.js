import {RunController as Current} from '../../src/game/runController.js';
import {PATCH0101_VERSIONS} from '../../src/contracts.js';
/** Explicit historical fixture: preserves 0.10.1's sixteen-card campaign contract. */
export class RunController extends Current {
 dispatch(command){const result=super.dispatch(command);if(command.type==='NEW_RUN'&&result.ok){const s=this.getState();s.version='0.10.1';s.contentVersions=structuredClone(PATCH0101_VERSIONS);this._state=s;}return result;}
}
