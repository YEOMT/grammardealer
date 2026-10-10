import {resolveDualRelativeSeal} from './dualRelativeSeal.js';
import {emberScaleEvent} from './emberScaleShield.js';
import {skyShieldEvent} from './skyShield.js';
import {resolveFrostCrystalLock} from './frostCrystalLock.js';
import { SCORE_BALANCE, ECONOMY, scoreBalanceForVersion } from '../data/balance.js';
import {resolveTimeGolem} from './timeGolem.js';
import { STAGE1, STAGE_BY_ID, STAGE_VERSION } from '../data/stages.js';
import { RUNE_VERSION } from '../data/runes.js';
import { safeInteger, scoreEvent } from './numeric.js';
import { scoreAttack, attackableAnalysis, mainFrameHit, validateCardScoringSnapshot, BALANCE_VERSION } from './scoring.js';
import { applyRunes } from './runes.js';
import { scoreableAnalysis } from './comboEligibility.js';

/** Pure region / encounter result. Returns boss proposals; only the controller commits them. */
export function resolveEncounter(analysis, postRuneScore, enemy, {
  attackId = 'attack.sandbox', eventOffset = 0, stage = STAGE1, syntheticBossFixture = null, originalAnalysis=analysis,submittedCards=[],temporaryCardMeta={},
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
  const timeHits=stage.id==='stage.03'?(analysis.grammarHits??[]).filter(h=>h.tag.startsWith('TIME.')):[];
  const linkHits=stage.id==='stage.04'?(analysis.grammarHits??[]).filter(h=>h.tag==='LINK.CLAUSE'):[];
  const nonfiniteHits=stage.id==='stage.05'?(analysis.grammarHits??[]).filter(h=>['CLAUSE.INFINITIVE','CLAUSE.GERUND'].includes(h.tag)&&h.validity==='VALID'&&h.bonusEligible!==false):[];
  if(stage.id==='stage.08'){const evidence=(analysis.grammarHits??[]).filter(h=>h.tag.startsWith('CLAUSE.RELATIVE.')&&h.validity==='VALID'&&h.bonusEligible!==false);if(evidence.length)emit({phase:'REGION',sourceType:'STAGE',sourceId:stage.id,labelKo:stage.regionLabelKo,operation:'MULTIPLY',operand:stage.regionMultiplier,evidenceRefs:evidence.map(h=>h.id),highlightCardIds:[...new Set(evidence.flatMap(h=>h.cardIds))]});}
  if(stage.id==='stage.07'){
    const evidence=(analysis.grammarHits??[]).filter(h=>(h.tag==='VOICE.PASSIVE'||h.tag.startsWith('PARTICIPLE.')&&['NOUN_MODIFIER','OBJECT_COMPLEMENT'].includes(h.function)||h.tag.startsWith('CONSTRUCTION.'))&&h.validity==='VALID'&&h.bonusEligible!==false);
    if(evidence.length)emit({phase:'REGION',sourceType:'STAGE',sourceId:stage.id,labelKo:stage.regionLabelKo,operation:'MULTIPLY',operand:stage.regionMultiplier,evidenceRefs:evidence.map(h=>h.id),highlightCardIds:[...new Set(evidence.flatMap(h=>h.cardIds))]});
  }
  if(stage.id==='stage.06'){
    const snowHits=(analysis.grammarHits??[]).filter(h=>/^(COMPARISON\.(COMPARATIVE|SUPERLATIVE|EQUALITY)|DEGREE\.(TOO|ENOUGH))$/.test(h.tag)&&h.validity==='VALID'&&h.bonusEligible!==false);
    if(snowHits.length)emit({phase:'REGION',sourceType:'STAGE',sourceId:stage.id,labelKo:stage.regionLabelKo,operation:'MULTIPLY',operand:stage.regionMultiplier,evidenceRefs:snowHits.map(h=>h.id),highlightCardIds:[...new Set(snowHits.flatMap(h=>h.cardIds))]});
  }
  if (nonfiniteHits.length)emit({phase:'REGION',sourceType:'STAGE',sourceId:stage.id,labelKo:stage.regionLabelKo,operation:'MULTIPLY',operand:stage.regionMultiplier,evidenceRefs:nonfiniteHits.map(h=>h.id),highlightCardIds:[...new Set(nonfiniteHits.flatMap(h=>h.cardIds))]});
  else if (linkHits.length||timeHits.length||frameHit && stage.focusFrames.includes(frameId)) emit({ phase: 'REGION', sourceType: 'STAGE', sourceId: stage.id, labelKo: stage.regionLabelKo,
    operation: 'MULTIPLY', operand: stage.regionMultiplier ?? SCORE_BALANCE.regionMultiplier, evidenceRefs: linkHits.length?linkHits.map(h=>h.id):timeHits.length?timeHits.map(h=>h.id):[frameHit.id], highlightCardIds: linkHits.length?[...new Set(linkHits.flatMap(h=>h.cardIds))]:timeHits.length?[...new Set(timeHits.flatMap(h=>h.cardIds))]:frameHit.cardIds });
  const postRegionScore = score;
  const bossEffects = [];
  const bossStateBefore = enemy.bossMechanic ? structuredClone(enemy.bossMechanic) : null;
  let bossStateAfter = bossStateBefore ? structuredClone(bossStateBefore) : null;
  const golem=bossStateBefore?.id==='TIME_GOLEM'?resolveTimeGolem(originalAnalysis,score,enemy):null;
  if(golem){
    bossStateAfter=golem.bossStateAfter;
    const sourceId=golem.blocked?'boss.timeGolem.block':golem.phaseBreak?'boss.timeGolem.break':'boss.timeGolem.hit';
    bossEffects.push({id:sourceId,synthetic:false,preBossScore:score,...golem});
    emit({phase:'BOSS',sourceType:'BOSS',sourceId,labelKo:golem.labelKo,operation:'SET',operand:golem.blocked?0:score,evidenceRefs:golem.evidenceRefs,highlightCardIds:golem.highlightCardIds,bossStateBefore,bossStateAfter});
  }
  if (stage.id === 'stage.02' && enemy.kind === 'REGIONAL_BOSS' && bossStateBefore?.id === 'SVOO_VEIL' && bossStateBefore.active) {
    const rawClause=originalAnalysis.clauses?.find(c=>c.id===originalAnalysis.mainClauseId);
    const rawHit=mainFrameHit(originalAnalysis);
    const veilHit=['0.6.1','0.7.0','0.8.0'].includes(originalAnalysis.grammarVersion)?rawHit:frameHit;
    const releases = ['0.6.1','0.7.0','0.8.0'].includes(originalAnalysis.grammarVersion)?Boolean(rawHit?.frameId==='frame.svoo'&&rawClause?.frameId==='frame.svoo'&&rawClause.subjectNodeId&&rawClause.verbCardId&&rawClause.indirectObjectNodeId&&rawClause.directObjectNodeId):frameHit && frameId === 'frame.svoo';
    if (releases) bossStateAfter.active = false;
    const sourceId = releases ? 'boss.svooVeil.release' : 'boss.svooVeil.reduce';
    const labelKo = releases ? '4형식 적중 · 보호 장막 해제' : '보호 장막 · 피해 ×0.25';
    bossEffects.push({ id: sourceId, synthetic: false, labelKo, preBossScore: score, bossStateBefore, bossStateAfter });
    emit({ phase: 'BOSS', sourceType: 'BOSS', sourceId, labelKo,
      operation: releases ? 'SET' : 'MULTIPLY', operand: releases ? score : { num: 1, den: 4 },
      evidenceRefs: releases ? [veilHit.id] : [], highlightCardIds: releases ? veilHit.cardIds : [], bossStateBefore, bossStateAfter });
  }
  if(stage.id==='stage.04'&&bossStateBefore?.id==='CLAUSE_LINK_SHIELD'&&bossStateBefore.active){const event=skyShieldEvent(originalAnalysis,score,bossStateBefore);bossStateAfter=event.bossStateAfter;bossEffects.push({id:event.sourceId,synthetic:false,labelKo:event.labelKo,preBossScore:score,bossStateBefore,bossStateAfter});emit(event);}
  if(stage.id==='stage.07'&&bossStateBefore?.id==='EMBER_SCALE_SHIELD'&&bossStateBefore.active){const event=emberScaleEvent(originalAnalysis,score,bossStateBefore,{attackId,submittedCards});bossStateAfter=event.bossStateAfter;bossEffects.push({id:event.sourceId,synthetic:false,labelKo:event.labelKo,preBossScore:score,bossStateBefore,bossStateAfter});emit(event);}
  // Explicit test-only argument, never read from an enemy object or normal stage data.
  if (syntheticBossFixture !== null) {
    if (syntheticBossFixture !== 'IMMUNE_ZERO_DAMAGE_TEST_ONLY') throw new TypeError('Unknown synthetic encounter fixture');
    bossEffects.push({ id: 'fixture.immune', synthetic: true, labelKo: '합성 면역 테스트 · 실제 보스 아님', preBossScore: score });
    emit({ phase: 'BOSS', sourceType: 'SYNTHETIC_FIXTURE', sourceId: 'fixture.immune', labelKo: '합성 장막 · 피해 0', operation: 'SET', operand: 0 });
  }
  const frost=bossStateBefore?.id==='FROST_CRYSTAL_LOCK'?resolveFrostCrystalLock(originalAnalysis,score,enemy,{attackId,submittedCards,temporaryCardMeta}):null;
  if(frost){bossStateAfter=frost.bossStateAfter;const labelKo=frost.brokenCrystalCount?`빙결핵 ${frost.brokenCrystalCount}개 파괴 · ${bossStateAfter.crystalsRemaining}개 남음`:bossStateAfter.crystalsRemaining?'빙결핵 · 체력 1 보호':'빙결핵 모두 파괴';bossEffects.push({id:'boss.frostCrystalLock',synthetic:false,labelKo,...frost});emit({phase:'BOSS',sourceType:'BOSS',sourceId:'boss.frostCrystalLock',labelKo,operation:'SET',operand:score,evidenceRefs:frost.eligibleFrostCardIds,highlightCardIds:frost.eligibleFrostCardIds,bossStateBefore,bossStateAfter});}
  const seal=bossStateBefore?.id==='DUAL_RELATIVE_SEAL'?resolveDualRelativeSeal(originalAnalysis,score,enemy,{attackId,submittedCards}):null;
  if(seal){bossStateAfter=seal.bossStateAfter;const labelKo=seal.unlockedNow?'같은 문장의 두 관계절 · 이중 연결 인장 해제':bossStateAfter.unlocked?'이중 연결 인장 해제됨':'이중 연결 인장 · 체력 1 보호';bossEffects.push({id:'boss.dualRelativeSeal',synthetic:false,labelKo,...seal});emit({phase:'BOSS',sourceType:'BOSS',sourceId:'boss.dualRelativeSeal',labelKo,operation:'SET',operand:score,evidenceRefs:seal.unlockedNow?[bossStateAfter.unlockWitness.subjectRelativeId,bossStateAfter.unlockWitness.objectRelativeId]:[],highlightCardIds:seal.unlockedNow?[...new Set(originalAnalysis.relativeClauses.filter(r=>[bossStateAfter.unlockWitness.subjectRelativeId,bossStateAfter.unlockWitness.objectRelativeId].includes(r.id)).flatMap(r=>r.cardIds))]:[],bossStateBefore,bossStateAfter});}
  emit({ phase: 'FINAL_POWER', sourceType: 'SYSTEM', sourceId: 'FINAL_POWER', labelKo: '최종 공격력', operation: 'SET', operand: score });
  const finalPower = score;
  const actualHpLoss = seal?seal.actualHpLoss:frost?frost.actualHpLoss:golem?golem.actualHpLoss:Math.min(enemyHpBefore, finalPower);
  const enemyHpAfter = seal?seal.enemyHpAfter:frost?frost.enemyHpAfter:golem?golem.enemyHpAfter:Math.max(0, enemyHpBefore - finalPower);
  const overkill = seal?seal.overkill:frost?frost.overkill:golem?0:Math.max(0, finalPower - enemyHpBefore);
  return { stageVersion: STAGE_VERSION, postRegionScore, preBossScore: postRegionScore, finalPower, actualHpLoss, overkill,
    enemyHpBefore, enemyHpAfter, killed: enemyHpBefore > 0 && enemyHpAfter === 0, bossStateBefore, bossStateAfter, bossEffects, events,...(seal?{relativeSealResult:seal,preventedDamage:seal.preventedDamage}:{}),...(frost?{frostCrystalResult:frost,preventedDamage:frost.preventedDamage}:{}),...(golem?{phaseBreak:golem.phaseBreak,phaseExcess:golem.phaseExcess,phaseId:golem.phaseId}:{}) };
}

/**
 * Integrates already computed Grammar evidence. No state mutation, RNG, DOM, or network access.
 * @param {object} input Required analysis/cards/enemy plus immutable attack context.
 */
export function resolveAttack({ analysis, cards, equippedRunes = [], enemy, stage = STAGE1,
  attackId = 'attack.sandbox', runId = null, battleId = null, expectedRevision = 0,
  sentenceSnapshot = null, syntheticBossFixture = null, policyVersion = null, comboEligibility = null,temporaryCardMeta={},
}) {
  const temporary=['0.6.0','0.6.1','0.7.0','0.8.0'].includes(policyVersion)?{consumedTemporaryCardIds:cards.filter(c=>temporaryCardMeta[c.instanceId]?.battleId===battleId).map(c=>c.instanceId)}:{};
  if (['0.2.2','0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0'].includes(policyVersion) && analysis?.status === 'INVALID_CORE') {
    const cardScoringSnapshot=validateCardScoringSnapshot(cards);
    const hp=safeInteger(enemy.hp,'enemy hp',{min:0});
    return {schemaVersion:1,attackId,runId,battleId,expectedRevision,status:analysis.status,accepted:true,...temporary,
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
  const version=policyVersion==='0.5.1'?'0.5.0':policyVersion??analysis.grammarVersion;
  const scoring = scoreAttack(analysis, cardScoringSnapshot, { attackId, eligibleAnalysis,balance:scoreBalanceForVersion(version) });
  const runeResult = applyRunes(eligibleAnalysis, scoring, equippedRunes, cardScoringSnapshot, { attackId,version });
  const encounter = resolveEncounter(eligibleAnalysis, runeResult.postRuneScore, enemy, {
    attackId, eventOffset: scoring.events.length + runeResult.runeEvents.length, stage, syntheticBossFixture,originalAnalysis:analysis,submittedCards:cardScoringSnapshot,temporaryCardMeta,
  });
  return {
    schemaVersion: 1, attackId, runId, battleId, expectedRevision, status: analysis.status, accepted: true,...temporary,...(encounter.relativeSealResult?{relativeSealResult:encounter.relativeSealResult,preventedDamage:encounter.preventedDamage}:{}),...(encounter.frostCrystalResult?{frostCrystalResult:encounter.frostCrystalResult,preventedDamage:encounter.preventedDamage}:{}),
    versions: { language: sentenceSnapshot?.languageVersion ?? analysis.grammarVersion ?? '0.2.0', grammar: analysis.grammarVersion ?? '0.2.0',
      balance: version==='0.8.0'?'balance.0.8.0':version==='0.7.0'?'balance.0.7.0':['0.6.0','0.6.1','0.7.0','0.8.0'].includes(version)?'balance.0.6.0':version==='0.5.0'?'balance.0.5.0':version==='0.4.0'?'balance.0.4.0':version==='0.3.0'?'balance.0.3.0':BALANCE_VERSION, runes: ['0.6.1','0.7.0','0.8.0'].includes(version)?'runes.0.6.1':['0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0'].includes(version)?'runes.0.3.0':RUNE_VERSION, stage: version==='0.8.0'?'stage.0.8.0':version==='0.7.0'?'stage.0.7.0':['0.6.0','0.6.1','0.7.0','0.8.0'].includes(version)?'stage.0.6.0':version==='0.5.0'?'stage.0.5.0':version==='0.4.0'?'stage.0.4.0':version==='0.3.0'?'stage.0.3.0':STAGE_VERSION, presentation: version==='0.8.0'?'presentation.0.8.0':version==='0.7.0'?'presentation.0.7.0':['0.6.0','0.6.1','0.7.0','0.8.0'].includes(version)?'presentation.0.6.0':'presentation.0.2.1' },
    sentenceSnapshot, cardScoringSnapshot, runeSnapshot: runeResult.runeSnapshot, analysis, comboEligibility,
    scoreableHitIds:eligibleAnalysis.grammarHits.map(h=>h.id),
    zeroReason:encounter.relativeSealResult&&encounter.actualHpLoss===0&&encounter.finalPower>0?'BOSS_BLOCKED':encounter.finalPower===0?(encounter.bossEffects.length?'BOSS_BLOCKED':'ACCURACY_ZERO'):null,
    scoreTimeline: [...scoring.events, ...runeResult.runeEvents, ...encounter.events],
    preRuneScore: scoring.preRuneScore, postRuneScore: runeResult.postRuneScore,
    postRegionScore: encounter.postRegionScore, preBossScore: encounter.preBossScore, bossEffects: encounter.bossEffects,
    bossStateBefore: encounter.bossStateBefore, bossStateAfter: encounter.bossStateAfter,
    ...(encounter.phaseId?{phaseId:encounter.phaseId,phaseBreak:encounter.phaseBreak,phaseExcess:encounter.phaseExcess}:{}),
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
