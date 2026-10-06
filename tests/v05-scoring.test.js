import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {registryForVersion} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {resolveAttack} from '../src/engine/stage.js';
import {STAGE1,STAGE_BY_ID,getEncounter} from '../src/data/stages.js';
import {assertSerializable} from '../src/contracts.js';
import {newProfile,applyProfileEvent} from '../src/services/localStore.js';
const items=JSON.parse(fs.readFileSync(new URL('./fixtures/v05-scoring-expectations.json',import.meta.url))).items;
const packs=['pack.infinitive','pack.gerund','pack.svoc.basic','pack.svoo','pack.clauseLink','pack.time.past','pack.time.progressive','pack.time.perfect','pack.time.futureWill'];
function attack(text,{unlocks=packs,stage=STAGE_BY_ID['stage.05'],runes=[],forms={}}={}){
 const registry=registryForVersion('0.5.0'),sentenceSnapshot=snapshotFromText(text,{registry,selections:forms});
 // Explicit selections preserve same-spelling read/past/pp choices rather than changing the grammar.
 for(const [index,formId]of Object.entries(forms)){const t=sentenceSnapshot.orderedTokens[index];t.selectionId=formId;t.allowedFormCandidates=[formId];t.surface=registry.formById[formId].surface;}
 const analysis=analyzeSentence(sentenceSnapshot,registry);
 return resolveAttack({analysis,sentenceSnapshot,cards:sentenceSnapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,polishLevel:0})),equippedRunes:runes,stage,enemy:{id:'score.assigned',hp:10000,maxHp:10000,kind:'NORMAL'},policyVersion:'0.5.0',comboEligibility:{version:'0.5.0',unlocks}});
}
for(const row of items)test(`0.5 supplied independent arithmetic through real parser ${row.id}`,()=>{
 const noDesert=Boolean(row.unlocks),stage=row.id==='S021'?{...STAGE1,focusFrames:[]}:row.id==='S022'?STAGE1:STAGE_BY_ID['stage.05'];
 const runes=row.runes.map(([id],i)=>({instanceId:`r${i}`,runeId:{EMERALD_L1:'rune.svo',METEOR_L1_5_9:'rune.longSentence',ADD:'rune.perfectSentence'}[id],level:1}));
 const r=attack(row.sentence,{stage,runes,unlocks:noDesert?packs.filter(p=>!['pack.infinitive','pack.gerund','pack.svoc.basic'].includes(p)):packs});
 assert.equal(r.accepted,true);assert.equal(r.finalPower,row.expectedPower,JSON.stringify(r.analysis.diagnostics));
 assert.equal(r.scoreTimeline.filter(e=>e.sourceId==='CLAUSE.INFINITIVE').length,row.infinitive?1:0);
 assert.equal(r.scoreTimeline.filter(e=>e.sourceId==='CLAUSE.GERUND').length,row.gerund?1:0);
 assert.equal(r.scoreTimeline.filter(e=>e.phase==='REGION').length,row.regionApplied?1:0);
 assert.equal(r.scoreTimeline.filter(e=>e.phase==='COMPLETE_BONUS').length,row.complete?1:0);
 // Every multiply floors immediately using its actual rational operand; no final-only rounding.
 for(const e of r.scoreTimeline.filter(e=>e.operation==='MULTIPLY'))assert.equal(e.after,Math.floor(e.before*e.operand.num/e.operand.den));
 assert.equal(assertSerializable(r),true);
});
test('0.5 normal locked SVOC is an attack but neither SVOC nor nonfinite nor region gets a bonus',()=>{
 const r=attack('I want you to read a book',{unlocks:[]});assert.equal(r.analysis.status,'VALID');assert.equal(r.finalPower,100);assert.equal(r.scoreTimeline.some(e=>['MAIN_FRAME','REGION'].includes(e.phase)),false);
});
test('0.5 nonfinite families multiply once, after finite time and before clause linking',()=>{
 const r=attack('I wanted to enjoy reading books because she works');assert.equal(r.analysis.status,'VALID');
 const tags=r.scoreTimeline.map(e=>e.sourceId);for(const [a,b] of [['TIME.PAST','CLAUSE.INFINITIVE'],['CLAUSE.INFINITIVE','CLAUSE.GERUND'],['CLAUSE.GERUND','LINK.CLAUSE'],['LINK.CLAUSE','stage.05']])assert.ok(tags.indexOf(a)<tags.indexOf(b),a+' before '+b);
 const twice=attack('I enjoy reading books and playing games');assert.equal(twice.scoreTimeline.filter(e=>e.sourceId==='CLAUSE.GERUND').length,1);assert.equal(twice.scoreTimeline.filter(e=>e.sourceId==='LINK.PHRASE').length,1);
});
test('0.5 inner nonfinite time cannot break past golem or release finite-clause sky shield',()=>{
 for(const text of ['I want to have read books','Reading books is good']){
  const r=attack(text);assert.equal(r.analysis.status,'VALID');assert.equal(r.analysis.grammarHits.some(h=>['TIME.PAST','TIME.PROGRESSIVE','TIME.PERFECT'].includes(h.tag)),false);
  const input={analysis:r.analysis,sentenceSnapshot:r.sentenceSnapshot,cards:r.cardScoringSnapshot,stage:STAGE_BY_ID['stage.03'],enemy:getEncounter('stage.03',4,'0.5.0'),policyVersion:'0.5.0',comboEligibility:{version:'0.5.0',unlocks:packs}};
  assert.equal(resolveAttack(input).actualHpLoss,0);
  const sky=resolveAttack({...input,stage:STAGE_BY_ID['stage.04'],enemy:getEncounter('stage.04',4,'0.5.0')});assert.equal(sky.bossStateAfter.active,true);
 }
});
test('0.5 failed submission cannot be revived by added runes; failed then valid profile serializes',()=>{
 let p=newProfile('serialization');for(const [i,text]of ['Reading books','I enjoy to read books','I enjoy reading books','My hobby is reading books'].entries()){
  const r=attack(text,{runes:[{runeId:'rune.perfectSentence',level:3}]});if(i<2){assert.equal(r.finalPower,0);assert.equal(r.proposedStateEffects.consumeTurn,true);assert.deepEqual(r.scoreTimeline,[]);}
  r.attackId='v05.serial.'+i;p=applyProfileEvent(p,{type:'ATTACK',resolution:r});assert.equal(assertSerializable(p),true);
 }
 const stored=JSON.parse(JSON.stringify(p));assert.equal(stored.recentSubmissions.length,4);assert.ok(stored.recentSubmissions.some(r=>r.nonfinitePhrases?.length));
});
