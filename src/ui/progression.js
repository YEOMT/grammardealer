import {enemyDisplayName,stageDisplayName} from './displayText.js';
import {usesPostBossShop} from '../game/shopFlow.js';
import {introViewport} from './viewport.js';
import {runeReadiness} from './runes.js';
import {WATERWAYS_HINT} from '../data/stage8.js';
import {EMBER_HINT} from '../data/stage7.js';
import {FROST_HINT} from '../data/stage6.js';
import {TURN_HAND_SEAL_HINT} from '../data/stage5.js';
import { el, button, heading, modal, confirmDialog, toast } from './dom.js';
import { renderCombat } from './combat.js';
import { isMixedOffer } from '../game/rewards.js';
import { wordCard } from './cards.js';
import { cardModel, operationPolishPreview, runeDescription as describeRuneForUI } from './models.js';
import {applyStageTheme} from './theme.js';
import {campaignBattleCount,hasPolishCampaign} from '../data/campaignFeatures.js';
import { runeForVersion } from '../data/runes.js';
import { stageForRun, roundsForRun } from '../data/stages.js';
import { STAGE2_VEIL_HINT } from '../data/stage2.js';

const nav = ({ onLobby, onSaves, onDeck } = {}) => el('header', { class: 'topbar' },
  el('span', { class: 'brand-small', text: 'SYNTAX ATLAS' }),
  el('nav', {}, onDeck && button('내 덱', onDeck, 'quiet'), onSaves && button('저장', onSaves, 'quiet'), onLobby && button('로비', onLobby, 'quiet')));
const metric = (value, label) => el('div', {}, el('strong', { text: value }), el('span', { text: label }));

export const HARBOR_BOSS_HINT = STAGE2_VEIL_HINT;
export function renderIntro(root, state, { onStart, onLobby, onDeck, onSaves, onChooseConnector, onChooseWaterways } = {}) {
  applyStageTheme(state);
  const stage=stageForRun(state),stageId=state.progress.stageId;
  const choice=hasPolishCampaign(state)&&stageId==='stage.04'&&state.entryChoice?.pending?state.entryChoice:null;
  const cityChoice=stageId==='stage.08'&&state.waterwaysEntryChoice?.pending?state.waterwaysEntryChoice:null;
  const introductions={
    'stage.01':'단어를 모아 당신의 첫 문장을 완성하세요.',
    'stage.02':'마음을 전하는 문장과 함께 항구로 나아가세요.',
    'stage.03':'흐르는 시간을 따라 협곡을 건너세요.',
    'stage.04':'단어와 절을 이어 하늘섬을 건너세요.',
    'stage.05':'바람에 실린 소원을 따라 사막을 여행하세요.',
    'stage.06':'얼음에 비친 세계를 지나 설원을 탐험하세요.',
    'stage.07':'잿불이 남은 동굴 깊은 곳으로 나아가세요.',
    'stage.08':'오래된 물길을 따라 수로도시를 탐험하세요.',
    'stage.09':'문장들이 꿈꾸는 대서고의 문을 여세요.',
    'stage.final':'당신이 모은 단어와 문장으로 마지막 세 형상을 마주하세요.',
    'stage.10':'거대한 기둥 사이로 흐르는 별빛을 따라가세요.'
  };
  const openChoice=()=>{
    let view;
    const content=cityChoice?renderWaterwaysChoice(state,cityChoice,value=>{view.close();onChooseWaterways?.(value);}):choice?el('section',{class:'panel stage4-connector-choice','aria-label':'무료 연결어 선택'},
      el('h2',{text:'연결어 한 장을 선택하세요'}),el('p',{text:'나머지 연결어는 보상과 상점에서 얻을 수 있습니다.'}),
      el('div',{class:'reward-choices'},choice.cardDefIds.map(cardDefId=>{const model=cardModel({instanceId:'preview.'+cardDefId,cardDefId,polishLevel:0},null,state.version);return el('section',{class:'reward-choice'},wordCard(model,{readonly:true,compact:true}),el('p',{text:{'card.and':'그리고 · 단어와 절을 이어 줍니다.','card.but':'그러나 · 대조되는 절을 이어 줍니다.','card.because':'왜냐하면 · 이유를 나타내는 절을 이어 줍니다.'}[cardDefId]}),button(`${model.surface} 선택`,()=>{view.close();onChooseConnector?.({choiceId:choice.choiceId,entryId:choice.entryId,cardDefId});},'primary',{id:'choose-stage4-'+cardDefId.slice(5)}));})),
      el('p',{class:'helper',text:'선택 전에는 카드를 받지 않습니다. 나중에 돌아와 이어서 선택할 수 있습니다.'})):null;
    view=modal(cityChoice?'입장 카드 선택':'입장 연결어 선택',content,{wide:true});
    view.dialog.classList.add('entry-choice-dialog');
  };
  const preparing=usesPostBossShop(state)&&!!(choice||cityChoice);
  root.replaceChildren(nav({onLobby,onDeck,onSaves}),el('main',{class:preparing?'shop-page harbor-page shop-entry-preparation':'intro-page'},
    preparing&&el('span',{class:'eyebrow',text:'다음 지역 준비 상점'}),
    el('h1',{text:preparing?stageDisplayName(stage)+' · 상점 입장 준비':stageDisplayName(stage)}),el('p',{text:preparing?'입장 카드를 선택하면 이번 상점의 상품을 확인할 수 있습니다.':introductions[stageId]}),
    el('div',{class:preparing?'shop-footer':'intro-footer'},button(choice||cityChoice?'입장 카드 선택':stageDisplayName(stage)+'에 들어가기',choice||cityChoice?openChoice:onStart,'primary start-button',{id:stageId==='stage.01'?'start-battle':'enter-stage'}))));
  if(!preparing)introViewport(root.querySelector('.intro-page'));
}

