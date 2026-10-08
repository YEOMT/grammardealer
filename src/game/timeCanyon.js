import {registryForVersion} from '../data/language/index.js';
/** Mutates only the controller's uncommitted next-state copy. No draws or RNG use. */
export function grantStage3Entry(run){
 if(!['0.3.0','0.4.0','0.5.0','0.5.1','0.6.0'].includes(run.version)||run.progress.stageId!=='stage.03'||run.combat!==null)throw Error('Stage 3 entry outside preparation');
 if(run.entryGrants['stage.03']?.applied)return run.entryGrants['stage.03'];
 const owned=new Set(run.activeCardIds.map(id=>run.cardInstances[id].cardDefId));
 const missing=['card.be','card.have','card.will'].filter(id=>!owned.has(id)),language=registryForVersion(run.version);
 const cardInstanceIds=missing.map((cardDefId,i)=>{
  const instanceId=`entry.${run.runId}.stage.03.card.${i}`;
  if(run.cardInstances[instanceId])throw Error('Duplicate Stage 3 entry instance');
  run.cardInstances[instanceId]={instanceId,cardDefId,polishLevel:0,specialEffectId:null};run.activeCardIds.push(instanceId);return instanceId;
 });
 run.vocabulary.encounteredLexemeIds=[...new Set([...run.vocabulary.encounteredLexemeIds,...missing.map(id=>language.cardById[id].lexemeId)])];
 return run.entryGrants['stage.03']={entryGrantId:`${run.runId}:stage.03.entryGrant`,applied:true,cardInstanceIds,cardDefIds:missing,trace:[{kind:'MISSING_ACTIVE_DEFINITION_ONLY',cardDefIds:missing}]};
}
