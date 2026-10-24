import { registryForVersion, formsForCard, createSentenceSnapshot } from '../data/language/index.js';
import { analyzeSentence } from '../engine/grammar/index.js';
import { eligibleGrammarAnalysis } from '../engine/comboEligibility.js';
import { mainFrameEvidence, FRAME_KEYS, frameLabel } from '../engine/foresight.js';
import { findPlayableSentences } from './deck.js';
import { pick, assertStream } from './rng.js';

export const FINALE_TENSES = Object.freeze(['PRESENT_SIMPLE','PAST_SIMPLE','PRESENT_PROGRESSIVE','PRESENT_PERFECT','FUTURE_WILL']);
export const FINALE_GRAMMARS = Object.freeze(['PASSIVE','INFINITIVE','EXTRAPOSITION','RELATIVE','COUNTERFACTUAL']);
const tenseLabels={PRESENT_SIMPLE:'현재 단순',PAST_SIMPLE:'과거 단순',PRESENT_PROGRESSIVE:'현재진행',PRESENT_PERFECT:'현재완료',FUTURE_WILL:'will 미래'};
const grammarLabels={PASSIVE:'수동태',INFINITIVE:'to부정사',EXTRAPOSITION:'가주어·진주어',RELATIVE:'관계절',COUNTERFACTUAL:'가정법'};
const cleanVP=v=>v?.chainWellFormed&&!(v.issueIds??[]).length;
const unique=xs=>[...new Set(xs)];
export function finaleTaskLabel(task){return !task?'과제 없음':task.type==='FRAME'?`주절 ${frameLabel(task.target)}`:task.type==='GRAMMAR'?grammarLabels[task.target]:task.type==='OWNED_VERB'?`동사 ${task.lemma}`:tenseLabels[task.target]??task.target;}

