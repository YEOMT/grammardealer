import test from 'node:test';
import assert from 'node:assert/strict';
import {registryForVersion,createSentenceSnapshot} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {resolveAttack} from '../src/engine/stage.js';
import {initialClauseThreads,resolveClauseThreads,clauseThreadEvidence} from '../src/engine/clauseThreads.js';
import {clauseThreadReceipt,validateClauseThreadsRun} from '../src/game/clauseThreadsState.js';
import {stageForRun,getEncounter} from '../src/data/stages.js';
import {battleLearningGuide,preparationGuide} from '../src/data/battleLearningGuide.js';
import {corridorFrostDefinitions} from '../src/game/corridorFrost.js';
import {buildFinaleTaskPool,matchFinaleTask,createSurfacePlan} from '../src/game/finaleTasks.js';
import {surfaceDamage} from '../src/engine/finale.js';
import {generateStarterDeck} from '../src/game/deck.js';
import {createStream} from '../src/game/rng.js';
import {eligibleGrammarAnalysis,comboEligibility} from '../src/engine/comboEligibility.js';
import {CLAUSE014_VERSIONS} from '../src/contracts.js';
const version='0.14.0',registry=registryForVersion(version);
const eligibility={version,unlocks:['pack.participial.active','pack.participial.passive','pack.corridor','pack.time.past','pack.time.progressive','pack.time.perfect','pack.time.futureWill','pack.passive','pack.participles','pack.relative','pack.infinitive','pack.svoo','pack.svoc.basic']};
const stage=stageForRun({version,progress:{stageId:'stage.10'}});
function physical(text,id='case'){
 const expected=snapshotFromText(text,{registry,sentenceId:id});
 assert.ok(expected.orderedTokens.every(t=>t.cardDefId),text+' uses registered forms');
 expected.orderedTokens.forEach((token,i)=>{token.cardInstanceId=`${id}.word.${i}`;});
 const cards=expected.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:0,specialEffectId:null}));
 const snapshot=createSentenceSnapshot(expected.orderedTokens.map(t=>({cardInstanceId:t.cardInstanceId,selection:t.selectionId})),cards,{sentenceId:id,languageVersion:version,punctuation:expected.punctuation});
 return {cards,snapshot,analysis:analyzeSentence(snapshot,registry)};
}
function attack(text,enemy,attackId='a'){
 const {cards,snapshot,analysis}=physical(text,attackId);
 return resolveAttack({analysis,cards,enemy,stage,attackId,runId:'qa.threads',battleId:'battle.10.05',sentenceSnapshot:snapshot,policyVersion:version,comboEligibility:eligibility});
}

test('0.14 exact versioned curriculum and support follow new43–46 without altering old0.12.1',()=>{
 assert.deepEqual(stage.rounds.map(r=>r.nameKo),['춤추는 광대','추방당한 왕자','망상의 순례자','후회의 기사','운명의 직조자']);
 assert.deepEqual(stage.rounds.map(r=>r.hp),[2500,2900,3300,3800,5000]);
 assert.equal(stage.rounds[4].bossMechanic.id,'FATE_CLAUSE_THREADS');
 assert.equal(getEncounter('stage.10',4,'0.12.1').bossMechanic.id,'FATE_FORESIGHT');
 assert.equal(getEncounter('stage.10',0,'0.12.1').nameKo,'갈림길의 광대');
 for(const roundIndex of [0,1,2,3]){
  const run={version,progress:{stageId:'stage.10',roundIndex}};
  assert.equal(preparationGuide(run).targetLabel,['현재분사 분사구문','과거분사 분사구문','가정법 과거','가정법 과거완료'][roundIndex]);
  assert.equal(analyzeSentence(physical(preparationGuide(run).example).snapshot,registry).status,'VALID');
 }
 assert.match(battleLearningGuide({version,progress:{stageId:'stage.10',roundIndex:4}}).boss.join(' '),/HP 1/);
 assert.deepEqual(corridorFrostDefinitions(0,[],version),[]);assert.deepEqual(corridorFrostDefinitions(1,[],version),[]);
 assert.deepEqual(corridorFrostDefinitions(2,[],version),['card.if','card.will','card.can']);
 assert.deepEqual(corridorFrostDefinitions(3,['card.have'],version),['card.if','card.will','card.have']);
 assert.deepEqual(corridorFrostDefinitions(4,[],version),[]);
 assert.deepEqual(corridorFrostDefinitions(0,[],'0.12.1'),['card.if','card.will']);
});

