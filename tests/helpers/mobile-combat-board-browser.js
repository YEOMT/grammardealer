import assert from 'node:assert/strict';

// Match physical hand and table word instances for an actual size comparison.
function mountSentence(count) {
  const ids = q.cards(count);
  const state = q.c.getState();
  const matchedWords = ['go', 'information', 'necessary', 'remember'];
  matchedWords.slice(0, count).forEach((word, index) => {
    state.cardInstances[ids[index]].cardDefId = 'card.' + word;
    state.cardInstances[state.combat.handIds[index]].cardDefId = 'card.' + word;
  });
  if (count >= 5) state.cardInstances[ids[4]].cardDefId = 'card.help';
  q.c._state = state;
  q.show();
  return ids;
}

function boardView() {
  const find = selector => document.querySelector(selector);
  const rect = element => element.getBoundingClientRect().toJSON();
  const zone = find('.combat-sentence');
  const cards = [...zone.querySelectorAll('.word-card')];
  const hand = [...document.querySelectorAll('.hand-cards>.word-card:not([hidden])')];
  function wordGeometry(card) {
    const word = card.querySelector('.card-word');
    const range = document.createRange();
    range.selectNodeContents(word);
    const text = rect(range);
    const body = rect(card.querySelector('.card-body'));
    return {
      word: word.textContent, font: parseFloat(getComputedStyle(word).fontSize),
      centeredX: text.left + text.width / 2 - body.left - body.width / 2,
      centeredY: text.top + text.height / 2 - body.top - body.height / 2,
      fits: text.left >= body.left - 1 && text.right <= body.right + 1,
      textWidth: text.width, bodyWidth: body.width,
      labelsVisible: ['.card-topline', '.card-footline'].some(selector =>
        card.querySelector(selector).getClientRects().length > 0)
    };
  }
  const cardRects = cards.map(rect);
  const visualRows = [];
  for (const box of cardRects) {
    const previous = visualRows.at(-1);
    if (previous && Math.abs(box.top - previous.top) < 1) {
      previous.count++;
      previous.right = box.right;
    } else {
      visualRows.push({count: 1, top: box.top, left: box.left, right: box.right});
    }
  }
  return {
    ids: cards.map(card => card.dataset.cardId),
    indexes: cards.map(card => Number(card.dataset.absoluteIndex)),
    groups: [...zone.querySelectorAll('.sentence-row')].map(row => row.children.length),
    handheld: document.documentElement.dataset.handheld === 'true',
    widths: cardRects.map(box => box.width),
    visualRows, board: rect(zone), hand: rect(find('.hand-cards')),
    buttons: [...document.querySelectorAll('.combat-actions button')].map(rect),
    stage: rect(find('.enemy-area')), backdrop: rect(find('.combat-backdrop')),
    words: cards.map(wordGeometry), handWords: hand.map(wordGeometry)
  };
}

async function openLastForm(page, close) {
  const down = page.getByRole('button', {name: '문장 뒷부분 보기', exact: true});
  for (let step = 0; step < 3 && await down.isVisible() && await down.isEnabled(); step++) {
    const before = await page.locator('.combat-sentence').evaluate(n => n.scrollTop);
    await down.tap();
    const after = await page.locator('.combat-sentence').evaluate(n => n.scrollTop);
    assert.ok(after > before, 'sentence scroll button advances the visible row');
  }
  const form = page.locator('.combat-sentence .form-button').last();
  const board = await page.locator('.combat-sentence').boundingBox();
  const last = await form.boundingBox();
  assert.ok(last.y >= board.y - 1 && last.y + last.height <= board.y + board.height + 1);
  await form.tap();
  await page.locator('.form-dialog').waitFor();
  await close();
}

