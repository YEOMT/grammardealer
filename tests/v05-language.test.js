import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {campaign04Registry,campaign05Registry as registry,registryForVersion} from '../src/data/language/index.js';
import {isIngForm} from '../src/data/language/desertLanguage.js';
import {analyzeSentence,snapshotFromText} from '../src/engine/grammar/index.js';
import {roleRanges} from '../src/engine/learningRecords.js';
const cases=JSON.parse(fs.readFileSync(new URL('./fixtures/v05-grammar-expectations.json',import.meta.url))).items;
export const desertSnapshot=(text,overrides=[])=>{const s=snapshotFromText(text,{registry});for(const o of overrides)s.orderedTokens[o.tokenIndex].selectionId=o.formId;return s;};
export const desertAnalysis=(text,overrides=[])=>analyzeSentence(desertSnapshot(text,overrides),registry);
const frame=id=>id?.startsWith('frame.svc')?'SVC':id?.slice(6).toUpperCase()??null;
const tags=a=>a.grammarHits.map(h=>h.tag);
const role=a=>a.nonfinitePhrases??[];
const noUndefined=value=>{assert.notEqual(value,undefined);if(value&&typeof value==='object')for(const child of Object.values(value))noUndefined(child);};
for(const c of cases)test(`0.5 actual parser ${c.id}: ${c.sentence}`,()=>{
 const snapshot=desertSnapshot(c.sentence,c.selectedFormOverrides),a=analyzeSentence(snapshot,registry);
 assert.equal(a.status,c.status,JSON.stringify(a.diagnostics));assert.equal(frame(a.mainFrameId),c.mainFrame);
 for(const tag of c.expectedTags)assert.ok(tags(a).includes(tag),tag);
 for(const code of c.expectedIssues)assert.ok(a.issues.some(i=>i.code===code),code);
 for(const tag of c.forbiddenTags??[])assert.ok(!tags(a).includes(tag),tag);
 for(const code of c.forbiddenIssues??[])assert.ok(!a.issues.some(i=>i.code===code),code);
 if(a.status.startsWith('VALID')){assert.deepEqual(a.coverage.consumedCardIds,snapshot.orderedTokens.map(t=>t.cardInstanceId));assert.equal(new Set(a.coverage.consumedCardIds).size,snapshot.orderedTokens.length);assert.equal(a.primaryScoringClauseId,'clause.main');assert.ok(a.diagnostics.workUnits<=a.diagnostics.limits.work);noUndefined(a);}
});
test('0.5 uses one existing ING form with neutral morphology; will and fixed adjectives never gain verb roles',()=>{
 const golden=JSON.parse(fs.readFileSync(new URL('./fixtures/v05-legacy-040-golden.json',import.meta.url)));assert.equal(crypto.createHash('sha256').update(JSON.stringify(campaign04Registry)).digest('hex'),golden.registryHash);
 for(const lex of registry.lexemes.filter(l=>l.pos==='VERB'&&l.lemma!=='will')){const forms=lex.formIds.map(id=>registry.formById[id]).filter(isIngForm);assert.equal(forms.length,1,lex.lemma);assert.equal(forms[0].id,`form.${lex.lemma.toLowerCase()}.ing`);assert.equal(forms[0].labelKo,'-ing형');assert.equal(forms[0].morphologicalForm,'ING');assert.ok(!('interpretation'in forms[0]));if(campaign04Registry.lexemeById[lex.id])assert.equal(forms[0].surface,campaign04Registry.formById[forms[0].id].surface);}
 assert.equal(registry.lexemeById['lex.will.verb'].formIds.some(id=>isIngForm(registry.formById[id])),false);assert.equal(role(desertAnalysis('I have an interesting book')).length,0);
 assert.equal(registryForVersion('0.4.0'),campaign04Registry);
 for(const lemma of ['enjoy','finish','hobby']){const card=registry.cardById[`card.${lemma}`];assert.equal(card.rarity,'COMMON');assert.equal(card.starterEligible,false);assert.equal(card.rewardWeight,1);}
 assert.equal(registry.senseById['lex.hobby.noun.sense.basic'].countability,'COUNT');assert.equal(registry.formById['form.hobby.plural'].surface,'hobbies');
});
test('0.5 same reading form provides subject/object/complement/preposition object without leaking progressive',()=>{
 for(const [text,fn,span]of [['Reading books is good','SUBJECT',[0,1]],['I enjoy reading books','OBJECT',[2,3]],['My hobby is reading books','SUBJECT_COMPLEMENT',[3,4]],['I am good at reading books','PREPOSITION_OBJECT',[4,5]]]){
  const s=desertSnapshot(text),a=analyzeSentence(s,registry),n=role(a).find(n=>n.function===fn);assert.equal(n.interpretation,'GERUND');assert.deepEqual(n.cardIds,span.map(i=>`fixture.${i}`));assert.equal(s.orderedTokens[span[0]].selectionId,'form.read.ing');assert.ok(!tags(a).includes('TIME.PROGRESSIVE'));
 }
 assert.ok(tags(desertAnalysis('I am reading books')).includes('TIME.PROGRESSIVE'));assert.equal(role(desertAnalysis('I am reading books')).length,0);
 assert.equal(role(desertAnalysis('The running dog is happy'))[0].interpretation,'PARTICIPLE');assert.equal(role(desertAnalysis('I like the dog running in the park'))[0].interpretation,'PARTICIPLE');
});
test('0.5 reference graph separates outer SVOC object, complete complement, inner object and nonfinite VP',()=>{
 const a=desertAnalysis('I want you to read books'),main=a.clauses.find(c=>c.id==='clause.main'),node=id=>a.nodes.find(n=>n.id===id),inner=a.clauses.find(c=>c.role==='NONFINITE');
 assert.deepEqual(node(main.objectNodeId).cardIds,['fixture.2']);assert.deepEqual(node(main.objectComplementNodeId).cardIds,['fixture.3','fixture.4','fixture.5']);assert.deepEqual(node(inner.objectNodeId).cardIds,['fixture.5']);assert.equal(role(a)[0].controllerNodeId,main.objectNodeId);assert.equal(main.verbCardId,'fixture.1');assert.equal(inner.finite,false);assert.deepEqual(inner.finiteVerbCardIds,[]);
 for(const [text,vi]of [['Reading books is good',2],['To help you is important',3]]){const result=desertAnalysis(text),c=result.clauses.find(c=>c.id==='clause.main');assert.equal(c.verbCardId,`fixture.${vi}`);assert.ok(c.subjectNodeId);assert.ok(c.subjectComplementNodeId);}
});
test('0.5 object-complement phrase does not relabel its inner verb as an isolated complement',()=>{
 for(const [text,verbIndex,outerSpan]of [['I want you to read books',4,[3,4,5]],['I help you read books',3,[3,4]],['I need you to be reading books',4,[3,4,5,6]]]){
  const snapshot=desertSnapshot(text),a=analyzeSentence(snapshot,registry),ranges=roleRanges(a,snapshot),main=a.clauses.find(c=>c.id==='clause.main');
  assert.equal(a.status,'VALID');assert.equal(a.resolvedTokenRoles.find(r=>r.cardInstanceId===`fixture.${verbIndex}`).role,'NONFINITE_VERB');
  assert.deepEqual(a.nodes.find(n=>n.id===main.objectComplementNodeId).cardIds,outerSpan.map(i=>`fixture.${i}`));
  assert.equal(ranges.some(r=>r.role==='COMPLEMENT'&&r.cardIds.includes(`fixture.${verbIndex}`)),false);
  assert.ok(ranges.some(r=>r.role==='OBJECT_COMPLEMENT'&&r.cardIds.length===outerSpan.length));
 }
 const adjective=desertAnalysis('I make you happy');assert.equal(adjective.resolvedTokenRoles.find(r=>r.cardInstanceId==='fixture.3').role,'COMPLEMENT');
});
test('0.5 constituent wrappers preserve registered nonfinite interpretation priorities at every depth',()=>{
 for(const text of ['I want you to enjoy reading books','I need you to finish reading books','I want you to enjoy reading stories and playing games','Enjoying reading books is good','My hobby is enjoying reading books','I am good at enjoying reading books','To enjoy reading books is good','I know that you enjoy reading books','I run because she enjoys reading books','I enjoy reading books and she enjoys playing games']){
  const a=desertAnalysis(text);assert.equal(a.status,'VALID',text);assert.ok(tags(a).includes('CLAUSE.GERUND'),text);assert.ok(!tags(a).includes('PARTICIPLE.PRESENT'),text);assert.ok(!tags(a).includes('MODIFIER.ADJECTIVE'),text);
 }
 for(const text of ['I want you to be reading books','I need you to be playing games','To be reading books is good']){
  const a=desertAnalysis(text);assert.equal(a.status,'VALID',text);assert.ok(tags(a).includes('CLAUSE.INFINITIVE'));assert.ok(!tags(a).includes('CLAUSE.GERUND'),text);assert.ok(!tags(a).includes('TIME.PROGRESSIVE'),text);
 }
 const real=desertAnalysis('I want you to help the running dog');assert.equal(real.status,'VALID');assert.ok(tags(real).includes('PARTICIPLE.PRESENT'));assert.ok(!tags(real).includes('CLAUSE.GERUND'));
});
test('0.5 infinitive nominal, adjective, purpose and noun gap roles retain real physical spans',()=>{
 for(const [text,fn,gap]of [['To read books is good','SUBJECT',null],['My plan is to help you','SUBJECT_COMPLEMENT',null],['I need a book to read','NOUN_MODIFIER','OBJECT'],['I need a friend to play with','NOUN_MODIFIER','PREPOSITION_OBJECT'],['I go to school to read books','PURPOSE',null],['To help you I read books','PURPOSE',null],['I am ready to read','ADJECTIVE_COMPLEMENT',null]]){
  const a=desertAnalysis(text),n=role(a).find(n=>n.function===fn);assert.equal(a.status,'VALID');assert.ok(n,text);assert.equal(n.gapRole,gap);if(gap)assert.ok(a.nodes.some(x=>x.id===n.antecedentNodeId));
 }
 assert.equal(role(desertAnalysis('I go to school')).length,0);assert.equal(role(desertAnalysis('I give a book to you')).length,0);
 const post=desertAnalysis('I like the dog running in the park'),modifier=post.grammarHits.find(h=>h.tag==='MODIFIER.ADJECTIVE');assert.deepEqual(modifier.modifierCardIds,['fixture.4']);assert.deepEqual(modifier.targetCardIds,['fixture.3']);assert.ok(post.grammarHits.some(h=>h.tag==='PHRASE.PP'));
});
test('0.5 inner nonfinite auxiliaries do not grant finite tense; actual finite relative remains eligible',()=>{
 for(const text of ['I want to be reading books','I want to have read books','I enjoy having read books','Reading books is good','I enjoy being happy']){const a=desertAnalysis(text);assert.equal(a.status,'VALID',text);assert.ok(!tags(a).some(t=>t.startsWith('TIME.')),text);for(const vp of a.verbPhrases.filter(v=>v.finiteCardId===null))assert.equal(vp.temporalEvidenceEligible,false);}
 const a=desertAnalysis('I enjoy reading books that you gave me');assert.equal(a.status,'VALID');assert.ok(tags(a).includes('TIME.PAST'));assert.ok(tags(a).includes('CLAUSE.RELATIVE'));
});
test('0.5 form error recovery is local; outer agreement does not erase correct infinitive evidence',()=>{
 const bad=desertAnalysis('I want to reads books'),good=desertAnalysis('He want to read books');
 assert.equal(bad.issues.length,1);assert.equal(bad.issues[0].code,'INFINITIVE_BASE_REQUIRED');assert.equal(bad.grammarHits.find(h=>h.tag==='CLAUSE.INFINITIVE').validity,'RECOVERED');assert.equal(bad.grammarHits.find(h=>h.tag==='CLAUSE.INFINITIVE').bonusEligible,false);
 assert.equal(good.issues.length,1);assert.equal(good.grammarHits.find(h=>h.tag==='CLAUSE.INFINITIVE').validity,'VALID');assert.equal(good.grammarHits.find(h=>h.tag==='CLAUSE.INFINITIVE').bonusEligible,true);
 assert.equal(desertAnalysis('Reading books are good').issues.filter(i=>i.code==='SUBJECT_VERB_AGREEMENT').length,1);assert.equal(desertAnalysis('Reading books and playing games are good').issues.length,0);
});
test('0.5 registered valencies reject malformed complements rather than inserting or changing forms',()=>{
 for(const text of ['I enjoy to read books','I finish to read books','I enjoy read books','I want to give','I enjoy giving','To read books','Reading books','I to read books','I am strong to read books'])assert.equal(desertAnalysis(text).status,'INVALID_CORE',text);
 for(const text of ['I help you read books','I make you read books','I see you read books','I have you read books','I feel you work','I find you a good teacher','I keep you a good friend','The book needs reading','I like reading books','I like to read books'])assert.equal(desertAnalysis(text).status,'VALID',text);
});
test('0.5 compositional holdouts use new words, arbitrary registered nouns, nested and coordinated phrases',()=>{
 for(const text of ['They enjoy playing games','My teacher finishes reading stories','To help the children is important','My hobby is helping the teacher','I am happy to give you a book','I want them to develop a technology','I enjoy saying that you work','I want to enjoy playing games because they are interesting','I want to enjoy reading books that you gave me','The dog running in the room is happy','I enjoy reading stories and playing music']){const a=desertAnalysis(text);assert.equal(a.status,'VALID',text+' '+JSON.stringify(a.diagnostics));}
 for(const text of ['I enjoy reading books and playing games','I want to read books and play games']){const a=desertAnalysis(text);assert.ok(tags(a).includes('LINK.PHRASE'));assert.ok(!tags(a).includes('LINK.CLAUSE'));assert.ok(!tags(a).includes('PARTICIPLE.PRESENT'));}
});
test('0.5 repeated nested forms terminate within bounded work; no undefined references or synthesized words',()=>{
 for(const text of ['I want to want to want to want to want to read books','I enjoy enjoying enjoying enjoying enjoying enjoying reading books','Reading reading reading reading reading reading reading reading books']){const s=desertSnapshot(text),a=analyzeSentence(s,registry);assert.notEqual(a.status,'ENGINE_ERROR');assert.ok((a.diagnostics.workUnits??0)<=90000);if(a.status.startsWith('VALID'))assert.deepEqual(a.coverage.consumedCardIds,s.orderedTokens.map(t=>t.cardInstanceId));}
 const limited=desertAnalysis('I enjoy enjoying enjoying enjoying enjoying enjoying enjoying reading books');assert.equal(limited.status,'UNSUPPORTED');assert.equal(limited.diagnostics.limit,'NONFINITE_DEPTH');
});
test('0.5 representative roles are deterministic when registry arrays/index order change',()=>{
 const reverse=structuredClone(registry);for(const[k,v]of Object.entries(reverse)){if(Array.isArray(v))v.reverse();else if(v&&typeof v==='object')reverse[k]=Object.fromEntries(Object.entries(v).reverse());}
 for(const text of ['My hobby is reading books','I am reading books','I want you to read books','I enjoy reading books and playing games','I need a book to read']){const s=desertSnapshot(text);assert.deepEqual(analyzeSentence(s,reverse),analyzeSentence(s,registry),text);}
});
