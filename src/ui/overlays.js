import {learningSummary,MEANING_NOTE,MEANING_VERSION} from '../engine/meaning.js';
import { el, button, modal, toast } from './dom.js';
import { wordCard, POS_LABELS } from './cards.js';
import { cardModel } from './models.js';
import { registry, grammarTags } from '../data/language/index.js';
import { canSaveRun } from '../services/localStore.js';

const locked = state => ['RESOLVING', 'PRESENTING', 'TURN_START'].includes(state?.combat?.phase);
const number = value => Number.isFinite(value) ? value.toLocaleString('ko-KR') : '0';
const phaseKo = state => ({ STAGE_INTRO: '초원 입장 전', BATTLE: '전투 시작 전', REWARD: '보상 선택', BETWEEN_BATTLES: '전투 사이', CONTENT_COMPLETE: '초원 구간 완료', DEFEAT: '원정 종료' })[state?.status] ?? '원정';
const sentenceText = resolution => resolution?.sentenceSnapshot?.orderedTokens?.map(token => token.surface).join(' ') ?? '';
const small = text => el('p', { class: 'muted', text });

function zoneOf(state, id) {
  const combat = state.combat;
  if (!combat) return '원정 덱';
  if (combat.handIds.includes(id)) return '손패';
  if (combat.sentenceSlots.some(slot => slot.cardInstanceId === id)) return '문장 조합대';
  if (combat.drawIds.includes(id)) return '드로우';
  if (combat.discardIds.includes(id)) return '버린 카드';
  return '원정 덱';
}

/** Read-only pile inspection. Draw is sorted by visible words and never exposes RNG or draw indices. */
export function openDeck(state, kind = 'all') {
  if (!state) return modal('나의 덱', small('원정을 시작하면 카드를 확인할 수 있습니다.'));
  const normalized = String(kind).toLowerCase();
  const isDraw = ['draw', 'drawids'].includes(normalized), isDiscard = ['discard', 'discardids'].includes(normalized);
  const ids = [...(isDraw ? state.combat?.drawIds ?? [] : isDiscard ? state.combat?.discardIds ?? [] : state.activeCardIds)];
  const models = ids.filter(id => state.cardInstances[id]).map(id => {
    const selection = state.combat?.sentenceSlots.find(slot => slot.cardInstanceId === id)?.selection;
    return cardModel(state.cardInstances[id], selection);
  });
  if (!isDiscard) models.sort((a, b) => a.lexeme.lemma.localeCompare(b.lexeme.lemma, 'en') || b.polish - a.polish);
  const countByLexeme = new Map();
  for (const id of state.activeCardIds) {
    const def = registry.cardById[state.cardInstances[id]?.cardDefId];
    if (def) countByLexeme.set(def.lexemeId, (countByLexeme.get(def.lexemeId) ?? 0) + 1);
  }
  const title = isDraw ? `드로우 ${models.length}장 · 순서는 공개하지 않음` : isDiscard ? `버린 카드 ${models.length}장` : `나의 덱 ${models.length}장`;
  const grid = el('div', { class: 'deck-grid' }, models.map((model, index) => el('div', { class: 'deck-entry' },
    wordCard(model, { readonly: true }),
    el('small', { text: `${isDiscard && index === 0 ? '최근 버린 카드 · ' : ''}${zoneOf(state, model.id)} · 같은 단어 보유 ${countByLexeme.get(model.lexemeId) ?? 1}장` }),
  )));
  return modal(title, [small(isDraw ? '단어 이름순으로 정렬한 목록입니다. 다음에 뽑을 카드는 알 수 없습니다.' : isDiscard ? '가장 최근에 버린 카드부터 표시합니다. 이 화면에서는 카드를 이동하지 않습니다.' : '현재 원정에 남아 있는 실제 카드와 영역입니다. 이 화면에서는 카드를 이동하지 않습니다.'),
    models.length ? grid : small('현재 이 영역에 카드가 없습니다.')], { wide: true });
}

