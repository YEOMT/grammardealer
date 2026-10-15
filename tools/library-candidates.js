import {registryForVersion,formsForCard,createSentenceSnapshot} from '../src/data/language/index.js';
import {analyzeSentence} from '../src/engine/grammar/index.js';
import {libraryTargetEvidence} from '../src/engine/libraryEvidence.js';
import {EXTRAPOSITION_PREDICATES} from '../src/data/language/libraryLanguage.js';
/** QA-only grammar proposals from visible physical hand cards. No expected sentence table or draw-order access. */
export function expandLibraryCandidates(state,bases,{limit=2500}={}){
 const registry=registryForVersion(state.version),rows=state.combat.handIds.filter(id=>registry.cardById[state.cardInstances[id].cardDefId]).map(id=>({id,def:state.cardInstances[id].cardDefId,lex:registry.lexemeById[registry.cardById[state.cardInstances[id].cardDefId].lexemeId],forms:formsForCard(state.cardInstances[id],{registry})})),out=[...bases],seen=new Set();let checks=0;
 const slot=(r,f=r.forms[0])=>({cardInstanceId:r.id,selection:{formId:f.id}}),markers=word=>rows.filter(r=>r.def==='card.'+word),finite=rows.flatMap(r=>r.forms.filter(f=>['PRESENT','PAST'].includes(f.grammaticalFeatures.tense)).map(f=>({row:r,slot:slot(r,f)}))),subjects=rows.filter(r=>r.lex.pos==='PRONOUN').flatMap(r=>r.forms.filter(f=>f.grammaticalFeatures.case==='NOMINATIVE').map(f=>slot(r,f)));
 const accept=slots=>{if(checks>=limit||slots.length>16||new Set(slots.map(s=>s.cardInstanceId)).size!==slots.length)return;const key=slots.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|');if(seen.has(key))return;seen.add(key);checks++;const snapshot=createSentenceSnapshot(slots,state.cardInstances,{languageVersion:state.version}),analysis=analyzeSentence(snapshot,registry);if(analysis.status==='VALID')out.push({slots,snapshot,analysis,frameId:analysis.mainFrameId,text:snapshot.orderedTokens.map(t=>t.surface).join(' ')});};
 const simple=bases.filter(b=>b.slots.length<=9&&!b.analysis.relativeClauses?.length&&!b.analysis.grammarHits.some(h=>h.tag==='LINK.CLAUSE')).slice(0,70);
 // An actual finite SVO verb and subject can supply the unfilled object of what.
 const whats=[];for(const m of markers('what'))for(const v of finite.filter(v=>v.row.lex.frameIds.includes('frame.svo')))for(const subject of subjects)whats.push([slot(m),subject,v.slot]);
 for(const base of simple)for(const n of base.analysis.nodes.filter(n=>n.type==='NP'&&['SUBJECT','OBJECT','COMPLEMENT'].includes(n.grammaticalRole))){const indexes=n.cardIds.map(id=>base.slots.findIndex(s=>s.cardInstanceId===id)),a=Math.min(...indexes),b=Math.max(...indexes)+1;if(a<0)continue;for(const what of whats)accept([...base.slots.slice(0,a),...what,...base.slots.slice(b)]);}
 for(const v of finite.filter(v=>v.row.lex.frameIds.some(id=>['frame.svo.wh','frame.svo.content'].includes(id))))for(const subject of subjects)for(const child of simple)for(const word of ['whether','where','when','that'])for(const m of markers(word))accept([subject,v.slot,slot(m),...child.slots]);
 for(const it of markers('it'))for(const be of finite.filter(v=>v.row.def==='card.be'))for(const adj of rows.filter(r=>EXTRAPOSITION_PREDICATES[r.lex.lemma]))for(const child of simple){
  const head=[slot(it,it.forms.find(f=>f.grammaticalFeatures.case==='NOMINATIVE')),be.slot,slot(adj)];
  for(const that of markers('that'))accept([...head,slot(that),...child.slots]);
  const clause=child.analysis.clauses.find(c=>c.id===child.analysis.mainClauseId),sub=child.analysis.nodes.find(n=>n.id===clause?.subjectNodeId),verb=rows.find(r=>r.id===clause?.verbCardId);if(!sub||!verb)continue;
  const baseForm=verb.forms.find(f=>f.grammaticalFeatures.tense==='BASE'||f.grammaticalFeatures.tense==='PRESENT'&&f.grammaticalFeatures.person!==3);if(!baseForm)continue;
  for(const to of markers('to'))accept([...head,slot(to),...child.slots.filter(s=>!sub.cardIds.includes(s.cardInstanceId)).map(s=>s.cardInstanceId===verb.id?slot(verb,baseForm):s)]);
 }
 return out;
}
export function libraryCourseSatisfied(state,candidate){const targets=libraryTargetEvidence(candidate?.analysis);const kind={38:['NOMINAL_WHAT'],39:['NOMINAL_QUESTION'],40:['NOMINAL_WHETHER'],41:['EXTRAPOSED_SUBJECT_TO','EXTRAPOSED_SUBJECT_THAT']};return targets.some(t=>(kind[state.progress.battleNumber]??targets.map(n=>n.kind)).includes(t.kind));}
export function libraryReward(state,available){if(!['0.9.0','0.10.0','0.10.1'].includes(state.version)||state.progress.battleNumber<33)return null;const owned=def=>state.activeCardIds.some(id=>state.cardInstances[id].cardDefId===def);return available.find(c=>['card.what','card.whether','card.know','card.think','card.where','card.when','card.it','card.good'].includes(c.cardDefId)&&!owned(c.cardDefId))??null;}
export function libraryMove(state,candidate,{course=false}={}){
 if(state.progress.stageId!=='stage.09')return null;const c=state.combat,need=course&&!libraryCourseSatisfied(state,candidate)||c.enemyState.bossMechanic&&!candidate?.lethal&&!libraryTargetEvidence(candidate?.analysis).length;
 if(candidate?.lethal&&!course)return null;
 if(need&&c.handIds.length<=c.rulesSnapshot.handLimit-3&&c.turnsRemaining>=4)return {type:'PREPARE'};
 if(need&&c.exchangesRemaining){const reg=registryForVersion(state.version),kept=new Set(candidate?.slots.map(s=>s.cardInstanceId)??[]),rows=c.handIds.map(id=>({id,def:state.cardInstances[id].cardDefId,lex:reg.lexemeById[reg.cardById[state.cardInstances[id].cardDefId]?.lexemeId]}));for(const r of rows.filter(r=>['card.what','card.whether','card.where','card.when','card.that','card.know','card.think','card.it','card.be','card.good'].includes(r.def)))kept.add(r.id);const ids=rows.filter(r=>!kept.has(r.id)).map(r=>r.id);if(ids.length)return {type:'EXCHANGE',cardIds:ids.slice(0,4)};}
 return null;
}
/** Public reward policy for the higher 0.9 boss HP. Keep earned multipliers instead of replacing the last slot blindly. */
export function libraryRewardDecision(state,available){
 if(!['0.9.0','0.10.0','0.10.1'].includes(state.version))return null;
 const owned=def=>state.activeCardIds.some(id=>state.cardInstances[id].cardDefId===def);
 const value=id=>({'rune.longSentence':90,'rune.perfectSentence':80,'rune.svoo':75,'rune.polished':60,'rune.adverbs':55,'rune.svo':50,'rune.svc':40,'rune.openingHand':38,'rune.handSize':35}[id]??15);
 const runes=state.runes.orderedInstanceIds.map(id=>state.runes.instances[id]),weakest=[...runes].sort((a,b)=>value(a.runeId)*a.level-value(b.runeId)*b.level)[0];
 const score=c=>{
  if(c.kind==='RUNE'){const old=runes.find(r=>r.runeId===c.runeId);return old?180+value(c.runeId):runes.length<state.runes.slotLimit?100+value(c.runeId):value(c.runeId)>value(weakest.runeId)*weakest.level?90+value(c.runeId):-1;}
  if(c.kind==='CARD'){if(c.cardDefId==='card.will'&&!owned(c.cardDefId))return 240;if(state.progress.battleNumber>=33&&libraryReward(state,[c]))return 230;if(['card.operation.supply','card.operation.search'].includes(c.cardDefId)&&!owned(c.cardDefId))return 195;if(!owned(c.cardDefId)&&['card.give','card.show','card.think','card.know'].includes(c.cardDefId))return 130;return 20;}
  if(c.serviceKind==='POLISH')return 85;return -1;
 };
 const choice=[...available].sort((a,b)=>score(b)-score(a))[0];
 if(!choice||score(choice)<0)return {choice:null};
 const target=choice.targetCardIds?.find(id=>['card.operation.supply','card.operation.search'].includes(state.cardInstances[id].cardDefId)&&state.cardInstances[id].polishLevel===0)??choice.targetCardIds?.find(id=>['card.give','card.show','card.be','card.have','card.i','card.you'].includes(state.cardInstances[id].cardDefId))??choice.targetCardIds?.[0];
 return {choice,target,replace:choice.kind==='RUNE'&&runes.length>=state.runes.slotLimit&&!runes.some(r=>r.runeId===choice.runeId)?weakest.instanceId:undefined};
}
