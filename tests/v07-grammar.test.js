import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {registryForVersion,makeToken} from '../src/data/language/index.js';
import {analyzeSentence,snapshotFromText} from '../src/engine/grammar/index.js';
const r=registryForVersion('0.7.0'),cases=JSON.parse(fs.readFileSync(new URL('./fixtures/v07/04_Grammar_Cases_0.7.json',import.meta.url),'utf8')).cases;
const analyze=text=>analyzeSentence(snapshotFromText(text,{registry:r}),r);
for(const c of cases)test(`0.7 grammar ${c.id}: ${c.sentence}`,()=>{
 const a=analyze(c.sentence),tags=a.grammarHits.map(h=>h.tag);
 if(c.expectedStatus.startsWith('NON_VALID'))assert.ok(['INVALID_CORE','VALID_WITH_ISSUES','UNSUPPORTED'].includes(a.status),a.status);
 else assert.equal(a.status,c.expectedStatus,JSON.stringify(a.diagnostics));
 for(const tag of c.requireTags)assert.ok(tags.includes(tag),`missing ${tag}`);
 for(const tag of c.forbidTags)assert.ok(!tags.includes(tag),`unexpected ${tag}`);
 for(const tag of c.forbidScoreTags??[])assert.ok(!a.grammarHits.some(h=>h.tag===tag&&h.bonusEligible!==false&&h.validity==='VALID'));
 if(c.schoolFrame)assert.equal(a.mainFrameId.startsWith('frame.svc')?'SVC':a.mainFrameId.slice(6).toUpperCase(),c.schoolFrame);
 for(const relation of c.requireRelations??[]){const snapshot=snapshotFromText(c.sentence,{registry:r}),id=snapshot.orderedTokens.find(t=>t.surface.toLowerCase()===relation.form).cardInstanceId,target=snapshot.orderedTokens.find(t=>t.surface.toLowerCase()===relation.target).cardInstanceId;assert.ok(a.formUses.some(u=>u.formCardId===id&&u.function===relation.function&&u.targetHeadCardId===target));}
 if(['VALID','VALID_WITH_ISSUES'].includes(a.status))for(const u of a.formUses){assert.ok(u.sourceVerbSenseId);assert.ok(a.coverage.consumedCardIds.includes(u.formCardId));assert.ok(u.phraseCardIds.includes(u.formCardId));assert.ok(u.parentClauseId);}
});
test('0.7 passive surface frame retains lexical source frame and sense',()=>{for(const [text,surface,source]of [['Food is eaten.','frame.sv','frame.svo'],['She was given a book.','frame.svo','frame.svoo'],['A book was given to her.','frame.sv','frame.svoo'],['He was made to work.','frame.svc.adj','frame.svoc.bare']]){const a=analyze(text),c=a.clauses.find(c=>c.id===a.mainClauseId);assert.equal(c.frameId,surface);assert.equal(c.sourceFrameId,source);assert.equal(c.voice,'PASSIVE');assert.ok(r.senseById[c.sourceVerbSenseId].frameBindings.some(b=>b.frameId===source));}});
test('0.7 form evidence distinguishes physical past/pp homographs and independent adjectives',()=>{
 assert.equal(analyze('I made food.').formUses.length,0);assert.equal(analyze('I like interesting books.').formUses.length,0);
 assert.ok(analyze('I have made food.').formUses.some(u=>u.function==='PERFECT'&&u.resolvedMorphology==='PP'));
 assert.ok(analyze('I am gone.').formUses.some(u=>u.function==='SUBJECT_COMPLEMENT'&&u.resolvedMorphology==='PP'));
 const s=snapshotFromText('I read books.',{registry:r});s.orderedTokens[1]=makeToken('fixture.1','card.read','form.read.past',1,r);const a=analyzeSentence(s,r);assert.equal(a.formUses.length,0);assert.ok(a.grammarHits.some(h=>h.tag==='TIME.PAST'));
});
test('0.7 forms/cards stay physically identical to061; unrecognized version is rejected',()=>{const old=registryForVersion('0.6.1');assert.deepEqual(r.forms,old.forms);assert.deepEqual(r.cards,old.cards);assert.throws(()=>registryForVersion('0.8.0'));});
