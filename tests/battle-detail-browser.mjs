import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {mountCombatQA} from './helpers/combat-ui-browser.js';
const out=process.env.SB_DETAIL_OUT??'.local-validation/battle-detail/browser';
await fs.mkdir(out,{recursive:true});
const report={scope:'Six focused Chromium groups; assigned states and real controller attacks, not a campaign',checks:[],errors:[]};
const pass=(group,data)=>report.checks.push({group,status:'PASS',...data});
const same=(a,b)=>{for(const k in a)for(let i=0;i<4;i++)assert.ok(Math.abs(a[k][i]-b[k][i])<.8,`${k}: ${a[k]} -> ${b[k]}`);};
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(process.env.SB_DETAIL_URL??'http://127.0.0.1:5173/');await page.locator('#start-run').waitFor();
 const lobby=await page.locator('.lobby').evaluate(n=>({background:getComputedStyle(n).background,buttons:n.querySelectorAll('button').length}));
 await page.evaluate(mountCombatQA);
 await page.evaluate(()=>{q.metrics=async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const r=n=>n.getBoundingClientRect(),row=r(q.root.querySelector('.hand-page-row')),cy=row.y+row.height/2;return {rects:q.rects(),cards:q.bounds(),centers:[...q.root.querySelectorAll('.pile-button,.hand-page-row>button')].map(n=>({class:n.className,offset:r(n).y+r(n).height/2-cy})),buttons:[...q.root.querySelectorAll('.status-nav button,.combat-actions button,.exchange-row button')].map(n=>({text:n.textContent,rect:r(n).toJSON()}))};};q.art=async()=>{const {monsterPaintBounds}=await import('/tests/helpers/monster-paint-bounds.js');const r=s=>q.root.querySelector(s).getBoundingClientRect().toJSON();return{paint:monsterPaintBounds(q.root),left:r('.enemy-tactics'),right:r('.enemy-info'),stage:r('.enemy-area'),poses:[...q.root.querySelectorAll('.monster-image')].map(n=>({rect:n.getBoundingClientRect().toJSON(),anchor:getComputedStyle(n).objectPosition}))};};});
 const geometry=[];let base;
 for(const count of [6,0,1,10,14]){
  await page.evaluate(count=>{const ids=q.c.getState().activeCardIds;q.f.assignPiles(q.c,{sentence:[],hand:ids.slice(0,count)});q.show();},count);
  const data=await page.evaluate(()=>q.metrics());if(base)same(base,data.rects);else base=data.rects;
  for(const c of data.cards)assert.ok(c.gap>=12&&c.gap<=16,`gap ${c.gap}`);
  for(const c of data.centers)assert.ok(Math.abs(c.offset)<.8,JSON.stringify(c));
  if(count===6){
   const css=await page.locator('.hand-cards .word-card').evaluateAll(nodes=>nodes.map(n=>{const c=getComputedStyle(n),w=getComputedStyle(n.querySelector('.card-word'));return{width:c.width,height:c.height,font:w.font,color:c.color,border:c.border,background:c.background,borderRadius:c.borderRadius};}));
   if(process.env.SB_DETAIL_BEFORE){const before=JSON.parse(await fs.readFile(process.env.SB_DETAIL_BEFORE,'utf8'));same(before.rects,data.rects);assert.deepEqual(css,before.cardCSS);}
   await page.waitForFunction(()=>document.querySelectorAll('.monster-image[data-ready=true]').length===2);await page.locator('.combat-backdrop[data-ready=true]').waitFor();await page.screenshot({path:out+'/after-pc.png'});
  }
  if(count===14){await page.getByRole('button',{name:'다음 손패 페이지',exact:true}).click();assert.equal(await page.locator('.hand-cards>.word-card:visible').count(),4);same(base,(await page.evaluate(()=>q.metrics())).rects);}
  geometry.push({hand:count,...data});
 }
 pass(1,{geometry,cardAppearanceMatchesBefore:!!process.env.SB_DETAIL_BEFORE,coordinateSystem:'CSS visualViewport; selected outline measured below; safe-area=0'});
 await page.evaluate(()=>{q.reset();q.show();});
 const ids=await page.evaluate(()=>q.c.getState().activeCardIds.slice().sort());
 await page.locator('.hand-cards .card-body:visible').first().click();assert.equal(await page.locator('.combat-sentence .word-card').count(),1);
 await page.locator('.combat-sentence .card-body').click();assert.equal(await page.locator('.combat-sentence .word-card').count(),0);
 await page.locator('.card-select:visible').first().click();for(const c of await page.evaluate(()=>q.bounds()))assert.ok(c.gap>=12&&c.gap<=16);
 await page.getByRole('button',{name:/^버리기 \(1장\)/}).click();
 const afterExchange=await page.evaluate(()=>({ids:q.c.getState().activeCardIds.slice().sort(),exchanges:q.c.getState().combat.exchangesRemaining,discard:q.c.getState().combat.discardIds.length}));
 assert.deepEqual(afterExchange.ids,ids);assert.ok(afterExchange.discard>0);pass(2,{addReturnSelectExchange:true,...afterExchange});
 const sprites=[],sizes=[];
 for(const [width,height,fullscreen]of [[1366,768,false],[1920,1080,true],[1180,820,false]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>{q.reset();q.show();});if(fullscreen)await page.locator('.fullscreen-toggle').click();
  for(const [stage,round]of [['stage.01',0],['stage.02',3]]){
   await page.evaluate(({stage,round})=>{q.reset();const s=q.c.getState();s.progress={stageId:stage,roundIndex:round,battleNumber:stage==='stage.01'?1:7};s.combat=null;q.c._beginBattle(s);q.c._state=s;q.show();},{stage,round});
   await page.waitForFunction(()=>document.querySelectorAll('.monster-image[data-ready=true]').length===2);
   const data=await page.evaluate(()=>q.art());assert.ok(data.paint.left>data.left.right&&data.paint.right<data.right.left,JSON.stringify(data));assert.ok(data.paint.top>=data.stage.top&&data.paint.bottom<=data.stage.bottom);
   assert.deepEqual(data.poses[0],data.poses[1]);sprites.push({width,height,stage,...data});
  }
  const data=await page.evaluate(()=>q.metrics());for(const c of data.cards)assert.ok(c.gap>=12&&c.gap<=16);
  for(const c of data.centers)assert.ok(Math.abs(c.offset)<.8);for(const b of data.buttons)assert.ok(b.rect.left>=0&&b.rect.right<=width&&b.rect.bottom<=height&&b.rect.top>=0,JSON.stringify(b));
  if(width===1180){await page.evaluate(()=>{const s=q.c.getState();s.runes.orderedInstanceIds=['qa.rune'];s.runes.instances={'qa.rune':{instanceId:'qa.rune',runeId:'rune.svoo',level:1}};q.c._state=s;q.f.assignSentence(q.c,'I read books '.repeat(5));const n=q.c.getState();q.f.assignPiles(q.c,{sentence:n.combat.sentenceSlots,hand:n.activeCardIds.slice(0,6)});q.show();});await page.waitForFunction(()=>document.querySelectorAll('.monster-image[data-ready=true]').length===2);await page.locator('.combat-backdrop[data-ready=true]').waitFor();await page.screenshot({path:out+'/after-tablet.png'});}
  sizes.push({width,height,fullscreen:await page.evaluate(()=>!!document.fullscreenElement),...data});
  if(fullscreen){assert.equal(sizes.at(-1).fullscreen,true);await page.locator('.fullscreen-toggle').click();}
 }
 pass(6,{sizes,physicalTablet:'NOT RUN',nonzeroSafeArea:'NOT RUN'});
 await page.setViewportSize({width:1366,height:768});await page.evaluate(()=>{q.reset();q.f.assignSentence(q.c,'I read books '.repeat(8));q.show();});
 const board=[];let boardBase;
 for(const count of [3,13,24]){
  await page.evaluate(count=>{const ids=q.c.getState().activeCardIds;q.f.assignPiles(q.c,{sentence:ids.slice(0,count).map(cardInstanceId=>({cardInstanceId})),hand:[]});q.show();},count);
  const data=await page.evaluate(async()=>{const m=await q.metrics(),box=q.root.querySelector('.combat-sentence').getBoundingClientRect();return{...m,rows:[...q.root.querySelectorAll('.sentence-row')].map(n=>{const cards=[...n.children].map(x=>x.getBoundingClientRect());return{count:cards.length,center:(cards[0].left+cards.at(-1).right)/2,top:cards[0].top,bottom:cards[0].bottom};}),center:box.x+box.width/2,cy:box.y+box.height/2};});
  if(boardBase)same(boardBase,data.rects);else boardBase=data.rects;assert.equal(data.rows.length,Math.ceil(count/12));for(const row of data.rows){assert.ok(row.count<=12);assert.ok(Math.abs(row.center-data.center)<1);}assert.ok(Math.abs((data.rows[0].top+data.rows.at(-1).bottom)/2-data.cy)<1);board.push(data);
 }
 const attacks=[];
 for(const [round,sentence,polish,kill]of [[1,'I run.',0,false],[0,'I run.',0,true],[2,'I read books.',3,true]]){
  await page.evaluate(({round,sentence,polish,kill})=>{q.reset();const s=q.c.getState();s.progress.roundIndex=round;s.progress.battleNumber=round+1;s.combat=null;if(kill){s.runes.orderedInstanceIds=['qa.rune'];s.runes.instances={'qa.rune':{instanceId:'qa.rune',runeId:'rune.svo',level:3}};}q.c._beginBattle(s);q.c._state=s;const ids=q.f.assignSentence(q.c,sentence),n=q.c.getState();for(const id of ids)n.cardInstances[id].polishLevel=polish;q.c._state=n;q.show();},{round,sentence,polish,kill});
  await page.waitForFunction(()=>document.querySelectorAll('.monster-image[data-ready=true]').length===2);const before=await page.evaluate(()=>q.rects());
  await page.locator('#attack-submit').click();await page.waitForFunction(()=>q.presenting===false,null,{timeout:30000});
  const data=await page.evaluate(()=>({poses:q.poses,samples:q.samples,damage:q.resolution.actualHpLoss,killed:q.resolution.killed,attacks:q.c.getState().stats.attacks}));
  assert.ok(data.damage>0);assert.equal(data.killed,kill);assert.equal(data.attacks,1);assert.equal(data.poses[0].before,'idle');assert.equal(data.poses[0].after,kill?'dead':'hit');
  for(const sample of data.samples){same(before,sample.rects);assert.equal(sample.logRows,0);for(const b of sample.boxes)assert.ok(b.scroll[0]<=b.client[0]+1&&b.scroll[1]<=b.client[1]+1);}
  attacks.push({...data,samples:data.samples.length});
 }
 pass(3,{sprites,attacks});pass(4,{board,realAttacks:attacks.length,liveScoreNoScroll:true});
 // Only the existing between-battle view changes. The same NEXT_BATTLE command still advances.
 await page.evaluate(async()=>{const {renderBetween}=await import('/src/ui/progression.js');q.reset();const s=q.c.getState();s.status='BETWEEN_BATTLES';q.c._state=s;q.view.cleanup();renderBetween(q.root,s,{onNext:()=>{q.f.checked(q.c,{type:'NEXT_BATTLE'});q.show();}});});
 await page.locator('.monster-preview img').waitFor();assert.equal(await page.locator('.monster-preview img').evaluate(n=>n.complete&&n.naturalWidth>0),true);await page.screenshot({path:out+'/between-battle.png'});
 await page.locator('#next-battle').click();await expect(page.locator('#attack-submit')).toBeVisible();
 assert.equal(await page.evaluate(()=>q.c.getState().progress.roundIndex),1);
 const previews=await page.evaluate(async()=>{const {renderBetween}=await import('/src/ui/progression.js');const results=[];for(const [stage,round]of [['stage.02',0],['stage.03',0]]){q.reset();q.view.cleanup();const s=q.c.getState();s.progress.stageId=stage;s.progress.roundIndex=round;renderBetween(q.root,s,{});results.push({stage,image:!!q.root.querySelector('.monster-preview img')});}return results;});assert.deepEqual(previews.map(x=>x.image),[true,false]);
 const shop=await page.evaluate(async()=>{const {bossReward}=await import('/tests/helpers/shop-flow-state.js'),{renderShop}=await import('/src/ui/shop.js');q.c=bossReward(1);const s=q.c.getState();s.config.shopFlowPolicy='BOSS_REWARD_FIRST_V1';q.c._state=s;q.f.checked(q.c,{type:'SKIP_REWARD',offerId:q.c.getState().reward.offerId});renderShop(q.root,q.c.getState(),{command:()=>{}});return{items:q.root.querySelectorAll('.shop-item').length,battleStyles:!!q.root.querySelector('.responsive-battle')};});assert.ok(shop.items>0);assert.equal(shop.battleStyles,false);
 pass(5,{lobby,shop,previews,realNextBattle:true,scope:'battle-only selectors and static existing introduction images; lobby/shop unchanged'});
 assert.deepEqual(report.errors,[]);report.status='PASS';console.log(JSON.stringify({status:report.status,groups:report.checks.map(x=>x.group)}));
}catch(e){report.status='FAIL';report.failure=e.stack;throw e;}finally{await fs.writeFile(out+'/result.json',JSON.stringify(report,null,2));await browser.close();}
