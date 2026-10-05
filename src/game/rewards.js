import { registryForVersion } from '../data/language/index.js';
import { eligibleRuneDefinitions, RUNE_BY_ID, RUNE_MAX_LEVEL } from '../data/runes.js';
import { STAGE_BY_ID, getEncounter } from '../data/stages.js';
import { REWARD_BALANCE, ECONOMY } from '../data/balance.js';
import { weightedPick, pick } from './rng.js';
import { findPlayableSentences } from './deck.js';
import { deepFreeze } from '../contracts.js';
import { addSafe } from '../engine/numeric.js';

const CARD_TYPES = new Set(['CARD_COMMON', 'CARD_UNCOMMON', 'CARD_RARE']);
export const REWARD_VERSION = '0.2.0';
export const isMixedOffer = offer => ['MIXED','RUNE_INTRO'].includes(offer?.type);
const BASIC_FRAMES = new Set(['frame.sv', 'frame.svc.adj', 'frame.svc.np', 'frame.svo', 'frame.beLocative']);
const orderById = (values) => [...values].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const fail = (message, extra = {}) => ({ ok: false, message, ...extra });

function equipped(run) {
  return run.runes.orderedInstanceIds.map((id) => run.runes.instances[id]);
}

function rememberCards(run, choices) {
  const registry = registryForVersion(run.version);
  const seen = new Set(run.vocabulary?.encounteredLexemeIds ?? []);
  for (const choice of choices) {
    const definition = registry.cardById[choice.cardDefId ?? run.cardInstances[choice.cardInstanceId]?.cardDefId];
    if (definition) seen.add(definition.lexemeId);
  }
  run.vocabulary = { ...run.vocabulary, encounteredLexemeIds: [...seen] };
}

export function eligibleRewardCards(run) {
  return registryForVersion(run.version).cards.filter(card => (card.availability?.runtimeReady ?? card.runtimeReady)
    && (card.availability?.rewardWeight ?? card.rewardWeight ?? 0) > 0
    && (!run.contentManifest?.cardDefIds || run.contentManifest.cardDefIds.includes(card.id)));
}

export function isStageRelevantCard(run, card) {
  const registry = registryForVersion(run.version), lexeme = registry.lexemeById[card.lexemeId];
  const focus = STAGE_BY_ID[run.progress?.stageId]?.focusFrames ?? [...BASIC_FRAMES];
  if (run.progress?.stageId === 'stage.02') return ['NOUN', 'PRONOUN', 'DETERMINER'].includes(lexeme.pos)
    || ['to', 'for'].includes(lexeme.lemma) || lexeme.frameIds?.some(id => focus.includes(id));
  return ['NOUN', 'PRONOUN', 'DETERMINER'].includes(lexeme.pos) || lexeme.frameIds?.some(id => BASIC_FRAMES.has(id));
}

function selectCardCandidates(run, type, offerId, trace, {selected=new Set(),roles=REWARD_BALANCE.roleSlots}={}) {
  const registry = registryForVersion(run.version);
  const rarity = type.replace('CARD_', '');
  const pool = orderById(eligibleRewardCards(run).filter(card => card.rarity === rarity));
  const choices = [];
  for (const role of roles) {
    const remaining = pool.filter((card) => !selected.has(card.id));
    if (!remaining.length) break;
    let candidates = remaining;
    if (role === 'LOCAL_SYNTAX_RELEVANT') candidates = remaining.filter(card => isStageRelevantCard(run, card));
    if (role === 'IMPLEMENTED_POOL_WILDCARD') candidates = remaining.filter((card) => {
      const lexeme = registry.lexemeById[card.lexemeId];
      return ['FUNCTION', 'PREPOSITION', 'ADVERB'].includes(lexeme.pos) || lexeme.frameIds?.length > 1;
    });
    if (!candidates.length) {
      trace.push({ kind: 'SAME_RARITY_ROLE_FALLBACK', role, rarity });
      candidates = remaining;
    }
    const cardId = weightedPick(run.rng.reward, Object.fromEntries(candidates.map((card) => [card.id, card.availability?.rewardWeight ?? card.rewardWeight])));
    selected.add(cardId);
    choices.push({ choiceId: `${offerId}.choice.${choices.length}`, cardDefId: cardId, role });
  }
  return choices;
}

export function eligibleRunes(run) {
  const levels = new Map(equipped(run).map((entry) => [entry.runeId, entry.level]));
  return orderById(eligibleRuneDefinitions(run).filter(definition => (levels.get(definition.id) ?? 0) < RUNE_MAX_LEVEL
    && (!run.contentManifest?.runeIds || run.contentManifest.runeIds.includes(definition.id))));
}

