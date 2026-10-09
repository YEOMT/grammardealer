import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {generateStarterDeck,createBattlePiles,VOCABULARY_MODES} from '../src/game/deck.js';
import {registryForVersion,createSentenceSnapshot} from '../src/data/language/index.js';import {analyzeSentence} from '../src/engine/grammar/index.js';
import {createDustSupply,limitOpeningDust} from '../src/game/emberDust.js';import {assertCardConservation} from '../src/game/invariants.js';
const count=Number(process.env.DECK_SEEDS_PER_MODE||2500),registry=registryForVersion('0.7.0');
const report={kind:'GENERATOR_DUST_OPENING_PARTITION_NOT_WIN_RATE',campaignVersion:'0.7.0',checked:0,byMode:{},failures:[],startedAt:new Date().toISOString()};
for(const vocabularyMode of VOCABULARY_MODES){let checked=0;for(let i=0;i<count;i++)try{
 const d=generateStarterDeck({seed:'ember.batch.'+i,vocabularyMode,version:'0.4.0'}),r={...d,version:'0.7.0',runId:'batch.'+vocabularyMode+'.'+i,progress:{stageId:'stage.07',roundIndex:i%5,battleNumber:28+i%5}},before=structuredClone(r.rng),active=[...d.activeCardIds];
 assert.equal(active.length,28);for(const w of d.witnesses)assert.equal(analyzeSentence(createSentenceSnapshot(w.slots,d.cardInstances,{languageVersion:'0.7.0'}),registry).status,'VALID');
 const supply=createDustSupply(r);assert.deepEqual(r.rng,before);assert.equal(supply.temporaryCardIds.length,i%5===4?5:2);
 const piles=createBattlePiles({activeCardIds:[...active,...supply.temporaryCardIds],cardInstances:r.cardInstances,stream:r.rng.deck,registry,focusFrame:'frame.svc.adj'}),afterShuffle=structuredClone(r.rng);limitOpeningDust(piles,supply);
 assert.deepEqual(r.rng,afterShuffle);assert.deepEqual(active,r.activeCardIds);assert.equal(piles.handIds.length,6);assert.ok(piles.handIds.filter(id=>supply.temporaryCardIds.includes(id)).length<=1);assert.equal(piles.openingTrace.guaranteed,true);assertCardConservation(active,{...piles,...supply},r.cardInstances);for(const stream of ['reward','shop','encounter'])assert.deepEqual(r.rng[stream],before[stream]);checked++;report.checked++;
}catch(error){report.failures.push({vocabularyMode,seed:'ember.batch.'+i,error:error.message});}report.byMode[vocabularyMode]=checked;console.log(vocabularyMode,checked+'/'+count);}
report.status=report.failures.length?'FAIL':'PASS';report.finishedAt=new Date().toISOString();await fs.writeFile(process.env.SB_EMBER_DECK_EVIDENCE||'.local-validation/v07/ember-decks.json',JSON.stringify(report,null,2));console.log(report.status,report.checked);if(report.failures.length)process.exitCode=1;
