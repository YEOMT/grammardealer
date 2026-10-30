import test from 'node:test';
import assert from 'node:assert/strict';
import {registryForVersion,registryForReceipt,createSentenceSnapshot} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {RunController} from '../src/game/runController.js';
import {newProfile,validateRunState} from '../src/services/localStore.js';
import {checked,assignSentence} from './helpers/waterways-state.js';
const registry=registryForVersion('0.11.0');
const physical=text=>{
 const tokens=snapshotFromText(text,{registry}).orderedTokens;
 assert.ok(tokens.every(t=>t.cardDefId));
 return createSentenceSnapshot(tokens.map(t=>({cardInstanceId:t.cardInstanceId,selection:t.selectionId})),Object.fromEntries(tokens.map(t=>[t.cardInstanceId,{instanceId:t.cardInstanceId,cardDefId:t.cardDefId}])),{languageVersion:'0.11.0'});
};
for(const [text,status,issue]of [
 ['I was a clearly big student.','VALID'],['I was a big student.','VALID'],['I was a very big student.','VALID'],['I was a really big student.','VALID'],
 ['I was clearly a big student.','VALID'],['I was clearly big.','VALID'],['I was a clearly happy student.','VALID'],
 ['I was clearly.','INVALID_CORE'],['I was a clearly student.','INVALID_CORE'],
 ['I were a clearly big student.','VALID_WITH_ISSUES','SUBJECT_VERB_AGREEMENT'],['I was an clearly big student.','VALID_WITH_ISSUES','ARTICLE_FORM'],
 ['I was a quickly big student.','INVALID_CORE'],['I was a clearly bigger student.','INVALID_CORE']]){
 test('gamefeel narrow adjective modifier: '+text,()=>{const a=analyzeSentence(physical(text),registry);assert.equal(a.status,status);if(status==='VALID')assert.ok(['frame.svc.np','frame.svc.adj'].includes(a.mainFrameId));if(issue)assert.ok(a.issues.some(i=>i.code===issue));});
}
test('clearly actual was selection, modifier targets, old registry/receipt and committed save stay separate',()=>{
 const snapshot=physical('I was a clearly big student.'),a=analyzeSentence(snapshot,registry);
 assert.equal(snapshot.orderedTokens[1].selectionId,'form.be.was');
 assert.equal(registry.senseById['lex.clearly.adverb.sense.basic'].adverbPolicy.degree,undefined);
 for(const [tag,from,to]of [['MODIFIER.ADVERB',3,4],['MODIFIER.ADJECTIVE',4,5]]){const h=a.grammarHits.filter(h=>h.tag===tag);assert.equal(h.length,1);assert.deepEqual(h[0].modifierCardIds??h[0].cardIds,[snapshot.orderedTokens[from].cardInstanceId]);assert.deepEqual(h[0].targetCardIds,[snapshot.orderedTokens[to].cardInstanceId]);}
 assert.equal(analyzeSentence(snapshot,registryForVersion('0.10.2')).status,'INVALID_CORE');
 const old={analysis:{status:'INVALID_CORE'},sentenceSnapshot:snapshot};const frozen=JSON.stringify(old);
 assert.equal(analyzeSentence(snapshot,registryForReceipt('0.11.0',old)).status,'INVALID_CORE');assert.equal(JSON.stringify(old),frozen);
 assert.equal(analyzeSentence(snapshot,registryForReceipt('0.11.0',{analysis:a})).status,'VALID');
 const c=new RunController({profile:{...newProfile('QA'),guidedTutorialCompletedVersion:'0.2.1'}});checked(c,{type:'NEW_RUN',config:{seed:'clearly.current'}});checked(c,{type:'START_BATTLE'});assignSentence(c,'I was a clearly big student.');const r=checked(c,{type:'SUBMIT'}).resolution;
 assert.equal(r.analysis.status,'VALID');assert.ok(r.finalPower>0);assert.equal(r.scoreTimeline.filter(e=>e.sourceId==='MODIFIER.ADVERB').length,1);assert.equal(r.scoreTimeline.filter(e=>e.sourceId==='MODIFIER.ADJECTIVE').length,1);
 checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});const saved=JSON.parse(JSON.stringify(c.getState()));validateRunState(saved,registry);assert.deepEqual(saved.stats.history,c.getState().stats.history);
});
