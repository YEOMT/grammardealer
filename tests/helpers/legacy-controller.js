/** Explicit pre-0.2.1 campaign fixture. Assertions still execute the current controller/engines. */
import {RunController as CurrentController} from '../../src/game/runController.js';
import {registryForVersion} from '../../src/data/language/index.js';
import {createTutorial} from '../../src/game/tutorial.js';
export class RunController extends CurrentController {
 dispatch(command){
  const result=super.dispatch(command);
  if(command.type==='NEW_RUN'&&result.ok){
   const state=this.getState();if(state.tutorialSession?.parked)Object.assign(state,structuredClone(state.tutorialSession.parked));delete state.tutorialSession;
   state.version='0.2.0';Object.assign(state.contentVersions,{game:'0.2.0',save:'0.2.0',language:'0.2.0',tutorial:'0.1.1',presentation:'0.1.1'});
   state.contentManifest.cardDefIds=registryForVersion('0.2.0').cards.filter(c=>c.runtimeReady).map(c=>c.id);
   state.tutorial=createTutorial(this.getProfile());this._state=state;
  }
  return result;
 }
}
