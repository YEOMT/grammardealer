import {registryForVersion} from '../data/language/index.js';
const SOURCE='ANCIENT_WATERWAYS',BATTLE='battle.08.03',DEFS=['card.where','card.when'];
const idFor=(run,i)=>`frost.${run.runId}.waterways.${i}`;
const fail=reason=>{throw Error('Waterways frost: '+reason);};
export function createWaterwaysFrost(run){
 if(run.version!=='0.8.0'||run.progress.stageId!=='stage.08'||run.progress.roundIndex!==2)return null;
 const ids=DEFS.map((_,i)=>idFor(run,i)),meta={};if(ids.some(id=>run.cardInstances[id]))fail('duplicate supply');
 ids.forEach((instanceId,i)=>{const cardDefId=DEFS[i];meta[instanceId]={source:SOURCE,stageId:'stage.08',battleId:BATTLE,cardDefId,cardKind:'WORD',lifetime:'BATTLE',crystalBearing:false,supportOnly:true,supplyIndex:i};run.cardInstances[instanceId]={instanceId,cardDefId,polishLevel:0,specialEffectId:null,temporary:{source:SOURCE,battleId:BATTLE}};});
 const language=registryForVersion(run.version);run.vocabulary.encounteredLexemeIds=[...new Set([...run.vocabulary.encounteredLexemeIds,...DEFS.map(id=>language.cardById[id].lexemeId)])];
 return {temporaryCardIds:ids,temporaryCardMeta:meta,shatteredTemporaryIds:[],waterwaysFrostTrace:[{kind:'WATERWAYS_FROST_SUPPLY',battleId:BATTLE,cardDefIds:[...DEFS]}]};
}
/** Exchange one real draw card with a non-witness opening card, with zero RNG calls. */
export function ensureWaterwaysFrostVisibility(piles,supply){
 if(piles.handIds.some(id=>supply.temporaryCardIds.includes(id)))return;
 const witness=new Set(piles.openingTrace.witnessSlots.map(s=>s.cardInstanceId));
 const target=piles.handIds.findIndex(id=>!witness.has(id)),source=piles.drawIds.findIndex(id=>supply.temporaryCardIds.includes(id));
 if(target<0||source<0){supply.waterwaysFrostTrace.push({kind:'VISIBILITY_UNAVAILABLE',reason:'NO_NON_WITNESS_SWAP'});return;}
 const incoming=piles.drawIds[source],outgoing=piles.handIds[target];
 [piles.handIds[target],piles.drawIds[source]]=[incoming,outgoing];
 supply.waterwaysFrostTrace.push({kind:'WATERWAYS_VISIBILITY_SWAP',incoming,outgoing,handIndex:target,drawIndex:source});
}
export function validateWaterwaysFrost(run){
 const c=run.combat,expected=run.version==='0.8.0'&&run.progress.stageId==='stage.08'&&run.progress.roundIndex===2&&c;
 if(!expected){if(c?.waterwaysFrostTrace!==undefined||Object.values(run.cardInstances).some(x=>x.temporary?.source===SOURCE))fail('outside battle35');return true;}
 if(c.frostSupplyTrace!==undefined||c.dustSupplyTrace!==undefined||c.enemyState.id!==BATTLE)fail('mixed source');
 const ids=c.temporaryCardIds,broken=c.shatteredTemporaryIds,meta=c.temporaryCardMeta,trace=c.waterwaysFrostTrace;
 if(!Array.isArray(ids)||!Array.isArray(broken)||new Set(ids).size!==ids.length||new Set(broken).size!==broken.length||broken.some(id=>!ids.includes(id))||!meta||Object.keys(meta).length!==ids.length||ids.some(id=>run.activeCardIds.includes(id)))fail('partition');
 if(!Array.isArray(trace)||trace[0]?.kind!=='WATERWAYS_FROST_SUPPLY'||trace[0].battleId!==BATTLE||JSON.stringify(trace[0].cardDefIds)!==JSON.stringify(DEFS))fail('manifest');
 const ended=['REWARD','BETWEEN_BATTLES','STAGE_CLEAR','CONTENT_COMPLETE','DEFEAT'].includes(run.status);
 if(ended){if(ids.length||broken.length||JSON.stringify(c.frostCleanup?.removedCardIds)!==JSON.stringify(DEFS.map((_,i)=>idFor(run,i))))fail('cleanup');}
 else {
  if(ids.length!==2)fail('count');
  const consumed=(run.stats?.history??[]).filter(r=>r.battleId===BATTLE).flatMap(r=>r.consumedTemporaryCardIds??[]);
  if(new Set(consumed).size!==consumed.length||JSON.stringify([...consumed].sort())!==JSON.stringify([...broken].sort()))fail('shatter receipts');
 }
 ids.forEach((id,i)=>{const m=meta[id],x=run.cardInstances[id];if(id!==idFor(run,i)||m?.source!==SOURCE||m.stageId!=='stage.08'||m.battleId!==BATTLE||m.cardDefId!==DEFS[i]||m.supplyIndex!==i||m.cardKind!=='WORD'||m.lifetime!=='BATTLE'||m.crystalBearing!==false||m.supportOnly!==true||x?.instanceId!==id||x.cardDefId!==DEFS[i]||x.polishLevel!==0||x.specialEffectId!==null||x.temporary?.source!==SOURCE||x.temporary.battleId!==BATTLE||c.exhaustedIds?.includes(id))fail('metadata');});
 if(Object.values(run.cardInstances).some(x=>x.temporary&&!ids.includes(x.instanceId)))fail('orphan');
 return true;
}
