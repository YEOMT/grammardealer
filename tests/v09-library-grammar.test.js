import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {registryForVersion} from '../src/data/language/index.js';
import {analyzeSentence,snapshotFromText} from '../src/engine/grammar/index.js';
import {libraryTargetEvidence} from '../src/engine/libraryEvidence.js';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/v09/Syntax_Atlas_0.9_Test_Fixtures.json',import.meta.url)));
const registry=registryForVersion('0.9.0');
export const analyzeLibrary=text=>analyzeSentence(snapshotFromText(text,{registry}),registry);
for(const f of fixtures.grammar)test('0.9 '+f.id+' '+f.sentence,()=>{
 const a=analyzeLibrary(f.sentence),target=libraryTargetEvidence(a);
 assert.notEqual(a.status,'ENGINE_ERROR',JSON.stringify(a.diagnostics));
 if(['TARGET_VALID','TARGET_VALID_ONCE','PRESERVE_AND_QUALIFY_IF_ALREADY_SUPPORTED'].includes(f.expectation)){assert.equal(a.status,'VALID');assert.ok(target.length,JSON.stringify(a));if(f.expectation==='TARGET_VALID_ONCE')assert.equal(target.length,1);}
 else {assert.equal(target.length,0);if(f.expectation==='VALID_NON_TARGET')assert.equal(a.status,'VALID');if(['NO_TARGET_EVIDENCE','NO_VALID_TARGET_EVIDENCE'].includes(f.expectation))assert.ok(['INVALID_CORE','VALID_WITH_ISSUES'].includes(a.status),f.id+': malformed target must not be a clean VALID sentence');}
 if(a.status.startsWith('VALID'))assert.equal(a.coverage.consumedCardIds.length,snapshotFromText(f.sentence,{registry}).orderedTokens.length);
 if(f.classification==='HELP_MASS_NOUN')assert.ok(!a.grammarHits.some(h=>h.tag.startsWith('COMPARISON.')));
});
test('0.9 nominal what is not an adnominal relative or duplicate score multiplier',()=>{
 const a=analyzeLibrary('I know what you need.');assert.equal(a.status,'VALID');assert.equal(libraryTargetEvidence(a).length,1);assert.equal(a.relativeClauses.length,0);assert.ok(!a.grammarHits.some(h=>h.tag.startsWith('CLAUSE.RELATIVE')));
});
test('0.9 target errors are local to the clause rather than all-or-none partial validity',()=>{
 const outside=analyzeLibrary('I very know whether you are happy.');assert.equal(outside.status,'VALID_WITH_ISSUES');assert.equal(libraryTargetEvidence(outside).length,1);
 const inside=analyzeLibrary('I know whether she like music.');assert.equal(inside.status,'VALID_WITH_ISSUES');assert.equal(libraryTargetEvidence(inside).length,0);
 for(const s of ['It are good to read books.','It is happy to read books.','I run whether you are happy.','The book what I need is good.'])assert.equal(libraryTargetEvidence(analyzeLibrary(s)).length,0,s);
});

test('0.9 a nominal subject shares its marker with outer agreement without inheriting that outer error',()=>{
 const a=analyzeLibrary('What I need are water.');assert.equal(a.status,'VALID_WITH_ISSUES');assert.equal(libraryTargetEvidence(a).length,1);
 const inner=analyzeLibrary('What she need is water.');assert.equal(inner.status,'VALID_WITH_ISSUES');assert.equal(libraryTargetEvidence(inner).length,0);
});

test('0.9 current grammar retains the 306 independently captured pre-library regression cases',()=>{
 const baseline=JSON.parse(fs.readFileSync(new URL('./fixtures/v081/grammar-audit-baseline.json',import.meta.url)));
 for(const c of baseline.cases){const a=analyzeLibrary(c.text);assert.deepEqual({status:a.status,frame:a.mainFrameId,tags:a.grammarHits.map(h=>h.tag),issues:a.issues.map(i=>i.code),covered:a.coverage.consumedCardIds},c.expected,c.file+': '+c.text);}
});
