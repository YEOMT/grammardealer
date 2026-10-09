import {hasSkyCampaign,hasPolishCampaign} from './campaignFeatures.js';

// No operation is a lexeme or an attack-scoring card. Old definitions stay byte-compatible.
export const LEGACY_OPERATION_CARDS=Object.freeze([
 Object.freeze({id:'card.operation.supply',cardKind:'OPERATION',operationType:'SUPPLY',nameKo:'보급',descriptionKo:'손패 한도 안에서 카드 2장을 뽑습니다.',rarity:'UNCOMMON',price:10,runtimeReady:true,starterEligible:false}),
 Object.freeze({id:'card.operation.search',cardKind:'OPERATION',operationType:'SEARCH',nameKo:'탐색',descriptionKo:'드로우 더미의 단어 카드 한 장을 골라 손패로 가져옵니다.',rarity:'RARE',price:14,runtimeReady:true,starterEligible:false}),
]);
export const POLISH_OPERATION_CARDS=Object.freeze([...LEGACY_OPERATION_CARDS.map(c=>Object.freeze({...c,polishMax:1})),
 ...[['nounSearch','NOUN_SEARCH','명사 탐색','명사·대명사 최대 2장','UNCOMMON',10],['verbSearch','VERB_SEARCH','동사 탐색','동사 최대 2장','UNCOMMON',10],['adjectiveSearch','ADJECTIVE_SEARCH','형용사 탐색','형용사 최대 2장','UNCOMMON',10],['connectorSearch','CONNECTOR_SEARCH','연결어 탐색','연결어 최대 1장','UNCOMMON',10],['recycle','RECYCLE','재활용','버린 더미에서 무작위 최대 1장','COMMON',6]].map(([id,operationType,nameKo,descriptionKo,rarity,price])=>Object.freeze({id:'card.operation.'+id,cardKind:'OPERATION',operationType,nameKo,descriptionKo,rarity,price,polishMax:1,runtimeReady:true,starterEligible:false})),
]);
export const operationCardsForVersion=version=>hasPolishCampaign(version)?POLISH_OPERATION_CARDS:hasSkyCampaign(version)?LEGACY_OPERATION_CARDS:[];
/** Shared executable/UI/save policy; lifetime is an instance property, never a new reward definition. */
export function operationSpec(cardDefId,polishLevel=0,lifetime='PERMANENT',operationVersion='0.6.1'){
 const def=operationCardsForVersion(operationVersion).find(c=>c.id===cardDefId);if(!def)return null;
 const modern=hasPolishCampaign(operationVersion),temporary=lifetime==='BATTLE',polishMax=modern&&!temporary?1:0;
 if(!['PERMANENT','BATTLE'].includes(lifetime)||!Number.isSafeInteger(polishLevel)||polishLevel<0||polishLevel>polishMax||temporary&&(!modern||def.operationType!=='SEARCH'))throw Error('Invalid operation enhancement or lifetime');
 const type=def.operationType,config={SUPPLY:['DRAW_OR_DISCARD','ALL','DRAW',2],SEARCH:['DRAW','WORD','DIRECT',1],NOUN_SEARCH:['DRAW','NOUN_PRONOUN','ORDERED',2+polishLevel],VERB_SEARCH:['DRAW','VERB','ORDERED',2+polishLevel],ADJECTIVE_SEARCH:['DRAW','ADJECTIVE','ORDERED',2+polishLevel],CONNECTOR_SEARCH:['DRAW','CONNECTOR','ORDERED',1+polishLevel],RECYCLE:['DISCARD','ALL','RANDOM',1+polishLevel]}[type];
 if(!config)throw Error('Unknown operation type');
 const [sourcePile,filterId,selectionMode,requestedCount]=config;
 return {type,sourcePile,targetFilter:filterId,filterId,selectionMode,requestedCount,afterUseDestination:modern&&!temporary&&polishLevel===1&&['SUPPLY','SEARCH'].includes(type)?'DISCARD':'EXHAUSTED',polishMax};
}
