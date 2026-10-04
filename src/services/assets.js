/** Asset IDs are stable. Missing optional art resolves to a local emoji, never a URL request. */
export const ASSETS = Object.freeze({
  'enemy.stage1.01': Object.freeze({ kind: 'emoji', value: '🌱', labelKo: '풀잎 슬라임' }),
  'enemy.stage1.02': Object.freeze({ kind: 'emoji', value: '🐌', labelKo: '숲 달팽이' }),
  'boss.stage1': Object.freeze({ kind: 'emoji', value: '🌳', labelKo: '초원 수호자' }),
  'character.traveler': Object.freeze({ kind: 'emoji', value: '🧭', labelKo: '여행자' }),
  'bgm.meadow': Object.freeze({ kind: 'unavailable', value: null, labelKo: '시작의 초원 BGM (후속)' }),
});

/** @param {string} assetId @param {string} [fallback] */
export function resolveAsset(assetId, fallback = '✦') {
  if (typeof assetId !== 'string') throw new TypeError('assetId must be a string');
  return ASSETS[assetId] ?? { kind: 'emoji', value: fallback, labelKo: '대체 이미지' };
}

/** Resolve registered project-relative files after art is added. Unregistered IDs do not fetch. */
export function assetUrl(assetId, manifest = {}, base = import.meta.env?.BASE_URL ?? './') {
  if (typeof assetId !== 'string') throw new TypeError('assetId must be a string');
  const path = manifest[assetId];
  if (typeof path !== 'string' || !path || path.startsWith('/') || path.includes('..') || /^[a-z]+:/i.test(path)) return null;
  return `${base.replace(/\/?$/, '/')}${path}`;
}

/** @param {HTMLElement} element @param {string} assetId @param {string} [fallback] */
export function renderAsset(element, assetId, fallback) {
  if (!element || typeof element.setAttribute !== 'function') throw new TypeError('asset element required');
  const asset = resolveAsset(assetId, fallback);
  element.textContent = asset.kind === 'emoji' ? asset.value : '';
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', asset.labelKo);
  return asset;
}
