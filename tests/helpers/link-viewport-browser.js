import assert from 'node:assert/strict';
import {expect} from '@playwright/test';

const settle = page => page.evaluate(() => new Promise(done =>
  requestAnimationFrame(() => requestAnimationFrame(done))));

// Model the area obscured by browser chrome, independently of the layout viewport.
// These getters live only in the isolated test document.
export async function visibleArea(page, height, {top=0,left=0,width}={}) {
  await page.evaluate(box => {
    window.viewportDescriptors ??= Object.fromEntries(Object.keys(box).map(key =>
      [key,Object.getOwnPropertyDescriptor(visualViewport,key)]));
    for (const [key,value] of Object.entries(box)) {
      Object.defineProperty(visualViewport,key,{configurable:true,get:() => value});
    }
    visualViewport.dispatchEvent(new Event('resize'));
    visualViewport.dispatchEvent(new Event('scroll'));
  }, {height, width:width ?? page.viewportSize().width,offsetTop:top,offsetLeft:left});
  await settle(page);
}

export async function withVisibleArea(page, check) {
  try {return await check();}
  finally {
    await page.evaluate(() => {
      for (const [key,previous] of Object.entries(window.viewportDescriptors ?? {})) {
        if (previous) Object.defineProperty(visualViewport,key,previous);
        else delete visualViewport[key];
      }
      delete window.viewportDescriptors;
      for (const side of ['top','bottom','left','right']) document.documentElement.style.removeProperty('--safe-'+side);
      visualViewport.dispatchEvent(new Event('resize'));
    });
    await settle(page);
  }
}

async function inside(locator, bounds) {
  const rect = await locator.boundingBox();
  assert.ok(rect && rect.height > 0 && rect.width > 0, 'visible control');
  assert.ok(rect.y >= bounds.top - 1 && rect.y + rect.height <= bounds.bottom + 1 &&
    rect.x >= bounds.left - 1 && rect.x + rect.width <= bounds.right + 1,
    JSON.stringify({control:await locator.evaluate(n => n.id || n.className),rect,bounds}));
}

