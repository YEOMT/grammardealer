import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {spawn} from 'node:child_process';
const out=process.env.SB_ASSETS_OUT??'.local-validation/stage-assets/browser';await fs.mkdir(out,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5196','--strictPort'],{stdio:['ignore','pipe','pipe']});let browser;
const report={scope:'assigned-state Chromium + real controller attacks; not natural campaign or listening',checks:[],errors:[]};
const pass=(id,data={})=>report.checks.push({id,status:'PASS',...data});
const compare=(a,b)=>{for(const key in a)for(let i=0;i<4;i++)assert.ok(Math.abs(a[key][i]-b[key][i])<.8,`${key}: ${a[key]} -> ${b[key]}`);};
try{
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('5196'))resolve();});server.once('error',reject);server.once('exit',code=>reject(Error('Vite exit '+code)));});
 browser=await chromium.launch({args:['--proxy-server=direct://','--proxy-bypass-list=*']});const page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5196/');await page.locator('#start-run').waitFor();await page.locator('.scene-backdrop[data-ready=true]').waitFor();
 const lobbyRects=await page.locator('.lobby').evaluate(n=>[n.getBoundingClientRect().toJSON(),...['.hero','.setup-card','.hero-card-fan','#start-run'].map(s=>n.querySelector(s).getBoundingClientRect().toJSON())]);
 await page.screenshot({path:out+'/lobby.png'});await page.getByRole('button',{name:'설정',exact:true}).click();await expect(page.getByRole('slider',{name:'배경음악 음량'})).toHaveValue('100');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'수동 저장 불러오기',exact:true}).click();await page.keyboard.press('Escape');
 assert.deepEqual(await page.locator('.lobby').evaluate(n=>[n.getBoundingClientRect().toJSON(),...['.hero','.setup-card','.hero-card-fan','#start-run'].map(s=>n.querySelector(s).getBoundingClientRect().toJSON())]),lobbyRects);
 await page.waitForFunction(async()=>{const{audio}=await import('/src/services/audio.js');return audio.bgmStatus==='PLAYING';});
 const lobbyMusic=await page.evaluate(async()=>{const{audio}=await import('/src/services/audio.js');return audio.bgmSnapshot();});
 await page.locator('#start-run').click();await page.locator('#start-battle').waitFor();await page.locator('.scene-backdrop[data-ready=true]').waitFor();await page.screenshot({path:out+'/entry-01.png'});
 pass(2,{lobbyRects,gestureUnlock:lobbyMusic});
 await page.evaluate(async()=>{
  const f=await import('/tests/helpers/waterways-state.js'),{RunController}=await import('/src/game/runController.js'),{newProfile,LocalStore}=await import('/src/services/localStore.js'),{getEncounter}=await import('/src/data/stages.js'),{renderCombat}=await import('/src/ui/combat.js'),{renderIntro}=await import('/src/ui/progression.js'),{renderShop}=await import('/src/ui/shop.js'),presentation=await import('/src/engine/presentation.js'),{audio}=await import('/src/services/audio.js'),music=await import('/src/services/musicContext.js'),{bossReward}=await import('/tests/helpers/shop-flow-state.js');
  window.q={f,RunController,newProfile,LocalStore,getEncounter,renderIntro,renderShop,presentation,audio,music,bossReward,root:document.querySelector('#app'),reset(){this.view?.cleanup();this.c=new RunController({profile:{...newProfile('Scene QA'),guidedTutorialCompletedVersion:'0.2.1'}});f.checked(this.c,{type:'NEW_RUN',config:{seed:'scene.assets.qa'}});f.checked(this.c,{type:'START_BATTLE'});},show(locked=false,state=this.c.getState()){this.view?.cleanup();this.view=renderCombat(this.root,state,{locked,command:cmd=>this.command(cmd),openOverlay:()=>{}});this.audio.setBgmAsset(this.music.resolveMusicContext('#game',state),this.music.musicManifest);},rects(){return Object.fromEntries(['.game-header','.enemy-area','.monster-slot','.enemy-info','.combat-middle','.score-stage','.combat-sentence','.combat-actions','.hand-section'].map(s=>{const r=this.root.querySelector(s).getBoundingClientRect();return[s,[r.x,r.y,r.width,r.height]];}));},gap(){const v=visualViewport,bottom=v.offsetTop+v.height,cards=[...this.root.querySelectorAll('.hand-cards>.word-card:not([hidden])')];return bottom-Math.max(...(cards.length?cards:[this.root.querySelector('.hand-page-row')]).map(n=>n.getBoundingClientRect().bottom));},async command(cmd){const before=this.c.getState(),r=this.f.checked(this.c,cmd);if(r.resolution){this.resolution=r.resolution;this.show(true,before);this.view.beginPresentation();this.samples=[];this.poses=[];this.presenting=true;const adapter=this.presentation.createDOMPresentation(this.view.element,{audio:this.audio}),impact=adapter.impact;adapter.impact=data=>{this.poses.push({phase:'before',pose:this.root.querySelector('.enemy-avatar').dataset.monsterPose});impact(data);this.poses.push({phase:'impact',pose:this.root.querySelector('.enemy-avatar').dataset.monsterPose,damage:data.actualHpLoss,killed:data.killed});};const timer=setInterval(()=>this.samples.push(this.rects()),16);await this.presentation.playAttack(r.resolution,adapter,{speed:2});clearInterval(timer);this.finalPose=this.root.querySelector('.enemy-avatar').dataset.monsterPose;this.f.checked(this.c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});this.presenting=false;}this.show();return r;}};
  q.reset();q.show();
 });
 // Explicit monster identity, both actual files decoded; no seven-battle completion claim.
 const geometry=[];
 if(!process.env.SB_ASSETS_FOCUS){
 const mappings=[];
 for(let n=1;n<=7;n++){
  const data=await page.evaluate(n=>{const s=q.c.getState(),stage=n<=3?'stage.01':'stage.02',round=n<=3?n-1:n-4;s.progress={stageId:stage,roundIndex:round,battleNumber:n};s.combat.enemyState=q.getEncounter(stage,round,s.version);s.combat.enemyState.maxHp=s.combat.enemyState.hpMax;q.show(false,s);return{id:s.combat.enemyState.enemyId,name:q.root.querySelector('.enemy-avatar').getAttribute('aria-label'),rects:q.rects()};},n);
  await page.waitForFunction(()=>document.querySelectorAll('.monster-image[data-ready=true]').length===2&&document.querySelector('.scene-backdrop[data-ready=true]'));
  compare(data.rects,await page.evaluate(()=>q.rects()));mappings.push({...data,files:await page.locator('.monster-image').evaluateAll(nodes=>nodes.map(n=>({src:n.getAttribute('src'),width:n.naturalWidth,height:n.naturalHeight})))});
  if(n===1||n===7)await page.screenshot({path:out+`/combat-${n<=3?'01':'02'}.png`});
 }
 pass(3,{mappings});
 for(const [w,h]of [[1366,768],[1920,1080],[1180,820]]){
  await page.setViewportSize({width:w,height:h});await page.evaluate(()=>{q.reset();q.f.assignSentence(q.c,'I read books '.repeat(8));q.show();});if(w===1920)await page.locator('.fullscreen-toggle').click();
  let base;const widths={};for(const count of [0,5,6,9,10,11,12,13,24])for(const hand of w===1366?[10,1,0]:[10,0]){
   const data=await page.evaluate(({count,hand})=>{const ids=q.c.getState().activeCardIds;q.f.assignPiles(q.c,{sentence:ids.slice(0,count).map(cardInstanceId=>({cardInstanceId})),hand:ids.slice(count,count+hand)});q.show();return {rects:q.rects(),gap:q.gap(),width:q.root.querySelector('.combat-sentence .word-card')?.getBoundingClientRect().width};},{count,hand});
   if(base)compare(base,data.rects);else base=data.rects;assert.ok(data.gap>=8&&data.gap<=10,`gap ${data.gap} @ ${w}`);if(data.width)widths[count]=data.width;geometry.push({w,h,count,hand,gap:data.gap});
  }
  assert.ok(widths[5]>widths[6]&&widths[9]>widths[10]&&widths[11]>widths[12]);assert.equal(widths[12],widths[24]);await expect(page.locator('#attack-submit')).toBeInViewport({ratio:1});
  if(w===1180)await page.screenshot({path:out+'/tablet-bottom.png'});if(w===1920)await page.locator('.fullscreen-toggle').click();
 }
 pass(4,{geometry});
 }
 await page.setViewportSize({width:1366,height:768});const attacks=[];
 for(const [sentence,polish,expected]of (process.env.SB_ASSETS_FOCUS==='music'?[]:[['I run.',0,'survive'],['I read books.',3,'kill'],['books.',0,'zero']])){
  await page.evaluate(({sentence,polish,expected})=>{q.reset();if(expected==='survive'){const next=q.c.getState();next.progress.roundIndex=1;next.progress.battleNumber=2;next.combat=null;q.c._beginBattle(next);q.c._state=next;}const ids=q.f.assignSentence(q.c,sentence),s=q.c.getState();for(const id of ids)s.cardInstances[id].polishLevel=polish;q.c._state=s;q.show();},{sentence,polish,expected});await page.waitForFunction(()=>document.querySelectorAll('.monster-image[data-ready=true]').length===2);
  const before=await page.evaluate(()=>q.rects());await page.locator('#attack-submit').click();await page.waitForFunction(()=>q.presenting===false,null,{timeout:30000});const result=await page.evaluate(()=>({samples:q.samples,poses:q.poses,finalPose:q.finalPose,damage:q.resolution.actualHpLoss,killed:q.resolution.killed,attacks:q.c.getState().stats.attacks}));
  for(const r of result.samples)compare(before,r);assert.equal(result.attacks,1);assert.equal(result.poses[0].pose,'idle');if(expected==='zero'){assert.equal(result.damage,0);assert.equal(result.poses[1].pose,'idle');}else{assert.ok(result.damage>0);assert.equal(result.killed,expected==='kill');assert.equal(result.poses[1].pose,expected==='kill'?'dead':'hit');}attacks.push({expected,...result,samples:result.samples.length});
 }
 if(attacks.length){pass(5,{attacks});pass(6,{surviveKillZero:true,cleanup:true});}
 // Directly loaded assigned boss reward exercises the unchanged controller's shop and entry transitions.
 const musicFlow=await page.evaluate(async()=>{
  q.view?.cleanup();q.c=q.bossReward(1);let s=q.c.getState();s.config.shopFlowPolicy='BOSS_REWARD_FIRST_V1';q.c._state=s;q.show();
  const wait=async id=>{for(let n=0;n<100;n++){const snap=q.audio.bgmSnapshot();if(snap.sources.some(x=>x.assetId===id)&&snap.sources.length===1)return snap;await new Promise(r=>setTimeout(r,40));}throw Error('BGM wait '+id);};
  const reward=await wait('stage.01');q.f.checked(q.c,{type:'SKIP_REWARD',offerId:s.reward.offerId});s=q.c.getState();q.view.cleanup();q.renderShop(q.root,s,{command:()=>{}});q.audio.setBgmAsset(q.music.resolveMusicContext('#game',s),q.music.musicManifest);
  const shop=q.audio.bgmSnapshot(),store=new q.LocalStore({registry:(await import('/src/data/language/index.js')).registry});await store.init();await store.saveProfile(q.c.getProfile());await store.saveRun(q.c.getProfile().playerId,1,s);const saved=await store.loadRun(q.c.getProfile().playerId,1);q.c=new q.RunController({profile:q.c.getProfile()});q.f.checked(q.c,{type:'RESUME_RUN',state:saved});q.audio.setBgmAsset(q.music.resolveMusicContext('#game',q.c.getState()),q.music.musicManifest);
  const loaded=q.audio.bgmSnapshot();q.f.checked(q.c,{type:'LEAVE_SHOP',shopId:s.shop.shopId});s=q.c.getState();q.renderIntro(q.root,s,{onStart:()=>{}});q.audio.setBgmAsset(q.music.resolveMusicContext('#game',s),q.music.musicManifest);const entry=await wait('stage.02');return {reward,shop,loaded,entry};
 });
 assert.equal(musicFlow.reward.sources[0].startedAt,musicFlow.shop.sources[0].startedAt);assert.equal(musicFlow.loaded.sources[0].startedAt,musicFlow.shop.sources[0].startedAt);assert.equal(musicFlow.entry.requested,'stage.02');await page.locator('.scene-backdrop[data-ready=true]').waitFor();await page.screenshot({path:out+'/entry-02.png'});pass(7,musicFlow);
 const sound=await page.evaluate(async()=>{const before=q.audio.bgmSnapshot();q.audio.configure({muted:true});const muted=q.audio.bgmSnapshot();q.audio.stopAll();q.audio.configure({muted:false,bgmVolume:1});q.audio.setBgmAsset('stage.02',q.music.musicManifest);const after=q.audio.bgmSnapshot();q.audio.setBgmAsset('lobby',q.music.musicManifest);q.audio.setBgmAsset('stage.01',q.music.musicManifest);q.audio.setBgmAsset('stage.02',q.music.musicManifest);await new Promise(r=>setTimeout(r,100));return{before,muted,after,rapid:q.audio.bgmSnapshot()};});assert.equal(sound.muted.gain,0);assert.equal(sound.after.gain,Math.fround(.8));assert.equal(sound.before.sources[0].startedAt,sound.after.sources[0].startedAt);assert.ok(sound.rapid.sources.length<=2);pass(8,sound);
 await page.route('**/monsters/*_idle.png',r=>r.abort());await page.route('**/monsters/*_hit.png',r=>r.abort());await page.evaluate(()=>{q.reset();q.show();});await expect(page.locator('.monster-fallback')).toBeVisible();await expect(page.locator('#clear-sentence')).toBeVisible();
 const fallback=await page.evaluate(async()=>{q.audio.setBgmAsset('stage.03',q.music.musicManifest);await new Promise(r=>setTimeout(r,1700));return q.audio.bgmSnapshot();});assert.equal(fallback.sources.length,0);pass(9,{fallback,saveReload:'actual IndexedDB above',physicalDevices:'NOT RUN',listening:'NOT RUN'});
 assert.deepEqual(report.errors,[]);report.status='PASS';console.log(JSON.stringify({status:report.status,checks:report.checks.map(x=>x.id),gaps:[...new Set(geometry.map(x=>x.gap))]}));
}catch(e){report.status='FAIL';report.failure=e.stack;throw e;}finally{await fs.writeFile(out+'/result.json',JSON.stringify(report,null,2));await browser?.close();server.kill();}
