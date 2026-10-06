import {registryForVersion,formsForCard,createSentenceSnapshot} from '../src/data/language/index.js';
import {analyzeSentence} from '../src/engine/grammar/index.js';
import {cardKind} from '../src/data/cardCatalog.js';
/** QA policy only. Compose physical visible-hand forms, then ask the actual parser.
 * No fixture answers, hidden piles, future RNG, or free cards are consulted. */
export function expandDesertCandidates(state,bases,{limit=220}={}){
 const registry=registryForVersion(state.version),sealed=state.combat.enemyState.bossMechanic?.sealedCardId;
 const rows=state.combat.handIds.filter(id=>id!==sealed&&cardKind(state.cardInstances[id],state.version)==='WORD').map(id=>({id,def:state.cardInstances[id].cardDefId,forms:formsForCard(state.cardInstances[id],{registry})}));
 const out=[...bases],seen=new Set();let checks=0;
 const slot=(r,f)=>({cardInstanceId:r.id,selection:{formId:f.id}});
 const accept=slots=>{
  if(checks>=limit||slots.length>16||new Set(slots.map(s=>s.cardInstanceId)).size!==slots.length)return;
  const key=slots.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|');if(seen.has(key))return;seen.add(key);checks++;
  const snapshot=createSentenceSnapshot(slots,state.cardInstances,{languageVersion:state.version}),analysis=analyzeSentence(snapshot,registry);
  if(analysis.status==='VALID')out.push({slots,snapshot,analysis,frameId:analysis.mainFrameId,text:snapshot.orderedTokens.map(t=>t.surface).join(' ')});
 };
 const subjects=rows.flatMap(r=>r.forms.filter(f=>f.grammaticalFeatures.case==='NOMINATIVE').map(f=>slot(r,f)));
 const tos=rows.filter(r=>r.def==='card.to').map(r=>slot(r,r.forms[0]));
 const governors=rows.filter(r=>['card.want','card.need','card.like','card.enjoy','card.finish'].includes(r.def));
 const simple=bases.filter(b=>b.slots.length<=9&&!b.analysis.grammarHits.some(h=>h.tag==='LINK.CLAUSE'));
 for(const base of simple){
  const clause=base.analysis.clauses.find(c=>c.id===base.analysis.mainClauseId),subject=base.analysis.nodes.find(n=>n.id===clause?.subjectNodeId);
  if(!subject)continue;
  const subjectIds=new Set(subject.cardIds),predicate=base.slots.filter(s=>!subjectIds.has(s.cardInstanceId));
  const verbId=clause.verbCardId,verb=rows.find(r=>r.id===verbId),position=predicate.findIndex(s=>s.cardInstanceId===verbId);if(!verb||position<0)continue;
  // Only a lexical finite verb is converted here. Auxiliary chains are tested elsewhere.
  if(base.analysis.verbPhrases?.some(v=>v.finiteCardId===verbId&&v.cardIds.length>1))continue;
  for(const kind of ['TO','ING']){
   const f=verb.forms.find(f=>kind==='ING'?f.grammaticalFeatures.tense==='PRESENT_PARTICIPLE':f.grammaticalFeatures.verbForm==='BASE'||f.grammaticalFeatures.tense==='PRESENT'&&f.surface.toLowerCase()===registry.lexemeById[registry.cardById[verb.def].lexemeId].lemma.toLowerCase());
   if(!f)continue;const body=predicate.map((s,i)=>i===position?slot(verb,f):s);
   const phrases=kind==='TO'?tos.map(to=>[to,...body]):[body];
   for(const phrase of phrases)for(const governor of governors){
    if(kind==='TO'&&['card.enjoy','card.finish'].includes(governor.def))continue;
    for(const gf of governor.forms.filter(f=>f.grammaticalFeatures.tense==='PRESENT'))for(const subjectSlot of subjects){
     accept([subjectSlot,slot(governor,gf),...phrase]);
     if(kind==='TO')for(const obj of rows.flatMap(r=>r.forms.filter(f=>f.grammaticalFeatures.case==='OBJECTIVE').map(f=>slot(r,f))))accept([subjectSlot,slot(governor,gf),obj,...phrase]);
    }
   }
  }
 }
 return out;
}
