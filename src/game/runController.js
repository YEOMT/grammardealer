import {GUIDED_VERSION,isGuided,installTutorial,tutorialPiles,guidedAllowed,recordGuided,restoreTutorialDeck} from './guidedTutorial.js';
import {createTutorial,recordTutorialAction} from './tutorial.js';
import {clone,deepFreeze,VERSIONS} from '../contracts.js';
import {registry,registryForVersion,formsForCard,createSentenceSnapshot} from '../data/language/index.js';
import {analyzeSentence} from '../engine/grammar/index.js';
import {resolveAttack} from '../engine/stage.js';
import {deriveCombatRules} from '../engine/runes.js';
import {getEncounter,stageForRun,isCurrentCampaign} from '../data/stages.js';
import {COMBAT_BALANCE,ECONOMY} from '../data/balance.js';
import {RUNES} from '../data/runes.js';
import {generateStarterDeck,createBattlePiles,drawCards,exchangeCards,discardSentence,VOCABULARY_MODES} from './deck.js';
import {assertRunInvariants} from './invariants.js';
import {createRewardOffer,resolveReward} from './rewards.js';
import {grantStage2Entry,createShop,buyShopItem,useShopService,closeShop} from './shop.js';
import {applyProfileEvent,newProfile,validateRunState,canSaveRun} from '../services/localStore.js';

