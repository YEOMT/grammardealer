/** Versioned, reviewed nonfinite valencies. Never mutate the 0.4 content view. */
export const isIngForm=form=>form?.morphologicalForm==='ING'||form?.grammaticalFeatures?.tense==='PRESENT_PARTICIPLE';
export function addDesertLanguage(base){
 const data=structuredClone(base),index=rows=>Object.fromEntries(rows.map(x=>[x.id,x]));
 data.version='0.5.0';data.validationScope='desert.0.5';
 for(const f of data.forms)if(isIngForm(f)){f.morphologicalForm='ING';f.labelKo='-ing형';}
 const add=(lemma,pos,glossKo)=>{
  const id=`lex.${lemma}.${pos.toLowerCase()}`,senseId=`${id}.sense.basic`,verb=pos==='VERB';
  const lex={id,lemma,pos,glossKo,vocabBand:'CORE',introducedVersion:'0.5.0',runtimeReady:true,morphologyId:`morph.${lemma}`,senseIds:[senseId],frameIds:verb?['frame.svo','frame.svo.gerund']:[],formIds:[],defaultFormId:`form.${lemma}.${verb?'present':'singular'}`,usageNoteKo:verb?`${lemma} 뒤에는 명사나 동명사(-ing)를 씁니다.`:'취미를 나타내는 셀 수 있는 명사입니다.'};
  data.lexemes.push(lex);data.senses.push({id:senseId,lexemeId:id,glossKo,countability:verb?null:'COUNT',semanticTags:verb?[]:['ACTIVITY_NAME'],referent:verb?null:'ACTIVITY_NAME',frameBindings:lex.frameIds.map(frameId=>({frameId,runtimeReady:true,requiredCapabilityIds:['cap.present.basic']})),futureFrameBindings:[],contextualBareRoles:[],runtimeReady:true,requiredCapabilityIds:['cap.present.basic'],usageNoteKo:lex.usageNoteKo});
  data.cards.push({id:`card.${lemma}`,cardKind:'WORD',lexemeId:id,baseScore:10,rarity:'COMMON',displayCategory:pos,runtimeReady:true,starterEligible:false,rewardWeight:1,availability:{runtimeReady:true,starterEligible:false,rewardWeight:1}});
  const form=(suffix,surface,features,roles,labelKo)=>{const fid=`form.${lemma}.${suffix}`;lex.formIds.push(fid);data.forms.push({id:fid,formId:fid,lexemeId:id,surface,grammaticalFeatures:features,allowedRoleCandidates:roles,runtimeReady:true,labelKo,requiredCapabilityIds:['cap.present.basic'],...(suffix==='ing'?{morphologicalForm:'ING'}:{})});};
  if(verb){form('present',lemma,{tense:'PRESENT',person:null,number:'NON_3_SINGULAR'},['FINITE_VERB'],'현재 · 기본');form('third',lemma==='finish'?'finishes':'enjoys',{tense:'PRESENT',person:3,number:'SINGULAR'},['FINITE_VERB'],'현재 · 3인칭 단수');form('past',lemma+'ed',{tense:'PAST'},['FINITE_VERB'],'과거');form('pp',lemma+'ed',{tense:'PAST_PARTICIPLE'},['PARTICIPLE'],'과거분사 · p.p.');form('ing',lemma+'ing',{tense:'PRESENT_PARTICIPLE'},['PARTICIPLE'],'-ing형');}
  else {form('singular',lemma,{number:'SINGULAR',countability:'COUNT'},['NOUN_HEAD'],'단수');form('plural','hobbies',{number:'PLURAL',countability:'COUNT'},['NOUN_HEAD'],'복수');}
 };
 data.frames.push({id:'frame.svo.gerund',schoolFrameId:'frame.svo',tag:'FRAME.SVO',labelKo:'3형식 · 동명사 목적어',requiredSlots:['SUBJECT','FINITE_VERB','GERUND'],supportedAdjuncts:['ADVERB','PP'],requiredCapabilityIds:['cap.present.basic'],runtimeReady:true,comboImplemented:true});
 for(const [lemma,pos,gloss]of [['enjoy','VERB','즐기다'],['finish','VERB','마치다'],['hobby','NOUN','취미']])if(!data.lexemes.some(l=>l.lemma===lemma))add(lemma,pos,gloss);
 for(const lemma of ['like','need']){
  const lex=data.lexemes.find(l=>l.lemma===lemma),basic=data.senses.find(s=>s.id===lex.senseIds[0]),id=`${lex.id}.sense.gerund`;
  lex.senseIds.push(id);lex.frameIds.push('frame.svo.gerund');data.senses.push({...structuredClone(basic),id,frameBindings:[{frameId:'frame.svo.gerund',runtimeReady:true,requiredCapabilityIds:['cap.present.basic'],...(lemma==='need'?{nonfiniteObjectGap:true}:{})}],futureFrameBindings:[],usageNoteKo:lemma==='need'?"need + -ing는 '~될 필요가 있다'의 뜻으로도 씁니다.":'like 뒤에는 to부정사나 동명사를 씁니다.'});
 }
 for(const frame of data.frames)if(frame.tag==='FRAME.SVOC')frame.comboImplemented=true;
 const notes={to:'to는 명사구 앞의 전치사 또는 동사 원형 앞의 부정사 표지로 쓰입니다. 문장 구조로 구분합니다.',want:'want + to부정사, want + 목적어 + to부정사를 씁니다.',need:"need + to부정사, need + 목적어 + to부정사를 씁니다. need + -ing는 '~될 필요가 있다'의 뜻으로도 씁니다.",like:'like 뒤에는 명사·to부정사·동명사를 쓰거나 목적어 + to부정사를 쓸 수 있습니다.',enjoy:'enjoy 뒤에는 동명사(-ing)를 씁니다. 명사 목적어도 사용할 수 있습니다.',finish:'finish 뒤에는 명사나 동명사(-ing)를 씁니다.'};
 for(const lex of data.lexemes){if(['happy','ready','easy'].includes(lex.lemma))for(const s of data.senses.filter(s=>s.lexemeId===lex.id))s.infinitiveComplement=true;
  if(notes[lex.lemma]){lex.usageNoteKo=notes[lex.lemma];for(const s of data.senses.filter(s=>s.lexemeId===lex.id))s.usageNoteKo=notes[lex.lemma];}
 }
 data.capabilities=data.capabilities.map(c=>['cap.infinitive','cap.gerund','cap.svoc'].includes(c.id)?{...c,runtimeReady:true}:c);
 data.morphologies=data.lexemes.map(l=>({id:l.morphologyId,lexemeId:l.id,formIds:[...l.formIds]}));
 for(const[rows,key]of [['lexemes','lexemeById'],['senses','senseById'],['frames','frameById'],['forms','formById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=index(data[rows]);
 data.cardDefinitions=data.cards;return data;
}