export async function checkVisibleBattle(page, capture) {
  const rows = [];
  for (const [width,height,loss,phone] of [[844,390,80,true],[915,412,100,true],[1024,768,90,false],
    [1194,834,100,false],[1280,720,0,false],[1920,1080,0,false]]) {
    await page.setViewportSize({width,height});
    await visibleArea(page,height);
    await page.evaluate(() => q.cards(9));
    const original = await page.evaluate(() => q.c.getState());
    await page.evaluate(() => {window.stageNode = document.querySelector('.enemy-area');});
    const stage = () => page.locator('.enemy-area').boundingBox();
    const before = await stage();
    await visibleArea(page,height-loss);
    assert.equal(await page.locator('html').getAttribute('data-handheld'),String(phone));
    const bounds = {left:0,right:width,top:0,bottom:height-loss};
    for (const selector of ['.hand-page-row','#attack-submit','#clear-sentence','.prepare-button','#discard-selected']) {
      await inside(page.locator(selector),bounds);
    }
    const smaller = await stage();
    if (loss) assert.ok(smaller.height > 0 && smaller.height < before.height);
    if (width === 844) {
      await capture('visible-phone-310',{x:0,y:0,width,height:height-loss});
      for (const count of [1,7,8,9,16,24]) {
        const ids = await page.evaluate(n => q.cards(n),count);
        await settle(page);
        const board = page.locator('.combat-sentence');
        assert.deepEqual(await board.locator('.word-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId)),ids);
        const down = page.getByRole('button',{name:'문장 뒷부분 보기'});
        while (await down.isVisible() && await down.isEnabled()) {
          const y = await board.evaluate(n=>n.scrollTop);
          await down.tap();
          assert.ok(await board.evaluate(n=>n.scrollTop) > y);
        }
        await board.locator('.form-button').last().tap();
        await inside(page.locator('.form-dialog[open] .dialog-header'),bounds);
        await page.locator('.form-dialog[open] .dialog-header button').tap();
      }
      await page.evaluate(() => {
        q.cards(0);
        const run=q.c.getState();
        run.combat.handIds=run.activeCardIds.slice(0,14);
        run.combat.drawIds=run.activeCardIds.slice(14);
        run.combat.rulesSnapshot.handLimit=14;
        q.c._state=run;
        q.show();
      });
      await page.getByRole('button',{name:'다음 손패 페이지'}).tap();
      const selected=page.locator('.hand-cards>.word-card:not([hidden]) .card-select').first();
      await selected.tap();
      const snapshot = () => page.evaluate(()=>({
        run:q.c.getState(),page:document.querySelector('.hand-cards').dataset.page,
        selected:[...q.selected],scroll:document.querySelector('.rune-panel').scrollTop
      }));
      await page.locator('.rune-panel').evaluate(n=>{n.scrollTop=12;});
      const saved=await snapshot();
      assert.ok(saved.selected.length===1 && saved.page!=='0');
      if (await page.evaluate(()=>!!document.fullscreenElement)) await page.evaluate(()=>document.exitFullscreen());
      const toggle = page.locator('.fullscreen-toggle');
      await toggle.tap();
      await page.waitForFunction(()=>!!document.fullscreenElement);
      await visibleArea(page,302);
      await toggle.tap();
      await page.waitForFunction(()=>!document.fullscreenElement);
      await visibleArea(page,310);
      assert.deepEqual(await snapshot(),saved);
      await expect(selected).toHaveAttribute('aria-pressed','true');
      await page.locator('#discard-selected').tap();
      const after=await page.evaluate(()=>q.c.getState());
      assert.equal(after.combat.exchangesRemaining,saved.run.combat.exchangesRemaining-1);
      assert.ok(after.combat.discardIds.includes(saved.selected[0]));
    } else {
      assert.deepEqual(await page.evaluate(()=>q.c.getState()),original);
      assert.equal(await page.evaluate(()=>stageNode===document.querySelector('.enemy-area')),true);
      if (width===1280) {
        await page.locator('.fullscreen-toggle').focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(()=>!!document.fullscreenElement);
        await page.keyboard.press('Enter');
        await page.waitForFunction(()=>!document.fullscreenElement);
        assert.deepEqual(await page.evaluate(()=>q.c.getState()),original);
      }
      if (width===1024 || width===1194) {
        await page.evaluate(async () => {
          q.dispose();
          const {bossReward}=await import('/tests/helpers/shop-flow-state.js');
          q.c=bossReward(3);
          const run=q.c.getState();
          run.combat=null;
          q.c._beginBattle(run);
          q.c._state=run;
          q.show();
        });
        const savedBoss=await page.evaluate(()=>q.c.getState());
        const phases=page.locator('.golem-phases');
        await visibleArea(page,height-100);
        await expect(page.locator('.enemy-info .golem-phase')).toHaveCount(3);
        const info=await page.locator('.enemy-info').boundingBox();
        const arena=await stage();
        assert.ok(info.y>=arena.y-1 && info.y+info.height<=arena.y+arena.height+1);
        const last=phases.locator('.golem-phase-hp').last();
        await last.scrollIntoViewIfNeeded();
        await inside(last,{top:info.y,left:info.x,right:info.x+info.width,bottom:info.y+info.height});
        await visibleArea(page,height);
        if ((await stage()).height>=200) await expect(page.locator('.enemy-area > .golem-phases')).toHaveCount(1);
        assert.deepEqual(await page.evaluate(()=>q.c.getState()),savedBoss);
      }
    }
    await visibleArea(page,height);
    const restored = await stage();
    assert.ok(Math.abs(before.height - restored.height)<1);
    rows.push({width,height,visibleHeight:height-loss,stageBefore:before.height,stageAfter:smaller.height,stageRestored:restored.height});
  }

  await page.setViewportSize({width:844,height:390});
  await visibleArea(page,310,{top:9,left:3,width:838});
  await page.evaluate(() => {
    const style = document.documentElement.style;
    for (const [side,px] of Object.entries({top:4,bottom:14,left:24,right:18})) style.setProperty('--safe-'+side,px+'px');
    q.cards(1);
  });
  await settle(page);
  const safe = {top:13,bottom:305,left:27,right:823};
  const app = await page.locator('#app').boundingBox();
  assert.deepEqual(app,{x:safe.left,y:safe.top,width:safe.right-safe.left,height:safe.bottom-safe.top});
  await inside(page.locator('#attack-submit'),safe);
  await inside(page.locator('.hand-page-row'),safe);
  await page.locator('.sound-toggle').tap();
  await inside(page.locator('.sound-dialog[open]'),safe);
  await page.locator('.sound-dialog .dialog-header button').tap();
  await page.evaluate(()=>['top','bottom','left','right'].forEach(s=>document.documentElement.style.removeProperty('--safe-'+s)));

  await visibleArea(page,236);
  await page.evaluate(()=>q.cards(1));
  const scroll = await page.locator('#app').evaluate(n=>({view:n.clientHeight,content:n.scrollHeight}));
  assert.ok(scroll.content>scroll.view);
  const hand = page.locator('.hand-cards>.word-card:not([hidden]) .card-body').first();
  await hand.scrollIntoViewIfNeeded();
  assert.ok(await page.locator('#app').evaluate(n=>n.scrollTop)>0);
  await inside(hand,{top:0,left:0,right:844,bottom:236});
  await hand.tap();
  await expect(page.locator('.combat-sentence .word-card')).toHaveCount(2);
  await page.locator('#clear-sentence').tap();
  await expect(page.locator('.combat-sentence .word-card')).toHaveCount(0);
  await visibleArea(page,390);
  return {sizes:rows,simulatedInsets:safe,extreme:scroll};
}

export async function checkVisiblePanels(page, capture) {
  await page.setViewportSize({width:844,height:390});
  await visibleArea(page,300,{top:18});
  const bounds = {top:18,bottom:318,left:0,right:844};
  await page.evaluate(()=>q.between('stage.02',2));
  const scene = page.locator('.preparation-scene[data-ready=true]');
  await scene.waitFor();
  await page.locator('.monster-preview-image[data-ready=true]').waitFor();
  const panorama = await scene.boundingBox();
  assert.ok(Math.abs(panorama.width/panorama.height-3)<.01);
  await inside(page.locator('#next-battle'),bounds);
  await inside(page.getByRole('button',{name:'여기서 저장',exact:true}),bounds);
  await capture('visible-preparation-300',{x:0,y:18,width:844,height:300});
  await page.getByRole('button',{name:'여기서 저장',exact:true}).tap();
  await page.locator('#next-battle').tap();
  assert.deepEqual(await page.evaluate(()=>[q.saveCount,q.nextCount]),[1,1]);

  await page.evaluate(()=>q.other('shop'));
  const stock = await page.evaluate(()=>q.c.getState());
  await page.getByRole('button',{name:'다음 상품'}).tap();
  const product = page.locator('.shop-item:not([hidden]) button').first();
  await product.scrollIntoViewIfNeeded();
  await inside(product,bounds);
  await visibleArea(page,320);
  assert.deepEqual(await page.evaluate(()=>q.c.getState()),stock);
  await inside(page.locator('#leave-shop'),{...bounds,top:0,bottom:320});

  for (const [view,selector] of [['entry4','#enter-stage'],['clear','#next-stage'],['result','#new-run-result']]) {
    await page.evaluate(type=>q.other(type),view);
    const next = page.locator(selector);
    await next.scrollIntoViewIfNeeded();
    await inside(next,{...bounds,top:0,bottom:320});
    if (view==='entry4') {
      await next.tap();
      await expect(page.locator('.entry-choice-dialog .reward-choice')).toHaveCount(3);
      await page.locator('dialog[open] .dialog-header button').tap();
    }
  }
  await page.evaluate(async () => {
    q.dispose();
    const {bossReward} = await import('/tests/helpers/shop-flow-state.js');
    const {renderReward} = await import('/src/ui/progression.js');
    q.c=bossReward(1);
    q.extraCleanup=renderReward(q.root,q.c.getState(),{command:c=>q.c.dispatch(c),onSaves(){},onDeck(){},onLobby(){}});
  });
  await expect(page.locator('.mixed-rewards .reward-choice')).toHaveCount(3);
  const offer = await page.evaluate(()=>q.c.getState().reward);
  await visibleArea(page,300,{top:12});
  const skip = page.locator('#skip-reward');
  await skip.scrollIntoViewIfNeeded();
  await inside(skip,{...bounds,top:12,bottom:312});
  assert.deepEqual(await page.evaluate(()=>q.c.getState().reward),offer);
  await page.locator('dialog[open] .dialog-header button').tap();
  await visibleArea(page,390);
  return {panorama,shopInventoryPreserved:true,rewardPreserved:true};
}

export async function checkLinkEntry(browser) {
  const options = {viewport:{width:844,height:390},isMobile:true,hasTouch:true};
  const context = await browser.newContext(options);
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:5173/?debug=1#lobby');
    const toggle = page.locator('.fullscreen-toggle');
    await toggle.waitFor();
    await page.evaluate(() => {
      window.fullAttempts = 0; window.lockCalls = [];
      const native = document.documentElement.requestFullscreen.bind(document.documentElement);
      document.documentElement.requestFullscreen = () => {
        fullAttempts++;
        return native();
      };
      Object.defineProperty(screen.orientation,'lock',{configurable:true,value:mode => {
        lockCalls.push([mode,!!document.fullscreenElement]);
        return Promise.reject(new DOMException('Test orientation refusal','NotSupportedError'));
      }});
    });
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-pressed','true');
    assert.deepEqual(await page.evaluate(()=>[fullAttempts,lockCalls,!!document.fullscreenElement]),[1,[['landscape',true]],true]);
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-pressed','false');
    await page.evaluate(() => {
      document.documentElement.requestFullscreen = () => {fullAttempts++;return Promise.reject(new DOMException('Test refusal','NotAllowedError'));};
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async url=>{window.copied=url;}}});
    });
    await toggle.tap();
    await expect(page.getByRole('region',{name:'전체화면 안내'})).toBeVisible();
    await expect(page.locator('dialog:modal')).toHaveCount(0);
    await page.getByRole('button',{name:'주소 복사',exact:true}).tap();
    assert.equal(await page.evaluate(()=>copied),'https://yeomt.github.io/grammardealer/#lobby');
    await page.getByRole('button',{name:'현재 화면에서 계속'}).tap();
    await page.locator('#player-name').fill('링크 접속 검사');
    await visibleArea(page,212,{top:24});
    await expect(page.locator('html')).toHaveAttribute('data-keyboard','true');
    await expect(page.locator('.orientation-gate')).not.toBeVisible();
    const name = page.locator('#player-name');
    await name.scrollIntoViewIfNeeded();
    await inside(name,{top:24,bottom:236,left:0,right:844});
    await name.press('Enter');
    await page.locator('#start-battle').waitFor();
    await visibleArea(page,310);
    await inside(page.locator('#start-battle'),{top:0,bottom:310,left:0,right:844});
    await page.locator('#start-battle').tap();
    await expect(page.locator('#attack-submit')).toBeVisible();
    assert.equal(await page.evaluate(()=>fullAttempts),2);
    assert.equal(await page.locator('.fullscreen-help,dialog:modal').count(),0);
    assert.equal(await page.evaluate(()=>__SB_DEV__.getProfile().displayName),'링크 접속 검사');
    // First landscape start in a fresh document. Rejection must not gate the expedition.
    await page.goto('http://127.0.0.1:5173/?start-refused=1#lobby');
    await page.locator('#start-run').waitFor();
    await page.evaluate(()=>{
      window.requestActivations=[];
      document.documentElement.requestFullscreen=()=>{
        requestActivations.push(navigator.userActivation.isActive);
        return Promise.reject(new DOMException('Test refusal','NotAllowedError'));
      };
    });
    await page.locator('#start-run').tap();
    await page.locator('#start-battle').waitFor();
    assert.deepEqual(await page.evaluate(()=>requestActivations),[true]);
    assert.equal(await page.locator('.fullscreen-help,dialog:modal').count(),0);
  } finally {await context.close();}

  const standalone = await browser.newContext(options);
  try {
    await standalone.addInitScript(() => {
      const native = window.matchMedia.bind(window);
      window.matchMedia = query => query==='(display-mode: standalone)' ? native('all') : native(query);
      window.fullAttempts=0;
      document.documentElement.requestFullscreen=()=>{fullAttempts++;return Promise.reject(Error('unexpected request'));};
    });
    const installed = await standalone.newPage();
    await installed.goto('http://127.0.0.1:5173/#lobby');
    await expect(installed.locator('html')).toHaveAttribute('data-display-mode','standalone');
    await expect(installed.locator('.fullscreen-toggle')).toHaveAttribute('aria-pressed','false');
    await installed.getByRole('button',{name:'설정',exact:true}).tap();
    await installed.locator('.link-settings summary').tap();
    await expect(installed.locator('.link-settings')).toContainText('홈 화면 앱으로 실행 중');
    await installed.getByRole('button',{name:'설정 닫기'}).tap();
    await installed.locator('#start-run').tap();
    await installed.locator('#start-battle').waitFor();
    assert.equal(await installed.evaluate(()=>fullAttempts),0);
  } finally {await standalone.close();}
  return {fullscreen:'trusted native entry and exit',lock:'simulated refusal after actual entry',
    clipboard:'official URL (test clipboard)',keyboard:'simulated visual shrink and Enter submission',
    standalone:'display mode simulated; actual installation NOT RUN'};
}
