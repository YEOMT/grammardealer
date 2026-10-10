import {registryForVersion,formsForCard,createSentenceSnapshot} from '../src/data/language/index.js';
import {analyzeSentence} from '../src/engine/grammar/index.js';
import {cardKind} from '../src/data/cardCatalog.js';
/** QA proposals composed only from visible physical cards. No fixture sentences or hidden draw order. */
export function expandWaterwaysCandidates(state,bases,{limit=6000}={}){
 const registry=registryForVersion(state.version),rows=state.combat.handIds.filter(id=>cardKind(state.cardInstances[id],state.version)==='WORD').map(id=>({id,def:state.cardInstances[id].cardDefId,forms:formsForCard(state.cardInstances[id],{registry})}));
 const markers=rows.filter(r=>['card.who','card.which','card.that','card.where','card.when'].includes(r.def)),slot=r=>({cardInstanceId:r.id,selection:{formId:r.forms[0].id}}),out=[...bases],seen=new Set();let checks=0;
 const accept=slots=>{if(checks>=limit||slots.length>16||new Set(slots.map(s=>s.cardInstanceId)).size!==slots.length)return null;const key=slots.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|');if(seen.has(key))return null;seen.add(key);checks++;const snapshot=createSentenceSnapshot(slots,state.cardInstances,{languageVersion:state.version}),analysis=analyzeSentence(snapshot,registry);if(analysis.status!=='VALID')return null;const c={slots,snapshot,analysis,frameId:analysis.mainFrameId,text:snapshot.orderedTokens.map(t=>t.surface).join(' ')};out.push(c);return c;};
 const simple=bases.filter(b=>b.slots.length<=8&&!b.analysis.relativeClauses?.length&&!b.analysis.grammarHits.some(h=>h.tag==='LINK.CLAUSE'));
 const chunks=[],chunkSeen=new Set();
 const add=(slots,role)=>{if(!slots.length)return;const key=slots.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|');if(chunkSeen.has(key))return;chunkSeen.add(key);chunks.push({slots,role});};
 // Propose finite gaps directly as well: a hand need not already contain a second
 // complete SVO in order to supply an omitted object-relative predicate.
 const finite=rows.flatMap(r=>r.forms.filter(f=>['PRESENT','PAST'].includes(f.grammaticalFeatures.tense)).map(f=>({cardInstanceId:r.id,selection:{formId:f.id}})));
 const nominal=rows.filter(r=>registry.lexemeById[registry.cardById[r.def].lexemeId].pos==='PRONOUN').flatMap(r=>r.forms.filter(f=>f.grammaticalFeatures.case==='NOMINATIVE').map(f=>({cardInstanceId:r.id,selection:{formId:f.id}})));
 for(const v of finite){for(const m of markers.filter(m=>!['card.where','card.when'].includes(m.def)))add([slot(m),v],'SUBJECT');for(const n of nominal){add([n,v],'OBJECT');for(const m of markers.filter(m=>!['card.where','card.when'].includes(m.def)))add([slot(m),n,v],'OBJECT');}}
 for(const b of simple){const clause=b.analysis.clauses.find(c=>c.id===b.analysis.mainClauseId),sub=b.analysis.nodes.find(n=>n.id===clause?.subjectNodeId);if(!sub)continue;
  const predicate=b.slots.filter(s=>!sub.cardIds.includes(s.cardInstanceId));
  for(const m of markers.filter(m=>!['card.where','card.when'].includes(m.def)))add([slot(m),...predicate],'SUBJECT');
  for(const obj of b.analysis.nodes.filter(n=>['OBJECT','DIRECT_OBJECT','INDIRECT_OBJECT','PREPOSITION_OBJECT','PP_OBJECT'].includes(n.grammaticalRole))){const body=b.slots.filter(s=>!obj.cardIds.includes(s.cardInstanceId));add(body,'OBJECT');for(const m of markers.filter(m=>!['card.where','card.when'].includes(m.def)))add([slot(m),...body],'OBJECT');}
  for(const m of markers.filter(m=>['card.where','card.when'].includes(m.def)))add([slot(m),...b.slots],'ADVERBIAL');
 }
 // Parse each physical attachment. A second pass supplies distinct subject/object nodes in one sentence.
 const attach=(base,required=null)=>{for(const n of base.analysis.nodes.filter(n=>n.type==='NP'&&n.cardIds.some(id=>rows.find(r=>r.id===id)?.def.startsWith('card.')))){const end=Math.max(...n.cardIds.map(id=>base.slots.findIndex(s=>s.cardInstanceId===id)))+1;if(!end)continue;for(const ch of chunks){if(required&&ch.role!==required)continue;accept([...base.slots.slice(0,end),...ch.slots,...base.slots.slice(end)]);}}};
 for(const b of simple)attach(b);
 checks=0;for(const b of out.slice(bases.length)){const roles=b.analysis.relativeClauses?.map(r=>r.relativeRole)??[];if(roles.includes('SUBJECT')&&!roles.includes('OBJECT'))attach(b,'OBJECT');if(roles.includes('OBJECT')&&!roles.includes('SUBJECT'))attach(b,'SUBJECT');}
 return out;
}
export function waterwaysCourseSatisfied(state,candidate){const a=candidate?.analysis,r=a?.relativeClauses??[];switch(state.progress.battleNumber){case 33:return r.some(x=>x.relativeRole==='SUBJECT'&&x.bonusEligible);case 34:return r.some(x=>x.relativeRole==='OBJECT'&&x.markerOmitted&&x.bonusEligible);case 35:return r.some(x=>x.relativeRole==='ADVERBIAL'&&x.bonusEligible&&state.combat.temporaryCardMeta?.[x.markerCardId]?.source==='ANCIENT_WATERWAYS');case 36:return r.some(x=>x.bonusEligible)&&a.grammarHits.some(h=>/^(TIME\.(PROGRESSIVE|PERFECT)|VOICE\.PASSIVE)$/.test(h.tag)&&h.bonusEligible!==false);case 37:return r.some(x=>x.relativeRole==='SUBJECT'&&x.bonusEligible)&&r.some(x=>x.relativeRole==='OBJECT'&&x.bonusEligible);default:return false;}}
export function waterwaysCourseMove(state,candidate,{course=false}={}){
 if(state.progress.stageId!=='stage.08')return null;const c=state.combat,need=course&&!waterwaysCourseSatisfied(state,candidate)||c.enemyState.bossMechanic?.unlocked===false&&!candidate?.unlocks;
 if(!need&&candidate?.lethal)return null;if(c.handIds.length<=c.rulesSnapshot.handLimit-3&&c.turnsRemaining>=4)return {type:'PREPARE'};
 if(need&&c.exchangesRemaining>0){const reg=registryForVersion(state.version),rows=c.handIds.map(id=>({id,def:state.cardInstances[id].cardDefId,lex:reg.lexemeById[reg.cardById[state.cardInstances[id].cardDefId]?.lexemeId]})),keep=new Set();
  const wanted=state.progress.battleNumber===35?['card.where','card.when','card.school','card.room','card.home','card.day','card.time']:['card.who','card.which','card.that'];
  for(const r of rows.filter(r=>wanted.includes(r.def)).slice(0,2))keep.add(r.id);
  for(const [pos,count]of [['NOUN',2],['VERB',3],['PRONOUN',1],['DETERMINER',1]])for(const r of rows.filter(r=>r.lex?.pos===pos&&!keep.has(r.id)).slice(0,count))keep.add(r.id);
  const ids=rows.filter(r=>!keep.has(r.id)).map(r=>r.id);if(ids.length)return {type:'EXCHANGE',cardIds:ids.slice(0,4)};
 }
 return null;
}
export function waterwaysCourseReward(state,available){if(state.progress.battleNumber<20)return null;const owned=def=>state.activeCardIds.some(id=>state.cardInstances[id].cardDefId===def);const needed=['card.school','card.day','card.work','card.like','card.read'].filter(def=>!owned(def));return available.find(c=>needed.includes(c.cardDefId))??null;}
