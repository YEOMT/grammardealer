/** Focused assigned-state UI checks. No natural campaign or physical-device claim. */
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out=process.env.SB_COMMA_OUT||'.local-validation/v014/browser';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch(),report={scope:'Assigned real card snapshots, controller commands and Chromium browser input; not natural campaign or physical iOS/Android.',checks:[],captures:[],errors:[]};
const only=process.argv.find(x=>x.startsWith('--section='))?.slice(10);
let context,page;
async function check(name,fn){if(only&&only!==name)return;try{report.checks.push({name,status:'PASS',evidence:await fn()});console.log('PASS',name);}catch(error){report.checks.push({name,status:'FAIL',error:error.stack});console.error('FAIL',name,error.message);}}
const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const state=()=>page.evaluate(()=>q.c.getState());
const marker=()=>page.locator('.combat-sentence .comma-marker');
const card=i=>page.locator('.combat-sentence .word-card').nth(i);
const pos=async n=>{const r=await n.boundingBox();assert.ok(r);return{x:r.x+r.width/2,y:r.y+r.height/2};};
async function capture(name){if(process.argv.includes('--no-captures'))return;await page.screenshot({path:`${out}/${name}.png`});report.captures.push(name+'.png');}
async function boot(mobile=false){
 await context?.close();context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1366,height:768},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:1});page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto((process.env.SB_BASE_URL||'http://127.0.0.1:5173/')+'?debug=1#lobby');await page.locator('#start-run').waitFor();
 await page.evaluate(async()=>{
  const f=await import('/tests/helpers/corridor-state.js'),{renderCombat}=await import('/src/ui/combat.js'),p=await import('/src/engine/presentation.js'),{openRecentAttack,openRecords}=await import('/src/ui/overlays.js');
  window.q={f,p,root:document.querySelector('#app'),selected:new Set(),count:0,events:[],
   show(locked=false,s=this.c.getState()){this.view=renderCombat(this.root,s,{previous:this.view,locked,selected:this.selected,command:c=>this.command(c),openOverlay:id=>{if(id==='recent')openRecentAttack(this.c.getState());if(id==='records')openRecords(this.c.profile,this.c.getState());}});},
   assigned(text='Seeing you I smiled',round=0){this.view?.cleanup();this.view=null;const{c,slots}=f.assignedCorridor({version:'0.14.0',round,seed:'comma.ui.'+round,sentences:[text]});this.c=c;f.place(c,slots[0]);const s=c.getState(),used=new Set(slots[0].map(x=>x.cardInstanceId));s.combat.handIds=s.combat.drawIds.splice(0,Math.min(10,s.combat.rulesSnapshot.handLimit));this.c._state=s;this.count=0;this.show();return slots[0];},
   async command(cmd){this.count++;const before=this.c.getState(),r=f.checked(this.c,cmd);this.lastResult=r;if(!r.resolution){this.show();return r;}this.resolution=r.resolution;this.show(true,before);this.view.beginPresentation();this.presenting=true;this.fx=[];const timer=setInterval(()=>this.fx.push({phase:this.view.element.dataset.corePhase,copies:document.querySelector('.core-attack-body')?.children.length??0,commas:document.querySelectorAll('.core-attack-body .comma-marker').length}),16);try{await p.playAttack(r.resolution,p.createDOMPresentation(this.view.element),{speed:2});f.checked(this.c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});}finally{clearInterval(timer);this.presenting=false;this.show();}return r;}
  };q.assigned();
 });await settle();
}
async function placeAt(i,{before=false}={}){await page.locator('.comma-tool').click();const target=card(i).locator('.card-body'),r=await target.boundingBox();await target.click({position:{x:before?2:r.width-3,y:r.height/2}});await settle();}
async function drag(source,target){await page.mouse.move(source.x,source.y);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:12});await page.mouse.up();await settle();}
try{
 await check('pc-tool-and-actual-attacks',async()=>{
  await boot();const initial=await state();assert.equal(initial.combat.commaUnlocked,true);const resources=s=>[s.combat.turnsRemaining,s.combat.exchangesRemaining,s.rng,s.activeCardIds,s.combat.handIds];
  await placeAt(1);let s=await state();assert.deepEqual(resources(s),resources(initial));assert.equal(s.combat.punctuation.comma.afterCardInstanceId,s.combat.sentenceSlots[1].cardInstanceId);await expect(marker()).toHaveCount(1);
  await page.locator('.comma-tool').click();await page.getByRole('button',{name:'취소',exact:true}).click();assert.deepEqual((await state()).combat.punctuation,s.combat.punctuation);
  await page.locator('.comma-tool').click();await page.getByRole('button',{name:'회수',exact:true}).click();await expect(marker()).toHaveCount(0);
  const target=await card(1).boundingBox();await drag(await pos(page.locator('.comma-tool')),{x:target.x+target.width-2,y:target.y+20});await expect(marker()).toHaveCount(1);
  const bar=await marker().boundingBox(),word=await card(1).boundingBox();assert.ok(Math.abs(bar.height-word.height)<1);assert.ok(bar.width<word.width/2);await capture('pc-comma');await page.locator('#attack-submit').click();await page.waitForFunction(()=>q.resolution&&!q.presenting);s=await state();
  const r=await page.evaluate(()=>q.resolution);assert.equal(r.analysis.status,'VALID');assert.deepEqual(r.sentenceSnapshot.punctuation,[{kind:'COMMA',gapIndex:2}]);assert.equal(s.combat.turnsRemaining,initial.combat.turnsRemaining-1);assert.equal(s.stats.history.filter(x=>x.attackId===r.attackId).length,1);assert.equal(s.combat.punctuation.comma,null);await expect(page.locator('.comma-tool')).toBeVisible();
  const fx=await page.evaluate(()=>q.fx);assert.ok(fx.some(x=>x.phase==='CHARGE'&&x.copies===r.sentenceSnapshot.orderedTokens.length&&x.commas===1),JSON.stringify(fx));assert.ok(fx.some(x=>x.phase==='LUNGE'&&x.copies===r.sentenceSnapshot.orderedTokens.length));
  await page.getByRole('button',{name:'기록',exact:true}).click();await expect(page.locator('dialog[open] summary .player-sentence')).toContainText('seeing you, I smiled');await page.locator('dialog[open] .dialog-header button').click();
  await page.evaluate(()=>q.assigned('I like games',0));await placeAt(0);await page.locator('#attack-submit').click();await page.waitForFunction(()=>q.resolution?.sentenceSnapshot?.orderedTokens?.length===3&&!q.presenting);const issue=await page.evaluate(()=>q.resolution);assert.equal(issue.analysis.status,'VALID_WITH_ISSUES');assert.ok(issue.scoreTimeline.some(e=>e.after<e.before&&/쉼표/.test(e.labelKo)));
  return{nativePointerPlacement:true,drag:true,cancellation:true,actualAttack:r.attackId,wordCount:r.sentenceSnapshot.orderedTokens.length,commaPenalty:issue.scoreTimeline.filter(e=>/쉼표/.test(e.labelKo)),fxSamples:fx.length};
 });
 await check('mobile-24-boundaries-and-cancellation',async()=>{
  await boot(true);await page.evaluate(()=>q.assigned(Array.from({length:12},()=>['I','go']).flat().join(' '),0));await settle();let s=await state();assert.equal(s.combat.sentenceSlots.length,24);
  const geometry=await page.locator('.combat-sentence .word-card').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{id:n.dataset.cardId,x:r.x,y:r.y,w:r.width,h:r.height};}));const rows=[...new Set(geometry.map(x=>Math.round(x.y)))];assert.equal(rows.length,3);for(const y of rows)assert.equal(geometry.filter(x=>Math.round(x.y)===y).length,8);
  await placeAt(7);await expect(marker()).toHaveCount(1);assert.equal(await marker().evaluate(n=>n.parentElement.dataset.cardId),s.combat.sentenceSlots[7].cardInstanceId);
  const box=await marker().boundingBox(),left=await card(7).boundingBox(),next=await card(8).boundingBox();assert.ok(box.x>=left.x+left.width-1);assert.ok(box.y<next.y);assert.equal((await state()).combat.sentenceSlots.length,24);
  await page.locator('.comma-tool').click();await page.getByRole('button',{name:'위치 목록',exact:true}).click();await page.getByRole('button',{name:'문장 맨 앞',exact:true}).click();assert.equal((await state()).combat.punctuation.comma.afterCardInstanceId,null);await expect(marker()).toHaveClass(/comma-before/);
  await page.locator('.comma-tool').click();await page.getByRole('button',{name:'회수',exact:true}).click();await page.getByRole('button',{name:'문장 뒷부분 보기',exact:true}).click();await settle();await placeAt(23);assert.equal((await state()).combat.punctuation.comma.afterCardInstanceId,s.combat.sentenceSlots[23].cardInstanceId);
  await page.locator('.comma-tool').click();await page.getByRole('button',{name:'취소',exact:true}).click();await card(23).locator('.form-button').click();await page.getByRole('button',{name:/형태 went/}).click();assert.equal((await state()).combat.punctuation.comma.afterCardInstanceId,s.combat.sentenceSlots[23].cardInstanceId);
  const before=await state();await page.setViewportSize({width:812,height:375});await settle();assert.deepEqual(await state(),before);await expect(page.locator('.comma-tool')).toBeVisible();await page.setViewportSize({width:844,height:390});await settle();
  const tool=await pos(page.locator('.comma-tool')),cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...tool}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:tool.x-30,y:tool.y-30}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:tool.x-30,y:tool.y-30},{id:2,x:tool.x-80,y:tool.y-30}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settle();await expect(page.locator('.comma-ghost')).toHaveCount(0);assert.deepEqual(await state(),before);
  await page.locator('.comma-tool').tap();await expect(page.locator('.comma-controls')).toBeVisible();await page.getByRole('button',{name:'취소',exact:true}).tap();
  await page.getByRole('button',{name:'문장 뒷부분 보기',exact:true}).click();await settle();await capture('mobile-24-comma');
  return{rows:[8,8,8],wordCount:24,markerAtLastWord:true,twoPointerCancelledWithoutCommand:true,viewportPreserved:true,tool:await page.locator('.comma-tool').boundingBox(),handBottom:await page.locator('.hand-cards>.word-card:not([hidden])').evaluateAll(ns=>ns.map(n=>innerHeight-n.getBoundingClientRect().bottom))};
 });
 await check('anchor-edit-and-pc-twelve',async()=>{
  await boot();await placeAt(1);let s=await state(),anchor=s.combat.punctuation.comma.afterCardInstanceId;
  await card(1).locator('.form-button').click();await page.getByRole('button',{name:'← 왼쪽으로',exact:true}).click();
  assert.equal((await state()).combat.sentenceSlots[0].cardInstanceId,anchor);assert.equal(await marker().evaluate(n=>n.parentElement.dataset.cardId),anchor);
  await card(0).locator('.form-button').click();await page.getByRole('button',{name:'손패와 맞교환',exact:true}).click();const swapped=(await state()).combat.handIds[0];await page.locator('dialog[open] .form-choices>button').first().click();
  assert.equal((await state()).combat.punctuation.comma.afterCardInstanceId,swapped);assert.equal(await marker().evaluate(n=>n.parentElement.dataset.cardId),swapped);
  await page.locator('.hand-cards>.word-card:not([hidden]) .card-body').first().click();await card(0).locator('.card-body').click();await expect(marker()).toHaveCount(0);assert.equal((await state()).combat.punctuation.comma,null);
  await page.evaluate(()=>q.assigned(Array.from({length:12},()=>['I','go']).flat().join(' '),0));await settle();await placeAt(11);
  const positions=await page.locator('.combat-sentence .word-card').evaluateAll(ns=>ns.map(n=>Math.round(n.getBoundingClientRect().y)));assert.equal(new Set(positions).size,2);for(const y of new Set(positions))assert.equal(positions.filter(n=>n===y).length,12);
  const before=await state();await page.getByRole('button',{name:'전체화면 전환',exact:true}).click();await page.waitForFunction(()=>!!document.fullscreenElement);await settle();assert.deepEqual(await state(),before);
  const start=await pos(page.locator('.comma-tool')),end=await card(1).boundingBox();await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x+end.width-2,end.y+12,{steps:12});assert.equal(await page.locator('.comma-ghost').evaluate(n=>n.parentElement===document.fullscreenElement),true);await page.mouse.up();await settle();await expect(marker()).toHaveCount(1);assert.equal((await state()).combat.punctuation.comma.afterCardInstanceId,before.combat.sentenceSlots[1].cardInstanceId);
  await page.getByRole('button',{name:'전체화면 전환',exact:true}).click();await page.waitForFunction(()=>!document.fullscreenElement);
  return{anchorFollowsReorder:true,swapKeepsBoundary:true,returnRetrievesMarker:true,rows:[12,12],fullscreenDragHost:true};
 });
}finally{await context?.close();await browser.close();await fs.writeFile(out+'/result.json',JSON.stringify(report,null,2));}
if(report.errors.length||report.checks.some(x=>x.status==='FAIL'))process.exitCode=1;
