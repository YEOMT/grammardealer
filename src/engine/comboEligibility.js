/** Grammar describes evidence; this resolver alone reads the frozen run unlock snapshot. */
export const COMBO_VERSION = '0.2.2';
export function comboEligibility(run) {
  const own=run?.eligibility?.runOwnUnlocks??[],baseline=run?.eligibility?.runStartUnlockBaseline??[];
  return {version:['0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1'].includes(run?.version)?(run.version==='0.5.1'?'0.5.0':run.version):COMBO_VERSION,unlocks:[...new Set([...baseline.filter(id=>!['0.6.0','0.6.1'].includes(run.version)||!['pack.comparison','pack.degree'].includes(id)),...own])].sort()};
}
export function scoreableAnalysis(analysis, eligibility) {
  if (!eligibility) return analysis; // Explicit pre-0.2.2 numerical contract.
  const hits=(analysis.grammarHits??[]).filter(hit=>hit.comboImplemented!==false && hit.bonusEligible!==false &&
    (!hit.tag.startsWith('COMPARISON.')||hit.validity==='VALID'&&eligibility.unlocks.includes('pack.comparison'))&&
    (!hit.tag.startsWith('DEGREE.')||hit.validity==='VALID'&&eligibility.unlocks.includes('pack.degree'))&&
    (!hit.tag.startsWith('LINK.')||eligibility.unlocks.includes('pack.clauseLink'))&&
    (hit.tag!=='FRAME.SVOO'||eligibility.unlocks.includes('pack.svoo'))&&
    (hit.tag!=='FRAME.SVOC'||eligibility.unlocks.includes('pack.svoc.basic'))&&
    (hit.tag!=='CLAUSE.INFINITIVE'||hit.validity==='VALID'&&eligibility.unlocks.includes('pack.infinitive'))&&
    (hit.tag!=='CLAUSE.GERUND'||hit.validity==='VALID'&&eligibility.unlocks.includes('pack.gerund'))&&
    (!hit.tag.startsWith('TIME.')||eligibility.unlocks.includes(({'TIME.PAST':'pack.time.past','TIME.PROGRESSIVE':'pack.time.progressive','TIME.PERFECT':'pack.time.perfect','TIME.FUTURE_WILL':'pack.time.futureWill'})[hit.tag])));
  return {...analysis,grammarHits:hits,hits};
}
