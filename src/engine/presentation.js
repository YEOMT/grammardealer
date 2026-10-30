import {scoreFeedback} from './scoreFeedback.js';
import {monsterViewFor} from '../ui/monsterArt.js';
import {finaleStatusText} from '../ui/finale.js';
import {meaningfulComboEvent,runeFeel} from './comboFeel.js';
import {createScoreEffects} from '../ui/scoreEffects.js';
import {frameLabel} from './foresight.js';
import {presentationClock} from './presentationClock.js';
import {runeForVersion} from '../data/runes.js';
/** Presentation consumes a committed AttackResolution and never calculates score or mutates run state. */
export const PRESENTATION_VERSION = '0.6.0';
/** Read-only feel classification. No damage, reward or RNG is calculated here. */
export function impactFeel(r){
 const positive=n=>Number.isSafeInteger(n)&&n>0?n:1;
 const max=positive(r.visualBasis?.enemyMaxHp??r.visualBasis?.enemyBefore?.maxHp??r.visualBasis?.intensityBaseline??r.enemyHpBefore),power=Number.isSafeInteger(r.finalPower)&&r.finalPower>0?r.finalPower:0,ratio=power/max;
 if(!power||r.actualHpLoss===0)return {tier:'BLOCKED',ratio,hitStop:0,recoil:0,shake:0,settle:180};
 if(r.killed&&r.overkill>0){
  const remainingRatio=power/positive(r.enemyHpBefore);
  const tier=remainingRatio>=2.5&&ratio>=1?'MASSIVE':remainingRatio>=1.5&&ratio>=.5?'LARGE':'SMALL';
  const [hitStop,recoil,shake]=({SMALL:[90,8,3],LARGE:[120,14,5],MASSIVE:[150,22,8]})[tier];
  return {tier,ratio,hitStop,recoil,shake,settle:450};
 }
 return ratio<.5?{tier:'LIGHT',ratio,hitStop:20,recoil:2,shake:0,settle:200}:ratio<1?{tier:'HEAVY',ratio,hitStop:75,recoil:7,shake:0,settle:300}:{tier:'OVERPOWER',ratio,hitStop:110,recoil:10,shake:0,settle:400};
}
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
  const duration=value=>Math.round(value/speed);const feel=impactFeel(resolution);
  const turnEnd=resolution.turnEndReceipt&&!resolution.turnEndReceipt.killed?[{kind:'TURN_END',receipt:resolution.turnEndReceipt,duration:duration(850)}]:[];
  if(resolution.zeroReason==='INCOMPLETE_SENTENCE')return [{kind:'LOCK',duration:50},{kind:'POWER',duration:180},{kind:'IMPACT',duration:1200},...turnEnd];
  let combo=0;const seenEvents=new Set();
  const scores=resolution.scoreTimeline.flatMap(event=>{
    const rune=event.sourceType==='RUNE';
    const meaningful=meaningfulComboEvent(event)&&!seenEvents.has(event.eventId);
    seenEvents.add(event.eventId);if(meaningful)combo++;
    const score={kind:'SCORE',event,combo,duration:event.after<event.before?Math.max(350,duration(700)):duration(event.phase==='CARD_BASE'?170:rune?520:550)};
    return rune?[{kind:'RUNE_FLIGHT',runeEvent:event,combo,duration:duration(220)},score]:[score];
  });
  return [{kind:'LOCK',duration:duration(50)},...scores,{kind:'POWER',duration:duration(420)},{kind:'CHARGE',duration:Math.max(180,duration(300))},
    {kind:'LUNGE',duration:Math.max(140,duration(220))},{kind:'IMPACT',duration:duration(feel.hitStop)},{kind:'RECOIL',duration:duration(feel.settle)},...(resolution.phaseBreak?[{kind:'PHASE_BREAK_READ',duration:duration(1000)}]:[]),...turnEnd];
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
    actualHpLoss: resolution.actualHpLoss, overkill: resolution.overkill ?? 0, killed: Boolean(resolution.killed), zeroReason:resolution.zeroReason, feedbackKo:resolution.feedbackKo, intensity,feel:impactFeel(resolution) };
  let reason = null, timer = null, wake = null, impacted = false,clock=null,gateCancel=null;
  const interrupt = value => { reason ??= value; if (timer !== null) clearTimeout(timer); wake?.(); clock?.close();gateCancel?.(); };
  const onAbort = () => interrupt('aborted');
  const onVisibility = () => { if(options.guided)safeCall(viewContext,'setPaused',Boolean(document?.hidden));else if(document?.hidden)interrupt('hidden'); };
  const wait = ms => new Promise(resolve => {
    const done = () => { if (timer !== null) clearTimeout(timer); timer = null; wake = null; resolve(); };
    wake = done; timer = setTimeout(done, ms);
    // Optional test scheduler still has a native timeout fallback, so it cannot strand the UI.
    if (options.wait) Promise.resolve().then(() => options.wait(ms)).then(done, () => interrupt('wait-error'));
  });
  const plannedDuration=timeline.reduce((sum,step)=>sum+step.duration,0);
  const watchdogMs=plannedDuration+Math.max(2000,Math.round(plannedDuration*.35));
  const watchdog = options.guided?null:setTimeout(() => interrupt('timeout'), watchdogMs);
  if(options.guided)clock=presentationClock({document,signal:options.signal,budget:watchdogMs,onTimeout:()=>interrupt('timeout'),...options.clock});
  options.signal?.addEventListener('abort', onAbort, { once: true });
  document?.addEventListener?.('visibilitychange', onVisibility);
  if (options.signal?.aborted) interrupt('aborted');
  if (document?.hidden&&!options.guided) interrupt('hidden');
  try {
    safeCall(viewContext, 'setLocked', true);
    safeCall(viewContext, 'begin', resolution, { ...options, intensity });
    let scoreStep = 0;
    for (const [timelineIndex,step] of timeline.entries()) {
      if (reason) break;
      if(step.kind==='RUNE_FLIGHT'){safeCall(viewContext,'pulseRune',step.runeEvent.sourceId,step.runeEvent);safeCall(viewContext,'flyRune',step.runeEvent,{duration:step.duration,combo:step.combo});}
      else if (step.kind === 'SCORE') {
        safeCall(viewContext, 'clearHighlights');
        const mainFrame=step.event.phase==='MAIN_FRAME';
        safeCall(viewContext, 'highlight', step.event.highlightCardIds ?? step.event.cardIds ?? [], mainFrame ? resolution.analysis?.resolvedTokenRoles ?? [] : [], mainFrame ? resolution.analysis?.nodes?.filter(node=>['INDIRECT_OBJECT','DIRECT_OBJECT'].includes(node.grammaticalRole))??[] : []);
        safeCall(viewContext, 'onScore', step.event, { step: scoreStep++, intensity,combo:step.combo });

      } else if (step.kind === 'POWER') safeCall(viewContext, 'setPower', resolution.finalPower);
      else if (step.kind === 'CHARGE') safeCall(viewContext, 'charge', { duration: step.duration, intensity });
      else if (step.kind === 'LUNGE') safeCall(viewContext, 'lunge', { duration: step.duration, intensity });
      else if (step.kind === 'IMPACT') { impacted = true; safeCall(viewContext, 'impact', impact); }
      if(step.kind==='TURN_END')safeCall(viewContext,'turnEnd',step.receipt);
      if(step.kind==='RECOIL')safeCall(viewContext,'recoil',{...impact,duration:step.duration});
      if(options.guided){
        if(options.wait)await Promise.race([Promise.resolve().then(()=>options.wait(step.duration)),clock.wait(step.duration+2000).then(()=>{if(!reason)interrupt('timeout');})]);
        else await clock.wait(step.duration);
      }else await wait(step.duration);
      const cueId=step.kind==='SCORE'&&step.event.phase==='CARD_BASE'&&timeline[timelineIndex+1]?.event?.phase!=='CARD_BASE'?'T26':step.kind==='SCORE'&&step.event.phase==='COMPLETE_BONUS'?'T27':step.kind==='POWER'?'T28':null;
      if(options.guided&&options.waitForGate&&cueId&&!reason){
        clock.pause(true);
        try{await Promise.race([options.waitForGate({cueId,attackId:resolution.attackId,event:step.event??null,value:step.event?.after??resolution.finalPower}),new Promise(resolve=>{gateCancel=resolve;})]);}
        finally{gateCancel=null;clock.pause(false);}
      }
    }
  } catch (error) {
    reason = 'view-error';
    try { safeCall(viewContext, 'onError', error); } catch { /* display errors cannot escape cleanup */ }
  } finally {
    clearTimeout(watchdog);clock?.close();
    if (timer !== null) clearTimeout(timer);
    options.signal?.removeEventListener('abort', onAbort);
    document?.removeEventListener?.('visibilitychange', onVisibility);
    // Fast-forward the display only. The controller owns the already-committed damage and settlement.
    for (const [method, args] of options.guided&&reason?[['cancel',[]],['setLocked',[false]]]:[
      ['setPower', [resolution.finalPower]], ...(!impacted ? [['impact', [impact]]] : []),
      ['clearHighlights', []], ['finish', [resolution, { reason }]], ['setLocked', [false]],
    ]) { try { safeCall(viewContext, method, ...args); } catch { reason ??= 'view-error'; } }
  }
  return { status: reason ? options.guided?'INTERRUPTED':'FAST_FORWARDED' : 'FINISHED', reason, attackId: resolution.attackId,plannedDuration,watchdogMs };
}

