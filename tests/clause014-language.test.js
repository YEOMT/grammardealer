import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registryForVersion,createSentenceSnapshot} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {eligibleGrammarAnalysis,scoreableAnalysis,comboEligibility} from '../src/engine/comboEligibility.js';
import {scoreAttack} from '../src/engine/scoring.js';
import {applyPunctuationPenalty} from '../src/engine/punctuation.js';
import {scoreBalanceForVersion} from '../src/data/balance.js';
import {buildRuneEvidence} from '../src/engine/runeEvidence.js';
import {resolveAttack} from '../src/engine/stage.js';
import {stageForRun,getEncounter} from '../src/data/stages.js';
import {matchFinaleTask} from '../src/game/finaleTasks.js';
import {validateLanguageData} from '../tools/validate-data.js';
const registry=registryForVersion('0.14.0');
const cases=JSON.parse(fs.readFileSync(new URL('./fixtures/clause014/grammar-cases.json',import.meta.url),'utf8')).cases;
const unlocks=['pack.participial.active','pack.participial.passive','pack.corridor','pack.passive','pack.participles','pack.causativePerception','pack.svoo','pack.svoc.basic','pack.clauseLink','pack.gerund','pack.infinitive','pack.time.past','pack.time.progressive','pack.time.perfect','pack.time.futureWill'];
function physical(text,version='0.14.0') {
 const r=registryForVersion(version),fixture=snapshotFromText(text,{registry:r});
 assert.ok(fixture.orderedTokens.every(t=>r.cardById[t.cardDefId]),text+' requires registered cards and forms');
 const cards=fixture.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,baseScore:10,polishLevel:0,specialEffectId:null}));
 assert.equal(new Set(cards.map(c=>c.instanceId)).size,cards.length,'Repeated words use separate physical copies');
 const snapshot=createSentenceSnapshot(fixture.orderedTokens.map(t=>({cardInstanceId:t.cardInstanceId,selection:t.selectionId})),cards,{languageVersion:version,punctuation:fixture.punctuation});
 return {snapshot,cards,analysis:analyzeSentence(snapshot,r)};
}
for(const c of cases)test('0.14 physical '+c.id+' '+c.sentence,()=>{
 const {snapshot,analysis:a}=physical(c.sentence);
 // Existing PRONOUN_CASE is recoverable. Keep its real penalty and deny the
 // new adjunct evidence instead of changing the established error contract.
 const expected=c.id==='G29'?'VALID_WITH_ISSUES':c.expectedAnalysis;
 assert.equal(a.status,expected,JSON.stringify({issues:a.issues,diagnostics:a.diagnostics}));
 assert.deepEqual(JSON.parse(JSON.stringify(a)),a,'Analysis must remain serializable in immutable attack receipts');
 const eligibility={version:'0.14.0',unlocks:c.newParticipleLearningUnlocked?unlocks:unlocks.filter(x=>!x.startsWith('pack.participial.'))};
 const eligible=eligibleGrammarAnalysis(a,eligibility);
 assert.deepEqual(eligible.grammarHits.filter(h=>h.tag.startsWith('CLAUSE.PARTICIPIAL.')).map(h=>h.tag).sort(),c.requiredNewHits.slice().sort());
 if(['VALID','VALID_WITH_ISSUES'].includes(a.status))assert.deepEqual([...a.coverage.consumedCardIds].sort(),snapshot.orderedTokens.map(t=>t.cardInstanceId).sort());
 if(c.id==='G29'){assert.ok(a.issues.some(i=>i.code==='PRONOUN_CASE'));assert.ok(a.participialAdjuncts.every(p=>p.bonusEligible===false));}
 if(c.requiredNewHits.length){
  const p=a.participialAdjuncts[0],main=a.clauses.find(x=>x.id===a.mainClauseId);
  assert.equal(p.mainClauseId,main.id);assert.equal(p.controllerSubjectNodeId,main.subjectNodeId);
  assert.deepEqual(p.commaBoundary,snapshot.punctuation[0]&&{gapIndex:snapshot.punctuation[0].gapIndex});
  assert.ok(a.nodes.some(n=>n.id===p.controllerSubjectNodeId&&n.cardIds.length));
  assert.equal(a.clauses.filter(x=>x.finite).length,c.id==='G20'?2:1);
 }
});

