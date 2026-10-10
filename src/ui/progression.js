import {WATERWAYS_HINT} from '../data/stage8.js';
import {EMBER_HINT} from '../data/stage7.js';
import {FROST_HINT} from '../data/stage6.js';
import {TURN_HAND_SEAL_HINT} from '../data/stage5.js';
import {SKY_SHIELD_HINT} from '../data/stage4.js';
import {TIME_GOLEM_HINT} from '../data/stage3.js';
import { el, button, heading, modal, confirmDialog, toast } from './dom.js';
import { renderCombat } from './combat.js';
import { isMixedOffer } from '../game/rewards.js';
import { wordCard } from './cards.js';
import { cardModel, operationPolishPreview, runeDescription as describeRuneForUI } from './models.js';
import {applyStageTheme} from './theme.js';
import {campaignBattleCount,hasPolishCampaign} from '../data/campaignFeatures.js';
import { RUNE_BY_ID } from '../data/runes.js';
import { stageForRun, roundsForRun, isCurrentCampaign } from '../data/stages.js';
import { STAGE2_VEIL_HINT } from '../data/stage2.js';

const nav = ({ onLobby, onSaves, onDeck } = {}) => el('header', { class: 'topbar' },
  el('span', { class: 'brand-small', text: 'SYNTAX ATLAS' }),
  el('nav', {}, onDeck && button('내 덱', onDeck, 'quiet'), onSaves && button('저장', onSaves, 'quiet'), onLobby && button('로비', onLobby, 'quiet')));
const metric = (value, label) => el('div', {}, el('strong', { text: value }), el('span', { text: label }));

