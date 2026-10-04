/* Bounded phrase/valency parser. It composes registered NP/AP/PP constituents;
   no answer strings, permutation search, inserted words, or semantic plausibility scoring. */
const LABELS={BE_FORM_REQUIRED:'be동사 형태를 선택하세요: am / is / are.',SUBJECT_VERB_AGREEMENT:'주어-동사 일치를 확인하세요.',DETERMINER_REQUIRED:'단수 명사 앞에 한정사가 필요합니다.',DETERMINER_NUMBER_AGREEMENT:'한정사와 명사의 수가 맞지 않습니다.',ARTICLE_FORM:'a/an 형태를 확인하세요.',ARTICLE_COUNTABILITY_MISMATCH:'셀 수 없는 명사에는 a/an을 쓰지 않습니다.',PRONOUN_CASE:'대명사의 격을 확인하세요.',INVALID_ADVERB_TARGET:'이 very는 동사를 직접 수식할 수 없습니다.',MISSING_FINITE_VERB:'동사가 필요합니다.',CORE_WORD_ORDER:'문장 순서를 확인하세요.',MISSING_REQUIRED_COMPLEMENT:'동사에 필요한 목적어나 보어가 없습니다.',MISSING_SUBJECT:'주어가 필요합니다.'};
const LIMITS={work:12000,depth:4,candidates:128};

