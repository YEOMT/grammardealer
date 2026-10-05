import test from 'node:test';import assert from 'node:assert/strict';
import {registry,registryForVersion} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {getEncounter,STAGE3} from '../src/data/stages.js';
import {resolveAttack} from '../src/engine/stage.js';
import {reviewProfileLearning,displayLearningRecord} from '../src/engine/learningRecords.js';
import {TIME_PACKS} from '../src/data/language/timeLanguage.js';
import {RunController} from '../src/game/runController.js';
import {newProfile} from '../src/services/localStore.js';
import {RUNES,LEGACY_RUNES} from '../src/data/runes.js';
import {createRewardOffer} from '../src/game/rewards.js';
import {createShop,grantStage2Entry} from '../src/game/shop.js';
const paradigms=`be|was|being|been
have|had|having|had
do|did|doing|done
go|went|going|gone
come|came|coming|come
run|ran|running|run
live|lived|living|lived
work|worked|working|worked
play|played|playing|played
eat|ate|eating|eaten
read|read|reading|read
like|liked|liking|liked
want|wanted|wanting|wanted
need|needed|needing|needed
make|made|making|made
give|gave|giving|given
see|saw|seeing|seen
help|helped|helping|helped
feel|felt|feeling|felt
become|became|becoming|become
look|looked|looking|looked
take|took|taking|taken
keep|kept|keeping|kept
find|found|finding|found
show|showed|showing|shown
create|created|creating|created
improve|improved|improving|improved
develop|developed|developing|developed
change|changed|changing|changed
send|sent|sending|sent`.split('\n').map(s=>s.split('|'));
test('0.3 reviewed 30 paradigms: independent spellings and actual past/perfect frames',()=>{
 assert.equal(paradigms.length,30);
 for(const [lemma,past,ing,pp]of paradigms){const lex=registry.lexemes.find(l=>l.pos==='VERB'&&l.lemma===lemma),forms=lex.formIds.map(id=>registry.formById[id]);
  for(const [tense,surface]of [['PAST',past],['PRESENT_PARTICIPLE',ing],['PAST_PARTICIPLE',pp]])assert.ok(forms.some(f=>f.surface===surface&&f.grammaticalFeatures.tense===tense),lemma+' '+surface);
  const tail=lex.frameIds.includes('frame.sv')?'':lex.frameIds.includes('frame.svc.adj')?' happy':' books';
  for(const text of [`I ${past}${tail}`,`I have ${pp}${tail}`])assert.equal(analyzeSentence(snapshotFromText(text)).status,'VALID',text);
 }
});
test('0.3 full noun audit: article, bare and plural rules remain distinct',()=>{
 for(const l of registry.lexemes.filter(l=>l.pos==='NOUN'&&l.runtimeReady)){
  const count=registry.senseById[l.senseIds[0]].countability,article=/^[aeiou]/.test(l.lemma)?'an':'a';
  const a=analyzeSentence(snapshotFromText(`I like ${article} ${l.lemma}`));assert.equal(a.status,count==='MASS'?'VALID_WITH_ISSUES':'VALID',l.lemma);
  assert.equal(a.issues.some(i=>i.code==='ARTICLE_COUNTABILITY_MISMATCH'),count==='MASS');
  const bare=analyzeSentence(snapshotFromText(`I like ${l.lemma}`));assert.equal(bare.status,count==='COUNT'?'VALID_WITH_ISSUES':'VALID',l.lemma);
  for(const f of l.formIds.map(id=>registry.formById[id]).filter(f=>f.grammaticalFeatures.number==='PLURAL'))assert.equal(analyzeSentence(snapshotFromText(`I like ${f.surface}`)).status,'VALID',f.surface);
 }
});
test('0.3 all 12 finite families target exactly their golem phase, with locked time effects',()=>{
 const forms=[['PAST','I played games','I was playing games','I had played games','I had been playing games'],['PRESENT','I play games','I am playing games','I have played games','I have been playing games'],['FUTURE','I will play games','I will be playing games','I will have played games','I will have been playing games']];
 for(let phase=0;phase<3;phase++)for(const [family,...sentences]of forms)for(const text of sentences){const enemy=getEncounter('stage.03',4,'0.3.0');enemy.bossMechanic.activePhase=phase;enemy.hp=720-phase*240;for(let i=0;i<phase;i++)Object.assign(enemy.bossMechanic.phases[i],{hp:0,broken:true});
  const snapshot=snapshotFromText(text),a=analyzeSentence(snapshot),r=resolveAttack({analysis:a,sentenceSnapshot:snapshot,cards:snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId})),stage:STAGE3,enemy,policyVersion:'0.3.0',comboEligibility:{version:'0.3.0',unlocks:[]}});
  assert.equal(r.actualHpLoss>0,family===forms[phase][0],text);assert.ok(r.preBossScore>0);assert.equal(r.scoreTimeline.some(e=>e.phase==='CONSTRUCTIONS'||e.phase==='REGION'),false);assert.deepEqual(r.analysis,a);
 }
});
test('0.3 old technology education review is idempotent and leaves historical numeric records untouched',()=>{
 const snapshot=snapshotFromText('I develop a technology',{registry:registryForVersion('0.2.2')});
 const record={grammarVersion:'0.2.2',sentenceSnapshot:snapshot,status:'VALID_WITH_ISSUES',issues:[{code:'ARTICLE_COUNTABILITY_MISMATCH'}],scoreableTags:['FRAME.SVO'],finalPower:17,actualHpLoss:9};
 const before=structuredClone(record),review=displayLearningRecord(record);assert.equal(review.status,'VALID');assert.equal(review.finalPower,17);assert.equal(review.actualHpLoss,9);assert.deepEqual(record,before);
 const profile={bestAttack:999,totalActualDamage:888,gold:777,grammarRecords:{'FRAME.SVO':{count:3,bestPower:17,bestSentence:'I develop a technology',bestLearning:record}}};const p=reviewProfileLearning(profile);assert.deepEqual(p.grammarRecords,profile.grammarRecords);assert.equal(p.bestAttack,999);assert.equal(p.totalActualDamage,888);assert.deepEqual(reviewProfileLearning(p),p);
});
test('0.3 real duplicate physical cards are rejected; two distinct have copies remain valid',()=>{
 const s=snapshotFromText('I have had a book');assert.equal(analyzeSentence(s).status,'VALID');s.orderedTokens[2].cardInstanceId=s.orderedTokens[1].cardInstanceId;assert.equal(analyzeSentence(s).status,'ENGINE_ERROR');
});

