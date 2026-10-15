import fs from 'node:fs/promises';
import path from 'node:path';
import {simulateRun} from './simulate-runs.js';
const out=process.env.SB_0101_RUN_OUT??'.local-validation/v0101/natural-runs.json';await fs.mkdir(path.dirname(out),{recursive:true});
const runs=[],exercise=process.env.SB_0101_EXERCISE!=='0';
for(const seed of (process.env.SB_0101_SEEDS??'run-sequence.57,run-sequence.17,run-sequence.32').split(',')){
 const r=simulateRun({seed,vocabularyMode:'STANDARD',policy:'LEARNING',maxCommands:2400,campaignVersion:'0.10.1',skipTutorial:true,invalidExercise:exercise,exerciseResources:exercise});
 runs.push(r);console.log(seed,r.result,r.final,r.error??'');await fs.writeFile(out,JSON.stringify({scope:'NATURAL_CONTROLLER_REWARDS_NOT_BROWSER_OR_WIN_RATE_STUDY',status:runs.some(x=>x.error)?'FAIL':'PASS',exerciseInvalidAndResourceActions:exercise,completion:runs.some(x=>x.result==='CONTENT_COMPLETE')?'PASS':'NOT RUN',runs},null,2));
}
if(runs.some(x=>x.error))process.exitCode=1;
