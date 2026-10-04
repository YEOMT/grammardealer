import {RUNE_BY_ID} from '../data/runes.js';
/** Presentation consumes a committed AttackResolution and never calculates score or mutates run state. */
export const PRESENTATION_VERSION = '0.1.1';
const ALLOWED_SPEEDS = [1, 1.5, 2];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const safeCall = (view, name, ...args) => typeof view[name] === 'function' ? view[name](...args) : undefined;

function validateResolution(resolution) {
  if (!resolution || typeof resolution !== 'object' || !Array.isArray(resolution.scoreTimeline)) throw new TypeError('AttackResolution with scoreTimeline required');
  for (const key of ['finalPower', 'enemyHpBefore', 'enemyHpAfter', 'actualHpLoss']) {
    if (!Number.isSafeInteger(resolution[key]) || resolution[key] < 0) throw new TypeError(`Invalid AttackResolution.${key}`);
  }
  for (const event of resolution.scoreTimeline) {
    if (!event || !Number.isSafeInteger(event.before) || !Number.isSafeInteger(event.after)) throw new TypeError('Invalid ScoreEvent.before/after');
  }
}

/** A readable bounded sequence; all numbers are copied from the engine's events, never recomputed. */
export function buildPresentationTimeline(resolution, { speed = 1, effectsOff = false, reducedMotion = false } = {}) {
  validateResolution(resolution);
  if (!ALLOWED_SPEEDS.includes(speed)) throw new RangeError('Presentation speed must be 1, 1.5, or 2');
  const duration=value=>Math.round(value/speed);
  let combo=0;
  const scores=resolution.scoreTimeline.flatMap(event=>{
    const rune=event.sourceType==='RUNE';
    const meaningful=rune||['COMPLETE_BONUS','MAIN_FRAME','SIMPLE_MODIFIERS'].includes(event.phase);
    if(meaningful)combo++;
    const score={kind:'SCORE',event,combo,duration:duration(event.phase==='CARD_BASE'?170:rune?520:550)};
    return rune?[{kind:'RUNE_FLIGHT',runeEvent:event,combo,duration:duration(220)},score]:[score];
  });
  return [{kind:'LOCK',duration:duration(50)},...scores,{kind:'POWER',duration:duration(420)},{kind:'CHARGE',duration:duration(400)},
    {kind:'LUNGE',duration:duration(200)},{kind:'IMPACT',duration:duration(70)},{kind:'SETTLE',duration:duration(180)}];
}

/**
 * All viewContext callbacks are synchronous display updates. Completion never changes game state.
 * @param {Object} resolution committed, immutable attack result
 * @param {Object} viewContext callbacks begin/onScore/highlight/pulseRune/setPower/charge/lunge/impact/finish/setLocked
 * @param {{speed?:number,effectsOff?:boolean,reducedMotion?:boolean,signal?:AbortSignal,document?:Document,wait?:Function}} options
 * @returns {Promise<{status:string,reason:string|null,attackId:string|undefined}>}
 */
