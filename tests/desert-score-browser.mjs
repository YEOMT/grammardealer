/** Assigned real Controller attacks + normal DOM presentation. Not a natural campaign run. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const out=process.env.SB_V05_SCORE_EVIDENCE??'.local-validation/v05/desert-score-browser';
const url=process.env.SB_V05_DEV_URL??'http://127.0.0.1:5173/';
await fs.mkdir(out,{recursive:true});
const report={kind:'ASSIGNED_PHYSICAL_CARDS_REAL_CONTROLLER_AND_LIVE_SCORE_PRESENTATION',checks:[],captures:[],attacks:[],errors:[]};
const browser=await chromium.launch({headless:true});
let page,context;
const check=id=>report.checks.push({id,status:'PASS'});
try{
 context=await browser.newContext({viewport:{width:1366,height:768},recordVideo:{dir:out}});
 page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.setDefaultTimeout(15000);
 await page.goto(url);await page.locator('#start-run').waitFor();
 await page.evaluate(async()=>{
  const [{assignedSphinx},{snapshotFromText},{registryForVersion},{isTurnSealed},{renderCombat},{createDOMPresentation,playAttack}]=await Promise.all([
   import('/tests/helpers/desert-state.js'),import('/src/engine/grammar/index.js'),import('/src/data/language/index.js'),
   import('/src/game/turnHandSeal.js'),import('/src/ui/combat.js'),import('/src/engine/presentation.js'),
  ]);
  window.desertScore={root:document.querySelector('#app'),frames:[],start(text){
   this.view?.cleanup();this.c=assignedSphinx('desert.live.score.'+text);const s=this.c.getState();
   const tokens=snapshotFromText(text,{registry:registryForVersion(s.version)}).orderedTokens;
   const ids=s.activeCardIds.filter(id=>!isTurnSealed(s,id)&&!s.cardInstances[id].cardDefId.startsWith('card.operation.')).slice(0,tokens.length);
   if(ids.length!==tokens.length)throw Error('Assigned score test lacks physical cards');
   // Only QA physical word/form assignment. Enemy HP, effects, and engine output are not injected.
   for(const [i,t]of tokens.entries()){s.cardInstances[ids[i]].cardDefId=t.cardDefId;s.cardInstances[ids[i]].polishLevel=0;}
   s.combat.sentenceSlots=ids.map((cardInstanceId,i)=>({cardInstanceId,selection:{formId:tokens[i].selectionId}}));
   s.combat.handIds=[];s.combat.discardIds=[];s.combat.drawIds=s.activeCardIds.filter(id=>!ids.includes(id)&&!s.combat.exhaustedIds.includes(id));s.combat.battleDirty=true;this.c._state=s;
   this.before=this.c.getState();this.beforeProfile=this.c.getProfile();const submitted=this.c.dispatch({type:'SUBMIT'});
   if(!submitted.ok)throw Error(submitted.message);this.resolution=submitted.resolution;this.committed=this.c.getState();this.committedProfile=this.c.getProfile();
   this.frames=[];this.done=null;this.view=renderCombat(this.root,this.before,{locked:true,openOverlay:()=>{}});this.view.beginPresentation();
   const badge=document.createElement('aside');badge.textContent='지정 카드 · 실제 문법/정산/연출 검사 (자연 원정 아님)';badge.style='position:fixed;left:4px;top:2px;background:#edd6a0;color:#203129;font-size:11px;padding:3px 5px;z-index:90';this.root.append(badge);
   const adapter=createDOMPresentation(this.view.element,{hpMax:this.before.combat.enemyState.maxHp}),onScore=adapter.onScore;
   adapter.onScore=(event,options)=>{
    onScore(event,options);
    const node=this.root.querySelector('[data-presentation="score"]');
    this.frames.push({sourceId:event.sourceId,eventId:event.eventId,label:event.labelKo,operand:structuredClone(event.operand),operation:event.operation,before:event.before,after:event.after,
     displayedLabel:this.root.querySelector('[data-presentation="label"]').textContent,displayedScore:node.textContent,title:node.title,beforeAttribute:node.dataset.before,afterAttribute:node.dataset.after,
     latestLog:this.root.querySelector('[data-presentation="log"]').lastElementChild?.textContent??null,at:performance.now()});
    this.currentEventId=event.eventId;
   };
   this.promise=playAttack(this.resolution,adapter,{speed:1}).then(done=>{this.done=done;return done;});
   return this.resolution;
  },finish(){
   const result=this.c.dispatch({type:'FINISH_PRESENTATION',attackId:this.resolution.attackId});if(!result.ok)throw Error(result.message);
   this.view.cleanup();this.view=renderCombat(this.root,this.c.getState(),{command:cmd=>this.c.dispatch(cmd),openOverlay:()=>{}});
   return {state:this.c.getState(),profile:this.c.getProfile()};
  },renderAgain(){this.view.cleanup();this.view=renderCombat(this.root,this.c.getState(),{command:cmd=>this.c.dispatch(cmd),openOverlay:()=>{}});return {state:this.c.getState(),profile:this.c.getProfile()};}};
 });
 const cases=[
  {id:'svoc',text:'I want you to read books',expectedPower:393,targets:[['FRAME.SVOC',2.5],['CLAUSE.INFINITIVE',1.4],['stage.05',1.25]]},
  {id:'gerund',text:'I enjoy reading books',expectedPower:220,targets:[['CLAUSE.GERUND',1.4],['stage.05',1.25]]},
 ];
 for(const scenario of cases){
  const result=await page.evaluate(text=>desertScore.start(text),scenario.text);
  assert.equal(result.analysis.status,'VALID');assert.equal(result.finalPower,scenario.expectedPower);assert.equal(result.enemyHpBefore,840);
  for(const [sourceId,multiplier]of scenario.targets){
   const expected=result.scoreTimeline.filter(e=>e.sourceId===sourceId);assert.equal(expected.length,1);
   const event=expected[0];assert.equal(event.operation,'MULTIPLY');assert.equal(event.operand.num/event.operand.den,multiplier);
   assert.equal(event.after,Math.floor(event.before*event.operand.num/event.operand.den));
   await page.waitForFunction(id=>desertScore.currentEventId===id,event.eventId);
   const frame=await page.evaluate(id=>desertScore.frames.find(f=>f.eventId===id),event.eventId);
   assert.equal(frame.displayedLabel,event.labelKo);assert.ok(frame.displayedLabel.includes('×'+multiplier));
   assert.equal(frame.displayedScore,String(event.after));assert.equal(frame.title,`${event.before} → ${event.after}`);
   assert.equal(frame.beforeAttribute,String(event.before));assert.equal(frame.afterAttribute,String(event.after));
   assert.equal(frame.latestLog,`${event.labelKo}  ${event.before} → ${event.after}`);
   const name=scenario.id+'-'+sourceId.toLowerCase().replaceAll('.','-')+'.png';
   await page.screenshot({path:out+'/'+name,fullPage:true});report.captures.push(name);
   assert.equal(await page.evaluate(()=>desertScore.currentEventId),event.eventId,'Capture must still show the actual live score event');
   check('LIVE_'+scenario.id.toUpperCase()+'_'+sourceId+'_OPERAND_AND_FLOOR');
  }
  await page.waitForFunction(()=>desertScore.done);
  const shown=await page.evaluate(()=>({done:desertScore.done,frames:desertScore.frames,before:desertScore.before,committed:desertScore.committed,current:desertScore.c.getState(),committedProfile:desertScore.committedProfile,currentProfile:desertScore.c.getProfile(),hp:desertScore.root.querySelector('[data-presentation="hp"]').textContent,busy:desertScore.view.element.getAttribute('aria-busy'),effectNodes:desertScore.root.querySelectorAll('.rune-flight,[data-presentation-role]').length}));
  assert.equal(shown.done.status,'FINISHED');assert.equal(shown.frames.length,result.scoreTimeline.length);
  assert.deepEqual(shown.current,shown.committed);assert.deepEqual(shown.currentProfile,shown.committedProfile);
  assert.equal(shown.hp,`${result.enemyHpAfter} / 840`);assert.equal(shown.busy,'false');assert.equal(shown.effectNodes,0);
  assert.equal(shown.committed.stats.attacks,shown.before.stats.attacks+1);assert.equal(shown.committed.stats.totalActualDamage,shown.before.stats.totalActualDamage+result.actualHpLoss);
  check('PRESENTATION_'+scenario.id.toUpperCase()+'_READS_COMMITTED_STATE_ONCE');
  const finished=await page.evaluate(()=>desertScore.finish()),rerendered=await page.evaluate(()=>desertScore.renderAgain());
  assert.deepEqual(rerendered,finished);assert.equal(finished.state.combat.enemyState.hp,result.enemyHpAfter);
  assert.equal(finished.state.stats.attacks,shown.committed.stats.attacks);assert.equal(finished.state.stats.totalActualDamage,shown.committed.stats.totalActualDamage);
  const duplicate=await page.evaluate(()=>desertScore.c.dispatch({type:'FINISH_PRESENTATION',attackId:desertScore.resolution.attackId}));assert.equal(duplicate.ok,false);
  assert.deepEqual(await page.evaluate(()=>({state:desertScore.c.getState(),profile:desertScore.c.getProfile()})),finished);
  check('FINISH_'+scenario.id.toUpperCase()+'_RERENDER_DUPLICATE_NO_EXTRA_DAMAGE_OR_RECORD');
  report.attacks.push({sentence:scenario.text,resolution:result,frames:shown.frames,presentation:shown.done});
 }
 assert.deepEqual(report.errors,[]);report.status='PASS';const video=page.video();await context.close();await video.saveAs(out+'/desert-score.webm');
}catch(error){report.status='FAIL';report.error=error.stack;if(page)await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});throw error;}
finally{await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,captures:report.captures.length}));await browser.close();}