/** Only words encountered during this run are visible, including words removed later. */
export function openDictionary(state) {
  const ids = state?.vocabulary?.encounteredLexemeIds ?? [];
  const words = [...new Set(ids)].map(id => registry.lexemeById[id]).filter(Boolean).sort((a, b) => a.lemma.localeCompare(b.lemma, 'en'));
  const search = el('input', { type: 'search', placeholder: '영단어 또는 뜻 찾기', 'aria-label': '원정 사전 검색' });
  const count = el('span', { class: 'muted', text: `${words.length}개 단어` });
  const grid = el('div', { class: 'dictionary-grid' });
  const render = () => {
    const term = search.value.trim().toLocaleLowerCase();
    const filtered = words.filter(word => `${word.lemma} ${word.glossKo}`.toLocaleLowerCase().includes(term));
    count.textContent = `${filtered.length} / ${words.length}개 단어`;
    grid.replaceChildren(...filtered.map(word => {
      const senses = word.senseIds.map(id => registry.senseById[id]).filter(Boolean);
      const forms = word.formIds.map(id => registry.formById[id]).filter(form => form?.runtimeReady);
      const owned=Object.values(state?.cardInstances??{}).filter(c=>state.activeCardIds.includes(c.instanceId)&&registry.cardById[c.cardDefId]?.lexemeId===word.id);
      const polishSummary=[0,1,2,3].map(level=>{const count=owned.filter(c=>c.polishLevel===level).length;return count?`연마 +${level}: 기본 10 + 연마 ${level*5} = ${10+level*5}점 · ${count}장`:null;}).filter(Boolean);
      const notes = [...new Set([word.usageNoteKo, ...senses.map(sense => sense.usageNoteKo)].filter(Boolean))];
      return el('article', { class: 'dictionary-entry' },
        el('strong', { text: word.lemma }), el('span', { class: 'badge', text: ` · ${POS_LABELS[word.pos] ?? word.pos}` }),
        ...senses.map(sense => el('p', { text: sense.glossKo })),
        el('small', { text: `허용 형태: ${forms.map(form => `${form.surface} (${form.labelKo})`).join(' · ') || '0.1에서는 제공하지 않음'}` }),
        ...notes.map(note => el('small', { text: note })),
        el('small', { text: '카드 기본점수 10 · 연마 단계마다 +5 · 최대 +3' }),...polishSummary.map(text=>el('small',{text})),
      );
    }));
    if (!filtered.length) grid.append(small(words.length ? '검색 결과가 없습니다.' : '원정을 시작하면 만난 단어가 여기에 남습니다.'));
  };
  search.addEventListener('input', render); render();
  return modal('원정 사전', [small('이번 원정에서 소개·획득하거나 보상으로 공개된 단어입니다. 카드를 제거해도 사전에는 남습니다.'),
    el('div', { class: 'dialog-actions wrap' }, search, count), grid], { wide: true });
}

const RULES = {
  'FRAME.SV': '주어 + 동사. 목적어 없이 뜻을 마치는 동사를 사용합니다.',
  'FRAME.SVC': '주어 + 동사 + 보어. 보어는 주어의 상태나 정체를 설명합니다.',
  'FRAME.SVO': '주어 + 동사 + 목적어. 목적어는 동사의 대상을 나타냅니다.',
  'MODIFIER.ADJECTIVE': '형용사는 명사 앞에서 명사를 수식할 수 있습니다.',
  'MODIFIER.ADVERB': '부사는 허용된 위치에서 동사·형용사·부사를 수식합니다.',
  'PHRASE.PP': '전치사 뒤에 명사구를 붙여 장소 등의 정보를 더합니다.',
};

function meaningBlock(summary){
  const meaning=summary?.meaning;
  if(!meaning?.meaningVersion)return el('p',{class:'meaning-hint muted',text:'이전 기록: 해석 정보 없음'});
  return el('section',{class:'meaning-hint'},el('strong',{text:meaning.status==='COMPLETE_HINT'?'뜻 참고 · 자동 구성':'성분별 뜻 참고'}),el('p',{text:meaning.textKo}),
    meaning.status!=='COMPLETE_HINT'&&(meaning.segments??[]).map(s=>el('p',{text:`${s.label}: ${s.textKo}`})),
    el('small',{text:`원문 문법: ${summary.grammarStatus} ${(summary.issues??[]).map(i=>i.messageKo).join(' · ')}`}),meaning.meaningVersion!==MEANING_VERSION&&el('small',{text:'이전 의미 모듈로 저장한 참고입니다.'}));
}
function attackRecord(resolution) {
  const table = el('table', { class: 'timeline-table' },
    el('thead', {}, el('tr', {}, ['순서', '효과', '이전', '이후'].map(text => el('th', { text })))),
    el('tbody', {}, (resolution.scoreTimeline ?? []).map((event, index) => el('tr', {},
      el('td', { text: index + 1 }), el('td', { text: event.labelKo ?? event.phase }),
      el('td', { text: number(event.before) }), el('td', { text: number(event.after) }),
    ))),
  );
  return el('details', { class: 'dictionary-entry' },
    el('summary', { text: `${sentenceText(resolution)} · 최종 위력 ${number(resolution.finalPower)}` }),
    small(`실제 피해 ${number(resolution.actualHpLoss)} · 오버킬 ${number(resolution.overkill)} · 적 HP ${number(resolution.enemyHpBefore)} → ${number(resolution.enemyHpAfter)}`),
    meaningBlock(learningSummary(resolution)),table,
  );
}

