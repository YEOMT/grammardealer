import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeSentence,snapshotFromText} from '../src/engine/grammar/index.js';
import {buildRuneEvidence} from '../src/engine/runeEvidence.js';
import {applyRunes} from '../src/engine/runes.js';
import {scoreAttack} from '../src/engine/scoring.js';
import {scoreableAnalysis} from '../src/engine/comboEligibility.js';
import {registryForVersion} from '../src/data/language/index.js';
import {runesForVersion} from '../src/data/runes.js';
import {getEncounter} from '../src/data/stages.js';
import {RunController} from '../src/game/runController.js';
import {newProfile,validateRunState} from '../src/services/localStore.js';
const fixture=name=>JSON.parse(fs.readFileSync(new URL('./fixtures/v0101/fixtures/'+name,import.meta.url)));
const unlocks=['pack.svoo','pack.svoc.basic','pack.time.past','pack.time.progressive','pack.time.perfect','pack.time.futureWill','pack.clauseLink','pack.infinitive','pack.gerund','pack.passive','pack.relative','pack.relativeAdverb','pack.corridor','pack.participles','pack.causativePerception'];
for(const row of fixture('rune_grammar_cases.json').cases)test('0.10.1 '+(row.id==='G030'?'unavailable vocabulary detection (original target NOT RUN) ':'real parser ')+row.id+' '+row.sentence,()=>{
 const snapshot=snapshotFromText(row.sentence),analysis=analyzeSentence(snapshot);
 if(row.id==='G030'){assert.deepEqual(snapshot.orderedTokens.filter(t=>t.unsupportedFixture).map(t=>t.surface),['boy']);assert.equal(analysis.status,'UNSUPPORTED');return;} // Supplied G030 target: NOT RUN (boy absent). Separate registered-card equivalent below.
 assert.ok(!['ENGINE_ERROR','UNSUPPORTED'].includes(analysis.status),JSON.stringify(analysis.diagnostics));
 const locked=({'PAST_GRAMMAR_LOCKED':'pack.time.past','SVOC_GRAMMAR_LOCKED':'pack.svoc.basic'})[row.setup];
 const eligibility={unlocks:unlocks.filter(x=>x!==locked)},evidence=buildRuneEvidence(analysis,eligibility);
 for(const id of row.runeMustTrigger)assert.equal(evidence[id]?.eligible,true,id);
 for(const id of row.runeMustNotTrigger)assert.equal(evidence[id]?.eligible,false,id);
 if(!['VALID','VALID_WITH_ISSUES'].includes(analysis.status))return;
 const cards=snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,baseScore:10,polishLevel:0}));
 const eligible=scoreableAnalysis(analysis,eligibility),score=scoreAttack(analysis,cards,{eligibleAnalysis:eligible});
 for(const id of [...row.runeMustTrigger,...row.runeMustNotTrigger]){
  const r=applyRunes(eligible,score,[{runeId:id,level:1}],cards,{version:'0.10.1',runeEvidence:evidence});
  assert.equal(r.runeEvents.length,row.runeMustTrigger.includes(id)?1:0,id);
  for(const event of r.runeEvents){assert.ok(event.evidenceRefs.length);assert.ok(event.highlightCardIds.length);assert.equal(new Set(event.highlightCardIds).size,event.highlightCardIds.length);assert.ok(event.highlightCardIds.every(id=>cards.some(c=>c.instanceId===id)));}
 }
});
for(const row of fixture('score_cases.json').cases.filter(x=>x.kind==='SYNTHETIC_ARITHMETIC'))test('0.10.1 synthetic arithmetic '+row.id,()=>{
 const a=analyzeSentence(snapshotFromText('I work.')),cards=[{instanceId:'fixture.0',baseScore:10},{instanceId:'fixture.1',baseScore:10}];
 const r=applyRunes(a,{preRuneScore:row.before,events:[],contributingCardIds:cards.map(c=>c.instanceId),excludedCardIds:[]},[{runeId:row.runeId,level:row.level}],cards,{version:'0.10.1',runeEvidence:{[row.runeId]:{eligible:row.eligible,cardIds:['fixture.1'],evidenceRefs:['synthetic']}}});
 assert.equal(r.postRuneScore,row.expectedAfter);assert.equal(r.runeEvents.length,row.expectedEventCount);
});
test('0.10.1 separate rune IDs, confirmed HP and unchanged historical policy',()=>{
 const old=runesForVersion('0.10.0'),current=runesForVersion('0.10.1');assert.equal(current.length,22);assert.deepEqual(current.slice(0,12),old);
 assert.equal(current.find(r=>r.id==='rune.gerund').nameKo,'자수정 룬');assert.equal(current.find(r=>r.id==='rune.svoo').nameKo,'토파즈 룬');
 for(const [stage,hps]of [[2,[200,270,360,750]],[3,[300,320,360,400,780]],[4,[500,530,570,600,1000]],[5,[640,680,740,800,1300]]])for(const [i,hp]of hps.entries())assert.equal(getEncounter(`stage.0${stage}`,i,'0.10.1').hp,hp);
 for(const stage of [1,6,7,8,9,10])for(let i=0;i<(stage===1?3:5);i++)assert.deepEqual(getEncounter('stage.'+String(stage).padStart(2,'0'),i,'0.10.1'),getEncounter('stage.'+String(stage).padStart(2,'0'),i,'0.10.0'));
 assert.deepEqual(getEncounter('stage.03',4,'0.10.1').bossMechanic.phases.map(p=>p.hp),[260,260,260]);
 assert.deepEqual(getEncounter('stage.03',4,'0.10.0').bossMechanic.phases.map(p=>p.hp),[280,280,280]);
 const c=new RunController({profile:newProfile('QA')});assert.ok(c.dispatch({type:'NEW_RUN',config:{seed:'0101.policy'}}).ok);assert.equal(c.getState().version,'0.10.1');assert.equal(c.getState().activeCardIds.length,28);assert.equal(validateRunState(c.getState(),registryForVersion('0.10.1')),true);
});

test('0.10.1 registered-card alternative to unavailable G030 (not the original fixture)',()=>{const a=analyzeSentence(snapshotFromText('I know the teacher who helped me.'));assert.equal(a.status,'VALID');assert.equal(buildRuneEvidence(a,{unlocks})['rune.relative'].eligible,true);});
