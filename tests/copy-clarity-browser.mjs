/** Narrow UI checks with isolated profiles and assigned controller state, not natural campaign QA. */
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {mountCombatQA} from './helpers/combat-ui-browser.js';
const base=process.env.SB_BASE_URL||'http://127.0.0.1:5173/',out=process.env.SB_COPY_OUT||'.local-validation/v0142/ui';
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch();let context,page;
const report={scope:'isolated Chromium UI and assigned states; physical device NOT RUN',checks:[],errors:[]};
async function boot(width=1280,height=720,mobile=false){await context?.close();context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile});page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(base+'#lobby');await page.locator('#start-run').waitFor();}
const close=()=>page.locator('dialog[open] .dialog-header button').click();
const shot=name=>page.screenshot({path:out+'/'+name+'.png'});
async function check(name,fn){try{const evidence=await fn();report.checks.push({name,status:'PASS',evidence});console.log('PASS',name);}catch(e){report.checks.push({name,status:'FAIL',error:e.stack});console.error('FAIL',name,e.message);}}
async function mount(){await page.evaluate(mountCombatQA);await page.evaluate(async()=>{const {renderCombat}=await import('/src/ui/combat.js'),{openRecentAttack,openDeck}=await import('/src/ui/overlays.js');q.selection=new Set();q.show=function(locked=false,s=this.c.getState()){this.view=renderCombat(this.root,s,{previous:this.view,selected:this.selection,locked,command:c=>this.command(c),openOverlay:id=>{this.overlay=id;if(id==='recent')openRecentAttack(this.c.getState());if(['draw','discard'].includes(id))openDeck(this.c.getState(),id);}});};q.show();});}
try{
 await check('T1-lobby-profile',async()=>{
  await boot();await expect(page.locator('#player-name')).toBeEditable();await page.locator('#player-name').fill('새 여행자');await page.locator('#start-run').click();await page.locator('#start-battle').waitFor();
  await page.evaluate(async()=>{const {LocalStore,newProfile}=await import('/src/services/localStore.js');const s=new LocalStore();await s.init();const all=await s.listProfiles();if(all.length!==1||all[0].displayName!=='새 여행자')throw Error('new profile missing');for(const [id,name]of [['qa.A','여행자 A'],['qa.B','여행자 B'],['qa.same','여행자 A'],['qa.empty','']]){const p=newProfile(name);p.playerId=id;p.displayName=name;p.guidedTutorialCompletedVersion='0.2.1';await s.saveProfile(p);}});
  await page.goto(base+'#lobby');await page.reload();await page.locator('#start-run').waitFor();
  for(const [id,name]of [['qa.A','여행자 A'],['qa.B','여행자 B'],['qa.same','여행자 A']]){await page.getByLabel('로컬 프로필 선택').selectOption(id);await expect(page.locator('#player-name')).toHaveValue(name);await expect(page.locator('#player-name')).not.toBeEditable();}
  await page.getByRole('button',{name:'새 프로필',exact:true}).click();await page.locator('#player-name').fill('버려질 임시 이름');await page.getByLabel('로컬 프로필 선택').selectOption('qa.B');
  await expect(page.locator('#vocabulary-mode option')).toHaveText(['초급','중급','고급','자유']);await page.locator('#vocabulary-mode').selectOption('ADVANCED');
  await expect(page.locator('.region-name-list>span')).toHaveCount(10);await expect(page.locator('.lobby')).not.toContainText('FIFTY BATTLES');await expect(page.locator('.hero-description')).toHaveText('영단어 문장 조합 덱빌딩');await shot('lobby');
  // Even a stale hidden DOM value must not rename an existing profile on start.
  await page.locator('#player-name').evaluate(n=>n.value='덮어쓰기 금지');await page.locator('#start-run').click();await page.locator('#start-battle').waitFor();
  const saved=await page.evaluate(async()=>{const {LocalStore}=await import('/src/services/localStore.js');const s=new LocalStore();await s.init();return(await s.listProfiles()).find(p=>p.playerId==='qa.B');});assert.equal(saved.displayName,'여행자 B');assert.equal(saved.settings.vocabularyMode,'ADVANCED');
  await page.goto(base+'#lobby');await page.getByLabel('로컬 프로필 선택').selectOption('qa.empty');await expect(page.locator('#player-name')).toBeEditable();await page.locator('#player-name').fill('복구 이름');await page.locator('#start-run').click();await page.locator('#start-battle').waitFor();
  const repaired=await page.evaluate(async()=>{const {LocalStore}=await import('/src/services/localStore.js');const s=new LocalStore();await s.init();return(await s.listProfiles()).find(p=>p.playerId==='qa.empty');});assert.equal(repaired.displayName,'복구 이름');return{existingName:saved.displayName,mode:saved.settings.vocabularyMode,missingNameSameId:repaired.playerId};
 });
 await check('T2-preparation-information',async()=>{
  await boot();await mount();const rows=[];
  for(const [stageId,index,title]of [['stage.01',2,'1·2·3형식'],['stage.10',0,'현재분사 분사구문'],['stage.final',2,'유니버셜 그래머']]){
   const before=await page.evaluate(async({stageId,index})=>{q.prepCleanup?.();q.view?.cleanup();const {renderBetween}=await import('/src/ui/progression.js');const s=q.c.getState();s.progress={...s.progress,stageId,roundIndex:index-1};q.preview=s;q.previewBefore=JSON.stringify(s);q.prepCleanup=renderBetween(q.root,s,{onNext:()=>q.nextClicked=true,onSaves:()=>q.saveClicked=true});return q.previewBefore;},{stageId,index});
   await expect(page.locator('.preparation-guide')).toContainText('목표 문법: '+title);await expect(page.locator('.preparation-guide')).toContainText('지역 점수 보너스: '+(stageId==='stage.final'?'없음':stageId==='stage.10'?'현재분사 분사구문 ×1.25':'1·2·3형식 ×1.25'));await expect(page.locator('.preparation-topbar')).not.toContainText('/ 50');
   if(stageId==='stage.01'){await expect(page.locator('.preparation-boss-badge')).toHaveText('BOSS');await expect(page.locator('.preparation-guide')).not.toContainText('뜻:');await expect(page.locator('.preparation-guide')).not.toContainText('명령문');await expect(page.locator('.monster-preview-image')).toBeVisible();await shot('preparation');}
   await page.getByRole('button',{name:'저장',exact:true}).last().click();await page.locator('#next-battle').click();assert.equal(await page.evaluate(()=>JSON.stringify(q.preview)),before);rows.push({stageId,title,commands:await page.evaluate(()=>[q.saveClicked,q.nextClicked])});
  }return rows;
 });
 await check('T3-hand-actions',async()=>{
  await boot(1024,768);await mount();await page.evaluate(()=>{const s=q.c.getState();s.combat.handIds.push(...s.combat.drawIds.splice(0,s.combat.rulesSnapshot.handLimit-s.combat.handIds.length));q.c._state=s;q.show();});
  await expect(page.locator('#discard-selected')).toHaveText('버리기 (0) 4/4');await expect(page.locator('#clear-card-selection')).toHaveCount(0);
  const select=()=>page.locator('.hand-cards .word-card:not([hidden]) .card-select').first();await select().click();await select().click();await expect(page.locator('#discard-selected')).toHaveText('버리기 (0) 4/4');await select().click();await page.getByRole('button',{name:'다음 손패 페이지'}).click();await select().click();await expect(page.locator('#discard-selected')).toHaveText('버리기 (2) 4/4');await page.keyboard.press('Escape');await expect(page.locator('#discard-selected')).toHaveText('버리기 (0) 4/4');
  await select().click();await page.locator('#discard-selected').click();await expect(page.locator('#discard-selected')).toHaveText('버리기 (0) 3/4');await page.locator('.prepare-button').click();await expect(page.locator('.turn-count')).toContainText('5');
  await expect(page.locator('.hand-title')).toHaveText('나의 손패 10/10');for(const pile of await page.locator('.pile-button').all())assert.match(await pile.locator('strong').innerText(),/^\d+$/);await page.getByRole('button',{name:'기록',exact:true}).click();await expect(page.locator('dialog[open]')).toBeVisible();await close();await page.getByRole('button',{name:'저장',exact:true}).first().click();assert.equal(await page.evaluate(()=>q.overlay),'saves');
  await page.evaluate(()=>{const s=q.c.getState();s.combat.rulesSnapshot.discardActions=5;s.combat.exchangesRemaining=2;q.c._state=s;q.show();});await expect(page.locator('#discard-selected')).toHaveText('버리기 (0) 2/5');return{crossPageSelection:true,toggleAndEscape:true,exchange:[4,3],turns:5,nonDefaultLimit:'2/5'};
 });
 await check('T4-runes-layout',async()=>{
  const rows=[];for(const [w,h,mobile]of [[1280,720,false],[1024,768,false],[844,390,true],[844,310,true]]){
   await boot(w,h,mobile);await mount();await expect(page.locator('.enemy-label')).toHaveText('Leaf Slime');await expect(page.locator('.battle-target-guide')).toContainText('지역 점수 보너스');await expect(page.locator('.mobile-resources')).toBeVisible({visible:mobile});
   const before=await page.evaluate(()=>q.c.getState());const help=page.getByRole('button',{name:'룬 도움말',exact:true});await help.focus();await page.keyboard.press('Enter');await expect(page.locator('dialog[open]')).toContainText('발동 조건');await expect(page.locator('dialog[open]')).toContainText('위에서 아래');await close();assert.deepEqual(await page.evaluate(()=>q.c.getState()),before);
   for(const s of ['#attack-submit','.prepare-button','#discard-selected']){const r=await page.locator(s).boundingBox();assert.ok(r.width>0&&r.height>0&&r.x>=0&&r.x+r.width<=w+1&&r.y>=0&&r.y+r.height<=h+1,s);}
   const title=page.locator(mobile?'.pager-hand-title':'.hand-title');await expect(title).toHaveText(`나의 손패 ${before.combat.handIds.length}/${before.combat.rulesSnapshot.handLimit}`);if(w===844&&h===390)await shot('mobile');rows.push({w,h,mobile});
  }return rows;
 });
}finally{await context?.close();await browser.close();await fs.writeFile(out+'/result.json',JSON.stringify(report,null,2));}
if(report.errors.length||report.checks.some(x=>x.status==='FAIL'))process.exitCode=1;
