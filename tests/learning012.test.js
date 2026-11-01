import {assignedEmber} from './helpers/ember-state.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {registryForVersion,createSentenceSnapshot,makeToken,formsForCard} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {generateStarterDeck,validateStarterDeck} from '../src/game/deck.js';
import {visibleForms} from '../src/ui/formView.js';
import {RunController} from './helpers/legacy-012-controller.js';
import {RunController as Legacy} from './helpers/legacy-011-controller.js';
import {newProfile,validateRunState} from '../src/services/localStore.js';
import {checked,assignSentence,assignedWaterways} from './helpers/waterways-state.js';
import {campaignBattleCount} from '../src/data/campaignFeatures.js';
import {getEncounter,stageForRun} from '../src/data/stages.js';
import {resolveEncounter} from '../src/engine/stage.js';
import {mainFrameEvidence} from '../src/engine/foresight.js';
import {matchFinaleTask} from '../src/game/finaleTasks.js';
import {buildRuneEvidence} from '../src/engine/runeEvidence.js';
import {combatBalanceForVersion,scoreBalanceForVersion} from '../src/data/balance.js';
import {runesForVersion} from '../src/data/runes.js';
import {preparationGuide} from '../src/data/battleLearningGuide.js';
import {createScoreHeat,scoreHeatTier,SCORE_HEAT_THRESHOLDS,SCORE_HEAT_SCALES} from '../src/engine/scoreHeat.js';

const language=registryForVersion('0.12.0');
function physical(text,version='0.12.0'){
 const r=registryForVersion(version),t=snapshotFromText(text,{registry:r}).orderedTokens;
 assert.ok(t.every(t=>t.cardDefId),'Fixture uses registered physical words: '+text);
 const instances=Object.fromEntries(t.map(t=>[t.cardInstanceId,{instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:0,specialEffectId:null}]));
 return createSentenceSnapshot(t.map(t=>({cardInstanceId:t.cardInstanceId,selection:t.selectionId})),instances,{languageVersion:version});
}
const analyze=text=>analyzeSentence(physical(text),language);
const newRun=(tutorial=false)=>{const c=new RunController({profile:{...newProfile('0.12 QA'),...(!tutorial?{guidedTutorialCompletedVersion:'0.2.1'}:{})}});checked(c,{type:'NEW_RUN',config:{seed:'v012.controller',vocabularyMode:'STANDARD'}});return c;};

