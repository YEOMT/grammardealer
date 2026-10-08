import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {registryForVersion} from '../src/data/language/index.js';
import {resolveAttack} from '../src/engine/stage.js';
import {STAGE6} from '../src/data/stage6.js';
import {SNOW_PACKS} from '../src/data/language/snowLanguage.js';
import {packs} from './helpers/polish-baseline.js';
const fixture=name=>JSON.parse(fs.readFileSync(new URL('./fixtures/v06-'+name,import.meta.url)));
const language=registryForVersion('0.6.0');
export function sentence(text,{unlocks=[...packs,...SNOW_PACKS],temporaryCardMeta={}}={}){const sentenceSnapshot=snapshotFromText(text,{registry:language}),analysis=analyzeSentence(sentenceSnapshot,language);return resolveAttack({sentenceSnapshot,analysis,cards:sentenceSnapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:0})),enemy:{id:'battle.06.05',hp:10000,maxHp:10000},stage:STAGE6,policyVersion:'0.6.0',comboEligibility:{version:'0.6.0',unlocks},temporaryCardMeta});}
for(const f of fixture('04_grammar_cases_0.6.json').cases)test('0.6 '+f.id+' parser '+f.sentence,()=>{const r=sentence(f.sentence),a=r.analysis;assert.equal(a.status,f.expectedStatus);for(const tag of f.expectedTags??[])assert.ok(a.grammarHits.some(h=>h.tag===tag),tag);for(const code of f.expectedIssues??[])assert.ok(a.issues.some(i=>i.code===code),code);for(const tag of f.forbiddenTags??[])assert.ok(!a.grammarHits.some(h=>h.tag===tag),tag);});
for(const f of fixture('07_scoring_cases_0.6.json').cases)test('0.6 '+f.id+' arithmetic '+f.sentence,()=>{const r=sentence(f.sentence);assert.equal(r.finalPower,f.expected);assert.equal(r.scoreTimeline.filter(e=>e.phase==='REGION').length,f.steps.some(s=>s[0]==='REGION')?1:0);});
test('0.6 locked comparison remains grammatically valid, without combo or region',()=>{const r=sentence('I am bigger than you.',{unlocks:[]});assert.equal(r.analysis.status,'VALID');assert.equal(r.finalPower,128);assert.ok(!r.scoreTimeline.some(e=>e.sourceId==='COMPARISON.COMPARATIVE'));});
test('0.6 quantifiers require mass/plural; unlicensed markers cannot break crystals',()=>{for(const text of ['I need more book.','I need enough book.','I need most book.'])assert.equal(sentence(text).analysis.status,'VALID_WITH_ISSUES');const a=sentence('I am more bigger than you.').analysis;assert.ok(a.coverage.unlicensedCardIds.includes(a.grammarHits.find(h=>h.tag==='COMPARISON.COMPARATIVE').markerCardIds[0]));});
test('0.6 comparison evidence carries structure, markers, range and owning clause',()=>{for(const text of ['I am as strong as you.','I am too tired to work.','I run twice.','I need more water.']){const a=sentence(text).analysis;for(const h of a.grammarHits.filter(h=>/^(COMPARISON|DEGREE|QUANTIFIER|ADVERB)\./.test(h.tag))){assert.ok(h.parentClauseId);assert.equal(h.range.length,2);assert.ok(Array.isArray(h.markerCardIds));}}});
