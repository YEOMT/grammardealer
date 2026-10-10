/** Bounded auxiliary composition: WILL > perfect HAVE > progressive BE > lexical verb.
 * Surface-compatible forms win inside a chain. Only an independent finite `read`
 * uses the explicit past/present choice to disambiguate its temporal family.
 */
export function verbPhrases(tokens,start,end,{finite=true,tick=()=>{},polish061=false,ember=false,inversionSubject=null,waterways=false}={}) {
 const out=[],token=i=>tokens[i],forms=i=>token(i)?.forms??[];
 const matches=(i,required)=>forms(i).some(f=>required==='BASE'?f.surface.toLowerCase()===token(i).lex.lemma.toLowerCase():f.grammaticalFeatures.tense===required);
 const finiteForm=i=>{
  const t=token(i),selected=forms(i).find(f=>f.id===t.selectionId);
  if(t.lex.lemma==='read'&&selected?.grammaticalFeatures.tense==='PAST')return selected;
  return forms(i).find(f=>['PRESENT','FUTURE','BASE'].includes(f.grammaticalFeatures.tense))??forms(i).find(f=>f.grammaticalFeatures.tense==='PAST');
 };
 function visit(i,rank,required,auxiliaries,aspects,issues,verbIndices=[],adverbIndices=[]){
  tick();if(i>=end||(polish061?verbIndices.length>=4:i-start>=4)||token(i)?.lex.pos!=='VERB')return;
  const t=token(i),first=i===start,form=first&&finite?finiteForm(i):null;
  if(first&&finite&&!form)return;
  const linkOk=first&&finite?true:matches(i,required);
  const previous=polish061?verbIndices.at(-1):i-1;
  const nextIssues=linkOk||first?issues:[...issues,{code:'AUXILIARY_FORM_REQUIRED',indices:[previous,i],causeId:`AUXILIARY_FORM_REQUIRED:${token(previous)?.cardInstanceId}:${t.cardInstanceId}`}];
  // A lexical -ing / p.p. without its finite head cannot stand alone.
  if(t.lex.lemma!=='will'&&!(inversionSubject&&first&&t.lex.lemma==='do'))out.push({start,end:inversionSubject&&first?inversionSubject.end:i+1,lexicalIndex:i,finiteIndex:finite?start:null,auxiliaries,aspects,issues:nextIssues,...(polish061?{verbIndices:[...verbIndices,i],interveningAdverbIndices:[...adverbIndices]}:{}),
   tenseFamily:finite?(token(start).lex.lemma==='will'?'FUTURE':finiteForm(start)?.grammaticalFeatures.tense==='PAST'?'PAST':'PRESENT'):null,
   ...(ember?{voice:auxiliaries.some(a=>a.role==='PASSIVE')?'PASSIVE':'ACTIVE'}:{}),
   futureMarker:auxiliaries.some(a=>a.role==='WILL')?'WILL':null,
   chainWellFormed:!nextIssues.length&&!(finite&&token(start).lex.lemma==='be'&&token(start).surface==='be')});
  const aux=waterways&&inversionSubject&&first&&t.lex.lemma==='do'?['DO',1,'BASE',null]:t.lex.lemma==='will'&&first&&finite&&rank<1?['WILL',1,'BASE',null]
   :t.lex.lemma==='have'&&rank<2?['PERFECT',2,'PAST_PARTICIPLE','PERFECT']
   :t.lex.lemma==='be'&&rank<3?['PROGRESSIVE',3,'PRESENT_PARTICIPLE','PROGRESSIVE']:null;
  for(const choice of [aux,...(ember&&t.lex.lemma==='be'&&rank<4?[['PASSIVE',4,'PAST_PARTICIPLE',null]]:[])].filter(Boolean)){
   let next=inversionSubject&&first?inversionSubject.end:i+1;const between=[];
   if(polish061)while(next<end&&token(next)?.lex.pos==='ADVERB'&&token(next).senses.some(s=>s.adverbPolicy?.auxiliaryPositions?.includes('AFTER_AUXILIARY'))){tick();between.push(next++);}
   visit(next,choice[1],choice[2],[...auxiliaries,{index:i,role:choice[0]}],choice[3]?[...aspects,choice[3]]:aspects,nextIssues,[...verbIndices,i],[...adverbIndices,...between]);
  }
 }
 visit(start,0,'BASE',[],[],[]);return out;
}