test('0.14 punctuation snapshot validation, fingerprint and old policy isolation',()=>{
 assert.equal(validateLanguageData(registry).status,'PASS');
 assert.equal(registry.capabilities.find(c=>c.id==='cap.passive').runtimeReady,false,'New by must not activate the historical reserved capability');
 const {snapshot}=physical('I, like games.'),other=structuredClone(snapshot);other.punctuation[0].gapIndex=3;
 assert.notEqual(analyzeSentence(snapshot,registry).inputFingerprint,analyzeSentence(other,registry).inputFingerprint);
 for(const punctuation of [[{kind:'COMMA',gapIndex:-1}],[{kind:'COMMA',gapIndex:4}],[{kind:'SEMICOLON',gapIndex:1}],[{kind:'COMMA',gapIndex:1},{kind:'COMMA',gapIndex:2}]])assert.equal(analyzeSentence({...snapshot,punctuation},registry).status,'ENGINE_ERROR');
 const duplicate=structuredClone(snapshot);duplicate.orderedTokens[2].cardInstanceId=duplicate.orderedTokens[0].cardInstanceId;assert.equal(analyzeSentence(duplicate,registry).status,'ENGINE_ERROR');
 assert.equal(registryForVersion('0.12.1').cardById['card.by'],undefined);
 assert.equal(physical('I like games.','0.12.1').snapshot.schemaVersion,1);
 assert.equal(analyzeSentence(snapshot,registryForVersion('0.12.1')).status,'ENGINE_ERROR');
 assert.equal(physical('Seeing you I smile.','0.12.1').analysis.status,'INVALID_CORE');
});

test('0.14 adjuncts do not create a finite tense, extra finite clause, passive/gerund bonus or physical subject',()=>{
 for(const text of ['Seeing you, I smile.','Helped by you, I smile.']){
  const {analysis:a,snapshot}=physical(text),main=a.clauses.find(c=>c.id===a.mainClauseId),vp=a.verbPhrases.find(v=>v.clauseId===main.id&&v.finiteCardId);
  assert.equal(main.frameId,'frame.sv');assert.equal(vp.tenseFamily,'PRESENT');
  assert.ok(!a.grammarHits.some(h=>['TIME.PAST','TIME.PROGRESSIVE','TIME.PERFECT','CLAUSE.GERUND','PARTICIPLE.PAST','PARTICIPLE.PRESENT','VOICE.PASSIVE'].includes(h.tag)));
  assert.ok(!buildRuneEvidence(a,{unlocks})['rune.past'].eligible);
  assert.ok(matchFinaleTask({type:'TENSE',target:'PRESENT_SIMPLE'},a));
  assert.ok(!matchFinaleTask({type:'TENSE',target:'PAST_SIMPLE'},a));
  assert.deepEqual([...new Set(a.resolvedTokenRoles.map(r=>r.cardInstanceId))].sort(),snapshot.orderedTokens.map(t=>t.cardInstanceId).sort());
 }
 const a=physical('Seeing you, I would smile if I had time.').analysis;
 assert.ok(a.grammarHits.some(h=>h.tag==='CORRIDOR.UNREAL_PRESENT'));
 assert.equal(a.participialAdjuncts[0].controllerSubjectNodeId,a.clauses.find(c=>c.id===a.mainClauseId).subjectNodeId);
 assert.ok(!a.grammarHits.some(h=>h.tag==='LINK.CLAUSE'&&h.cardIds.includes('fixture.0')),'adjunct itself is not finite clause linking');
});

test('0.14 local malformed adjunct, comma and unsupported boundaries cannot create new target evidence',()=>{
 for(const text of ['Seeing, you I smile.','Helped by I, she smiled.','Seeing you, I smiles.']){
  const a=physical(text).analysis;assert.ok(!eligibleGrammarAnalysis(a,{unlocks}).grammarHits.some(h=>h.tag.startsWith('CLAUSE.PARTICIPIAL.')));
 }
 for(const text of ['I remember, that you like games.','I like the book, that you read.']){
  const a=physical(text).analysis;assert.equal(a.status,'VALID_WITH_ISSUES',text);assert.ok(a.punctuationIssues.length);
  assert.ok(!eligibleGrammarAnalysis(a,{unlocks:[...unlocks,'pack.relative']}).grammarHits.some(h=>h.tag==='CLAUSE.RELATIVE.OBJECT'||h.tag==='LINK.CLAUSE'));
 }
 for(const text of ['You running, I smile.','Seeing you, help me.','Seeing you, it is good to smile.'])assert.equal(physical(text).analysis.status,'UNSUPPORTED',text);
});

