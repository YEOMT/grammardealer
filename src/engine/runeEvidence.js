import {eligibleGrammarAnalysis} from './comboEligibility.js';
import {attackableAnalysis} from './scoring.js';

/** Read-only eligibility before numeric replacement. No grammar tags are invented here. */
export function buildRuneEvidence(analysis,eligibility){
 const eligible=eligibleGrammarAnalysis(analysis,eligibility),vps=analysis.verbPhrases??[];
 const hits=(eligible.grammarHits??[]).filter(h=>h.validity==='VALID');
 const clean=vp=>vp?.chainWellFormed&&!(vp.issueIds??[]).length;
 const finite=vp=>clean(vp)&&vp.finiteCardId&&vp.temporalEvidenceEligible;
 const vpFor=h=>vps.find(v=>v.nodeId===h.scopeNodeId);
 const definitions={
  'rune.past':h=>h.tag==='TIME.PAST'&&finite(vpFor(h))&&vpFor(h).tenseFamily==='PAST'&&vpFor(h).mood!=='COUNTERFACTUAL',
  'rune.progressive':h=>h.tag==='TIME.PROGRESSIVE'&&finite(vpFor(h))&&vpFor(h).aspects.includes('PROGRESSIVE')&&vpFor(h).mood!=='COUNTERFACTUAL',
  'rune.svoc':h=>h.tag==='FRAME.SVOC'&&h.scope==='MAIN_CLAUSE',
  'rune.presentPerfect':h=>h.tag==='TIME.PERFECT'&&finite(vpFor(h))&&vpFor(h).tenseFamily==='PRESENT'&&!vpFor(h).modal&&vpFor(h).aspects.includes('PERFECT'),
  'rune.clauseLink':h=>h.tag==='LINK.CLAUSE'&&h.connectedNodeIds?.length>=2&&h.clauseIds?.length>=2,
  'rune.infinitive':h=>h.tag==='CLAUSE.INFINITIVE',
  'rune.gerund':h=>h.tag==='CLAUSE.GERUND',
  'rune.passive':h=>h.tag==='VOICE.PASSIVE'&&vps.some(v=>clean(v)&&v.voice==='PASSIVE'&&h.cardIds.includes(v.lexicalVerbCardId)),
  'rune.relative':h=>['CLAUSE.RELATIVE.SUBJECT','CLAUSE.RELATIVE.OBJECT'].includes(h.tag),
  'rune.unrealPresent':h=>h.tag==='CORRIDOR.UNREAL_PRESENT'&&(analysis.corridorStructures??[]).some(r=>r.id===h.corridorEvidenceId&&r.kind==='UNREAL_PRESENT'&&r.conditionClauseId&&r.resultClauseId),
 };
 return Object.fromEntries(Object.entries(definitions).map(([id,predicate])=>{
  const matched=attackableAnalysis(analysis)?hits.filter(predicate):[];
  return [id,{eligible:matched.length>0,reason:matched.length?'ELIGIBLE_STRUCTURE':'NO_ELIGIBLE_STRUCTURE',
   evidenceRefs:[...new Set(matched.map(h=>h.id))],cardIds:[...new Set(matched.flatMap(h=>h.cardIds??[]))]}];
 }));
}