export const HARBOR_BOSS_HINT = STAGE2_VEIL_HINT;
export function renderIntro(root, state, { onStart, onLobby, onDeck, onRecords, onSaves, onChooseConnector, onChooseWaterways } = {}) {
  applyStageTheme(state);
  const waterways=state.progress.stageId==='stage.08',ember=state.progress.stageId==='stage.07',snow=state.progress.stageId==='stage.06',desert=state.progress.stageId==='stage.05',sky=state.progress.stageId==='stage.04',harbor=state.progress.stageId==='stage.02',canyon=state.progress.stageId==='stage.03',stage=stageForRun(state);
  const choice=hasPolishCampaign(state)&&sky&&state.entryChoice?.pending?state.entryChoice:null;
  const cityChoice=waterways&&state.waterwaysEntryChoice?.pending?state.waterwaysEntryChoice:null;
  root.replaceChildren(nav({ onLobby,onDeck,onSaves:choice||cityChoice?onSaves:null }), el('main', { class: `intro-page ${ember?'ember-page':desert?'desert-page':harbor?'harbor-page':''}` },
    el('span', { class: 'eyebrow', text: waterways?'CHAPTER 08 · ANCIENT WATERWAYS':ember?'CHAPTER 07 · EMBER CAVE':snow?'CHAPTER 06 · MIRROR SNOWFIELD':desert?'CHAPTER 05 · WISH DESERT':sky?'CHAPTER 04 · SKY ISLANDS':canyon?'CHAPTER 03 · TIME CANYON':harbor?'CHAPTER 02 · DELIVERY HARBOR':'CHAPTER 01 · FIRST SENTENCE' }),
    el('div', { class: 'intro-art', text: waterways?'🏛️':ember?'🔥':snow?'❄':desert?'✦':sky?'☁':canyon?'⌛':harbor?'⚓':'🌾', role: 'img', 'aria-label': stage.nameKo }),
    el('h1', { text: stage.nameKo }),
    el('p', { text: waterways?'앞의 명사를 관계절로 설명하고 고대의 수로도시를 건너세요.\n해금된 정상 관계절은 ×2, 이 지역에서는 ×1.25를 한 번 더 받습니다.':ember?'분사 수식·수동태·동사별 목적격보어로 잿불 동굴을 건너세요.\n해금된 구조를 포함한 공격은 지역 보너스 ×1.25를 한 번 받습니다.':snow?'비교급·최상급·동등 비교와 too/enough로 거울의 설원을 건너세요.\n해금된 비교·정도 콤보 공격은 지역 보너스 ×1.25를 한 번 받습니다.':desert?'행동을 문장의 재료로 삼아 소원의 사막을 건너세요.\n해금된 to부정사·동명사·기본5형식 공격은 지역 보너스 ×1.25를 한 번 받습니다.':sky?'접속사로 단어와 절을 잇고 하늘섬을 건너세요.\n해금된 절 연결 공격은 지역 보너스 ×1.25를 한 번 받습니다.':canyon?'과거·진행·완료·will 미래를 조합해 시간의 협곡을 건너세요.\n해금된 시간 콤보를 포함하는 공격은 지역 보너스 ×1.25를 한 번 받습니다.':harbor?'주어 + 동사 + 간접목적어 + 직접목적어.\n현재형 4형식 공격은 이 지역에서 ×1.25의 위력을 얻습니다.':'단어를 모아 당신의 첫 문장을 완성하세요.\n기본 1·2·3형식 공격은 이 지역에서 ×1.25의 위력을 얻습니다.' }),
    waterways&&el('section',{class:'boss-preview panel waterways-preview'},el('span',{class:'boss-silhouette',text:'🏇'}),el('div',{},el('h2',{text:'청동 수문장 · 이중 연결 인장'}),el('p',{text:WATERWAYS_HINT}))),
    ember&&el('section',{class:'boss-preview panel'},el('span',{class:'boss-silhouette',text:'🐉'}),el('div',{},el('h2',{text:'잠든 잿불룡 · 검댕 비늘'}),el('p',{text:EMBER_HINT}))),
    snow&&el('section',{class:'boss-preview panel'},el('span',{class:'boss-silhouette',text:'🦌'}),el('div',{},el('h2',{text:'거울뿔 사슴 · 빙결핵 5개'}),el('p',{text:FROST_HINT}))),
    desert&&el('section',{class:'boss-preview panel'},el('span',{class:'boss-silhouette',text:'𓂀','aria-label':'소원의 스핑크스 별문양'}),el('div',{},el('h2',{text:'소원의 스핑크스 · 손패 봉인'}),el('p',{text:TURN_HAND_SEAL_HINT}))),
    sky&&el('section',{class:'boss-preview panel'},el('span',{class:'boss-silhouette',text:'🧙'}),el('div',{},el('h2',{text:'하늘길의 문지기 · 연결의 보호막'}),el('p',{text:SKY_SHIELD_HINT}))),
    canyon&&el('section',{class:'boss-preview panel'},el('span',{class:'boss-silhouette',text:'🗿','aria-label':'시간의 골렘 실루엣'}),el('div',{},el('h2',{text:'시간의 골렘 · 과거 / 현재 / 미래'}),el('p',{text:TIME_GOLEM_HINT}))),
    harbor&&el('section',{class:'boss-preview panel'},el('span',{class:'boss-silhouette',text:stage.rounds.at(-1).emoji,'aria-label':'항구 수문장 실루엣'}),el('div',{},el('h2',{text:'항구 수문장 · 보스 예고'}),el('p',{text:HARBOR_BOSS_HINT}),el('small',{text:'SVO+to/for는 3형식입니다. 장막을 해제하지 않지만 강한 공격으로 돌파할 수도 있습니다.'}))),
    el('div', { class: 'intro-encounters' }, roundsForRun(state).map((round,index) => el('div', {},
      el('b', { text: round.emoji }), el('strong', { text: round.nameKo }), el('small', { text: `${Number(state.progress.stageId.slice(-2))}-${index+1} · HP ${round.hp}${round.kind === 'REGIONAL_BOSS' ? ' · 지역 보스' : ''}` })))),
    el('p', { class: 'helper', text: waterways?'who·which·받지 않기 중 하나를 고른 뒤 네 번째 상점에 들릅니다. 8-3에서는 where와 when 빙정 WORD를 한 장씩 받습니다.':ember?'상점이나 영구 무료 카드는 없습니다. 일반 전투에는 검은 먼지 2장, 보스 전투에는 5장이 섞입니다. 먼지는 교환할 수 있고 전투 종료 시 제거됩니다.':snow?'세 번째 상점에서 준비합니다. 빙정 WORD는 전투마다 공급되며 영구 덱에 추가되지 않습니다. 조합·교환·보급·탐색으로 사용할 수 있습니다.':desert?'없는 to, want/need, like/enjoy/finish 재료만 최대 세 장 받습니다. 이 지역에는 상점이 없습니다.':sky?'없는 연결 재료만 받습니다. 두 번째 상점에서 준비한 뒤 다섯 전투를 시작합니다.':canyon?'입장할 때 현재 덱에 없는 be·have·will을 각각 한 장만 받습니다. 이 지역에는 상점이 없습니다.':harbor?'입장에 필요한 동사·연결 카드를 확인한 뒤 첫 상점에 들릅니다. 상점을 나올 때 덱을 섞고 첫 손패를 뽑습니다.':'각 전투는 6턴입니다. 공격하거나 준비할 때 턴을 사용합니다. 초원 수호자에게 별도의 문법 면역은 없습니다.' }),
    !isCurrentCampaign(state)&&el('p',{class:'legacy-notice',text:'이 저장은 이전 버전의 시작의 초원 구간입니다. 0.2의 새 지역은 새 원정에서 시작할 수 있습니다.'}),
    harbor&&onRecords&&button('4형식 도감 보기',onRecords,'secondary'),
    cityChoice?renderWaterwaysChoice(state,cityChoice,onChooseWaterways):choice?el('section',{class:'panel stage4-connector-choice','aria-label':'무료 연결어 선택'},
      el('h2',{text:'연결어 한 장을 선택하세요'}),el('p',{text:'나머지 연결어는 보상과 상점에서 얻을 수 있습니다.'}),
      el('div',{class:'reward-choices'},choice.cardDefIds.map(cardDefId=>{const model=cardModel({instanceId:'preview.'+cardDefId,cardDefId,polishLevel:0},null,state.version);return el('section',{class:'reward-choice'},wordCard(model,{readonly:true,compact:true}),el('p',{text:{'card.and':'그리고 · 단어와 절을 이어 줍니다.','card.but':'그러나 · 대조되는 절을 이어 줍니다.','card.because':'왜냐하면 · 이유를 나타내는 절을 이어 줍니다.'}[cardDefId]}),button(`${model.surface} 선택`,()=>onChooseConnector?.({choiceId:choice.choiceId,entryId:choice.entryId,cardDefId}),'primary',{id:'choose-stage4-'+cardDefId.slice(5)}));})),
      el('p',{class:'helper',text:'선택 전에는 카드를 받지 않습니다. 나중에 돌아와 이어서 선택할 수 있습니다.'})):
    button(waterways?'입장 준비 · 관계사 선택':ember?'잿불 동굴에 들어가기':snow?'입장 준비 · 세 번째 상점으로':desert?'소원의 사막에 들어가기':sky?'입장 준비 · 두 번째 상점으로':canyon?'시간의 협곡에 들어가기':harbor?'입장 준비 · 상점으로':'초원에 들어가기', onStart, 'primary start-button', { id: (waterways||harbor||canyon||sky||desert||snow||ember)?'enter-stage':'start-battle' })));
}

