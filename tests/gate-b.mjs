import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1366,height:768}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5173/#sandbox');await page.getByRole('heading',{name:'문장 실험실'}).waitFor();
 for(const word of ['she','be','happy'])await page.getByRole('button',{name:`${word} 카드 추가`,exact:true}).click();
 assert.equal(await page.locator('.sandbox-cards .word-card').count(),3);assert.equal(await page.locator('.status-pill').count(),0);
 await page.getByRole('button',{name:'am 형태 선택',exact:true}).click();assert.equal(await page.locator('.sandbox-cards .word-card').count(),3);
 await page.getByRole('button',{name:'형태 is',exact:true}).click();await page.getByRole('button',{name:'분석 실행',exact:true}).click();
 assert.equal(await page.locator('.status-pill').textContent(),'VALID');assert.match(await page.locator('.result-summary').innerText(),/75 위력/);
 await page.screenshot({path:'docs/evidence/gate-b-real-analysis.png'});
 const cases=JSON.parse(await fs.readFile('spec/05_ACCEPTANCE_CASES_v0_1.json','utf8')).grammarCases;const results=[];
 for(const c of cases){await page.getByLabel('문법 테스트 사례',{exact:true}).selectOption(c.id);await page.locator('#sandbox-analyze').click();const actual=await page.locator('.status-pill').textContent();assert.equal(actual,c.expectedStatus,c.id);results.push({id:c.id,expected:c.expectedStatus,actual,status:'PASS'});}
 assert.deepEqual(errors,[]);
 await fs.writeFile('docs/evidence/gate-b-browser.json',JSON.stringify({status:'PASS',browser:await browser.version(),manualCardAssembly:'She is happy → 75',formButtonPreservedCards:true,noAnalysisBeforeSubmit:true,cases:results,errors},null,2));console.log('Gate B browser PASS: real card composition, form menu, 48 grammar fixtures');
}finally{await browser.close();}
