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
 await page.evaluate(async()=>{
  const f=await import('/tests/helpers/waterways-state.js'),{RunController}=await import('/src/game/runController.js'),{newProfile}=await import('/src/services/localStore.js'),{renderCombat}=await import('/src/ui/combat.js'),{openRecentAttack}=await import('/src/ui/overlays.js'),p=await import('/src/engine/presentation.js'),{audio}=await import('/src/services/audio.js'),music=await import('/src/services/musicContext.js'),{getEncounter}=await import('/src/data/stages.js');
  document.querySelectorAll('.guided-coach').forEach(n=>n.remove());
  window.q={f,p,audio,getEncounter,root:document.querySelector('#app'),reset(){this.view?.cleanup();this.c=new RunController({profile:{...newProfile('UI QA'),guidedTutorialCompletedVersion:'0.2.1'}});f.checked(this.c,{type:'NEW_RUN',config:{seed:'lobby.polish.qa'}});f.checked(this.c,{type:'START_BATTLE'});},show(locked=false,state=this.c.getState()){this.view?.cleanup();this.view=renderCombat(this.root,state,{locked,command:c=>this.command(c),openOverlay:id=>{if(id==='recent')openRecentAttack(this.c.getState());}});audio.setBgmAsset(music.resolveMusicContext('#game',state),music.musicManifest);},rects(){return Object.fromEntries(['.game-header','.enemy-area','.combat-middle','.score-stage','.combat-sentence','.combat-actions','.hand-section'].map(s=>{const r=this.root.querySelector(s).getBoundingClientRect();return[s,[r.x,r.y,r.width,r.height]];}));},bounds(){const nodes=[...this.root.querySelectorAll('.hand-cards>.word-card:not([hidden])')],v=visualViewport;return nodes.length?nodes.map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect(),extra=n.classList.contains('selected')?Math.max(0,parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset)):0;return{bottom:r.bottom,selectionBottom:r.bottom+extra,gap:v.offsetTop+v.height-r.bottom-extra,width:r.width,height:r.height};}):[{gap:v.offsetTop+v.height-this.root.querySelector('.hand-page-row').getBoundingClientRect().bottom}];},scoreBox(){return [...this.root.querySelectorAll('.score-stage,.score-copy')].map(n=>({client:[n.clientWidth,n.clientHeight],scroll:[n.scrollWidth,n.scrollHeight],overflow:getComputedStyle(n).overflow,text:n.textContent}));},async command(cmd){const before=this.c.getState(),r=f.checked(this.c,cmd);if(!r.resolution){this.show();return;}this.resolution=r.resolution;this.show(true,before);this.view.beginPresentation();this.presenting=true;this.samples=[];this.events=[];const a=p.createDOMPresentation(this.view.element,{audio}),score=a.onScore;a.onScore=(e,ctx)=>{score(e,ctx);this.events.push({id:e.eventId,label:this.root.querySelector('.score-label').textContent,after:Number(this.root.querySelector('.score-number').textContent)});};const timer=setInterval(()=>this.samples.push({rects:this.rects(),boxes:this.scoreBox(),logRows:this.root.querySelectorAll('.score-log>*').length}),16);await p.playAttack(r.resolution,a,{speed:1.5});clearInterval(timer);this.final={score:Number(this.root.querySelector('.score-number').textContent),label:this.root.querySelector('.score-label').textContent};f.checked(this.c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});this.presenting=false;this.show();}};
  q.reset();q.show();
 });
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
  const data=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect().toJSON(),css=getComputedStyle(document.querySelector('.enemy-info'));return{left:r('.enemy-tactics'),right:r('.enemy-info'),monster:r('.monster-art-motion'),images:[...document.querySelectorAll('.monster-image')].map(n=>({rect:n.getBoundingClientRect().toJSON(),anchor:getComputedStyle(n).objectPosition})),hp:r('.hp-track'),padding:[css.paddingTop,css.paddingRight]};});
  assert.ok(data.left.right<data.monster.left&&data.monster.right<data.right.left);assert.deepEqual(data.images[0].rect,data.images[1].rect);assert.equal(data.images[0].anchor,data.images[1].anchor);assert.ok(data.hp.left>=data.right.left+15&&data.hp.right<=data.right.right-15);bosses.push({stage,...data});
 }
 pass(3,{bosses});
 const geometry=[];
 for(const [width,height,fullscreen]of [[1366,768,false],[1920,1080,true],[1180,820,false]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>{q.reset();q.f.assignSentence(q.c,'I read books '.repeat(8));q.show();});if(fullscreen)await page.locator('.fullscreen-toggle').click();
  let base;
  for(const [count,hand]of [[0,14],[13,10],[24,0]]){
   await page.evaluate(({count,hand})=>{const ids=q.c.getState().activeCardIds;q.f.assignPiles(q.c,{sentence:ids.slice(0,count).map(cardInstanceId=>({cardInstanceId})),hand:ids.slice(count,count+hand)});q.show();},{count,hand});
   const data=await page.evaluate(()=>({rects:q.rects(),cards:q.bounds()}));if(base)same(base,data.rects);else base=data.rects;for(const c of data.cards)assert.ok(c.gap>=8&&c.gap<=10,`gap ${c.gap}`);
   if(hand){await page.locator('.card-select:visible').first().click();const selected=await page.evaluate(()=>q.bounds());for(const c of selected)assert.ok(c.gap>=8&&c.gap<=10,`selected gap ${c.gap}`);data.selected=selected;if(hand===14){await page.getByRole('button',{name:'다음 손패 페이지',exact:true}).click();same(base,await page.evaluate(()=>q.rects()));}}
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