test('0.3 Meteor is the twelfth rune, never fixed/basic introductory choice, but available in full pool, rewards and shop',()=>{
 assert.equal(LEGACY_RUNES.length,11);assert.equal(RUNES.length,12);assert.equal(RUNES.find(r=>r.id==='rune.longSentence').firstRuneBasicPoolEligible,false);
 const seen={full:false,reward:false,shop:false};
 for(let i=0;i<200;i++){const profile={...newProfile('pool audit'),guidedTutorialCompletedVersion:'0.2.1'},c=new RunController({profile});c.dispatch({type:'NEW_RUN',config:{seed:`meteor.pool.${i}`}});const s=c.getState();s.progress={stageId:'stage.01',roundIndex:1,battleNumber:2,contentBoundary:null};
  const first=createRewardOffer(structuredClone(s),profile);assert.deepEqual(first.choices.map(c=>c.runeId),['rune.perfectSentence','rune.short','rune.discards']);
  const later=createRewardOffer(structuredClone(s),{...profile,firstRuneIntroSeen:true});assert.equal(later.choices.slice(0,2).some(c=>c.runeId==='rune.longSentence'),false);seen.full||=later.choices.some(c=>c.runeId==='rune.longSentence');
  s.progress={stageId:'stage.02',roundIndex:0,battleNumber:4,contentBoundary:null};const reward=createRewardOffer(structuredClone(s),profile);seen.reward||=reward.choices.some(c=>c.runeId==='rune.longSentence');grantStage2Entry(s);seen.shop||=createShop(structuredClone(s)).inventory.some(c=>c.runeId==='rune.longSentence');
 }
 assert.deepEqual(seen,{full:true,reward:true,shop:true});
});
