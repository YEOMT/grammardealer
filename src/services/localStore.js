import {hasSkyCampaign,hasTimeCampaign,hasDesertCampaign} from '../data/campaignFeatures.js';
import {DESERT_PACKS} from '../game/wishDesert.js';
import {validateTurnHandSeal} from '../game/turnHandSeal.js';
import {validateSkyShops} from '../game/skyShopValidation.js';
import {validateSkyShield} from '../engine/skyShield.js';
import {validateOperationHistory} from '../game/operationHistory.js';
import {cardDefinition} from '../data/cardCatalog.js';
import {assertCardTypes} from '../game/invariants.js';
import {TIME_PACKS} from '../data/language/timeLanguage.js';
import {validateTimeGolem} from '../engine/timeGolem.js';
import {isGuided,validateTutorial} from '../game/guidedTutorial.js';
import {learningRecord,reviewProfileLearning} from '../engine/learningRecords.js';
import { clone, requireInteger, assertSerializable } from '../contracts.js';
import { assertRng } from '../game/rng.js';
import { RUNE_BY_ID, runeForVersion, RUNE_SLOT_LIMIT } from '../data/runes.js';
import {registryForVersion} from '../data/language/index.js';
import {stageForRun,getEncounter,isCurrentCampaign} from '../data/stages.js';

