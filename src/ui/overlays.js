import {runeCatalog} from './runes.js';
import {formatSentence} from '../punctuation.js';
import {cardPager} from './viewport.js';
import {fullscreenButton,linkSettings} from './immersive.js';
import {CORRIDOR_GRAMMAR_DISPLAY,CLAUSE_GRAMMAR_DISPLAY} from '../data/grammarDisplay.js';
import {NOMINAL_GUIDE,NOMINAL_CATALOG} from '../data/grammarGuideData.js';
import {SNOW_GRAMMAR_DISPLAY as GRAMMAR_DISPLAY,EMBER_GRAMMAR_DISPLAY,WATERWAYS_GRAMMAR_DISPLAY} from '../data/grammarDisplay.js';
import {visibleForms,formLabel,dictionaryForms} from './formView.js';
import {isIngForm} from '../data/language/desertLanguage.js';
import {CLAUSE_ROLES,LINK_ROLES,CLAUSE_GUIDE,RELATIVE_ROLE_LABELS,QUESTION_ROLE_LABELS} from '../data/grammarGuideData.js';
import {learningRecord,reviewProfileLearning,studentStatus,displayLearningRecord} from '../engine/learningRecords.js';
import {GRAMMAR_GUIDE,ROLE_GUIDE,DATIVE_GUIDE,LOCATION_GUIDE,TIME_ROLE_LABELS,formMeaning,verbUsage,ING_FORM_GUIDE,nonfiniteUsageNotes,nonfiniteLabel} from '../data/grammarGuideData.js';
import { el, button, modal, toast } from './dom.js';
import { wordCard, POS_LABELS } from './cards.js';
import { cardModel, operationText } from './models.js';
import { registry, registryForVersion, grammarTags } from '../data/language/index.js';
import { canSaveRun, profileRecordsForVersion } from '../services/localStore.js';

const locked = state => ['RESOLVING', 'PRESENTING', 'OPERATION_PRESENTING', 'TURN_START'].includes(state?.combat?.phase);
const number = value => Number.isFinite(value) ? value.toLocaleString('ko-KR') : '0';
const phaseKo = state => ({ STAGE_INTRO: '지역 입장 전', STAGE_CLEAR: '초원 클리어', SHOP: '항구 상점', BATTLE: '전투 시작 전', REWARD: '보상 선택', BETWEEN_BATTLES: '전투 사이', CONTENT_COMPLETE: '제공 구간 완료', DEFEAT: '원정 종료' })[state?.status] ?? '원정';
const sentenceText = resolution => formatSentence(resolution?.sentenceSnapshot);
const small = text => el('p', { class: 'muted', text });

function zoneOf(state, id) {
  const combat = state.combat;
  if (!combat) return '원정 덱';
  if (combat.handIds.includes(id)) return '손패';
  if (combat.sentenceSlots.some(slot => slot.cardInstanceId === id)) return '문장 조합대';
  if (combat.drawIds.includes(id)) return '뽑을 카드';
  if (combat.discardIds.includes(id)) return '버린 카드';
  if(combat.exhaustedIds?.includes(id))return '사용 완료';
  return '원정 덱';
}

/** Read-only pile inspection. Draw is sorted by visible words and never exposes RNG or draw indices. */
export function openDeck(state, kind = 'all') {
  if (!state) return openDictionary(state);
  const normalized = String(kind).toLowerCase();
  if(normalized==='all')return openDictionary(state);
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
  const title = isDraw ? `뽑을 카드 ${models.length}장 · 순서는 공개하지 않음` : isDiscard ? `버린 카드 ${models.length}장` : isExhausted ? `사용 완료 ${models.length}장 · 다음 전투에 복귀` : `나의 덱 ${models.length}장`;
  const grid = el('div', { class: 'deck-grid' }, models.map((model, index) => el('div', { class: 'deck-entry' },
    wordCard(model, { readonly: true }),
    el('small', { text: `${isDiscard && index === 0 ? '최근 버린 카드 · ' : ''}${zoneOf(state, model.id)} · ${model.cardKind==='OPERATION'?'운영 · '+operationText(model).limit:(model.temporary?'이번 전투 전용 · 영구 보유 ':'같은 단어 보유 ')+(countByLexeme.get(model.lexemeId)??0)+'장'}` }),
  )));
  return modal(title, [small(isDraw ? '단어 이름순으로 정렬한 목록입니다. 다음에 뽑을 카드는 알 수 없습니다.' : isDiscard ? '가장 최근에 버린 카드부터 표시합니다. 이 화면에서는 카드를 이동하지 않습니다.' : '현재 원정에 남아 있는 실제 카드와 영역입니다. 이 화면에서는 카드를 이동하지 않습니다.'),
    models.length ? grid : small('현재 이 영역에 카드가 없습니다.')], { wide: true });
}

