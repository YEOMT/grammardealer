import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registryForVersion,createSentenceSnapshot} from '../src/data/language/index.js';
import {cardDefinition,cardKind,OPERATION_CARDS} from '../src/data/cardCatalog.js';
import {generateStarterDeck,validateStarterDeck,VOCABULARY_MODES} from '../src/game/deck.js';
import {assertCardConservation,assertCardTypes} from '../src/game/invariants.js';
import {analyzeSentence} from '../src/engine/grammar/index.js';
import {resolveAttack} from '../src/engine/stage.js';
import {createRewardOffer} from '../src/game/rewards.js';
import {grantStage2Entry,createShop} from '../src/game/shop.js';
import {cardModel} from '../src/ui/models.js';
const golden=JSON.parse(fs.readFileSync(new URL('./fixtures/v04-legacy-030-golden.json',import.meta.url),'utf8'));

test('0.4 foundation: all pre-change 0.3 decks, RNG, reward and shop records remain byte-equivalent values',()=>{
 for(const row of golden.decks)assert.deepEqual(generateStarterDeck({...row,version:'0.1.1'}),row.deck);
 for(const row of golden.rewards){const run=structuredClone(row.before);run.progress.battleNumber=row.battleNumber;assert.deepEqual(createRewardOffer(run,row.profile),row.expected);assert.deepEqual(run.rng,row.rng);}
 for(const row of golden.shops){const run=structuredClone(row.before);grantStage2Entry(run);run.shop=createShop(run);assert.deepEqual(run,row.after);}
});
test('0.4 foundation: 0.3 analyses and complete damage timelines remain unchanged',()=>{
 for(const row of golden.attacks){const input=structuredClone(row.input);input.analysis=analyzeSentence(input.sentenceSnapshot,registryForVersion('0.3.0'));assert.deepEqual(input.analysis,row.input.analysis,row.text);assert.deepEqual(resolveAttack(input),row.expected,row.text);}
});
test('0.4 starter fixed-have policy keeps 28 physical slots, copy bounds and all parser witnesses',()=>{
 for(const vocabularyMode of VOCABULARY_MODES)for(let i=0;i<8;i++){
  const options={version:'0.4.0',seed:`v04.foundation.${i}`,vocabularyMode},deck=generateStarterDeck(options);
  assert.ok(validateStarterDeck(deck).valid);assert.deepEqual(generateStarterDeck(options),deck);
  assert.equal(deck.activeCardIds.length,28);assert.equal(deck.generationTrace.slotRoles.filter(x=>x.role==='HAVE'&&x.cardDefId==='card.have').length,1);
  assert.equal(deck.generationTrace.slotRoles.filter(x=>x.role==='SVO').length,2);assert.ok(deck.generationTrace.slotRoles.every(x=>!x.cardDefId.startsWith('card.operation.')));
 }
});
test('0.4 rarity and WORD/OPERATION registry boundaries do not rewrite 0.3 definitions',()=>{
 const old=registryForVersion('0.3.0'),current=registryForVersion('0.4.0');
 for(const id of ['card.be','card.have','card.you','card.i']){assert.equal(old.cardById[id].rarity,'COMMON');assert.equal(current.cardById[id].rarity,'UNCOMMON');assert.equal(current.cardById[id].baseScore,10);}
 for(const def of OPERATION_CARDS){assert.equal(current.cardById[def.id],undefined);assert.equal(cardDefinition(def.id,'0.3.0'),undefined);assert.equal(cardKind(def.id,'0.4.0'),'OPERATION');for(const key of ['lexemeId','baseScore','displayCategory'])assert.equal(def[key],undefined);const instance={instanceId:'op',cardDefId:def.id,polishLevel:0,specialEffectId:null};assert.equal(cardModel(instance,null,'0.4.0').pos,undefined);assert.throws(()=>createSentenceSnapshot([{cardInstanceId:'op'}],{op:instance},{languageVersion:'0.4.0'}));}
 assert.throws(()=>cardKind('card.unknown','0.4.0'));
});
test('0.4 fifth partition rejects duplicates, words exhausted and operations on the sentence board',()=>{
 const cardInstances={w:{instanceId:'w',cardDefId:'card.i',polishLevel:0,specialEffectId:null},o:{instanceId:'o',cardDefId:'card.operation.supply',polishLevel:0,specialEffectId:null}},combat={drawIds:[],handIds:['w'],sentenceSlots:[],discardIds:[],exhaustedIds:['o']},run={version:'0.4.0',cardInstances,combat};
 assertCardConservation(['w','o'],combat,cardInstances);assertCardTypes(run);
 assert.throws(()=>assertCardConservation(['w','o'],{...combat,handIds:['w','o']},cardInstances));
 assert.throws(()=>assertCardTypes({...run,combat:{...combat,handIds:['o'],exhaustedIds:['w']}}));
 assert.throws(()=>assertCardTypes({...run,combat:{...combat,sentenceSlots:[{cardInstanceId:'o'}]}}));
 const legacy={version:'0.3.0',cardInstances:{w:cardInstances.w},combat:{drawIds:[],handIds:['w'],sentenceSlots:[],discardIds:[]}},before=structuredClone(legacy);assertCardTypes(legacy);assert.deepEqual(legacy,before);
});
