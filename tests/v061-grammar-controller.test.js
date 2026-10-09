import test from 'node:test';
import assert from 'node:assert/strict';
import {assigned061,assignStage,assignWords,checked} from './helpers/ui-061-state.js';
import {registryForVersion} from '../src/data/language/index.js';
import {assertRunInvariants} from '../src/game/invariants.js';
const language=registryForVersion('0.6.1');
const packs=['pack.svoo','pack.clauseLink','pack.time.past','pack.time.progressive','pack.time.perfect','pack.time.futureWill','pack.svoc.basic','pack.infinitive','pack.gerund','pack.comparison','pack.degree'];
/** Assigned scene/definitions only. This is not progression, a save fixture or natural play. */
function fixture(text,{stage=6,round=4,unlocks=packs}={}){
 const c=assigned061('grammar061.ASSIGNED.'+text);assignStage(c,stage,round);
 const words=assignWords(c,text),s=c.getState();
 s.eligibility.runStartUnlockBaseline=[];s.eligibility.runOwnUnlocks=[...unlocks];
 s.combat.sentenceSlots=words.map(w=>({cardInstanceId:w.id,selection:{formId:w.formId}}));s.combat.handIds=[];s.combat.battleDirty=true;c._state=s;
 assertRunInvariants(s,language);return c;
}
test('0.6.1 ASSIGNED Controller: seven real gap cards consume one turn, deal 502 and break one frost crystal once',()=>{
 const c=fixture('A room was too hard to show.'),before=c.getState(),ids=before.combat.sentenceSlots.map(s=>s.cardInstanceId),too=ids.find(id=>before.cardInstances[id].cardDefId==='card.too');
 const r=checked(c,{type:'SUBMIT',commandId:'grammar.gap.submit',expectedRevision:before.revision}).resolution,after=c.getState();
 assert.equal(r.status,'VALID');assert.equal(r.finalPower,502);assert.equal(r.actualHpLoss,502);assert.equal(r.frostCrystalResult.brokenCrystalCount,1);assert.equal(after.combat.enemyState.bossMechanic.crystalsRemaining,4);
 assert.equal(after.combat.turnsRemaining,before.combat.turnsRemaining-1);assert.equal(after.stats.attacks,before.stats.attacks+1);assert.deepEqual(after.combat.shatteredTemporaryIds,[too]);assert.ok(!after.combat.discardIds.includes(too));
 assert.deepEqual(new Set(after.combat.discardIds),new Set(ids.filter(id=>id!==too)));assert.deepEqual(after.activeCardIds,before.activeCardIds);
 assert.equal(c.dispatch({type:'SUBMIT',commandId:'grammar.gap.submit',expectedRevision:before.revision}).ok,false);assert.deepEqual(c.getState(),after);
 checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId,commandId:'grammar.gap.finish'});const finished=c.getState();assertRunInvariants(finished,language);
 assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:r.attackId,commandId:'grammar.gap.finish'}).ok,false);assert.deepEqual(c.getState(),finished);
});
test('0.6.1 ASSIGNED Controller: raw SVOO with a recoverable be form error releases a locked-pack harbor veil',()=>{
 const c=fixture('A person be often giving you a beautiful environment with small problems.',{stage:2,round:3,unlocks:[]}),before=c.getState();
 const r=checked(c,{type:'SUBMIT',commandId:'grammar.veil',expectedRevision:before.revision}).resolution;
 assert.equal(r.status,'VALID_WITH_ISSUES');assert.equal(r.analysis.mainFrameId,'frame.svoo');assert.equal(r.analysis.issues.filter(i=>i.code==='BE_FORM_REQUIRED').length,1);
 assert.equal(r.bossStateAfter.active,false);assert.ok(r.actualHpLoss>0);assert.ok(!r.scoreTimeline.some(e=>['MAIN_FRAME','COMPLETE_BONUS','CONSTRUCTIONS'].includes(e.phase)));
 const often=r.sentenceSnapshot.orderedTokens.find(t=>t.cardDefId==='card.often').cardInstanceId;assert.equal(r.analysis.resolvedTokenRoles.find(x=>x.cardInstanceId===often).role,'ADVERB');assert.equal(r.scoreTimeline.filter(e=>e.sourceId==='MODIFIER.ADVERB'&&e.highlightCardIds.includes(often)).length,1);
 checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});assertRunInvariants(c.getState(),language);
});
for(const text of ['A room too hard to show.','A room was too hard to.','I giving you a book.'])test('0.6.1 ASSIGNED Controller: incomplete submission consumes cards and turn with no damage '+text,()=>{
 const c=fixture(text),before=c.getState(),ids=before.combat.sentenceSlots.map(s=>s.cardInstanceId),r=checked(c,{type:'SUBMIT'}).resolution,after=c.getState();
 assert.equal(r.accepted,true);assert.equal(r.status,'INVALID_CORE');assert.equal(r.actualHpLoss,0);assert.equal(r.finalPower,0);assert.equal(after.combat.turnsRemaining,before.combat.turnsRemaining-1);assert.equal(after.combat.enemyState.hp,before.combat.enemyState.hp);
 assert.deepEqual(r.proposedStateEffects.discardCardIds,ids);assert.equal(after.stats.attacks,before.stats.attacks+1);assert.deepEqual(after.activeCardIds,before.activeCardIds);assert.equal(after.combat.enemyState.bossMechanic.crystalsRemaining,5);
 checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});assertRunInvariants(c.getState(),language);
});
