/** Isolated renderer browser verification; synthetic fixtures never enter run records. */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><title>연출 샘플 · 실제 판정 아님</title>
<style>body{background:#132827;color:#e1ede8;font:18px system-ui;margin:40px}main{position:relative;padding:40px;border:1px solid #53746a;border-radius:20px}h1{font-size:22px}aside{font-size:14px;color:#8fa99e}section{min-height:130px;display:flex;align-items:center;gap:24px;margin-top:70px}.card{position:relative;background:#345449;border:2px solid #779989;border-radius:14px;padding:22px;font-size:24px}.presentation-highlight{outline:4px solid #d5c274}[data-presentation=score]{font-size:48px}[data-presentation=enemy]{font-size:64px;float:right}[data-presentation=log]{font-size:14px;min-height:70px;color:#b5cabc}[data-rune-id]{padding:14px;border:1px solid #d5c274;display:inline-block}</style>
<main><h1>연출 샘플 · 실제 판정 아님</h1><aside>격리된 합성 렌더러 검사 · 문법 지원/학생 기록/보상에 반영되지 않습니다.</aside>
<div data-presentation="enemy">🌳</div><p data-presentation="hp">70 / 70</p><div data-presentation="label"></div><div data-presentation="score">0</div><div data-presentation="power"></div><div data-presentation="log"></div>
<section data-presentation="sentence"><article class="card" data-card-id="c1">I</article><article class="card" data-card-id="c2">run</article><article class="card" data-card-id="c3">with</article><article class="card" data-card-id="c4">dogs</article></section><div data-rune-id="rune.short">호박 룬</div></main></html>`;
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(request.url.split('?')[0]);
    if (path === '/') { response.setHeader('Content-Type', 'text/html'); response.end(html); return; }
    if (!path.startsWith('/src/') || path.includes('..')) { response.statusCode = 404; response.end(); return; }
    response.setHeader('Content-Type', 'text/javascript'); response.end(await readFile(resolve(root, '.' + path)));
  } catch { response.statusCode = 404; response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(async () => {
    const { createDOMPresentation, connect, playAttack } = await import('/src/engine/presentation.js');
    const root = document.querySelector('main');
    window.adapter = createDOMPresentation(root, { hpMax: 70 });
    connect(root, 'c1', ['c2', 'c4']);
    window.playAttack = playAttack;
  });
  assert.equal(await page.locator('svg[data-presentation=connector] path').count(), 2);
  await mkdir(resolve(root, 'docs/evidence'), { recursive: true });
  await page.screenshot({ path: resolve(root, 'docs/evidence/presentation-connect-fixture.png') });
  await page.evaluate(() => {
    window.events = [];
    const originalImpact = window.adapter.impact;
    window.adapter.impact = data => { window.events.push(['impact', performance.now(), data.hpAfter]); originalImpact(data); };
    const originalScore = window.adapter.onScore;
    window.adapter.onScore = (event, detail) => { window.events.push(['score', performance.now(), event.after, document.querySelector('[data-presentation=hp]').textContent]); originalScore(event, detail); };
    window.resolution = { attackId: 'presentation-only', scoreTimeline: [
      { eventId: 'e1', phase: 'CARD_BASE', sourceType: 'CARD', sourceId: 'c1', before: 0, after: 10, highlightCardIds: ['c1'], labelKo: '카드 기본점수 +10' },
      { eventId: 'e2', phase: 'CARD_BASE', sourceType: 'CARD', sourceId: 'c2', before: 10, after: 20, highlightCardIds: ['c2'], labelKo: '카드 기본점수 +10' },
      { eventId: 'e3', phase: 'MAIN_FRAME', sourceType: 'GRAMMAR', before: 20, after: 40, highlightCardIds: ['c1','c2'], labelKo: '합성 1형식 연출' },
      { eventId: 'e4', phase: 'RUNES', sourceType: 'RUNE', sourceId: 'rune.short', before: 40, after: 50, labelKo: '합성 호박 룬 ×1.25' },
    ], analysis: { resolvedTokenRoles: [{ cardInstanceId: 'c1', role: 'S' }, { cardInstanceId: 'c2', role: 'V' }] }, finalPower: 50, enemyHpBefore: 70, enemyHpAfter: 20, actualHpLoss: 50, overkill: 0, killed: false };
    window.startedAt = performance.now();
    window.playing = window.playAttack(window.resolution, window.adapter).then(result => { window.result = { ...result, elapsed: performance.now() - window.startedAt }; });
  });
  await page.waitForFunction(() => window.events.some(entry => entry[0] === 'score'));
  assert.equal(await page.locator('[data-presentation=hp]').textContent(), '70 / 70');
  await page.screenshot({ path: resolve(root, 'docs/evidence/presentation-score-fixture.png') });
  await page.waitForFunction(() => window.result);
  assert.equal(await page.locator('[data-presentation=hp]').textContent(), '20 / 70');
  assert.equal(await page.locator('main').getAttribute('aria-busy'), 'false');
  const result = await page.evaluate(() => ({ ...window.result, events: window.events }));
  assert.equal(result.status, 'FINISHED'); assert.ok(result.elapsed >= 1500 && result.elapsed < 3300);
  assert.ok(result.events.filter(entry => entry[0] === 'score').every(entry => entry[3] === '70 / 70'));
  const fallback = await page.evaluate(async () => {
    const bad = { ...window.adapter, onScore() { throw new Error('synthetic rendering failure'); } };
    return window.playAttack(window.resolution, bad, { effectsOff: true });
  });
  assert.equal(fallback.status, 'FAST_FORWARDED');
  assert.equal(await page.locator('main').getAttribute('aria-busy'), 'false');
  assert.deepEqual(errors, []);
  const report = { executionStatus: 'PASS', browser: await browser.version(), fixtureKind: 'PRESENTATION_ONLY_NOT_GRAMMAR', checks: ['SVG connects two actual cards', 'score before/after rendered from events', 'HP unchanged before impact', 'HP changes at impact', 'bounded real timeline', 'renderer exception releases input'], ...result };
  await writeFile(resolve(root, 'docs/evidence/presentation-browser.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); server.close(); }
