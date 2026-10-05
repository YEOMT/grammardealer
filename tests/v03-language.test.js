import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registry,registryForVersion,makeToken} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {generateStarterDeck} from '../src/game/deck.js';
const design=JSON.parse(fs.readFileSync(new URL('./fixtures/v03-design-expectations.json',import.meta.url)));
for(const c of design.grammarCases)test(`0.3 ${c.id}: ${c.text}`,()=>{
 const snapshot=snapshotFromText(c.text);
 for(const [position,intent]of Object.entries(c.selectionOverrides??{})){
  const t=snapshot.orderedTokens[position],tense=intent==='PAST_SAME_SURFACE'?'PAST':intent;
  const form=registry.forms.find(f=>f.lexemeId===t.lexemeId&&f.surface.toLowerCase()===t.surface.toLowerCase()&&f.grammaticalFeatures.tense===tense);assert.ok(form);
  snapshot.orderedTokens[position]=makeToken(t.cardInstanceId,t.cardDefId,form.id,+position);
 }
 const a=analyzeSentence(snapshot),vp=a.verbPhrases?.find(v=>v.clauseId==='clause.main');
 assert.notEqual(a.status,'ENGINE_ERROR',JSON.stringify(a.diagnostics));assert.notEqual(a.status,'UNSUPPORTED',JSON.stringify(a.diagnostics));
 if(c.expectedStatus)assert.equal(a.status,c.expectedStatus);
 if(c.expectedNotCleanValid)assert.notEqual(a.status,'VALID');
 if(c.expectedMainFrame){const frame={SV:'frame.sv',SV_LOCATION:'frame.sv',SVC:'frame.svc',SVO:'frame.svo',SVOO:'frame.svoo'}[c.expectedMainFrame];assert.ok(a.mainFrameId===frame||frame==='frame.svc'&&a.mainFrameId.startsWith('frame.svc.'));}
 if(c.expectedMainFamily)assert.equal(vp?.tenseFamily,c.expectedMainFamily);
 if(c.expectedAspects)assert.deepEqual([...vp.aspects].sort(),[...c.expectedAspects].sort());
 if(c.expectedFiniteFamilySet)assert.deepEqual([...new Set(a.verbPhrases.filter(v=>v.temporalEvidenceEligible).map(v=>v.tenseFamily))].sort(),[...c.expectedFiniteFamilySet].sort());
 if(c.expectedTemporalEvidenceEligible!==undefined)assert.equal(vp.temporalEvidenceEligible,c.expectedTemporalEvidenceEligible);
 if(c.expectedAffectedTemporalEvidenceEligible===false)assert.equal(a.verbPhrases.some(v=>v.temporalEvidenceEligible),false);
 if(c.mustNotEmit)assert.equal(a.issues.some(i=>i.code==='ARTICLE_COUNTABILITY_MISMATCH'&&i.cardIds.some(id=>snapshot.orderedTokens.find(t=>t.cardInstanceId===id).cardDefId==='card.technology')),false);
 if(c.mustNotGrantPastFromNonfinite)assert.equal(a.grammarHits.some(h=>h.tag==='TIME.PAST'),false);
});
test('0.3 all 30 existing verb paradigms and will: forms belong to their physical card',()=>{
 const old=registryForVersion('0.2.2');assert.equal(old.lexemes.filter(l=>l.pos==='VERB'&&l.runtimeReady).length,30);
 for(const l of old.lexemes.filter(l=>l.pos==='VERB')){
  const n=registry.lexemeById[l.id];for(const suffix of ['ing','pp'])assert.ok(registry.formById[`form.${l.lemma}.${suffix}`].runtimeReady);
  for(const id of l.formIds)assert.ok(n.formIds.includes(id));
 }
 assert.equal(registry.formById['form.like.ing'].surface,'liking');assert.equal(registry.cardById['card.will'].starterEligible,false);
 assert.deepEqual(registry.lexemeById['lex.will.verb'].formIds,['form.will.base']);
});
const golden=JSON.parse(fs.readFileSync(new URL('./fixtures/v03-legacy-golden.json',import.meta.url)));
test('0.3 main VP is identified by its lexical head, not auxiliary offset or traversal order',()=>{
 const a=analyzeSentence(snapshotFromText('The book that she made will develop'));
 assert.equal(a.status,'VALID');assert.equal(a.verbPhrases.find(v=>v.clauseId==='clause.main').tenseFamily,'FUTURE');
 assert.deepEqual(new Set(a.verbPhrases.map(v=>v.tenseFamily)),new Set(['PAST','FUTURE']));
});
test('0.3 independent base golden: all legacy analyses and four starter deck/RNG streams identical',()=>{
 for(const c of golden.cases)assert.deepEqual(analyzeSentence(c.snapshot,registryForVersion(c.version)),c.analysis,`${c.version}: ${c.text}`);
 for(const c of golden.decks)assert.deepEqual(generateStarterDeck({seed:'v03.legacy.golden',vocabularyMode:c.vocabularyMode}),c.deck);
});
