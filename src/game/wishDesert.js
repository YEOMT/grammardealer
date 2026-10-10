import {registryForVersion} from '../data/language/index.js';
import {cardKind} from '../data/cardCatalog.js';
export const DESERT_PACKS=Object.freeze(['pack.infinitive','pack.gerund','pack.svoc.basic']);
/** Missing owned WORD capabilities only. Controller calls this on its uncommitted proposal. */
export function grantStage5Entry(run){
 if(!['0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0'].includes(run.version)||run.progress.stageId!=='stage.05'||run.combat!==null)throw Error('Stage 5 grant outside entry');
 if(run.entryGrants['stage.05']?.applied)return run.entryGrants['stage.05'];
 const registry=registryForVersion(run.version),owned=new Set(run.activeCardIds.filter(id=>cardKind(run.cardInstances[id],run.version)==='WORD').map(id=>run.cardInstances[id].cardDefId));
 const requirements=[{cardDefId:'card.to',alternatives:['card.to'],reason:'MISSING_TO'},{cardDefId:'card.want',alternatives:['card.want','card.need'],reason:'MISSING_WANT_OR_NEED'},{cardDefId:'card.enjoy',alternatives:['card.like','card.enjoy','card.finish'],reason:'MISSING_BASIC_GERUND_OBJECT_VERB'}];
 const missing=requirements.filter(row=>!row.alternatives.some(id=>owned.has(id))),cardDefIds=missing.map(row=>row.cardDefId);
 const cardInstanceIds=cardDefIds.map((cardDefId,i)=>{const instanceId=`entry.${run.runId}.stage.05.card.${i}`;if(run.cardInstances[instanceId]||!registry.cardById[cardDefId]?.runtimeReady)throw Error('Invalid Stage 5 entry card');return instanceId;});
 cardInstanceIds.forEach((instanceId,i)=>{run.cardInstances[instanceId]={instanceId,cardDefId:cardDefIds[i],polishLevel:0,specialEffectId:null};run.activeCardIds.push(instanceId);});
 run.vocabulary.encounteredLexemeIds=[...new Set([...run.vocabulary.encounteredLexemeIds,...cardDefIds.map(id=>registry.cardById[id].lexemeId)])];
 return run.entryGrants['stage.05']={entryGrantId:`${run.runId}:stage.05.entryGrant`,applied:true,cardInstanceIds,cardDefIds,trace:missing.map((row,i)=>({kind:row.reason,cardDefId:row.cardDefId,cardInstanceId:cardInstanceIds[i]}))};
}
