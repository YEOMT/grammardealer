import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {registryForVersion} from '../src/data/language/index.js';import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {resolveAttack} from '../src/engine/stage.js';import {STAGE4,getEncounter} from '../src/data/stages.js';
import {skyShieldReleaseHits} from '../src/engine/skyShield.js';
import {resolveTimeGolem} from '../src/engine/timeGolem.js';
import {newProfile,applyProfileEvent} from '../src/services/localStore.js';
import {assertSerializable} from '../src/contracts.js';
const cases=JSON.parse(fs.readFileSync(new URL('./fixtures/v04-scoring-expectations.json',import.meta.url))).cases,registry=registryForVersion('0.4.0');
test('0.4 linked past and future evidence still breaks only the active golem part without overflow',()=>{const s=snapshotFromText('I played games and she will work',{registry}),a=analyzeSentence(s,registry);assert.equal(a.status,'VALID');assert.ok(a.grammarHits.some(h=>h.tag==='LINK.CLAUSE'));const enemy=getEncounter('stage.03',4,'0.4.0'),r=resolveTimeGolem(a,2000,enemy);assert.equal(r.actualHpLoss,240);assert.equal(r.phaseExcess,1760);assert.equal(r.bossStateAfter.activePhase,1);assert.deepEqual(r.bossStateAfter.phases.map(p=>p.hp),[0,240,240]);});
function attack(text,{shield=true,unlocks=null,runes=[],enemy=getEncounter('stage.04',4,'0.4.0'),polishLevel=0}={}){enemy=structuredClone(enemy);enemy.bossMechanic.active=shield;const s=snapshotFromText(text,{registry}),analysis=analyzeSentence(s,registry);return resolveAttack({analysis,sentenceSnapshot:s,cards:s.orderedTokens.map(t=>({instanceId:t.cardInstanceId,polishLevel})),equippedRunes:runes,enemy,stage:STAGE4,policyVersion:'0.4.0',comboEligibility:unlocks===null?null:{version:'0.4.0',unlocks}});}
test('0.4 failed sentence learning followed by normal attacks and milestones remains persistable',()=>{let p=newProfile('profile serialization regression');for(const [i,text]of ['happy','Because she works','I like music and she','I work','I think that she works'].entries()){const r=attack(text);r.attackId=`serial.${i}`;p=applyProfileEvent(p,{type:'ATTACK',resolution:r});assert.equal(assertSerializable(p),true,text);}p=applyProfileEvent(p,{type:'STAGE1_CLEAR',runId:'serial.run'});assert.equal(assertSerializable(p),true);assert.deepEqual(p.qualifiedRunIds,['serial.run']);assert.equal(p.recentSubmissions.find(r=>r.recordId==='serial.0').primaryScoringClauseId,null);});
for(const c of cases)test(`0.4 actual grammar-score-rune-region-shield ${c.id}`,()=>{
 const r=attack(c.text,{shield:c.shield_before,runes:c.runes.map((r,i)=>({instanceId:`r${i}`,runeId:r.rune.split('/')[0].replace('rune.long','rune.longSentence'),level:1}))});
 // S003's design arithmetic omitted the existing +5 home-place adverb hit. Keep the 0.3 rule.
 const expected=c.id==='S003'?401:c.expected_arithmetic.damage_power;
 assert.equal(r.finalPower,expected);assert.equal(r.actualHpLoss,Math.min(expected,640));assert.equal(r.enemyHpAfter,Math.max(0,640-expected));assert.equal(r.bossStateAfter.active,c.expected_arithmetic.shield_active_after);
 assert.equal(r.scoreTimeline.filter(e=>e.phase==='COMPLETE_BONUS').length,c.complete?1:0);assert.equal(r.scoreTimeline.filter(e=>e.sourceId==='LINK.CLAUSE').length,c.link_bonus?1:0);assert.equal(r.scoreTimeline.filter(e=>e.sourceId==='LINK.PHRASE').length,c.phrase_bonus?1:0);
});
test('0.4 S003 deviation is an independently evidenced pre-existing home bonus, not a new rebalance',()=>{
 const old=registryForVersion('0.3.0'),s=snapshotFromText('She comes home',{registry:old}),a=analyzeSentence(s,old);assert.ok(a.grammarHits.some(h=>h.tag==='MODIFIER.ADVERB'&&h.cardIds.includes(s.orderedTokens[2].cardInstanceId)));
 const r=attack('I read a book when she comes home');assert.deepEqual(r.scoreTimeline.filter(e=>['LINKS','SIMPLE_MODIFIERS','REGION'].includes(e.phase)).map(e=>e.after),[316,321,401]);
});
test('0.4 score order applies time, one clause link, one distinct phrase link then modifiers/runes/region',()=>{
 const r=attack('I played games and music because she will work');assert.equal(r.analysis.status,'VALID');const events=r.scoreTimeline;const index=id=>events.findIndex(e=>e.sourceId===id);
 assert.ok(index('TIME.PAST')<index('TIME.FUTURE_WILL'));assert.ok(index('TIME.FUTURE_WILL')<index('LINK.CLAUSE'));assert.ok(index('LINK.CLAUSE')<index('LINK.PHRASE'));assert.ok(index('LINK.PHRASE')<index('stage.04'));
 const triple=attack('I run and you work and she plays games');assert.equal(triple.scoreTimeline.filter(e=>e.sourceId==='LINK.CLAUSE').length,1);assert.equal(triple.scoreTimeline.filter(e=>e.phase==='MAIN_FRAME').length,1);assert.match(triple.scoreTimeline.find(e=>e.phase==='MAIN_FRAME').labelKo,/첫 번째 절/);
});
test('0.4 locked combos remain real attacks and explicit clauses break shield from original grammar',()=>{
 const locked=attack('I like music and she likes books',{unlocks:[]});assert.equal(locked.analysis.status,'VALID');assert.equal(locked.finalPower,180);assert.equal(locked.bossStateAfter.active,false);assert.equal(locked.scoreTimeline.some(e=>['LINKS','REGION'].includes(e.phase)),false);
 const omitted=attack('I think she likes music',{unlocks:['pack.clauseLink']});assert.equal(omitted.finalPower,143);assert.equal(omitted.bossStateAfter.active,true);
});
test('0.4 shield persists broken, accepts recoverable links, and never enforces a damage cap',()=>{
 const first=attack('I am happy and you are kind');assert.equal(first.finalPower,320);const second=attack('I am happy and you are kind',{shield:false,enemy:{...getEncounter('stage.04',4,'0.4.0'),hp:first.enemyHpAfter}});assert.equal(second.killed,true);
 const minor=attack('I like music and she like books');assert.equal(minor.analysis.status,'VALID_WITH_ISSUES');assert.equal(minor.bossStateAfter.active,false);
 const strong=attack('I like the very good book',{polishLevel:3,runes:[{runeId:'rune.longSentence',level:3},{runeId:'rune.svo',level:3},{runeId:'rune.perfectSentence',level:3}]});assert.equal(strong.bossStateAfter.active,true);assert.equal(strong.killed,true);assert.ok(strong.preBossScore>1280);
 for(const text of ['I like music and she','Because she works']){const r=attack(text);assert.equal(r.finalPower,0);assert.equal(r.actualHpLoss,0);assert.equal(skyShieldReleaseHits(r.analysis).length,0);assert.equal(r.proposedStateEffects.bossMechanic,undefined);}
});
test('0.4 know accuracy policy is -10 and suppresses complete/its progressive while preserving link',()=>{
 const r=attack('I am knowing that she works');assert.equal(r.analysis.status,'VALID_WITH_ISSUES');assert.equal(r.scoreTimeline.find(e=>e.sourceId==='ASPECT_USAGE').operand,-10);assert.equal(r.scoreTimeline.some(e=>e.sourceId==='TIME.PROGRESSIVE'||e.phase==='COMPLETE_BONUS'),false);assert.equal(r.bossStateAfter.active,false);
});
