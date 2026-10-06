import {STAGE5} from './stage5.js';
import {hasTimeCampaign,hasSkyCampaign,hasDesertCampaign} from './campaignFeatures.js';
import {STAGE4} from './stage4.js';
import { STAGE1, getStage1Encounter, stageRoundsForRun } from './stage1.js';
import { STAGE2 } from './stage2.js';
import { STAGE3 } from './stage3.js';
import { clone } from '../contracts.js';

export { STAGE1, STAGE2, STAGE3, STAGE4, STAGE5 };
export const STAGE_BY_ID = Object.freeze({ [STAGE1.id]: STAGE1, [STAGE2.id]: STAGE2, [STAGE3.id]:STAGE3, [STAGE4.id]:STAGE4, [STAGE5.id]:STAGE5 });
export const STAGE_VERSION = 'stage.0.2.0';
export const isCurrentCampaign = run => ['0.2.0','0.2.1','0.2.2','0.3.0','0.4.0','0.5.0'].includes(run?.version);
export function stageForRun(run) {
  const stage = STAGE_BY_ID[run?.progress?.stageId ?? STAGE1.id];
  if (stage?.id===STAGE4.id&&!hasSkyCampaign(run))throw new RangeError('Stage 4 requires a 0.4 campaign');
  if(stage?.id===STAGE5.id&&!hasDesertCampaign(run))throw new RangeError('Stage 5 requires a 0.5 campaign');
  if (!stage || stage.id === STAGE2.id && !isCurrentCampaign(run)||stage.id===STAGE3.id&&!['0.3.0','0.4.0','0.5.0'].includes(run?.version)) throw new RangeError('Unsupported stage for this campaign version');
  return stage;
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
