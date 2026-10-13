/** Shared by region and boss: consume the selected parser graph, not word spelling. */
export function libraryTargetEvidence(analysis){
 if(!['VALID','VALID_WITH_ISSUES'].includes(analysis?.status))return [];
 const consumed=new Set(analysis.coverage?.consumedCardIds??[]),excluded=new Set(analysis.coverage?.unlicensedCardIds??[]),seen=new Set();
 return (analysis.nominalStructures??[]).filter(row=>{
  if(row.validity!=='VALID'||row.ownIssueIds?.length||!row.nodeId||seen.has(row.nodeId)||!row.cardIds?.length||!row.cardIds.every(id=>consumed.has(id)&&!excluded.has(id)))return false;
  if(!['NOMINAL_IF','NOMINAL_WHAT','NOMINAL_QUESTION','NOMINAL_WHETHER','NOMINAL_THAT','EXTRAPOSED_SUBJECT_TO','EXTRAPOSED_SUBJECT_THAT'].includes(row.kind))return false;
  seen.add(row.nodeId);return true;
 });
}
