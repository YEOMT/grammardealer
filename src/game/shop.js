import {hasWaterwaysCampaign,hasSkyCampaign,hasSnowCampaign,hasPolishCampaign} from '../data/campaignFeatures.js';
import {selectOperation,selectDedicatedOperation} from './operationPool.js';
import {cardDefinition,isOperation,canPolish} from '../data/cardCatalog.js';
import {operationSpec} from '../data/operationSpec.js';
import {isCurrentCampaign} from '../data/stages.js';
import { registryForVersion } from '../data/language/index.js';
import { RUNE_MAX_LEVEL } from '../data/runes.js';
import { REWARD_BALANCE } from '../data/balance.js';
import { weightedPick, pick } from './rng.js';
import { eligibleRunes, eligibleRewardCards, isStageRelevantCard, getRemovalWarning } from './rewards.js';
import { findPlayableSentences } from './deck.js';
import { addSafe, safeInteger } from '../engine/numeric.js';
import { deepFreeze } from '../contracts.js';

export const SHOP_VERSION = '0.2.0';
export const SHOP_BALANCE = deepFreeze({
  runeSlots: 1, cardSlots: 2,
  cardPrices: { COMMON: 6, UNCOMMON: 10, RARE: 14 },
  runePrices: { COMMON: 18, UNCOMMON: 24, RARE: 32 },
  cardRarityWeights: { COMMON: 50, UNCOMMON: 10, RARE: 5 },
  polishPrice: 8, firstRemovalPrice: 6, removalIncrement: 2,
});
const fail = (message, extra = {}) => ({ ok: false, message, ...extra });
const orderById = values => [...values].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const equipped = run => run.runes.orderedInstanceIds.map(id => run.runes.instances[id]);
const cardWeight = card => card.availability?.rewardWeight ?? card.rewardWeight;
const requireEntryContext = run => {
  if (!isCurrentCampaign(run) || run.progress?.stageId !== 'stage.02' || run.combat !== null)
    throw new TypeError('Stage 2 preparation requires a current campaign outside combat');
};

const requireShopContext=run=>{if(!isCurrentCampaign(run)||!['stage.02',...(hasSkyCampaign(run)?['stage.04']:[]),...(hasSnowCampaign(run)?['stage.06']:[]),...(hasWaterwaysCampaign(run)?['stage.08']:[])].includes(run.progress.stageId)||run.combat!==null)throw Error('Shop outside entry');};
function rememberCardDefinitions(run, definitions) {
  const seen = new Set(run.vocabulary?.encounteredLexemeIds ?? []);
  for (const definition of definitions) if(definition.lexemeId)seen.add(definition.lexemeId);
  run.vocabulary = { ...run.vocabulary, encounteredLexemeIds: [...seen] };
}

/** One deterministic preparation grant; this never repairs a deck after shop removal or later play. */
export function grantStage2Entry(run) {
  requireEntryContext(run);
  if (run.entryGrants?.['stage.02']?.applied) return run.entryGrants['stage.02'];
  const registry = registryForVersion(run.version);
  const ownedDefinitions = run.activeCardIds.filter(id=>!isOperation(run.cardInstances[id],run.version)).map(id => registry.cardById[run.cardInstances[id]?.cardDefId]);
  if (ownedDefinitions.some(def => !def)) throw new TypeError('Unknown active entry card');
  const bindingFor = card => registry.lexemeById[card.lexemeId].senseIds.flatMap(id => registry.senseById[id].frameBindings)
    .find(binding => binding.runtimeReady && binding.frameId === 'frame.svoo');
  const candidates = orderById(ownedDefinitions.filter(card => bindingFor(card)));
  const representative = candidates[0] ?? registry.cardById['card.give'];
  const binding = representative && bindingFor(representative);
  if (!binding || !['to', 'for'].includes(binding.dativePreposition)) throw new TypeError('No registered Stage 2 entry frame');
  const connector = registry.cardById[`card.${binding.dativePreposition}`];
  if (!connector?.runtimeReady) throw new TypeError('Unsupported Stage 2 entry connector');
  const definitions = [
    ...(!candidates.length ? [representative] : []),
    ...(!ownedDefinitions.some(card => card.id === connector.id) ? [connector] : []),
  ];
  const entryGrantId = `${run.runId}:stage.02.entryGrant`;
  const cardInstanceIds = definitions.map((_, index) => `entry.${run.runId}.stage.02.card.${index}`);
  if (cardInstanceIds.some(id => run.cardInstances[id])) throw new TypeError('Entry card instance already exists');
  definitions.forEach((definition, index) => {
    const instanceId = cardInstanceIds[index];
    run.cardInstances[instanceId] = { instanceId, cardDefId: definition.id, polishLevel: 0, specialEffectId: null };
    run.activeCardIds.push(instanceId);
  });
  rememberCardDefinitions(run, definitions);
  const found = findPlayableSentences(run.activeCardIds, run.cardInstances,
    { registry, includeSvoo: true, frames: ['frame.svoo'], perFrame: 1, maxChecks: 2048 }).find(entry => entry.frameId === 'frame.svoo');
  const witness = found ? { found: true, frameId: found.frameId,
    cardIds: found.slots.map(slot => slot.cardInstanceId) } : null;
  const grant = { entryGrantId, applied: true, cardInstanceIds,
    representativeVerbCardDefId: representative.id, connectorCardDefId: connector.id, witness,
    warningKo: found ? '' : '현재 덱에서 완전한 4형식 경로를 확인하지 못했습니다. 상점과 보상에서 주어·두 목적어 재료를 확인하세요.',
    trace: [{ kind: 'ENTRY_REPRESENTATIVE', cardDefId: representative.id, policy: candidates.length ? 'SORTED_OWNED_RUNTIME_BINDING' : 'GIVE_FALLBACK' },
      { kind: 'ENTRY_GRANT', cardDefIds: definitions.map(card => card.id) }],
  };
  run.entryGrants = { ...run.entryGrants, 'stage.02': grant };
  return grant;
}

