import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng, createStream, nextFloat, randomInt, shuffle, assertRng } from '../src/game/rng.js';
import { generateStarterDeck, validateStarterDeck, createBattlePiles, findPlayableSentences, drawCards, exchangeCards, discardSentence, VOCABULARY_MODES } from '../src/game/deck.js';
import { registry, createSentenceSnapshot, lexemeForCard } from '../src/data/language/index.js';
import { analyzeSentence } from '../src/engine/grammar/index.js';
import { assertCardConservation } from '../src/game/invariants.js';

test('seeded stream serialization resumes exactly and streams remain independent', () => {
  const a = createRng('restore');
  for (let i = 0; i < 41; i += 1) nextFloat(a.deck);
  const b = JSON.parse(JSON.stringify(a));
  for (let i = 0; i < 40; i += 1) assert.equal(nextFloat(a.deck), nextFloat(b.deck));
  assert.deepEqual(a.reward, createRng('restore').reward);
  assert.equal(a.deck.cursor, 81);
  assertRng(a);
  assert.throws(() => randomInt(a.deck, 0));
  assert.throws(() => nextFloat({ state: -1, cursor: 0 }));
});

test('shuffle returns a permutation copy and consumes deterministic bounded draws', () => {
  const original = ['a', 'b', 'c', 'd']; const stream = createStream('shuffle');
  const first = shuffle(stream, original);
  assert.deepEqual(original, ['a', 'b', 'c', 'd']);
  assert.deepEqual([...first].sort(), original);
  assert.deepEqual(first, shuffle(createStream('shuffle'), original));
  assert.equal(stream.cursor, 3);
});

test('D01 D02 D03: four modes preserve 28 physical role slots and parser-verified SV/SVC/SVO paths', () => {
  const fingerprints = new Map();
  for (const mode of VOCABULARY_MODES) {
    const samples = [];
    for (let seed = 0; seed < 24; seed += 1) {
      const deck = generateStarterDeck({ seed: `unit.${seed}`, vocabularyMode: mode });
      const validation = validateStarterDeck(deck);
      assert.equal(validation.valid, true, `${mode}/${seed}: ${validation.errors}`);
      assert.deepEqual(validation.counts, { NOUN: 6, PRONOUN: 4, VERB: 8, ADJECTIVE: 3, ADVERB: 2, DETERMINER: 3, PREPOSITION: 2 });
      const roles = deck.generationTrace.slotRoles.map(x => x.role);
      assert.equal(roles.filter(x => x === 'BE').length, 2);
      assert.equal(roles.filter(x => x === 'SV').length, 2);
      assert.equal(roles.filter(x => x === 'SVO').length, 3);
      assert.equal(roles.filter(x => x === 'MULTI').length, 1);
      assert.equal(roles.length, 28);
      assert.equal(deck.generationTrace.fallbackUsed, false);
      for (const witness of deck.witnesses) {
        assert.equal(analyzeSentence(createSentenceSnapshot(witness.slots, deck.cardInstances)).status, 'VALID');
      }
      assert.ok(Object.values(deck.cardInstances).every(card => registry.cardById[card.cardDefId].baseScore === 10));
      samples.push(Object.values(deck.cardInstances).map(c => c.cardDefId).join(','));
    }
    fingerprints.set(mode, samples.join('|'));
  }
  assert.equal(new Set(fingerprints.values()).size, 4, 'Vocabulary mode must change actual sampled content');
});

test('D04 D05: every battle opening is six physical cards with a shuffled verified varied witness', () => {
  const frames = new Set(); const sentences = new Set();
  for (let seed = 0; seed < 20; seed += 1) {
    const deck = generateStarterDeck({ seed: `opening.${seed}` });
    const history = [];
    for (let battle = 0; battle < 3; battle += 1) {
      const piles = createBattlePiles({ ...deck, stream: deck.rng.deck, previousOpeningFrames: history });
      assert.equal(piles.handIds.length, 6); assert.equal(piles.drawIds.length, 22);
      assertCardConservation(deck.activeCardIds, piles, deck.cardInstances);
      assert.equal(piles.openingTrace.guaranteed, true);
      assert.ok(piles.openingTrace.witnessSlots.every(s => piles.handIds.includes(s.cardInstanceId)));
      const snapshot = createSentenceSnapshot(piles.openingTrace.witnessSlots, deck.cardInstances);
      assert.equal(analyzeSentence(snapshot).status, 'VALID');
      frames.add(piles.openingTrace.frameId); sentences.add(snapshot.orderedTokens.map(t => t.surface).join(' '));
      assert.ok(!history.includes(piles.openingTrace.frameId));
      history.push(piles.openingTrace.frameId);
    }
  }
  assert.equal(frames.size, 4); assert.ok(sentences.size > 25);
});

test('same settings reproduce deck and opening; caller RNG is not changed by deck construction', () => {
  const rng = createRng('same'); const saved = structuredClone(rng);
  const a = generateStarterDeck({ seed: 'ignored ID', rng, vocabularyMode: 'FREE' });
  const b = generateStarterDeck({ seed: 'another ID', rng, vocabularyMode: 'FREE' });
  assert.deepEqual(a, b); assert.deepEqual(rng, saved);
  assert.deepEqual(createBattlePiles({ ...a, stream: a.rng.deck }), createBattlePiles({ ...b, stream: b.rng.deck }));
  assert.throws(() => generateStarterDeck({ vocabularyMode: 'EXPERT' }));
});

