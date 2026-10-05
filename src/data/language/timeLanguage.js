// A versioned content view. The 0.2.2 registry is never mutated.
export const TIME_PACKS = Object.freeze(['pack.time.past','pack.time.progressive','pack.time.perfect','pack.time.futureWill']);
const pastParticiples={be:'been',have:'had',do:'done',go:'gone',come:'come',run:'run',eat:'eaten',read:'read',make:'made',give:'given',see:'seen',feel:'felt',become:'become',take:'taken',keep:'kept',find:'found',show:'shown',send:'sent'};
export const BOTH_NOUNS=Object.freeze(['technology','culture','time','food','room']);
export function addTimeLanguage(base) {
 const data=structuredClone(base),index=rows=>Object.fromEntries(rows.map(x=>[x.id,x]));
 const addForm=(lex,suffix,surface,features,roles,labelKo)=>{
  const id=`form.${lex.lemma.toLowerCase()}.${suffix}`;
  data.forms.push({id,formId:id,lexemeId:lex.id,surface,grammaticalFeatures:features,allowedRoleCandidates:roles,runtimeReady:true,labelKo,requiredCapabilityIds:['cap.present.basic']});
  lex.formIds.push(id);
 };
 for(const lex of data.lexemes){
  if(lex.pos==='VERB'){
   for(const id of lex.formIds){const f=data.forms.find(f=>f.id===id);f.runtimeReady=true;
    if(f.grammaticalFeatures.tense==='PAST')f.labelKo='과거';
    if(id.endsWith('.ing')){f.surface=lex.lemma==='like'?'liking':f.surface;f.grammaticalFeatures.tense='PRESENT_PARTICIPLE';f.labelKo='진행형 · -ing';}
   }
   const past=data.forms.find(f=>f.lexemeId===lex.id&&f.grammaticalFeatures.tense==='PAST');
   addForm(lex,'pp',pastParticiples[lex.lemma]??past.surface,{tense:'PAST_PARTICIPLE'},['PARTICIPLE'],'과거분사 · p.p.');
  }
  if(lex.pos==='NOUN'&&BOTH_NOUNS.includes(lex.lemma)){
   for(const sense of data.senses.filter(s=>s.lexemeId===lex.id))sense.countability='BOTH';
   for(const form of data.forms.filter(f=>f.lexemeId===lex.id))form.grammaticalFeatures.countability='BOTH';
   if(!lex.formIds.some(id=>id.endsWith('.plural')))addForm(lex,'plural',/y$/.test(lex.lemma)?lex.lemma.slice(0,-1)+'ies':lex.lemma+'s',{number:'PLURAL',countability:'BOTH'},['NOUN_HEAD'],'복수 · 종류/개별 사례');
  }
 }
 const will={id:'lex.will.verb',lemma:'will',pos:'VERB',glossKo:'~할 것이다',vocabBand:'CORE',introducedVersion:'0.3.0',runtimeReady:true,morphologyId:'morph.will',senseIds:['lex.will.verb.sense.basic'],frameIds:[],formIds:[],defaultFormId:'form.will.base',usageNoteKo:'will 뒤에는 동사 원형을 씁니다. 미래를 나타내는 조동사입니다.'};
 addForm(will,'base','will',{tense:'FUTURE',auxiliary:true},['FINITE_VERB','AUXILIARY'],'미래 · will');data.lexemes.push(will);
 data.senses.push({id:will.senseIds[0],lexemeId:will.id,glossKo:will.glossKo,frameBindings:[],futureFrameBindings:[],contextualBareRoles:[],requiredCapabilityIds:['cap.futureWill'],runtimeReady:true,usageNoteKo:will.usageNoteKo});
 data.cards.push({id:'card.will',lexemeId:will.id,baseScore:10,rarity:'UNCOMMON',displayCategory:'VERB',availability:{runtimeReady:true,starterEligible:false,rewardWeight:1},runtimeReady:true,starterEligible:false,rewardWeight:1});
 data.morphologies=data.lexemes.map(l=>({id:l.morphologyId,lexemeId:l.id,formIds:[...l.formIds]}));
 data.capabilities=data.capabilities.map(c=>['cap.past','cap.progressive','cap.perfect'].includes(c.id)?{...c,runtimeReady:true}:c);
 data.capabilities.push({id:'cap.futureWill',runtimeReady:true});
 data.version='0.3.0';data.validationScope='time.0.3';
 for(const[rows,key]of [['lexemes','lexemeById'],['senses','senseById'],['frames','frameById'],['forms','formById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=index(data[rows]);
 data.cardDefinitions=data.cards;return data;
}
