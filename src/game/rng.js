/** The version is persisted with every run; never change this algorithm in place. */
export const RNG_ALGORITHM_VERSION = 'mulberry32-fnv1a-v1';
export const RNG_STREAMS = Object.freeze(['deck', 'reward', 'shop', 'encounter']);

/** Stable UTF-16 FNV-1a seed hash. No locale or runtime-global randomness. */
export function hashSeed(seed) {
  if (typeof seed !== 'string' && typeof seed !== 'number') throw new TypeError('Seed must be a string or number');
  if (typeof seed === 'number' && !Number.isFinite(seed)) throw new TypeError('Seed must be finite');
  let value = 2166136261;
  for (const char of String(seed)) {
    for (let i = 0; i < char.length; i += 1) value = Math.imul(value ^ char.charCodeAt(i), 16777619);
  }
  return value >>> 0;
}

/** @returns {{state:number,cursor:number}} A serializable stream, independent of other streams. */
export function createStream(seed, name = 'deck') {
  return { state: hashSeed(`${String(seed)}\u0000${name}`), cursor: 0 };
}

/** Create the four game streams. Identifying run IDs must never enter this seed. */
export function createRng(seed) {
  return { algorithmVersion: RNG_ALGORITHM_VERSION, ...Object.fromEntries(RNG_STREAMS.map(name => [name, createStream(seed, name)])) };
}

export function assertStream(stream) {
  if (!stream || !Number.isInteger(stream.state) || stream.state < 0 || stream.state > 0xffffffff ||
      !Number.isSafeInteger(stream.cursor) || stream.cursor < 0) throw new TypeError('Invalid RNG stream');
  return stream;
}

/** Advance only the passed mutable stream; controllers call this on their proposed state clone. */
export function nextFloat(stream) {
  assertStream(stream);
  if (stream.cursor === Number.MAX_SAFE_INTEGER) throw new RangeError('RNG cursor exhausted');
  stream.state = (stream.state + 0x6d2b79f5) >>> 0;
  let value = stream.state;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  stream.cursor += 1;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

/** @param {number} max Exclusive positive integer bound. */
export function randomInt(stream, max) {
  if (!Number.isSafeInteger(max) || max < 1) throw new RangeError('Random bound must be a positive integer');
  return Math.floor(nextFloat(stream) * max);
}

export function pick(stream, values) {
  if (!Array.isArray(values) || !values.length) throw new RangeError('Cannot pick from an empty pool');
  return values[randomInt(stream, values.length)];
}

/** Fisher–Yates returns a copy and consumes n-1 draws, never changes its source array. */
export function shuffle(stream, values) {
  if (!Array.isArray(values)) throw new TypeError('Shuffle input must be an array');
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(stream, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Weighted keys are sorted by code-unit order, independent of the host locale. */
export function weightedPick(stream, weights) {
  const entries = Object.entries(weights).filter(([, n]) => Number.isFinite(n) && n > 0).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  const total = entries.reduce((sum, [, n]) => sum + n, 0);
  if (!entries.length || !Number.isFinite(total)) throw new RangeError('No finite positive weighted choices');
  let value = nextFloat(stream) * total;
  for (const [key, weight] of entries) {
    value -= weight;
    if (value < 0) return key;
  }
  return entries.at(-1)[0];
}

export function assertRng(rng) {
  if (!rng || rng.algorithmVersion !== RNG_ALGORITHM_VERSION) throw new TypeError('Unsupported RNG algorithm');
  RNG_STREAMS.forEach(name => assertStream(rng[name]));
  return rng;
}
