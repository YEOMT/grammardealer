import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {registryForVersion} from '../src/data/language/index.js';
import {resolveAttack} from '../src/engine/stage.js';
import {getEncounter,stageForRun} from '../src/data/stages.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('./fixtures/'+name,import.meta.url)));
const cases=read('v061-03_Grammar_Cases_0.6.1.json').cases;
const language=registryForVersion('0.6.1');
const packs=['pack.svoo','pack.clauseLink','pack.time.past','pack.time.progressive','pack.time.perfect','pack.time.futureWill','pack.svoc.basic','pack.infinitive','pack.gerund','pack.comparison','pack.degree'];
const parse=text=>{const snapshot=snapshotFromText(text,{registry:language});return {snapshot,analysis:analyzeSentence(snapshot,language)};};
const attack=(text,{stageId='stage.06',unlocks=packs,frostToo=false}={})=>{
 const {snapshot:sentenceSnapshot,analysis}=parse(text),stage=stageForRun({version:'0.6.1',progress:{stageId}}),enemy=getEncounter(stageId,stageId==='stage.02'?3:frostToo?4:0,'0.6.1');
 const cards=sentenceSnapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:0}));
 const too=cards.find(c=>c.cardDefId==='card.too');
 const temporaryCardMeta=frostToo?{[too.instanceId]:{source:'MIRROR_SNOWFIELD',battleId:enemy.id,cardDefId:too.cardDefId,cardKind:'WORD',crystalBearing:true}}:{};
 return resolveAttack({sentenceSnapshot,analysis,stage,enemy,policyVersion:'0.6.1',cards,temporaryCardMeta,battleId:enemy.id,comboEligibility:{version:'0.6.0',unlocks}});
};
for(const f of cases)test(`0.6.1 actual grammar ${f.id}: ${f.sentence}`,()=>{
 const {snapshot,analysis:a}=parse(f.sentence),tokens=snapshot.orderedTokens,ids=tokens.map(t=>t.cardInstanceId);
 assert.equal(language.version,'0.6.1');assert.equal(a.status,f.expectedStatus,JSON.stringify(a.diagnostics));
 assert.equal(tokens.length,f.expectedCardCount);assert.ok(tokens.every(t=>language.cardById[t.cardDefId]));
 if(f.expectedMainFrame)assert.equal(a.mainFrameId,f.expectedMainFrame);
 for(const tag of f.expectedTags??[])assert.ok(a.grammarHits.some(h=>h.tag===tag),tag);
 for(const tag of [...(f.forbiddenTags??[]),...(f.forbiddenComboTags??[]),...(f.forbiddenVPComboTags??[])])assert.ok(!a.grammarHits.some(h=>h.tag===tag),tag);
 if(f.requiredIssue)assert.equal(a.issues.filter(i=>i.code===f.requiredIssue).length,1);
 if(f.gapRole){
  const n=a.nonfinitePhrases.find(n=>n.gapRole===f.gapRole),main=a.clauses.find(c=>c.id==='clause.main');assert.ok(n);
  assert.equal(n.antecedentNodeId,main.subjectNodeId);assert.ok(a.nodes.some(x=>x.id===n.governorNodeId&&x.type==='AP'));
  assert.equal(n.formKind,'TO_INFINITIVE');assert.ok(['ADJECTIVE_COMPLEMENT','DEGREE_COMPLEMENT'].includes(n.function));
  assert.equal(n.controllerNodeId,null);assert.ok(n.cardIds.every(id=>ids.includes(id)));
 }else if(Object.hasOwn(f,'gapRole'))assert.ok(a.nonfinitePhrases.every(n=>n.gapRole===null));
 if(a.status.startsWith('VALID')){
  assert.deepEqual(a.coverage.consumedCardIds,ids);assert.equal(new Set(a.coverage.consumedCardIds).size,ids.length);
  for(const vp of a.verbPhrases){assert.ok(vp.verbCardIds.every(id=>tokens.find(t=>t.cardInstanceId===id).cardDefId!=='card.often'));for(const id of vp.interveningAdverbCardIds){assert.ok(!vp.verbCardIds.includes(id));assert.equal(a.resolvedTokenRoles.find(r=>r.cardInstanceId===id).role,'ADVERB');}}
 }
 if(f.harborVeilRelease!==undefined){const r=attack(f.sentence,{stageId:'stage.02',unlocks:f.unlocks??packs});assert.equal(r.bossStateAfter.active,!f.harborVeilRelease);if(f.expectedNoUnlockedCombos)assert.ok(!r.scoreTimeline.some(e=>e.phase==='MAIN_FRAME'||e.phase==='CONSTRUCTIONS'));}
 if(f.completeBonus===false){const r=attack(f.sentence);assert.ok(!r.scoreTimeline.some(e=>e.phase==='COMPLETE_BONUS'));assert.equal(r.scoreTimeline.filter(e=>e.phase==='ACCURACY').length,1);}
 if(f.requiredPower===0){const r=attack(f.sentence);assert.equal(r.accepted,true);assert.equal(r.finalPower,0);assert.equal(r.proposedStateEffects.consumeTurn,true);assert.deepEqual(r.proposedStateEffects.discardCardIds,ids);}
 if(f.expectedCrystalsBroken)assert.equal(attack(f.sentence,{frostToo:true}).frostCrystalResult.brokenCrystalCount,f.expectedCrystalsBroken);
});
for(const f of read('v061-06_Score_Cases_0.6.1.json').cases.filter(f=>['S033','S034','S035','S036'].includes(f.id)))test(`0.6.1 parser and staged score ${f.id}`,()=>{
 const r=attack(f.sentence);assert.equal(r.finalPower,f.expected);
 assert.equal(r.scoreTimeline.filter(e=>e.phase==='CARD_BASE').length,f.wordCount);
 const multipliers=r.scoreTimeline.filter(e=>e.operation==='MULTIPLY');assert.deepEqual(multipliers.map(e=>e.after),f.steps.filter(e=>e.op==='MULTIPLY').map(e=>e.after));
 assert.equal(r.scoreTimeline.filter(e=>e.sourceId==='MODIFIER.ADVERB').length,0);
});
test('0.6.1 S037 actual often receives exactly one +5 modifier, not a verb role',()=>{
 const r=attack('I am often giving you a book.'),id=r.sentenceSnapshot.orderedTokens.find(t=>t.cardDefId==='card.often').cardInstanceId;
 const events=r.scoreTimeline.filter(e=>e.sourceId==='MODIFIER.ADVERB'&&e.highlightCardIds.includes(id));assert.equal(events.length,1);assert.equal(events[0].operand,5);
});
test('0.6.1 bounded reviewed VP adverbs compose with 4 actual verbs, not a 4 token ceiling',()=>{
 for(const text of ['I will often have been giving her books.','I have always given you a book.','I will sometimes give you books.','I am really giving you a book.','They are carefully reading books.','I will have often been giving her books.']){
  const {snapshot,analysis:a}=parse(text);assert.equal(a.status,'VALID',text);assert.ok(a.verbPhrases.every(v=>v.verbCardIds.length<=4));
  const adv=snapshot.orderedTokens.filter(t=>language.lexemeById[t.lexemeId].pos==='ADVERB');for(const t of adv)assert.equal(a.grammarHits.filter(h=>h.tag==='MODIFIER.ADVERB'&&h.cardIds.includes(t.cardInstanceId)).length,1);
 }
 for(const text of ['I have today given you a book.','I will book give her a book.','I will will give her a book.'])assert.equal(parse(text).analysis.status,'INVALID_CORE',text);
});
test('0.6.1 subject gaps compose over registered nouns and valencies, not sentence strings',()=>{
 for(const text of ['A story is difficult to create.','The game is too difficult to play.','The books are easy to read.','The park was too small to work in.','The book is hard to give the teacher.']){
  const a=parse(text).analysis;assert.equal(a.status,'VALID',text);assert.equal(a.mainFrameId,'frame.svc.adj');assert.ok(a.nonfinitePhrases.some(n=>n.gapRole));
 }
 for(const text of ['I am happy to show.','I want to show.','I give you.','The book is hard to give to.','The room too small to live in.','The book is easy read.']){
  const a=parse(text).analysis;if(text==='I give you.')assert.ok(!a.nonfinitePhrases?.some(n=>n.gapRole));else assert.equal(a.status,'INVALID_CORE',text);
 }
 const pp=parse('The room is too small to live in.').analysis;assert.ok(pp.nodes.some(n=>n.gapRole==='PREPOSITION_OBJECT'&&n.cardIds.length===1));
});
test('0.6.1 malformed finite VP loses its temporal evidence only; unrelated errors retain was',()=>{
 const a=parse('I be giving you a book and she has read books.').analysis;assert.equal(a.grammarHits.filter(h=>h.tag==='TIME.PERFECT').length,1);assert.equal(a.grammarHits.filter(h=>h.tag==='TIME.PROGRESSIVE').length,0);
 const b=parse('A room was too hard to shows.').analysis;assert.equal(b.status,'VALID_WITH_ISSUES');assert.ok(b.grammarHits.some(h=>h.tag==='TIME.PAST'));assert.equal(b.issues.filter(i=>i.code==='INFINITIVE_BASE_REQUIRED').length,1);
 const c=parse('He have given you a book.').analysis;assert.equal(c.status,'VALID_WITH_ISSUES');assert.ok(!c.grammarHits.some(h=>h.tag==='TIME.PERFECT'));
});
test('0.6.1 subordinate SVOO does not replace main subject/verb/IO/DO for the harbor veil',()=>{
 const r=attack('I run because she is often giving you a book.',{stageId:'stage.02'});assert.equal(r.analysis.mainFrameId,'frame.sv');assert.equal(r.bossStateAfter.active,true);
});
test('0.6.0 all 45 pre-change analysis fingerprints remain byte identical',()=>{
 const old=registryForVersion('0.6.0');assert.equal(old.version,'0.6.0');
 for(const f of read('v061-legacy-grammar060.json').cases){const a=analyzeSentence(snapshotFromText(f.sentence,{registry:old}),old);assert.equal(createHash('sha256').update(JSON.stringify(a)).digest('hex'),f.hash,f.id);}
});
test('0.6.1 grammar policy changes no physical lexeme/card/form inventory and keeps already unsupported',()=>{
 const old=registryForVersion('0.6.0');for(const key of ['lexemes','cards','forms'])assert.deepEqual(language[key].map(x=>x.id),old[key].map(x=>x.id));
 assert.deepEqual(language.forms,old.forms);assert.deepEqual(language.cards,old.cards);assert.equal(parse('I have already given you a book.').analysis.status,'UNSUPPORTED');
 for(const lemma of ['often','always','usually','sometimes','really','quickly','slowly','carefully','clearly'])assert.deepEqual(language.senseById[language.lexemes.find(l=>l.lemma===lemma).senseIds[0]].adverbPolicy.auxiliaryPositions,['AFTER_AUXILIARY']);
});
test('0.6.1 representative structure is independent of score and registry insertion order',()=>{
 const reverse=structuredClone(language);for(const [key,value]of Object.entries(reverse)){if(Array.isArray(value))value.reverse();else if(value&&typeof value==='object')reverse[key]=Object.fromEntries(Object.entries(value).reverse());}
 for(const text of ['The book is easy to give you.','The room is too small to live in.','I will often have given her a book.']){const {snapshot,analysis}=parse(text);assert.deepEqual(analyzeSentence(snapshot,reverse),analysis);}
});
