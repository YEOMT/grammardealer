import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const out=process.env.SB_FINAL_FORM_OUT??'.local-validation/final-battle-layout/form';
await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({headless:true});try{
const p=await b.newPage({viewport:{width:1366,height:650}});
await p.goto('http://127.0.0.1:5173/');
await p.locator('#start-run').waitFor();
await p.evaluate(async()=>{const [{cardModel},{formMenu}]=await Promise.all([import('/src/ui/models.js'),import('/src/ui/cards.js')]);const model=cardModel({instanceId:'qa.form',cardDefId:'card.be',polishLevel:0},null,'0.10.2');window.called=[];formMenu(model,model.forms,id=>called.push(id),{onMoveLeft:()=>called.push('left'),onMoveRight:()=>called.push('right'),onRemove:()=>called.push('return'),onSwap:()=>called.push('swap')});});const buttons=await p.locator('.form-dialog[open] button').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {text:n.textContent,x:r.x,y:r.y,b:r.bottom,r:r.right,hit:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
await p.screenshot({path:out+'/form-final.png'});assert.ok(buttons.every(n=>n.hit&&n.b<=650&&n.y>=0&&n.r<=1366));
await p.getByRole('button',{name:'카드 회수',exact:true}).click();assert.deepEqual(await p.evaluate(()=>called),['return']);
await fs.writeFile(out+'/report.json',JSON.stringify({status:'PASS',buttons,actualClick:'return'},null,2));console.log('PASS compact form: all form and edit controls visible; return callback once');}
finally{await b.close();}