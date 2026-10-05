import test from 'node:test';
import assert from 'node:assert/strict';
import {RunController} from '../src/game/runController.js';
import {newProfile,validateRunState,canSaveRun} from '../src/services/localStore.js';
import {registry} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {resolveAttack} from '../src/engine/stage.js';
import {STAGE1,STAGE2} from '../src/data/stages.js';
import {reviewProfileLearning,learningRecord,displayLearningRecord} from '../src/engine/learningRecords.js';
import {GRAMMAR_GUIDE,LOCATION_GUIDE,DATIVE_GUIDE,formMeaning} from '../src/data/grammarGuideData.js';
import {applyProfileEvent} from '../src/services/localStore.js';
import {VERB_AUDIT_CASES} from './fixtures/verb-audit-cases.js';
import {buildPresentationTimeline} from '../src/engine/presentation.js';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {generateStarterDeck} from '../src/game/deck.js';
export function controllerFixture(text,{turns=6,version='0.2.2',analyzer}={}) {
  const c=new RunController({profile:{...newProfile('검증'),guidedTutorialCompletedVersion:'0.2.1'},...(analyzer?{analyzer}:{})});
  assert.equal(c.dispatch({type:'NEW_RUN',config:{seed:'v022.fixture'}}).ok,true);
  c.dispatch({type:'START_BATTLE'});const s=c.getState();s.version=version;
  const snap=snapshotFromText(text);s.combat.handIds=[];s.combat.sentenceSlots=[];s.combat.discardIds=[];
  for(const [i,t] of snap.orderedTokens.entries()) {const id=s.activeCardIds[i];s.cardInstances[id].cardDefId=t.cardDefId;s.combat.sentenceSlots.push({cardInstanceId:id,selection:{formId:t.selectionId}});}
  s.combat.drawIds=s.activeCardIds.slice(snap.orderedTokens.length);s.combat.turnsRemaining=turns;s.combat.battleDirty=true;
  c._state=s;return c;
}
export function attackText(text,{unlocks=[],stage=STAGE1,runes=[],polish=0,enemy={hp:1000,maxHp:1000,kind:'NORMAL'}}={}) {
  const sentenceSnapshot=snapshotFromText(text),analysis=analyzeSentence(sentenceSnapshot);
  return resolveAttack({sentenceSnapshot,analysis,cards:sentenceSnapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:polish})),enemy,stage,equippedRunes:runes,policyVersion:'0.2.2',comboEligibility:{version:'0.2.2',unlocks}});
}
test('P03–P08 invalid submissions consume physical cards and one turn exactly once, then draw or defeat',()=>{
  for(const text of ['I book happy run','happy','the book'])for(const turns of [6,1]){
    const c=controllerFixture(text,{turns}),before=c.getState(),ids=before.combat.sentenceSlots.map(s=>s.cardInstanceId);
    const out=c.dispatch({type:'SUBMIT',commandId:'one',expectedRevision:before.revision});assert.equal(out.ok,true);assert.equal(out.resolution.zeroReason,'INCOMPLETE_SENTENCE');
    const s=c.getState();assert.equal(s.combat.turnsRemaining,turns-1);assert.deepEqual(s.combat.discardIds,ids.slice().reverse());assert.equal(s.combat.exchangesRemaining,before.combat.exchangesRemaining);assert.equal(s.combat.enemyState.hp,before.combat.enemyState.hp);assert.equal(s.stats.attacks,1);
    assert.equal(c.dispatch({type:'SUBMIT',commandId:'one'}).ok,false);assert.equal(c.dispatch({type:'UNDO'}).ok,false);
    assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:out.resolution.attackId}).ok,true);const finished=c.getState();
    assert.equal(finished.status,turns===1?'DEFEAT':'BATTLE');assert.equal(finished.combat.handIds.length,turns===1?0:3);
    assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:out.resolution.attackId}).ok,false);assert.equal(c.dispatch({type:'UNDO'}).ok,false);
    if(turns>1){assert.equal(canSaveRun(finished),true);assert.equal(validateRunState(finished,registry),true);const restored=new RunController({initialState:finished});assert.deepEqual(restored.getState(),finished);}
  }
});
test('P13–P22 exact locked/unlocked SVOO arithmetic, immutable eligibility and first veil release',()=>{
 const locked=attackText('She gives me a book'),open=attackText('She gives me a book',{unlocks:['pack.svoo']}),harbor=attackText('She gives me a book',{unlocks:['pack.svoo'],stage:STAGE2});
 assert.equal(locked.finalPower,70);assert.equal(open.finalPower,140);assert.equal(harbor.finalPower,175);assert.deepEqual(locked.analysis,open.analysis);assert.deepEqual(open.analysis,harbor.analysis);
 assert.equal(attackText('I give my friend a book').finalPower,80);assert.equal(attackText('I give my friend a book',{unlocks:['pack.svoo']}).finalPower,160);
 assert.equal(locked.scoreTimeline.some(e=>e.sourceId==='FRAME.SVOO'||e.phase==='REGION'),false);
 assert.equal(attackText('She gives me a book',{runes:[{runeId:'rune.svoo'},{runeId:'rune.sv'},{runeId:'rune.svo'}]}).finalPower,70);
 const enemy={hp:640,maxHp:640,kind:'REGIONAL_BOSS',bossMechanic:{id:'SVOO_VEIL',active:true,multiplier:{num:1,den:4}}};
 const topaz=attackText('She gives me a book',{stage:STAGE2,enemy,unlocks:['pack.svoo'],runes:[{runeId:'rune.svoo'}]});assert.equal(topaz.finalPower,262);assert.equal(topaz.bossStateAfter.active,false);assert.equal(enemy.bossMechanic.active,true);
 const pp=attackText('She gives a book to me',{stage:STAGE2,enemy,unlocks:['pack.svoo']});assert.equal(pp.bossStateAfter.active,true);assert.equal(pp.analysis.mainFrameId,'frame.svo');assert.equal(pp.analysis.resolvedTokenRoles.some(r=>r.role==='INDIRECT_OBJECT'),false);
 const p=newProfile('解禁'),once=applyProfileEvent(p,{type:'STAGE1_CLEAR',runId:'test'});assert.deepEqual(applyProfileEvent(once,{type:'STAGE1_CLEAR',runId:'test'}),once);assert.ok(once.unlocks.includes('pack.svoo'));
});
const positive=[
 ['They develop','frame.sv'],['They develop technology','frame.svo'],['He develops','frame.sv'],
 ...['read','eat','help','improve','change'].flatMap(v=>[[`I ${v}`,'frame.sv'],[`I ${v} books`,'frame.svo']]),
 ...['I am happy','I am a student','He is kind','They are students','I am very happy','I am happy at school'].map(s=>[s,'frame.svc'+(s.includes('student')?'.np':'.adj')]),
 ['I am at school','frame.sv'],['He is in the room','frame.sv'],['The book likes music','frame.svo'],
 ...['I give my friend a book','She shows us the book','She sends me a book','She makes me a game'].map(s=>[s,'frame.svoo']),
 ...['I make you happy','I find the book interesting','I keep the room safe','I find him a teacher'].map(s=>[s,'frame.svoc']),
 ...['I want to read','I need to work','I like to read books','They want to develop technology','I want to be happy'].map(s=>[s,'frame.svo']),
 ...['I want you to read','I help you read','I help you to read','I see the dog run','I make you read','They need her to work','I have you read','I feel the dog run'].map(s=>[s,'frame.svoc']),
 ['The dog that runs is happy','frame.svc.adj'],['The students that read books are happy','frame.svc.adj'],['I like the book that you read','frame.svo'],['I like the book you read','frame.svo'],['She sees the dog that I like','frame.svo'],
];
for(const [text,frame] of positive)test(`P24–P42 full structural proof: ${text}`,()=>{const r=attackText(text);assert.equal(r.analysis.status,'VALID',JSON.stringify(r.analysis));assert.equal(r.analysis.mainFrameId,frame);assert.equal(r.accepted,true);assert.ok(r.finalPower>0);assert.deepEqual(r.analysis.coverage.consumedCardIds,r.sentenceSnapshot.orderedTokens.map(t=>t.cardInstanceId));assert.equal(r.scoreTimeline.some(e=>['CLAUSE.INFINITIVE','CLAUSE.RELATIVE','FRAME.SVOC'].includes(e.sourceId)),false);});
test('P25 P28 P37 P40 partial errors versus invalid combinations and omitted relative subjects',()=>{
 for(const [text,code] of [['He develop','SUBJECT_VERB_AGREEMENT'],['She gives I a book','PRONOUN_CASE'],['I want to reads','INFINITIVE_BASE_REQUIRED'],['She give me a book','SUBJECT_VERB_AGREEMENT']]){const r=attackText(text);assert.equal(r.analysis.status,'VALID_WITH_ISSUES');assert.ok(r.analysis.issues.some(i=>i.code===code));assert.ok(r.finalPower>0);}
 for(const text of ['I am','I like you a book','I give','I want','I see the dog to run','I make you to read','The dog runs is happy','I like the book that you read it','I want to read books book','I run happy'])assert.equal(attackText(text).analysis.status,'INVALID_CORE',text);
});
test('P26 Sense registration order never changes normalized grammar or score',()=>{
 const reversed=structuredClone(registry);for(const l of reversed.lexemes)l.senseIds.reverse();
 for(const [text]of positive){const snap=snapshotFromText(text);assert.deepEqual(analyzeSentence(snap,reversed),analyzeSentence(snap));}
});
test('P33 P46 P50–P58 fixed education and evidence-only migration preserve all historical achievements',()=>{
 const r=attackText('I give my friend a book',{unlocks:['pack.svoo']}),record=learningRecord(r);
 assert.equal(record.roles.find(x=>x.role==='INDIRECT_OBJECT').text,'my friend');assert.equal(record.roles.find(x=>x.role==='DIRECT_OBJECT').text,'a book');assert.equal('meaning' in record,false);
 for(const guide of [...Object.values(GRAMMAR_GUIDE),LOCATION_GUIDE,DATIVE_GUIDE])for(const text of guide.examples)assert.equal(analyzeSentence(snapshotFromText(text)).status,'VALID',text);
 const i=registry.lexemes.find(l=>l.lemma==='I');assert.equal(new Set(i.formIds.map(id=>formMeaning(i,registry.formById[id]))).size,3);
 const wrong={...newProfile('old'),bestAttack:999,totalActualDamage:1200,unlocks:['pack.svoo'],grammarRecords:{'FRAME.SV':{count:7,firstSentence:'I am happy.',bestSentence:'I am.',bestPower:999,firstLearning:{sentenceSnapshot:snapshotFromText('I am happy')}}}};
 const fixed=reviewProfileLearning(wrong);assert.deepEqual(fixed.grammarRecords,wrong.grammarRecords);assert.equal(fixed.bestAttack,999);assert.deepEqual(fixed.unlocks,wrong.unlocks);assert.equal(fixed.educationalReview.entries[0].verified.frameId,'frame.svc.adj');assert.equal(fixed.educationalReview.entries[1].verified,null);assert.deepEqual(reviewProfileLearning(fixed),fixed);
 const c=controllerFixture('happy');c.dispatch({type:'SUBMIT'});assert.deepEqual(c.getProfile().grammarRecords,{});assert.equal(c.getProfile().recentSubmissions[0].complete,false);
});
test('P23 P27 P29 every active verb has reviewed positive, agreement and missing-structure fixtures',()=>{
 const active=registry.lexemes.filter(l=>l.pos==='VERB'&&l.runtimeReady).map(l=>l.lemma).sort();assert.deepEqual(Object.keys(VERB_AUDIT_CASES).sort(),active);
 for(const [verb,[good,badForm]]of Object.entries(VERB_AUDIT_CASES)){
  assert.equal(attackText(good).analysis.status,'VALID',good);assert.equal(attackText(badForm).analysis.status,'VALID_WITH_ISSUES',badForm);
  assert.ok(!['VALID','VALID_WITH_ISSUES'].includes(attackText(`${verb} books books books`).analysis.status),verb);
 }
});
test('P12 P21 P63–P64 malformed input is free; zero reasons and short presentation never fake a combo',()=>{
 for(const mutation of [s=>s.combat.sentenceSlots[0].selection={formId:'form.fake'},s=>s.combat.sentenceSlots.push(structuredClone(s.combat.sentenceSlots[0]))]){
  const c=controllerFixture('I run');mutation(c._state);const before=c.getState();assert.equal(c.dispatch({type:'SUBMIT'}).ok,false);assert.deepEqual(c.getState(),before);
 }
 const snapshot=snapshotFromText('He run'),analysis=analyzeSentence(snapshot),cards=snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,baseScore:0}));
 const zero=resolveAttack({sentenceSnapshot:snapshot,analysis,cards,enemy:{hp:77,maxHp:77},policyVersion:'0.2.2',comboEligibility:{version:'0.2.2',unlocks:[]}});assert.equal(zero.finalPower,0);assert.equal(zero.zeroReason,'ACCURACY_ZERO');
 const blocked=resolveAttack({...zero,cards,enemy:{hp:77,maxHp:77},syntheticBossFixture:'IMMUNE_ZERO_DAMAGE_TEST_ONLY'});assert.equal(blocked.zeroReason,'BOSS_BLOCKED');
 const incomplete=attackText('happy');for(const speed of [1,1.5,2]){const timeline=buildPresentationTimeline(incomplete,{speed});assert.equal(timeline.some(x=>x.kind==='SCORE'||x.kind==='LUNGE'),false);assert.ok(timeline.reduce((n,x)=>n+x.duration,0)<2000);}
});
test('P02 P67 40 seed/mode starting decks preserve main physical cards, RNG and generation trace',()=>{
 const golden=JSON.parse(readFileSync(new URL('./fixtures/starter-v021-golden.json',import.meta.url),'utf8'));
 for(const {config,sha256}of golden.fixtures){const {witnesses,...deck}=generateStarterDeck(config);assert.equal(createHash('sha256').update(JSON.stringify(deck)).digest('hex'),sha256,JSON.stringify(config));}
});
test('P21 P55 P61 old recent evidence corrects educational roles, and missing unlock fields grant no wildcard',()=>{
 const old={...learningRecord(attackText('I am a student')),grammarVersion:'0.2.0',scoreableTags:['FRAME.SV'],mainFrameId:'frame.sv'};
 const shown=displayLearningRecord(old);assert.equal(shown.mainFrameId,'frame.svc.np');assert.deepEqual(shown.scoreableTags,[]);assert.equal(shown.finalPower,old.finalPower);assert.equal(old.mainFrameId,'frame.sv');
 const c=controllerFixture('She gives me a book');delete c._state.eligibility;const result=c.dispatch({type:'SUBMIT'});assert.equal(result.ok,true);assert.equal(result.resolution.finalPower,70);assert.deepEqual(result.resolution.comboEligibility.unlocks,[]);
 const frozen=structuredClone(result.resolution);assert.equal(c.setProfile({...c.getProfile(),unlocks:['pack.svoo']}).ok,false);assert.deepEqual(c.getState().stats.lastAttack,frozen);
 const snapshot=snapshotFromText('The dog that the cat that the friend that I like sees likes runs');const limited=analyzeSentence(snapshot);assert.equal(limited.status,'UNSUPPORTED');assert.equal(limited.diagnostics.limit,'RELATIVE_DEPTH');assert.equal(limited.grammarHits.length,0);const bounded=controllerFixture('The dog that the cat that the friend that I like sees likes runs'),before=bounded.getState();assert.equal(bounded.dispatch({type:'SUBMIT'}).ok,false);assert.deepEqual(bounded.getState(),before);
});
test('P09–P12 invalid core never triggers polish, runes, region or boss; exceptions preserve transaction',()=>{
  const r=attackText('I book happy run',{polish:3,runes:[{runeId:'rune.perfectSentence'},{runeId:'rune.polished'}],stage:STAGE2,enemy:{hp:640,maxHp:640,kind:'REGIONAL_BOSS',bossMechanic:{id:'SVOO_VEIL',active:true}}});
  assert.equal(r.finalPower,0);assert.equal(r.scoreTimeline.length,0);assert.equal(r.bossEffects.length,0);assert.equal(r.proposedStateEffects.killGold,0);assert.match(r.feedbackKo,/주어와 동사/);
  for(const analyzer of [()=>{throw Error('test-only');},()=>({status:'UNSUPPORTED',diagnostics:{limit:'WORK_BUDGET'}}),()=>({status:'ENGINE_ERROR'})]){
    const c=controllerFixture('I run',{analyzer}),before=c.getState(),profile=c.getProfile();assert.equal(c.dispatch({type:'SUBMIT'}).ok,false);assert.deepEqual(c.getState(),before);assert.deepEqual(c.getProfile(),profile);
  }
  assert.equal(attackText('I be happy').finalPower,30);assert.equal(attackText('He runs very fast').finalPower,87);
  const old=controllerFixture('happy',{version:'0.2.1'}),before=old.getState();assert.equal(old.dispatch({type:'SUBMIT'}).ok,false);assert.deepEqual(old.getState(),before);
  // Even a profile-reducer failure after grammar/scoring must not erase edit Undo.
  const broken=controllerFixture('I run');broken.profile.appliedAttackIds=null;broken.undo=[{handIds:[],sentenceSlots:[]}];
  const previous=broken.getState(),profile=broken.getProfile(),undo=structuredClone(broken.undo);
  assert.equal(broken.dispatch({type:'SUBMIT'}).ok,false);assert.deepEqual(broken.getState(),previous);assert.deepEqual(broken.getProfile(),profile);assert.deepEqual(broken.undo,undo);
});
