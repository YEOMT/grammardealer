import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { generateStarterDeck, createBattlePiles, VOCABULARY_MODES } from '../src/game/deck.js';
import { createSentenceSnapshot, lexemeForCard, LANGUAGE_VERSION } from '../src/data/language/index.js';
import { analyzeSentence } from '../src/engine/grammar/index.js';
import { assertCardConservation } from '../src/game/invariants.js';
import { RNG_ALGORITHM_VERSION } from '../src/game/rng.js';

const seedsPerMode = Number(process.env.DECK_SEEDS_PER_MODE || 2500);
if (!Number.isSafeInteger(seedsPerMode) || seedsPerMode < 1) throw new Error('DECK_SEEDS_PER_MODE must be positive integer');
const started = performance.now();
const report = {
  status: 'RUNNING', testedAt: new Date().toISOString(), nodeVersion: process.version,
  languageVersion: LANGUAGE_VERSION, rngAlgorithm: RNG_ALGORITHM_VERSION,
  command: 'npm run test:decks', seedsPerMode, total: seedsPerMode * VOCABULARY_MODES.length,
  policy: '0.1.1 actual 28-card decks, clear SV opening and be+adjective tutorial path in same real six cards; no victory-rate claim.',
  seedPattern: 'batch.<0..2499>', modes: {}, failures: [],
};
for (const mode of VOCABULARY_MODES) {
  const stats = { decksChecked: 0, physicalCards: 0, repairs: 0, repairedDecks: 0, fallbackDecks: 0, bandFallbacks: 0, openingsChecked: 0, openingFrames: {}, vocabularyBands: {}, openingSamples: [], distinctDecks: 0 };
  const fingerprints = new Set();
  for (let index = 0; index < seedsPerMode; index += 1) {
    const seed = `batch.${index}`;
    try {
      const deck = generateStarterDeck({ seed, vocabularyMode: mode });
      if (deck.activeCardIds.length !== 28 || new Set(deck.activeCardIds).size !== 28) throw new Error('Deck size or ID duplication');
      const frames = new Set(deck.witnesses.map(w => w.frameId));
      for (const frame of ['frame.sv', 'frame.svc.adj', 'frame.svc.np', 'frame.svo']) if (!frames.has(frame)) throw new Error(`Missing ${frame}`);
      for (const witness of deck.witnesses) {
        const actual = analyzeSentence(createSentenceSnapshot(witness.slots, deck.cardInstances));
        if (actual.status !== 'VALID' || actual.mainFrameId !== witness.frameId) throw new Error('Coverage witness not validated by actual parser');
      }
      const piles = createBattlePiles({ ...deck, stream: deck.rng.deck, focusFrame:'frame.sv', tutorial:true });
      assertCardConservation(deck.activeCardIds, piles, deck.cardInstances);
      if (piles.handIds.length !== 6 || !piles.openingTrace.guaranteed) throw new Error('No six-card guaranteed opening');
      if (!piles.openingTrace.witnessSlots.every(s => piles.handIds.includes(s.cardInstanceId))) throw new Error('Witness uses unavailable card');
      const snapshot = createSentenceSnapshot(piles.openingTrace.witnessSlots, deck.cardInstances);
      if (analyzeSentence(snapshot).status !== 'VALID'||piles.openingTrace.frameId!=='frame.sv') throw new Error('Opening SV witness not valid');
      const beSlots=piles.openingTrace.beWitnessSlots;
      if(!beSlots.length||beSlots.some(s=>!piles.handIds.includes(s.cardInstanceId))||analyzeSentence(createSentenceSnapshot(beSlots,deck.cardInstances)).status!=='VALID')throw new Error('Tutorial be path missing from real six-card opening');
      stats.decksChecked += 1; stats.openingsChecked += 1; stats.physicalCards += deck.activeCardIds.length;
      stats.repairs += deck.generationTrace.repairs.length;
      if (deck.generationTrace.repairs.length) stats.repairedDecks += 1;
      if (deck.generationTrace.fallbackUsed) stats.fallbackDecks += 1;
      stats.bandFallbacks += deck.generationTrace.bandFallbacks.length;
      stats.openingFrames[piles.openingTrace.frameId] = (stats.openingFrames[piles.openingTrace.frameId] || 0) + 1;
      for (const card of Object.values(deck.cardInstances)) {
        const band = lexemeForCard(card).vocabBand;
        stats.vocabularyBands[band] = (stats.vocabularyBands[band] || 0) + 1;
      }
      fingerprints.add(Object.values(deck.cardInstances).map(c => c.cardDefId).join('|'));
      if (stats.openingSamples.length < 8) stats.openingSamples.push({ seed, frameId: piles.openingTrace.frameId, text: snapshot.orderedTokens.map(t => t.surface).join(' '), handCount: piles.handIds.length });
    } catch (error) {
      report.failures.push({ mode, seed, error: error.message });
      if (report.failures.length >= 50) break;
    }
  }
  stats.distinctDecks = fingerprints.size;
  stats.correctionRate = stats.repairedDecks / seedsPerMode;
  stats.fallbackRate = stats.fallbackDecks / seedsPerMode;
  report.modes[mode] = stats;
  process.stdout.write(`${mode}: ${stats.decksChecked}/${seedsPerMode}, repairs=${stats.repairedDecks}, fallback=${stats.fallbackDecks}\n`);
}
report.durationMs = Math.round(performance.now() - started);
report.status = report.failures.length ? 'FAIL' : 'PASS';
report.notProofOfWinRate = true;
report.limitations = ['Parser self-check is complemented by manually specified grammar acceptance tests.', 'This batch validates starting structure and hand accessibility, not all human strategies or combat win rates.'];
await fs.mkdir('docs', { recursive: true });
const destination = path.resolve('docs/deck-validation.json');
await fs.writeFile(destination, JSON.stringify(report, null, 2) + '\n');
process.stdout.write(`${report.status}: ${report.total} requested deck+opening checks in ${report.durationMs} ms → ${destination}\n`);
if (report.status !== 'PASS') process.exitCode = 1;
