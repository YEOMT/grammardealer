import test from 'node:test';
import assert from 'node:assert/strict';
import { createRewardOffer, resolveReward, getRemovalWarning } from '../src/game/rewards.js';
import { createRng } from '../src/game/rng.js';
import { generateStarterDeck } from '../src/game/deck.js';
import { registry } from '../src/data/language/index.js';
import { RUNES } from '../src/data/runes.js';
import { REWARD_BALANCE } from '../src/data/balance.js';
import { assertCardConservation } from '../src/game/invariants.js';

const starter = generateStarterDeck({ seed: 'rewards', vocabularyMode: 'BEGINNER' });
function runFor({ battle = 1, intro = false, seed = 'reward-seed' } = {}) {
  const activeCardIds = [...starter.activeCardIds];
  return { version:'0.1.0', runId: 'test.run', config: { vocabularyMode: 'BEGINNER' }, progress: { roundIndex: battle - 1, battleNumber: battle },
    activeCardIds, cardInstances: structuredClone(starter.cardInstances), rng: createRng(seed),
    runes: { orderedInstanceIds: [], instances: {}, slotLimit: 3 }, economy: { gold: 10 },
    tutorial: { isIntroRun: intro }, reward: null, vocabulary: { encounteredLexemeIds: activeCardIds.map((id) => registry.cardById[starter.cardInstances[id].cardDefId].lexemeId) },
    eligibility: { runStartUnlockBaseline: RUNES.map((rune) => rune.id), runOwnUnlocks: [] },
    combat: { drawIds: [], handIds: [], sentenceSlots: [], discardIds: [...activeCardIds], rulesSnapshot: { handLimit: 10, sentenceLimit: 16 } },
  };
}
function giveRune(run, runeId, level = 1) {
  const instanceId = `owned.${runeId}`;
  run.runes.orderedInstanceIds.push(instanceId); run.runes.instances[instanceId] = { instanceId, runeId, level };
  return instanceId;
}
function fixtureOffer(run, type, details) {
  const offerId = `offer.${run.runId}.${run.progress.battleNumber}`;
  run.reward = { offerId, battleNumber: run.progress.battleNumber, type, resolved: false, firstRuneIntro: false,
    skipGold: ['CARD_COMMON', 'CARD_UNCOMMON', 'CARD_RARE'].includes(type) ? 3 : 2,
    choices: [{ choiceId: `${offerId}.choice.0`, ...details }] };
  return run.reward;
}

test('R01: intro expedition 1-1 offers common cards with the same rarity and distinct definitions', () => {
  const run = runFor({ intro: true }); const gold = run.economy.gold;
  const offer = createRewardOffer(run, { firstRuneIntroSeen: false });
  assert.equal(offer.type, 'CARD_COMMON'); assert.equal(offer.choices.length, 3);
  assert.equal(new Set(offer.choices.map((choice) => choice.cardDefId)).size, 3);
  offer.choices.forEach((choice) => assert.equal(registry.cardById[choice.cardDefId].rarity, 'COMMON'));
  assert.equal(run.economy.gold, gold, 'offer creation never grants kill gold');
  assert.ok(Object.isFrozen(offer));
});

test('R02: every run battle 2 gives a rune offer, first presentation fixes crystal/amber/copper', () => {
  const run = runFor({ battle: 2, intro: true });
  const offer = createRewardOffer(run, { firstRuneIntroSeen: false });
  assert.deepEqual(offer.choices.map((choice) => choice.runeId), ['rune.perfectSentence', 'rune.short', 'rune.discards']);
  assert.equal(offer.firstRuneIntro, true); assert.equal(offer.skipGold, 2);
});

test('R03: later battle-2 offers preserve basic/basic/all policy, distinct IDs, and seeded variety', () => {
  const combinations = new Set();
  for (let seed = 0; seed < 25; seed++) {
    const run = runFor({ battle: 2, seed });
    const offer = createRewardOffer(run, { firstRuneIntroSeen: true });
    assert.equal(offer.type, 'RUNE'); assert.equal(offer.firstRuneIntro, false);
    assert.deepEqual(offer.choices.map((choice) => choice.role), ['BASIC', 'BASIC', 'UNLOCKED_IMPLEMENTED_ALL']);
    assert.equal(new Set(offer.choices.map((choice) => choice.runeId)).size, 3);
    combinations.add(offer.choices.map((choice) => choice.runeId).join('|'));
  }
  assert.ok(combinations.size > 10);
});

test('R04: skipping operation guide does not change first-reward policy or RNG', () => {
  const a = runFor({ intro: true }); const b = structuredClone(a); b.tutorial.skipped = true;
  assert.deepEqual(createRewardOffer(a, { firstRuneIntroSeen: false }), createRewardOffer(b, { firstRuneIntroSeen: false }));
  assert.deepEqual(a.rng, b.rng);
});

