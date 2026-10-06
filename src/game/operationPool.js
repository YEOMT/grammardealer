import {hasSkyCampaign} from '../data/campaignFeatures.js';
import {OPERATION_CARDS} from '../data/cardCatalog.js';
import {weightedPick} from './rng.js';
/** Internal branch after the unchanged external rarity draw. Protected syntax slots stay WORD. */
export function selectOperation(run,rarity,role,selected,stream,trace){
 if(!hasSkyCampaign(run)||role==='LOCAL_SYNTAX_RELEVANT'||!['UNCOMMON','RARE'].includes(rarity))return null;
 const pool=OPERATION_CARDS.filter(c=>c.rarity===rarity&&run.contentManifest.cardDefIds.includes(c.id));
 const used=OPERATION_CARDS.some(c=>selected.has(c.id));
 if(used||!pool.length){trace.push({kind:'OPERATION_BRANCH_FALLBACK',role,rarity,reason:used?'ONE_OPERATION_LIMIT':'NO_ELIGIBLE_OPERATION'});return null;}
 const branch=weightedPick(stream,{OPERATION:20,WORD:80});trace.push({kind:'CARD_KIND_DRAW',role,rarity,weights:{OPERATION:20,WORD:80},branch});
 return branch==='OPERATION'?pool[0]:null;
}