export function renderStageClear(root,state,{onNext,onSaves,onDeck,onLobby}={}){
  applyStageTheme(state);
  root.replaceChildren(nav({onLobby,onSaves,onDeck}),el('main',{class:'intro-page'},
    el('span',{class:'eyebrow',text:`CHAPTER ${state.progress.stageId.slice(-2)} COMPLETE · ${state.progress.battleNumber} / ${campaignBattleCount(state)}`}),el('div',{class:'intro-art',text:'🌄'}),el('h1',{text:stageForRun(state).nameKo+' 클리어'}),
    el('p',{text:state.progress.stageId==='stage.07'?'관계절 콤보와 수로도시 단어 보상 풀이 열렸습니다. 고대의 수로도시로 향합니다.':state.progress.stageId==='stage.06'?'분사 수식·수동태·사역과 지각 콤보가 열렸습니다. 잿불 동굴로 향합니다.':state.progress.stageId==='stage.05'?'비교·정도 콤보가 열렸습니다. 거울의 설원으로 향합니다.':state.progress.stageId==='stage.04'?'to부정사·동명사·기본5형식 콤보가 열렸습니다. 소원의 사막으로 향합니다.':state.progress.stageId==='stage.03'?'절 연결 콤보와 네 번째 룬 슬롯이 열렸습니다. 이음의 하늘섬으로 향합니다.':state.progress.stageId==='stage.02'?'과거·진행·완료·will 미래 콤보가 해금되었습니다. 시간의 협곡으로 향합니다.':'4형식 콤보가 활성화되고 토파즈 룬 후보가 열렸습니다.\n지금의 덱·룬·재화를 가지고 전달의 항구로 향합니다.'}),
    el('div',{class:'record-grid'},metric(state.activeCardIds.length,'현재 덱'),metric(state.runes.orderedInstanceIds.length,'장착 룬'),metric(state.economy.gold,'재화')),
    el('div',{class:'reward-footer'},button(state.progress.stageId==='stage.07'?'고대의 수로도시로':state.progress.stageId==='stage.06'?'잿불 동굴로':state.progress.stageId==='stage.05'?'거울의 설원으로':state.progress.stageId==='stage.04'?'소원의 사막으로':state.progress.stageId==='stage.03'?'이음의 하늘섬으로':state.progress.stageId==='stage.02'?'시간의 협곡으로':'전달의 항구로',onNext,'primary',{id:'next-stage'}),button('여기서 저장',onSaves,'secondary'))));
}

