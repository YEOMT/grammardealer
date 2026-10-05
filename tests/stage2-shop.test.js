import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { registry, registryForVersion } from './helpers/legacy-language.js';
import { snapshotFromText, analyzeSentence } from './helpers/legacy-language.js';
import { resolveAttack, resolveEncounter } from '../src/engine/stage.js';
import { STAGE1, STAGE2, getEncounter, stageForRun } from '../src/data/stages.js';
import { createRng } from '../src/game/rng.js';
import { grantStage2Entry, createShop, buyShopItem, useShopService, closeShop } from '../src/game/shop.js';
import { createRewardOffer, resolveReward, eligibleRunes, eligibleRewardCards } from '../src/game/rewards.js';
import { generateStarterDeck } from '../src/game/deck.js';
import { REWARD_BALANCE } from '../src/data/balance.js';

function runFor(seed = 'stage2-shop') {
  const deck = generateStarterDeck({ seed, vocabularyMode: 'BEGINNER' });
  return { version: '0.2.0', runId: `test.${seed}`, status: 'STAGE_INTRO', progress: { stageId: 'stage.02', roundIndex: 0, battleNumber: 4 },
    activeCardIds: deck.activeCardIds, cardInstances: deck.cardInstances, vocabulary: deck.vocabulary,
    rng: createRng(seed), combat: null, reward: null, entryGrants: {}, shop: null,
    economy: { gold: 100, paidRemovalCount: 0 }, runes: { instances: {}, orderedInstanceIds: [], slotLimit: 3 },
    eligibility: { runStartUnlockBaseline: [], runOwnUnlocks: ['pack.svoo', 'rune.svoo'] }, tutorial: { isIntroRun: false } };
}
function own(run, cardDefId) {
  const instanceId = `test.card.${run.activeCardIds.length}.${cardDefId}`;
  run.activeCardIds.push(instanceId);
  run.cardInstances[instanceId] = { instanceId, cardDefId, polishLevel: 0, specialEffectId: null };
  return instanceId;
}
function ownRune(run, runeId, level = 1) {
  const instanceId = `test.owned.${runeId}`;
  run.runes.orderedInstanceIds.push(instanceId); run.runes.instances[instanceId] = { instanceId, runeId, level };
  return instanceId;
}
function open(run = runFor()) { grantStage2Entry(run); createShop(run); run.status = 'SHOP'; return run; }
function inputFor(text, { stage = STAGE2, enemy = getEncounter('stage.02', 0), topaz = 0 } = {}) {
  const sentenceSnapshot = snapshotFromText(text), analysis = analyzeSentence(sentenceSnapshot);
  assert.ok(['VALID', 'VALID_WITH_ISSUES'].includes(analysis.status), `${text}: ${analysis.status}`);
  return { analysis, sentenceSnapshot, stage, enemy,
    cards: sentenceSnapshot.orderedTokens.map(token => ({ instanceId: token.cardInstanceId, cardDefId: token.cardDefId, polishLevel: 0 })),
    equippedRunes: topaz ? [{ instanceId: 'rune.test', runeId: 'rune.svoo', level: topaz }] : [] };
}

test('0.2 stage registry keeps three Stage 1 battles and four Stage 2 battles with explicit kinds', () => {
  assert.deepEqual(STAGE1.rounds.map(r => r.hp), [91, 156, 286]);
  assert.deepEqual(STAGE2.rounds.map(r => [r.battleNumber, r.hp, r.kind]), [[4,220,'NORMAL'],[5,300,'NORMAL'],[6,380,'NORMAL'],[7,640,'REGIONAL_BOSS']]);
  assert.equal(getEncounter('stage.01', 2, '0.1.0').hp, 220);
  assert.equal(getEncounter('stage.01', 2, '0.1.1').hp, 286);
  assert.throws(() => getEncounter('stage.02', 0, '0.1.1'));
  assert.throws(() => stageForRun({ version: '0.1.0', progress: { stageId: 'stage.02' } }));
});

test('0.2 actual Grammar → Rune → Region keeps the specified SVOO and dative arithmetic', () => {
  const cases = [['She gives me a book.',0,175],['She gives me a book.',1,262],['She gives me a book.',2,350],['She gives me a book.',3,437],
    ['She give me a book.',0,100],['She gives a book to me.',0,130],['She is happy.',0,60]];
  for (const [text, topaz, expected] of cases) assert.equal(resolveAttack(inputFor(text, { topaz })).finalPower, expected, text);
  const early = resolveAttack(inputFor('She gives me a book.', { stage: STAGE1, enemy: getEncounter('stage.01',0) }));
  assert.equal(early.finalPower, 140);
  assert.equal(early.scoreTimeline.filter(event => event.phase === 'REGION').length, 0);
  const dative = resolveAttack(inputFor('She gives a book to me.', { topaz: 3 }));
  assert.equal(dative.finalPower, 130); assert.equal(dative.scoreTimeline.filter(event => event.phase === 'REGION').length, 0);
});

