import { el, button, modal, heading } from './dom.js';
export function renderLobby(root,{profiles=[],activeProfile,onStart,onLoad,onProfile,onCreateProfile,onSandbox,onSettings,onRecords}={}){
  const nameInput=el('input',{id:'player-name',type:'text',maxLength:24,placeholder:'이름을 입력하세요',value:activeProfile?.displayName||'','aria-label':'플레이어 이름',autocomplete:'off'});
  const modeSelect=el('select',{id:'vocabulary-mode','aria-label':'어휘 수준'},[['BEGINNER','초급 · 익숙한 단어'],['STANDARD','기본 · 어휘 넓히기'],['ADVANCED','심화 · 도전하는 단어'],['FREE','자유 · 모든 어휘']].map(([value,text])=>el('option',{value,text,selected:activeProfile?.settings?.vocabularyMode===value})));
  const seedInput=el('input',{id:'run-seed',type:'text',maxLength:64,placeholder:'비워 두면 무작위', 'aria-label':'선택 시드'});
  const profileSelect=el('select',{'aria-label':'로컬 프로필 선택',onchange:e=>onProfile?.(e.target.value)},el('option',{value:'',text:'새 여행자'}),profiles.map(p=>el('option',{value:p.playerId,text:p.displayName,selected:p.playerId===activeProfile?.playerId})));
  const setup=el('form',{class:'setup-card',onsubmit:async e=>{e.preventDefault();await onStart?.({displayName:nameInput.value.trim()||'여행자',profileId:activeProfile?.playerId,character:'traveler',difficulty:1,vocabularyMode:modeSelect.value,seed:seedInput.value.trim()||undefined});}},
    el('div',{class:'setup-heading'},el('span',{class:'eyebrow',text:'YOUR EXPEDITION'}),el('h2',{text:'새로운 원정'})),
    el('div',{class:'traveler-choice'},el('span',{class:'traveler-icon',text:'🧭'}),el('div',{},el('strong',{text:'여행자'}),el('p',{text:'28장의 단어로 시작하는 나만의 문장.'})),el('span',{class:'pill',text:'난이도 1'})),
    el('label',{class:'field'},el('span',{text:'여행자 이름'}),nameInput),
    profiles.length?el('div',{class:'profile-row'},profileSelect,button('새 프로필',()=>{nameInput.value='';profileSelect.value='';onCreateProfile?.();nameInput.focus();},'quiet')):null,
    el('label',{class:'field'},el('span',{text:'어휘 수준'}),modeSelect,el('small',{text:'어휘만 달라집니다. 점수와 전투 규칙은 같습니다.'})),
    el('details',{class:'seed-details'},el('summary',{text:'원정 시드 직접 입력'}),seedInput),
    el('button',{type:'submit',class:'primary start-button',id:'start-run',text:'원정 시작하기  →'}),
    button('수동 저장 불러오기',onLoad,'secondary full-width'),
    el('p',{class:'local-note',text:'이 기기에 기록되는 개인 원정 · 계정 없이 플레이'}));
  const preview=el('div',{class:'hero-card-fan','aria-hidden':'true'},[['I','대명사','PRONOUN'],['make','동사','VERB'],['stories','명사','NOUN']].map(([word,pos,type],i)=>el('div',{class:`hero-word-card pos-${type} fan-${i}`},el('span',{text:pos}),el('strong',{text:word}),el('small',{text:'10  ◇'}))));
  root.replaceChildren(el('header',{class:'topbar lobby-topbar'},el('a',{class:'brand-small',href:'#lobby',text:'SB / SENTENCE BALATRO'}),el('nav',{},button('기록',onRecords,'quiet'),button('설정',onSettings,'quiet'),el('span',{class:'version-badge',text:'0.2.2 · 문장과 단어'}))),
    el('main',{class:'lobby'},el('section',{class:'hero'},el('div',{class:'eyebrow hero-eyebrow'},el('span',{class:'tiny-diamond'}),'WORDS BECOME POWER'),el('h1',{},'센텐스',el('br'),el('span',{text:'발라트로'})),el('p',{class:'hero-description',text:'단어를 잇고, 문장을 완성하고.\n당신의 한 문장이 모험의 힘이 됩니다.'}),preview,
    el('div',{class:'chapter-preview'},el('span',{class:'chapter-number',text:'01–02'}),el('div',{},el('span',{class:'eyebrow',text:'SEVEN BATTLES'}),el('h3',{text:'시작의 초원 → 전달의 항구'}),el('p',{text:'총 7전투 · 첫 상점 · 4형식과 토파즈 룬'}))),el('div',{class:'hero-features'},el('span',{text:'◇ 문장 조합 덱빌딩'}),el('span',{text:'◇ 로컬 싱글 플레이'}))),setup),
    el('footer',{class:'lobby-footer'},el('span',{text:'현재형 · 1·2·3·4형식으로 이어지는 모험'}),onSandbox&&button('문장 샌드박스 ↗',onSandbox,'quiet')));
}
