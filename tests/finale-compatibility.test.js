import test from 'node:test';
import assert from 'node:assert/strict';
import {RunController} from '../src/game/runController.js';
import {RunController as RecoveryController} from './helpers/legacy-0102-controller.js';
import {newProfile,validateRunState,canSaveRun} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';
import {createRng} from '../src/game/rng.js';
import {getEncounter} from '../src/data/stages.js';
import {createFinaleDustSupply,issueFinaleFrost,cleanupFinaleCards} from '../src/game/finaleCards.js';
import {validateOperationHistory} from '../src/game/operationHistory.js';
import {operationSpec} from '../src/data/operationSpec.js';
import {operationPileSnapshot,resolveOperationMovement} from '../src/game/operationResolution.js';
import {waterwaysEntryOffer,grantWaterwaysEntry,validateWaterwaysEntry} from '../src/game/ancientWaterways.js';

const profile=()=>({...newProfile('Finale compatibility QA'),guidedTutorialCompletedVersion:'0.2.1'});
const checked=(c,command)=>{const r=c.dispatch(command);assert.equal(r.ok,true,r.message);return r;};
test('0.11 normal new-run starter/resources/deck RNG equal 0.10.2; safe save roundtrip unchanged',()=>{
 const current=new RunController({profile:profile()}),old=new RecoveryController({profile:profile()});
 for(const c of [current,old]){checked(c,{type:'NEW_RUN',config:{seed:'finale.compatibility',vocabularyMode:'STANDARD'}});checked(c,{type:'START_BATTLE'});}
 const a=current.getState(),b=old.getState();assert.equal(a.activeCardIds.length,28);assert.equal(a.version,'0.11.0');assert.equal(b.version,'0.10.2');
 for(const key of ['activeCardIds','cardInstances','rng','generationTrace','vocabulary'])assert.deepEqual(a[key],b[key]);
 for(const key of ['handIds','drawIds','rulesSnapshot','turnsRemaining','exchangesRemaining','enemyState','openingTrace'])assert.deepEqual(a.combat[key],b.combat[key]);
 for(const c of [current,old]){const s=c.getState();assert.equal(canSaveRun(s),true);assert.equal(validateRunState(s,registryForVersion(s.version)),true);const restored=new RunController({initialState:JSON.parse(JSON.stringify(s)),profile:c.getProfile()});assert.deepEqual(restored.getState(),s);}
 assert.equal(b.finale,undefined);assert.ok(!b.contentManifest.stageIds.includes('stage.final'));assert.equal(b.contentManifest.id,'campaign.0.10');
});
test('0.11 tutorial skip restores original 28 cards/RNG without gold, score or final ranking state',()=>{
 const c=new RunController({profile:newProfile('Tutorial compatibility QA')});checked(c,{type:'NEW_RUN',config:{seed:'tutorial.compatibility'}});const start=c.getState(),parked=start.tutorialSession.parked;checked(c,{type:'START_BATTLE'});const s=c.getState();
 checked(c,{type:'SKIP_TUTORIAL',sessionId:s.tutorialSession.sessionId,expectedRevision:s.revision,commandId:'qa.skip',confirmed:true});
 const done=c.getState();assert.equal(done.tutorialSession.endReason,'SKIPPED');assert.deepEqual(done.activeCardIds,parked.activeCardIds);assert.deepEqual(done.cardInstances,parked.cardInstances);assert.equal(done.economy.gold,0);assert.equal(done.stats.attacks,0);assert.equal(done.finale.bestAttackSnapshot,null);assert.deepEqual(done.finale.phaseClearReceipts,[]);assert.equal(done.combat.turnsRemaining,6);assert.equal(done.combat.exchangesRemaining,4);assert.equal(validateRunState(done,registryForVersion(done.version)),true);
});
test('0.11 retained Stage8 entry choice remains valid in finale; legacy cannot jump there',()=>{
 const run={version:'0.11.0',runId:'qa.entry',progress:{stageId:'stage.08'},combat:null,status:'STAGE_INTRO',entryGrants:{},activeCardIds:[],cardInstances:{},vocabulary:{encounteredLexemeIds:[]},milestoneIds:['STAGE8_CLEAR']};
 run.waterwaysEntryChoice=waterwaysEntryOffer(run);grantWaterwaysEntry(run,'WHO');run.progress.stageId='stage.final';assert.equal(validateWaterwaysEntry(run),true);
 const old=structuredClone(run);old.version='0.10.2';assert.throws(()=>validateWaterwaysEntry(old));
});
test('0.11 real operation movement receipts allow mixed finale dust/frost before and after cleanup',()=>{
 const source='qa.supply',word='qa.word',run={version:'0.11.0',runId:'qa.operation.finale',revision:3,status:'BATTLE',progress:{stageId:'stage.final',roundIndex:0,battleNumber:48},activeCardIds:[source,word],cardInstances:{[source]:{instanceId:source,cardDefId:'card.operation.supply',polishLevel:1,specialEffectId:null},[word]:{instanceId:word,cardDefId:'card.she',polishLevel:0,specialEffectId:null}},vocabulary:{encounteredLexemeIds:[]},rng:createRng('operation.mixed'),appliedCommandIds:['qa.operation'],combat:null};
 const supply=createFinaleDustSupply(run,4);run.combat={...supply,enemyState:getEncounter('stage.final',0,run.version),phase:'EDIT',rulesSnapshot:{handLimit:10},handIds:[source],drawIds:[...supply.temporaryCardIds,word],discardIds:[],sentenceSlots:[],exhaustedIds:[],operationHistory:[],operationSequence:0,pendingOperationId:null};
 const c=run.combat;issueFinaleFrost(run,{layerIndex:0,cardDefId:'card.to'});
 const spec=operationSpec('card.operation.supply',1,'PERMANENT',run.version),before=operationPileSnapshot(c,run.rng.deck),cardSnapshots=structuredClone(run.cardInstances);
 const drawn=resolveOperationMovement(c,run.cardInstances,run.version,spec,source,null,10,run.rng.deck);assert.deepEqual(drawn,supply.finaleDustTrace.cardIds.slice(0,2));assert.ok(c.discardIds.includes(source));
 const e={operationVersion:'0.7.0',effectId:`${run.runId}:battle.48:operation.1`,commandId:'qa.operation',runId:run.runId,battleId:c.enemyState.id,expectedRevision:2,operationSequence:1,sourceCardId:source,cardDefId:'card.operation.supply',operationType:spec.type,sourceSnapshot:{polishLevel:1,lifetime:'PERMANENT',afterUseDestination:spec.afterUseDestination},requestedCount:spec.requestedCount,actualDrawCount:drawn.length,drawnCardIds:drawn,sourcePile:spec.sourcePile,selectionMode:spec.selectionMode,filterId:spec.filterId,targetCardId:null,postUseDestination:spec.afterUseDestination,before,after:operationPileSnapshot(c,run.rng.deck),cardSnapshots,versions:{game:run.version,operation:'0.7.0'}};
 c.operationHistory=[e];c.operationSequence=1;assert.equal(validateOperationHistory(run),true);
 run.status='DEFEAT';cleanupFinaleCards(run);assert.equal(validateOperationHistory(run),true);
 const corrupt=structuredClone(run);corrupt.combat.operationHistory[0].cardSnapshots[drawn[0]].temporary.source='EMBER_CAVE';assert.throws(()=>validateOperationHistory(corrupt));
});