test('0.2 veil is a pure before/after proposal, released before the first SVOO damage', () => {
  const enemy = getEncounter('stage.02', 3), before = structuredClone(enemy);
  const blocked = resolveAttack(inputFor('She is happy.', { enemy }));
  assert.equal(blocked.finalPower, 15); assert.equal(blocked.bossStateAfter.active, true);
  const dative = resolveAttack(inputFor('She gives a book to me.', { enemy }));
  assert.equal(dative.finalPower, 32); assert.equal(dative.bossStateAfter.active, true);
  const released = resolveAttack(inputFor('She give me a book.', { enemy }));
  assert.equal(released.finalPower, 100); assert.equal(released.bossStateBefore.active, true); assert.equal(released.bossStateAfter.active, false);
  const event = released.scoreTimeline.find(entry => entry.sourceId === 'boss.svooVeil.release');
  assert.ok(event); assert.equal(event.before, event.after); assert.equal(event.bossStateAfter.active, false);
  assert.equal(released.visualBasis.enemyBefore.bossMechanic.active, true); assert.equal(released.visualBasis.enemyAfter.bossMechanic.active, false);
  assert.equal(released.proposedStateEffects.bossMechanic.active, false);
  assert.deepEqual(enemy, before, 'Engine cannot commit the veil itself');
  const afterEnemy = { ...enemy, hp: released.enemyHpAfter, bossMechanic: released.bossStateAfter };
  assert.equal(resolveAttack(inputFor('She is happy.', { enemy: afterEnemy })).finalPower, 60);
  assert.equal(resolveAttack(inputFor('She gives me a book.', { enemy: afterEnemy })).scoreTimeline.filter(entry => entry.sourceId === 'boss.svooVeil.release').length, 0);
});

test('0.2 synthetic high-power non-SVOO can break through the veil without a forced gate', () => {
  const analysis = inputFor('She is happy.').analysis;
  const result = resolveEncounter(analysis, 2560, getEncounter('stage.02',3), { stage: STAGE2 });
  assert.deepEqual([result.finalPower,result.actualHpLoss,result.killed,result.bossStateAfter.active], [640,640,true,true]);
  const immune = resolveAttack({ ...inputFor('She gives me a book.', { enemy: getEncounter('stage.02',3) }), syntheticBossFixture: 'IMMUNE_ZERO_DAMAGE_TEST_ONLY' });
  assert.equal(immune.finalPower, 0); assert.equal(immune.visualBasis.synthetic, true);
});

test('0.2 entry grants zero to two physical cards once and verifies a real unique-card witness', () => {
  for (const [existing, count, verb, marker] of [[[],2,'give','to'],[['give'],1,'give','to'],[['give','to'],0,'give','to'],[['make'],1,'make','for'],[['make','for'],0,'make','for']]) {
    const run = runFor();
    run.activeCardIds = []; run.cardInstances = {};
    for (const word of ['she','i','a','book',...existing]) own(run, `card.${word}`);
    const rng = structuredClone(run.rng), startCount = run.activeCardIds.length;
    const grant = grantStage2Entry(run);
    assert.equal(grant.cardInstanceIds.length, count); assert.equal(run.activeCardIds.length, startCount + count);
    assert.equal(grant.representativeVerbCardDefId, `card.${verb}`); assert.equal(grant.connectorCardDefId, `card.${marker}`);
    assert.equal(grant.witness?.found, true); assert.equal(new Set(grant.witness.cardIds).size, grant.witness.cardIds.length);
    assert.ok(grant.witness.cardIds.every(id => run.activeCardIds.includes(id))); assert.deepEqual(run.rng, rng);
    const snapshot = structuredClone(run); grantStage2Entry(run); assert.deepEqual(run, snapshot);
  }
});

