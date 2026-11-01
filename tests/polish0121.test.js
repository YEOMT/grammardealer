import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registryForVersion,formsForCard,createSentenceSnapshot,makeToken} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {generateStarterDeck,validateStarterDeck} from '../src/game/deck.js';
import {RunController} from '../src/game/runController.js';
import {newProfile,validateRunState} from '../src/services/localStore.js';
import {eligibleRewardCards} from '../src/game/rewards.js';
import {visibleForms,formLabel} from '../src/ui/formView.js';
import {campaignBattleCount} from '../src/data/campaignFeatures.js';
import {matchFinaleTask} from '../src/game/finaleTasks.js';
import {RunController as Legacy012} from './helpers/legacy-012-controller.js';
import {checked,assignSentence} from './helpers/waterways-state.js';
import {stageForRun,getEncounter} from '../src/data/stages.js';
import {combatBalanceForVersion,scoreBalanceForVersion} from '../src/data/balance.js';
import {runesForVersion} from '../src/data/runes.js';
import {resolveLibraryTurnEnd} from '../src/engine/libraryTurnEnd.js';
import {buildRuneEvidence} from '../src/engine/runeEvidence.js';
const r=registryForVersion('0.12.1');
const cases=JSON.parse(fs.readFileSync(new URL('./fixtures/polish0121/language.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
function physical(text,version='0.12.1'){
 const registry=registryForVersion(version),tokens=snapshotFromText(text,{registry}).orderedTokens;
 // better is genuinely ambiguous across physical cards; this case explicitly owns well.
 for(const t of tokens)if(t.surface==='better'){Object.assign(t,makeToken(t.cardInstanceId,'card.well','form.well.comparative',t.position,registry));}
 assert.ok(tokens.every(t=>t.cardDefId),text+' requires real registered cards');
 const cards=Object.fromEntries(tokens.map(t=>[t.cardInstanceId,{instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:0,specialEffectId:null}]));
 return createSentenceSnapshot(tokens.map(t=>({cardInstanceId:t.cardInstanceId,selection:t.selectionId})),cards,{languageVersion:version});
}
const analyze=t=>analyzeSentence(physical(t),r);
for(const c of cases.filter(c=>c.id.startsWith('L')))test('0.12.1 '+c.id+' '+c.text,()=>{
 const a=analyze(c.text);assert.equal(a.status,'VALID',JSON.stringify({case:c,issues:a.issues,diagnostics:a.diagnostics}));
 assert.equal(new Set(a.coverage.consumedCardIds).size,physical(c.text).orderedTokens.length);
 if(['L19','L21'].includes(c.id))assert.ok(!a.grammarHits.some(h=>h.tag==='DEGREE.TOO'));
 if(['L18','L20'].includes(c.id))assert.ok(a.grammarHits.some(h=>h.tag==='DEGREE.TOO'));
 if(['L26','L27','L28'].includes(c.id)){assert.equal(a.mainFrameId,'frame.svo');assert.ok(a.nominalStructures.some(n=>n.kind==='NOMINAL_THAT'&&n.validity==='VALID'));}
 if(Number(c.id.slice(1))>=29&&Number(c.id.slice(1))<=42){assert.ok(a.nominalStructures.some(n=>n.kind.startsWith('EXTRAPOSED_SUBJECT')&&n.validity==='VALID'));assert.ok(matchFinaleTask({type:'GRAMMAR',target:'EXTRAPOSITION'},a));}
 if(['L34','L35','L36','L37','L38','L39','L40','L41'].includes(c.id)){const n=a.nominalStructures.find(n=>n.actorCardIds);assert.ok(n?.actorCardIds.length);assert.equal(n.actorRelation,['L39','L40'].includes(c.id)?'EVALUATION_TARGET':'SEMANTIC_SUBJECT');}
 if(c.id==='L43')assert.equal(a.nominalStructures.length,0);
});
test('0.12.1 E01–E14: invalid cases, boundaries, dual roles and physical identity',()=>{
 for(const c of cases.filter(c=>['E01','E03','E04','E05','E07','E08','E10'].includes(c.id)))assert.notEqual(analyze(c.text).status,'VALID',c.id+' '+c.text);
 for(const c of cases.filter(c=>['E02','E06'].includes(c.id)))assert.ok(!analyze(c.text).nominalStructures?.some(n=>n.validity==='VALID'&&n.kind==='EXTRAPOSED_SUBJECT_TO'),c.id);
 assert.notEqual(analyzeSentence(snapshotFromText('I have writed a story.',{registry:r}),r).status,'VALID');
 assert.ok(!analyze('I have a watch.').grammarHits.some(h=>h.tag==='CONSTRUCTION.PERCEPTION'));
 assert.ok(!analyze('I like you too.').grammarHits.some(h=>h.tag==='DEGREE.TOO'));
 const a=analyze('I am well.');assert.equal(a.resolvedTokenRoles.find(x=>x.selectedPos==='ADJECTIVE').selectedLexemeId,'lex.well.adjective');assert.ok(!a.grammarHits.some(h=>h.tag==='MODIFIER.ADVERB'));
 const snap=physical('I watch the watch.');snap.orderedTokens[3].cardInstanceId=snap.orderedTokens[1].cardInstanceId;assert.equal(analyzeSentence(snap,r).status,'ENGINE_ERROR');
 for(const t of ['I am a well student.','It is clear to run.'])assert.ok(!analyze(t).nominalStructures?.some(n=>n.validity==='VALID'&&n.kind==='EXTRAPOSED_SUBJECT_TO'));
});
test('0.12.1 supply, bands, 28 physical cards, saves and form labels',()=>{
 const c=new RunController({profile:{...newProfile('Polish QA'),guidedTutorialCompletedVersion:'0.2.1'}});assert.ok(c.dispatch({type:'NEW_RUN',config:{seed:'polish.0121'}}).ok);const run=c.getState();validateRunState(run,r);assert.equal(run.version,'0.12.1');assert.equal(campaignBattleCount(run),50);
 let pool=eligibleRewardCards(run).map(c=>c.id);for(const id of ['look','room','of'])assert.ok(!pool.includes('card.'+id));
 for(const [lemma,band]of [['smile','STANDARD'],['write','STANDARD'],['solve','STANDARD'],['visit','STANDARD'],['gift','STANDARD'],['protect','ADVANCED'],['discover','ADVANCED'],['result','ADVANCED'],['method','ADVANCED']]){assert.ok(pool.includes('card.'+lemma));assert.equal(r.lexemeById[r.cardById['card.'+lemma].lexemeId].vocabBand,band);assert.equal(r.cardById['card.'+lemma].rarity,'COMMON');}
 run.eligibility.runOwnUnlocks.push('pack.infinitive');assert.ok(eligibleRewardCards(run).some(c=>c.id==='card.of'));
 for(const mode of ['BEGINNER','STANDARD','ADVANCED','FREE'])for(const seed of ['polish.a','polish.b','polish.c']){const d=generateStarterDeck({seed,vocabularyMode:mode,version:'0.12.1'});assert.deepEqual(validateStarterDeck(d).errors,[]);assert.equal(d.activeCardIds.length,28);assert.ok(!Object.values(d.cardInstances).some(c=>['card.look','card.room'].includes(c.cardDefId)));}
 const old=registryForVersion('0.12.0');for(const id of ['look','room'])assert.ok(old.cardById['card.'+id].rewardWeight>0);assert.equal(old.cardById['card.smile'],undefined);assert.equal(analyzeSentence(physical('I work hard.','0.12.0'),old).status,'INVALID_CORE');
 for(const lemma of ['answer','watch','show','hard','fast','well']){const fs=visibleForms(r.lexemeById[r.cardById['card.'+lemma].lexemeId].pos,formsForCard('card.'+lemma,{registry:r}));assert.equal(fs.filter(f=>f.surface===lemma).length,1);assert.equal(formLabel(fs.find(f=>f.surface===lemma)),'원형');}
 assert.equal(formLabel(r.formById['form.write.pp']),'과거분사 · p.p.');assert.equal(formLabel(r.formById['form.write.present']),'원형');
});

test('0.12.1 actual commands preserve physical cards and settle once; legacy look/room and tutorial deck survive reload',()=>{
 const profile={...newProfile('Polish conservation'),guidedTutorialCompletedVersion:'0.2.1'};
 for(const [Controller,text]of [[RunController,'I watch the watch.'],[Legacy012,'I look happy in the room.']]){
  const c=new Controller({profile});checked(c,{type:'NEW_RUN',config:{seed:'polish.receipt'}});checked(c,{type:'START_BATTLE'});const ids=assignSentence(c,text),before=c.getState();
  assert.deepEqual(new RunController({initialState:before}).getState(),before);const a=checked(c,{type:'SUBMIT'}).resolution;
  assert.equal(a.status,'VALID');assert.equal(a.scoreTimeline.filter(e=>e.phase==='CARD_BASE').at(-1).after,ids.length*10);
  checked(c,{type:'FINISH_PRESENTATION',attackId:a.attackId});const once=c.getState();c.dispatch({type:'FINISH_PRESENTATION',attackId:a.attackId});assert.deepEqual(c.getState(),once);assert.deepEqual(new RunController({initialState:once}).getState(),once);assert.equal(validateRunState(once,r),true);
  assert.equal(ids.filter(id=>once.combat.discardIds.includes(id)).length,ids.length);
 }
 const c=new RunController({profile:newProfile('Tutorial restore')});checked(c,{type:'NEW_RUN',config:{seed:'polish.tutorial'}});const parked=c.getState().tutorialSession.parked;checked(c,{type:'START_BATTLE'});let s=c.getState();checked(c,{type:'SKIP_TUTORIAL',sessionId:s.tutorialSession.sessionId,expectedRevision:s.revision,commandId:'polish.skip',confirmed:true});s=c.getState();assert.deepEqual(s.cardInstances,parked.cardInstances);assert.equal(s.activeCardIds.length,28);assert.equal(s.economy.gold,0);assert.equal(validateRunState(s,r),true);
});

test('0.12.1 bonus evidence, late boundaries and unchanged numerical contracts',()=>{
 for(const fn of [combatBalanceForVersion,scoreBalanceForVersion,runesForVersion])assert.equal(fn('0.12.1'),fn('0.12.0'));
 for(const stageId of ['stage.01','stage.02','stage.03','stage.04','stage.05','stage.06','stage.07','stage.08','stage.09','stage.10','stage.final']){assert.deepEqual(stageForRun({version:'0.12.1',progress:{stageId}}),stageForRun({version:'0.12.0',progress:{stageId}}));assert.deepEqual(getEncounter(stageId,0,'0.12.1'),getEncounter(stageId,0,'0.12.0'));}
 for(const text of ['It is kind of you to help me.','It is necessary for us to work.','I discover that she is happy.']){const a=analyze(text),receipt=resolveLibraryTurnEnd({runId:'qa',battleId:'qa',turnIndex:1,actionId:'qa',actionType:'ATTACK',hpBefore:3000,hpAfterAttack:2900,actualDamage:100,analysis:a});assert.equal(receipt.suppressed,true);assert.equal(receipt.actualHeal,0);if(text.startsWith('It'))assert.ok(buildRuneEvidence(a,null)['rune.infinitive'].eligible);}
 const old=analyzeSentence(physical('It is possible for her to help you.','0.12.0'),registryForVersion('0.12.0'));assert.ok(!old.nominalStructures?.some(n=>n.kind==='EXTRAPOSED_SUBJECT_TO'));
});
