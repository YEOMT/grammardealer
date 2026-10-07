/** Assigned finalized resolutions, real production DOM/CSS and native rAF/WAAPI clock. Not natural play. */
import {chromium,firefox,webkit} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {browserVideo} from './helpers/browser-video.mjs';
const out=process.env.SB_POLISH_OUT??'.local-validation/v051/core-browser';
await fs.mkdir(out,{recursive:true});
const cases=JSON.parse(await fs.readFile(new URL('./fixtures/v051-05_Core_Feel_Expectations.json',import.meta.url))).cases;
const report={kind:'ASSIGNED_RESOLUTION_NATIVE_CLOCK_DOM_FRAMES',checks:[],frames:[],captures:[],errors:[]};
const engine=process.env.SB_BROWSER_ENGINE??'chromium';report.engine=engine;report.platform=process.platform;const browser=await ({chromium,firefox,webkit})[engine].launch({timeout:30000});report.browserVersion=browser.version();let context,video;
try{
 video=await browserVideo(engine,out);report.videoArchive='All native recordings copied into evidence directory';
 context=await browser.newContext({viewport:{width:1366,height:768},recordVideo:video.options});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');await page.locator('#start-run').waitFor();
 await page.evaluate(async()=>{
  const [{RunController},{newProfile},{renderCombat},{snapshotFromText},{playAttack,createDOMPresentation}]=await Promise.all([import('/src/game/runController.js'),import('/src/services/localStore.js'),import('/src/ui/combat.js'),import('/src/engine/grammar/index.js'),import('/src/engine/presentation.js')]);
  window.coreProbe={async run(row,options){
   this.view?.cleanup();const c=new RunController({profile:{...newProfile('assigned core'),guidedTutorialCompletedVersion:'0.2.1'}});c.dispatch({type:'NEW_RUN',config:{seed:'polish.core'}});c.dispatch({type:'START_BATTLE'});const s=c.getState(),tokens=snapshotFromText('I want you to read a good book').orderedTokens;
   const ids=s.activeCardIds.slice(0,tokens.length);for(const[i,t]of tokens.entries())s.cardInstances[ids[i]].cardDefId=t.cardDefId;
   s.combat.sentenceSlots=ids.map((id,i)=>({cardInstanceId:id,selection:{formId:tokens[i].selectionId}}));s.combat.handIds=s.activeCardIds.slice(tokens.length,tokens.length+6);s.combat.drawIds=s.activeCardIds.slice(tokens.length+6);
   if(options.capacity){
    while(s.activeCardIds.length<30){const id='assigned.capacity.'+s.activeCardIds.length;s.activeCardIds.push(id);s.cardInstances[id]={instanceId:id,cardDefId:'card.technology',polishLevel:3,specialEffectId:null};}
    s.combat.sentenceSlots=s.activeCardIds.slice(0,16).map(cardInstanceId=>({cardInstanceId,selection:null}));s.combat.handIds=s.activeCardIds.slice(16,30);s.combat.drawIds=[];s.combat.rulesSnapshot.handLimit=14;
    const runes=['rune.perfectSentence','rune.longSentence','rune.svo','rune.svoo'];s.runes.orderedInstanceIds=runes;s.runes.instances=Object.fromEntries(runes.map(id=>[id,{instanceId:id,runeId:id,level:3}]));
   }
   s.combat.enemyState.hp=row.enemyHpBefore;s.combat.enemyState.maxHp=row.enemyMaxHp;
   const r={...row,attackId:'assigned.'+row.id,scoreTimeline:[{phase:'CARD_BASE',before:0,after:10,sourceType:'CARD',labelKo:'지정 연출 검사'}],analysis:{nodes:[],resolvedTokenRoles:[]},bossEffects:[],visualBasis:{enemyMaxHp:row.enemyMaxHp}};
   document.body.classList.toggle('effects-off',options.effectsOff);this.view=renderCombat(document.querySelector('#app'),s,{locked:true,openOverlay:()=>{}});this.view.beginPresentation();const root=this.view.element,enemy=root.querySelector('[data-presentation=enemy]'),sentence=root.querySelector('[data-presentation=sentence]');
   const original=Element.prototype.animate;if(options.fallback==='missing')Element.prototype.animate=undefined;if(options.fallback==='throw')Element.prototype.animate=()=>{throw Error('deliberate WAAPI failure');};
   const box=n=>{const b=n.getBoundingClientRect(),st=getComputedStyle(n);return {x:b.x,y:b.y,w:b.width,h:b.height,opacity:Number(st.opacity),display:st.display,visibility:st.visibility,filter:st.filter,outline:st.outlineColor,transform:st.transform,visible:b.right>0&&b.bottom>0&&b.left<innerWidth&&b.top<innerHeight&&Number(st.opacity)>0&&st.visibility!=='hidden'&&st.display!=='none'};};
   const start=box(sentence),enemyStart=box(enemy),frames=[],audio=[],layout={sentenceCards:root.querySelectorAll('.combat-sentence .word-card').length,handCards:root.querySelectorAll('.hand-cards .word-card').length,runes:root.querySelectorAll('.rune-slot:not(.empty)').length,actions:box(root.querySelector('.combat-actions')),hand:box(root.querySelector('.hand-section')),width:document.body.scrollWidth,viewport:innerWidth};let raf,live=true;
   const tick=()=>{if(!live)return;const body=document.querySelector('[data-presentation=attack-body]');frames.push({at:performance.now(),phase:root.dataset.corePhase,hp:root.querySelector('[data-presentation=hp]').textContent,body:body?box(body):null,sentence:box(sentence),enemy:box(enemy)});raf=requestAnimationFrame(tick);};tick();
   const adapter=createDOMPresentation(root,{hpMax:row.enemyMaxHp,audio:{play:name=>audio.push(name)}});
   this.current={row,root,start,enemyStart};
   const result=await playAttack(r,adapter,{...options});live=false;cancelAnimationFrame(raf);Element.prototype.animate=original;
   const value={id:row.id,options,result,start,enemyStart,frames,audio,layout,hp:root.querySelector('[data-presentation=hp]').textContent,label:root.querySelector('[data-presentation=label]').textContent,fallback:Number(root.dataset.coreFallback??0),busy:root.getAttribute('aria-busy'),clones:document.querySelectorAll('.core-attack-body').length,animations:root.getAnimations({subtree:true}).map(a=>({type:a.constructor.name,target:a.effect.target.className,state:a.playState}))};this.last=value;return value;
  }};
 });
 const scenarios=[];for(const effectsOff of [false,true])for(const reducedMotion of [false,true])scenarios.push({effectsOff,reducedMotion,speed:1});
 scenarios.push({effectsOff:true,reducedMotion:false,speed:2},{effectsOff:true,reducedMotion:false,speed:1,fallback:'missing'},{effectsOff:false,reducedMotion:false,speed:1,fallback:'throw'});
 for(const width of [1366,1280,1024])scenarios.push({effectsOff:true,reducedMotion:false,speed:1,capacity:true,width});
 scenarios.push({effectsOff:true,reducedMotion:false,speed:1,capacity:true,width:1366,zoom:1.25});
 for(const [i,options]of scenarios.entries()){
  await page.setViewportSize({width:options.width??1366,height:options.width===1280?800:768});
  await page.evaluate(zoom=>document.documentElement.style.zoom=String(zoom),options.zoom??1);
  await page.emulateMedia({reducedMotion:options.reducedMotion?'reduce':'no-preference'});
  const row=cases.find(c=>c.expectedPolicy==='MASSIVE');const value=await page.evaluate(async({row,options})=>coreProbe.run(row,options),{row,options});
  report.frames.push(value);
  if(options.capacity){assert.equal(value.layout.sentenceCards,16);assert.equal(value.layout.handCards,14);assert.equal(value.layout.runes,4);assert.ok(value.layout.actions.y+value.layout.actions.h<=value.layout.hand.y);assert.ok(value.layout.width<=value.layout.viewport);}
  assert.equal(value.result.status,'FINISHED');assert.equal(value.busy,'false');assert.equal(value.clones,0);assert.equal(value.animations.filter(a=>a.type==='Animation').length,0,JSON.stringify(value.animations));assert.equal(value.hp,`${row.enemyHpAfter} / ${row.enemyMaxHp}`);
  const lunge=value.frames.filter(f=>f.phase==='LUNGE'),recoil=value.frames.filter(f=>f.phase==='RECOIL');assert.ok(lunge.length&&recoil.length);
  if(options.fallback)assert.ok(value.fallback>0);else if(options.reducedMotion){assert.ok(lunge.every(f=>!f.body));assert.ok(recoil.every(f=>f.enemy.transform==='none'));assert.ok(recoil.some(f=>f.enemy.filter.includes('brightness')));}
  // Track the center: the intended scale-down moves the top edge down even during an upward lunge.
  // Keep the same >5px travel and visibility thresholds; shrinking alone cannot satisfy this check.
  else {assert.ok(lunge.some(f=>f.body?.visible&&f.body.y+f.body.h/2<value.start.y+value.start.h/2-5&&f.body.opacity>.1),'visible actual lunge center toward enemy');assert.ok(recoil.some(f=>Math.abs(f.enemy.x-value.enemyStart.x)>1&&f.enemy.visible),'visible local recoil');}
  assert.ok(value.frames.filter(f=>['CHARGE','LUNGE'].includes(f.phase)).every(f=>f.hp===`${row.enemyHpBefore} / ${row.enemyMaxHp}`));assert.ok(value.audio.includes('impact'));
  report.checks.push({id:`CORE_MATRIX_${i}`,status:'PASS'});
  const name=`core-${i}-finished.png`;await page.screenshot({path:out+'/'+name});report.captures.push(name);
 }
 await page.evaluate(()=>document.documentElement.style.zoom='');
 for(const row of cases){const value=await page.evaluate(row=>coreProbe.run(row,{speed:2,effectsOff:true,reducedMotion:false}),row);assert.equal(value.result.status,'FINISHED');assert.equal(value.hp,`${row.enemyHpAfter} / ${row.enemyMaxHp}`);assert.equal(value.clones,0);if(row.actualHpLoss===0)assert.ok(!value.audio.includes('impact'));if(row.killed&&row.overkill>0)assert.ok(value.label.includes(`초과 피해 +${row.overkill}`));report.checks.push({id:row.id,status:'PASS'});}
 const teaching=await page.evaluate(async()=>{
  const [{snapshotFromText,analyzeSentence},{resolveAttack},{createDOMPresentation}]=await Promise.all([import('/src/engine/grammar/index.js'),import('/src/engine/stage.js'),import('/src/engine/presentation.js')]);
  // Real engine events applied to an explicitly assigned renderer: no run/profile commit.
  const root=coreProbe.current.root,ids=[...root.querySelectorAll('.combat-sentence [data-card-id]')].map(n=>n.dataset.cardId),snapshot=snapshotFromText('I run');
  snapshot.orderedTokens.forEach((t,i)=>{t.cardInstanceId=ids[i];});
  const r=resolveAttack({analysis:analyzeSentence(snapshot),sentenceSnapshot:snapshot,cards:snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:0})),equippedRunes:[{runeId:'rune.sv',level:1}],enemy:{id:'assigned.teaching',hp:999,maxHp:999},policyVersion:'0.5.0'});
  const slot=root.querySelector('.rune-slot');slot.dataset.runeId='rune.sv';document.body.classList.add('effects-off');
  const adapter=createDOMPresentation(root,{hpMax:999});adapter.begin(r,{effectsOff:true,reducedMotion:false});
  const frame=r.scoreTimeline.find(e=>e.phase==='MAIN_FRAME'),rune=r.scoreTimeline.find(e=>e.sourceType==='RUNE');
  if(!frame||!rune)throw Error('Actual frame/rune events required');
  adapter.highlight(frame.highlightCardIds??frame.cardIds??[],r.analysis.resolvedTokenRoles);adapter.onScore(frame,{step:0,intensity:1});
  const roles=root.querySelectorAll('[data-presentation-role]').length;adapter.pulseRune(rune.sourceId);adapter.onScore(rune,{step:1,intensity:1});
  const result={roles,pulse:slot.classList.contains('presentation-rune-pulse'),label:root.querySelector('[data-presentation=label]').textContent,expected:rune.labelKo,score:root.querySelector('[data-presentation=score]').textContent,after:rune.after};adapter.cancel();return result;
 });
 assert.ok(teaching.roles>=2);assert.equal(teaching.pulse,true);assert.equal(teaching.label,teaching.expected);assert.equal(Number(teaching.score),teaching.after);report.checks.push({id:'CORE_TEACHING_EFFECTS_OFF',status:'PASS',evidence:teaching});
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;throw e;}finally{await context?.close();await video?.archive();await browser.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks.length,errors:report.errors,failed:!!report.failure}));}
