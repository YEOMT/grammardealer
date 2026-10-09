import {hasSkyCampaign,hasPolishCampaign} from '../data/campaignFeatures.js';
import {registryForVersion} from '../data/language/index.js';
import {cardKind} from '../data/cardCatalog.js';
export const CLAUSE_LINK_PACK='pack.clauseLink';
export const STAGE4_CONNECTOR_CHOICES=Object.freeze(['card.and','card.but','card.because']);
const directConnectors=new Set(['and','but','or','because','when','if']);
function entryMaterial(run){
 const registry=registryForVersion(run.version);
 const words=run.activeCardIds.filter(id=>cardKind(run.cardInstances[id],run.version)==='WORD').map(id=>registry.cardById[run.cardInstances[id].cardDefId]);
 const lexemes=words.map(c=>registry.lexemeById[c.lexemeId]);
 return {registry,owned:new Set(words.map(c=>c.id)),hasDirect:lexemes.some(l=>directConnectors.has(l.lemma)),hasContent:lexemes.some(l=>l.senseIds.some(id=>registry.senseById[id].frameBindings.some(b=>b.runtimeReady&&b.frameId==='frame.svo.content')))};
}
/** Read-only deterministic proposal. RunController owns persisting/finishing the pending choice. */
export function getStage4EntryChoice(run){
 if(!hasPolishCampaign(run)||run.progress.stageId!=='stage.04'||run.entryGrants['stage.04']?.applied||entryMaterial(run).hasDirect)return null;
 return {entryVersion:'0.6.1',entryId:`${run.runId}:stage.04.entryGrant`,choiceId:`${run.runId}:stage.04.connectorChoice`,stageId:'stage.04',pending:true,cardDefIds:[...STAGE4_CONNECTOR_CHOICES]};
}
/** Missing active WORD material only. Neither shop removals nor reentry can recreate a grant. */
export function grantStage4Entry(run,{connectorCardDefId=null}={}){
 if(!hasSkyCampaign(run)||run.progress.stageId!=='stage.04'||run.combat!==null)throw Error('Stage 4 grant outside entry');
 if(run.entryGrants['stage.04']?.applied)return run.entryGrants['stage.04'];
 if(hasPolishCampaign(run))return grantCurrentEntry(run,connectorCardDefId);
 const registry=registryForVersion(run.version),words=run.activeCardIds.filter(id=>cardKind(run.cardInstances[id],run.version)==='WORD').map(id=>registry.cardById[run.cardInstances[id].cardDefId]),owned=new Set(words.map(c=>c.id));
 const hasContent=words.some(c=>registry.lexemeById[c.lexemeId].senseIds.some(id=>registry.senseById[id].frameBindings.some(b=>b.runtimeReady&&b.frameId==='frame.svo.content')));
 const cardDefIds=[...(!owned.has('card.and')?['card.and']:[]),...(!['card.because','card.when','card.if'].some(id=>owned.has(id))?['card.because']:[]),...(!hasContent?['card.think']:[]),...(!owned.has('card.that')?['card.that']:[])];
 const cardInstanceIds=cardDefIds.map((cardDefId,i)=>{const instanceId=`entry.${run.runId}.stage.04.card.${i}`;if(run.cardInstances[instanceId])throw Error('Duplicate Stage 4 entry ID');run.cardInstances[instanceId]={instanceId,cardDefId,polishLevel:0,specialEffectId:null};run.activeCardIds.push(instanceId);return instanceId;});
 run.vocabulary.encounteredLexemeIds=[...new Set([...run.vocabulary.encounteredLexemeIds,...cardDefIds.map(id=>registry.cardById[id].lexemeId)])];
 return run.entryGrants['stage.04']={entryGrantId:`${run.runId}:stage.04.entryGrant`,applied:true,cardInstanceIds,cardDefIds,trace:[{kind:'MISSING_ACTIVE_WORD_CAPABILITY_ONLY',cardDefIds}]};
}

function grantCurrentEntry(run,connectorCardDefId){
 const {registry,owned,hasDirect,hasContent}=entryMaterial(run);
 if(hasDirect&&connectorCardDefId!==null||!hasDirect&&!STAGE4_CONNECTOR_CHOICES.includes(connectorCardDefId))throw new TypeError('Stage 4 connector choice required or ineligible');
 const cardDefIds=[...(!hasDirect?[connectorCardDefId]:[]),...(!hasContent?['card.think']:[]),...(!owned.has('card.that')?['card.that']:[])];
 const cardInstanceIds=cardDefIds.map((_,i)=>`entry.${run.runId}.stage.04.card.${i}`);
 // All preconditions precede mutation of the controller-owned proposal.
 if(cardDefIds.some(id=>!registry.cardById[id]?.runtimeReady)||cardInstanceIds.some(id=>run.cardInstances[id]))throw new TypeError('Invalid Stage 4 entry material');
 cardDefIds.forEach((cardDefId,i)=>{const instanceId=cardInstanceIds[i];run.cardInstances[instanceId]={instanceId,cardDefId,polishLevel:0,specialEffectId:null};run.activeCardIds.push(instanceId);});
 run.vocabulary.encounteredLexemeIds=[...new Set([...run.vocabulary.encounteredLexemeIds,...cardDefIds.map(id=>registry.cardById[id].lexemeId)])];
 return run.entryGrants['stage.04']={entryGrantId:`${run.runId}:stage.04.entryGrant`,entryVersion:'0.6.1',applied:true,selectedConnectorCardDefId:hasDirect?null:connectorCardDefId,cardInstanceIds,cardDefIds,trace:[{kind:'MISSING_ACTIVE_WORD_CAPABILITY_ONLY',policy:'ONE_DIRECT_CONNECTOR_CHOICE',alreadyOwnedDirectConnector:hasDirect,cardDefIds}]};
}
