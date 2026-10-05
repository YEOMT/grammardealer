import {registryForVersion} from '../data/language/index.js';
import {cardKind} from '../data/cardCatalog.js';
export const CLAUSE_LINK_PACK='pack.clauseLink';
/** Missing active WORD material only. Neither shop removals nor reentry can recreate a grant. */
export function grantStage4Entry(run){
 if(run.version!=='0.4.0'||run.progress.stageId!=='stage.04'||run.combat!==null)throw Error('Stage 4 grant outside entry');
 if(run.entryGrants['stage.04']?.applied)return run.entryGrants['stage.04'];
 const registry=registryForVersion(run.version),words=run.activeCardIds.filter(id=>cardKind(run.cardInstances[id],run.version)==='WORD').map(id=>registry.cardById[run.cardInstances[id].cardDefId]),owned=new Set(words.map(c=>c.id));
 const hasContent=words.some(c=>registry.lexemeById[c.lexemeId].senseIds.some(id=>registry.senseById[id].frameBindings.some(b=>b.runtimeReady&&b.frameId==='frame.svo.content')));
 const cardDefIds=[...(!owned.has('card.and')?['card.and']:[]),...(!['card.because','card.when','card.if'].some(id=>owned.has(id))?['card.because']:[]),...(!hasContent?['card.think']:[]),...(!owned.has('card.that')?['card.that']:[])];
 const cardInstanceIds=cardDefIds.map((cardDefId,i)=>{const instanceId=`entry.${run.runId}.stage.04.card.${i}`;if(run.cardInstances[instanceId])throw Error('Duplicate Stage 4 entry ID');run.cardInstances[instanceId]={instanceId,cardDefId,polishLevel:0,specialEffectId:null};run.activeCardIds.push(instanceId);return instanceId;});
 run.vocabulary.encounteredLexemeIds=[...new Set([...run.vocabulary.encounteredLexemeIds,...cardDefIds.map(id=>registry.cardById[id].lexemeId)])];
 return run.entryGrants['stage.04']={entryGrantId:`${run.runId}:stage.04.entryGrant`,applied:true,cardInstanceIds,cardDefIds,trace:[{kind:'MISSING_ACTIVE_WORD_CAPABILITY_ONLY',cardDefIds}]};
}
