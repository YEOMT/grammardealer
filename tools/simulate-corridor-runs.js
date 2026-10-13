import fs from 'node:fs/promises';
import {simulateRun} from './simulate-runs.js';
const out=process.env.SB_CORRIDOR_RUN_OUT||'.local-validation/v010/corridor-runs.json';
const runs=[];
for(const seed of (process.env.SB_CORRIDOR_SEEDS||'run-sequence.57,run-sequence.17,run-sequence.32').split(',')){
 const r=simulateRun({seed,vocabularyMode:'STANDARD',policy:'LEARNING',maxCommands:2400,campaignVersion:'0.10.0',skipTutorial:true,invalidExercise:true,exerciseResources:true,libraryCourse:process.env.SB_LIBRARY_COURSE==='1'});
 runs.push(r);console.log(seed,r.result,r.final,r.error??'');await fs.writeFile(out,JSON.stringify({kind:'ACTUAL_CONTROLLER_NATURAL_REWARD_CAMPAIGN_NOT_BROWSER',runs,status:runs.some(r=>r.error)?'FAIL':'PASS',completion:runs.some(r=>r.result==='CONTENT_COMPLETE')?'PASS':'NOT_RUN'},null,2));
}
if(runs.some(r=>r.error))process.exitCode=1;