/** Reward presentation reads frozen choices. All gameplay changes are controller commands. */
function renderLegacyReward(root, state, { command, onSaves, onDeck, onLobby } = {}) {
  applyStageTheme(state);
  const runeDescription=(r,l)=>describeRuneForUI(r,l,state.version);
  const offer = state.reward;
  if (!offer) {
    root.replaceChildren(nav({ onLobby }), el('main', { class: 'reward-page' }, heading('REWARD', '보상 정보를 확인할 수 없습니다.', '저장한 원정을 불러오거나 로비에서 다시 시작할 수 있습니다.')));
    return;
  }
  const titles = { CARD_COMMON: '새로운 단어를 발견했습니다', CARD_UNCOMMON: '고급 단어를 발견했습니다', CARD_RARE: '희귀 단어를 발견했습니다',
    CARD_ENHANCE: '한 장의 카드를 연마하세요', CARD_REMOVE: '덱에서 한 장을 제거하세요', RUNE: offer.firstRuneIntro ? '첫 룬을 선택하세요' : '당신의 문장에 룬을 더하세요' };
  const description = { CARD_COMMON: '동일 등급의 후보 중 카드 한 장을 덱에 추가합니다.', CARD_UNCOMMON: '현재 판정 가능한 기본 용법으로 사용할 수 있는 카드입니다.', CARD_RARE: '카드에 등록된 현재 지원 용법으로 사용할 수 있습니다.',
    CARD_ENHANCE: '연마 단계마다 카드 기본 점수가 +5 증가합니다. 최대 +3까지 강화합니다.', CARD_REMOVE: '선택한 실제 카드 한 장을 덱에서 제거합니다. 원정 사전에는 남습니다.',
    RUNE: offer.firstRuneIntro ? '수정은 정확한 문장, 호박은 짧은 문장, 구리는 교환 횟수를 돕습니다.' : '같은 룬은 레벨이 오릅니다. 다른 룬은 빈 슬롯에 장착하거나 기존 룬과 교체합니다.' };
  let pending = false;
  const choose = async (choiceId, options = {}) => {
    if (pending) return;
    pending = true;
    try {
      const result = await command({ type: choiceId === 'SKIP' ? 'SKIP_REWARD' : 'CHOOSE_REWARD', offerId: offer.offerId, choiceId, ...options });
      if (result?.needsReplacement) showReplacement(choiceId);
      else if (result?.needsConfirmation) confirmDialog('카드 제거 확인', result.message, '확인하고 제거', () => choose(choiceId, { ...options, confirmRemoval: true }));
      else if (!result?.ok && result?.message) toast(result.message);
    } finally { pending = false; }
  };
  function showReplacement(choiceId) {
    let dialog;
    const replacementCards = state.runes.orderedInstanceIds.map((instanceId) => {
      const instance = state.runes.instances[instanceId], definition = RUNE_BY_ID[instance.runeId];
      return el('section', { class: 'reward-choice', style: `--rune-color:${definition.color}` },
        el('div', { class: 'reward-gem', text: '◆' }), el('h3', { text: definition.nameKo }),
        el('p', { text: `Lv.${instance.level} · ${runeDescription(definition, instance.level)}` }),
        button('이 룬과 교체', () => { dialog.close(); choose(choiceId, { replaceRuneInstanceId: instanceId }); }, 'primary', { 'aria-label': `${definition.nameKo}와 교체` }));
    });
    dialog = modal('교체할 룬을 선택하세요', [el('p', { class: 'body-copy', text: '교체한 룬은 이번 원정에서 사라집니다. 취소하면 기존 룬과 현재 보상이 유지됩니다.' }),
      el('div', { class: 'reward-choices' }, replacementCards), el('div', { class: 'dialog-actions' }, button('교체 취소', () => dialog.close(), 'secondary'))], { wide: true });
  }
  const isTargets = ['CARD_ENHANCE', 'CARD_REMOVE'].includes(offer.type);
  const choices = offer.choices.map((choice) => {
    if (choice.runeId) {
      const definition = RUNE_BY_ID[choice.runeId];
      const old = state.runes.orderedInstanceIds.map((id) => state.runes.instances[id]).find((entry) => entry.runeId === choice.runeId);
      const level = (old?.level ?? 0) + 1;
      return el('section', { class: 'reward-choice', style: `--rune-color:${definition.color}`, dataset: { choiceId: choice.choiceId, runeId: choice.runeId } },
        el('div', { class: 'reward-gem', text: '◆' }), el('h3', { text: definition.nameKo }),
        el('small', { text: old ? `Lv.${old.level} → Lv.${level}` : 'Lv.1 · 새 룬' }),
        el('p', { text: runeDescription(definition, level) }),
        button(old ? '레벨 올리기' : '이 룬 선택', () => choose(choice.choiceId), 'primary', { 'aria-label': `${definition.nameKo} 선택`, disabled: choice.disabled }));
    }
    const instance = choice.cardInstanceId ? state.cardInstances[choice.cardInstanceId] : { instanceId: `preview.${choice.choiceId}`, cardDefId: choice.cardDefId, polishLevel: 0, specialEffectId: null };
    if (!instance) return el('section', { class: 'reward-target' }, el('p', { text: '현재 덱에 없는 카드입니다.' }));
    const model = cardModel(instance,null,state.version);
    const action = offer.type === 'CARD_ENHANCE' ? (choice.disabled ? '연마 최대 +3' : `연마 +${model.polish + 1}`) : offer.type === 'CARD_REMOVE' ? '이 카드 제거' : '이 카드 선택';
    return el('section', { class: isTargets ? 'reward-target' : 'reward-choice', dataset: { choiceId: choice.choiceId, cardInstanceId: instance.instanceId } },
      wordCard(model, { readonly: true, compact: isTargets }), !isTargets && el('p', { text: model.glossKo }),
      choice.reasonKo && el('small', { text: choice.reasonKo }),
      button(action, () => choose(choice.choiceId), choice.disabled ? 'secondary' : 'primary', { disabled: choice.disabled, 'aria-label': `${model.surface} ${action}` }));
  });
  root.replaceChildren(nav({ onLobby, onSaves, onDeck }), el('main', { class: 'reward-page' },
    el('div', { class: 'reward-heading' }, el('span', { class: 'eyebrow', text: `이전 버전 저장 · BATTLE 1-${state.progress.battleNumber} · VICTORY` }),
      el('h1', { text: titles[offer.type] }), el('p', { text: description[offer.type] }), el('small', { text: `현재 재화 ${state.economy.gold} · 승리 재화 정산 완료` })),
    offer.emptyReasonKo && el('p', { class: 'panel body-copy', text: offer.emptyReasonKo }),
    el('div', { class: isTargets ? 'reward-grid' : 'reward-choices' }, choices),
    el('div', { class: 'reward-footer' }, button(`건너뛰기 · +${offer.skipGold} 재화`, () => choose('SKIP'), 'secondary', { id: 'skip-reward' }))));
}

