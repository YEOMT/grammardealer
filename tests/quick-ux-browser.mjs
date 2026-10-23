/** Focused assigned-state UI checks, not a natural expedition or physical tablet. */
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const out=process.env.SB_QUICK_UX_OUT??'.local-validation/quick-ux/browser';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1366,height:768}});
const report={scope:'ASSIGNED_STATE_REAL_UI',checks:[],captures:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
const pass=(id,data={})=>{report.checks.push({id,status:'PASS',...data});console.log('PASS',id);};
const capture=async name=>{await page.screenshot({path:`${out}/${name}.png`,fullPage:true});report.captures.push(name+'.png');};
try{
 await page.goto(process.env.SB_URL??'http://127.0.0.1:5173/');await page.locator('#start-run').waitFor();
 await page.evaluate(async()=>{
  const f=await import('/tests/helpers/corridor-state.js'),{renderCombat}=await import('/src/ui/combat.js'),{renderIntro}=await import('/src/ui/progression.js'),p=await import('/src/engine/presentation.js');
  window.q={f,p,root:document.querySelector('#app'),settings:{speed:2},reset(options={}){const x=f.assignedCorridor({version:'0.10.2',...options});this.c=x.c;this.slots=x.slots;this.show();},show(){this.view?.cleanup();this.view=renderCombat(this.root,this.c.getState(),{handSelection:id=>this.c.getHandSelection(id),command:cmd=>this.command(cmd),openOverlay:()=>{}});},async command(cmd){
   const before=this.c.getState(),r=this.c.dispatch(cmd);this.last=r;if(!r.ok)return r;
   if(r.resolution){this.resolution=r.resolution;this.presenting=true;this.view.cleanup();this.view=renderCombat(this.root,before,{locked:true});this.view.beginPresentation();const a=p.createDOMPresentation(this.view.element,{hpMax:before.combat.enemyState.maxHp});this.phases=[];this.motion=[];
    for(const name of ['charge','lunge','impact']){const original=a[name];a[name]=(...args)=>{this.phases.push(name);original(...args);if(name==='lunge'&&!this.settings.reducedMotion){const body=document.querySelector('.core-attack-body'),source=this.root.querySelector('.combat-sentence');this.motion.push({rowDisplay:getComputedStyle(body.querySelector('.sentence-row')).display,cardWidth:parseFloat(getComputedStyle(body.querySelector('.word-card')).width),sourceWidth:parseFloat(getComputedStyle(source.querySelector('.word-card')).width),visible:body.getBoundingClientRect().width>0,animation:body.getAnimations().length,sourceOpacity:source.style.opacity});}};}
    await p.playAttack(r.resolution,a,this.settings);f.checked(this.c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});this.presenting=false;
   }this.show();return r;
  },intro(stage){this.view?.cleanup();if(stage==='stage.04'){this.c=new this.c.constructor({profile:this.c.getProfile()});f.checked(this.c,{type:'NEW_RUN',config:{seed:'quick-ux-entry'}});}const s=this.c.getState();for(const id of s.combat?.temporaryCardIds??[])delete s.cardInstances[id];s.combat=null;s.status='STAGE_INTRO';s.progress={stageId:stage,roundIndex:0,battleNumber:stage==='stage.04'?13:1,contentBoundary:null};this.c._state=s;const show=()=>renderIntro(this.root,this.c.getState(),{onStart:()=>{f.checked(this.c,{type:stage==='stage.01'?'START_BATTLE':'ENTER_STAGE'});this.c.getState().status==='STAGE_INTRO'?show():this.show();},onChooseConnector:choice=>{f.checked(this.c,{type:'CHOOSE_STAGE4_CONNECTOR',...choice,expectedRevision:this.c.getState().revision,commandId:'quick.entry.choice'});this.entryResult=this.c.getState().status;},onLobby:()=>{}});show();}};q.reset();
 });
 for(const [w,h,n]of (process.env.SB_ENTRY_ONLY?[]:[[1366,768,7],[1180,820,13],[1366,650,24]])){
  await page.setViewportSize({width:w,height:h});await page.evaluate(n=>{q.reset({sentences:[Array(24).fill('book').join(' ')]});const s=q.c.getState(),slots=q.slots[0].slice(0,n),ids=slots.map(x=>x.cardInstanceId);q.f.assignPiles(q.c,{sentence:slots,hand:s.activeCardIds.filter(id=>!ids.includes(id)).slice(0,10)});q.show();},n);await page.waitForTimeout(80);
  const g=await page.evaluate(()=>{const box=n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,r:b.right,b:b.bottom};};const board=document.querySelector('.combat-sentence');return {board:box(board),rows:[...board.querySelectorAll('.sentence-row')].map(r=>({box:box(r),cards:[...r.children].map(box)})),hand:box(document.querySelector('.hand-cards .word-card:not([hidden])')),boardCard:box(board.querySelector('.word-card')),height:document.body.scrollHeight,buttons:[...document.querySelectorAll('.combat-actions button,.exchange-row button,.hand-page-row>button,.pile-button')].map(n=>({...box(n),text:n.textContent,hit:n.contains(document.elementFromPoint(n.getBoundingClientRect().x+n.offsetWidth/2,n.getBoundingClientRect().y+n.offsetHeight/2))})),discard:box(document.querySelector('.pile-discard')),exchange:box(document.querySelector('.exchange-row'))};});
  assert.ok(Math.abs(g.hand.w/g.boardCard.w-1.25)<.02);assert.ok(g.hand.h>=(h<=720?82:96)*1.2);assert.ok(g.height<=h+1,JSON.stringify(g));
  for(const row of g.rows){assert.ok(row.cards.length<=12);assert.ok(Math.abs((row.cards[0].x+row.cards.at(-1).r)/2-(g.board.x+g.board.w/2))<2);}
  assert.ok(Math.abs((g.rows[0].box.y+g.rows.at(-1).box.b)/2-(g.board.y+g.board.h/2))<2);
  for(const b of g.buttons){assert.ok(b.b<=h+1&&b.r<=w+1&&b.hit,JSON.stringify(b));}assert.ok(g.exchange.b<=g.discard.y+1);assert.ok(g.exchange.r<=g.discard.x+1);
  assert.equal(await page.locator('.status-nav [data-overlay=exhausted]').count(),0);pass(`LAYOUT_${w}_${h}_${n}`,{geometry:g});if(n!==24)await capture(n===7?'pc-window':'tablet-landscape');
 }
 if(!process.env.SB_ENTRY_ONLY){
 await page.evaluate(()=>{q.reset({sentences:['She is reading books.']});q.f.assignPiles(q.c,{sentence:q.slots[0],hand:[]});q.show();});
 const before=await page.evaluate(()=>q.c.getState());await page.locator('#clear-sentence').click();assert.equal((await page.evaluate(()=>q.c.getState())).combat.handIds.length,4);assert.equal(await page.locator('#clear-sentence').isDisabled(),true);await expect(page.locator('.hand-cards')).toContainText('reading');
 await page.locator('.hand-cards .word-card .card-body').first().click();assert.equal((await page.evaluate(()=>q.c.getState())).combat.sentenceSlots.length,1);await page.locator('#clear-sentence').click();await page.locator('.prepare-button').click();const prepared=await page.evaluate(()=>q.c.getState());assert.equal(prepared.combat.turnsRemaining,before.combat.turnsRemaining-1);assert.equal(prepared.stats.preparations,1);pass('CLEAR_READD_FORM_AND_TURN_BUTTON');
 for(const settings of [{speed:1},{speed:2,effectsOff:true},{speed:2,reducedMotion:true}]){
  await page.evaluate(settings=>{q.settings=settings;q.reset({sentences:['I read books.']});q.f.assignPiles(q.c,{sentence:q.slots[0],hand:[]});q.show();},settings);
  if(settings.speed===1){await page.locator('.fullscreen-toggle').click();assert.ok(await page.evaluate(()=>!!document.fullscreenElement));}
  await page.locator('#attack-submit').click();await page.waitForFunction(()=>q.presenting===false,null,{timeout:60000});const r=await page.evaluate(()=>({phases:q.phases,motion:q.motion,resolution:q.resolution,state:q.c.getState()}));
  assert.deepEqual(r.phases,['charge','lunge','impact']);assert.ok(r.resolution.actualHpLoss>0);assert.equal(r.state.stats.attacks,1);assert.equal(r.state.combat.turnsRemaining,5);
  if(!settings.reducedMotion){assert.equal(r.motion[0].rowDisplay,'flex');assert.equal(r.motion[0].cardWidth,r.motion[0].sourceWidth);assert.ok(r.motion[0].visible&&r.motion[0].animation>0);}
  assert.equal(await page.locator('.attack-overlay,.core-attack-body').count(),0);const duplicate=await page.evaluate(()=>q.c.dispatch({type:'FINISH_PRESENTATION',attackId:q.resolution.attackId}));assert.equal(duplicate.ok,false);pass('REAL_ATTACK_'+JSON.stringify(settings),{motion:r.motion,power:r.resolution.finalPower});
  if(settings.speed===1)await page.locator('.fullscreen-toggle').click();
 }
 }
 await page.setViewportSize({width:1366,height:650});await page.evaluate(()=>{q.reset();q.intro('stage.01');});await expect(page.locator('.intro-encounters')).toBeVisible();assert.equal(await page.locator('.intro-encounters b,details.intro-details').count(),0);await expect(page.locator('#start-battle')).toBeInViewport();await page.locator('#start-battle').click();await expect(page.locator('.game-shell')).toBeVisible();pass('ORDINARY_ENTRY');
 await page.setViewportSize({width:1180,height:820});await page.evaluate(()=>{q.reset();q.intro('stage.04');});await page.locator('#enter-stage').click();await expect(page.locator('#choose-stage4-and')).toBeInViewport({ratio:1});await capture('choice-entry');await page.locator('#choose-stage4-and').click();assert.equal(await page.evaluate(()=>q.entryResult),'SHOP');pass('CHOICE_ENTRY_TO_SHOP');
 assert.deepEqual(report.errors,[]);pass('NO_PAGE_ERRORS');
}catch(e){report.failure=String(e.stack);await capture('failure');throw e;}finally{await fs.writeFile(out+'/result.json',JSON.stringify(report,null,2));await browser.close();}
