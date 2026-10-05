import { assertRng } from './rng.js';
import {validateTimeGolem} from '../engine/timeGolem.js';

const assert = (condition, message) => { if (!condition) throw new Error(`State invariant: ${message}`); };
const nonnegative = value => Number.isSafeInteger(value) && value >= 0;

/** Verify the physical-card partition. Read only; safe to call before committing state. */
export function assertCardConservation(activeCardIds, piles, cardInstances) {
  assert(Array.isArray(activeCardIds), 'activeCardIds must be an array');
  assert(new Set(activeCardIds).size === activeCardIds.length, 'duplicate active card ID');
  const ids = [...piles.drawIds, ...piles.handIds, ...piles.sentenceSlots.map(slot => slot.cardInstanceId), ...piles.discardIds];
  assert(ids.length === activeCardIds.length, 'pile count differs from active deck');
  assert(new Set(ids).size === ids.length, 'card occurs in more than one pile');
  const active = new Set(activeCardIds);
  assert(ids.every(id => typeof id === 'string' && active.has(id)), 'unknown card in pile');
  if (cardInstances) {
    for (const id of activeCardIds) {
      assert(cardInstances[id]?.instanceId === id, `missing instance ${id}`);
    }
  }
  return true;
}

/** Pile and resource constraints, independent of DOM and animation state. */
export function assertCombatInvariants(activeCardIds, combat, cardInstances) {
  assertCardConservation(activeCardIds, combat, cardInstances);
  const rules = combat.rulesSnapshot || {};
  assert(combat.handIds.length <= (rules.handLimit ?? 10), 'hand exceeds limit');
  assert(combat.sentenceSlots.length <= (rules.sentenceLimit ?? 16), 'sentence exceeds limit');
  if (combat.turnsRemaining !== undefined) assert(nonnegative(combat.turnsRemaining), 'invalid remaining turns');
  if (combat.exchangesRemaining !== undefined) assert(nonnegative(combat.exchangesRemaining), 'invalid remaining exchanges');
  const hp = combat.enemyState?.hp ?? combat.enemyState?.hpRemaining;
  if (hp !== undefined) assert(nonnegative(hp), 'invalid enemy HP');
  if(combat.enemyState?.bossMechanic?.id==='TIME_GOLEM')validateTimeGolem(combat.enemyState);
  return true;
}

/** Validation shared by RunController and storage. Optional registry strengthens foreign-ID checks. */
export function assertRunInvariants(run, registry) {
  assert(run && typeof run === 'object', 'run must be an object');
  assert(typeof run.runId === 'string' && run.runId.length > 0, 'missing run ID');
  assert(nonnegative(run.revision), 'invalid revision');
  assert(Array.isArray(run.activeCardIds), 'missing active deck');
  assert(new Set(run.activeCardIds).size === run.activeCardIds.length, 'duplicate active card ID');
  assert(run.cardInstances && typeof run.cardInstances === 'object', 'missing card instances');
  for (const id of run.activeCardIds) {
    const card = run.cardInstances[id];
    assert(card?.instanceId === id, `missing card ${id}`);
    assert(typeof card.cardDefId === 'string', 'missing card definition');
    assert(nonnegative(card.polishLevel) && card.polishLevel <= 3, 'invalid polish level');
    assert(card.specialEffectId === null || card.specialEffectId === undefined, 'unsupported special card effect');
    if (registry) assert(Boolean(registry.cardById[card.cardDefId]), 'unknown card definition');
  }
  if (run.combat) assertCombatInvariants(run.activeCardIds, run.combat, run.cardInstances);
  if (run.economy) assert(nonnegative(run.economy.gold), 'invalid gold');
  if (run.rng) assertRng(run.rng);
  return true;
}

/** Result form is convenient for safely rejecting corrupt stored state without modifying it. */
export function validateRunState(run, registry) {
  try { assertRunInvariants(run, registry); return { valid: true, errors: [] }; }
  catch (error) { return { valid: false, errors: [error.message] }; }
}