/** Generates only once and consumes only the shop stream. Prices never depend on player gold. */
export function createShop(run) {
  requireShopContext(run);const stageId=run.progress.stageId,second=['stage.04','stage.06','stage.08'].includes(stageId);
  if (!run.entryGrants?.[stageId]?.applied) throw new TypeError('Entry preparation must precede the shop');
  const shopId = `shop.${run.runId}.${stageId}`;
  if (run.shop?.shopId === shopId) return run.shop;
  if (run.shop) {if(!second||run.shop.stageId!==(stageId==='stage.08'?'stage.06':stageId==='stage.06'?'stage.04':'stage.02')||!run.shop.closed||(run.shopHistory??[]).some(s=>s.shopId===run.shop.shopId))throw new TypeError('Another shop already exists');run.shopHistory=[...(run.shopHistory??[]),structuredClone(run.shop)];}
  const inventory = [], trace = [], stream = run.rng.shop;
  const runePool = eligibleRunes(run);
  for (let slot = 0; slot < (second?2:SHOP_BALANCE.runeSlots); slot++) {
    const pool = runePool.filter(rune => !inventory.some(item => item.runeId === rune.id));
    if (!pool.length) { trace.push({ kind: 'NO_ELIGIBLE_RUNE', slot }); break; }
    const rarity = weightedPick(stream, Object.fromEntries(Object.entries(REWARD_BALANCE.runeWeights).filter(([key]) => pool.some(rune => rune.rarity === key))));
    const definition = pick(stream, pool.filter(rune => rune.rarity === rarity));
    const ownedLevel = equipped(run).find(rune => rune.runeId === definition.id)?.level ?? 0;
    inventory.push({ itemId: `${shopId}.rune.${slot}`, kind: 'RUNE', runeId: definition.id, rarity,
      price: SHOP_BALANCE.runePrices[rarity], purchased: false, ownedLevel, offeredLevel: ownedLevel + 1 });
  }
  const cardPool = orderById(eligibleRewardCards(run));
  for (let slot = 0; slot < (second?3:SHOP_BALANCE.cardSlots); slot++) {
    if(hasPolishCampaign(run)&&slot===(second?2:SHOP_BALANCE.cardSlots-1)){
      const operation=selectDedicatedOperation(run,stream,trace);
      inventory.push({itemId:`${shopId}.card.${slot}`,kind:'CARD',cardDefId:operation.id,rarity:operation.rarity,price:SHOP_BALANCE.cardPrices[operation.rarity],purchased:false,role:'DEDICATED_OPERATION'});
      continue;
    }
    const pool = cardPool.filter(card => !inventory.some(item => item.cardDefId === card.id));
    const rarity = weightedPick(stream, Object.fromEntries(Object.entries(SHOP_BALANCE.cardRarityWeights).filter(([key]) => pool.some(card => card.rarity === key))));
    const sameRarity = pool.filter(card => card.rarity === rarity);
    const role = slot === 0 ? 'LOCAL_SYNTAX_RELEVANT' : 'IMPLEMENTED_POOL_WILDCARD';
    let candidates = slot === 0 ? sameRarity.filter(card => isStageRelevantCard(run, card)) : sameRarity;
    if (!candidates.length) { candidates = sameRarity; trace.push({ kind: 'SAME_RARITY_ROLE_FALLBACK', role, rarity }); }
    const operation=hasPolishCampaign(run)?null:selectOperation(run,rarity,role,new Set(inventory.map(x=>x.cardDefId)),stream,trace);
    const cardDefId = operation?.id??weightedPick(stream, Object.fromEntries(candidates.map(card => [card.id, cardWeight(card)])));
    inventory.push({ itemId: `${shopId}.card.${slot}`, kind: 'CARD', cardDefId, rarity,
      price: SHOP_BALANCE.cardPrices[rarity], purchased: false, role });
  }
  const paidRemovalCount = safeInteger(run.economy.paidRemovalCount ?? 0, 'paid removal count', { min: 0 });
  const removalPrice = addSafe(SHOP_BALANCE.firstRemovalPrice, paidRemovalCount * SHOP_BALANCE.removalIncrement);
  run.shop = { shopId, stageId, shopVersion: hasPolishCampaign(run)?'0.6.1':hasSkyCampaign(run)?'0.4.0':SHOP_VERSION,...(hasSkyCampaign(run)?{paidRemovalCountAtEntry:paidRemovalCount}:{}), closed: false, inventory,
    services: { POLISH: { price: SHOP_BALANCE.polishPrice, used: false }, REMOVE: { price: removalPrice, used: false } }, trace };
  rememberCardDefinitions(run, inventory.filter(item => item.kind === 'CARD').map(item => cardDefinition(item.cardDefId,run.version)));
  return run.shop;
}