test('0.14 unlocked adjunct multiplier occurs once, comma contributes no base or length card',()=>{
 const {analysis:a,cards}=physical('Seeing you, I smiled.');
 const scored=scoreAttack(a,cards,{balance:scoreBalanceForVersion('0.14.0'),eligibleAnalysis:scoreableAnalysis(a,{unlocks})});
 assert.equal(scored.events.filter(e=>e.sourceId==='CLAUSE.PARTICIPIAL.ACTIVE').length,1);
 assert.deepEqual(scored.events.find(e=>e.sourceId==='CLAUSE.PARTICIPIAL.ACTIVE').operand,{num:8,den:5});
 assert.equal(scored.events.filter(e=>e.phase==='CARD_BASE').length,cards.length);
 const locked=scoreAttack(a,cards,{balance:scoreBalanceForVersion('0.14.0'),eligibleAnalysis:scoreableAnalysis(a,{unlocks:unlocks.filter(k=>!k.startsWith('pack.participial.'))})});
 assert.ok(!locked.events.some(e=>e.sourceId.startsWith('CLAUSE.PARTICIPIAL.')));assert.ok(scored.preRuneScore>locked.preRuneScore);
 const own=comboEligibility({version:'0.14.0',eligibility:{runOwnUnlocks:[],runStartUnlockBaseline:['pack.participial.active','pack.participial.passive']}});assert.deepEqual(own.unlocks,[]);
});

test('0.14 punctuation penalty uses integer floor once, after runes and before region',()=>{
 const {analysis:a,snapshot,cards}=physical('Because I, am happy I smile.');
 assert.equal(a.status,'VALID_WITH_ISSUES');
 const penalty=applyPunctuationPenalty(a,1001,{attackId:'punctuation.test',eventOffset:20});
 assert.equal(penalty.postPunctuationScore,900);assert.equal(penalty.events.length,1);assert.match(penalty.events[0].labelKo,/101/);
 const run={version:'0.14.0',progress:{stageId:'stage.04',roundIndex:2,battleNumber:15}};
 const result=resolveAttack({analysis:a,sentenceSnapshot:snapshot,cards,policyVersion:'0.14.0',enemy:getEncounter('stage.04',2,'0.14.0'),stage:stageForRun(run),equippedRunes:[{instanceId:'rune.test',runeId:'rune.sv',level:1}],comboEligibility:{unlocks}});
 const pi=result.scoreTimeline.findIndex(e=>e.sourceId==='PUNCTUATION.COMMA'),ri=result.scoreTimeline.findIndex(e=>e.phase==='RUNE');
 assert.ok(pi>=0);assert.ok(ri<0||ri<pi);assert.equal(result.postPunctuationScore,Math.floor(result.postRuneScore*9/10));
 assert.equal(result.scoreTimeline.filter(e=>e.sourceId==='PUNCTUATION.COMMA').length,1);
 assert.deepEqual(applyPunctuationPenalty({...a,status:'INVALID_CORE'},0).events,[]);
 const simple=text=>{const p=physical(text);return resolveAttack({analysis:p.analysis,sentenceSnapshot:p.snapshot,cards:p.cards,policyVersion:'0.14.0',enemy:getEncounter('stage.01',0,'0.14.0'),stage:stageForRun({version:'0.14.0',progress:{stageId:'stage.01'}}),equippedRunes:[{instanceId:'rune.quality',runeId:'rune.perfectSentence',level:1}],comboEligibility:{unlocks}});};
 const normal=simple('I like games.'),comma=simple('I, like games.');
 assert.equal(comma.status,'VALID_WITH_ISSUES');assert.equal(comma.preRuneScore,normal.preRuneScore);assert.equal(comma.postRuneScore,normal.postRuneScore);
 assert.equal(comma.postPunctuationScore,Math.floor(normal.postRuneScore*9/10));
 assert.equal(comma.scoreTimeline.filter(e=>e.sourceId==='COMPLETE_SENTENCE').length,1);
 assert.ok(comma.scoreTimeline.some(e=>e.sourceId==='rune.perfectSentence'));
});
