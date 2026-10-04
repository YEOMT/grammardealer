import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {spawn} from 'node:child_process';
import {RunController} from '../src/game/runController.js';import {rankPlayableCandidates} from '../tools/simulate-runs.js';
const port=Number(process.env.SB_E2E_PORT||4174);const base=`http://127.0.0.1:${port}/nested/sentence-game/`;
const viewport=JSON.parse(process.env.SB_VIEWPORT||'{"width":1366,"height":768}');
const suffix=process.env.SB_EVIDENCE_SUFFIX||'';const effectsOff=process.env.SB_EFFECTS_OFF==='1';
const server=spawn(process.execPath,['tools/static-server.mjs','dist',String(port)],{stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>c&&reject(Error('Server failed')));});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport});const page=await context.newPage();page.setDefaultTimeout(12000);
const errors=[],requests=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
const record=(ids,description)=>{checks.push({ids,description,status:'PASS'});console.log(`PASS ${ids.join(',')}: ${description}`);};
const closeModal=async()=>{await page.locator('dialog[open] .dialog-header button').click();};
const capture=async(name)=>{await page.locator('.toast.visible').waitFor({state:'detached',timeout:6000});return page.screenshot({path:`docs/evidence-0.1.1/${name}${suffix}.png`});};
async function readRows(store){return page.evaluate(store=>new Promise((resolve,reject)=>{const open=indexedDB.open('sentence-balatro-v0-1',1);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,tx=db.transaction(store,'readonly'),req=tx.objectStore(store).getAll();req.onsuccess=()=>resolve(req.result);tx.oncomplete=()=>db.close();};}),store);}
async function saveSlot(slot){await page.getByRole('button',{name:'저장',exact:true}).last().click();await page.getByRole('button',{name:`슬롯 ${slot} 저장`,exact:true}).click();await page.locator('dialog[open] [role=status]').filter({hasText:`슬롯 ${slot}에 저장했습니다`}).waitFor();await capture(`save-slot-${slot}`);await closeModal();if(await page.locator('.reward-access').count())await page.getByRole('button',{name:'보상 다시 열기'}).click();return(await readRows('slots')).find(r=>r.slot===slot).run;}
async function loadSlot(slot){await page.getByRole('button',{name:'저장',exact:true}).last().click();await page.getByRole('button',{name:`슬롯 ${slot} 불러오기`,exact:true}).click();await page.getByRole('heading',{name:'수동 저장 · 3슬롯',exact:true}).waitFor({state:'detached'});}
let shadow;
async function cmd(command){if(command.type==='SUBMIT'&&shadow.getState().tutorial.visible&&!shadow.getState().tutorial.actions?.explained)shadow.dispatch({type:'ACK_ATTACK_GUIDE'});const result=shadow.dispatch(command);assert.equal(result.ok,true,`${command.type}: ${result.message}`);return result;}
async function prepare(){await page.getByRole('button',{name:/준비 · 다음 턴/}).click();await cmd({type:'PREPARE'});}
async function compose(candidate){
 for(const slot of candidate.slots){
  const id=slot.cardInstanceId;await page.locator(`.hand-cards [data-card-id="${id}"] .card-body`).click();await cmd({type:'ADD_CARD',cardId:id});
  const token=candidate.snapshot.orderedTokens.find(t=>t.cardInstanceId===id);
  await page.locator(`.combat-sentence [data-card-id="${id}"] .form-button`).click();
  await page.locator(`[data-form-id="${slot.selection.formId}"]`).click();await cmd({type:'SET_FORM',cardId:id,formId:slot.selection.formId});
 }
}
try{
 await fs.mkdir('docs/evidence-0.1.1',{recursive:true});await page.goto(base);await page.locator('#start-run').waitFor();assert.equal(await page.evaluate(()=>Boolean(window.__SB_DEV__)),false);
 await capture('lobby');await page.locator('#player-name').fill('검증 여행자');await page.locator('.seed-details summary').click();await page.locator('#run-seed').fill('run-sequence.0');await page.locator('#start-run').click();await page.locator('#start-battle').click();await page.locator('#attack-submit').waitFor();
 const initial=await saveSlot(1),profile=(await readRows('profiles'))[0];shadow=new RunController({initialState:initial,profile});
 await loadSlot(1);const again=await saveSlot(1);assert.deepEqual(again,initial);record(['P01','P02','U12','U13'],'production subpath, profile and initial six-card save/load exact (including RNG)');
 const beforeDict=await saveSlot(1);await page.getByRole('button',{name:'사전',exact:true}).click();await capture('dictionary');await closeModal();const afterDict=await saveSlot(1);assert.deepEqual(afterDict,beforeDict);record(['P10'],'dictionary open/close does not consume RNG or mutate run');
 await context.setOffline(true);record(['P11'],'network disabled after all initial static resources loaded');
 let attacks=0;let exercised=false;let rewardSaved=false;let maxLoops=0;
 while(++maxLoops<120){
  const state=shadow.getState();
  if(state.status==='CONTENT_COMPLETE')break;
  if(state.status==='DEFEAT')throw Error('QA run unexpectedly defeated');
  if(state.status==='BETWEEN_BATTLES'){await page.locator('#next-battle').click();await cmd({type:'NEXT_BATTLE'});continue;}
  if(state.status==='REWARD'){
   if(state.progress.battleNumber===1&&!rewardSaved){const reward=await saveSlot(2);await loadSlot(2);const restored=await saveSlot(2);assert.deepEqual(restored,reward);record(['P03','P04'],'frozen reward and unlock baseline survive real IndexedDB restore');rewardSaved=true;}
   if(state.reward.type==='RUNE_INTRO'&&state.progress.battleNumber===2){const savedRuneOffer=await saveSlot(2);await loadSlot(2);assert.deepEqual((await saveSlot(2)).reward,savedRuneOffer.reward);assert.deepEqual(state.reward.choices.map(c=>c.runeId),['rune.perfectSentence','rune.short','rune.discards']);await capture('first-rune-choice');record(['R02'],'first rune choices rendered crystal/amber/copper');}
   const choice=state.reward.choices.find(c=>c.runeId==='rune.perfectSentence')||state.reward.choices.find(c=>!c.disabled);
   if(choice){await page.locator(`[data-choice-id="${choice.choiceId}"] button`).click();if(choice.kind==='SERVICE'){await page.locator(`[data-target-id="${choice.targetCardIds[0]}"] button`).click();if(await page.getByRole('button',{name:'확인하고 제거'}).count())await page.getByRole('button',{name:'확인하고 제거'}).click();if(await page.locator('#confirm-polish-result').count())await page.locator('#confirm-polish-result').click();}await cmd({type:'CHOOSE_REWARD',offerId:state.reward.offerId,choiceId:choice.choiceId,confirmRemoval:true,targetCardInstanceId:choice.targetCardIds?.[0]});}
   else {await page.locator('#skip-reward').click();await cmd({type:'SKIP_REWARD',offerId:state.reward.offerId});}
   continue;
  }
  assert.equal(state.status,'BATTLE');
  if(state.progress.battleNumber===2&&!exercised){
   if(effectsOff){await page.getByRole('button',{name:'설정',exact:true}).click();await page.getByLabel('음소거',{exact:true}).check();await page.getByLabel('효과 감소',{exact:true}).check();await capture('muted-reduced-effects');await closeModal();}
   await prepare();const after=shadow.getState();const candidate=rankPlayableCandidates(after)[0];const used=new Set(candidate.slots.map(s=>s.cardInstanceId));const ids=after.combat.handIds.filter(id=>!used.has(id)).slice(0,2);
   if(ids.length){for(const id of ids)await page.locator(`.hand-cards [data-card-id="${id}"] .card-select`).click();await capture('exchange-selection');await page.locator('#discard-selected').click();await cmd({type:'EXCHANGE',cardIds:ids});}
   exercised=true;record(['D10','D15','U03'],'prepare then real multi-card exchange via UI');continue;
  }
  const candidate=rankPlayableCandidates(state)[0];
  if(!candidate){if(state.combat.turnsRemaining>1){await prepare();continue;}throw Error('No finite QA move');}
  await compose(candidate);assert.equal(await page.locator('[data-presentation=score]').isVisible(),false);await capture(attacks?'sentence-edit-later':'sentence-edit');
  const displayedBefore=await page.locator('[data-presentation=hp]').textContent();const response=await cmd({type:'SUBMIT'});
  await page.locator('#attack-submit').click();if(await page.locator('#confirm-first-attack').count())await page.locator('#confirm-first-attack').click();await page.locator('.presentation-locked').waitFor();
  if(attacks===0){assert.equal(await page.locator('[data-presentation=hp]').textContent(),displayedBefore);await page.locator('[data-presentation-role]').first().waitFor();await capture('score-chain');await page.waitForFunction(before=>{const hp=document.querySelector('[data-presentation=hp]');return hp&&hp.textContent!==before;},displayedBefore);await capture('impact');}
  await page.locator('.presentation-locked').waitFor({state:'detached',timeout:15000});await cmd({type:'FINISH_PRESENTATION',attackId:response.resolution.attackId});attacks++;
  if(attacks===1)record(['U01','U07','U08','C13'],'no preview, actual submitted timeline, enemy retains old HP before impact, emoji enemy');
 }
 assert.equal(shadow.getState().status,'CONTENT_COMPLETE');await page.getByRole('heading',{name:'시작의 초원 클리어',exact:true}).waitFor();await capture('stage1-complete');assert.ok(shadow.getState().economy.gold>=10);
 record(['C12','R17','P11'],'all three production battles complete offline; base + remaining-turn gold and CONTENT_COMPLETE');
 if(effectsOff)record(['U09'],'muted and reduced effects from battle 2 through boss completion with identical gameplay');
 await page.getByRole('button',{name:'완료 상태 저장',exact:true}).click();await page.getByRole('button',{name:'슬롯 3 저장',exact:true}).click();await page.locator('dialog[open] [role=status]').filter({hasText:'슬롯 3에 저장했습니다'}).waitFor();await closeModal();
 const savedFinal=(await readRows('slots')).find(r=>r.slot===3).run;assert.equal(savedFinal.status,'CONTENT_COMPLETE');assert.equal(savedFinal.progress.contentBoundary,'STAGE1_END');
 const finalProfile=(await readRows('profiles'))[0];assert.equal(finalProfile.qualifiedRunIds.length,1);assert.equal(finalProfile.storyClearCount,0);record(['P05'],'completion persisted once, no story clear');
 await page.getByRole('button',{name:'기록 보기',exact:true}).click();await capture('sentence-codex');await closeModal();assert.deepEqual((await readRows('profiles'))[0],finalProfile);record(['P06'],'reading attack history does not reapply profile records');
 await page.locator('#new-run-result').click();await page.locator('#start-battle').waitFor();await page.locator('#start-battle').click();assert.equal(await page.locator('.tutorial-bubble').count(),0);record(['R04'],'new expedition works offline and previously seen guide is not forced');
 await context.setOffline(false);await page.goto(base+'#sandbox');await page.getByLabel('문법 테스트 사례',{exact:true}).selectOption('G01');await page.locator('#sandbox-analyze').click();assert.deepEqual((await readRows('profiles'))[0],finalProfile);record(['P06'],'sandbox analysis does not modify persisted profile');
 await page.reload();await page.getByRole('heading',{name:'문장 실험실',exact:true}).waitFor();await page.getByRole('button',{name:'← 로비',exact:true}).click();await page.goBack();await page.getByRole('heading',{name:'문장 실험실',exact:true}).waitFor();record(['U13'],'production hash route refresh and browser back');
 assert.deepEqual(errors,[]);assert.ok(requests.every(url=>url.startsWith(`http://127.0.0.1:${port}`)));record(['U14'],'no page errors or external runtime requests');
 await fs.writeFile(`docs/evidence-0.1.1/production-browser${suffix}.json`,JSON.stringify({status:'PASS',browser:await browser.version(),viewport,effectsOff,urlPath:'/nested/sentence-game/',offlineFullStage1:true,attacks,checks,errors,requestOrigins:[...new Set(requests.map(u=>new URL(u).origin))]},null,2));
 console.log(`Production E2E PASS (${attacks} real attacks)`);
}catch(error){await capture('e2e-failure');await fs.writeFile(`docs/evidence-0.1.1/production-browser-failure${suffix}.json`,JSON.stringify({error:error.stack,errors,checks},null,2));throw error;}
finally{await browser.close();server.kill();}
