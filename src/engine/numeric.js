/** Reject non-integer and unsafe gameplay values before arithmetic. */
export function safeInteger(value, name = 'value', { min = -Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min) throw new RangeError(`${name} must be a safe integer >= ${min}`);
  return value;
}

/** Integer-only arithmetic. The multiplication itself must remain safely representable. */
export function addSafe(before, amount) {
  safeInteger(before, 'before');
  safeInteger(amount, 'amount');
  return safeInteger(before + amount, 'sum');
}

/** @param {number} before @param {{num:number,den:number}} ratio */
export function multiplyFloor(before, ratio) {
  safeInteger(before, 'before', { min: 0 });
  if (!ratio || typeof ratio !== 'object') throw new TypeError('A rational multiplier is required');
  safeInteger(ratio.num, 'numerator', { min: 0 });
  safeInteger(ratio.den, 'denominator', { min: 1 });
  const product = safeInteger(before * ratio.num, 'multiplication product', { min: 0 });
  return safeInteger(Math.floor(product / ratio.den), 'multiplication result', { min: 0 });
}

/** Creates only recorded events; presentation must replay these values without recalculation. */
export function scoreEvent({ attackId, index, phase, sourceType, sourceId, labelKo, operation, operand,
  before, evidenceRefs = [], highlightCardIds = [], ...extra }) {
  if (typeof attackId !== 'string' || !attackId) throw new TypeError('attackId is required');
  safeInteger(index, 'event index', { min: 0 });
  safeInteger(before, 'event before');
  let after;
  if (operation === 'ADD') after = addSafe(before, operand);
  else if (operation === 'MULTIPLY') after = multiplyFloor(before, operand);
  else if (operation === 'CLAMP_ZERO') after = Math.max(0, before);
  else if (operation === 'SET') after = safeInteger(operand, 'set operand', { min: 0 });
  else throw new TypeError(`Unsupported score operation: ${operation}`);
  return {
    eventId: `${attackId}:score.${index}`, phase, sourceType, sourceId, labelKo, operation,
    operand: operand && typeof operand === 'object' ? { ...operand } : operand,
    before, after, evidenceRefs: [...new Set(evidenceRefs)], highlightCardIds: [...new Set(highlightCardIds)], ...extra,
  };
}
