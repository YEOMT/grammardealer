import {CORRIDOR_CONFIRMED} from '../data/corridorPolicy.js';
import {registryForVersion} from '../data/language/index.js';
import {cardDefinition} from '../data/cardCatalog.js';
const SOURCE='STAR_CORRIDOR';
const eligible=run=>['0.10.0','0.10.1'].includes(run.version)&&run.progress.stageId==='stage.10'&&run.progress.roundIndex<4;
export const corridorFrostId=(run,i)=>`frost.${run.runId}.corridor.${run.progress.roundIndex}.${i}`;
export function corridorFrostDefinitions(round,permanentDefinitions){
 const minimum=CORRIDOR_CONFIRMED.frostMinimums[round];if(!minimum)throw Error('Unknown corridor round');
 return Object.entries(minimum).flatMap(([word,count])=>Array(Math.max(0,count-permanentDefinitions.filter(id=>id==='card.'+word).length)).fill('card.'+word));
}
const permanent=run=>run.activeCardIds.filter(id=>!run.cardInstances[id].temporary).map(id=>run.cardInstances[id].cardDefId);
const fail=why=>{throw Error('Corridor frost: '+why);};
/** Called only while constructing a new battle in a private Controller proposal. */
export function createCorridorFrost(run){
 if(!eligible(run))return null; // Includes all possible 10-5 ownership states.
 const battleId=`battle.10.0${run.progress.roundIndex+1}`,owned=permanent(run),defs=corridorFrostDefinitions(run.progress.roundIndex,owned),ids=defs.map((_,i)=>corridorFrostId(run,i)),meta={};
 if(run.combat?.enemyState?.id===battleId||ids.some(id=>run.cardInstances[id]))fail('duplicate supply');
 ids.forEach((id,i)=>{const cardDefId=defs[i];meta[id]={source:SOURCE,stageId:'stage.10',battleId,cardDefId,cardKind:'WORD',lifetime:'BATTLE',crystalBearing:false,supportOnly:true,supplyIndex:i};run.cardInstances[id]={instanceId:id,cardDefId,polishLevel:0,specialEffectId:null,temporary:{source:SOURCE,battleId}};});
 const registry=registryForVersion(run.version);run.vocabulary.encounteredLexemeIds=[...new Set([...run.vocabulary.encounteredLexemeIds,...defs.map(id=>registry.cardById[id].lexemeId)])];
 return {temporaryCardIds:ids,temporaryCardMeta:meta,shatteredTemporaryIds:[],corridorFrostTrace:[{kind:'CORRIDOR_FROST_SUPPLY',battleId,cardDefIds:defs,permanentCardDefIds:owned}]};
}
export function ensureCorridorFrostVisibility(piles,supply){
 const trace=supply.corridorFrostTrace;
 if(!supply.temporaryCardIds.length){trace.push({kind:'VISIBILITY_NOT_NEEDED'});return;}
 if(piles.handIds.some(id=>supply.temporaryCardIds.includes(id))){trace.push({kind:'VISIBILITY_ALREADY_PRESENT'});return;}
 const witness=new Set(piles.openingTrace.witnessSlots.map(s=>s.cardInstanceId)),target=piles.handIds.findIndex(id=>!witness.has(id)),source=piles.drawIds.findIndex(id=>supply.temporaryCardIds.includes(id));
 if(target<0||source<0){trace.push({kind:'VISIBILITY_UNAVAILABLE',reason:'NO_NON_WITNESS_SWAP'});return;}
 const incoming=piles.drawIds[source],outgoing=piles.handIds[target];[piles.handIds[target],piles.drawIds[source]]=[incoming,outgoing];trace.push({kind:'CORRIDOR_VISIBILITY_SWAP',incoming,outgoing,handIndex:target,drawIndex:source});
}
export function validateCorridorFrost(run){
 const c=run.combat;
 if(!eligible(run)||!c){if(c?.corridorFrostTrace!==undefined||Object.values(run.cardInstances).some(x=>x.temporary?.source===SOURCE))fail('outside normal corridor battle');return true;}
 const {temporaryCardIds:ids,shatteredTemporaryIds:broken,temporaryCardMeta:meta,corridorFrostTrace:trace}=c,supply=trace?.[0];
 if(supply?.kind!=='CORRIDOR_FROST_SUPPLY'||supply.battleId!==c.enemyState.id||!Array.isArray(supply.permanentCardDefIds)||supply.permanentCardDefIds.some(id=>!cardDefinition(id,run.version)))fail('manifest');
 const defs=corridorFrostDefinitions(run.progress.roundIndex,supply.permanentCardDefIds),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(!equal(defs,supply.cardDefIds)||!Array.isArray(ids)||!Array.isArray(broken)||new Set(ids).size!==ids.length||new Set(broken).size!==broken.length||broken.some(id=>!ids.includes(id))||!meta||Object.keys(meta).length!==ids.length||ids.some(id=>run.activeCardIds.includes(id)))fail('partition');
 if(['REWARD','BETWEEN_BATTLES','STAGE_CLEAR','CONTENT_COMPLETE','DEFEAT'].includes(run.status)){
  if(ids.length||broken.length||defs.length&&!equal(c.frostCleanup?.removedCardIds,defs.map((_,i)=>corridorFrostId(run,i))))fail('cleanup');
 }else{
  if(ids.length!==defs.length||!equal(permanent(run),supply.permanentCardDefIds))fail('changed supply');
  const consumed=(run.stats.history??[]).filter(r=>r.battleId===c.enemyState.id).flatMap(r=>r.consumedTemporaryCardIds??[]);
  if(new Set(consumed).size!==consumed.length||!equal([...consumed].sort(),[...broken].sort()))fail('shatter receipt');
 }
 ids.forEach((id,i)=>{const x=run.cardInstances[id],m=meta[id];if(id!==corridorFrostId(run,i)||m?.source!==SOURCE||m.stageId!=='stage.10'||m.battleId!==c.enemyState.id||m.cardDefId!==defs[i]||m.supplyIndex!==i||m.cardKind!=='WORD'||m.lifetime!=='BATTLE'||m.crystalBearing!==false||m.supportOnly!==true||x?.instanceId!==id||x.cardDefId!==defs[i]||x.polishLevel!==0||x.specialEffectId!==null||x.temporary?.source!==SOURCE||x.temporary.battleId!==c.enemyState.id||c.exhaustedIds.includes(id))fail('metadata');});
 if(Object.values(run.cardInstances).some(x=>x.temporary&&!ids.includes(x.instanceId)))fail('orphan');return true;
}
