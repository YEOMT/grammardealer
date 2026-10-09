// Implemented v0.1 values from the supplied handoff. Future systems remain metadata only.
const deepFreeze = (value) => { Object.values(value).forEach((item) => { if (item && typeof item === "object") deepFreeze(item); }); return Object.freeze(value); };
export const BALANCE = deepFreeze({
  "specVersion": "harbor-0.2.0",
  "gameVersionTarget": "0.2.0",
  "combat": {
    "startingDeckSize": 28,
    "initialHand": 6,
    "handLimit": 10,
    "turnDraw": 3,
    "discardActions": 4,
    "turnLimit": 6,
    "sentenceLimit": 16,
    "drawOnFirstTurnBeyondOpening": false,
    "discardConsumesTurn": false,
    "exchangeScope": "HAND_ONLY",
    "drawClipping": "NO_DEFERRED_DRAW_CREDIT",
    "discardRecycle": "MAY_INCLUDE_JUST_DISCARDED",
    "winBeforeTurnExhaustion": true
  },
  "starter": {
    "slotCounts": {
      "NOUN": 6,
      "PRONOUN": 4,
      "VERB": 8,
      "ADJECTIVE": 3,
      "ADVERB": 2,
      "DETERMINER": 3,
      "PREPOSITION": 2
    },
    "pronouns": ["I", "you", "they"],
    "thirdPersonPronounChoices": ["he", "she"],
    "determiners": {
      "a": 2,
      "the": 1
    },
    "verbRoleSlots": {
      "beCopies": 2,
      "SV": 2,
      "SVO": 3,
      "MULTIFRAME_WITH_ACTIVE_SIMPLE_FRAME": 1
    },
    "prepChoices": [
      "in",
      "on",
      "at",
      "with"
    ],
    "nounDistinctMin": 4,
    "adjectiveDistinctMin": 3,
    "totalDistinctMin": 20,
    "maxCopiesNonFixed": 2,
    "requireBeAtLeast": 2,
    "openingPolicy": "SEEDED_WITNESS_SUBSET_THEN_RANDOM_FILL",
    "eligibleOpeningFrames": [
      "frame.sv",
      "frame.svc.adj",
      "frame.svc.np",
      "frame.svo"
    ],
    "repairAttemptLimit": 32,
    "fallback": "VALIDATED_DATA_FALLBACK_WITH_GENERATION_TRACE"
  },
  "vocabulary": {
    "modes": [
      "BEGINNER",
      "STANDARD",
      "ADVANCED",
      "FREE"
    ],
    "samplingWithinEquivalentRole": {
      "BEGINNER": {
        "BEGINNER": 100,
        "STANDARD": 0,
        "ADVANCED": 0
      },
      "STANDARD": {
        "BEGINNER": 40,
        "STANDARD": 60,
        "ADVANCED": 0
      },
      "ADVANCED": {
        "BEGINNER": 20,
        "STANDARD": 30,
        "ADVANCED": 50
      },
      "FREE": {
        "BEGINNER": 1,
        "STANDARD": 1,
        "ADVANCED": 1
      }
    },
    "noteKo": "수치 배분은 본 명세의 초기 구현 제안. 공통 기능어 별도. 상위난도 후보 부족 시 같은 문법역할의 낮은 어휘밴드로 fallback하며 점수는 동일. 보상은 시작밴드 제한 없음."
  },
  "score": {
    "baseCard": 10,
    "polishPerLevel": 5,
    "polishMax": 3,
    "completeBonus": 20,
    "mainFrameMultipliers": {
      "frame.sv": {
        "num": 1,
        "den": 1
      },
      "frame.svc.adj": {
        "num": 6,
        "den": 5
      },
      "frame.svc.np": {
        "num": 6,
        "den": 5
      },
      "frame.svo": {
        "num": 3,
        "den": 2
      },
      "frame.svoo": {
        "num": 2,
        "den": 1
      }
    },
    "modifierAdds": {
      "PRENOMINAL_ADJECTIVE": 5,
      "VALID_ADVERB_CARD": 5,
      "PP": 10
    },
    "issuePenalties": {
      "SUBJECT_VERB_AGREEMENT": 10,
      "BE_FORM_REQUIRED": 10,
      "DETERMINER_REQUIRED": 5,
      "ARTICLE_FORM": 5,
      "DETERMINER_NUMBER_AGREEMENT": 5,
      "ARTICLE_COUNTABILITY_MISMATCH": 5,
      "PRONOUN_CASE": 10
    },
    "regionMultiplier": {
      "num": 5,
      "den": 4
    },
    "regionOncePerAttack": true,
    "rounding": "FLOOR_AFTER_EACH_MULTIPLICATION",
    "zeroFloorAfterBasePenalties": true,
    "orphanModifierPolicy": "SCORE_ZERO_FOR_UNLICENSED_CARD; ONE_CAUSE_NO_DUPLICATE_FIXED_FINE",
    "pipeline": [
      "CARD_BASE_INCLUDING_POLISH",
      "ACCURACY_DEDUCTIONS_AND_EXCLUSIONS",
      "COMPLETE_BONUS_IF_NO_ISSUES",
      "MAIN_FRAME",
      "CONSTRUCTIONS",
      "SIMPLE_MODIFIERS",
      "SPECIAL_ENHANCEMENTS",
      "RUNES_SLOT_ORDER",
      "REGION_ONCE",
      "BOSS",
      "FINAL_POWER"
    ]
  },
  "reward": {
    "normal": {
      "CARD_COMMON": 50,
      "CARD_UNCOMMON": 10,
      "CARD_RARE": 5,
      "CARD_ENHANCE": 15,
      "CARD_REMOVE": 10,
      "RUNE": 10
    },
    "regionalBoss": {
      "CARD_COMMON": 0,
      "CARD_UNCOMMON": 10,
      "CARD_RARE": 10,
      "CARD_ENHANCE": 25,
      "CARD_REMOVE": 5,
      "RUNE": 50
    },
    "choiceCountMax": 3,
    "sameRarityAcrossCardOffer": false,
    "roleSlots": [
      "LOCAL_SYNTAX_RELEVANT",
      "GENERAL",
      "IMPLEMENTED_POOL_WILDCARD"
    ],
    "firstEverR1Override": "CARD_COMMON",
    "everyRunR2Override": "RUNE",
    "firstEverR2Fixed": [
      "rune.perfectSentence",
      "rune.short",
      "rune.discards"
    ],
    "laterR2Slots": [
      "BASIC",
      "BASIC",
      "UNLOCKED_IMPLEMENTED_ALL"
    ],
    "runeWeights": {
      "COMMON": 60,
      "UNCOMMON": 30,
      "RARE": 10
    },
    "emptyRarityPolicy": "NO_SILENT_REWEIGHT_FOR_WORD_CARD_OFFERS; VALID_CANDIDATES_OR_EXPLICIT_SKIP_GOLD",
    "cardEnhanceV0_1": "POLISH_ONE_LEVEL_ONLY"
  },
  "rune": {
    "initialSlots": 3,
    "maxLevel": 3,
    "activeIds": [
      "rune.short",
      "rune.sv",
      "rune.svc",
      "rune.svo",
      "rune.perfectSentence",
      "rune.adverbs",
      "rune.polished",
      "rune.openingHand",
      "rune.handSize",
      "rune.discards"
    ],
    "sameIdAcquisition": "LEVEL_UP",
    "sameIdMaxLevel": "EXCLUDE_FROM_NEW_OFFERS",
    "allowMultipleSameIdEquipped": false,
    "order": "TOP_TO_BOTTOM",
    "reorderAllowed": "EDIT_OR_OUTSIDE_COMBAT_ONLY",
    "reorderDoesNotRecomputeCombatUtility": true
  },
  "economy": {
    "turnBonusPerRemainingTurn": 1,
    "normalKillGold": 2,
    "regionalBossKillGold": 6,
    "skipCardGold": 3,
    "skipOtherGold": 2
  },
  "save": {
    "slotsPerLocalProfile": 3,
    "allowed": [
      "BATTLE_READY_BEFORE_FIRST_MUTATION",
      "REWARD_FROZEN",
      "BETWEEN_BATTLES",
      "CONTENT_COMPLETE"
    ],
    "midBattle": false,
    "persistRng": true,
    "persistOffers": true,
    "persistRunEligibility": true,
    "persistProfileImmediately": true,
    "profileIsNotNicknameIdentity": true
  }
});
export const COMBAT_BALANCE = BALANCE.combat;
export const SCORE_BALANCE = BALANCE.score;
export const TIME_SCORE_BALANCE=deepFreeze({...SCORE_BALANCE,completeBonus:30,
 mainFrameMultipliers:{'frame.sv':{num:13,den:10},'frame.svc.adj':{num:8,den:5},'frame.svc.np':{num:8,den:5},'frame.svo':{num:9,den:5},'frame.svoo':{num:11,den:5}},
 issuePenalties:{...SCORE_BALANCE.issuePenalties,AUXILIARY_FORM_REQUIRED:10},
 temporalMultipliers:{'TIME.PAST':{num:6,den:5},'TIME.PROGRESSIVE':{num:13,den:10},'TIME.PERFECT':{num:7,den:5},'TIME.FUTURE_WILL':{num:6,den:5}},
});
export const SKY_SCORE_BALANCE=deepFreeze({...TIME_SCORE_BALANCE,issuePenalties:{...TIME_SCORE_BALANCE.issuePenalties,ASPECT_USAGE:10},clauseLinkMultiplier:{num:8,den:5},phraseLinkAdd:10});
export const DESERT_SCORE_BALANCE=deepFreeze({...SKY_SCORE_BALANCE,
 mainFrameMultipliers:{...SKY_SCORE_BALANCE.mainFrameMultipliers,'frame.svoc':{num:5,den:2}},
 nonfiniteMultipliers:{'CLAUSE.INFINITIVE':{num:7,den:5},'CLAUSE.GERUND':{num:7,den:5}},
});
export const SNOW_SCORE_BALANCE=deepFreeze({...DESERT_SCORE_BALANCE,
 comparisonMultipliers:{'COMPARISON.COMPARATIVE':{num:9,den:5},'COMPARISON.SUPERLATIVE':{num:19,den:10},'COMPARISON.EQUALITY':{num:9,den:5}},degreeMultiplier:{num:3,den:2},comparisonMultiplierAdd:20,
 issuePenalties:{...DESERT_SCORE_BALANCE.issuePenalties,COMPARISON_FORM_MISMATCH:10,DOUBLE_COMPARISON_MARKING:10,AS_REQUIRES_POSITIVE_DEGREE:10,SUPERLATIVE_FORM_OR_DETERMINER:10,COMPARISON_STANDARD_REQUIRED:10},
});
export const EMBER_SCORE_BALANCE=deepFreeze({...SNOW_SCORE_BALANCE,passiveMultiplier:{num:9,den:5}});
export const scoreBalanceForVersion=version=>version==='0.7.0'?EMBER_SCORE_BALANCE:['0.6.0','0.6.1'].includes(version)?SNOW_SCORE_BALANCE:['0.5.0','0.5.1'].includes(version)?DESERT_SCORE_BALANCE:version==='0.4.0'?SKY_SCORE_BALANCE:version==='0.3.0'?TIME_SCORE_BALANCE:SCORE_BALANCE;
export const REWARD_BALANCE = BALANCE.reward;
export const ECONOMY = BALANCE.economy;
