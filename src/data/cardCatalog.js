import {hasSkyCampaign} from './campaignFeatures.js';
import {registryForVersion} from './language/index.js';

// Operations deliberately have no lexeme, POS, forms or scoring value.
export const OPERATION_CARDS=Object.freeze([
 Object.freeze({id:'card.operation.supply',cardKind:'OPERATION',operationType:'SUPPLY',nameKo:'보급',descriptionKo:'손패 한도 안에서 카드 2장을 뽑습니다.',rarity:'UNCOMMON',price:10,runtimeReady:true,starterEligible:false}),
 Object.freeze({id:'card.operation.search',cardKind:'OPERATION',operationType:'SEARCH',nameKo:'탐색',descriptionKo:'드로우 더미의 단어 카드 한 장을 골라 손패로 가져옵니다.',rarity:'RARE',price:14,runtimeReady:true,starterEligible:false}),
]);
const operationById=Object.fromEntries(OPERATION_CARDS.map(c=>[c.id,c]));
export function cardDefinition(card,version='0.4.0'){
 const id=typeof card==='string'?card:card?.cardDefId??card?.id;
 return registryForVersion(version).cardById[id]??(hasSkyCampaign(version)?operationById[id]:undefined);
}
export function cardKind(card,version='0.4.0'){
 const def=cardDefinition(card,version);
 if(!def)throw new TypeError('Unknown card definition');
 return def.cardKind??'WORD';
}
export const isOperation=(card,version='0.4.0')=>cardKind(card,version)==='OPERATION';
export function campaignCards(version){return [...registryForVersion(version).cards,...(hasSkyCampaign(version)?OPERATION_CARDS:[])];}
