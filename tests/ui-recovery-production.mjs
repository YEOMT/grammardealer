import {chromium,expect} from '@playwright/test';
import {playGuided} from './helpers/guided-browser.mjs';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const out=process.env.SB_RECOVERY_PROD_OUT??'.local-validation/ui-recovery-r2/production';await fs.mkdir(out,{recursive:true});
const port=4182,base=`http://127.0.0.1:${port}/grammardealer/`,server=spawn(process.execPath,['tools/static-server.mjs','dist',String(port),'/grammardealer/'],{stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>c&&reject(Error('Server failed')));});
const browser=await chromium.launch({headless:true,args:['--proxy-server=direct://','--proxy-bypass-list=*']}),context=await browser.newContext({viewport:{width:1366,height:650},recordVideo:{dir:out+'/video'}}),page=await context.newPage();page.setDefaultTimeout(20000);
const report={scope:'PRODUCTION_NEW_RUN_REAL_UI_TUTORIAL_NOT_47_BATTLES',checks:[],captures:[],errors:[],resources:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>report.errors.push(r.url()));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());if(/\.(js|css)(\?|$)/.test(r.url()))report.resources.push({url:new URL(r.url()).pathname,status:r.status()});});
const capture=async id=>{await page.screenshot({path:out+'/'+id+'.png'});report.captures.push(id+'.png');};
try{
 await page.goto(base);await page.locator('#start-run').waitFor();assert.equal(await page.evaluate(()=>!!window.__SB_DEV__),false);await expect(page.locator('.version-badge')).toContainText('0.10.2');await capture('production-lobby');
 await page.locator('#player-name').fill('Recovery QA');await page.locator('.seed-details summary').click();await page.locator('#run-seed').fill('recovery.production');await page.locator('#start-run').click();await page.locator('#start-battle').click();
 await playGuided(page,{capture});report.checks.push({id:'PRODUCTION_GUIDED_40_126',status:'PASS'});
 await page.getByRole('button',{name:'저장',exact:true}).last().click();await page.getByRole('button',{name:'슬롯 1 저장',exact:true}).click();await page.locator('dialog [role=status]').filter({hasText:'저장했습니다'}).waitFor();await page.locator('dialog[open] .dialog-header button').click();
 const rows=await page.evaluate(()=>new Promise((resolve,reject)=>{const open=indexedDB.open('sentence-balatro-v0-1',1);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,tx=db.transaction('slots','readonly'),r=tx.objectStore('slots').getAll();r.onsuccess=()=>resolve(r.result);tx.oncomplete=()=>db.close();};}));
 const run=rows[0].run;assert.equal(run.version,'0.10.2');assert.equal(run.combat.rulesSnapshot.sentenceLimit,24);assert.equal(run.activeCardIds.length,28);assert.equal(run.economy.gold,5);report.checks.push({id:'PRODUCTION_NEW_POLICY_SAVE',status:'PASS'});
 assert.ok(report.resources.length>=2&&report.resources.every(r=>r.status===200&&r.url.startsWith('/grammardealer/')));assert.deepEqual(report.errors,[]);report.checks.push({id:'PRODUCTION_BASEPATH_RESOURCES',status:'PASS'});
}catch(e){report.errors.push(e.stack);await capture('failure');process.exitCode=1;}
finally{await context.close();await browser.close();server.kill();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
