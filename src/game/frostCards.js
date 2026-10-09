import {registryForVersion} from '../data/language/index.js';
import {hasSnowCampaign,hasPolishCampaign} from '../data/campaignFeatures.js';
import {FROST_SUPPLIES,CRYSTAL_WORDS} from './mirrorSnowfield.js';
const frostId=(run,i)=>`frost.${run.runId}.battle.${run.progress.battleNumber}.${String(i).padStart(2,'0')}`;
const fail=message=>{throw Error(`Frost state: ${message}`);};
/** Controller-owned proposal only. Supply never adds permanent ownership or consumes RNG. */
export function createFrostSupply(run){
 if(!hasSnowCampaign(run)||run.progress.stageId!=='stage.06')return null;
 const language=registryForVersion(run.version),words=[...FROST_SUPPLIES[run.progress.roundIndex]];
 const usable=run.activeCardIds.some(id=>{const l=language.lexemeById[language.cardById[run.cardInstances[id].cardDefId]?.lexemeId];return l?.comparisonPolicy?.gradable===true;});
 if(!usable)words.push('good');
 const temporaryCardIds=[],temporaryCardMeta={},battleId=`battle.06.0${run.progress.roundIndex+1}`;
 for(const [i,word]of words.entries()){
  const id=frostId(run,i),cardDefId=`card.${word}`;if(run.cardInstances[id])fail('duplicate supply');
  temporaryCardIds.push(id);temporaryCardMeta[id]={source:'MIRROR_SNOWFIELD',battleId,cardDefId,crystalBearing:CRYSTAL_WORDS.has(word),supportOnly:!CRYSTAL_WORDS.has(word),supplyIndex:i};
  if(hasPolishCampaign(run))Object.assign(temporaryCardMeta[id],{cardKind:'WORD',lifetime:'BATTLE'});
  run.cardInstances[id]={instanceId:id,cardDefId,polishLevel:0,specialEffectId:null,temporary:{source:'MIRROR_SNOWFIELD',battleId}};
 }
 run.vocabulary.encounteredLexemeIds=[...new Set([...run.vocabulary.encounteredLexemeIds,...words.map(w=>language.cardById[`card.${w}`].lexemeId)])];
 const cardDefIds=words.map(w=>`card.${w}`),supportOperation=hasPolishCampaign(run)&&run.progress.roundIndex===4;
 if(supportOperation){const i=words.length,id=frostId(run,i),cardDefId='card.operation.search';temporaryCardIds.push(id);temporaryCardMeta[id]={source:'MIRROR_SNOWFIELD',battleId,cardDefId,cardKind:'OPERATION',lifetime:'BATTLE',crystalBearing:false,supportOnly:true,supplyIndex:i};run.cardInstances[id]={instanceId:id,cardDefId,polishLevel:0,specialEffectId:null,temporary:{source:'MIRROR_SNOWFIELD',battleId}};cardDefIds.push(cardDefId);}
 return {temporaryCardIds,temporaryCardMeta,shatteredTemporaryIds:[],frostSupplyTrace:[{kind:'FROST_SUPPLY',battleId,cardDefIds,supportFallback:!usable,...(hasPolishCampaign(run)?{supportOperation}:{})}]};
}
/** Supply only after the unchanged WORD shuffle/witness/visibility path. No RNG consumed. */
export function addFrostSupportToHand(piles,supply,rules){
 const id=supply?.temporaryCardIds.find(id=>supply.temporaryCardMeta[id].cardKind==='OPERATION');if(!id)return;
 let movedCardId=null;
 if(piles.handIds.length>=rules.handLimit){
  const witness=new Set(piles.openingTrace.witnessSlots.map(x=>x.cardInstanceId)),reverse=[...piles.handIds].reverse(),bearing=x=>supply.temporaryCardMeta[x]?.crystalBearing;
  movedCardId=reverse.find(x=>!bearing(x)&&!witness.has(x))??reverse.find(x=>!bearing(x));
  if(!movedCardId)throw Error('No legal frost-support opening space');
  piles.handIds=piles.handIds.filter(x=>x!==movedCardId);piles.drawIds.unshift(movedCardId);
 }
 piles.handIds.push(id);supply.frostSupplyTrace.push({kind:'FROST_SUPPORT_HAND',cardInstanceId:id,movedCardId});
}
/** Stable swaps after the existing deck-stream shuffle, never reward/shop/encounter calls. */
export function ensureFrostVisibility(piles,supply,rules,boss){
 const ids=[...piles.handIds,...piles.drawIds],hand=piles.handIds.length,protectedSlots=new Set(),witnessIds=new Set(piles.openingTrace.witnessSlots.map(s=>s.cardInstanceId));
 const bearing=id=>supply.temporaryCardMeta[id]?.crystalBearing===true;
 const ensure=(start,end,count)=>{
  const occupied=[];for(let i=start;i<Math.min(end,ids.length);i++)if(bearing(ids[i]))occupied.push(i);
  occupied.slice(0,count).forEach(i=>protectedSlots.add(i));
  for(let n=occupied.length;n<count;n++){
   const candidates=ids.map((id,i)=>({id,i})).filter(({id,i})=>i>=start&&i<end&&!bearing(id)&&!protectedSlots.has(i));
   const target=(candidates.find(({id})=>!witnessIds.has(id))??candidates[0])?.i??-1;
   const source=ids.findIndex((id,i)=>bearing(id)&&!protectedSlots.has(i)&&(i<start||i>=end));
   if(source<0||target<0)break;[ids[target],ids[source]]=[ids[source],ids[target]];protectedSlots.add(target);
   supply.frostSupplyTrace.push({kind:'FROST_VISIBILITY_SWAP',from:source,to:target,cardInstanceId:ids[target]});
  }
 };
 ensure(0,hand,boss?2:1);if(boss)for(let i=0;i<3;i++)ensure(hand+i*rules.turnDraw,hand+(i+1)*rules.turnDraw,1);
 piles.handIds=ids.slice(0,hand);piles.drawIds=ids.slice(hand);
 piles.openingTrace={...piles.openingTrace,guaranteed:piles.openingTrace.guaranteed&&piles.openingTrace.witnessSlots.every(s=>piles.handIds.includes(s.cardInstanceId)),frostPolicy:'STABLE_VISIBILITY_SWAP',frostInitialCount:piles.handIds.filter(bearing).length};
}
export function shatterSubmittedFrost(combat){
 if(!combat.temporaryCardIds)return [];
 const ids=combat.sentenceSlots.map(s=>s.cardInstanceId).filter(id=>combat.temporaryCardIds.includes(id)&&combat.temporaryCardMeta[id]?.cardKind!=='OPERATION');
 combat.shatteredTemporaryIds.push(...ids);combat.sentenceSlots=combat.sentenceSlots.filter(s=>!ids.includes(s.cardInstanceId));return ids;
}
export function cleanupFrost(run){
 const c=run.combat;if(!c?.temporaryCardIds?.length)return;
 const removed=[...c.temporaryCardIds],set=new Set(removed);
 for(const key of ['drawIds','handIds','discardIds','exhaustedIds'])if(c[key])c[key]=c[key].filter(id=>!set.has(id));
 c.sentenceSlots=c.sentenceSlots.filter(s=>!set.has(s.cardInstanceId));
 for(const id of removed)delete run.cardInstances[id];
 c.temporaryCardIds=[];c.temporaryCardMeta={};c.shatteredTemporaryIds=[];c.frostCleanup={removedCardIds:removed};
}
/** Same fail-closed validator for live proposals and stored states. Never generates or repairs. */
export function validateFrostCards(run){
 const c=run.combat,fields=['temporaryCardIds','temporaryCardMeta','shatteredTemporaryIds','frostSupplyTrace'];
 const expected=hasSnowCampaign(run)&&run.progress.stageId==='stage.06'&&c;
 if(!expected){if(c&&fields.some(k=>c[k]!==undefined)||Object.values(run.cardInstances).some(x=>x.temporary))fail('outside snow combat');return true;}
 if(fields.some(k=>c[k]===undefined))fail('missing partition');
 const ids=c.temporaryCardIds,broken=c.shatteredTemporaryIds;
 if(!Array.isArray(ids)||new Set(ids).size!==ids.length||!Array.isArray(broken)||new Set(broken).size!==broken.length||broken.some(id=>!ids.includes(id)))fail('temporary/shattered IDs');
 if(ids.some(id=>run.activeCardIds.includes(id))||Object.keys(c.temporaryCardMeta).length!==ids.length)fail('permanent overlap or metadata');
 if(!Array.isArray(c.frostSupplyTrace)||c.frostSupplyTrace[0]?.kind!=='FROST_SUPPLY')fail('supply trace');
 const supply=c.frostSupplyTrace[0],supportOperation=hasPolishCampaign(run)&&run.progress.roundIndex===4,words=[...FROST_SUPPLIES[run.progress.roundIndex],...(supply.supportFallback?['good']:[]),...(supportOperation?['operation.search']:[])];
 if(hasPolishCampaign(run)&&supply.supportOperation!==supportOperation)fail('support operation flag');
 if(typeof supply.supportFallback!=='boolean')fail('support fallback flag');
 if(supply.battleId!==c.enemyState.id||JSON.stringify(supply.cardDefIds)!==JSON.stringify(words.map(w=>`card.${w}`)))fail('supply manifest');
 const ended=['REWARD','BETWEEN_BATTLES','STAGE_CLEAR','CONTENT_COMPLETE','DEFEAT'].includes(run.status);
 if(hasPolishCampaign(run)&&!ended){
  // A snow battle has at most six attacks; the retained twelve receipts contain
  // every submission from this battle, including zero-damage submissions.
  const consumed=(run.stats?.history??[]).filter(r=>r.battleId===c.enemyState.id).flatMap(r=>r.consumedTemporaryCardIds??[]);
  if(new Set(consumed).size!==consumed.length||JSON.stringify([...consumed].sort())!==JSON.stringify([...broken].sort()))fail('shattered cards disagree with attack receipts');
 }
 if(ended){if(ids.length||JSON.stringify(c.frostCleanup?.removedCardIds)!==JSON.stringify(words.map((_,i)=>frostId(run,i))))fail('end cleanup');}
 else if(ids.length!==words.length)fail('missing temporary card');
 for(const [i,id]of ids.entries()){
  const meta=c.temporaryCardMeta[id],instance=run.cardInstances[id],word=words[i];
  if(id!==frostId(run,i)||!meta||meta.source!=='MIRROR_SNOWFIELD'||meta.battleId!==c.enemyState.id||meta.supplyIndex!==i||meta.cardDefId!==`card.${word}`||meta.crystalBearing!==CRYSTAL_WORDS.has(word)||meta.supportOnly!==!CRYSTAL_WORDS.has(word))fail('scope or metadata mismatch');
  if(instance?.instanceId!==id||instance.cardDefId!==meta.cardDefId||instance.polishLevel!==0||instance.specialEffectId!==null||instance.temporary?.battleId!==meta.battleId||instance.temporary?.source!==meta.source)fail('invalid instance');
  const kind=word==='operation.search'?'OPERATION':'WORD';
  if(hasPolishCampaign(run)&&(meta.cardKind!==kind||meta.lifetime!=='BATTLE'))fail('temporary type');
  if(kind==='WORD'&&c.exhaustedIds?.includes(id)||kind==='OPERATION'&&(broken.includes(id)||c.sentenceSlots.some(s=>s.cardInstanceId===id)))fail('temporary type partition');
 }
 if(Object.values(run.cardInstances).some(x=>x.temporary&&!ids.includes(x.instanceId)))fail('orphan temporary instance');
 return true;
}
