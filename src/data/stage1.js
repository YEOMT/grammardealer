// Stage 1 values are shared by current campaigns; the legacy 0.1.0 HP view stays explicit below.
const deepFreeze = (value) => { Object.values(value).forEach((item) => { if (item && typeof item === "object") deepFreeze(item); }); return Object.freeze(value); };
export const STAGE1 = deepFreeze({
  "id": "stage.01",
  "nameKo": "시작의 초원",
  "focusFrames": ["frame.sv", "frame.svc.adj", "frame.svc.np", "frame.svo", "frame.beLocative"],
  "regionLabelKo": "시작의 초원 · 기본 문형 ×1.25",
  "regionMultiplier": { "num": 5, "den": 4 },
  "rounds": [
    {
      "battleNumber": 1,
      "id": "battle.01.01",
      "enemyId": "enemy.stage1.01",
      "nameKo": "풀잎 슬라임",
      "emoji": "🌱",
      "hp": 91,
      "kind": "NORMAL"
    },
    {
      "battleNumber": 2,
      "id": "battle.01.02",
      "enemyId": "enemy.stage1.02",
      "nameKo": "숲 달팽이",
      "emoji": "🐌",
      "hp": 156,
      "kind": "NORMAL"
    },
    {
      "battleNumber": 3,
      "id": "battle.01.03",
      "enemyId": "boss.stage1",
      "nameKo": "초원 수호자",
      "emoji": "🌳",
      "hp": 286,
      "kind": "REGIONAL_BOSS"
    }
  ],
  "bossNoHardGate": true,
  "exitStatus": "CONTENT_COMPLETE",
  "notStoryClear": true,
  "afterClearCurriculumUnlock": "pack.svoo",
  "nextStageImplemented": false
});
export const STAGE_VERSION = "stage.0.1.1";
export const LEGACY_STAGE1_HP = Object.freeze([70,120,220]);
export const PATCH_STAGE1_HP = Object.freeze(LEGACY_STAGE1_HP.map(hp=>hp*11/10));
export function stageRoundsForRun(run){const hp=run?.version==='0.1.0'?LEGACY_STAGE1_HP:['0.2.1','0.2.2','0.3.0','0.4.0','0.5.0','0.5.1'].includes(run?.version)?PATCH_STAGE1_HP:null;return hp?STAGE1.rounds.map((r,i)=>({...r,hp:hp[i]})):STAGE1.rounds;}
export function getStage1Encounter(roundIndex, gameVersion='0.1.1') {
  if (!Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex >= STAGE1.rounds.length) throw new RangeError("Stage 1 round index must be 0..2");
  const round = stageRoundsForRun({version:gameVersion})[roundIndex];
  return { ...round, hpMax: round.hp, hp: round.hp, stageId: STAGE1.id };
}
