import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {analyzeSentence,snapshotFromText} from '../src/engine/grammar/index.js';
import {registry,formsForCard,makeToken,createSentenceSnapshot} from '../src/data/language/index.js';
import {validateLanguageData} from '../tools/validate-data.js';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/grammar-cases.json',import.meta.url),'utf8'));
const analyze=text=>analyzeSentence(snapshotFromText(text));
for(const fixture of fixtures)test(`${fixture.id} ${fixture.sentenceForHumanReading}`,()=>{
 const snapshot=snapshotFromText(fixture.sentenceForHumanReading,{prefix:fixture.id,sentenceId:fixture.id});
 const original=JSON.stringify(snapshot);const result=analyzeSentence(snapshot);
 assert.equal(result.status,fixture.expectedStatus,JSON.stringify(result));assert.equal(result.mainFrameId,fixture.expectedMainFrame);
 assert.deepEqual(result.issues.map(issue=>issue.code),fixture.expectedIssueCodes);assert.equal(JSON.stringify(snapshot),original,'analysis must not mutate input');
 if(result.status.startsWith('VALID'))assert.deepEqual(result.coverage.consumedCardIds,snapshot.orderedTokens.map(t=>t.cardInstanceId));
 else assert.equal(result.grammarHits.length,0,'unsupported/invalid must not leak partial success');
});
test('Gate A registry references, capabilities, one-word forms and reward pools',()=>{const report=validateLanguageData();assert.equal(report.lexemes,116);assert.equal(report.runtimeLexemes,115);});
test('Generated unseen combinations compose each supported verb Frame',()=>{
 let count=0;
 for(const lex of registry.lexemes.filter(l=>l.pos==='VERB'))for(const binding of registry.senseById[lex.senseIds[0]].frameBindings){
  for(const subject of ['They','The children','Our teachers']) {
   const verb=lex.lemma==='be'?'are':lex.lemma;
   const suffix={'frame.sv':'carefully in the new park','frame.svo':'the very interesting stories with her','frame.svc.adj':'really happy','frame.svc.np':'the good friends','frame.beLocative':'in the room'}[binding.frameId];
   const sentence=`${subject} ${verb} ${suffix}`;
   const result=analyze(sentence);assert.equal(result.status,'VALID',`${sentence}: ${JSON.stringify(result)}`);assert.equal(result.mainFrameId,binding.frameId==='frame.beLocative'?'frame.sv':binding.frameId);count++;
  }
 }
 assert.ok(count>100);
});
test('Every active authored lexeme has a real composed usage witness',()=>{
 for(const lex of registry.lexemes){
  let sentence;
  if(lex.pos==='VERB'){
   const f=lex.frameIds[0];sentence=lex.lemma==='be'?'I am happy':`I ${lex.lemma}${f==='frame.svo'?' books':f==='frame.svc.adj'?' happy':f==='frame.svc.np'?' a teacher':''}`;
  }else if(lex.pos==='NOUN')sentence=`I like the ${lex.lemma}`;
  else if(lex.pos==='ADJECTIVE')sentence=`They are ${lex.lemma}`;
  else if(lex.pos==='ADVERB')sentence=lex.lemma==='very'?'She is very happy':lex.lemma==='recently'?'I run recently':registry.senseById[lex.senseIds[0]].adverbPolicy.positions.includes('PRE_VERB')?`They ${lex.lemma} read books`:`They read books ${lex.lemma}`;
  else if(lex.pos==='PRONOUN')sentence=`${lex.lemma} ${['he','she','it'].includes(lex.lemma)?'runs':'run'}`;
  else if(lex.lemma==='a'||lex.lemma==='the'||lex.lemma==='this'||lex.lemma==='that')sentence=`I like ${lex.lemma} book`;
  else sentence=`I run ${lex.lemma} the park`;
  const result=analyze(sentence);assert.equal(result.status,lex.runtimeReady?'VALID':'UNSUPPORTED',`${lex.id}: ${sentence} => ${JSON.stringify(result)}`);
 }
});
test('G26/G27 hidden same-surface selection never forces the wrong her role; his is normalized',()=>{
 for(const text of ['Her book is good','I like her'])for(const formId of ['form.she.object','form.she.possessive']){
  const snapshot=snapshotFromText(text);const token=snapshot.orderedTokens.find(t=>t.surface==='her');token.selectionId=formId;token.allowedFormCandidates=[formId];assert.equal(analyzeSentence(snapshot).status,'VALID');
 }
 assert.equal(analyze('His book is good').status,'VALID');assert.equal(analyze('I like his').status,'VALID');
});
test('Registered be locative needs a real location; school/home never gain unrestricted bare NP use',()=>{
 for(const sentence of ['She is in the park','They are at school','I am at home','I go home','They come home','He is home']){const r=analyze(sentence);assert.equal(r.status,'VALID',sentence);assert.equal(r.mainFrameId,'frame.sv');}
 for(const sentence of ['I read school','I like home'])assert.ok(analyze(sentence).issues.some(i=>i.code==='DETERMINER_REQUIRED'),sentence);
 for(const sentence of ['I am','She is very','I run home'])assert.equal(analyze(sentence).status,'INVALID_CORE',sentence);
});
test('G32 PP attachment alternatives normalize to one hit per actual PP',()=>{
 const r=analyze('I see the dog in the park');assert.equal(r.grammarHits.filter(h=>h.tag==='PHRASE.PP').length,1);assert.ok(r.ambiguities.length);
 const two=analyze('I see the dog in the park with her');assert.equal(two.status,'VALID');assert.equal(two.grammarHits.filter(h=>h.tag==='PHRASE.PP').length,2);
});
test('G20/G41 distinct very cards and invalid very exclusions remain physical-card based',()=>{
 const good=analyze('She is very very very happy');assert.equal(good.grammarHits.filter(h=>h.tag==='MODIFIER.ADVERB').length,3);
 const bad=analyze('I very very like dogs');assert.equal(bad.status,'VALID_WITH_ISSUES');assert.equal(bad.coverage.unlicensedCardIds.length,2);assert.equal(bad.grammarHits.filter(h=>h.tag==='MODIFIER.ADVERB').length,0);
});
test('Pronoun case and a/an/count/number diagnose single causes without fabricated words',()=>{
 for(const sentence of ['I like an useful book','I like a old book'])assert.deepEqual(analyze(sentence).issues.map(i=>i.code),['ARTICLE_FORM']);
 assert.equal(analyze('I like a useful book').status,'VALID');assert.equal(analyze('I like an old book').status,'VALID');
 assert.deepEqual(analyze('She likes a dogs').issues.map(i=>i.code),['DETERMINER_NUMBER_AGREEMENT']);
 assert.equal(analyze('The dog with the books runs').status,'VALID');assert.equal(analyze('The dogs with the book run').status,'VALID');
 assert.equal(analyze('She reads the book with he').issues[0].code,'PRONOUN_CASE');
});
test('Core order/required arguments are never repaired by insertion or rearrangement',()=>{
 for(const sentence of ['She dogs likes','The book the dog likes','I like','She happy','The dogs','I eat quickly the food','I run very','I like dogs book'])assert.equal(analyze(sentence).status,'INVALID_CORE',`${sentence}: ${JSON.stringify(analyze(sentence))}`);
});
test('Unsupported advanced grammar, past/progressive forms, unknown words and questions are not successes',()=>{
 for(const sentence of ['She made a book','She is reading a book','She gives me a book','I want to read','The book that I read is good','I run and she runs','I do not like dogs','Do I like dogs?','Run','I like zebras','She has read a book','She makes me happy','I am better'])assert.equal(analyze(sentence).status,'UNSUPPORTED',sentence);
 assert.ok(!formsForCard('card.read').some(f=>f.id==='form.read.ing'));
});
test('Forged input, duplicate physical IDs, bad registries and malformed snapshots are ENGINE_ERROR',()=>{
 const s=snapshotFromText('I run');s.orderedTokens[1].surface='made';assert.equal(analyzeSentence(s).status,'ENGINE_ERROR');
 const d=snapshotFromText('I run');d.orderedTokens[1].cardInstanceId=d.orderedTokens[0].cardInstanceId;assert.equal(analyzeSentence(d).status,'ENGINE_ERROR');
 assert.equal(analyzeSentence(null).status,'ENGINE_ERROR');assert.equal(analyzeSentence(snapshotFromText('I run'),{}).status,'ENGINE_ERROR');
 assert.equal(analyzeSentence(snapshotFromText('I run'),{...registry,frameById:{}}).status,'ENGINE_ERROR');
});
test('Token limit bounded at 16; repeated modifiers do not create exponential work',()=>{
 const sixteen=analyze(`She is ${Array(13).fill('very').join(' ')} happy`);assert.equal(sixteen.status,'VALID');assert.equal(sixteen.grammarHits.filter(h=>h.tag==='MODIFIER.ADVERB').length,13);
 assert.equal(analyze(`She is ${Array(14).fill('very').join(' ')} happy`).status,'UNSUPPORTED');
 assert.ok(sixteen.diagnostics.workUnits<12000);
});
test('Card ID snapshot builder isolates form selections from permanent CardInstance',()=>{
 const instances={p:{instanceId:'p',cardDefId:'card.she',polishLevel:0},v:{instanceId:'v',cardDefId:'card.run',polishLevel:2}};
 const snapshot=createSentenceSnapshot([{cardInstanceId:'p'},{cardInstanceId:'v',selection:{formId:'form.run.third'}}],instances);
 assert.equal(analyzeSentence(snapshot).status,'VALID');assert.equal(instances.v.formId,undefined);assert.equal(makeToken('one','card.a','form.a.an').surface,'an');
 assert.throws(()=>makeToken('bad','card.run','form.she.object'));
});
test('Grammar 2–16 card compute p95 remains below 100ms in this Node runtime',()=>{
 const corpus=['I run','She likes the big dog','I see the dog in the park with her',`She is ${Array(13).fill('very').join(' ')} happy`].map(t=>snapshotFromText(t));
 const timings=[];for(let i=0;i<240;i++){const start=performance.now();analyzeSentence(corpus[i%corpus.length]);timings.push(performance.now()-start);}
 timings.sort((a,b)=>a-b);const p50=timings[Math.floor(timings.length*.5)],p95=timings[Math.floor(timings.length*.95)];
 assert.ok(p95<100,`p95 ${p95}`);console.log(`grammar compute ms: p50=${p50.toFixed(3)} p95=${p95.toFixed(3)} samples=${timings.length}`);
});
test('Bounded AdvP recognizes degree plus manner/frequency without falsely excluding very',()=>{
 for(const sentence of ['I very carefully read books','She runs very quickly','I read very well','They run very very slowly','I very often run']){
  const r=analyze(sentence);assert.equal(r.status,'VALID',sentence);assert.equal(r.coverage.unlicensedCardIds.length,0);
 }
 for(const sentence of ['I very always read','I run very today'])assert.equal(analyze(sentence).status,'INVALID_CORE',sentence);
});