function chooseRune(run, pool) {
  const availableRarities = new Set(pool.map((entry) => entry.rarity));
  const rarityWeights = Object.fromEntries(Object.entries(REWARD_BALANCE.runeWeights).filter(([rarity]) => availableRarities.has(rarity)));
  const rarity = weightedPick(run.rng.reward, rarityWeights);
  return pick(run.rng.reward, pool.filter((entry) => entry.rarity === rarity));
}

function selectRuneCandidates(run, profile, offerId) {
  const pool = eligibleRunes(run);
  const firstRuneIntro = run.progress.battleNumber === 2 && !profile.firstRuneIntroSeen;
  if (firstRuneIntro) return { firstRuneIntro, choices: REWARD_BALANCE.firstEverR2Fixed.filter((id) => pool.some((entry) => entry.id === id))
    .map((runeId, index) => ({ choiceId: `${offerId}.choice.${index}`, runeId, role: 'BASIC' })) };
  const choices = [];
  const selected = new Set();
  const roles = run.progress.battleNumber === 2 ? REWARD_BALANCE.laterR2Slots : ['UNLOCKED_IMPLEMENTED_ALL', 'UNLOCKED_IMPLEMENTED_ALL', 'UNLOCKED_IMPLEMENTED_ALL'];
  for (const role of roles) {
    const remaining = pool.filter((entry) => !selected.has(entry.id) && (role !== 'BASIC' || entry.firstRuneBasicPoolEligible));
    if (!remaining.length) continue;
    const definition = chooseRune(run, remaining);
    selected.add(definition.id);
    choices.push({ choiceId: `${offerId}.choice.${choices.length}`, runeId: definition.id, role });
  }
  return { firstRuneIntro, choices };
}

/**
 * Creates one frozen offer on a controller-owned proposed clone. Only reward RNG and encountered
 * vocabulary are advanced; kill gold belongs to the controller's victory settlement.
 */
function createLegacyRewardOffer(run, profile) {
  if (!run?.progress || !profile || !run.rng?.reward || !run.cardInstances || !run.runes) throw new TypeError('Incomplete reward context');
  const battleNumber = run.progress.battleNumber;
  if (![1, 2, 3].includes(battleNumber)) throw new RangeError('Only Stage 1 rewards are implemented');
  const offerId = `offer.${run.runId}.${battleNumber}`;
  if (run.reward?.offerId === offerId) return run.reward;
  const trace = [];
  let type;
  if (battleNumber === 2) type = REWARD_BALANCE.everyRunR2Override;
  else if (battleNumber === 1 && run.tutorial?.isIntroRun) type = REWARD_BALANCE.firstEverR1Override;
  else type = weightedPick(run.rng.reward, battleNumber === 3 ? REWARD_BALANCE.regionalBoss : REWARD_BALANCE.normal);
  let choices;
  let firstRuneIntro = false;
  if (CARD_TYPES.has(type)) choices = selectCardCandidates(run, type, offerId, trace);
  else if (type === 'RUNE') ({ choices, firstRuneIntro } = selectRuneCandidates(run, profile, offerId));
  else choices = run.activeCardIds.map((cardInstanceId, index) => {
    const disabled = type === 'CARD_ENHANCE' && run.cardInstances[cardInstanceId].polishLevel >= 3;
    return { choiceId: `${offerId}.choice.${index}`, cardInstanceId, role: 'OWNED_CARD', disabled,
      ...(disabled ? { reasonKo: '이미 최대 연마 +3입니다.' } : {}) };
  });
  const empty = !choices.some((choice) => !choice.disabled);
  const offer = { offerId, battleNumber, type, choices, resolved: false, firstRuneIntro, trace,
    skipGold: CARD_TYPES.has(type) ? ECONOMY.skipCardGold : ECONOMY.skipOtherGold,
    ...(empty ? { emptyReasonKo: '현재 선택할 수 있는 대상이 없습니다. 건너뛰기 재화를 받을 수 있습니다.' } : {}) };
  rememberCards(run, choices);
  run.reward = deepFreeze(offer);
  return run.reward;
}

