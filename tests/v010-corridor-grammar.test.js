import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registryForVersion, formsForCard} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {scoreableAnalysis} from '../src/engine/comboEligibility.js';
import {scoreAttack} from '../src/engine/scoring.js';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/v010/grammar_cases.json',import.meta.url))).cases;
// Incidental vocabulary absent from the physical DB: preserve the constituent type.
export const fixtureText=f=>f.sentence.replace(/\bhere\b/g,'home').replace(/\byoung\b/g,'happy');
export const corridorUnlocks=['pack.corridor','pack.time.past','pack.time.perfect','pack.time.progressive','pack.time.futureWill','pack.clauseLink','pack.relative','pack.relativeAdverb','pack.passive','pack.svoo','pack.svoc.basic','pack.infinitive','pack.gerund','pack.participles'];
export function analyzeCorridor(text){const registry=registryForVersion('0.10.0'),snapshot=snapshotFromText(text,{registry});return {snapshot,analysis:analyzeSentence(snapshot,registry)};}
// Fixture combo expectations are scored constructions. Raw nested evidence is retained.
const newTags=a=>scoreableAnalysis(a,{version:'0.10.0',unlocks:corridorUnlocks}).grammarHits.filter(h=>h.tag.startsWith('CORRIDOR.')&&h.validity==='VALID').map(h=>h.tag.slice(9));
test('0.10 retains 306 captured existing grammar interpretations (new raw corridor tags are additive)',()=>{
 const baseline=JSON.parse(fs.readFileSync(new URL('./fixtures/v081/grammar-audit-baseline.json',import.meta.url)));
 for(const c of baseline.cases){const {analysis:a}=analyzeCorridor(c.text);assert.deepEqual({status:a.status,frame:a.mainFrameId,tags:a.grammarHits.filter(h=>!h.tag.startsWith('CORRIDOR.')).map(h=>h.tag),issues:a.issues.map(i=>i.code),covered:a.coverage.consumedCardIds},c.expected,c.file+': '+c.text);}
});
for(const f of fixtures)test(`0.10 physical grammar ${f.id}: ${f.sentence}`,()=>{
 const {snapshot,analysis:a}=analyzeCorridor(fixtureText(f));
 assert.equal(new Set(snapshot.orderedTokens.map(t=>t.cardInstanceId)).size,snapshot.orderedTokens.length);
 assert.ok(snapshot.orderedTokens.every(t=>t.cardDefId&&t.selectionId), 'Unregistered fixture word must be disclosed');
 assert.notEqual(a.status,'ENGINE_ERROR',JSON.stringify(a.diagnostics));
 if(['SUPPORTED_TARGET','SUPPORTED_NO_TARGET','REGRESSION','NO_COUNTERFACTUAL_TARGET'].includes(f.kind))assert.equal(a.status,'VALID',JSON.stringify(a.issues));
 if(f.kind==='FORM_ERROR_NO_TARGET')assert.notEqual(a.status,'VALID');
 // Standalone had-been-ing retains ordinary past-perfect evidence, but never PPC.
 const expected=f.id==='G045'?['PAST_PERFECT']:f.expected_target_combos;
 // Mixed conditionals remain grammatical/unsupported according to bounded parsing;
 // no counterfactual interpretation or paired bonus is invented.
 if(f.id==='G044')assert.ok(!newTags(a).some(t=>t.startsWith('UNREAL')));
 else assert.deepEqual([...new Set(newTags(a))].sort(),[...expected].sort());
 if(f.expected_main_frame&&a.status.startsWith('VALID'))assert.equal(a.grammarHits.find(h=>h.scope==='MAIN_CLAUSE').tag,'FRAME.'+f.expected_main_frame);
});
test('0.10 selected modal forms are one physical card; legacy will and registry are unchanged',()=>{
 const r=registryForVersion('0.10.0'),old=registryForVersion('0.9.0');
 assert.deepEqual(formsForCard('card.will',{registry:r}).map(f=>f.surface),['will','would']);
 assert.deepEqual(formsForCard('card.can',{registry:r}).map(f=>f.surface),['can','could']);
 assert.equal(r.cardById['card.can'].rarity,'UNCOMMON');assert.equal(r.cardById['card.can'].starterEligible,false);
 assert.ok(!r.cardById['card.would']&&!r.cardById['card.could']);assert.equal(old.cardById['card.can'],undefined);
 assert.deepEqual(formsForCard('card.will',{registry:old}).map(f=>f.surface),['will']);
 const {snapshot}=analyzeCorridor('I can help you.');snapshot.orderedTokens[2].cardInstanceId=snapshot.orderedTokens[1].cardInstanceId;assert.equal(analyzeSentence(snapshot,r).status,'ENGINE_ERROR');
});
test('0.10 scoring deduplicates the same evidence and preserves independent predicates',()=>{
 const cases=[
 ['If I have time, I will help you.',['CORRIDOR.CONDITIONAL_REAL','TIME.FUTURE_WILL'],['LINK.CLAUSE']],
 ['If I had time, I would help you.',['CORRIDOR.UNREAL_PRESENT'],['TIME.PAST','TIME.FUTURE_WILL','LINK.CLAUSE']],
 ['I had read books when she came.',['CORRIDOR.PAST_PERFECT','TIME.PAST','LINK.CLAUSE'],['TIME.PERFECT']],
 ['If she had come, I would have been happy.',['CORRIDOR.UNREAL_PAST'],['CORRIDOR.PAST_PERFECT','CORRIDOR.UNREAL_PRESENT','TIME.PAST','TIME.PERFECT','LINK.CLAUSE']],
 ['I have been reading books.',['CORRIDOR.PRESENT_PERFECT_PROGRESSIVE'],['TIME.PERFECT','TIME.PROGRESSIVE']],
 ['I have been reading books and she has helped you.',['CORRIDOR.PRESENT_PERFECT_PROGRESSIVE','TIME.PERFECT','LINK.CLAUSE'],['TIME.PROGRESSIVE']]];
 for(const [text,yes,no]of cases){const {snapshot,analysis}=analyzeCorridor(text),eligible=scoreableAnalysis(analysis,{version:'0.10.0',unlocks:corridorUnlocks});
 const scored=scoreAttack(analysis,snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,baseScore:10})),{eligibleAnalysis:eligible});
 for(const id of yes)assert.equal(scored.events.filter(e=>e.sourceId===id).length,1,text+' '+id);
 for(const id of no)assert.equal(scored.events.filter(e=>e.sourceId===id).length,0,text+' '+id);
 assert.ok(analysis.grammarHits.length>=eligible.grammarHits.length);}
});
test('0.10 irrealis is local; no modal lemma shortcut, unlocked validity or auxiliary recovery bonus',()=>{
 assert.equal(analyzeCorridor('I were happy.').analysis.status,'VALID_WITH_ISSUES');
 for(const text of ['I would help you.','I could help you.']){const a=analyzeCorridor(text).analysis;assert.ok(!a.grammarHits.some(h=>['TIME.FUTURE_WILL','TIME.PAST'].includes(h.tag)));}
 const a=analyzeCorridor('If I had time, I would help you.').analysis;
 assert.equal(a.status,'VALID');assert.ok(!scoreableAnalysis(a,{version:'0.10.0',unlocks:[]}).grammarHits.some(h=>h.tag.startsWith('CORRIDOR.')));
 const ppc=analyzeCorridor('I have been reading books.').analysis;
 assert.ok(scoreableAnalysis(ppc,{version:'0.10.0',unlocks:['pack.time.perfect','pack.time.progressive']}).grammarHits.some(h=>h.tag==='CORRIDOR.PRESENT_PERFECT_PROGRESSIVE'));
 assert.ok(!scoreableAnalysis(ppc,{version:'0.10.0',unlocks:['pack.time.perfect']}).grammarHits.some(h=>h.tag.startsWith('CORRIDOR.')));
});
