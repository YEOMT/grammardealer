import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {spawn} from 'node:child_process';
import {RunController} from '../src/game/runController.js';import {rankPlayableCandidates,exchangeSelection} from '../tools/simulate-runs.js';
import {registry} from '../src/data/language/index.js';
const port=Number(process.env.SB_E2E_PORT||4174);const base=`http://127.0.0.1:${port}/nested/sentence-game/`;
const viewport=JSON.parse(process.env.SB_VIEWPORT||'{"width":1366,"height":768}');
const suffix=process.env.SB_EVIDENCE_SUFFIX||'';const effectsOff=process.env.SB_EFFECTS_OFF==='1';
const evidence='docs/evidence-0.2';const policy='LEARNING';
const server=spawn(process.execPath,['tools/static-server.mjs','dist',String(port)],{stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>c&&reject(Error('Server failed')));});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport});const page=await context.newPage();page.setDefaultTimeout(12000);
const errors=[],consoleErrors=[],failedRequests=[],badResponses=[],requests=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('requestfailed',r=>failedRequests.push(r.url()));page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()});});page.on('request',r=>requests.push(r.url()));
const record=(ids,description)=>{checks.push({ids,description,status:'PASS'});console.log(`PASS ${ids.join(',')}: ${description}`);};
const closeModal=async()=>{await page.locator('dialog[open] .dialog-header button').click();};
const capture=async(name)=>{await page.locator('.toast.visible').waitFor({state:'detached',timeout:6000});return page.screenshot({path:`${evidence}/${name}${suffix}.png`,fullPage:/shop|preview|complete|milestone/.test(name)});};
async function readRows(store){return page.evaluate(store=>new Promise((resolve,reject)=>{const open=indexedDB.open('sentence-balatro-v0-1',1);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,tx=db.transaction(store,'readonly'),req=tx.objectStore(store).getAll();req.onsuccess=()=>resolve(req.result);tx.oncomplete=()=>db.close();};}),store);}
async function saveSlot(slot){await page.getByRole('button',{name:'저장',exact:true}).last().click();await page.getByRole('button',{name:`슬롯 ${slot} 저장`,exact:true}).click();await page.locator('dialog[open] [role=status]').filter({hasText:`슬롯 ${slot}에 저장했습니다`}).waitFor();await capture(`save-slot-${slot}`);await closeModal();if(await page.locator('.reward-access').count())await page.getByRole('button',{name:'보상 다시 열기'}).click();return(await readRows('slots')).find(r=>r.slot===slot).run;}
async function loadSlot(slot){await page.getByRole('button',{name:'저장',exact:true}).last().click();await page.getByRole('button',{name:`슬롯 ${slot} 불러오기`,exact:true}).click();await page.getByRole('heading',{name:'수동 저장 · 3슬롯',exact:true}).waitFor({state:'detached'});}
let shadow;
async function cmd(command){if(command.type==='SUBMIT'&&shadow.getState().tutorial.visible&&!shadow.getState().tutorial.actions?.explained)shadow.dispatch({type:'ACK_ATTACK_GUIDE'});const result=shadow.dispatch(command);assert.equal(result.ok,true,`${command.type}: ${result.message}`);return result;}
async function prepare(){await page.getByRole('button',{name:/준비 · 다음 턴/}).click();await cmd({type:'PREPARE'});}
async function exchange(ids){for(const id of ids)await page.locator(`.hand-cards [data-card-id="${id}"] .card-select`).click();await page.locator('#discard-selected').click();await cmd({type:'EXCHANGE',cardIds:ids});}
async function compose(candidate){
 for(const slot of candidate.slots){
  const id=slot.cardInstanceId;await page.locator(`.hand-cards [data-card-id="${id}"] .card-body`).click();await cmd({type:'ADD_CARD',cardId:id});
  const token=candidate.snapshot.orderedTokens.find(t=>t.cardInstanceId===id);
  await page.locator(`.combat-sentence [data-card-id="${id}"] .form-button`).click();
  await page.locator(`[data-form-id="${slot.selection.formId}"]`).click();await cmd({type:'SET_FORM',cardId:id,formId:slot.selection.formId});
 }
}
try{
 await fs.mkdir(evidence,{recursive:true});await page.goto(base);await page.locator('#start-run').waitFor();assert.equal(await page.evaluate(()=>Boolean(window.__SB_DEV__)),false);
 await capture('lobby');await page.locator('#player-name').fill('검증 여행자');await page.locator('.seed-details summary').click();await page.locator('#run-seed').fill('run-sequence.1');await page.locator('#start-run').click();await page.locator('#start-battle').click();await page.locator('#attack-submit').waitFor();
 const initial=await saveSlot(1),profile=(await readRows('profiles'))[0];shadow=new RunController({initialState:initial,profile});
 await loadSlot(1);const again=await saveSlot(1);assert.deepEqual(again,initial);record(['P01','P02','U12','U13'],'production subpath, profile and initial six-card save/load exact (including RNG)');
 const beforeDict=await saveSlot(1);await page.getByRole('button',{name:'사전',exact:true}).click();await capture('dictionary');await closeModal();const afterDict=await saveSlot(1);assert.deepEqual(afterDict,beforeDict);record(['P10'],'dictionary open/close does not consume RNG or mutate run');
 await context.setOffline(true);record(['P11'],'network disabled after all initial static resources loaded');
 let attacks=0;let exercised=false;let rewardSaved=false;let maxLoops=0;let svooCaptured=false,veilCaptured=false;const playedBattles=new Set();
 while(++maxLoops<120){
  const state=shadow.getState();
  if(state.status==='CONTENT_COMPLETE')break;
  if(state.status==='DEFEAT')throw Error('QA run unexpectedly defeated');
  if(state.status==='STAGE_CLEAR'){assert.equal((await readRows('profiles'))[0].qualifiedRunIds.length,1);await capture('stage1-milestone');await page.locator('#next-stage').click();await cmd({type:'NEXT_STAGE'});continue;}
  if(state.status==='STAGE_INTRO'){await capture('stage2-boss-preview');await page.locator('#enter-stage').click();await cmd({type:'ENTER_STAGE'});record(['V02-P07','V02-P08'],'actual Stage 1 milestone, harbor preview and once-only entry material before shop');continue;}
  if(state.status==='SHOP'){
   await capture('stage2-entry-shop');const savedShop=await saveSlot(2);await loadSlot(2);assert.deepEqual(await saveSlot(2),savedShop);
   await page.getByRole('button',{name:'로비',exact:true}).click();await page.locator('#start-run').waitFor();await page.getByRole('button',{name:'수동 저장 불러오기',exact:true}).click();await page.getByRole('button',{name:'슬롯 2 불러오기',exact:true}).click();await page.locator('.shop-page').waitFor();assert.deepEqual(await saveSlot(2),savedShop);record(['V02-P27'],'shop manual save restores from lobby with the same run, grants, inventory and RNG');
   const desired=[...state.shop.inventory].sort((a,b)=>Number(b.runeId==='rune.svoo')-Number(a.runeId==='rune.svoo')||Number(b.kind==='RUNE')-Number(a.kind==='RUNE'));
   for(const item of desired){const live=shadow.getState();if(item.price>live.economy.gold)continue;if(item.kind==='RUNE'&&live.runes.orderedInstanceIds.length>=3&&!live.runes.orderedInstanceIds.some(id=>live.runes.instances[id].runeId===item.runeId))continue;await page.locator(`[data-item-id="${item.itemId}"] button`).click();await cmd({type:'SHOP_BUY',shopId:live.shop.shopId,itemId:item.itemId});}
   await capture('shop-after-purchase');const bought=await saveSlot(2);await loadSlot(2);assert.deepEqual(await saveSlot(2),bought);shadow=new RunController({initialState:bought,profile:(await readRows('profiles'))[0]});
   await page.locator('#leave-shop').click();await page.getByRole('button',{name:'전투 시작',exact:true}).click();await cmd({type:'LEAVE_SHOP',shopId:state.shop.shopId});
   const after=await saveSlot(2);assert.deepEqual(after.combat,shadow.getState().combat);assert.deepEqual(after.rng,shadow.getState().rng);record(['V02-P11','V02-P18','V02-P22'],'real shop purchase/save/load retains inventory and identical Stage 2 first shuffle/draw offline');continue;
  }
  if(state.status==='BETWEEN_BATTLES'){await page.locator('#next-battle').click();await cmd({type:'NEXT_BATTLE'});continue;}
  if(state.status==='REWARD'){
   if(state.progress.battleNumber===1&&!rewardSaved){const reward=await saveSlot(2);await loadSlot(2);const restored=await saveSlot(2);assert.deepEqual(restored,reward);record(['P03','P04'],'frozen reward and unlock baseline survive real IndexedDB restore');rewardSaved=true;}
   if(state.reward.type==='RUNE_INTRO'&&state.progress.battleNumber===2){const savedRuneOffer=await saveSlot(2);await loadSlot(2);assert.deepEqual((await saveSlot(2)).reward,savedRuneOffer.reward);assert.deepEqual(state.reward.choices.map(c=>c.runeId),['rune.perfectSentence','rune.short','rune.discards']);await capture('first-rune-choice');record(['R02'],'first rune choices rendered crystal/amber/copper');}
   const available=state.reward.choices.filter(c=>!c.disabled);const choice=available.find(c=>c.runeId==='rune.svoo')||available.find(c=>c.cardDefId&&registry.lexemeById[registry.cardById[c.cardDefId].lexemeId].frameIds.includes('frame.svoo'))||available.find(c=>c.runeId==='rune.perfectSentence')||available.find(c=>c.kind!=='SERVICE'||c.serviceKind!=='REMOVE')||available[0];
   const target=choice?.targetCardIds?.find(id=>registry.lexemeById[registry.cardById[state.cardInstances[id].cardDefId].lexemeId].pos==='VERB')??choice?.targetCardIds?.[0];
   const replace=choice?.kind==='RUNE'&&state.runes.orderedInstanceIds.length===3&&!state.runes.orderedInstanceIds.some(id=>state.runes.instances[id].runeId===choice.runeId)?state.runes.orderedInstanceIds.at(-1):undefined;
   if(choice){await page.locator(`[data-choice-id="${choice.choiceId}"] button`).click();if(choice.kind==='SERVICE'){await page.locator(`[data-target-id="${target}"] button`).click();if(await page.getByRole('button',{name:'확인하고 제거'}).count())await page.getByRole('button',{name:'확인하고 제거'}).click();if(await page.locator('#confirm-polish-result').count())await page.locator('#confirm-polish-result').click();}if(replace)await page.getByRole('button',{name:'이 룬과 교체',exact:true}).nth(state.runes.orderedInstanceIds.indexOf(replace)).click();await cmd({type:'CHOOSE_REWARD',offerId:state.reward.offerId,choiceId:choice.choiceId,confirmRemoval:true,targetCardInstanceId:target,replaceRuneInstanceId:replace});}
   else {await page.locator('#skip-reward').click();await cmd({type:'SKIP_REWARD',offerId:state.reward.offerId});}
   continue;
  }
  assert.equal(state.status,'BATTLE');
  playedBattles.add(state.progress.battleNumber);
  if(state.progress.battleNumber===2&&!exercised){
   if(effectsOff){await page.getByRole('button',{name:'설정',exact:true}).click();await page.getByLabel('음소거',{exact:true}).check();await page.getByLabel('효과 감소',{exact:true}).check();await capture('muted-reduced-effects');await closeModal();}
   await prepare();const after=shadow.getState();const candidate=rankPlayableCandidates(after,{policy})[0];const used=new Set(candidate.slots.map(s=>s.cardInstanceId));const ids=after.combat.handIds.filter(id=>!used.has(id)).slice(0,1);
   if(ids.length){for(const id of ids)await page.locator(`.hand-cards [data-card-id="${id}"] .card-select`).click();await capture('exchange-selection');await page.locator('#discard-selected').click();await cmd({type:'EXCHANGE',cardIds:ids});}
   exercised=true;record(['D10','D15','U03'],'prepare then real multi-card exchange via UI');continue;
  }
  const candidate=rankPlayableCandidates(state,{policy})[0];
  if(state.progress.stageId==='stage.02'&&candidate?.frameId!=='frame.svoo'&&!candidate?.lethal&&state.combat.exchangesRemaining>0&&(!candidate||candidate.power*state.combat.turnsRemaining<state.combat.enemyState.hp)){await exchange(exchangeSelection(state,{policy}));continue;}
  if(!candidate){if(state.combat.handIds.length<=state.combat.rulesSnapshot.handLimit-3&&state.combat.turnsRemaining>2){await prepare();continue;}if(state.combat.exchangesRemaining>0){await exchange(exchangeSelection(state,{policy}));continue;}throw Error('No finite QA move');}
  await compose(candidate);assert.equal(await page.locator('[data-presentation=score]').isVisible(),false);await capture(attacks?'sentence-edit-later':'sentence-edit');
  const displayedBefore=await page.locator('[data-presentation=hp]').textContent();const response=await cmd({type:'SUBMIT'});
  await page.locator('#attack-submit').click();if(await page.locator('#confirm-first-attack').count())await page.locator('#confirm-first-attack').click();await page.locator('.presentation-locked').waitFor();
  if(attacks===0){assert.equal(await page.locator('[data-presentation=hp]').textContent(),displayedBefore);await page.locator('[data-presentation-role]').first().waitFor();await capture('score-chain');await page.waitForFunction(before=>{const hp=document.querySelector('[data-presentation=hp]');return hp&&hp.textContent!==before;},displayedBefore);await capture('impact');}
  if(candidate.frameId==='frame.svoo'&&!svooCaptured){await page.locator('[data-presentation-role]').filter({hasText:'IO'}).first().waitFor({timeout:30000});await capture('svoo-io-do-score');svooCaptured=true;}
  if(response.resolution.bossStateBefore?.active&&response.resolution.bossStateAfter?.active===false){await page.locator('[data-presentation=boss-veil]').filter({hasText:'해제'}).waitFor({timeout:30000});await capture('boss-veil-release');veilCaptured=true;}
  await page.locator('.presentation-locked').waitFor({state:'detached',timeout:45000});await cmd({type:'FINISH_PRESENTATION',attackId:response.resolution.attackId});attacks++;
  if(attacks===1)record(['U01','U07','U08','C13'],'no preview, actual submitted timeline, enemy retains old HP before impact, emoji enemy');
 }
 assert.equal(shadow.getState().status,'CONTENT_COMPLETE');assert.equal(shadow.getState().progress.contentBoundary,'STAGE2_END');assert.deepEqual([...playedBattles],[1,2,3,4,5,6,7]);assert.equal(svooCaptured,true);assert.equal(veilCaptured,true);await page.getByRole('heading',{name:'전달의 항구 완료',exact:true}).waitFor();await capture('stage2-complete');
 record(['C12','R17','P11','V02-P26'],'all seven production battles complete offline with real cards, SVOO and boss veil release');
 if(effectsOff)record(['U09'],'muted and reduced effects from battle 2 through boss completion with identical gameplay');
 await page.getByRole('button',{name:'완료 상태 저장',exact:true}).click();await page.getByRole('button',{name:'슬롯 3 저장',exact:true}).click();await page.locator('dialog[open] [role=status]').filter({hasText:'슬롯 3에 저장했습니다'}).waitFor();await closeModal();
 const savedFinal=(await readRows('slots')).find(r=>r.slot===3).run;assert.equal(savedFinal.status,'CONTENT_COMPLETE');assert.equal(savedFinal.progress.contentBoundary,'STAGE2_END');
 await page.getByRole('button',{name:'완료 상태 저장',exact:true}).click();await page.getByRole('button',{name:'슬롯 3 불러오기',exact:true}).click();await page.getByRole('heading',{name:'전달의 항구 완료',exact:true}).waitFor();await capture('stage2-complete-restored');assert.deepEqual((await readRows('slots')).find(r=>r.slot===3).run,savedFinal);record(['V02-P27'],'completed seven-battle save restores its exact completion screen without another milestone');
 const finalProfile=(await readRows('profiles'))[0];assert.equal(finalProfile.qualifiedRunIds.length,1);assert.equal(finalProfile.stage2CompletedRunIds.length,1);assert.equal(finalProfile.storyClearCount,0);record(['P05'],'Stage 1 milestone and Stage 2 completion each persisted once, no story clear');
 await page.getByRole('button',{name:'기록 보기',exact:true}).click();await capture('sentence-codex');await closeModal();assert.deepEqual((await readRows('profiles'))[0],finalProfile);record(['P06'],'reading attack history does not reapply profile records');
 await page.locator('#new-run-result').click();await page.locator('#start-battle').waitFor();await page.locator('#start-battle').click();assert.equal(await page.locator('.tutorial-bubble').count(),0);record(['R04'],'new expedition works offline and previously seen guide is not forced');
 await context.setOffline(false);await page.goto(base+'#sandbox');await page.getByLabel('문법 테스트 사례',{exact:true}).selectOption('G01');await page.locator('#sandbox-analyze').click();assert.deepEqual((await readRows('profiles'))[0],finalProfile);record(['P06'],'sandbox analysis does not modify persisted profile');
 await page.reload();await page.getByRole('heading',{name:'문장 실험실',exact:true}).waitFor();await page.getByRole('button',{name:'← 로비',exact:true}).click();await page.goBack();await page.getByRole('heading',{name:'문장 실험실',exact:true}).waitFor();record(['U13'],'production hash route refresh and browser back');
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(failedRequests,[]);assert.deepEqual(badResponses,[]);assert.ok(requests.every(url=>url.startsWith(`http://127.0.0.1:${port}`)));record(['U14'],'no page/console errors, failed resources or external runtime requests');
 await fs.writeFile(`${evidence}/production-browser${suffix}.json`,JSON.stringify({status:'PASS',browser:await browser.version(),viewport,effectsOff,seed:'run-sequence.1',policy,urlPath:'/nested/sentence-game/',offlineFullStage1:true,offlineFullStage2:true,playedBattles:[...playedBattles],svooCaptured,veilCaptured,attacks,checks,errors,consoleErrors,failedRequests,badResponses,requestOrigins:[...new Set(requests.map(u=>new URL(u).origin))]},null,2));
 console.log(`Production E2E PASS (${attacks} real attacks)`);
}catch(error){await capture('e2e-failure');await fs.writeFile(`${evidence}/production-browser-failure${suffix}.json`,JSON.stringify({error:error.stack,errors,checks},null,2));throw error;}
finally{await browser.close();server.kill();}