/** One draw per slot from remaining valid types. Services are entries, not a premature target pick. */
export function createRewardOffer(run,profile){
  if(run?.version==='0.1.0')return createLegacyRewardOffer(run,profile);
  if(!run?.progress||!profile||!run.rng?.reward||!run.cardInstances||!run.runes)throw new TypeError('Incomplete reward context');
  const battleNumber=run.progress.battleNumber;
  if(!(['0.2.0','0.2.1','0.2.2'].includes(run.version)?[1,2,3,4,5,6,7]:[1,2,3]).includes(battleNumber))throw new RangeError('Unsupported reward battle for this campaign');
  const offerId=`offer.${run.runId}.${battleNumber}`;
  if(run.reward?.offerId===offerId)return run.reward;
  const choices=[],trace=[],selectedCards=new Set(),selectedRunes=new Set(),selectedServices=new Set();
  const runeChoice=(entry,role)=>{const old=equipped(run).find(r=>r.runeId===entry.id);return{kind:'RUNE',runeId:entry.id,rarity:entry.rarity,role,ownedLevel:old?.level??0,offeredLevel:(old?.level??0)+1};};
  let firstRuneIntro=false;
  if(battleNumber===2){
    const selected=selectRuneCandidates(run,profile,offerId);firstRuneIntro=selected.firstRuneIntro;
    for(const entry of selected.choices){selectedRunes.add(entry.runeId);choices.push(runeChoice(RUNE_BY_ID[entry.runeId],entry.role));}
    while(choices.length<3){const pool=eligibleRunes(run).filter(r=>!selectedRunes.has(r.id));if(!pool.length)throw Error('Rune introduction requires three valid runes');const r=chooseRune(run,pool);selectedRunes.add(r.id);choices.push(runeChoice(r,'UNLOCKED_IMPLEMENTED_ALL'));trace.push({kind:'INTRO_ELIGIBILITY_FALLBACK',runeId:r.id});}
  }else{
    const intro=battleNumber===1&&run.tutorial?.isIntroRun;
    const encounter = run.combat?.enemyState ?? (['0.2.0','0.2.1','0.2.2'].includes(run.version) ? getEncounter(run.progress.stageId,run.progress.roundIndex,run.version) : null);
    const boss = encounter ? encounter.kind==='REGIONAL_BOSS' : battleNumber===3;
    const baseWeights=intro?{CARD_COMMON:100}:boss?REWARD_BALANCE.regionalBoss:REWARD_BALANCE.normal;
    for(let index=0;index<3;index++){
      const polishTargets=run.activeCardIds.filter(id=>run.cardInstances[id].polishLevel<3);
      const removeTargets=[...run.activeCardIds];
      const runePool=eligibleRunes(run).filter(r=>!selectedRunes.has(r.id));
      const validType=type=>CARD_TYPES.has(type)?eligibleRewardCards(run).some(c=>c.rarity===type.slice(5)&&!selectedCards.has(c.id)):
        type==='RUNE'?runePool.length>0:type==='CARD_ENHANCE'?polishTargets.length>0&&!selectedServices.has('POLISH'):type==='CARD_REMOVE'?removeTargets.length>0&&!selectedServices.has('REMOVE'):false;
      const weights=Object.fromEntries(Object.entries(baseWeights).filter(([type,w])=>w>0&&validType(type)));
      const excludedTypes=Object.keys(baseWeights).filter(type=>baseWeights[type]>0&&!validType(type));
      if(excludedTypes.length)trace.push({kind:'TYPE_ELIGIBILITY_FILTER',slot:index,excludedTypes,baseWeights:{...baseWeights},effectiveWeights:{...weights}});
      let type;
      if(!Object.keys(weights).length){type='CARD_COMMON';trace.push({kind:'DATA_ERROR_COMMON_FALLBACK',slot:index,reason:'NO_VALID_WEIGHTED_TYPE'});}
      else type=weightedPick(run.rng.reward,weights);
      trace.push({kind:'SLOT_TYPE_DRAW',slot:index,type,weights:{...weights}});
      if(CARD_TYPES.has(type)){
        const picked=selectCardCandidates(run,type,offerId,trace,{selected:selectedCards,roles:[REWARD_BALANCE.roleSlots[index]]})[0];
        if(!picked)throw Error('Reward data requires three unique valid choices');
        choices.push({kind:'CARD',rarity:type.slice(5),cardDefId:picked.cardDefId,role:picked.role});
      }else if(type==='RUNE'){
        const r=chooseRune(run,runePool);selectedRunes.add(r.id);choices.push(runeChoice(r,'UNLOCKED_IMPLEMENTED_ALL'));
      }else{
        const serviceKind=type==='CARD_ENHANCE'?'POLISH':'REMOVE';selectedServices.add(serviceKind);
        choices.push({kind:'SERVICE',serviceKind,targetCardIds:serviceKind==='POLISH'?polishTargets:removeTargets});
      }
    }
  }
  const offer={offerId,rewardVersion:['0.2.0','0.2.1','0.2.2'].includes(run.version)?REWARD_VERSION:'0.1.1',battleNumber,type:battleNumber===2?'RUNE_INTRO':'MIXED',firstRuneIntro,
    introOverride:battleNumber===1&&run.tutorial?.isIntroRun?'FIRST_COMMON_CARDS':null,
    choices:choices.map((choice,index)=>({...choice,choiceId:`${offerId}.choice.${index}`})),trace,resolved:false,
    skipGold:choices.some(c=>c.kind==='CARD')?ECONOMY.skipCardGold:ECONOMY.skipOtherGold};
  rememberCards(run,offer.choices);run.reward=deepFreeze(offer);return run.reward;
}

