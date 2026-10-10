import {registryForVersion} from '../data/language/index.js';
export const WATERWAYS_CHOICES=Object.freeze(['WHO','WHICH','NONE']);
export function waterwaysEntryOffer(run){
 if(run.version!=='0.8.0'||run.progress.stageId!=='stage.08'||run.combat!==null||run.entryGrants['stage.08']?.applied)return null;
 const ownedCounts=Object.fromEntries(['who','which','that'].map(w=>[w,run.activeCardIds.filter(id=>run.cardInstances[id].cardDefId===`card.${w}`).length]));
 return {entryVersion:'0.8.0',offerId:`${run.runId}:stage.08:entry-choice`,stageId:'stage.08',pending:true,choices:[...WATERWAYS_CHOICES],ownedCounts,needsNoneConfirmation:Object.values(ownedCounts).every(n=>n===0)};
}
/** Mutates a private controller proposal only, after all command/offer checks. No RNG. */
export function grantWaterwaysEntry(run,choice){
 const offer=waterwaysEntryOffer(run);if(!offer||!WATERWAYS_CHOICES.includes(choice))throw Error('Invalid waterways entry choice');
 const cardDefIds=choice==='NONE'?[]:[`card.${choice.toLowerCase()}`],cardInstanceIds=cardDefIds.map(()=>`entry.${run.runId}.stage.08.card.0`);
 if(cardInstanceIds.some(id=>run.cardInstances[id]))throw Error('Repeated waterways grant');
 const registry=registryForVersion(run.version);
 cardDefIds.forEach((cardDefId,i)=>{const instanceId=cardInstanceIds[i];run.cardInstances[instanceId]={instanceId,cardDefId,polishLevel:0,specialEffectId:null};run.activeCardIds.push(instanceId);});
 run.vocabulary.encounteredLexemeIds=[...new Set([...run.vocabulary.encounteredLexemeIds,...cardDefIds.map(id=>registry.cardById[id].lexemeId)])];
 run.entryGrants['stage.08']={entryVersion:'0.8.0',entryGrantId:offer.offerId,applied:true,choice,cardDefIds,cardInstanceIds};
 run.waterwaysEntryChoice={...offer,pending:false,choice};
 return run.entryGrants['stage.08'];
}
export function validateWaterwaysEntry(run){
 const choice=run.waterwaysEntryChoice,grant=run.entryGrants?.['stage.08'],fail=()=>{throw Error('Invalid waterways entry receipt');};
 if(run.version!=='0.8.0'){if(choice!==undefined||grant!==undefined)fail();return true;}
 if(!choice){if(grant||run.progress.stageId==='stage.08'&&run.status!=='STAGE_INTRO')fail();return true;}
 if(run.progress.stageId!=='stage.08')fail();
 if(choice.entryVersion!=='0.8.0'||choice.offerId!==`${run.runId}:stage.08:entry-choice`||choice.stageId!=='stage.08'||JSON.stringify(choice.choices)!==JSON.stringify(WATERWAYS_CHOICES)||!choice.ownedCounts||Object.keys(choice.ownedCounts).join('|')!=='who|which|that'||Object.values(choice.ownedCounts).some(n=>!Number.isSafeInteger(n)||n<0)||choice.needsNoneConfirmation!==Object.values(choice.ownedCounts).every(n=>n===0))fail();
 if(choice.pending===true){if(run.status!=='STAGE_INTRO'||run.progress.stageId!=='stage.08'||run.combat!==null||grant||run.shop?.stageId==='stage.08'||JSON.stringify(choice)!==JSON.stringify(waterwaysEntryOffer(run)))fail();}
 else {
  if(choice.pending!==false||!WATERWAYS_CHOICES.includes(choice.choice)||!grant||grant.entryVersion!=='0.8.0'||grant.entryGrantId!==choice.offerId||grant.applied!==true||grant.choice!==choice.choice)fail();
  const defs=choice.choice==='NONE'?[]:[`card.${choice.choice.toLowerCase()}`],ids=defs.map(()=>`entry.${run.runId}.stage.08.card.0`);
  if(JSON.stringify(grant.cardDefIds)!==JSON.stringify(defs)||JSON.stringify(grant.cardInstanceIds)!==JSON.stringify(ids))fail();
  ids.forEach((id,i)=>{if(run.cardInstances[id]&&run.cardInstances[id].cardDefId!==defs[i])fail();});
 }
 return true;
}
