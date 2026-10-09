import {registryForVersion,formsForCard,createSentenceSnapshot} from '../src/data/language/index.js';
import {analyzeSentence} from '../src/engine/grammar/index.js';
import {cardKind} from '../src/data/cardCatalog.js';
/** QA-only finite combinations of the visible hand. The real parser judges every proposal. */
export function expandEmberCandidates(state,bases,{limit=1000}={}){
 const registry=registryForVersion(state.version),rows=state.combat.handIds.filter(id=>cardKind(state.cardInstances[id],state.version)==='WORD').map(id=>({id,def:state.cardInstances[id].cardDefId,forms:formsForCard(state.cardInstances[id],{registry})}));
 const out=[...bases],seen=new Set();let checks=0;const slot=(r,f)=>({cardInstanceId:r.id,selection:{formId:f.id}});
 const accept=slots=>{if(checks>=limit||slots.length>16||new Set(slots.map(s=>s.cardInstanceId)).size!==slots.length)return;const key=slots.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|');if(seen.has(key))return;seen.add(key);checks++;const snapshot=createSentenceSnapshot(slots,state.cardInstances,{languageVersion:state.version}),analysis=analyzeSentence(snapshot,registry);if(analysis.status==='VALID')out.push({slots,snapshot,analysis,frameId:analysis.mainFrameId,text:snapshot.orderedTokens.map(t=>t.surface).join(' ')});};
 const nps=[],npSeen=new Set();
 for(const b of bases)for(const n of b.analysis.nodes??[]){if(n.type!=='NP')continue;const ss=n.cardIds.map(id=>b.slots.find(s=>s.cardInstanceId===id)).filter(Boolean),key=ss.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|');if(ss.length&&!npSeen.has(key)){npSeen.add(key);nps.push(ss);}}
 const subjects=nps.filter(np=>!np.some(s=>registry.formById[s.selection.formId]?.grammaticalFeatures.case==='OBJECTIVE'));
 const objects=nps.map(np=>np.map(s=>{const row=rows.find(r=>r.id===s.cardInstanceId),f=row.forms.find(f=>f.grammaticalFeatures.case==='OBJECTIVE');return f?slot(row,f):s;}));
 const verbs=rows.filter(r=>registry.lexemeById[registry.cardById[r.def].lexemeId].pos==='VERB'),bes=rows.filter(r=>r.def==='card.be');
 // SVO source promoted to a visible subject; PP is selected on the original verb card.
 for(const v of verbs)for(const pp of v.forms.filter(f=>f.grammaticalFeatures.tense==='PAST_PARTICIPLE'))for(const be of bes)for(const bf of be.forms.filter(f=>['PRESENT','PAST'].includes(f.grammaticalFeatures.tense)))for(const subject of subjects)accept([...subject,slot(be,bf),slot(v,pp)]);
 const simple=bases.filter(b=>b.slots.length<=9&&!b.analysis.grammarHits.some(h=>h.tag==='LINK.CLAUSE'));
 // Insert a reviewed ING/PP form next to a real noun head; no lexical answers are built in.
 checks=0;for(const b of simple)for(const n of b.analysis.nodes??[]){if(n.type!=='NP')continue;const head=b.slots.findIndex(s=>s.cardInstanceId===n.headCardId);if(head<0)continue;for(const v of verbs)for(const f of v.forms.filter(f=>['PRESENT_PARTICIPLE','PAST_PARTICIPLE'].includes(f.grammaticalFeatures.tense)))accept([...b.slots.slice(0,head),slot(v,f),...b.slots.slice(head)]);}
 // A valid finite predicate supplies the complement; registration decides which governor accepts it.
 checks=0;for(const b of [...simple].sort((a,b)=>a.slots.length-b.slots.length)){const clause=b.analysis.clauses.find(c=>c.id===b.analysis.mainClauseId),sub=b.analysis.nodes.find(n=>n.id===clause?.subjectNodeId),v=verbs.find(r=>r.id===clause?.verbCardId);if(!sub||!v||b.analysis.verbPhrases.some(p=>p.lexicalVerbCardId===v.id&&p.cardIds.length>1))continue;const predicate=b.slots.filter(s=>!sub.cardIds.includes(s.cardInstanceId));
  for(const f of v.forms.filter(f=>['PRESENT_PARTICIPLE','PAST_PARTICIPLE'].includes(f.grammaticalFeatures.tense)||f.surface.toLowerCase()===registry.lexemeById[registry.cardById[v.def].lexemeId].lemma.toLowerCase())){const body=predicate.map(s=>s.cardInstanceId===v.id?slot(v,f):s);for(const governor of verbs.filter(r=>['card.make','card.have','card.help','card.see','card.feel','card.find','card.keep'].includes(r.def)))for(const gf of governor.forms.filter(f=>f.grammaticalFeatures.tense==='PRESENT'))for(const subject of subjects)for(const object of objects)accept([...subject,slot(governor,gf),...object,...body]);}
 }
 return out;
}
export function emberCourseTag(state){return state.progress.stageId==='stage.07'?['PARTICIPLE.PRESENT','VOICE.PASSIVE','CONSTRUCTION.CAUSATIVE','CONSTRUCTION.PERCEPTION'][state.progress.roundIndex]??null:null;}
export function emberCourseMove(state,candidate){
 const tag=emberCourseTag(state);if(!tag||emberCourseSatisfied(state,candidate))return null;const c=state.combat;
 if(c.handIds.length<=c.rulesSnapshot.handLimit-3&&c.turnsRemaining>=4)return {type:'PREPARE'};
 if(c.exchangesRemaining>0){
  const registry=registryForVersion(state.version),rows=c.handIds.filter(id=>cardKind(state.cardInstances[id],state.version)==='WORD').map(id=>({id,def:state.cardInstances[id].cardDefId,lex:registry.lexemeById[registry.cardById[state.cardInstances[id].cardDefId].lexemeId]}));
  const wanted=tag==='CONSTRUCTION.PERCEPTION'?['card.see','card.feel']:tag==='CONSTRUCTION.CAUSATIVE'?['card.make','card.have']:tag==='VOICE.PASSIVE'?['card.be']:[];
  const keep=new Set([...rows.filter(r=>wanted.includes(r.def)),...rows.filter(r=>r.lex.pos==='PRONOUN').slice(0,2),...rows.filter(r=>r.lex.pos==='VERB'&&!wanted.includes(r.def)&&!['card.be','card.will'].includes(r.def)).slice(0,1),...rows.filter(r=>r.lex.pos==='NOUN').slice(0,1)].map(r=>r.id));
  const ids=c.handIds.filter(id=>!keep.has(id));if(ids.length)return {type:'EXCHANGE',cardIds:ids.slice(0,4)};
 }

 return null;
}

/** Learning-route preference uses only the public reward offer and owned cards. */
export function emberCourseReward(state,available){
 if(state.progress.battleNumber>=31||state.activeCardIds.some(id=>['card.see','card.feel'].includes(state.cardInstances[id].cardDefId)))return null;
 return available.find(c=>['card.see','card.feel'].includes(c.cardDefId))??null;
}

export function emberCourseSatisfied(state,candidate){
 const a=candidate?.analysis,tag=emberCourseTag(state);if(!a||!tag)return false;
 if(state.progress.roundIndex===0)return a.formUses.some(u=>u.function==='NOUN_MODIFIER'&&u.validity==='VALID'&&['ING','PP'].includes(u.resolvedMorphology));
 return a.grammarHits.some(h=>h.tag===tag||tag==='CONSTRUCTION.CAUSATIVE'&&h.tag==='CONSTRUCTION.ASSISTANCE');
}
