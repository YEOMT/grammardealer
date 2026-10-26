import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {spawn} from 'node:child_process';
const focus=process.env.SB_STABLE_FOCUS;const out='.local-validation/stable-ui/'+(focus??'browser');await fs.mkdir(out,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5194'],{stdio:['ignore','pipe','pipe']});let browser;
const report={scope:'focused assigned-state UI; no natural expedition',checks:[],errors:[]};
try{
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('5194'))resolve();});server.once('error',reject);});
 browser=await chromium.launch({args:['--proxy-server=direct://','--proxy-bypass-list=*']});const page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5194/');await page.locator('#start-run').waitFor();
 await page.evaluate(async()=>{
 const f=await import('/tests/helpers/corridor-state.js'),{renderCombat}=await import('/src/ui/combat.js'),p=await import('/src/engine/presentation.js');
 window.q={f,p,root:document.querySelector('#app'),settings:{speed:2},reset(){const x=f.assignedCorridor({version:'0.11.0',round:0,sentences:['I read books.'],words:Array(32).fill('book')});this.c=x.c;this.slots=x.slots;this.show();},rects(){return Object.fromEntries(['.game-header','.enemy-area','.combat-middle','.score-stage','.combat-sentence','.combat-actions','.hand-section'].map(sel=>{const r=this.root.querySelector(sel).getBoundingClientRect();return[sel,[r.x,r.y,r.width,r.height]];}));},show(locked=false,state=this.c.getState()){this.view?.cleanup();this.view=renderCombat(this.root,state,{locked,command:cmd=>this.command(cmd),openOverlay:()=>{}});},async command(cmd){const before=this.c.getState(),r=this.c.dispatch(cmd);if(!r.ok)throw Error(r.message);if(r.resolution){this.resolution=r.resolution;this.presenting=true;this.show(true,before);this.view.beginPresentation();const a=p.createDOMPresentation(this.view.element);this.samples=[];this.fx=[];const timer=setInterval(()=>this.samples.push(this.rects()),16);for(const name of ['charge','lunge']){const old=a[name];a[name]=arg=>{old(arg);const body=document.querySelector('.core-attack-body');this.fx.push({name,count:body?.querySelectorAll('.word-card').length,ids:body?.querySelectorAll('[data-card-id]').length,container:body?.querySelectorAll('.combat-sentence,.board-heading,button:not(.form-button)').length,width:body?.querySelector('.word-card').getBoundingClientRect().width,source:this.root.querySelector('.combat-sentence .word-card').getBoundingClientRect().width});};}await p.playAttack(r.resolution,a,this.settings);clearInterval(timer);this.f.checked(this.c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});this.presenting=false;}this.show();return r;}};q.reset();
 });
 const compare=(a,b)=>{for(const key in a)for(let i=0;i<4;i++)assert.ok(Math.abs(a[key][i]-b[key][i])<.8,`${key}[${i}] ${a[key][i]} -> ${b[key][i]}`);};
 for(const [w,h]of (focus?[]:[[1366,768],[1180,820],[1920,1080]])){
  await page.setViewportSize({width:w,height:h});if(w===1920)await page.locator('.fullscreen-toggle').click();
  let baseline;const widths={};
  for(const count of [0,5,6,9,10,11,12,13,24])for(const hand of [10,1,0]){
   const data=await page.evaluate(({count,hand})=>{const s=q.c.getState(),ids=s.activeCardIds;q.f.assignPiles(q.c,{sentence:ids.slice(0,count).map(cardInstanceId=>({cardInstanceId})),hand:ids.slice(count,count+hand)});q.show();const card=q.root.querySelector('.combat-sentence .word-card'),visible=[...q.root.querySelectorAll('.hand-cards .word-card')].filter(n=>!n.hidden),row=q.root.querySelector('.hand-page-row').getBoundingClientRect();return{rects:q.rects(),width:card?.getBoundingClientRect().width,handBottom:visible.length?innerHeight-Math.max(...visible.map(n=>n.getBoundingClientRect().bottom)):null,rowBottom:innerHeight-row.bottom};},{count,hand});
   if(!baseline)baseline=data.rects;else compare(baseline,data.rects);if(data.width)widths[count]=data.width;if(data.handBottom!==null)assert.ok(data.handBottom>=5&&data.handBottom<=10,JSON.stringify(data));
  }
  assert.ok(widths[5]>widths[6]&&widths[9]>widths[10]&&widths[11]>widths[12]);assert.equal(widths[12],widths[24]);
  await expect(page.locator('#attack-submit')).toBeInViewport({ratio:1});await page.screenshot({path:`${out}/board-${w}.png`});report.checks.push({id:`fixed-zones-${w}x${h}`,status:'PASS',widths});
  if(w===1920)await page.locator('.fullscreen-toggle').click();
 }
 await page.setViewportSize({width:1366,height:768});
 for(const settings of (focus==='remaining'?[]:focus?[{speed:2,fullscreen:true}]:[{speed:2},{speed:2,effectsOff:true},{speed:2,reducedMotion:true}])){
  await page.evaluate(settings=>{q.settings=settings;q.reset();q.f.assignPiles(q.c,{sentence:q.slots[0],hand:[]});q.show();},settings);
  if(settings.fullscreen)await page.locator('.fullscreen-toggle').click();
  const before=await page.evaluate(()=>q.rects());await page.locator('#attack-submit').click();await page.waitForFunction(()=>q.presenting===false,null,{timeout:60000});const after=await page.evaluate(()=>({rects:q.rects(),samples:q.samples,fx:q.fx,state:q.c.getState(),resolution:q.resolution}));
  for(const sample of after.samples)compare(before,sample);compare(before,after.rects);assert.equal(after.state.stats.attacks,1);assert.equal(after.state.combat.turnsRemaining,5);assert.ok(after.resolution.actualHpLoss>0);assert.equal(after.fx[0].count,3);assert.equal(after.fx[0].ids,0);assert.equal(after.fx[0].container,0);await expect(page.locator('.attack-overlay')).toHaveCount(0);report.checks.push({id:'real-attack-'+JSON.stringify(settings),status:'PASS',frames:after.samples.length});if(settings.fullscreen)await page.locator('.fullscreen-toggle').click();
 }
 if(focus!=='remaining'){
 await page.evaluate(async()=>{const {getEncounter}=await import('/src/data/stages.js');const s=q.c.getState();s.progress={stageId:'stage.01',roundIndex:0,battleNumber:1};s.combat.enemyState=getEncounter('stage.01',0,s.version);s.combat.enemyState.maxHp=s.combat.enemyState.hpMax;q.show(false,s);});
 const beforeHelp=await page.evaluate(()=>q.rects());await expect(page.getByRole('button',{name:'보스 공략',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'보너스 조건',exact:true}).click();await expect(page.locator('dialog[open]')).toContainText('I run.');await expect(page.locator('dialog[open]')).toContainText('주절');compare(beforeHelp,await page.evaluate(()=>q.rects()));await page.keyboard.press('Escape');await page.screenshot({path:`${out}/pc-help.png`});
 await page.evaluate(async()=>{const {renderBetween}=await import('/src/ui/progression.js');const s=q.c.getState();s.progress={stageId:'stage.01',roundIndex:0,battleNumber:1};q.view.cleanup();renderBetween(q.root,s,{onNext:()=>window.nextClicked=true,onSaves:()=>window.saveClicked=true});});await expect(page.locator('main')).not.toContainText('현재 덱 전체');await expect(page.locator('main')).not.toContainText('HP ');await page.locator('#next-battle').click();assert.equal(await page.evaluate(()=>window.nextClicked),true);report.checks.push({id:'fixed-help-and-between-copy',status:'PASS'});
 await page.evaluate(()=>{q.reset();});await page.getByRole('button',{name:'문법 도움말',exact:true}).click();await expect(page.locator('dialog[open]')).toContainText('현실 조건절');await page.keyboard.press('Escape');
 }
 if(!focus||focus==='remaining'){
  await page.evaluate(async()=>{q.reset();const {grantOperation}=await import('/tests/helpers/waterways-state.js');const id=grantOperation(q.c,'supply');q.f.assignPiles(q.c,{sentence:q.slots[0],hand:[id]});q.show();});
  const normal=await page.evaluate(()=>q.rects());const op=await page.locator('.hand-cards .operation-card').boundingBox();assert.ok(768-op.y-op.height>=5&&768-op.y-op.height<=10);await expect(page.getByRole('button',{name:'보급 사용',exact:true})).toBeInViewport();await page.screenshot({path:`${out}/pc-five-card-area.png`});await page.evaluate(()=>q.show(true));compare(normal,await page.evaluate(()=>q.rects()));await expect(page.locator('.hand-cards .card-select')).toBeDisabled();
  await page.evaluate(()=>{const ids=q.c.getState().activeCardIds;q.f.assignPiles(q.c,{sentence:[],hand:[ids.find(id=>id!==q.c.getState().combat.handIds[0])]});q.show(true);});await expect(page.locator('.hand-cards .card-select')).toBeDisabled();
  assert.equal(await page.evaluate(async()=>{const {wordCard}=await import('/src/ui/cards.js');const n=wordCard({id:'qa-dust',cardKind:'OBSTACLE',surface:'검은 먼지'},{readonly:true,onSelect:()=>{}});return n.querySelector('.card-select').disabled;}),true);
  report.checks.push({id:'operation-card-reserved-height',status:'PASS'});
  await page.evaluate(()=>{q.c=q.f.assignedCorridor({version:'0.11.0',round:4}).c;q.show();});const boss=await page.evaluate(()=>q.rects());await page.getByRole('button',{name:'보스 공략',exact:true}).click();await expect(page.locator('dialog[open]')).toContainText('직전 공격의 주절 문형');compare(boss,await page.evaluate(()=>q.rects()));await page.keyboard.press('Escape');report.checks.push({id:'boss-help-preserves-layout',status:'PASS'});
 }
 assert.deepEqual(report.errors,[]);report.status='PASS';console.log(JSON.stringify(report));
}catch(e){report.status='FAIL';report.failure=e.stack;throw e;}finally{await fs.writeFile(`${out}/result.json`,JSON.stringify(report,null,2));await browser?.close();server.kill();}
