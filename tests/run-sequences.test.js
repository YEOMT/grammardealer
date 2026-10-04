import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateRun } from '../tools/simulate-runs.js';
import { VOCABULARY_MODES } from '../src/game/deck.js';

for (const vocabularyMode of VOCABULARY_MODES) {
  test(`C12 R01 R02 R17: physical-card Stage 1 sequence / ${vocabularyMode}`, () => {
    for (const seed of ['run-sequence.0', 'run-sequence.1', 'run-sequence.2']) {
      const result = simulateRun({ seed, vocabularyMode, campaignVersion:'0.1.1' });
      assert.equal(result.result, 'CONTENT_COMPLETE', result.error || `${seed}: QA policy failed to complete`);
      assert.equal(result.contentBoundary, 'STAGE1_END');
      assert.equal(result.final.gold, 10 + result.actions.filter(a=>a.action==='FINISH_PRESENTATION'&&a.after.status==='REWARD').reduce((sum,a)=>sum+a.after.turnsRemaining,0), 'Base gold plus post-kill remaining turns');
      assert.equal(result.profileStage1Runs, 1); assert.equal(result.storyClearCount, 0);
      assert.deepEqual(result.battles.map(b => b.startingHp), [91, 156, 286]);
      assert.ok(result.battles.every(b => b.openingHand.length === 6));
      assert.equal(result.rewards[0].type, 'MIXED');
      assert.equal(result.rewards[1].type, 'RUNE_INTRO'); assert.equal(result.rewards[1].firstRuneIntro, true);
      assert.deepEqual(result.rewards[1].choices, ['rune.perfectSentence', 'rune.short', 'rune.discards']);
      assert.ok(result.stats.exchanges >= 1 && result.stats.preparations >= 1);
      assert.ok(result.actions.some(a => a.action === 'NEXT_BATTLE'));
      assert.ok(result.actions.every(a => a.action !== 'SKIP_REWARD'));
      for (const action of result.actions.filter(a => a.action === 'SUBMIT')) {
        assert.equal(new Set(action.usedCardIds).size, action.usedCardIds.length);
        assert.equal(action.after.turnsRemaining, action.before.turnsRemaining - 1);
        assert.equal(action.after.hp, Math.max(0, action.before.hp - action.expectedPower));
        assert.equal(action.after.discard, action.before.discard + action.usedCardIds.length);
      }
      for (const action of result.actions.filter(a => a.action === 'EXCHANGE')) {
        assert.equal(action.after.turnsRemaining, action.before.turnsRemaining);
        assert.equal(action.after.exchangesRemaining, action.before.exchangesRemaining - 1);
        assert.equal(action.after.hand, action.before.hand);
      }
    }
  });
}

test('Same seed/mode/choices reproduce real attack texts and power despite different run IDs', () => {
  const first = simulateRun({ seed: 'run-sequence.2', vocabularyMode: 'FREE' });
  const second = simulateRun({ seed: 'run-sequence.2', vocabularyMode: 'FREE' });
  const attacks = run => run.actions.filter(a => a.action === 'SUBMIT').map(a => [a.before.battle, a.sentence, a.expectedPower]);
  assert.deepEqual(attacks(first), attacks(second));
  assert.deepEqual(first.stats, second.stats);
  assert.deepEqual(first.battles, second.battles);
});
