import {analyzeSentence} from './grammar/index.js';
import {GRAMMAR_GUIDE,ROLE_GUIDE,SUBMISSION_LABELS} from '../data/grammarGuideData.js';
export const LEARNING_VERSION='0.5.0';
export function learningRecord(r){
 const a=r.analysis;
 return {version:['0.6.0','0.6.1'].includes(a.grammarVersion)?a.grammarVersion:LEARNING_VERSION,recordId:r.attackId,sentenceSnapshot:structuredClone(r.sentenceSnapshot),
  grammarVersion:a.grammarVersion??null,status:a.status??null,mainFrameId:a.mainFrameId??null,
  ...(['0.6.0','0.6.1'].includes(a.grammarVersion)?{comparisonEvidence:structuredClone((a.grammarHits??[]).filter(h=>/^(COMPARISON|DEGREE|QUANTIFIER|ADVERB)\./.test(h.tag)))}:{}),
  roles:roleRanges(a,r.sentenceSnapshot),...clauseEvidence(a),issues:(a.issues??[]).map(i=>({code:i.code,messageKo:i.messageKo??null})),
  scoreableTags:[...new Set((a.grammarHits??[]).filter(h=>(r.scoreableHitIds?.includes(h.id)??true)&&GRAMMAR_GUIDE[h.tag]).map(h=>h.tag))],
  complete:a.status==='VALID'&&!a.issues?.length,finalPower:r.finalPower,actualHpLoss:r.actualHpLoss,zeroReason:r.zeroReason??null,
  ...(['0.3.0','0.4.0','0.5.0','0.6.0','0.6.1'].includes(a.grammarVersion)?{verbPhrases:structuredClone(a.verbPhrases??[]),phaseId:r.phaseId??null,phaseExcess:r.phaseExcess??0}:{}),
  ...(['0.5.0','0.6.0','0.6.1'].includes(a.grammarVersion)?{nonfinitePhrases:structuredClone(a.nonfinitePhrases??[])}:{})};
}
export function roleRanges(analysis,snapshot){
 const tokens=snapshot?.orderedTokens??[],nodes=analysis.nodes??[];
 const owner=nodeId=>{let node=nodes.find(n=>n.id===nodeId);while(node){const c=analysis.clauses?.find(c=>c.nodeId===node.id);if(c)return c.id;node=nodes.find(n=>n.id===node.scopeNodeId);}return null;};
 const ranges=nodes.filter(n=>ROLE_GUIDE[n.grammaticalRole]).map(n=>({role:n.grammaticalRole,cardIds:n.cardIds,scopeNodeId:n.scopeNodeId,clauseId:owner(n.scopeNodeId)}));
 for(const vp of analysis.verbPhrases??[])if(vp.finiteCardId)ranges.push({role:'FINITE_VERB',cardIds:vp.cardIds,scopeNodeId:vp.nodeId,clauseId:vp.clauseId??owner(vp.nodeId)});
 for(const r of analysis.resolvedTokenRoles??[])if(ROLE_GUIDE[r.role]&&!ranges.some(n=>n.role===r.role&&n.cardIds.includes(r.cardInstanceId)))ranges.push({role:r.role,cardIds:[r.cardInstanceId],scopeNodeId:analysis.rootNodeId,clauseId:owner(nodes.find(n=>n.cardIds.includes(r.cardInstanceId)&&n.type==='V')?.id)??analysis.mainClauseId});
 return ranges.map(r=>({...r,label:ROLE_GUIDE[r.role].label,text:r.cardIds.map(id=>tokens.find(t=>t.cardInstanceId===id)?.surface??'').join(' ')}));
}
export function studentStatus(record){return record?.zeroReason==='BOSS_BLOCKED'?'방어에 막힘':record?.zeroReason==='ACCURACY_ZERO'?'형태 확인 필요 · 피해 0':SUBMISSION_LABELS[record?.status]??'이전 기록';}
/** Reclassify old recent attacks for education, without claiming a new historical bonus. */
export function displayLearningRecord(record){
 if(!record||[LEARNING_VERSION,'0.6.0','0.6.1'].includes(record.grammarVersion))return record;
 const a=analyzeSentence(record.sentenceSnapshot);
 if(!['VALID','VALID_WITH_ISSUES','INVALID_CORE'].includes(a.status))return {...record,status:null,roles:[],scoreableTags:[],complete:false};
 const verifiedTags=new Set(a.grammarHits.filter(h=>h.comboImplemented!==false).map(h=>h.tag));
 return {...record,status:a.status,mainFrameId:a.mainFrameId,roles:roleRanges(a,record.sentenceSnapshot),...clauseEvidence(a),
  issues:a.issues.map(i=>({code:i.code,messageKo:i.messageKo??null})),
  scoreableTags:(record.scoreableTags??[]).filter(tag=>verifiedTags.has(tag)),complete:a.status==='VALID'&&!a.issues.length};
}
/** One-time educational overlay only: original aggregates, power and unlocks are the backup. */
export function reviewProfileLearning(profile){
 if(profile.educationalReview?.version===LEARNING_VERSION)return profile;
 const p=structuredClone(profile),entries=[];
 for(const [originalTag,record] of Object.entries(p.grammarRecords??{}))for(const kind of ['first','best']){
  const previous=record[`${kind}Learning`],snapshot=previous?.sentenceSnapshot;
  let verified=null;
  if(snapshot){const a=analyzeSentence(snapshot);if(a.status==='VALID'&&!a.issues.length)verified={frameId:a.mainFrameId,roles:roleRanges(a,snapshot),tags:a.grammarHits.filter(h=>h.comboImplemented!==false&&GRAMMAR_GUIDE[h.tag]).map(h=>h.tag)};}
  entries.push({originalTag,kind,sentence:record[`${kind}Sentence`]??'',verified,sourceRecordId:previous?.recordId??null});
 }
 p.educationalReview={version:LEARNING_VERSION,entries};return p;
}

function clauseEvidence(a){if(!['0.4.0','0.5.0','0.6.0','0.6.1'].includes(a.grammarVersion))return {};return {primaryScoringClauseId:a.primaryScoringClauseId??null,clauses:(a.clauses??[]).map(c=>({...structuredClone(c),cardIds:a.nodes.find(n=>n.id===c.nodeId)?.cardIds??[]})),links:(a.grammarHits??[]).filter(h=>h.tag.startsWith('LINK.')).map(h=>({role:h.linkRole,connectorCardIds:[...(h.connectorCardIds??[])],cardIds:[...h.cardIds]}))};}