export function renderBetween(root, state, { onNext, onSaves, onDeck, onLobby } = {}) {
  applyStageTheme(state);
  const next = roundsForRun(state)[state.progress.roundIndex + 1],harbor=state.progress.stageId==='stage.02';
  root.replaceChildren(nav({ onLobby, onSaves, onDeck }), el('main', { class: 'intro-page' },
    el('span', { class: 'eyebrow', text: `CHAPTER ${state.progress.stageId.slice(-2)} · ${state.progress.battleNumber} / ${campaignBattleCount(state)}` }),
    el('div', { class: 'intro-art', text: next.emoji }), el('h1', { text: next.nameKo }),
    el('p', { text: `${next.kind === 'REGIONAL_BOSS' ? '지역 보스' : '다음 전투'} · HP ${next.hp}\n현재 덱 전체를 새로 섞습니다. 연마·룬·재화는 유지됩니다.` }),
    state.progress.stageId==='stage.08'&&next.kind==='REGIONAL_BOSS'&&el('p',{class:'boss-rule',text:WATERWAYS_HINT}),
    state.progress.stageId==='stage.07'&&next.kind==='REGIONAL_BOSS'&&el('p',{class:'boss-rule',text:EMBER_HINT}),
    state.progress.stageId==='stage.06'&&next.kind==='REGIONAL_BOSS'&&el('p',{class:'boss-rule',text:FROST_HINT}),
    state.progress.stageId==='stage.05'&&next.kind==='REGIONAL_BOSS'&&el('p',{class:'boss-rule',text:TURN_HAND_SEAL_HINT}),
    harbor&&next.kind==='REGIONAL_BOSS'&&el('p',{class:'boss-rule',text:HARBOR_BOSS_HINT}),
    el('div', { class: 'record-grid' }, metric(state.activeCardIds.length, '현재 덱'), metric(state.runes.orderedInstanceIds.length, '장착 룬'), metric(state.economy.gold, '재화')),
    el('div', { class: 'reward-footer' }, button('다음 전투', onNext, 'primary', { id: 'next-battle' }), button('여기서 저장', onSaves, 'secondary'))));
}

