import {restoreLegacyStarter} from './legacy-starter.js';
import {RunController as CurrentController} from '../../src/game/runController.js';
import {registryForVersion} from '../../src/data/language/index.js';
import {LEGACY_RUNES} from '../../src/data/runes.js';
/** The original 0.2.2 browser fixtures keep their saved campaign contract. */
export class RunController extends CurrentController{
 dispatch(command){const result=super.dispatch(command);if(command.type==='NEW_RUN'&&result.ok){const s=this.getState();restoreLegacyStarter(s);s.version='0.2.2';Object.assign(s.contentVersions,{game:'0.2.2',save:'0.2.2',language:'0.2.2',grammar:'0.2.2',balance:'0.2.0',runes:'0.2.0'});s.contentManifest={id:'campaign.0.2',stageIds:['stage.01','stage.02'],cardDefIds:registryForVersion('0.2.2').cards.filter(c=>c.runtimeReady).map(c=>c.id),runeIds:LEGACY_RUNES.map(r=>r.id)};s.eligibility.runStartUnlockBaseline=s.eligibility.runStartUnlockBaseline.filter(id=>id!=='rune.longSentence'&&!id.startsWith('pack.time.'));this._state=s;}return result;}
}