test('frozen offers are restored unchanged without reroll or additional vocabulary mutation', () => {
  const run = runFor({ battle: 2 }); createRewardOffer(run, { firstRuneIntroSeen: false });
  const before = structuredClone(run);
  const offer = createRewardOffer(run, { firstRuneIntroSeen: true });
  assert.deepEqual(offer, before.reward); assert.deepEqual(run, before);
});

test('R05: card choice commits once, conserves actual card IDs, and never grants duplicate rewards', () => {
  const run = runFor({ intro: true }); const offer = createRewardOffer(run, { firstRuneIntroSeen: false });
  const response = resolveReward(run, offer.offerId, offer.choices[0].choiceId);
  assert.equal(response.ok, true); assert.equal(run.activeCardIds.length, 29);
  assertCardConservation(run.activeCardIds, run.combat, run.cardInstances);
  const settled = structuredClone(run);
  assert.equal(resolveReward(run, offer.offerId, offer.choices[0].choiceId).alreadyResolved, true);
  assert.deepEqual(run, settled);
});

test('R06: skip pays card +3 or other +2 once, independently of victory gold', () => {
  for (const [type, amount] of [['CARD_COMMON', 3], ['CARD_RARE', 3], ['CARD_ENHANCE', 2], ['CARD_REMOVE', 2], ['RUNE', 2]]) {
    const run = runFor(); const offer = fixtureOffer(run, type, {});
    assert.equal(resolveReward(run, offer.offerId, 'SKIP').ok, true); assert.equal(run.economy.gold, 10 + amount);
    assert.equal(resolveReward(run, offer.offerId, 'SKIP').ok, false); assert.equal(run.economy.gold, 10 + amount);
  }
});

test('R07: obtaining the same Lv1 rune upgrades its same instance to Lv2 without a new slot', () => {
  const run = runFor(); const id = giveRune(run, 'rune.short');
  const offer = fixtureOffer(run, 'RUNE', { runeId: 'rune.short' });
  assert.equal(resolveReward(run, offer.offerId, offer.choices[0].choiceId).ok, true);
  assert.equal(run.runes.instances[id].level, 2); assert.deepEqual(run.runes.orderedInstanceIds, [id]);
});

test('R08: Lv3 owned runes are excluded from new candidates', () => {
  for (let seed = 0; seed < 30; seed++) {
    const run = runFor({ battle: 2, seed }); giveRune(run, 'rune.short', 3); giveRune(run, 'rune.perfectSentence', 3);
    const offer = createRewardOffer(run, { firstRuneIntroSeen: true });
    assert.ok(!offer.choices.some((choice) => ['rune.short', 'rune.perfectSentence'].includes(choice.runeId)));
  }
});

test('R09: full-slot replacement request/cancellation preserves offer, runes, and gold', () => {
  const run = runFor(); const ids = ['rune.short', 'rune.sv', 'rune.svo'].map((id) => giveRune(run, id));
  const offer = fixtureOffer(run, 'RUNE', { runeId: 'rune.perfectSentence' });
  const before = structuredClone(run);
  assert.equal(resolveReward(run, offer.offerId, offer.choices[0].choiceId).needsReplacement, true);
  assert.deepEqual(run, before);
  assert.equal(resolveReward(run, offer.offerId, offer.choices[0].choiceId, { replaceRuneInstanceId: 'missing' }).ok, false);
  assert.deepEqual(run, before);
  assert.equal(resolveReward(run, offer.offerId, offer.choices[0].choiceId, { replaceRuneInstanceId: ids[1] }).ok, true);
  assert.equal(run.runes.orderedInstanceIds.length, 3); assert.equal(run.runes.instances[ids[1]], undefined);
  assert.equal(run.economy.gold, 10);
});

test('R12: future rune profile unlock cannot appear in the implemented reward pool', () => {
  const run = runFor({ battle: 2 }); run.eligibility.runStartUnlockBaseline.push('rune.relative', 'rune.turnDraw');
  const offer = createRewardOffer(run, { firstRuneIntroSeen: true, unlockedRuneIds: ['rune.relative', 'rune.turnDraw'] });
  assert.ok(offer.choices.every((choice) => RUNES.some((definition) => definition.id === choice.runeId && definition.runtimeReady)));
});

