import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out=process.env.SB_V022_EVIDENCE||'.local-validation/v022/browser';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const report={kind:'SYNTHETIC_LEGAL_CARD_STATE_WITH_REAL_CONTROLLER_UI',checks:[],captures:[],errors:[],browser:browser.version()};
const check=(id,detail)=>report.checks.push({id,detail,status:'PASS'});
try{for(const [width,height]of [[1366,768],[1920,1080],[1024,768],[1180,820]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width===1180}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');await page.locator('#start-run').waitFor();
 await page.evaluate(async()=>{
  const [{RunController},{newProfile},{snapshotFromText},{renderCombat},{openDictionary,openRecords,openRecentAttack},{playAttack,createDOMPresentation},{learningRecord}]=await Promise.all([import('/tests/helpers/legacy-022-controller.js'),import('/src/services/localStore.js'),import('/src/engine/grammar/index.js'),import('/src/ui/combat.js'),import('/src/ui/overlays.js'),import('/src/engine/presentation.js'),import('/src/engine/learningRecords.js')]);
  window.learningFixture=(text,{unlocked=false,turns=6}={})=>{
   const profile={...newProfile('학습 UI 검증'),guidedTutorialCompletedVersion:'0.2.1',unlocks:unlocked?['pack.svoo']:[]};
   const c=new RunController({profile});c.dispatch({type:'NEW_RUN',config:{seed:'learning-ui'}});c.dispatch({type:'START_BATTLE'});
   const s=c.getState(),tokens=snapshotFromText(text).orderedTokens;s.combat.handIds=[];s.combat.sentenceSlots=[];s.combat.discardIds=[];
   tokens.forEach((t,i)=>{const id=s.activeCardIds[i];s.cardInstances[id].cardDefId=t.cardDefId;s.combat.handIds.push(id);if(!s.vocabulary.encounteredLexemeIds.includes(t.lexemeId))s.vocabulary.encounteredLexemeIds.push(t.lexemeId);});
   s.combat.drawIds=s.activeCardIds.slice(tokens.length);s.combat.turnsRemaining=turns;s.combat.battleDirty=true;c._state=s;
   let cleanup=()=>{};const root=document.querySelector('#app');
   const show=()=>{cleanup();const view=renderCombat(root,c.getState(),{command:async command=>{
    const before=c.getState(),r=c.dispatch(command);if(!r.ok)throw Error(r.message);window.lastLearningResult=r;
    if(r.resolution){cleanup();const v=renderCombat(root,before,{locked:true});v.beginPresentation();await playAttack(r.resolution,createDOMPresentation(v.element,{hpMax:77}),{speed:window.fixtureSpeed??2,effectsOff:true});c.dispatch({type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});}
    show();
   },openOverlay:type=>type==='records'?openRecords(c.getProfile(),c.getState()):type==='recent'?openRecentAttack(c.getState()):openDictionary(c.getState(),{ownedOnly:type==='deck'})});cleanup=view.cleanup;};
   window.learningController=c;window.learningTokens=tokens;show();
  };
  window.inspectOldLearning=()=>openRecords({...newProfile('이전 기록'),bestAttack:999,grammarRecords:{'FRAME.SV':{count:4,bestPower:999,firstSentence:'I am happy.',bestSentence:'I am.',firstLearning:{sentenceSnapshot:snapshotFromText('I am happy')},bestLearning:{meaning:{textKo:'나는 행복하다',meaningVersion:'old'}}}}},null);
 });
 const capture=async name=>{const f=`${width}-${name}.png`;await page.screenshot({path:out+'/'+f,fullPage:true});report.captures.push(f);};
 const close=async()=>page.locator('dialog[open] .dialog-header button').last().click();
 async function compose(){const tokens=await page.evaluate(()=>learningTokens);for(const [i,t]of tokens.entries()){
  const id=await page.evaluate(i=>learningController.getState().activeCardIds[i],i);await page.locator(`.hand-cards [data-card-id="${id}"] .card-body`).click();
  await page.locator(`[data-card-id="${id}"] .form-button`).click();await page.locator(`[data-form-id="${t.selectionId}"]`).click();
 }}
 for(const [text,unlocked,power,name]of [['I book happy run',false,0,'incomplete'],['She gives me a book',false,70,'locked-svoo'],['She gives me a book',true,140,'unlocked-svoo'],['I give my friend a book',true,160,'whole-io-do']]){
  await page.evaluate(({text,unlocked})=>learningFixture(text,{unlocked}),{text,unlocked});await compose();assert.equal(await page.locator('#attack-submit').isEnabled(),true);await page.locator('#attack-submit').click();
  if(power===0){await page.getByText(/문장을 완성하지 못하면 데미지를/).waitFor();await capture(name+'-feedback');}
  await page.locator('.presentation-locked').waitFor({state:'detached',timeout:30000});
  const r=await page.evaluate(()=>({state:learningController.getState(),resolution:lastLearningResult.resolution,profile:learningController.getProfile()}));assert.equal(r.resolution.finalPower,power);assert.equal(r.state.combat.turnsRemaining,5);assert.equal(r.state.stats.attacks,1);
  await page.getByRole('button',{name:'공격 기록',exact:true}).click();await page.locator('dialog details summary').first().click();const contents=await page.locator('dialog[open]').innerText();assert.doesNotMatch(contents,/VALID|INVALID_CORE|UNSUPPORTED|ENGINE_ERROR|뜻 참고|sense\.|frame\.|cap\./);assert.match(contents,power===0?/문장 미완성/:/완전한 문장/);assert.equal(await page.locator('.meaning-hint').count(),0);await capture(name+'-record');await close();
  if(name==='whole-io-do'){assert.match(contents,/my friend · 간접목적어 IO/);assert.match(contents,/a book · 직접목적어 DO/);}
  if(power===0){assert.match(contents,/문장을 완성하지 못하면 데미지를 줄 수 없습니다/);assert.doesNotMatch(contents,/목적어나 보어가 없습니다/);}
  check('SUBMIT_'+width+'_'+name,'Actual UI submission and recorded power '+power+', one turn consumed, translated/internal labels absent');
 }
 await page.evaluate(()=>learningFixture('happy',{turns:1}));await compose();await page.locator('#attack-submit').click();await page.locator('.presentation-locked').waitFor({state:'detached',timeout:10000});assert.equal(await page.evaluate(()=>learningController.getState().status),'DEFEAT');assert.equal(await page.evaluate(()=>learningController.getState().combat.handIds.length),0);check('LAST_TURN_'+width,'Last invalid submission defeats after presentation without draw');
 await page.evaluate(()=>learningFixture('They develop technology'));await page.getByRole('button',{name:'내 덱',exact:true}).click();await page.getByLabel('원정 사전 검색').fill('develop');const dictionary=await page.locator('dialog[open]').innerText();assert.match(dictionary,/발전하다, 발달하다/);assert.match(dictionary,/develops/);assert.doesNotMatch(dictionary,/과거는 과거형, 진행은 be|현재형 초급 대표/);assert.match(dictionary,/보유 1장/);await capture('develop-dictionary');
 const bounds=await page.locator('dialog[open]').boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1);await close();
 await page.evaluate(()=>{const s=learningController._state;const id=s.activeCardIds[1];s.activeCardIds=s.activeCardIds.filter(x=>x!==id);s.combat.handIds=s.combat.handIds.filter(x=>x!==id);delete s.cardInstances[id];});
 await page.getByRole('button',{name:'사전',exact:true}).click();await page.getByLabel('원정 사전 검색').fill('develop');assert.match(await page.locator('dialog[open]').innerText(),/현재 보유하지 않음/);await close();check('DICTIONARY_'+width,'Owned/encountered dictionary, forms, removed word retained, modal fits viewport');
 await page.evaluate(()=>inspectOldLearning());await page.getByText('이전 기록 · 당시 집계 보존',{exact:true}).click();const old=await page.locator('dialog[open]').innerText();assert.match(old,/I am happy/);assert.match(old,/교육용 구조 재확인: 2형식/);assert.match(old,/I am\.\s*이전 기록\(문형 예문으로 사용하지 않음\)/);assert.doesNotMatch(old,/나는 행복하다|VALID|뜻 참고/);await capture('legacy-codex');await close();check('LEGACY_'+width,'Evidence-based correction without historical score changes; uncertain string preserved outside model examples');
 await context.close();
}assert.deepEqual(report.errors,[]);report.status='PASS';console.log(`Grammar learning browser PASS: ${report.checks.length} checks, ${report.captures.length} captures`);
}finally{await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