export function renderStageClear(root,state,{onNext,onSaves,onDeck,onLobby}={}){
  applyStageTheme(state);
  root.replaceChildren(nav({onLobby,onSaves,onDeck}),el('main',{class:'intro-page'},
    el('span',{class:'eyebrow',text:`CHAPTER ${state.progress.stageId.slice(-2)} COMPLETE · ${state.progress.battleNumber} / ${campaignBattleCount(state)}`}),el('div',{class:'intro-art',text:'🌄'}),el('h1',{text:stageDisplayName(stageForRun(state))+' 클리어'}),
    el('p',{text:state.progress.stageId==='stage.10'?'마지막 준비 상점과 최종 세 전투가 기다립니다.':state.progress.stageId==='stage.09'?'별의 회랑으로 향합니다. 상점과 일반전 보상으로 보스 공략을 준비하세요.':state.progress.stageId==='stage.08'?'몽환의 대서고로 향합니다. 일반전 보상으로 영구 덱을 준비하세요. 꿈의 도서관장 전투에는 빙정과 무료 지원이 없습니다.':state.progress.stageId==='stage.07'?'관계절 콤보와 수로도시 단어 보상 풀이 열렸습니다. 고대의 수로도시로 향합니다.':state.progress.stageId==='stage.06'?'분사 수식·수동태·사역과 지각 콤보가 열렸습니다. 잿불 동굴로 향합니다.':state.progress.stageId==='stage.05'?'비교·정도 콤보가 열렸습니다. 거울의 설원으로 향합니다.':state.progress.stageId==='stage.04'?'to부정사·동명사·기본5형식 콤보가 열렸습니다. 소원의 사막으로 향합니다.':state.progress.stageId==='stage.03'?'절 연결 콤보와 네 번째 룬 슬롯이 열렸습니다. 이음의 하늘섬으로 향합니다.':state.progress.stageId==='stage.02'?'과거·진행·완료·will 미래 콤보가 해금되었습니다. 시간의 협곡으로 향합니다.':'4형식 콤보가 활성화되고 토파즈 룬 후보가 열렸습니다.\n지금의 덱·룬·골드를 가지고 전달의 항구로 향합니다.'}),
    el('div',{class:'record-grid'},metric(state.activeCardIds.length,'현재 덱'),metric(state.runes.orderedInstanceIds.length,'장착 룬'),metric(state.economy.gold,'골드')),
    el('div',{class:'reward-footer'},button(state.progress.stageId==='stage.10'?'최종전으로':state.progress.stageId==='stage.09'?'별의 회랑으로':state.progress.stageId==='stage.08'?'몽환의 대서고로':state.progress.stageId==='stage.07'?'고대의 수로도시로':state.progress.stageId==='stage.06'?'잿불 동굴로':state.progress.stageId==='stage.05'?'거울의 설원으로':state.progress.stageId==='stage.04'?'소원의 사막으로':state.progress.stageId==='stage.03'?'이음의 하늘섬으로':state.progress.stageId==='stage.02'?'시간의 협곡으로':'전달의 항구로',onNext,'primary',{id:'next-stage'}),button('여기서 저장',onSaves,'secondary'))));
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
      const instance = state.runes.instances[instanceId], definition = runeForVersion(instance.runeId,state.version);
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
      const definition = runeForVersion(choice.runeId,state.version);
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
      el('h1', { text: titles[offer.type] }), el('p', { text: description[offer.type] }), el('small', { text: `현재 골드 ${state.economy.gold} · 승리 골드 정산 완료` })),
    offer.emptyReasonKo && el('p', { class: 'panel body-copy', text: offer.emptyReasonKo.replaceAll('재화','골드') }),
    el('div', { class: isTargets ? 'reward-grid' : 'reward-choices' }, choices),
    el('div', { class: 'reward-footer' }, button(`건너뛰기 · +${offer.skipGold} 골드`, () => choose('SKIP'), 'secondary', { id: 'skip-reward' }))));
}

