import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {bossReward} from './helpers/shop-flow-state.js';
import {SHOP_FLOW_POLICY} from '../src/game/shopFlow.js';
import {validateRunState} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';
const out=process.env.SB_TEXT_SHOP_OUT??'.local-validation/text-shop/production';await fs.mkdir(out,{recursive:true});
const report={kind:'production UI from assigned boss-reward snapshots; not natural campaign play',checks:[],errors:[],captures:[]};
const server=spawn(process.execPath,['tools/static-server.mjs','dist','4193','/grammardealer/'],{stdio:['ignore','pipe','pipe']});let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',()=>reject(Error('Server exited')));});
 browser=await chromium.launch({args:['--proxy-server=direct://','--proxy-bypass-list=*']});
 const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:4193/grammardealer/');await page.locator('#start-run').waitFor();
 await expect(page.locator('.hero h1')).toHaveText('SyntaxAtlas');await expect(page.locator('.hero-description')).toHaveText('아름다운 지역을 탐험하며 나만의 문장을 만들어가는 모험');await expect(page.locator('.chapter-preview')).toContainText('FIFTY BATTLES');await expect(page.locator('.chapter-preview')).toContainText('총 50전투');
 async function capture(name){await page.screenshot({path:`${out}/${name}.png`});report.captures.push(name+'.png');}
 await capture('lobby');report.checks.push('Lobby English title, exact introduction, 50 battles');
 for(const stage of [1,3,7,10]){
  const c=bossReward(stage),run=c.getState(),profile=c.getProfile();run.config.shopFlowPolicy=SHOP_FLOW_POLICY;validateRunState(run,registryForVersion(run.version));
  await page.evaluate(({run,profile})=>new Promise((resolve,reject)=>{const op=indexedDB.open('sentence-balatro-v0-1',1);op.onsuccess=()=>{const db=op.result,tx=db.transaction(['profiles','slots'],'readwrite');tx.objectStore('profiles').put(profile);tx.objectStore('slots').put({key:profile.playerId+':1',slot:1,playerId:profile.playerId,savedAt:Date.now(),version:run.version,run});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};}),{run,profile});
  await page.reload();await page.getByRole('combobox',{name:'로컬 프로필 선택'}).selectOption(profile.playerId);
  await page.getByRole('button',{name:'수동 저장 불러오기',exact:true}).click();await page.getByRole('button',{name:'슬롯 1 불러오기',exact:true}).click();await page.locator('#skip-reward').click();
  if(stage===3||stage===7){await expect(page.locator('.shop-entry-preparation')).toBeVisible();await expect(page.locator('.shop-entry-preparation')).toContainText('다음 지역 준비 상점');if(stage===3)await capture('stage4-shop-preparation');await page.locator('#enter-stage').click();await page.locator(stage===3?'#choose-stage4-and':'#choose-stage8-who').click();}
  await expect(page.locator('.shop-inventory')).toBeVisible();await expect(page.locator('#leave-shop')).toHaveText('상점 나가기 · 다음 지역으로');
  await page.locator('#leave-shop').click();await page.getByRole('button',{name:'다음 지역으로',exact:true}).click();await expect(page.locator('.intro-page')).toBeVisible();await expect(page.locator('#attack-submit')).toHaveCount(0);
  if(stage===10){await expect(page.locator('.intro-page h1')).toHaveText('통사의 근원');await capture('final-introduction');}
  // Save the newly supported post-shop introduction via the actual save dialog.
  await page.getByRole('button',{name:'저장',exact:true}).click();await page.getByRole('button',{name:'슬롯 2 저장',exact:true}).click();await page.locator('dialog [role=status]').filter({hasText:'저장했습니다'}).waitFor();await page.keyboard.press('Escape');
  const saved=await page.evaluate(playerId=>new Promise(resolve=>{const op=indexedDB.open('sentence-balatro-v0-1',1);op.onsuccess=()=>{const db=op.result,req=db.transaction('slots').objectStore('slots').get(playerId+':2');req.onsuccess=()=>{db.close();resolve(req.result.run);};};}),profile.playerId);validateRunState(saved,registryForVersion(saved.version));assert.equal(saved.shop.closed,true);assert.equal(saved.combat,null);
  await page.reload();await page.getByRole('combobox',{name:'로컬 프로필 선택'}).selectOption(profile.playerId);await page.getByRole('button',{name:'수동 저장 불러오기',exact:true}).click();await page.getByRole('button',{name:'슬롯 2 불러오기',exact:true}).click();await page.locator('#enter-stage').click();await expect(page.locator('#attack-submit')).toBeVisible();
  if(stage===1)await expect(page.locator('.enemy-info h2')).toHaveText('선원 갈매기');if(stage===7)await expect(page.locator('.enemy-info h2')).toHaveText('청동 항아리');if(stage===10)await expect(page.locator('.enemy-info h2')).toHaveText('서피스 스트럭처');
  report.checks.push(`Stage ${stage} reward -> entry choice if needed -> shop -> intro -> save/reload -> first combat`);
 }
 assert.deepEqual(report.errors,[]);report.status='PASS';console.log(JSON.stringify(report));
}catch(e){report.status='FAIL';report.failure=e.stack;throw e;}finally{await fs.writeFile(`${out}/result.json`,JSON.stringify(report,null,2));await browser?.close();server.kill();}
