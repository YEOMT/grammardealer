import {CORRIDOR_PACK} from '../data/corridorPolicy.js';
/** Controller-owned proposal: unlock before stock generation, zero free physical cards. */
export function prepareCorridorEntry(run){
 if(!['0.10.0','0.10.1','0.10.2'].includes(run.version)||run.progress.stageId!=='stage.10'||run.combat!==null)throw Error('Corridor entry outside preparation');
 if(run.entryGrants['stage.10']?.applied)return run.entryGrants['stage.10'];
 run.eligibility.runOwnUnlocks=[...new Set([...run.eligibility.runOwnUnlocks,CORRIDOR_PACK])];
 return run.entryGrants['stage.10']={entryVersion:'0.10.0',entryGrantId:`${run.runId}:stage.10.entry`,applied:true,cardInstanceIds:[],cardDefIds:[]};
}
export function validateCorridorEntry(run){
 const grant=run.entryGrants?.['stage.10'],fail=()=>{throw Error('Invalid corridor entry');};
 if(!['0.10.0','0.10.1','0.10.2'].includes(run.version)){if(grant)fail();return true;}
 if(run.progress.stageId==='stage.10'&&run.status!=='STAGE_INTRO'&&!grant)fail();
 if(grant&&(run.progress.stageId!=='stage.10'||grant.entryVersion!=='0.10.0'||grant.entryGrantId!==`${run.runId}:stage.10.entry`||grant.applied!==true||JSON.stringify(grant.cardInstanceIds)!=='[]'||JSON.stringify(grant.cardDefIds)!=='[]'||!run.eligibility.runOwnUnlocks.includes(CORRIDOR_PACK)))fail();
 return true;
}