test('0.14 actual structures freely accumulate threads, release atHP1 and settle duplicateID once',()=>{
 let enemy={id:'battle.10.05',stageId:'stage.10',kind:'REGIONAL_BOSS',hp:1,maxHp:5000,bossMechanic:initialClauseThreads()};
 for(const [index,text,key]of [[0,'I would help you if I had time.','COUNTERFACTUAL'],[1,'Helped by you, I smile.','PASSIVE'],[2,'Seeing you, I smile.','ACTIVE']]){
  const r=attack(text,enemy,'thread.'+index);assert.equal(r.status,'VALID');assert.ok(r.finalPower>0);assert.deepEqual(r.clauseThreadResult.unlockedThreads,[key]);
  assert.equal(r.actualHpLoss,index===2?1:0);assert.equal(r.killed,index===2);assert.equal(r.foresightResult,undefined);assert.equal(r.scoreTimeline.filter(e=>e.phase==='REGION').length,1);
  enemy={...enemy,hp:r.enemyHpAfter,bossMechanic:r.bossStateAfter};
  assert.throws(()=>resolveClauseThreads(r.analysis,r.preBossScore,enemy,{attackId:r.attackId,eligibleAnalysis:eligibleGrammarAnalysis(r.analysis,eligibility)}),/Duplicate/);
 }
 assert.equal(enemy.hp,0);
});

test('0.14 one valid mixed attack may release two different threads; repeat target stays released',()=>{
 const a=physical('Seeing you, I would smile if I had time.').analysis;
 const enemy={hp:5000,bossMechanic:initialClauseThreads()},one=resolveClauseThreads(a,10,enemy,{attackId:'one',eligibleAnalysis:eligibleGrammarAnalysis(a,eligibility)});
 assert.deepEqual(one.unlockedThreads,['ACTIVE','COUNTERFACTUAL']);assert.equal(one.remainingThreads,1);
 const two=resolveClauseThreads(a,10,{hp:one.enemyHpAfter,bossMechanic:one.bossStateAfter},{attackId:'two',eligibleAnalysis:eligibleGrammarAnalysis(a,eligibility)});
 assert.deepEqual(two.unlockedThreads,[]);assert.deepEqual(two.bossStateAfter.threads,one.bossStateAfter.threads);
 assert.equal(resolveClauseThreads(a,0,enemy,{attackId:'zero',eligibleAnalysis:eligibleGrammarAnalysis(a,eligibility)}).unlockedThreads.length,0);
});

test('0.14 no false thread evidence from morphology, realconditions, perfect or brokencomma',()=>{
 for(const text of ['I am running.','I was helped.','I had read books.','If I have time, I will help you.','Seeing you I smile.','Seen you, I smile.']){
  const a=physical(text).analysis;assert.deepEqual(clauseThreadEvidence(a,eligibleGrammarAnalysis(a,eligibility)),{},text);
 }
 const a=physical('Seeing you, I smile.').analysis;
 assert.deepEqual(clauseThreadEvidence(a,eligibleGrammarAnalysis(a,{version,unlocks:[]})),{});
});

test('0.14 punctuation penalty follows runes, precedes region, is single and does not change word counts',()=>{
 const plain=attack('I like games.',{hp:5000,kind:'NORMAL'}),bad=attack('I, like games.',{hp:5000,kind:'NORMAL'});
 assert.equal(bad.cardScoringSnapshot.length,plain.cardScoringSnapshot.length);
 assert.equal(bad.postRuneScore,plain.postRuneScore);assert.equal(bad.postPunctuationScore,Math.floor(bad.postRuneScore*9/10));
 assert.equal(bad.scoreTimeline.filter(e=>e.sourceId==='PUNCTUATION.COMMA').length,1);
 assert.ok(bad.scoreTimeline.findIndex(e=>e.sourceId==='PUNCTUATION.COMMA')<bad.scoreTimeline.findIndex(e=>e.phase==='RESISTANCE'));
});

test('0.14 Deep reads right main VP, not adjunct -ing/pp; Surface remains one layer',()=>{
 for(const text of ['Helped by you, I smile.','Seeing you, I smile.']){
  const {analysis}=physical(text);
  assert.ok(matchFinaleTask({type:'TENSE',target:'PRESENT_SIMPLE'},analysis,{comboEligibility:eligibility}));
  for(const target of ['PAST_SIMPLE','PRESENT_PROGRESSIVE','PRESENT_PERFECT'])assert.equal(matchFinaleTask({type:'TENSE',target},analysis,{comboEligibility:eligibility}),null);
 }
 assert.equal(surfaceDamage({hp:1,power:100,layers:2,matched:true}).layersAfter,1);
 assert.equal(getEncounter('stage.final',2,version).hp,10000);
 assert.equal(getEncounter('stage.final',2,version).bossMechanic.id,'FINALE_UNIVERSAL');
});

