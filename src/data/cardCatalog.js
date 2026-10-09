import {BLACK_DUST} from './obstacles.js';
import {hasEmberCampaign,hasSkyCampaign} from './campaignFeatures.js';
import {registryForVersion} from './language/index.js';

import {LEGACY_OPERATION_CARDS,operationCardsForVersion,operationSpec} from './operationSpec.js';
export const OPERATION_CARDS=LEGACY_OPERATION_CARDS;
export function cardDefinition(card,version='0.4.0'){
 const id=typeof card==='string'?card:card?.cardDefId??card?.id;
 if(hasEmberCampaign(version)&&id===BLACK_DUST.id)return BLACK_DUST;
 return registryForVersion(version).cardById[id]??(hasSkyCampaign(version)?operationCardsForVersion(version).find(c=>c.id===id):undefined);
}
export function cardKind(card,version='0.4.0'){
 const def=cardDefinition(card,version);
 if(!def)throw new TypeError('Unknown card definition');
 return def.cardKind??'WORD';
}
export const isOperation=(card,version='0.4.0')=>cardKind(card,version)==='OPERATION';
export function campaignCards(version){return [...registryForVersion(version).cards,...(operationCardsForVersion(version))];}

export function maxPolish(card,version){if(card?.temporary)return 0;const def=cardDefinition(card,version);if(!def)return 0;return def.cardKind==='OBSTACLE'?0:def.cardKind==='OPERATION'?(operationSpec(def.id,0,'PERMANENT',version)?.polishMax??0):3;}
export function canPolish(card,version){return Number.isSafeInteger(card?.polishLevel)&&card.polishLevel>=0&&card.polishLevel<maxPolish(card,version);}
