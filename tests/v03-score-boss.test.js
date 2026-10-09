import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {snapshotFromText as currentSnapshot,analyzeSentence as analyzeWithRegistry} from '../src/engine/grammar/index.js';
import {registryForVersion} from '../src/data/language/index.js';
import {TIME_PACKS} from '../src/data/language/timeLanguage.js';
import {resolveAttack,resolveEncounter} from '../src/engine/stage.js';
import {STAGE1,STAGE2,STAGE3,getEncounter} from '../src/data/stages.js';
import {applyRunes} from '../src/engine/runes.js';
import {validateTimeGolem} from '../src/engine/timeGolem.js';
const design=JSON.parse(fs.readFileSync(new URL('./fixtures/v03-design-expectations.json',import.meta.url)));
// Historical score/temporal expectations use their original language/rune view.
const language=registryForVersion('0.3.0');
const snapshotFromText=text=>currentSnapshot(text,{registry:language});
const analyzeSentence=(snapshot,registry=language)=>analyzeWithRegistry(snapshot,registry);
export function attack(text,{unlocks=['pack.svoo',...TIME_PACKS],stage=STAGE3,runes=[],enemy={hp:10000,maxHp:10000,kind:'NORMAL'}}={}){
 const sentenceSnapshot=snapshotFromText(text),analysis=analyzeSentence(sentenceSnapshot),cards=sentenceSnapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:0}));
 return resolveAttack({analysis,cards,sentenceSnapshot,stage,enemy,equippedRunes:runes,policyVersion:'0.3.0',comboEligibility:{version:'0.3.0',unlocks}});
}
for(const c of design.scoreCases)test(`0.3 ${c.id} actual score engine: ${c.context}`,()=>{
 const n=+c.id.slice(1);if(n>=19){
  const snap=snapshotFromText('I like music'),a=analyzeSentence(snap),cards=snap.orderedTokens.map(t=>({instanceId:t.cardInstanceId}));
  const order=n===19?['rune.perfectSentence','rune.svo']:['rune.svo','rune.perfectSentence'];
  assert.equal(applyRunes(a,{preRuneScore:100,events:[],excludedCardIds:[],contributingCardIds:cards.map(c=>c.instanceId)},order.map(runeId=>({runeId})),cards).postRuneScore,c.expectedPower);return;
 }
 const runes=[...([9,10,12].includes(n)?[{runeId:'rune.svoo',level:n===10?3:1}]:[]),...([11,12].includes(n)?[{runeId:'rune.longSentence',level:1}]:[])];
 const r=attack(c.sentence,{stage:n<=7?STAGE1:n<=12?STAGE2:STAGE3,runes,unlocks:n===6?[]:['pack.svoo',...TIME_PACKS]});
 assert.equal(r.finalPower,c.expectedPower,JSON.stringify(r.scoreTimeline));
 const events=r.scoreTimeline.filter(e=>!['CARD_BASE','ACCURACY'].includes(e.phase)&&e.phase!=='FINAL_POWER');
 assert.deepEqual(events.map(e=>e.after),c.arithmeticTrace.map(e=>e.after).slice(n===4?1:0));
});
for(const c of design.longRuneThresholdCases)test(`0.3 ${c.id} synthetic contribution threshold Lv${c.level} / ${c.validContributingCardCount}`,()=>{
 // Synthetic contribution set tests the rune boundary independently of parsing.
 const a=analyzeSentence(snapshotFromText('I run')),cards=Array.from({length:16},(_,i)=>({instanceId:`threshold.${i}`}));
 const result=applyRunes({...a,grammarHits:[]},{preRuneScore:100,events:[],contributingCardIds:cards.slice(0,c.validContributingCardCount).map(c=>c.instanceId),excludedCardIds:cards.slice(c.validContributingCardCount).map(c=>c.instanceId)},[{runeId:'rune.longSentence',level:c.level}],cards);
 assert.equal(result.runeEvents.length,c.expectedTrigger?1:0);assert.equal(result.postRuneScore,Math.floor(100*c.expectedMultiplier.num/c.expectedMultiplier.den));
});
test('0.3 locked time: real grammar and normal damage, no time/region bonus; malformed links single deduction',()=>{
 const r=attack('I have played games',{unlocks:[]});assert.equal(r.analysis.status,'VALID');assert.equal(r.finalPower,126);assert.equal(r.scoreTimeline.some(e=>e.phase==='REGION'||e.phase==='CONSTRUCTIONS'),false);
 for(const text of ['He will runs','I have went','I will had played games']){const r=attack(text);assert.equal(r.scoreTimeline.filter(e=>e.sourceId==='AUXILIARY_FORM_REQUIRED').length,1);assert.equal(r.scoreTimeline.some(e=>e.phase==='CONSTRUCTIONS'||e.phase==='COMPLETE_BONUS'),false);}
 for(const text of ['I running','I will','I have been','I book happy run']){const r=attack(text);assert.equal(r.finalPower,0);assert.equal(r.accepted,true);assert.equal(r.proposedStateEffects.consumeTurn,true);assert.equal(r.proposedStateEffects.discardCardIds.length,r.sentenceSnapshot.orderedTokens.length);}
});
test('0.3 golem pure proposals: one phase, zero carryover, block, final kill; original evidence survives locks',()=>{
 let enemy=getEncounter('stage.03',4,'0.3.0');enemy.maxHp=enemy.hp;
 const apply=(text,power)=>{const a=analyzeSentence(snapshotFromText(text)),copy=structuredClone(enemy),r=resolveEncounter({...a,grammarHits:[]},power,enemy,{stage:STAGE3,originalAnalysis:a});assert.deepEqual(enemy,copy);enemy={...enemy,hp:r.enemyHpAfter,bossMechanic:r.bossStateAfter};validateTimeGolem(enemy);return r;};
 let r=apply('I played games',600);assert.equal(r.actualHpLoss,240);assert.equal(r.phaseExcess,360);assert.equal(r.overkill,0);assert.equal(r.enemyHpAfter,480);assert.equal(r.killed,false);
 r=apply('I played games',600);assert.equal(r.finalPower,0);assert.equal(r.actualHpLoss,0);assert.equal(r.preBossScore,600);assert.equal(r.bossStateAfter.activePhase,1);
 r=apply('I play games',300);assert.equal(r.enemyHpAfter,240);assert.equal(r.phaseExcess,60);
 r=apply('I will play games',400);assert.equal(r.enemyHpAfter,0);assert.equal(r.phaseExcess,160);assert.equal(r.killed,true);
});
test('0.3 golem accepts finite relative time, rejects nonfinite and malformed/unselected be',()=>{
 const enemy=getEncounter('stage.03',4,'0.3.0');
 for(const [text,hit]of [['I like the book that she made',true],['I want to have read the book',false],['I will had played games',false],['They was running',true]])assert.equal(attack(text,{enemy,unlocks:[]}).actualHpLoss>0,hit,text);
 enemy.bossMechanic.activePhase=1;enemy.bossMechanic.phases[0].hp=0;enemy.bossMechanic.phases[0].broken=true;enemy.hp=480;
 assert.equal(attack('I be happy',{enemy}).actualHpLoss,0);
});
test('0.3 independent base attack goldens preserve old numerical/rune/event contracts',()=>{
 const golden=JSON.parse(fs.readFileSync(new URL('./fixtures/v03-legacy-golden.json',import.meta.url)));
 for(const c of golden.cases){const analysis=analyzeSentence(c.snapshot,registryForVersion(c.version));
  const result=resolveAttack({analysis,sentenceSnapshot:c.snapshot,cards:c.snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:0})),stage:STAGE1,enemy:{hp:242,maxHp:242,kind:'REGIONAL_BOSS'},policyVersion:c.version,comboEligibility:c.version==='0.2.2'?{unlocks:['pack.svoo']}:null});assert.deepEqual(result,c.result,`${c.version}: ${c.text}`);
 }
});