export async function playAttack(resolution, viewContext = {}, options = {}) {
  options = { ...options, reducedMotion: options.reducedMotion ?? globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false };
  const timeline = buildPresentationTimeline(resolution, options);
  const document = options.document ?? globalThis.document;
  const basis = resolution.visualBasis?.intensityBaseline ?? resolution.visualBasis?.baselinePower ?? 100;
  const intensity = clamp(resolution.finalPower / (Number.isFinite(basis) && basis > 0 ? basis : 100), .35, 3);
  const impact = { hpBefore: resolution.enemyHpBefore, hpAfter: resolution.enemyHpAfter, finalPower: resolution.finalPower,
    actualHpLoss: resolution.actualHpLoss, overkill: resolution.overkill ?? 0, killed: Boolean(resolution.killed), intensity };
  let reason = null, timer = null, wake = null, impacted = false;
  const interrupt = value => { reason ??= value; if (timer !== null) clearTimeout(timer); wake?.(); };
  const onAbort = () => interrupt('aborted');
  const onVisibility = () => { if (document?.hidden) interrupt('hidden'); };
  const wait = ms => new Promise(resolve => {
    const done = () => { if (timer !== null) clearTimeout(timer); timer = null; wake = null; resolve(); };
    wake = done; timer = setTimeout(done, ms);
    // Optional test scheduler still has a native timeout fallback, so it cannot strand the UI.
    if (options.wait) Promise.resolve().then(() => options.wait(ms)).then(done, () => interrupt('wait-error'));
  });
  const plannedDuration=timeline.reduce((sum,step)=>sum+step.duration,0);
  const watchdogMs=plannedDuration+Math.max(2000,Math.round(plannedDuration*.35));
  const watchdog = setTimeout(() => interrupt('timeout'), watchdogMs);
  options.signal?.addEventListener('abort', onAbort, { once: true });
  document?.addEventListener?.('visibilitychange', onVisibility);
  if (options.signal?.aborted) interrupt('aborted');
  if (document?.hidden) interrupt('hidden');
  try {
    safeCall(viewContext, 'setLocked', true);
    safeCall(viewContext, 'begin', resolution, { ...options, intensity });
    let scoreStep = 0;
    for (const step of timeline) {
      if (reason) break;
      if(step.kind==='RUNE_FLIGHT'){safeCall(viewContext,'pulseRune',step.runeEvent.sourceId);safeCall(viewContext,'flyRune',step.runeEvent,{duration:step.duration,combo:step.combo});}
      else if (step.kind === 'SCORE') {
        safeCall(viewContext, 'clearHighlights');
        safeCall(viewContext, 'highlight', step.event.highlightCardIds ?? step.event.cardIds ?? [], /MAIN_FRAME/.test(step.event.phase) ? resolution.analysis?.resolvedTokenRoles ?? [] : []);
        safeCall(viewContext, 'onScore', step.event, { step: scoreStep++, intensity,combo:step.combo });

      } else if (step.kind === 'POWER') safeCall(viewContext, 'setPower', resolution.finalPower);
      else if (step.kind === 'CHARGE') safeCall(viewContext, 'charge', { duration: step.duration, intensity });
      else if (step.kind === 'LUNGE') safeCall(viewContext, 'lunge', { duration: step.duration, intensity });
      else if (step.kind === 'IMPACT') { impacted = true; safeCall(viewContext, 'impact', impact); }
      await wait(step.duration);
    }
  } catch (error) {
    reason = 'view-error';
    try { safeCall(viewContext, 'onError', error); } catch { /* display errors cannot escape cleanup */ }
  } finally {
    clearTimeout(watchdog);
    if (timer !== null) clearTimeout(timer);
    options.signal?.removeEventListener('abort', onAbort);
    document?.removeEventListener?.('visibilitychange', onVisibility);
    // Fast-forward the display only. The controller owns the already-committed damage and settlement.
    for (const [method, args] of [
      ['setPower', [resolution.finalPower]], ...(!impacted ? [['impact', [impact]]] : []),
      ['clearHighlights', []], ['finish', [resolution, { reason }]], ['setLocked', [false]],
    ]) { try { safeCall(viewContext, method, ...args); } catch { reason ??= 'view-error'; } }
  }
  return { status: reason ? 'FAST_FORWARDED' : 'FINISHED', reason, attackId: resolution.attackId,plannedDuration,watchdogMs };
}

const find = (root, name) => root.querySelector(`[data-presentation="${name}"]`);
const findCard = (root, id) => [...root.querySelectorAll('[data-card-id]')].find(element => element.dataset.cardId === id);

/** Actual SVG relation renderer; call only in the clearly labeled presentation-only sandbox fixture. */
export function connect(root, fromCardId, toCardIds) {
  if (!root?.querySelector || typeof fromCardId !== 'string' || !Array.isArray(toCardIds)) throw new TypeError('connect needs a root, a card ID, and target IDs');
  const from = findCard(root, fromCardId);
  if (!from) return null;
  const document = root.ownerDocument;
  const rootBox = root.getBoundingClientRect(), fromBox = from.getBoundingClientRect();
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true'); svg.dataset.presentation = 'connector';
  svg.setAttribute('viewBox', `0 0 ${Math.max(1, rootBox.width)} ${Math.max(1, rootBox.height)}`);
  Object.assign(svg.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: '6' });
  const start = { x: fromBox.left - rootBox.left + fromBox.width / 2, y: fromBox.top - rootBox.top };
  for (const cardId of toCardIds) {
    const target = findCard(root, cardId); if (!target) continue;
    const box = target.getBoundingClientRect();
    const end = { x: box.left - rootBox.left + box.width / 2, y: box.top - rootBox.top };
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const arc = Math.max(8, Math.min(start.y, end.y) - 32);
    path.setAttribute('d', `M ${start.x} ${start.y} C ${start.x} ${arc}, ${end.x} ${arc}, ${end.x} ${end.y}`);
    path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#78e8db'); path.setAttribute('stroke-width', '3'); path.setAttribute('stroke-linecap', 'round');
    svg.append(path);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', String(end.x)); dot.setAttribute('cy', String(end.y)); dot.setAttribute('r', '4'); dot.setAttribute('fill', '#78e8db'); svg.append(dot);
  }
  if (globalThis.getComputedStyle?.(root).position === 'static') root.style.position = 'relative';
  root.append(svg);
  return svg;
}