export const SAVE_VERSION = '0.5.1';
const supportedVersion = version => ['0.1.0','0.1.1','0.2.0','0.2.1','0.2.2','0.3.0','0.4.0','0.5.0','0.5.1'].includes(version);
export const STORE_NAME = 'sentence-balatro-v0-1';
const uniqueId = prefix => `${prefix}.${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}.${++uniqueId.counter}`}`;
uniqueId.counter = 0;
export function newProfile(displayName) {
  return {version:SAVE_VERSION,playerId:uniqueId('player'),displayName:String(displayName).trim().slice(0,30)||'여행자',settings:{speed:1,sfxVolume:45,muted:false,effectsOff:false},firstRuneIntroSeen:false,guideSeen:false,qualifiedRunIds:[],appliedAttackIds:[],grammarRecords:{},bestAttack:0,totalActualDamage:0,unlocks:[],storyClearCount:0};
}
/** Profile events are idempotent; replay/sandbox never calls this reducer. */
export function applyProfileEvent(profile,event) {
  if(event.type==='GUIDED_TUTORIAL_SKIPPED'&&event.version==='0.2.1')return {...clone(profile),guidedTutorialSkippedVersion:event.version};
  const p=clone(reviewProfileLearning(profile));
  if(event.type==='GUIDED_TUTORIAL_COMPLETED'&&event.version==='0.2.1')p.guidedTutorialCompletedVersion=event.version;
  if(event.type==='FIRST_RUNE_SHOWN')p.firstRuneIntroSeen=true;
  if(event.type==='GUIDE_SEEN')p.guideSeen=true;
  if(['GUIDE_COMPLETED','GUIDE_SKIPPED'].includes(event.type)){p.guideSeen=true;p.tutorial={tutorialVersion:event.tutorialVersion,completed:event.type==='GUIDE_COMPLETED',skipped:event.type==='GUIDE_SKIPPED',actions:event.actions,reason:event.reason};}
  if(event.type==='ATTACK'&&!p.appliedAttackIds.includes(event.resolution.attackId)){
    const r=event.resolution;p.appliedAttackIds.push(r.attackId);p.bestAttack=Math.max(p.bestAttack,r.finalPower);p.totalActualDamage+=r.actualHpLoss;
    const sentence=r.sentenceSnapshot.orderedTokens.map(t=>t.surface).join(' ')+'.';
    p.recentSubmissions=[learningRecord(r),...(p.recentSubmissions??[])].slice(0,12);
    for(const tag of new Set(r.analysis.grammarHits.filter(h=>r.scoreableHitIds?.includes(h.id)??true).map(h=>h.tag))){
      const old=p.grammarRecords[tag]??{count:0,firstSentence:sentence,bestSentence:sentence,bestPower:0,firstLearning:learningRecord(r)};
      old.count++;if(r.analysis.status==='VALID'&&!r.analysis.issues?.length){const complete=learningRecord(r);if(!old.firstComplete){old.firstComplete=complete;}if(!old.bestComplete||r.finalPower>old.bestComplete.finalPower)old.bestComplete=complete;}if(r.finalPower>old.bestPower){old.bestPower=r.finalPower;old.bestSentence=sentence;old.bestLearning=learningRecord(r);}p.grammarRecords[tag]=old;
    }
  }
  if(event.type==='STAGE1_CLEAR'&&!p.qualifiedRunIds.includes(event.runId)){
    p.qualifiedRunIds.push(event.runId);
    p.unlocks=[...new Set([...p.unlocks,'pack.svoo','rune.svoo','rune.humanSubject',...(p.qualifiedRunIds.length>=3?['rune.turnDraw']:[])])];
    p.highestCompletedStage=Math.max(p.highestCompletedStage??0,1);
  }
  if(event.type==='STAGE2_CLEAR'&&!(p.stage2CompletedRunIds??[]).includes(event.runId)){
    p.stage2CompletedRunIds=[...(p.stage2CompletedRunIds??[]),event.runId];
    p.highestCompletedStage=Math.max(p.highestCompletedStage??0,2);
  }
  if(event.type==='STAGE3_CLEAR'&&!(p.stage3CompletedRunIds??[]).includes(event.runId)){p.stage3CompletedRunIds=[...(p.stage3CompletedRunIds??[]),event.runId];p.highestCompletedStage=Math.max(p.highestCompletedStage??0,3);}
  if(event.type==='STAGE4_CLEAR'&&!(p.stage4CompletedRunIds??[]).includes(event.runId)){p.stage4CompletedRunIds=[...(p.stage4CompletedRunIds??[]),event.runId];p.highestCompletedStage=Math.max(p.highestCompletedStage??0,4);}
  if(event.type==='STAGE5_CLEAR'&&!(p.stage5CompletedRunIds??[]).includes(event.runId)){p.stage5CompletedRunIds=[...(p.stage5CompletedRunIds??[]),event.runId];p.highestCompletedStage=Math.max(p.highestCompletedStage??0,5);}
  if(event.type==='STAGE4_CLEAR'&&['0.5.0','0.5.1'].includes(event.version))p.unlocks=[...new Set([...p.unlocks,...DESERT_PACKS])];
  return reviewTimeUnlocks(p);
}
export function reviewTimeUnlocks(profile){
 const p=clone(profile);if(p.stage2CompletedRunIds?.length){p.unlocks=[...new Set([...(p.unlocks??[]),...TIME_PACKS])];p.timeUnlockReviewVersion='0.3.0';}if(p.stage3CompletedRunIds?.length){p.unlocks=[...new Set([...(p.unlocks??[]),'pack.clauseLink'])];p.clauseUnlockReviewVersion='0.4.0';}return p;
}
/** Only a new 0.5 run imports verified Stage 4 completion; loaded legacy runs stay frozen. */
export function reviewDesertUnlocks(profile){const p=reviewTimeUnlocks(profile);if(p.stage4CompletedRunIds?.length){p.unlocks=[...new Set([...(p.unlocks??[]),...DESERT_PACKS])];p.desertUnlockReviewVersion='0.5.0';}return p;}
export function canSaveRun(run) {
  if(!run)return false;
  if(isGuided(run))return run.status==='BATTLE'&&run.tutorialSession.step===1&&run.combat?.phase==='EDIT'&&!run.combat.battleDirty;
  if(['REWARD','BETWEEN_BATTLES','CONTENT_COMPLETE','STAGE_CLEAR'].includes(run.status))return true;
  if(run.status==='SHOP')return ['0.2.0','0.2.1','0.2.2','0.3.0','0.4.0','0.5.0','0.5.1'].includes(run.version)&&run.combat===null&&run.shop?.closed===false;
  return run.status==='BATTLE'&&run.combat?.phase==='EDIT'&&((!run.combat.battleDirty&&run.combat.turnIndex===1)||(['0.2.2','0.3.0','0.4.0','0.5.0','0.5.1'].includes(run.version)&&!run.combat.sentenceSlots.length&&!run.combat.pendingAttackId));
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
  registry=registryForVersion(run.version);validateTutorial(run);
  const desert=hasDesertCampaign(run),sky=hasSkyCampaign(run),currentCampaign=isCurrentCampaign(run),time=hasTimeCampaign(run);
  const runeInScope=id=>Boolean(runeForVersion(id,run.version)?.runtimeReady)&&(!currentCampaign||run.contentManifest?.runeIds?.includes(id))&&(id!=='rune.svoo'||currentCampaign&&[...(run.eligibility?.runStartUnlockBaseline??[]),...(run.eligibility?.runOwnUnlocks??[])].includes(id));
  if(typeof run.runId!=='string'||!run.runId||run.runId.length>200)fail('원정 ID가 없습니다.');
  if(!['STAGE_INTRO','BATTLE','REWARD','BETWEEN_BATTLES','CONTENT_COMPLETE','DEFEAT',...(currentCampaign?['STAGE_CLEAR','SHOP']:[])].includes(run.status))fail('잘못된 원정 상태입니다.');
  requireInteger(run.revision,'revision');requireInteger(run.economy?.gold,'gold');
  if(run.appliedCommandIds!==undefined)ids(run.appliedCommandIds,'처리된 행동');
  if(run.settlementIds!==undefined)ids(run.settlementIds,'전투 정산');
  const config=record(run.config,'설정');
  if(config.character!=='traveler'||config.difficulty!==1||!['BEGINNER','STANDARD','ADVANCED','FREE'].includes(config.vocabularyMode))fail('이번 버전에서 지원하지 않는 원정 설정입니다.');
  if(!['string','number'].includes(typeof config.seed)||(typeof config.seed==='number'&&!Number.isSafeInteger(config.seed)))fail('시드가 잘못되었습니다.');
  const progress=record(run.progress,'진행');
  if(!['stage.01',...(currentCampaign?['stage.02']:[]),...(time?['stage.03']:[]),...(sky?['stage.04']:[]),...(desert?['stage.05']:[])].includes(progress.stageId))fail('지원하지 않는 전투 진행입니다.');
  const stage=stageForRun(run);
  requireInteger(progress.roundIndex,'roundIndex',0,stage.rounds.length-1);
  if(progress.battleNumber!==stage.rounds[progress.roundIndex].battleNumber)fail('지원하지 않는 전투 진행입니다.');
  const endBoundary=desert?'STAGE5_END':sky?'STAGE4_END':time?'STAGE3_END':currentCampaign?'STAGE2_END':'STAGE1_END';
  if(![null,undefined,endBoundary].includes(progress.contentBoundary))fail('지원하지 않는 콘텐츠 경계입니다.');
  if(run.status==='CONTENT_COMPLETE'&&(progress.roundIndex!==stage.rounds.length-1||progress.contentBoundary!==endBoundary||currentCampaign&&progress.stageId!==(desert?'stage.05':sky?'stage.04':time?'stage.03':'stage.02')))fail('제공 구간 완료 상태가 잘못되었습니다.');
  if(run.status==='STAGE_CLEAR'&&(!['stage.01',...(time?['stage.02']:[]),...(sky?['stage.03']:[]),...(desert?['stage.04']:[])].includes(progress.stageId)||progress.roundIndex!==stage.rounds.length-1||!run.reward?.resolved))fail('지역 완료 상태가 잘못되었습니다.');
  if(run.status!=='CONTENT_COMPLETE'&&progress.contentBoundary!=null)fail('진행 중인 원정의 완료 경계가 잘못되었습니다.');
  if(currentCampaign&&run.status==='STAGE_INTRO'&&progress.roundIndex!==0)fail('지역 소개 전투 번호가 잘못되었습니다.');
  if(currentCampaign&&run.status==='BETWEEN_BATTLES'&&progress.roundIndex>=stage.rounds.length-1)fail('지역 마지막 전투 이후 진행이 잘못되었습니다.');
  if(currentCampaign){
    const manifest=record(run.contentManifest,'콘텐츠 목록');
    if(manifest.id!==(desert?'campaign.0.5':sky?'campaign.0.4':time?'campaign.0.3':'campaign.0.2'))fail('지원하지 않는 콘텐츠 목록입니다.');
    ids(manifest.cardDefIds,'콘텐츠 카드');ids(manifest.runeIds,'콘텐츠 룬');ids(manifest.stageIds,'콘텐츠 지역');
    if(manifest.stageIds.join('|')!==(desert?'stage.01|stage.02|stage.03|stage.04|stage.05':sky?'stage.01|stage.02|stage.03|stage.04':time?'stage.01|stage.02|stage.03':'stage.01|stage.02')||manifest.cardDefIds.some(id=>!cardDefinition(id,run.version)?.runtimeReady)||manifest.runeIds.some(id=>!runeForVersion(id,run.version)?.runtimeReady))fail('없는 콘텐츠가 포함되어 있습니다.');
    requireInteger(run.economy.paidRemovalCount,'paidRemovalCount');
    ids(run.milestoneIds,'지역 사건');
    if(run.milestoneIds.some(id=>!['STAGE1_CLEAR',...(time?['STAGE2_CLEAR','STAGE3_CLEAR']:[]),...(desert?['STAGE4_CLEAR','STAGE5_CLEAR']:[])].includes(id)))fail('지원하지 않는 지역 사건입니다.');
    if(time&&progress.stageId==='stage.03'&&(!run.milestoneIds.includes('STAGE1_CLEAR')||!run.milestoneIds.includes('STAGE2_CLEAR')))fail('시간의 협곡 이전 지역 완료 기록이 없습니다.');
    if(time&&run.milestoneIds.includes('STAGE3_CLEAR')&&(!(sky&&progress.battleNumber>12)&&(progress.battleNumber!==12||run.combat?.enemyState.hp!==0||!['REWARD','CONTENT_COMPLETE',...(sky?['STAGE_CLEAR']:[])].includes(run.status))))fail('골렘 처치 이전의 완료 기록입니다.');
    if(sky&&progress.stageId==='stage.04'&&(!['STAGE1_CLEAR','STAGE2_CLEAR','STAGE3_CLEAR'].every(id=>run.milestoneIds.includes(id))||!run.eligibility.runOwnUnlocks.includes('pack.clauseLink')))fail('하늘섬 이전 완료·해금 기록이 없습니다.');
    if(desert){
      if(progress.stageId==='stage.05'&&(!['STAGE1_CLEAR','STAGE2_CLEAR','STAGE3_CLEAR','STAGE4_CLEAR'].every(id=>run.milestoneIds.includes(id))||!DESERT_PACKS.every(id=>run.eligibility.runOwnUnlocks.includes(id))))fail('사막 이전 완료·해금 기록이 없습니다.');
      for(const [milestone,battle]of [['STAGE4_CLEAR',17],['STAGE5_CLEAR',22]])if(run.milestoneIds.includes(milestone)&&(progress.battleNumber<battle||progress.battleNumber===battle&&(run.combat?.enemyState.hp!==0||!['REWARD','STAGE_CLEAR','CONTENT_COMPLETE'].includes(run.status))))fail('보스 처치 이전의 사막 완료 기록입니다.');
      if(run.status==='CONTENT_COMPLETE'&&!run.milestoneIds.includes('STAGE5_CLEAR'))fail('사막 완료 사건이 없습니다.');
    }
    if(progress.stageId==='stage.02'&&!run.milestoneIds.includes('STAGE1_CLEAR'))fail('이전 지역 완료 기록이 없습니다.');
  }
  ids(run.activeCardIds,'카드');record(run.cardInstances,'카드');
  for(const [id,c] of Object.entries(run.cardInstances)){
    if(!c||c.instanceId!==id||!cardDefinition(c,run.version)?.runtimeReady)fail('없는 카드가 포함되어 있습니다.');
    if(currentCampaign&&!run.contentManifest.cardDefIds.includes(c.cardDefId))fail('원정 콘텐츠 범위 밖의 카드입니다.');
    requireInteger(c.polishLevel,'polishLevel',0,3);if(c.specialEffectId!==null)fail('미지원 카드 효과입니다.');
  }
  for(const id of run.activeCardIds)if(!run.cardInstances[id])fail('없는 카드가 포함되어 있습니다.');
  assertRng(run.rng);
  const runes=record(run.runes,'룬');
  if(runes.slotLimit!==(time&&run.milestoneIds.includes('STAGE3_CLEAR')?4:RUNE_SLOT_LIMIT))fail('지원하지 않는 룬 슬롯 수입니다.');
  ids(runes.orderedInstanceIds,'룬');record(runes.instances,'룬');
  if(runes.orderedInstanceIds.length>runes.slotLimit||Object.keys(runes.instances).length!==runes.orderedInstanceIds.length)fail('잘못된 룬 슬롯입니다.');
  const seenRunes=new Set();
  for(const id of runes.orderedInstanceIds){
    const r=runes.instances[id];
    if(!r||r.instanceId!==id||!runeForVersion(r.runeId,run.version)?.runtimeReady||seenRunes.has(r.runeId))fail('미지원·중복 룬입니다.');
    if(r.runeId==='rune.svoo'&&(!currentCampaign||![...(run.eligibility?.runStartUnlockBaseline??[]),...(run.eligibility?.runOwnUnlocks??[])].includes('rune.svoo')))fail('원정에서 해금되지 않은 룬입니다.');
    if(currentCampaign&&!run.contentManifest.runeIds.includes(r.runeId))fail('원정 콘텐츠 범위 밖의 룬입니다.');
    seenRunes.add(r.runeId);requireInteger(r.level,'runeLevel',1,3);
  }
  const c=run.combat;
  if(c){
    if(!['EDIT','EXCHANGE_SELECT','RESOLVING','PRESENTING','OPERATION_PRESENTING','VICTORY','DEFEAT','TURN_START'].includes(c.phase))fail('잘못된 전투 단계입니다.');
    const rules=record(c.rulesSnapshot,'전투 규칙');
    const allowed={initialHand:[6,8,9,10],handLimit:[10,12,13,14],turnDraw:[3],discardActions:run.tutorialSession&&run.tutorialSession.endReason!=='SKIPPED'&&progress.battleNumber===1?[1]:[4,5,6,7],turnLimit:[6],sentenceLimit:[16]};
    for(const [key,values] of Object.entries(allowed))if(!values.includes(rules[key]))fail(`지원하지 않는 전투 규칙: ${key}`);
    if(rules.initialHand>rules.handLimit)fail('초기 손패 한도가 잘못되었습니다.');
    requireInteger(c.turnsRemaining,'turnsRemaining',0,rules.turnLimit);
    requireInteger(c.exchangesRemaining,'exchangesRemaining',0,rules.discardActions);
    requireInteger(c.turnIndex,'turnIndex',1,rules.turnLimit);
    requireInteger(c.actionSequence,'actionSequence');
    if(typeof c.battleDirty!=='boolean')fail('전투 저장 지점이 잘못되었습니다.');
    if(!c.battleDirty&&(c.turnIndex!==1||c.turnsRemaining!==rules.turnLimit||c.actionSequence!==0))fail('초기 전투 지점이 잘못되었습니다.');
    requireInteger(c.enemyState?.hp,'hp');requireInteger(c.enemyState?.maxHp,'maxHp',1);
    const encounter=getEncounter(progress.stageId,progress.roundIndex,run.version);
    if(c.enemyState.maxHp!==encounter.hpMax||c.enemyState.hp>c.enemyState.maxHp)fail('잘못된 적 HP입니다.');
    if(currentCampaign){
      if(c.enemyState.id!==encounter.id||c.enemyState.stageId!==progress.stageId||c.enemyState.kind!==encounter.kind)fail('잘못된 적 정의입니다.');
      if(encounter.bossMechanic?.id==='TIME_GOLEM')validateTimeGolem(c.enemyState);
      else if(encounter.bossMechanic?.id==='CLAUSE_LINK_SHIELD')validateSkyShield(c.enemyState);
      else if(encounter.bossMechanic?.id==='TURN_HAND_SEAL')validateTurnHandSeal(run);
      else if(encounter.bossMechanic){const veil=c.enemyState.bossMechanic;if(!veil||veil.id!=='SVOO_VEIL'||typeof veil.active!=='boolean'||veil.multiplier?.num!==1||veil.multiplier?.den!==4)fail('보스 장막 정의가 잘못되었습니다.');}
      else if(c.enemyState.bossMechanic)fail('이 적은 보스 장막을 사용하지 않습니다.');
    }
    assertCardTypes(run);validateOperationHistory(run);validateTurnHandSeal(run);if(c.exhaustedIds!==undefined)ids(c.exhaustedIds,'사용 완료');
    ids(c.drawIds,'드로우');ids(c.handIds,'손패');ids(c.discardIds,'버린 카드');
    if(!Array.isArray(c.sentenceSlots))fail('문장 카드 정보가 잘못되었습니다.');
    const pileIds=[...c.drawIds,...c.handIds,...c.sentenceSlots.map(x=>x.cardInstanceId),...c.discardIds,...(c.exhaustedIds??[])];
    if(pileIds.length!==run.activeCardIds.length||new Set(pileIds).size!==pileIds.length||pileIds.some(x=>!run.activeCardIds.includes(x)))fail('카드 영역 합계가 일치하지 않습니다.');
    if(c.handIds.length>rules.handLimit||c.sentenceSlots.length>rules.sentenceLimit)fail('카드 한도를 초과했습니다.');
    for(const slot of c.sentenceSlots){
      if(slot.selection){
        const formId=typeof slot.selection==='string'?slot.selection:slot.selection.formId;
        const form=registry.formById[formId],card=registry.cardById[run.cardInstances[slot.cardInstanceId].cardDefId];
        if(!form||form.lexemeId!==card.lexemeId||form.runtimeReady===false)fail('지원하지 않는 형태입니다.');
      }
    }
  } else if(!['STAGE_INTRO','SHOP'].includes(run.status))fail('전투 정보가 없습니다.');
  if(run.status==='SHOP'&&(!['stage.02',...(sky?['stage.04']:[])].includes(progress.stageId)||progress.roundIndex!==0||c!==null))fail('상점 진입 상태가 잘못되었습니다.');
  if(currentCampaign){
    record(run.entryGrants,'입장 지급');
    if(Object.keys(run.entryGrants).some(id=>!['stage.02',...(time?['stage.03']:[]),...(sky?['stage.04']:[]),...(desert?['stage.05']:[])].includes(id)))fail('지원하지 않는 입장 지급입니다.');
    const desertGrant=run.entryGrants['stage.05'];
    if(desertGrant){
      if(!desert||desertGrant.entryGrantId!==run.runId+':stage.05.entryGrant'||desertGrant.applied!==true)fail('사막 입장 지급 기록이 잘못되었습니다.');ids(desertGrant.cardInstanceIds,'사막 지급 사본');ids(desertGrant.cardDefIds,'사막 지급 종류');
      const order=['card.to','card.want','card.enjoy'],reasons=['MISSING_TO','MISSING_WANT_OR_NEED','MISSING_BASIC_GERUND_OBJECT_VERB'];
      if(desertGrant.cardDefIds.length>3||desertGrant.cardInstanceIds.length!==desertGrant.cardDefIds.length||desertGrant.cardDefIds.some((id,i)=>!order.includes(id)||i>0&&order.indexOf(id)<=order.indexOf(desertGrant.cardDefIds[i-1]))||!Array.isArray(desertGrant.trace)||desertGrant.trace.length!==desertGrant.cardDefIds.length)fail('사막 지급 종류가 잘못되었습니다.');
      for(const [i,id]of desertGrant.cardInstanceIds.entries())if(id!=='entry.'+run.runId+'.stage.05.card.'+i||run.cardInstances[id]&&run.cardInstances[id].cardDefId!==desertGrant.cardDefIds[i]||desertGrant.trace[i].cardInstanceId!==id||desertGrant.trace[i].cardDefId!==desertGrant.cardDefIds[i]||desertGrant.trace[i].kind!==reasons[order.indexOf(desertGrant.cardDefIds[i])])fail('사막 지급 사본이 잘못되었습니다.');
    }
    if(desert&&progress.stageId==='stage.05'&&run.status!=='STAGE_INTRO'&&!desertGrant)fail('사막 지급 기록이 없습니다.');
    const skyGrant=run.entryGrants['stage.04'];
    if(skyGrant){
      if(!sky||skyGrant.entryGrantId!==run.runId+':stage.04.entryGrant'||skyGrant.applied!==true)fail('하늘섬 입장 지급 기록이 잘못되었습니다.');ids(skyGrant.cardInstanceIds,'하늘섬 지급 사본');ids(skyGrant.cardDefIds,'하늘섬 지급 종류');
      const expectedOrder=['card.and','card.because','card.think','card.that'];if(skyGrant.cardDefIds.length>4||skyGrant.cardInstanceIds.length!==skyGrant.cardDefIds.length||skyGrant.cardDefIds.some((id,i)=>!expectedOrder.includes(id)||i>0&&expectedOrder.indexOf(id)<=expectedOrder.indexOf(skyGrant.cardDefIds[i-1])))fail('하늘섬 지급 종류가 잘못되었습니다.');
      for(const [i,id]of skyGrant.cardInstanceIds.entries())if(id!==`entry.${run.runId}.stage.04.card.${i}`||run.cardInstances[id]&&run.cardInstances[id].cardDefId!==skyGrant.cardDefIds[i])fail('하늘섬 지급 사본이 잘못되었습니다.');
    }
    if(sky&&progress.stageId==='stage.04'&&run.status!=='STAGE_INTRO'&&!skyGrant)fail('하늘섬 지급 기록이 없습니다.');
    const timeGrant=run.entryGrants['stage.03'];
    if(timeGrant){
      if(timeGrant.entryGrantId!==`${run.runId}:stage.03.entryGrant`||timeGrant.applied!==true)fail('시간 입장 지급 기록이 잘못되었습니다.');
      ids(timeGrant.cardInstanceIds,'시간 입장 카드');ids(timeGrant.cardDefIds,'시간 지급 종류');
      if(timeGrant.cardInstanceIds.length>3||timeGrant.cardInstanceIds.length!==timeGrant.cardDefIds.length||timeGrant.cardDefIds.some(id=>!['card.be','card.have','card.will'].includes(id)))fail('시간 입장 지급 종류가 잘못되었습니다.');
      for(const[id,i]of timeGrant.cardInstanceIds.map((id,i)=>[id,i]))if(id!==`entry.${run.runId}.stage.03.card.${i}`||(run.cardInstances[id]&&run.cardInstances[id].cardDefId!==timeGrant.cardDefIds[i]))fail('시간 입장 카드 ID가 잘못되었습니다.');
    }
    if(time&&progress.stageId==='stage.03'&&run.status!=='STAGE_INTRO'&&!timeGrant)fail('시간 입장 지급 기록이 없습니다.');
    const grant=run.entryGrants['stage.02'];
    if(grant){
      if(grant.entryGrantId!==`${run.runId}:stage.02.entryGrant`||grant.applied!==true)fail('입장 지급 기록이 잘못되었습니다.');
      ids(grant.cardInstanceIds,'입장 카드');if(grant.cardInstanceIds.length>2)fail('입장 카드 한도를 초과했습니다.');
      if(grant.cardInstanceIds.some((id,i)=>id!==`entry.${run.runId}.stage.02.card.${i}`))fail('입장 카드 ID가 잘못되었습니다.');
      if(!registry.cardById[grant.representativeVerbCardDefId]||!registry.cardById[grant.connectorCardDefId])fail('입장 경로가 잘못되었습니다.');
      const verb=registry.lexemeById[registry.cardById[grant.representativeVerbCardDefId].lexemeId];
      const binding=verb.senseIds.flatMap(id=>registry.senseById[id].frameBindings).find(b=>b.runtimeReady&&b.frameId==='frame.svoo');
      if(!binding||grant.connectorCardDefId!==`card.${binding.dativePreposition}`)fail('지원하지 않는 입장 경로입니다.');
    }
    if(time&&progress.stageId==='stage.03'&&(!run.milestoneIds.includes('STAGE1_CLEAR')||!run.milestoneIds.includes('STAGE2_CLEAR')))fail('시간의 협곡 이전 지역 완료 기록이 없습니다.');
    if(progress.stageId==='stage.02'&&run.status!=='STAGE_INTRO'&&!grant)fail('입장 지급 기록이 없습니다.');
    if(sky){validateSkyShops(run);}else if(run.shop){
      const shop=record(run.shop,'상점');
      if(shop.shopId!==`shop.${run.runId}.stage.02`||shop.stageId!=='stage.02'||shop.shopVersion!=='0.2.0'||typeof shop.closed!=='boolean'||!grant)fail('상점 정보가 잘못되었습니다.');
      if((run.status==='SHOP')===shop.closed)fail('상점 종료 상태가 잘못되었습니다.');
      if(!Array.isArray(shop.inventory)||shop.inventory.length!==3)fail('상점 상품 수가 잘못되었습니다.');
      ids(shop.inventory.map(item=>item.itemId),'상점 상품');
      if(shop.inventory.filter(item=>item.kind==='CARD').length!==2||shop.inventory.filter(item=>item.kind==='RUNE').length!==1)fail('상점 상품 종류가 잘못되었습니다.');
      for(const [index,item] of shop.inventory.entries()){
        const def=item.kind==='CARD'?cardDefinition(item.cardDefId,run.version):RUNE_BY_ID[item.runeId];
        const prices=item.kind==='CARD'?{COMMON:6,UNCOMMON:10,RARE:14}:{COMMON:18,UNCOMMON:24,RARE:32};
        if(!def?.runtimeReady||def.rarity!==item.rarity||item.price!==prices[item.rarity]||typeof item.purchased!=='boolean')fail('상점 상품이나 가격이 잘못되었습니다.');
        if(item.itemId!==`${shop.shopId}.${index===0?'rune.0':`card.${index-1}`}`||(index===0)!==(item.kind==='RUNE'))fail('상점 상품 ID가 잘못되었습니다.');
        if(!(item.kind==='CARD'?run.contentManifest.cardDefIds:run.contentManifest.runeIds).includes(def.id))fail('원정 콘텐츠 범위 밖의 상품입니다.');
        if(item.runeId==='rune.svoo'&&![...(run.eligibility?.runStartUnlockBaseline??[]),...(run.eligibility?.runOwnUnlocks??[])].includes('rune.svoo'))fail('해금되지 않은 상점 룬입니다.');
        if(item.kind==='RUNE'){requireInteger(item.ownedLevel,'shopOwnedLevel',0,2);if(item.offeredLevel!==item.ownedLevel+1)fail('상점 룬 레벨이 잘못되었습니다.');}
      }
      for(const kind of ['POLISH','REMOVE']){const service=shop.services?.[kind];if(!service||typeof service.used!=='boolean')fail('상점 서비스 정보가 잘못되었습니다.');requireInteger(service.price,'servicePrice',1);}
      if(shop.services.POLISH.price!==8||shop.services.REMOVE.price<6||shop.services.REMOVE.used&&run.economy.paidRemovalCount<1||shop.services.REMOVE.price!==6+2*(run.economy.paidRemovalCount-(shop.services.REMOVE.used?1:0)))fail('상점 서비스 가격이 잘못되었습니다.');
    }else if(run.status==='SHOP'||progress.stageId==='stage.02'&&run.status!=='STAGE_INTRO')fail('상점 방문 기록이 없습니다.');
  }
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
    if(mixed&&(!['0.1.1',...(currentCampaign?['0.2.0']:[]),...(sky?['0.4.0']:[])].includes(offer.rewardVersion)||offer.choices.length!==3))fail('혼합 보상은 고정된 후보 세 칸이어야 합니다.');
    if(sky&&offer.choices.filter(x=>x.kind==='CARD'&&cardDefinition(x.cardDefId,run.version)?.cardKind==='OPERATION').length>1)fail('운영 카드 후보가 너무 많습니다.');
    if(offer.type==='RUNE_INTRO'&&(offer.battleNumber!==2||offer.choices.some(x=>x.kind!=='RUNE')))fail('첫 룬 보상이 잘못되었습니다.');
    if(offer.skipGold!==((cardOffer||(mixed&&offer.choices.some(x=>x.kind==='CARD')))?3:2))fail('보상 건너뛰기 재화가 잘못되었습니다.');
    const seenContent=new Set();
    for(const choice of offer.choices){
      let content;
      if(mixed){
        if(choice.kind==='CARD'){const def=cardDefinition(choice.cardDefId,run.version);if(!def?.runtimeReady||def.rarity!==choice.rarity)fail('미지원 카드 보상입니다.');content=choice.cardDefId;}
        else if(choice.kind==='RUNE'){const def=RUNE_BY_ID[choice.runeId];if(!runeInScope(choice.runeId)||def.rarity!==choice.rarity)fail('미지원 룬 보상입니다.');requireInteger(choice.ownedLevel,'ownedLevel',0,2);if(choice.offeredLevel!==choice.ownedLevel+1)fail('룬 보상 레벨이 잘못되었습니다.');content=choice.runeId;}
        else if(choice.kind==='SERVICE'){if(!['POLISH','REMOVE'].includes(choice.serviceKind))fail('미지원 서비스입니다.');ids(choice.targetCardIds,'서비스 대상');if(!choice.targetCardIds.length)fail('서비스 대상이 없습니다.');if(!offer.resolved&&choice.targetCardIds.some(id=>!run.activeCardIds.includes(id)||(choice.serviceKind==='POLISH'&&(run.cardInstances[id].polishLevel>=3||cardDefinition(run.cardInstances[id],run.version)?.cardKind==='OPERATION'))))fail('서비스 대상이 잘못되었습니다.');content=choice.serviceKind;}
        else fail('미지원 보상 종류입니다.');
      }
      else if(cardOffer){const def=registry.cardById[choice.cardDefId];if(!def?.runtimeReady||def.rarity!==offer.type.slice(5))fail('미지원 카드 보상입니다.');content=choice.cardDefId;}
      else if(offer.type==='RUNE'){if(!runeInScope(choice.runeId))fail('미지원 룬 보상입니다.');content=choice.runeId;}
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
  async listProfiles(){return ((await this._transaction('profiles','readonly',s=>s.getAll()))??[]).map(reviewProfileLearning);}
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
