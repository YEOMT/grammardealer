import { el, button, modal } from './dom.js';
export const POS_LABELS = { NOUN: '명사', PRONOUN: '대명사', VERB: '동사', ADJECTIVE: '형용사', ADVERB: '부사', DETERMINER: '한정사', PREPOSITION: '전치사', FUNCTION: '연결어' };
export const RARITY_LABELS = { COMMON: '일반', UNCOMMON: '고급', RARE: '희귀' };
/** Display-only card model. No grammar inspection takes place while rendering. */
export function wordCard(model, { zone, onActivate, onForm, onSelect, selected = false, readonly = false, compact = false } = {}) {
  const node = el('article', { class: `word-card pos-${model.pos || 'NOUN'} ${selected ? 'selected' : ''} ${compact ? 'compact' : ''}`, dataset: { cardId: model.id, lexemeId: model.lexemeId, zone: zone || 'readonly' } });
  const body = el('div', { class: 'card-body', role: readonly ? 'group' : 'button', tabIndex: readonly ? -1 : 0, 'aria-label': `${model.surface}, ${POS_LABELS[model.pos] || model.pos}${model.polish ? `, 연마 ${model.polish}` : ''}${readonly ? '' : ', Enter로 이동'}` },
    el('div', { class: 'card-topline' }, el('span', { class: 'pos-label', text: POS_LABELS[model.pos] || model.pos }), el('span', { class: 'card-value', text: `${(model.baseScore ?? 10)+(model.polish||0)*5}` })),
    el('strong', { class: `card-word ${model.surface?.length > 10 ? 'long-word' : ''}`, text: model.surface, style: `--fit-factor:${Math.max(1,model.surface.length * .66)}` }),
    el('div', { class: 'card-footline' }, el('span', { text: RARITY_LABELS[model.rarity] || '일반' }), el('span', { class:model.polish?'polish-badge':'',text: model.polish ? `✦ +${model.polish}` : '◇',title:`기본 ${model.baseScore??10} + 연마 ${(model.polish||0)*5} = ${(model.baseScore??10)+(model.polish||0)*5}` })));
  if (!readonly) {
    body.addEventListener('click', e => { if (Date.now() < Number(node.dataset.suppressUntil || 0)) { e.preventDefault(); return; } onActivate?.(model.id); });
    body.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate?.(model.id); } });
  }
  node.title=`${model.surface} · 기본 ${model.baseScore??10} + 연마 ${(model.polish||0)*5} = ${(model.baseScore??10)+(model.polish||0)*5}점`;
  node.append(body);
  if(onSelect&&!readonly){
    node.classList.add('selectable-card');
    node.append(button(selected?'✓':'○',e=>{e.stopPropagation();onSelect(model.id);},'card-select',{'aria-label':`${model.surface} 버리기 선택`,'aria-pressed':String(selected),onpointerdown:e=>e.stopPropagation(),onkeydown:e=>e.stopPropagation()}));
  }
  if (onForm && !readonly) node.append(button('형태 ▾', e => { e.stopPropagation(); onForm(model.id); }, 'form-button', { 'aria-label': `${model.surface} 형태 선택`, onpointerdown: e => e.stopPropagation() }));
  return node;
}
export function formMenu(model, forms, onSelect, { onMoveLeft, onMoveRight, onRemove, onCopy, onSwap } = {}) {
  let view;
  const choices = el('div', { class: 'form-choices' }, forms.map(form => { const duplicate = forms.filter(f => f.surface === form.surface).length > 1; const choice = button('', () => { view.close(); onSelect(form.id || form.formId); }, `form-choice ${form.surface === model.surface ? 'current' : ''}`, { 'aria-label': `형태 ${form.surface}${duplicate ? ` · ${form.labelKo}` : ''}`, dataset: { formId: form.id || form.formId } }); choice.append(el('strong', { text: form.surface }), el('small', { text: form.labelKo || '기본형' })); return choice; }));
  const extras = el('div', { class: 'dialog-actions wrap' }, onMoveLeft && button('← 왼쪽으로', () => { view.close(); onMoveLeft(); }, 'secondary'), onMoveRight && button('오른쪽으로 →', () => { view.close(); onMoveRight(); }, 'secondary'), onSwap && button('손패와 맞교환', () => { view.close(); onSwap(); }, 'secondary'), onCopy && button('한 장 복사', () => { view.close(); onCopy(); }, 'secondary'), onRemove && button('카드 회수', () => { view.close(); onRemove(); }, 'secondary'));
  view = modal(`${model.surface} · 형태 선택`, [el('p', { class: 'muted', text: '카드 한 장의 형태만 바꿉니다. 문장 검사는 공격 확정 뒤에 진행합니다.' }), choices, extras]);
  return view;
}
/** Pointer capture + one pointer + 8px threshold. Zones and stable IDs are supplied by the caller. */
export function bindCardDrag(container, onDrop, { enabled = () => true } = {}) {
  let active = null;
  const cleanup = () => {
    if (!active) return;
    active.ghost?.remove(); active.node.classList.remove('drag-source');
    try { active.body.releasePointerCapture(active.pointerId); } catch {}
    container.querySelectorAll('.drop-before,.drop-after,.drop-replace,.drop-zone-active').forEach(n => n.classList.remove('drop-before','drop-after','drop-replace','drop-zone-active'));
    active = null;
  };
  const targetAt = (x, y) => {
    const target = document.elementFromPoint(x,y);
    const zone = target?.closest('[data-card-zone]');
    if (!zone || !container.contains(zone)) return null;
    const card = target.closest('.word-card');
    if (card && zone.contains(card)) {
      const rect = card.getBoundingClientRect(); const offset = (x - rect.left) / rect.width;
      const crossZone = active.zone !== zone.dataset.cardZone;
      const mode = crossZone && offset > .2 && offset < .8 ? 'SWAP' : 'INSERT';
      const cards = [...zone.querySelectorAll('.word-card')];
      return { zone, card, targetZone: zone.dataset.cardZone, targetCardId: card.dataset.cardId, index: cards.indexOf(card) + (offset > .5 ? 1 : 0), mode, after: offset > .5 };
    }
    const cards = [...zone.querySelectorAll('.word-card')];
    if (!cards.length) return { zone, targetZone: zone.dataset.cardZone, index: 0, mode: 'INSERT' };
    let nearest = cards[0], distance = Infinity;
    for (const candidate of cards) { const rect=candidate.getBoundingClientRect(); const dx=Math.max(rect.left-x,0,x-rect.right),dy=Math.max(rect.top-y,0,y-rect.bottom); const d=dx*dx+dy*dy; if(d<distance){distance=d;nearest=candidate;} }
    const rect=nearest.getBoundingClientRect(), after=x>=rect.left+rect.width/2;
    return { zone, card:nearest, targetZone:zone.dataset.cardZone, targetCardId:nearest.dataset.cardId, index:cards.indexOf(nearest)+(after?1:0), mode:'INSERT', after };
  };
  const down = e => {
    if (active || !enabled() || e.button !== 0 || e.target.closest('button')) return;
    const body = e.target.closest('.card-body'), node = body?.closest('.word-card');
    if (!node || !container.contains(node) || body.tabIndex < 0) return;
    active = { node, body, pointerId: e.pointerId, startX:e.clientX, startY:e.clientY, id:node.dataset.cardId, zone:node.dataset.zone, dragging:false };
    body.setPointerCapture(e.pointerId);
  };
  const move = e => {
    if (!active || e.pointerId !== active.pointerId) return;
    if (!active.dragging && Math.hypot(e.clientX-active.startX,e.clientY-active.startY) >= 8) {
      active.dragging = true; active.node.classList.add('drag-source');
      active.node.dataset.suppressUntil = String(Date.now()+1000);
      const rect = active.node.getBoundingClientRect(); active.ghost = active.node.cloneNode(true);
      active.ghost.classList.add('drag-ghost'); active.ghost.inert=true; active.ghost.setAttribute('aria-hidden','true'); active.ghost.style.width=`${rect.width}px`; active.ghost.style.height=`${rect.height}px`; active.ghost.removeAttribute('data-card-id'); document.body.append(active.ghost);
    }
    if (!active.dragging) return;
    e.preventDefault(); active.ghost.style.left=`${e.clientX-45}px`; active.ghost.style.top=`${e.clientY-35}px`;
    container.querySelectorAll('.drop-before,.drop-after,.drop-replace,.drop-zone-active').forEach(n => n.classList.remove('drop-before','drop-after','drop-replace','drop-zone-active'));
    active.target = targetAt(e.clientX,e.clientY);
    if (active.target) { const t=active.target; t.zone.classList.add('drop-zone-active'); t.card?.classList.add(t.mode==='SWAP'?'drop-replace':t.after?'drop-after':'drop-before'); }
  };
  const up = e => {
    if (!active || e.pointerId !== active.pointerId) return;
    const saved = active;
    if (saved.dragging) { e.preventDefault(); saved.node.dataset.suppressUntil=String(Date.now()+1000); }
    cleanup();
    if (saved.dragging && saved.target) onDrop({cardId:saved.id,sourceZone:saved.zone,targetZone:saved.target.targetZone,targetCardId:saved.target.targetCardId,index:saved.target.index,mode:saved.target.mode});
  };
  const cancel = e => { if (!e.pointerId || active?.pointerId === e.pointerId) cleanup(); };
  container.addEventListener('pointerdown',down); container.addEventListener('pointermove',move); container.addEventListener('pointerup',up); container.addEventListener('pointercancel',cancel); window.addEventListener('resize',cancel);
  return () => { cleanup(); container.removeEventListener('pointerdown',down); container.removeEventListener('pointermove',move); container.removeEventListener('pointerup',up); container.removeEventListener('pointercancel',cancel); window.removeEventListener('resize',cancel); };
}
