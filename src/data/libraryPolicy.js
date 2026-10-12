import {deepFreeze} from '../contracts.js';
// User-confirmed 0.9 values, never applied retroactively to a saved campaign.
export const LIBRARY_CONFIRMED=deepFreeze({bossHp:3000,healPerTurnEnd:1000,bossSupportCount:0,
 existingBossHp:[400,800,840,1200,1300,1600,1900,2200],golemPhaseHp:280,
 runeRarityWeights:{COMMON:194,UNCOMMON:97,RARE:9},
 wordRarity:{have:'RARE',that:'RARE',to:'UNCOMMON',make:'UNCOMMON',help:'UNCOMMON',be:'UNCOMMON',want:'UNCOMMON'}});
// Specification's provisional tuning, not user-confirmed balance or difficulty results.
export const LIBRARY_INITIAL=deepFreeze({normalHp:[1700,1800,1900,2000],newWordRarity:'UNCOMMON',regionMultiplier:{num:5,den:4},
 frost:[{always:['what']},{always:['where','when']},{always:['whether']},{ifMissing:['that','it','to']}]});
export const LIBRARY_REWARD_PACK='pack.libraryWords.reward';
export const LIBRARY_ENTRY_NOTICE='일반전에서는 목표 문법의 빙정 카드를 제공합니다. 도서관장전에는 제공되지 않으니, 카드 보상으로 덱을 준비하세요.';
