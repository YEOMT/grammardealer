import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {registryForVersion} from '../src/data/language/index.js';
import {analyzeSentence,snapshotFromText} from '../src/engine/grammar/index.js';
import {resolveAttack} from '../src/engine/stage.js';
import {comboEligibility} from '../src/engine/comboEligibility.js';
import {STAGE8} from '../src/data/stage8.js';
const registry=registryForVersion('0.8.0');
const resolve=(text,extra={})=>{const sentenceSnapshot=snapshotFromText(text,{registry});return resolveAttack({sentenceSnapshot,analysis:analyzeSentence(sentenceSnapshot,registry),cards:sentenceSnapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:0})),enemy:{...STAGE8.rounds[0]},stage:STAGE8,policyVersion:'0.8.0',...extra});};
for(const c of JSON.parse(fs.readFileSync(new URL('./fixtures/v08/06_Score_Cases_0.8.json',import.meta.url))).cases)test(`0.8 score ${c.id}: ${c.sentence}`,()=>{
 const r=resolve(c.sentence);assert.equal(r.status,c.conditions.analysisStatus);
 assert.equal(r.postRegionScore,c.expectedPowerBeforeBoss,JSON.stringify(r.scoreTimeline.map(e=>[e.sourceId,e.after])));
 assert.equal(r.scoreTimeline.filter(e=>e.sourceId==='CLAUSE.RELATIVE').length,c.expectedRelativeEvents);
 assert.equal(r.scoreTimeline.filter(e=>e.phase==='REGION').length,c.expectedRegionEvents);
});
test('0.8 pre-unlock relative and questions still attack, with frozen current-run combo ownership',()=>{
 const locked={version:'0.8.0',unlocks:[]},text='A child who runs likes a book I made.';
 const r=resolve(text,{comboEligibility:locked});assert.equal(r.status,'VALID');assert.ok(r.finalPower>0);assert.equal(r.scoreTimeline.some(e=>e.sourceId==='CLAUSE.RELATIVE'||e.phase==='REGION'),false);
 const e=comboEligibility({version:'0.8.0',eligibility:{runStartUnlockBaseline:['pack.relative','pack.relativeAdverb','pack.waterwaysWords.reward'],runOwnUnlocks:[]}});assert.deepEqual(e.unlocks,['pack.waterwaysWords.reward']);
 assert.equal(resolve('Where do you work?').scoreTimeline.some(e=>e.sourceId==='CLAUSE.RELATIVE'||e.phase==='REGION'),false);
 const one=resolve(text,{comboEligibility:{version:'0.8.0',unlocks:['pack.relative']}});assert.equal(one.scoreTimeline.filter(e=>e.sourceId==='CLAUSE.RELATIVE').length,1);
});
