import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSentence, snapshotFromText } from '../src/engine/grammar/index.js';
import { scoreAttack } from '../src/engine/scoring.js';
import { resolveAttack } from '../src/engine/stage.js';
import { deriveCombatRules, validateEquippedRunes, describeRune } from '../src/engine/runes.js';
import { multiplyFloor, addSafe } from '../src/engine/numeric.js';
import { COMBAT_BALANCE } from '../src/data/balance.js';
import { RUNES } from '../src/data/runes.js';
import { STAGE1, getStage1Encounter } from '../src/data/stage1.js';

const rune = (runeId, level = 1) => ({ instanceId: `test.${runeId}`, runeId, level });
function inputFor(text, { runes = [], polishFirst = 0, hp = 1000, kind = 'NORMAL' } = {}) {
  const sentenceSnapshot = snapshotFromText(text);
  const analysis = analyzeSentence(sentenceSnapshot);
  const cards = sentenceSnapshot.orderedTokens.map((token, index) => ({ instanceId: token.cardInstanceId,
    cardDefId: token.cardDefId, baseScore: 10, polishLevel: index === 0 ? polishFirst : 0, specialEffectId: null }));
  return { attackId: 'attack.test', analysis, sentenceSnapshot, cards, equippedRunes: runes.map((entry) => typeof entry === 'string' ? rune(entry) : entry),
    enemy: { hp, hpMax: hp, kind } };
}
const cases = [
  ['S01', 'I run.', 50], ['S02', 'She is happy.', 75], ['S03', 'I like dogs.', 93],
  ['S04', 'She like dogs.', 37], ['S05', 'I have book.', 46], ['S06', 'She likes the big dog.', 137],
  ['S07', 'She is very very very happy.', 138], ['S08', 'I run in the park.', 100],
  ['S09', 'I run.', 131, { runes: ['rune.perfectSentence', 'rune.sv', 'rune.short'] }],
  ['S10', 'I run.', 93, { runes: ['rune.perfectSentence', 'rune.short'] }],
  ['S11', 'I run.', 87, { runes: ['rune.short', 'rune.perfectSentence'] }],
  ['S12', 'I run.', 56, { polishFirst: 1 }],
  ['S13', 'I run.', 62, { polishFirst: 1, runes: ['rune.polished'] }],
  ['S14', 'She is very very very happy.', 157, { runes: ['rune.adverbs'] }],
  ['S15', 'I very like dogs.', 56],
];
for (const [id, text, finalPower, options] of cases) test(`${id}: real Grammar → Scoring → Rune → Stage: ${text}`, () => {
  const input = inputFor(text, options);
  assert.ok(['VALID', 'VALID_WITH_ISSUES'].includes(input.analysis.status), JSON.stringify(input.analysis));
  const original = structuredClone(input);
  const result = resolveAttack(input);
  assert.equal(result.finalPower, finalPower);
  assert.equal(result.accepted, true);
  assert.equal(result.actualHpLoss, finalPower);
  assert.equal(result.scoreTimeline.filter((event) => event.phase === 'REGION').length, 1);
  assert.equal(new Set(result.scoreTimeline.map((event) => event.eventId)).size, result.scoreTimeline.length);
  for (let i = 1; i < result.scoreTimeline.length; i++) assert.equal(result.scoreTimeline[i].before, result.scoreTimeline[i - 1].after);
  for (const event of result.scoreTimeline) {
    assert.ok(event.sourceId && event.sourceType && event.labelKo && event.phase);
    assert.ok(Number.isSafeInteger(event.after));
    for (const id of event.highlightCardIds) assert.ok(input.cards.some((card) => card.instanceId === id));
  }
  assert.deepEqual(input, original, 'Engines must not mutate any input');
});

test('C11: final 131 against HP 70 records actual 70 and overkill 61', () => {
  const result = resolveAttack(inputFor('I run.', { hp: 70, runes: ['rune.perfectSentence', 'rune.sv', 'rune.short'] }));
  assert.deepEqual([result.finalPower, result.actualHpLoss, result.overkill, result.enemyHpAfter, result.killed], [131, 70, 61, 0, true]);
  assert.equal(result.proposedStateEffects.killGold, 2);
  const boss = resolveAttack(inputFor('I run.', { hp: 1, kind: 'REGIONAL_BOSS' }));
  assert.equal(boss.proposedStateEffects.killGold, 6);
});

