/** Grammar describes evidence; this resolver alone reads the frozen run unlock snapshot. */
export const COMBO_VERSION = '0.2.2';
export function comboEligibility(run) {
  return {version:run?.version==='0.3.0'?'0.3.0':COMBO_VERSION,unlocks:[...new Set([...(run?.eligibility?.runStartUnlockBaseline??[]),...(run?.eligibility?.runOwnUnlocks??[])])].sort()};
}
export function scoreableAnalysis(analysis, eligibility) {
  if (!eligibility) return analysis; // Explicit pre-0.2.2 numerical contract.
  const hits=(analysis.grammarHits??[]).filter(hit=>hit.comboImplemented!==false &&
    (hit.tag!=='FRAME.SVOO'||eligibility.unlocks.includes('pack.svoo'))&&
    (!hit.tag.startsWith('TIME.')||eligibility.unlocks.includes(({'TIME.PAST':'pack.time.past','TIME.PROGRESSIVE':'pack.time.progressive','TIME.PERFECT':'pack.time.perfect','TIME.FUTURE_WILL':'pack.time.futureWill'})[hit.tag])));
  return {...analysis,grammarHits:hits,hits};
}