export function renderResult(root, state, { onNew, onRetrySeed, onLoad, onSaves, onLobby, onRecords } = {}) {
  applyStageTheme(state);
  const complete = state.status === 'CONTENT_COMPLETE',waterways=state.progress.contentBoundary==='STAGE8_END',ember=state.progress.contentBoundary==='STAGE7_END',snow=state.progress.contentBoundary==='STAGE6_END',desert=state.progress.contentBoundary==='STAGE5_END',sky=state.progress.contentBoundary==='STAGE4_END',harbor=state.progress.contentBoundary==='STAGE2_END',canyon=state.progress.contentBoundary==='STAGE3_END';
  const enemy = state.combat?.enemyState;
  const actions = complete ? [button('새 원정', onNew, 'primary', { id: 'new-run-result' }), button('기록 보기', onRecords, 'secondary'), button('완료 상태 저장', onSaves, 'secondary')]
    : [button('새 원정', onNew, 'primary', { id: 'new-run-result' }), onRetrySeed && button('같은 시드로 재도전', onRetrySeed, 'secondary'), button('수동 저장 불러오기', onLoad, 'secondary')];
  root.replaceChildren(nav({ onLobby }), el('main', { class: 'result-page' },
    el('span', { class: 'eyebrow', text: complete ? `CHAPTER COMPLETE · VERSION ${harbor?'0.2':state.version}` : 'EXPEDITION ENDED' }),
    el('div', { class: 'intro-art'+(waterways?' waterways-open-gate':''), text: complete ? waterways?'🏇':'🌄' : '🍂',...waterways?{'aria-label':'청동 수문장이 연 보관소 문'}:{} }),
    el('h1', { text: complete ? waterways?'고대의 수로도시 완료':ember?'잿불 동굴 완료':snow?'거울의 설원 완료':desert?'소원의 사막 완료':sky?'이음의 하늘섬 완료':canyon?'시간의 협곡 완료':harbor?'전달의 항구 완료':'시작의 초원 클리어' : '이번 원정은 여기까지' }),
    el('p', { text: complete ? waterways?'총 37전투를 마쳤습니다. 청동 수문장이 보관소로 향하는 길을 열었습니다. 다음 새 원정의 정규 보상 풀에 수로도시 단어가 추가됩니다. 다음 지역 전투는 아직 제공하지 않습니다.':ember?'총 32전투를 마쳤습니다. 잠든 잿불룡을 넘어 잿불 동굴을 건넜습니다. 다음 지역은 아직 제공하지 않습니다.':snow?'총 27전투를 마쳤습니다. 다음 새 원정의 정규 보상 풀에 설원 단어가 추가됩니다. 비교 콤보 해금은 각 원정의 진행을 따릅니다. 다음 지역은 아직 제공하지 않습니다.':desert?'총 22전투를 마쳤습니다. 봉인에 맞서 소원의 사막을 건넜습니다. 다음 지역은 아직 제공하지 않습니다.':sky?'총 17전투를 마쳤습니다. 연결의 보호막을 넘어 하늘길을 열었습니다. 다음 지역은 아직 제공하지 않습니다.':canyon?'총 12전투를 마쳤습니다. 시간의 골렘을 공략하고 룬 슬롯 4칸을 열었습니다. 다음 지역은 아직 제공하지 않습니다.':harbor?'전달의 항구 완료 — 0.2 제공 구간을 모두 플레이했습니다.\n총 7전투를 마쳤습니다. 다음 지역은 후속 버전에서 이어집니다.':'이 저장은 이전 버전의 시작의 초원 구간입니다.\n0.2의 새 지역은 새 원정에서 시작할 수 있습니다.' : `${enemy?.nameKo ?? '적'}의 남은 HP ${enemy?.hp ?? 0}.\n제한된 턴을 모두 사용했습니다. 새 덱으로 다시 도전할 수 있습니다.` }),
    el('div', { class: 'record-grid' }, metric(state.stats.bestAttack, '이번 원정 최고 공격'), metric(state.economy.gold, '보유 재화'), metric(complete ? state.stats.attacks : state.combat?.exchangesRemaining ?? 0, complete ? '확정한 공격' : '남은 교환 횟수')),
    complete && el('p', { class: 'helper', text: '전체 48전투 스토리 클리어 기록과는 구분됩니다. 여행자·난이도 1로 새 원정을 시작할 수 있습니다.' }),
    el('div', { class: 'reward-footer' }, actions)));
}

