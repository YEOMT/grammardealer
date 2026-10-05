import {CLAUSE_ROLES,LINK_ROLES,CLAUSE_GUIDE} from '../data/grammarGuideData.js';
import {learningRecord,reviewProfileLearning,studentStatus,displayLearningRecord} from '../engine/learningRecords.js';
import {GRAMMAR_GUIDE,ROLE_GUIDE,DATIVE_GUIDE,LOCATION_GUIDE,TIME_ROLE_LABELS,formMeaning,verbUsage} from '../data/grammarGuideData.js';
import { el, button, modal, toast } from './dom.js';
import { wordCard, POS_LABELS } from './cards.js';
import { cardModel } from './models.js';
import { registry, registryForVersion, grammarTags } from '../data/language/index.js';
import { canSaveRun } from '../services/localStore.js';

const locked = state => ['RESOLVING', 'PRESENTING', 'OPERATION_PRESENTING', 'TURN_START'].includes(state?.combat?.phase);
const number = value => Number.isFinite(value) ? value.toLocaleString('ko-KR') : '0';
const phaseKo = state => ({ STAGE_INTRO: '지역 입장 전', STAGE_CLEAR: '초원 클리어', SHOP: '항구 상점', BATTLE: '전투 시작 전', REWARD: '보상 선택', BETWEEN_BATTLES: '전투 사이', CONTENT_COMPLETE: '제공 구간 완료', DEFEAT: '원정 종료' })[state?.status] ?? '원정';
const sentenceText = resolution => resolution?.sentenceSnapshot?.orderedTokens?.map(token => token.surface).join(' ') ?? '';
const small = text => el('p', { class: 'muted', text });

function zoneOf(state, id) {
  const combat = state.combat;
  if (!combat) return '원정 덱';
  if (combat.handIds.includes(id)) return '손패';
  if (combat.sentenceSlots.some(slot => slot.cardInstanceId === id)) return '문장 조합대';
  if (combat.drawIds.includes(id)) return '드로우';
  if (combat.discardIds.includes(id)) return '버린 카드';
  if(combat.exhaustedIds?.includes(id))return '사용 완료';
  return '원정 덱';
}

/** Read-only pile inspection. Draw is sorted by visible words and never exposes RNG or draw indices. */
export function openDeck(state, kind = 'all') {
  if (!state) return modal('나의 덱', small('원정을 시작하면 카드를 확인할 수 있습니다.'));
  const normalized = String(kind).toLowerCase();
  if(normalized==='all')return openDictionary(state,{ownedOnly:true});
  const isExhausted=normalized==='exhausted';
  const isDraw = ['draw', 'drawids'].includes(normalized), isDiscard = ['discard', 'discardids'].includes(normalized);
  const ids = [...(isDraw ? state.combat?.drawIds ?? [] : isDiscard ? state.combat?.discardIds ?? [] : isExhausted ? state.combat?.exhaustedIds??[] : state.activeCardIds)];
  const models = ids.filter(id => state.cardInstances[id]).map(id => {
    const selection = state.combat?.sentenceSlots.find(slot => slot.cardInstanceId === id)?.selection;
    return cardModel(state.cardInstances[id], selection,state.version);
  });
  if (!isDiscard) models.sort((a, b) => (a.lexeme?.lemma??a.surface).localeCompare(b.lexeme?.lemma??b.surface, 'en') || b.polish - a.polish);
  const countByLexeme = new Map();
  for (const id of state.activeCardIds) {
    const def = registry.cardById[state.cardInstances[id]?.cardDefId];
    if (def) countByLexeme.set(def.lexemeId, (countByLexeme.get(def.lexemeId) ?? 0) + 1);
  }
  const title = isDraw ? `드로우 ${models.length}장 · 순서는 공개하지 않음` : isDiscard ? `버린 카드 ${models.length}장` : isExhausted ? `사용 완료 ${models.length}장 · 다음 전투에 복귀` : `나의 덱 ${models.length}장`;
  const grid = el('div', { class: 'deck-grid' }, models.map((model, index) => el('div', { class: 'deck-entry' },
    wordCard(model, { readonly: true }),
    el('small', { text: `${isDiscard && index === 0 ? '최근 버린 카드 · ' : ''}${zoneOf(state, model.id)} · ${model.cardKind==='OPERATION'?'운영 · 전투당 1회':'같은 단어 보유 '+(countByLexeme.get(model.lexemeId)??1)+'장'}` }),
  )));
  return modal(title, [small(isDraw ? '단어 이름순으로 정렬한 목록입니다. 다음에 뽑을 카드는 알 수 없습니다.' : isDiscard ? '가장 최근에 버린 카드부터 표시합니다. 이 화면에서는 카드를 이동하지 않습니다.' : '현재 원정에 남아 있는 실제 카드와 영역입니다. 이 화면에서는 카드를 이동하지 않습니다.'),
    models.length ? grid : small('현재 이 영역에 카드가 없습니다.')], { wide: true });
}

