import {audio} from '../services/audio.js';
import {el,button,confirmDialog} from './dom.js';
import {isGuided,tutorialCardId as id,tutorialCommand,tutorialPanel} from '../game/guidedTutorial.js';
export const GUIDED_TEXT={
1:'첫 전투는 정해진 카드로 진행하는 조작 연습입니다. 문장을 완성해 적의 체력을 0으로 만들면 승리합니다. 다음 전투부터는 이번 원정의 덱으로 도전합니다.',
2:'아래 카드를 문장으로 조합합니다. be를 눌러 보세요.',3:'happy를 조합대의 be 뒤로 끌어다 놓으세요. 클릭으로 올려도 됩니다.',4:'올린 happy를 누르면 다시 손패로 돌릴 수 있습니다.',5:'happy를 다시 올려 봅시다.',6:'아직 ‘누가’ 행복한지 나타내는 카드가 없네요. 새 카드를 받아 봅시다.',7:'지금 쓰지 않을 run의 아래쪽 선택 체크를 누르세요.',8:'선택한 만큼 새로 받습니다. 연습에서는 교환을 한 번 쓸 수 있어요.',9:'주어로 쓸 수 있는 대명사 I가 나왔어요. 올려 보세요.',10:'I를 맨 앞으로 끌어 문장 순서를 바꿔 보세요. 아래 이동 버튼으로도 바꿀 수 있습니다.',11:'이번에는 동사 형태를 바꾸지 않고 제출해 보겠습니다. 점수가 어떻게 달라지는지 보세요.',13:'be의 형태를 고르지 않아 점수가 줄었어요. I와 함께라면 am을 씁니다. 완전한 문장 보너스도 놓쳤네요.',14:'교환하거나 공격에 사용한 카드는 DISCARD에 모입니다. 더미를 열고 닫아 보세요.',15:'내 덱에서 가진 전체 카드와 남은 재료를 확인해 보세요. 지금은 실습용 덱입니다.',16:'새 카드는 DRAW에서 받습니다. 더미가 비면 버린 카드를 섞습니다. 목록을 열고 닫아 보세요.',17:'단어 뜻이 궁금하면 사전에서 확인하세요. 실습 단어를 살펴본 뒤 닫아 보세요.',18:'룬을 얻으면 오른쪽 슬롯에 장착되어 추가 힘을 줍니다. 지금은 빈 슬롯입니다.',19:'첫 공격 뒤 he / very / fast 세 장을 받았습니다. 남은 행동은 5턴입니다.',20:'he, very, fast를 차례대로 조합대에 올려 보세요.',21:'교환을 다 썼다면 한 턴을 준비에 써서 카드를 더 받을 수 있습니다. 조합대의 카드는 남습니다.',22:'새로 받은 run을 he 뒤에 끼워 넣으세요. 아래 삽입 버튼으로도 할 수 있습니다.',23:'run의 형태 버튼을 누르세요. 같은 동사도 문장에 맞는 형태를 고를 수 있어요.',24:'He에 맞게 runs를 골라 보세요. 형태 창을 닫았다면 다시 열 수 있습니다.',25:'He runs very fast를 공격 확정해 보세요. 점수는 제출 뒤에 확인합니다.',26:'사용한 카드의 점수를 먼저 더합니다.',27:'이번에는 형태까지 맞아 완전한 문장 보너스를 받습니다!',28:'문장 구조와 수식의 힘이 더해졌어요. 이 최종 점수로 공격합니다.',30:'공격과 준비는 턴을 사용합니다. 턴 안에 적을 처치하고 남긴 턴은 추가 재화로 받습니다. 이번에는 기본 2 + 남은 3 = 5 재화입니다.',31:'이제 모험이 시작됩니다. 카드를 모으고, 룬을 조합하고, 완전한 문장으로 앞길을 열어 보세요.'};
const card=(i,part='.card-body')=>`[data-card-id="${id(i)}"] ${part}`;
export function targetSelector(run){const s=run.tutorialSession.step;return({1:'.enemy-area',2:card(0),3:card(1),4:card(1),5:card(1),6:'.hand-cards',7:card(2,'.card-select'),8:'#discard-selected',9:card(6),10:card(6),11:'#attack-submit',13:'.enemy-area',14:'.pile-discard',15:'[data-overlay=deck]',16:'.pile-button',17:'[data-overlay=dictionary]',18:'.rune-panel',19:'.turn-count',20:card([7,8,9][run.combat.sentenceSlots.length]??9),21:'.prepare-button',22:card(10),23:card(10,'.form-button'),24:card(10,'.form-button'),25:'#attack-submit',30:'.turn-count',31:'.enemy-area'})[s]??'.score-stage';}
/** Position against live DOM geometry; listeners belong to this one rendered cue. */
function placeCoach(root,bubble,selector,destination=null){
 const ring=el('div',{class:'guided-spotlight','aria-hidden':'true'}),arrow=el('div',{class:'guided-arrow','aria-hidden':'true',text:'➜'});root.append(ring,arrow);
 const drop=destination?el('div',{class:'guided-destination','aria-hidden':'true',text:'여기에 놓기'}):null;if(drop)root.append(drop);
 let frame=0;
 function place(){const target=root.querySelector(selector);if(!target){bubble.dataset.targetMissing='true';ring.hidden=true;arrow.hidden=true;return;}delete bubble.dataset.targetMissing;const b=target.getBoundingClientRect();ring.hidden=false;Object.assign(ring.style,{left:`${b.left-4}px`,top:`${b.top-4}px`,width:`${b.width+8}px`,height:`${b.height+8}px`});
  if(drop){const zone=root.querySelector('.combat-sentence'),cards=[...zone.querySelectorAll('.word-card')],at=cards[destination.index],z=(at??zone).getBoundingClientRect();Object.assign(drop.style,{left:`${at?z.left-3:z.right-14}px`,top:`${z.top+8}px`,height:`${Math.max(44,z.height-16)}px`});}
  const w=Math.min(370,innerWidth-28);bubble.style.width=`${w}px`;const h=bubble.offsetHeight||190,gap=18;
  const candidates=[{x:b.left+(b.width-w)/2,y:b.top-h-gap},{x:b.left+(b.width-w)/2,y:b.bottom+gap},{x:b.right+gap,y:b.top},{x:b.left-w-gap,y:b.top},{x:innerWidth/2-w/2,y:72},{x:12,y:b.bottom+gap},{x:innerWidth-w-12,y:b.bottom+gap},{x:12,y:b.top-h-gap},{x:innerWidth-w-12,y:b.top-h-gap}];
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));const rects=candidates.map(p=>({x:clamp(p.x,12,innerWidth-w-12),y:clamp(p.y,62,innerHeight-h-12)}));const area=(p,r)=>Math.max(0,Math.min(p.x+w,r.right)-Math.max(p.x,r.left))*Math.max(0,Math.min(p.y+h,r.bottom)-Math.max(p.y,r.top));const protectedRects=[...root.querySelectorAll('.word-card')].map(n=>n.getBoundingClientRect());const overlap=p=>area(p,b)*100+protectedRects.reduce((sum,r)=>sum+area(p,r),0);rects.sort((a,c)=>overlap(a)-overlap(c));const p=rects[0];Object.assign(bubble.style,{left:`${p.x}px`,top:`${p.y}px`,width:`${w}px`});
  Object.assign(arrow.style,{left:`${clamp(b.left-30,0,innerWidth-32)}px`,top:`${clamp(b.top+b.height/2-16,0,innerHeight-36)}px`});
 }
 const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(place);};place();const observer=new ResizeObserver(update);observer.observe(root);observer.observe(bubble);window.addEventListener('resize',update);window.addEventListener('scroll',update,true);window.addEventListener('orientationchange',update);
 return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',update);window.removeEventListener('scroll',update,true);window.removeEventListener('orientationchange',update);ring.remove();arrow.remove();drop?.remove();};
}
export function attachGuidedCoach(root,run,command,{onInterrupt}={}){
 if(!isGuided(run))return()=>{};const t=run.tutorialSession,s=t.step;
 const send=cmd=>command(tutorialCommand(run,cmd));
 const actions=el('div',{class:'guided-actions'});
 if([1,6,13,18,19,30,31].includes(s))actions.append(button(s===31?'모험 시작':'확인',()=>send({type:'TUTORIAL_ACK'}),'primary',{id:'guided-confirm'}));
 if(s===10)actions.append(button('I를 맨 앞으로 이동',()=>send({type:'REORDER_SENTENCE',cardId:id(6),index:0}),'secondary',{id:'guided-move'}));
 if(s===22)actions.append(button('run을 he 뒤에 삽입',()=>send({type:'ADD_CARD',cardId:id(10),index:1}),'secondary',{id:'guided-insert'}));
 if(onInterrupt)actions.append(button('실습 다시 시작',()=>confirmDialog('실습 다시 시작','진행 중인 실습은 완료로 기록되지 않습니다. 같은 카드로 다시 시작할까요?','다시 시작',()=>onInterrupt('restart')),'quiet',{id:'guided-restart'}),button('나가기',()=>confirmDialog('실습 나가기','완료나 보상 없이 로비로 돌아갑니다. 나중에 실습을 다시 시작할 수 있습니다.','실습 나가기',()=>onInterrupt('exit')),'quiet',{id:'guided-exit'}));
 const bubble=el('aside',{class:'guided-coach','aria-live':'polite',dataset:{tutorialStep:String(s)}},el('strong',{text:`필수 조작 실습 · ${s} / 32`}),el('p',{text:GUIDED_TEXT[s]??'공격 결과를 읽어 주세요.'}),actions);
 root.append(bubble);const clean=placeCoach(root,bubble,targetSelector(run),[3,10,22].includes(s)?{index:s===10?0:1}:null);return()=>{clean();bubble.remove();};
}
export function showScoreGate(root,gate,{confirm,onInterrupt,signal}){
 return new Promise((resolve,reject)=>{let disposed=false;
  const close=()=>{if(disposed)return;disposed=true;cleanup();bubble.remove();signal?.removeEventListener('abort',abort);};
  const abort=()=>{close();resolve();};
  const bubble=el('aside',{class:'guided-coach guided-gate',dataset:{cueId:gate.cueId,attackId:gate.attackId}},el('strong',{text:`점수 확인 · ${gate.value}`}),el('p',{text:GUIDED_TEXT[Number(gate.cueId.slice(1))]}),el('div',{class:'guided-actions'},button('확인 · 계속',()=>{if(disposed||!confirm())return;close();resolve();},'primary',{id:'guided-gate-confirm'}),button('이번 공격 음소거',()=>audio.configure({muted:true}),'quiet'),button('실습 다시 시작',()=>confirmDialog('실습 다시 시작','이번 실습을 처음부터 다시 시작할까요?','다시 시작',()=>onInterrupt('restart')),'quiet'),button('나가기',()=>confirmDialog('실습 나가기','완료로 기록하지 않고 로비로 돌아갑니다.','실습 나가기',()=>onInterrupt('exit')),'quiet')));
  root.append(bubble);const cleanup=placeCoach(root,bubble,'.score-stage');signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 });
}
