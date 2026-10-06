import {skyEvidence} from './skyEvidence.js';
import {verbPhrases} from './verbPhrase.js';
import {isIngForm} from '../../data/language/desertLanguage.js';
/* Bounded phrase/valency parser. It composes registered NP/AP/PP constituents;
   no answer strings, permutation search, inserted words, or semantic plausibility scoring. */
const LABELS={ASPECT_USAGE:'know의 기본 뜻은 보통 진행형으로 쓰지 않습니다.',AUXILIARY_FORM_REQUIRED:'조동사 뒤의 동사 형태를 확인하세요.',INFINITIVE_BASE_REQUIRED:'부정사에는 동사 원형을 사용하세요.',BE_FORM_REQUIRED:'be동사 형태를 선택하세요: am / is / are.',SUBJECT_VERB_AGREEMENT:'주어-동사 일치를 확인하세요.',DETERMINER_REQUIRED:'단수 명사 앞에 한정사가 필요합니다.',DETERMINER_NUMBER_AGREEMENT:'한정사와 명사의 수가 맞지 않습니다.',ARTICLE_FORM:'a/an 형태를 확인하세요.',ARTICLE_COUNTABILITY_MISMATCH:'셀 수 없는 명사에는 a/an을 쓰지 않습니다.',PRONOUN_CASE:'대명사의 격을 확인하세요.',INVALID_ADVERB_TARGET:'이 very는 동사를 직접 수식할 수 없습니다.',MISSING_FINITE_VERB:'동사가 필요합니다.',CORE_WORD_ORDER:'문장 순서를 확인하세요.',MISSING_REQUIRED_COMPLEMENT:'동사에 필요한 목적어나 보어가 없습니다.',MISSING_SUBJECT:'주어가 필요합니다.'};
const LIMITS={work:12000,depth:4,candidates:128};

