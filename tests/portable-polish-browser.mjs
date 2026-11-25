import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {mountCombatQA} from './helpers/combat-ui-browser.js';
import {visibleArea} from './helpers/link-viewport-browser.js';
const phase=process.env.SB_PORTABLE_PHASE||'after';
const out=process.env.SB_PORTABLE_OUT||`.local-validation/portable-polish/${phase}`;
const base=process.env.SB_BASE_URL||'http://127.0.0.1:5174/';
const only=process.argv.find(x=>x.startsWith('--section='))?.slice(10);
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch();let context,page;
const report={phase,scope:'Assigned real cards/controller in Chromium touch emulation. Physical touch/audio/fullscreen NOT RUN.',checks:[],captures:[],errors:[]};
const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function boot(width,height,touch=true){
 await context?.close();context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});page=await context.newPage();page.setDefaultTimeout(7000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(base+'?debug=1#lobby');await page.locator('#start-run').waitFor();await page.evaluate(mountCombatQA);
 await page.evaluate(async()=>{
  const {renderCombat}=await import('/src/ui/combat.js'),o=await import('/src/ui/overlays.js');q.selected=new Set();q.view.cleanup();q.view=null;
  q.show=function(locked=false,state=this.c.getState()){this.view=renderCombat(this.root,state,{previous:this.view,locked,selected:this.selected,command:c=>this.command(c),openOverlay:id=>{if(id==='dictionary')o.openDictionary(this.c.getState());else if(id==='settings')o.openSettings();}});};
  q.cards=function(count,handCount=10,runes=3){
   const s=this.c.getState(),ids=s.activeCardIds;s.combat.rulesSnapshot.handLimit=14;
   for(let i=0;i<3;i++)s.cardInstances[ids[i]].cardDefId='card.'+['information','remember','necessary'][i];
   s.combat.sentenceSlots=ids.slice(0,count).map(cardInstanceId=>({cardInstanceId,selection:null}));s.combat.handIds=ids.slice(count,count+handCount);s.combat.drawIds=ids.slice(count+handCount);s.combat.discardIds=[];
   s.runes.orderedInstanceIds=['qa.sv','qa.svc','qa.svo'].slice(0,runes);s.runes.instances=Object.fromEntries(['sv','svc','svo'].slice(0,runes).map(key=>['qa.'+key,{instanceId:'qa.'+key,runeId:'rune.'+key,level:2}]));this.c._state=s;this.show();return s.combat.sentenceSlots.map(x=>x.cardInstanceId);
  };q.cards(24);
 });await settle();await page.waitForFunction(()=>document.querySelector('.monster-image[data-ready=true]'));await settle();
}
async function shot(name,height){await page.screenshot({path:`${out}/${name}.png`,clip:{x:0,y:0,width:page.viewportSize().width,height:height??page.viewportSize().height}});report.captures.push(name+'.png');}
async function metrics(){return page.evaluate(()=>{
 const rect=n=>{if(!n)return null;const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
 const selectors=['.game-header','.enemy-area','.enemy-info','.enemy-info h2','.enemy-hp','.enemy-tactics','.battle-target-guide','.region-bonus','.target-grammar','.combat-middle','.score-stage','.combat-sentence','.hand-section','.hand-page-row','#attack-submit','#clear-sentence','.prepare-button','#discard-selected','.card-select','.form-button','.rune-panel','.rune-help','.rune-up','.rune-down'];
 const words=[...document.querySelectorAll('.combat-sentence .card-word')].slice(0,3).map(n=>{const r=document.createRange();r.selectNodeContents(n);const s=getComputedStyle(n),c=document.createElement('canvas').getContext('2d');c.font=`${s.fontStyle} ${s.fontWeight} 12px ${s.fontFamily}`;const m=c.measureText(n.textContent);return {word:n.textContent,font:parseFloat(s.fontSize),family:s.fontFamily,weight:s.fontWeight,spacing:s.letterSpacing,scale:s.scale,widthAt12:m.width,inkAt12:m.actualBoundingBoxLeft+m.actualBoundingBoxRight,text:rect(r),body:rect(n.closest('.card-body')),transform:s.transform};});
 return {visibleHeight:visualViewport.height,portable:document.documentElement.dataset.portable,handheld:document.documentElement.dataset.handheld,boxes:Object.fromEntries(selectors.map(s=>[s,rect(document.querySelector(s))])),words,handBounds:q.bounds(),app:{client:document.querySelector('#app').clientHeight,scroll:document.querySelector('#app').scrollHeight},page:document.querySelector('.hand-cards').dataset.page,columns:document.querySelector('.combat-sentence').dataset.mobileColumns||document.querySelector('.combat-sentence').dataset.columns,state:JSON.stringify(q.c.getState())};
});}
function visible(r,height,width){assert.ok(r&&r.h>0&&r.w>0&&r.y>=-1&&r.bottom<=height+1&&r.x>=-1&&r.right<=width+1,JSON.stringify({r,height,width}));}
function basics(m,w,h){
 for(const s of ['.enemy-info h2','.enemy-hp','.region-bonus','.target-grammar','#attack-submit','#clear-sentence','.prepare-button','#discard-selected','.hand-page-row'])visible(m.boxes[s],h,w);
 for(const [child,parent] of [['.enemy-hp','.enemy-info'],['.target-grammar','.enemy-tactics'],['.region-bonus','.enemy-tactics']]){const a=m.boxes[child],b=m.boxes[parent];assert.ok(a.y>=b.y-1&&a.bottom<=b.bottom+1,child+' hidden inside '+parent);}
 assert.ok(m.app.scroll<=m.app.client+1,'normal viewport must not require app scroll '+JSON.stringify(m.app));
 for(const r of m.handBounds)assert.ok(r.gap>=8,'hand including selection outline needs 8px '+JSON.stringify(r));
}
async function ghostGeometry(){
 const pairs=await page.evaluate(()=>['.card-body','.card-word'].map(selector=>{
  const measure=host=>{const n=document.querySelector(host).querySelector(selector),r=n.getBoundingClientRect(),s=getComputedStyle(n);return{width:r.width,height:r.height,fontSize:s.fontSize,fontFamily:s.fontFamily,fontWeight:s.fontWeight,letterSpacing:s.letterSpacing,scale:s.scale};};const source=measure('.drag-source'),clone=measure('.drag-ghost'),rotation=new DOMMatrix(getComputedStyle(document.querySelector('.drag-ghost')).transform);return{selector,source,clone,expectedRotated:{width:Math.abs(rotation.a)*source.width+Math.abs(rotation.c)*source.height,height:Math.abs(rotation.b)*source.width+Math.abs(rotation.d)*source.height}};
 }));
 // Existing root rotation is intentional. Compare its exact axis-aligned result,
 // while ignoring only absolute pointer position; no DOM/style changes for measurement.
 for(const {selector,source,clone,expectedRotated}of pairs){for(const dimension of ['width','height'])assert.ok(Math.abs(expectedRotated[dimension]-clone[dimension])<=1,JSON.stringify({selector,dimension,source,clone,expectedRotated}));for(const property of ['fontSize','fontFamily','fontWeight','letterSpacing','scale'])assert.equal(clone[property],source[property],selector+' '+property);}
 return pairs;
}
async function check(name,acs,fn){if(only&&!name.startsWith(only))return;try{const evidence=await fn();report.checks.push({name,acs,status:phase==='before'?'MEASURED':'PASS',evidence});console.log(phase==='before'?'MEASURED':'PASS',name);}catch(e){report.checks.push({name,acs,status:'FAIL',error:e.stack});console.error('FAIL',name,e.message);}}
try{
 await check('A-visible-budget-and-long-words',['AC01','AC02','AC03','AC04','AC06','AC19','AC20'],async()=>{
  const rows=[],violations=[];report.measurements=rows;
  for(const [w,h,visibleH] of [[1024,768,678],[1194,834,734],[1024,600,510],[844,390,310],[915,412,312],[667,375,295],[1008,432,352]]){
   await boot(w,h);await visibleArea(page,visibleH);const m=await metrics();const state=m.state;delete m.state;rows.push({w,h,...m});
   if(w===1024&&h===768||w===844||phase!=='before'&&w===667)await shot(`${phase}-${w}x${h}-visible${visibleH}`,visibleH);
   if(phase!=='before'){
    try{basics(m,w,visibleH);assert.equal(m.columns,w>=1024?'12':w<720?'6':'8');
    for(const word of m.words){assert.ok(word.font>=12,JSON.stringify(word));assert.ok(word.text.x>=word.body.x-1&&word.text.right<=word.body.right+1,JSON.stringify(word));}
    await visibleArea(page,h);assert.equal((await metrics()).state,state,'height change must not commit state');}catch(e){violations.push(`${w}x${h} visible${visibleH}: ${e.message}`);}
   }
  }
  await boot(1024,768);const baseState=(await metrics()).state;
  for(const h of [700,678,650,640,639,620,768]){await visibleArea(page,h);const m=await metrics();assert.equal(m.state,baseState);delete m.state;rows.push({w:1024,h:768,...m});if(phase!=='before')try{basics(m,1024,h);}catch(e){violations.push(`height${h}: ${e.message}`);}}
  assert.deepEqual(violations,[]);
  return rows;
 });
 if(phase!=='before'){
 await check('B-counts-scroll-touch-targets',['AC07','AC08','AC09','AC10','AC11','AC12'],async()=>{
  await boot(844,390);await visibleArea(page,310);const counts=[];
  for(const n of [1,8,9,12,16,24]){const ids=await page.evaluate(n=>q.cards(n),n);await settle();assert.deepEqual(await page.locator('.combat-sentence .word-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId)),ids);const down=page.getByRole('button',{name:'문장 뒷부분 보기',exact:true});for(let i=0;i<4&&await down.isVisible()&&await down.isEnabled();i++)await down.tap();const last=page.locator('.combat-sentence .form-button').last();const box=await last.boundingBox(),board=await page.locator('.combat-sentence').boundingBox();assert.ok(box.y>=board.y-1&&box.y+box.height<=board.y+board.height+1);await last.tap();await expect(page.locator('.form-dialog[open]')).toBeVisible();await page.locator('.form-dialog .dialog-header button').tap();counts.push(n);}
  await page.evaluate(()=>q.cards(0,14));await settle();const before=JSON.stringify(await page.evaluate(()=>q.c.getState()));await page.locator('.hand-cards>.word-card:not([hidden]) .card-select').first().tap();assert.equal(JSON.stringify(await page.evaluate(()=>q.c.getState())),before);assert.equal(await page.evaluate(()=>q.selected.size),1);
  const m=await metrics();assert.ok(m.boxes['.card-select'].w>=32&&m.boxes['.card-select'].h>=32);assert.ok(m.boxes['#discard-selected'].h>=30);
  await page.getByRole('button',{name:'다음 손패 페이지',exact:true}).tap();const saved=await page.evaluate(()=>({page:document.querySelector('.hand-cards').dataset.page,selected:[...q.selected],state:q.c.getState()}));await visibleArea(page,390);await visibleArea(page,310);assert.deepEqual(await page.evaluate(()=>({page:document.querySelector('.hand-cards').dataset.page,selected:[...q.selected],state:q.c.getState()})),saved);
  for(const count of [0,1,3]){await page.evaluate(count=>q.cards(2,10,count),count);if(count){const last=page.locator('.rune-info').last();await last.tap();await expect(page.locator('dialog[open]')).toBeVisible();await page.locator('dialog[open] .dialog-header button').tap();}assert.equal(await page.locator('.rune-slot[data-rune-id]').count(),count);}
  await page.locator('.rune-order-toggle').first().tap();await expect(page.locator('.rune-order-toggle').first()).toHaveAttribute('aria-expanded','true');const targets=await metrics();assert.ok(targets.boxes['.form-button'].h>=28);assert.ok(targets.boxes['.rune-up'].w>=30&&targets.boxes['.rune-up'].h>=30);assert.ok(targets.boxes['.rune-help'].w>=28&&targets.boxes['.rune-help'].h>=28);const runeOrder=await page.evaluate(()=>q.c.getState().runes.orderedInstanceIds);await page.locator('.rune-down').first().tap();assert.deepEqual(await page.evaluate(()=>q.c.getState().runes.orderedInstanceIds),[runeOrder[1],runeOrder[0],runeOrder[2]]);
  const hands=[];for(const n of [0,1,10,14]){await page.evaluate(n=>{q.selected.clear();q.cards(0,n);},n);await settle();const m=await metrics();for(const r of m.handBounds)assert.ok(r.gap>=8);hands.push({count:n,panel:m.boxes['.hand-section'],row:m.boxes['.hand-page-row'],bounds:m.handBounds});}for(const row of hands)assert.deepEqual(row.panel,hands[0].panel);return {counts,handCounts:hands,targets:{check:m.boxes['.card-select'],discard:m.boxes['#discard-selected'],form:targets.boxes['.form-button'],rune:targets.boxes['.rune-up']},pagePreserved:true,runeReorder:true};
 });
 await check('C-safe-area-modal-and-pc',['AC05','AC14','AC18','AC22','AC23'],async()=>{
  await boot(844,390);await page.evaluate(()=>{for(const [k,v]of Object.entries({left:24,right:24,bottom:8}))document.documentElement.style.setProperty('--safe-'+k,v+'px');});await visibleArea(page,330,{top:6,left:3,width:838});const m=await metrics();const bottom=336-8;for(const s of ['#attack-submit','#discard-selected','.hand-page-row'])visible(m.boxes[s],bottom,841);const saved=m.state;await page.getByRole('button',{name:'목표 문법',exact:true}).tap();const header=await page.locator('dialog[open] .dialog-header').boundingBox();assert.ok(header.y>=6&&header.y+header.height<=336);await page.locator('dialog[open] .dialog-header button').tap();assert.equal((await metrics()).state,saved);
  await page.getByRole('button',{name:'메뉴',exact:true}).tap();await page.locator('.battle-menu').getByRole('button',{name:'사전',exact:true}).tap();await page.getByRole('searchbox',{name:'원정 사전 검색'}).fill('remember');await visibleArea(page,220,{top:6,left:3,width:838});const keyboardHeader=await page.locator('dialog[open] .dialog-header').boundingBox();assert.ok(keyboardHeader.y>=6&&keyboardHeader.y+keyboardHeader.height<=226);await page.locator('dialog[open] .dialog-body').evaluate(n=>n.scrollTop=n.scrollHeight);await page.locator('dialog[open] .dialog-header button').tap();await visibleArea(page,330,{top:6,left:3,width:838});assert.equal((await metrics()).state,saved);
  await page.getByRole('button',{name:'메뉴',exact:true}).tap();await page.locator('.battle-menu').getByRole('button',{name:'설정',exact:true}).tap();const settingHeader=await page.locator('dialog[open] .dialog-header').last().boundingBox();assert.ok(settingHeader.y>=6&&settingHeader.y+settingHeader.height<=336);await page.locator('dialog[open] .dialog-header button').last().tap();await page.keyboard.press('Escape');assert.equal((await metrics()).state,saved);
  const pcs=[];for(const [w,h]of [[1440,900],[1280,720]]){await boot(w,h,false);const m=await metrics();basics(m,w,h);assert.equal(m.columns,'12');delete m.state;pcs.push(m);}return {safeArea:true,modal:true,keyboard:'simulated visible area, physical keyboard NOT RUN',pcs};
 });
 await check('D-width-input-comma-attack',['AC08','AC15','AC16','AC17','AC21'],async()=>{
  const ghosts=[];
  await boot(844,390);await page.evaluate(()=>q.cards(0,14));await page.locator('.hand-cards>.word-card:not([hidden]) .card-select').first().tap();await page.getByRole('button',{name:'다음 손패 페이지',exact:true}).tap();
  const saved=await page.evaluate(()=>({first:document.querySelector('.hand-cards>.word-card:not([hidden])').dataset.cardId,selected:[...q.selected],state:q.c.getState()}));
  await page.setViewportSize({width:667,height:375});await settle();assert.ok(await page.locator(`.hand-cards>.word-card[data-card-id="${saved.first}"]`).isVisible());assert.deepEqual(await page.evaluate(()=>[...q.selected]),saved.selected);assert.deepEqual(await page.evaluate(()=>q.c.getState()),saved.state);
  const body=page.locator('.hand-cards>.word-card:not([hidden]) .card-body').first(),r=await body.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+10);await page.mouse.down();await page.mouse.move(r.x+r.width/2,r.y-25,{steps:4});await expect(page.locator('.drag-ghost')).toHaveCount(1);ghosts.push({kind:'phone-hand',pairs:await ghostGeometry()});await visibleArea(page,295);await expect(page.locator('.drag-ghost,.drop-before,.drop-after,.drop-replace')).toHaveCount(0);await page.mouse.up();assert.deepEqual(await page.evaluate(()=>q.c.getState()),saved.state);await body.tap();assert.equal(await page.locator('.combat-sentence .word-card').count(),1);
  await boot(1024,768);await visibleArea(page,678);const tabletState=await page.evaluate(()=>q.c.getState()),tabletBody=await page.locator('.combat-sentence .card-body').first().boundingBox();await page.mouse.move(tabletBody.x+tabletBody.width/2,tabletBody.y+tabletBody.height/2);await page.mouse.down();await page.mouse.move(tabletBody.x+tabletBody.width/2,tabletBody.y-30,{steps:4});await expect(page.locator('.drag-ghost')).toHaveCount(1);ghosts.push({kind:'tablet-board',pairs:await ghostGeometry()});await page.evaluate(()=>document.dispatchEvent(new Event('atlas:cancel-drag')));await page.mouse.up();await expect(page.locator('.drag-ghost')).toHaveCount(0);assert.deepEqual(await page.evaluate(()=>q.c.getState()),tabletState);
  await boot(844,390);await visibleArea(page,310);await page.evaluate(async()=>{const f=await import('/tests/helpers/corridor-state.js'),a=f.assignedCorridor({version:'0.14.0',sentences:[Array.from({length:12},()=>['I','go']).flat().join(' ')]});q.c=a.c;f.place(q.c,a.slots[0]);q.show();await q.command({type:'SET_COMMA',afterCardInstanceId:a.slots[0][7].cardInstanceId});});await settle();
  assert.equal(await page.locator('.combat-sentence .word-card').count(),24);assert.equal(await page.locator('.comma-marker').count(),1);const comma=await page.evaluate(()=>q.c.getState().combat.punctuation.comma.afterCardInstanceId);for(const [w,h,v]of [[844,390,310],[667,375,295]]){await page.setViewportSize({width:w,height:h});await visibleArea(page,v);const down=page.getByRole('button',{name:'문장 뒷부분 보기',exact:true});for(let i=0;i<5&&await down.isEnabled();i++)await down.tap();await page.locator('.combat-sentence .form-button').last().tap();await expect(page.locator('.form-dialog[open]')).toBeVisible();await page.locator('.form-dialog .dialog-header button').tap();assert.equal(await page.evaluate(()=>q.c.getState().combat.punctuation.comma.afterCardInstanceId),comma);assert.equal(await page.locator('.combat-sentence .word-card').count(),24);}
  await boot(844,390);await page.evaluate(async()=>{const f=await import('/tests/helpers/corridor-state.js'),a=f.assignedCorridor({version:'0.14.0',round:0,sentences:['I go']});q.c=a.c;f.place(q.c,a.slots[0]);const s=q.c.getState();s.combat.handIds=s.combat.drawIds.splice(0,10);q.c._state=s;q.show();});const before=await page.evaluate(()=>q.c.getState());await page.locator('#attack-submit').tap();await page.waitForFunction(()=>q.presenting);await visibleArea(page,310);await page.waitForFunction(()=>!q.presenting,{},{timeout:20000});const attack=await page.evaluate(()=>({s:q.c.getState(),r:q.resolution}));assert.equal(attack.s.combat.turnsRemaining,before.combat.turnsRemaining-1);assert.equal(attack.s.combat.enemyState.hp,before.combat.enemyState.hp-attack.r.actualHpLoss);assert.equal(attack.s.stats.attacks,before.stats.attacks+1);assert.equal(attack.s.combat.actionSequence,before.combat.actionSequence+1);assert.equal(await page.evaluate(()=>q.c.dispatch({type:'FINISH_PRESENTATION',attackId:q.resolution.attackId}).ok),false);assert.deepEqual(await page.evaluate(()=>q.c.getState()),attack.s);await expect(page.locator('.drag-ghost,.attack-overlay,.score-overlay')).toHaveCount(0);
  await page.evaluate(()=>{document.documentElement.requestFullscreen=()=>Promise.reject(new DOMException('Assigned rejection','NotAllowedError'));});await page.locator('.fullscreen-toggle').tap();await expect(page.locator('.fullscreen-help')).toBeVisible();await page.getByRole('button',{name:'현재 화면에서 계속',exact:true}).tap();await expect(page.locator('.fullscreen-help')).toHaveCount(0);await page.locator('.hand-cards>.word-card:not([hidden]) .card-body').first().tap();assert.equal(await page.locator('.combat-sentence .word-card').count(),1);
  return{widthAnchorPreserved:true,dragCancelAndRecovery:true,ghosts,comma24LastForm:true,attack:{power:attack.r.finalPower,hp:attack.s.combat.enemyState.hp,settlements:1},fullscreen:'assigned browser rejection; physical device NOT RUN'};
 });
 await check('E-boss-vitals-and-mechanic-scroll',['AC02','AC11','AC18'],async()=>{
  const rows=[];for(const [w,h,v]of [[1024,768,678],[844,390,310]]){
   await boot(w,h);await visibleArea(page,v);await page.evaluate(async()=>{const{bossReward}=await import('/tests/helpers/shop-flow-state.js');q.c=bossReward(3);const s=q.c.getState();s.combat=null;q.c._beginBattle(s);q.c._state=s;q.show();});await settle();
   const m=await metrics();for(const s of ['.enemy-info h2','.enemy-hp','.region-bonus','.target-grammar'])visible(m.boxes[s],v,w);
   const phases=page.locator('.golem-phases');const parent=await phases.evaluate(n=>n.parentElement.className);if(parent==='enemy-mechanics'){
    const panel=page.locator('.enemy-mechanics'),clip=await panel.boundingBox(),vitals=await page.locator('.enemy-vitals').boundingBox();assert.equal(await panel.evaluate(n=>getComputedStyle(n).overflowY),'auto');assert.ok(clip.height>0);await page.locator('.golem-phase').last().scrollIntoViewIfNeeded();const last=await page.locator('.golem-phase').last().boundingBox();assert.ok(last.y>=clip.y-1&&last.y+last.height<=clip.y+clip.height+1,JSON.stringify({last,clip}));assert.deepEqual(await page.locator('.enemy-vitals').boundingBox(),vitals);rows.push({w,h,v,parent,clip,last,vitals});
   }else{assert.equal(parent,'enemy-area');rows.push({w,h,v,parent,phases:await phases.boundingBox()});}
  }return rows;
 });
 }
}finally{await context?.close();await browser.close();report.status=report.errors.length||report.checks.some(c=>c.status==='FAIL')?'FAIL':'PASS';await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(report.status);if(report.status==='FAIL')process.exitCode=1;}
