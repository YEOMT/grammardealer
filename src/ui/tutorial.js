import {attachGuidedCoach,showScoreGate} from './guidedCoach.js';
import {tutorialCommand,isGuided} from '../game/guidedTutorial.js';
import {openDeck,openDictionary} from './overlays.js';
import {el,button,modal,toast} from './dom.js';
import {tutorialStep} from '../game/tutorial.js';
import {RunController} from '../game/runController.js';
import {renderCombat} from './combat.js';
import {playAttack,createDOMPresentation} from '../engine/presentation.js';
export function explainFirstAttack(confirm){let view;view=modal('첫 공격 · 점수가 만들어지는 순서',[
 el('p',{class:'body-copy',text:'카드 점수 → 형태/문법 확인 → 문형·룬으로 증폭 → 최종 피해로 공격합니다. 지금은 룬이 없어도 문장 콤보가 점수를 올려요.'}),
 el('p',{class:'helper',text:'확인하면 현재 조합한 문장을 실제로 제출합니다. 아직 점수나 문법 결과를 계산하지 않았습니다.'}),
 el('div',{class:'dialog-actions'},button('조합대로 돌아가기',()=>view.close(),'secondary'),button('확인하고 공격',()=>{view.close();confirm();},'primary',{id:'confirm-first-attack'}))]);return view;}