/** Recorded attacks are displayed directly. Opening this panel never reapplies their effects. */
export function openRecords(profile, state) {
  const records = profile?.grammarRecords ?? {};
  const summary = el('div', { class: 'record-grid' },
    ...[[profile?.bestAttack ?? 0, '최고 공격위력'], [profile?.totalActualDamage ?? 0, '누적 실제 피해'], [profile?.qualifiedRunIds?.length ?? 0, '초원 완료 원정']].map(([value, label]) =>
      el('div', {}, el('strong', { text: number(value) }), el('span', { text: label }))),
  );
  const catalog = el('div', { class: 'dictionary-grid' }, Object.entries(grammarTags).map(([tag, label]) => {
    const record = records[tag];
    return el('article', { class: 'dictionary-entry' }, el('h3', { text: label }), small(RULES[tag] ?? ''),
      record ? [el('p', { text: `사용 ${number(record.count)}회 · 최고 위력 ${number(record.bestPower)}` }),
        el('p', { text: `처음 사용: ${record.firstSentence}` }),meaningBlock(record.firstLearning), el('p', { text: `최고 위력 문장: ${record.bestSentence}` }),meaningBlock(record.bestLearning)]
        : small('아직 이 구조로 공격한 기록이 없습니다.'),
    );
  }));
  const attacks = state?.stats?.history ?? (state?.stats?.lastAttack ? [state.stats.lastAttack] : []);
  return modal('문장 도감 · 최근 공격', [small(`${profile?.displayName ?? '여행자'}의 실제 공격 기록입니다. 샌드박스와 연출 샘플은 기록하지 않습니다.`),
    small(MEANING_NOTE),summary, el('h3', { text: '내 문장 도감' }), catalog,
    el('h3', { text: `이번 원정 최근 공격 ${attacks.length}회` }),
    attacks.length ? el('div', { class: 'save-slots' }, attacks.map(attackRecord)) : small('아직 확정된 공격이 없습니다.')], { wide: true });
}

/** Focused read-only shortcut for the already committed combat history. */
export function openRecentAttack(state) {
  const attacks = state?.stats?.history ?? (state?.stats?.lastAttack ? [state.stats.lastAttack] : []);
  return modal('최근 공격', [small('이미 확정된 공격의 점수 내역입니다. 다시 피해를 주거나 보상을 지급하지 않습니다.'),
    attacks.length ? el('div', { class: 'save-slots' }, attacks.map(attackRecord)) : small('아직 확정된 공격이 없습니다.')], { wide: true });
}

/** Emits a new settings value; caller owns profile persistence and AudioManager configuration. */
export function openSettings(settings = {}, onChange, onGuide) {
  let value = { speed: 1, sfxVolume: 45, muted: false, effectsOff: false, ...settings };
  const update = patch => {
    value = { ...value, ...patch };
    try { Promise.resolve(onChange?.({ ...value })).catch(error => toast(`설정을 저장하지 못했습니다: ${error.message}`)); }
    catch (error) { toast(`설정을 바꾸지 못했습니다: ${error.message}`); }
  };
  const speed = el('select', { 'aria-label': '연출 속도', onchange: event => update({ speed: Number(event.target.value) }) },
    [1, 1.5, 2].map(speed => el('option', { value: String(speed), text: `${speed}×`, selected: value.speed === speed })));
  const volumeLabel = el('span', { text: `${value.sfxVolume}%` });
  const volume = el('input', { type: 'range', min: 0, max: 100, step: 1, value: value.sfxVolume, 'aria-label': '효과음 음량', oninput: event => {
    const sfxVolume = Number(event.target.value); volumeLabel.textContent = `${sfxVolume}%`; update({ sfxVolume });
  } });
  const mute = el('input', { type: 'checkbox', checked: Boolean(value.muted), 'aria-label': '음소거', onchange: event => update({ muted: event.target.checked }) });
  const reduced = el('input', { type: 'checkbox', checked: Boolean(value.effectsOff), 'aria-label': '효과 감소', onchange: event => update({ effectsOff: event.target.checked }) });
  let view;
  const controls = el('div', { class: 'settings-grid' },
    el('label', {}, '연출 속도', speed),
    el('label', {}, '효과음 음량', el('div', { class: 'dialog-actions' }, volume, volumeLabel)),
    el('label', {}, '음소거', mute), el('label', {}, '효과 감소', reduced),
    small('속도·효과·소리는 점수와 전투 결과를 바꾸지 않습니다. 기기의 동작 줄이기 설정도 적용합니다.'),
    onGuide && button('조작 안내 다시 보기', () => { view.close(); onGuide(); }, 'secondary'),
  );
  view = modal('설정', controls); return view;
}

