import {cardDefinition} from '../data/cardCatalog.js';
import {registryForVersion} from '../data/language/index.js';
import {LIBRARY_INITIAL} from '../data/libraryPolicy.js';
const SOURCE='DREAM_LIBRARY';
const idFor=(run,i)=>`frost.${run.runId}.library.${run.progress.roundIndex}.${i}`;
const fail=why=>{throw Error('Library frost: '+why);};
const eligible=run=>['0.9.0','0.10.0','0.10.1'].includes(run.version)&&run.progress.stageId==='stage.09'&&run.progress.roundIndex<4;
const definitions=(round,owned)=>{const policy=LIBRARY_INITIAL.frost[round];return [...(policy.always??[]),...(policy.ifMissing??[]).filter(w=>!owned.includes(`card.${w}`))].map(w=>`card.${w}`);};
export function createLibraryFrost(run){
 if(!eligible(run))return null;
 const battleId=`battle.09.0${run.progress.roundIndex+1}`,owned=[...new Set(run.activeCardIds.map(id=>run.cardInstances[id].cardDefId))],defs=definitions(run.progress.roundIndex,owned),ids=defs.map((_,i)=>idFor(run,i)),meta={};
 ids.forEach((instanceId,i)=>{if(run.cardInstances[instanceId])fail('duplicate supply');const cardDefId=defs[i];meta[instanceId]={source:SOURCE,stageId:'stage.09',battleId,cardDefId,cardKind:'WORD',lifetime:'BATTLE',crystalBearing:false,supportOnly:true,supplyIndex:i};run.cardInstances[instanceId]={instanceId,cardDefId,polishLevel:0,specialEffectId:null,temporary:{source:SOURCE,battleId}};});
 const registry=registryForVersion(run.version);run.vocabulary.encounteredLexemeIds=[...new Set([...run.vocabulary.encounteredLexemeIds,...defs.map(id=>registry.cardById[id].lexemeId)])];
 return {temporaryCardIds:ids,temporaryCardMeta:meta,shatteredTemporaryIds:[],libraryFrostTrace:[{kind:'LIBRARY_FROST_SUPPLY',battleId,cardDefIds:defs,permanentCardDefIds:owned}]};
}
/** No new draw, RNG call or replacement of the existing valid opening witness. Never called for 9-5. */
export function ensureLibraryFrostVisibility(piles,supply){
 if(!supply.temporaryCardIds.length||piles.handIds.some(id=>supply.temporaryCardIds.includes(id)))return;
 const witness=new Set(piles.openingTrace.witnessSlots.map(s=>s.cardInstanceId));
 const target=piles.handIds.findIndex(id=>!witness.has(id)),source=piles.drawIds.findIndex(id=>supply.temporaryCardIds.includes(id));
 if(target<0||source<0){supply.libraryFrostTrace.push({kind:'VISIBILITY_UNAVAILABLE',reason:'NO_NON_WITNESS_SWAP'});return;}
 const incoming=piles.drawIds[source],outgoing=piles.handIds[target];[piles.handIds[target],piles.drawIds[source]]=[incoming,outgoing];
 supply.libraryFrostTrace.push({kind:'LIBRARY_VISIBILITY_SWAP',incoming,outgoing,handIndex:target,drawIndex:source});
}
export function validateLibraryFrost(run){
 const c=run.combat;
 if(!eligible(run)||!c){if(c?.libraryFrostTrace!==undefined||Object.values(run.cardInstances).some(x=>x.temporary?.source===SOURCE))fail('outside library normal battle');return true;}
 const {temporaryCardIds:ids,shatteredTemporaryIds:broken,temporaryCardMeta:meta,libraryFrostTrace:trace}=c;
 if(c.frostSupplyTrace!==undefined||c.dustSupplyTrace!==undefined||c.waterwaysFrostTrace!==undefined)fail('mixed source');
 const supply=trace?.[0];if(supply?.kind!=='LIBRARY_FROST_SUPPLY'||supply.battleId!==c.enemyState.id||!Array.isArray(supply.permanentCardDefIds)||new Set(supply.permanentCardDefIds).size!==supply.permanentCardDefIds.length||supply.permanentCardDefIds.some(id=>!cardDefinition(id,run.version)))fail('manifest');
 const defs=definitions(run.progress.roundIndex,supply.permanentCardDefIds);
 if(JSON.stringify(defs)!==JSON.stringify(supply.cardDefIds)||!Array.isArray(ids)||!Array.isArray(broken)||new Set(ids).size!==ids.length||new Set(broken).size!==broken.length||broken.some(id=>!ids.includes(id))||!meta||Object.keys(meta).length!==ids.length||ids.some(id=>run.activeCardIds.includes(id)))fail('partition');
 const ended=['REWARD','BETWEEN_BATTLES','STAGE_CLEAR','CONTENT_COMPLETE','DEFEAT'].includes(run.status);
 if(ended){if(ids.length||broken.length||defs.length&&JSON.stringify(c.frostCleanup?.removedCardIds)!==JSON.stringify(defs.map((_,i)=>idFor(run,i))))fail('cleanup');}
 else {
  if(ids.length!==defs.length||JSON.stringify([...new Set(run.activeCardIds.map(id=>run.cardInstances[id].cardDefId))])!==JSON.stringify(supply.permanentCardDefIds))fail('missing supply or changed permanent deck');
  const consumed=(run.stats?.history??[]).filter(r=>r.battleId===c.enemyState.id).flatMap(r=>r.consumedTemporaryCardIds??[]);
  if(new Set(consumed).size!==consumed.length||JSON.stringify([...consumed].sort())!==JSON.stringify([...broken].sort()))fail('shatter receipts');
 }
 ids.forEach((id,i)=>{const m=meta[id],x=run.cardInstances[id];if(id!==idFor(run,i)||m?.source!==SOURCE||m.stageId!=='stage.09'||m.battleId!==c.enemyState.id||m.cardDefId!==defs[i]||m.supplyIndex!==i||m.cardKind!=='WORD'||m.lifetime!=='BATTLE'||m.crystalBearing!==false||m.supportOnly!==true||x?.instanceId!==id||x.cardDefId!==defs[i]||x.polishLevel!==0||x.specialEffectId!==null||x.temporary?.source!==SOURCE||x.temporary.battleId!==c.enemyState.id||c.exhaustedIds?.includes(id))fail('metadata');});
 if(Object.values(run.cardInstances).some(x=>x.temporary&&!ids.includes(x.instanceId)))fail('orphan');return true;
}
