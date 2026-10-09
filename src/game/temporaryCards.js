import {hasEmberCampaign} from '../data/campaignFeatures.js';
import {validateFrostCards,cleanupFrost} from './frostCards.js';
import {validateDustCards,cleanupDust} from './emberDust.js';
/** Dispatch new temporary sources without weakening any legacy snow validation. */
export function validateTemporaryCards(run){
 if(hasEmberCampaign(run)&&run.progress.stageId==='stage.07'&&run.combat)return validateDustCards(run);
 if(run.combat?.dustSupplyTrace!==undefined||run.combat?.dustCleanup!==undefined)throw Error('Dust outside ember battle');
 return validateFrostCards(run);
}
export function cleanupTemporaryCards(run){return run.combat?.dustSupplyTrace?cleanupDust(run):cleanupFrost(run);}
