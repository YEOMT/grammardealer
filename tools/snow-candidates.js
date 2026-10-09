import {registryForVersion,formsForCard,createSentenceSnapshot} from '../src/data/language/index.js';
import {analyzeSentence} from '../src/engine/grammar/index.js';
import {cardKind} from '../src/data/cardCatalog.js';
/** QA search of physical forms in the visible hand. No expected JSON, draw order, or production answer table. */
export function expandSnowCandidates(state,bases,{limit=650,depth=0,course=false}={}){
 const registry=registryForVersion(state.version),rows=state.combat.handIds.filter(id=>cardKind(state.cardInstances[id],state.version)==='WORD').map(id=>({id,def:state.cardInstances[id].cardDefId,forms:formsForCard(state.cardInstances[id],{registry})}));
 const slot=(r,f=r.forms[0])=>({cardInstanceId:r.id,selection:{formId:f.id}}),words=w=>rows.filter(r=>r.def==='card.'+w).map(r=>slot(r)),out=[...bases],seen=new Set();let checks=0;
 const accept=slots=>{if(checks>=limit||slots.length>16||new Set(slots.map(s=>s.cardInstanceId)).size!==slots.length)return;const key=slots.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|');if(seen.has(key))return;seen.add(key);checks++;const snapshot=createSentenceSnapshot(slots,state.cardInstances,{languageVersion:state.version}),analysis=analyzeSentence(snapshot,registry);if(analysis.status==='VALID')out.push({slots,snapshot,analysis,frameId:analysis.mainFrameId,text:snapshot.orderedTokens.map(t=>t.surface).join(' ')});};
 const standards=rows.flatMap(r=>r.forms.filter(f=>f.grammaticalFeatures.case==='OBJECTIVE').map(f=>[slot(r,f)]));
 for(const base of bases)for(const node of base.analysis.nodes.filter(n=>n.type==='NP')){const slots=base.slots.filter(s=>node.cardIds.includes(s.cardInstanceId));if(slots.length<=4)standards.push(slots);}
 // The optional learning-course search composes a real attributive superlative NP.
 // It uses current physical forms, not fixture sentences or created cards.
 if(course&&depth===0&&state.progress.battleNumber===24){
  const nounRows=rows.filter(r=>registry.lexemeById[registry.formById[r.forms[0].id].lexemeId].pos==='NOUN');
  const adjRows=rows.filter(r=>r.forms.some(f=>f.grammaticalFeatures.degree==='SUPERLATIVE'));
  for(const base of bases.slice(0,40))for(const node of base.analysis.nodes.filter(n=>['NP','AP'].includes(n.type))){
   const indices=base.slots.map((s,i)=>node.cardIds.includes(s.cardInstanceId)?i:-1).filter(i=>i>=0);if(!indices.length)continue;
   const start=indices[0],end=indices.at(-1)+1;
   if(node.type==='NP'&&base.slots.slice(start,end).some(s=>registry.lexemeById[registry.formById[s.selection.formId].lexemeId].pos==='PRONOUN'))continue;
   for(const determiner of words('the'))for(const adj of adjRows)for(const degree of adj.forms.filter(f=>f.grammaticalFeatures.degree==='SUPERLATIVE'))for(const noun of nounRows)for(const nf of noun.forms.filter(f=>['SINGULAR','PLURAL'].includes(f.grammaticalFeatures.number))){
    if(checks<Math.min(200,limit))accept([...base.slots.slice(0,start),determiner,slot(adj,degree),slot(noun,nf),...base.slots.slice(end)]);
   }
  }
 }
 const ordered=[...bases].sort((a,b)=>a.slots.length-b.slots.length);
 for(const base of ordered){
  for(const twice of words('twice'))accept([...base.slots,twice]);
  for(const [i,old]of base.slots.entries()){
   const r=rows.find(r=>r.id===old.cardInstanceId),f=registry.formById[old.selection.formId],lex=registry.lexemeById[f.lexemeId];
   const replace=middle=>[...base.slots.slice(0,i),...middle,...base.slots.slice(i+1)];
   if(lex.pos==='NOUN'&&['PLURAL',undefined].includes(f.grammaticalFeatures.number)||lex.pos==='NOUN'&&registry.senseById[lex.senseIds[0]].countability==='MASS')for(const w of ['more','most','enough'])for(const marker of words(w))accept(replace([marker,old]));
   if(!['ADJECTIVE','ADVERB'].includes(lex.pos)||f.grammaticalFeatures.degree!=='POSITIVE')continue;
   for(const m of words('too'))accept(replace([m,old]));for(const m of words('enough'))accept(replace([old,m]));
   for(const degree of r.forms.filter(f=>f.grammaticalFeatures.degree==='COMPARATIVE')){accept(replace([slot(r,degree)]));for(const than of words('than'))for(const target of standards)accept(replace([slot(r,degree),than,...target]));}
   if(lex.comparisonPolicy?.allowMore)for(const more of words('more')){accept(replace([more,old]));for(const than of words('than'))for(const target of standards)accept(replace([more,old,than,...target]));}
   for(const a of words('as'))for(const b of words('as'))if(a.cardInstanceId!==b.cardInstanceId)for(const target of standards){accept(replace([a,old,b,...target]));for(const twice of words('twice'))accept(replace([twice,a,old,b,...target]));}
   for(const degree of r.forms.filter(f=>f.grammaticalFeatures.degree==='SUPERLATIVE'))accept(replace([slot(r,degree)]));
   if(lex.comparisonPolicy?.allowMost)for(const most of words('most'))accept(replace([most,old]));
  }
 }
 // Combine independently valid constructions (e.g. a quantity subject with twice,
 // or an equality predicate with a quantity object). Physical IDs remain unique.
 // The first pass alone misses these ordinary multi-marker sentences.
 if(depth<1){const bearing=s=>s.slots.filter(x=>state.combat.temporaryCardMeta?.[x.cardInstanceId]?.crystalBearing).length;
  const expanded=out.slice(bases.length).sort((a,b)=>bearing(b)-bearing(a)||a.slots.length-b.slots.length).slice(0,80);
  return [...out,...expandSnowCandidates(state,expanded,{limit,depth:depth+1,course}).slice(expanded.length)];}
 return out;
}

/** Conserve scarce boss turns using remaining public crystals, visible cards and exchanges. */
export function snowMove(state,candidate){
 if(state.progress.stageId!=='stage.06'||state.progress.roundIndex!==4||state.combat.exchangesRemaining<1)return null;
 const c=state.combat,b=c.enemyState.bossMechanic,needed=b?.crystalsRemaining??0;
 if(candidate?.lethal)return null;
 const inefficient=!candidate||(needed>0&&(candidate.crystals??0)<Math.ceil(needed/Math.max(1,c.turnsRemaining-1)))||(!needed&&candidate.damage*c.turnsRemaining<c.enemyState.hp);
 if(!inefficient)return null;
 const language=registryForVersion(state.version),keep=new Set(candidate?.slots.map(s=>s.cardInstanceId)??[]);
 const lex=id=>language.lexemeById[language.cardById[state.cardInstances[id].cardDefId]?.lexemeId];
 const hasCopula=c.handIds.some(id=>state.cardInstances[id].cardDefId==='card.be');
 for(const id of c.handIds)if(c.temporaryCardMeta?.[id]?.crystalBearing)keep.add(id);
 if(!candidate){
  const subject=c.handIds.find(id=>lex(id)?.pos==='PRONOUN')??c.handIds.find(id=>lex(id)?.pos==='NOUN');if(subject)keep.add(subject);
  const verb=c.handIds.find(id=>lex(id)?.frameIds?.includes('frame.sv'))??c.handIds.find(id=>state.cardInstances[id].cardDefId==='card.be')??c.handIds.find(id=>lex(id)?.pos==='VERB');if(verb)keep.add(verb);
  if(hasCopula){const adj=c.handIds.find(id=>lex(id)?.pos==='ADJECTIVE');if(adj)keep.add(adj);}
 }
 const ids=c.handIds.filter(id=>!keep.has(id)).slice(0,4);
 return ids.length?{type:'EXCHANGE',cardIds:ids}:null;
}

export function snowCourseTag(state){
 if(state.version!=='0.6.1')return null;
 const tag={23:'COMPARISON.COMPARATIVE',24:'COMPARISON.SUPERLATIVE',25:'COMPARISON.EQUALITY'}[state.progress.battleNumber];
 if(!tag)return null;
 const done=state.stats.history.some(r=>r.attackId?.includes(`:battle.${state.progress.battleNumber}:`)&&r.analysis.grammarHits.some(h=>h.tag===tag));
 return done?null:tag;
}
/** Optional learning-course policy, independent of the general completion route. */
export function snowCourseMove(state,candidate){
 const tag=snowCourseTag(state);if(!tag||candidate?.analysis.grammarHits.some(h=>h.tag===tag))return null;
 const c=state.combat,registry=registryForVersion(state.version),rows=c.handIds.map(id=>({id,def:state.cardInstances[id].cardDefId,lex:registry.lexemeById[registry.cardById[state.cardInstances[id].cardDefId]?.lexemeId]}));
 if(c.handIds.length<=c.rulesSnapshot.handLimit-3&&c.turnsRemaining>2)return {type:'PREPARE'};
 if(c.exchangesRemaining<1)return null;
 const keep=new Set(rows.filter(r=>c.temporaryCardMeta?.[r.id]?.cardKind==='WORD'||['card.be','card.the'].includes(r.def)).map(r=>r.id));
 for(const pos of ['PRONOUN','NOUN','ADJECTIVE']){const row=rows.find(r=>r.lex?.pos===pos);if(row)keep.add(row.id);}
 const cardIds=c.handIds.filter(id=>!keep.has(id)).slice(0,4);return cardIds.length?{type:'EXCHANGE',cardIds}:null;
}
