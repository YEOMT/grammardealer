import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {registryForVersion,createSentenceSnapshot} from '../src/data/language/index.js';
import {analyzeSentence,snapshotFromText} from '../src/engine/grammar/index.js';
const registry=registryForVersion('0.4.0'),cases=JSON.parse(fs.readFileSync(new URL('./fixtures/v04-grammar-expectations.json',import.meta.url))).cases;
const analyze=text=>analyzeSentence(snapshotFromText(text,{registry}),registry);
const frame=id=>({'frame.svc.adj':'SVC','frame.svc.np':'SVC','frame.sv':'SV','frame.svo':'SVO','frame.svoo':'SVOO'})[id];
test('0.4 all pre-existing noun countability, senses and forms preserve the 0.3 records',()=>{const old=registryForVersion('0.3.0');for(const noun of old.lexemes.filter(l=>l.pos==='NOUN')){assert.deepEqual(registry.lexemeById[noun.id],noun);for(const id of noun.senseIds)assert.deepEqual(registry.senseById[id],old.senseById[id]);for(const id of noun.formIds)assert.deepEqual(registry.formById[id],old.formById[id]);}});
test('0.4 representative analyses ignore registry collection and index insertion order',()=>{
 const reversed=structuredClone(registry);for(const [key,value] of Object.entries(reversed)){if(Array.isArray(value))value.reverse();else if(value&&typeof value==='object')reversed[key]=Object.fromEntries(Object.entries(value).reverse());}
 for(const text of ['I have read books and she had read books','I think that she likes that book','The book that I read is good and she works','I like music and she likes books']){const s=snapshotFromText(text,{registry});assert.deepEqual(analyzeSentence(s,reversed),analyzeSentence(s,registry),text);}
});
for(const c of cases)test(`0.4 real parser ${c.id}: ${c.text}`,()=>{
 const a=analyze(c.text);assert.equal(a.status,c.expected_status,JSON.stringify(a.diagnostics));if(c.primary_scoring_frame)assert.equal(frame(a.mainFrameId),c.primary_scoring_frame);
 const links=a.grammarHits.filter(h=>h.tag==='LINK.CLAUSE');assert.equal(links.some(h=>h.connectorCardIds.length>0),c.shield_release_with_active_shield);
 if(c.new_relation==='PHRASE_COORDINATION')assert.ok(a.grammarHits.some(h=>h.tag==='LINK.PHRASE'));
 if(c.expected_status!=='INVALID_CORE'){const s=snapshotFromText(c.text,{registry});assert.equal(s.orderedTokens.length,c.word_count);assert.deepEqual(a.coverage.consumedCardIds,s.orderedTokens.map(t=>t.cardInstanceId));assert.equal(a.coverage.unlicensedCardIds.length,0);assert.equal(a.clauses.filter(x=>x.id===a.mainScoreClauseId).length,1);}
});
test('0.4 compositional holdouts: arbitrary registered words, roles, PP/AdvP coordination and tense chains',()=>{
 for(const text of ['My teacher works but their friends read stories','I give you a book and she gives me a game','The children and I have been working','He or they work','They or he works','I like him and her','I am in the room and at school','He works slowly and carefully','I will have read books because she will be working','Because she is working you and I read books','They know you help the child','I think','I know']){
  const a=analyze(text);assert.equal(a.status,'VALID',text+' '+JSON.stringify(a.diagnostics));
 }
 for(const text of ['I run because she likes','I think that she likes and you work','I run and because she works','Because she works and you play games','I run books and music','She is happy and the book','I like music and she','I say her that you work'])assert.equal(analyze(text).status,'INVALID_CORE',text);
});
test('0.4 explicit physical that roles and content-object nesting are independent',()=>{
 const a=analyze('I think that she likes that book');assert.equal(a.status,'VALID');const thatRoles=a.resolvedTokenRoles.filter(r=>['fixture.2','fixture.5'].includes(r.cardInstanceId));assert.deepEqual(thatRoles.map(r=>r.role),['CLAUSE_CONNECTOR','DETERMINER']);
 const main=a.clauses.find(c=>c.id==='clause.main'),inner=a.clauses.find(c=>c.id!==main.id);assert.equal(main.frameId,'frame.svo');assert.equal(inner.frameId,'frame.svo');assert.equal(inner.parentClauseId,main.id);assert.equal(inner.role,'CONTENT_OBJECT');const object=a.nodes.find(n=>n.id===main.objectNodeId);assert.equal(object.type,'CONTENT_CLAUSE');assert.deepEqual(object.cardIds,['fixture.2','fixture.3','fixture.4','fixture.5','fixture.6']);
 const coordinated=analyze('I run and you work and she plays games');assert.equal(coordinated.clauses.length,3);assert.deepEqual(coordinated.clauses.map(c=>c.frameId),['frame.sv','frame.sv','frame.svo']);assert.equal(coordinated.clauses.some(c=>c.role==='ADVERBIAL'||c.parentClauseId!==null),false);
});
test('0.4 know usage issue removes only its progressive evidence, never the valid linked clause',()=>{
 const a=analyze('I am knowing that she is working');assert.equal(a.status,'VALID_WITH_ISSUES');assert.equal(a.issues.filter(i=>i.code==='ASPECT_USAGE').length,1);assert.equal(a.grammarHits.filter(h=>h.tag==='TIME.PROGRESSIVE').length,1);assert.ok(a.grammarHits.some(h=>h.tag==='LINK.CLAUSE'));
 for(const text of ['I am thinking','I am having a book'])assert.equal(analyze(text).issues.some(i=>i.code==='ASPECT_USAGE'),false);
});
test('0.4 16 physical tokens are bounded; no fake connector or duplicate instance is synthesized',()=>{
 const text='I have been reading the book and she will have been playing games with the children';const snapshot=snapshotFromText(text,{registry});assert.equal(snapshot.orderedTokens.length,16);const a=analyzeSentence(snapshot,registry);assert.equal(a.status,'VALID',JSON.stringify(a.diagnostics));assert.ok(a.diagnostics.workUnits<=a.diagnostics.limits.work);assert.equal(new Set(a.coverage.consumedCardIds).size,16);
 const corrupt=structuredClone(snapshot);corrupt.orderedTokens[5].cardInstanceId=corrupt.orderedTokens[0].cardInstanceId;assert.equal(analyzeSentence(corrupt,registry).status,'ENGINE_ERROR');
 const old=registryForVersion('0.3.0');assert.equal(analyzeSentence(snapshotFromText('I work and you play games',{registry:old}),old).status,'UNSUPPORTED');
});
