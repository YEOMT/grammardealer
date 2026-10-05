/** Bounded auxiliary composition: WILL > perfect HAVE > progressive BE > lexical verb.
 * Surface-compatible forms win inside a chain. Only an independent finite `read`
 * uses the explicit past/present choice to disambiguate its temporal family.
 */
export function verbPhrases(tokens,start,end,{finite=true,tick=()=>{}}={}) {
 const out=[],token=i=>tokens[i],forms=i=>token(i)?.forms??[];
 const matches=(i,required)=>forms(i).some(f=>required==='BASE'?f.surface.toLowerCase()===token(i).lex.lemma.toLowerCase():f.grammaticalFeatures.tense===required);
 const finiteForm=i=>{
  const t=token(i),selected=forms(i).find(f=>f.id===t.selectionId);
  if(t.lex.lemma==='read'&&selected?.grammaticalFeatures.tense==='PAST')return selected;
  return forms(i).find(f=>['PRESENT','FUTURE','BASE'].includes(f.grammaticalFeatures.tense))??forms(i).find(f=>f.grammaticalFeatures.tense==='PAST');
 };
 function visit(i,rank,required,auxiliaries,aspects,issues){
  tick();if(i>=end||i-start>=4||token(i)?.lex.pos!=='VERB')return;
  const t=token(i),first=i===start,form=first&&finite?finiteForm(i):null;
  if(first&&finite&&!form)return;
  const linkOk=first&&finite?true:matches(i,required);
  const nextIssues=linkOk||first?issues:[...issues,{code:'AUXILIARY_FORM_REQUIRED',indices:[i-1,i],causeId:`AUXILIARY_FORM_REQUIRED:${token(i-1)?.cardInstanceId}:${t.cardInstanceId}`}];
  // A lexical -ing / p.p. without its finite head cannot stand alone.
  if(t.lex.lemma!=='will')out.push({start,end:i+1,lexicalIndex:i,finiteIndex:finite?start:null,auxiliaries,aspects,issues:nextIssues,
   tenseFamily:finite?(token(start).lex.lemma==='will'?'FUTURE':finiteForm(start)?.grammaticalFeatures.tense==='PAST'?'PAST':'PRESENT'):null,
   futureMarker:auxiliaries.some(a=>a.role==='WILL')?'WILL':null,
   chainWellFormed:!nextIssues.length&&!(finite&&token(start).lex.lemma==='be'&&token(start).surface==='be')});
  const aux=t.lex.lemma==='will'&&first&&finite&&rank<1?['WILL',1,'BASE',null]
   :t.lex.lemma==='have'&&rank<2?['PERFECT',2,'PAST_PARTICIPLE','PERFECT']
   :t.lex.lemma==='be'&&rank<3?['PROGRESSIVE',3,'PRESENT_PARTICIPLE','PROGRESSIVE']:null;
  if(aux)visit(i+1,aux[1],aux[2],[...auxiliaries,{index:i,role:aux[0]}],aux[3]?[...aspects,aux[3]]:aspects,nextIssues);
 }
 visit(start,0,'BASE',[],[],[]);return out;
}
