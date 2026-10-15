import {RunController as Current} from '../../src/game/runController.js';
import {CORRIDOR_VERSIONS} from '../../src/contracts.js';
import {runesForVersion} from '../../src/data/runes.js';
/** Explicit historical 0.10 fixture. Retains its HP, drops and original 12-rune pool. */
export class RunController extends Current {
 dispatch(command){const result=super.dispatch(command);if(command.type==='NEW_RUN'&&result.ok){
  const s=this.getState();s.version='0.10.0';s.contentVersions=structuredClone(CORRIDOR_VERSIONS);
  s.contentManifest.runeIds=runesForVersion(s.version).map(r=>r.id);
  s.eligibility.runStartUnlockBaseline=s.eligibility.runStartUnlockBaseline.filter(id=>!id.startsWith('rune.')||s.contentManifest.runeIds.includes(id));this._state=s;
 }return result;}
}
