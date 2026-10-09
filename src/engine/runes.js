import { COMBAT_BALANCE } from '../data/balance.js';
import { RUNE_BY_ID, runeForVersion, RUNE_MAX_LEVEL, RUNE_SLOT_LIMIT, RUNE_VERSION } from '../data/runes.js';
import { safeInteger, addSafe, scoreEvent } from './numeric.js';
import { attackableAnalysis, normalizedHits, mainFrameHit, validateCardScoringSnapshot } from './scoring.js';

/** An ordered, validated copy: reading a rune never mutates its instance or grants a resource. */
export function validateEquippedRunes(equippedRunes = [], {version=null,slotLimit=['0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1'].includes(version)?4:RUNE_SLOT_LIMIT}={}) {
  if (!Array.isArray(equippedRunes) || equippedRunes.length > slotLimit) throw new RangeError('Rune slot limit exceeded');
  const seen = new Set();
  return equippedRunes.map((rune, index) => {
    const runeId = rune.runeId ?? rune.id;
    if (!runeForVersion(runeId,version)?.runtimeReady || seen.has(runeId)) throw new TypeError(`Inactive or duplicate equipped rune: ${runeId}`);
    seen.add(runeId);
    const level = safeInteger(rune.level ?? 1, 'rune level', { min: 1 });
    if (level > RUNE_MAX_LEVEL) throw new RangeError('Maximum rune level is 3');
    return { instanceId: rune.instanceId ?? `runeInstance.${index}.${runeId}`, runeId, level };
  });
}

/**
 * Called at encounter entry only. The controller stores this snapshot and grants its resources once.
 * Reordering a rune later has no effect on that saved snapshot.
 * @param {object} base @param {string|object} character @param {number} difficulty @param {object[]} equippedRunes
 */
export function deriveCombatRules(base = COMBAT_BALANCE, character = 'traveler', difficulty = 1, equippedRunes = [], {version=null,slotLimit}={}) {
  if ((typeof character === 'object' ? character?.id : character) !== 'traveler' || difficulty !== 1) throw new RangeError('Only traveler / difficulty 1 is implemented');
  const rules = { ...base };
  for (const key of ['initialHand', 'handLimit', 'turnDraw', 'discardActions', 'turnLimit', 'sentenceLimit']) safeInteger(rules[key], key, { min: 0 });
  for (const rune of validateEquippedRunes(equippedRunes,{version,slotLimit})) {
    const definition = runeForVersion(rune.runeId,version);
    const property = { ADD_INITIAL_HAND: 'initialHand', ADD_HAND_LIMIT: 'handLimit', ADD_DISCARD_ACTIONS: 'discardActions' }[definition.operation];
    if (property) rules[property] = addSafe(rules[property], definition.levelValues[rune.level - 1]);
  }
  // Opening-hand expansion is still subject to the resulting hand limit.
  rules.initialHand = Math.min(rules.initialHand, rules.handLimit);
  return Object.freeze(rules);
}

/** Apply attack runes strictly in their stored slot order. Utility runes never fire here. */
export function applyRunes(analysis, scoreResult, equippedRunes, cards, { attackId = 'attack.sandbox',version=analysis.grammarVersion } = {}) {
  if (!attackableAnalysis(analysis)) throw new TypeError('Unsupported analysis cannot trigger runes');
  const runeSnapshot = validateEquippedRunes(equippedRunes,{version});
  const scoringCards = validateCardScoringSnapshot(cards);
  const contributionIds = new Set(scoreResult.contributingCardIds);
  const frameHit = mainFrameHit(analysis);
  const allHits = normalizedHits(analysis);
  const runeEvents = [];
  let score = safeInteger(scoreResult.preRuneScore, 'preRuneScore', { min: 0 });
  const emit = (rune, definition, operand, cardIds, evidenceRefs = []) => {
    const operation = definition.operation === 'MULTIPLY_SCORE' ? 'MULTIPLY' : 'ADD';
    const amount = operation === 'MULTIPLY' ? `×${operand.num / operand.den}` : `+${operand}`;
    const event = scoreEvent({ attackId, index: scoreResult.events.length + runeEvents.length, phase: 'RUNES', sourceType: 'RUNE',
      sourceId: rune.runeId, runeInstanceId: rune.instanceId, runeLevel: rune.level, labelKo: `${definition.nameKo} ${amount}`,
      operation, operand, before: score, evidenceRefs, highlightCardIds: cardIds });
    runeEvents.push(event); score = event.after;
  };
  for (const rune of runeSnapshot) {
    const definition = runeForVersion(rune.runeId,version);
    const value = definition.levelValues[rune.level - 1];
    if (definition.group === 'UTILITY') continue;
    const matchingFrame = { 'rune.sv': 'FRAME.SV', 'rune.svc': 'FRAME.SVC', 'rune.svo': 'FRAME.SVO', 'rune.svoo':'FRAME.SVOO' }[rune.runeId];
    if (matchingFrame && frameHit?.tag === matchingFrame) emit(rune, definition, value, frameHit.cardIds, [frameHit.id]);
    else if (rune.runeId === 'rune.short' && scoringCards.length <= 4) emit(rune, definition, value,
      scoringCards.map((card) => card.instanceId), frameHit?[frameHit.id]:[]);
    else if(rune.runeId==='rune.longSentence'&&contributionIds.size>=5)emit(rune,definition,contributionIds.size>=10?value.long:value.short,[...contributionIds],analysis.grammarHits.map(h=>h.id));
    else if (rune.runeId === 'rune.perfectSentence' && analysis.status === 'VALID' && !(analysis.issues ?? []).length && !scoreResult.excludedCardIds.length)
      emit(rune, definition, value, [...contributionIds], frameHit?[frameHit.id]:[]);
    else if (rune.runeId === 'rune.adverbs') {
      const seen = new Set();
      for (const hit of allHits.filter((entry) => entry.tag === 'MODIFIER.ADVERB')) {
        for (const id of hit.modifierCardIds ?? hit.cardIds ?? []) {
          if (seen.has(id) || !contributionIds.has(id)) continue;
          seen.add(id); emit(rune, definition, value, [id], [hit.id]);
        }
      }
    } else if (rune.runeId === 'rune.polished') {
      for (const card of scoringCards) if (card.polishLevel >= 1 && contributionIds.has(card.instanceId)) emit(rune, definition, value, [card.instanceId], [card.instanceId]);
    }
  }
  return { schemaVersion: 1, runeVersion: version==='0.6.1'?'runes.0.6.1':RUNE_VERSION, runeSnapshot, postRuneScore: score, runeEvents, events: runeEvents };
}

/** Shared tooltip formatter derived from the same values used in the engine. */
export function describeRune(runeId, level = 1, version='0.3.0') {
  const definition = runeForVersion(runeId,version);
  if (!definition || !Number.isInteger(level) || level < 1 || level > 3) return '후속 버전';
  const value = definition.levelValues[level - 1];
  if(runeId==='rune.longSentence')return `유효 카드 5~9장 ×${value.short.num/value.short.den} / 10~16장 ×${value.long.num/value.long.den}`;
  return `${definition.displayEffectSummaryKo} ${typeof value === 'object' ? `×${value.num / value.den}` : `+${value}`}`;
}
