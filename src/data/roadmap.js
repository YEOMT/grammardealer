// Implemented v0.1 values from the supplied handoff. Future systems remain metadata only.
const deepFreeze = (value) => { Object.values(value).forEach((item) => { if (item && typeof item === "object") deepFreeze(item); }); return Object.freeze(value); };
export const ROADMAP = deepFreeze({
  "stageCounts": [
    3,
    4,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5
  ],
  "storyBattleTotal": 48,
  "shopBeforeBattles": [
    4,
    13,
    23,
    33,
    43,
    48
  ],
  "shopCount": 6,
  "shopDestinations": [
    2,
    4,
    6,
    8,
    10,
    "FINAL"
  ],
  "shopEnhanceUses": 1,
  "shopRemoveUses": 1,
  "regionBonus": {
    "num": 5,
    "den": 4
  },
  "bossVariants": "AFTER_TRUE_48_BATTLE_CLEAR_ONLY",
  "firstRuneEveryRun": true,
  "runeUnlocksPermanent": true,
  "startingSlots": 3,
  "slotGrowth": [
    {
      "afterStage": 3,
      "slots": 4
    },
    {
      "afterStage": 6,
      "slots": 5
    }
  ],
  "leaderboard": "TOP100_SERVER_ONLY_LATER",
  "offlineRestart": "PWA_LATER_AFTER_CACHE_VALIDATION",
  "golden": {
    "goldPerUsedGoldenCardOnKill": 2,
    "perEnemyGoldenGoldCap": 6,
    "shopApplyCost": 12
  },
  "resonant": {
    "sameDisplayCategoryMinimum": 3,
    "scoreBonusPerUsedResonantCard": 10,
    "shopApplyCost": 12
  },
  "runtimeReady": false,
  "implementedStages": [
    1
  ],
  "futureRunes": [
    {
      "id": "rune.svoo",
      "nameKo": "토파즈 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.svoc",
      "nameKo": "가넷 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.tense",
      "nameKo": "호안석 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.progressive",
      "nameKo": "아쿠아마린 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.perfect",
      "nameKo": "진주 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.passive",
      "nameKo": "은빛 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.infinitive",
      "nameKo": "황수정 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.gerund",
      "nameKo": "자수정 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.clauseLink",
      "nameKo": "청금석 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.relative",
      "nameKo": "오팔 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.relativeChain",
      "nameKo": "다이아몬드 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.subjectConstruction",
      "nameKo": "월장석 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.unreal",
      "nameKo": "흑요석 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.fusion",
      "nameKo": "무지개 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.humanSubject",
      "nameKo": "산호 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.idea",
      "nameKo": "남색 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.chorus",
      "nameKo": "백금 룬",
      "runtimeReady": false
    },
    {
      "id": "rune.turnDraw",
      "nameKo": "혜성 룬",
      "runtimeReady": false
    }
  ]
});