test('0.2 entry does not fabricate missing NP materials or restore removed entry cards', () => {
  const run = runFor(); run.activeCardIds = []; run.cardInstances = {};
  own(run, 'card.make'); const grant = grantStage2Entry(run);
  assert.equal(grant.cardInstanceIds.length, 1); assert.equal(grant.witness, null); assert.ok(grant.warningKo);
  const id = grant.cardInstanceIds[0]; run.activeCardIds = run.activeCardIds.filter(cardId => cardId !== id); delete run.cardInstances[id];
  const snapshot = structuredClone(run); grantStage2Entry(run); assert.deepEqual(run, snapshot);
});

test('0.2 shop inventory is stable and consumes shop RNG only, with one rune and two distinct cards', () => {
  const run = runFor(), rng = structuredClone(run.rng); grantStage2Entry(run); const shop = createShop(run);
  assert.equal(shop.inventory.filter(item => item.kind === 'RUNE').length, 1);
  const cards = shop.inventory.filter(item => item.kind === 'CARD'); assert.equal(cards.length, 2); assert.notEqual(cards[0].cardDefId, cards[1].cardDefId);
  for (const stream of ['deck','reward','encounter']) assert.deepEqual(run.rng[stream], rng[stream]);
  assert.ok(run.rng.shop.cursor > rng.shop.cursor);
  const snapshot = structuredClone(run); createShop(run); assert.deepEqual(run, snapshot);
  const copy = structuredClone(run); createShop(copy); assert.deepEqual(copy, snapshot);
});

test('0.2 Topaz eligibility requires this run actual unlock and never enters legacy pools', () => {
  const run = runFor(); run.eligibility.runOwnUnlocks = [];
  assert.equal(eligibleRunes(run).length, 10); assert.ok(!eligibleRunes(run).some(r => r.id === 'rune.svoo'));
  run.eligibility.runStartUnlockBaseline.push('rune.svoo'); assert.ok(eligibleRunes(run).some(r => r.id === 'rune.svoo'));
  ownRune(run, 'rune.svoo', 3); assert.ok(!eligibleRunes(run).some(r => r.id === 'rune.svoo'));
  for (const version of ['0.1.0','0.1.1']) {
    run.version = version; assert.equal(eligibleRunes(run).length, 10);
    assert.ok(!eligibleRewardCards(run).some(card => ['card.send','card.for','card.picture'].includes(card.id)));
    assert.equal(eligibleRewardCards(run).length, registryForVersion(version).cards.filter(card => card.runtimeReady && card.rewardWeight > 0).length);
  }
});

test('corrupt frozen Topaz reward is rejected atomically for legacy or locked campaigns without rerolling', () => {
  for (const version of ['0.1.0','0.1.1','0.2.0']) {
    const run = runFor(); run.version = version; run.eligibility.runOwnUnlocks = version === '0.2.0' ? [] : ['rune.svoo'];
    run.reward = { offerId: 'corrupt.topaz', type: 'RUNE', resolved: false, choices: [{ choiceId: 'topaz', runeId: 'rune.svoo' }] };
    const before = structuredClone(run);
    assert.equal(resolveReward(run, run.reward.offerId, 'topaz').ok, false, version);
    assert.deepEqual(run, before, 'Reject without paying, acquiring or rerolling');
  }
  const unlocked = runFor();
  unlocked.reward = { offerId: 'valid.topaz', type: 'RUNE', resolved: false, choices: [{ choiceId: 'topaz', runeId: 'rune.svoo' }] };
  assert.equal(resolveReward(unlocked, 'valid.topaz', 'topaz').ok, true);
  assert.equal(unlocked.runes.instances[unlocked.runes.orderedInstanceIds[0]].runeId, 'rune.svoo');
  const excluded = runFor(); excluded.contentManifest = { runeIds: ['rune.short'] };
  excluded.reward = { offerId: 'excluded.topaz', type: 'RUNE', resolved: false, choices: [{ choiceId: 'topaz', runeId: 'rune.svoo' }] };
  const before = structuredClone(excluded);
  assert.equal(resolveReward(excluded, 'excluded.topaz', 'topaz').ok, false); assert.deepEqual(excluded, before);
});