/** A warning is based on currently verified complete core paths, never automatic deck repair. */
export function getRemovalWarning(run, cardInstanceId) {
  if (!run.activeCardIds.includes(cardInstanceId)) return '';
  if (run.activeCardIds.length === 1) return '덱의 마지막 카드입니다. 제거하면 다음 전투에서 문장을 만들 수 없습니다. 그래도 제거할까요?';
  const classify = (frameId) => frameId === 'frame.sv' || frameId === 'frame.beLocative' ? '1형식' : frameId.startsWith('frame.svc') ? '2형식' : frameId==='frame.svoo'?'4형식':'3형식';
  const options = { perFrame: 1, registry: registryForVersion(run.version), includeSvoo: ['0.2.0','0.2.1','0.2.2'].includes(run.version) };
  const before = new Set(findPlayableSentences(run.activeCardIds, run.cardInstances, options).map((entry) => classify(entry.frameId)));
  const after = new Set(findPlayableSentences(run.activeCardIds.filter((id) => id !== cardInstanceId), run.cardInstances, options).map((entry) => classify(entry.frameId)));
  const lost = [...before].filter((frame) => !after.has(frame));
  return lost.length ? `이 카드를 제거하면 확인된 ${lost.join('·')} 문장 경로를 잃습니다. 그래도 제거할까요?` : '';
}

function markResolved(run, choiceId, resolution) {
  run.reward = { ...run.reward, resolved: true, selectedChoiceId: choiceId, resolution };
}

/**
 * Validate first, then modify only the proposed run clone supplied by RunController. Rejected,
 * repeated, replacement-cancelled, and confirmation-pending choices leave all state untouched.
 */