function openShop(run, shopId) {
  return isCurrentCampaign(run) && run.status === 'SHOP' && run.combat === null && run.shop?.shopId === shopId && !run.shop.closed;
}
function canAfford(run, price) {
  return Number.isSafeInteger(price) && price >= 0 && Number.isSafeInteger(run.economy?.gold) && run.economy.gold >= price;
}
function purchase(run, item, result) {
  run.economy.gold -= item.price;
  item.purchased = true;
  item.resolution = result;
}

/** Validate the complete transaction before touching this controller-owned proposal. */
export function buyShopItem(run, shopId, itemId, { replaceRuneInstanceId = null } = {}) {
  if (!openShop(run, shopId)) return fail('현재 열려 있는 상점이 아닙니다.');
  const item = run.shop.inventory.find(entry => entry.itemId === itemId);
  if (!item || item.purchased) return fail('이미 구매했거나 현재 상점에 없는 상품입니다.');
  if (!canAfford(run, item.price)) return fail('재화가 부족합니다.');
  if (item.kind === 'CARD') {
    const definition = hasSkyCampaign(run)?cardDefinition(item.cardDefId,run.version):eligibleRewardCards(run).find(card=>card.id===item.cardDefId&&card.rarity===item.rarity);
    if(hasSkyCampaign(run)&&(!run.contentManifest.cardDefIds.includes(item.cardDefId)||definition?.rarity!==item.rarity))return fail('원정 범위 밖의 상품입니다.');
    const instanceId = `${itemId}.owned`;
    if (!definition || run.cardInstances[instanceId]) return fail('구매할 수 없는 카드 상품입니다.');
    run.cardInstances[instanceId] = { instanceId, cardDefId: definition.id, polishLevel: 0, specialEffectId: null };
    run.activeCardIds.push(instanceId);
    rememberCardDefinitions(run, [definition]);
    purchase(run, item, { kind: 'CARD', cardInstanceId: instanceId });
    return { ok: true, message: `${definition.cardKind==='OPERATION'?'운영':'단어'} 카드 한 장을 구매했습니다.` };
  }
  if (item.kind !== 'RUNE') return fail('알 수 없는 상품입니다.');
  const definition = eligibleRunes(run).find(rune => rune.id === item.runeId);
  if (!definition) return fail('현재 구매할 수 없는 룬입니다.');
  const same = equipped(run).find(rune => rune.runeId === item.runeId);
  if ((same?.level ?? 0) !== item.ownedLevel || same?.level >= RUNE_MAX_LEVEL) return fail('공개된 룬 레벨과 현재 상태가 다릅니다.');
  if (same) {
    same.level += 1;
    purchase(run, item, { kind: 'RUNE_LEVEL_UP', runeInstanceId: same.instanceId, level: same.level });
    return { ok: true, message: `${definition.nameKo} Lv.${same.level}` };
  }
  const full = run.runes.orderedInstanceIds.length >= run.runes.slotLimit;
  if (full && !replaceRuneInstanceId) return fail('교체할 룬을 선택하세요. 취소하면 재화와 상품은 그대로 남습니다.', { needsReplacement: true });
  if (replaceRuneInstanceId && (!full || !run.runes.orderedInstanceIds.includes(replaceRuneInstanceId))) return fail('교체 대상 룬을 확인하세요.');
  const instanceId = `${itemId}.owned`;
  if (run.runes.instances[instanceId]) return fail('이미 존재하는 룬 상품입니다.');
  if (full) {
    const index = run.runes.orderedInstanceIds.indexOf(replaceRuneInstanceId);
    run.runes.orderedInstanceIds[index] = instanceId;
    delete run.runes.instances[replaceRuneInstanceId];
  } else run.runes.orderedInstanceIds.push(instanceId);
  run.runes.instances[instanceId] = { instanceId, runeId: item.runeId, level: 1 };
  purchase(run, item, { kind: full ? 'RUNE_REPLACE' : 'RUNE_NEW', runeInstanceId: instanceId });
  return { ok: true, message: `${definition.nameKo}를 구매했습니다.` };
}