test('0.2 shop card purchase is one atomic acquisition and duplicate/insufficient requests are no-ops', () => {
  const run = open(), item = run.shop.inventory.find(item => item.kind === 'CARD'), before = structuredClone(run), size = run.activeCardIds.length;
  assert.equal(buyShopItem(run, 'stale', item.itemId).ok, false); assert.deepEqual(run, before);
  run.economy.gold = item.price - 1; const poor = structuredClone(run);
  assert.equal(buyShopItem(run, run.shop.shopId, item.itemId).ok, false); assert.deepEqual(run, poor);
  run.economy.gold = item.price; assert.equal(buyShopItem(run, run.shop.shopId, item.itemId).ok, true);
  assert.equal(run.economy.gold, 0); assert.equal(run.activeCardIds.length, size + 1); assert.equal(item.purchased, true);
  assert.equal(run.cardInstances[item.resolution.cardInstanceId].cardDefId, item.cardDefId);
  assert.ok(run.vocabulary.encounteredLexemeIds.includes(registry.cardById[item.cardDefId].lexemeId)); assert.equal(run.combat, null);
  const done = structuredClone(run); assert.equal(buyShopItem(run, run.shop.shopId, item.itemId).ok, false); assert.deepEqual(run, done);
  assert.deepEqual(run.rng, before.rng);
});

test('0.2 full rune replacement can cancel without payment, then replace exactly one slot', () => {
  const run = open(), item = run.shop.inventory.find(item => item.kind === 'RUNE');
  const others = eligibleRunes(run).filter(rune => rune.id !== item.runeId).slice(0,3).map(rune => ownRune(run, rune.id));
  const before = structuredClone(run);
  assert.equal(buyShopItem(run, run.shop.shopId, item.itemId).needsReplacement, true); assert.deepEqual(run, before);
  assert.equal(buyShopItem(run, run.shop.shopId, item.itemId, { replaceRuneInstanceId: 'missing' }).ok, false); assert.deepEqual(run, before);
  assert.equal(buyShopItem(run, run.shop.shopId, item.itemId, { replaceRuneInstanceId: others[1] }).ok, true);
  assert.equal(run.runes.orderedInstanceIds.length, 3); assert.equal(run.runes.instances[others[1]], undefined);
  assert.equal(run.economy.gold, before.economy.gold - item.price); assert.deepEqual(run.rng, before.rng);
});

test('0.2 owned rune shop purchase upgrades once and maximum-level candidates are excluded', () => {
  const run = runFor(); const original = ownRune(run, 'rune.short', 2); grantStage2Entry(run);
  for (const rune of eligibleRunes(run).filter(r => r.id !== 'rune.short')) ownRune(run, rune.id, 3);
  createShop(run); run.status = 'SHOP'; const item = run.shop.inventory.find(item => item.kind === 'RUNE');
  assert.equal(item.runeId, 'rune.short'); assert.equal(item.ownedLevel, 2); assert.equal(item.offeredLevel, 3);
  assert.equal(buyShopItem(run, run.shop.shopId, item.itemId).ok, true); assert.equal(run.runes.instances[original].level, 3);
  const done = structuredClone(run); assert.equal(buyShopItem(run, run.shop.shopId, item.itemId).ok, false); assert.deepEqual(run, done);
  assert.ok(!eligibleRunes(run).some(r => r.id === 'rune.short'));
});

test('0.2 polish and paid removal each allow one independent service and reject incomplete targets without mutation', () => {
  const run = open(), shopId = run.shop.shopId, target = run.activeCardIds[0], second = run.activeCardIds[1];
  const before = structuredClone(run);
  assert.equal(useShopService(run, shopId, 'POLISH').needsTarget, true); assert.deepEqual(run, before);
  assert.equal(useShopService(run, shopId, 'POLISH', { targetCardInstanceId: 'missing' }).ok, false); assert.deepEqual(run, before);
  assert.equal(useShopService(run, shopId, 'POLISH', { targetCardInstanceId: target }).ok, true);
  assert.equal(run.cardInstances[target].polishLevel, 1); assert.equal(run.shop.services.POLISH.used, true);
  const polished = structuredClone(run);
  assert.equal(useShopService(run, shopId, 'POLISH', { targetCardInstanceId: second }).ok, false); assert.deepEqual(run, polished);
  assert.equal(useShopService(run, shopId, 'REMOVE', { targetCardInstanceId: second, confirmRemoval: true }).ok, true);
  assert.equal(run.economy.gold, before.economy.gold - 8 - 6); assert.equal(run.economy.paidRemovalCount, 1);
  assert.equal(run.cardInstances[second], undefined); assert.equal(run.shop.services.REMOVE.used, true); assert.deepEqual(run.rng, before.rng);
  const used = structuredClone(run); createShop(run); assert.deepEqual(run, used);
  assert.equal(useShopService(run, shopId, 'REMOVE', { targetCardInstanceId: target, confirmRemoval: true }).ok, false); assert.deepEqual(run, used);
});

