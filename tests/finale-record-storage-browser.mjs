/** Synthetic storage/UI fixtures only. This never claims a played campaign or public ranking. */
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url)),out=path.resolve(root,process.env.SB_FINALE_RECORDS_OUT??'.local-validation/v011/record-storage');
await fs.mkdir(out,{recursive:true});
const report={scope:'SYNTHETIC_STORAGE_UI_NOT_NATURAL',browser:'Chromium',storage:'isolated-context IndexedDB at localhost:4192',checks:[],captures:[],errors:[],notRun:['Natural campaign','Public leaderboard service','Physical devices']};
const pass=(id,evidence={})=>{report.checks.push({id,status:'PASS',...evidence});console.log('PASS',id);};
const assertNoOptionalValueText=async()=>assert.deepEqual(await page.locator('.finale-leaderboard').evaluate(node=>[...node.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE&&['false','null','undefined'].includes(n.textContent.trim())).map(n=>n.textContent)),[],'optional children must not render boolean/null text');
const server=spawn(process.execPath,['tools/static-server.mjs','.','4192','/'],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});let serverLog='';server.stdout.on('data',data=>{serverLog+=data;});server.stderr.on('data',data=>{serverLog+=data;});
let browser,context,page;
const boot=async()=>page.evaluate(async()=>{
 const service=await import('/src/services/clearLeaderboard.js'),storage=await import('/src/services/localStore.js'),ui=await import('/src/ui/finale.js');
 const store=await new storage.LocalStore().init();
 window.alertCalls=0;window.alert=()=>{window.alertCalls++;};
 window.q={service,storage,ui,store,repository:new service.LocalLeaderboardRepository(store),profiles:{},records:{},
  record({playerId,runId,power,displayName='합성 저장 검사'}){
   const run={runId,version:'0.11.0',config:{qaFixture:false},revision:4,progress:{battleNumber:50,stageId:'stage.final'}};
   // Intentionally synthetic result for persistence only, never a production debug API.
   const resolution={accepted:true,status:'VALID',attackId:runId+':attack.1',finalPower:power,actualHpLoss:100,overkill:Math.max(0,power-100),versions:{language:'0.10.0',balance:'balance.0.10.2'},sentenceSnapshot:{orderedTokens:[{cardDefId:'card.i',lexemeId:'lex.i.pronoun',selectionId:'form.i.subject',surface:'I'},{cardDefId:'card.run',lexemeId:'lex.run.verb',selectionId:'form.run.past',surface:'ran'}]}};
   return service.buildClearRecord({runId,playerId,displayName,bestAttackSnapshot:service.buildBestAttackSnapshot({run,resolution}),completionEvidence:{boundary:'FINAL50_CLEAR',phaseClearReceipts:[48,49,50].map(battleNumber=>({runId,battleNumber,settlementId:`${runId}:${battleNumber}:VICTORY`}))},eligible:true});
  },
  async save(record){let profile=this.profiles[record.playerId]??{...storage.newProfile(record.displayName),playerId:record.playerId};profile=storage.applyProfileEvent(profile,{type:'FINAL50_CLEAR',clearRecord:record});const saved=await store.saveFinaleClear(profile,record);this.profiles[record.playerId]=profile;this.records[record.clearId]=record;return saved;},
  async show(playerId){document.querySelectorAll('dialog').forEach(d=>d.remove());await ui.openClearLeaderboard(this.repository,{profile:playerId?{playerId}:undefined});},
 };
});
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Static server readiness timeout: '+serverLog)),10000);server.once('exit',code=>{clearTimeout(timer);reject(Error('Static server exited '+code+': '+serverLog));});server.stdout.on('data',()=>{if(serverLog.includes('4192')){clearTimeout(timer);resolve();}});});
 browser=await chromium.launch({headless:true});context=await browser.newContext({viewport:{width:1366,height:768}});page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>report.errors.push(error.message));
 await page.route('**/__finale_record_storage__',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="/src/ui/styles.css"><link rel="stylesheet" href="/src/ui/responsive.css"></head><body><main id="app"><p>SYNTHETIC_STORAGE_UI_NOT_NATURAL</p></main></body></html>'}));
 await page.goto('http://127.0.0.1:4192/__finale_record_storage__');await boot();await page.evaluate(()=>q.show());
 await expect(page.locator('dialog')).toContainText('아직 등록된 50전투 클리어 기록이 없습니다.');await expect(page.locator('dialog')).toContainText('이 기기의 클리어 랭킹');await expect(page.locator('dialog')).toContainText('공용 랭킹은 연결되지 않았습니다.');await assertNoOptionalValueText();pass('EMPTY_LOCAL_BOARD_AND_REMOTE_NOTICE');
 const seeded=await page.evaluate(async()=>{
  for(let i=0;i<21;i++)await q.save(q.record({playerId:`storage.player.${i}`,runId:`storage.run.${i}`,power:1000+i,displayName:i===20?'<img src=x onerror=alert(1)>':`합성 여행자 ${i}`}));
  const base=q.record({playerId:'storage.player.20',runId:'storage.run.20',power:1020,displayName:'<img src=x onerror=alert(1)>'}),first=await q.save(base),tie=await q.save(q.record({playerId:base.playerId,runId:'storage.run.tie',power:1020,displayName:base.displayName})),lower=await q.save(q.record({playerId:base.playerId,runId:'storage.run.lower',power:900,displayName:base.displayName}));
  const tiedBest=await q.repository.getOwnBest({playerKey:base.playerId});const higher=await q.save(q.record({playerId:base.playerId,runId:'storage.run.higher',power:5000,displayName:base.displayName}));const duplicate=await q.save(q.records[higher.record.clearId]);
  const concurrent=await Promise.all([q.store.saveFinaleClear(q.profiles[base.playerId],higher.record),q.store.saveFinaleClear(q.profiles[base.playerId],higher.record)]);
  return {concurrent:concurrent.map(r=>({duplicate:r.duplicate,sequence:r.record.storedSequence})),firstDuplicate:first.duplicate,tieRetains:tiedBest.clearId===base.clearId,higherBest:higher.ownBest.bestAttackSnapshot.finalPower,duplicate:duplicate.duplicate,profile:q.profiles[base.playerId],top:await q.repository.listTop({limit:20}),outsider:await q.store.listFinaleClears('storage.player.0'),ledger:await q.store.listFinaleClears(base.playerId)};
 });
 assert.deepEqual(seeded.concurrent,[{duplicate:true,sequence:24},{duplicate:true,sequence:24}]);assert.equal(seeded.firstDuplicate,true);assert.equal(seeded.tieRetains,true);assert.equal(seeded.higherBest,5000);assert.equal(seeded.duplicate,true);assert.equal(seeded.profile.storyClearCount,4);assert.equal(seeded.profile.finalClearIds.length,4);assert.equal(seeded.top.length,20);assert.equal(new Set(seeded.top.map(r=>r.playerId)).size,20);assert.equal(seeded.top[0].playerId,'storage.player.20');assert.equal(seeded.top.at(-1).playerId,'storage.player.1');assert.equal(seeded.outsider.length,1);assert.equal(seeded.ledger.length,4);pass('REAL_IDB_TOP20_OWN_BEST_TIE_DUPLICATE_PROFILE_LEDGER',{topCount:seeded.top.length,ownLedgerCount:seeded.ledger.length,profileClearCount:seeded.profile.storyClearCount});
 await page.evaluate(()=>q.show('storage.player.0'));await expect(page.locator('.finale-own-rank')).toHaveText('클리어 완료 · 현재 Top20 밖');await expect(page.locator('.finale-leaderboard')).toContainText('개인 최고 1,000점 · I ran');await expect(page.locator('.finale-ranking-entry').first()).toContainText('<img src=x onerror=alert(1)>');assert.equal(await page.locator('.finale-leaderboard img').count(),0);assert.equal(await page.evaluate(()=>window.alertCalls),0);await page.locator('.finale-ranking-entry summary').first().click();await expect(page.locator('.finale-ranking-entry[open] .finale-full-sentence')).toHaveText('I ran');pass('OUTSIDE_TOP20_VISIBLE_AND_NAMES_LITERAL_HTML_SAFE');
 await assertNoOptionalValueText();await page.screenshot({path:path.join(out,'local-records.png')});report.captures.push('local-records.png');
 await page.evaluate(()=>q.store.db.close());await page.reload();await boot();
 const restored=await page.evaluate(async()=>({top:await q.repository.listTop({limit:20}),own:await q.repository.getOwnBest({playerKey:'storage.player.0'}),profiles:await q.store.listProfiles(),sequence:await q.store._transaction('slots','readonly',s=>s.get(q.service.FINALE_SEQUENCE_KEY))}));
 assert.equal(restored.top.length,20);assert.equal(restored.top[0].bestAttackSnapshot.finalPower,5000);assert.equal(restored.top[0].bestAttackSnapshot.sentenceText,'I ran');assert.equal(restored.own.bestAttackSnapshot.finalPower,1000);assert.equal(restored.profiles.find(p=>p.playerId==='storage.player.20').storyClearCount,4);assert.equal(restored.sequence.sequence,24);pass('RELOAD_REOPENS_REAL_INDEXEDDB_WITH_SAME_SCORE_SENTENCE_AND_SEQUENCE',{storedSequence:restored.sequence.sequence});
 const aborted=await page.evaluate(async()=>{
  const playerId='storage.player.20',before=await q.repository.getOwnBest({playerKey:playerId}),profile=(await q.store.listProfiles()).find(p=>p.playerId===playerId),record=q.record({playerId,runId:'storage.run.abort',power:99999}),next=q.storage.applyProfileEvent(profile,{type:'FINAL50_CLEAR',clearRecord:record});
  const db=q.store.db,original=db.transaction.bind(db);let aborted=false;
  // Abort a real IndexedDB transaction immediately after its profile put; queued
  // ledger/best/sequence writes in that same transaction must all roll back.
  db.transaction=(names,mode)=>{const tx=original(names,mode),get=tx.objectStore.bind(tx);if(mode==='readwrite'&&Array.isArray(names)&&names.includes('profiles')&&names.includes('slots'))tx.objectStore=name=>{const os=get(name);if(name==='profiles'){const put=os.put.bind(os);os.put=value=>{const request=put(value);tx.abort();aborted=true;return request;};}return os;};return tx;};
  let rejected=false;try{await q.store.saveFinaleClear(next,record);}catch{rejected=true;}finally{db.transaction=original;}
  return {aborted,rejected,before,after:await q.repository.getOwnBest({playerKey:playerId}),profile:(await q.store.listProfiles()).find(p=>p.playerId===playerId),ledger:await q.store.listFinaleClears(playerId),sequence:await q.store._transaction('slots','readonly',s=>s.get(q.service.FINALE_SEQUENCE_KEY))};
 });
 assert.equal(aborted.aborted,true);assert.equal(aborted.rejected,true);assert.deepEqual(aborted.after,aborted.before);assert.equal(aborted.profile.storyClearCount,4);assert.equal(aborted.ledger.length,4);assert.equal(aborted.sequence.sequence,24);pass('ACTUAL_INDEXEDDB_ABORT_ROLLS_BACK_PROFILE_LEDGER_BEST_SEQUENCE');
 await page.evaluate(async()=>{document.querySelectorAll('dialog').forEach(d=>d.remove());await q.ui.openClearLeaderboard(new q.service.RemoteLeaderboardRepository());});await expect(page.locator('dialog')).toContainText('공용 랭킹 미연결');assert.equal(await page.locator('.finale-ranking-entry').count(),0);assert.equal(await page.evaluate(async()=>{await q.store.saveProfile({...((await q.store.listProfiles()).find(p=>p.playerId==='storage.player.20')),displayName:'이름만 변경'});return (await q.store.listFinaleClears('storage.player.20')).length;}),4);pass('REMOTE_UNCONNECTED_AND_LATER_PROFILE_SAVE_PRESERVE_LOCAL_LEDGER');
 assert.deepEqual(report.errors,[]);report.status='PASS';report.completedChecks=report.checks.length;
}catch(error){report.status='FAIL';report.failure=String(error.stack);throw error;}
finally{if(page)await page.evaluate(()=>window.q?.store?.db?.close()).catch(()=>{});await context?.close();await browser?.close();server.kill();await fs.writeFile(path.join(out,'server.log'),serverLog);await fs.writeFile(path.join(out,'result.json'),JSON.stringify(report,null,2));}