async function openDualCardControls(page, close) {
  const card = page.locator('.combat-sentence .word-card').filter({has: page.locator('.card-info')}).first();
  const info = card.locator('.card-info');
  const form = card.locator('.form-button');
  const detailRect = await info.boundingBox();
  const formRect = await form.boundingBox();
  assert.ok(formRect.x + formRect.width <= detailRect.x + 1, 'details and form tap targets overlap');
  await info.tap();
  await page.getByRole('heading', {name: 'help · 카드 상세'}).waitFor();
  await close();
  await form.tap();
  await page.locator('.form-dialog').waitFor();
  await close();
}

export async function checkCombatBoard(page, {settle, onScreen, noPan, close}) {
  const evidence = [];
  for (const [width, height] of [[844,390], [667,375], [932,430], [1024,768], [1366,768], [1920,1080]]) {
    await page.setViewportSize({width, height});
    await settle();
    const phone = width < 1000;
    for (const count of phone ? [1,5,8,9,11,12,13,16,17,24] : [12]) {
      const ids = await page.evaluate(mountSentence, count);
      await settle();
      const view = await page.evaluate(boardView);
      assert.equal(view.handheld, phone);
      assert.deepEqual(view.ids, ids);
      assert.deepEqual(view.indexes, ids.map((_, index) => index));
      assert.deepEqual(view.groups, count > 12 ? [12, count - 12] : [count]);
      await noPan();
      for (const selector of ['#attack-submit', '#clear-sentence', '.prepare-button']) {
        await onScreen(page.locator(selector));
      }
      if (phone) {
        const expectedRows = Array.from({length: Math.ceil(count / 8)}, (_, i) => Math.min(8, count - i * 8));
        assert.deepEqual(view.visualRows.map(row => row.count), expectedRows, width + 'px at ' + count + ' cards');
        for (const row of view.visualRows) {
          assert.ok(Math.abs((row.left + row.right) / 2 - (view.board.left + view.board.right) / 2) < 2);
          if (row.count === 8) assert.ok(row.right - row.left >= view.board.width * .96);
        }
        assert.ok(view.buttons.every(button => button.right <= view.board.left + 1));
        assert.ok(view.hand.top - view.board.bottom < 61, 'tighten previous 61px board-to-hand gap');
        // Measured at these same heights before relocating the bottom action row.
        const previousStage = {667: 53, 844: 68, 932: 108}[width];
        assert.ok(view.stage.height > previousStage && view.backdrop.height > previousStage + 35);
        assert.ok(Math.min(...view.widths) >= 39);
        assert.ok(view.handWords.every(word => word.labelsVisible));
        for (const word of view.words) {
          assert.equal(word.labelsVisible, false);
          assert.ok(word.font >= 9 && word.fits, width + 'px ' + JSON.stringify(word));
          assert.ok(Math.abs(word.centeredX) <= 1.5 && Math.abs(word.centeredY) <= 2.5,
            width + 'px ' + JSON.stringify(word));
          const match = view.handWords.find(handWord => handWord.word === word.word);
          if (match) assert.ok(word.font >= match.font - .1, width + 'px ' + word.word + ' font ' + word.font + ' vs hand ' + match.font);
        }
        if (count === 24) await openLastForm(page, close);
        if (width === 667 && count === 8) await openDualCardControls(page, close);
      } else {
        assert.deepEqual(view.visualRows.map(row => row.count), [12]);
        assert.ok(view.words.every(word => word.labelsVisible));
      }
      evidence.push({width, height, count, ...view});
    }
    if (width === 844) {
      await page.evaluate(() => q.cards(1));
      await page.locator('#clear-sentence').tap();
      assert.equal(await page.locator('.combat-sentence .word-card').count(), 0);
      const before = await page.evaluate(() => q.c.getState());
      await page.locator('.prepare-button').tap();
      const after = await page.evaluate(() => q.c.getState());
      assert.equal(after.stats.preparations, before.stats.preparations + 1);
      assert.equal(after.combat.turnsRemaining, before.combat.turnsRemaining - 1);
    }
  }
  return evidence;
}