test('C14: explicit synthetic immunity returns zero power and consumed attack resources', () => {
  const input = inputFor('I run.');
  const result = resolveAttack({ ...input, syntheticBossFixture: 'IMMUNE_ZERO_DAMAGE_TEST_ONLY' });
  assert.equal(result.preBossScore, 50);
  assert.equal(result.finalPower, 0);
  assert.equal(result.actualHpLoss, 0);
  assert.equal(result.proposedStateEffects.consumeTurn, true);
  assert.equal(result.proposedStateEffects.discardCardIds.length, 2);
  assert.equal(result.visualBasis.synthetic, true);
  // Ordinary enemy data cannot activate the test fixture.
  assert.equal(resolveAttack({ ...input, enemy: { ...input.enemy, immunity: true, syntheticBossFixture: 'IMMUNE_ZERO_DAMAGE_TEST_ONLY' } }).finalPower, 50);
});

test('R10: slot order is reflected in recorded score timeline and final integer result', () => {
  const a = resolveAttack(inputFor('I run.', { runes: ['rune.perfectSentence', 'rune.short'] }));
  const b = resolveAttack(inputFor('I run.', { runes: ['rune.short', 'rune.perfectSentence'] }));
  assert.deepEqual(a.scoreTimeline.filter((event) => event.phase === 'RUNES').map((event) => event.sourceId), ['rune.perfectSentence', 'rune.short']);
  assert.deepEqual(b.scoreTimeline.filter((event) => event.phase === 'RUNES').map((event) => event.sourceId), ['rune.short', 'rune.perfectSentence']);
  assert.deepEqual([a.finalPower, b.finalPower], [93, 87]);
});

test('utility rule calculation is pure and reordering produces no additional resources', () => {
  const equipped = [rune('rune.openingHand', 3), rune('rune.handSize', 2), rune('rune.discards', 1)];
  const before = structuredClone(COMBAT_BALANCE);
  const first = deriveCombatRules(COMBAT_BALANCE, 'traveler', 1, equipped);
  assert.deepEqual([first.initialHand, first.handLimit, first.discardActions, first.turnDraw], [10, 13, 5, 3]);
  assert.deepEqual(deriveCombatRules(COMBAT_BALANCE, 'traveler', 1, [...equipped].reverse()), first);
  assert.deepEqual(COMBAT_BALANCE, before);
  assert.ok(Object.isFrozen(first));
  assert.equal(resolveAttack(inputFor('I run.', { runes: equipped })).finalPower, 50);
});

test('all ten active rune level values drive actual effects and descriptions', () => {
  assert.equal(RUNES.length, 10);
  const texts = { 'rune.sv': 'I run.', 'rune.svc': 'She is happy.', 'rune.svo': 'I like dogs.', 'rune.short': 'I run.',
    'rune.perfectSentence': 'I run.', 'rune.adverbs': 'She is very happy.', 'rune.polished': 'I run.' };
  for (const definition of RUNES) {
    for (let level = 1; level <= 3; level++) {
      assert.notEqual(describeRune(definition.id, level), '후속 버전');
      if (definition.group === 'UTILITY') {
        const rules = deriveCombatRules(COMBAT_BALANCE, 'traveler', 1, [rune(definition.id, level)]);
        const key = { ADD_INITIAL_HAND: 'initialHand', ADD_HAND_LIMIT: 'handLimit', ADD_DISCARD_ACTIONS: 'discardActions' }[definition.operation];
        assert.equal(rules[key], COMBAT_BALANCE[key] + definition.levelValues[level - 1]);
      } else {
        const result = resolveAttack(inputFor(texts[definition.id], { runes: [rune(definition.id, level)], polishFirst: definition.id === 'rune.polished' ? 3 : 0 }));
        const events = result.scoreTimeline.filter((event) => event.sourceType === 'RUNE');
        assert.equal(events.length, 1);
        assert.deepEqual(events[0].operand, definition.levelValues[level - 1]);
      }
    }
  }
});