export function parseSupportedClause(tokens,registry) {
 const desert=registry.validationScope==='desert.0.5';
 const sky=desert||registry.validationScope==='sky.0.4';
 const limits=sky?{work:90000,depth:6,candidates:128}:LIMITS;
 const time=sky||registry.validationScope==='time.0.3';
 const learning=time||registry.validationScope==='learning.0.2.2';
 let work=0;
 const tick=()=>{if(++work>limits.work){const e=new Error('WORK_BUDGET');e.code='ENGINE_LIMIT';throw e;}};
 const tok=(i)=>tokens[i];
 const hasRole=(i,role)=>tok(i)?.forms?.some(f=>f.allowedRoleCandidates.includes(role));
 const word=(i)=>tok(i)?.surface.toLowerCase();
 const ingAt=i=>tok(i)?.lex.pos==='VERB'&&tok(i).forms.some(isIngForm);
 const cardIds=(start,end)=>tokens.slice(start,end).map(t=>t.cardInstanceId);
 const role=(i,type)=>({cardInstanceId:tok(i).cardInstanceId,role:type,labelKo:({SUBJECT:'주어 S',FINITE_VERB:'동사 V',OBJECT:'목적어 O',INDIRECT_OBJECT:'간접목적어 IO',DIRECT_OBJECT:'직접목적어 DO',COMPLEMENT:'보어 C',NONFINITE_VERB:'동사 원형',INFINITIVE_CONNECTOR:'부정사 to',RELATIVE_CONNECTOR:'관계사',DETERMINER:'한정사',ADJECTIVE:'형용사',ADVERB:'부사',PREPOSITION:'전치사',PP_OBJECT:'전치사 목적어',NOUN_HEAD:'명사'}[type]??type)});
 const hit=(tag,start,end,head=start)=>({tag,cardIds:cardIds(start,end),headCardId:tok(head).cardInstanceId,evidenceKey:`${tag}:${cardIds(start,end).join('|')}`});
 const issue=(code,indices)=>({code,cardIds:indices.map(i=>tok(i).cardInstanceId),causeId:`${code}:${indices.map(i=>tok(i).cardInstanceId).join('|')}`,messageKo:LABELS[code]});
 const phrase=(kind,start,end,head,more={})=>({kind,start,end,head,features:{},issues:[],hits:[],roles:[],children:[],...more});
 const isDegree=(i)=>tok(i)?.lex.pos==='ADVERB'&&tok(i)?.sense.adverbPolicy?.degree;
 const advAllowed=(i,position)=>tok(i)?.lex.pos==='ADVERB'&&tok(i)?.sense.adverbPolicy?.positions.includes(position);
 const ppStart=(i)=>hasRole(i,'PREPOSITION');
 const merge=(a,b,extra={})=>({...a,...extra,issues:[...a.issues,...b.issues],hits:[...a.hits,...b.hits],roles:[...a.roles,...b.roles],children:[...a.children,b],...(desert?{interpretationPriority:(a.interpretationPriority??0)+(b.interpretationPriority??0)}:{})});


 const coord=i=>sky&&['and','but','or'].includes(word(i));
 const subordinate=i=>sky&&['because','when','if'].includes(word(i));
 const linkRole=(i,level)=>({...role(i,level==='CLAUSE'?'CLAUSE_CONNECTOR':'PHRASE_CONNECTOR'),labelKo:level==='CLAUSE'?'절 연결어':'단어·구 연결어'});
 const linkHit=(tag,start,end,connectorIndex,linkRoleName)=>({...hit(tag,start,end),connectorCardIds:connectorIndex===null?[]:[tok(connectorIndex).cardInstanceId],connectorRole:tag==='LINK.CLAUSE'?'CLAUSE':'PHRASE',linkRole:linkRoleName});
 function coordinatePhrase(left,right,connectorIndex){
  const features=left.kind==='NP'?(word(connectorIndex)==='or'?right.features:{person:Math.min(left.features.person??3,right.features.person??3),number:'PLURAL'}):left.features;
  return phrase(left.kind,left.start,right.end,left.head,{...left,end:right.end,features,issues:issueUnique([...left.issues,...right.issues]),hits:[...left.hits,...right.hits,linkHit('LINK.PHRASE',left.start,right.end,connectorIndex,'PHRASE_COORDINATION')],roles:[...left.roles,linkRole(connectorIndex,'PHRASE'),...right.roles],children:[left,right],connectorIndex,linkRole:'PHRASE_COORDINATION',...(desert?{interpretationPriority:(left.interpretationPriority??0)+(right.interpretationPriority??0)}:{})});
 }
 function expandCoordination(bases,read,{allowBut=true}={}){
  if(!sky)return bases;const out=[...bases];
  for(let i=0;i<out.length;i++){const left=out[i],k=left.end;if(!coord(k)||!allowBut&&word(k)==='but')continue;
   for(const right of read(k+1))if(right.kind===left.kind&&!(left.kind==='NP'&&[...left.issues,...right.issues].some(i=>i.code==='PRONOUN_CASE'))){tick();out.push(coordinatePhrase(left,right,k));if(out.length>limits.candidates){const e=new Error('PHRASE_COORDINATION_LIMIT');e.code='ENGINE_LIMIT';throw e;}}
  }return out;
 }
 function parseAP(start,options={}){const out=expandCoordination(parseAPAtom(start,options),i=>parseAPAtom(i,options));return sky&&options.attributive?out.sort((a,b)=>b.end-a.end):out;}
 const npMemo=new Map();
 function parseNP(start,npRole,options={}){
  if(!sky)return parseNPAtom(start,npRole,options);const key=JSON.stringify([start,npRole,options]);if(npMemo.has(key))return npMemo.get(key);npMemo.set(key,[]);
  const out=expandCoordination(parseNPAtom(start,npRole,options),i=>parseNPAtom(i,npRole,options),{allowBut:false});npMemo.set(key,out);return out;
 }
 function parsePP(start,options={}){return expandCoordination(parsePPAtom(start,options),i=>parsePPAtom(i,options));}
 function parseAdvP(start,position){const base=parseAdvPAtom(start,position);if(!base||!sky)return base;const out=expandCoordination([base],i=>{const p=parseAdvPAtom(i,position);return p?[p]:[];});return out.sort((a,b)=>b.end-a.end)[0];}
 function asClause(result,start,end,clauseRole='MAIN'){
  return phrase('CLAUSE',start,end,result.verbIndex,{issues:result.issues,hits:result.chunks.flatMap(c=>c.hits),roles:result.chunks.flatMap(c=>c.roles),children:result.chunks,clauseData:result,clauseRole,...(desert?{interpretationPriority:result.interpretationPriority??0}:{})});
 }

 function parseAPAtom(start,{attributive=false,depth=0}={}) {
  tick();let p=start;const degrees=[];
  while(isDegree(p)){degrees.push(p++);tick();}
  if(!hasRole(p,'ADJECTIVE')){
   if(desert&&attributive&&ingAt(p))return nonfiniteOptions(p,p+1,depth,{kind:'ING',function:'NOUN_MODIFIER',interpretation:'PARTICIPLE'}).map(n=>phrase('AP',start,n.end,n.head,{hits:n.hits,issues:n.issues,roles:n.roles,children:[n]}));
   return [];
  }
  const base=phrase('AP',start,p+1,p,{hits:[...degrees.map(i=>hit('MODIFIER.ADVERB',i,i+1)),...(attributive?[hit('MODIFIER.ADJECTIVE',p,p+1)]:[])],roles:[...degrees.map(i=>role(i,'ADVERB')),role(p,'ADJECTIVE')]});
  const out=[base];if(desert&&!attributive&&depth<limits.depth&&tok(p).senses.some(s=>s.infinitiveComplement))for(const n of nonfiniteOptions(p+1,tokens.length,depth,{kind:'TO',function:'ADJECTIVE_COMPLEMENT'}))out.push(merge(base,n,{end:n.end}));return out;
 }
 function parseNPAtom(start,npRole,{depth=0,prep=null,allowPostPP=true,allowRelative=true}={}) {
  tick();if(depth>limits.depth||!tok(start))return [];
  const out=[];const t=tok(start);
  if(desert&&['SUBJECT','COMPLEMENT','PP_OBJECT'].includes(npRole)&&depth<limits.depth){
   const kind=word(start)==='to'&&npRole!=='PP_OBJECT'?'TO':ingAt(start)?'ING':null;
   if(kind)for(const n of nonfiniteOptions(start,tokens.length,depth,{kind,function:({SUBJECT:'SUBJECT',COMPLEMENT:'SUBJECT_COMPLEMENT',PP_OBJECT:'PREPOSITION_OBJECT'})[npRole]}))out.push(phrase('NP',start,n.end,n.head,{npRole,features:{person:3,number:'SINGULAR'},issues:n.issues,hits:n.hits,roles:n.roles,children:[n],interpretationPriority:n.interpretationPriority??0}));
  }
  const suitablePronoun=t.forms.filter(f=>f.allowedRoleCandidates.some(r=>['NP_SUBJECT','NP_OBJECT','POSSESSIVE_NP','DEMONSTRATIVE_NP'].includes(r)));
  if(suitablePronoun.length) {
   const wanted=npRole==='SUBJECT'?'NP_SUBJECT':'NP_OBJECT';
   const good=suitablePronoun.find(f=>f.allowedRoleCandidates.includes(wanted))??suitablePronoun.find(f=>f.allowedRoleCandidates.includes('POSSESSIVE_NP')||f.allowedRoleCandidates.includes('DEMONSTRATIVE_NP'));
   const f=good??suitablePronoun[0];
   const issues=good||npRole==='COMPLEMENT'?[]:[issue('PRONOUN_CASE',[start])];
   out.push(phrase('NP',start,start+1,start,{npRole,features:{person:f.grammaticalFeatures.person??3,number:f.grammaticalFeatures.number??'SINGULAR'},issues,roles:[role(start,npRole)]}));
  }
  let p=start;let determinant=null;
  if(hasRole(p,'DETERMINER')||hasRole(p,'POSSESSIVE_DETERMINER')){determinant=p++;}
  const aps=[];
  while(true){const ap=parseAP(p,{attributive:true,depth})[0];if(!ap)break;aps.push(ap);p=ap.end;}
  if(hasRole(p,'NOUN_HEAD')) {
   const noun=tok(p);const f=noun.forms.find(f=>f.allowedRoleCandidates.includes('NOUN_HEAD'));
   const nounAps=desert?aps.map(ap=>({...ap,hits:ap.hits.map(h=>h.tag==='MODIFIER.ADJECTIVE'&&h.modifierCardIds?{...h,targetCardIds:[tok(p).cardInstanceId]}:h),children:ap.children.map(n=>n.nonfinite?{...n,nonfinite:{...n.nonfinite,controllerHead:p}}:n)})):aps;
   const features={person:3,number:f.grammaticalFeatures.number,countability:noun.sense.countability};
   const issues=[];const indefinite=determinant!==null&&tok(determinant).lex.lemma==='a';
   const singularDet=determinant!==null&&(indefinite||['this','that'].includes(word(determinant)));
   const bareAllowed=noun.sense.contextualBareRoles.some(rule=>rule.role==='PP_OBJECT'&&rule.prepositions.includes(prep));
   if(determinant===null&&features.number==='SINGULAR'&&features.countability==='COUNT'&&!bareAllowed)issues.push(issue('DETERMINER_REQUIRED',[p]));
   else if(singularDet&&features.number==='PLURAL')issues.push(issue('DETERMINER_NUMBER_AGREEMENT',[determinant,p]));
   else if(indefinite&&features.countability==='MASS')issues.push(issue('ARTICLE_COUNTABILITY_MISMATCH',[determinant,p]));
   else if(indefinite){
    // Curated word inventory includes useful /ju:/; all other vowel starts here are vowel sounds.
    const next=word(determinant+1);const needsAn=/^[aeiou]/.test(next)&&!['useful','usually'].includes(next);
    if((word(determinant)==='an')!==needsAn)issues.push(issue('ARTICLE_FORM',[determinant,determinant+1]));
   }
   const np=phrase('NP',start,p+1,p,{npRole,features,issues:[...issues,...nounAps.flatMap(ap=>ap.issues)],hits:nounAps.flatMap(ap=>ap.hits),roles:[...(determinant===null?[]:[role(determinant,'DETERMINER')]),...nounAps.flatMap(ap=>ap.roles),role(p,npRole)],children:nounAps,...(desert&&determinant===null&&ingAt(start)?{interpretationPriority:2}:{})});
   out.push(np);
   if(desert&&depth<limits.depth){
    if(word(np.end)==='to')for(const n of nonfiniteOptions(np.end,tokens.length,depth,{kind:'TO',function:'NOUN_MODIFIER',objectGap:np}))out.push(merge(np,n,{end:n.end,attachment:'NOUN_POSTMODIFIER'}));
    if(ingAt(np.end))for(const n of nonfiniteOptions(np.end,tokens.length,depth,{kind:'ING',interpretation:'PARTICIPLE',function:'NOUN_MODIFIER',controller:np}))out.push(merge(np,n,{end:n.end,attachment:'NOUN_POSTMODIFIER'}));
   }
   if(allowPostPP&&depth<limits.depth) {
    const addPost=(current)=>{
     if(out.length>limits.candidates){const e=new Error('NP_CANDIDATES');e.code='ENGINE_LIMIT';throw e;}
     for(const pp of parsePP(current.end,{depth:depth+1})) {
      const extended=merge(current,pp,{end:pp.end,attachment:'NOUN_POSTMODIFIER'});out.push(extended);
      if(pp.end<tokens.length&&ppStart(pp.end))addPost(extended);
     }
    };
    addPost(np);
   }
  }
  if(!sky&&learning&&allowRelative&&depth>=2&&out.some(np=>word(np.end)==='that')){const e=new Error('RELATIVE_DEPTH');e.code='ENGINE_LIMIT';throw e;}
  if(learning&&allowRelative&&depth<(desert?limits.depth-1:2))for(const base of [...out]) {
   const marker=word(base.end)==='that',start=base.end+(marker?1:0);
   if(start>=tokens.length)continue;
   // A subject gap needs an explicit relative marker; an object gap needs a real subject.
   const subjectGap=marker&&finiteCandidate(start)?base:null;
   if(!subjectGap&&!hasRole(start,'NP_SUBJECT')&&!hasRole(start,'NOUN_HEAD')&&!hasRole(start,'DETERMINER')&&!hasRole(start,'POSSESSIVE_DETERMINER'))continue;
   for(let end=start+1;end<=tokens.length;end++)for(const clause of parseRange(start,end,{depth:depth+1,subjectGap,objectGap:subjectGap?null:base})) {
    const relative=phrase('RELATIVE_CLAUSE',base.end,end,clause.verbIndex,{issues:clause.issues,hits:[...clause.chunks.flatMap(c=>c.hits),{...hit('CLAUSE.RELATIVE',base.end,end,clause.verbIndex),comboImplemented:false}],roles:[...(marker?[role(base.end,'RELATIVE_CONNECTOR')]:[]),...clause.chunks.flatMap(c=>c.roles)],children:sky?[clause.tree]:clause.chunks,...(sky?{childClauseRole:'RELATIVE'}:{}),antecedentHead:base.head,gapRole:subjectGap?'SUBJECT':'OBJECT',...(desert?{interpretationPriority:clause.interpretationPriority??0}:{})});
    out.push(merge(base,relative,{end}));
   }
  }
  return out;
 }
 function parsePPAtom(start,{depth=0}={}) {
  tick();if(!ppStart(start)||depth>limits.depth)return [];
  return parseNP(start+1,'PP_OBJECT',{depth,prep:word(start),allowPostPP:depth<limits.depth}).map(np=>phrase('PP',start,np.end,start,{
   issues:np.issues,hits:[...np.hits,hit('PHRASE.PP',start,np.end)],roles:[role(start,'PREPOSITION'),...np.roles],children:[np],preposition:word(start),...(desert?{interpretationPriority:np.interpretationPriority??0}:{}),
  }));
 }
 function advPhrase(i){return phrase('AdvP',i,i+1,i,{hits:[hit('MODIFIER.ADVERB',i,i+1)],roles:[role(i,'ADVERB')]});}
 function parseAdvPAtom(start,position) {
  tick();let p=start;
  while(isDegree(p))p++;
  if(p>start&&advAllowed(p,position)&&['quickly','slowly','carefully','clearly','well','often','fast'].includes(word(p)))return phrase('AdvP',start,p+1,p,{
   hits:Array.from({length:p-start+1},(_,n)=>hit('MODIFIER.ADVERB',start+n,start+n+1)),
   roles:Array.from({length:p-start+1},(_,n)=>role(start+n,'ADVERB')),
  });
  return advAllowed(start,position)?advPhrase(start):null;
 }
 function parseAdverbRun(start,position,{recoverVery=false}={}) {
  let p=start;let combined=phrase('ADVERBS',start,start,start);const variants=[combined];
  while(tok(p)?.lex.pos==='ADVERB') {
   const adverb=parseAdvP(p,position);
   if(adverb){combined=merge(combined,adverb,{end:adverb.end});p=adverb.end;}
   else if(recoverVery&&word(p)==='very'&&tokens.slice(p).find(t=>t.surface.toLowerCase()!=='very')?.lex.pos==='VERB'){
    combined=merge(combined,phrase('UNLICENSED',p,p+1,p,{issues:[issue('INVALID_ADVERB_TARGET',[p])],roles:[role(p,'UNLICENSED')]}),{end:p+1});p++;
   }else break;
   variants.push(combined);tick();
  }
  return variants;
 }
 function finishAdjuncts(start,verbLemma,{requireLocation=false,end=tokens.length,depth=0,allowPurpose=true}={}) {
  const out=[];
  const visit=(p,combined,location)=>{
   tick();if(p>end)return;if(out.length>limits.candidates){const e=new Error('ADJUNCT_CANDIDATES');e.code='ENGINE_LIMIT';throw e;}
   if(p===end){if(!requireLocation||location)out.push(combined);return;}
   const adverb=parseAdvP(p,'END');if(adverb)visit(adverb.end,merge(combined,adverb,{end:adverb.end}),location);
   for(const pp of parsePP(p,desert?{depth}:{}))visit(pp.end,merge(combined,pp,{end:pp.end}),location||['in','on','at','with'].includes(pp.preposition));
   if(desert&&allowPurpose&&depth<limits.depth&&word(p)==='to')for(const n of nonfiniteOptions(p,end,depth,{kind:'TO',function:'PURPOSE'}))visit(n.end,merge(combined,n,{end:n.end}),location);
   if(word(p)==='home'&&hasRole(p,'PLACE_ADVERB')&&['go','come','be'].includes(verbLemma))visit(p+1,merge(combined,advPhrase(p),{end:p+1}),true);
  };
  visit(start,phrase('ADJUNCTS',start,start,start),false);return out;
 }
 const issueUnique=(issues)=>[...new Map(issues.map(i=>[i.causeId,i])).values()];
 const agreement=(np,verbIndex)=>{
  const v=tok(verbIndex);const third=np.features.person===3&&np.features.number==='SINGULAR';
  if(time&&v.lex.lemma==='will')return [];
  if(time&&v.forms.some(f=>f.grammaticalFeatures.tense==='PAST')&&(v.lex.lemma!=='read'||registry.formById[v.selectionId].grammaticalFeatures.tense==='PAST')){
   if(v.lex.lemma!=='be')return [];
   return word(verbIndex)===(np.features.number==='SINGULAR'&&np.features.person!==2?'was':'were')?[]:[issue('SUBJECT_VERB_AGREEMENT',[np.head,verbIndex])];
  }
  if(v.lex.lemma==='be'&&word(verbIndex)==='be')return [issue('BE_FORM_REQUIRED',[verbIndex])];
  let good;
  if(v.lex.lemma==='be')good=word(verbIndex)===(np.features.person===1&&np.features.number==='SINGULAR'?'am':third?'is':'are');
  else good=v.forms.some(f=>f.grammaticalFeatures.tense==='PRESENT'&&(third?f.grammaticalFeatures.person===3:f.grammaticalFeatures.number==='NON_3_SINGULAR'));
  return good?[]:[issue('SUBJECT_VERB_AGREEMENT',[np.head,verbIndex])];
 };
 const invalid=(code)=>({status:'INVALID_CORE',messageKo:LABELS[code],issues:[{id:'issue.0',code,causeId:code,cardIds:tokens.map(t=>t.cardInstanceId),messageKo:LABELS[code]}],diagnostics:{workUnits:work}});
 const unsupported=(capabilityId)=>({status:'UNSUPPORTED',messageKo:'이 원정의 문법 범위에서는 아직 판정하지 않습니다.',diagnostics:{capabilityId,workUnits:work}});
 if(tokens.length===0)return invalid('MISSING_SUBJECT');
 const finiteCandidate=i=>hasRole(i,'FINITE_VERB')||hasRole(i,'UNSELECTED_BE');
 const verbPositions=tokens.flatMap((t,i)=>finiteCandidate(i)?[i]:[]);
 // Legacy campaigns retain their original grammar scope and acceptance policy.
 if(!learning) {
  if(tokens.some((t,i)=>word(i)==='to'&&tok(i+1)?.lex.pos==='VERB'))return unsupported('cap.infinitive');
  if(tokens.some((t,i)=>word(i)==='that'&&i>0&&hasRole(i-1,'NOUN_HEAD')&&tokens.slice(i+1).some(x=>x.lex.pos==='VERB')))return unsupported('cap.relative');
  if(verbPositions.length>1)return unsupported('cap.multiple.verbs');
 }
 if(!verbPositions.length)return invalid('MISSING_FINITE_VERB');
 if(verbPositions[0]===0&&!learning)return unsupported('cap.question.or.imperative');
 let partialAdvanced=null;let subjectBeforeVerb=false;
 const bindings=verb=>(learning?verb.senses:[verb.sense]).flatMap(sense=>sense.frameBindings.map(binding=>({...binding,senseId:sense.id}))).filter(b=>b.runtimeReady&&b.requiredCapabilityIds.every(cap=>registry.capabilities.some(c=>c.id===cap&&c.runtimeReady)));
 const nonfiniteMemo=new Map();
 function nonfiniteOptions(start,end,depth,options){
  if(depth>=limits.depth){if(options.kind==='TO'&&word(start)==='to'&&tok(start+1)?.lex.pos==='VERB'||options.kind==='ING'&&ingAt(start)){const e=new Error('NONFINITE_DEPTH');e.code='ENGINE_LIMIT';throw e;}return [];}const out=[];
  for(let stop=start+1;stop<=end;stop++)out.push(...desertNonfinite(start,stop,depth,options));return out;
 }
 function desertNonfinite(start,end,depth,{kind='TO',function:fn='OBJECT',interpretation=null,objectGap=null,controller=null}={}){
  tick();if(depth>=limits.depth||start>=end||kind==='TO'&&word(start)!=='to')return [];
  const vi=start+(kind==='TO'?1:0);if(tok(vi)?.lex.pos!=='VERB'||kind==='ING'&&!ingAt(vi))return [];
  const key=JSON.stringify([start,end,depth,kind,fn,interpretation,objectGap?.head,controller?.head]);if(nonfiniteMemo.has(key))return nonfiniteMemo.get(key);nonfiniteMemo.set(key,[]);
  const base=word(vi)===tok(vi).lex.lemma.toLowerCase(),out=[];
  const results=predicate(vi,null,end,depth+1,{finite:false,objectGap,nonfiniteKind:kind});
  // A stranded preposition consumes a real card and links its missing object to the antecedent.
  if(objectGap&&end>vi+1&&ppStart(end-1))for(const r of predicate(vi,null,end-1,depth+1,{finite:false,nonfiniteKind:kind})){
   const gap=phrase('PP',end-1,end,end-1,{preposition:word(end-1),gapRole:'PREPOSITION_OBJECT',antecedentHead:objectGap.head,roles:[role(end-1,'PREPOSITION')]});results.push({...r,chunks:[...r.chunks,gap],nonfiniteGapRole:'PREPOSITION_OBJECT'});
  }
  for(const r of results){const ownIssues=kind!=='ING'&&!base?[issue('INFINITIVE_BASE_REQUIRED',[vi])]:[],interp=interpretation??(kind==='ING'?'GERUND':'INFINITIVE'),tag=interp==='PARTICIPLE'?'PARTICIPLE.PRESENT':interp==='GERUND'?'CLAUSE.GERUND':'CLAUSE.INFINITIVE';
   const valid=!ownIssues.length&&!r.issues.some(i=>i.code==='AUXILIARY_FORM_REQUIRED');
   const raw={...hit(tag,start,end,vi),comboImplemented:kind!=='BARE'&&interp!=='PARTICIPLE',bonusEligible:kind!=='BARE'&&interp!=='PARTICIPLE'&&valid,validity:valid?'VALID':'RECOVERED',function:fn,interpretation:interp};
   const n=phrase('NONFINITE_PHRASE',start,end,vi,{issues:issueUnique([...r.issues,...ownIssues]),hits:[...r.chunks.flatMap(c=>c.hits),...(kind==='BARE'?[]:[raw]),...(interp==='PARTICIPLE'?[{...hit('MODIFIER.ADJECTIVE',start,end,vi),modifierCardIds:[tok(vi).cardInstanceId],targetCardIds:controller?[tok(controller.head).cardInstanceId]:[]}]:[])],roles:[...(kind==='TO'?[role(start,'INFINITIVE_CONNECTOR')]:[]),...r.chunks.flatMap(c=>c.roles)],children:r.chunks,npRole:fn,nonfinite:{formKind:kind==='TO'?'TO_INFINITIVE':kind,interpretation:interp,function:fn,controllerHead:controller?.head??objectGap?.head??null,gapRole:objectGap?(r.nonfiniteGapRole??'OBJECT'):null,antecedentHead:objectGap?.head??null},clauseData:r,clauseRole:'NONFINITE',interpretationPriority:r.interpretationPriority??0});out.push(n);
  }
  nonfiniteMemo.set(key,out);return out;
 }
 function parseNonfinite(start,end,depth,withTo) {
  if(desert)return nonfiniteOptions(start,end,depth,{kind:withTo?'TO':'BARE',function:'OBJECT'});
  if(depth>limits.depth){const e=new Error('NONFINITE_DEPTH');e.code='ENGINE_LIMIT';throw e;}if(withTo&&word(start)!=='to')return [];
  const vi=start+(withTo?1:0);if(tok(vi)?.lex.pos!=='VERB')return [];
  const base=word(vi)===tok(vi).lex.lemma.toLowerCase();
  return predicate(vi,null,end,depth+1,{finite:false}).map(result=>phrase('NONFINITE_CLAUSE',start,end,vi,{issues:[...result.issues,...(base?[]:[issue('INFINITIVE_BASE_REQUIRED',[vi])])],hits:[...result.chunks.flatMap(c=>c.hits),{...hit('CLAUSE.INFINITIVE',start,end,vi),comboImplemented:false}],roles:[...(withTo?[role(start,'INFINITIVE_CONNECTOR')]:[]),...result.chunks.flatMap(c=>c.roles)],children:result.chunks,npRole:'COMPLEMENT'}));
 }
 function predicateSingle(vi,subject,end,depth,{finite=true,objectGap=null,nonfiniteKind=null}={}) {
  tick();if(depth>limits.depth||vi>=end)return [];
  const out=[];
  const chains=time?verbPhrases(tokens,vi,end,{finite,tick}):[{start:vi,end:vi+1,lexicalIndex:vi}];
  for(const chain of chains){
  const lexicalIndex=chain.lexicalIndex,verb=tok(lexicalIndex);
  const verbNode=phrase('V',vi,chain.end,lexicalIndex,{roles:Array.from({length:chain.end-vi},(_,n)=>({...role(vi+n,finite?'FINITE_VERB':'NONFINITE_VERB'),...(desert&&!finite?{labelKo:ingAt(vi+n)?'-ing형 동사':'비정형 동사구'}:{})})),issues:(chain.issues??[]).map(e=>({...issue(e.code,e.indices),causeId:e.causeId})),...(time?{verbPhrase:chain}:{})});
  const availableBindings=bindings(verb),availableFrames=availableBindings.map(b=>b.frameId);
  const postRuns=verb.lex.lemma==='be'?parseAdverbRun(chain.end,'AFTER_BE'):[phrase('ADVERBS',chain.end,chain.end,chain.end)];
  for(const post of postRuns)for(const binding of availableBindings) {
   const internalFrame=binding.frameId,pos=post.end;
   const aspectIssues=sky&&registry.senseById[binding.senseId]?.aspectPolicy?.progressive==='ISSUE'&&chain.aspects?.includes('PROGRESSIVE')?[issue('ASPECT_USAGE',[lexicalIndex])]:[];
   if(pos>end)continue;
   let complements=[];
   const np=(position,role)=>parseNP(position,role,{depth}).filter(n=>n.end<=end);
   if(internalFrame==='frame.sv'||internalFrame==='frame.beLocative')complements=[phrase('EMPTY',pos,pos,vi)];
   if(internalFrame==='frame.svc.adj')complements=parseAP(pos,{depth}).map(ap=>({...ap,npRole:'COMPLEMENT',roles:ap.roles.map(r=>r.cardInstanceId===tok(ap.head).cardInstanceId?role(ap.head,'COMPLEMENT'):r)}));
   if(internalFrame==='frame.svc.np'||internalFrame==='frame.svo')complements=np(pos,internalFrame==='frame.svo'?'OBJECT':'COMPLEMENT');
   if(sky&&!objectGap&&internalFrame==='frame.svo.content'){
    const marker=word(pos)==='that',contentStart=pos+(marker?1:0);complements=[];
    for(let ce=contentStart+2;ce<=end;ce++)for(const child of parseRange(contentStart,ce,{depth:depth+1})){
     const tree=child.tree??asClause(child,contentStart,ce,'CONTENT_OBJECT');
     complements.push(phrase('CONTENT_CLAUSE',pos,ce,child.verbIndex,{npRole:'OBJECT',issues:child.issues,hits:[...tree.hits,linkHit('LINK.CLAUSE',pos,ce,marker?pos:null,'CONTENT_CLAUSE')],roles:[...(marker?[linkRole(pos,'CLAUSE')]:[]),...tree.roles],children:[tree],connectorIndex:marker?pos:undefined,linkRole:'CONTENT_CLAUSE',childClauseRole:'CONTENT_OBJECT',...(desert?{interpretationPriority:child.interpretationPriority??0}:{})}));
    }
   }
   if(objectGap)complements=internalFrame==='frame.svo'?[phrase('GAP',pos,pos,vi,{gapRole:'OBJECT',antecedentHead:objectGap.head})]:[];
   if(desert&&objectGap&&internalFrame==='frame.svoo')complements=np(pos,'INDIRECT_OBJECT').map(io=>phrase('OBJECTS',io.start,io.end,io.head,{issues:io.issues,hits:io.hits,roles:io.roles,children:[io],indirectObject:io,gapRole:'DIRECT_OBJECT',antecedentHead:objectGap.head}));
   if(!objectGap&&internalFrame==='frame.svoo')complements=np(pos,'INDIRECT_OBJECT').flatMap(io=>np(io.end,'DIRECT_OBJECT').map(object=>phrase('OBJECTS',io.start,object.end,io.head,{issues:[...io.issues,...object.issues],hits:[...io.hits,...object.hits],roles:[...io.roles,...object.roles],children:[io,object],indirectObject:io,directObject:object,...(desert?{interpretationPriority:(io.interpretationPriority??0)+(object.interpretationPriority??0)}:{})})));
   if(learning&&!objectGap&&internalFrame.startsWith('frame.svoc.'))complements=np(pos,'OBJECT').flatMap(object=>{
    const kind=internalFrame.split('.').at(-1);
    const cs=kind==='adj'?parseAP(object.end,{depth}):kind==='np'?np(object.end,'COMPLEMENT'):desert?nonfiniteOptions(object.end,end,depth,{kind:kind==='to'?'TO':'BARE',function:'OBJECT_COMPLEMENT',controller:object}):parseNonfinite(object.end,end,depth,kind==='to');
    // The whole nonfinite phrase is OC; its lexical head remains its own predicate.
    return cs.map(c=>{const complement={...c,npRole:desert?'OBJECT_COMPLEMENT':'COMPLEMENT',roles:desert&&c.nonfinite?c.roles:c.roles.map(r=>r.cardInstanceId===tok(c.head)?.cardInstanceId?role(c.head,'COMPLEMENT'):r)};return phrase('OBJECT_COMPLEMENT',pos,c.end,object.head,{issues:[...object.issues,...c.issues],hits:[...object.hits,...c.hits],roles:[...object.roles,...complement.roles],children:[object,complement],object,complement,...(desert?{interpretationPriority:(object.interpretationPriority??0)+(c.interpretationPriority??0)}:{})});});
   });
   if(learning&&!objectGap&&['frame.svo.to','frame.svo.bare'].includes(internalFrame))complements=parseNonfinite(pos,end,depth,internalFrame==='frame.svo.to').map(c=>({...c,npRole:'OBJECT'}));
   if(desert&&!objectGap&&internalFrame==='frame.svo.gerund')complements=nonfiniteOptions(pos,end,depth,{kind:'ING',function:'OBJECT',...(binding.nonfiniteObjectGap?{objectGap:subject??{head:vi}}:{})}).map(c=>({...c,npRole:'OBJECT'}));
   for(const complement of complements) {
    if(complement.end>end)continue;
    if((!learning||depth===0&&!objectGap)&&complement.end<end&&internalFrame==='frame.svo') {
     if(!availableFrames.includes('frame.svoo')&&verb.sense.futureFrameBindings.some(b=>b.frameId==='frame.svoo')&&parseNP(complement.end,'OBJECT').some(np=>np.end===end))partialAdvanced='cap.svoo';
     if(verb.sense.futureFrameBindings.some(b=>b.frameId==='frame.svoc')&&(parseAP(complement.end).some(ap=>ap.end===end)||(verb.sense.futureFrameBindings.some(b=>b.frameId==='frame.svoc'&&b.allowedComplements.includes('NP'))&&parseNP(complement.end,'COMPLEMENT').some(np=>np.end===end))))partialAdvanced='cap.svoc';
    }
    for(const suffix of finishAdjuncts(complement.end,verb.lex.lemma,{requireLocation:internalFrame==='frame.beLocative',end,depth,allowPurpose:!desert||internalFrame!=='frame.svc.adj'})) {
     const chunks=[verbNode,post,complement,suffix].filter(x=>x.end>x.start);
     const issues=issueUnique([...chunks.flatMap(x=>x.issues),...aspectIssues,...(finite?agreement(subject,vi):[])]);
     const activity=subject&&tok(subject.head)?.senses.some(s=>s.semanticTags?.includes('ACTIVITY_NAME'));
     const beNominalIng=desert&&internalFrame==='frame.svc.np'&&ingAt(complement.start);
     const interpretationPriority=desert?chunks.reduce((sum,n)=>sum+(n.interpretationPriority??0),0)+(beNominalIng?(activity?-2:2):0):0;
     out.push({internalFrame,frameId:registry.frameById[internalFrame].schoolFrameId??internalFrame,chunks,issues,subject,verbIndex:lexicalIndex,complement,suffix,senseId:binding.senseId,...(desert?{interpretationPriority}:{} )});
     if(out.length>limits.candidates){const e=new Error('CLAUSE_CANDIDATES');e.code='ENGINE_LIMIT';throw e;}
    }
   }
  }
  }
  return out;
 }
 function predicate(vi,subject,end,depth,options={}){
  const out=predicateSingle(vi,subject,end,depth,options);if(!sky||depth>=limits.depth||options.objectGap)return out;
  for(let k=vi+1;k<end-1;k++)if(coord(k))for(const left of predicateSingle(vi,subject,k,depth,options)){
   const vp=left.chunks.find(c=>c.verbPhrase)?.verbPhrase,shared=vp?.auxiliaries.length>0;
   for(const right of predicate(k+1,subject,end,depth+1,{...options,finite:shared?false:options.finite??true})){
    const required=shared?({'WILL':'BASE','PERFECT':'PAST_PARTICIPLE','PROGRESSIVE':'PRESENT_PARTICIPLE'})[vp.auxiliaries.at(-1).role]:null;
    const effectiveRequired=required??(desert&&options.finite===false?(options.nonfiniteKind==='ING'?'PRESENT_PARTICIPLE':'BASE'):null);
    const correct=!effectiveRequired||tok(k+1)?.forms.some(f=>effectiveRequired==='BASE'?f.surface.toLowerCase()===tok(k+1).lex.lemma.toLowerCase():f.grammaticalFeatures.tense===effectiveRequired);
    const issues=issueUnique([...left.issues,...right.issues,...(correct?[]:[issue('AUXILIARY_FORM_REQUIRED',[k+1])])]);
    const priorities=desert?{interpretationPriority:(left.interpretationPriority??0)+(right.interpretationPriority??0)}:{};
    const group=phrase('VP_COORDINATION',vi,end,left.verbIndex,{issues,hits:[...left.chunks.flatMap(c=>c.hits),...right.chunks.flatMap(c=>c.hits),linkHit('LINK.PHRASE',vi,end,k,'PHRASE_COORDINATION')],roles:[...left.chunks.flatMap(c=>c.roles),linkRole(k,'PHRASE'),...right.chunks.flatMap(c=>c.roles)],children:[...left.chunks,...right.chunks],connectorIndex:k,linkRole:'PHRASE_COORDINATION',...priorities});
    out.push({...left,chunks:[group],issues,...priorities});
   }
  }return out;
 }
 function parseSimpleRange(start,end,{depth=0,subjectGap=null,objectGap=null}={}) {
  if(depth>limits.depth)return [];
  const out=[];
  for(const front of parseAdverbRun(start,'FRONT')) {
   const subjects=subjectGap?[{...subjectGap,start:front.end,end:front.end,issues:[],hits:[],roles:[],children:[]}]:parseNP(front.end,'SUBJECT',{depth});
   for(const subject of subjects)for(const pre of parseAdverbRun(subject.end,'PRE_VERB',{recoverVery:true})) {
    const vi=pre.end;if(vi>=end||!finiteCandidate(vi))continue;
    if(depth===0)subjectBeforeVerb=true;
    for(const result of predicate(vi,subject,end,depth,{objectGap})) {
     const chunks=[front,subject,pre,...result.chunks].filter(x=>x.end>x.start);
     out.push({...result,chunks,issues:issueUnique([...front.issues,...subject.issues,...pre.issues,...result.issues]),...(desert?{interpretationPriority:(result.interpretationPriority??0)+(subject.interpretationPriority??0)}:{})});
     if(out.length>limits.candidates){const e=new Error('CLAUSE_CANDIDATES');e.code='ENGINE_LIMIT';throw e;}
    }
   }
  }
  return out;
 }

 const rangeMemo=new Map();
 function parseRange(start,end,options={}){
  if(!sky)return parseSimpleRange(start,end,options);
  const depth=options.depth??0;if(depth>limits.depth||start>=end)return [];
  const key=JSON.stringify([start,end,depth,options.subjectGap?.head,options.objectGap?.head]);if(rangeMemo.has(key))return rangeMemo.get(key);rangeMemo.set(key,[]);
  const out=parseSimpleRange(start,end,options).map(r=>({...r,tree:asClause(r,start,end)}));
  if(desert&&word(start)==='to'&&depth<limits.depth&&!options.subjectGap&&!options.objectGap)for(const prefix of nonfiniteOptions(start,end-2,depth,{kind:'TO',function:'PURPOSE'}))for(const main of parseRange(prefix.end,end,{depth:depth+1})){
   const chunks=[prefix,...main.chunks],issues=issueUnique([...prefix.issues,...main.issues]),interpretationPriority=(prefix.interpretationPriority??0)+(main.interpretationPriority??0);out.push({...main,chunks,issues,interpretationPriority,tree:asClause({...main,chunks,issues,interpretationPriority},start,end),compositionPriority:1});
  }
  const combine=(primary,secondary,k,kind,preposed=false)=>{
   const a=primary.tree,b=secondary.tree,connector=phrase('CONNECTOR',k,k+1,k,{roles:[linkRole(k,'CLAUSE')]}),children=preposed?[connector,b,a]:[a,connector,b];
   // Independent clauses are peers. A because/when/if clause is subordinate to the primary.
   const dependent={...b,clauseRole:kind==='COORDINATED_CLAUSES'?'COORDINATE':'ADVERBIAL',childClauseRole:kind==='COORDINATED_CLAUSES'?'COORDINATE':'ADVERBIAL'};
   children[preposed?1:2]=dependent;
   const priorities=desert?{interpretationPriority:(primary.interpretationPriority??0)+(secondary.interpretationPriority??0)}:{};
   const tree=phrase(kind==='COORDINATED_CLAUSES'?'CLAUSE_COORDINATION':'ADVERBIAL_CONNECTION',start,end,primary.verbIndex,{issues:issueUnique([...primary.issues,...secondary.issues]),hits:[...a.hits,...b.hits,linkHit('LINK.CLAUSE',start,end,k,kind)],roles:children.flatMap(x=>x.roles),children,connectorIndex:k,linkRole:kind,...priorities});
   return {...primary,chunks:children,tree,issues:tree.issues,compositionPriority:kind==='COORDINATED_CLAUSES'?0:1,...priorities};
  };
  if(!options.subjectGap&&!options.objectGap&&depth<limits.depth){
   for(let k=start+1;k<end-1;k++)if(coord(k)||subordinate(k))for(const left of parseRange(start,k,{depth:depth+1}))for(const right of parseRange(k+1,end,{depth:depth+1})){out.push(combine(left,right,k,coord(k)?'COORDINATED_CLAUSES':'ADVERBIAL_CLAUSE'));tick();}
   if(subordinate(start))for(let split=start+3;split<end-1;split++)for(const child of parseRange(start+1,split,{depth:depth+1}))for(const main of parseRange(split,end,{depth:depth+1})){out.push(combine(main,child,start,'ADVERBIAL_CLAUSE',true));tick();}
  }
  if(out.length>limits.candidates){const e=new Error('CLAUSE_LINK_CANDIDATES');e.code='ENGINE_LIMIT';throw e;}
  rangeMemo.set(key,out);return out;
 }
 const candidates=parseRange(0,tokens.length);
 if(!candidates.length) {
  if(partialAdvanced)return unsupported(partialAdvanced);
  return invalid(subjectBeforeVerb?'MISSING_REQUIRED_COMPLEMENT':'CORE_WORD_ORDER');
 }
 // Whole-input valid parses dominate recovered ones. Stable production order is the school-grammar tie break.
 const priority=['frame.sv','frame.svc.adj','frame.svc.np','frame.svo','frame.svo.content','frame.svoo','frame.beLocative','frame.svoc.adj','frame.svoc.np','frame.svo.to','frame.svo.bare','frame.svoc.to','frame.svoc.bare'];
 const desertAttachmentPriority=c=>desert?(c.suffix?.hits.filter(h=>h.function==='PURPOSE').length??0):0;
 candidates.sort((a,b)=>(desert?(a.interpretationPriority??0)-(b.interpretationPriority??0):0)||a.issues.length-b.issues.length||(sky?((a.compositionPriority??2)-(b.compositionPriority??2)):0)||desertAttachmentPriority(a)-desertAttachmentPriority(b)||(learning?((priority.indexOf(a.internalFrame)<0?priority.length:priority.indexOf(a.internalFrame))-(priority.indexOf(b.internalFrame)<0?priority.length:priority.indexOf(b.internalFrame))||a.senseId.localeCompare(b.senseId)):0));
 const best=candidates[0];if(sky)return skyEvidence(best,{tokens,registry,candidateCount:candidates.length,workUnits:work,limits});const recovered=best.issues.length>0;
 const issues=best.issues.map((i,n)=>({...i,id:`issue.${n}`}));
 const unlicensed=[...new Set(issues.filter(i=>i.code==='INVALID_ADVERB_TARGET').flatMap(i=>i.cardIds))];
 const nodes=[];
 const walk=(node,parentId)=>{
  if(node.end===node.start)return null;
  const id=`node.${nodes.length}`;
  const record={id,type:node.kind,cardIds:cardIds(node.start,node.end),headCardId:tok(node.head)?.cardInstanceId??null,scopeNodeId:parentId,connector:node.kind==='PP'?tok(node.start).cardInstanceId:null,grammaticalRole:node.npRole??null,...(node.gapRole?{gapRole:node.gapRole,antecedentCardId:tok(node.antecedentHead).cardInstanceId}:{}),children:[],...(node.verbPhrase?{verbPhrase:node.verbPhrase}:{})};nodes.push(record);
  record.children=node.children.map(child=>walk(child,id)).filter(Boolean);return id;
 };
 const root={id:'node.root',type:'CLAUSE',cardIds:tokens.map(t=>t.cardInstanceId),headCardId:tok(best.verbIndex).cardInstanceId,scopeNodeId:null,connector:null,children:[]};
 nodes.push(root);root.children=best.chunks.map(chunk=>walk(chunk,root.id)).filter(Boolean);
 const rawHits=best.chunks.flatMap(c=>c.hits);
 const uniqueHits=[...new Map(rawHits.map(h=>[h.evidenceKey,h])).values()];
 const grammarHits=[{id:'hit.mainFrame',tag:registry.frameById[best.internalFrame].tag,frameId:best.frameId,internalFrameId:best.internalFrame,comboImplemented:registry.frameById[best.internalFrame].comboImplemented!==false,scope:'MAIN_CLAUSE',scopeNodeId:root.id,cardIds:tokens.filter(t=>!unlicensed.includes(t.cardInstanceId)).map(t=>t.cardInstanceId),headCardId:tok(best.verbIndex).cardInstanceId,validity:recovered?'RECOVERED':'VALID',evidenceKey:'MAIN_CLAUSE:FRAME'},
 ...uniqueHits.map((h,i)=>({...h,id:`hit.modifier.${i}`,scope:'PHRASE',scopeNodeId:nodes.find(n=>n.cardIds.length===h.cardIds.length&&n.cardIds.every((id,i)=>id===h.cardIds[i]))?.id??root.id,validity:issues.some(is=>is.cardIds.some(id=>h.cardIds.includes(id)))?'RECOVERED':'VALID'}))];
 const verbPhraseEvidence=time?nodes.filter(n=>n.verbPhrase).map((n,i)=>{
  const vp=n.verbPhrase;delete n.verbPhrase;
  return {id:`vp.${i}`,clauseId:vp.lexicalIndex===best.verbIndex?'clause.main':`clause.embedded.${i}`,nodeId:n.id,cardIds:n.cardIds,range:[vp.start,vp.end],finiteCardId:vp.finiteIndex===null?null:tok(vp.finiteIndex).cardInstanceId,lexicalVerbCardId:tok(vp.lexicalIndex).cardInstanceId,auxiliaries:vp.auxiliaries.map(a=>({cardInstanceId:tok(a.index).cardInstanceId,role:a.role})),tenseFamily:vp.tenseFamily,aspects:vp.aspects,futureMarker:vp.futureMarker,chainWellFormed:vp.chainWellFormed,temporalEvidenceEligible:vp.finiteIndex!==null&&vp.chainWellFormed,issueIds:issues.filter(i=>i.code==='AUXILIARY_FORM_REQUIRED'&&i.cardIds.some(id=>n.cardIds.includes(id))).map(i=>i.id)};
 }):[];
 if(time)for(const vp of verbPhraseEvidence.filter(v=>v.temporalEvidenceEligible))for(const tag of [...(vp.tenseFamily==='PAST'?['TIME.PAST']:[]),...vp.aspects.map(a=>`TIME.${a}`),...(vp.futureMarker==='WILL'?['TIME.FUTURE_WILL']:[])])grammarHits.push({id:`hit.${vp.id}.${tag}`,tag,scope:'CLAUSE',scopeNodeId:vp.nodeId,cardIds:vp.cardIds,validity:'VALID',evidenceKey:`${tag}:${vp.id}`});
 const resolvedTokenRoles=[...new Map(best.chunks.flatMap(c=>c.roles).map(r=>[r.cardInstanceId,r])).values()];
 const argumentNode=np=>np?nodes.find(n=>n.type==='NP'&&n.grammaticalRole===np.npRole&&n.headCardId===tok(np.head).cardInstanceId)?.id:null;
 const dativeBinding=(learning?tok(best.verbIndex).senses.flatMap(s=>s.frameBindings):tok(best.verbIndex).sense.frameBindings).find(b=>b.frameId==='frame.svoo'&&b.runtimeReady);
 const correspondence=best.internalFrame==='frame.svo'&&dativeBinding?best.suffix.children.find(pp=>pp.kind==='PP'&&pp.preposition===dativeBinding.dativePreposition):null;
 const structures=correspondence?[{kind:'DATIVE_ALTERNATION',preposition:correspondence.preposition,schoolFrameId:'frame.svo',objectNodeId:argumentNode(best.complement),recipientCardIds:cardIds(correspondence.start+1,correspondence.end),ppCardIds:cardIds(correspondence.start,correspondence.end)}]:[];
 return {status:recovered?'VALID_WITH_ISSUES':'VALID',rootNodeId:root.id,mainClauseId:'clause.main',mainFrameId:best.frameId,nodes,
  clauses:[{id:'clause.main',nodeId:root.id,frameId:best.frameId,internalFrameId:best.internalFrame,subjectNodeId:argumentNode(best.subject),verbCardId:tok(best.verbIndex).cardInstanceId,objectNodeId:best.internalFrame==='frame.svo'?argumentNode(best.complement):null,indirectObjectNodeId:argumentNode(best.complement.indirectObject),directObjectNodeId:argumentNode(best.complement.directObject)}],structures,
  resolvedTokenRoles,grammarHits,issues,...(time?{verbPhrases:verbPhraseEvidence}:{}),evidenceMarks:grammarHits.map(h=>({evidenceKey:h.evidenceKey,cardIds:h.cardIds})),
  ambiguities:candidates.length>1?[{type:'EQUIVALENT_FULL_COVERAGE_ANALYSES',candidateCount:candidates.length,normalizedTo:best.frameId,selectionPolicy:learning?'fewest-issues/fixed-school-frame/sense-id':'legacy-order',noteKo:'동일 카드의 수식·전치사구는 한 번만 계산합니다.'}]:[],
  coverage:{consumedCardIds:tokens.map(t=>t.cardInstanceId),issueAffectedCardIds:[...new Set(issues.flatMap(i=>i.cardIds))],unlicensedCardIds:unlicensed},
  diagnostics:{workUnits:work,candidateCount:candidates.length,limits:LIMITS},messageKo:recovered?'문장 구조 확인':'완전한 문장!',
 };
}
