/** Serialize grammar-owned boundaries. Punctuation is never a token or a finite clause. */
export function addClausePunctuationEvidence(analysis,{tokens,sourceNodes,best,punctuation}) {
 const {nodes,clauses,grammarHits,issues}=analysis;
 const main=clauses.find(c=>c.id===analysis.mainClauseId);
 const punctuationIssues=best.issues.filter(i=>i.punctuation).map((i,n)=>({...i,id:`issue.punctuation.${n}`}));
 const boundary=punctuation[0]?.gapIndex??null;
 const rows=[];
 for(const [source,nodeId]of sourceNodes){
  if(!source.adjunct)continue;
  const a=source.adjunct,id=`participial.${rows.length}`,node=nodes.find(n=>n.id===nodeId),controller=nodes.find(n=>n.id===main.subjectNodeId);
  const ownIssues=issues.filter(i=>i.cardIds.some(id=>node.cardIds.includes(id)||nodes.find(n=>n.id===main.nodeId)?.cardIds.includes(id)));
  const boundaryValid=boundary===a.boundary;
  const valid=ownIssues.length===0&&boundaryValid&&Boolean(controller)&&main.finite;
  const row={id,kind:'PARTICIPIAL_ADJUNCT',nodeId,voice:a.voice,participleCardId:node.headCardId,participleForm:a.formKind,
   adjunctWordRange:[source.start,source.end],commaBoundary:boundaryValid?{gapIndex:boundary}:null,
   mainClauseId:main.id,controllerSubjectNodeId:controller?.id??null,validity:valid?'VALID':'RECOVERED',bonusEligible:valid,
   issueIds:[...ownIssues.map(i=>i.id),...(!boundaryValid?punctuationIssues.map(i=>i.id):[])],wordCardIds:[...node.cardIds],
   evidenceRefs:[nodeId,main.id,controller?.id].filter(Boolean)};
  rows.push(row);
  const hit=grammarHits.find(h=>h.tag===`CLAUSE.PARTICIPIAL.${a.voice}`&&h.headCardId===node.headCardId);
  if(hit)Object.assign(hit,{participialAdjunctId:id,scope:'ADJUNCT',scopeNodeId:nodeId,validity:row.validity,bonusEligible:valid,
   cardIds:[...new Set([...node.cardIds,...(controller?.cardIds??[])])],evidenceKey:`PARTICIPIAL:${nodeId}:${main.id}:${boundary}`});
 }
 if(punctuationIssues.length){
  // A misplaced comma invalidates only structures whose own span it divides.
  // The ordinary main frame, unrelated clauses and temporal morphology survive.
  const crosses=ids=>{const indices=ids.map(id=>tokens.findIndex(t=>t.cardInstanceId===id));return boundary!==null&&indices.some(i=>i<boundary)&&indices.some(i=>i>=boundary);};
  const affected=[];
  for(const row of [...(analysis.relativeClauses??[]),...(analysis.nominalStructures??[]),...(analysis.corridorStructures??[])]){
   const requiredClauseEntry=boundary!==null&&row.range?.[0]===boundary;
   if(!crosses(row.cardIds)&&!requiredClauseEntry)continue;
   row.validity='RECOVERED';row.bonusEligible=false;
   row.ownIssueIds=[...new Set([...(row.ownIssueIds??[]),...punctuationIssues.map(i=>i.id)])];affected.push(row.id);
  }
  const affectedNodeIds=[...(analysis.relativeClauses??[]),...(analysis.nominalStructures??[])].filter(r=>affected.includes(r.id)).map(r=>r.nodeId);
  for(const h of grammarHits)if(affected.includes(h.relativeClauseId)||affected.includes(h.corridorEvidenceId)||h.tag==='LINK.CLAUSE'&&(crosses(h.cardIds)||affectedNodeIds.includes(h.scopeNodeId))){
   h.validity='RECOVERED';h.bonusEligible=false;
  }
  issues.push(...punctuationIssues);analysis.status='VALID_WITH_ISSUES';analysis.messageKo=punctuationIssues[0].messageKo;
  analysis.coverage.issueAffectedCardIds=[...new Set([...analysis.coverage.issueAffectedCardIds,...punctuationIssues.flatMap(i=>i.cardIds)])];
 }
 analysis.participialAdjuncts=rows;
 analysis.punctuationIssues=punctuationIssues;
 analysis.punctuation=punctuation.map(p=>({...p}));
 analysis.evidenceMarks=grammarHits.map(h=>({evidenceKey:h.evidenceKey,cardIds:h.cardIds,...(h.participialAdjunctId?{punctuation:punctuation.map(p=>({...p}))}:{})}));
 return analysis;
}
