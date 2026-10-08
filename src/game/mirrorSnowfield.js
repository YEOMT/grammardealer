import {hasSnowCampaign} from '../data/campaignFeatures.js';
export {SNOW_PACKS,SNOW_REWARD_PACK} from '../data/language/snowLanguage.js';
export const FROST_SUPPLIES=[['than','more'],['most','the'],['as','as','twice'],['too','enough','to'],['than','as','as','more','most','too','enough','twice']];
export const CRYSTAL_WORDS=new Set(['than','as','more','most','too','enough','twice']);
export function grantStage6Entry(run){
 if(!hasSnowCampaign(run)||run.progress.stageId!=='stage.06'||run.combat!==null)throw Error('Snow entry outside introduction');
 if(run.entryGrants['stage.06']?.applied)return run.entryGrants['stage.06'];
 return run.entryGrants['stage.06']={entryGrantId:`${run.runId}:stage.06.entryGrant`,applied:true,cardInstanceIds:[],cardDefIds:[],trace:[{kind:'BATTLE_ONLY_FROST_SUPPLY',permanentCardsAdded:0}]};
}
