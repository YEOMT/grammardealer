/** Derive constructions from selected constituent/VP identities, never word order strings. */
export function addCorridorEvidence(analysis,tokens){
 const {nodes,clauses,verbPhrases:vps,grammarHits:hits,issues}=analysis;
 const token=id=>tokens.find(t=>t.cardInstanceId===id),node=id=>nodes.find(n=>n.id===id);
 const clean=vp=>vp?.finiteCardId&&vp.chainWellFormed&&!vp.issueIds.length;
 const finite=vp=>token(vp?.finiteCardId)?.surface.toLowerCase();
 const principal=id=>vps.find(v=>v.clauseId===id&&v.lexicalVerbCardId===clauses.find(c=>c.id===id)?.verbCardId);
 const pastPerfect=vp=>clean(vp)&&finite(vp)==='had'&&vp.aspects.includes('PERFECT');
 const rows=[];
 const emit=(kind,props)=>{const row={id:'corridor.'+rows.length,kind,validity:'VALID',...props};rows.push(row);hits.push({id:'hit.'+row.id,tag:'CORRIDOR.'+kind,scope:'CLAUSE',scopeNodeId:row.nodeId,cardIds:row.cardIds,validity:'VALID',comboImplemented:true,evidenceKey:kind+':'+row.nodeId,corridorEvidenceId:row.id,verbPhraseIds:row.verbPhraseIds,conditionClauseId:row.conditionClauseId??null,resultClauseId:row.resultClauseId??null,connectorCardId:row.connectorCardId??null});return row;};
 for(const n of nodes.filter(n=>n.type==='ADVERBIAL_CONNECTION'&&token(n.connector)?.surface.toLowerCase()==='if')){
  const direct=n.children.map(node).filter(x=>x.type!=='CONNECTOR');
  const result=clauses.find(c=>c.verbCardId===n.headCardId&&direct.some(x=>x.cardIds.includes(c.verbCardId)));
  const condition=clauses.find(c=>c.parentClauseId===result?.id&&c.role==='ADVERBIAL'&&direct.some(x=>x.cardIds.includes(c.verbCardId)));
  const r=principal(result?.id),c=principal(condition?.id);
  if(!clean(r)||!clean(c)||issues.some(i=>i.cardIds.some(id=>n.cardIds.includes(id))))continue;
  let kind=null;
  if(['would','could'].includes(r.modal)&&r.aspects.includes('PERFECT')&&pastPerfect(c))kind='UNREAL_PAST';
  else if(['would','could'].includes(r.modal)&&r.aspects.length===0&&c.aspects.length===0&&(c.tenseFamily==='PAST'||c.modal==='could'))kind='UNREAL_PRESENT';
  else if(['will','can'].includes(r.modal)&&r.aspects.length===0&&c.tenseFamily==='PRESENT'&&!c.modal&&c.aspects.length===0)kind='CONDITIONAL_REAL';
  if(!kind)continue;
  emit(kind,{nodeId:n.id,conditionClauseId:condition.id,resultClauseId:result.id,verbPhraseIds:[c.id,r.id],connectorCardId:n.connector,cardIds:[...n.cardIds]});
  // Mood is not factual past/future evidence for the time golem. Raw morphology
  // remains available as formTenseFamily and the selected physical forms.
  if(kind.startsWith('UNREAL'))for(const vp of [c,r]){vp.formTenseFamily=vp.tenseFamily;vp.tenseFamily=null;vp.mood='COUNTERFACTUAL';for(const h of hits)if(h.scopeNodeId===vp.nodeId&&['TIME.PAST','TIME.FUTURE_WILL'].includes(h.tag))h.bonusEligible=false;}
 }
 for(const vp of vps.filter(clean)){
  if(pastPerfect(vp))emit('PAST_PERFECT',{nodeId:vp.nodeId,verbPhraseIds:[vp.id],cardIds:[...vp.cardIds]});
  if(['have','has'].includes(finite(vp))&&vp.aspects.includes('PERFECT')&&vp.aspects.includes('PROGRESSIVE'))emit('PRESENT_PERFECT_PROGRESSIVE',{nodeId:vp.nodeId,verbPhraseIds:[vp.id],cardIds:[...vp.cardIds]});
 }
 analysis.corridorStructures=rows;return analysis;
}

/** Numerical eligibility is separate from raw analysis. Keep a receipt of replaced evidence. */
export function corridorScoreEvidence(analysis){
 const hits=analysis.grammarHits,rows=analysis.corridorStructures??[],removed=new Map();
 const eligibleRows=rows.filter(r=>hits.some(h=>h.corridorEvidenceId===r.id));
 const suppress=(row,predicate)=>{for(const h of hits)if(predicate(h))removed.set(h.id,{hitId:h.id,replacedBy:'hit.'+row.id});};
 for(const row of eligibleRows.filter(r=>['CONDITIONAL_REAL','UNREAL_PRESENT','UNREAL_PAST'].includes(r.kind))){
  suppress(row,h=>h.tag==='LINK.CLAUSE'&&h.connectorCardIds?.includes(row.connectorCardId));
  if(row.kind.startsWith('UNREAL'))suppress(row,h=>h.tag.startsWith('TIME.')&&row.verbPhraseIds.some(id=>analysis.verbPhrases.find(v=>v.id===id)?.nodeId===h.scopeNodeId)||h.tag==='CORRIDOR.PAST_PERFECT'&&h.verbPhraseIds?.some(id=>row.verbPhraseIds.includes(id)));
 }
 for(const row of eligibleRows.filter(r=>['PAST_PERFECT','PRESENT_PERFECT_PROGRESSIVE'].includes(r.kind)&&!removed.has('hit.'+r.id))){
  const tags=row.kind==='PAST_PERFECT'?['TIME.PAST','TIME.PERFECT']:['TIME.PERFECT','TIME.PROGRESSIVE'];
  suppress(row,h=>tags.includes(h.tag)&&h.scopeNodeId===row.nodeId);
 }
 const filtered=hits.filter(h=>h.bonusEligible!==false&&!removed.has(h.id));return {...analysis,grammarHits:filtered,hits:filtered,suppressedScoreEvidence:[...removed.values()]};
}