/** Mixed reward UI holds only a temporary target view; frozen candidates stay in RunState. */
export function renderReward(root,state,handlers={}){
  if(!isMixedOffer(state.reward)){renderLegacyReward(root,state,handlers);return ()=>{};}
  const runeDescription=(r,l)=>describeRuneForUI(r,l,state.version);
  const {command,onSaves,onDeck,onLobby}=handlers,offer=state.reward;
  const backdrop=renderCombat(root,state,{locked:true,openOverlay:()=>{}});
  backdrop.element.classList.remove('presentation-locked');
  backdrop.element.classList.add('reward-backdrop');
  const access=el('div',{class:'reward-access'},button('보상 다시 열기',showChoices,'primary'),button('저장',onSaves,'secondary'),button('내 덱',onDeck,'secondary'),button('로비',onLobby,'quiet'));
  root.append(access);
  let pending=false;
  async function choose(choice,options={}){
    if(pending)return;pending=true;
    try{
      const result=await command({type:choice==='SKIP'?'SKIP_REWARD':'CHOOSE_REWARD',offerId:offer.offerId,choiceId:choice==='SKIP'?'SKIP':choice.choiceId,...options});
      if(result?.needsReplacement)showReplacement(choice);
      else if(result?.needsConfirmation){let d;d=modal('카드 제거 확인',[el('p',{text:result.message}),button('취소',()=>{d.close();showTargets(choice);},'secondary'),button('확인하고 제거',()=>choose(choice,{...options,confirmRemoval:true}),'primary')]);}
      else if(!result?.ok&&result?.message)toast(result.message);
    }finally{pending=false;}
  }
  function runeCard(choice,action){const def=RUNE_BY_ID[choice.runeId];return el('section',{class:'reward-choice',style:`--rune-color:${def.color}`,dataset:{choiceId:choice.choiceId,runeId:choice.runeId}},el('div',{class:'reward-gem',text:'◆'}),el('h3',{text:def.nameKo}),el('small',{text:choice.ownedLevel?`Lv.${choice.ownedLevel} → Lv.${choice.offeredLevel}`:'Lv.1 · 새 룬'}),el('p',{text:runeDescription(def,choice.offeredLevel)}),button('이 룬 선택',action,'primary'));}
  function showReplacement(choice){modal('교체할 룬을 선택하세요',[el('p',{text:'취소하면 세 후보와 기존 룬이 그대로 유지됩니다.'}),el('div',{class:'reward-choices'},state.runes.orderedInstanceIds.map(id=>{const r=state.runes.instances[id],def=RUNE_BY_ID[r.runeId];return el('section',{class:'reward-choice'},el('h3',{text:`${def.nameKo} Lv.${r.level}`}),el('p',{text:runeDescription(def,r.level)}),button('이 룬과 교체',()=>choose(choice,{replaceRuneInstanceId:id}),'primary'));})),button('교체 취소',showChoices,'secondary')],{wide:true,onClose:()=>{}});}
  function showTargets(choice){const polish=choice.serviceKind==='POLISH';modal(polish?'연마할 카드 한 장 선택':'제거할 카드 한 장 선택',[
    el('p',{text:polish?(hasPolishCampaign(state)?'단어는 단계마다 기본 점수 +5, 최대 +3. 운영은 효과를 강화하며 최대 +1입니다.':'연마 단계 +1 · 기본 10점에 단계마다 +5점. 최대 +3.'):'선택한 실제 카드만 제거합니다. 기본 문장 경로를 잃으면 추가 확인을 요청합니다.'}),
    el('div',{class:'reward-target-grid'},choice.targetCardIds.map(id=>{const instance=state.cardInstances[id],model=cardModel(instance,null,state.version);return el('section',{class:'reward-target',dataset:{targetId:id}},wordCard(model,{readonly:true,compact:true}),polish&&model.cardKind==='OPERATION'&&el('p',{text:operationPolishPreview(model)}),button(polish?`+${model.polish} → +${model.polish+1}`:'이 카드 제거',()=>choose(choice,{targetCardInstanceId:id}),'primary'));})),
    button('대상 선택 취소 · 원래 보상',showChoices,'secondary',{id:'cancel-reward-target'})],{wide:true});}
  function showChoices(){const summary=state.combat.victorySummary;
    modal(offer.firstRuneIntro?'첫 룬을 선택하세요':'전투 승리 · 보상 하나를 선택하세요',[
      el('p',{class:'victory-summary',text:summary?`기본 재화 +${summary.baseGold} · 남은 턴 ${summary.turnsRemaining} × 1 = +${summary.turnBonusGold} · 총 +${summary.totalGold} 정산 완료`:'승리 재화 정산 완료'}),
      el('p',{class:'helper',text:offer.firstRuneIntro?'수정은 완벽한 문장, 호박은 짧은 문장, 구리는 교환 횟수를 돕습니다.':'세 후보 중 하나만 받습니다. 연마·제거는 보유 카드 선택 후 확정됩니다.'}),
      el('div',{class:'reward-choices mixed-rewards'},offer.choices.map(choice=>{
        if(choice.kind==='RUNE')return runeCard(choice,()=>choose(choice));
        if(choice.kind==='SERVICE')return el('section',{class:'reward-choice service-choice',dataset:{choiceId:choice.choiceId,serviceKind:choice.serviceKind}},el('div',{class:'service-symbol',text:choice.serviceKind==='POLISH'?'✦':'−'}),el('h3',{text:choice.serviceKind==='POLISH'?'카드 연마':'카드 제거'}),el('p',{text:choice.serviceKind==='POLISH'?'보유 카드 한 장을 +1 연마합니다.':'보유 카드 한 장을 덱에서 제거합니다.'}),button('대상 선택',()=>showTargets(choice),'primary'));
        const model=cardModel({instanceId:choice.choiceId,cardDefId:choice.cardDefId,polishLevel:0},null,state.version);return el('section',{class:'reward-choice',dataset:{choiceId:choice.choiceId}},wordCard(model,{readonly:true}),el('p',{text:model.descriptionKo??model.glossKo}),button('이 카드 선택',()=>choose(choice),'primary'));
      })),
      el('div',{class:'reward-footer'},button(`건너뛰기 · +${offer.skipGold} 재화`,()=>choose('SKIP'),'secondary',{id:'skip-reward'}),button('저장',onSaves,'quiet'),button('내 덱',onDeck,'quiet'))],{wide:true});
  }
  showChoices();return backdrop.cleanup;
}