test('0.2 free reward removal does not raise paid service price; last-card warning has no side effects', () => {
  const run = runFor(), card = run.activeCardIds[0];
  run.reward = { offerId: 'free.remove', type: 'MIXED', resolved: false, choices: [{ choiceId: 'remove', kind: 'SERVICE', serviceKind: 'REMOVE', targetCardIds: [...run.activeCardIds] }] };
  assert.equal(resolveReward(run, 'free.remove', 'remove', { targetCardInstanceId: card, confirmRemoval: true }).ok, true);
  assert.equal(run.economy.paidRemovalCount, 0); open(run); assert.equal(run.shop.services.REMOVE.price, 6);
  run.activeCardIds = [run.activeCardIds[0]]; run.cardInstances = { [run.activeCardIds[0]]: run.cardInstances[run.activeCardIds[0]] };
  const before = structuredClone(run);
  assert.equal(useShopService(run, run.shop.shopId, 'REMOVE', { targetCardInstanceId: run.activeCardIds[0] }).needsConfirmation, true);
  assert.deepEqual(run, before);
});

test('0.2 closing shop cannot reenter or transact and never consumes deck RNG itself', () => {
  const run = open(), beforeRng = structuredClone(run.rng), item = run.shop.inventory[0];
  assert.equal(closeShop(run, run.shop.shopId).ok, true); const closed = structuredClone(run);
  assert.equal(closeShop(run, run.shop.shopId).ok, false); assert.equal(buyShopItem(run, run.shop.shopId, item.itemId).ok, false);
  assert.deepEqual(run, closed); assert.deepEqual(run.rng, beforeRng);
});

test('0.2 global rewards 4..6 use normal table, 7 uses actual boss, and intro only occurs at global 2', () => {
  for (const battle of [4,5,6,7]) {
    const run = runFor(`reward-${battle}`); run.progress.roundIndex = battle - 4; run.progress.battleNumber = battle;
    run.combat = { enemyState: getEncounter('stage.02', battle - 4) };
    const offer = createRewardOffer(run, { firstRuneIntroSeen: false });
    assert.equal(offer.type, 'MIXED'); assert.equal(offer.firstRuneIntro, false); assert.equal(offer.choices.length, 3);
    const draws = offer.trace.filter(entry => entry.kind === 'SLOT_TYPE_DRAW'); assert.equal(draws.length, 3);
    const table = battle === 7 ? REWARD_BALANCE.regionalBoss : REWARD_BALANCE.normal;
    for (const draw of draws) for (const [key,value] of Object.entries(draw.weights)) assert.equal(value, table[key]);
    assert.equal(offer.skipGold, offer.choices.some(choice => choice.kind === 'CARD') ? 3 : 2);
  }
});

test('0.1.0/0.1.1 future rewards keep original main candidate order, exact frozen choices and RNG across 72 cases', async () => {
  // Golden output was independently generated by the untouched source at the recorded main SHA.
  // It protects legacy continuation, not a requirement for 0.2 seeds to match older versions.
  const baseline = JSON.parse(await readFile(new URL('./fixtures/legacy-reward-baseline-0.1.json', import.meta.url), 'utf8'));
  assert.equal(baseline.sourceCommit, '2fdafeba8c93435844eef2d7aec0f3e25509bde9');
  const starter = generateStarterDeck({ seed: baseline.starterSeed, vocabularyMode: 'BEGINNER' });
  for (const entry of baseline.cases) {
    const run = { version: entry.version, runId: 'legacy.reference', progress: { stageId: 'stage.01', roundIndex: entry.battle - 1, battleNumber: entry.battle },
      activeCardIds: structuredClone(starter.activeCardIds), cardInstances: structuredClone(starter.cardInstances), vocabulary: structuredClone(starter.vocabulary),
      rng: createRng(`legacy-reward-${entry.seed}`), runes: { orderedInstanceIds: [], instances: {}, slotLimit: 3 }, economy: { gold: 10 },
      tutorial: { isIntroRun: false }, reward: null, eligibility: { runStartUnlockBaseline: eligibleRunes({ version: '0.1.1', runes: { orderedInstanceIds: [], instances: {} } }).map(r => r.id), runOwnUnlocks: ['rune.svoo'] }, combat: null };
    createRewardOffer(run, { firstRuneIntroSeen: true });
    const sha256 = createHash('sha256').update(JSON.stringify({ offer: run.reward, rng: run.rng.reward, vocabulary: run.vocabulary })).digest('hex');
    assert.equal(sha256, entry.sha256, `${entry.version}, seed=${entry.seed}, battle=${entry.battle}`);
  }
  assert.equal(baseline.cases.length, 72);
});
