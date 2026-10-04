import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPresentationTimeline, playAttack } from '../src/engine/presentation.js';
import { AudioManager } from '../src/services/audio.js';
import { resolveAsset, assetUrl } from '../src/services/assets.js';

const attack = () => ({
  attackId: 'attack.test', finalPower: 50, enemyHpBefore: 70, enemyHpAfter: 20, actualHpLoss: 50,
  overkill: 0, killed: false, visualBasis: { intensityBaseline: 100 },
  analysis: { resolvedTokenRoles: [{ cardInstanceId: 'c1', role: 'S' }, { cardInstanceId: 'c2', role: 'V' }] },
  scoreTimeline: [
    { eventId: 'e1', phase: 'CARD_BASE', sourceType: 'CARD', sourceId: 'c1', before: 0, after: 10, highlightCardIds: ['c1'], labelKo: '카드 기본점수' },
    { eventId: 'e2', phase: 'CARD_BASE', sourceType: 'CARD', sourceId: 'c2', before: 10, after: 20, highlightCardIds: ['c2'], labelKo: '카드 기본점수' },
    { eventId: 'e3', phase: 'COMPLETE_BONUS', sourceType: 'GRAMMAR', before: 20, after: 40, labelKo: '완전한 문장!' },
    { eventId: 'e4', phase: 'MAIN_FRAME', sourceType: 'GRAMMAR', before: 40, after: 40, labelKo: '주절 · 1형식!' },
    { eventId: 'e5', phase: 'REGION', sourceType: 'STAGE', before: 40, after: 50, labelKo: '시작의 초원' },
  ],
});
const fast = { wait: () => Promise.resolve() };

test('presentation: committed events copied exactly; HP changes after lunge at impact; no mutation', async () => {
  const resolution = attack(), before = structuredClone(resolution), calls = [];
  let displayedHp = 0;
  const view = {
    setLocked(value) { calls.push(['locked', value]); },
    begin(value) { displayedHp = value.enemyHpBefore; calls.push(['begin', displayedHp]); },
    onScore(event) { assert.equal(displayedHp, 70); calls.push(['score', event.before, event.after]); },
    highlight(ids, roles) { if (roles.length) assert.equal(roles[0].role, 'S'); },
    lunge() { assert.equal(displayedHp, 70); calls.push(['lunge']); },
    impact(data) { displayedHp = data.hpAfter; calls.push(['impact', displayedHp]); },
    finish() { calls.push(['finish']); },
  };
  const result = await playAttack(resolution, view, fast);
  assert.equal(result.status, 'FINISHED');
  assert.deepEqual(calls.filter(call => call[0] === 'score').map(call => call.slice(1)), resolution.scoreTimeline.map(event => [event.before, event.after]));
  assert.ok(calls.findIndex(call => call[0] === 'impact') > calls.findIndex(call => call[0] === 'lunge'));
  assert.equal(calls.filter(call => call[0] === 'impact').length, 1);
  assert.deepEqual(calls.at(-1), ['locked', false]);
  assert.deepEqual(resolution, before);
});

test('presentation: readable duration and, speed settings preserve exact score events', () => {
  const resolution = attack();
  const base = buildPresentationTimeline(resolution);
  const duration = timeline => timeline.reduce((sum, step) => sum + step.duration, 0);
  assert.ok(duration(base) >= 3000 && duration(base) <= 5000);
  for (const speed of [1.5, 2]) {
    const scaled = buildPresentationTimeline(resolution, { speed });
    assert.ok(Math.abs(duration(base) / speed - duration(scaled)) < scaled.length);
    assert.deepEqual(scaled.filter(step => step.event).map(step => step.event), resolution.scoreTimeline);
  }
  assert.equal(duration(buildPresentationTimeline(resolution, { effectsOff: true })),duration(base));
  assert.equal(duration(buildPresentationTimeline(resolution, { reducedMotion: true })),duration(base));
  assert.throws(() => buildPresentationTimeline(resolution, { speed: 7 }), RangeError);
});

test('presentation: long 16-card/rune sequence stays bounded and uses fixed strength baseline', async () => {
  const resolution = attack();
  resolution.scoreTimeline = Array.from({ length: 28 }, (_, index) => ({ ...resolution.scoreTimeline[index % 5], eventId: `e.${index}` }));
  const steps = buildPresentationTimeline(resolution);
  assert.ok(steps.reduce((sum, step) => sum + step.duration, 0) > 5000);
  resolution.enemyHpBefore = 1; resolution.enemyHpAfter = 0; resolution.actualHpLoss = 1; resolution.killed = true;
  let intensity;
  await playAttack(resolution, { impact(data) { intensity = data.intensity; } }, fast);
  assert.equal(intensity, .5, 'low remaining HP must not inflate strength');
});

