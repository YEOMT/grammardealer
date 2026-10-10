import {waterwaysEntryOffer,grantWaterwaysEntry} from './ancientWaterways.js';
import {createWaterwaysFrost,ensureWaterwaysFrostVisibility} from './waterwaysFrost.js';
import {relativeSealReceipt} from '../engine/dualRelativeSeal.js';
import {WATERWAYS_PACKS,WATERWAYS_REWARD_PACK} from '../data/language/waterwaysLanguage.js';
import {createDustSupply,limitOpeningDust} from './emberDust.js';
import {cleanupTemporaryCards} from './temporaryCards.js';
import {EMBER_PACKS} from '../data/stage7.js';
import {hasWaterwaysCampaign,hasEmberCampaign,hasPolishCampaign,hasSnowCampaign,hasSkyCampaign,hasTimeCampaign,hasDesertCampaign} from '../data/campaignFeatures.js';
import {grantStage6Entry,SNOW_PACKS,SNOW_REWARD_PACK} from './mirrorSnowfield.js';
import {createFrostSupply,ensureFrostVisibility,addFrostSupportToHand,shatterSubmittedFrost} from './frostCards.js';
import {grantStage5Entry,DESERT_PACKS} from './wishDesert.js';
import {applyTurnHandSeal,isTurnSealed} from './turnHandSeal.js';
import {TURN_HAND_SEAL_BLOCK} from '../data/stage5.js';
import {grantStage4Entry,getStage4EntryChoice,CLAUSE_LINK_PACK} from './skyIslands.js';
import {campaignCards} from '../data/cardCatalog.js';
import {operationAvailability,searchCandidates,useOperation} from './operations.js';
import {cardKind} from '../data/cardCatalog.js';
import {grantStage3Entry} from './timeCanyon.js';
import {TIME_PACKS} from '../data/language/timeLanguage.js';
import {GUIDED_VERSION,isGuided,installTutorial,tutorialPiles,guidedAllowed,recordGuided,restoreTutorialDeck} from './guidedTutorial.js';
import {createTutorial,recordTutorialAction} from './tutorial.js';
import {clone,deepFreeze,VERSIONS} from '../contracts.js';
import {registry,registryForVersion,formsForCard,createSentenceSnapshot} from '../data/language/index.js';
import {analyzeSentence} from '../engine/grammar/index.js';
import {resolveAttack} from '../engine/stage.js';
import {comboEligibility} from '../engine/comboEligibility.js';
import {deriveCombatRules} from '../engine/runes.js';
import {getEncounter,stageForRun,isCurrentCampaign} from '../data/stages.js';
import {COMBAT_BALANCE,ECONOMY} from '../data/balance.js';
import {RUNES} from '../data/runes.js';
import {generateStarterDeck,createBattlePiles,drawCards,exchangeCards,discardSentence,VOCABULARY_MODES} from './deck.js';
import {assertRunInvariants} from './invariants.js';
import {createRewardOffer,resolveReward} from './rewards.js';
import {grantStage2Entry,createShop,buyShopItem,useShopService,closeShop} from './shop.js';
import {applyProfileEvent,reviewTimeUnlocks,reviewDesertUnlocks,newProfile,validateRunState,canSaveRun} from '../services/localStore.js';