/** Small optional DOM adapter. data-presentation: score,label,sentence,enemy,hp,hp-fill,log,power. */
export function createDOMPresentation(root, { audio, hpMax } = {}) {
  if (!root?.querySelector) throw new TypeError('Presentation root element required');
  let current = null, settings = {}, animations = [],effectNodes=[];
  const text = (name, value) => { const node = find(root, name); if (node) node.textContent = String(value); };
  const animate = (node, frames, duration) => {
    if (!node?.animate || settings.effectsOff || settings.reducedMotion) return;
    try { animations.push(node.animate(frames, { duration, easing: 'ease-out', fill: 'none' })); } catch { /* final DOM is independent */ }
  };
  const clearHighlights = () => {
    root.querySelectorAll('.presentation-highlight,.presentation-rune-pulse').forEach(node => node.classList.remove('presentation-highlight', 'presentation-rune-pulse'));
    root.querySelectorAll('[data-presentation-role]').forEach(node => node.remove());
  };
  const showHp = value => {
    const max = hpMax ?? current?.visualBasis?.enemyMaxHp ?? current?.visualBasis?.enemyBefore?.hpMax ?? current?.visualBasis?.enemyBefore?.maxHp ?? current?.enemyHpBefore ?? 1;
    text('hp', `${value} / ${max}`);
    const fill = find(root, 'hp-fill'); if (fill) { fill.style.width = `${clamp(value / Math.max(1, max), 0, 1) * 100}%`; fill.setAttribute('aria-valuenow', String(value)); }
  };
  const adapter = {
    setLocked(locked) { root.dataset.presenting = String(locked); root.setAttribute('aria-busy', String(locked)); },
    begin(resolution, options) {
      current = resolution; settings = options;
      clearHighlights(); adapter.clearConnections(); showHp(resolution.enemyHpBefore);
      text('score', '0'); text('label', '문장을 펼칩니다'); text('power', '');
      const log = find(root, 'log'); if (log) log.replaceChildren();
      const enemy = find(root, 'enemy'); if (enemy) { enemy.style.opacity = '1'; enemy.dataset.defeated = 'false'; }
      root.style.setProperty('--attack-intensity', String(options.intensity));
    },
    onScore(event, { step, intensity,combo=0 }) {
      effectNodes.forEach(n=>n.remove());effectNodes=[];
      text('label', event.labelKo ?? event.phase); text('score', event.after);
      const score = find(root, 'score'); if (score) { score.title = `${event.before} → ${event.after}`; score.dataset.before = String(event.before); score.dataset.after = String(event.after); }
      const tier=Math.min(4,Math.max(0,combo-2));
      if(score){score.dataset.combo=String(combo);score.style.fontWeight=String(700+tier*50);score.style.textShadow=settings.effectsOff?'none':`0 0 ${8+tier*7}px #edbd${tier>1?'79aa':'7944'}`;}
      animate(score,[{transform:'scale(1)'},{transform:`translateX(${tier>2?2:0}px) scale(${1.035+tier*.035})`},{transform:'scale(1)'}],240);
      const log = find(root, 'log'); if (log) {
        const line = root.ownerDocument.createElement('div'); line.textContent = `${event.labelKo ?? event.phase}  ${event.before} → ${event.after}`;
        line.dataset.eventId = event.eventId ?? ''; log.append(line); while (log.children.length > 3) log.firstElementChild.remove();
      }
      audio?.play?.(/CARD|BASE/.test(event.phase) ? 'card' : 'score', { step, intensity });
    },
    highlight(cardIds, roles = []) {
      for (const id of cardIds) {
        const card = findCard(root, id); if (!card) continue;
        card.classList.add('presentation-highlight');
        animate(card, [{ filter: 'brightness(1)' }, { filter: 'brightness(1.45)' }, { filter: 'brightness(1)' }], 180);
      }
      for (const role of roles) {
        const card = findCard(root, role.cardInstanceId ?? role.cardId); if (!card) continue;
        const mark = root.ownerDocument.createElement('span'); mark.dataset.presentationRole = 'true';
        const key = role.role ?? role.functionRole;
        mark.textContent = role.labelKo ?? role.roleKo ?? ({ S: 'S · 주어', V: 'V · 동사', O: 'O · 목적어', C: 'C · 보어', SUBJECT: 'S · 주어', VERB: 'V · 동사', OBJECT: 'O · 목적어', COMPLEMENT: 'C · 보어' })[key] ?? key ?? '';
        Object.assign(mark.style, { position: 'absolute', bottom: '-17px', left: '0', right: '0', fontSize: '11px', color: '#a9f4e0', whiteSpace: 'nowrap', textAlign: 'center', pointerEvents: 'none' });
        card.append(mark);
      }
    },
    clearHighlights,
    pulseRune(sourceId) {
      const rune = [...root.querySelectorAll('[data-rune-id]')].find(node => node.dataset.runeId === sourceId);
      if (rune) { rune.classList.add('presentation-rune-pulse'); animate(rune, [{ transform: 'scale(1)' }, { transform: 'scale(1.07)', filter: 'brightness(1.6)' }, { transform: 'scale(1)' }], 260); }
      audio?.play?.('rune', { intensity: settings.intensity });
    },
    flyRune(event,{duration}){
      const rune=[...root.querySelectorAll('[data-rune-id]')].find(n=>n.dataset.runeId===event.sourceId),target=find(root,'score');
      if(!rune||!target||settings.effectsOff||settings.reducedMotion)return;
      const a=rune.getBoundingClientRect(),b=target.getBoundingClientRect(),color=RUNE_BY_ID[event.sourceId]?.color??'#ddd';
      const node=root.ownerDocument.createElement('i');node.className='rune-flight';node.dataset.runeId=event.sourceId;node.style.background=color;node.style.boxShadow=`0 0 18px 5px ${color}`;
      const x=a.left+a.width/2,y=a.top+a.height/2,dx=b.left+b.width/2-x,dy=b.top+b.height/2-y;
      Object.assign(node.style,{position:'fixed',left:`${x}px`,top:`${y}px`});root.append(node);effectNodes.push(node);
      animate(node,[{transform:'translate(0,0) scale(.5)',opacity:.7},{transform:`translate(${dx*.45}px,${dy*.5-55}px) scale(1.2)`,opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.3)`,opacity:.1}],duration);
    },
    setPower(power) { text('power', `${power} 위력`); text('score', power); },
    charge({ duration, intensity }) {
      text('label', '힘을 모읍니다'); audio?.play?.('charge', { intensity });
      animate(find(root, 'sentence'), [{ transform: 'scale(1)' }, { transform: 'scale(.96)' }], duration);
    },
    lunge({ duration }) {
      text('label', '문장 공격!');
      const sentence = find(root, 'sentence'), enemy = find(root, 'enemy');
      if (sentence && enemy) {
        const a = sentence.getBoundingClientRect(), b = enemy.getBoundingClientRect();
        const x = b.left + b.width / 2 - a.left - a.width / 2, y = b.top + b.height / 2 - a.top - a.height / 2;
        animate(sentence, [{ transform: 'translate(0,0) scale(.96)', opacity: 1 }, { transform: `translate(${x}px,${y}px) scale(.36)`, opacity: .3 }], duration);
      }
    },
    impact({ hpAfter, finalPower, actualHpLoss, killed, intensity }) {
      showHp(hpAfter); text('label', finalPower === 0 ? '장막에 막혔습니다' : killed ? `격파! · ${actualHpLoss} 피해` : `${actualHpLoss} 피해!`);
      audio?.play?.(finalPower === 0 ? 'blocked' : 'impact', { intensity });
      const enemy = find(root, 'enemy');
      if (enemy) {
        enemy.dataset.defeated = String(killed);
        animate(enemy, killed ? [{ transform: 'rotate(0) scale(1)', opacity: 1 }, { transform: 'rotate(12deg) scale(.6)', opacity: 0 }] : [{ transform: 'translateX(0)' }, { transform: `translateX(${6 * intensity}px)` }, { transform: `translateX(${-4 * intensity}px)` }, { transform: 'translateX(0)' }], killed ? 300 : 200);
        if (killed) enemy.style.opacity = '0';
      }
    },
    finish(resolution) {
      for (const animation of animations) { try { animation.cancel(); } catch { /* no-op */ } } animations = [];
      effectNodes.forEach(n=>n.remove());effectNodes=[];
      const score=find(root,'score');if(score){score.style.textShadow='';score.style.fontWeight='';}
      showHp(resolution.enemyHpAfter);
      const enemy = find(root, 'enemy'); if (enemy) { enemy.style.opacity = resolution.killed ? '0' : '1'; enemy.dataset.defeated = String(Boolean(resolution.killed)); }
      clearHighlights(); adapter.clearConnections();
    },
    connect(fromCardId, toCardIds) { return connect(root, fromCardId, toCardIds); },
    clearConnections() { root.querySelectorAll('[data-presentation="connector"]').forEach(node => node.remove()); },
  };
  return adapter;
}
