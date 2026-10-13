import {registryForVersion,formsForCard,createSentenceSnapshot} from '../src/data/language/index.js';
import {analyzeSentence} from '../src/engine/grammar/index.js';
import {cardKind} from '../src/data/cardCatalog.js';
/** QA-only bounded proposals using visible physical cards. No fixture text or future piles. */
export function expandCorridorCandidates(state,bases,{limit=1800}={}){
 const registry=registryForVersion(state.version),rows=state.combat.handIds.filter(id=>cardKind(state.cardInstances[id],state.version)==='WORD').map(id=>({id,def:state.cardInstances[id].cardDefId,forms:formsForCard(state.cardInstances[id],{registry})})),out=[...bases],seen=new Set();let checks=0;
 const accept=slots=>{if(checks>=limit||slots.length>16||new Set(slots.map(s=>s.cardInstanceId)).size!==slots.length)return;const key=slots.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|');if(seen.has(key))return;seen.add(key);checks++;const snapshot=createSentenceSnapshot(slots,state.cardInstances,{languageVersion:state.version}),analysis=analyzeSentence(snapshot,registry);if(analysis.status==='VALID')out.push({slots,snapshot,analysis,frameId:analysis.mainFrameId,text:snapshot.orderedTokens.map(t=>t.surface).join(' ')});};
 const simple=bases.filter(b=>b.slots.length<=8&&b.analysis.clauses.length===1&&!b.analysis.relativeClauses?.length).slice(0,100),modal=[];
 for(const base of simple){const vp=base.analysis.verbPhrases.find(v=>v.clauseId===base.analysis.mainClauseId);if(!vp||vp.cardIds.length!==1)continue;const vi=base.slots.findIndex(s=>s.cardInstanceId===vp.lexicalVerbCardId),verb=rows.find(r=>r.id===vp.lexicalVerbCardId),used=new Set(base.slots.map(s=>s.cardInstanceId)),lemma=registry.lexemeById[registry.cardById[verb.def].lexemeId].lemma;
  const form=verb.forms.find(f=>f.surface.toLowerCase()===lemma.toLowerCase());if(!form)continue;
  for(const row of rows.filter(r=>['card.will','card.can'].includes(r.def)&&!used.has(r.id)))for(const f of row.forms){
   const slots=[...base.slots.slice(0,vi),{cardInstanceId:row.id,selection:{formId:f.id}},{cardInstanceId:verb.id,selection:{formId:form.id}},...base.slots.slice(vi+1)];modal.push(slots);accept(slots);
   const pp=verb.forms.find(f=>f.grammaticalFeatures.tense==='PAST_PARTICIPLE');if(!pp)continue;
   for(const have of rows.filter(r=>r.def==='card.have'&&!used.has(r.id)&&r.id!==row.id)){const h=have.forms.find(f=>f.surface==='have');const perfect=[...base.slots.slice(0,vi),{cardInstanceId:row.id,selection:{formId:f.id}},{cardInstanceId:have.id,selection:{formId:h.id}},{cardInstanceId:verb.id,selection:{formId:pp.id}},...base.slots.slice(vi+1)];modal.push(perfect);accept(perfect);}
  }
 }
 for(const marker of rows.filter(r=>r.def==='card.if'))for(const result of modal)for(const condition of simple){if(checks>=limit)break;accept([{cardInstanceId:marker.id,selection:{formId:marker.forms[0].id}},...condition.slots,...result]);}
 return out;
}
