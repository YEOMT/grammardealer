import {hasSkyCampaign,hasPolishCampaign} from '../data/campaignFeatures.js';
import {operationCardsForVersion} from '../data/operationSpec.js';
import {weightedPick,pick} from './rng.js';
/** Internal branch after the unchanged external rarity draw. Protected syntax slots stay WORD. */
export function selectOperation(run,rarity,role,selected,stream,trace){
 if(!hasSkyCampaign(run)||role==='LOCAL_SYNTAX_RELEVANT'||!(hasPolishCampaign(run)?['COMMON','UNCOMMON','RARE']:['UNCOMMON','RARE']).includes(rarity))return null;
 const operations=operationCardsForVersion(run.version);
 const pool=operations.filter(c=>c.rarity===rarity&&run.contentManifest.cardDefIds.includes(c.id));
 const used=operations.some(c=>selected.has(c.id));
 if(used||!pool.length){trace.push({kind:'OPERATION_BRANCH_FALLBACK',role,rarity,reason:used?'ONE_OPERATION_LIMIT':'NO_ELIGIBLE_OPERATION'});return null;}
 const branch=weightedPick(stream,{OPERATION:20,WORD:80});trace.push({kind:'CARD_KIND_DRAW',role,rarity,weights:{OPERATION:20,WORD:80},branch});
 if(branch!=='OPERATION')return null;
 // Legacy had one definition per eligible rarity and consumed no definition draw.
 if(!hasPolishCampaign(run))return pool[0];
 const selectedOperation=pick(stream,pool);
 trace.push({kind:'OPERATION_DEFINITION_DRAW',rarity,policy:'UNIFORM_SAME_RARITY',candidateIds:pool.map(c=>c.id),cardDefId:selectedOperation.id});
 return selectedOperation;
}

/** One permanent operation in the final card slot, independent of the WORD rarity draws. */
export function selectDedicatedOperation(run,stream,trace){
 if(!hasPolishCampaign(run))throw new TypeError('Dedicated operation slot requires 0.6.1 policy');
 const pool=operationCardsForVersion(run.version).filter(c=>c.runtimeReady&&run.contentManifest.cardDefIds.includes(c.id));
 if(!pool.length)throw new TypeError('No eligible permanent operation');
 const card=pick(stream,pool);
 trace.push({kind:'DEDICATED_OPERATION_DRAW',policy:'UNIFORM_PERMANENT_DEFINITION',candidateIds:pool.map(c=>c.id),cardDefId:card.id});
 return card;
}
