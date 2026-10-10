import {validateWaterwaysFrost} from './waterwaysFrost.js';
import {hasEmberCampaign} from '../data/campaignFeatures.js';
import {validateFrostCards,cleanupFrost} from './frostCards.js';
import {validateDustCards,cleanupDust} from './emberDust.js';
/** Dispatch new temporary sources without weakening any legacy snow validation. */
export function validateTemporaryCards(run){
 validateWaterwaysFrost(run);
 if(run.version==='0.8.0'&&run.progress.stageId==='stage.08'&&run.progress.roundIndex===2&&run.combat)return true;
 if(hasEmberCampaign(run)&&run.progress.stageId==='stage.07'&&run.combat)return validateDustCards(run);
 if(run.combat?.dustSupplyTrace!==undefined||run.combat?.dustCleanup!==undefined)throw Error('Dust outside ember battle');
 return validateFrostCards(run);
}
export function cleanupTemporaryCards(run){return run.combat?.dustSupplyTrace?cleanupDust(run):cleanupFrost(run);}
