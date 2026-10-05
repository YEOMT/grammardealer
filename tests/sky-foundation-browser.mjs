/** Real rendering/input against assigned forms. This is not campaign completion. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out=process.env.SB_V04_EVIDENCE??'.local-validation/v04/foundation-browser';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),checks=[],captures=[];
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 await page.goto('http://127.0.0.1:5173/');await page.locator('#start-run').waitFor();
 assert.match(await page.title(),/Syntax Atlas/);assert.match(await page.locator('.brand-small').first().innerText(),/SYNTAX ATLAS/);
 await page.screenshot({path:`${out}/lobby.png`});captures.push('lobby.png');checks.push('BRANDING');
 for(const [width,height]of [[1366,768],[1280,800],[1024,768]]){
  await page.setViewportSize({width,height});
  await page.evaluate(async()=>{const[{cardModel},{formMenu}]=await Promise.all([import('/src/ui/models.js'),import('/src/ui/cards.js')]);const m=cardModel({instanceId:'be',cardDefId:'card.be',polishLevel:0},null,'0.4.0');formMenu(m,m.forms,id=>window.selectedForm=id);});
  await page.locator('dialog[open]').waitFor();
  const boxes=await page.locator('dialog[open] .form-group').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().toJSON()));
  assert.equal(boxes.length,4);assert.equal(boxes[0].width,boxes[1].width);assert.ok(boxes[0].bottom<=boxes[1].top&&boxes[1].bottom<=boxes[2].top);assert.equal(boxes[2].top,boxes[3].top);assert.ok(boxes[2].right<=boxes[3].left);
  assert.equal(await page.locator('[data-form-id="form.be.base"] small').innerText(),'원형');assert.equal(await page.locator('.form-group h3').last().innerText(),'-ing형');
  assert.ok(await page.locator('dialog').evaluate(n=>n.getBoundingClientRect().bottom<=innerHeight));
  await page.screenshot({path:`${out}/forms-${width}.png`});captures.push(`forms-${width}.png`);await page.locator('[data-form-id="form.be.base"]').click();assert.equal(await page.evaluate(()=>selectedForm),'form.be.base');await page.locator('dialog').waitFor({state:'detached'});checks.push(`FORM_ROWS_${width}`);
 }
 for(const input of ['keyboard','touch']){const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true}),p=await context.newPage();await p.goto('http://127.0.0.1:5173/');await p.locator('#start-run').waitFor();for(const form of ['base','am','is','are','was','were','pp','ing']){await p.evaluate(async()=>{const[{cardModel},{formMenu}]=await Promise.all([import('/src/ui/models.js'),import('/src/ui/cards.js')]);const m=cardModel({instanceId:'be',cardDefId:'card.be',polishLevel:0},null,'0.4.0');formMenu(m,m.forms,id=>window.selectedForm=id);});const button=p.locator(`[data-form-id="form.be.${form}"]`);if(input==='keyboard'){await button.focus();await p.keyboard.press('Enter');}else await button.tap();assert.equal(await p.evaluate(()=>selectedForm),`form.be.${form}`);await p.locator('dialog').waitFor({state:'detached'});}checks.push(`ALL_BE_FORMS_${input.toUpperCase()}`);await context.close();}
 await fs.writeFile(`${out}/results.json`,JSON.stringify({kind:'ASSIGNED_FORMS_UI',checks:checks.map(id=>({id,status:'PASS'})),captures},null,2));console.log(JSON.stringify({status:'PASS',checks:checks.length,captures:captures.length}));
}finally{await browser.close();}