export function useShopService(run, shopId, serviceKind, { targetCardInstanceId = null, confirmRemoval = false } = {}) {
  if (!openShop(run, shopId)) return fail('현재 열려 있는 상점이 아닙니다.');
  if (!['POLISH', 'REMOVE'].includes(serviceKind)) return fail('알 수 없는 상점 서비스입니다.');
  const service = run.shop.services[serviceKind];
  if (!service || service.used) return fail('이미 사용한 상점 서비스입니다.');
  if (!canAfford(run, service.price)) return fail('재화가 부족합니다.');
  if (!targetCardInstanceId) return fail('보유 카드 한 장을 선택하세요.', { needsTarget: true, serviceKind });
  const card = run.cardInstances[targetCardInstanceId];
  if (!card || !run.activeCardIds.includes(targetCardInstanceId)) return fail('현재 덱에 없는 카드입니다.');
  if (serviceKind === 'POLISH' && !canPolish(card,run.version)) return fail('이미 최대 연마이거나 연마할 수 없는 카드입니다.');
  const nextRemovalCount = serviceKind === 'REMOVE' ? addSafe(run.economy.paidRemovalCount ?? 0, 1) : null;
  if (serviceKind === 'REMOVE') {
    const warning = getRemovalWarning(run, targetCardInstanceId);
    if (warning && !confirmRemoval) return fail(warning, { needsConfirmation: true });
  }
  const beforeLevel = card.polishLevel;
  if (serviceKind === 'POLISH') card.polishLevel += 1;
  else {
    run.activeCardIds = run.activeCardIds.filter(id => id !== targetCardInstanceId);
    delete run.cardInstances[targetCardInstanceId];
    run.economy.paidRemovalCount = nextRemovalCount;
  }
  run.economy.gold -= service.price;
  service.used = true;
  service.targetCardInstanceId = targetCardInstanceId;
  if(hasPolishCampaign(run)&&serviceKind==='POLISH')Object.assign(service,{cardDefId:card.cardDefId,beforeLevel,afterLevel:card.polishLevel});
  return { ok: true, message: serviceKind === 'POLISH' ? `카드를 연마 +${card.polishLevel}로 강화했습니다.` : '선택한 카드 한 장을 제거했습니다.',
    ...(serviceKind === 'POLISH' ? { rewardEffect: { kind: 'POLISH', cardInstanceId: card.instanceId, cardDefId: card.cardDefId,
      beforeLevel, afterLevel: card.polishLevel,...(isOperation(card,run.version)?{cardKind:'OPERATION',beforeOperation:operationSpec(card.cardDefId,beforeLevel,'PERMANENT',run.version),afterOperation:operationSpec(card.cardDefId,card.polishLevel,'PERMANENT',run.version)}:{beforeScore:10+beforeLevel*5,afterScore:10+card.polishLevel*5}) } } : {}) };
}

export function closeShop(run, shopId) {
  if (!openShop(run, shopId)) return fail('현재 열려 있는 상점이 아닙니다.');
  run.shop.closed = true;
  return { ok: true };
}
