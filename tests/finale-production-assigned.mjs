import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {buildFinaleUiPlan} from './helpers/finale-ui-plan.js';
import {RunController} from '../src/game/runController.js';
import {checked} from './helpers/finale-state.js';
import {validateRunState} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';

// A single legal assigned deck before battle47, then UI commands only. This is not
// a natural 50-battle campaign or win-rate sample. QA clears never enter rankings.
const out=process.env.SB_FINALE_PRODUCTION_OUT??'.local-validation/v011/production-assigned';
await fs.mkdir(out,{recursive:true});
const plan=buildFinaleUiPlan(),shadow=new RunController({profile:plan.profile});
checked(shadow,{type:'RESUME_RUN',state:plan.initialState});
const server=spawn(process.execPath,['tools/static-server.mjs','dist','4191','/grammardealer/'],{stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>code&&reject(Error('Static server exit '+code)));});
const browser=await chromium.launch({args:['--proxy-server=direct://','--proxy-bypass-list=*']}),context=await browser.newContext({viewport:{width:1366,height:768},recordVideo:{dir:out}}),page=await context.newPage();
page.setDefaultTimeout(15000);
const report={kind:'ASSIGNED_LEGAL_DECK_PRODUCTION_UI_NOT_NATURAL_50',seed:plan.seed,initialWordCount:plan.initialState.activeCardIds.length,checks:[],attacks:[],captures:[],resources:[],errors:[],commands:[]};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('requestfailed',r=>report.errors.push(r.url()+': '+r.failure()?.errorText));
page.on('response',r=>{if(r.url().includes('/assets/'))report.resources.push({path:new URL(r.url()).pathname,status:r.status()});});
const capture=async name=>{await page.screenshot({path:out+'/'+name+'.png',fullPage:true});report.captures.push(name+'.png');};
const dispatch=command=>{report.commands.push(command);return checked(shadow,command);};
const card=id=>page.locator(`.combat-sentence [data-card-id="${id}"]`);
async function handCard(id){
 const item=page.locator(`.hand-cards [data-card-id="${id}"]`);await expect(item).toHaveCount(1);
 const previous=page.getByRole('button',{name:'이전 손패 페이지',exact:true}),next=page.getByRole('button',{name:'다음 손패 페이지',exact:true});
 while(await previous.isEnabled())await previous.click();
 for(let i=0;i<6&&!await item.isVisible();i++){assert.equal(await next.isEnabled(),true,'Requested physical hand card is on a page');await next.click();}
 await expect(item).toBeVisible();return item;
}
async function compactViewportCheck(name){
 await expect(page.locator('#attack-submit')).toBeVisible();
 await expect(page.locator('.finale-status')).toBeVisible();
 const boxes=await page.locator('.game-header,.finale-status,.combat-actions,.hand-section').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().height).map(n=>{const r=n.getBoundingClientRect();return{class:n.className,x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight};}));
 assert.ok(boxes.every(r=>r.x>=-1&&r.right<=r.w+1&&r.y>=-1&&r.bottom<=r.h+1),JSON.stringify(boxes));
 await capture(name);report.checks.push({id:name,status:'PASS',boxes});
}
async function saveAndCompare(){
 await page.getByRole('button',{name:'저장',exact:true}).click();
 await page.getByRole('button',{name:'슬롯 2 저장',exact:true}).click();
 await page.locator('dialog [role=status]').filter({hasText:'저장했습니다'}).waitFor();await page.keyboard.press('Escape');
 const saved=await page.evaluate(playerId=>new Promise((resolve,reject)=>{const op=indexedDB.open('sentence-balatro-v0-1',1);op.onsuccess=()=>{const db=op.result,req=db.transaction('slots').objectStore('slots').get(playerId+':2');req.onsuccess=()=>{db.close();resolve(req.result.run);};req.onerror=()=>reject(req.error);};}),plan.profile.playerId);
 validateRunState(saved,registryForVersion(saved.version));
 assert.deepEqual(saved,shadow.getState());return saved;
}
try{
 await page.goto('http://127.0.0.1:4191/grammardealer/');await page.locator('#start-run').waitFor();
 assert.equal(await page.evaluate(()=>!!window.__SB_DEV__),false);
 await page.evaluate(({run,profile})=>new Promise((resolve,reject)=>{const op=indexedDB.open('sentence-balatro-v0-1',1);op.onsuccess=()=>{const db=op.result,tx=db.transaction(['profiles','slots'],'readwrite');tx.objectStore('profiles').put(profile);tx.objectStore('slots').put({key:profile.playerId+':1',slot:1,playerId:profile.playerId,savedAt:Date.now(),version:run.version,run});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};op.onerror=()=>reject(op.error);}),{run:plan.initialState,profile:plan.profile});
 await page.reload();await page.getByRole('combobox',{name:'로컬 프로필 선택'}).selectOption(plan.profile.playerId);
 await page.getByRole('button',{name:'수동 저장 불러오기',exact:true}).click();await page.getByRole('button',{name:'슬롯 1 불러오기',exact:true}).click();await page.locator('#attack-submit').waitFor();
 for(const entry of plan.transcript){
  const cmd=entry.command,s=shadow.getState();
  if(cmd.type==='ADD_CARD'){
   await (await handCard(cmd.cardId)).locator('.card-body').click();dispatch({type:'ADD_CARD',cardId:cmd.cardId});
   for(let index=shadow.getState().combat.sentenceSlots.length-1;index>(cmd.index??index);index--){await card(cmd.cardId).locator('.form-button').click();await page.getByRole('button',{name:'← 왼쪽으로',exact:true}).click();dispatch({type:'REORDER_SENTENCE',cardId:cmd.cardId,index:index-1});}
  }else if(cmd.type==='SET_FORM'){
   await card(cmd.cardId).locator('.form-button').click();const choice=page.locator(`dialog [data-form-id="${cmd.formId}"],dialog [data-form-aliases~="${cmd.formId}"]`);const actual=await choice.getAttribute('data-form-id');await choice.click();dispatch({...cmd,formId:actual});
  }else if(cmd.type==='EXCHANGE'){
   for(const id of cmd.cardIds)await (await handCard(id)).locator('.card-select').click();await page.locator('#discard-selected').click();dispatch(cmd);
  }else if(cmd.type==='PREPARE'){
   await page.locator('.prepare-button').click();dispatch(cmd);
  }else if(cmd.type==='SUBMIT'){
   await page.evaluate(()=>{window.finaleQaMotion={phases:[],visibleAttackBody:false};window.finaleQaTimer=setInterval(()=>{const phase=document.querySelector('[data-core-phase]')?.dataset.corePhase;if(phase&&!window.finaleQaMotion.phases.includes(phase))window.finaleQaMotion.phases.push(phase);const body=document.querySelector('.core-attack-body');if(body){const r=body.getBoundingClientRect();if(r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight)window.finaleQaMotion.visibleAttackBody=true;}},16);});
   const r=dispatch(cmd).resolution;await page.locator('#attack-submit').click();
   if(await page.locator('#confirm-first-attack').count())await page.locator('#confirm-first-attack').click();
   await page.locator('.presentation-locked').waitFor();await page.locator('.presentation-locked').waitFor({state:'detached',timeout:60000});
   assert.equal(r.finalPower,entry.resolution.finalPower);assert.equal(r.killed,entry.resolution.killed);
   const motion=await page.evaluate(()=>{clearInterval(window.finaleQaTimer);return window.finaleQaMotion;});
   assert.ok(['CHARGE','LUNGE','IMPACT'].every(phase=>motion.phases.includes(phase)),JSON.stringify(motion));assert.equal(motion.visibleAttackBody,true);
   report.attacks.push({battle:s.progress.battleNumber,turn:s.combat.turnIndex,sentence:r.analysis.displayText??r.sentenceSnapshot?.displayText,finalPower:r.finalPower,actualHpLoss:r.actualHpLoss,killed:r.killed,surface:r.surfaceResult,deep:r.deepRelease,motion});
   console.log('UI attack',s.progress.battleNumber,r.finalPower,r.killed);
  }else if(cmd.type==='FINISH_PRESENTATION')dispatch(cmd);
  else if(cmd.type==='SKIP_REWARD'){await page.locator('#skip-reward').click();dispatch(cmd);}
  else if(cmd.type==='NEXT_STAGE'){await page.locator('#next-stage').click();dispatch(cmd);await capture('final-introduction');}
  else if(cmd.type==='ENTER_STAGE'){await page.locator('#enter-stage').click();dispatch(cmd);await capture('last-shop');}
  else if(cmd.type==='LEAVE_SHOP'){
   await page.locator('#leave-shop').click();await page.getByRole('button',{name:'전투 시작',exact:true}).click();dispatch({...cmd,expectedRevision:s.revision,commandId:`shop.ui.${s.runId}.${s.revision}.1`});
   await page.locator('#attack-submit').waitFor();await compactViewportCheck('surface-pc');await saveAndCompare();
   await page.setViewportSize({width:1180,height:820});await compactViewportCheck('surface-tablet-landscape');await page.setViewportSize({width:1366,height:768});
  }else if(cmd.type==='NEXT_BATTLE'){
   await page.locator('#next-battle').click();dispatch(cmd);await page.locator('#attack-submit').waitFor();
   await compactViewportCheck('phase-'+shadow.getState().progress.battleNumber+'-pc');await saveAndCompare();
   if(shadow.getState().progress.battleNumber===49){await page.setViewportSize({width:1180,height:820});await compactViewportCheck('deep-tablet-landscape');await page.setViewportSize({width:1366,height:768});}
  }else throw Error('Unmapped UI command '+cmd.type);
 }
 await expect(page.getByRole('heading',{name:'원정 클리어 · 50 / 50',exact:true})).toBeVisible();await expect(page.locator('.finale-qa-notice')).toHaveText('지정 덱 QA · 랭킹 제외');
 assert.equal(shadow.getState().clearKind,'FINAL_CLEAR');assert.equal(shadow.getState().finale.phaseClearReceipts.length,3);assert.equal(shadow.getState().finale.bestAttackSnapshot,null);
 await capture('final-clear');const saved=await saveAndCompare();assert.equal(saved.progress.contentBoundary,'FINAL50_CLEAR');
 await page.locator('#finale-leaderboard').click();await expect(page.getByText('아직 등록된 50전투 클리어 기록이 없습니다.',{exact:true})).toBeVisible();await expect(page.getByText(/공용 랭킹 미연결/).first()).toBeVisible();await page.keyboard.press('Escape');
 await page.locator('#finale-lobby').click();await page.getByRole('button',{name:'수동 저장 불러오기',exact:true}).click();await page.getByRole('button',{name:'슬롯 2 불러오기',exact:true}).click();await expect(page.getByRole('heading',{name:'원정 클리어 · 50 / 50',exact:true})).toBeVisible();
 await expect(page.locator('.finale-best-power')).toContainText(saved.finale.qaBestAttackSnapshot.finalPower.toLocaleString());
 report.checks.push({id:'UI_47_REWARD_LAST_SHOP_48_49_50_QA_CLEAR_SAVE_RELOAD_NO_RANKING',status:'PASS'});
 assert.deepEqual(report.errors,[]);assert.ok(report.resources.some(r=>r.path.endsWith('.js'))&&report.resources.some(r=>r.path.endsWith('.css')));assert.ok(report.resources.every(r=>[200,304].includes(r.status)));
 report.status='PASS';
}catch(error){report.status='FAIL';report.failure=error.stack;await capture('FAILURE');console.error(error);process.exitCode=1;}
finally{const video=page.video();await context.close();if(video)await video.saveAs(out+'/assigned-finale-production.webm');await browser.close();server.kill();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(report.status,report.checks.length,'checks',report.attacks.length,'actual UI attacks');}
