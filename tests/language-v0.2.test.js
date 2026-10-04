import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,legacyRegistry,registryForVersion,makeToken,createSentenceSnapshot} from '../src/data/language/index.js';
import {analyzeSentence} from '../src/engine/grammar/index.js';
import {resolveAttack} from '../src/engine/stage.js';
import {STAGE1,STAGE2} from '../src/data/stages.js';
import {BASIC_RUNE_IDS,eligibleRuneDefinitions} from '../src/data/runes.js';
import {meaningPreview} from '../src/engine/meaning.js';

// Each entry is an independent physical card and an explicit registered form, never an answer-string lookup.
const S=['she','subject'],I=['i','subject'],ME=['i','object'],A=['a','a'],BOOK=['book','singular'];
const tokens=entries=>({schemaVersion:1,sentenceId:'v02.cards',languageVersion:'0.2.0',orderedTokens:entries.map(([card,form],position)=>makeToken(`v02.${position}`,`card.${card}`,`form.${card}.${form}`,position))});
const analyze=entries=>analyzeSentence(tokens(entries));
const basic=[S,['give','third'],ME,A,BOOK];
const cases=[
 ['She gives me a book',basic],
 ['I give my friend a book',[I,['give','present'],['i','possessive'],['friend','singular'],A,BOOK]],
 ['My friend gives me a good book',[['i','possessive'],['friend','singular'],['give','third'],ME,A,['good','base'],BOOK]],
 ['They show us the book',[['they','subject'],['show','present'],['we','object'],['the','base'],BOOK]],
 ['She sends me a book',[S,['send','third'],ME,A,BOOK]],
 ['She makes me a game',[S,['make','third'],ME,A,['game','singular']]],
 ['The book gives the dog a picture',[['the','base'],BOOK,['give','third'],['the','base'],['dog','singular'],A,['picture','singular']]],
];
for(const [name,entries] of cases)test(`0.2 SVOO: ${name}`,()=>{
 const snapshot=tokens(entries),before=structuredClone(snapshot),result=analyzeSentence(snapshot);
 assert.equal(result.status,'VALID',JSON.stringify(result));assert.equal(result.mainFrameId,'frame.svoo');
 assert.deepEqual(result.coverage.consumedCardIds,snapshot.orderedTokens.map(t=>t.cardInstanceId));
 assert.equal(result.grammarHits.filter(h=>h.tag==='FRAME.SVOO').length,1);
 assert.equal(result.resolvedTokenRoles.filter(r=>r.role==='INDIRECT_OBJECT').length,1);
 assert.equal(result.resolvedTokenRoles.filter(r=>r.role==='DIRECT_OBJECT').length,1);
 assert.deepEqual(snapshot,before);
});
test('SVOO IO and DO nodes keep complete modified NP boundaries and distinct heads',()=>{
 const entries=[I,['give','present'],['i','possessive'],['good','base'],['friend','singular'],A,['very','base'],['good','base'],BOOK];
 const result=analyze(entries),clause=result.clauses[0];assert.equal(result.status,'VALID');
 const io=result.nodes.find(n=>n.id===clause.indirectObjectNodeId),object=result.nodes.find(n=>n.id===clause.directObjectNodeId);
 assert.deepEqual(io.cardIds,['v02.2','v02.3','v02.4']);assert.equal(io.headCardId,'v02.4');
 assert.deepEqual(object.cardIds,['v02.5','v02.6','v02.7','v02.8']);assert.equal(object.headCardId,'v02.8');
 assert.equal(result.resolvedTokenRoles.length,entries.length);
});
for(const [name,entries,code] of [
 ['agreement',[S,['give','present'],ME,A,BOOK],'SUBJECT_VERB_AGREEMENT'],
 ['IO case',[S,['give','third'],I,A,BOOK],'PRONOUN_CASE'],
 ['DO case',[S,['give','third'],ME,['he','subject']],'PRONOUN_CASE'],
 ['missing article',[S,['give','third'],ME,BOOK],'DETERMINER_REQUIRED'],
 ['article number',[S,['give','third'],ME,A,['book','plural']],'DETERMINER_NUMBER_AGREEMENT'],
])test(`SVOO single recovered cause: ${name}`,()=>{
 const result=analyze(entries);assert.equal(result.status,'VALID_WITH_ISSUES');assert.equal(result.mainFrameId,'frame.svoo');
 assert.deepEqual(result.issues.map(i=>i.code),[code]);assert.equal(result.grammarHits.find(h=>h.tag==='FRAME.SVOO').validity,'RECOVERED');
});
const alternations=[
 ['give','to',BOOK],['show','to',BOOK],['send','to',BOOK],['make','for',['game','singular']],
];
for(const [verb,prep,object] of alternations)test(`Registered ${verb} + ${prep} remains SVO with one PP`,()=>{
 const result=analyze([S,[verb,'third'],A,object,[prep,'base'],ME]);assert.equal(result.status,'VALID');assert.equal(result.mainFrameId,'frame.svo');
 assert.equal(result.grammarHits.filter(h=>h.tag==='PHRASE.PP').length,1);assert.equal(result.structures.length,1);
 assert.equal(result.structures[0].kind,'DATIVE_ALTERNATION');assert.equal(result.structures[0].preposition,prep);
 assert.ok(!result.grammarHits.some(h=>h.tag==='FRAME.SVOO'));
});
test('Other valid PP use is retained without falsely claiming a registered alternation',()=>{
 const result=analyze([S,['give','third'],A,BOOK,['for','base'],ME]);assert.equal(result.status,'VALID');
 assert.equal(result.mainFrameId,'frame.svo');assert.deepEqual(result.structures,[]);
 assert.equal(result.grammarHits.filter(h=>h.tag==='PHRASE.PP').length,1);
});
for(const [name,entries,status,cap] of [
 ['unregistered like SVOO',[I,['like','present'],['you','object'],A,BOOK],'INVALID_CORE'],
 ['extra unconsumed NP',[...basic,A,['dog','singular']],'INVALID_CORE'],
 ['make SVOC',[S,['make','third'],ME,['happy','base']],'UNSUPPORTED','cap.svoc'],
 ['to infinitive',[I,['want','present'],['to','base'],['read','present']],'UNSUPPORTED','cap.infinitive'],
 ['relative',[['the','base'],BOOK,['that','base'],I,['read','present'],['be','is'],['good','base']],'UNSUPPORTED','cap.relative'],
 ['explicit past give',[S,['give','past'],ME,A,BOOK],'UNSUPPORTED','cap.past'],
 ['future read SVOO',[S,['read','third'],ME,A,BOOK],'UNSUPPORTED','cap.svoo'],
])test(`0.2 still refuses ${name}`,()=>{
 const result=analyze(entries);assert.equal(result.status,status,JSON.stringify(result));assert.equal(result.mainFrameId,null);assert.deepEqual(result.grammarHits,[]);
 if(cap)assert.equal(result.diagnostics.capabilityId,cap);
});
test('Current scope activates only the four curated SVOO verbs; legacy pools and starter cards stay separate',()=>{
 const svoo=registry.lexemes.filter(l=>registry.senseById[l.senseIds[0]].frameBindings.some(b=>b.frameId==='frame.svoo')).map(l=>l.lemma).sort();
 assert.deepEqual(svoo,['give','make','send','show']);assert.equal(legacyRegistry.lexemes.length,116);
 assert.equal(registryForVersion('0.1.0'),legacyRegistry);assert.equal(registryForVersion('0.1.1'),legacyRegistry);assert.equal(registryForVersion('0.2.0'),registry);
 assert.deepEqual(registry.cards.filter(c=>c.starterEligible),legacyRegistry.cards.filter(c=>c.starterEligible));
 for(const id of ['send','for','picture']){assert.ok(registry.cardById[`card.${id}`].runtimeReady);assert.equal(registry.cardById[`card.${id}`].starterEligible,false);assert.equal(legacyRegistry.cardById[`card.${id}`],undefined);}
 assert.equal(registry.cardById['card.send'].rarity,'UNCOMMON');assert.equal(registry.cardById['card.for'].rarity,'COMMON');
 assert.equal(analyzeSentence(tokens(basic),legacyRegistry).status,'UNSUPPORTED');assert.equal(analyze(basic).status,'VALID');
 assert.ok(Object.isFrozen(legacyRegistry));assert.ok(Object.isFrozen(registry));
});
test('SVOO with PP, adverb and homograph forms remains bounded and evidence is unique',()=>{
 const long=[S,['give','third'],['she','possessive'],A,BOOK,['with','base'],['you','subject'],['very','base'],['quickly','base']];
 const result=analyze(long);assert.equal(result.status,'VALID');assert.equal(result.mainFrameId,'frame.svoo');
 assert.equal(result.grammarHits.filter(h=>h.tag==='PHRASE.PP').length,1);assert.equal(result.resolvedTokenRoles.find(r=>r.cardInstanceId==='v02.2').role,'INDIRECT_OBJECT');
 const sixteen=[...basic,...Array.from({length:10},()=>['very','base']),['quickly','base']];
 const maximum=analyze(sixteen);assert.equal(maximum.status,'VALID');assert.ok(maximum.diagnostics.workUnits<12000);assert.ok(maximum.diagnostics.candidateCount<=128);
 assert.equal(analyze([...sixteen,['today','base']]).status,'UNSUPPORTED');
 assert.equal(new Set(result.grammarHits.map(h=>h.evidenceKey)).size,result.grammarHits.length);
});
function resolve(entries,{level=0,stage=STAGE2,runes=null}={}) {
 const sentenceSnapshot=tokens(entries),analysis=analyzeSentence(sentenceSnapshot);
 return resolveAttack({attackId:'v02.numeric',sentenceSnapshot,analysis,stage,enemy:{hp:10000,hpMax:10000,kind:'NORMAL'},
  cards:sentenceSnapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,baseScore:10,polishLevel:0})),
  equippedRunes:runes??(level?[{runeId:'rune.svoo',level}]:[])});
}
for(const [level,power] of [[0,175],[1,262],[2,350],[3,437]])test(`Exact SVOO → Topaz Lv${level} → Stage2 arithmetic is ${power}`,()=>{
 const result=resolve(basic,{level});assert.equal(result.preRuneScore,140);assert.equal(result.finalPower,power);
 assert.equal(result.scoreTimeline.filter(e=>e.phase==='MAIN_FRAME').length,1);assert.equal(result.scoreTimeline.filter(e=>e.phase==='REGION').length,1);
 assert.equal(result.scoreTimeline.filter(e=>e.sourceId==='rune.svoo').length,level?1:0);
});
test('SVOO errors retain frame/rune eligibility, alternations stay 130, SVC stays 60 and Stage1 SVOO stays 140',()=>{
 const recovered=[S,['give','present'],ME,A,BOOK];assert.equal(resolve(recovered).finalPower,100);assert.equal(resolve(recovered,{level:1}).finalPower,150);
 const pp=[S,['give','third'],A,BOOK,['to','base'],ME],plain=resolve(pp),topaz=resolve(pp,{level:3});
 assert.equal(plain.finalPower,130);assert.equal(topaz.finalPower,130);
 assert.equal(topaz.scoreTimeline.filter(e=>e.sourceId==='rune.svoo'||e.phase==='REGION').length,0);
 assert.equal(topaz.scoreTimeline.filter(e=>e.sourceId==='PHRASE.PP').length,1);
 assert.equal(resolve([S,['be','is'],['happy','base']]).finalPower,60);assert.equal(resolve(basic,{stage:STAGE1}).finalPower,140);
});
test('Topaz follows stored rune order and normalized duplicate evidence never pays twice',()=>{
 const crystal={runeId:'rune.perfectSentence',level:1},topaz={runeId:'rune.svoo',level:1};
 assert.equal(resolve(basic,{runes:[crystal,topaz]}).finalPower,300);assert.equal(resolve(basic,{runes:[topaz,crystal]}).finalPower,287);
 const snapshot=tokens([S,['give','third'],A,BOOK,['to','base'],ME]),analysis=analyzeSentence(snapshot);
 analysis.grammarHits.push(...structuredClone(analysis.grammarHits));
 const result=resolveAttack({analysis,stage:STAGE2,enemy:{hp:1000},cards:snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId}))});
 assert.equal(result.finalPower,130);assert.equal(result.scoreTimeline.filter(e=>e.sourceId==='PHRASE.PP').length,1);
});
test('Topaz candidate eligibility comes from this current run, never runtimeReady alone',()=>{
 const run={version:'0.2.0',eligibility:{runStartUnlockBaseline:[],runOwnUnlocks:[]}};
 assert.deepEqual(eligibleRuneDefinitions(run).map(r=>r.id),BASIC_RUNE_IDS);
 run.eligibility.runOwnUnlocks.push('rune.svoo');assert.equal(eligibleRuneDefinitions(run).length,11);
 run.eligibility={runStartUnlockBaseline:['rune.svoo'],runOwnUnlocks:[]};assert.equal(eligibleRuneDefinitions(run).length,11);
 run.version='0.1.1';assert.deepEqual(eligibleRuneDefinitions(run).map(r=>r.id),BASIC_RUNE_IDS);
});
test('SVOO Korean aids use IO/DO, preserve possessive meaning and fall back on uncertain/error cases',()=>{
 const expected={give:'준다',show:'보여준다',send:'보낸다',make:'만들어 준다'};
 for(const [verb,ending] of Object.entries(expected)){
  const snapshot=tokens([S,[verb,'third'],ME,A,BOOK]),analysis=analyzeSentence(snapshot),before=structuredClone(analysis),hint=meaningPreview(analysis,snapshot);
  assert.equal(hint.status,'COMPLETE_HINT');assert.equal(hint.textKo,`그녀는 나에게 책을 ${ending}.`);
  assert.deepEqual(hint.segments.map(s=>s.label),['주어','행동','간접목적어 IO','직접목적어 DO']);assert.deepEqual(analysis,before);
 }
 const modified=tokens([I,['give','present'],['i','possessive'],['friend','singular'],A,['good','base'],BOOK]);
 assert.equal(meaningPreview(analyzeSentence(modified),modified).textKo,'나는 나의 친구에게 좋은 책을 준다.');
 for(const entries of [[S,['give','present'],ME,A,BOOK],[...basic,['in','base'],['the','base'],['park','singular']]]){
  const snapshot=tokens(entries);assert.equal(meaningPreview(analyzeSentence(snapshot),snapshot).status,'PARTIAL_HINT');
 }
});
test('Sentence snapshots carry the explicit language context without changing form selection',()=>{
 const cards={i:{instanceId:'i',cardDefId:'card.i'},v:{instanceId:'v',cardDefId:'card.run'}};
 const slots=[{cardInstanceId:'i'},{cardInstanceId:'v'}];
 assert.equal(createSentenceSnapshot(slots,cards).languageVersion,'0.2.0');
 assert.equal(createSentenceSnapshot(slots,cards,{languageVersion:'0.1.1'}).languageVersion,'0.1.1');
});