/** Raw parser structure plus unlock eligibility, before numerical hit replacement. */
export function matchFinaleTask(task,analysis,{comboEligibility=null,submittedCards=[]}={}){
 if(!task||!['VALID','VALID_WITH_ISSUES'].includes(analysis?.status))return null;
 const consumed=new Set(analysis.coverage?.consumedCardIds??[]),excluded=new Set([...(analysis.excludedCardIds??[]),...(analysis.coverage?.unlicensedCardIds??[])]);
 const usable=ids=>ids?.length&&ids.every(id=>consumed.has(id)&&!excluded.has(id));
 const eligible=eligibleGrammarAnalysis(analysis,comboEligibility),hits=(eligible.grammarHits??[]).filter(h=>h.validity==='VALID');
 const main=mainFrameEvidence(analysis),clause=analysis.clauses?.find(c=>c.id===analysis.mainClauseId),vp=analysis.verbPhrases?.find(v=>v.clauseId===clause?.id&&v.lexicalVerbCardId===clause.verbCardId);
 const result=(refs,ids)=>usable(ids)?{evidenceRefs:unique(refs),highlightCardIds:unique(ids)}:null;
 if(task.type==='FRAME'){
  const h=hits.find(h=>h.scope==='MAIN_CLAUSE'&&h.frameId===clause?.frameId);
  return main?.key===task.target&&h?result([h.id,main.verbPhraseId],h.cardIds):null;
 }
 if(task.type==='TENSE'){
  if(!main||!cleanVP(vp)||!vp.finiteCardId||!vp.temporalEvidenceEligible||vp.mood==='COUNTERFACTUAL')return null;
  const aspects=vp.aspects??[],simple=aspects.length===0&&!vp.modal;
  const tag={PAST_SIMPLE:'TIME.PAST',PRESENT_PROGRESSIVE:'TIME.PROGRESSIVE',PRESENT_PERFECT:'TIME.PERFECT',FUTURE_WILL:'TIME.FUTURE_WILL'}[task.target];
  const h=tag?hits.find(h=>h.tag===tag&&h.scopeNodeId===vp.nodeId):null;
  const ok={PRESENT_SIMPLE:simple&&vp.tenseFamily==='PRESENT',PAST_SIMPLE:simple&&vp.tenseFamily==='PAST',PRESENT_PROGRESSIVE:vp.tenseFamily==='PRESENT'&&!vp.modal&&aspects.length===1&&aspects[0]==='PROGRESSIVE',PRESENT_PERFECT:vp.tenseFamily==='PRESENT'&&!vp.modal&&aspects.length===1&&aspects[0]==='PERFECT',FUTURE_WILL:vp.modal==='will'&&aspects.length===0}[task.target];
  return ok&&(!tag||h)?result([vp.id,...(h?[h.id]:[])],vp.cardIds):null;
 }
 if(task.type==='OWNED_VERB'){
  const tokens=analysis.tokens??submittedCards;
  for(const v of analysis.verbPhrases??[]){
   if(!cleanVP(v)||!usable(v.cardIds))continue;
   const token=tokens.find(t=>(t.cardInstanceId??t.instanceId)===v.lexicalVerbCardId);
   const def=token?.cardDefId?registryForVersion('0.10.2').cardById[token.cardDefId]:null;
   if((token?.lexemeId??def?.lexemeId)===task.target)return result([v.id],[v.lexicalVerbCardId]);
  }
  return null;
 }
 if(task.type!=='GRAMMAR')return null;
 let matched=[];
 if(task.target==='PASSIVE')matched=hits.filter(h=>h.tag==='VOICE.PASSIVE'&&(analysis.verbPhrases??[]).some(v=>cleanVP(v)&&v.voice==='PASSIVE'&&v.nodeId===h.scopeNodeId));
 if(task.target==='INFINITIVE')matched=hits.filter(h=>h.tag==='CLAUSE.INFINITIVE'&&(analysis.nodes??[]).some(n=>n.id===h.scopeNodeId));
 if(task.target==='RELATIVE')matched=hits.filter(h=>h.tag.startsWith('CLAUSE.RELATIVE.')&&(analysis.relativeClauses??[]).some(r=>r.id===h.relativeClauseId&&r.validity==='VALID'&&!(r.ownIssueIds??[]).length&&r.antecedentNodeId));
 if(task.target==='COUNTERFACTUAL')matched=hits.filter(h=>['CORRIDOR.UNREAL_PRESENT','CORRIDOR.UNREAL_PAST'].includes(h.tag)&&(analysis.corridorStructures??[]).some(r=>r.id===h.corridorEvidenceId&&r.validity==='VALID'&&r.conditionClauseId&&r.resultClauseId));
 if(task.target==='EXTRAPOSITION'){
  matched=(analysis.nominalStructures??[]).filter(r=>r.validity==='VALID'&&!(r.ownIssueIds??[]).length&&['EXTRAPOSED_SUBJECT_TO','EXTRAPOSED_SUBJECT_THAT'].includes(r.kind)&&r.dummySubjectCardId&&r.clauseIds?.length&&(r.kind!=='EXTRAPOSED_SUBJECT_TO'||!comboEligibility||comboEligibility.unlocks.includes('pack.infinitive')));
 }
 const good=matched.filter(h=>usable(h.cardIds));
 return good.length?result(good.map(h=>h.id),good.flatMap(h=>h.cardIds)):null;
}