/** Only words encountered during this run are visible, including words removed later. */
export function openDictionary(state) {
  const registry=registryForVersion(state?.version);
  const words=[...new Set(state?.vocabulary?.encounteredLexemeIds??[])].map(id=>registry.lexemeById[id]).filter(Boolean).sort((a,b)=>a.lemma.localeCompare(b.lemma,'en'));
  const search=el('input',{type:'search',placeholder:'영단어 또는 뜻 찾기','aria-label':'원정 사전 검색'});
  const count=el('span',{class:'dictionary-count',role:'status'}),grid=el('div',{class:'dictionary-grid'});
  const definition=word=>registry.cards.find(c=>c.lexemeId===word.id);
  const secondary=word=>(definition(word)?.secondaryLexemeIds??[]).map(id=>registry.lexemeById[id]).filter(Boolean);
  const render=()=>{
    const term=search.value.trim().toLocaleLowerCase();
    const filtered=words.filter(word=>[word,...secondary(word)].some(w=>`${w.lemma} ${w.glossKo}`.toLocaleLowerCase().includes(term)));
    count.textContent=term?`검색 결과 ${filtered.length}개`:`${words.length}개`;
    grid.replaceChildren(...filtered.map(word=>{
      const def=definition(word),others=secondary(word),senses=word.senseIds.map(id=>registry.senseById[id]).filter(Boolean);
      const forms=[...word.formIds,...(registry.languagePolicyVersion?others.flatMap(w=>w.formIds):[])].map(id=>registry.formById[id]).filter(f=>f?.runtimeReady);
      const tips={want:'want + to V / 목적어 + to V',need:'need + to V / 목적어 + to V; need + -ing는 ~될 필요가 있다는 뜻도 있습니다.',enjoy:'enjoy 뒤에는 동명사(-ing)를 씁니다.',finish:'finish 뒤에는 명사나 동명사(-ing)를 씁니다.',give:'give + 간접목적어 + 직접목적어 / 직접목적어 + to + 대상',show:'show + 간접목적어 + 직접목적어 / 직접목적어 + to + 대상',send:'send + 간접목적어 + 직접목적어 / 직접목적어 + to + 대상',make:'make + 간접목적어 + 직접목적어 / 직접목적어 + for + 대상',to:'명사구 앞 전치사 / 동사 원형 앞 부정사 표지',that:'지시 한정사·대명사 / 관계절·내용 목적어절 연결'};
      const notes=[...(others.length?(def.dualUsage?[def.dualUsage.description,...def.dualUsage.examples,...others.map(w=>w.usageNoteKo)]:['동사: 돕다 / 명사: 도움(셀 수 없는 명사)','I help you. / I need more help.','명사 도움은 기본형 help로 씁니다. 활용형은 기존 동사 용법을 따릅니다.']):[]),tips[word.lemma]??(word.pos==='VERB'&&!['will','can'].includes(word.lemma)&&!registry.languagePolicyVersion?null:word.usageNoteKo)].filter(Boolean);
      if(word.pos==='NOUN')notes.push(({COUNT:'가산명사: 단수에는 한정사를 쓰고, 복수형도 사용할 수 있습니다.',MASS:'불가산명사: 이 게임의 뜻에서는 a/an과 복수형을 사용하지 않습니다.',BOTH:'가산·불가산 용법: 종류·개별 사례는 a/an 또는 복수형, 일반 개념·물질은 무관사 단수형을 사용할 수 있습니다.'})[senses[0]?.countability]);
      return el('article',{class:'dictionary-entry dictionary-word',dataset:{dictionaryMode:'dictionary'}},
        el('div',{class:`dictionary-word-heading pos-${word.pos}`},el('strong',{class:'word-heading',text:word.lemma}),el('strong',{class:'dictionary-gloss',text:word.glossKo||'뜻 확인 중'}),el('small',{class:'dictionary-pos',text:POS_LABELS[word.pos]??'단어'})),
        ...others.map(w=>el('div',{class:`dictionary-secondary pos-${w.pos}`},el('small',{class:'dictionary-pos',text:POS_LABELS[w.pos]??'단어'}),el('span',{text:w.glossKo}))),
        el('div',{class:'dictionary-forms'},...dictionaryForms(word,forms).map(f=>el('span',{class:'dictionary-form'},f.label&&el('small',{text:f.label}),el('span',{text:f.surfaces})))),
        notes.filter(Boolean).length>0&&el('details',{class:'dictionary-usage'},el('summary',{text:'용법'}),...[...new Set(notes.filter(Boolean))].map(text=>el('p',{text}))));
    }));
    if(!filtered.length)grid.append(small(words.length?'검색 결과가 없습니다.':'원정을 시작하면 만난 단어가 여기에 남습니다.'));
  };
  search.addEventListener('input',render);render();
  return modal('사전',[el('div',{class:'dictionary-toolbar'},search,count),grid],{size:'dictionary'});
}

