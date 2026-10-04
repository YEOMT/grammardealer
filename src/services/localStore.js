import {learningSummary} from '../engine/meaning.js';
import { clone, requireInteger, assertSerializable } from '../contracts.js';
import { assertRng } from '../game/rng.js';
import { RUNE_BY_ID, RUNE_SLOT_LIMIT } from '../data/runes.js';
import { STAGE1, stageRoundsForRun } from '../data/stage1.js';

export const SAVE_VERSION = '0.1.1';
const supportedVersion = version => ['0.1.0','0.1.1'].includes(version);
export const STORE_NAME = 'sentence-balatro-v0-1';
const uniqueId = prefix => `${prefix}.${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}.${++uniqueId.counter}`}`;
uniqueId.counter = 0;
export function newProfile(displayName) {
  return {version:SAVE_VERSION,playerId:uniqueId('player'),displayName:String(displayName).trim().slice(0,30)||'여행자',settings:{speed:1,sfxVolume:45,muted:false,effectsOff:false},firstRuneIntroSeen:false,guideSeen:false,qualifiedRunIds:[],appliedAttackIds:[],grammarRecords:{},bestAttack:0,totalActualDamage:0,unlocks:[],storyClearCount:0};
}
/** Profile events are idempotent; replay/sandbox never calls this reducer. */
export function applyProfileEvent(profile,event) {
  const p=clone(profile);
  if(event.type==='FIRST_RUNE_SHOWN')p.firstRuneIntroSeen=true;
  if(event.type==='GUIDE_SEEN')p.guideSeen=true;
  if(['GUIDE_COMPLETED','GUIDE_SKIPPED'].includes(event.type)){p.guideSeen=true;p.tutorial={tutorialVersion:event.tutorialVersion,completed:event.type==='GUIDE_COMPLETED',skipped:event.type==='GUIDE_SKIPPED',actions:event.actions,reason:event.reason};}
  if(event.type==='ATTACK'&&!p.appliedAttackIds.includes(event.resolution.attackId)){
    const r=event.resolution;p.appliedAttackIds.push(r.attackId);p.bestAttack=Math.max(p.bestAttack,r.finalPower);p.totalActualDamage+=r.actualHpLoss;
    const sentence=r.sentenceSnapshot.orderedTokens.map(t=>t.surface).join(' ')+'.';
    for(const tag of new Set(r.analysis.grammarHits.map(h=>h.tag))){
      const old=p.grammarRecords[tag]??{count:0,firstSentence:sentence,bestSentence:sentence,bestPower:0,firstLearning:learningSummary(r)};
      old.count++;if(r.finalPower>old.bestPower){old.bestPower=r.finalPower;old.bestSentence=sentence;old.bestLearning=learningSummary(r);}p.grammarRecords[tag]=old;
    }
  }
  if(event.type==='STAGE1_CLEAR'&&!p.qualifiedRunIds.includes(event.runId)){
    p.qualifiedRunIds.push(event.runId);
    p.unlocks=[...new Set([...p.unlocks,'pack.svoo','rune.svoo','rune.humanSubject',...(p.qualifiedRunIds.length>=3?['rune.turnDraw']:[])])];
  }
  return p;
}
export function canSaveRun(run) {
  if(!run)return false;
  if(['REWARD','BETWEEN_BATTLES','CONTENT_COMPLETE'].includes(run.status))return true;
  return run.status==='BATTLE'&&run.combat?.phase==='EDIT'&&!run.combat.battleDirty&&run.combat.turnIndex===1;
}
/** Defense in depth on persisted plain data; never repairs unknown content. */
export function validateRunState(run,registry) {
  assertSerializable(run);
  const fail=message=>{throw Error(message);};
  const record=(value,name)=>{if(!value||Array.isArray(value)||typeof value!=='object')fail(`${name} 정보가 잘못되었습니다.`);return value;};
  const ids=(value,name)=>{if(!Array.isArray(value)||value.some(x=>typeof x!=='string'||!x||x.length>200)||new Set(value).size!==value.length)fail(`${name} ID가 잘못되거나 중복되었습니다.`);return value;};
  record(run,'저장');
  if(!registry?.cardById||!registry?.formById)fail('단어 데이터가 준비되지 않았습니다.');
  if(!supportedVersion(run.version))fail('지원하지 않는 저장 버전입니다.');
  if(typeof run.runId!=='string'||!run.runId||run.runId.length>200)fail('원정 ID가 없습니다.');
  if(!['STAGE_INTRO','BATTLE','REWARD','BETWEEN_BATTLES','CONTENT_COMPLETE','DEFEAT'].includes(run.status))fail('잘못된 원정 상태입니다.');
  requireInteger(run.revision,'revision');requireInteger(run.economy?.gold,'gold');
  const config=record(run.config,'설정');
  if(config.character!=='traveler'||config.difficulty!==1||!['BEGINNER','STANDARD','ADVANCED','FREE'].includes(config.vocabularyMode))fail('이번 버전에서 지원하지 않는 원정 설정입니다.');
  if(!['string','number'].includes(typeof config.seed)||(typeof config.seed==='number'&&!Number.isSafeInteger(config.seed)))fail('시드가 잘못되었습니다.');
  const progress=record(run.progress,'진행');
  requireInteger(progress.roundIndex,'roundIndex',0,STAGE1.rounds.length-1);
  if(progress.stageId!==STAGE1.id||progress.battleNumber!==progress.roundIndex+1)fail('지원하지 않는 전투 진행입니다.');
  if(![null,undefined,'STAGE1_END'].includes(progress.contentBoundary))fail('지원하지 않는 콘텐츠 경계입니다.');
  if(run.status==='CONTENT_COMPLETE'&&(progress.roundIndex!==2||progress.contentBoundary!=='STAGE1_END'))fail('제공 구간 완료 상태가 잘못되었습니다.');
  ids(run.activeCardIds,'카드');record(run.cardInstances,'카드');
  for(const [id,c] of Object.entries(run.cardInstances)){
    if(!c||c.instanceId!==id||!registry.cardById[c.cardDefId]?.runtimeReady)fail('없는 카드가 포함되어 있습니다.');
    requireInteger(c.polishLevel,'polishLevel',0,3);if(c.specialEffectId!==null)fail('미지원 카드 효과입니다.');
  }
  for(const id of run.activeCardIds)if(!run.cardInstances[id])fail('없는 카드가 포함되어 있습니다.');
  assertRng(run.rng);
  const runes=record(run.runes,'룬');
  if(runes.slotLimit!==RUNE_SLOT_LIMIT)fail('지원하지 않는 룬 슬롯 수입니다.');
  ids(runes.orderedInstanceIds,'룬');record(runes.instances,'룬');
  if(runes.orderedInstanceIds.length>runes.slotLimit||Object.keys(runes.instances).length!==runes.orderedInstanceIds.length)fail('잘못된 룬 슬롯입니다.');
  const seenRunes=new Set();
  for(const id of runes.orderedInstanceIds){
    const r=runes.instances[id];
    if(!r||r.instanceId!==id||!RUNE_BY_ID[r.runeId]?.runtimeReady||seenRunes.has(r.runeId))fail('미지원·중복 룬입니다.');
    seenRunes.add(r.runeId);requireInteger(r.level,'runeLevel',1,3);
  }
  const c=run.combat;
  if(c){
    if(!['EDIT','EXCHANGE_SELECT','RESOLVING','PRESENTING','VICTORY','DEFEAT','TURN_START'].includes(c.phase))fail('잘못된 전투 단계입니다.');
    const rules=record(c.rulesSnapshot,'전투 규칙');
    const allowed={initialHand:[6,8,9,10],handLimit:[10,12,13,14],turnDraw:[3],discardActions:[4,5,6,7],turnLimit:[6],sentenceLimit:[16]};
    for(const [key,values] of Object.entries(allowed))if(!values.includes(rules[key]))fail(`지원하지 않는 전투 규칙: ${key}`);
    if(rules.initialHand>rules.handLimit)fail('초기 손패 한도가 잘못되었습니다.');
    requireInteger(c.turnsRemaining,'turnsRemaining',0,rules.turnLimit);
    requireInteger(c.exchangesRemaining,'exchangesRemaining',0,rules.discardActions);
    requireInteger(c.turnIndex,'turnIndex',1,rules.turnLimit);
    requireInteger(c.actionSequence,'actionSequence');
    if(typeof c.battleDirty!=='boolean')fail('전투 저장 지점이 잘못되었습니다.');
    if(!c.battleDirty&&(c.turnIndex!==1||c.turnsRemaining!==rules.turnLimit||c.actionSequence!==0))fail('초기 전투 지점이 잘못되었습니다.');
    requireInteger(c.enemyState?.hp,'hp');requireInteger(c.enemyState?.maxHp,'maxHp',1);
    if(c.enemyState.maxHp!==stageRoundsForRun(run)[progress.roundIndex].hp||c.enemyState.hp>c.enemyState.maxHp)fail('잘못된 적 HP입니다.');
    ids(c.drawIds,'드로우');ids(c.handIds,'손패');ids(c.discardIds,'버린 카드');
    if(!Array.isArray(c.sentenceSlots))fail('문장 카드 정보가 잘못되었습니다.');
    const pileIds=[...c.drawIds,...c.handIds,...c.sentenceSlots.map(x=>x.cardInstanceId),...c.discardIds];
    if(pileIds.length!==run.activeCardIds.length||new Set(pileIds).size!==pileIds.length||pileIds.some(x=>!run.activeCardIds.includes(x)))fail('카드 영역 합계가 일치하지 않습니다.');
    if(c.handIds.length>rules.handLimit||c.sentenceSlots.length>rules.sentenceLimit)fail('카드 한도를 초과했습니다.');
    for(const slot of c.sentenceSlots){
      if(slot.selection){
        const formId=typeof slot.selection==='string'?slot.selection:slot.selection.formId;
        const form=registry.formById[formId],card=registry.cardById[run.cardInstances[slot.cardInstanceId].cardDefId];
        if(!form||form.lexemeId!==card.lexemeId||form.runtimeReady===false)fail('지원하지 않는 형태입니다.');
      }
    }
  } else if(run.status!=='STAGE_INTRO')fail('전투 정보가 없습니다.');
  if(run.reward){
    const offer=record(run.reward,'보상');
    const mixed=['MIXED','RUNE_INTRO'].includes(offer.type);
    const types=['MIXED','RUNE_INTRO','CARD_COMMON','CARD_UNCOMMON','CARD_RARE','CARD_ENHANCE','CARD_REMOVE','RUNE'];
    if(typeof offer.offerId!=='string'||!offer.offerId||!types.includes(offer.type)||typeof offer.resolved!=='boolean')fail('보상 정보가 잘못되었습니다.');
    if(offer.battleNumber!==progress.battleNumber)fail('보상 전투 번호가 다릅니다.');
    if(!Array.isArray(offer.choices))fail('보상 후보가 없습니다.');
    ids(offer.choices.map(x=>x?.choiceId),'보상 후보');
    const cardOffer=['CARD_COMMON','CARD_UNCOMMON','CARD_RARE'].includes(offer.type);
    if((cardOffer||offer.type==='RUNE')&&offer.choices.length>3)fail('보상 후보 한도를 초과했습니다.');
    if(mixed&&(offer.rewardVersion!=='0.1.1'||offer.choices.length!==3))fail('혼합 보상은 고정된 후보 세 칸이어야 합니다.');
    if(offer.type==='RUNE_INTRO'&&(offer.battleNumber!==2||offer.choices.some(x=>x.kind!=='RUNE')))fail('첫 룬 보상이 잘못되었습니다.');
    if(offer.skipGold!==((cardOffer||(mixed&&offer.choices.some(x=>x.kind==='CARD')))?3:2))fail('보상 건너뛰기 재화가 잘못되었습니다.');
    const seenContent=new Set();
    for(const choice of offer.choices){
      let content;
      if(mixed){
        if(choice.kind==='CARD'){const def=registry.cardById[choice.cardDefId];if(!def?.runtimeReady||def.rarity!==choice.rarity)fail('미지원 카드 보상입니다.');content=choice.cardDefId;}
        else if(choice.kind==='RUNE'){const def=RUNE_BY_ID[choice.runeId];if(!def?.runtimeReady||def.rarity!==choice.rarity)fail('미지원 룬 보상입니다.');requireInteger(choice.ownedLevel,'ownedLevel',0,2);if(choice.offeredLevel!==choice.ownedLevel+1)fail('룬 보상 레벨이 잘못되었습니다.');content=choice.runeId;}
        else if(choice.kind==='SERVICE'){if(!['POLISH','REMOVE'].includes(choice.serviceKind))fail('미지원 서비스입니다.');ids(choice.targetCardIds,'서비스 대상');if(!choice.targetCardIds.length)fail('서비스 대상이 없습니다.');if(!offer.resolved&&choice.targetCardIds.some(id=>!run.activeCardIds.includes(id)||(choice.serviceKind==='POLISH'&&run.cardInstances[id].polishLevel>=3)))fail('서비스 대상이 잘못되었습니다.');content=choice.serviceKind;}
        else fail('미지원 보상 종류입니다.');
      }
      else if(cardOffer){const def=registry.cardById[choice.cardDefId];if(!def?.runtimeReady||def.rarity!==offer.type.slice(5))fail('미지원 카드 보상입니다.');content=choice.cardDefId;}
      else if(offer.type==='RUNE'){if(!RUNE_BY_ID[choice.runeId]?.runtimeReady)fail('미지원 룬 보상입니다.');content=choice.runeId;}
      else {const removedChosen=offer.type==='CARD_REMOVE'&&offer.resolved&&offer.selectedChoiceId===choice.choiceId&&offer.resolution?.kind==='REMOVE';if((!run.cardInstances[choice.cardInstanceId]&&!removedChosen)||(!offer.resolved&&!run.activeCardIds.includes(choice.cardInstanceId)))fail('없는 보상 대상 카드입니다.');content=choice.cardInstanceId;}
      if(seenContent.has(content))fail('보상 후보가 중복되었습니다.');seenContent.add(content);
      if(choice.disabled!==undefined&&typeof choice.disabled!=='boolean')fail('보상 후보 상태가 잘못되었습니다.');
    }
    if(offer.resolved&&offer.selectedChoiceId!=='SKIP'&&!offer.choices.some(x=>x.choiceId===offer.selectedChoiceId))fail('선택한 보상 후보가 없습니다.');
    if(run.status==='REWARD'&&offer.resolved)fail('이미 정산된 보상입니다.');
  } else if(run.status==='REWARD')fail('고정 보상이 없습니다.');
  return true;
}
export class LocalStore {
  constructor({indexedDB=globalThis.indexedDB,registry}={}){this.factory=indexedDB;this.registry=registry;this.db=null;this.available=false;}
  async init(){
    if(!this.factory)throw Error('이 브라우저에서 로컬 저장을 사용할 수 없습니다.');
    this.db=await new Promise((resolve,reject)=>{const req=this.factory.open(STORE_NAME,1);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains('profiles'))d.createObjectStore('profiles',{keyPath:'playerId'});if(!d.objectStoreNames.contains('slots'))d.createObjectStore('slots',{keyPath:'key'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('다른 탭의 저장 연결을 닫고 다시 시도하세요.'));});
    this.available=true;return this;
  }
  _transaction(storeName,mode,operation){
    if(!this.db)return Promise.reject(Error('저장소를 사용할 수 없습니다. 메모리 플레이는 계속할 수 있습니다.'));
    return new Promise((resolve,reject)=>{let value;const tx=this.db.transaction(storeName,mode);try{const req=operation(tx.objectStore(storeName));req.onsuccess=()=>{value=req.result;};}catch(error){tx.abort();reject(error);}tx.oncomplete=()=>resolve(clone(value));tx.onerror=()=>reject(tx.error??Error('저장하지 못했습니다.'));tx.onabort=()=>reject(tx.error??Error('저장하지 못했습니다.'));});
  }
  async listProfiles(){return(await this._transaction('profiles','readonly',s=>s.getAll()))??[];}
  async createProfile(name){const p=newProfile(name);await this.saveProfile(p);return p;}
  async saveProfile(profile){assertSerializable(profile);if(!profile.playerId)throw Error('프로필 ID가 없습니다.');await this._transaction('profiles','readwrite',s=>s.put(clone(profile)));return clone(profile);}
  async listSlots(playerId){const rows=(await this._transaction('slots','readonly',s=>s.getAll()))??[];return [1,2,3].map(slot=>rows.find(r=>r.key===`${playerId}:${slot}`)??{slot,empty:true});}
  async saveRun(playerId,slot,run){
    requireInteger(slot,'slot',1,3);if(!canSaveRun(run))throw Error('전투 시작 전이나 보상·전투 사이에서 저장할 수 있습니다.');validateRunState(run,this.registry);
    const record={key:`${playerId}:${slot}`,slot,playerId,savedAt:Date.now(),version:SAVE_VERSION,run:clone(run)};
    await this._transaction('slots','readwrite',s=>s.put(record));return record;
  }
  async loadRun(playerId,slot){requireInteger(slot,'slot',1,3);const row=await this._transaction('slots','readonly',s=>s.get(`${playerId}:${slot}`));if(!row)throw Error('비어 있는 슬롯입니다.');if(!supportedVersion(row.version))throw Error('지원하지 않는 저장 버전입니다.');validateRunState(row.run,this.registry);if(!canSaveRun(row.run))throw Error('안전 지점 저장이 아닙니다.');return clone(row.run);}
}