/** Bounded structural candidates. Every witness uses physical copies and the real parser. */
export function buildFinaleTaskPool(activeCardIds,cardInstances,{registry=registryForVersion('0.10.2'),comboEligibility=null,maxChecks=2400}={}){
 if(!Array.isArray(activeCardIds)||new Set(activeCardIds).size!==activeCardIds.length)throw Error('Invalid finale deck');
 if(!Number.isSafeInteger(maxChecks)||maxChecks<100||maxChecks>10000)throw Error('Invalid finale witness budget');
 const instances=structuredClone(cardInstances);
 const rows=activeCardIds.map(id=>{const c=instances[id],d=registry.cardById[c?.cardDefId],l=registry.lexemeById[d?.lexemeId];return l?{id,card:c,lexeme:l,forms:formsForCard(c,{registry})}:null;}).filter(Boolean);
 const virtual=[];
 // Only existing grammatical core WORD definitions can fill one missing copy.
 for(const lemma of ['be','have','will','can','to','it','that','who','which','if']){
  const d=registry.cards.find(c=>registry.lexemeById[c.lexemeId]?.lemma===lemma);if(!d)continue;
  const id=`finale.witness.support.${lemma}`,card={instanceId:id,cardDefId:d.id,polishLevel:0,specialEffectId:null};instances[id]=card;
  virtual.push({id,card,lexeme:registry.lexemeById[d.lexemeId],forms:formsForCard(card,{registry})});
 }
 const all=[...rows,...virtual],byId=new Map(all.map(r=>[r.id,r])),support=new Set(virtual.map(r=>r.id)),pool={FRAME:[],GRAMMAR:[],OWNED_VERB:[],TENSE:[],search:{checks:0,maxChecks,exhausted:false}},seen=new Set(),found=new Map();
 const slot=(r,f)=>({cardInstanceId:r.id,selection:{formId:f.id}}),forms=(r,p)=>r.forms.filter(p),baseForm=r=>r.forms.find(f=>f.grammaticalFeatures?.tense==='BASE'||f.id.endsWith('.present'));
 const grammarTargets=[...Object.keys(FRAME_KEYS).map(k=>({type:'FRAME',target:FRAME_KEYS[k]})),...FINALE_GRAMMARS.map(target=>({type:'GRAMMAR',target})),...FINALE_TENSES.map(target=>({type:'TENSE',target})),...rows.filter(r=>r.lexeme.pos==='VERB'&&!['will','can'].includes(r.lexeme.lemma)).map(r=>({type:'OWNED_VERB',target:r.lexeme.id,lemma:r.lexeme.lemma}))];
 const candidates=unique(grammarTargets.map(t=>`${t.type}:${t.target}`)).map(key=>grammarTargets.find(t=>`${t.type}:${t.target}`===key));
 let phaseLimit=maxChecks;
 function accept(slots,known=null){
  if(slots.length>24||new Set(slots.map(s=>s.cardInstanceId)).size!==slots.length||slots.filter(s=>support.has(s.cardInstanceId)).length>1)return null;
  const key=slots.map(s=>s.cardInstanceId+':'+s.selection.formId).join('|');if(seen.has(key)||pool.search.checks>=phaseLimit)return null;seen.add(key);pool.search.checks++;
  const snapshot=known?.snapshot??createSentenceSnapshot(slots,instances,{sentenceId:`finale.witness.${pool.search.checks}`,languageVersion:registry.version});
  const analysis=known?.analysis??analyzeSentence(snapshot,registry);if(analysis.status!=='VALID')return null;
  const missing=slots.find(s=>support.has(s.cardInstanceId)),supportCardDefId=missing?instances[missing.cardInstanceId].cardDefId:null;
  for(const task of candidates){
   if(supportCardDefId&&['TENSE','OWNED_VERB'].includes(task.type))continue;
   const key=task.type+':'+task.target,previous=found.get(key);if(previous&&!previous.supportCardDefId)continue;
   if(!matchFinaleTask(task,analysis,{comboEligibility,submittedCards:snapshot.orderedTokens}))continue;
   const row={...task,supportCardDefId,witnessSlots:structuredClone(slots),witnessCardDefIds:slots.map(s=>instances[s.cardInstanceId].cardDefId)};
   found.set(key,row);
  }
  return {slots,analysis,snapshot};
 }
 const bases=[];
 // The existing frame search supplies actual registered noun phrases and valencies.
 // Isolating each lexical verb avoids the first few verbs exhausting every quota.
 for(const verb of rows.filter(r=>r.lexeme.pos==='VERB'&&!['will','can'].includes(r.lexeme.lemma))){
  const ids=rows.filter(r=>r.lexeme.pos!=='VERB'||r.id===verb.id).map(r=>r.id);
  for(const w of findPlayableSentences(ids,instances,{registry,includeSvoo:true,perFrame:2,maxChecks:240,maxCards:24})){const b=accept(w.slots,w);if(b)bases.push(b);}
 }
 const nouns=(role)=>{const out=[];for(const r of all){if(r.lexeme.pos==='PRONOUN'){const f=r.forms.find(f=>f.grammaticalFeatures?.case===(role==='SUBJECT'?'NOMINATIVE':'OBJECTIVE'));if(f)out.push([slot(r,f)]);}if(r.lexeme.pos==='NOUN'){for(const f of r.forms.filter(f=>f.grammaticalFeatures?.number==='PLURAL'||['MASS','UNCOUNTABLE'].includes(f.grammaticalFeatures?.countability)))out.push([slot(r,f)]);const f=r.forms.find(f=>f.grammaticalFeatures?.number==='SINGULAR');if(f)for(const d of rows.filter(x=>x.lexeme.pos==='DETERMINER'))for(const df of d.forms)out.push([slot(d,df),slot(r,f)]);}}return out;};
 const subjects=nouns('SUBJECT').slice(0,30),objects=nouns('OBJECT').slice(0,30),verbs=rows.filter(r=>r.lexeme.pos==='VERB'&&!['will','can'].includes(r.lexeme.lemma)),adjectives=rows.filter(r=>r.lexeme.pos==='ADJECTIVE'),aux=lemma=>all.filter(r=>r.lexeme.lemma===lemma);
 phaseLimit=Math.floor(maxChecks*.18);
 // SVOC is absent from the old opening generator; add bounded registered AP complements.
 for(const v of verbs.filter(v=>v.lexeme.frameIds?.some(f=>f.startsWith('frame.svoc'))))for(const sub of subjects.slice(0,8))for(const obj of objects.slice(0,8))for(const adj of adjectives.slice(0,4)){
  for(const vf of v.forms.filter(f=>f.grammaticalFeatures?.tense==='PRESENT')){const b=accept([...sub,slot(v,vf),...obj,slot(adj,adj.forms[0])]);if(b)bases.push(b);}if(pool.search.checks>=maxChecks/3)break;
 }
 // Keep lexical/frame diversity before trying a different actual subject copy.
 const compact=[...new Map(bases.map(b=>[b.analysis.mainFrameId+':'+b.analysis.clauses.find(c=>c.id===b.analysis.mainClauseId).verbCardId,b])).values()].slice(0,40);
 const basic=[...compact];phaseLimit=Math.floor(maxChecks*.27);
 for(const b of compact){const c=b.analysis.clauses.find(c=>c.id===b.analysis.mainClauseId),at=b.slots.findIndex(s=>s.cardInstanceId===c.verbCardId);for(const sub of subjects.slice(0,8)){const v=byId.get(c.verbCardId);for(const f of v.forms.filter(f=>f.grammaticalFeatures?.tense==='PRESENT')){const expanded=accept([...sub,slot(v,f),...b.slots.slice(at+1)]);if(expanded)basic.push(expanded);}}}
 phaseLimit=Math.floor(maxChecks*.44);
 for(const b of basic){
  const c=b.analysis.clauses.find(c=>c.id===b.analysis.mainClauseId),at=b.slots.findIndex(s=>s.cardInstanceId===c.verbCardId),v=byId.get(c.verbCardId);if(at<0||!v)continue;
  for(const f of v.forms.filter(f=>['PRESENT','PAST'].includes(f.grammaticalFeatures?.tense)))accept(b.slots.map((s,i)=>i===at?slot(v,f):s));
  for(const [lemma,suffix] of [['be','.ing'],['have','.pp'],['will',null]])for(const a of aux(lemma)){
   const vf=suffix?v.forms.find(f=>f.id.endsWith(suffix)):baseForm(v);if(!vf)continue;
   for(const af of a.forms.filter(f=>lemma==='will'?f.surface==='will':f.grammaticalFeatures?.tense==='PRESENT'))accept([...b.slots.slice(0,at),slot(a,af),slot(v,vf),...b.slots.slice(at+1)]);
  }
 }
 phaseLimit=Math.floor(maxChecks*.54);
 // Passive finite clauses; structural verification decides which source frame is licensed.
 for(const sub of subjects.slice(0,10))for(const v of verbs.filter(v=>v.lexeme.frameIds?.includes('frame.svo')).slice(0,12))for(const a of aux('be'))for(const af of a.forms.filter(f=>f.grammaticalFeatures?.tense==='PRESENT')){const pp=v.forms.find(f=>f.id.endsWith('.pp'));if(pp)accept([...sub,slot(a,af),slot(v,pp)]);}
 // Infinitive complements and extraposition use the same registered base VP tails.
 phaseLimit=Math.floor(maxChecks*.71);
 for(const b of compact){
  const c=b.analysis.clauses.find(c=>c.id===b.analysis.mainClauseId),at=b.slots.findIndex(s=>s.cardInstanceId===c.verbCardId),v=byId.get(c.verbCardId),vf=baseForm(v);if(!vf)continue;const tail=[slot(v,vf),...b.slots.slice(at+1)];
  for(const to of aux('to')){
   for(const outer of verbs.filter(v=>v.lexeme.frameIds?.includes('frame.svo.to')))for(const sub of subjects.slice(0,6))for(const f of outer.forms.filter(f=>f.grammaticalFeatures?.tense==='PRESENT'))accept([...sub,slot(outer,f),slot(to,to.forms[0]),...tail]);
   for(const it of aux('it'))for(const be of aux('be'))for(const adj of adjectives.slice(0,6)){const sf=it.forms.find(f=>f.grammaticalFeatures?.case==='NOMINATIVE'),bf=be.forms.find(f=>f.surface==='is');if(sf&&bf)accept([slot(it,sf),slot(be,bf),slot(adj,adj.forms[0]),slot(to,to.forms[0]),...tail]);}
  }
 }
 // A registered subject-relative clause inserted after an existing nominal subject.
 phaseLimit=Math.floor(maxChecks*.85);
 for(const b of basic){
  const c=b.analysis.clauses.find(c=>c.id===b.analysis.mainClauseId),subject=b.analysis.nodes.find(n=>n.id===c.subjectNodeId);if(!subject||!subject.cardIds.some(id=>byId.get(id)?.lexeme.pos==='NOUN'))continue;
  const end=Math.max(...subject.cardIds.map(id=>b.slots.findIndex(s=>s.cardInstanceId===id)))+1;
  for(const other of compact){const oc=other.analysis.clauses.find(c=>c.id===other.analysis.mainClauseId),at=other.slots.findIndex(s=>s.cardInstanceId===oc.verbCardId);for(const marker of [...aux('that'),...aux('who'),...aux('which')])accept([...b.slots.slice(0,end),slot(marker,marker.forms[0]),...other.slots.slice(at),...b.slots.slice(end)]);}
 }
 // Conditional/result clauses remain separate physical copies, even for one lexeme.
 phaseLimit=maxChecks;
 for(const condition of basic)for(const result of basic){
  const cv=condition.analysis.clauses.find(c=>c.id===condition.analysis.mainClauseId)?.verbCardId,rv=result.analysis.clauses.find(c=>c.id===result.analysis.mainClauseId)?.verbCardId,cr=byId.get(cv),rr=byId.get(rv),past=cr.forms.find(f=>f.grammaticalFeatures?.tense==='PAST'),base=baseForm(rr);if(!past||!base)continue;
  for(const iff of aux('if'))for(const modal of aux('will')){const would=modal.forms.find(f=>f.surface==='would');if(!would)continue;accept([slot(iff,iff.forms[0]),...condition.slots.map(s=>s.cardInstanceId===cv?slot(cr,past):s),...result.slots.flatMap(s=>s.cardInstanceId===rv?[slot(modal,would),slot(rr,base)]:[s])]);}
 }
 for(const row of found.values())pool[row.type].push(row);
 for(const type of ['FRAME','GRAMMAR','OWNED_VERB','TENSE'])pool[type].sort((a,b)=>a.target<b.target?-1:a.target>b.target?1:0);
 pool.search.exhausted=pool.search.checks>=maxChecks;
 return pool;
}

export function createSurfacePlan(pool,rng){
 assertStream(rng);const startCursor=rng.cursor,types=['FRAME','GRAMMAR','OWNED_VERB'].filter(k=>pool[k]?.length);
 if(types.length<2)throw Error('FINAL_TASKS_UNAVAILABLE: two independently witnessed task types are required');
 const first=pick(rng,types),second=pick(rng,types.filter(t=>t!==first));
 return {tasks:[structuredClone(pick(rng,pool[first])),structuredClone(pick(rng,pool[second]))],dustCount:pick(rng,[4,5]),randomTrace:{startCursor,endCursor:rng.cursor}};
}
export function createDeepTaskPlan(pool,targets,rng){
 assertStream(rng);if(targets.length&&!pool.TENSE.length)throw Error('FINAL_TENSE_TASKS_UNAVAILABLE');
 const startCursor=rng.cursor,tasks=[];for(const target of targets.slice(0,2)){const choices=pool.TENSE.filter(t=>pool.TENSE.length===1||t.target!==tasks.at(-1)?.target);tasks.push({...structuredClone(pick(rng,choices)),runeInstanceId:target.instanceId});}
 return {tasks,randomTrace:{startCursor,endCursor:rng.cursor}};
}
