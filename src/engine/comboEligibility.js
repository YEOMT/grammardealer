import {corridorScoreEvidence} from './grammar/corridorEvidence.js';
/** Grammar describes evidence; this resolver alone reads the frozen run unlock snapshot. */
export const COMBO_VERSION = '0.2.2';
export function comboEligibility(run) {
  const own=run?.eligibility?.runOwnUnlocks??[],baseline=run?.eligibility?.runStartUnlockBaseline??[];
  const inherited=baseline.filter(id=>!(['0.10.0','0.10.1'].includes(run.version)&&id==='pack.corridor')&&(!['0.6.0','0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1'].includes(run.version)||!['pack.comparison','pack.degree',...(['0.8.0','0.8.1','0.9.0','0.10.0','0.10.1'].includes(run.version)?['pack.relative','pack.relativeAdverb']:[])].includes(id)));
  return {version:['0.3.0','0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0','0.8.1','0.9.0','0.10.0','0.10.1'].includes(run?.version)?(run.version==='0.5.1'?'0.5.0':run.version):COMBO_VERSION,unlocks:[...new Set([...inherited,...own])].sort()};
}
export function eligibleGrammarAnalysis(analysis, eligibility) {
  if (!eligibility) return analysis;
  const hits=(analysis.grammarHits??[]).filter(hit=>hit.comboImplemented!==false && hit.bonusEligible!==false &&
    (!hit.tag.startsWith('CLAUSE.RELATIVE.')||hit.validity==='VALID'&&eligibility.unlocks.includes(hit.tag==='CLAUSE.RELATIVE.ADVERBIAL'?'pack.relativeAdverb':'pack.relative'))&&
    (hit.tag!=='VOICE.PASSIVE'||hit.validity==='VALID'&&eligibility.unlocks.includes('pack.passive'))&&
    (!hit.tag.startsWith('PARTICIPLE.')||hit.validity==='VALID'&&eligibility.unlocks.includes('pack.participles'))&&
    (!hit.tag.startsWith('CONSTRUCTION.')||hit.validity==='VALID'&&eligibility.unlocks.includes('pack.causativePerception'))&&
    (!(['0.7.0','0.8.0','0.9.0','0.10.0','0.10.1'].includes(analysis.grammarVersion)&&hit.tag==='MODIFIER.ADJECTIVE'&&hit.modifierCardIds)||eligibility.unlocks.includes('pack.participles'))&&
    (!hit.tag.startsWith('COMPARISON.')||hit.validity==='VALID'&&eligibility.unlocks.includes('pack.comparison'))&&
    (!hit.tag.startsWith('DEGREE.')||hit.validity==='VALID'&&eligibility.unlocks.includes('pack.degree'))&&
    (!hit.tag.startsWith('LINK.')||eligibility.unlocks.includes('pack.clauseLink'))&&
    (hit.tag!=='FRAME.SVOO'||eligibility.unlocks.includes('pack.svoo'))&&
    (hit.tag!=='FRAME.SVOC'||eligibility.unlocks.includes('pack.svoc.basic'))&&
    (hit.tag!=='CLAUSE.INFINITIVE'||hit.validity==='VALID'&&eligibility.unlocks.includes('pack.infinitive'))&&
    (hit.tag!=='CLAUSE.GERUND'||hit.validity==='VALID'&&eligibility.unlocks.includes('pack.gerund'))&&
    (!hit.tag.startsWith('CORRIDOR.')||hit.validity==='VALID'&&(hit.tag==='CORRIDOR.PRESENT_PERFECT_PROGRESSIVE'?eligibility.unlocks.includes('pack.time.perfect')&&eligibility.unlocks.includes('pack.time.progressive'):eligibility.unlocks.includes('pack.corridor')))&&
    (!hit.tag.startsWith('TIME.')||eligibility.unlocks.includes(({'TIME.PAST':'pack.time.past','TIME.PROGRESSIVE':'pack.time.progressive','TIME.PERFECT':'pack.time.perfect','TIME.FUTURE_WILL':'pack.time.futureWill'})[hit.tag])));
  return {...analysis,grammarHits:hits,hits};
}
export function scoreableAnalysis(analysis, eligibility) {
  const result=eligibleGrammarAnalysis(analysis,eligibility);
  return analysis.grammarVersion==='0.10.0'?corridorScoreEvidence(result):result;
}
