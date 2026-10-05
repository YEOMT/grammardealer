import { SCORE_BALANCE, ECONOMY } from '../data/balance.js';
import { STAGE1, STAGE_BY_ID, STAGE_VERSION } from '../data/stages.js';
import { RUNE_VERSION } from '../data/runes.js';
import { safeInteger, scoreEvent } from './numeric.js';
import { scoreAttack, attackableAnalysis, mainFrameHit, validateCardScoringSnapshot, BALANCE_VERSION } from './scoring.js';
import { applyRunes } from './runes.js';
import { scoreableAnalysis } from './comboEligibility.js';

/** Pure region / encounter result. Returns boss proposals; only the controller commits them. */
export function resolveEncounter(analysis, postRuneScore, enemy, {
  attackId = 'attack.sandbox', eventOffset = 0, stage = STAGE1, syntheticBossFixture = null,
} = {}) {
  if (!attackableAnalysis(analysis)) throw new TypeError('A valid analysis is required for encounter resolution');
  if (!enemy || !STAGE_BY_ID[stage?.id]) throw new TypeError('An implemented stage is required');
  const enemyHpBefore = safeInteger(enemy.hp, 'enemy hp', { min: 0 });
  let score = safeInteger(postRuneScore, 'postRuneScore', { min: 0 });
  const events = [];
  const emit = (details) => {
    const event = scoreEvent({ attackId, index: eventOffset + events.length, before: score, ...details });
    events.push(event); score = event.after;
  };
  const frameHit = mainFrameHit(analysis);
  const frameId = analysis.mainFrameId ?? frameHit?.frameId;
  if (frameHit && stage.focusFrames.includes(frameId)) emit({ phase: 'REGION', sourceType: 'STAGE', sourceId: stage.id, labelKo: stage.regionLabelKo,
    operation: 'MULTIPLY', operand: stage.regionMultiplier ?? SCORE_BALANCE.regionMultiplier, evidenceRefs: [frameHit.id], highlightCardIds: frameHit.cardIds });
  const postRegionScore = score;
  const bossEffects = [];
  const bossStateBefore = enemy.bossMechanic ? structuredClone(enemy.bossMechanic) : null;
  const bossStateAfter = bossStateBefore ? structuredClone(bossStateBefore) : null;
  if (stage.id === 'stage.02' && enemy.kind === 'REGIONAL_BOSS' && bossStateBefore?.id === 'SVOO_VEIL' && bossStateBefore.active) {
    const releases = frameHit && frameId === 'frame.svoo';
    if (releases) bossStateAfter.active = false;
    const sourceId = releases ? 'boss.svooVeil.release' : 'boss.svooVeil.reduce';
    const labelKo = releases ? '4형식 적중 · 보호 장막 해제' : '보호 장막 · 피해 ×0.25';
    bossEffects.push({ id: sourceId, synthetic: false, labelKo, preBossScore: score, bossStateBefore, bossStateAfter });
    emit({ phase: 'BOSS', sourceType: 'BOSS', sourceId, labelKo,
      operation: releases ? 'SET' : 'MULTIPLY', operand: releases ? score : { num: 1, den: 4 },
      evidenceRefs: releases ? [frameHit.id] : [], highlightCardIds: releases ? frameHit.cardIds : [], bossStateBefore, bossStateAfter });
  }
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
    enemyHpBefore, enemyHpAfter, killed: enemyHpBefore > 0 && enemyHpAfter === 0, bossStateBefore, bossStateAfter, bossEffects, events };
}

/**
 * Integrates already computed Grammar evidence. No state mutation, RNG, DOM, or network access.
 * @param {object} input Required analysis/cards/enemy plus immutable attack context.
 */