const find = (root, name) => root.querySelector(`[data-presentation="${name}"]`);
const findCard = (root, id) => [...root.querySelectorAll('[data-card-id]')].find(element => element.dataset.cardId === id);

/** Read-only SVG relation renderer. Call from submitted evidence or the labeled visual sandbox. */
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
  const scoreEffects=createScoreEffects(root);
  let current = null, settings = {}, animations = [],effectNodes=[],lungeAnimation=null,attackBody=null,attackLayer=null,visualSnapshot=null;
  const fallbacks=new Set();
  const text = (name, value) => { const node = find(root, name); if (node) {node.textContent = String(value);if(name==='score')node.style.setProperty('--score-digits',String(String(value).length));} };
  const animate = (node, frames, duration, fill='none') => {
    if (!node?.animate || settings.effectsOff || settings.reducedMotion) return;
    try { const animation=node.animate(frames, { duration, easing: 'ease-out', fill });animations.push(animation);if(root.ownerDocument.hidden&&settings.guided)animation.pause();return animation; } catch { /* final DOM is independent */ }
  };
  // Decoration may disappear. Core feedback always has a visible, bounded non-motion fallback.
  const animateCore=(node,frames,duration,fill='none')=>{
    if(!node)return;
    if(settings.reducedMotion||settings.effectsOff)frames=[{filter:'brightness(1)',outline:'2px solid transparent'},{filter:'brightness(1.2)',outline:'2px solid #f2d48c'},{filter:'brightness(1)',outline:'2px solid transparent'}];
    try{
      if(typeof node.animate!=='function')throw Error('WAAPI unavailable');
      const animation=node.animate(frames,{duration,easing:'ease-out',fill});animations.push(animation);
      // Start on the same document clock as this phase, without a pending first-frame delay.
      // At 2x a 70ms lunge must not spend its only painted frame waiting to start.
      const now=root.ownerDocument.timeline?.currentTime;
      if(animation.startTime===null&&typeof now==='number')animation.startTime=now;
      if(root.ownerDocument.hidden&&settings.guided)animation.pause();return animation;
    }catch(error){
      root.dataset.coreFallback=String(Number(root.dataset.coreFallback??0)+1);
      root.dataset.coreFallbackReason=error.message;
      const old={outline:node.style.outline,filter:node.style.filter};node.style.outline='2px solid #f2d48c';node.style.filter='brightness(1.2)';
      const cleanup=()=>{clearTimeout(timer);Object.assign(node.style,old);fallbacks.delete(cleanup);};
      const timer=setTimeout(cleanup,Math.max(90,duration));fallbacks.add(cleanup);
    }
  };
  const snapshotCards=()=>{
    const sentence=find(root,'sentence');if(!sentence)return null;
    const sources=[...sentence.querySelectorAll('.word-card')];if(!sources.length)return null;
    const boxes=sources.map(n=>n.getBoundingClientRect()),left=Math.min(...boxes.map(r=>r.left)),top=Math.min(...boxes.map(r=>r.top));
    const rect={left,top,width:Math.max(...boxes.map(r=>r.right))-left,height:Math.max(...boxes.map(r=>r.bottom))-top},body=root.ownerDocument.createElement('div');body.className='core-attack-body';body.inert=true;body.setAttribute('aria-hidden','true');
    for(const source of sources){
      const box=source.getBoundingClientRect(),copy=source.cloneNode(true);
      const originals=[source,...source.querySelectorAll('*')],copies=[copy,...copy.querySelectorAll('*')];
      originals.forEach((node,i)=>{const style=getComputedStyle(node),target=copies[i];for(const key of style)target.style.setProperty(key,style.getPropertyValue(key));
        for(const attr of [...target.attributes])if(attr.name==='id'||attr.name.startsWith('data-')||attr.name==='tabindex')target.removeAttribute(attr.name);
        target.removeAttribute('aria-label');if('tabIndex'in target)target.tabIndex=-1;target.style.animation='none';target.style.transition='none';target.style.transform='none';target.style.pointerEvents='none';
      });
      Object.assign(copy.style,{position:'absolute',left:`${box.left-rect.left}px`,top:`${box.top-rect.top}px`,width:`${box.width}px`,height:`${box.height}px`,margin:'0'});body.append(copy);
    }
    return {body,rect};
  };
  const mountAttack=()=>{
    if(attackBody||!visualSnapshot)return;
    attackBody=visualSnapshot.body;const a=visualSnapshot.rect;
    Object.assign(attackBody.style,{left:`${a.left}px`,top:`${a.top}px`,width:`${a.width}px`,height:`${a.height}px`});
    attackLayer=root.ownerDocument.createElement('div');attackLayer.className='attack-overlay';attackLayer.append(attackBody);
    (root.ownerDocument.fullscreenElement??root.ownerDocument.body).append(attackLayer);
  };
  const clearCore=()=>{for(const cleanup of [...fallbacks])cleanup();attackLayer?.remove();attackLayer=null;attackBody?.remove();attackBody=null;const sentence=find(root,'sentence');if(sentence)sentence.style.opacity='';};
  const clearHighlights = () => {
    scoreEffects.clearEvidence();
    root.querySelectorAll('.presentation-highlight,.presentation-rune-pulse').forEach(node => node.classList.remove('presentation-highlight', 'presentation-rune-pulse'));
    root.querySelectorAll('[data-clause-group],[data-content-object],.connector-bridge').forEach(n=>{delete n.dataset.clauseGroup;delete n.dataset.contentObject;n.classList.remove('connector-bridge');});
    root.querySelectorAll('[data-presentation-role]').forEach(node => node.remove());
    root.querySelectorAll('[data-argument-role]').forEach(node=>{delete node.dataset.argumentRole;node.classList.remove('argument-start','argument-end');});
  };
  const showHp = value => {
    const max = hpMax ?? current?.visualBasis?.enemyMaxHp ?? current?.visualBasis?.enemyBefore?.hpMax ?? current?.visualBasis?.enemyBefore?.maxHp ?? current?.enemyHpBefore ?? 1;
    text('hp', `${value} / ${max}`);
    const fill = find(root, 'hp-fill'); if (fill) { fill.style.width = `${clamp(value / Math.max(1, max), 0, 1) * 100}%`; fill.setAttribute('aria-valuenow', String(value)); }
  };
  const showBossState=state=>{
    if(state?.id==='FATE_FORESIGHT')text('foresight-memory','예견 · 직전 문형 '+frameLabel(state.rememberedFrame));
    if(state?.id?.startsWith('FINALE_')){const n=find(root,'finale-status');if(n)n.textContent=finaleStatusText(state);}
    if(state?.id==='DUAL_RELATIVE_SEAL'){const n=find(root,'relative-seal');if(n){n.dataset.unlocked=String(state.unlocked);n.textContent=state.unlocked?'청동 인장 해제 · 처치 가능':'청동 인장 · HP 1 보호';}}
    if(state?.id==='EMBER_SCALE_SHIELD'){const n=find(root,'ember-scale');if(n){n.dataset.active=String(state.active);n.textContent=state.active?'검댕 비늘 · 피해 75% 감소':'검댕 비늘 해제';}}
    if(state?.id==='FROST_CRYSTAL_LOCK'){const n=find(root,'frost-crystals');if(n){const changed=n.dataset.remaining!==undefined&&Number(n.dataset.remaining)>state.crystalsRemaining;n.dataset.remaining=String(state.crystalsRemaining);n.textContent='◆'.repeat(state.crystalsRemaining)+'◇'.repeat(5-state.crystalsRemaining)+' · 빙결핵 '+state.crystalsRemaining+' / 5 · '+(state.crystalsRemaining?'HP 1 잠금':'잠금 해제');if(changed)animateCore(n,[{filter:'brightness(2)'},{filter:'brightness(1)'}],300);}}
    if(state?.id==='TIME_GOLEM'){
      const phases=find(root,'golem-phases');
      for(const [i,p]of state.phases.entries()){
        const node=phases?.querySelector(`[data-phase-index="${i}"]`);if(!node)continue;
        const status=p.broken?'broken':i===state.activePhase?'active':'locked';node.className=`golem-phase ${status}`;
        node.querySelector('.golem-phase-label').textContent=`${['🛡 과거의 갑옷','⚙ 현재의 엔진','✦ 미래의 신경'][i]} · ${{broken:'파괴',active:'활성',locked:'잠금'}[status]}`;
        node.querySelector('.golem-phase-hp').textContent=`${p.hp} / ${p.maxHp}`;node.querySelector('.hp-fill').style.width=`${p.hp/p.maxHp*100}%`;
      }
      const enemy=find(root,'enemy');if(enemy)enemy.dataset.golemPhase=String(state.activePhase);
    }
    const node=find(root,'boss-veil');
    if(node&&state?.id==='CLAUSE_LINK_SHIELD'){node.dataset.active=String(state.active);node.textContent=state.active?'연결의 보호막 · 피해 50%':'연결의 보호막 해제';}
    if(node&&state?.id==='SVOO_VEIL'){
      node.dataset.active=String(state.active);
      node.textContent=state.active?'보호 장막 · 피해 ×¼ · 4형식으로 해제':'보호 장막 해제';
    }
  };
  const resizeEffects=()=>{visualSnapshot=null;scoreEffects.clear();for(const a of animations){try{a.cancel();}catch{}}animations=[];clearCore();effectNodes.forEach(n=>n.remove());effectNodes=[];};
  const adapter = {
    setPaused(paused){scoreEffects.pause(paused);for(const a of animations){if(paused)a.pause();else a.play();}if(paused)audio?.stopAll?.();},
    setLocked(locked) { root.dataset.presenting = String(locked); root.setAttribute('aria-busy', String(locked)); },
    begin(resolution, options) {
      current = resolution; settings = options;scoreEffects.begin(options);root.ownerDocument.addEventListener('atlas:viewport',resizeEffects);
      clearHighlights(); adapter.clearConnections(); visualSnapshot=snapshotCards(); showHp(resolution.enemyHpBefore);showBossState(resolution.bossStateBefore);
      text('score', '0'); text('label', '문장을 펼칩니다'); text('power', '');
      const enemy = find(root, 'enemy');monsterViewFor(enemy)?.begin(options); if (enemy) { enemy.style.opacity = '1'; enemy.dataset.defeated = 'false'; }
      root.style.setProperty('--attack-intensity', String(options.intensity));
    },
    onScore(event, { step, intensity,combo=0 }) {
      effectNodes.forEach(n=>n.remove());effectNodes=[];
      if(event.sourceId==='CLAUSE.RELATIVE')for(const r of current.analysis.relativeClauses??[]){
        const line=connect(root,r.antecedentHeadCardId,[r.cardIds[0]]);line?.querySelectorAll('path').forEach(p=>{p.setAttribute('stroke','#b8985d');p.setAttribute('stroke-width','1.5');});
        const head=findCard(root,r.antecedentHeadCardId);if(head)head.dataset.relativeAntecedent='true';
        for(const id of r.cardIds){const card=findCard(root,id);if(card)card.dataset.relativeRole=r.relativeRole;}
        const first=findCard(root,r.cardIds[0]);if(first){const label=root.ownerDocument.createElement('span');label.dataset.relativeLabel='true';label.textContent=({SUBJECT:'주격 관계절',OBJECT:'목적격 관계절',ADVERBIAL:'관계부사절'})[r.relativeRole]+(r.markerOmitted?' · 관계사 생략':'');first.append(label);}
      }
      if(event.phase==='LINKS'){
        for(const [i,c]of (current.analysis.clauses??[]).entries()){const ids=current.analysis.nodes.find(n=>n.id===c.nodeId)?.cardIds??[];for(const id of ids){const card=findCard(root,id);if(card)card.dataset.clauseGroup=String(i%3);}}
        for(const n of current.analysis.nodes.filter(n=>n.type==='CONTENT_CLAUSE'))for(const id of n.cardIds){const card=findCard(root,id);if(card)card.dataset.contentObject='true';}
        for(const id of event.connectToCardIds??[]){const card=findCard(root,id);if(card){card.classList.add('connector-bridge');animate(card,[{filter:'brightness(1)'},{filter:'brightness(2)',boxShadow:'0 0 18px #a4edff'},{filter:'brightness(1)'}],500);}}
      }
      if(event.sourceId==='boss.skyShield.release')animate(find(root,'boss-veil'),[{filter:'brightness(2)',transform:'scale(1.08)'},{filter:'brightness(1)',transform:'scale(1)'}],500);
      const label=event.sourceId==='stage.01'?(event.labelKo??event.phase).replace('기본 문형','1·2·3형식'):(event.labelKo??event.phase);
      // Show only this committed effect; the full timeline remains in attack records.
      const feedback=scoreFeedback(event),amount=feedback.amount;
      text('label',feedback.delta<0?`${feedback.kind==='defense'?'🛡 ':''}${event.before} → ${event.after} · ${amount} · ${label}`:amount&&!label.includes(amount)?`${label} · ${amount}`:label); text('score', event.after);
      const score = find(root, 'score'); if (score) { score.title = `${event.before} → ${event.after}`; score.dataset.before = String(event.before); score.dataset.after = String(event.after); }
      scoreEffects.score(event,combo);
      audio?.play?.(feedback.delta<0?(feedback.kind==='defense'?'blocked':'penalty'):event.phase==='CARD_BASE'?'card':'score', { step, intensity });
    },
    highlight(cardIds, roles = [], argumentsByNode=[]) {
      for (const id of cardIds) {
        const card = findCard(root, id); if (!card) continue;
        card.classList.add('presentation-highlight');
        animate(card, [{ filter: 'brightness(1)' }, { filter: 'brightness(1.45)' }, { filter: 'brightness(1)' }], 180);
      }
      for (const role of roles) {
        const card = findCard(root, role.cardInstanceId ?? role.cardId); if (!card) continue;
        const mark = root.ownerDocument.createElement('span'); mark.dataset.presentationRole = 'true';
        const key = role.role ?? role.functionRole;
        mark.textContent = role.labelKo ?? role.roleKo ?? ({ S: 'S · 주어', V: 'V · 동사', O: 'O · 목적어', C: 'C · 보어', SUBJECT: 'S · 주어', VERB: 'V · 동사', OBJECT: 'O · 목적어', COMPLEMENT: 'C · 보어',INDIRECT_OBJECT:'간접목적어 IO',DIRECT_OBJECT:'직접목적어 DO' })[key] ?? key ?? '';
        Object.assign(mark.style, { position: 'absolute', bottom: '-17px', left: '0', right: '0', fontSize: '11px', color: '#a9f4e0', whiteSpace: 'nowrap', textAlign: 'center', pointerEvents: 'none' });
        card.append(mark);
      }
      for(const node of argumentsByNode){
        node.cardIds.forEach((id,index)=>{
          const card=findCard(root,id);if(!card)return;
          card.dataset.argumentRole=node.grammaticalRole==='INDIRECT_OBJECT'?'IO':'DO';
          card.classList.toggle('argument-start',index===0);card.classList.toggle('argument-end',index===node.cardIds.length-1);
        });
      }
    },
    clearHighlights,
    pulseRune(sourceId,event={}) {
      const rune = [...root.querySelectorAll('[data-rune-id]')].find(node => node.dataset.runeId === sourceId);
      const weight=runeFeel(event.runeRarity??rune?.dataset.rarity,event.runeLevel??Number(rune?.dataset.level??1));
      if (rune) { rune.classList.add('presentation-rune-pulse'); animate(rune, [{ transform: 'scale(1)' }, { transform: `scale(${Math.min(1.12,1+.06*weight)})`, filter: `brightness(${1+.45*weight})` }, { transform: 'scale(1)' }], 260); }
      const gem=rune?.querySelector('.diamond-gem');if(gem)animate(gem,[{filter:'brightness(1)',backgroundPosition:'0% 50%'},{filter:'brightness(1.8)',backgroundPosition:'100% 50%'},{filter:'brightness(1)',backgroundPosition:'0% 50%'}],220);
      audio?.play?.('rune', { intensity: settings.intensity });
    },
    flyRune(event,{duration}){
      const rune=[...root.querySelectorAll('[data-rune-id]')].find(n=>n.dataset.runeId===event.sourceId),target=find(root,'score');
      if(!rune||!target||settings.effectsOff||settings.reducedMotion)return;
      const a=rune.getBoundingClientRect(),b=target.getBoundingClientRect(),color=runeForVersion(event.sourceId,current?.versions?.runes==='runes.0.10.1'?'0.10.1':current?.versions?.language)?.color??'#ddd';
      const weight=runeFeel(event.runeRarity??rune.dataset.rarity,event.runeLevel??Number(rune.dataset.level??1));
      const node=root.ownerDocument.createElement('i');node.className='rune-flight';node.dataset.runeId=event.sourceId;node.style.background=color;node.style.boxShadow=`0 0 ${12*weight}px ${3*weight}px ${color}`;
      const x=a.left+a.width/2,y=a.top+a.height/2,dx=b.left+b.width/2-x,dy=b.top+b.height/2-y;
      Object.assign(node.style,{position:'fixed',left:`${x}px`,top:`${y}px`});root.append(node);effectNodes.push(node);
      animate(node,[{transform:'translate(0,0) scale(.5)',opacity:.7},{transform:`translate(${dx*.45}px,${dy*.5-55}px) scale(${Math.min(1.12,.7+.25*weight)})`,opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.3)`,opacity:.1}],duration);
    },
    turnEnd(receipt){showHp(receipt.hpAfterTurnEnd);const hp=find(root,'hp');if(hp&&receipt.actualHeal>0)hp.style.color='#a4e8a1';const label=receipt.suppressed?'명사절 · 가주어 적중 — 이번 턴 회복 저지':receipt.actualHeal?`${receipt.bossId==='FINALE_SURFACE'?'서피스 스트럭처':'꿈의 도서관장'} 회복 +${receipt.actualHeal}`:`${receipt.bossId==='FINALE_SURFACE'?'서피스 스트럭처':'꿈의 도서관장'} 회복 0 · 최대 체력`;text('label',label);text('library-turn-end',label);root.dataset.corePhase='TURN_END';},
    setPower(power) { text('power', `${power} 위력`); text('score', power); },
    charge({ duration, intensity }) {
      root.dataset.corePhase='CHARGE';
      text('label', '힘을 모읍니다'); audio?.play?.('charge', { intensity });
      if(settings.effectsOff||settings.reducedMotion){animateCore(find(root,'score'),[{opacity:1},{opacity:.7},{opacity:1}],duration);return;}
      mountAttack();if(!attackBody)return;
      const cards=[...attackBody.children],a=visualSnapshot.rect;
      cards.forEach((card,i)=>{const x=a.width/2-parseFloat(card.style.left)-parseFloat(card.style.width)/2+(i-(cards.length-1)/2)*3,y=a.height/2-parseFloat(card.style.top)-parseFloat(card.style.height)/2;
        animateCore(card,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${x}px,${y}px) scale(.72) rotate(${(i%5-2)*3}deg)`}],duration,'forwards');});
    },
    lunge({ duration }) {
      root.dataset.corePhase='LUNGE';
      text('label', '문장 공격!');
      if(settings.effectsOff||settings.reducedMotion)return;
      mountAttack();const enemy=find(root,'enemy');
      if(attackBody&&enemy&&visualSnapshot){const a=visualSnapshot.rect,b=monsterViewFor(enemy)?.visibleRect()??enemy.getBoundingClientRect();
        const x=b.left+b.width/2-a.left-a.width/2,y=b.top+b.height/2-a.top-a.height/2;
        lungeAnimation=animateCore(attackBody,[{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${x}px,${y}px) scale(.65)`,opacity:1}],duration,'forwards');
      }
    },
    impact({ hpAfter, finalPower, actualHpLoss, killed, overkill, intensity,feel,zeroReason,feedbackKo }) {
      root.dataset.corePhase='IMPACT';showBossState(current?.bossStateAfter);if(current?.bossStateAfter?.id==='DUAL_RELATIVE_SEAL'){const enemy=find(root,'enemy');if(enemy)enemy.dataset.gateOpen=String(current.killed&&current.bossStateAfter.unlocked);}
      for(const id of current?.consumedTemporaryCardIds??[]){const card=findCard(root,id);if(card){card.dataset.shattered='true';animateCore(card,[{filter:'brightness(1)'},{filter:'brightness(2)',opacity:.5},{filter:'brightness(1)',opacity:.25}],280);}}
      showHp(hpAfter); text('label', actualHpLoss === 0 ? (zeroReason==='INCOMPLETE_SENTENCE'?feedbackKo:zeroReason==='ACCURACY_ZERO'?'형태를 확인해 보세요 · 피해 0':'방어에 막힘 · 피해 0') : killed ? `격파! · ${actualHpLoss} 피해` : `${actualHpLoss} 피해!`);
      if(current?.preventedDamage>0)text('label','빙결핵이 HP 1을 보호했습니다 · 막힌 피해 '+current.preventedDamage);
      if(current?.bossStateAfter?.id==='TIME_GOLEM'){
        showBossState(current.bossStateAfter);const effect=current.bossEffects.find(e=>e.phaseId);
        if(effect)text('label',effect.labelKo+(actualHpLoss?` · 위력 ${finalPower} / 적용 피해 ${actualHpLoss}`:''));
        if(current.phaseBreak){const layer=root.querySelector(`[data-phase-id="${current.phaseId}"]`);animate(layer,[{filter:'brightness(2)',transform:'scale(1.03)'},{filter:'brightness(.6)',transform:'scale(1)'}],800);}
      }
      if(current?.foresightResult?.blocked)text('label',current.foresightResult.labelKo);
      if(killed&&overkill>0&&actualHpLoss>0){text('label',`격파! · 초과 피해 +${overkill}`);find(root,'label')?.setAttribute('data-overkill-tier',feel.tier);}
      audio?.play?.(actualHpLoss === 0 ? 'blocked' : 'impact', { intensity });
      root.dataset.impactTier=feel.tier;
      if(zeroReason==='INCOMPLETE_SENTENCE'){animate(attackBody,[{opacity:1},{opacity:.4},{opacity:1}],500);return;}
      if(actualHpLoss>0)audio?.play?.('impactLow',{intensity:Math.min(1.4,intensity)});
      const enemy=find(root,'enemy');monsterViewFor(enemy)?.impact({attackId:current.attackId,actualHpLoss,killed,staticMotion:settings.effectsOff||settings.reducedMotion});if(enemy)enemy.dataset.defeated=String(killed);
      if(actualHpLoss>0)animateCore(enemy,[{filter:'brightness(1)'},{filter:'brightness(1.4)'},{filter:'brightness(1)'}],Math.max(90,feel.hitStop));
      if(actualHpLoss>0&&!settings.effectsOff&&!settings.reducedMotion){const ring=root.ownerDocument.createElement('i');ring.className='impact-ring';find(root,'enemy')?.append(ring);effectNodes.push(ring);animate(ring,[{transform:'scale(.4)',opacity:.9},{transform:'scale(1.8)',opacity:0}],feel.hitStop+feel.settle);}
    },
    recoil({killed,feel,duration}){
      root.dataset.corePhase='RECOIL';
      lungeAnimation?.cancel();lungeAnimation=null;
      clearCore();
      const enemy=find(root,'enemy');
      if(feel.tier==='BLOCKED'||monsterViewFor(enemy))return;
      animateCore(enemy,killed?[{transform:'translateX(0) rotate(0)',opacity:1},{transform:`translateX(${feel.recoil}px) rotate(8deg)`,opacity:.8},{transform:`translateX(${feel.recoil}px) rotate(12deg)`,opacity:0}]:[{transform:'translateX(0)'},{transform:'translateX('+feel.recoil+'px) scale(.94,1.05)'},{transform:'translateX(0) scale(1)'}],duration);
    },
    cancel(){monsterViewFor(find(root,'enemy'))?.reset(current?.killed);root.ownerDocument.removeEventListener('atlas:viewport',resizeEffects);scoreEffects.clear();for(const a of animations){try{a.cancel();}catch{}}animations=[];clearCore();effectNodes.forEach(n=>n.remove());effectNodes=[];clearHighlights();adapter.clearConnections();audio?.stopAll?.();root.dataset.corePhase='CANCELLED';},
    finish(resolution) {
      root.ownerDocument.removeEventListener('atlas:viewport',resizeEffects);
      scoreEffects.clear();
      clearCore();root.dataset.corePhase='FINISHED';
      for (const animation of animations) { try { animation.cancel(); } catch { /* no-op */ } } animations = [];
      effectNodes.forEach(n=>n.remove());effectNodes=[];
      const score=find(root,'score');if(score){score.style.textShadow='';score.style.fontWeight='';}
      audio?.stopAll?.();
      showHp(resolution.turnEndReceipt?.hpAfterTurnEnd??resolution.enemyHpAfter);showBossState(resolution.bossStateAfter);
      const enemy = find(root, 'enemy');monsterViewFor(enemy)?.reset(resolution.killed); if (enemy) { enemy.style.opacity = resolution.killed ? '0' : '1'; enemy.dataset.defeated = String(Boolean(resolution.killed)); }
      clearHighlights(); adapter.clearConnections();
    },
    connect(fromCardId, toCardIds) { return connect(root, fromCardId, toCardIds); },
    clearConnections() {
    root.querySelectorAll('[data-relative-role],[data-relative-antecedent]').forEach(n=>{delete n.dataset.relativeRole;delete n.dataset.relativeAntecedent;});
    root.querySelectorAll('[data-relative-label]').forEach(n=>n.remove());
 root.querySelectorAll('[data-presentation="connector"]').forEach(node => node.remove()); },
  };
  return adapter;
}
