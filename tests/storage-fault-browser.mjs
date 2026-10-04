/** Native IndexedDB rollback/recovery in Chromium; forced abort is NOT real quota exhaustion. */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const evidenceDir = resolve(root, 'docs/evidence-0.1.1');
await mkdir(evidenceDir, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const path = req.url.split('?')[0];
    if (path === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><html lang="ko"><meta charset="utf-8"><title>Storage fault harness</title><link rel="stylesheet" href="/src/ui/styles.css"><body><main id="app">실제 IndexedDB 오류 복구 검사</main></body></html>');
      return;
    }
    if (!path.startsWith('/src/') || path.includes('..')) throw Error('Unavailable test path');
    res.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : 'text/javascript');
    res.end(await readFile(resolve(root, `.${path}`)));
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise((resolveListening, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListening); });
let browser;
const report = {
  status: 'RUNNING', scope: 'ISOLATED_REAL_CHROMIUM_MODULE_HARNESS_NOT_PRODUCTION_BUILD',
  command: 'node tests/storage-fault-browser.mjs', generatedAt: new Date().toISOString(),
  fault: 'Native IDBObjectStore slots.put success event followed by IDBTransaction.abort()',
  notTested: ['Actual storage quota exhaustion', 'Physical disk failure', 'Actual iPad/Safari'],
  cases: [],
};
try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  report.browser = await browser.version();
  report.viewport = { width: 1024, height: 768 };
  const page = await browser.newPage({ viewport: report.viewport });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(async () => {
    const { LocalStore } = await import('/src/services/localStore.js');
    const { RunController } = await import('/src/game/runController.js');
    const { registry } = await import('/src/data/language/index.js');
    window.overlays = await import('/src/ui/overlays.js');
    window.store = await new LocalStore({ registry }).init();
    window.profile = await store.createProfile('저장 복구 QA');
    window.controller = new RunController({ profile });
    for (const command of [{ type: 'NEW_RUN', config: { seed: 'storage.before' } }, { type: 'START_BATTLE' }]) {
      const result = controller.dispatch(command); if (!result.ok) throw Error(result.message);
    }
    await store.saveRun(profile.playerId, 1, controller.getState());
    window.readRawSlot = () => new Promise((resolveRow, reject) => {
      const tx = store.db.transaction('slots', 'readonly');
      const request = tx.objectStore('slots').get(`${profile.playerId}:1`);
      let row;
      request.onsuccess = () => { row = request.result; };
      tx.oncomplete = () => resolveRow(row); tx.onabort = () => reject(tx.error); tx.onerror = () => reject(tx.error);
    });
    window.writeRawSlot = (row) => new Promise((resolveWrite, reject) => {
      const tx = store.db.transaction('slots', 'readwrite'); tx.objectStore('slots').put(row);
      tx.oncomplete = () => resolveWrite(); tx.onabort = () => reject(tx.error); tx.onerror = () => reject(tx.error);
    });
    window.originalRow = await readRawSlot();
    for (const command of [{ type: 'NEW_RUN', config: { seed: 'storage.pending.overwrite' } }, { type: 'START_BATTLE' }]) {
      const result = controller.dispatch(command); if (!result.ok) throw Error(result.message);
    }
    window.currentState = controller.getState();
    window.memoryBefore = JSON.stringify(currentState);
    window.nativePut = IDBObjectStore.prototype.put;
    window.faultArmed = true;
    window.faultTrace = [];
    window.saveAttempts = [];
    window.loadCallbackCount = 0;
    IDBObjectStore.prototype.put = function (...args) {
      const request = nativePut.apply(this, args);
      if (this.name === 'slots' && faultArmed) {
        faultArmed = false;
        const transaction = this.transaction;
        transaction.addEventListener('complete', () => faultTrace.push({ event: 'TRANSACTION_COMPLETE_UNEXPECTED' }));
        transaction.addEventListener('abort', () => faultTrace.push({ event: 'TRANSACTION_ABORT' }));
        request.addEventListener('success', () => {
          faultTrace.push({ event: 'REQUEST_SUCCESS', savePromiseState: saveAttempts.at(-1)?.status ?? 'unknown' });
          transaction.abort();
          faultTrace.push({ event: 'ABORT_REQUESTED_AFTER_REQUEST_SUCCESS' });
        }, { once: true });
      }
      return request;
    };
    const originalSave = store.saveRun.bind(store);
    store.saveRun = async (...args) => {
      const attempt = { status: 'PENDING' }; saveAttempts.push(attempt);
      try { const result = await originalSave(...args); attempt.status = 'RESOLVED'; return result; }
      catch (error) { attempt.status = 'REJECTED'; attempt.message = error.message; faultTrace.push({ event: 'SAVE_PROMISE_REJECTED', message: error.message }); throw error; }
    };
    overlays.openSaves({ store, profile, state: currentState, onLoad: (run) => {
      loadCallbackCount += 1; return controller.restoreRun(run);
    } });
  });
  const saveButton = page.getByRole('button', { name: '슬롯 1 저장', exact: true });
  await page.waitForFunction(() => !document.querySelector('[aria-label="슬롯 1 저장"]').disabled);
  await saveButton.click();
  await page.waitForFunction(() => document.querySelector('.dialog-body [role="status"]').textContent.includes('완료하지 못했습니다'));
  const abort = await page.evaluate(async () => ({
    faultTrace, saveAttempts, rowUnchanged: JSON.stringify(await readRawSlot()) === JSON.stringify(originalRow),
    memoryUnchanged: JSON.stringify(currentState) === memoryBefore && JSON.stringify(controller.getState()) === memoryBefore,
    errorText: document.querySelector('.dialog-body [role="status"]').textContent,
    noSuccessText: !document.querySelector('.dialog-body [role="status"]').textContent.includes('저장했습니다'),
    retryEnabled: !document.querySelector('[aria-label="슬롯 1 저장"]').disabled,
  }));
  assert.equal(abort.saveAttempts[0].status, 'REJECTED');
  assert.deepEqual(abort.faultTrace.map((entry) => entry.event), ['REQUEST_SUCCESS', 'ABORT_REQUESTED_AFTER_REQUEST_SUCCESS', 'TRANSACTION_ABORT', 'SAVE_PROMISE_REJECTED']);
  assert.equal(abort.faultTrace[0].savePromiseState, 'PENDING');
  assert.equal(abort.rowUnchanged, true); assert.equal(abort.memoryUnchanged, true);
  assert.equal(abort.noSuccessText, true); assert.equal(abort.retryEnabled, true);
  await page.screenshot({ path: resolve(evidenceDir, 'storage-abort-retry.png') });
  report.abort = abort;
  report.cases.push({ id: 'P07', status: 'PASS', evidence: 'Real native put request succeeded but forced transaction abort rejected save; old row and memory state preserved; UI displayed error and enabled retry. This is not a real quota exhaustion test.' });

  // Disarmed fault: the same visible button now performs a real committed overwrite.
  await saveButton.click();
  await page.waitForFunction(() => document.querySelector('.dialog-body [role="status"]').textContent.includes('저장했습니다'));
  const retry = await page.evaluate(async () => {
    const row = await readRawSlot(); window.validRow = structuredClone(row);
    return { status: saveAttempts.at(-1).status, savedCurrent: JSON.stringify(row.run) === memoryBefore,
      changedOldRun: row.run.runId !== originalRow.run.runId, memoryUnchanged: JSON.stringify(controller.getState()) === memoryBefore,
      retryEnabled: !document.querySelector('[aria-label="슬롯 1 저장"]').disabled };
  });
  assert.equal(retry.status, 'RESOLVED'); assert.equal(retry.savedCurrent, true); assert.equal(retry.changedOldRun, true);
  assert.equal(retry.memoryUnchanged, true); assert.equal(retry.retryEnabled, true);
  report.retry = retry;
  await page.getByRole('button', { name: /닫기/ }).click();

  report.corruptions = [];
  for (const kind of ['FUTURE_VERSION', 'UNKNOWN_CARD_ID']) {
    await page.evaluate(async (kind) => {
      const row = structuredClone(validRow);
      if (kind === 'FUTURE_VERSION') row.version = '999.0.0';
      else row.run.cardInstances[row.run.activeCardIds[0]].cardDefId = 'card.unknown.corrupted';
      await writeRawSlot(row); window.corruptRowBefore = JSON.stringify(await readRawSlot());
      window.directLoadRejected = false; window.directLoadMessage = '';
      try { await store.loadRun(profile.playerId, 1); }
      catch (error) { directLoadRejected = true; directLoadMessage = error.message; }
      overlays.openSaves({ store, profile, state: currentState, onLoad: (run) => { loadCallbackCount += 1; return controller.restoreRun(run); } });
    }, kind);
    await page.waitForFunction(() => !document.querySelector('[aria-label="슬롯 1 불러오기"]').disabled);
    await page.getByRole('button', { name: '슬롯 1 불러오기', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.dialog-body [role="status"]').textContent.includes('완료하지 못했습니다'));
    const corruption = await page.evaluate(async (kind) => ({
      kind, directLoadRejected, directLoadMessage,
      rowPreserved: JSON.stringify(await readRawSlot()) === corruptRowBefore,
      memoryUnchanged: JSON.stringify(currentState) === memoryBefore && JSON.stringify(controller.getState()) === memoryBefore,
      loadCallbackCount, dialogOpen: document.querySelector('dialog').open,
      retryLoadEnabled: !document.querySelector('[aria-label="슬롯 1 불러오기"]').disabled,
      recoverySaveEnabled: !document.querySelector('[aria-label="슬롯 1 저장"]').disabled,
      errorText: document.querySelector('.dialog-body [role="status"]').textContent,
    }), kind);
    assert.equal(corruption.directLoadRejected, true); assert.equal(corruption.rowPreserved, true); assert.equal(corruption.memoryUnchanged, true);
    assert.equal(corruption.loadCallbackCount, 0); assert.equal(corruption.dialogOpen, true);
    assert.equal(corruption.retryLoadEnabled, true); assert.equal(corruption.recoverySaveEnabled, true);
    report.corruptions.push(corruption);
    await page.screenshot({ path: resolve(evidenceDir, `storage-${kind.toLowerCase()}.png`) });
    await page.getByRole('button', { name: /닫기/ }).click();
  }
  report.cases.push({ id: 'P08', status: 'PASS', evidence: 'Real IndexedDB rows with future record version and unknown card definition were rejected on direct and UI load; original corrupted rows remained untouched, active memory state unchanged, callback never called, and recovery controls remained enabled.' });

  // Recovery remains usable after corrupt load failures, without clearing the database.
  await page.evaluate(async () => {
    IDBObjectStore.prototype.put = nativePut;
    await store.saveRun(profile.playerId, 1, currentState);
    window.recovered = await store.loadRun(profile.playerId, 1);
  });
  assert.equal(await page.evaluate(() => JSON.stringify(recovered) === memoryBefore), true);
  assert.deepEqual(pageErrors, []);
  report.recoveredAfterCorruptions = true; report.pageErrors = pageErrors; report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL'; report.error = { message: error.message, stack: error.stack }; throw error;
} finally {
  await writeFile(resolve(evidenceDir, 'storage-fault-browser.json'), JSON.stringify(report, null, 2));
  if (browser) await browser.close();
  await new Promise((closed) => server.close(closed));
  console.log(JSON.stringify(report, null, 2));
}
