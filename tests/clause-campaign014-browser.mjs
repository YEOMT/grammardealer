/** Short assigned-deck UI learning route; not a natural reward expedition or win-rate test. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const output=process.env.SB_CLAUSE_CAMPAIGN_OUTPUT||'.local-validation/v014/campaign-browser-final';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.SB_BASE_URL||'http://127.0.0.1:5173/grammardealer/');
 await page.evaluate(async()=>{
  const f=await import('/tests/helpers/corridor-state.js'),ui=await import('/src/ui/progression.js'),{renderCombat}=await import('/src/ui/combat.js'),{renderShop}=await import('/src/ui/shop.js'),{RunController}=await import('/src/game/runController.js'),{formatSentence}=await import('/src/punctuation.js'),p=await import('/src/engine/presentation.js'),{validateRunState}=await import('/src/services/localStore.js'),{registryForVersion}=await import('/src/data/language/index.js');
  const sentences=['Seeing you, I have read books.','Helped by you, I have read books.','If I worked I would read books.','If I had worked I would have read books.'];
  const assigned=f.assignedCorridor({version:'0.14.0',round:0,seed:'clause.browser.route',sentences,polish:3,runes:['rune.longSentence','rune.svo','rune.clauseLink','rune.presentPerfect']});
  const fresh=new RunController();f.checked(fresh,{type:'NEW_RUN',config:{seed:'clause.current.policy'}});const state=assigned.c.getState();state.config.shopFlowPolicy=fresh.getState().config.shopFlowPolicy;assigned.c._state=state;
  window.q={...assigned,f,ui,p,sentences,root:document.querySelector('#app'),attacks:[],error:null,presenting:false,
   validate(){return validateRunState(JSON.parse(JSON.stringify(this.c.getState())),registryForVersion('0.14.0'));},
   show(locked=false,state=this.c.getState()){
    this.view?.cleanup?.();this.extraCleanup?.();this.extraCleanup=null;document.querySelectorAll('dialog').forEach(n=>n.remove());
    const command=c=>this.command(c);
    if(state.status==='BATTLE')this.view=renderCombat(this.root,state,{locked,command,handSelection:id=>this.c.getHandSelection(id)});
    else if(state.status==='REWARD')this.extraCleanup=ui.renderReward(this.root,state,{command});
    else if(state.status==='BETWEEN_BATTLES')ui.renderBetween(this.root,state,{onNext:()=>command({type:'NEXT_BATTLE'})});
    else if(state.status==='STAGE_CLEAR')ui.renderStageClear(this.root,state,{onNext:()=>command({type:'NEXT_STAGE'})});
    else if(state.status==='STAGE_INTRO')ui.renderIntro(this.root,state,{onStart:()=>command({type:'ENTER_STAGE'})});
    else if(state.status==='SHOP')renderShop(this.root,state,{command});
   },
   async command(cmd){
    try{const before=this.c.getState(),r=this.f.checked(this.c,cmd);if(!r.resolution){this.validate();this.show();return r;}
     this.presenting=true;this.show(true,before);this.view.beginPresentation();await this.p.playAttack(r.resolution,this.p.createDOMPresentation(this.view.element),{speed:2});
     this.f.checked(this.c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});this.attacks.push({battle:before.progress.battleNumber,text:formatSentence(r.resolution.sentenceSnapshot),status:r.resolution.status,power:r.resolution.finalPower,loss:r.resolution.actualHpLoss,hp:r.resolution.enemyHpAfter,threads:r.resolution.clauseThreadResult?.unlockedThreads??[],comma:r.resolution.sentenceSnapshot.punctuation});this.validate();this.presenting=false;this.show();return r;
    }catch(e){this.error=e.stack;this.presenting=false;throw e;}
   },
   deal(index){this.f.assignPiles(this.c,{hand:this.slots[index].map(s=>s.cardInstanceId)});this.validate();this.show();return this.slots[index];}
  };q.show();
 });
 const results=[];
 async function compose(index,commaGap=0){
  const slots=await page.evaluate(i=>q.deal(i),index);
  for(const slot of slots){
   let card=page.locator(`.hand-cards [data-card-id="${slot.cardInstanceId}"] .card-body`);
   if(!await card.isVisible())await page.getByRole('button',{name:'다음 손패 페이지',exact:true}).click();
   await card.click();
   if(slot.selection){await page.locator(`.combat-sentence [data-card-id="${slot.cardInstanceId}"] .form-button`).click();await page.locator(`[data-form-id="${slot.selection}"],[data-form-aliases~="${slot.selection}"]`).first().click();}
  }
  if(commaGap){await page.locator('.comma-tool').click();await page.getByRole('button',{name:'위치 목록',exact:true}).click();await page.locator('.comma-gap-list button').nth(commaGap).click();}
  assert.equal(await page.locator('.combat-sentence .word-card').count(),slots.length);
 }
 async function attack(){const n=await page.evaluate(()=>q.attacks.length);await page.locator('#attack-submit').click();await page.waitForFunction(n=>q.error||q.attacks.length>n,n,{timeout:45000});const error=await page.evaluate(()=>q.error);assert.equal(error,null);return page.evaluate(()=>q.attacks.at(-1));}
 for(let index=0;index<4;index++){
  await compose(index,index===0?2:index===1?3:0);const r=await attack();results.push(r);assert.equal(r.battle,43+index);assert.equal(r.hp,0);assert.equal(r.status,'VALID');
  await page.locator('#skip-reward').click();assert.equal(await page.evaluate(()=>q.c.getState().status),'BETWEEN_BATTLES');await page.locator('#next-battle').click();
 }
 assert.equal(await page.evaluate(()=>q.c.getState().combat.enemyState.maxHp),5000);
 await compose(0,2);let r=await attack();results.push(r);assert.deepEqual(r.threads,['ACTIVE']);assert.equal(r.hp,1);
 await compose(1,3);r=await attack();results.push(r);assert.deepEqual(r.threads,['PASSIVE']);assert.equal(r.hp,1);assert.equal(r.loss,0);
 assert.equal(await page.evaluate(()=>q.validate()),true);
 await compose(2);await page.screenshot({path:output+'/47-before-last-thread.png'});r=await attack();results.push(r);assert.deepEqual(r.threads,['COUNTERFACTUAL']);assert.equal(r.hp,0);assert.equal(r.loss,1);
 assert.equal(await page.evaluate(()=>q.c.getState().combat.clauseThreadReceipts.length),3);
 const boundary=await page.evaluate(()=>({state:q.c.getState().status,battle:q.c.getState().progress.battleNumber,valid:q.validate(),receipts:q.c.getState().combat.clauseThreadReceipts.length,settlements:q.c.getState().settlementIds.length}));
 assert.equal(boundary.battle,47);assert.equal(boundary.valid,true);
 await page.locator('#skip-reward').click();assert.equal(await page.evaluate(()=>q.c.getState().status),'SHOP');
 const shop=await page.evaluate(()=>{const s=q.c.getState();return{policy:s.config.shopFlowPolicy,stage:s.shop.stageId,id:s.shop.shopId,count:s.shopHistory.length+1,signature:JSON.stringify(s.shop),rng:JSON.stringify(s.rng)};});
 assert.equal(shop.policy,'BOSS_REWARD_FIRST_V1');assert.equal(shop.stage,'stage.final');assert.equal(shop.count,6);
 await page.evaluate(()=>q.show());assert.deepEqual(await page.evaluate(()=>({signature:JSON.stringify(q.c.getState().shop),rng:JSON.stringify(q.c.getState().rng)})),{signature:shop.signature,rng:shop.rng});
 await page.locator('#leave-shop').click();await page.getByRole('button',{name:'다음 지역으로',exact:true}).click();assert.equal(await page.evaluate(()=>q.c.getState().status),'STAGE_INTRO');
 await page.locator('#enter-stage').click();assert.equal(await page.evaluate(()=>q.c.getState().status),'BATTLE');
 const finale=await page.evaluate(()=>{const s=q.c.getState(),m=s.combat.enemyState.bossMechanic;return{battle:s.progress.battleNumber,id:m.id,hp:s.combat.enemyState.hp,turns:s.combat.turnsRemaining,shopCount:s.shopHistory.length+1,closed:s.shop.closed,valid:q.validate(),taskPlan:m.taskPlan.map(t=>({type:t.type,target:t.target,supportCardDefId:t.supportCardDefId,witnessWords:t.witnessSlots.length,punctuation:t.witnessPunctuation??[]}))};});
 assert.equal(finale.battle,48);assert.equal(finale.id,'FINALE_SURFACE');assert.equal(finale.hp,5000);assert.equal(finale.turns,6);assert.equal(finale.shopCount,6);assert.equal(finale.closed,true);assert.equal(finale.valid,true);assert.equal(finale.taskPlan.length,2);assert.equal(new Set(finale.taskPlan.map(t=>t.type)).size,2);assert.deepEqual(errors,[]);
 const report={mode:'DESIGNATED_LEGAL_DECK_UI',note:'Existing physical cards assigned to hand before each submission; no enemy HP, score, rules or turn edits. Real UI forms, comma placement, submission, presentation, reward skip and next-battle commands, then current boss-reward-first final shop/entry/48 start. Not natural acquisition/playthrough.',viewport:{width:1366,height:768},results,boundary,shop:{policy:shop.policy,stage:shop.stage,id:shop.id,count:shop.count,stableOnRerender:true},finale,errors,natural50:'NOT RUN',realMobile:'NOT RUN'};
 await writeFile(output+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await context.close();await browser.close();}
