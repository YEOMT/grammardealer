import {findPlayableSentences} from '../src/game/deck.js';
import {expandTimeCandidates} from './time-candidates.js';
import {registryForVersion,formsForCard,createSentenceSnapshot} from '../src/data/language/index.js';import {analyzeSentence} from '../src/engine/grammar/index.js';import {cardKind} from '../src/data/cardCatalog.js';import {operationAvailability,searchCandidates} from '../src/game/operations.js';
/** Bounded QA composition from public current hand only; never reads draw order or future RNG. */
export function expandSkyCandidates(state,bases,{limit=240}={}){
 const registry=registryForVersion(state.version),rows=state.combat.handIds.filter(id=>cardKind(state.cardInstances[id],state.version)==='WORD').map(id=>({id,def:state.cardInstances[id].cardDefId,forms:formsForCard(state.cardInstances[id],{registry})}));const out=[...bases],seen=new Set();let checks=0;
 const accept=slots=>{if(checks>=limit||slots.length>16||new Set(slots.map(s=>s.cardInstanceId)).size!==slots.length)return;const key=slots.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|');if(seen.has(key))return;seen.add(key);checks++;const snapshot=createSentenceSnapshot(slots,state.cardInstances,{languageVersion:state.version}),analysis=analyzeSentence(snapshot,registry);if(analysis.status==='VALID')out.push({slots,snapshot,analysis,frameId:analysis.mainFrameId,text:snapshot.orderedTokens.map(t=>t.surface).join(' ')});};
 const simple=bases.filter(b=>b.slots.length<=10).sort((a,b)=>b.slots.length-a.slots.length),connectors=rows.filter(r=>['card.and','card.but','card.or','card.because','card.when','card.if'].includes(r.def));
 for(const connector of connectors){let leftCount=0;const leftSeen=new Set();for(const left of [...simple].sort((a,b)=>a.slots.length-b.slots.length)){const key=left.slots.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|');if(leftSeen.has(key)||leftCount++>=40||checks>=limit)continue;leftSeen.add(key);const used=new Set([connector.id,...left.slots.map(s=>s.cardInstanceId)]),remaining=rows.filter(r=>!used.has(r.id)).map(r=>r.id);if(remaining.length<2)continue;let rightBases=findPlayableSentences(remaining,state.cardInstances,{registry,perFrame:2,maxChecks:180,includeModifiers:true,includeSvoo:true});rightBases=expandTimeCandidates({...state,combat:{...state.combat,handIds:remaining}},rightBases,{limit:120});for(const right of rightBases){if(checks>=limit)break;accept([...left.slots,{cardInstanceId:connector.id,selection:{formId:connector.forms[0].id}},...right.slots]);}}}

 for(const verb of rows.filter(r=>['card.think','card.know','card.say'].includes(r.def)))for(const subject of rows.filter(r=>r.forms.some(f=>f.grammaticalFeatures.case==='NOMINATIVE')))for(const content of simple){const sf=subject.forms.find(f=>f.grammaticalFeatures.case==='NOMINATIVE');for(const vf of verb.forms.filter(f=>f.grammaticalFeatures.tense==='PRESENT')){const prefix=[{cardInstanceId:subject.id,selection:{formId:sf.id}},{cardInstanceId:verb.id,selection:{formId:vf.id}}];const that=rows.find(r=>r.def==='card.that');if(that)accept([...prefix,{cardInstanceId:that.id,selection:{formId:that.forms[0].id}},...content.slots]);accept([...prefix,...content.slots]);}}
 return out;
}
export function operationMove(state){
 if(!['0.4.0','0.5.0','0.5.1','0.6.0','0.6.1','0.7.0','0.8.0'].includes(state.version))return null;
 const modern=['0.6.1','0.7.0','0.8.0'].includes(state.version),history=state.combat.operationHistory??[];
 // Finite QA policy only: repeated manual circulation stays legal in the game.
 // After 24 operations this runner resumes attack/exchange/prepare decisions.
 if(modern&&history.length>=24)return null;
 for(const sourceCardId of state.combat.handIds){
  const a=operationAvailability(state,sourceCardId);if(!a.ok)continue;
  const request={type:'USE_OPERATION',sourceCardId,expectedRevision:state.revision,battleId:state.combat.enemyState.id,...(modern?{commandId:`operation.qa.${state.runId}.${state.revision}.${history.length+1}`}:{})};
  if(modern?a.spec.selectionMode!=='DIRECT':a.operationType==='SUPPLY')return request;
  const candidates=searchCandidates(state),phase=state.combat.enemyState.bossMechanic?.phaseOrder?.[state.combat.enemyState.bossMechanic.activePhase];
  let priority=phase==='FUTURE'?['card.will','card.have','card.i']:state.progress.stageId==='stage.04'?['card.and','card.think','card.because','card.i']:['card.have','card.be','card.i'];
  if(modern&&state.progress.stageId==='stage.06'){
   const language=registryForVersion(state.version),hand=state.combat.handIds.map(id=>language.lexemeById[language.cardById[state.cardInstances[id].cardDefId]?.lexemeId]).filter(Boolean);
   priority=[...(!hand.some(l=>l.pos==='PRONOUN')?['card.i','card.you','card.they']:[]),...(!hand.some(l=>l.lemma==='be')?['card.be']:[]),...(!hand.some(l=>l.pos==='ADJECTIVE')?['card.good','card.strong','card.small','card.kind']:[]),'card.i','card.you','card.water','card.friend','card.book'];
  }
  if(state.progress.stageId==='stage.08')priority=state.progress.battleNumber===35?['card.where','card.when','card.school','card.day','card.work','card.i','card.run','card.be']:['card.who','card.which','card.that','card.i','card.like','card.read','card.make','card.run','card.child'];
  const target=priority.map(def=>candidates.find(c=>state.cardInstances[c.cardInstanceId].cardDefId===def&&!state.combat.handIds.some(id=>state.cardInstances[id].cardDefId===def))).find(Boolean)??candidates[0];
  if(target)return {...request,targetCardId:target.cardInstanceId};
 }return null;
}
/** Public offers only. The 0.6.1 route exercises a reusable operation when offered. */
export function qaShopItems(state){
 const modern=['0.6.1','0.7.0','0.8.0'].includes(state.version);
 const reusable=item=>['card.operation.supply','card.operation.search'].includes(item.cardDefId);
 return [...state.shop.inventory].sort((a,b)=>(modern?Number(reusable(b))-Number(reusable(a)):0)||Number(b.runeId==='rune.svoo')-Number(a.runeId==='rune.svoo')||Number(b.kind==='RUNE')-Number(a.kind==='RUNE'));
}
export function qaShopPolishTarget(state){
 if(!['0.6.1','0.7.0','0.8.0'].includes(state.version)||state.shop.services.POLISH.used||state.economy.gold<state.shop.services.POLISH.price)return null;
 return state.activeCardIds.find(id=>['card.operation.supply','card.operation.search'].includes(state.cardInstances[id].cardDefId)&&state.cardInstances[id].polishLevel===0)??null;
}

/** Optional natural-play QA exercise: spend real exchanges to reach a reusable source again. */
export function qaOperationReuseExchange(state){
 if(!['0.6.1','0.7.0','0.8.0'].includes(state.version)||state.combat.exchangesRemaining<1)return null;
 const history=state.combat.operationHistory??[],source=history.find(e=>e.postUseDestination==='DISCARD'&&history.filter(x=>x.sourceCardId===e.sourceCardId).length===1);
 if(!source)return null;
 const cardIds=state.combat.handIds.filter(id=>cardKind(state.cardInstances[id],state.version)==='WORD');
 return cardIds.length?{type:'EXCHANGE',cardIds}:null;
}