const EDITS=new Set(['ADD_CARD','RETURN_CARD','REORDER_SENTENCE','SET_FORM','SWAP_CARDS']);
const fail=(message,extra={})=>({ok:false,message,...extra});
let runSequence=0;
const freshRunId=()=>`run.${globalThis.crypto?.randomUUID?.()??`${Date.now()}.${++runSequence}`}`;
/** Only this class commits RunState. All engines receive value snapshots. */
export class RunController {
  constructor({onProfileEvent=()=>{},analyzer=analyzeSentence,attackResolver=resolveAttack,initialState=null,profile=null}={}){
    this._state=null;this.profile=clone(profile??newProfile('여행자'));this.onProfileEvent=onProfileEvent;this.analyzer=analyzer;this.attackResolver=attackResolver;this.undo=[];this.busy=false;
    if(initialState){validateRunState(initialState,registry);this._state=clone(initialState);}
  }
  getState(){return clone(this._state);}
  getProfile(){return clone(this.profile);}
  setProfile(profile){if(this.busy||this._state?.combat?.phase==='PRESENTING')return fail('공격 연출 후 프로필을 바꿀 수 있습니다.');if(!profile?.playerId)return fail('프로필 ID가 없습니다.');this.profile=clone(profile);return {ok:true};}
  _profileEvent(event){this.profile=applyProfileEvent(this.profile,event);try{this.onProfileEvent(clone(event),clone(this.profile));}catch(error){console.warn('Profile persistence callback',error);}}
  _commit(next){assertRunInvariants(next,registry);this._state=next;}
  restoreRun(state){if(this.busy||this._state?.combat?.phase==='PRESENTING')return fail('공격 연출 후 불러올 수 있습니다.');try{validateRunState(state,registry);if(!canSaveRun(state))return fail('안전 지점 저장이 아닙니다.');this._commit(clone(state));this.undo=[];return {ok:true};}catch(e){return fail(e.message);}}
  _beginBattle(next){
    const rules=clone(deriveCombatRules(COMBAT_BALANCE,next.config.character,next.config.difficulty,next.runes.orderedInstanceIds.map(id=>next.runes.instances[id])));
    const firstBattle=next.progress.battleNumber===1;
    if(isGuided(next))rules.discardActions=1;
    const piles=isGuided(next)?tutorialPiles(next):createBattlePiles({activeCardIds:next.activeCardIds,cardInstances:next.cardInstances,stream:next.rng.deck,initialHand:rules.initialHand,previousOpeningFrames:next.openingFrames,focusFrame:firstBattle&&next.generationTrace?.generatorVersion==='0.1.1'?'frame.sv':null,tutorial:firstBattle&&next.generationTrace?.generatorVersion==='0.1.1'&&next.tutorial.visible,registry:registryForVersion(next.version)});
    if(!isGuided(next))next.openingFrames.push(piles.openingTrace.frameId);
    const enemy=getEncounter(next.progress.stageId,next.progress.roundIndex,next.version);
    next.combat={...piles,rulesSnapshot:clone(rules),phase:'EDIT',battleDirty:false,turnIndex:1,turnsRemaining:rules.turnLimit,exchangesRemaining:rules.discardActions,enemyState:{...enemy,maxHp:enemy.hp},actionSequence:0,settled:false,pendingAttackId:null};
    next.status='BATTLE';next.reward=null;this.undo=[];
  }
  _advanceTurn(next){const c=next.combat;c.phase='EDIT';c.turnIndex++;drawCards(c,c.rulesSnapshot.turnDraw,c.rulesSnapshot.handLimit,isGuided(next)?next.tutorialSession.drawStream:next.rng.deck);}
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
    c.settled=true;c.phase='VICTORY';next.status='REWARD';next.reward=createRewardOffer(next,this.profile);
    return milestone;
  }
  _afterReward(next){
    if(next.progress.roundIndex===stageForRun(next).rounds.length-1){
      if(isCurrentCampaign(next)&&next.progress.stageId==='stage.01')next.status='STAGE_CLEAR';
      else {next.status='CONTENT_COMPLETE';next.progress.contentBoundary=next.progress.stageId==='stage.02'?'STAGE2_END':'STAGE1_END';}
    }
    else next.status='BETWEEN_BATTLES';
  }
  /** @param {{type:string}} command Explicit user command; invalid commands are no-ops. */
  dispatch(command){
    if(!command||typeof command.type!=='string')return fail('잘못된 명령입니다.');
    if(command.commandId!==undefined&&(typeof command.commandId!=='string'||!command.commandId||command.commandId.length>200))return fail('행동 ID가 잘못되었습니다.');
    if(this.busy)return fail('공격을 처리하고 있습니다.');
    if(command.type==='RESUME_RUN')return this.restoreRun(command.state);
    if(command.type==='NEW_RUN'){
      if(this._state?.combat?.phase==='PRESENTING')return fail('공격 연출을 마친 후 시작하세요.');
      try{
        const config={character:'traveler',vocabularyMode:'BEGINNER',difficulty:1,seed:String(Date.now()),...command.config};
        if(config.character!=='traveler'||config.difficulty!==1||!VOCABULARY_MODES.includes(config.vocabularyMode))return fail('지원하지 않는 원정 설정입니다.');
        config.seed=String(config.seed??Date.now()).slice(0,100);const profile=clone(command.profile??this.profile);const deck=generateStarterDeck(config);
        const next={version:VERSIONS.game,contentVersions:clone(VERSIONS),contentManifest:{id:'campaign.0.2',stageIds:['stage.01','stage.02'],cardDefIds:registry.cards.filter(c=>c.runtimeReady).map(c=>c.id),runeIds:RUNES.filter(r=>r.runtimeReady).map(r=>r.id)},revision:0,runId:freshRunId(),status:'STAGE_INTRO',config:{...config,contentProfile:'STAGE1_STAGE2'},progress:{stageId:'stage.01',roundIndex:0,battleNumber:1,contentBoundary:null},activeCardIds:deck.activeCardIds,cardInstances:deck.cardInstances,vocabulary:deck.vocabulary,generationTrace:deck.generationTrace,openingFrames:[],runes:{orderedInstanceIds:[],instances:{},slotLimit:3},economy:{gold:0,paidRemovalCount:0},combat:null,reward:null,shop:null,entryGrants:{},milestoneIds:[],rng:deck.rng,eligibility:{runStartUnlockBaseline:[...new Set([...RUNES.filter(r=>r.id!=='rune.svoo').map(r=>r.id),...(profile.unlocks??[])])],runOwnUnlocks:[]},tutorial:createTutorial(profile),stats:{attacks:0,preparations:0,exchanges:0,bestAttack:0,totalActualDamage:0,grammarUseCounts:{},lastAttack:null,history:[]},settlementIds:[],appliedCommandIds:[]};
        next.tutorial.visible=false;
        if(profile.guidedTutorialCompletedVersion!==GUIDED_VERSION)installTutorial(next);
        this.profile=profile;this._commit(next);this.undo=[];return {ok:true};
      }catch(e){return fail(`원정을 시작하지 못했습니다: ${e.message}`);}
    }
    if(!this._state)return fail('원정을 먼저 시작하세요.');
    const current=this._state,c=current.combat;
    if(command.commandId&&current.appliedCommandIds.includes(command.commandId))return fail('이미 처리한 행동입니다.',{duplicate:true});
    if(command.expectedRevision!==undefined&&command.expectedRevision!==current.revision)return fail('이전 상태의 요청을 취소했습니다.');
    if(command.battleId&&command.battleId!==c?.enemyState.id)return fail('이전 전투의 요청을 취소했습니다.');
    const type=command.type;
    if(!guidedAllowed(current,command))return fail('현재 실습 안내에 표시된 행동을 해 주세요.');
    if(c?.phase==='PRESENTING'&&!['FINISH_PRESENTATION','TUTORIAL_GATE_ACK','TUTORIAL_RESTART','TUTORIAL_EXIT'].includes(type))return fail('공격 연출 중입니다.');
    const next=clone(current),nc=next.combat;let result={ok:true};let profileEvents=[];let undoCandidate=null;
    try{
      if(type==='TUTORIAL_RESTART'){
        const previous=clone(next.tutorialSession);for(const[key,value]of Object.entries(previous.parked))next[key]=clone(value);
        installTutorial(next,previous);this._beginBattle(next);this.undo=[];
      }else if(type==='TUTORIAL_EXIT'){
        for(const[key,value]of Object.entries(next.tutorialSession.parked))next[key]=clone(value);
        next.tutorialSession=null;next.combat=null;next.status='STAGE_INTRO';next.tutorial.visible=false;next.tutorialAbandoned=true;this.undo=[];
      }else if(type.startsWith('TUTORIAL_')){
        if(!isGuided(next))return fail('진행 중인 실습이 없습니다.');
        if(type==='TUTORIAL_ACK'&&next.tutorialSession.step===31){
          restoreTutorialDeck(next);this._settleVictory(next);profileEvents.push({type:'GUIDED_TUTORIAL_COMPLETED',version:GUIDED_VERSION});
        }
      }else if(type==='START_BATTLE'){if(next.tutorialAbandoned)return fail('중단한 실습은 새 원정에서 다시 시작하세요.');if(next.status!=='STAGE_INTRO'||next.progress.stageId!=='stage.01')return fail('지역 안내와 상점을 먼저 확인하세요.');this._beginBattle(next);}
      else if(type==='NEXT_STAGE'){
        if(!isCurrentCampaign(next)||next.status!=='STAGE_CLEAR'||next.progress.stageId!=='stage.01')return fail('다음 지역으로 이동할 수 없습니다.');
        next.progress={stageId:'stage.02',roundIndex:0,battleNumber:4,contentBoundary:null};next.combat=null;next.reward=null;next.status='STAGE_INTRO';this.undo=[];
      }
      else if(type==='ENTER_STAGE'){
        if(!isCurrentCampaign(next)||next.status!=='STAGE_INTRO'||next.progress.stageId!=='stage.02')return fail('지역 입장 준비 상태가 아닙니다.');
        grantStage2Entry(next);next.shop=createShop(next);next.status='SHOP';
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
        if(next.status==='CONTENT_COMPLETE')profileEvents.push({type:next.progress.stageId==='stage.02'?'STAGE2_CLEAR':'STAGE1_CLEAR',runId:next.runId});
      }
      else if(type==='FINISH_PRESENTATION'){
        if(nc?.phase!=='PRESENTING'||nc.pendingAttackId!==command.attackId)return fail('이미 종료된 연출입니다.');nc.pendingAttackId=null;
        if(isGuided(next)&&nc.enemyState.hp===0){nc.phase='EDIT';}
        else if(nc.enemyState.hp===0){const milestone=this._settleVictory(next);if(milestone)profileEvents.push(milestone);if(next.reward.firstRuneIntro)profileEvents.push({type:'FIRST_RUNE_SHOWN'});}
        else if(nc.turnsRemaining===0){next.status='DEFEAT';nc.phase='DEFEAT';}
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
        if(type==='ADD_CARD'){
          const at=nc.handIds.indexOf(command.cardId);if(at<0)return fail('손패의 카드를 선택하세요.');if(nc.sentenceSlots.length>=nc.rulesSnapshot.sentenceLimit)return fail('문장 조합대가 가득 찼습니다. 카드 몸통에 놓아 맞교환할 수 있습니다.');
          const index=command.index??nc.sentenceSlots.length;if(!Number.isInteger(index)||index<0||index>nc.sentenceSlots.length)return fail('삽입 위치를 확인하세요.');
          nc.handIds.splice(at,1);nc.sentenceSlots.splice(index,0,{cardInstanceId:command.cardId,selection:null});next.tutorial.step=Math.max(next.tutorial.step,1);
        }else if(type==='RETURN_CARD'){
          const at=nc.sentenceSlots.findIndex(s=>s.cardInstanceId===command.cardId);if(at<0)return fail('문장 카드를 선택하세요.');if(nc.handIds.length>=nc.rulesSnapshot.handLimit)return fail('손패가 가득 찼습니다. 손패 카드를 조합대로 옮기거나 맞교환하세요.');nc.sentenceSlots.splice(at,1);nc.handIds.push(command.cardId);
        }else if(type==='REORDER_SENTENCE'){
          const at=nc.sentenceSlots.findIndex(s=>s.cardInstanceId===command.cardId);if(at<0||!Number.isInteger(command.index)||command.index<0||command.index>nc.sentenceSlots.length)return fail('이동 위치를 확인하세요.');const [slot]=nc.sentenceSlots.splice(at,1);nc.sentenceSlots.splice(Math.min(command.index,nc.sentenceSlots.length),0,slot);
        }else if(type==='SET_FORM'){
          const slot=nc.sentenceSlots.find(s=>s.cardInstanceId===command.cardId);if(!slot||!formsForCard(next.cardInstances[command.cardId]).some(f=>f.id===command.formId))return fail('지원하는 카드 형태를 선택하세요.');slot.selection={formId:command.formId};next.tutorial.step=Math.max(next.tutorial.step,2);
        }else if(type==='SWAP_CARDS'){
          const hi=nc.handIds.indexOf(command.handCardId),si=nc.sentenceSlots.findIndex(s=>s.cardInstanceId===command.sentenceCardId);if(hi<0||si<0)return fail('손패와 문장 카드 하나씩을 선택하세요.');nc.handIds[hi]=command.sentenceCardId;nc.sentenceSlots[si]={cardInstanceId:command.handCardId,selection:null};
        }else if(type==='UNDO'){
          const prev=this.undo.at(-1);if(!prev)return fail('되돌릴 편집이 없습니다.');nc.handIds=clone(prev.handIds);nc.sentenceSlots=clone(prev.sentenceSlots);undoCandidate=null;
        }else if(type==='SET_EXCHANGE_MODE'){
          if(command.enabled&&nc.exchangesRemaining<=0)return fail('교환 횟수가 없습니다.');nc.phase=command.enabled?'EXCHANGE_SELECT':'EDIT';
        }else if(type==='EXCHANGE'){
          const ex=exchangeCards(nc,command.cardIds,nc.rulesSnapshot.handLimit,isGuided(next)?next.tutorialSession.drawStream:next.rng.deck);if(!ex.ok)return fail('교환할 손패를 1장 이상 선택하세요.');nc.phase='EDIT';nc.battleDirty=true;next.stats.exchanges++;next.tutorial.step=Math.max(next.tutorial.step,4);result.drawnIds=ex.drawnIds;this.undo=[];
        }else if(type==='PREPARE'){
          if(nc.phase!=='EDIT')return fail('교환 선택을 먼저 끝내세요.');if(nc.turnsRemaining===1&&!command.confirmed)return fail('이대로 넘기면 패배합니다.',{needsConfirmation:true});nc.turnsRemaining--;nc.battleDirty=true;nc.actionSequence++;next.stats.preparations++;this.undo=[];if(nc.turnsRemaining===0){next.status='DEFEAT';nc.phase='DEFEAT';}else this._advanceTurn(next);
        }else if(type==='SUBMIT'){
          if(nc.phase!=='EDIT'||!nc.sentenceSlots.length)return fail('문장 카드를 먼저 놓아 주세요.');if(next.tutorial.visible&&next.tutorial.tutorialVersion==='0.1.1'&&!next.tutorial.actions.explained)return fail('첫 공격 전에 점수 흐름을 확인하세요.',{needsTutorialExplanation:true});this.busy=true;
          const snapshot=createSentenceSnapshot(nc.sentenceSlots,next.cardInstances,{sentenceId:`${next.runId}.${next.progress.battleNumber}.${nc.actionSequence+1}`,languageVersion:registryForVersion(next.version).version});
          let analysis;try{analysis=this.analyzer(deepFreeze(clone(snapshot)),registryForVersion(next.version));}catch(e){analysis={status:'ENGINE_ERROR',messageKo:'판정 처리에 문제가 생겼습니다. 카드와 턴은 그대로입니다.',diagnostics:{errorId:'controller.analyzer',detail:e.message}};}
          if(!['VALID','VALID_WITH_ISSUES'].includes(analysis?.status))return fail(analysis?.messageKo??'판정 처리에 문제가 생겼습니다.',{analysis});
          const attackId=`${next.runId}:battle.${next.progress.battleNumber}:attack.${nc.actionSequence+1}${isGuided(next)?':tutorial.'+next.tutorialSession.attempt:''}`;
          const cards=nc.sentenceSlots.map(s=>{const card=next.cardInstances[s.cardInstanceId],def=registry.cardById[card.cardDefId];return {...card,baseScore:def.baseScore,displayCategory:def.displayCategory};});
          const resolution=this.attackResolver({attackId,runId:next.runId,battleId:nc.enemyState.id,expectedRevision:current.revision,sentenceSnapshot:snapshot,analysis,cards,equippedRunes:next.runes.orderedInstanceIds.map(id=>next.runes.instances[id]),enemy:clone(nc.enemyState),stage:stageForRun(next)});
          if(!resolution?.accepted||resolution.expectedRevision!==current.revision||resolution.battleId!==nc.enemyState.id||this._state.revision!==current.revision)return fail('이전 상태의 판정 결과를 취소했습니다.');
          nc.enemyState.hp=resolution.enemyHpAfter;
          if(resolution.proposedStateEffects?.bossMechanic)nc.enemyState.bossMechanic=clone(resolution.proposedStateEffects.bossMechanic);
          discardSentence(nc);nc.turnsRemaining--;nc.actionSequence++;nc.battleDirty=true;nc.phase='PRESENTING';nc.pendingAttackId=attackId;
          if(!isGuided(next)){next.stats.attacks++;next.stats.bestAttack=Math.max(next.stats.bestAttack,resolution.finalPower);next.stats.totalActualDamage+=resolution.actualHpLoss;next.stats.lastAttack=clone(resolution);next.stats.history=[clone(resolution),...next.stats.history].slice(0,12);
          for(const tag of new Set(analysis.grammarHits.map(h=>h.tag)))next.stats.grammarUseCounts[tag]=(next.stats.grammarUseCounts[tag]??0)+1;
          profileEvents.push({type:'ATTACK',resolution});}else next.tutorialSession.lastAttack=clone(resolution);
          next.tutorial.step=Math.max(next.tutorial.step,3);this.undo=[];result={ok:true,resolution,analysis};
        }else return fail('알 수 없는 명령입니다.');
        if(EDITS.has(type)||type==='UNDO')nc.battleDirty=true;
      }
      if(isGuided(next)&&!['TUTORIAL_RESTART','TUTORIAL_EXIT'].includes(type))recordGuided(next,command);
      const tutorialEvent=recordTutorialAction(next,type,command);if(tutorialEvent)profileEvents.push(tutorialEvent);
      next.revision++;if(command.commandId)next.appliedCommandIds.push(command.commandId);this._commit(next);
      if(undoCandidate)this.undo.push(undoCandidate);else if(type==='UNDO')this.undo.pop();
      for(const event of profileEvents)this._profileEvent(event);return result;
    }catch(error){console.error('RunController command failed',type,error);return fail('처리 중 문제가 생겼습니다. 이전 상태를 유지합니다.',{analysis:{status:'ENGINE_ERROR',diagnostics:{errorId:`controller.${type}`,detail:error.message}}});}
    finally{this.busy=false;}
  }
}