test('presentation: view exception fast-forwards committed result and always releases input', async () => {
  const calls = [];
  const result = await playAttack(attack(), {
    onScore() { throw new Error('view animation unavailable'); },
    setPower(value) { calls.push(['power', value]); },
    impact(value) { calls.push(['hp', value.hpAfter]); },
    finish() { throw new Error('secondary renderer failure'); },
    setLocked(value) { calls.push(['locked', value]); },
  }, fast);
  assert.equal(result.status, 'FAST_FORWARDED');
  assert.equal(result.reason, 'view-error');
  assert.deepEqual(calls.at(-1), ['locked', false]);
  assert.equal(calls.filter(call => call[0] === 'hp').length, 1);
});

test('presentation: AbortSignal / hidden tab resolve without hanging or losing final HP', async () => {
  for (const kind of ['abort', 'hidden']) {
    const controller = new AbortController();
    const document = new EventTarget(); document.hidden = kind === 'hidden';
    let finalHp = null, unlocked = false;
    const pending = playAttack(attack(), { impact(value) { finalHp = value.hpAfter; }, setLocked(value) { unlocked = !value; } }, { signal: controller.signal, document });
    if (kind === 'abort') controller.abort();
    const result = await pending;
    assert.equal(result.status, 'FAST_FORWARDED');
    assert.equal(finalHp, 20); assert.equal(unlocked, true);
  }
});

test('presentation: rune event order and zero damage fixture do not alter damage', async () => {
  const resolution = attack();
  resolution.finalPower = 0; resolution.actualHpLoss = 0; resolution.enemyHpAfter = 70;
  resolution.scoreTimeline.push({ eventId: 'r1', phase: 'RUNES_SLOT_ORDER', sourceType: 'RUNE', sourceId: 'rune.short', before: 50, after: 62 });
  resolution.scoreTimeline.push({ eventId: 'r2', phase: 'BOSS', sourceType: 'BOSS', before: 62, after: 0 });
  const pulses = []; let hp;
  await playAttack(resolution, { pulseRune(id) { pulses.push(id); }, impact(value) { hp = value.hpAfter; } }, { ...fast, effectsOff: true });
  assert.deepEqual(pulses, ['rune.short']); assert.equal(hp, 70);
});

test('presentation: unsafe score values rejected before touching a view', async () => {
  const resolution = attack(); resolution.scoreTimeline[0].after = Infinity;
  let called = false;
  await assert.rejects(() => playAttack(resolution, { begin() { called = true; } }), TypeError);
  assert.equal(called, false);
});

function fakeAudioContext({ reject = false } = {}) {
  const parameter = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  return {
    state: 'suspended', currentTime: 0, destination: {},
    async resume() { if (reject) throw new Error('NotAllowedError'); this.state = 'running'; },
    createGain() { return { gain: parameter(), connect() {}, disconnect() {} }; },
    createOscillator() { return { frequency: parameter(), connect() {}, disconnect() {}, start() {}, stop() {} }; },
  };
}

test('audio: autoplay denial is safe; absent WebAudio also keeps gameplay available', async () => {
  const denied = new AudioManager({ contextFactory: () => fakeAudioContext({ reject: true }) });
  assert.equal(await denied.unlock(), false); assert.equal(denied.play('impact'), false);
  const absent = new AudioManager({ contextFactory: () => null });
  assert.equal(await absent.unlock(), false); assert.equal(absent.play('score'), false);
});

test('audio: context reused, concurrent voices bounded, mute and volume clamps honored', async () => {
  let creations = 0;
  const audio = new AudioManager({ contextFactory: () => { creations++; return fakeAudioContext(); }, maxVoices: 3 });
  assert.equal(await audio.unlock(), true); assert.equal(await audio.unlock(), true); assert.equal(creations, 1);
  for (let i = 0; i < 20; i++) assert.equal(audio.play('score', { step: i, intensity: 100 }), true);
  assert.equal(audio.voices.size, 3);
  audio.configure({ volume: 5 }); assert.equal(audio.volume, 1);
  audio.configure({ muted: true }); assert.equal(audio.voices.size, 0); assert.equal(audio.play('impact'), false);
  audio.configure({ muted: false, volume: -2 }); assert.equal(audio.volume, 0); assert.equal(audio.play('impact'), false);
});

test('assets: missing art/BGM resolves locally; relative paths support project subfolders', () => {
  assert.equal(resolveAsset('boss.stage1').value, '🌳');
  assert.equal(resolveAsset('unknown.enemy', '👾').value, '👾');
  assert.equal(assetUrl('not.present'), null);
  assert.equal(assetUrl('art', { art: '/assets/art.png' }), null);
  assert.equal(assetUrl('art', { art: '../art.png' }), null);
  assert.equal(assetUrl('art', { art: 'https://example.com/art.png' }), null);
  assert.equal(assetUrl('art', { art: 'assets/art.png' }, './'), './assets/art.png');
  const audio = new AudioManager(); assert.equal(audio.setBgmAsset('bgm.meadow'), null);
});