function renderWaterwaysChoice(state,offer,onChoose){
 const submit=(choice,confirmNone=false)=>onChoose?.({offerId:offer.offerId,choice,confirmNone});
 return el('section',{class:'panel waterways-entry-choice','aria-label':'수로도시 입장 선택'},el('h2',{text:'관계사 한 장을 선택하세요'}),el('p',{text:'이미 가지고 있어도 한 장 더 선택할 수 있습니다. 받지 않아도 보상이나 재화를 대신 지급하지 않습니다.'}),el('div',{class:'reward-choices'},...['WHO','WHICH'].map(choice=>{const lemma=choice.toLowerCase(),model=cardModel({instanceId:'preview.'+lemma,cardDefId:'card.'+lemma,polishLevel:0},null,state.version);return el('section',{class:'reward-choice'},wordCard(model,{readonly:true,compact:true}),el('p',{text:'현재 보유 '+offer.ownedCounts[lemma]+'장'}),button(lemma+' 선택',()=>submit(choice),'primary',{id:'choose-stage8-'+lemma}));}),el('section',{class:'reward-choice'},el('h3',{text:'받지 않기'}),el('p',{text:'현재 that '+offer.ownedCounts.that+'장 · 기존 덱으로 진행합니다.'}),button('받지 않기',()=>offer.needsNoneConfirmation?confirmDialog('관계사 없이 진행할까요?','현재 who·which·that이 없습니다. 청동 수문장은 한 문장 안의 주격·목적격 관계절을 요구하며, 보스 입장 시 카드를 대신 지급하지 않습니다.','그대로 진행',()=>submit('NONE',true)):submit('NONE'),'secondary',{id:'choose-stage8-none'}))));
}