test('0.12 T1: 3 modes × 3 seeds, fixed verb slots, real declarative paths and exact FREE distribution',()=>{
 for(const mode of ['BEGINNER','STANDARD','ADVANCED'])for(const seed of ['v012.a','v012.b','v012.c']){
  const d=generateStarterDeck({seed,vocabularyMode:mode,version:'0.12.0'}),v=validateStarterDeck(d);
  assert.deepEqual(v.errors,[]);assert.deepEqual(v.counts,{NOUN:6,PRONOUN:4,VERB:8,ADJECTIVE:3,ADVERB:2,DETERMINER:3,PREPOSITION:2});
  assert.deepEqual(d,generateStarterDeck({seed,vocabularyMode:mode,version:'0.12.0'}));
  assert.ok(v.witnesses.every(w=>w.analysis.clauses.find(c=>c.id===w.analysis.mainClauseId).mood!=='IMPERATIVE'));
 }
 const a=generateStarterDeck({seed:'free',vocabularyMode:'FREE',version:'0.12.0'}),b=generateStarterDeck({seed:'free',vocabularyMode:'FREE',version:'0.8.1'});
 for(const k of ['cardInstances','activeCardIds','rng'])assert.deepEqual(a[k],b[k]);
});
test('0.12 T2: reviewed verb frames, inflections, perception evidence and negative valencies',()=>{
 for(const text of ['I watch you.','I notice you.','I allow games.','I try food.','I remember you.','I watch him run.','I notice him running.','I allow you to run.','I try to run.','I try running.','I remember to work.','I remember working.','She tries to run.','I watched her.','I need you to run.','I want you to run.','I like to run.','I like running.','I go home.','I go.'])assert.equal(analyze(text).status,'VALID',text);
 for(const text of ['I allow you run.','I go school.','I watch you to run.'])assert.notEqual(analyze(text).status,'VALID',text);
 for(const text of ['I try you to run.','I remember you to run.']){const a=analyze(text);assert.notEqual(a.mainFrameId,'frame.svoc');assert.ok(a.nonfinitePhrases.every(p=>p.function!=='OBJECT_COMPLEMENT'));}
 assert.ok(analyze('I notice him running.').grammarHits.some(h=>h.tag==='CONSTRUCTION.PERCEPTION'));
 for(const lemma of ['watch','notice','allow','try','remember']){const fs=formsForCard('card.'+lemma,{registry:language});assert.equal(fs.length,5);assert.notEqual(fs.find(f=>f.id.endsWith('.past')).id,fs.find(f=>f.id.endsWith('.pp')).id);assert.equal(registryForVersion('0.11.0').cardById['card.'+lemma],undefined);}
});
test('0.12 T3: one physical dual card, surface-governed roles and countability, no foreign form injection',()=>{
 for(const text of ['I have a plan.','I plan the game.','She plans the game.','I need plans.','I planned the game.','I am planning the game.','I work.','I need work.','I change the plan.','I need a change.','I need change.','I need changes.','She changes the plan.'])assert.equal(analyze(text).status,'VALID',text);
 assert.ok(analyze('I need a work.').issues.some(i=>i.code==='ARTICLE_COUNTABILITY_MISMATCH'));
 for(const [text,pos] of [['I need plans.','NOUN'],['She plans the game.','VERB']]){
  const snap=physical(text),token=snap.orderedTokens.find(t=>t.cardDefId==='card.plan');
  for(const id of ['form.plan.plural','form.plan.third']){token.selectionId=id;const a=analyzeSentence(snap,language);assert.equal(a.status,'VALID');assert.equal(a.resolvedTokenRoles.find(r=>r.cardInstanceId===token.cardInstanceId).selectedPos,pos);}
 }
 for(const name of ['plan','work','change']){const fs=visibleForms(language.lexemeById[language.cardById['card.'+name].lexemeId].pos,formsForCard('card.'+name,{registry:language}));assert.equal(fs.filter(f=>f.surface===name).length,1);assert.equal(fs.filter(f=>f.grammaticalFeatures.tense==='PAST').length,1);assert.equal(fs.filter(f=>f.grammaticalFeatures.tense==='PAST_PARTICIPLE').length,1);}
 assert.throws(()=>makeToken('test','card.plan','form.run.present',0,language));
 const snap=physical('I have a plan.');snap.orderedTokens[3].selectionId='form.run.present';assert.equal(analyzeSentence(snap,language).status,'ENGINE_ERROR');
});
test('0.12 T4/T5: imperative physical evidence, original frame/rune/boss rules, no temporal key',()=>{
 for(const [text,frame] of [['Run.','frame.sv'],['Go.','frame.sv'],['Be happy.','frame.svc.adj'],['Help me.','frame.svo'],['Do homework.','frame.svo'],['Give me a book.','frame.svoo'],['Make me happy.','frame.svoc'],['Read the book.','frame.svo'],['Make him work.','frame.svoc']]){
  const a=analyze(text),c=a.clauses.find(c=>c.id===a.mainClauseId);assert.equal(a.status,'VALID',text);assert.equal(a.mainFrameId,frame,text);assert.equal(c.mood,'IMPERATIVE');assert.equal(c.subjectNodeId,null);assert.equal(a.nodes.some(n=>n.cardIds.includes(null)),false);assert.equal(matchFinaleTask({type:'TENSE',target:'PRESENT_SIMPLE'},a),null);assert.ok(mainFrameEvidence(a));assert.equal(a.verbPhrases.find(v=>v.clauseId===c.id).temporalEvidenceEligible,false);
 }
 for(const text of ['Runs.','Went.','Running.','Happy.','Make.','Do run.','I be happy.','I think that run.'])assert.notEqual(analyze(text).status,'VALID',text);
 assert.equal(analyze('I run.').clauses[0].mood,undefined);
 const compound='I have read books and you have read books.',current=analyze(compound),old=analyzeSentence(physical(compound,'0.11.0'),registryForVersion('0.11.0'));
 assert.equal(current.mainFrameId,'frame.svo');assert.deepEqual(current.grammarHits.map(h=>h.tag),old.grammarHits.map(h=>h.tag));
 assert.ok(current.grammarHits.some(h=>h.tag==='TIME.PERFECT'));assert.ok(current.grammarHits.some(h=>h.tag==='LINK.CLAUSE'));
 const a=analyze('Give me a book.'),stage=stageForRun({version:'0.12.0',progress:{stageId:'stage.02'}}),enemy=getEncounter('stage.02',3,'0.12.0');
 const r=resolveEncounter(a,100,enemy,{stage,originalAnalysis:a,policyVersion:'0.12.0'});assert.equal(r.bossStateAfter.active,false);assert.equal(matchFinaleTask({type:'FRAME',target:'SVOO'},a)?.highlightCardIds.length,4);
 const nested=analyze('Read the book that I made.');assert.equal(nested.status,'VALID');assert.ok(nested.grammarHits.some(h=>h.tag==='TIME.PAST'));assert.equal(buildRuneEvidence(nested,null)['rune.past'].eligible,true);
});
test('0.12 T6: current/old safe save, tutorial skip, unchanged 50 battles, resources, HP and runes',()=>{
 assert.equal(campaignBattleCount('0.12.0'),50);
 for(const fn of [combatBalanceForVersion,scoreBalanceForVersion,runesForVersion])assert.equal(fn('0.12.0'),fn('0.11.0'));
 for(const stage of ['stage.01','stage.02','stage.03','stage.04','stage.05','stage.06','stage.07','stage.08','stage.09','stage.10','stage.final'])assert.deepEqual(stageForRun({version:'0.12.0',progress:{stageId:stage}}),stageForRun({version:'0.11.0',progress:{stageId:stage}}));
 const c=newRun();checked(c,{type:'START_BATTLE'});const saved=c.getState();assert.equal(validateRunState(saved,language),true);assert.deepEqual(new RunController({initialState:JSON.parse(JSON.stringify(saved))}).getState(),saved);
 const old=new Legacy({profile:{...newProfile('old'),guidedTutorialCompletedVersion:'0.2.1'}});checked(old,{type:'NEW_RUN',config:{seed:'legacy.012'}});checked(old,{type:'START_BATTLE'});const before=old.getState();assert.deepEqual(new RunController({initialState:before}).getState(),before);assert.equal(analyzeSentence(physical('Run.','0.11.0'),registryForVersion('0.11.0')).status,'INVALID_CORE');
 const guided=newRun(true),parked=guided.getState().tutorialSession.parked;checked(guided,{type:'START_BATTLE'});const s=guided.getState();checked(guided,{type:'SKIP_TUTORIAL',sessionId:s.tutorialSession.sessionId,expectedRevision:s.revision,commandId:'v012.skip',confirmed:true});const end=guided.getState();assert.deepEqual(end.activeCardIds,parked.activeCardIds);assert.deepEqual(end.cardInstances,parked.cardInstances);assert.equal(end.economy.gold,0);assert.equal(validateRunState(end,language),true);
});
test('0.12 settlement: real imperative and dual cards consume once and retain analyzable save receipts',()=>{
 const c=newRun();checked(c,{type:'START_BATTLE'});const ids=assignSentence(c,'Run.');const r=checked(c,{type:'SUBMIT'}).resolution;assert.ok(r.finalPower>0);assert.equal(r.sentenceSnapshot.orderedTokens.length,1);assert.equal(r.analysis.clauses[0].subjectNodeId,null);checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});const once=c.getState();c.dispatch({type:'FINISH_PRESENTATION',attackId:r.attackId});assert.deepEqual(c.getState(),once);assert.equal(once.combat.discardIds.filter(id=>ids.includes(id)).length,1);assert.equal(validateRunState(once,language),true);
});
test('0.12 T7: next-battle guidance exact SVOO text and pure reads',()=>{
 const c=newRun(),s=c.getState();s.progress={stageId:'stage.02',roundIndex:1,battleNumber:5};s.combat={enemyState:getEncounter('stage.02',1,'0.12.0')};const before=JSON.stringify(s);const g=preparationGuide(s);assert.equal(g.targetLabel,'4형식');assert.equal(g.patternKo,'주어 + 동사 + 간접목적어 + 직접목적어');assert.equal(g.meaningKo,'~에게 ~를 주다.');assert.equal(g.example,'I give you a book.');assert.equal(g.effectLabel,'4형식 문장 사용 시 보너스 배율 적용');assert.equal(JSON.stringify(s),before);
});
test('0.12 T8: all exact heat boundaries, one leap, decrease/re-cross and explicit attack reset',()=>{
 SCORE_HEAT_THRESHOLDS.forEach((n,i)=>{assert.equal(scoreHeatTier(n-1),i);assert.equal(scoreHeatTier(n),i+1);assert.equal(scoreHeatTier(n+1),i+1);assert.ok(SCORE_HEAT_SCALES[i+1]>SCORE_HEAT_SCALES[i]);});
 const h=createScoreHeat();h.begin('a');h.apply({eventId:'1',before:0,after:800});const leap=h.apply({eventId:'2',before:800,after:6500});assert.equal(leap.tier,10);assert.equal(leap.burst,true);assert.equal(h.apply({eventId:'3',before:6500,after:3000}).tier,7);assert.equal(h.apply({eventId:'4',before:3000,after:6500}).burst,false);assert.equal(h.begin('a'),false);h.begin('b');assert.equal(h.apply({eventId:'1',before:0,after:100}).burst,true);
});


test('0.12 late-boss receipts: new verb PP and same-sentence relative seal survive exact re-analysis',()=>{
 for(const [stage,round,battle,text,check] of [
  ['stage.07',4,32,'I have watched you.',r=>assert.equal(r.bossStateAfter.active,false)],
  ['stage.08',4,37,'I see a dog that runs and you read the book I made.',r=>assert.equal(r.bossStateAfter.unlocked,true)],
 ]){
  const c=stage==='stage.07'?assignedEmber({version:'0.12.0',round}):assignedWaterways({version:'0.12.0',round});
  assignSentence(c,text);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.status,'VALID');check(r);assert.equal(r.versions.balance,'balance.0.10.2');checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});const end=c.getState();assert.equal(validateRunState(end,language),true);assert.deepEqual(new RunController({initialState:end}).getState(),end);
 }
});
