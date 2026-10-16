import {validateCorridorFrost} from './corridorFrost.js';
import {validateLibraryFrost} from './libraryFrost.js';
import {validateWaterwaysFrost} from './waterwaysFrost.js';
import {hasEmberCampaign} from '../data/campaignFeatures.js';
import {validateFrostCards,cleanupFrost} from './frostCards.js';
import {validateDustCards,cleanupDust} from './emberDust.js';
/** Dispatch new temporary sources without weakening any legacy snow validation. */
export function validateTemporaryCards(run){
 validateCorridorFrost(run);
 if(['0.10.0','0.10.1','0.10.2'].includes(run.version)&&run.progress.stageId==='stage.10'&&run.progress.roundIndex<4&&run.combat)return true;
 validateLibraryFrost(run);validateWaterwaysFrost(run);
 if(['0.9.0','0.10.0','0.10.1','0.10.2'].includes(run.version)&&run.progress.stageId==='stage.09'&&run.progress.roundIndex<4&&run.combat)return true;
 if(['0.8.0','0.8.1','0.9.0','0.10.0','0.10.1','0.10.2'].includes(run.version)&&run.progress.stageId==='stage.08'&&run.progress.roundIndex===2&&run.combat)return true;
 if(hasEmberCampaign(run)&&run.progress.stageId==='stage.07'&&run.combat)return validateDustCards(run);
 if(run.combat?.dustSupplyTrace!==undefined||run.combat?.dustCleanup!==undefined)throw Error('Dust outside ember battle');
 return validateFrostCards(run);
}
export function cleanupTemporaryCards(run){return run.combat?.dustSupplyTrace?cleanupDust(run):cleanupFrost(run);}