export function renderBetween(root, state, { onNext, onSaves, onDeck, onLobby } = {}) {
  applyStageTheme(state);
  const next = roundsForRun(state)[state.progress.roundIndex + 1],harbor=state.progress.stageId==='stage.02';
  root.replaceChildren(nav({ onLobby, onSaves, onDeck }), el('main', { class: 'intro-page' },
    el('span', { class: 'eyebrow', text: `${state.progress.stageId==='stage.final'?'FINAL':`CHAPTER ${state.progress.stageId.slice(-2)}`} · ${state.progress.battleNumber} / ${campaignBattleCount(state)}` }),
    el('div', { class: 'intro-art', text: next.emoji }), el('h1', { text: enemyDisplayName(next) }),
    state.progress.stageId==='stage.08'&&next.kind==='REGIONAL_BOSS'&&el('p',{class:'boss-rule',text:WATERWAYS_HINT}),
    state.progress.stageId==='stage.07'&&next.kind==='REGIONAL_BOSS'&&el('p',{class:'boss-rule',text:EMBER_HINT}),
    state.progress.stageId==='stage.06'&&next.kind==='REGIONAL_BOSS'&&el('p',{class:'boss-rule',text:FROST_HINT}),
    state.progress.stageId==='stage.05'&&next.kind==='REGIONAL_BOSS'&&el('p',{class:'boss-rule',text:TURN_HAND_SEAL_HINT}),
    state.progress.stageId==='stage.final'&&el('p',{class:'boss-rule',text:state.progress.roundIndex===0?'다음 전투는 실제 기여도가 높은 공격 룬과 매 턴 단어 최대 두 장을 봉인합니다. 시제 과제로 룬을 되찾을 수 있습니다.':'다음 전투에는 방어막·봉인·회복이 없습니다. 새 6턴과 정상 자원으로 시작합니다.'}),
    harbor&&next.kind==='REGIONAL_BOSS'&&el('p',{class:'boss-rule',text:HARBOR_BOSS_HINT}),
    el('div', { class: 'record-grid' }, metric(state.activeCardIds.length, '현재 덱'), metric(state.runes.orderedInstanceIds.length, '장착 룬'), metric(state.economy.gold, '골드')),
    el('div', { class: 'reward-footer' }, button('다음 전투', onNext, 'primary', { id: 'next-battle' }), button('여기서 저장', onSaves, 'secondary'))));
}

