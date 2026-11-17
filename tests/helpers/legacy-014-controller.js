import {RunController as Current} from '../../src/game/runController.js';
/** Explicit pre-0.15 policy fixture; all original tutorial assertions still run. */
export class RunController extends Current{
 dispatch(command){const result=super.dispatch(command);if(command.type==='NEW_RUN'&&result.ok){const s=this.getState();delete s.playFeedbackPolicy;delete s.contentManifest.playFeedbackPolicy;if(s.tutorialSession)delete s.tutorialSession.policy;this._state=s;}return result;}
}
