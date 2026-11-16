/** Small assigned-state flows. No natural-campaign or physical-device claims. */
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {mountCombatQA} from './helpers/combat-ui-browser.js';
import {visibleArea,withVisibleArea} from './helpers/link-viewport-browser.js';
const base=process.env.SB_BASE_URL||'http://127.0.0.1:5173/',out=process.env.SB_FEEDBACK_OUT||'.local-validation/v0141/browser';
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch();let context,page;
const report={scope:'Chromium assigned real cards/controller/presentation, pointer and emulated touch; physical devices NOT RUN',checks:[],captures:[],errors:[]};
const only=process.argv.find(x=>x.startsWith('--section='))?.slice(10);
const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const state=()=>page.evaluate(()=>q.c.getState());
const close=()=>page.locator('dialog[open] .dialog-header button').click();
async function capture(name){if(process.argv.includes('--no-captures'))return;await page.screenshot({path:`${out}/${name}.png`});report.captures.push(name+'.png');}
async function check(name,fn){if(only&&only!==name)return;try{const evidence=await fn();report.checks.push({name,status:'PASS',evidence});console.log('PASS',name);}catch(e){report.checks.push({name,status:'FAIL',error:e.stack});console.error('FAIL',name,e.message);if(name.startsWith('T4'))console.error(JSON.stringify(await page.evaluate(()=>({events:q.events,phases:q.phases,play:q.playResult})),null,2));}}
async function boot({width=1280,height=720,mobile=false}={}){
 await context?.close();context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:1});page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text().startsWith('Application error'))report.errors.push(m.text());});await page.goto(base+'?debug=1#lobby');await page.locator('#start-run').waitFor();await page.evaluate(mountCombatQA);
 await page.evaluate(async()=>{
  const {renderCombat}=await import('/src/ui/combat.js'),f=await import('/tests/helpers/corridor-state.js');
  q.view.cleanup();q.view=null;q.f=f;
  q.show=function(locked=false,s=this.c.getState()){this.view=renderCombat(this.root,s,{previous:this.view,locked,command:c=>this.command(c),openOverlay:()=>{}});};
  q.assigned=function(text='I like games',round=0){this.view?.cleanup();this.view=null;const x=f.assignedCorridor({version:'0.14.0',round,seed:'ui0141',sentences:[text]});this.c=x.c;this.slots=x.slots[0];f.place(this.c,this.slots);const s=this.c.getState();s.combat.handIds=s.combat.drawIds.splice(0,Math.min(10,s.combat.rulesSnapshot.handLimit));this.c._state=s;this.show();};
  q.command=async function(cmd){const before=this.c.getState(),r=this.c.dispatch(cmd);this.last=r;if(!r.ok)return r;if(!r.resolution){this.show();return r;}this.resolution=r.resolution;this.show(true,before);this.view.beginPresentation();this.presenting=true;this.events=[];this.phases=[];const adapter=this.p.createDOMPresentation(this.view.element),original=adapter.onScore;
   adapter.onScore=(e,c)=>{original(e,c);this.events.push({event:e,label:document.querySelector('.score-overlay-label').textContent,color:getComputedStyle(document.querySelector('.score-overlay-label')).color,errors:[...this.root.querySelectorAll('.word-card.grammar-error')].map(n=>n.dataset.cardId),comma:!!this.root.querySelector('.comma-marker.grammar-error')});};
   const timer=setInterval(()=>this.phases.push({feedback:document.querySelector('.score-overlay')?.dataset.feedback,phase:this.view.element.dataset.corePhase,copies:document.querySelector('.core-attack-body')?.children.length??0}),16);
   try{this.playResult=await this.p.playAttack(r.resolution,adapter,{speed:2,...this.effects});f.checked(this.c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});}finally{clearInterval(timer);this.presenting=false;this.show();}return r;
  };q.show();
 });await settle();
}
const rects=()=>page.locator('.combat-sentence .word-card').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return [n.dataset.cardId,r.x,r.y,r.width,r.height];}));
const point=async n=>{const r=await n.boundingBox();return {x:r.x+r.width/2,y:r.y+r.height/2};};
async function dragStart(source,target){await page.mouse.move(source.x,source.y);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:10});}
try{
 await check('T1-info-resources-retained',async()=>{
  const rows=[];
  for(const [width,height,mobile]of [[1280,720,false],[1024,768,false],[844,390,true]]){
   await boot({width,height,mobile});await page.waitForFunction(()=>document.querySelector('.monster-image[data-ready=true]'));
   await expect(page.getByRole('button',{name:'목표 문법',exact:true})).toHaveCount(1);
   await expect(page.locator('.enemy-tactics')).toContainText('지역 점수 보너스');await expect(page.locator('.region-bonus')).toContainText('×1.25');
   await expect(page.locator('.pile-button').first()).toContainText('뽑을 카드');await expect(page.locator('.pile-discard')).toContainText('버린 카드');assert.ok((await page.locator('.rune-slot.empty').allTextContents()).every(t=>t==='비어 있음'));
   assert.equal(await page.locator('.mobile-resources').isVisible(),mobile);await expect(page.locator('.game-header .mobile-battle-hud')).toHaveCount(0);
   const before=await state();await page.getByRole('button',{name:'목표 문법',exact:true}).click();await expect(page.locator('dialog[open]')).toContainText('이번 전투');await expect(page.locator('dialog[open]')).toContainText('제출 후');await close();assert.deepEqual(await state(),before);
   await page.evaluate(()=>{q.stage=q.root.querySelector('.enemy-area');q.monster=q.root.querySelector('.monster-art-motion');q.background=q.root.querySelector('.combat-backdrop');});
   await page.locator('.hand-cards .word-card:not([hidden]) .card-body').first().click();await page.locator('#clear-sentence').click();await page.locator('.prepare-button').click();
   await page.locator('.hand-cards .card-select').first().click();await page.locator('#discard-selected').click();
   const s=await state();assert.equal(s.combat.turnsRemaining,5);assert.equal(s.combat.exchangesRemaining,3);
   assert.ok(await page.evaluate(()=>q.stage===q.root.querySelector('.enemy-area')&&q.monster===q.root.querySelector('.monster-art-motion')&&q.background===q.root.querySelector('.combat-backdrop')));
   assert.deepEqual(await page.locator('.mobile-resources strong').allTextContents(),['5/6','3회',String(s.economy.gold)]);
   rows.push({width,height,mobile,retained:true,resources:[5,3,s.economy.gold]});if(width===1024)await capture('tablet-info');
  }return rows;
 });
 await check('T3-insert-swap-cancel',async()=>{
  await boot();await page.evaluate(()=>q.assigned('I like games'));await settle();const before=await state(),geometry=await rects();
  const hand=page.locator('.hand-cards>.word-card:not([hidden])').first(),target=page.locator('.combat-sentence .word-card').nth(1),r=await target.boundingBox();
  const source=await point(hand),id=await hand.getAttribute('data-card-id');await dragStart(source,await point(page.locator('.hand-cards>.word-card:not([hidden])').nth(1)));await expect(page.locator('.drop-before,.drop-after,.drop-replace')).toHaveCount(0);await page.mouse.up();assert.deepEqual(await state(),before);await dragStart(source,{x:r.x+2,y:r.y+r.height/2});
  await expect(page.locator('.drop-before')).toHaveCount(1);assert.deepEqual(await rects(),geometry);const hint=await target.evaluate(n=>({content:getComputedStyle(n,'::before').content,width:getComputedStyle(n,'::before').width,color:getComputedStyle(n,'::before').backgroundColor}));assert.equal(hint.content,'""');assert.equal(hint.width,'3px');
  await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await expect(page.locator('.drop-replace')).toHaveCount(1);await expect(page.locator('.drop-before,.drop-after')).toHaveCount(0);assert.deepEqual(await rects(),geometry);
  // Final coordinates choose insertion after card 2, not the previous hover/SWAP.
  await page.mouse.move(r.x+r.width-2,r.y+r.height/2);await page.mouse.up();await settle();assert.equal((await state()).combat.sentenceSlots[2].cardInstanceId,id);assert.equal((await state()).revision,before.revision+1);
  const saved=await state(),rr=await target.boundingBox();await dragStart(await point(page.locator('.hand-cards>.word-card:not([hidden])').first()),{x:rr.x+2,y:rr.y+20});await page.evaluate(()=>document.dispatchEvent(new Event('atlas:cancel-drag')));await page.mouse.up();await expect(page.locator('.drag-ghost,.drop-before,.drop-after')).toHaveCount(0);assert.deepEqual(await state(),saved);
  await page.evaluate(()=>q.assigned(Array.from({length:12},()=>['I','go']).flat().join(' ')));await settle();const full=await state(),last=await page.locator('.combat-sentence .word-card').last().boundingBox();
  await dragStart(await point(page.locator('.hand-cards>.word-card:not([hidden])').first()),{x:last.x+last.width-2,y:last.y+20});await expect(page.locator('.drop-before,.drop-after')).toHaveCount(0);await page.mouse.up();assert.deepEqual(await state(),full);
  return {boundaryBar:hint,noLayoutShift:true,swapPreserved:true,oneCommand:true,fullRejected:true,cancellation:true};
 });
 await check('T4-form-and-committed-loss',async()=>{
  await boot();await page.evaluate(()=>q.assigned('I am happy'));const card=page.locator('.combat-sentence .word-card').nth(1),id=await card.getAttribute('data-card-id'),before=await rects();
  await card.locator('.form-button').click();await page.getByRole('button',{name:'형태 was',exact:true}).click();await expect(page.locator('.form-changed')).toHaveAttribute('data-card-id',id);assert.deepEqual(await rects(),before);await expect(page.locator('.form-changed')).toHaveCount(0);
  await card.locator('.form-button').click();await page.getByRole('button',{name:'형태 was',exact:true}).click();await expect(page.locator('.form-changed')).toHaveCount(0);
  await card.locator('.form-button').click();await close();await expect(page.locator('.form-changed')).toHaveCount(0);
  await card.locator('.form-button').click();await page.evaluate(()=>{q.c._state.combat.phase='PRESENTING';});await page.getByRole('button',{name:'형태 were',exact:true}).click();assert.equal(await page.evaluate(()=>q.last.ok),false);await expect(page.locator('.form-changed')).toHaveCount(0);
  const results=[];
  for(const [text,gap,effects]of [['I like games',0,{effectsOff:true}],['Seeing you I smiled',1,{reducedMotion:true}]]){
   await page.evaluate(({text,gap,effects})=>{q.effects=effects;q.assigned(text);q.command({type:'SET_COMMA',afterCardInstanceId:q.c.getState().combat.sentenceSlots[gap].cardInstanceId});},{text,gap,effects});const original=await state();await page.locator('#attack-submit').click();if(gap===0&&!process.argv.includes('--no-captures')){await page.waitForFunction(()=>{const n=document.querySelector('.score-overlay[data-feedback="grammar-loss"] .score-overlay-label');if(!n)return false;const r=n.getBoundingClientRect(),s=getComputedStyle(n);return r.width>0&&r.height>0&&s.visibility==='visible'&&Number(s.opacity)>0&&r.bottom>0&&r.top<innerHeight;});await capture('punctuation-loss');}await page.waitForFunction(()=>q.resolution&&!q.presenting);
   const proof=await page.evaluate(()=>({r:q.resolution,s:q.c.getState(),events:q.events,phases:q.phases}));assert.equal(proof.s.combat.turnsRemaining,original.combat.turnsRemaining-1);assert.equal(proof.s.stats.history.filter(h=>h.attackId===proof.r.attackId).length,1);
   assert.ok(proof.phases.some(x=>x.phase==='CHARGE'));assert.ok(proof.phases.every(x=>x.copies===0),'static effect modes preserve information without moving copies');assert.ok(proof.phases.some(x=>x.phase==='LUNGE'));
   for(const e of proof.events){if(e.event.sourceId==='PUNCTUATION.COMMA'){const loss=e.event.before-e.event.after;assert.equal(e.label.split('−'+loss).length-1,1);assert.equal(e.comma,true);assert.deepEqual(e.errors.sort(),[...e.event.highlightCardIds].sort());assert.equal(e.color,'rgb(255, 139, 117)');}if(e.event.phase==='RESISTANCE'){assert.deepEqual(e.errors,[]);assert.equal(e.comma,false);assert.equal(e.color,'rgb(177, 203, 221)');}}
   if(gap===0)assert.ok(proof.events.some(e=>e.event.sourceId==='PUNCTUATION.COMMA'));else assert.equal(proof.r.analysis.status,'VALID');
   await expect(page.locator('.grammar-error,.score-overlay,.attack-overlay')).toHaveCount(0);results.push({text,status:proof.r.analysis.status,power:proof.r.finalPower,eventCount:proof.events.length,effects,once:true});
  }return {formSuccessOnly:true,results};
 });
 await check('T5-image-ready-delay-failure-life',async()=>{
  await boot();const proof=await page.evaluate(async()=>{
   const {renderBetween}=await import('/src/ui/progression.js');q.view.cleanup();q.view=null;
   const s=q.c.getState();s.progress.roundIndex=1;s.progress.battleNumber=2;s.status='BETWEEN_BATTLES';q.preview={cleanup:renderBetween(q.root,s,{onNext:()=>{},onSaves:()=>{}})};return 'boss.stage1';
  });await page.waitForFunction(()=>document.querySelector('.monster-preview-image')?.dataset.ready==='true');const geometry=await page.locator('.preparation-monster').getAttribute('data-body-height');assert.ok(Number(geometry)>0);await capture('boss-preparation');
  await page.evaluate(()=>{q.preview.cleanup();q.reset();q.show();});await page.waitForFunction(()=>document.querySelector('.monster-image[data-ready=true]'));const box=await page.locator('.monster-art-motion').boundingBox();assert.ok(box.height>0);
  // Fresh document avoids image memory cache. The asset itself is deliberately delayed.
  await context.close();context=await browser.newContext({viewport:{width:1280,height:720}});page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text().startsWith('Application error'))report.errors.push(m.text());});
  const waiting=[];await page.route('**/monsters/*',route=>{waiting.push(route);});await page.goto(base+'?debug=1#lobby');await page.locator('#start-run').waitFor();await page.evaluate(mountCombatQA);
  await page.waitForFunction(()=>!!document.querySelector('.monster-image'));const reserved=await page.locator('.enemy-area').boundingBox();const initialScale=await page.locator('.monster-art-motion').evaluate(n=>n.style.getPropertyValue('--monster-scale'));await expect(page.locator('.monster-fallback')).toBeHidden();
  await page.evaluate(async()=>{const source=await fetch('/src/ui/combat.js').then(r=>r.text());const modulePath=source.match(/from\s*['"]([^'"]*monsterArt\.js[^'"]*)/)[1];const {monsterViewFor}=await import(modulePath);q.monster=q.root.querySelector('.enemy-avatar');q.artView=monsterViewFor(q.monster);q.artView.impact({attackId:'assigned-delayed-kill',actualHpLoss:1,killed:true,staticMotion:true});});
  await expect(page.locator('.monster-art-motion')).toHaveCSS('opacity','0');for(const route of waiting.splice(0))await route.continue();await page.waitForFunction(()=>document.querySelector('.monster-image')?.dataset.ready==='true');assert.equal(await page.locator('.enemy-avatar').getAttribute('data-monster-pose'),'dead');assert.equal(await page.locator('.monster-art-motion').evaluate(n=>getComputedStyle(n).opacity),'0');assert.deepEqual(await page.locator('.enemy-area').boundingBox(),reserved);assert.equal(await page.locator('.monster-art-motion').evaluate(n=>n.style.getPropertyValue('--monster-scale')),initialScale);
  await page.unroute('**/monsters/*');await page.route('**/monsters/*',route=>route.fulfill({status:404,body:''}));
  await page.evaluate(async()=>{const {renderBetween}=await import('/src/ui/progression.js');q.view.cleanup();const s=q.c.getState();s.progress={...s.progress,stageId:'stage.02',roundIndex:0,battleNumber:4};s.status='BETWEEN_BATTLES';q.failed={cleanup:renderBetween(q.root,s,{onNext:()=>{},onSaves:()=>{}})};});await expect(page.locator('.preparation-monster-fallback')).toBeVisible();
  // Late completion in a detached view cannot replace a new scene.
  await page.evaluate(()=>{q.failed.cleanup();q.root.replaceChildren(document.createTextNode('next scene'));});assert.equal(await page.locator('#app').textContent(),'next scene');return {boss:proof,bodyHeight:Number(geometry),delayedDeadNeverRevived:true,stageReserved:true,failureFallback:true};
 });
 await check('T6-mobile-visible-area-and-comma',async()=>{
  await boot({width:844,height:390,mobile:true});await page.evaluate(()=>q.assigned(Array.from({length:12},()=>['I','go']).flat().join(' ')));
  await page.evaluate(()=>q.command({type:'SET_COMMA',afterCardInstanceId:q.c.getState().combat.sentenceSlots[7].cardInstanceId}));await settle();
  const measure=()=>page.locator('.comma-marker').evaluate(n=>{const a=n.getBoundingClientRect(),b=n.parentElement.getBoundingClientRect(),z=n.closest('.combat-sentence').getBoundingClientRect();return{bar:[a.x,a.y,a.width,a.height],word:[b.x,b.y,b.width,b.height],zone:[z.x,z.y,z.width,z.height]};});
  const normal=await measure();assert.ok(Math.abs(normal.bar[3]-normal.word[3])<1);assert.ok(normal.bar[0]+normal.bar[2]<=normal.zone[0]+normal.zone[2]);assert.ok(normal.bar[2]<normal.word[2]/2);
  await capture('phone-comma');
  await withVisibleArea(page,async()=>{await visibleArea(page,310);for(const selector of ['#attack-submit','#clear-sentence','.prepare-button','.comma-tool','.hand-page-row']){const r=await page.locator(selector).boundingBox();assert.ok(r.y>=0&&r.y+r.height<=311,JSON.stringify({selector,r}));}await page.getByRole('button',{name:'목표 문법',exact:true}).click();await expect(page.locator('dialog[open]')).toBeVisible();await close();const down=page.getByRole('button',{name:'문장 뒷부분 보기',exact:true});for(let i=0;i<3&&!await down.isDisabled();i++)await down.click();const last=await page.locator('.combat-sentence .word-card').last().boundingBox(),zone=await page.locator('.combat-sentence').boundingBox();assert.ok(last.y+last.height<=zone.y+zone.height+1);});
  const s=await state();assert.equal(s.combat.sentenceSlots.length,24);assert.equal(s.combat.punctuation.comma.afterCardInstanceId,s.combat.sentenceSlots[7].cardInstanceId);
  return{normal,visibleHeight:310,wordCount:24,columns:8,tool:await page.locator('.comma-tool').boundingBox()};
 });
 await check('T7-current-and-legacy-save',async()=>{
  await boot();await page.evaluate(async()=>{
   q.assigned('Seeing you I smiled');await q.command({type:'SET_COMMA',afterCardInstanceId:q.c.getState().combat.sentenceSlots[1].cardInstanceId});
   const {LocalStore}=await import('/src/services/localStore.js'),{openSaves}=await import('/src/ui/overlays.js');const {registry}=await import('/src/data/language/index.js');q.store=new LocalStore({registry});await q.store.init();await q.store.saveProfile(q.c.getProfile());
   q.saves=()=>openSaves({store:q.store,profile:q.c.getProfile(),state:q.c.getState(),onLoad:run=>{const r=q.c.dispatch({type:'RESUME_RUN',state:run});if(r.ok)q.show();return r;}});q.saves();
  });const before=await state();await page.getByRole('button',{name:'슬롯 1 저장',exact:true}).click();await expect(page.locator('dialog[open] [role=status]')).toContainText('저장했습니다');await close();
  await page.evaluate(()=>q.command({type:'REMOVE_COMMA'}));await page.evaluate(()=>q.saves());await page.getByRole('button',{name:'슬롯 1 불러오기',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('dialog[open].app-dialog'));assert.deepEqual(await state(),before);
  const old=await page.evaluate(async()=>{const {state,profile}=await fetch('/tests/fixtures/v081/legacy08-help-save.json').then(r=>r.json()),{RunController}=await import('/src/game/runController.js');const original=new RunController({initialState:state,profile});for(const slot of original.getState().combat.sentenceSlots){const r=original.dispatch({type:'RETURN_CARD',cardId:slot.cardInstanceId});if(!r.ok)throw Error(r.message);}const safe=original.getState();await q.store.saveProfile(profile);await q.store.saveRun(profile.playerId,3,safe);const loaded=await q.store.loadRun(profile.playerId,3);const c=new RunController({initialState:loaded,profile});return{state:safe,loaded,restored:c.getState()};});assert.deepEqual(old.loaded,old.state);assert.deepEqual(old.restored,old.state);
  return{currentVersion:before.version,commaAndAllStateExact:true,legacyVersion:old.loaded.version,legacyExact:true};
 });

}finally{await context?.close();await browser.close();await fs.writeFile(out+'/result.json',JSON.stringify(report,null,2));}
if(report.errors.length||report.checks.some(x=>x.status==='FAIL'))process.exitCode=1;
