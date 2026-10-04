import { STAGE1, getStage1Encounter, stageRoundsForRun } from './stage1.js';
import { STAGE2 } from './stage2.js';
import { clone } from '../contracts.js';

export { STAGE1, STAGE2 };
export const STAGE_BY_ID = Object.freeze({ [STAGE1.id]: STAGE1, [STAGE2.id]: STAGE2 });
export const STAGE_VERSION = 'stage.0.2.0';
export const isCurrentCampaign = run => ['0.2.0','0.2.1'].includes(run?.version);
export function stageForRun(run) {
  const stage = STAGE_BY_ID[run?.progress?.stageId ?? STAGE1.id];
  if (!stage || stage.id === STAGE2.id && !isCurrentCampaign(run)) throw new RangeError('Unsupported stage for this campaign version');
  return stage;
}
export const getStageForRun = stageForRun;
export function roundsForRun(run) {
  return stageForRun(run).id === STAGE1.id ? stageRoundsForRun(run) : STAGE2.rounds;
}
export function getEncounter(stageId, roundIndex, gameVersion = '0.2.0') {
  if (stageId === STAGE1.id) return getStage1Encounter(roundIndex, gameVersion);
  if (stageId !== STAGE2.id || !['0.2.0','0.2.1'].includes(gameVersion)) throw new RangeError('Unsupported stage for this campaign version');
  if (!Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex >= STAGE2.rounds.length) throw new RangeError('Stage 2 round index must be 0..3');
  const round = clone(STAGE2.rounds[roundIndex]);
  return { ...round, hpMax: round.hp, stageId };
}
