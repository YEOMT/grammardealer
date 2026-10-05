/** Serialize the parser's constituent tree. No token insertion, state, unlocks or arithmetic. */
export function skyEvidence(best,{tokens,registry,candidateCount,workUnits,limits}){
 const ids=(start,end)=>tokens.slice(start,end).map(t=>t.cardInstanceId),at=i=>tokens[i]?.cardInstanceId??null;
 const issues=[...new Map(best.issues.map(i=>[i.causeId,i])).values()].map((i,n)=>({...i,id:`issue.${n}`}));
 const unlicensed=[...new Set(issues.filter(i=>i.code==='INVALID_ADVERB_TARGET').flatMap(i=>i.cardIds))],recovered=issues.length>0;
 const nodes=[],clauses=[],vpRows=[],sourceNodes=new Map(),clauseSources=new Map();
 const mainVerb=best.verbIndex;
 function walk(node,parentId=null,parentClauseId=null,level=0,inheritedRole='MAIN'){
  if(node.end===node.start)return null;
  const id=`node.${nodes.length}`,connector=node.connectorIndex===undefined?null:at(node.connectorIndex);
  const record={id,type:node.kind,cardIds:ids(node.start,node.end),headCardId:at(node.head),scopeNodeId:parentId,connector,grammaticalRole:node.npRole??null,children:[],...(node.linkRole?{linkRole:node.linkRole}:{}),...(node.features?{grammaticalFeatures:node.features}:{}),...(node.gapRole?{gapRole:node.gapRole,antecedentCardId:at(node.antecedentHead)}:{})};
  nodes.push(record);sourceNodes.set(node,id);let clauseId=parentClauseId,nextLevel=level;
  if(node.clauseData){const c=node.clauseData,isMain=c.verbIndex===mainVerb&&!clauses.some(x=>x.id==='clause.main');clauseId=isMain?'clause.main':`clause.${clauses.length}`;
   const clause={id:clauseId,nodeId:id,parentClauseId,level,role:isMain?'MAIN':node.clauseRole&&node.clauseRole!=='MAIN'?node.clauseRole:inheritedRole,frameId:c.frameId,internalFrameId:c.internalFrame,verbCardId:at(c.verbIndex),subjectNodeId:null,objectNodeId:null,indirectObjectNodeId:null,directObjectNodeId:null};clauses.push(clause);clauseSources.set(clause,c);record.clauseId=clauseId;nextLevel=level+1;
  }
  if(node.verbPhrase)vpRows.push({node:record,vp:node.verbPhrase,clauseId});
  if(node.kind==='ADVERBIAL_CONNECTION'){
   const dependent=node.children.find(c=>c.clauseRole==='ADVERBIAL'),matrix=node.children.find(c=>c!==dependent&&c.kind!=='CONNECTOR'),before=clauses.length,matrixId=walk(matrix,id,clauseId,nextLevel,node.childClauseRole??inheritedRole),matrixClause=clauses[before];
   record.children=node.children.map(child=>child===matrix?matrixId:walk(child,id,child===dependent?matrixClause.id:clauseId,child===dependent?matrixClause.level+1:nextLevel,node.childClauseRole??inheritedRole)).filter(Boolean);
  }else record.children=(node.children??[]).map(child=>walk(child,id,clauseId,nextLevel,node.childClauseRole??inheritedRole)).filter(Boolean);return id;
 }
 const rootNodeId=walk(best.tree),main=clauses.find(c=>c.id==='clause.main');
 const argumentNode=(p,role)=>p?(sourceNodes.get(p)??nodes.find(n=>n.grammaticalRole===(role??p.npRole)&&n.headCardId===at(p.head)&&n.cardIds.length===p.end-p.start)?.id??null):null;
 for(const [c,source]of clauseSources){c.subjectNodeId=argumentNode(source.subject);c.objectNodeId=source.frameId==='frame.svo'?argumentNode(source.complement,'OBJECT'):null;c.indirectObjectNodeId=argumentNode(source.complement?.indirectObject);c.directObjectNodeId=argumentNode(source.complement?.directObject);}
 if(!main)throw Error('Missing primary clause evidence');
 const rawHits=best.tree.hits??[],uniqueHits=[...new Map(rawHits.map(h=>[h.evidenceKey,h])).values()];
 const validity=cardIds=>issues.some(i=>i.cardIds.some(id=>cardIds.includes(id)))?'RECOVERED':'VALID';
 const grammarHits=[{id:'hit.mainFrame',tag:registry.frameById[best.internalFrame].tag,frameId:best.frameId,internalFrameId:best.internalFrame,comboImplemented:registry.frameById[best.internalFrame].comboImplemented!==false,scope:'MAIN_CLAUSE',scopeNodeId:main.nodeId,cardIds:nodes.find(n=>n.id===main.nodeId).cardIds.filter(id=>!unlicensed.includes(id)),headCardId:at(mainVerb),validity:recovered?'RECOVERED':'VALID',evidenceKey:'MAIN_CLAUSE:FRAME'},
 ...uniqueHits.map((h,i)=>{const node=nodes.find(n=>n.cardIds.length===h.cardIds.length&&n.cardIds.every((id,i)=>id===h.cardIds[i])&&(!h.linkRole||n.linkRole===h.linkRole));return {...h,id:`hit.structure.${i}`,scope:h.tag==='LINK.CLAUSE'?'CLAUSE':'PHRASE',scopeNodeId:node?.id??rootNodeId,linkNodeId:h.linkRole?node?.id:null,...(h.linkRole?{connectedNodeIds:h.linkRole==='CONTENT_CLAUSE'?[node?.scopeNodeId,...(node?.children??[])].filter(Boolean):(node?.children??[]).filter(id=>nodes.find(n=>n.id===id)?.type!=='CONNECTOR'),clauseIds:clauses.filter(c=>h.cardIds.some(id=>nodes.find(n=>n.id===c.nodeId)?.cardIds.includes(id))).map(c=>c.id)}:{}),validity:validity(h.cardIds)};})];
 const verbPhrases=vpRows.map(({node,vp,clauseId},i)=>({id:`vp.${i}`,clauseId,nodeId:node.id,cardIds:node.cardIds,range:[vp.start,vp.end],finiteCardId:vp.finiteIndex===null?null:at(vp.finiteIndex),lexicalVerbCardId:at(vp.lexicalIndex),auxiliaries:vp.auxiliaries.map(a=>({cardInstanceId:at(a.index),role:a.role})),tenseFamily:vp.tenseFamily,aspects:vp.aspects,futureMarker:vp.futureMarker,chainWellFormed:vp.chainWellFormed,temporalEvidenceEligible:vp.finiteIndex!==null&&vp.chainWellFormed,issueIds:issues.filter(x=>['AUXILIARY_FORM_REQUIRED','ASPECT_USAGE'].includes(x.code)&&x.cardIds.some(id=>node.cardIds.includes(id))).map(x=>x.id)}));
 for(const c of clauses){const vps=verbPhrases.filter(v=>v.clauseId===c.id);c.finiteVerbCardIds=vps.map(v=>v.finiteCardId).filter(Boolean);c.temporalEvidenceIds=vps.filter(v=>v.temporalEvidenceEligible).map(v=>v.id);}
 for(const vp of verbPhrases.filter(v=>v.temporalEvidenceEligible))for(const tag of [...(vp.tenseFamily==='PAST'?['TIME.PAST']:[]),...vp.aspects.filter(a=>a!=='PROGRESSIVE'||!issues.some(i=>i.code==='ASPECT_USAGE'&&i.cardIds.includes(vp.lexicalVerbCardId))).map(a=>`TIME.${a}`),...(vp.futureMarker==='WILL'?['TIME.FUTURE_WILL']:[])])grammarHits.push({id:`hit.${vp.id}.${tag}`,tag,scope:'CLAUSE',scopeNodeId:vp.nodeId,cardIds:vp.cardIds,validity:'VALID',evidenceKey:`${tag}:${vp.id}`});
 const roles=[...new Map((best.tree.roles??[]).map(r=>[r.cardInstanceId,r])).values()];
 const structures=[];
 const binding=tokens[mainVerb].senses.flatMap(s=>s.frameBindings).find(b=>b.frameId==='frame.svoo'&&b.runtimeReady);
 const pp=best.internalFrame==='frame.svo'&&binding?best.suffix?.children.find(p=>p.kind==='PP'&&p.preposition===binding.dativePreposition):null;
 if(pp)structures.push({kind:'DATIVE_ALTERNATION',preposition:pp.preposition,schoolFrameId:'frame.svo',objectNodeId:argumentNode(best.complement),recipientCardIds:ids(pp.start+1,pp.end),ppCardIds:ids(pp.start,pp.end)});
 return {status:recovered?'VALID_WITH_ISSUES':'VALID',rootNodeId,mainClauseId:'clause.main',mainScoreClauseId:'clause.main',primaryScoringClauseId:'clause.main',mainFrameId:best.frameId,nodes,clauses,structures,resolvedTokenRoles:roles,grammarHits,issues,verbPhrases,evidenceMarks:grammarHits.map(h=>({evidenceKey:h.evidenceKey,cardIds:h.cardIds})),ambiguities:candidateCount>1?[{type:'EQUIVALENT_FULL_COVERAGE_ANALYSES',candidateCount,normalizedTo:best.frameId,selectionPolicy:'fewest-issues/outer-coordination/registered-content/fixed-school-frame',noteKo:'같은 카드를 모두 설명하는 문법 분석 중 고정된 구조 우선순위를 사용합니다.'}]:[],coverage:{consumedCardIds:tokens.map(t=>t.cardInstanceId),issueAffectedCardIds:[...new Set(issues.flatMap(i=>i.cardIds))],unlicensedCardIds:unlicensed},diagnostics:{workUnits,candidateCount,limits},messageKo:recovered?'문장 구조 확인':'완전한 문장!'};
}
