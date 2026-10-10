import {presentOperation} from './ui/operationPresentation.js';
import {isGuided,tutorialCommand,tutorialPanel} from './game/guidedTutorial.js';
import {attachGuidedCoach,showScoreGate,skipTutorialButton} from './ui/guidedCoach.js';
import {wordCard} from './ui/cards.js';
import {cardModel,operationPolishPreview} from './ui/models.js';
import {attachTutorial,explainFirstAttack,openTutorialPractice} from './ui/tutorial.js';
import './ui/styles.css';
import { renderLobby } from './ui/lobby.js';
import { renderSandbox } from './ui/sandbox.js';
import { renderCombat } from './ui/combat.js';
import { renderIntro, renderStageClear, renderReward, renderBetween, renderResult } from './ui/progression.js';
import { renderShop } from './ui/shop.js';
import { openDeck, openDictionary, openRecords, openSettings, openSaves, openRecentAttack } from './ui/overlays.js';
import { el, button, modal, toast, confirmDialog } from './ui/dom.js';
import { playAttack, createDOMPresentation, connect } from './engine/presentation.js';
import { audio } from './services/audio.js';
import { registry } from './data/language/index.js';
import { RunController } from './game/runController.js';
import { LocalStore, newProfile } from './services/localStore.js';

const root=document.querySelector('#app');
const store=new LocalStore({registry});
let profiles=[],profile=null,controller=null,cleanup=()=>{},combatView=null,presenting=false,selected=new Set(),saveQueue=Promise.resolve(),memoryWarning=false,starting=false;
const defaultSettings={speed:1,sfxVolume:45,muted:false,effectsOff:false};
let presentationAbort=null,presentationEpoch=0;
let sessionSettings={...defaultSettings};
const settings=()=>profile?.settings||sessionSettings;
function applySettings(){const s=settings();audio.configure({muted:s.muted,volume:s.sfxVolume/100});document.body.classList.toggle('effects-off',s.effectsOff);}
function persistProfile(next){profile=next;profiles=profiles.filter(p=>p.playerId!==next.playerId).concat(next);applySettings();if(!store.available)return Promise.resolve();const frozen=structuredClone(next);saveQueue=saveQueue.catch(()=>{}).then(()=>store.saveProfile(frozen)).catch(error=>{toast(`개인 기록을 저장하지 못했습니다. 플레이는 계속할 수 있습니다. ${error.message}`);});return saveQueue;}
function newController(){controller=new RunController({profile,onProfileEvent:(_event,next)=>{void persistProfile(next);}});}
function changeRoute(route){if(location.hash===`#${route}`)render();else location.hash=route;}
async function startRun(config,{sameSeed=false}={}){
  if(starting||presenting)return;starting=true;void audio.unlock();
  try{
    if(!profile||config.profileId!==profile.playerId){const p=newProfile(config.displayName||'여행자');p.settings={...sessionSettings,vocabularyMode:config.vocabularyMode||'BEGINNER'};await persistProfile(p);}
    else {profile={...profile,displayName:config.displayName||profile.displayName,settings:{...profile.settings,vocabularyMode:config.vocabularyMode||profile.settings.vocabularyMode}};await persistProfile(profile);}
    newController();const result=controller.dispatch({type:'NEW_RUN',config:{character:'traveler',difficulty:1,vocabularyMode:config.vocabularyMode||'BEGINNER',...(config.seed?{seed:config.seed}:{})},profile});
    if(!result.ok){toast(result.message);return;}selected.clear();changeRoute('game');
  }finally{starting=false;}
}
async function runCommand(command){
  if(presenting)return{ok:false,message:'공격 연출 중입니다.'};
  void audio.unlock();const before=controller.getState();if(['CHOOSE_STAGE4_CONNECTOR','CHOOSE_STAGE8_WORD'].includes(command.type))command={...command,expectedRevision:before.revision,commandId:`entry.choice.${before.runId}.${before.revision}`};const result=controller.dispatch(command.sessionId?command:tutorialCommand(before,command));
  if(!result.ok){
    if(result.needsTutorialExplanation){explainFirstAttack(()=>{controller.dispatch({type:'ACK_ATTACK_GUIDE'});runCommand(command);});return result;}
    if(result.needsConfirmation&&command.type==='PREPARE')confirmDialog('마지막 행동 턴','이대로 넘기면 패배합니다. 마지막 턴을 준비에 사용하시겠습니까?','턴 넘기기',()=>runCommand({...command,confirmed:true}));
    else if(!result.needsReplacement&&!result.needsConfirmation){toast(result.message||'이 행동을 처리하지 못했습니다.');if(result.analysis)combatView?.showAnalysis(result.analysis);}
    return result;
  }
  if(result.noRender)return result;
  if(result.operationEffect){await presentOperationResult(before,result.operationEffect);return result;}
  if(['ADD_CARD','RETURN_CARD','SET_FORM','SWAP_CARDS','REORDER_SENTENCE','EXCHANGE','UNDO'].includes(command.type))audio.play('card');
  if(result.rewardEffect){
    const e=result.rewardEffect;presenting=true;let view;view=modal('연마 완료',[el('div',{class:'polish-result'},wordCard(cardModel({instanceId:e.cardInstanceId,cardDefId:e.cardDefId,polishLevel:e.afterLevel},null,before.version),{readonly:true}),el('h3',{text:`연마 +${e.beforeLevel} → +${e.afterLevel}`}),el('p',{text:e.beforeOperation?operationPolishPreview(cardModel({instanceId:e.cardInstanceId,cardDefId:e.cardDefId,polishLevel:e.beforeLevel},null,before.version)):`카드 점수 ${e.beforeScore} → ${e.afterScore} · 기본 10 + 연마 ${e.afterLevel*5}`}),button('확인',()=>{view.close();presenting=false;render();},'primary',{id:'confirm-polish-result'}))],{closeable:false});return result;
  }
  if(result.resolution){
    await presentResolution(before,result.resolution);
  }else{if(['EXCHANGE','PREPARE','NEXT_BATTLE','START_BATTLE'].includes(command.type))selected.clear();else for(const id of selected)if(!controller.getState().combat?.handIds.includes(id))selected.delete(id);render();}
  return result;
}
async function presentOperationResult(before,effect){
 presenting=true;cleanup();combatView=renderCombat(root,before,{command:runCommand,openOverlay,selected,locked:true});cleanup=combatView.cleanup;
 const source=[...root.querySelectorAll('[data-card-id]')].find(n=>n.dataset.cardId===effect.sourceCardId);
 try{await presentOperation(effect,{sourceElement:source,audio,effectsOff:settings().effectsOff,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,showAfter:()=>{cleanup();combatView=renderCombat(root,controller.getState(),{command:runCommand,openOverlay,selected,locked:true});cleanup=combatView.cleanup;return combatView.element;}});}
 finally{controller.dispatch({type:'FINISH_OPERATION',effectId:effect.effectId});selected.clear();presenting=false;render();}
}
async function interruptTutorial(mode){
 const state=controller.getState();if(!isGuided(state))return;
 const result=controller.dispatch(tutorialCommand(state,{type:mode==='skip'?'SKIP_TUTORIAL':mode==='restart'?'TUTORIAL_RESTART':'TUTORIAL_EXIT',commandId:`${state.tutorialSession.sessionId}:${mode}:${state.revision}`,confirmed:true}));
 if(!result.ok){toast(result.message);return;}presentationEpoch++;presentationAbort?.abort();presentationAbort=null;presenting=false;selected.clear();
 if(mode==='exit')changeRoute('lobby');else render();
}
async function presentResolution(before,resolution){
 selected.clear();presenting=true;cleanup();combatView=renderCombat(root,before,{command:runCommand,openOverlay,selected,locked:true});cleanup=combatView.cleanup;combatView.beginPresentation();
 const epoch=++presentationEpoch,owner=controller;const guided=isGuided(before);if(guided){const skip=skipTutorialButton(interruptTutorial);skip.id='guided-skip-live';skip.classList.add('tutorial-skip-live');combatView.element.append(skip);}presentationAbort=new AbortController();const signal=presentationAbort.signal;
 const waitForGate=guided&&controller.getState().tutorialSession.attackCount===2?async gate=>{
  const current=controller.getState();if(!isGuided(current)||current.tutorialSession.completedSteps.includes(Number(gate.cueId.slice(1))))return;
  return showScoreGate(root,gate,{signal,onInterrupt:interruptTutorial,confirm:()=>controller.dispatch({...tutorialCommand(current,{type:'TUTORIAL_GATE_ACK',attackId:gate.attackId}),cueId:gate.cueId}).ok});
 }:undefined;
 const outcome=await playAttack(resolution,createDOMPresentation(combatView.element,{audio,hpMax:before.combat.enemyState.maxHp}),{guided,waitForGate,signal,speed:guided?1:settings().speed,effectsOff:settings().effectsOff,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
 if(epoch!==presentationEpoch||owner!==controller)return;
 presentationAbort=null;presenting=false;
 if(!guided||outcome.status==='FINISHED')controller.dispatch({type:'FINISH_PRESENTATION',attackId:resolution.attackId});
 const stillPending=controller.getState()?.combat?.pendingAttackId===resolution.attackId;
 if(guided&&outcome.status==='INTERRUPTED'&&stillPending){
  let recovery;recovery=modal('튜토리얼 연출을 중단했습니다',[el('p',{text:'같은 공격 결과를 다시 보여드립니다. 피해와 재화는 다시 계산하지 않습니다.'}),button('같은 결과 다시 보기',()=>{recovery.close();presentResolution(before,resolution);},'primary'),button('튜토리얼 다시 시작',()=>{recovery.close();interruptTutorial('restart');},'secondary'),button('튜토리얼 나가기',()=>{recovery.close();interruptTutorial('exit');},'quiet')],{closeable:false});return;
 }
 render();
}
function leaveToLobby(){if(presenting)return;const state=controller?.getState();if(isGuided(state)){confirmDialog('튜토리얼 나가기','완료나 보상 없이 로비로 돌아갑니다.','튜토리얼 나가기',()=>interruptTutorial('exit'));return;}if(state?.status==='BATTLE')confirmDialog('로비로 돌아가기','진행 중인 원정은 수동 저장한 지점까지만 다시 불러올 수 있습니다. 로비로 돌아가시겠습니까?','로비로',()=>changeRoute('lobby'));else changeRoute('lobby');}
function openOverlay(kind){
  if(presenting)return;const state=controller?.getState();
  if(isGuided(state)&&['dictionary','deck','draw','discard'].includes(kind)){
   const result=controller.dispatch(tutorialCommand(state,{type:'TUTORIAL_PANEL_OPEN',kind}));if(!result.ok){toast(result.message);return;}
   const panel=kind==='dictionary'?openDictionary(state):openDeck(state,kind==='deck'?'all':kind);
   const opened=controller.getState();panel.dialog.addEventListener('close',()=>{const r=controller.dispatch(tutorialCommand(opened,{type:'TUTORIAL_PANEL_CLOSE',kind}));if(r.ok)render();},{once:true});return panel;
  }
  if(kind==='dictionary')return openDictionary(state);
  if(kind==='deck'||kind==='draw'||kind==='discard'||kind==='exhausted')return openDeck(state,kind==='deck'?'all':kind);
  if(kind==='records')return openRecords(profile,state);
  if(kind==='recent')return openRecentAttack(state);
  if(kind==='settings')return openSettings(settings(),async next=>{sessionSettings={...next};if(profile){profile={...profile,settings:{...profile.settings,...next}};if(controller?.setProfile)controller.setProfile(profile);else if(controller)controller.profile=structuredClone(profile);await persistProfile(profile);}applySettings();},()=>openTutorialPractice(root));
  if(kind==='saves'){
    if(!profile){toast('프로필을 선택하거나 원정을 먼저 시작하세요.');return;}
    return openSaves({store,profile,state,onLoad:async loaded=>{newController();const result=controller.dispatch({type:'RESUME_RUN',state:loaded});if(!result.ok)throw Error(result.message);selected.clear();changeRoute('game');}});
  }
  if(kind==='lobby')return leaveToLobby();
}
function render(){
  if(presenting){if(location.hash!=='#game')location.hash='game';return;}
  if(controller?.operationRequest)controller.dispatch({type:'CANCEL_OPERATION'});
  cleanup();cleanup=()=>{};combatView=null;document.querySelectorAll('dialog.app-dialog').forEach(d=>d.close());applySettings();
  if(import.meta.env.DEV&&location.hash==='#sandbox'){
    cleanup=renderSandbox(root,{onBack:()=>changeRoute('lobby'),presentationSample:(board,ids)=>{connect(board,ids[0],ids.slice(1));}});return;
  }
  const state=controller?.getState();
  if(location.hash==='#game'&&state){
    if(state.status==='STAGE_INTRO'){renderIntro(root,state,{onStart:()=>runCommand({type:state.progress.stageId==='stage.01'?'START_BATTLE':'ENTER_STAGE'}),onLobby:leaveToLobby,onDeck:()=>openOverlay('deck'),onRecords:()=>openOverlay('records'),onSaves:()=>openOverlay('saves'),onChooseConnector:payload=>runCommand({type:'CHOOSE_STAGE4_CONNECTOR',...payload}),onChooseWaterways:payload=>runCommand({type:'CHOOSE_STAGE8_WORD',...payload})});return;}
    if(state.status==='STAGE_CLEAR'){renderStageClear(root,state,{onNext:()=>runCommand({type:'NEXT_STAGE'}),onSaves:()=>openOverlay('saves'),onDeck:()=>openOverlay('deck'),onLobby:leaveToLobby});return;}
    if(state.status==='SHOP'){cleanup=renderShop(root,state,{command:runCommand,onSaves:()=>openOverlay('saves'),onDeck:()=>openOverlay('deck'),onDictionary:()=>openOverlay('dictionary'),onRecords:()=>openOverlay('records'),onLobby:leaveToLobby});return;}
    if(state.status==='BATTLE'){combatView=renderCombat(root,state,{command:runCommand,openOverlay,selected,onTutorialSkip:()=>runCommand({type:'SKIP_GUIDE'})});const guide=isGuided(state)?attachGuidedCoach(root,state,runCommand,{onInterrupt:interruptTutorial}):attachTutorial(root,state,runCommand);cleanup=()=>{combatView?.cleanup();guide();};return;}
    if(state.status==='REWARD'){cleanup=renderReward(root,state,{command:runCommand,onSaves:()=>openOverlay('saves'),onDeck:()=>openOverlay('deck'),onLobby:leaveToLobby});return;}
    if(state.status==='BETWEEN_BATTLES'){renderBetween(root,state,{onNext:()=>runCommand({type:'NEXT_BATTLE'}),onSaves:()=>openOverlay('saves'),onDeck:()=>openOverlay('deck'),onLobby:leaveToLobby});return;}
    if(state.status==='CONTENT_COMPLETE'||state.status==='DEFEAT'){renderResult(root,state,{onNew:()=>startRun({displayName:profile.displayName,profileId:profile.playerId,vocabularyMode:state.config.vocabularyMode}),onRetrySeed:()=>startRun({displayName:profile.displayName,profileId:profile.playerId,...state.config}),onLoad:()=>openOverlay('saves'),onSaves:()=>openOverlay('saves'),onLobby:leaveToLobby,onRecords:()=>openOverlay('records')});return;}
  }
  renderLobby(root,{profiles,activeProfile:profile,onStart:startRun,onLoad:()=>openOverlay('saves'),onSettings:()=>openOverlay('settings'),onRecords:()=>openOverlay('records'),onSandbox:import.meta.env.DEV?()=>changeRoute('sandbox'):null,onProfile:id=>{profile=profiles.find(p=>p.playerId===id)||null;controller=null;render();},onCreateProfile:()=>{profile=null;controller=null;render();}});
}
window.addEventListener('hashchange',render);
window.addEventListener('error',event=>{console.error('Application error',event.error);toast('화면 처리에 문제가 생겼습니다. 로비로 돌아가 다시 시도할 수 있습니다.');});
if(import.meta.env.DEV&&new URLSearchParams(location.search).get('debug')==='1')Object.defineProperty(window,'__SB_DEV__',{value:{getState:()=>controller?.getState(),getProfile:()=>profile},writable:false});
root.replaceChildren(el('main',{class:'intro-page'},el('h1',{text:'신택스 아틀라스'}),el('p',{text:'원정 기록을 불러오고 있습니다…'})));
try{await store.init();profiles=await store.listProfiles();profile=profiles[0]||null;}catch(error){memoryWarning=true;console.warn('Local persistence unavailable',error);}
render();if(memoryWarning)toast('로컬 저장소를 사용할 수 없습니다. 현재 탭에서 플레이는 계속할 수 있습니다.');