export function resolveAttack({ analysis, cards, equippedRunes = [], enemy, stage = STAGE1,
  attackId = 'attack.sandbox', runId = null, battleId = null, expectedRevision = 0,
  sentenceSnapshot = null, syntheticBossFixture = null, policyVersion = null, comboEligibility = null,
}) {
  if (policyVersion === '0.2.2' && analysis?.status === 'INVALID_CORE') {
    const cardScoringSnapshot=validateCardScoringSnapshot(cards);
    const hp=safeInteger(enemy.hp,'enemy hp',{min:0});
    return {schemaVersion:1,attackId,runId,battleId,expectedRevision,status:analysis.status,accepted:true,
      sentenceSnapshot,analysis,cardScoringSnapshot,runeSnapshot:[],comboEligibility,scoreableHitIds:[],
      versions:{grammar:analysis.grammarVersion,language:sentenceSnapshot.languageVersion,submission:policyVersion},
      scoreTimeline:[],preRuneScore:0,postRuneScore:0,postRegionScore:0,preBossScore:0,finalPower:0,actualHpLoss:0,overkill:0,
      enemyHpBefore:hp,enemyHpAfter:hp,killed:false,bossEffects:[],zeroReason:'INCOMPLETE_SENTENCE',
      feedbackKo:'문장을 완성하지 못하면 데미지를 줄 수 없습니다.\n주어와 동사의 위치를 다시 확인해 보세요.',
      proposedStateEffects:{consumeTurn:true,discardCardIds:cardScoringSnapshot.map(c=>c.instanceId),killGold:0},
      visualBasis:{intensityBaseline:enemy.maxHp??hp,enemyBefore:structuredClone(enemy),enemyAfter:structuredClone(enemy),synthetic:false}};
  }
  if (!attackableAnalysis(analysis)) return {
    schemaVersion: 1, attackId, runId, battleId, expectedRevision, status: analysis?.status ?? 'ENGINE_ERROR',
    analysis, sentenceSnapshot, accepted: false, scoreTimeline: [], preRuneScore: 0, postRuneScore: 0, postRegionScore: 0,
    finalPower: 0, actualHpLoss: 0, overkill: 0, killed: false, proposedStateEffects: { consumeTurn: false, discardCardIds: [], killGold: 0 },
  };
  const cardScoringSnapshot = validateCardScoringSnapshot(cards);
  const eligibleAnalysis=scoreableAnalysis(analysis,comboEligibility);
  const scoring = scoreAttack(analysis, cardScoringSnapshot, { attackId, eligibleAnalysis });
  const runeResult = applyRunes(eligibleAnalysis, scoring, equippedRunes, cardScoringSnapshot, { attackId });
  const encounter = resolveEncounter(eligibleAnalysis, runeResult.postRuneScore, enemy, {
    attackId, eventOffset: scoring.events.length + runeResult.runeEvents.length, stage, syntheticBossFixture,
  });
  return {
    schemaVersion: 1, attackId, runId, battleId, expectedRevision, status: analysis.status, accepted: true,
    versions: { language: sentenceSnapshot?.languageVersion ?? analysis.grammarVersion ?? '0.2.0', grammar: analysis.grammarVersion ?? '0.2.0',
      balance: BALANCE_VERSION, runes: RUNE_VERSION, stage: STAGE_VERSION, presentation: 'presentation.0.2.1' },
    sentenceSnapshot, cardScoringSnapshot, runeSnapshot: runeResult.runeSnapshot, analysis, comboEligibility,
    scoreableHitIds:eligibleAnalysis.grammarHits.map(h=>h.id),
    zeroReason:encounter.finalPower===0?(encounter.bossEffects.length?'BOSS_BLOCKED':'ACCURACY_ZERO'):null,
    scoreTimeline: [...scoring.events, ...runeResult.runeEvents, ...encounter.events],
    preRuneScore: scoring.preRuneScore, postRuneScore: runeResult.postRuneScore,
    postRegionScore: encounter.postRegionScore, preBossScore: encounter.preBossScore, bossEffects: encounter.bossEffects,
    bossStateBefore: encounter.bossStateBefore, bossStateAfter: encounter.bossStateAfter,
    finalPower: encounter.finalPower, actualHpLoss: encounter.actualHpLoss, overkill: encounter.overkill,
    enemyHpBefore: encounter.enemyHpBefore, enemyHpAfter: encounter.enemyHpAfter, killed: encounter.killed,
    proposedStateEffects: {
      consumeTurn: true, discardCardIds: cardScoringSnapshot.map((card) => card.instanceId),
      killGold: encounter.killed ? (enemy.kind === 'REGIONAL_BOSS' ? ECONOMY.regionalBossKillGold : ECONOMY.normalKillGold) : 0,
      ...(encounter.bossStateAfter ? { bossMechanic: encounter.bossStateAfter } : {}),
    },
    visualBasis: { intensityBaseline: safeInteger(enemy.hpMax ?? enemy.maxHp ?? enemy.hp, 'enemy visual baseline', { min: 0 }),
      enemyBefore: { ...enemy, hp: encounter.enemyHpBefore, ...(encounter.bossStateBefore ? { bossMechanic: encounter.bossStateBefore } : {}) },
      enemyAfter: { ...enemy, hp: encounter.enemyHpAfter, ...(encounter.bossStateAfter ? { bossMechanic: encounter.bossStateAfter } : {}) },
      synthetic: syntheticBossFixture !== null },
  };
}
