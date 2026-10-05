/** Assigned legal checkpoints in real IndexedDB. This is not a campaign playthrough. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out=process.env.SB_VERSION_EVIDENCE||'.local-validation/v03/version-browser';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const report={kind:'ASSIGNED_VERSIONED_SLOTS_REAL_INDEXEDDB_AND_UI',checks:[],captures:[],errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');await page.locator('#start-run').waitFor();
 const saved=await page.evaluate(async()=>{
  const [{RunController},{RunController:OldController},{LocalStore,newProfile},{registry},{renderCombat}]=await Promise.all([import('/src/game/runController.js'),import('/tests/helpers/legacy-022-controller.js'),import('/src/services/localStore.js'),import('/src/data/language/index.js'),import('/src/ui/combat.js')]);
  const store=await new LocalStore({registry}).init(),profile={...newProfile('同一 profile · 0.2.2 / 0.3'),guidedTutorialCompletedVersion:'0.2.1'};
  await store.saveProfile(profile);const originals=[];
  for(const [i,Controller]of [OldController,RunController].entries()){
   const c=new Controller({profile});c.dispatch({type:'NEW_RUN',config:{seed:'versioned.slots'}});c.dispatch({type:'START_BATTLE'});const s=c.getState();
   // Assigned legal cards; all moves, submission and numerical resolution use the real controller.
   s.cardInstances[s.activeCardIds[0]].cardDefId='card.i';s.cardInstances[s.activeCardIds[1]].cardDefId='card.run';
   s.combat.handIds=s.activeCardIds.slice(0,6);s.combat.drawIds=s.activeCardIds.slice(6);s.combat.discardIds=[];s.combat.sentenceSlots=[];
   s.runes={slotLimit:3,orderedInstanceIds:['amber'],instances:{amber:{instanceId:'amber',runeId:'rune.short',level:1}}};
   await store.saveRun(profile.playerId,i+1,s);originals.push(s);
  }
  window.versionFixture={store,profile,originals,async load(slot){this.view?.cleanup();const s=await store.loadRun(profile.playerId,slot);this.c=new RunController({initialState:s,profile});this.show();return s;},show(){this.view?.cleanup();this.view=renderCombat(document.querySelector('#app'),this.c.getState(),{command:r=>{const result=this.c.dispatch(r);if(!result.ok)throw Error(result.message);this.last=result;this.show();}});}};
  return originals;
 });
 for(const [slot,multiplier,power]of [[1,'×1.25',62],[2,'×1.4',113]]){
  const restored=await page.evaluate(slot=>versionFixture.load(slot),slot);assert.deepEqual(restored,saved[slot-1]);
  assert.match(await page.locator('.rune-effect').innerText(),new RegExp(multiplier.replace('.','\\.')));
  await page.locator('.rune-info').click();assert.match(await page.locator('dialog[open]').innerText(),new RegExp(multiplier.replace('.','\\.')));await page.keyboard.press('Escape');
  for(const id of restored.activeCardIds.slice(0,2))await page.locator(`.hand-cards [data-card-id="${id}"] .card-body`).click();
  await page.locator('#attack-submit').click();const result=await page.evaluate(()=>versionFixture.last.resolution);assert.equal(result.finalPower,power);assert.equal(result.sentenceSnapshot.languageVersion,restored.version);
  await page.screenshot({path:`${out}/version-${restored.version}.png`});report.captures.push(`version-${restored.version}.png`);
  assert.deepEqual(await page.evaluate(slot=>versionFixture.store.loadRun(versionFixture.profile.playerId,slot),slot),saved[slot-1]);
  report.checks.push({id:`P086_${restored.version}`,status:'PASS',slot,multiplier,power,checkpointUnchanged:true});
 }
 assert.deepEqual(report.errors,[]);report.status='PASS';
}catch(error){report.status='FAIL';report.error=error.stack;throw error;}finally{await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report));}