const EDITS=new Set(['ADD_CARD','RETURN_CARD','REORDER_SENTENCE','SET_FORM','SWAP_CARDS']);
const fail=(message,extra={})=>({ok:false,message,...extra});
let runSequence=0;
const freshRunId=()=>`run.${globalThis.crypto?.randomUUID?.()??`${Date.now()}.${++runSequence}`}`;
/** Only this class commits RunState. All engines receive value snapshots. */
export class RunController {
  constructor({onProfileEvent=()=>{},analyzer=analyzeSentence,attackResolver=resolveAttack,initialState=null,profile=null}={}){
    this._state=null;this.profile=clone(profile??newProfile('여행자'));this.onProfileEvent=onProfileEvent;this.analyzer=analyzer;this.attackResolver=attackResolver;this.undo=[];this.busy=false;this.operationRequest=null;
    if(initialState){validateRunState(initialState,registry);this._state=clone(initialState);}
  }
  getState(){return clone(this._state);}
  getProfile(){return clone(this.profile);}
  setProfile(profile){if(this.busy||this.operationRequest||['PRESENTING','OPERATION_PRESENTING'].includes(this._state?.combat?.phase))return fail('공격 연출 후 프로필을 바꿀 수 있습니다.');if(!profile?.playerId)return fail('프로필 ID가 없습니다.');this.profile=clone(profile);return {ok:true};}
  _profileEvent(event){this.profile=applyProfileEvent(this.profile,event);try{this.onProfileEvent(clone(event),clone(this.profile));}catch(error){console.warn('Profile persistence callback',error);}}
  _commit(next){assertRunInvariants(next,registry);this._state=next;}
  restoreRun(state){if(this.busy||this.operationRequest||['PRESENTING','OPERATION_PRESENTING'].includes(this._state?.combat?.phase))return fail('공격 연출 후 불러올 수 있습니다.');try{validateRunState(state,registry);if(!canSaveRun(state))return fail('안전 지점 저장이 아닙니다.');this._commit(clone(state));this.undo=[];return {ok:true};}catch(e){return fail(e.message);}}
  _beginBattle(next){
    const rules=clone(deriveCombatRules(COMBAT_BALANCE,next.config.character,next.config.difficulty,next.runes.orderedInstanceIds.map(id=>next.runes.instances[id]),{version:next.version,slotLimit:next.runes.slotLimit}));
    const firstBattle=next.progress.battleNumber===1;
    if(isGuided(next))rules.discardActions=1;
    const supply=createFrostSupply(next),dust=createDustSupply(next),city=createWaterwaysFrost(next);
    // Snow's existing opener witness prefers a real adjective predicate when the
    // owned deck supports one. Marker visibility alone can leave every comparison
    // head/copula beyond six turns. No cards are created, and normal fallback applies.
    const focusFrame=supply?'frame.svc.adj':firstBattle&&next.generationTrace?.generatorVersion==='0.1.1'?'frame.sv':null;
    const piles=isGuided(next)?tutorialPiles(next):createBattlePiles({activeCardIds:[...next.activeCardIds,...(supply?.temporaryCardIds.filter(id=>supply.temporaryCardMeta[id].cardKind!=='OPERATION')??[]),...(dust?.temporaryCardIds??[]),...(city?.temporaryCardIds??[])],cardInstances:next.cardInstances,stream:next.rng.deck,initialHand:rules.initialHand,previousOpeningFrames:next.openingFrames,focusFrame,tutorial:firstBattle&&next.generationTrace?.generatorVersion==='0.1.1'&&next.tutorial.visible,registry:registryForVersion(next.version)});
    if(supply){ensureFrostVisibility(piles,supply,rules,next.progress.roundIndex===4);addFrostSupportToHand(piles,supply,rules);}
    if(dust)limitOpeningDust(piles,dust);
    if(city)ensureWaterwaysFrostVisibility(piles,city);
    if(!isGuided(next))next.openingFrames.push(piles.openingTrace.frameId);
    const enemy=getEncounter(next.progress.stageId,next.progress.roundIndex,next.version);
    next.combat={...piles,...(supply??{}),...(dust??{}),...(city??{}),rulesSnapshot:clone(rules),phase:'EDIT',battleDirty:false,turnIndex:1,turnsRemaining:rules.turnLimit,exchangesRemaining:rules.discardActions,enemyState:{...enemy,maxHp:enemy.hp},actionSequence:0,settled:false,pendingAttackId:null};
    if(hasSkyCampaign(next))Object.assign(next.combat,{exhaustedIds:[],operationSequence:0,operationHistory:[],pendingOperationId:null});
    next.status='BATTLE';next.reward=null;applyTurnHandSeal(next);
  }
  _advanceTurn(next){const c=next.combat;c.phase='EDIT';c.turnIndex++;drawCards(c,c.rulesSnapshot.turnDraw,c.rulesSnapshot.handLimit,isGuided(next)?next.tutorialSession.drawStream:next.rng.deck);applyTurnHandSeal(next);}
  _settleVictory(next){
    const c=next.combat;const settlementId=`${next.runId}:${next.progress.battleNumber}:VICTORY`;
    if(!next.settlementIds.includes(settlementId)){
      const baseGold=c.enemyState.kind==='REGIONAL_BOSS'?ECONOMY.regionalBossKillGold:ECONOMY.normalKillGold;
      const turnBonusGold=next.version==='0.1.0'?0:Math.max(0,c.turnsRemaining)*ECONOMY.turnBonusPerRemainingTurn;
      c.victorySummary={settlementId,baseGold,turnsRemaining:c.turnsRemaining,turnBonusGold,totalGold:baseGold+turnBonusGold};
      next.economy.gold+=c.victorySummary.totalGold;next.settlementIds.push(settlementId);
    }
    let milestone=null;
    if(next.progress.stageId==='stage.01'&&c.enemyState.kind==='REGIONAL_BOSS'){
      next.eligibility.runOwnUnlocks=[...new Set([...next.eligibility.runOwnUnlocks,'pack.svoo','rune.svoo','rune.humanSubject'])];
      if(isCurrentCampaign(next)&&!(next.milestoneIds??[]).includes('STAGE1_CLEAR')){
        next.milestoneIds=[...(next.milestoneIds??[]),'STAGE1_CLEAR'];milestone={type:'STAGE1_CLEAR',runId:next.runId};
      }
    }
    if(['0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0'].includes(next.version)&&c.enemyState.kind==='REGIONAL_BOSS'){
      if(next.progress.stageId==='stage.02'&&!next.milestoneIds.includes('STAGE2_CLEAR')){
        next.milestoneIds.push('STAGE2_CLEAR');next.eligibility.runOwnUnlocks=[...new Set([...next.eligibility.runOwnUnlocks,...TIME_PACKS])];milestone={type:'STAGE2_CLEAR',runId:next.runId};
      }
      if(next.progress.stageId==='stage.03'&&!next.milestoneIds.includes('STAGE3_CLEAR')){next.milestoneIds.push('STAGE3_CLEAR');next.runes.slotLimit=4;if(hasSkyCampaign(next))next.eligibility.runOwnUnlocks=[...new Set([...next.eligibility.runOwnUnlocks,CLAUSE_LINK_PACK])];milestone={type:'STAGE3_CLEAR',runId:next.runId};}
    }
    if(hasDesertCampaign(next)&&c.enemyState.kind==='REGIONAL_BOSS'&&['stage.04','stage.05'].includes(next.progress.stageId)){
      const event=next.progress.stageId==='stage.04'?'STAGE4_CLEAR':'STAGE5_CLEAR';
      if(!next.milestoneIds.includes(event)){next.milestoneIds.push(event);if(event==='STAGE4_CLEAR')next.eligibility.runOwnUnlocks=[...new Set([...next.eligibility.runOwnUnlocks,...DESERT_PACKS])];milestone={type:event,version:next.version,runId:next.runId};}
    }
    if(hasSnowCampaign(next)&&c.enemyState.kind==='REGIONAL_BOSS'){const stage=next.progress.stageId;if(stage==='stage.05')next.eligibility.runOwnUnlocks=[...new Set([...next.eligibility.runOwnUnlocks,...SNOW_PACKS])];if(stage==='stage.06'&&!next.milestoneIds.includes('STAGE6_CLEAR')){next.milestoneIds.push('STAGE6_CLEAR');next.eligibility.runOwnUnlocks=[...new Set([...next.eligibility.runOwnUnlocks,SNOW_REWARD_PACK])];milestone={type:'STAGE6_CLEAR',version:next.version,runId:next.runId};}}
    if(hasEmberCampaign(next)&&c.enemyState.kind==='REGIONAL_BOSS'){if(next.progress.stageId==='stage.06')next.eligibility.runOwnUnlocks=[...new Set([...next.eligibility.runOwnUnlocks,...EMBER_PACKS])];if(next.progress.stageId==='stage.07'&&!next.milestoneIds.includes('STAGE7_CLEAR')){next.milestoneIds.push('STAGE7_CLEAR');milestone={type:'STAGE7_CLEAR',version:next.version,runId:next.runId};}}
    if(hasWaterwaysCampaign(next)&&c.enemyState.kind==='REGIONAL_BOSS'){if(next.progress.stageId==='stage.07')next.eligibility.runOwnUnlocks=[...new Set([...next.eligibility.runOwnUnlocks,...WATERWAYS_PACKS,WATERWAYS_REWARD_PACK])];if(next.progress.stageId==='stage.08'&&!next.milestoneIds.includes('STAGE8_CLEAR')){next.milestoneIds.push('STAGE8_CLEAR');milestone={type:'STAGE8_CLEAR',version:next.version,runId:next.runId};}}
    c.settled=true;c.phase='VICTORY';next.status='REWARD';cleanupTemporaryCards(next);next.reward=createRewardOffer(next,this.profile);
    return milestone;
  }
  _afterReward(next){
    if(next.progress.roundIndex===stageForRun(next).rounds.length-1){
      if(isCurrentCampaign(next)&&next.progress.stageId==='stage.01'||(['0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0'].includes(next.version)&&next.progress.stageId==='stage.02'||hasSkyCampaign(next)&&next.progress.stageId==='stage.03'||hasDesertCampaign(next)&&next.progress.stageId==='stage.04'||hasSnowCampaign(next)&&next.progress.stageId==='stage.05'||hasEmberCampaign(next)&&next.progress.stageId==='stage.06'||hasWaterwaysCampaign(next)&&next.progress.stageId==='stage.07'))next.status='STAGE_CLEAR';
      else {next.status='CONTENT_COMPLETE';next.progress.contentBoundary=next.progress.stageId==='stage.08'?'STAGE8_END':next.progress.stageId==='stage.07'?'STAGE7_END':next.progress.stageId==='stage.06'?'STAGE6_END':next.progress.stageId==='stage.05'?'STAGE5_END':next.progress.stageId==='stage.04'?'STAGE4_END':next.progress.stageId==='stage.03'?'STAGE3_END':next.progress.stageId==='stage.02'?'STAGE2_END':'STAGE1_END';}
    }
    else next.status='BETWEEN_BATTLES';
  }
  /** @param {{type:string}} command Explicit user command; invalid commands are no-ops. */
  dispatch(command){
    if(!command||typeof command.type!=='string')return fail('잘못된 명령입니다.');
    if(command.commandId!==undefined&&(typeof command.commandId!=='string'||!command.commandId||command.commandId.length>200))return fail('행동 ID가 잘못되었습니다.');
    if(this.busy)return fail('공격을 처리하고 있습니다.');
    if(this.operationRequest&&!['USE_OPERATION','CANCEL_OPERATION'].includes(command.type))return fail('탐색 선택을 끝내거나 취소하세요.');
    if(command.type==='RESUME_RUN')return this.restoreRun(command.state);
    if(command.type==='NEW_RUN'){
      if(['PRESENTING','OPERATION_PRESENTING'].includes(this._state?.combat?.phase))return fail('공격 연출을 마친 후 시작하세요.');
      try{
        const config={character:'traveler',vocabularyMode:'BEGINNER',difficulty:1,seed:String(Date.now()),...command.config};
        if(config.character!=='traveler'||config.difficulty!==1||!VOCABULARY_MODES.includes(config.vocabularyMode))return fail('지원하지 않는 원정 설정입니다.');
        config.seed=String(config.seed??Date.now()).slice(0,100);const profile=(hasDesertCampaign(VERSIONS.game)?reviewDesertUnlocks:reviewTimeUnlocks)(command.profile??this.profile);const deck=generateStarterDeck({...config,version:VERSIONS.generator});
        const next={version:VERSIONS.game,contentVersions:clone(VERSIONS),contentManifest:{id:hasWaterwaysCampaign(VERSIONS.game)?'campaign.0.8':hasEmberCampaign(VERSIONS.game)?'campaign.0.7':hasPolishCampaign(VERSIONS.game)?'campaign.0.6.1':hasSnowCampaign(VERSIONS.game)?'campaign.0.6':hasDesertCampaign(VERSIONS.game)?'campaign.0.5':'campaign.0.4',stageIds:['stage.01','stage.02','stage.03','stage.04',...(hasDesertCampaign(VERSIONS.game)?['stage.05']:[]),...(hasSnowCampaign(VERSIONS.game)?['stage.06']:[]),...(hasEmberCampaign(VERSIONS.game)?['stage.07']:[]),...(hasWaterwaysCampaign(VERSIONS.game)?['stage.08']:[])],cardDefIds:campaignCards(VERSIONS.game).filter(c=>c.runtimeReady).map(c=>c.id),runeIds:RUNES.filter(r=>r.runtimeReady).map(r=>r.id)},revision:0,runId:freshRunId(),status:'STAGE_INTRO',config:{...config,contentProfile:hasWaterwaysCampaign(VERSIONS.game)?'STAGE1_STAGE2_STAGE3_STAGE4_STAGE5_STAGE6_STAGE7_STAGE8':hasEmberCampaign(VERSIONS.game)?'STAGE1_STAGE2_STAGE3_STAGE4_STAGE5_STAGE6_STAGE7':hasSnowCampaign(VERSIONS.game)?'STAGE1_STAGE2_STAGE3_STAGE4_STAGE5_STAGE6':hasDesertCampaign(VERSIONS.game)?'STAGE1_STAGE2_STAGE3_STAGE4_STAGE5':'STAGE1_STAGE2_STAGE3_STAGE4'},progress:{stageId:'stage.01',roundIndex:0,battleNumber:1,contentBoundary:null},activeCardIds:deck.activeCardIds,cardInstances:deck.cardInstances,vocabulary:deck.vocabulary,generationTrace:deck.generationTrace,openingFrames:[],runes:{orderedInstanceIds:[],instances:{},slotLimit:3},economy:{gold:0,paidRemovalCount:0},combat:null,reward:null,shop:null,shopHistory:[],entryGrants:{},milestoneIds:[],rng:deck.rng,eligibility:{runStartUnlockBaseline:[...new Set([...RUNES.filter(r=>r.id!=='rune.svoo').map(r=>r.id),...(profile.unlocks??[])])],runOwnUnlocks:[]},tutorial:createTutorial(profile),stats:{attacks:0,preparations:0,exchanges:0,bestAttack:0,totalActualDamage:0,grammarUseCounts:{},lastAttack:null,history:[]},settlementIds:[],appliedCommandIds:[]};
        next.tutorial.visible=false;
        if(profile.guidedTutorialCompletedVersion!==GUIDED_VERSION&&profile.guidedTutorialSkippedVersion!==GUIDED_VERSION)installTutorial(next);
        this.profile=profile;this._commit(next);this.undo=[];return {ok:true};
      }catch(e){return fail(`원정을 시작하지 못했습니다: ${e.message}`);}
    }
    if(!this._state)return fail('원정을 먼저 시작하세요.');
    const current=this._state,c=current.combat;
    if(command.commandId&&current.appliedCommandIds.includes(command.commandId))return fail('이미 처리한 행동입니다.',{duplicate:true});
    if(command.expectedRevision!==undefined&&command.expectedRevision!==current.revision)return fail('이전 상태의 요청을 취소했습니다.');
    if(command.battleId&&command.battleId!==c?.enemyState.id)return fail('이전 전투의 요청을 취소했습니다.');
    const type=command.type;
    if(type==='CANCEL_OPERATION'){this.operationRequest=null;return {ok:true,noRender:true};}
    if(type==='OPEN_OPERATION'){const a=operationAvailability(current,command.sourceCardId);if(!a.ok)return a;if(a.operationType!=='SEARCH')return fail('탐색 카드가 아닙니다.');this.operationRequest={sourceCardId:command.sourceCardId,expectedRevision:current.revision,battleId:c.enemyState.id};return {ok:true,noRender:true,operationRequest:clone(this.operationRequest),candidates:searchCandidates(current)};}
    if(c?.phase==='OPERATION_PRESENTING'&&type!=='FINISH_OPERATION')return fail('운영 카드 연출 중입니다.');
    if(!guidedAllowed(current,command))return fail('현재 튜토리얼 안내에 표시된 행동을 해 주세요.');
    if(c?.phase==='PRESENTING'&&!['FINISH_PRESENTATION','TUTORIAL_GATE_ACK','TUTORIAL_RESTART','TUTORIAL_EXIT','SKIP_TUTORIAL'].includes(type))return fail('공격 연출 중입니다.');
    const next=clone(current),nc=next.combat;let result={ok:true};let profileEvents=[];let undoCandidate=null;let clearSubmitUndo=false;
    next.eligibility??={runStartUnlockBaseline:[],runOwnUnlocks:[]};
    next.eligibility.runStartUnlockBaseline??=[];next.eligibility.runOwnUnlocks??=[];
    try{
      if(type==='USE_OPERATION'){
        if(this.operationRequest&&(command.sourceCardId!==this.operationRequest.sourceCardId||command.expectedRevision!==this.operationRequest.expectedRevision||command.battleId!==this.operationRequest.battleId))return fail('이전 탐색 선택입니다.');
        result=useOperation(next,command);if(!result.ok)return result;clearSubmitUndo=true;
      }else if(type==='FINISH_OPERATION'){
        if(nc?.phase!=='OPERATION_PRESENTING'||nc.pendingOperationId!==command.effectId)return fail('이미 종료된 운영 카드 연출입니다.');nc.phase='EDIT';nc.pendingOperationId=null;
       }else if(type==='SKIP_TUTORIAL'){
        if(!isGuided(next)||command.confirmed!==true||command.sessionId!==next.tutorialSession.sessionId||command.expectedRevision!==current.revision||!command.commandId)return fail('진행 중인 튜토리얼의 확인 요청이 아닙니다.');
        const t=next.tutorialSession;
        for(const[key,value]of Object.entries(t.parked))next[key]=clone(value);
        t.active=false;t.endReason='SKIPPED';t.skipReceipt=t.sessionId+':skip';t.panel=null;t.selectedIds=[];t.attackId=null;
        delete t.parked;delete t.lastAttack;delete t.drawStream;
        next.tutorial=createTutorial(this.profile);next.tutorial.visible=false;
        this._beginBattle(next);clearSubmitUndo=true;
        profileEvents.push({type:'GUIDED_TUTORIAL_SKIPPED',version:GUIDED_VERSION,sessionId:t.sessionId});
      }else if(type==='TUTORIAL_RESTART'){
        const previous=clone(next.tutorialSession);for(const[key,value]of Object.entries(previous.parked))next[key]=clone(value);
        installTutorial(next,previous);this._beginBattle(next);this.undo=[];
      }else if(type==='TUTORIAL_EXIT'){
        for(const[key,value]of Object.entries(next.tutorialSession.parked))next[key]=clone(value);
        next.tutorialSession=null;next.combat=null;next.status='STAGE_INTRO';next.tutorial.visible=false;next.tutorialAbandoned=true;this.undo=[];
      }else if(type.startsWith('TUTORIAL_')){
        if(!isGuided(next))return fail('진행 중인 튜토리얼이 없습니다.');
        if(type==='TUTORIAL_ACK'&&next.tutorialSession.step===31){
          restoreTutorialDeck(next);this._settleVictory(next);profileEvents.push({type:'GUIDED_TUTORIAL_COMPLETED',version:GUIDED_VERSION});
        }
      }else if(type==='START_BATTLE'){if(next.tutorialAbandoned)return fail('중단한 튜토리얼은 새 원정에서 다시 시작하세요.');if(next.status!=='STAGE_INTRO'||next.progress.stageId!=='stage.01')return fail('지역 안내와 상점을 먼저 확인하세요.');this._beginBattle(next);}
      else if(type==='NEXT_STAGE'){
        if(!isCurrentCampaign(next)||next.status!=='STAGE_CLEAR'||!['stage.01',...(['0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0'].includes(next.version)?['stage.02']:[]),...(hasSkyCampaign(next)?['stage.03']:[]),...(hasDesertCampaign(next)?['stage.04']:[]),...(hasSnowCampaign(next)?['stage.05']:[]),...(hasEmberCampaign(next)?['stage.06']:[]),...(hasWaterwaysCampaign(next)?['stage.07']:[])].includes(next.progress.stageId))return fail('다음 지역으로 이동할 수 없습니다.');
        next.progress=next.progress.stageId==='stage.07'?{stageId:'stage.08',roundIndex:0,battleNumber:33,contentBoundary:null}:next.progress.stageId==='stage.06'?{stageId:'stage.07',roundIndex:0,battleNumber:28,contentBoundary:null}:next.progress.stageId==='stage.05'?{stageId:'stage.06',roundIndex:0,battleNumber:23,contentBoundary:null}:next.progress.stageId==='stage.01'?{stageId:'stage.02',roundIndex:0,battleNumber:4,contentBoundary:null}:next.progress.stageId==='stage.02'?{stageId:'stage.03',roundIndex:0,battleNumber:8,contentBoundary:null}:next.progress.stageId==='stage.04'?{stageId:'stage.05',roundIndex:0,battleNumber:18,contentBoundary:null}:{stageId:'stage.04',roundIndex:0,battleNumber:13,contentBoundary:null};next.combat=null;next.reward=null;next.status='STAGE_INTRO';this.undo=[];
      }
      else if(type==='ENTER_STAGE'){
        if(!isCurrentCampaign(next)||next.status!=='STAGE_INTRO'||!['stage.02',...(['0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0'].includes(next.version)?['stage.03']:[]),...(hasSkyCampaign(next)?['stage.04']:[]),...(hasDesertCampaign(next)?['stage.05']:[]),...(hasSnowCampaign(next)?['stage.06']:[]),...(hasEmberCampaign(next)?['stage.07']:[]),...(hasWaterwaysCampaign(next)?['stage.08']:[])].includes(next.progress.stageId))return fail('지역 입장 준비 상태가 아닙니다.');
        if(next.progress.stageId==='stage.08'){next.waterwaysEntryChoice=next.waterwaysEntryChoice??waterwaysEntryOffer(next);}else if(next.progress.stageId==='stage.07'){this._beginBattle(next);}else if(next.progress.stageId==='stage.03'){grantStage3Entry(next);this._beginBattle(next);}else if(next.progress.stageId==='stage.05'){grantStage5Entry(next);this._beginBattle(next);}else {if(next.progress.stageId==='stage.06')grantStage6Entry(next);else if(next.progress.stageId==='stage.04'){const choice=getStage4EntryChoice(next);if(choice){next.entryChoice=next.entryChoice??choice;}else grantStage4Entry(next);}else grantStage2Entry(next);if(!next.entryChoice?.pending){next.shop=createShop(next);next.status='SHOP';}}
      }
      else if(type==='CHOOSE_STAGE8_WORD'){
        const choice=next.waterwaysEntryChoice,expected=waterwaysEntryOffer(next);
        if(!choice?.pending||!expected||JSON.stringify(choice)!==JSON.stringify(expected)||next.status!=='STAGE_INTRO'||command.offerId!==choice.offerId||command.expectedRevision!==current.revision||!command.commandId||!choice.choices.includes(command.choice)||command.choice==='NONE'&&choice.needsNoneConfirmation&&command.confirmNone!==true)return fail('현재 수로도시 입장 선택을 확인하세요.');
        grantWaterwaysEntry(next,command.choice);next.shop=createShop(next);next.status='SHOP';clearSubmitUndo=true;
      }
      else if(type==='CHOOSE_STAGE4_CONNECTOR'){
        const choice=next.entryChoice,expected=getStage4EntryChoice(next);
        if(!hasPolishCampaign(next)||next.status!=='STAGE_INTRO'||next.progress.stageId!=='stage.04'||!choice?.pending||!expected||JSON.stringify(choice)!==JSON.stringify(expected)||command.choiceId!==choice.choiceId||command.entryId!==choice.entryId||command.expectedRevision!==current.revision||typeof command.commandId!=='string'||!command.commandId||!choice.cardDefIds.includes(command.cardDefId))return fail('현재 연결어 선택 요청을 확인하세요.');
        grantStage4Entry(next,{connectorCardDefId:command.cardDefId});next.entryChoice={...choice,pending:false,selectedCardDefId:command.cardDefId};next.shop=createShop(next);next.status='SHOP';clearSubmitUndo=true;
      }
      else if(type==='SHOP_BUY'||type==='SHOP_SERVICE'||type==='LEAVE_SHOP'){
        if(next.status!=='SHOP'||next.combat!==null)return fail('진행 중인 상점이 없습니다.');
        if(type==='SHOP_BUY')result=buyShopItem(next,command.shopId,command.itemId,{replaceRuneInstanceId:command.replaceRuneInstanceId});
        else if(type==='SHOP_SERVICE')result=useShopService(next,command.shopId,command.serviceKind,{targetCardInstanceId:command.targetCardInstanceId,confirmRemoval:command.confirmRemoval});
        else result=closeShop(next,command.shopId);
        if(!result.ok)return result;
        if(type==='LEAVE_SHOP')this._beginBattle(next);
      }
      else if(type==='NEXT_BATTLE'){if(next.status!=='BETWEEN_BATTLES')return fail('보상을 먼저 선택하세요.');next.progress.roundIndex++;next.progress.battleNumber++;this._beginBattle(next);}
      else if(type==='SKIP_GUIDE'){if(next.tutorial.tutorialVersion!=='0.1.1'){next.tutorial.visible=false;profileEvents.push({type:'GUIDE_SEEN'});}}
      else if(type==='SHOW_GUIDE')return fail('설정에서 별도의 연습 안내를 열어 주세요.');
      else if(type==='ACK_GUIDE_OVERVIEW'||type==='ACK_ATTACK_GUIDE'){if(!next.tutorial.visible||next.status!=='BATTLE')return fail('진행 중인 안내가 없습니다.');}
      else if(type==='CHOOSE_REWARD'||type==='SKIP_REWARD'){
        if(next.status!=='REWARD')return fail('현재 보상을 선택할 수 없습니다.');
        result=resolveReward(next,command.offerId,type==='SKIP_REWARD'?'SKIP':command.choiceId,{replaceRuneInstanceId:command.replaceRuneInstanceId,confirmRemoval:command.confirmRemoval,targetCardInstanceId:command.targetCardInstanceId});
        if(!result.ok)return result;this._afterReward(next);
        if(next.status==='CONTENT_COMPLETE'&&!hasDesertCampaign(next))profileEvents.push({type:next.progress.stageId==='stage.04'?'STAGE4_CLEAR':next.progress.stageId==='stage.03'?'STAGE3_CLEAR':next.progress.stageId==='stage.02'?'STAGE2_CLEAR':'STAGE1_CLEAR',runId:next.runId});
      }
      else if(type==='FINISH_PRESENTATION'){
        if(nc?.phase!=='PRESENTING'||nc.pendingAttackId!==command.attackId)return fail('이미 종료된 연출입니다.');nc.pendingAttackId=null;
        if(isGuided(next)&&nc.enemyState.hp===0){nc.phase='EDIT';}
        else if(nc.enemyState.hp===0){const milestone=this._settleVictory(next);if(milestone)profileEvents.push(milestone);if(next.reward.firstRuneIntro)profileEvents.push({type:'FIRST_RUNE_SHOWN'});}
        else if(nc.turnsRemaining===0){next.status='DEFEAT';nc.phase='DEFEAT';cleanupTemporaryCards(next);}
        else this._advanceTurn(next);
      }
      else if(type==='REORDER_RUNES'){
        if(!['BATTLE','BETWEEN_BATTLES','REWARD','CONTENT_COMPLETE','STAGE_CLEAR','SHOP'].includes(next.status)||next.status==='BATTLE'&&nc.phase!=='EDIT')return fail('지금은 룬 순서를 바꿀 수 없습니다.');
        const ids=command.instanceIds;if(!Array.isArray(ids)||ids.length!==next.runes.orderedInstanceIds.length||new Set(ids).size!==ids.length||ids.some(id=>!next.runes.orderedInstanceIds.includes(id)))return fail('룬 순서가 올바르지 않습니다.');
        next.runes.orderedInstanceIds=[...ids];if(next.status==='BATTLE')nc.battleDirty=true;
      }
      else {
        if(next.status!=='BATTLE'||!['EDIT','EXCHANGE_SELECT'].includes(nc?.phase))return fail('편집할 수 없는 상태입니다.');
        if(EDITS.has(type)||type==='UNDO'){
          if(nc.phase!=='EDIT')return fail('교환 선택을 끝낸 후 문장을 편집하세요.');
          undoCandidate={handIds:clone(nc.handIds),sentenceSlots:clone(nc.sentenceSlots)};
        }
        if(['ADD_CARD','SET_FORM','SWAP_CARDS'].includes(type)&&cardKind(next.cardInstances[type==='SWAP_CARDS'?command.handCardId:command.cardId],next.version)==='OBSTACLE')return fail('검은 먼지는 조합하거나 사용할 수 없습니다. 교환할 수 있습니다.');
        if(['ADD_CARD','SET_FORM','SWAP_CARDS'].includes(type)&&cardKind(next.cardInstances[type==='SWAP_CARDS'?command.handCardId:command.cardId],next.version)==='OPERATION')return fail('운영 카드는 손패의 사용 버튼으로 사용하세요.');
        if(['ADD_CARD','SWAP_CARDS'].includes(type)&&isTurnSealed(next,type==='SWAP_CARDS'?command.handCardId:command.cardId))return fail(TURN_HAND_SEAL_BLOCK);
        if(type==='ADD_CARD'){
          const at=nc.handIds.indexOf(command.cardId);if(at<0)return fail('손패의 카드를 선택하세요.');if(nc.sentenceSlots.length>=nc.rulesSnapshot.sentenceLimit)return fail('문장 조합대가 가득 찼습니다. 카드 몸통에 놓아 맞교환할 수 있습니다.');
          const index=command.index??nc.sentenceSlots.length;if(!Number.isInteger(index)||index<0||index>nc.sentenceSlots.length)return fail('삽입 위치를 확인하세요.');
          nc.handIds.splice(at,1);nc.sentenceSlots.splice(index,0,{cardInstanceId:command.cardId,selection:null});next.tutorial.step=Math.max(next.tutorial.step,1);
        }else if(type==='RETURN_CARD'){
          const at=nc.sentenceSlots.findIndex(s=>s.cardInstanceId===command.cardId);if(at<0)return fail('문장 카드를 선택하세요.');if(nc.handIds.length>=nc.rulesSnapshot.handLimit)return fail('손패가 가득 찼습니다. 손패 카드를 조합대로 옮기거나 맞교환하세요.');nc.sentenceSlots.splice(at,1);nc.handIds.push(command.cardId);
        }else if(type==='REORDER_SENTENCE'){
          const at=nc.sentenceSlots.findIndex(s=>s.cardInstanceId===command.cardId);if(at<0||!Number.isInteger(command.index)||command.index<0||command.index>nc.sentenceSlots.length)return fail('이동 위치를 확인하세요.');const [slot]=nc.sentenceSlots.splice(at,1);nc.sentenceSlots.splice(Math.min(command.index,nc.sentenceSlots.length),0,slot);
        }else if(type==='SET_FORM'){
          const slot=nc.sentenceSlots.find(s=>s.cardInstanceId===command.cardId);if(!slot||!formsForCard(next.cardInstances[command.cardId],{registry:registryForVersion(next.version)}).some(f=>f.id===command.formId))return fail('지원하는 카드 형태를 선택하세요.');slot.selection={formId:command.formId};next.tutorial.step=Math.max(next.tutorial.step,2);
        }else if(type==='SWAP_CARDS'){
          const hi=nc.handIds.indexOf(command.handCardId),si=nc.sentenceSlots.findIndex(s=>s.cardInstanceId===command.sentenceCardId);if(hi<0||si<0)return fail('손패와 문장 카드 하나씩을 선택하세요.');nc.handIds[hi]=command.sentenceCardId;nc.sentenceSlots[si]={cardInstanceId:command.handCardId,selection:null};
        }else if(type==='UNDO'){
          const prev=this.undo.at(-1);if(!prev)return fail('되돌릴 편집이 없습니다.');nc.handIds=clone(prev.handIds);nc.sentenceSlots=clone(prev.sentenceSlots);undoCandidate=null;
        }else if(type==='SET_EXCHANGE_MODE'){
          if(command.enabled&&nc.exchangesRemaining<=0)return fail('교환 횟수가 없습니다.');nc.phase=command.enabled?'EXCHANGE_SELECT':'EDIT';
        }else if(type==='EXCHANGE'){
          const ex=exchangeCards(nc,command.cardIds,nc.rulesSnapshot.handLimit,isGuided(next)?next.tutorialSession.drawStream:next.rng.deck);if(!ex.ok)return fail('교환할 손패를 1장 이상 선택하세요.');nc.phase='EDIT';nc.battleDirty=true;next.stats.exchanges++;next.tutorial.step=Math.max(next.tutorial.step,4);result.drawnIds=ex.drawnIds;clearSubmitUndo=true;
        }else if(type==='PREPARE'){
          if(nc.phase!=='EDIT')return fail('교환 선택을 먼저 끝내세요.');if(nc.turnsRemaining===1&&!command.confirmed)return fail('이대로 넘기면 패배합니다.',{needsConfirmation:true});nc.turnsRemaining--;nc.battleDirty=true;nc.actionSequence++;next.stats.preparations++;clearSubmitUndo=true;if(nc.turnsRemaining===0){next.status='DEFEAT';nc.phase='DEFEAT';cleanupTemporaryCards(next);}else this._advanceTurn(next);
        }else if(type==='SUBMIT'){
          if(nc.phase!=='EDIT'||!nc.sentenceSlots.length)return fail('문장 카드를 먼저 놓아 주세요.');if(next.tutorial.visible&&next.tutorial.tutorialVersion==='0.1.1'&&!next.tutorial.actions.explained)return fail('첫 공격 전에 점수 흐름을 확인하세요.',{needsTutorialExplanation:true});this.busy=true;
          const snapshot=createSentenceSnapshot(nc.sentenceSlots,next.cardInstances,{sentenceId:`${next.runId}.${next.progress.battleNumber}.${nc.actionSequence+1}`,languageVersion:registryForVersion(next.version).version});
          let analysis;try{analysis=this.analyzer(deepFreeze(clone(snapshot)),registryForVersion(next.version));}catch(e){analysis={status:'ENGINE_ERROR',messageKo:'판정 처리에 문제가 생겼습니다. 카드와 턴은 그대로입니다.',diagnostics:{errorId:'controller.analyzer',detail:e.message}};}
          if(!['VALID','VALID_WITH_ISSUES',...(['0.2.2','0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0'].includes(next.version)&&!isGuided(next)?['INVALID_CORE']:[])].includes(analysis?.status))return fail(['0.2.2','0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0'].includes(next.version)?'판정 처리에 문제가 생겼습니다. 카드와 턴은 그대로입니다.':analysis?.messageKo??'판정 처리에 문제가 생겼습니다.',{analysis});
          const attackId=`${next.runId}:battle.${next.progress.battleNumber}:attack.${nc.actionSequence+1}${isGuided(next)?':tutorial.'+next.tutorialSession.attempt:''}`;
          const cards=nc.sentenceSlots.map(s=>{const card=next.cardInstances[s.cardInstanceId],def=registryForVersion(next.version).cardById[card.cardDefId];return {...card,baseScore:def.baseScore,displayCategory:def.displayCategory};});
          const resolution=this.attackResolver({attackId,runId:next.runId,battleId:nc.enemyState.id,expectedRevision:current.revision,sentenceSnapshot:snapshot,analysis,cards,equippedRunes:next.runes.orderedInstanceIds.map(id=>next.runes.instances[id]),enemy:clone(nc.enemyState),temporaryCardMeta:clone(nc.temporaryCardMeta??{}),stage:stageForRun(next),policyVersion:next.version,comboEligibility:['0.2.2','0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0'].includes(next.version)?comboEligibility(next):null});
          if(!resolution?.accepted||resolution.expectedRevision!==current.revision||resolution.battleId!==nc.enemyState.id||this._state.revision!==current.revision)return fail('이전 상태의 판정 결과를 취소했습니다.');
          nc.enemyState.hp=resolution.enemyHpAfter;
          if(resolution.proposedStateEffects?.bossMechanic)nc.enemyState.bossMechanic=clone(resolution.proposedStateEffects.bossMechanic);
          if(resolution.relativeSealResult?.unlockedNow)nc.relativeSealUnlockReceipt=relativeSealReceipt(resolution);
          const shattered=shatterSubmittedFrost(nc);if(JSON.stringify(shattered)!==JSON.stringify(resolution.consumedTemporaryCardIds??[]))throw Error('Frost resolution mismatch');discardSentence(nc);nc.turnsRemaining--;nc.actionSequence++;nc.battleDirty=true;nc.phase='PRESENTING';nc.pendingAttackId=attackId;
          if(!isGuided(next)){next.stats.attacks++;next.stats.bestAttack=Math.max(next.stats.bestAttack,resolution.finalPower);next.stats.totalActualDamage+=resolution.actualHpLoss;next.stats.lastAttack=clone(resolution);next.stats.history=[clone(resolution),...next.stats.history].slice(0,12);
          for(const tag of new Set(analysis.grammarHits.filter(h=>resolution.scoreableHitIds?.includes(h.id)??true).map(h=>h.tag)))next.stats.grammarUseCounts[tag]=(next.stats.grammarUseCounts[tag]??0)+1;
          profileEvents.push({type:'ATTACK',resolution});}else next.tutorialSession.lastAttack=clone(resolution);
          next.tutorial.step=Math.max(next.tutorial.step,3);clearSubmitUndo=true;result={ok:true,resolution,analysis};
        }else return fail('알 수 없는 명령입니다.');
        if(EDITS.has(type)||type==='UNDO')nc.battleDirty=true;
      }
      if(isGuided(next)&&!['TUTORIAL_RESTART','TUTORIAL_EXIT'].includes(type))recordGuided(next,command);
      const tutorialEvent=recordTutorialAction(next,type,command);if(tutorialEvent)profileEvents.push(tutorialEvent);
      const proposedProfile=profileEvents.reduce((p,e)=>applyProfileEvent(p,e),this.profile);
      next.revision++;if(command.commandId)next.appliedCommandIds.push(command.commandId);this._commit(next);if(['START_BATTLE','NEXT_BATTLE','LEAVE_SHOP','ENTER_STAGE'].includes(type))clearSubmitUndo=true;if(type==='USE_OPERATION')this.operationRequest=null;
      if(clearSubmitUndo)this.undo=[];else if(undoCandidate)this.undo.push(undoCandidate);else if(type==='UNDO')this.undo.pop();
      this.profile=proposedProfile;for(const event of profileEvents){try{this.onProfileEvent(clone(event),clone(this.profile));}catch(error){console.warn('Profile persistence callback',error);}}return result;
    }catch(error){console.error('RunController command failed',type,error);return fail('처리 중 문제가 생겼습니다. 이전 상태를 유지합니다.',{analysis:{status:'ENGINE_ERROR',diagnostics:{errorId:`controller.${type}`,detail:error.message}}});}
    finally{this.busy=false;}
  }
}
