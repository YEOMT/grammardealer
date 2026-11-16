import {STAGE_BY_ID} from '../data/stages.js';
import {APP_VERSION} from '../appVersion.js';
import {soundButton} from './soundControls.js';
import './lobby.css';
import {sceneBackdrop} from '../services/sceneAssets.js';
import {fullscreenButton, startImmersiveFromGesture} from './immersive.js';
import {applyStageTheme} from './theme.js';
import { el, button, modal, heading } from './dom.js';
export function renderLobby(root,{profiles=[],activeProfile,onStart,onLoad,onProfile,onCreateProfile,onSandbox,onSettings,onRecords}={}){
  applyStageTheme(null);
  const nameInput=el('input',{id:'player-name',type:'text',maxLength:24,placeholder:'이름을 입력하세요',value:activeProfile?.displayName||'',readOnly:!!activeProfile?.displayName?.trim(),'aria-label':'플레이어 이름',autocomplete:'off'});
  const modeSelect=el('select',{id:'vocabulary-mode','aria-label':'어휘 수준'},[['BEGINNER','초급'],['STANDARD','중급'],['ADVANCED','고급'],['FREE','자유']].map(([value,text])=>el('option',{value,text,selected:activeProfile?.settings?.vocabularyMode===value})));
  const seedInput=el('input',{id:'run-seed',type:'text',maxLength:64,placeholder:'비워 두면 무작위', 'aria-label':'선택 시드'});
  const profileSelect=el('select',{'aria-label':'로컬 프로필 선택',onchange:e=>onProfile?.(e.target.value)},el('option',{value:'',text:'새 여행자'}),profiles.map(p=>el('option',{value:p.playerId,text:p.displayName,selected:p.playerId===activeProfile?.playerId})));
  const setup=el('form',{class:'setup-card',onsubmit:async e=>{e.preventDefault();startImmersiveFromGesture(e);await onStart?.({displayName:activeProfile?.displayName?.trim()?activeProfile.displayName:(nameInput.value.trim()||'여행자'),profileId:activeProfile?.playerId,character:'traveler',difficulty:1,vocabularyMode:modeSelect.value,seed:seedInput.value.trim()||undefined});}},
    el('div',{class:'setup-heading'},el('span',{class:'eyebrow',text:'YOUR EXPEDITION'}),el('h2',{text:'새로운 원정'})),
    el('div',{class:'traveler-choice'},el('span',{class:'traveler-icon',text:'🧭'}),el('div',{},el('strong',{text:'여행자'})),el('span',{class:'pill',text:'난이도 1'})),
    el('label',{class:'field'},el('span',{text:'여행자 이름'}),nameInput),
    profiles.length?el('div',{class:'profile-row'},profileSelect,button('새 프로필',()=>{nameInput.value='';profileSelect.value='';onCreateProfile?.();root.querySelector('#player-name')?.focus();},'quiet')):null,
    el('label',{class:'field'},el('span',{text:'어휘 수준'}),modeSelect,el('small',{text:'어휘만 달라집니다. 점수와 전투 규칙은 같습니다.'})),
    el('details',{class:'seed-details'},el('summary',{text:'원정 시드 직접 입력'}),seedInput),
    el('button',{type:'submit',class:'primary start-button',id:'start-run',text:'원정 시작하기  →'}),
    button('수동 저장 불러오기',onLoad,'secondary full-width'),
    el('p',{class:'local-note',text:'이 기기에 기록되는 개인 원정 · 계정 없이 플레이'}));
  const preview=el('div',{class:'hero-card-fan','aria-hidden':'true'},[['I','대명사','PRONOUN'],['make','동사','VERB'],['stories','명사','NOUN']].map(([word,pos,type],i)=>el('div',{class:`hero-word-card pos-${type} fan-${i}`},el('span',{text:pos}),el('strong',{text:word}),el('small',{text:'10  ◇'}))));
  root.replaceChildren(el('header',{class:'topbar lobby-topbar'},el('a',{class:'brand-small',href:'#lobby',text:'SYNTAX ATLAS'}),el('nav',{},soundButton(),fullscreenButton({entry:true}),button('기록',onRecords,'quiet'),button('설정',onSettings,'quiet'),el('span',{class:'version-badge',text:APP_VERSION}))),
    el('main',{class:'lobby'},el('section',{class:'hero'},el('div',{class:'eyebrow hero-eyebrow'},el('span',{class:'tiny-diamond'}),'SENTENCE BECOMES POWER'),el('h1',{},'Syntax',el('br'),el('span',{text:'Atlas'})),el('p',{class:'hero-description',text:'영단어 문장 조합 덱빌딩'}),preview,
    el('div',{class:'chapter-preview region-name-list','aria-label':'모험 지역'},Array.from({length:10},(_,i)=>el('span',{text:STAGE_BY_ID['stage.'+String(i+1).padStart(2,'0')].nameKo})))),setup),
    el('footer',{class:'lobby-footer'},el('span',{text:'The more complete your sentence, the more powerful it becomes.'}),onSandbox&&button('문장 샌드박스 ↗',onSandbox,'quiet')));
  sceneBackdrop(root,'lobby','background',{full:true});
}
