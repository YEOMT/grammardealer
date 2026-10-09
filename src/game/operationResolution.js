import {cardDefinition} from '../data/cardCatalog.js';
import {registryForVersion} from '../data/language/index.js';
import {drawCards} from './deck.js';
import {randomInt} from './rng.js';

export const operationLifetime=card=>card?.temporary?'BATTLE':'PERMANENT';
export function operationTargetIds(piles,cards,version,spec){
 const ids=spec.sourcePile==='DISCARD'?piles.discardIds:spec.sourcePile==='DRAW_OR_DISCARD'?[...piles.drawIds,...piles.discardIds]:piles.drawIds;
 const language=registryForVersion(version);
 return ids.filter(id=>{
  const def=cardDefinition(cards[id],version);if(!def)return false;
  if(spec.filterId==='ALL')return true;
  if((def.cardKind??'WORD')!=='WORD')return false;
  const lex=language.lexemeById[def.lexemeId];
  switch(spec.filterId){case 'WORD':return true;case 'NOUN_PRONOUN':return ['NOUN','PRONOUN'].includes(lex.pos);case 'VERB':return lex.pos==='VERB';case 'ADJECTIVE':return lex.pos==='ADJECTIVE';case 'CONNECTOR':return ['and','but','or','because','when','if','that'].includes(lex.lemma);default:throw Error('Unknown operation filter');}
 });
}
export function operationPileSnapshot(c,rng){return Object.fromEntries([...['handIds','drawIds','discardIds','exhaustedIds','shatteredTemporaryIds'].map(k=>[k,[...(c[k]??[])]]),['rng',structuredClone(rng)]]);}
/** Deterministic movement replay shared by the live proposal and receipt validator. */
export function resolveOperationMovement(piles,cards,version,spec,sourceId,targetCardId,handLimit,stream){
 const targets=operationTargetIds(piles,cards,version,spec).filter(id=>id!==sourceId);
 const count=Math.min(spec.requestedCount,targets.length,Math.max(0,handLimit-(piles.handIds.length-1)));
 if(!piles.handIds.includes(sourceId)||count<1||spec.selectionMode==='DIRECT'&&!targets.includes(targetCardId))throw Error('No valid operation transfer');
 piles.handIds=piles.handIds.filter(id=>id!==sourceId);
 let drawnCardIds;
 switch(spec.selectionMode){
  case 'DRAW':drawnCardIds=drawCards(piles,count,handLimit,stream);break;
  case 'DIRECT':drawnCardIds=[targetCardId];piles.drawIds=piles.drawIds.filter(id=>id!==targetCardId);piles.handIds.push(targetCardId);break;
  case 'ORDERED':drawnCardIds=targets.slice(0,count);piles.drawIds=piles.drawIds.filter(id=>!drawnCardIds.includes(id));piles.handIds.push(...drawnCardIds);break;
  case 'RANDOM':{const available=[...targets];drawnCardIds=[];for(let i=0;i<count;i++)drawnCardIds.push(available.splice(randomInt(stream,available.length),1)[0]);piles.discardIds=piles.discardIds.filter(id=>!drawnCardIds.includes(id));piles.handIds.push(...drawnCardIds);break;}
  default:throw Error('Unknown operation selection');
 }
 if(drawnCardIds.length!==count||drawnCardIds.includes(sourceId))throw Error('Operation transfer mismatch');
 // Source is absent during draws/reshuffle/recycle, and enters its destination only now.
 if(spec.afterUseDestination==='DISCARD')piles.discardIds.unshift(sourceId);
 else if(spec.afterUseDestination==='EXHAUSTED')piles.exhaustedIds.push(sourceId);
 else throw Error('Unknown operation destination');
 return drawnCardIds;
}