export function resolveReward(run, offerId, choiceId, { replaceRuneInstanceId = null, confirmRemoval = false, targetCardInstanceId = null } = {}) {
  const registry = registryForVersion(run?.version);
  const offer = run?.reward;
  if (!offer || offer.offerId !== offerId) return fail('현재 보상과 다른 선택입니다.');
  if (offer.resolved) return fail('이미 정산한 보상입니다.', { alreadyResolved: true });
  if (choiceId === 'SKIP') {
    const gold = addSafe(run.economy.gold, offer.skipGold);
    run.economy.gold = gold;
    markResolved(run, choiceId, { kind: 'SKIP', gold: offer.skipGold });
    return { ok: true, message: `보상을 건너뛰고 +${offer.skipGold} 재화를 받았습니다.` };
  }
  const choice = offer.choices.find((entry) => entry.choiceId === choiceId);
  if (!choice || choice.disabled) return fail(choice?.reasonKo ?? '선택할 수 없는 보상입니다.');
  const type=isMixedOffer(offer)?choice.kind==='CARD'?`CARD_${choice.rarity}`:choice.kind==='RUNE'?'RUNE':choice.serviceKind==='POLISH'?'CARD_ENHANCE':choice.serviceKind==='REMOVE'?'CARD_REMOVE':null:offer.type;
  const targetId=isMixedOffer(offer)?targetCardInstanceId:choice.cardInstanceId;
  if(isMixedOffer(offer)&&choice.kind==='SERVICE'){
    if(!targetId)return fail('보유 카드 한 장을 선택하세요. 취소하면 원래 후보로 돌아갑니다.',{needsTarget:true,serviceKind:choice.serviceKind});
    if(!choice.targetCardIds?.includes(targetId))return fail('공개된 서비스 대상이 아닙니다.');
  }
  if (CARD_TYPES.has(type)) {
    const definition = registry.cardById[choice.cardDefId];
    if (!definition?.runtimeReady || definition.rarity !== type.replace('CARD_', '')) return fail('지원되지 않는 카드 보상입니다.');
    const instanceId = `reward.${offerId}.card`;
    if (run.cardInstances[instanceId]) return fail('이미 존재하는 보상 카드입니다.');
    run.cardInstances[instanceId] = { instanceId, cardDefId: definition.id, polishLevel: 0, specialEffectId: null };
    run.activeCardIds.push(instanceId);
    if (run.combat) run.combat.discardIds.unshift(instanceId);
    markResolved(run, choiceId, { kind: 'CARD', cardInstanceId: instanceId });
    return { ok: true, message: '단어 카드 한 장을 덱에 추가했습니다.' };
  }
  if (type === 'CARD_ENHANCE' || type === 'CARD_REMOVE') {
    const card = run.cardInstances[targetId];
    if (!card || !run.activeCardIds.includes(targetId)) return fail('현재 덱에 없는 카드입니다.');
    if (type === 'CARD_ENHANCE') {
      if (!Number.isInteger(card.polishLevel) || card.polishLevel < 0 || card.polishLevel >= 3) return fail('연마할 수 없는 카드입니다.');
      const beforeLevel=card.polishLevel;card.polishLevel += 1;
      markResolved(run, choiceId, { kind: 'POLISH', cardInstanceId: card.instanceId, polishLevel: card.polishLevel });
      return { ok: true, message: `카드를 연마 +${card.polishLevel}로 강화했습니다.`,rewardEffect:{kind:'POLISH',cardInstanceId:card.instanceId,cardDefId:card.cardDefId,beforeLevel,afterLevel:card.polishLevel,beforeScore:10+beforeLevel*5,afterScore:10+card.polishLevel*5} };
    }
    const warning = getRemovalWarning(run, targetId);
    if (warning && !confirmRemoval) return fail(warning, { needsConfirmation: true });
    run.activeCardIds = run.activeCardIds.filter((id) => id !== card.instanceId);
    if (run.combat) {
      for (const key of ['drawIds', 'handIds', 'discardIds']) run.combat[key] = run.combat[key].filter((id) => id !== card.instanceId);
      run.combat.sentenceSlots = run.combat.sentenceSlots.filter((entry) => entry.cardInstanceId !== card.instanceId);
    }
    delete run.cardInstances[card.instanceId];
    markResolved(run, choiceId, { kind: 'REMOVE', cardInstanceId: card.instanceId });
    return { ok: true, message: '선택한 카드 한 장을 덱에서 제거했습니다.' };
  }
  if (type === 'RUNE') {
    const definition = RUNE_BY_ID[choice.runeId];
    if (!definition?.runtimeReady || !eligibleRuneDefinitions(run).some(rune => rune.id === choice.runeId)
      || run.contentManifest?.runeIds && !run.contentManifest.runeIds.includes(choice.runeId)) return fail('이번 원정에서 지원하거나 해금한 룬이 아닙니다.');
    const same = equipped(run).find((entry) => entry.runeId === choice.runeId);
    if(isMixedOffer(offer)&&(same?.level??0)!==choice.ownedLevel)return fail('공개된 룬 레벨과 현재 상태가 다릅니다.');
    if (same) {
      if (same.level >= RUNE_MAX_LEVEL) return fail('이미 최대 레벨의 룬입니다.');
      same.level += 1;
      markResolved(run, choiceId, { kind: 'RUNE_LEVEL_UP', runeInstanceId: same.instanceId, level: same.level });
      return { ok: true, message: `${definition.nameKo} Lv.${same.level}` };
    }
    const full = run.runes.orderedInstanceIds.length >= run.runes.slotLimit;
    if (full && !replaceRuneInstanceId) return fail('교체할 룬을 선택하세요. 취소하면 보상은 그대로 남습니다.', { needsReplacement: true });
    if (replaceRuneInstanceId && (!full || !run.runes.orderedInstanceIds.includes(replaceRuneInstanceId))) return fail('교체 대상 룬을 확인하세요.');
    const instanceId = `reward.${offerId}.rune`;
    if (run.runes.instances[instanceId]) return fail('이미 존재하는 룬 인스턴스입니다.');
    const newRune = { instanceId, runeId: choice.runeId, level: 1 };
    if (full) {
      const index = run.runes.orderedInstanceIds.indexOf(replaceRuneInstanceId);
      run.runes.orderedInstanceIds[index] = instanceId;
      delete run.runes.instances[replaceRuneInstanceId];
    } else run.runes.orderedInstanceIds.push(instanceId);
    run.runes.instances[instanceId] = newRune;
    markResolved(run, choiceId, { kind: full ? 'RUNE_REPLACE' : 'RUNE_NEW', runeInstanceId: instanceId });
    return { ok: true, message: `${definition.nameKo}를 장착했습니다.` };
  }
  return fail('알 수 없는 보상 유형입니다.');
}
