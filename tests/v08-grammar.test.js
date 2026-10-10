import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registryForVersion} from '../src/data/language/index.js';
import {analyzeSentence,snapshotFromText} from '../src/engine/grammar/index.js';
const registry=registryForVersion('0.8.0');
const cases=JSON.parse(fs.readFileSync(new URL('./fixtures/v08/03_Grammar_Cases_0.8.json',import.meta.url))).cases;
const analyze=text=>analyzeSentence(snapshotFromText(text,{registry}),registry);
const sorted=xs=>[...xs].sort();
for(const c of cases)test(`0.8 grammar ${c.id}: ${c.sentence}`,()=>{
 const a=analyze(c.sentence),e=c.expected;
 assert.equal(a.status,e.status,JSON.stringify(a.diagnostics));
 const pronouns=(a.relativeClauses??[]).filter(r=>r.kind==='RELATIVE_PRONOUN');
 assert.deepEqual(sorted(pronouns.map(r=>r.relativeRole)),sorted(e.relativePronounRoles));
 assert.deepEqual(sorted(pronouns.filter(r=>r.bonusEligible).map(r=>r.relativeRole)),sorted(e.eligibleRelativePronounRoles));
 assert.deepEqual(sorted((a.relativeClauses??[]).filter(r=>r.kind==='RELATIVE_ADVERB').map(r=>r.adverbKind)),sorted(e.relativeAdverbKinds));
 assert.equal(Boolean(a.questionClauses?.length),e.directQuestion);
 assert.equal(Boolean(a.embeddedQuestions?.length),e.embeddedQuestion);
 if(e.mainFrame)assert.equal(a.mainFrameId?.startsWith('frame.svc')?'SVC':a.clauses.find(c=>c.id===a.mainClauseId)?.internalFrameId==='frame.beLocative'?'SV_LOCATION':a.mainFrameId?.slice(6).toUpperCase(),e.mainFrame);
 if(e.canUnlockSealIfPositivePower!==undefined){const ss=pronouns.filter(r=>r.bonusEligible&&r.relativeRole==='SUBJECT'),oo=pronouns.filter(r=>r.bonusEligible&&r.relativeRole==='OBJECT');assert.equal(ss.some(s=>oo.some(o=>o.nodeId!==s.nodeId)),e.canUnlockSealIfPositivePower);}
 if(a.status.startsWith('VALID')){
  const ids=new Set(snapshotFromText(c.sentence,{registry}).orderedTokens.map(t=>t.cardInstanceId));
  assert.equal(a.coverage.consumedCardIds.length,ids.size);
  for(const r of a.relativeClauses){assert.equal(r.rootSentenceId,'fixture');assert.ok(a.nodes.some(n=>n.id===r.nodeId));assert.ok(a.clauses.some(n=>n.id===r.childClauseId));assert.ok(r.finiteVerbCardIds.length);for(const id of r.cardIds)assert.ok(ids.has(id));if(r.markerOmitted)assert.equal(r.markerCardId,null);}
 }
});
test('0.8 question punctuation and actual physical snapshots agree; split sentences do not merge',()=>{
 for(const c of cases.filter(c=>c.id.startsWith('Q'))){const snap=snapshotFromText(c.sentence,{registry}),bare=analyze(c.sentence.replace(/[?]/g,'')),actual=structuredClone(snap);delete actual.fixtureCapabilityId;assert.equal(analyzeSentence(actual,registry).status,bare.status);}
 assert.equal(analyze('Who runs? I like books.').status,'INVALID_CORE');
 const old=registryForVersion('0.7.0');assert.equal(analyzeSentence(snapshotFromText('Do you like music?',{registry:old}),old).status,'UNSUPPORTED');
});
test('0.8 inverted VP excludes actual subject and preserves auxiliary/lexical forms',()=>{
 for(const sentence of ['Where are they working?','Where have you worked?','When was the food made?']){const snap=snapshotFromText(sentence,{registry}),a=analyzeSentence(snap,registry),q=a.questionClauses[0],subject=a.nodes.find(n=>n.id===q.subjectNodeId),vp=a.verbPhrases.find(v=>v.clauseId===q.clauseId);assert.ok(subject);assert.ok(vp);assert.ok(subject.cardIds.every(id=>!vp.cardIds.includes(id)));assert.ok(vp.verbCardIds.every(id=>snap.orderedTokens.find(t=>t.cardInstanceId===id)));}
});
test('0.8 structural generalization, local error isolation and finite relative identity',()=>{
 for(const text of ['The friends who play like the food we made.','A teacher who is working likes a book you read.','The child who I help runs.'])assert.equal(analyze(text).status,'VALID',text);
 const a=analyze('A child who runs like a book I made.');assert.equal(a.status,'VALID_WITH_ISSUES');assert.ok(a.relativeClauses.every(r=>r.bonusEligible));
 const b=analyze('A child who run likes a book I made.');assert.deepEqual(b.relativeClauses.map(r=>r.bonusEligible),[false,true]);
 assert.equal(analyze('The book which I made it is good.').status,'INVALID_CORE');
 assert.equal(analyze('The room where I like is good.').status,'INVALID_CORE');
});

test('0.8 current language preserves all 73 Ember and 45 operations-polish grammar expectations',()=>{
 for(const file of ['v07/04_Grammar_Cases_0.7.json','v061-03_Grammar_Cases_0.6.1.json'])for(const c of JSON.parse(fs.readFileSync(new URL('./fixtures/'+file,import.meta.url))).cases){
  const a=analyze(c.sentence),tags=a.grammarHits.map(h=>h.tag),label=c.id+': '+c.sentence;
  if(c.expectedStatus.startsWith('NON_VALID'))assert.ok(['INVALID_CORE','VALID_WITH_ISSUES','UNSUPPORTED'].includes(a.status),label);else assert.equal(a.status,c.expectedStatus,label);
  for(const tag of [...(c.requireTags??[]),...(c.expectedTags??[])])assert.ok(tags.includes(tag),label+' missing '+tag);
  for(const tag of [...(c.forbidTags??[]),...(c.forbiddenTags??[]),...(c.forbiddenComboTags??[]),...(c.forbiddenVPComboTags??[])])assert.ok(!tags.includes(tag),label+' unexpected '+tag);
  for(const tag of c.forbidScoreTags??[])assert.ok(!a.grammarHits.some(h=>h.tag===tag&&h.bonusEligible!==false&&h.validity==='VALID'),label);
  if(c.expectedMainFrame)assert.equal(a.mainFrameId,c.expectedMainFrame,label);
  if(c.schoolFrame)assert.equal(a.mainFrameId.startsWith('frame.svc')?'SVC':a.mainFrameId.slice(6).toUpperCase(),c.schoolFrame,label);
  if(c.requiredIssue)assert.equal(a.issues.filter(i=>i.code===c.requiredIssue).length,1,label);
 }
});
