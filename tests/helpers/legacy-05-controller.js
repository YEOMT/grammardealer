import {RunController as Current} from '../../src/game/runController.js';
export class RunController extends Current {dispatch(command){const r=super.dispatch(command);if(command.type==='NEW_RUN'&&r.ok){const s=this.getState();s.version='0.5.0';Object.assign(s.contentVersions,{game:'0.5.0',save:'0.5.0',presentation:'0.2.1'});this._state=s;}return r;}}
