import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {mountCombatQA} from './helpers/combat-ui-browser.js';

// Assigned UI states, real controller inputs. This is not a natural campaign run.
const base = process.env.SB_BASE_URL || 'http://127.0.0.1:5174/';
const phase = process.env.SB_PC_PHASE || 'after';
const out = process.env.SB_PC_OUT || `.local-validation/pc-polish/${phase}`;
await fs.mkdir(out, {recursive:true});
const report = {phase, checks:[], captures:[], errors:[]};
const baseline = phase === 'after' ? await fs.readFile('.local-validation/pc-polish/before/results.json','utf8').then(JSON.parse).catch(()=>null) : null;
const browser = await chromium.launch();
let context, page;
async function boot(width, height, touch=false) {
  await context?.close();
  context = await browser.newContext({viewport:{width,height}, hasTouch:touch, isMobile:touch});
  page = await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  await page.goto(base+'?debug=1#lobby');
  await page.locator('#start-run').waitFor();
  await page.evaluate(mountCombatQA);
  // Retain the real stage view across edits, as the app does.
  await page.evaluate(async () => {
    const {renderCombat} = await import('/src/ui/combat.js');
    q.show = function(locked=false, state=this.c.getState()) {
      this.view = renderCombat(this.root, state, {previous:this.view, locked, command:c=>this.command(c)});
    };
    const s = q.c.getState();
    s.runes.orderedInstanceIds = ['qa.sv','qa.svc'];
    s.runes.instances = {'qa.sv':{instanceId:'qa.sv',runeId:'rune.sv',level:1},'qa.svc':{instanceId:'qa.svc',runeId:'rune.svc',level:2}};
    q.c._state = s; q.show();
    for (const id of s.combat.handIds.slice(0,2)) q.command({type:'ADD_CARD',cardId:id});
  });
  await page.waitForFunction(() => document.querySelector('.enemy-avatar')?.classList.contains('has-monster-art'));
  await page.waitForTimeout(150);
}
async function capture(name) {
  await page.screenshot({path:`${out}/${name}.png`}); report.captures.push(name+'.png');
}
async function measure() {
  return page.evaluate(() => {
    const rect = n => {const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right};};
    const selectors=['.game-header','.enemy-area','.monster-slot','.enemy-tactics','.enemy-info','.combat-middle','.status-panel','.sentence-area','.rune-panel','.score-stage','.combat-sentence','.combat-actions','.hand-section','.hand-page-row','.hand-cards','.pile-button','.pile-discard'];
    return {viewport:[innerWidth,innerHeight],handheld:document.documentElement.dataset.handheld,
      boxes:Object.fromEntries(selectors.map(s=>[s,rect(document.querySelector(s))])),
      hand:q.bounds(),cards:[...document.querySelectorAll('.hand-cards>.word-card:not([hidden])')].map(n=>({...rect(n),font:getComputedStyle(n.querySelector('.card-word')).fontSize,color:getComputedStyle(n).getPropertyValue('--pos')})),
      board:[...document.querySelectorAll('.combat-sentence .word-card')].map(rect),
      monster:document.querySelector('.monster-art-motion')?.getAttribute('style'),
      overflow:document.documentElement.scrollWidth>innerWidth,
      columns:document.querySelector('.combat-sentence').dataset.mobileColumns||document.querySelector('.combat-sentence').dataset.columns};
  });
}
async function check(name, fn) {
  try {report.checks.push({name,status:'PASS',evidence:await fn()}); console.log('PASS',name);}
  catch(e) {report.checks.push({name,status:'FAIL',error:e.stack}); console.error('FAIL',name,e.message);}
}
const settle = () => page.evaluate(() => new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const state = () => page.evaluate(() => q.c.getState());
async function assignCount(count, handCount=14) {
  await page.evaluate(([count,handCount]) => {
    const s=q.c.getState(),ids=s.activeCardIds;
    s.combat.rulesSnapshot.handLimit=14;
    s.combat.sentenceSlots=ids.slice(0,count).map(cardInstanceId=>({cardInstanceId,selection:null}));
    s.combat.handIds=ids.slice(count,count+handCount);
    s.combat.drawIds=ids.slice(count+handCount);
    s.combat.discardIds=[];
    q.c._state=s;q.show();
  },[count,handCount]);
  await settle();
}
async function stableLayouts(w,h) {
  // The mobile board intentionally reserves an internal rail for rows 17–24.
  // Compare outer regions, and check that rail/last-row access separately below.
  const outerRects=()=>page.evaluate(mobile=>Object.fromEntries(Object.entries(q.rects()).filter(([k])=>!mobile||k!=='.combat-sentence')),w<1000);
  const result=[],outer=await outerRects();
  for(const count of [0,2,12,13,24]) {
    await assignCount(count);
    const m=await measure();
    assert.deepEqual(await outerRects(),outer,'card count must not move the outer regions');
    if(w>=1000) {
      const rows=await page.locator('.sentence-row').evaluateAll(ns=>ns.map(n=>{
        const r=n.getBoundingClientRect(),cards=[...n.querySelectorAll('.word-card')].map(c=>c.getBoundingClientRect());
        return {count:cards.length,center:(cards[0].left+cards.at(-1).right)/2,boxCenter:(r.left+r.right)/2};
      }));
      assert.deepEqual(rows.map(r=>r.count),count>12?[12,count-12]:count?[count]:[]);
      for(const r of rows)assert.ok(Math.abs(r.center-r.boxCenter)<1,'independent row centering');
      for(const r of m.board)assert.ok(r.y>=m.boxes['.combat-sentence'].y-1&&r.bottom<=m.boxes['.combat-sentence'].bottom+1);
    } else if(count===24) {
      await page.getByRole('button',{name:'문장 뒷부분 보기',exact:true}).click();
      const last=await page.locator('.combat-sentence .form-button').last().boundingBox();
      assert.ok(last.y+last.height<=m.boxes['.combat-sentence'].bottom+1);
    }
    result.push({count,hand:m.cards.length,rows:w>=1000?Math.ceil(count/12):Math.ceil(count/8)});
    if(w===1280&&count===24)await capture('board-24-1280x720');
  }
  await assignCount(24,0);
  assert.deepEqual(await outerRects(),outer,'empty hand must reserve its region');
  return result;
}
try {
  for (const [w,h,touch] of [[1920,1080,false],[1440,900,false],[1280,720,false],[1024,768,true],[844,390,true]]) {
    await check(`layout-${w}x${h}`, async () => {
      await boot(w,h,touch);
      const result=await measure();
      assert.equal(result.overflow,false);
      assert.equal(result.columns,w===844?'8':'12');
      for(const key of ['.combat-actions','.hand-section','.status-panel','.rune-panel']) {
        const r=result.boxes[key];
        if(w===844&&key==='.status-panel')continue;
        assert.ok(r.x>=0 && r.right<=w+1 && r.y>=0 && r.bottom<=h+1,key+JSON.stringify(r));
      }
      assert.ok(result.hand.every(c=>c.gap>=8),JSON.stringify(result.hand));
      await capture(`battle-${w}x${h}`);
      const old=baseline?.checks.find(c=>c.name===`layout-${w}x${h}`)?.evidence;
      if(old) {
        assert.deepEqual(result.cards.map(c=>[c.w,c.h,c.font,c.color]),old.cards.map(c=>[c.w,c.h,c.font,c.color]),'hand appearance');
        assert.equal(result.monster,old.monster,'original monster fit and ground');
        if(touch)assert.deepEqual(result,old,'portable geometry must remain unchanged');
      }
      if(phase==='after')result.counts=await stableLayouts(w,h);
      return result;
    });
  }
  if(phase==='after') {
    await check('hand-page-selection-return-and-runes',async()=>{
      await boot(1280,720);await assignCount(2,14);
      const original=await state();
      const first=await page.locator('.hand-cards>.word-card:not([hidden])').first().getAttribute('data-card-id');
      await page.locator('.hand-cards>.word-card:not([hidden]) .card-select').first().click();
      await expect(page.locator('#discard-selected')).toContainText('버리기 (1)');
      await page.getByRole('button',{name:'다음 손패 페이지',exact:true}).click();
      await page.getByRole('button',{name:'이전 손패 페이지',exact:true}).click();
      await expect(page.locator(`[data-card-id="${first}"]`)).toHaveClass(/selected/);
      assert.ok((await page.evaluate(()=>q.bounds())).every(c=>c.gap>=8));
      await page.locator('.hand-cards>.word-card:not([hidden]) .card-select').first().click();
      await page.locator('.hand-cards>.word-card:not([hidden]) .card-body').first().click();
      await page.locator('#clear-sentence').click();
      const after=await state();
      assert.equal(after.combat.handIds.length,14);
      assert.deepEqual(after.activeCardIds,original.activeCardIds);
      await page.getByRole('button',{name:'루비 룬 아래로',exact:true}).click();
      assert.deepEqual((await state()).runes.orderedInstanceIds,['qa.svc','qa.sv']);
      return {hand:14,pages:true,selection:true,returnWithinLimit:true,runeOrder:true};
    });
    await check('normal-attack-retained-view-and-score',async()=>{
      await boot(1440,900);
      await page.evaluate(()=>{q.f.assignSentence(q.c,'I go');q.show();q.stage=q.root.querySelector('.enemy-area');q.monster=q.root.querySelector('.monster-art-motion');});
      const before=await state(),outer=await page.evaluate(()=>q.rects());
      await page.locator('#attack-submit').click();
      await page.waitForFunction(()=>q.presenting===true);
      await page.waitForFunction(()=>document.querySelector('.core-attack-body')?.children.length>0);
      const fx=await page.locator('.core-attack-body').boundingBox();
      assert.ok(fx.width>0&&fx.height>0);
      await page.waitForFunction(()=>q.presenting===false,{},{timeout:20000});
      const after=await state();
      assert.equal(after.combat.turnsRemaining,before.combat.turnsRemaining-1);
      assert.ok(after.combat.enemyState.hp<before.combat.enemyState.hp);
      assert.equal(await page.evaluate(()=>q.stage===q.root.querySelector('.enemy-area')&&q.monster===q.root.querySelector('.monster-art-motion')),true);
      assert.ok(await page.evaluate(outer=>q.samples.every(s=>JSON.stringify(s.rects)===JSON.stringify(outer)),outer));
      assert.ok(await page.evaluate(()=>q.samples.every(s=>s.logRows===0)));
      return {attackId:await page.evaluate(()=>q.resolution.attackId),hpBefore:before.combat.enemyState.hp,hpAfter:after.combat.enemyState.hp,turns:after.combat.turnsRemaining,copiesVisible:true,retained:true};
    });
    await check('boss-safe-body-and-four-runes',async()=>{
      await boot(1280,720);
      const rows=[];
      for(const [stageId,roundIndex,battleNumber] of [['stage.01',2,3],['stage.02',3,7]]) {
        await page.evaluate(([stageId,roundIndex,battleNumber])=>{
          q.reset();const s=q.c.getState();s.progress={...s.progress,stageId,roundIndex,battleNumber};
          s.runes.slotLimit=4;s.runes.orderedInstanceIds=['r1','r2','r3','r4'];s.runes.instances=Object.fromEntries(['rune.sv','rune.svc','rune.svo','rune.svoo'].map((runeId,i)=>['r'+(i+1),{instanceId:'r'+(i+1),runeId,level:3}]));
          q.c._beginBattle(s);q.c._state=s;q.show();
        },[stageId,roundIndex,battleNumber]);
        await page.waitForFunction(()=>!!document.querySelector('.monster-image[data-ready=true]'));
        await settle();
        const geometry=await page.evaluate(async()=>{
          const {monsterViewFor}=await import('/src/ui/monsterArt.js'),r=monsterViewFor(document.querySelector('.enemy-avatar')).visibleRect();
          const box=s=>{const x=document.querySelector(s).getBoundingClientRect();return {left:x.left,right:x.right,top:x.top,bottom:x.bottom};};
          return {body:r,stage:box('.enemy-area'),left:box('.enemy-tactics'),right:box('.enemy-info')};
        });
        assert.ok(geometry.body.left>=geometry.left.right&&geometry.body.left+geometry.body.width<=geometry.right.left);
        assert.ok(geometry.body.top>=geometry.stage.top&&geometry.body.top+geometry.body.height<=geometry.stage.bottom);
        assert.ok(geometry.left.top>=geometry.stage.top&&geometry.right.top>=geometry.stage.top);
        await page.locator('.rune-info').last().click();await expect(page.locator('dialog[open]')).toBeVisible();
        await page.locator('dialog[open] .dialog-header button').click();
        rows.push({stageId,...geometry});
      }
      await capture('boss-1280x720');return rows;
    });
  }
} finally {
  await browser.close();
  await fs.writeFile(`${out}/results.json`,JSON.stringify(report,null,2));
}
process.exitCode=report.checks.some(c=>c.status==='FAIL')||report.errors.length?1:0;
