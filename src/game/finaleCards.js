import {hasFinaleCampaign} from '../data/campaignFeatures.js';
import {FINALE_CONFIRMED,FINALE_INITIAL} from '../data/finalePolicy.js';
import {BLACK_DUST} from '../data/obstacles.js';
import {cardDefinition,cardKind} from '../data/cardCatalog.js';
import {registryForVersion} from '../data/language/index.js';
import {pick} from './rng.js';
import {limitOpeningDust} from './emberDust.js';

const DUST_SOURCE='FINALE_SURFACE_DUST',FROST_SOURCE='FINALE_SURFACE_FROST';
const BATTLE='battle.final.01';
const fail=why=>{throw Error(`Finale cards: ${why}`);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const isSurface=run=>hasFinaleCampaign(run)&&run.progress.stageId==='stage.final'&&run.progress.roundIndex===0;
const isDeep=run=>hasFinaleCampaign(run)&&run.progress.stageId==='stage.final'&&run.progress.roundIndex===1&&run.combat?.enemyState?.bossMechanic?.id==='FINALE_DEEP';
const dustId=(run,i)=>`dust.${run.runId}.finale.${i}`;
const frostId=(run,layerIndex)=>`frost.${run.runId}.finale.${layerIndex}`;
const cardInstance=(instanceId,cardDefId,source)=>({instanceId,cardDefId,polishLevel:0,specialEffectId:null,temporary:{source,battleId:BATTLE}});
const metaFor=(cardDefId,source,supplyIndex)=>({source,battleId:BATTLE,stageId:'stage.final',cardDefId,cardKind:source===DUST_SOURCE?'OBSTACLE':'WORD',lifetime:'BATTLE',supplyIndex,...(source===FROST_SOURCE?{crystalBearing:false,supportOnly:true,layerIndex:supplyIndex}:{})});
const supportMatchesPlan=(run,layerIndex,cardDefId)=>{
 const plan=run.combat.enemyState.bossMechanic.taskPlan;
 if(!Array.isArray(plan))return; // The complete encounter validator requires a witnessed plan.
 const task=plan[layerIndex];if(task?.supportCardDefId!==cardDefId||!Array.isArray(task.witnessCardDefIds))fail('support disagrees with task plan');
 const available=run.activeCardIds.map(id=>run.cardInstances[id].cardDefId),missing=[];
 for(const def of task.witnessCardDefIds){const i=available.indexOf(def);if(i<0)missing.push(def);else available.splice(i,1);}
 if(!same(missing,[cardDefId]))fail('support must cover exactly one permanent-deck deficit');
};

/** Controller proposal only. Mix this supply into the normal opening shuffle once. */
export function createFinaleDustSupply(run,count){
 if(!isSurface(run))return null;
 if(run.combat?.enemyState?.id===BATTLE||run.cardInstances[dustId(run,0)])fail('duplicate dust supply');
 if(count===undefined)count=pick(run.rng.encounter,FINALE_INITIAL.surface.dustCounts);
 if(!FINALE_INITIAL.surface.dustCounts.includes(count))fail('invalid dust count');
 const ids=Array.from({length:count},(_,i)=>dustId(run,i)),meta={};
 if(run.combat?.enemyState?.id===BATTLE||ids.some(id=>run.cardInstances[id]))fail('duplicate dust supply');
 ids.forEach((id,i)=>{meta[id]=metaFor(BLACK_DUST.id,DUST_SOURCE,i);run.cardInstances[id]=cardInstance(id,BLACK_DUST.id,DUST_SOURCE);});
 return {temporaryCardIds:ids,temporaryCardMeta:meta,shatteredTemporaryIds:[],finaleDustTrace:{kind:'FINALE_DUST_SUPPLY',source:DUST_SOURCE,battleId:BATTLE,count,cardIds:[...ids],openingAdjustments:[]},finaleFrostTrace:[]};
}

/** Reuse the stable opening policy without mistaking a later WORD frost for dust. */
export function limitFinaleOpeningDust(piles,supply){
 limitOpeningDust(piles,{temporaryCardIds:supply.finaleDustTrace.cardIds,dustSupplyTrace:supply.finaleDustTrace});
}

/** Layer support is chosen by the witnessed task plan, never by current hand contents.
 * Appends to the mixed temporary partition; it cannot replace the existing dust IDs.
 */
export function issueFinaleFrost(run,{layerIndex,cardDefId}){
 const c=run.combat;
 if(!isSurface(run)||c?.enemyState?.id!==BATTLE)fail('frost outside Surface');
 if(!Number.isInteger(layerIndex)||layerIndex<0||layerIndex>=FINALE_CONFIRMED.surface.layers)fail('invalid layer');
 if(!cardDefId)return null;
 if(!cardDefinition(cardDefId,run.version)||cardKind(cardDefId,run.version)!=='WORD')fail('frost must be a registered WORD');
 const existing=c.finaleFrostTrace?.find(x=>x.layerIndex===layerIndex);
 if(existing){if(existing.cardDefId!==cardDefId)fail('changed published support');return existing;}
 supportMatchesPlan(run,layerIndex,cardDefId);
 if(!Array.isArray(c.finaleFrostTrace)||c.finaleFrostTrace.length>=FINALE_INITIAL.surface.maxFrostPerPhase)fail('support budget');
 const id=frostId(run,layerIndex);if(run.cardInstances[id])fail('duplicate frost instance');
 run.cardInstances[id]=cardInstance(id,cardDefId,FROST_SOURCE);
 c.temporaryCardIds.push(id);c.temporaryCardMeta[id]=metaFor(cardDefId,FROST_SOURCE,layerIndex);
 const destination=c.handIds.length<c.rulesSnapshot.handLimit?'HAND':'DRAW_TOP';
 if(destination==='HAND')c.handIds.push(id);else c.drawIds.unshift(id);
 const receipt={kind:'FINALE_FROST_SUPPLY',battleId:BATTLE,layerIndex,cardDefId,cardInstanceId:id,destination};c.finaleFrostTrace.push(receipt);
 const lexemeId=registryForVersion(run.version).cardById[cardDefId].lexemeId;
 run.vocabulary.encounteredLexemeIds=[...new Set([...run.vocabulary.encounteredLexemeIds,lexemeId])];
 return receipt;
}

/** Removes every mixed temporary source together and leaves a single cleanup receipt. */
export function cleanupFinaleCards(run){
 const c=run.combat;if(!c)return;
 if(c.finaleDustTrace&&!c.finaleTemporaryCleanup){
  const removed=[...c.temporaryCardIds],set=new Set(removed);
  for(const key of ['drawIds','handIds','discardIds','exhaustedIds'])c[key]=(c[key]??[]).filter(id=>!set.has(id));
  c.sentenceSlots=c.sentenceSlots.filter(s=>!set.has(s.cardInstanceId));
  for(const id of removed)delete run.cardInstances[id];
  c.temporaryCardIds=[];c.temporaryCardMeta={};c.shatteredTemporaryIds=[];c.finaleTemporaryCleanup={removedCardIds:removed};
 }
 const m=c.enemyState?.bossMechanic;
 if(m?.id==='FINALE_DEEP'){
  m.sealedWordIds=[];m.sealedForTurnIndex=null;m.handSealsCleared=true;
  m.sealedRuneInstanceId=null;m.pendingNextRuneSeal=null;
 }
}

export function validateFinaleCards(run){
 const c=run.combat,hasFinaleTemp=Object.values(run.cardInstances).some(x=>[DUST_SOURCE,FROST_SOURCE].includes(x.temporary?.source));
 if(!isSurface(run)||!c){if(c?.finaleDustTrace!==undefined||c?.finaleFrostTrace!==undefined||c?.finaleTemporaryCleanup!==undefined||hasFinaleTemp)fail('temporary source outside Surface');return true;}
 if(c.enemyState.id!==BATTLE||c.frostSupplyTrace!==undefined||c.dustSupplyTrace!==undefined||c.corridorFrostTrace!==undefined||c.libraryFrostTrace!==undefined||c.waterwaysFrostTrace!==undefined)fail('foreign supply');
 const trace=c.finaleDustTrace,frost=c.finaleFrostTrace;
 if(trace?.kind!=='FINALE_DUST_SUPPLY'||trace.source!==DUST_SOURCE||trace.battleId!==BATTLE||!FINALE_INITIAL.surface.dustCounts.includes(trace.count)||!same(trace.cardIds,Array.from({length:trace.count},(_,i)=>dustId(run,i)))||!Array.isArray(trace.openingAdjustments))fail('dust manifest');
 if(new Set(trace.openingAdjustments.map(x=>x.dustId)).size!==trace.openingAdjustments.length)fail('duplicate opening adjustment');
 for(const r of trace.openingAdjustments){
  if(!trace.cardIds.includes(r.dustId)||!['STABLE_SWAP','SHORT_HAND'].includes(r.kind))fail('opening adjustment');
  if(r.kind==='STABLE_SWAP'&&(!run.activeCardIds.includes(r.replacementId)||!Number.isInteger(r.handIndex)||r.handIndex<0||!Number.isInteger(r.drawIndex)||r.drawIndex<0))fail('opening swap');
 }
 if(!Array.isArray(frost)||frost.length>2||new Set(frost.map(x=>x.layerIndex)).size!==frost.length)fail('frost manifest');
 for(const r of frost){
  if(r.kind!=='FINALE_FROST_SUPPLY'||r.battleId!==BATTLE||![0,1].includes(r.layerIndex)||r.cardInstanceId!==frostId(run,r.layerIndex)||!['HAND','DRAW_TOP'].includes(r.destination)||!cardDefinition(r.cardDefId,run.version)||cardKind(r.cardDefId,run.version)!=='WORD')fail('frost receipt');
  supportMatchesPlan(run,r.layerIndex,r.cardDefId);
 }
 const expected=[...trace.cardIds,...frost.map(x=>x.cardInstanceId)],ids=c.temporaryCardIds,broken=c.shatteredTemporaryIds,meta=c.temporaryCardMeta;
 if(!Array.isArray(ids)||!Array.isArray(broken)||new Set(ids).size!==ids.length||new Set(broken).size!==broken.length||broken.some(id=>!ids.includes(id))||!meta||!same(Object.keys(meta),ids)||ids.some(id=>run.activeCardIds.includes(id)))fail('mixed partition');
 const ended=['BETWEEN_BATTLES','STAGE_CLEAR','CONTENT_COMPLETE','FINAL_CLEAR','DEFEAT'].includes(run.status);
 if(ended){if(ids.length||broken.length||!same(c.finaleTemporaryCleanup?.removedCardIds,expected))fail('missing cleanup');}
 else if(!same(ids,expected)||c.finaleTemporaryCleanup!==undefined)fail('supply changed');
 for(const id of ids){
  const i=trace.cardIds.indexOf(id),r=frost.find(x=>x.cardInstanceId===id),isDust=i>=0,source=isDust?DUST_SOURCE:FROST_SOURCE,def=isDust?BLACK_DUST.id:r?.cardDefId,index=isDust?i:r.layerIndex;
  if(!same(meta[id],metaFor(def,source,index))||!same(run.cardInstances[id],cardInstance(id,def,source)))fail('invalid instance metadata');
  if(c.exhaustedIds.includes(id)||isDust&&(broken.includes(id)||c.sentenceSlots.some(s=>s.cardInstanceId===id)))fail('illegal temporary location');
 }
 if(!ended){
  const consumed=(run.stats?.history??[]).filter(x=>x.battleId===BATTLE).flatMap(x=>x.consumedTemporaryCardIds??[]);
  if(new Set(consumed).size!==consumed.length||!same([...consumed].sort(),[...broken].sort()))fail('frost submission receipts');
 }
 if(Object.values(run.cardInstances).some(x=>x.temporary&&!ids.includes(x.instanceId)))fail('orphan temporary instance');
 return true;
}

/** The selected IDs survive same-turn exchange/draw, form edits and reload. */
export function isFinaleHandSealed(run,cardId){
 const c=run.combat,m=c?.enemyState?.bossMechanic;
 return isDeep(run)&&run.status==='BATTLE'&&c.enemyState.hp>0&&m.sealedForTurnIndex===c.turnIndex&&m.sealedWordIds?.includes(cardId)===true;
}
export function applyFinaleHandSeal(run){
 if(!isDeep(run))return null;
 const c=run.combat,m=c.enemyState.bossMechanic,key=`${c.enemyState.id}:${c.turnIndex}`;
 if(m.lastHandSealTurnKey===key)return m;
 if(c.enemyState.hp<=0||c.turnsRemaining<=0)fail('seal outside live turn');
 const candidateIds=c.handIds.filter(id=>cardKind(run.cardInstances[id],run.version)==='WORD'),remaining=[...candidateIds],selectedCardIds=[],rngBefore=structuredClone(run.rng.encounter);
 for(let i=0;i<Math.min(FINALE_CONFIRMED.deep.handWordSealsPerTurn,candidateIds.length);i++){
  const id=pick(run.rng.encounter,remaining);selectedCardIds.push(id);remaining.splice(remaining.indexOf(id),1);
 }
 m.sealedWordIds=selectedCardIds;m.sealedForTurnIndex=c.turnIndex;m.lastHandSealTurnKey=key;m.handSealsCleared=false;
 m.cardSealHistory=[...(m.cardSealHistory??[]),{turnIndex:c.turnIndex,candidateIds,selectedCardIds:[...selectedCardIds],rngBefore,rngAfter:structuredClone(run.rng.encounter)}];
 return m;
}
export function validateFinaleHandSeal(run){
 const c=run.combat,m=c?.enemyState?.bossMechanic;
 if(!isDeep(run)){if(m?.sealedWordIds!==undefined||m?.cardSealHistory!==undefined)fail('hand seal outside Deep');return true;}
 const history=m.cardSealHistory;
 if(!Array.isArray(history)||history.length!==c.turnIndex||history.length>c.rulesSnapshot.turnLimit||m.lastHandSealTurnKey!==`${c.enemyState.id}:${c.turnIndex}`)fail('hand seal history');
 for(const [i,r] of history.entries()){
  if(r.turnIndex!==i+1||!Array.isArray(r.candidateIds)||new Set(r.candidateIds).size!==r.candidateIds.length||r.candidateIds.some(id=>!run.activeCardIds.includes(id)||cardKind(run.cardInstances[id],run.version)!=='WORD'))fail('hand seal candidates');
  const rng=structuredClone(r.rngBefore),remaining=[...r.candidateIds],expected=[];
  for(let j=0;j<Math.min(2,r.candidateIds.length);j++){const id=pick(rng,remaining);expected.push(id);remaining.splice(remaining.indexOf(id),1);}
  if(!same(expected,r.selectedCardIds)||!same(rng,r.rngAfter)||run.rng.encounter.cursor<rng.cursor)fail('hand seal draw');
 }
 const ended=c.settled||['BETWEEN_BATTLES','STAGE_CLEAR','CONTENT_COMPLETE','FINAL_CLEAR','DEFEAT'].includes(run.status);
 if(ended){if(m.handSealsCleared!==true||m.sealedWordIds?.length||m.sealedForTurnIndex!==null)fail('hand seals not cleared');}
 else if(m.handSealsCleared||!same(m.sealedWordIds,history.at(-1).selectedCardIds)||m.sealedForTurnIndex!==c.turnIndex||c.sentenceSlots.some(x=>m.sealedWordIds.includes(x.cardInstanceId)))fail('active hand seal');
 return true;
}
