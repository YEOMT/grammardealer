import test from 'node:test';import assert from 'node:assert/strict';
import {registry,formsForCard,createSentenceSnapshot} from '../src/data/language/index.js';
import {analyzeSentence,snapshotFromText} from '../src/engine/grammar/index.js';
import {resolveAttack} from '../src/engine/stage.js';import {cardModel} from '../src/ui/models.js';
import {generateStarterDeck,createBattlePiles,validateStarterDeck,VOCABULARY_MODES} from '../src/game/deck.js';
import {RunController} from '../src/game/runController.js';
const analyze=text=>analyzeSentence(snapshotFromText(text));
const power=text=>{const snapshot=snapshotFromText(text),analysis=analyzeSentence(snapshot);const cards=snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,baseScore:10,polishLevel:0}));return resolveAttack({analysis,cards,sentenceSnapshot:snapshot,enemy:{hp:999,hpMax:999}});};

test('0.1.1 P12 P13: default be is visible/selectable, explicit conjugations remain correct',()=>{
 const instance={instanceId:'be.test',cardDefId:'card.be',polishLevel:0,specialEffectId:null};
 assert.equal(cardModel(instance).surface,'be');assert.equal(createSentenceSnapshot([{cardInstanceId:instance.instanceId,selection:null}],{[instance.instanceId]:instance}).orderedTokens[0].surface,'be');
 assert.deepEqual(new Set(formsForCard(instance).map(f=>f.surface)),new Set(['be','am','is','are']));
 for(const [text,form] of [['I am happy','am'],['She is happy','is'],['They are happy','are']]){assert.equal(analyze(text).status,'VALID');assert.equal(power(text).finalPower,75);assert.equal(cardModel(instance,{formId:`form.be.${form}`}).surface,form);}
});
test('0.1.1 P14: unselected be produces one recoverable form issue and a single ten-point deduction',()=>{
 const r=power('I be happy');assert.equal(r.analysis.status,'VALID_WITH_ISSUES');assert.deepEqual(r.analysis.issues.map(i=>i.code),['BE_FORM_REQUIRED']);assert.equal(r.finalPower,30);assert.equal(r.scoreTimeline.some(e=>e.phase==='COMPLETE_BONUS'),false);
 assert.deepEqual(analyze('She are happy').issues.map(i=>i.code),['SUBJECT_VERB_AGREEMENT']);
});
test('0.1.1 P15: exposing base be never enables imperative, infinitive, past or progressive grammar',()=>{
 for(const text of ['Be happy','I want to be happy','I was happy','She is being happy','I am reading books','She gives me a book'])assert.equal(analyze(text).status,'UNSUPPORTED',text);
});
test('0.1.1 P41 P43: 28 physical cards and first six preserve real SV plus be adjective learning paths',()=>{
 for(const mode of VOCABULARY_MODES)for(let n=0;n<25;n++){
  const deck=generateStarterDeck({seed:`patch-opener.${n}`,vocabularyMode:mode});assert.equal(validateStarterDeck(deck).valid,true);assert.equal(deck.activeCardIds.length,28);
  const piles=createBattlePiles({...deck,stream:deck.rng.deck,focusFrame:'frame.sv',tutorial:true});assert.equal(piles.handIds.length,6);assert.equal(piles.drawIds.length,22);assert.equal(piles.openingTrace.frameId,'frame.sv');
  for(const slots of [piles.openingTrace.witnessSlots,piles.openingTrace.beWitnessSlots]){assert.ok(slots.length);assert.ok(slots.every(s=>piles.handIds.includes(s.cardInstanceId)));assert.equal(analyzeSentence(createSentenceSnapshot(slots,deck.cardInstances)).status,'VALID');}
  assert.equal(new Set([...piles.handIds,...piles.drawIds]).size,28);
 }
});
test('0.1.1 P44: new generator/opener repeat exactly and ordinary draw/exchange never replace removed cards',()=>{
 const a=generateStarterDeck({seed:'patch-repeat',vocabularyMode:'FREE'}),b=generateStarterDeck({seed:'patch-repeat',vocabularyMode:'FREE'});assert.deepEqual(a,b);
 assert.deepEqual(createBattlePiles({...a,stream:a.rng.deck,focusFrame:'frame.sv',tutorial:true}),createBattlePiles({...b,stream:b.rng.deck,focusFrame:'frame.sv',tutorial:true}));
 const c=new RunController();assert.equal(c.dispatch({type:'NEW_RUN',config:{seed:'patch-repeat'}}).ok,true);assert.equal(c.dispatch({type:'START_BATTLE'}).ok,true);const s=c.getState();assert.equal(s.combat.openingTrace.frameId,'frame.sv');const before=structuredClone(s);
 assert.equal(c.dispatch({type:'EXCHANGE',cardIds:[]}).ok,false);assert.deepEqual(c.getState(),before);
 const ids=s.combat.handIds.slice(0,3);assert.equal(c.dispatch({type:'EXCHANGE',cardIds:ids}).ok,true);const after=c.getState();assert.equal(after.combat.handIds.length,6);assert.equal(after.combat.exchangesRemaining,3);assert.equal(after.combat.turnsRemaining,6);assert.deepEqual(after.activeCardIds,s.activeCardIds);
});
