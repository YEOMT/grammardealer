import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { simulateRun } from './simulate-runs.js';
import { RunController } from '../src/game/runController.js';
import { VOCABULARY_MODES, findPlayableSentences } from '../src/game/deck.js';
import { registryForVersion } from '../src/data/language/index.js';
import { assertRunInvariants } from '../src/game/invariants.js';

/** Real Stage 1 command play precedes every inspected entry. No injected HP, gold, cards or RNG. */
export function inspectStage2Entry(seed, vocabularyMode) {
  const played = simulateRun({ seed, vocabularyMode, policy: 'LEARNING', stopAtShop: true, exerciseResources: false });
  const record = { seed, vocabularyMode, result: played.result, battle: played.final?.battle,
    commands: played.commands, stats: played.stats };
  if (played.result === 'ENGINE_OR_POLICY_ERROR') return { ...record, error: played.error };
  if (played.result !== 'SHOP') return record;
  try {
    const run = played.checkpoint, language = registryForVersion(run.version), grant = run.entryGrants['stage.02'];
    const granted = new Set(grant.cardInstanceIds);
    assert.ok(granted.size <= 2); assert.equal(granted.size, grant.cardInstanceIds.length);
    assert.equal(run.activeCardIds.length, new Set(run.activeCardIds).size);
    assert.ok([...granted].every(id => run.cardInstances[id] && run.activeCardIds.includes(id)));
    const beforeDefinitions = run.activeCardIds.filter(id => !granted.has(id)).map(id => language.cardById[run.cardInstances[id].cardDefId]);
    const svooBinding = card => language.lexemeById[card.lexemeId].senseIds.flatMap(id => language.senseById[id].frameBindings)
      .find(binding => binding.frameId === 'frame.svoo' && binding.runtimeReady);
    const ownedVerbs = beforeDefinitions.filter(svooBinding);
    const grantedDefinitions = [...granted].map(id => language.cardById[run.cardInstances[id].cardDefId]);
    const verbGrants = grantedDefinitions.filter(svooBinding);
    assert.equal(verbGrants.length, ownedVerbs.length ? 0 : 1, 'No redundant verb grant');
    const representative = language.cardById[grant.representativeVerbCardDefId];
    const marker = `card.${svooBinding(representative).dativePreposition}`;
    assert.equal(grant.connectorCardDefId, marker);
    assert.equal(grantedDefinitions.filter(card => card.id === marker).length, beforeDefinitions.some(card => card.id === marker) ? 0 : 1, 'No redundant connector grant');
    assert.equal(grantedDefinitions.length, verbGrants.length + (beforeDefinitions.some(card => card.id === marker) ? 0 : 1));
    const witness = findPlayableSentences(run.activeCardIds, run.cardInstances, { registry: language, includeSvoo: true, frames: ['frame.svoo'], perFrame: 1, maxChecks: 2048 })[0];
    assert.equal(Boolean(grant.witness), Boolean(witness));
    if (witness) assert.equal(new Set(witness.slots.map(slot => slot.cardInstanceId)).size, witness.slots.length);

    // Save/restore the actual shop checkpoint, make the same public affordable purchase, then leave.
    // Both controllers must produce the same next opening without rerolling inventory or rewards.
    const controllers = [new RunController({ initialState: run }), new RunController({ initialState: structuredClone(run) })];
    const affordableCard = run.shop.inventory.find(item => item.kind === 'CARD' && item.price <= run.economy.gold);
    for (const controller of controllers) {
      if (affordableCard) assert.equal(controller.dispatch({ type: 'SHOP_BUY', shopId: run.shop.shopId, itemId: affordableCard.itemId }).ok, true);
      const left = controller.dispatch({ type: 'LEAVE_SHOP', shopId: run.shop.shopId });
      assert.equal(left.ok, true, left.message);
      assertRunInvariants(controller.getState(), language);
    }
    const after = controllers[0].getState();
    assert.deepEqual(after, controllers[1].getState());
    assert.equal(after.progress.battleNumber, 4); assert.equal(after.combat.enemyState.hp, 220);
    assert.ok(after.rng.deck.cursor > run.rng.deck.cursor);
    for (const stream of ['reward','shop','encounter']) assert.deepEqual(after.rng[stream], run.rng[stream]);
    return { ...record, gold: run.economy.gold, grantCount: granted.size, grantCardDefIds: grantedDefinitions.map(card => card.id),
      representativeVerb: representative.id, connector: marker, witnessFound: Boolean(witness), warning: grant.warningKo || null,
      entryDeckCount: run.activeCardIds.length, purchase: affordableCard ? { cardDefId: affordableCard.cardDefId, price: affordableCard.price } : null,
      nextHandCount: after.combat.handIds.length, nextDrawDeterministic: true, invariantChecks: 'PASS' };
  } catch (error) { return { ...record, result: 'ENTRY_VALIDATION_ERROR', error: error.message }; }
}

async function main() {
  const started = performance.now(), seeds = Array.from({ length: 100 }, (_, index) => `entry-sequence.${index}`), runs = [];
  for (const vocabularyMode of VOCABULARY_MODES) {
    for (const [index, seed] of seeds.entries()) {
      const result = inspectStage2Entry(seed, vocabularyMode); runs.push(result);
      if ((index + 1) % 25 === 0) console.log(`${vocabularyMode}: ${index + 1}/100 inspected`);
    }
  }
  const arrived = runs.filter(run => run.result === 'SHOP'), gold = arrived.map(run => run.gold).sort((a,b) => a-b);
  const errors = runs.filter(run => ['ENGINE_OR_POLICY_ERROR','ENTRY_VALIDATION_ERROR'].includes(run.result));
  const report = { generatedAt: new Date().toISOString(), command: 'node tools/simulate-entry.js', nodeVersion: process.version,
    source: 'Actual controller commands for Stage 1, then entry and an affordable public card purchase if possible, shop leave, and duplicate save restore comparison.',
    status: errors.length ? 'FAIL' : 'PASS', totalRuns: runs.length, arrived: arrived.length, stage1Defeats: runs.filter(run => run.result === 'DEFEAT').length,
    technicalOrPolicyErrors: errors.length, missingWitnesses: arrived.filter(run => !run.witnessFound).length,
    grantCounts: arrived.reduce((counts, run) => (counts[run.grantCount] = (counts[run.grantCount] ?? 0) + 1, counts), {}),
    firstShopGold: { min: gold[0] ?? null, median: gold.length ? gold[Math.floor(gold.length / 2)] : null, max: gold.at(-1) ?? null },
    durationMs: Math.round(performance.now() - started),
    limitations: ['Command-level QA is not browser/UI verification.', 'Stage 1 defeats remain in the denominator; no seed rerolls or state repairs.',
      'The policy searches only the current hand during battles; full owned deck inspection is used only after actual Stage 2 entry to validate grants.'], runs };
  const output = path.resolve('.local-validation/v02-entry/report.json');
  await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, totalRuns: report.totalRuns, arrived: report.arrived, stage1Defeats: report.stage1Defeats,
    technicalOrPolicyErrors: report.technicalOrPolicyErrors, missingWitnesses: report.missingWitnesses, grantCounts: report.grantCounts, firstShopGold: report.firstShopGold, durationMs: report.durationMs }));
  if (errors.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
