import {mountCombatQA} from './helpers/combat-ui-browser.js';
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out=process.env.SB_LOBBY_POLISH_OUT??'.local-validation/lobby-polish/browser';
await fs.mkdir(out,{recursive:true});
const focused=process.env.SB_LOBBY_POLISH_FOCUS==='score';
const report={scope:'Chromium representative UI and assigned real-controller attacks; not campaign completion',checks:[],errors:[]};
const pass=(group,data)=>report.checks.push({group,status:'PASS',...data});
const same=(a,b)=>{for(const k in a)for(let i=0;i<4;i++)assert.ok(Math.abs(a[k][i]-b[k][i])<.8,`${k}: ${a[k]} -> ${b[k]}`);};
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(process.env.SB_POLISH_URL??'http://127.0.0.1:5173/');await page.locator('#start-run').waitFor();await page.locator('.scene-backdrop[data-ready=true]').waitFor();
 if(!focused){
 await page.locator('#player-name').fill('UI QA');await page.locator('#vocabulary-mode').selectOption('STANDARD');await page.locator('.seed-details summary').click();await page.locator('#run-seed').fill('lobby.polish');
 await page.getByRole('button',{name:'설정',exact:true}).click();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'기록',exact:true}).click();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'수동 저장 불러오기',exact:true}).click();await page.keyboard.press('Escape');
 await expect(page.locator('#player-name')).toHaveValue('UI QA');await expect(page.locator('#run-seed')).toHaveValue('lobby.polish');
 await page.screenshot({path:out+'/lobby.png',fullPage:true});
 await page.locator('#start-run').click();await page.locator('#start-battle').waitFor();await page.locator('#start-battle').click();await page.locator('.hand-cards .word-card').first().waitFor();
 await page.waitForFunction(async()=>{const {audio}=await import('/src/services/audio.js');return audio.bgmSnapshot().sources.some(x=>x.assetId==='stage.01');});
 pass(1,{nameSeedModeAndModals:true,realNewRunToFirstBattle:true});
 }
 // Reuse existing physical-card assignment helpers for short, bounded UI cases.
 await page.evaluate(mountCombatQA);
 await page.locator('.monster-image[data-ready=true]').first().waitFor();await page.locator('.combat-backdrop[data-ready=true]').waitFor();
 if(!focused){
 const art=await page.evaluate(()=>{const layer=document.querySelector('.combat-backdrop'),r=layer.getBoundingClientRect(),header=document.querySelector('.game-header').getBoundingClientRect(),enemy=document.querySelector('.enemy-area').getBoundingClientRect();return{count:document.querySelectorAll('.responsive-battle .scene-backdrop').length,rect:r.toJSON(),header:header.toJSON(),enemy:enemy.toJSON(),url:getComputedStyle(layer).backgroundImage};});
 assert.equal(art.count,1);assert.ok(art.rect.top<=art.header.top&&Math.abs(art.rect.bottom-art.enemy.bottom)<1);
 const beforeLoad=await page.evaluate(()=>q.rects());await page.route('**/stage-01/combat.png',r=>r.abort());await page.evaluate(()=>q.show());await page.waitForTimeout(250);same(beforeLoad,await page.evaluate(()=>q.rects()));await expect(page.locator('#attack-submit')).toBeVisible();await page.unroute('**/stage-01/combat.png');
 pass(2,{art,failedImageStable:true});
 const bosses=[];
 for(const stage of ['stage.01','stage.02']){
  await page.evaluate(stage=>{q.reset();const s=q.c.getState(),round=stage==='stage.01'?2:3;s.progress={stageId:stage,roundIndex:round,battleNumber:stage==='stage.01'?3:7};s.combat=null;q.c._beginBattle(s);q.c._state=s;q.show();},stage);
  await page.waitForFunction(()=>document.querySelectorAll('.monster-image[data-ready=true]').length===2);
  const data=await page.evaluate(async()=>{const {monsterPaintBounds}=await import('/tests/helpers/monster-paint-bounds.js');const r=s=>document.querySelector(s).getBoundingClientRect().toJSON(),css=getComputedStyle(document.querySelector('.enemy-info'));return{left:r('.enemy-tactics'),right:r('.enemy-info'),monster:monsterPaintBounds(),images:[...document.querySelectorAll('.monster-image')].map(n=>({rect:n.getBoundingClientRect().toJSON(),anchor:getComputedStyle(n).objectPosition})),hp:r('.hp-track'),padding:[css.paddingTop,css.paddingRight]};});
  assert.ok(data.left.right<data.monster.left&&data.monster.right<data.right.left);assert.deepEqual(data.images[0].rect,data.images[1].rect);assert.equal(data.images[0].anchor,data.images[1].anchor);assert.ok(data.hp.left>=data.right.left+15&&data.hp.right<=data.right.right-15);bosses.push({stage,...data});
 }
 pass(3,{bosses});
 const geometry=[];
 for(const [width,height,fullscreen]of [[1366,768,false],[1920,1080,true],[1180,820,false]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>{q.reset();q.f.assignSentence(q.c,'I read books '.repeat(8));q.show();});if(fullscreen)await page.locator('.fullscreen-toggle').click();
  let base;
  for(const [count,hand]of [[0,14],[13,10],[24,0]]){
   await page.evaluate(({count,hand})=>{const ids=q.c.getState().activeCardIds;q.f.assignPiles(q.c,{sentence:ids.slice(0,count).map(cardInstanceId=>({cardInstanceId})),hand:ids.slice(count,count+hand)});q.show();},{count,hand});
   const data=await page.evaluate(()=>({rects:q.rects(),cards:q.bounds()}));if(base)same(base,data.rects);else base=data.rects;for(const c of data.cards)assert.ok(c.gap>=12&&c.gap<=16,`gap ${c.gap}`);
   if(hand){await page.locator('.card-select:visible').first().click();const selected=await page.evaluate(()=>q.bounds());for(const c of selected)assert.ok(c.gap>=12&&c.gap<=16,`selected gap ${c.gap}`);data.selected=selected;if(hand===14){await page.getByRole('button',{name:'다음 손패 페이지',exact:true}).click();same(base,await page.evaluate(()=>q.rects()));}}
   geometry.push({width,height,fullscreen,count,hand,...data});
   if(width===1180&&count===13)await page.screenshot({path:out+'/tablet.png'});
  }
  if(fullscreen){assert.equal(await page.evaluate(()=>!!document.fullscreenElement),true);await page.locator('.fullscreen-toggle').click();}
 }
 pass(5,{geometry,coordinateSystem:'CSS pixels, visualViewport offsetTop + height; selected outline included; safe-area 0'});
 }
 await page.setViewportSize({width:1366,height:768});const attacks=[];
 for(const [i,sentence]of ['I run.','She will be giving me a kind book.'].entries()){
  await page.evaluate(({i,sentence})=>{q.reset();const s=q.c.getState();s.progress.roundIndex=1;s.progress.battleNumber=2;s.combat=null;s.eligibility.runOwnUnlocks.push('pack.svoo','pack.time.progressive','pack.time.futureWill');s.runes.orderedInstanceIds=['qa.rune'];s.runes.instances={'qa.rune':{instanceId:'qa.rune',runeId:i?'rune.svoo':'rune.sv',level:1}};q.c._beginBattle(s);q.c._state=s;q.f.assignSentence(q.c,sentence);q.show();},{i,sentence});
  await page.locator('.monster-image[data-ready=true]').first().waitFor();const before=await page.evaluate(()=>q.rects());
  if(!i)await page.screenshot({path:out+'/battle.png'});
  await page.locator('#attack-submit').click();await page.waitForFunction(()=>q.events.length>=3);if(i)await page.screenshot({path:out+'/score.png'});await page.waitForFunction(()=>q.presenting===false,null,{timeout:30000});
  const data=await page.evaluate(()=>({samples:q.samples,events:q.events,final:q.final,timeline:q.resolution.scoreTimeline,finalPower:q.resolution.finalPower,actualHpLoss:q.resolution.actualHpLoss,attacks:q.c.getState().stats.attacks}));
  for(const sample of data.samples){same(before,sample.rects);assert.equal(sample.logRows,0);for(const b of sample.boxes){assert.ok(b.scroll[0]<=b.client[0]+1&&b.scroll[1]<=b.client[1]+1,JSON.stringify(b));assert.equal(b.overflow,'visible');}}
  assert.deepEqual(data.events.map(x=>x.id),data.timeline.map(x=>x.eventId));assert.deepEqual(data.events.map(x=>x.after),data.timeline.map(x=>x.after));assert.equal(data.final.score,data.finalPower);assert.equal(data.attacks,1);if(i)assert.ok(data.timeline.filter(e=>e.operation==='MULTIPLY').length>=4);
  await page.getByRole('button',{name:'공격 기록',exact:true}).click();await page.locator('.app-dialog details summary').first().click();assert.equal(await page.locator('.timeline-table tbody tr').count(),data.timeline.length);await page.keyboard.press('Escape');attacks.push({...data,samples:data.samples.length});
 }
 pass(4,{attacks,fullHistoryRowsRetained:true});
 const continuity=await page.evaluate(async()=>{q.reset();q.show();await new Promise(r=>setTimeout(r,1800));const before=q.audio.bgmSnapshot();q.show();q.show();return{before,after:q.audio.bgmSnapshot()};});assert.equal(continuity.before.sources.length,1);assert.equal(continuity.before.sources[0].startedAt,continuity.after.sources[0].startedAt);assert.equal(continuity.after.sources.length,1);pass(6,{continuity,physicalDevice:'NOT RUN',listening:'NOT RUN'});
 assert.deepEqual(report.errors,[]);report.status='PASS';console.log(JSON.stringify({status:report.status,groups:report.checks.map(x=>x.group)}));
}catch(e){report.status='FAIL';report.failure=e.stack;throw e;}finally{await fs.writeFile(out+'/result.json',JSON.stringify(report,null,2));await browser.close();}
