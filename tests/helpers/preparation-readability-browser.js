import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {mountCombatQA} from './combat-ui-browser.js';

const frames = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));

async function prepare(page) {
  await page.goto('http://127.0.0.1:5173/?debug=1#lobby');
  await page.locator('#start-run').waitFor();
  await page.evaluate(mountCombatQA);
  await page.evaluate(async () => {
    const {renderBetween} = await import('/src/ui/progression.js');
    q.view.cleanup();
    const state = q.c.getState();
    state.status = 'BETWEEN_BATTLES';
    state.progress.stageId = 'stage.02';
    state.progress.roundIndex = 2;
    q.c._state = state;
    q.actions = {save: 0, next: 0};
    q.mountPreview = () => renderBetween(q.root, state, {
      onSaves: () => q.actions.save++,
      onNext: () => { q.actions.next++; q.f.checked(q.c, {type: 'NEXT_BATTLE'}); }
    });
    q.mountPreview();
  });
  await page.waitForFunction(() => ['.preparation-scene', '.monster-preview-image'].every(s => document.querySelector(s)?.dataset.ready === 'true'));
  await page.evaluate(() => Promise.all([...document.querySelectorAll('.preparation-scene,.monster-preview-image')].map(n => n.decode())));
  await frames(page);
}

function geometry() {
  const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
  const image = document.querySelector('.preparation-scene');
  return {
    stage: rect('.preparation-panorama'), image: rect('.preparation-scene'),
    fit: getComputedStyle(image).objectFit, natural: [image.naturalWidth, image.naturalHeight],
    monster: {...document.querySelector('.preparation-monster').dataset},
    info: rect('.preparation-scroll'), identity: rect('.preparation-identity'),
    target: rect('.preparation-guide > strong'), pattern: rect('.preparation-guide > p'),
    resources: rect('.preparation-resources'), actions: rect('.preparation-actions'),
    next: rect('#next-battle'), save: rect('.preparation-actions .secondary'),
    docWidth: document.documentElement.scrollWidth, docHeight: document.documentElement.scrollHeight
  };
}

async function swipe(page, cdp, x, y) {
  // Mount the same registered preview for each gesture so an earlier fling cannot
  // contribute residual scroll distance to the next measurement.
  await page.evaluate(([x, y]) => {
    q.mountPreview();
    const painted = document.elementFromPoint(x, y);
    window.gestureHit = {domGuide: !!painted?.closest('.preparation-scroll'), domTarget: painted?.className};
    document.addEventListener('touchstart', event => {
      const target = event.target;
      gestureHit.region = target.closest('.preparation-scroll') ? 'guide' : target.className;
      gestureHit.button = target.closest('button')?.textContent.trim() ?? null;
      gestureHit.path = event.composedPath().filter(n => n.className).slice(0, 5).map(n => n.className);
    }, {capture: true, once: true, passive: true});
  }, [x, y]);
  await frames(page);
  assert.equal(await page.locator('.preparation-scroll').evaluate(n => n.scrollTop), 0);
  await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{id: 1, x, y}]});
  for (let step = 1; step <= 6; step++) {
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{id: 1, x, y: y - step * 18}]});
    await frames(page);
  }
  await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  await frames(page);
  return page.evaluate(() => ({
    ...window.gestureHit,
    scrolled: document.querySelector('.preparation-scroll').scrollTop,
    actions: {...q.actions}
  }));
}

/** Exercise one real preparation view per viewport in isolated Chromium contexts. */
export async function checkPreparationReadability(browser, out, captures) {
  const results = [];
  const errors = [];
  for (const [width, height, device] of [[844,390,'phone'], [667,375,'phone'], [932,430,'phone'], [1366,768,'pc'], [1024,768,'tablet']]) {
    const context = await browser.newContext({viewport: {width,height}, hasTouch: device !== 'pc', isMobile: device === 'phone'});
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    try {
      await prepare(page);
      const layout = await page.evaluate(geometry);
      const row = {width, height, device, layout, swipes: []};
      results.push(row);
      if (captures && (width === 844 || device === 'pc')) await page.screenshot({path: `${out}/prep-${width}.png`});
      if (device === 'phone') {
        const cdp = await context.newCDPSession(page);
        // Exercise the same area near the footer at both action-button x coordinates.
        for (const [label, x, y] of [
          ['left', layout.info.x + 40, layout.info.y + layout.info.height / 2],
          ['above-save', layout.save.x + layout.save.width / 2, layout.info.bottom - 3],
          ['above-next', layout.next.x + layout.next.width / 2, layout.info.bottom - 3]
        ]) row.swipes.push({label, x, y, ...await swipe(page, cdp, x, y)});
        await page.getByRole('button', {name:'여기서 저장', exact:true}).tap();
        await page.locator('#next-battle').tap();
        row.actions = await page.evaluate(() => ({...q.actions, enemy: q.c.getState().combat.enemyState.enemyId}));
      }
    } finally { await context.close(); }
  }
  // Persist measurements before assertions so the original layout's failures can be compared.
  await fs.writeFile(`${out}/geometry.json`, JSON.stringify({results, errors}, null, 2));
  for (const {width, height, device, layout, swipes, actions} of results) {
    assert.deepEqual(layout.natural, [2172, 724]);
    assert.equal(layout.fit, 'contain');
    assert.ok(Math.abs(layout.image.width / layout.image.height - 3) < .01);
    assert.ok(Math.abs(layout.stage.x + layout.stage.width / 2 - width / 2) < 1);
    const body = layout.monster;
    assert.ok(+body.bodyLeft >= 0 && +body.bodyTop >= 0);
    assert.ok(+body.bodyLeft + +body.bodyWidth <= layout.stage.width + 1);
    assert.ok(+body.bodyTop + +body.bodyHeight <= layout.stage.height + 1);
    assert.ok(layout.docWidth <= width + 1 && layout.docHeight <= height + 1);
    assert.ok(layout.save.bottom <= height && layout.next.bottom <= height);
    if (device === 'phone') {
      assert.ok(layout.pattern.bottom <= layout.info.bottom + 1, `${width}: initial guide must show target and form`);
      for (const gesture of swipes) {
        assert.equal(gesture.domGuide, true, `${width} ${gesture.label}: swipe starts inside guide`);
        assert.equal(gesture.button, null, `${width} ${gesture.label}: action captured guide touch`);
        assert.ok(gesture.scrolled > 0, `${width} ${gesture.label}: guide did not scroll`);
        assert.deepEqual(gesture.actions, {save:0, next:0});
      }
      assert.deepEqual(actions, {save:1, next:1, enemy:'boss.stage2'});
    } else {
      const spaceAbove = layout.info.top - layout.stage.bottom;
      const spaceBelow = height - layout.actions.bottom;
      assert.ok(spaceAbove > 1 && spaceBelow > 1, `${width}: lower group has space on both sides`);
      assert.ok(Math.abs(spaceAbove - spaceBelow) <= 12, `${width}: centered lower group`);
      assert.ok(layout.resources.bottom <= layout.info.bottom + 1, `${width}: resources visible at rest`);
      assert.ok(layout.next.top - layout.resources.bottom <= 32, `${width}: guide and actions stay together`);
    }
  }
  assert.deepEqual(errors, []);
  return results.map(({width, height, layout, swipes, actions}) => ({
    width, height, guideHeight: layout.info.height,
    gapToButton: layout.next.top - layout.info.bottom, swipes, actions
  }));
}