function learningBlock(record){
 record=displayLearningRecord(record);
 if(!record)return small('이전 기록 · 검증 가능한 문장 증거가 없습니다.');
 return el('section',{class:'learning-evidence'},el('strong',{text:studentStatus(record)}),
  ...(record.lexicalUses??[]).map(r=>el('p',{class:'lexical-use',text:(record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===r.cardInstanceId)?.surface??'')+' · '+POS_LABELS[r.selectedPos]})),
  el('div',{class:'grammar-badges'},...(record.scoreableTags??[]).filter(tag=>GRAMMAR_GUIDE[tag]).map(tag=>el('span',{class:'badge',text:GRAMMAR_GUIDE[tag].label}))),
  ...(record.clauses?.length?record.clauses.map(c=>el('section',{class:'clause-learning'+(c.parentClauseId?' nested-clause':''),style:'--clause-depth:'+Math.min(c.level,3)},el('strong',{text:(c.id===record.primaryScoringClauseId&&record.clauses.some(x=>x.role==='COORDINATE'&&!x.parentClauseId)?'첫 번째 절 · 계산 기준':CLAUSE_ROLES[c.role]??'절')}),el('p',{class:'player-sentence',text:c.cardIds.map(id=>record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===id)?.surface??'').join(' ')}),...(record.roles??[]).filter(r=>r.clauseId===c.id&&ROLE_GUIDE[r.role]).map(r=>el('p',{text:r.text+' · '+ROLE_GUIDE[r.role].label})))):(record.roles??[]).filter(r=>ROLE_GUIDE[r.role]).map(r=>el('p',{text:r.text+' · '+ROLE_GUIDE[r.role].label,title:ROLE_GUIDE[r.role].description}))),
  ...(record.links??[]).map(l=>el('p',{class:'record-metadata',text:(l.connectorCardIds.length?l.connectorCardIds.map(id=>record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===id)?.surface??'').join(' / '):'that 생략')+' · '+(LINK_ROLES[l.role]??'구 연결')})),
  ...(record.verbPhrases??[]).map(v=>el('p',{class:'record-metadata',text:v.cardIds.map(id=>record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===id)?.surface??'').join(' ')+' · '+(!v.chainWellFormed?'형태 연결 확인':v.mood==='IMPERATIVE'?'명령문 · 암시 주어 you (실제 카드 없음) · 시제 과제 아님':v.finiteCardId?[TIME_ROLE_LABELS[v.tenseFamily],v.mood==='COUNTERFACTUAL'?'가정 상황':null,...v.cardIds.map(id=>record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===id)?.surface).filter(x=>['would','could','can'].includes(x)).map(x=>x==='would'?'would · 가정·가능성':x+' · 능력·가능성'),...v.aspects.map(a=>TIME_ROLE_LABELS[a])].filter(Boolean).join(' · '):'비정형 동사구 · 독립된 시간 열쇠 없음')})),
  ...(record.nonfinitePhrases??[]).filter(p=>nonfiniteLabel(p)).map(p=>el('p',{class:'nonfinite-evidence',text:p.cardIds.map(id=>record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===id)?.surface??'').join(' ')+' · '+nonfiniteLabel(p)})),
  ...(record.participialAdjuncts??[]).map(p=>el('p',{class:'participial-adjunct-evidence',text:(p.voice==='PASSIVE'?'과거분사 분사구문':'현재분사 분사구문')+' · 주절 주어와 연결'+(p.validity!=='VALID'?' · 경계/구조 확인':'')})),
  ...(record.nominalStructures??[]).map(n=>el('p',{class:'nominal-evidence',text:n.cardIds.map(id=>record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===id)?.surface??'').join(' ')+' · '+NOMINAL_GUIDE[n.kind]+(n.validity!=='VALID'?' · 구문 형태 확인':'')})),
  ...(record.relativeClauses??[]).map(r=>el('p',{class:'relative-evidence',text:(record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===r.antecedentHeadCardId)?.surface??'')+' → '+r.cardIds.map(id=>record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===id)?.surface??'').join(' ')+' · '+(RELATIVE_ROLE_LABELS[r.relativeRole]??'관계절')+(r.markerOmitted?' · 목적격 관계사 생략':'')+(r.ownIssueIds.length?' · 관계절 형태 확인':'')})),
  ...[...(record.questionClauses??[]),...(record.embeddedQuestions??[])].map(q=>el('p',{class:'question-evidence',text:q.cardIds.map(id=>record.sentenceSnapshot.orderedTokens.find(t=>t.cardInstanceId===id)?.surface??'').join(' ')+' · '+(q.kind.startsWith('EMBEDDED')?'간접의문절':'의문문')+' · '+(QUESTION_ROLE_LABELS[q.whRole]??'질문 구조')})),
  // A failed core parse does not establish which particular constituent is missing.
  ...(record.status==='INVALID_CORE'
    ? [el('p',{class:'learning-feedback',text:'피드백 · 문장을 완성하지 못하면 데미지를 줄 수 없습니다. 주어와 동사의 위치를 다시 확인해 보세요.'})]
    : (record.issues??[]).filter(i=>i.messageKo).map(i=>el('p',{class:'learning-feedback',text:'피드백 · '+i.messageKo}))));
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
    resolution.resistanceResult?.applied&&small(`저항 전 ${number(resolution.preResistancePower)} → 저항 후 ${number(resolution.postResistancePower)} · 저항 ${resolution.resistanceResult.percent}%`),
    resolution.foresightResult&&small(resolution.foresightResult.labelKo),
    resolution.clauseThreadResult&&small(resolution.clauseThreadResult.labelKo),
    learningBlock(learningRecord(resolution)),table,
  );
}