export function parseSupportedClause(tokens,registry) {
 let work=0;
 const tick=()=>{if(++work>LIMITS.work){const e=new Error('WORK_BUDGET');e.code='ENGINE_LIMIT';throw e;}};
 const tok=(i)=>tokens[i];
 const hasRole=(i,role)=>tok(i)?.forms?.some(f=>f.allowedRoleCandidates.includes(role));
 const word=(i)=>tok(i)?.surface.toLowerCase();
 const cardIds=(start,end)=>tokens.slice(start,end).map(t=>t.cardInstanceId);
 const role=(i,type)=>({cardInstanceId:tok(i).cardInstanceId,role:type,labelKo:({SUBJECT:'주어 S',FINITE_VERB:'동사 V',OBJECT:'목적어 O',INDIRECT_OBJECT:'간접목적어 IO',DIRECT_OBJECT:'직접목적어 DO',COMPLEMENT:'보어 C',DETERMINER:'한정사',ADJECTIVE:'형용사',ADVERB:'부사',PREPOSITION:'전치사',PP_OBJECT:'전치사 목적어',NOUN_HEAD:'명사'}[type]??type)});
 const hit=(tag,start,end,head=start)=>({tag,cardIds:cardIds(start,end),headCardId:tok(head).cardInstanceId,evidenceKey:`${tag}:${cardIds(start,end).join('|')}`});
 const issue=(code,indices)=>({code,cardIds:indices.map(i=>tok(i).cardInstanceId),causeId:`${code}:${indices.map(i=>tok(i).cardInstanceId).join('|')}`,messageKo:LABELS[code]});
 const phrase=(kind,start,end,head,more={})=>({kind,start,end,head,features:{},issues:[],hits:[],roles:[],children:[],...more});
 const isDegree=(i)=>tok(i)?.lex.pos==='ADVERB'&&tok(i)?.sense.adverbPolicy?.degree;
 const advAllowed=(i,position)=>tok(i)?.lex.pos==='ADVERB'&&tok(i)?.sense.adverbPolicy?.positions.includes(position);
 const ppStart=(i)=>hasRole(i,'PREPOSITION');
 const merge=(a,b,extra={})=>({...a,...extra,issues:[...a.issues,...b.issues],hits:[...a.hits,...b.hits],roles:[...a.roles,...b.roles],children:[...a.children,b]});

 function parseAP(start,{attributive=false}={}) {
  tick();let p=start;const degrees=[];
  while(isDegree(p)){degrees.push(p++);tick();}
  if(!hasRole(p,'ADJECTIVE'))return [];
  return [phrase('AP',start,p+1,p,{hits:[...degrees.map(i=>hit('MODIFIER.ADVERB',i,i+1)),...(attributive?[hit('MODIFIER.ADJECTIVE',p,p+1)]:[])],roles:[...degrees.map(i=>role(i,'ADVERB')),role(p,'ADJECTIVE')]})];
 }
 function parseNP(start,npRole,{depth=0,prep=null,allowPostPP=true}={}) {
  tick();if(depth>LIMITS.depth||!tok(start))return [];
  const out=[];const t=tok(start);
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
  while(true){const ap=parseAP(p,{attributive:true})[0];if(!ap)break;aps.push(ap);p=ap.end;}
  if(hasRole(p,'NOUN_HEAD')) {
   const noun=tok(p);const f=noun.forms.find(f=>f.allowedRoleCandidates.includes('NOUN_HEAD'));
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
   const np=phrase('NP',start,p+1,p,{npRole,features,issues:[...issues,...aps.flatMap(ap=>ap.issues)],hits:aps.flatMap(ap=>ap.hits),roles:[...(determinant===null?[]:[role(determinant,'DETERMINER')]),...aps.flatMap(ap=>ap.roles),role(p,npRole)],children:aps});
   out.push(np);
   if(allowPostPP&&depth<LIMITS.depth) {
    const addPost=(current)=>{
     if(out.length>LIMITS.candidates){const e=new Error('NP_CANDIDATES');e.code='ENGINE_LIMIT';throw e;}
     for(const pp of parsePP(current.end,{depth:depth+1})) {
      const extended=merge(current,pp,{end:pp.end,attachment:'NOUN_POSTMODIFIER'});out.push(extended);
      if(pp.end<tokens.length&&ppStart(pp.end))addPost(extended);
     }
    };
    addPost(np);
   }
  }
  return out;
 }
 function parsePP(start,{depth=0}={}) {
  tick();if(!ppStart(start)||depth>LIMITS.depth)return [];
  return parseNP(start+1,'PP_OBJECT',{depth,prep:word(start),allowPostPP:depth<LIMITS.depth}).map(np=>phrase('PP',start,np.end,start,{
   issues:np.issues,hits:[...np.hits,hit('PHRASE.PP',start,np.end)],roles:[role(start,'PREPOSITION'),...np.roles],children:[np],preposition:word(start),
  }));
 }
 function advPhrase(i){return phrase('AdvP',i,i+1,i,{hits:[hit('MODIFIER.ADVERB',i,i+1)],roles:[role(i,'ADVERB')]});}
 function parseAdvP(start,position) {
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
 function finishAdjuncts(start,verbLemma,{requireLocation=false}={}) {
  const out=[];
  const visit=(p,combined,location)=>{
   tick();if(out.length>LIMITS.candidates){const e=new Error('ADJUNCT_CANDIDATES');e.code='ENGINE_LIMIT';throw e;}
   if(p===tokens.length){if(!requireLocation||location)out.push(combined);return;}
   const adverb=parseAdvP(p,'END');if(adverb)visit(adverb.end,merge(combined,adverb,{end:adverb.end}),location);
   for(const pp of parsePP(p))visit(pp.end,merge(combined,pp,{end:pp.end}),location||['in','on','at','with'].includes(pp.preposition));
   if(word(p)==='home'&&hasRole(p,'PLACE_ADVERB')&&['go','come','be'].includes(verbLemma))visit(p+1,merge(combined,advPhrase(p),{end:p+1}),true);
  };
  visit(start,phrase('ADJUNCTS',start,start,start),false);return out;
 }
 const issueUnique=(issues)=>[...new Map(issues.map(i=>[i.causeId,i])).values()];
 const agreement=(np,verbIndex)=>{
  const v=tok(verbIndex);const third=np.features.person===3&&np.features.number==='SINGULAR';
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
 // Reserved structures return no guessed grammar success and no partial Frame hit.
 if(tokens.some((t,i)=>word(i)==='to'&&tok(i+1)?.lex.pos==='VERB'))return unsupported('cap.infinitive');
 if(tokens.some((t,i)=>word(i)==='that'&&i>0&&hasRole(i-1,'NOUN_HEAD')&&tokens.slice(i+1).some(x=>x.lex.pos==='VERB')))return unsupported('cap.relative');
 if(verbPositions.length>1)return unsupported('cap.multiple.verbs');
 if(!verbPositions.length)return invalid('MISSING_FINITE_VERB');
 if(verbPositions[0]===0)return unsupported('cap.question.or.imperative');
 const candidates=[];
 let partialAdvanced=null;let subjectBeforeVerb=false;
 for(const front of parseAdverbRun(0,'FRONT'))for(const subject of parseNP(front.end,'SUBJECT'))for(const pre of parseAdverbRun(subject.end,'PRE_VERB',{recoverVery:true})) {
  const vi=pre.end;if(!finiteCandidate(vi))continue;subjectBeforeVerb=true;
  const verb=tok(vi);const verbNode=phrase('V',vi,vi+1,vi,{roles:[role(vi,'FINITE_VERB')]});
  const availableFrames=verb.sense.frameBindings.filter(b=>b.runtimeReady&&b.requiredCapabilityIds.every(cap=>registry.capabilities.some(c=>c.id===cap&&c.runtimeReady))).map(b=>b.frameId);
  const postRuns=verb.lex.lemma==='be'?parseAdverbRun(vi+1,'AFTER_BE'):[phrase('ADVERBS',vi+1,vi+1,vi+1)];
  for(const post of postRuns)for(const internalFrame of availableFrames) {
   const pos=post.end;
   let complements=[];
   if(internalFrame==='frame.sv'||internalFrame==='frame.beLocative')complements=[phrase('EMPTY',pos,pos,vi)];
   if(internalFrame==='frame.svc.adj')complements=parseAP(pos).map(ap=>({...ap,roles:ap.roles.map(r=>r.cardInstanceId===tok(ap.head).cardInstanceId?role(ap.head,'COMPLEMENT'):r)}));
   if(internalFrame==='frame.svc.np'||internalFrame==='frame.svo')complements=parseNP(pos,internalFrame==='frame.svo'?'OBJECT':'COMPLEMENT');
   if(internalFrame==='frame.svoo')complements=parseNP(pos,'INDIRECT_OBJECT').flatMap(io=>parseNP(io.end,'DIRECT_OBJECT').map(object=>phrase('OBJECTS',io.start,object.end,io.head,{
    issues:[...io.issues,...object.issues],hits:[...io.hits,...object.hits],roles:[...io.roles,...object.roles],children:[io,object],indirectObject:io,directObject:object,
   })));
   for(const complement of complements) {
    if(complement.end<tokens.length&&internalFrame==='frame.svo') {
     if(!availableFrames.includes('frame.svoo')&&verb.sense.futureFrameBindings.some(b=>b.frameId==='frame.svoo')&&parseNP(complement.end,'OBJECT').some(np=>np.end===tokens.length))partialAdvanced='cap.svoo';
     if(verb.sense.futureFrameBindings.some(b=>b.frameId==='frame.svoc')&&(parseAP(complement.end).some(ap=>ap.end===tokens.length)||(verb.sense.futureFrameBindings.some(b=>b.frameId==='frame.svoc'&&b.allowedComplements.includes('NP'))&&parseNP(complement.end,'COMPLEMENT').some(np=>np.end===tokens.length))))partialAdvanced='cap.svoc';
    }
    for(const suffix of finishAdjuncts(complement.end,verb.lex.lemma,{requireLocation:internalFrame==='frame.beLocative'})) {
     const chunks=[front,subject,pre,verbNode,post,complement,suffix].filter(x=>x.end>x.start);
     const issues=issueUnique([...chunks.flatMap(x=>x.issues),...agreement(subject,vi)]);
     candidates.push({internalFrame,frameId:registry.frameById[internalFrame].schoolFrameId??internalFrame,chunks,issues,subject,verbIndex:vi,complement,suffix});
     if(candidates.length>LIMITS.candidates){const e=new Error('CLAUSE_CANDIDATES');e.code='ENGINE_LIMIT';throw e;}
    }
   }
  }
 }
 if(!candidates.length) {
  if(partialAdvanced)return unsupported(partialAdvanced);
  return invalid(subjectBeforeVerb?'MISSING_REQUIRED_COMPLEMENT':'CORE_WORD_ORDER');
 }
 // Whole-input valid parses dominate recovered ones. Stable production order is the school-grammar tie break.
 candidates.sort((a,b)=>a.issues.length-b.issues.length);
 const best=candidates[0];const recovered=best.issues.length>0;
 const issues=best.issues.map((i,n)=>({...i,id:`issue.${n}`}));
 const unlicensed=[...new Set(issues.filter(i=>i.code==='INVALID_ADVERB_TARGET').flatMap(i=>i.cardIds))];
 const nodes=[];
 const walk=(node,parentId)=>{
  if(node.end===node.start)return null;
  const id=`node.${nodes.length}`;
  const record={id,type:node.kind,cardIds:cardIds(node.start,node.end),headCardId:tok(node.head)?.cardInstanceId??null,scopeNodeId:parentId,connector:node.kind==='PP'?tok(node.start).cardInstanceId:null,grammaticalRole:node.npRole??null,children:[]};nodes.push(record);
  record.children=node.children.map(child=>walk(child,id)).filter(Boolean);return id;
 };
 const root={id:'node.root',type:'CLAUSE',cardIds:tokens.map(t=>t.cardInstanceId),headCardId:tok(best.verbIndex).cardInstanceId,scopeNodeId:null,connector:null,children:[]};
 nodes.push(root);root.children=best.chunks.map(chunk=>walk(chunk,root.id)).filter(Boolean);
 const rawHits=best.chunks.flatMap(c=>c.hits);
 const uniqueHits=[...new Map(rawHits.map(h=>[h.evidenceKey,h])).values()];
 const grammarHits=[{id:'hit.mainFrame',tag:registry.frameById[best.internalFrame].tag,frameId:best.frameId,internalFrameId:best.internalFrame,scope:'MAIN_CLAUSE',scopeNodeId:root.id,cardIds:tokens.filter(t=>!unlicensed.includes(t.cardInstanceId)).map(t=>t.cardInstanceId),headCardId:tok(best.verbIndex).cardInstanceId,validity:recovered?'RECOVERED':'VALID',evidenceKey:'MAIN_CLAUSE:FRAME'},
 ...uniqueHits.map((h,i)=>({...h,id:`hit.modifier.${i}`,scope:'PHRASE',scopeNodeId:nodes.find(n=>n.cardIds.length===h.cardIds.length&&n.cardIds.every((id,i)=>id===h.cardIds[i]))?.id??root.id,validity:issues.some(is=>is.cardIds.some(id=>h.cardIds.includes(id)))?'RECOVERED':'VALID'}))];
 const resolvedTokenRoles=[...new Map(best.chunks.flatMap(c=>c.roles).map(r=>[r.cardInstanceId,r])).values()];
 const argumentNode=np=>np?nodes.find(n=>n.type==='NP'&&n.grammaticalRole===np.npRole&&n.headCardId===tok(np.head).cardInstanceId)?.id:null;
 const dativeBinding=tok(best.verbIndex).sense.frameBindings.find(b=>b.frameId==='frame.svoo'&&b.runtimeReady);
 const correspondence=best.internalFrame==='frame.svo'&&dativeBinding?best.suffix.children.find(pp=>pp.kind==='PP'&&pp.preposition===dativeBinding.dativePreposition):null;
 const structures=correspondence?[{kind:'DATIVE_ALTERNATION',preposition:correspondence.preposition,schoolFrameId:'frame.svo',objectNodeId:argumentNode(best.complement),recipientCardIds:cardIds(correspondence.start+1,correspondence.end),ppCardIds:cardIds(correspondence.start,correspondence.end)}]:[];
 return {status:recovered?'VALID_WITH_ISSUES':'VALID',rootNodeId:root.id,mainClauseId:'clause.main',mainFrameId:best.frameId,nodes,
  clauses:[{id:'clause.main',nodeId:root.id,frameId:best.frameId,internalFrameId:best.internalFrame,subjectNodeId:argumentNode(best.subject),verbCardId:tok(best.verbIndex).cardInstanceId,objectNodeId:best.internalFrame==='frame.svo'?argumentNode(best.complement):null,indirectObjectNodeId:argumentNode(best.complement.indirectObject),directObjectNodeId:argumentNode(best.complement.directObject)}],structures,
  resolvedTokenRoles,grammarHits,issues,evidenceMarks:grammarHits.map(h=>({evidenceKey:h.evidenceKey,cardIds:h.cardIds})),
  ambiguities:candidates.length>1?[{type:'EQUIVALENT_FULL_COVERAGE_ANALYSES',candidateCount:candidates.length,normalizedTo:best.frameId,noteKo:'동일 카드의 수식·전치사구는 한 번만 계산합니다.'}]:[],
  coverage:{consumedCardIds:tokens.map(t=>t.cardInstanceId),issueAffectedCardIds:[...new Set(issues.flatMap(i=>i.cardIds))],unlicensedCardIds:unlicensed},
  diagnostics:{workUnits:work,candidateCount:candidates.length,limits:LIMITS},messageKo:recovered?'문장 구조 확인':'완전한 문장!',
 };
}