const ids = count => Array.from({ length: count }, (_, n) => `c.${n}`);
const pile = (hand, draw = [], discard = []) => ({ handIds: [...hand], drawIds: [...draw], discardIds: [...discard], sentenceSlots: [], exchangesRemaining: 4, turnsRemaining: 6 });

test('D06 D07: full hand clips draw with no deletion, RNG consumption, or deferred draw debt', () => {
  const all = ids(14); const state = pile(all.slice(0, 9), all.slice(9)); const stream = createStream(1);
  assert.deepEqual(drawCards(state, 3, 10, stream), ['c.9']);
  assert.equal(state.handIds.length, 10); assert.equal(state.drawIds.length, 4);
  const before = structuredClone({ state, stream });
  assert.deepEqual(drawCards(state, 3, 10, stream), []);
  assert.deepEqual({ state, stream }, before);
  assertCardConservation(all, state);
  assert.equal('drawDebt' in state, false);
});

test('D08 D09: draw exhausts old draw before recycling only discard, then terminates if both empty', () => {
  const state = pile(['h'], ['first'], ['d1', 'd2', 'd3']);
  state.sentenceSlots = [{ cardInstanceId: 's', selection: null }];
  const stream = createStream('recycle'); const all = ['h', 'first', 'd1', 'd2', 'd3', 's'];
  const drawn = drawCards(state, 3, 10, stream);
  assert.equal(drawn[0], 'first'); assert.equal(drawn.length, 3);
  assert.ok(!drawn.includes('s') && !drawn.includes('h'));
  assert.equal(state.discardIds.length, 0); assert.equal(state.drawIds.length, 1);
  assertCardConservation(all, state);
  assert.equal(drawCards(state, 3, 10, stream).length, 1);
  const before = structuredClone({ state, stream });
  assert.deepEqual(drawCards(state, 3, 10, stream), []); assert.deepEqual({ state, stream }, before);
});

test('D10: multi-card exchange charges once, no turn cost, and draws the same requested count', () => {
  const all = ids(15); const state = pile(all.slice(0, 6), all.slice(6)); const stream = createStream('exchange');
  const selected = all.slice(0, 4);
  const result = exchangeCards(state, selected, 10, stream);
  assert.equal(result.ok, true); assert.equal(result.drawnIds.length, 4);
  assert.equal(state.exchangesRemaining, 3); assert.equal(state.turnsRemaining, 6); assert.equal(state.handIds.length, 6);
  assert.deepEqual(state.discardIds, [...selected].reverse()); assertCardConservation(all, state);
});

test('D11 D12: empty, duplicate, absent, and exhausted exchanges are fully lossless including RNG', () => {
  for (const selected of [[], ['missing'], ['c.0', 'c.0']]) {
    const state = pile(ids(6), [], ['d']); const stream = createStream(42); const before = structuredClone({ state, stream });
    assert.equal(exchangeCards(state, selected, 10, stream).ok, false); assert.deepEqual({ state, stream }, before);
  }
  const state = pile(ids(6)); state.exchangesRemaining = 0;
  const stream = createStream(42); const before = structuredClone({ state, stream });
  assert.equal(exchangeCards(state, ['c.0'], 10, stream).ok, false); assert.deepEqual({ state, stream }, before);
});

test('D13: immediate recycled return is legal and never duplicates a physical card', () => {
  const state = pile(['only']); const stream = createStream('alone');
  assert.deepEqual(exchangeCards(state, ['only'], 10, stream), { ok: true, drawnIds: ['only'] });
  assertCardConservation(['only'], state); assert.equal(state.exchangesRemaining, 3);
});

test('D16: sentence discard preserves unused hand and instance selection is not retained in discard', () => {
  const state = pile(['kept'], ['draw'], ['old']);
  state.sentenceSlots = [{ cardInstanceId: 's1', selection: { formId: 'form.run.third' } }, { cardInstanceId: 's2', selection: null }];
  assert.deepEqual(discardSentence(state), ['s1', 's2']);
  assert.deepEqual(state.handIds, ['kept']); assert.deepEqual(state.discardIds, ['s2', 's1', 'old']);
  assertCardConservation(['kept', 'draw', 'old', 's1', 's2'], state);
});

test('QA sentence search cannot clone cards and returns actual grammar results', () => {
  const deck = generateStarterDeck({ seed: 'qa' });
  const before = JSON.stringify(deck);
  const candidates = findPlayableSentences(deck.activeCardIds, deck.cardInstances, { perFrame: 2, maxChecks: 256, includeModifiers: true });
  assert.ok(candidates.length >= 4); assert.equal(JSON.stringify(deck), before);
  for (const candidate of candidates) {
    assert.equal(candidate.analysis.status, 'VALID');
    assert.equal(new Set(candidate.slots.map(s => s.cardInstanceId)).size, candidate.slots.length);
  }
  assert.throws(() => findPlayableSentences(['x', 'x'], {}));
  assert.ok(Object.values(deck.cardInstances).some(card => lexemeForCard(card).pos === 'VERB'));
});