/** Three manual slots, transaction completion before success, and validated load through caller. */
export function openSaves({ store, profile, state, onLoad }) {
  const list = el('div', { class: 'save-slots' });
  const message = el('p', { class: 'muted', role: 'status', 'aria-live': 'polite', text: '저장 슬롯을 불러오는 중입니다.' });
  const present = locked(state), canSave = canSaveRun(state) && !present;
  let view, busy = false, slots = [], slotsLoaded = false;
  const render = () => {
    list.replaceChildren(...[1, 2, 3].map(slot => {
      const saved = slots.find(item => item.slot === slot);
      const exists = saved && !saved.empty;
      const savedRun = saved?.run;
      const date = exists && Number.isFinite(saved.savedAt) ? new Date(saved.savedAt).toLocaleString('ko-KR') : '';
      const info = el('div', {}, el('strong', { text: `슬롯 ${slot}${exists ? '' : slotsLoaded ? ' · 비어 있음' : ' · 확인 중'}` }),
        exists && el('p', { text: `${savedRun?.version==='0.1.0'?'이전 버전 저장 · ':''}${phaseKo(savedRun)} · Stage 1-${savedRun?.progress?.battleNumber ?? '?'} · ${savedRun?.activeCardIds?.length ?? 0}장 · ${savedRun?.economy?.gold ?? 0}골드` }),
        date && el('p', { text: date }));
      const save = button(exists ? '덮어 저장' : '저장', () => perform(async () => {
        await store.saveRun(profile.playerId, slot, state);
        slots = await store.listSlots(profile.playerId);
        message.textContent = `슬롯 ${slot}에 저장했습니다.`; toast(`슬롯 ${slot} 저장 완료`);
      }), 'secondary', { disabled: busy || !slotsLoaded || !canSave || !profile?.playerId || !store?.available, 'aria-label': `슬롯 ${slot} 저장` });
      const load = button('불러오기', () => perform(async () => {
        const run = await store.loadRun(profile.playerId, slot);
        if (typeof onLoad !== 'function') throw Error('불러오기 연결이 준비되지 않았습니다.');
        const result = await onLoad(run); if (result?.ok === false) throw Error(result.message ?? '현재 상태에서 불러올 수 없습니다.');
        view.close(); toast(`슬롯 ${slot}을 불러왔습니다.`);
      }), 'secondary', { disabled: busy || !exists || present || !profile?.playerId || !store?.available, 'aria-label': `슬롯 ${slot} 불러오기` });
      return el('article', { class: 'save-slot' }, info, el('div', { class: 'save-slot-actions' }, save, load));
    }));
  };
  const perform = async action => {
    if (busy || present) return;
    busy = true; message.textContent = '처리 중입니다…'; render();
    try { await action(); }
    catch (error) { message.textContent = `완료하지 못했습니다: ${error.message} 현재 메모리 플레이는 계속할 수 있습니다.`; }
    finally { busy = false; if (view.dialog.isConnected) render(); }
  };
  const refresh = async () => {
    busy = true; render();
    try {
      if (!store?.available || !profile?.playerId) throw Error('로컬 저장소 또는 프로필을 사용할 수 없습니다.');
      slots = await store.listSlots(profile.playerId);
      slotsLoaded = true;
      message.textContent = present ? '공격 연출 중에는 저장·불러오기를 할 수 없습니다.' : canSave ? '현재 안전 지점을 저장할 수 있습니다.' : '저장은 전투의 첫 조작 전, 보상 선택, 전투 사이, 구간 완료에서 가능합니다.';
    } catch (error) { message.textContent = `${error.message} 저장 없이 현재 플레이를 계속할 수 있습니다.`; }
    finally { busy = false; if (view.dialog.isConnected) render(); }
  };
  view = modal('수동 저장 · 3슬롯', [small('저장은 이 브라우저의 현재 로컬 프로필에 보관됩니다. 초기 패·고정 보상·난수 상태를 그대로 복원합니다.'), message, list,
    button('슬롯 다시 읽기', refresh, 'quiet')]);
  refresh(); return view;
}
