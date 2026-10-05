/** Grammar describes evidence; this resolver alone reads the frozen run unlock snapshot. */
export const COMBO_VERSION = '0.2.2';
export function comboEligibility(run) {
  return {version:COMBO_VERSION,unlocks:[...new Set([...(run?.eligibility?.runStartUnlockBaseline??[]),...(run?.eligibility?.runOwnUnlocks??[])])].sort()};
}
export function scoreableAnalysis(analysis, eligibility) {
  if (!eligibility) return analysis; // Explicit pre-0.2.2 numerical contract.
  const hits=(analysis.grammarHits??[]).filter(hit=>hit.comboImplemented!==false &&
    (hit.tag!=='FRAME.SVOO'||eligibility.unlocks.includes('pack.svoo')));
  return {...analysis,grammarHits:hits,hits};
}
