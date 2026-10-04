import { SCORE_BALANCE, ECONOMY } from '../data/balance.js';
import { STAGE1, STAGE_VERSION } from '../data/stage1.js';
import { RUNE_VERSION } from '../data/runes.js';
import { safeInteger, scoreEvent } from './numeric.js';
import { scoreAttack, attackableAnalysis, mainFrameHit, validateCardScoringSnapshot, BALANCE_VERSION } from './scoring.js';
import { applyRunes } from './runes.js';

/** Pure region / encounter result. Stage 1 has no shield, immunity, or hidden HP scaling. */
export function resolveEncounter(analysis, postRuneScore, enemy, {
  attackId = 'attack.sandbox', eventOffset = 0, stage = STAGE1, syntheticBossFixture = null,
} = {}) {
  if (!attackableAnalysis(analysis)) throw new TypeError('A valid analysis is required for encounter resolution');
  if (!enemy || stage?.id !== STAGE1.id) throw new TypeError('Only Stage 1 is playable');
  const enemyHpBefore = safeInteger(enemy.hp, 'enemy hp', { min: 0 });
  let score = safeInteger(postRuneScore, 'postRuneScore', { min: 0 });
  const events = [];
  const emit = (details) => {
    const event = scoreEvent({ attackId, index: eventOffset + events.length, before: score, ...details });
    events.push(event); score = event.after;
  };
  const frameHit = mainFrameHit(analysis);
  if (frameHit) emit({ phase: 'REGION', sourceType: 'STAGE', sourceId: STAGE1.id, labelKo: '시작의 초원 · 기본 문형 ×1.25',
    operation: 'MULTIPLY', operand: SCORE_BALANCE.regionMultiplier, evidenceRefs: [frameHit.id], highlightCardIds: frameHit.cardIds });
  const postRegionScore = score;
  const bossEffects = [];
  // Explicit test-only argument, never read from an enemy object or normal stage data.
  if (syntheticBossFixture !== null) {
    if (syntheticBossFixture !== 'IMMUNE_ZERO_DAMAGE_TEST_ONLY') throw new TypeError('Unknown synthetic encounter fixture');
    bossEffects.push({ id: 'fixture.immune', synthetic: true, labelKo: '합성 면역 테스트 · 실제 보스 아님', preBossScore: score });
    emit({ phase: 'BOSS', sourceType: 'SYNTHETIC_FIXTURE', sourceId: 'fixture.immune', labelKo: '합성 장막 · 피해 0', operation: 'SET', operand: 0 });
  }
  emit({ phase: 'FINAL_POWER', sourceType: 'SYSTEM', sourceId: 'FINAL_POWER', labelKo: '최종 공격력', operation: 'SET', operand: score });
  const finalPower = score;
  const actualHpLoss = Math.min(enemyHpBefore, finalPower);
  const enemyHpAfter = Math.max(0, enemyHpBefore - finalPower);
  const overkill = Math.max(0, finalPower - enemyHpBefore);
  return { stageVersion: STAGE_VERSION, postRegionScore, preBossScore: postRegionScore, finalPower, actualHpLoss, overkill,
    enemyHpBefore, enemyHpAfter, killed: enemyHpBefore > 0 && enemyHpAfter === 0, bossEffects, events };
}

/**
 * Integrates already computed Grammar evidence. No state mutation, RNG, DOM, or network access.
 * @param {object} input Required analysis/cards/enemy plus immutable attack context.
 */
export function resolveAttack({ analysis, cards, equippedRunes = [], enemy, stage = STAGE1,
  attackId = 'attack.sandbox', runId = null, battleId = null, expectedRevision = 0,
  sentenceSnapshot = null, syntheticBossFixture = null,
}) {
  if (!attackableAnalysis(analysis)) return {
    schemaVersion: 1, attackId, runId, battleId, expectedRevision, status: analysis?.status ?? 'ENGINE_ERROR',
    analysis, sentenceSnapshot, accepted: false, scoreTimeline: [], preRuneScore: 0, postRuneScore: 0, postRegionScore: 0,
    finalPower: 0, actualHpLoss: 0, overkill: 0, killed: false, proposedStateEffects: { consumeTurn: false, discardCardIds: [], killGold: 0 },
  };
  const cardScoringSnapshot = validateCardScoringSnapshot(cards);
  const scoring = scoreAttack(analysis, cardScoringSnapshot, { attackId });
  const runeResult = applyRunes(analysis, scoring, equippedRunes, cardScoringSnapshot, { attackId });
  const encounter = resolveEncounter(analysis, runeResult.postRuneScore, enemy, {
    attackId, eventOffset: scoring.events.length + runeResult.runeEvents.length, stage, syntheticBossFixture,
  });
  return {
    schemaVersion: 1, attackId, runId, battleId, expectedRevision, status: analysis.status, accepted: true,
    versions: { language: sentenceSnapshot?.languageVersion ?? 'language.0.1.0', grammar: analysis.grammarVersion ?? 'grammar.0.1.0',
      balance: BALANCE_VERSION, runes: RUNE_VERSION, stage: STAGE_VERSION, presentation: 'presentation.0.1.1' },
    sentenceSnapshot, cardScoringSnapshot, runeSnapshot: runeResult.runeSnapshot, analysis,
    scoreTimeline: [...scoring.events, ...runeResult.runeEvents, ...encounter.events],
    preRuneScore: scoring.preRuneScore, postRuneScore: runeResult.postRuneScore,
    postRegionScore: encounter.postRegionScore, preBossScore: encounter.preBossScore, bossEffects: encounter.bossEffects,
    finalPower: encounter.finalPower, actualHpLoss: encounter.actualHpLoss, overkill: encounter.overkill,
    enemyHpBefore: encounter.enemyHpBefore, enemyHpAfter: encounter.enemyHpAfter, killed: encounter.killed,
    proposedStateEffects: {
      consumeTurn: true, discardCardIds: cardScoringSnapshot.map((card) => card.instanceId),
      killGold: encounter.killed ? (enemy.kind === 'REGIONAL_BOSS' ? ECONOMY.regionalBossKillGold : ECONOMY.normalKillGold) : 0,
    },
    visualBasis: { intensityBaseline: safeInteger(enemy.hpMax ?? enemy.maxHp ?? enemy.hp, 'enemy visual baseline', { min: 0 }),
      enemyBefore: { ...enemy, hp: encounter.enemyHpBefore }, enemyAfter: { ...enemy, hp: encounter.enemyHpAfter },
      synthetic: syntheticBossFixture !== null },
  };
}