test('R13: polish changes only the selected instance and cannot exceed +3', () => {
  const run = runFor(); const id = run.activeCardIds[0]; run.cardInstances[id].polishLevel = 2;
  const offer = fixtureOffer(run, 'CARD_ENHANCE', { cardInstanceId: id });
  const unselectedBefore = structuredClone(run.cardInstances[run.activeCardIds[1]]);
  assert.equal(resolveReward(run, offer.offerId, offer.choices[0].choiceId).ok, true);
  assert.equal(run.cardInstances[id].polishLevel, 3); assert.deepEqual(run.cardInstances[run.activeCardIds[1]], unselectedBefore);
  const maxOffer = fixtureOffer(run, 'CARD_ENHANCE', { cardInstanceId: id });
  const before = structuredClone(run);
  assert.equal(resolveReward(run, maxOffer.offerId, maxOffer.choices[0].choiceId).ok, false); assert.deepEqual(run, before);
});

test('R14: cancelling or rejecting a polish target leaves its unresolved offer and all resources intact', () => {
  const run = runFor(); const offer = fixtureOffer(run, 'CARD_ENHANCE', { cardInstanceId: run.activeCardIds[0] });
  const before = structuredClone(run);
  assert.equal(resolveReward(run, offer.offerId, 'CANCEL').ok, false); assert.deepEqual(run, before);
});

test('R15: removal changes the selected physical card and its pile, preserving encountered vocabulary', () => {
  const run = runFor(); const id = run.activeCardIds[0]; const vocabulary = [...run.vocabulary.encounteredLexemeIds];
  const offer = fixtureOffer(run, 'CARD_REMOVE', { cardInstanceId: id });
  assert.equal(resolveReward(run, offer.offerId, offer.choices[0].choiceId, { confirmRemoval: true }).ok, true);
  assert.equal(run.activeCardIds.length, 27); assert.equal(run.cardInstances[id], undefined);
  assert.ok(!run.combat.discardIds.includes(id)); assert.deepEqual(run.vocabulary.encounteredLexemeIds, vocabulary);
  assertCardConservation(run.activeCardIds, run.combat, run.cardInstances);
});

test('last-card removal requests confirmation without mutation; confirmed removal does not invent recovery cards', () => {
  const run = runFor(); const id = run.activeCardIds[0];
  run.activeCardIds = [id]; run.cardInstances = { [id]: run.cardInstances[id] }; run.combat.discardIds = [id];
  assert.match(getRemovalWarning(run, id), /마지막 카드/);
  const offer = fixtureOffer(run, 'CARD_REMOVE', { cardInstanceId: id }); const before = structuredClone(run);
  assert.equal(resolveReward(run, offer.offerId, offer.choices[0].choiceId).needsConfirmation, true); assert.deepEqual(run, before);
  assert.equal(resolveReward(run, offer.offerId, offer.choices[0].choiceId, { confirmRemoval: true }).ok, true);
  assert.equal(run.activeCardIds.length, 0); assertCardConservation(run.activeCardIds, run.combat, run.cardInstances);
});

test('R16: rare card offer shows exactly two eligible definitions without substitution or duplication', () => {
  let found;
  for (let seed = 0; seed < 200 && !found; seed++) {
    const run = runFor({ seed }); const offer = createRewardOffer(run, { firstRuneIntroSeen: true });
    if (offer.type === 'CARD_RARE') found = offer;
  }
  assert.ok(found); assert.equal(found.choices.length, 2);
  assert.deepEqual(found.choices.map((choice) => choice.cardDefId).sort(), ['card.that', 'card.to']);
});

test('all-max polish offers keep their type and expose an explicit skip explanation', () => {
  let found;
  for (let seed = 0; seed < 100 && !found; seed++) {
    const run = runFor({ seed }); for (const card of Object.values(run.cardInstances)) card.polishLevel = 3;
    const offer = createRewardOffer(run, { firstRuneIntroSeen: true });
    if (offer.type === 'CARD_ENHANCE') found = offer;
  }
  assert.ok(found); assert.ok(found.choices.every((choice) => choice.disabled)); assert.ok(found.emptyReasonKo); assert.equal(found.skipGold, 2);
});

test('R18: normal and boss tables each sum to 100 and non-override samples follow their separate tables', () => {
  for (const [battle, table] of [[1, REWARD_BALANCE.normal], [3, REWARD_BALANCE.regionalBoss]]) {
    assert.equal(Object.values(table).reduce((sum, weight) => sum + weight, 0), 100);
    const counts = Object.fromEntries(Object.keys(table).map((type) => [type, 0]));
    const run = runFor({ battle, seed: `frequencies.${battle}` });
    for (let index = 0; index < 6000; index++) { run.reward = null; counts[createRewardOffer(run, { firstRuneIntroSeen: true }).type] += 1; }
    for (const [type, weight] of Object.entries(table)) {
      if (weight === 0) assert.equal(counts[type], 0);
      else assert.ok(Math.abs(counts[type] / 60 - weight) < 2.5, `${battle}:${type}:${counts[type]}`);
    }
  }
});
