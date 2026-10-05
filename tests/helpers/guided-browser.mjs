import assert from 'node:assert/strict';
/** Real UI actions only: no controller dispatch/state injection or hidden card-order reads. */
export async function playGuided(page,{capture=async()=>{},inspect=async()=>{},drag=false,keyboard=false,onGate=async()=>{}}={}){
 const card=(i,part='.card-body')=>page.locator(`[data-card-id="tutorial.021.${String(i).padStart(2,'0')}"] ${part}`);
 const cue=async n=>{await page.locator(`[data-tutorial-step="${n}"]`).waitFor();await inspect(n);};
 const ack=()=>page.locator('#guided-confirm').click();
 await cue(1);await capture('tutorial-start');await ack();
 if(keyboard){await card(0).focus();await page.keyboard.press('Enter');}else await card(0).click();
 if(drag){const a=await card(1).boundingBox(),b=await page.locator('.combat-sentence').boundingBox();await page.mouse.move(a.x+a.width/2,a.y+25);await page.mouse.down();await page.mouse.move(b.x+b.width-18,b.y+b.height/2,{steps:10});await page.mouse.up();}else await card(1).click();
 await cue(4);await card(1).click();await card(1).click();await cue(6);await ack();await card(2,'.card-select').click();await cue(8);await capture('discard-selected');
 const rects=await card(2).evaluate(node=>{const b=node.getBoundingClientRect(),c=node.parentElement.querySelector('.card-select').getBoundingClientRect();return{bodyBottom:b.bottom,checkTop:c.top,w:c.width,h:c.height};});assert.ok(rects.w>=44&&rects.h>=44);assert.ok(rects.bodyBottom<=rects.checkTop+.1);
 await page.locator('#discard-selected').click();await card(6).click();await page.locator('#guided-move').click();await cue(11);await page.locator('#attack-submit').click();await cue(13);assert.match(await page.locator('.enemy-hp').innerText(),/37 \/ 77/);await capture('first-hit');await ack();
 for(const selector of ['.pile-discard','[data-overlay=deck]','.pile-button:not(.pile-discard)','[data-overlay=dictionary]']){await page.locator(selector).click();await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');await page.locator('dialog[open]').waitFor({state:'hidden'});}
 await cue(18);await ack();await ack();for(const i of [7,8,9])await card(i).click();await cue(21);await page.locator('.prepare-button').click();await cue(22);await capture('prepared');await page.locator('#guided-insert').click();await cue(23);await card(10,'.form-button').click();await page.locator('[data-form-id="form.run.third"]').click();await cue(25);await page.locator('#attack-submit').click();
 for(const [n,value]of [[26,40],[27,70],[28,126]]){await page.locator(`[data-cue-id="T${n}"]`).waitFor();assert.match(await page.locator('.guided-gate strong').innerText(),new RegExp(String(value)));assert.equal(await page.locator('[data-presentation=score]').innerText(),String(value));await capture(`score-gate-${n}`);await onGate(n);await page.locator('#guided-gate-confirm').click();}
 await cue(30);assert.equal(await page.locator('[data-presentation=enemy]').evaluate(n=>getComputedStyle(n).opacity),'0');assert.match(await page.locator('.enemy-hp').innerText(),/0 \/ 77/);await capture('overpower-defeat');await ack();await cue(31);await ack();await page.locator('.reward-access').waitFor();await capture('tutorial-reward');
}
