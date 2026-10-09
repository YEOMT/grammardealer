/** Evidence derived from selected constituent/verb-chain bindings, never word spelling. */
export function emberEvidence({tokens,nodes,clauses,clauseSources,vpRows,nonfiniteSources,grammarHits,issues,sourceNodes}){
 const at=i=>tokens[i]?.cardInstanceId??null,uses=[];
 const malformed=new Set(['AUXILIARY_FORM_REQUIRED','INFINITIVE_BASE_REQUIRED','BE_FORM_REQUIRED','SUBJECT_VERB_AGREEMENT','ASPECT_USAGE']);
 const excluded=ids=>issues.filter(i=>malformed.has(i.code)&&i.cardIds.some(id=>ids.includes(id))).flatMap(i=>i.cardIds);
 const add=(index,morphology,fn,{phraseCardIds,headCardId=at(index),targetHeadCardId=null,parentClauseId,sourceVerbSenseId,invalid=[]})=>{
  const t=tokens[index],tense=morphology==='ING'?'PRESENT_PARTICIPLE':'PAST_PARTICIPLE';
  if(t?.lex.pos!=='VERB'||!t.forms.some(f=>f.grammaticalFeatures.tense===tense))return;
  const excludedCardIds=[...new Set(invalid)];
  uses.push({useId:`formUse.${uses.length}`,formCardId:at(index),resolvedMorphology:morphology,function:fn,phraseCardIds,headCardId,targetNPId:nodes.find(n=>n.type==='NP'&&n.headCardId===targetHeadCardId)?.id??null,targetHeadCardId,parentClauseId,sourceVerbSenseId,validity:excludedCardIds.length?'RECOVERED':'VALID',excludedCardIds});
 };
 for(const [clause,source]of clauseSources){
  Object.assign(clause,{sourceFrameId:source.sourceFrameId,sourceVerbSenseId:source.senseId,voice:source.voice,promotion:source.promotion});
  if(source.construction&&source.voice!=='PASSIVE'){
   const node=nodes.find(n=>n.id===clause.nodeId),bad=excluded(node.cardIds);
   if(bad.length)continue;
   grammarHits.push({id:`hit.${clause.id}.construction`,tag:`CONSTRUCTION.${source.construction}`,scope:'CLAUSE',scopeNodeId:node.id,parentClauseId:clause.id,cardIds:node.cardIds,headCardId:at(source.verbIndex),validity:bad.length?'RECOVERED':'VALID',bonusEligible:!bad.length,comboImplemented:true,evidenceKey:`CONSTRUCTION:${clause.id}`});
  }
 }
 for(const {node,vp,clauseId}of vpRows){
  const bad=excluded(node.cardIds),valid=vp.chainWellFormed&&!bad.length;
  if(vp.voice==='PASSIVE'&&vp.finiteIndex!==null)grammarHits.push({id:`hit.${node.id}.passive`,tag:'VOICE.PASSIVE',scope:'CLAUSE',scopeNodeId:node.id,parentClauseId:clauseId,cardIds:node.cardIds,headCardId:at(vp.lexicalIndex),sourceFrameId:vp.sourceFrameId,sourceVerbSenseId:vp.sourceSenseId,validity:valid?'VALID':'RECOVERED',bonusEligible:valid,comboImplemented:true,evidenceKey:`VOICE.PASSIVE:${node.id}`});
  for(const aux of vp.auxiliaries){
   const index=vp.verbIndices[vp.verbIndices.indexOf(aux.index)+1];
   if(!['PROGRESSIVE','PERFECT','PASSIVE'].includes(aux.role))continue;
   add(index,aux.role==='PROGRESSIVE'?'ING':'PP',aux.role,{phraseCardIds:node.cardIds,parentClauseId:clauseId,sourceVerbSenseId:vp.sourceSenseId,invalid:valid?[]:[...bad,...node.cardIds]});
  }
 }
 for(const {node,source}of nonfiniteSources){
  const n=source.nonfinite;if(!['ING','PP'].includes(n.formKind))continue;
  const c=clauses.find(c=>c.nodeId===node.id),bad=excluded(node.cardIds);
  add(source.head,n.formKind,n.interpretation==='GERUND'?'GERUND':n.function,{phraseCardIds:node.cardIds,targetHeadCardId:at(n.controllerHead),parentClauseId:c?.parentClauseId??c?.id,sourceVerbSenseId:source.clauseData.senseId,invalid:bad});
 }
 for(const [source,id]of sourceNodes)if(source.participleState){
  const node=nodes.find(n=>n.id===id),owner=clauses.find(c=>c.subjectComplementNodeId===id);
  add(source.head,'PP','SUBJECT_COMPLEMENT',{phraseCardIds:node.cardIds,parentClauseId:owner?.id,sourceVerbSenseId:tokens[source.head].senses[0].id,invalid:excluded(node.cardIds)});
 }
 return uses;
}