test('0.14 three actual level decks with two obtainable support words yield owned-copy witnesses',()=>{
 for(const vocabularyMode of ['BEGINNER','STANDARD','ADVANCED']){
  const d=generateStarterDeck({seed:'clause.witness',vocabularyMode,version:CLAUSE014_VERSIONS.generator});assert.equal(d.activeCardIds.length,28);
  // Assigned developed decks, not a natural reward run. No free boss support is issued.
  for(const word of ['if','will']){const id='qa.earned.'+word;d.activeCardIds.push(id);d.cardInstances[id]={instanceId:id,cardDefId:'card.'+word,polishLevel:0,specialEffectId:null};assert.ok(registry.cardById['card.'+word].runtimeReady);}
  const pool=buildFinaleTaskPool(d.activeCardIds,d.cardInstances,{registry,comboEligibility:eligibility});
  for(const target of ['PARTICIPIAL_ACTIVE','PARTICIPIAL_PASSIVE','COUNTERFACTUAL']){
   const task=pool.GRAMMAR.find(t=>t.target===target);assert.ok(task,vocabularyMode+' '+target);assert.equal(task.supportCardDefId,null);
   const snapshot=createSentenceSnapshot(task.witnessSlots,d.cardInstances,{languageVersion:version,punctuation:task.witnessPunctuation??[]});
   assert.ok(snapshot.orderedTokens.length<=24);assert.equal(new Set(snapshot.orderedTokens.map(t=>t.cardInstanceId)).size,snapshot.orderedTokens.length);
   assert.ok(matchFinaleTask(task,analyzeSentence(snapshot,registry),{comboEligibility:eligibility}));
  }
  assert.equal(createSurfacePlan(pool,createStream('clause.plan')).tasks.length,2);
 }
 const id='only.run',pool=buildFinaleTaskPool([id],{[id]:{instanceId:id,cardDefId:'card.run',polishLevel:0,specialEffectId:null}},{registry,comboEligibility:eligibility});
 assert.ok(!pool.GRAMMAR.some(t=>t.target.startsWith('PARTICIPIAL_')));
});

test('0.14 compact receipts replay actual snapshot including comma and reject forged state/power',()=>{
 const run={version,runId:'qa.threads',activeCardIds:[],cardInstances:{},runes:{instances:{}},progress:{stageId:'stage.10',roundIndex:4,battleNumber:47},eligibility:{runOwnUnlocks:eligibility.unlocks,runStartUnlockBaseline:[]},stats:{history:[]},combat:{rulesSnapshot:{turnLimit:6},clauseThreadReceipts:[],clauseThreadRuneBaseline:{},clauseThreadCardBaseline:{},enemyState:{id:'battle.10.05',stageId:'stage.10',kind:'REGIONAL_BOSS',hp:5000,maxHp:5000,bossMechanic:initialClauseThreads()}}};
 for(const [i,text]of ['Seeing you, I smile.','Helped by you, I smile.','I would help you if I had time.'].entries()){
  const {cards,snapshot,analysis}=physical(text,'receipt.'+i),r=resolveAttack({analysis,cards,enemy:run.combat.enemyState,stage,attackId:'receipt.'+i,runId:run.runId,battleId:'battle.10.05',sentenceSnapshot:snapshot,policyVersion:version,comboEligibility:comboEligibility(run)});
  for(const card of cards){run.cardInstances[card.instanceId]=card;run.combat.clauseThreadCardBaseline[card.instanceId]=structuredClone(card);if(!run.activeCardIds.includes(card.instanceId))run.activeCardIds.push(card.instanceId);}
  run.combat.enemyState.hp=r.enemyHpAfter;run.combat.enemyState.bossMechanic=r.bossStateAfter;run.combat.clauseThreadReceipts.push(clauseThreadReceipt(r));run.stats.history.unshift(r);
 }
 assert.equal(validateClauseThreadsRun(structuredClone(run)),true);
 for(const mutate of [r=>r.combat.enemyState.bossMechanic.threads.ACTIVE=null,r=>r.combat.clauseThreadReceipts[0].sentenceSnapshot.punctuation=[],r=>r.combat.clauseThreadReceipts[0].preBossScore++,r=>r.combat.clauseThreadReceipts[0].cardScoringSnapshot[0].baseScore=100,r=>r.combat.clauseThreadReceipts[0].cardScoringSnapshot[0].polishLevel=3,r=>r.combat.clauseThreadReceipts.push(r.combat.clauseThreadReceipts[0])]){const forged=structuredClone(run);mutate(forged);assert.throws(()=>validateClauseThreadsRun(forged));}
 run.stats.history=[];assert.equal(validateClauseThreadsRun(run),true,'compact receipts survive rolling codex pruning');
 const removed=run.activeCardIds[0];run.combat.settled=true;delete run.cardInstances[removed];run.activeCardIds=run.activeCardIds.filter(id=>id!==removed);assert.equal(validateClauseThreadsRun(run),true,'settled card-removal reward preserves original attack receipt');
});
