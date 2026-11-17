import {usesPostBossShop,isPreparedShopIntro} from '../game/shopFlow.js';
import {isGuided} from '../game/guidedTutorial.js';
import {roundsForRun} from '../data/stages.js';

/** Read-only eligibility. ENTER_STAGE may open a shop; never speculate by dispatching it. */
export function firstPreparationContext(run){
 if(!usesPostBossShop(run)||run.status!=='STAGE_INTRO'||run.progress.roundIndex!==0||isGuided(run)||run.tutorialAbandoned)return null;
 const stage=run.progress.stageId;
 if(!isPreparedShopIntro(run)&&stage!=='stage.01'&&!['stage.03','stage.05','stage.07','stage.09'].includes(stage))return null;
 const encounter=roundsForRun(run)[0];
 return {key:`${run.runId}:${stage}:${encounter.id}`,revision:run.revision,encounterIndex:0,command:stage==='stage.01'?'START_BATTLE':'ENTER_STAGE'};
}

/** UI lifetime is independent of RunState. Old owners and already consumed callbacks cannot start. */
export function createFirstPreparationGate(){
 let active=null;
 const matches=(owner,run)=>{const now=firstPreparationContext(run);return active&&active.owner===owner&&now?.key===active.key&&now.revision===active.revision;};
 return {
  open(owner,run){const next=firstPreparationContext(run);active=next?{...next,owner}:null;return !!active;},
  current(owner,run){if(!matches(owner,run))active=null;return active;},
  take(owner,run){if(!matches(owner,run)){active=null;return null;}const command={type:active.command,expectedRevision:active.revision};active=null;return command;},
  clear(){active=null;}
 };
}