test('Future verb bindings recognize unsupported 4/5 patterns without activating them',()=>{
 for(const s of ['I make her a book','She reads me a story','I want her happy','I have the book ready','The book that I read'])assert.equal(analyze(s).status,'UNSUPPORTED',s);
});
const boundaryCases=[
 ['I am','INVALID_CORE'],['She is today','INVALID_CORE'],['She is very','INVALID_CORE'],['They are really','INVALID_CORE'],
 ['I am to school','INVALID_CORE'],['I am in','INVALID_CORE'],['She is with','INVALID_CORE'],['I run in the','INVALID_CORE'],
 ['I run with her very','INVALID_CORE'],['I go home book','INVALID_CORE'],['She is happy happy','INVALID_CORE'],['I like a the book','INVALID_CORE'],
 ['I very book like dogs','INVALID_CORE'],['I have read','UNSUPPORTED'],['They are read','UNSUPPORTED'],['I do run','UNSUPPORTED'],
 ['I see her reading','UNSUPPORTED'],['I need her to read','UNSUPPORTED'],['She shows me the book','UNSUPPORTED'],['I keep her happy','UNSUPPORTED'],
];
for(const [text,status]of boundaryCases)test(`Boundary: ${text} → ${status}, no partial success`,()=>{
 const result=analyze(text);assert.equal(result.status,status,JSON.stringify(result));assert.equal(result.mainFrameId,null);assert.equal(result.grammarHits.length,0);
});
test('Advanced tense form IDs never grant future grammar while same surface read retains a valid current analysis',()=>{
 const current=snapshotFromText('I read books');current.orderedTokens[1].selectionId='form.read.past';current.orderedTokens[1].allowedFormCandidates=['form.read.past'];
 assert.equal(analyzeSentence(current).status,'VALID');
 const past=snapshotFromText('She made a book');assert.equal(analyzeSentence(past).status,'UNSUPPORTED');
 assert.equal(analyzeSentence(past).grammarHits.length,0);
});
test('Full constituent/evidence references stay attached to physical cards after NP/PP ambiguity normalization',()=>{
 for(const text of ['The very happy teachers with her read the really interesting books in the park','I see the dog in the room with her','She is very very very happy']){
  const snapshot=snapshotFromText(text);const result=analyzeSentence(snapshot);assert.equal(result.status,'VALID',text);
  const ids=new Set(snapshot.orderedTokens.map(t=>t.cardInstanceId));const nodeIds=new Set(result.nodes.map(n=>n.id));
  assert.equal(result.resolvedTokenRoles.length,ids.size);
  for(const object of [...result.nodes,...result.grammarHits,...result.issues]){
   assert.ok(object.cardIds.every(id=>ids.has(id)));
   if(object.scopeNodeId)assert.ok(nodeIds.has(object.scopeNodeId));
   if(object.headCardId)assert.ok(ids.has(object.headCardId));
  }
  assert.equal(new Set(result.grammarHits.map(h=>h.evidenceKey)).size,result.grammarHits.length);
  assert.deepEqual(result,analyzeSentence(snapshot),'same complete input has identical normalized result');
 }
});
