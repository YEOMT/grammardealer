// Implemented v0.1 values from the supplied handoff. Future systems remain metadata only.
const deepFreeze = (value) => { Object.values(value).forEach((item) => { if (item && typeof item === "object") deepFreeze(item); }); return Object.freeze(value); };
export const LEGACY_RUNES = deepFreeze([
  {
    "id": "rune.short",
    "nameKo": "호박 룬",
    "group": "GRAMMAR",
    "rarity": "COMMON",
    "conditionDescriptionKo": "핵심 문장 구조가 성립하고 사용한 단어 카드가 4장 이하",
    "operation": "MULTIPLY_SCORE",
    "levelValues": [
      {
        "num": 5,
        "den": 4
      },
      {
        "num": 3,
        "den": 2
      },
      {
        "num": 7,
        "den": 4
      }
    ],
    "scope": "ONCE_PER_ATTACK",
    "maxMatchesPerAttack": null,
    "displayEffectSummaryKo": "4장 이하 공격",
    "unlockRuleId": "unlock.rune.short",
    "unlockTextKo": "처음부터",
    "firstRuneBasicPoolEligible": true,
    "runtimeReady": true,
    "color": "#edb751"
  },
  {
    "id": "rune.sv",
    "nameKo": "루비 룬",
    "group": "GRAMMAR",
    "rarity": "COMMON",
    "conditionDescriptionKo": "주절이 1형식",
    "operation": "MULTIPLY_SCORE",
    "levelValues": [
      {
        "num": 7,
        "den": 5
      },
      {
        "num": 9,
        "den": 5
      },
      {
        "num": 11,
        "den": 5
      }
    ],
    "scope": "ONCE_PER_ATTACK",
    "maxMatchesPerAttack": null,
    "displayEffectSummaryKo": "주절 1형식",
    "unlockRuleId": "unlock.rune.sv",
    "unlockTextKo": "처음부터",
    "firstRuneBasicPoolEligible": true,
    "runtimeReady": true,
    "color": "#ea616f"
  },
  {
    "id": "rune.svc",
    "nameKo": "사파이어 룬",
    "group": "GRAMMAR",
    "rarity": "COMMON",
    "conditionDescriptionKo": "주절이 2형식",
    "operation": "MULTIPLY_SCORE",
    "levelValues": [
      {
        "num": 7,
        "den": 5
      },
      {
        "num": 9,
        "den": 5
      },
      {
        "num": 11,
        "den": 5
      }
    ],
    "scope": "ONCE_PER_ATTACK",
    "maxMatchesPerAttack": null,
    "displayEffectSummaryKo": "주절 2형식",
    "unlockRuleId": "unlock.rune.svc",
    "unlockTextKo": "처음부터",
    "firstRuneBasicPoolEligible": true,
    "runtimeReady": true,
    "color": "#69a8e6"
  },
  {
    "id": "rune.svo",
    "nameKo": "에메랄드 룬",
    "group": "GRAMMAR",
    "rarity": "COMMON",
    "conditionDescriptionKo": "주절이 3형식",
    "operation": "MULTIPLY_SCORE",
    "levelValues": [
      {
        "num": 7,
        "den": 5
      },
      {
        "num": 9,
        "den": 5
      },
      {
        "num": 11,
        "den": 5
      }
    ],
    "scope": "ONCE_PER_ATTACK",
    "maxMatchesPerAttack": null,
    "displayEffectSummaryKo": "주절 3형식",
    "unlockRuleId": "unlock.rune.svo",
    "unlockTextKo": "처음부터",
    "firstRuneBasicPoolEligible": true,
    "runtimeReady": true,
    "color": "#68c4a0"
  },
  {
    "id": "rune.perfectSentence",
    "nameKo": "수정 룬",
    "group": "CARD",
    "rarity": "COMMON",
    "conditionDescriptionKo": "전체 제출 문장이 정상이고 정확성 오류가 없음",
    "operation": "ADD_SCORE",
    "levelValues": [
      20,
      35,
      50
    ],
    "scope": "ONCE_PER_ATTACK",
    "maxMatchesPerAttack": null,
    "displayEffectSummaryKo": "오류 없는 문장",
    "unlockRuleId": "unlock.rune.perfectSentence",
    "unlockTextKo": "처음부터",
    "firstRuneBasicPoolEligible": true,
    "runtimeReady": true,
    "color": "#b7e4e5"
  },
  {
    "id": "rune.adverbs",
    "nameKo": "비취 룬",
    "group": "CARD",
    "rarity": "COMMON",
    "conditionDescriptionKo": "정상적으로 수식 역할을 수행한 서로 다른 부사 카드 각각",
    "operation": "ADD_SCORE",
    "levelValues": [
      5,
      8,
      12
    ],
    "scope": "PER_VALID_ADVERB_CARD",
    "maxMatchesPerAttack": null,
    "displayEffectSummaryKo": "유효한 부사 카드별 덧셈",
    "unlockRuleId": "unlock.rune.adverbs",
    "unlockTextKo": "처음부터",
    "firstRuneBasicPoolEligible": true,
    "runtimeReady": true,
    "color": "#83c5a2"
  },
  {
    "id": "rune.polished",
    "nameKo": "철 룬",
    "group": "CARD",
    "rarity": "COMMON",
    "conditionDescriptionKo": "연마 단계가 1 이상인 사용 카드 각각; 같은 카드는 단계 수와 무관하게 한 번",
    "operation": "ADD_SCORE",
    "levelValues": [
      5,
      8,
      12
    ],
    "scope": "PER_POLISHED_CARD",
    "maxMatchesPerAttack": null,
    "displayEffectSummaryKo": "연마 카드별 덧셈",
    "unlockRuleId": "unlock.rune.polished",
    "unlockTextKo": "처음부터",
    "firstRuneBasicPoolEligible": true,
    "runtimeReady": true,
    "color": "#adb4c2"
  },
  {
    "id": "rune.openingHand",
    "nameKo": "금빛 룬",
    "group": "UTILITY",
    "rarity": "COMMON",
    "conditionDescriptionKo": "전투 시작 손패에만 적용",
    "operation": "ADD_INITIAL_HAND",
    "levelValues": [
      2,
      3,
      4
    ],
    "scope": "AT_BATTLE_RULES_SNAPSHOT",
    "maxMatchesPerAttack": null,
    "displayEffectSummaryKo": "시작 손패",
    "unlockRuleId": "unlock.rune.openingHand",
    "unlockTextKo": "처음부터",
    "firstRuneBasicPoolEligible": true,
    "runtimeReady": true,
    "color": "#f3d779"
  },
  {
    "id": "rune.handSize",
    "nameKo": "옥 룬",
    "group": "UTILITY",
    "rarity": "COMMON",
    "conditionDescriptionKo": "손패 한도에 적용",
    "operation": "ADD_HAND_LIMIT",
    "levelValues": [
      2,
      3,
      4
    ],
    "scope": "AT_BATTLE_RULES_SNAPSHOT",
    "maxMatchesPerAttack": null,
    "displayEffectSummaryKo": "손패 한도",
    "unlockRuleId": "unlock.rune.handSize",
    "unlockTextKo": "처음부터",
    "firstRuneBasicPoolEligible": true,
    "runtimeReady": true,
    "color": "#9cce8c"
  },
  {
    "id": "rune.discards",
    "nameKo": "구리 룬",
    "group": "UTILITY",
    "rarity": "UNCOMMON",
    "conditionDescriptionKo": "전투당 교환 행동 횟수에 적용",
    "operation": "ADD_DISCARD_ACTIONS",
    "levelValues": [
      1,
      2,
      3
    ],
    "scope": "AT_BATTLE_RULES_SNAPSHOT",
    "maxMatchesPerAttack": null,
    "displayEffectSummaryKo": "교환 횟수",
    "unlockRuleId": "unlock.rune.discards",
    "unlockTextKo": "처음부터",
    "firstRuneBasicPoolEligible": true,
    "runtimeReady": true,
    "color": "#d7976b"
  },
  {
    id:'rune.svoo',nameKo:'토파즈 룬',group:'GRAMMAR',rarity:'UNCOMMON',
    conditionDescriptionKo:'주절이 4형식',operation:'MULTIPLY_SCORE',
    levelValues:[{num:3,den:2},{num:2,den:1},{num:5,den:2}],
    scope:'ONCE_PER_ATTACK',maxMatchesPerAttack:null,displayEffectSummaryKo:'주절 4형식',
    unlockRuleId:'unlock.rune.svoo',unlockTextKo:'시작의 초원 완료',firstRuneBasicPoolEligible:false,runtimeReady:true,color:'#edac38',
  }
]);
const frameValues=[{num:8,den:5},{num:11,den:5},{num:14,den:5}];
export const RUNES=deepFreeze([...LEGACY_RUNES.map(r=>({...r,levelValues:['rune.sv','rune.svc','rune.svo'].includes(r.id)?frameValues:r.id==='rune.svoo'?[{num:17,den:10},{num:12,den:5},{num:16,den:5}]:r.id==='rune.short'?[{num:7,den:5},{num:9,den:5},{num:12,den:5}]:r.levelValues})),
 {id:'rune.longSentence',nameKo:'운석 룬',group:'GRAMMAR',rarity:'UNCOMMON',conditionDescriptionKo:'문장에 기여한 실제 카드 5~9장 / 10~16장',operation:'MULTIPLY_SCORE',levelValues:[{short:{num:2,den:1},long:{num:3,den:1}},{short:{num:9,den:4},long:{num:7,den:2}},{short:{num:5,den:2},long:{num:4,den:1}}],scope:'ONCE_PER_ATTACK',maxMatchesPerAttack:1,displayEffectSummaryKo:'유효 카드 5~9장 / 10~16장',unlockRuleId:'unlock.rune.longSentence',unlockTextKo:'처음부터',firstRuneBasicPoolEligible:false,runtimeReady:true,color:'#c3a2f2',introducedVersion:'0.3.0'}]);