/** Only words encountered during this run are visible, including words removed later. */
export function openDictionary(state,{ownedOnly=false}={}) {
  const registry=registryForVersion(state?.version);
  const ids = state?.vocabulary?.encounteredLexemeIds ?? [];
  const words = [...new Set(ids)].map(id => registry.lexemeById[id]).filter(Boolean).sort((a, b) => a.lemma.localeCompare(b.lemma, 'en'));
  const search = el('input', { type: 'search', placeholder: '영단어 또는 뜻 찾기', 'aria-label': '원정 사전 검색' });
  const count = el('span', { class: 'muted', text: `${words.length}개 단어` });
  const grid = el('div', { class: 'dictionary-grid' });
  const filter=el('select',{'aria-label':'단어 목록',onchange:()=>{ownedOnly=filter.value==='owned';render();}},el('option',{value:'owned',text:'보유 카드',selected:ownedOnly}),el('option',{value:'encountered',text:'이번 원정에서 만난 단어',selected:!ownedOnly}));
  const render = () => {
    const term = search.value.trim().toLocaleLowerCase();
    const filtered = words.filter(word => (!ownedOnly||state.activeCardIds.some(id=>registry.cardById[state.cardInstances[id]?.cardDefId]?.lexemeId===word.id))).filter(word => `${word.lemma} ${word.glossKo}`.toLocaleLowerCase().includes(term));
    count.textContent = `${filtered.length} / ${words.length}개 단어`;
    grid.replaceChildren(...filtered.map(word => {
      const senses = word.senseIds.map(id => registry.senseById[id]).filter(Boolean);
      const forms = word.formIds.map(id => registry.formById[id]).filter(form => form?.runtimeReady);
      const owned=Object.values(state?.cardInstances??{}).filter(c=>state.activeCardIds.includes(c.instanceId)&&registry.cardById[c.cardDefId]?.lexemeId===word.id);
      const polishSummary=[0,1,2,3].map(level=>{const count=owned.filter(c=>c.polishLevel===level).length;return count?`연마 +${level}: 기본 10 + 연마 ${level*5} = ${10+level*5}점 · ${count}장`:null;}).filter(Boolean);
      const notes=word.pos==='VERB'?[verbUsage(word),...(['0.3.0','0.4.0'].includes(state?.version)?['과거는 과거형, 진행은 be + -ing, 완료는 have + 과거분사, 미래는 will + 원형을 사용합니다.']:[])]:['to','that'].includes(word.lemma)?[word.lemma==='to'?'명사구 앞 전치사 / 동사 원형 앞 부정사 표지':(state?.version==='0.4.0'?'지시 한정사·대명사 / 관계절 연결 / 내용 목적어절 연결':'지시 한정사·대명사 / 명사를 설명하는 관계사')]: [word.usageNoteKo].filter(Boolean);
      if(word.pos==='NOUN')notes.push(({COUNT:'가산명사: 단수에는 한정사를 쓰고, 복수형도 사용할 수 있습니다.',MASS:'불가산명사: 이 게임의 뜻에서는 a/an과 복수형을 사용하지 않습니다.',BOTH:'가산·불가산 용법: 종류·개별 사례는 a/an 또는 복수형, 일반 개념·물질은 무관사 단수형을 사용할 수 있습니다.'})[senses[0]?.countability]);
      return el('article', { class: 'dictionary-entry' },
        el('strong', { text: word.lemma }), el('span', { class: 'badge', text: ` · ${POS_LABELS[word.pos] ?? '단어'}` }),
        el('p',{text:word.glossKo||'뜻 확인 중'}),el('p',{text:owned.length?`보유 ${owned.length}장`:'현재 보유하지 않음'}),
        el('small', { text: `허용 형태: ${forms.map(form => `${form.surface} (${formMeaning(word,form)})`).join(' · ') || '0.1에서는 제공하지 않음'}` }),
        ...notes.filter(Boolean).map(note => el('small', { text: note })),
        el('small',{text:'희귀도: '+({COMMON:'일반',UNCOMMON:'고급',RARE:'희귀'}[registry.cards.find(c=>c.lexemeId===word.id)?.rarity]??'단어')+' · 카드 기본점수 10 · 연마 단계마다 +5 · 최대 +3'}),...polishSummary.map(text=>el('small',{text})),
      );
    }));
    if (!filtered.length) grid.append(small(words.length ? '검색 결과가 없습니다.' : '원정을 시작하면 만난 단어가 여기에 남습니다.'));
  };
  search.addEventListener('input', render); render();
  return modal(ownedOnly?'나의 덱 · 단어 사전':'원정 사전', [small('이번 원정에서 소개·획득하거나 보상으로 공개된 단어입니다. 카드를 제거해도 사전에는 남습니다.'),
    el('div', { class: 'dialog-actions wrap' }, filter, search, count), grid, operationSection(state)], { wide: true });
}

