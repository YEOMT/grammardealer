import {STAGE_FINAL} from './finalePolicy.js';
import {STAGE10} from './stage10.js';
import {STAGE9} from './stage9.js';
import {LIBRARY_CONFIRMED} from './libraryPolicy.js';
import {STAGE8} from './stage8.js';
import {STAGE7} from './stage7.js';
import {STAGE5} from './stage5.js';
import {STAGE6} from './stage6.js';
import {hasFinaleCampaign,hasCorridorCampaign,hasLibraryCampaign,hasEmberCampaign,hasTimeCampaign,hasSkyCampaign,hasDesertCampaign,hasSnowCampaign} from './campaignFeatures.js';
import {STAGE4} from './stage4.js';
import { STAGE1, getStage1Encounter, stageRoundsForRun } from './stage1.js';
import { STAGE2 } from './stage2.js';
import { STAGE3 } from './stage3.js';
import { clone,deepFreeze } from '../contracts.js';

export { STAGE1, STAGE2, STAGE3, STAGE4, STAGE5, STAGE6, STAGE7, STAGE8, STAGE9, STAGE10, STAGE_FINAL };
export const STAGE_BY_ID = Object.freeze({ [STAGE1.id]: STAGE1, [STAGE2.id]: STAGE2, [STAGE3.id]:STAGE3, [STAGE4.id]:STAGE4, [STAGE5.id]:STAGE5, [STAGE6.id]:STAGE6, [STAGE7.id]:STAGE7, [STAGE8.id]:STAGE8, [STAGE9.id]:STAGE9, [STAGE10.id]:STAGE10, [STAGE_FINAL.id]:STAGE_FINAL });
export const STAGE_VERSION = 'stage.0.2.0';
export const isCurrentCampaign = run => ['0.2.0','0.2.1','0.2.2','0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0'].includes(run?.version);
const POLISH_HP={'stage.04':[520,570,620,680,760],'stage.05':[620,670,720,780,960]};
const POLISH_STAGES=deepFreeze(Object.fromEntries([STAGE4,STAGE5].map(s=>[s.id,{...clone(s),rounds:s.rounds.map((r,i)=>({...clone(r),hp:POLISH_HP[s.id][i]}))}])));
const LIBRARY_STAGES=deepFreeze(Object.fromEntries(Object.values(STAGE_BY_ID).map(stage=>[stage.id,{...clone(POLISH_STAGES[stage.id]??stage),rounds:(POLISH_STAGES[stage.id]??stage).rounds.map(r=>{const n=Number(stage.id.slice(-2));if(!Number.isFinite(n)||n>8||r.kind!=='REGIONAL_BOSS')return clone(r);const next={...clone(r),hp:LIBRARY_CONFIRMED.existingBossHp[n-1]};if(n===3){next.bossMechanic.policyVersion='0.9.0';next.bossMechanic.phases=next.bossMechanic.phases.map(p=>({...p,hp:280,maxHp:280}));}return next;})}])));
const PATCH0101_HP=deepFreeze({'stage.02':[200,270,360,750],'stage.03':[300,320,360,400,780],'stage.04':[500,530,570,600,1000],'stage.05':[640,680,740,800,1300]});
const PATCH0101_STAGES=deepFreeze(Object.fromEntries(Object.entries(LIBRARY_STAGES).map(([id,s])=>[id,{...clone(s),rounds:s.rounds.map((r,i)=>{const next={...clone(r),hp:PATCH0101_HP[id]?.[i]??r.hp};if(id==='stage.03'&&r.kind==='REGIONAL_BOSS'){next.bossMechanic.policyVersion='0.10.1';next.bossMechanic.phases=next.bossMechanic.phases.map(p=>({...p,hp:260,maxHp:260}));}return next;})}])));
export function stageForRun(run) {
  const stage = STAGE_BY_ID[run?.progress?.stageId ?? STAGE1.id];
  if(stage?.id===STAGE_FINAL.id){if(!hasFinaleCampaign(run))throw new RangeError('Finale requires a 0.11 campaign');return STAGE_FINAL;}
  if(stage?.id===STAGE10.id&&!hasCorridorCampaign(run))throw new RangeError('Stage 10 requires a 0.10 campaign');
  if(stage?.id===STAGE9.id&&!hasLibraryCampaign(run))throw new RangeError('Stage 9 requires a 0.9 campaign');
  if(stage?.id===STAGE8.id&&!['0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0'].includes(run?.version))throw new RangeError('Stage 8 requires a 0.8 campaign');
  if(stage?.id===STAGE7.id&&!hasEmberCampaign(run))throw new RangeError('Stage 7 requires a 0.7 campaign');
  if(stage?.id===STAGE6.id&&!hasSnowCampaign(run))throw new RangeError('Stage 6 requires a 0.6 campaign');
  if (stage?.id===STAGE4.id&&!hasSkyCampaign(run))throw new RangeError('Stage 4 requires a 0.4 campaign');
  if(stage?.id===STAGE5.id&&!hasDesertCampaign(run))throw new RangeError('Stage 5 requires a 0.5 campaign');
  if (!stage || stage.id === STAGE2.id && !isCurrentCampaign(run)||stage.id===STAGE3.id&&!['0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0'].includes(run?.version)) throw new RangeError('Unsupported stage for this campaign version');
  if(['0.10.1','0.10.2','0.11.0'].includes(run.version))return hasFinaleCampaign(run)&&stage.id===STAGE10.id?{...PATCH0101_STAGES[stage.id],exitStatus:'STAGE_CLEAR',nextStageImplemented:true}:PATCH0101_STAGES[stage.id];
  if(hasLibraryCampaign(run))return LIBRARY_STAGES[stage.id];
  return ['0.5.1','0.6.0','0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0'].includes(run?.version)?(POLISH_STAGES[stage.id]??stage):stage;
}
export const getStageForRun = stageForRun;
export function roundsForRun(run) {
  const stage=stageForRun(run);return stage.id === STAGE1.id ? stageRoundsForRun(run) : stage.rounds;
}
export function getEncounter(stageId, roundIndex, gameVersion = '0.2.0') {
  if (stageId === STAGE1.id) return getStage1Encounter(roundIndex, gameVersion);
  const stage=stageForRun({version:gameVersion,progress:{stageId}});
  if (!Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex >= stage.rounds.length) throw new RangeError('Invalid stage round index');
  const round = clone(stage.rounds[roundIndex]);
  return { ...round, hpMax: round.hp, stageId };
}