/** Recorded attacks are displayed directly. Opening this panel never reapplies their effects. */
export function openRecords(profile, state) {
  state??={version:'0.14.0'};
  const historical=profile;
  profile=reviewProfileLearning(profileRecordsForVersion(profile??{},state?.version,state?.playFeedbackPolicy));
  const records=profile.grammarRecords??{};
  const summary=el('div',{class:'record-grid'},...[[profile.bestAttack??0,'최고 공격위력'],[profile.totalActualDamage??0,'누적 실제 피해'],[profile.qualifiedRunIds?.length??0,'초원 완료 원정']].map(([value,label])=>el('div',{},el('strong',{text:number(value)}),el('span',{text:label}))));
  const available=[...(state?.version==='0.14.0'?CLAUSE_GRAMMAR_DISPLAY:['0.10.0','0.10.1','0.10.2','0.11.0','0.12.0','0.12.1','0.14.0'].includes(state?.version)||(profile.highestCompletedStage??0)>=10?CORRIDOR_GRAMMAR_DISPLAY:state?.milestoneIds?.includes('STAGE7_CLEAR')||(profile.highestCompletedStage??0)>=7?WATERWAYS_GRAMMAR_DISPLAY:state?.milestoneIds?.includes('STAGE6_CLEAR')||(profile.highestCompletedStage??0)>=6?EMBER_GRAMMAR_DISPLAY:GRAMMAR_DISPLAY)].sort((a,b)=>a.order-b.order).map(g=>[g.tag,g]);
  const catalog=el('div',{class:'dictionary-grid'},available.map(([tag,guide])=>{
   const tags=[tag,...(guide.relatedTags??[])],entries=tags.map(t=>records[t]).filter(Boolean);
   const record=entries.length?{count:entries.reduce((sum,r)=>sum+r.count,0),bestPower:Math.max(...entries.map(r=>r.bestPower))}:null;
   const examples=entries.flatMap(entry=>['first','best'].map(kind=>({kind,value:displayLearningRecord(entry[kind+'Complete']??entry[kind+'Learning'])}))).filter(x=>x.value?.complete&&x.value.scoreableTags.some(t=>tags.includes(t)));
   return el('article',{class:'dictionary-entry grammar-entry',dataset:{grammarTag:tag}},el('h3',{class:'grammar-heading'},el('span',{text:guide.titleKo}),el('span',{class:'grammar-pattern',text:'('+guide.pattern+')'})),el('p',{class:'grammar-description',text:guide.shortDescriptionKo}),
    record?el('p',{text:'문법 누적 사용 '+number(record.count)+'회 · 당시 최고 위력 '+number(record.bestPower)}):small('아직 사용 기록이 없습니다.'),
    ...examples.map(({kind,value})=>el('section',{},el('small',{class:'record-metadata',text:kind==='first'?'처음 완성':'최고 완성 문장'}),el('p',{class:'player-sentence',text:formatSentence(value.sentenceSnapshot)}),el('details',{class:'learning-details'},el('summary',{text:'문법·위력 상세'}),learningBlock(value)))));
  }));
  if(['0.9.0','0.10.0','0.10.1','0.10.2','0.11.0','0.12.0','0.12.1','0.14.0'].includes(state?.version)||profile.nominalRecords)for(const guide of NOMINAL_CATALOG){
   const record=profile.nominalRecords?.[guide.kind];
   catalog.append(el('article',{class:'dictionary-entry grammar-entry',dataset:{nominalKind:guide.kind}},
    el('h3',{class:'grammar-heading'},el('span',{text:NOMINAL_GUIDE[guide.kind]}),el('span',{class:'grammar-pattern',text:'('+guide.pattern+')'})),el('p',{class:'grammar-description',text:guide.description}),
    record?el('p',{text:'구조 사용 '+number(record.count)+'회 · 당시 최고 위력 '+number(record.bestPower)}):small('아직 사용 기록이 없습니다.'),
    ...['firstComplete','bestComplete'].filter(key=>record?.[key]).map(key=>el('section',{},el('small',{text:key==='firstComplete'?'처음 완성':'최고 완성 문장'}),el('p',{class:'player-sentence',text:formatSentence(record[key].sentenceSnapshot)}),el('details',{class:'learning-details'},el('summary',{text:'문법·위력 상세'}),learningBlock(record[key]))))));
  }
  const previous=(profile.educationalReview?.entries??[]).filter(e=>e.sentence);
  const attacks=state?.stats?.history??(state?.stats?.lastAttack?[state.stats.lastAttack]:[]);
  const recent=attacks.length?attacks.map(attackRecord):(profile.recentSubmissions??[]).map(r=>el('details',{class:'dictionary-entry'},el('summary',{},el('span',{class:'player-sentence',text:formatSentence(r.sentenceSnapshot)}),el('small',{class:'record-metadata',text:'위력 '+number(r.finalPower)+' · 실제 피해 '+number(r.actualHpLoss)})),learningBlock(r)));
  return modal('문장 도감 · 최근 공격',[button('룬 도감',()=>runeCatalog(state),'secondary'),state?.version==='0.14.0'&&button('이전 규칙 기록',()=>openRecords(historical,{version:'0.12.1'}),'quiet'),small((profile.displayName??'여행자')+'의 실제 제출 기록입니다. 튜토리얼과 연습 화면은 기록하지 않습니다.'),state?.version==='0.14.0'&&small('0.14 쉼표·분사구문 규칙의 기록입니다. 이전 규칙의 점수와 합산하지 않습니다.'),summary,
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
  let value={speed:1,sfxVolume:45,bgmVolume:100,muted:false,effectsOff:false,...settings};
  const update=patch=>{value={...value,...patch};try{Promise.resolve(onChange?.({...value})).catch(error=>toast(`설정을 저장하지 못했습니다: ${error.message}`));}catch(error){toast(`설정을 바꾸지 못했습니다: ${error.message}`);}};
  const volumeRow=(key,label,aria)=>{
    const output=el('output',{text:`${value[key]}%`});
    const input=el('input',{type:'range',min:0,max:100,step:1,value:value[key],'aria-label':aria,oninput:e=>{const n=Number(e.target.value);output.textContent=`${n}%`;update({[key]:n});}});
    return el('label',{class:'settings-row'},el('span',{text:label}),input,output);
  };
  const toggle=(key,label)=>{
    const text=el('span',{class:'toggle-value',text:value[key]?'켜짐':'꺼짐','aria-hidden':'true'});
    const input=el('input',{type:'checkbox',checked:!!value[key],'aria-label':label,onchange:e=>{text.textContent=e.target.checked?'켜짐':'꺼짐';update({[key]:e.target.checked});}});
    return el('label',{class:'settings-row settings-toggle'},el('span',{text:label}),input,text);
  };
  const speed=el('select',{'aria-label':'연출 속도',onchange:e=>update({speed:Number(e.target.value)})},[1,1.5,2].map(n=>el('option',{value:String(n),text:`${n}×`,selected:value.speed===n})));
  const links=linkSettings();links.querySelector('summary').textContent='홈 화면·접속 안내';
  let view;
  const groups=el('div',{class:'settings-groups'},
    el('section',{class:'settings-group'},el('h3',{text:'소리'}),volumeRow('bgmVolume','배경음악','배경음악 음량'),volumeRow('sfxVolume','효과음','효과음 음량'),toggle('muted','음소거')),
    el('section',{class:'settings-group'},el('h3',{text:'화면·연출'}),el('div',{class:'settings-row'},el('span',{text:'화면'}),fullscreenButton()),el('label',{class:'settings-row'},el('span',{text:'연출 속도'}),speed),toggle('effectsOff','효과 감소'),small('공격·피격 표시는 유지됩니다.'),globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&small('기기의 동작 줄이기를 적용 중입니다.')));
  view=modal('설정',[groups,el('div',{class:'settings-footer'},onGuide&&button('튜토리얼 다시 보기',()=>{view.close();onGuide();},'secondary'),links)],{size:'settings'});return view;
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
        exists && el('p', { text: `${!['0.2.0','0.2.1','0.2.2','0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0','0.12.0','0.12.1','0.14.0'].includes(savedRun?.version)?'이전 버전 저장 · ':''}${phaseKo(savedRun)} · Stage ${Number(savedRun?.progress?.stageId?.slice(-2)??1)}-${(savedRun?.progress?.roundIndex??0)+1} · ${savedRun?.activeCardIds?.length ?? 0}장 · ${savedRun?.economy?.gold ?? 0}골드` }),
        exists && !['0.2.0','0.2.1','0.2.2','0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0','0.12.0','0.12.1','0.14.0'].includes(savedRun?.version) && el('small', {text:'이 저장은 이전 버전의 시작의 초원 구간입니다. 0.2의 새 지역은 새 원정에서 시작할 수 있습니다.'}),
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
 if(!models.length)return null;return el('section',{class:'operation-deck-section'},el('h3',{text:'운영 카드 · 단어 사전과 별도'}),small(['0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2','0.11.0','0.12.0','0.12.1','0.14.0'].includes(state.version)?'손패의 사용 버튼으로 사용합니다. 턴·교환을 소모하지 않습니다. 영구 운영은 최대 +1이며 카드에 표시한 획득 수와 사용 후 이동을 따릅니다.':'손패의 사용 버튼으로 사용합니다. 턴·교환을 소모하지 않으며 다음 전투에 돌아옵니다. 운영 카드는 연마할 수 없습니다.'),el('div',{class:'deck-grid'},models.map(m=>el('div',{},wordCard(m,{readonly:true}),small(zoneOf(state,m.id))))));
}