function learningBlock(record){
 record=displayLearningRecord(record);
 if(!record)return small('이전 기록 · 검증 가능한 문장 증거가 없습니다.');
 return el('section',{class:'learning-evidence'},el('strong',{text:studentStatus(record)}),
  el('div',{class:'grammar-badges'},...(record.scoreableTags??[]).filter(tag=>GRAMMAR_GUIDE[tag]).map(tag=>el('span',{class:'badge',text:GRAMMAR_GUIDE[tag].label}))),
  ...(record.clauses?.length?record.clauses.map(c=>el('section',{class:'clause-learning'+(c.parentClauseId?' nested-clause':''),style:'--clause-depth:'+Math.min(c.level,3)},el('strong',{text:(c.id===record.primaryScoringClauseId&&record.clauses.some(x=>x.role==='COORDINATE'&&!x.parentClauseId)?'첫 번째 절 · 계산 기준':CLAUSE_ROLES[c.role]??'절')}),el('p',{class:'player-sentence',text:c.cardIds.map(id=>record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===id)?.surface??'').join(' ')}),...(record.roles??[]).filter(r=>r.clauseId===c.id&&ROLE_GUIDE[r.role]).map(r=>el('p',{text:r.text+' · '+ROLE_GUIDE[r.role].label})))):(record.roles??[]).filter(r=>ROLE_GUIDE[r.role]).map(r=>el('p',{text:r.text+' · '+ROLE_GUIDE[r.role].label,title:ROLE_GUIDE[r.role].description}))),
  ...(record.links??[]).map(l=>el('p',{class:'record-metadata',text:(l.connectorCardIds.length?l.connectorCardIds.map(id=>record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===id)?.surface??'').join(' / '):'that 생략')+' · '+(LINK_ROLES[l.role]??'구 연결')})),
  ...(record.verbPhrases??[]).map(v=>el('p',{class:'record-metadata',text:v.cardIds.map(id=>record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===id)?.surface??'').join(' ')+' · '+(!v.chainWellFormed?'형태 연결 확인':v.finiteCardId?[TIME_ROLE_LABELS[v.tenseFamily],...v.aspects.map(a=>TIME_ROLE_LABELS[a])].filter(Boolean).join(' · '):'비정형 동사구 · 독립된 시간 열쇠 없음')})),
  // A failed core parse does not establish which particular constituent is missing.
  ...(record.status==='INVALID_CORE'
    ? [small('문장을 완성하지 못하면 데미지를 줄 수 없습니다. 주어와 동사의 위치를 다시 확인해 보세요.')]
    : (record.issues??[]).filter(i=>i.messageKo).map(i=>el('p',{class:'learning-feedback',text:'형태 안내 · '+i.messageKo}))));
}
function attackRecord(resolution) {
  const table = el('table', { class: 'timeline-table' },
    el('thead', {}, el('tr', {}, ['순서', '효과', '이전', '이후'].map(text => el('th', { text })))),
    el('tbody', {}, (resolution.scoreTimeline ?? []).map((event, index) => el('tr', {},
      el('td', { text: index + 1 }), el('td', { text: event.labelKo ?? '점수 효과' }),
      el('td', { text: number(event.before) }), el('td', { text: number(event.after) }),
    ))),
  );
  return el('details', { class: 'dictionary-entry' },
    el('summary', {},el('span',{class:'player-sentence',text:sentenceText(resolution)}),el('small',{class:'record-metadata',text:`최종 위력 ${number(resolution.finalPower)}`})),
    small(`실제 피해 ${number(resolution.actualHpLoss)} · ${resolution.phaseId?'부위 초과 '+number(resolution.phaseExcess)+' (이월 없음)':'오버킬 '+number(resolution.overkill)} · 적 HP ${number(resolution.enemyHpBefore)} → ${number(resolution.enemyHpAfter)}`),
    learningBlock(learningRecord(resolution)),table,
  );
}

