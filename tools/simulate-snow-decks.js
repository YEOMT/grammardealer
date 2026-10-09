import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {generateStarterDeck,createBattlePiles,VOCABULARY_MODES} from '../src/game/deck.js';
import {registryForVersion,createSentenceSnapshot} from '../src/data/language/index.js';
import {analyzeSentence} from '../src/engine/grammar/index.js';
import {createFrostSupply,ensureFrostVisibility,addFrostSupportToHand} from '../src/game/frostCards.js';
import {assertCardConservation} from '../src/game/invariants.js';
import {COMBAT_BALANCE} from '../src/data/balance.js';

// Keep the original 0.6 campaign selectable without assigning the new policy to old runs.
const version=process.env.SB_SNOW_CAMPAIGN_VERSION||'0.6.1';
assert.ok(['0.6.0','0.6.1'].includes(version),'Unsupported snow QA campaign');
const count=Number(process.env.DECK_SEEDS_PER_MODE||2500),registry=registryForVersion(version);
const report={kind:'GENERATOR_OPENING_FROST_PARTITION_NOT_WIN_RATE',campaignVersion:version,checked:0,snowOpenings:0,supportOpenings:0,ordinaryOpenings:0,failures:[],byMode:{}};
for(const vocabularyMode of VOCABULARY_MODES){
 let checked=0;
 for(let i=0;i<count;i++){
  const seed='snow.batch.'+i;
  try{
   const d=generateStarterDeck({seed,vocabularyMode,version:'0.4.0'});
   assert.equal(d.activeCardIds.length,28);
   assert.ok(d.activeCardIds.some(id=>d.cardInstances[id].cardDefId==='card.have'));
   assert.ok(!d.activeCardIds.some(id=>registry.cardById[d.cardInstances[id].cardDefId].requiredUnlockId));
   for(const w of d.witnesses)assert.equal(analyzeSentence(createSentenceSnapshot(w.slots,d.cardInstances,{languageVersion:version}),registry).status,'VALID');
   const boss=i%5===4,r={...d,version,runId:'batch.'+vocabularyMode+'.'+i,progress:{stageId:'stage.06',roundIndex:i%5,battleNumber:23+i%5}},before=structuredClone(r.rng),supply=createFrostSupply(r);
   assert.deepEqual(r.rng,before);
   // The temporary OPERATION must not enter the unchanged WORD shuffle or witness search.
   const wordIds=supply.temporaryCardIds.filter(id=>supply.temporaryCardMeta[id].cardKind!=='OPERATION');
   const supportIds=supply.temporaryCardIds.filter(id=>supply.temporaryCardMeta[id].cardKind==='OPERATION');
   const p=createBattlePiles({activeCardIds:[...d.activeCardIds,...wordIds],cardInstances:r.cardInstances,stream:r.rng.deck,registry,focusFrame:'frame.svc.adj'});
   ensureFrostVisibility(p,supply,COMBAT_BALANCE,boss);
   assert.equal(p.handIds.length,6);
   assert.ok(p.handIds.every(id=>!supportIds.includes(id)));
   const wordOpening=[...p.handIds],wordDraw=[...p.drawIds],beforeSupport=structuredClone(r.rng);
   addFrostSupportToHand(p,supply,COMBAT_BALANCE);
   assert.deepEqual(r.rng,beforeSupport);
   assert.equal(supportIds.length,version==='0.6.1'&&boss?1:0);
   assert.deepEqual(p.handIds.slice(0,6),wordOpening);
   assert.deepEqual(p.drawIds,wordDraw);
   if(supportIds.length){
    assert.equal(p.handIds.length,7);
    assert.equal(p.handIds[6],supportIds[0]);
    assert.equal(supply.temporaryCardMeta[supportIds[0]].crystalBearing,false);
    assert.ok(!d.activeCardIds.includes(supportIds[0]));
    report.supportOpenings++;
   }else {assert.equal(p.handIds.length,6);report.ordinaryOpenings++;}
   assertCardConservation(d.activeCardIds,{...p,...supply},r.cardInstances);
   assert.ok(p.handIds.filter(id=>supply.temporaryCardMeta[id]?.crystalBearing).length>=(boss?2:1));
   assert.equal(p.openingTrace.guaranteed,true);
   assert.equal(p.openingTrace.frameId,'frame.svc.adj');
   if(boss)for(let j=0;j<3;j++)assert.ok(p.drawIds.slice(j*3,(j+1)*3).some(id=>supply.temporaryCardMeta[id]?.crystalBearing));
   assert.deepEqual(r.rng.reward,before.reward);
   assert.deepEqual(r.rng.shop,before.shop);
   assert.deepEqual(r.rng.encounter,before.encounter);
   checked++;report.checked++;report.snowOpenings++;
  }catch(e){report.failures.push({seed,vocabularyMode,error:e.message});}
 }
 report.byMode[vocabularyMode]=checked;
 console.log(vocabularyMode,checked+'/'+count);
}
report.status=report.failures.length?'FAIL':'PASS';
const out=process.env.SB_SNOW_DECK_EVIDENCE||`.local-validation/${version==='0.6.1'?'v061':'v06'}/snow-decks.json`;
await fs.writeFile(out,JSON.stringify(report,null,2));
console.log(report.status,report.checked);
if(report.failures.length)process.exitCode=1;