test('same normalized parsing evidence cannot add modifier or rune credit twice', () => {
  const input = inputFor('She is very very very happy.', { runes: ['rune.adverbs'] });
  const result = resolveAttack(input);
  const duplicate = structuredClone(input);
  duplicate.analysis.grammarHits.push(...structuredClone(duplicate.analysis.grammarHits));
  const dupResult = resolveAttack(duplicate);
  assert.equal(dupResult.finalPower, result.finalPower);
  assert.equal(dupResult.scoreTimeline.filter((event) => event.sourceId === 'rune.adverbs').length, 3);
});

test('unlicensed modifier loses polish, modifier, and polished/adverb rune credit without a second fine', () => {
  const input = inputFor('I very like dogs.', { runes: ['rune.adverbs', 'rune.polished'] });
  const veryId = input.sentenceSnapshot.orderedTokens.find((token) => token.surface.toLowerCase() === 'very').cardInstanceId;
  input.cards.find((card) => card.instanceId === veryId).polishLevel = 3;
  const result = resolveAttack(input);
  assert.equal(result.finalPower, 56);
  assert.equal(result.scoreTimeline.filter((event) => event.phase === 'ACCURACY').length, 1);
  assert.equal(result.scoreTimeline.find((event) => event.phase === 'ACCURACY').operand, -25);
  assert.equal(result.scoreTimeline.filter((event) => event.phase === 'RUNES').length, 0);
});

test('recovered core activates frame and region but never perfect sentence or crystal rune', () => {
  const result = resolveAttack(inputFor('She like dogs.', { runes: ['rune.svo', 'rune.perfectSentence'] }));
  assert.equal(result.finalPower, 52);
  assert.ok(result.scoreTimeline.some((event) => event.sourceId === 'rune.svo'));
  assert.ok(!result.scoreTimeline.some((event) => event.sourceId === 'rune.perfectSentence' || event.sourceId === 'COMPLETE_SENTENCE'));
});

test('be locative uses school SV scoring, region, and ruby rune', () => {
  const result = resolveAttack(inputFor('I am in the park.', { runes: ['rune.sv'] }));
  assert.equal(result.preRuneScore, 80);
  assert.equal(result.finalPower, 140);
});

test('safe rational arithmetic floors each operation and rejects unsafe / NaN / Infinity input', () => {
  assert.equal(multiplyFloor(75, { num: 5, den: 4 }), 93);
  assert.equal(multiplyFloor(multiplyFloor(20, { num: 3, den: 2 }), { num: 5, den: 4 }), 37);
  for (const value of [NaN, Infinity, 0.1, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => multiplyFloor(value, { num: 5, den: 4 }));
  assert.throws(() => multiplyFloor(Number.MAX_SAFE_INTEGER, { num: 5, den: 4 }));
  assert.throws(() => multiplyFloor(2, { num: 1, den: 0 }));
  assert.throws(() => addSafe(Number.MAX_SAFE_INTEGER, 1));
});

test('unimplemented, duplicate, or over-level runes and special effects fail safely', () => {
  assert.throws(() => validateEquippedRunes([rune('rune.relative')]));
  assert.throws(() => validateEquippedRunes([rune('rune.short'), rune('rune.short')]));
  assert.throws(() => validateEquippedRunes([rune('rune.short', 4)]));
  const input = inputFor('I run.'); input.cards[0].specialEffectId = 'golden';
  assert.throws(() => resolveAttack(input));
  assert.throws(() => deriveCombatRules(COMBAT_BALANCE, 'alchemist', 1));
  assert.throws(() => getStage1Encounter(3));
  assert.equal(STAGE1.rounds.length, 3);
});

test('invalid and unsupported submissions produce no score events or proposed resource changes', () => {
  for (const text of ['She happy.', 'She is reading a book.']) {
    const input = inputFor(text);
    const result = resolveAttack(input);
    assert.equal(result.accepted, false, JSON.stringify(input.analysis));
    assert.equal(result.proposedStateEffects.consumeTurn, false);
    assert.deepEqual(result.proposedStateEffects.discardCardIds, []);
    assert.deepEqual(result.scoreTimeline, []);
    assert.throws(() => scoreAttack(input.analysis, input.cards));
  }
});
