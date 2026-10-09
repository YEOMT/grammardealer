import {hasEmberCampaign} from '../data/campaignFeatures.js';
import {BLACK_DUST} from '../data/obstacles.js';
const dustId=(run,i)=>`dust.${run.runId}.battle.${run.progress.battleNumber}.${String(i).padStart(2,'0')}`;
const fail=reason=>{throw Error(`Ember dust: ${reason}`);};
export function createDustSupply(run){
 if(!hasEmberCampaign(run)||run.progress.stageId!=='stage.07')return null;
 const count=run.progress.roundIndex===4?5:2,battleId=`battle.07.0${run.progress.roundIndex+1}`,temporaryCardIds=[],temporaryCardMeta={};
 for(let i=0;i<count;i++){
  const id=dustId(run,i);if(run.cardInstances[id])fail('duplicate supply');
  temporaryCardIds.push(id);temporaryCardMeta[id]={source:'EMBER_CAVE',battleId,cardDefId:BLACK_DUST.id,cardKind:'OBSTACLE',lifetime:'BATTLE',supplyIndex:i};
  run.cardInstances[id]={instanceId:id,cardDefId:BLACK_DUST.id,polishLevel:0,specialEffectId:null,temporary:{source:'EMBER_CAVE',battleId}};
 }
 return {temporaryCardIds,temporaryCardMeta,shatteredTemporaryIds:[],dustSupplyTrace:{kind:'DUST_SUPPLY',source:'EMBER_CAVE',battleId,count,cardDefId:BLACK_DUST.id,cardIds:[...temporaryCardIds],openingAdjustments:[]}};
}
/** Stable opening-only swaps. All cards already passed through the existing deck shuffle.
 * The real WORD witness is untouched; no cards, future draw credits, or RNG are created.
 */
export function limitOpeningDust(piles,supply){
 const dust=new Set(supply.temporaryCardIds);let kept=false;
 for(let i=0;i<piles.handIds.length;i++)if(dust.has(piles.handIds[i])){
  if(!kept){kept=true;continue;}
  const id=piles.handIds[i],source=piles.drawIds.findIndex(x=>!dust.has(x));
  if(source>=0){const replacement=piles.drawIds[source];piles.handIds[i]=replacement;piles.drawIds[source]=id;supply.dustSupplyTrace.openingAdjustments.push({kind:'STABLE_SWAP',handIndex:i,drawIndex:source,dustId:id,replacementId:replacement});}
  else {piles.handIds.splice(i--,1);piles.drawIds.push(id);supply.dustSupplyTrace.openingAdjustments.push({kind:'SHORT_HAND',dustId:id});}
 }
}
export function cleanupDust(run){
 const c=run.combat;if(!c?.dustSupplyTrace)return;
 const removed=[...c.temporaryCardIds],set=new Set(removed);
 for(const key of ['drawIds','handIds','discardIds','exhaustedIds'])c[key]=c[key].filter(id=>!set.has(id));
 c.sentenceSlots=c.sentenceSlots.filter(s=>!set.has(s.cardInstanceId));
 for(const id of removed)delete run.cardInstances[id];
 c.temporaryCardIds=[];c.temporaryCardMeta={};c.shatteredTemporaryIds=[];c.dustCleanup={removedCardIds:removed};
}
export function validateDustCards(run){
 const c=run.combat;if(!hasEmberCampaign(run)||run.progress.stageId!=='stage.07'||!c)fail('outside ember battle');
 const count=run.progress.roundIndex===4?5:2,expected=Array.from({length:count},(_,i)=>dustId(run,i)),trace=c.dustSupplyTrace,equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(c.frostSupplyTrace!==undefined||c.frostCleanup!==undefined)fail('foreign temporary source');
 if(!trace||trace.kind!=='DUST_SUPPLY'||trace.source!=='EMBER_CAVE'||trace.battleId!==c.enemyState.id||trace.count!==count||trace.cardDefId!==BLACK_DUST.id||!equal(trace.cardIds,expected)||!Array.isArray(trace.openingAdjustments))fail('supply manifest');
 if(new Set(trace.openingAdjustments.map(x=>x.dustId)).size!==trace.openingAdjustments.length)fail('duplicate opening adjustment');
 for(const change of trace.openingAdjustments){if(!expected.includes(change.dustId)||!['STABLE_SWAP','SHORT_HAND'].includes(change.kind))fail('opening adjustment');if(change.kind==='STABLE_SWAP'&&(!run.activeCardIds.includes(change.replacementId)&&!(run.reward?.resolved&&run.reward.resolution?.kind==='REMOVE'&&run.reward.resolution.cardInstanceId===change.replacementId)||expected.includes(change.replacementId)||!Number.isInteger(change.handIndex)||change.handIndex<0||!Number.isInteger(change.drawIndex)||change.drawIndex<0))fail('opening swap');}
 const ended=['REWARD','BETWEEN_BATTLES','STAGE_CLEAR','CONTENT_COMPLETE','DEFEAT'].includes(run.status),ids=c.temporaryCardIds;
 if(!Array.isArray(ids)||!equal(ids,ended?[]:expected)||!c.temporaryCardMeta||!equal(Object.keys(c.temporaryCardMeta),ids)||!equal(c.shatteredTemporaryIds,[]))fail('temporary partition');
 if(ended&&!equal(c.dustCleanup?.removedCardIds,expected))fail('missing cleanup receipt');
 for(const [i,id]of ids.entries()){
  const card=run.cardInstances[id],meta=c.temporaryCardMeta[id];
  if(run.activeCardIds.includes(id)||!equal(meta,{source:'EMBER_CAVE',battleId:c.enemyState.id,cardDefId:BLACK_DUST.id,cardKind:'OBSTACLE',lifetime:'BATTLE',supplyIndex:i}))fail('scope or metadata');
  if(!equal(card,{instanceId:id,cardDefId:BLACK_DUST.id,polishLevel:0,specialEffectId:null,temporary:{source:'EMBER_CAVE',battleId:c.enemyState.id}}))fail('invalid dust instance');
  if(c.sentenceSlots.some(s=>s.cardInstanceId===id)||c.exhaustedIds.includes(id))fail('invalid dust pile');
 }
 if(Object.values(run.cardInstances).some(card=>(card.temporary||card.cardDefId===BLACK_DUST.id)&&!ids.includes(card.instanceId)))fail('orphan temporary card');
 return true;
}
