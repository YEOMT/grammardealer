import {cardKind} from '../src/data/cardCatalog.js';
import {registryForVersion,formsForCard,createSentenceSnapshot} from '../src/data/language/index.js';
import {analyzeSentence} from '../src/engine/grammar/index.js';
/** QA only: compose registered forms from CURRENT HAND physical cards. Never inspect drawIds. */
export function expandTimeCandidates(state,bases,{limit=1800}={}){
 const registry=registryForVersion(state.version),rows=state.combat.handIds.filter(id=>cardKind(state.cardInstances[id],state.version)==='WORD').map(id=>({id,card:state.cardInstances[id],forms:formsForCard(state.cardInstances[id],{registry})}));
 const templates=[
  [[], 'PAST'],[[['be','PRESENT']],'PRESENT_PARTICIPLE'],[[['be','PAST']],'PRESENT_PARTICIPLE'],
  [[['have','PRESENT']],'PAST_PARTICIPLE'],[[['have','PAST']],'PAST_PARTICIPLE'],
  [[['have','PRESENT'],['be','PAST_PARTICIPLE']],'PRESENT_PARTICIPLE'],[[['have','PAST'],['be','PAST_PARTICIPLE']],'PRESENT_PARTICIPLE'],
  [[['will','FUTURE']],'BASE'],[[['will','FUTURE'],['be','BASE']],'PRESENT_PARTICIPLE'],
  [[['will','FUTURE'],['have','BASE']],'PAST_PARTICIPLE'],[[['will','FUTURE'],['have','BASE'],['be','PAST_PARTICIPLE']],'PRESENT_PARTICIPLE'],
 ];
 const matching=(row,tense)=>row.forms.filter(f=>tense==='BASE'?f.surface.toLowerCase()===registry.lexemeById[registry.cardById[row.card.cardDefId].lexemeId].lemma.toLowerCase():f.grammaticalFeatures.tense===tense);
 let checks=0;const out=[...bases],seen=new Set(bases.map(c=>c.slots.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|')));
 for(const base of bases){
  const vp=base.analysis.verbPhrases?.find(v=>v.clauseId==='clause.main');if(!vp||vp.cardIds.length!==1)continue;
  const vi=base.slots.findIndex(s=>s.cardInstanceId===vp.lexicalVerbCardId),lexical=rows.find(r=>r.id===vp.lexicalVerbCardId),used=new Set(base.slots.map(s=>s.cardInstanceId));
  for(const [auxiliaries,lexicalTense]of templates){
   const assemble=(index,slots,selected)=>{
    if(checks>=limit)return;
    if(index<auxiliaries.length){const[lemma,tense]=auxiliaries[index];for(const row of rows.filter(r=>r.card.cardDefId===`card.${lemma}`&&!used.has(r.id)&&!selected.has(r.id)))for(const form of matching(row,tense))assemble(index+1,[...slots,{cardInstanceId:row.id,selection:{formId:form.id}}],new Set([...selected,row.id]));return;}
    for(const form of matching(lexical,lexicalTense)){
     const candidateSlots=[...base.slots.slice(0,vi),...slots,{cardInstanceId:lexical.id,selection:{formId:form.id}},...base.slots.slice(vi+1)];if(candidateSlots.length>16)continue;
     const key=candidateSlots.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|');if(seen.has(key)||checks>=limit)continue;seen.add(key);checks++;
     const snapshot=createSentenceSnapshot(candidateSlots,state.cardInstances,{languageVersion:state.version,sentenceId:`qa.time.${checks}`}),analysis=analyzeSentence(snapshot,registry);
     if(analysis.status==='VALID')out.push({slots:candidateSlots,snapshot,analysis,frameId:analysis.mainFrameId,text:snapshot.orderedTokens.map(t=>t.surface).join(' ')});
    }
   };assemble(0,[],new Set());
  }
 }
 return out;
}