/** Recorded attacks are displayed directly. Opening this panel never reapplies their effects. */
export function openRecords(profile, state) {
  profile=reviewProfileLearning(profile??{});
  const records=profile.grammarRecords??{};
  const summary=el('div',{class:'record-grid'},...[[profile.bestAttack??0,'최고 공격위력'],[profile.totalActualDamage??0,'누적 실제 피해'],[profile.qualifiedRunIds?.length??0,'초원 완료 원정']].map(([value,label])=>el('div',{},el('strong',{text:number(value)}),el('span',{text:label}))));
  const available=Object.entries(GRAMMAR_GUIDE).filter(([tag])=>tag!=='FRAME.SVOO'||profile.unlocks?.includes('pack.svoo')||records[tag]);
  const catalog=el('div',{class:'dictionary-grid'},available.map(([tag,guide])=>{
   const record=records[tag];
   const examples=['first','best'].map(kind=>({kind,value:displayLearningRecord(record?.[kind+'Complete']??record?.[kind+'Learning'])})).filter(x=>x.value?.complete&&x.value.scoreableTags.includes(tag));
   return el('article',{class:'dictionary-entry'},el('h3',{text:guide.label}),small(guide.description),
    tag==='LINK.CLAUSE'&&small(Object.values(CLAUSE_GUIDE).join(' ')),
    tag==='FRAME.SVOO'&&small(DATIVE_GUIDE.description),tag==='FRAME.SV'&&small(LOCATION_GUIDE.description),
    record?el('p',{text:'문법 누적 사용 '+number(record.count)+'회 · 당시 최고 위력 '+number(record.bestPower)}):small('아직 이 문법 효과를 사용한 기록이 없습니다.'),
    ...examples.map(({kind,value})=>el('section',{},el('small',{class:'record-metadata',text:kind==='first'?'처음 완성':'최고 완성 문장'}),el('p',{class:'player-sentence',text:value.sentenceSnapshot.orderedTokens.map(t=>t.surface).join(' ')}),learningBlock(value))));
  }));
  const previous=(profile.educationalReview?.entries??[]).filter(e=>e.sentence);
  const attacks=state?.stats?.history??(state?.stats?.lastAttack?[state.stats.lastAttack]:[]);
  const recent=attacks.length?attacks.map(attackRecord):(profile.recentSubmissions??[]).map(r=>el('details',{class:'dictionary-entry'},el('summary',{},el('span',{class:'player-sentence',text:r.sentenceSnapshot.orderedTokens.map(t=>t.surface).join(' ')}),el('small',{class:'record-metadata',text:'위력 '+number(r.finalPower)+' · 실제 피해 '+number(r.actualHpLoss)})),learningBlock(r)));
  return modal('문장 도감 · 최근 공격',[small((profile.displayName??'여행자')+'의 실제 제출 기록입니다. 실습과 연습 화면은 기록하지 않습니다.'),summary,
   el('h3',{text:'내 문장 도감'}),catalog,
   previous.length>0&&el('details',{},el('summary',{text:'이전 기록 · 당시 집계 보존'}),...previous.map(e=>el('section',{},el('p',{class:'player-sentence',text:e.sentence}),el('small',{class:'record-metadata',text:e.verified?'교육용 구조 재확인: '+e.verified.tags.map(t=>GRAMMAR_GUIDE[t]?.label).filter(Boolean).join(' · '):'이전 기록(문형 예문으로 사용하지 않음)'})))),
   el('h3',{text:'최근 제출 '+recent.length+'회'}),recent.length?el('div',{class:'save-slots'},recent):small('아직 확정된 제출이 없습니다.')],{wide:true});
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
        exists && el('p', { text: `${!['0.2.0','0.2.1','0.2.2','0.3.0','0.4.0'].includes(savedRun?.version)?'이전 버전 저장 · ':''}${phaseKo(savedRun)} · Stage ${Number(savedRun?.progress?.stageId?.slice(-2)??1)}-${(savedRun?.progress?.roundIndex??0)+1} · ${savedRun?.activeCardIds?.length ?? 0}장 · ${savedRun?.economy?.gold ?? 0}골드` }),
        exists && !['0.2.0','0.2.1','0.2.2','0.3.0','0.4.0'].includes(savedRun?.version) && el('small', {text:'이 저장은 이전 버전의 시작의 초원 구간입니다. 0.2의 새 지역은 새 원정에서 시작할 수 있습니다.'}),
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
      message.textContent = present ? '공격 연출 중에는 저장·불러오기를 할 수 없습니다.' : canSave ? '현재 안전 지점을 저장할 수 있습니다.' : '저장은 전투의 첫 조작 전, 보상 선택, 전투 사이, 거래를 마친 상점, 구간 완료에서 가능합니다.';
    } catch (error) { message.textContent = `${error.message} 저장 없이 현재 플레이를 계속할 수 있습니다.`; }
    finally { busy = false; if (view.dialog.isConnected) render(); }
  };
  view = modal('수동 저장 · 3슬롯', [small('저장은 이 브라우저의 현재 로컬 프로필에 보관됩니다. 초기 패·고정 보상·난수 상태를 그대로 복원합니다.'), message, list,
    button('슬롯 다시 읽기', refresh, 'quiet')]);
  refresh(); return view;
}

function operationSection(state){
 const models=(state?.activeCardIds??[]).map(id=>cardModel(state.cardInstances[id],null,state.version)).filter(m=>m.cardKind==='OPERATION');
 if(!models.length)return null;return el('section',{class:'operation-deck-section'},el('h3',{text:'운영 카드 · 단어 사전과 별도'}),small('손패의 사용 버튼으로 사용합니다. 턴·교환을 소모하지 않으며 다음 전투에 돌아옵니다. 운영 카드는 연마할 수 없습니다.'),el('div',{class:'deck-grid'},models.map(m=>el('div',{},wordCard(m,{readonly:true}),small(zoneOf(state,m.id))))));
}