export function renderResult(root, state, { onNew, onRetrySeed, onLoad, onSaves, onLobby, onRecords } = {}) {
  applyStageTheme(state);
  const complete = state.status === 'CONTENT_COMPLETE',corridor=state.progress.contentBoundary==='STAGE10_END',library=state.progress.contentBoundary==='STAGE9_END',waterways=state.progress.contentBoundary==='STAGE8_END',ember=state.progress.contentBoundary==='STAGE7_END',snow=state.progress.contentBoundary==='STAGE6_END',desert=state.progress.contentBoundary==='STAGE5_END',sky=state.progress.contentBoundary==='STAGE4_END',harbor=state.progress.contentBoundary==='STAGE2_END',canyon=state.progress.contentBoundary==='STAGE3_END';
  const enemy = state.combat?.enemyState;
  const actions = complete ? [button('새 원정', onNew, 'primary', { id: 'new-run-result' }), button('기록 보기', onRecords, 'secondary'), button('완료 상태 저장', onSaves, 'secondary')]
    : [button('새 원정', onNew, 'primary', { id: 'new-run-result' }), onRetrySeed && button('같은 시드로 재도전', onRetrySeed, 'secondary'), button('수동 저장 불러오기', onLoad, 'secondary')];
  root.replaceChildren(nav({ onLobby }), el('main', { class: 'result-page' },
    el('span', { class: 'eyebrow', text: complete ? `CHAPTER COMPLETE · VERSION ${harbor?'0.2':state.version}` : 'EXPEDITION ENDED' }),
    el('div', { class: 'intro-art'+(waterways?' waterways-open-gate':''), text: complete ? corridor?'✦':library?'📚':waterways?'🏇':'🌄' : '🍂',...waterways?{'aria-label':'고대 수호대장이 연 보관소 문'}:{} }),
    el('h1', { text: complete ? corridor?'별의 회랑 완료':library?'몽환의 대서고 완료':waterways?'고대의 수로도시 완료':ember?'잿불 동굴 완료':snow?'거울의 설원 완료':desert?'소원의 사막 완료':sky?'이음의 하늘섬 완료':canyon?'시간의 협곡 완료':harbor?'전달의 항구 완료':'시작의 초원 클리어' : '이번 원정은 여기까지' }),
    el('p', { text: complete ? corridor?'별의 회랑을 통과했습니다. 이번 버전의 여정은 여기까지입니다.':library?'총 42전투를 마쳤습니다. 명사절과 가주어·진주어로 꿈의 도서관장을 넘어섰습니다. 다음 지역은 아직 제공하지 않습니다.':waterways?'총 37전투를 마쳤습니다. 고대 수호대장이 보관소로 향하는 길을 열었습니다. 다음 새 원정의 정규 보상 풀에 수로도시 단어가 추가됩니다. 다음 지역 전투는 아직 제공하지 않습니다.':ember?'총 32전투를 마쳤습니다. 잠든 잿불룡을 넘어 잿불 동굴을 건넜습니다. 다음 지역은 아직 제공하지 않습니다.':snow?'총 27전투를 마쳤습니다. 다음 새 원정의 정규 보상 풀에 설원 단어가 추가됩니다. 비교 콤보 해금은 각 원정의 진행을 따릅니다. 다음 지역은 아직 제공하지 않습니다.':desert?'총 22전투를 마쳤습니다. 봉인에 맞서 소원의 사막을 건넜습니다. 다음 지역은 아직 제공하지 않습니다.':sky?'총 17전투를 마쳤습니다. 연결의 보호막을 넘어 하늘길을 열었습니다. 다음 지역은 아직 제공하지 않습니다.':canyon?'총 12전투를 마쳤습니다. 시간의 골렘을 공략하고 룬 슬롯 4칸을 열었습니다. 다음 지역은 아직 제공하지 않습니다.':harbor?'전달의 항구 완료 — 0.2 제공 구간을 모두 플레이했습니다.\n총 7전투를 마쳤습니다. 다음 지역은 후속 버전에서 이어집니다.':'이 저장은 이전 버전의 시작의 초원 구간입니다.\n0.2의 새 지역은 새 원정에서 시작할 수 있습니다.' : `${enemyDisplayName(enemy)}의 남은 HP ${enemy?.hp ?? 0}.\n제한된 턴을 모두 사용했습니다. 새 덱으로 다시 도전할 수 있습니다.` }),
    el('div', { class: 'record-grid' }, metric(state.stats.bestAttack, '이번 원정 최고 공격'), metric(state.economy.gold, '보유 골드'), metric(complete ? state.stats.attacks : state.combat?.exchangesRemaining ?? 0, complete ? '확정한 공격' : '남은 교환 횟수')),
    complete && el('p', { class: 'helper', text: '최종 여정과 엔딩은 아직 제공하지 않습니다. 여행자·난이도 1로 새 원정을 시작할 수 있습니다.' }),
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
  function runeCard(choice,action){const def=runeForVersion(choice.runeId,state.version);return el('section',{class:'reward-choice',style:`--rune-color:${def.color}`,dataset:{choiceId:choice.choiceId,runeId:choice.runeId}},el('div',{class:'reward-gem'+(def.id==='rune.longSentence'&&def.rarity==='RARE'?' diamond-gem':''),text:'◆'}),el('h3',{text:def.nameKo}),el('small',{text:choice.ownedLevel?`Lv.${choice.ownedLevel} → Lv.${choice.offeredLevel}`:'Lv.1 · 새 룬'}),el('p',{text:runeDescription(def,choice.offeredLevel)}),el('small',{text:runeReadiness(choice.runeId,state)}),button('이 룬 선택',action,'primary'));}
  function showReplacement(choice){modal('교체할 룬을 선택하세요',[el('p',{text:'취소하면 세 후보와 기존 룬이 그대로 유지됩니다.'}),el('div',{class:'reward-choices'},state.runes.orderedInstanceIds.map(id=>{const r=state.runes.instances[id],def=runeForVersion(r.runeId,state.version);return el('section',{class:'reward-choice'},el('h3',{text:`${def.nameKo} Lv.${r.level}`}),el('p',{text:runeDescription(def,r.level)}),button('이 룬과 교체',()=>choose(choice,{replaceRuneInstanceId:id}),'primary'));})),button('교체 취소',showChoices,'secondary')],{wide:true,onClose:()=>{}});}
  function showTargets(choice){const polish=choice.serviceKind==='POLISH';modal(polish?'연마할 카드 한 장 선택':'제거할 카드 한 장 선택',[
    el('p',{text:polish?(hasPolishCampaign(state)?'단어는 단계마다 기본 점수 +5, 최대 +3. 운영은 효과를 강화하며 최대 +1입니다.':'연마 단계 +1 · 기본 10점에 단계마다 +5점. 최대 +3.'):'선택한 실제 카드만 제거합니다. 기본 문장 경로를 잃으면 추가 확인을 요청합니다.'}),
    el('div',{class:'reward-target-grid'},choice.targetCardIds.map(id=>{const instance=state.cardInstances[id],model=cardModel(instance,null,state.version);return el('section',{class:'reward-target',dataset:{targetId:id}},wordCard(model,{readonly:true,compact:true}),polish&&model.cardKind==='OPERATION'&&el('p',{text:operationPolishPreview(model)}),button(polish?`+${model.polish} → +${model.polish+1}`:'이 카드 제거',()=>choose(choice,{targetCardInstanceId:id}),'primary'));})),
    button('대상 선택 취소 · 원래 보상',showChoices,'secondary',{id:'cancel-reward-target'})],{wide:true});}
  function showChoices(){const summary=state.combat.victorySummary;
    modal(offer.firstRuneIntro?'첫 룬을 선택하세요':'전투 승리 · 보상 하나를 선택하세요',[
      el('p',{class:'victory-summary',text:summary?`기본 골드 +${summary.baseGold} · 남은 턴 ${summary.turnsRemaining} × 1 = +${summary.turnBonusGold} · 총 +${summary.totalGold} 정산 완료`:'승리 골드 정산 완료'}),
      el('p',{class:'helper',text:offer.firstRuneIntro?'수정은 완벽한 문장, 호박은 짧은 문장, 구리는 교환 횟수를 돕습니다.':'세 후보 중 하나만 받습니다. 연마·제거는 보유 카드 선택 후 확정됩니다.'}),
      el('div',{class:'reward-choices mixed-rewards'},offer.choices.map(choice=>{
        if(choice.kind==='RUNE')return runeCard(choice,()=>choose(choice));
        if(choice.kind==='SERVICE')return el('section',{class:'reward-choice service-choice',dataset:{choiceId:choice.choiceId,serviceKind:choice.serviceKind}},el('div',{class:'service-symbol',text:choice.serviceKind==='POLISH'?'✦':'−'}),el('h3',{text:choice.serviceKind==='POLISH'?'카드 연마':'카드 제거'}),el('p',{text:choice.serviceKind==='POLISH'?'보유 카드 한 장을 +1 연마합니다.':'보유 카드 한 장을 덱에서 제거합니다.'}),button('대상 선택',()=>showTargets(choice),'primary'));
        const model=cardModel({instanceId:choice.choiceId,cardDefId:choice.cardDefId,polishLevel:0},null,state.version);return el('section',{class:'reward-choice',dataset:{choiceId:choice.choiceId}},wordCard(model,{readonly:true}),el('p',{text:model.descriptionKo??model.glossKo}),button('이 카드 선택',()=>choose(choice),'primary'));
      })),
      el('div',{class:'reward-footer'},button(`건너뛰기 · +${offer.skipGold} 골드`,()=>choose('SKIP'),'secondary',{id:'skip-reward'}),button('저장',onSaves,'quiet'),button('내 덱',onDeck,'quiet'))],{wide:true});
  }
  showChoices();return backdrop.cleanup;
}

function renderWaterwaysChoice(state,offer,onChoose){
 const submit=(choice,confirmNone=false)=>onChoose?.({offerId:offer.offerId,choice,confirmNone});
 return el('section',{class:'panel waterways-entry-choice','aria-label':'수로도시 입장 선택'},el('h2',{text:'관계사 한 장을 선택하세요'}),el('p',{text:'이미 가지고 있어도 한 장 더 선택할 수 있습니다. 받지 않아도 보상이나 골드를 대신 지급하지 않습니다.'}),el('div',{class:'reward-choices'},...['WHO','WHICH'].map(choice=>{const lemma=choice.toLowerCase(),model=cardModel({instanceId:'preview.'+lemma,cardDefId:'card.'+lemma,polishLevel:0},null,state.version);return el('section',{class:'reward-choice'},wordCard(model,{readonly:true,compact:true}),el('p',{text:'현재 보유 '+offer.ownedCounts[lemma]+'장'}),button(lemma+' 선택',()=>submit(choice),'primary',{id:'choose-stage8-'+lemma}));}),el('section',{class:'reward-choice'},el('h3',{text:'받지 않기'}),el('p',{text:'현재 that '+offer.ownedCounts.that+'장 · 기존 덱으로 진행합니다.'}),button('받지 않기',()=>offer.needsNoneConfirmation?confirmDialog('관계사 없이 진행할까요?','현재 who·which·that이 없습니다. 고대 수호대장은 한 문장 안의 주격·목적격 관계절을 요구하며, 보스 입장 시 카드를 대신 지급하지 않습니다.','그대로 진행',()=>submit('NONE',true)):submit('NONE'),'secondary',{id:'choose-stage8-none'}))));
}