export function attachTutorial(root,state,command){const t=state.tutorial;if(!t?.visible||t.tutorialVersion!=='0.1.1'||state.progress.battleNumber!==1)return()=>{};
 const step=tutorialStep(t),be=state.combat.sentenceSlots.find(s=>state.cardInstances[s.cardInstanceId].cardDefId==='card.be');
 const selectors=['.hand-cards','.combat-sentence',be?`[data-card-id="${be.cardInstanceId}"] .form-button`:'.hand-cards','#discard-selected','.prepare-button','#attack-submit','.enemy-area'];
 const texts=[
 '손패의 단어로 가운데 문장을 만들고 위의 적을 공격합니다. 행동은 6턴, 교환은 4회입니다.',
 '실제 손패의 주어·be·형용사를 본체 클릭이나 드래그로 조합해 보세요. 다른 문장도 자유롭게 만들 수 있습니다.',
 be?'be 카드의 「형태」를 눌러 주어에 맞는 am / is / are를 직접 선택하세요.':'be를 조합대에 올리면 형태 버튼이 생깁니다. 이미 다른 곳으로 옮겼다면 다른 합법 문장으로 계속해도 됩니다.',
 state.combat.exchangesRemaining?'남은 손패의 ○를 체크한 뒤 버리기를 누르세요. 같은 수만큼 보충하고 교환만 1회 줄어듭니다.':'남은 교환이 없습니다. 가이드를 건너뛰거나 현재 카드로 자유롭게 계속할 수 있습니다.',
 state.combat.handIds.length>=state.combat.rulesSnapshot.handLimit?'손패가 가득 찼습니다. 카드 일부를 조합대로 옮긴 뒤 준비하면 빈자리만큼 받습니다. 준비는 실제 턴을 씁니다.':'문장은 조합대에 그대로 둔 채 「준비」를 한 번 눌러 보세요. 행동 1턴을 쓰고 다음 턴 카드를 받습니다.',
 '공격 확정을 누르면 제출 직전에 점수가 만들어지는 순서를 한 번 설명합니다. 결과는 확정 후에만 공개됩니다.',
 '적 HP와 남은 턴을 확인하세요. 이제 자유롭게 문장을 만드세요.'
 ];
 const target=root.querySelector(selectors[step]||'#attack-submit')||root.querySelector('.combat-actions');target?.classList.add('tutorial-target');
 const bubble=el('aside',{class:'tutorial-bubble',role:'status','aria-live':'polite'},el('strong',{text:`첫 원정 안내 · ${Math.max(1,step+1)} / 7`}),el('p',{text:texts[step]||texts[6]}),el('div',{class:'tutorial-actions'},step===0&&button('시작해 보기',()=>command({type:'ACK_GUIDE_OVERVIEW'}),'secondary'),button('안내 건너뛰기',()=>command({type:'SKIP_GUIDE'}),'quiet')));
 root.append(bubble);
 const place=()=>{const top=root.querySelector('.enemy-area')?.getBoundingClientRect().top??66;Object.assign(bubble.style,{left:`${Math.max(12,root.getBoundingClientRect().left+14)}px`,top:`${top}px`,width:`${Math.min(310,innerWidth-32)}px`});};place();window.addEventListener('resize',place);
 return()=>{target?.classList.remove('tutorial-target');bubble.remove();window.removeEventListener('resize',place);};
}
/** Ephemeral controller/profile. No persistence callback and no access to the live run. */
export function openTutorialPractice(liveRoot){
 const practice=new RunController();practice.dispatch({type:'NEW_RUN',config:{seed:'practice.0.2.1'}});practice.dispatch({type:'START_BATTLE'});
 const board=el('div'),overlay=el('section',{class:'practice-overlay'},el('header',{class:'practice-header'},el('strong',{text:'조작 연습 · 원정/재화/기록에 반영되지 않습니다'}),button('연습 닫기',()=>interrupt('exit'),'secondary',{id:'close-practice'})),board);
 let clean=()=>{},busy=false,abort=null,closed=false;
 function close(){closed=true;abort?.abort();clean();overlay.remove();liveRoot.inert=false;}
 function interrupt(mode){abort?.abort();if(mode==='exit'){close();return;}practice.dispatch(tutorialCommand(practice.getState(),{type:'TUTORIAL_RESTART',confirmed:true}));if(!busy)render();}
 function openOverlay(kind){const s=practice.getState();if(!['deck','draw','discard','dictionary'].includes(kind))return;const r=practice.dispatch(tutorialCommand(s,{type:'TUTORIAL_PANEL_OPEN',kind}));if(!r.ok)return;const view=kind==='dictionary'?openDictionary(s):openDeck(s,kind==='deck'?'all':kind),opened=practice.getState();view.dialog.addEventListener('close',()=>{practice.dispatch(tutorialCommand(opened,{type:'TUTORIAL_PANEL_CLOSE',kind}));render();},{once:true});}
 async function present(before,resolution){
  busy=true;clean();const view=renderCombat(board,before,{locked:true});clean=view.cleanup;view.beginPresentation();abort=new AbortController();const signal=abort.signal;
  const result=await playAttack(resolution,createDOMPresentation(view.element),{guided:true,speed:1,signal,waitForGate:practice.getState().tutorialSession.attackCount===2?gate=>{const s=practice.getState();if(s.tutorialSession.completedSteps.includes(Number(gate.cueId.slice(1))))return;return showScoreGate(board,gate,{signal,onInterrupt:interrupt,confirm:()=>practice.dispatch({...tutorialCommand(s,{type:'TUTORIAL_GATE_ACK',attackId:gate.attackId}),cueId:gate.cueId}).ok});}:undefined});
  busy=false;abort=null;if(closed)return;
  if(result.status==='FINISHED')practice.dispatch({type:'FINISH_PRESENTATION',attackId:resolution.attackId});
  else if(practice.getState().combat.pendingAttackId===resolution.attackId){let view;view=modal('실습 연출 중단',[button('같은 결과 다시 보기',()=>{view.close();present(before,resolution);},'primary'),button('다시 시작',()=>{view.close();interrupt('restart');},'secondary'),button('연습 닫기',()=>{view.close();close();},'quiet')],{closeable:false});return;}render();
 }
 async function command(cmd){if(busy||closed)return{ok:false};const before=practice.getState(),result=practice.dispatch(cmd.sessionId?cmd:tutorialCommand(before,cmd));if(!result.ok){toast(result.message);return result;}if(result.resolution)await present(before,result.resolution);else render();return result;}
 function render(){if(closed)return;clean();const s=practice.getState();if(s.status!=='BATTLE'){board.replaceChildren(el('main',{class:'intro-page'},el('h2',{text:'연습을 마쳤습니다'}),button('원래 화면으로 돌아가기',close,'primary')));return;}
  const view=renderCombat(board,s,{command,openOverlay});const guide=attachGuidedCoach(board,s,command,{onInterrupt:interrupt});clean=()=>{view.cleanup();guide();};}
 liveRoot.inert=true;document.body.append(overlay);render();return{close,controller:practice};
}