export const runesForVersion=version=>['0.3.0','0.4.0'].includes(version)?RUNES:LEGACY_RUNES;
export const runeForVersion=(id,version)=>runesForVersion(version).find(r=>r.id===id)??null;
export const RUNE_BY_ID = Object.freeze(Object.fromEntries(RUNES.map(rune => [rune.id, rune])));
export const ACTIVE_RUNE_IDS = Object.freeze(RUNES.map(rune => rune.id));
export const RUNE_SLOT_LIMIT = 3;
export const RUNE_MAX_LEVEL = 3;
export const RUNE_VERSION = "runes.0.2.0";
export function getRuneDefinition(id) { return RUNE_BY_ID[id] ?? null; }
export const BASIC_RUNE_IDS=Object.freeze(RUNES.filter(r=>r.firstRuneBasicPoolEligible).map(r=>r.id));
/** Eligibility is frozen into this run; later profile unlocks do not rewrite its pools. */
export function eligibleRuneDefinitions(run) {
 const unlocked=new Set([...(run?.eligibility?.runStartUnlockBaseline??[]),...(run?.eligibility?.runOwnUnlocks??[])]);
 return runesForVersion(run?.version).filter(r=>r.runtimeReady&&(r.id!=='rune.svoo'||['0.2.0','0.2.1','0.2.2','0.3.0','0.4.0'].includes(run?.version)&&unlocked.has(r.id)));
}
