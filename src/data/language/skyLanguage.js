/** Clone the 0.3 vocabulary; old saved runs retain its exact records and ordering. */
export function addSkyLanguage(base) {
 const data=structuredClone(base);
 data.version='0.4.0';
 data.validationScope='sky.0.4';
 for(const card of data.cards){
  card.cardKind='WORD';
  if(['card.be','card.have','card.you','card.i'].includes(card.id))card.rarity='UNCOMMON';
 }
 const add=(lemma,pos,glossKo,rarity,frameIds=[])=>{
  const id=`lex.${lemma}.${pos.toLowerCase()}`,senseId=`${id}.sense.basic`;
  const lex={id,lemma,pos,glossKo,rarity,vocabBand:'CORE',introducedVersion:'0.4.0',runtimeReady:true,morphologyId:`morph.${lemma}`,senseIds:[senseId],frameIds,formIds:[],defaultFormId:`form.${lemma}.${pos==='VERB'?'present':'base'}`,usageNoteKo:pos==='FUNCTION'?'문장에서 실제로 잇는 대상에 따라 단어·구·절 연결을 구분합니다.':'등록된 기본 뜻과 문형에서 판정합니다.'};
  const sense={id:senseId,lexemeId:id,glossKo,frameBindings:frameIds.map(frameId=>({frameId,requiredCapabilityIds:['cap.present.basic'],runtimeReady:true})),futureFrameBindings:[],contextualBareRoles:[],runtimeReady:true,requiredCapabilityIds:['cap.present.basic'],usageNoteKo:lex.usageNoteKo,...(lemma==='know'?{aspectPolicy:{progressive:'ISSUE',code:'ASPECT_USAGE'}}:{})};
  data.lexemes.push(lex);data.senses.push(sense);data.cards.push({id:`card.${lemma}`,cardKind:'WORD',lexemeId:id,baseScore:10,rarity,displayCategory:pos,runtimeReady:true,starterEligible:false,rewardWeight:1,availability:{runtimeReady:true,starterEligible:false,rewardWeight:1}});
  const form=(suffix,surface,features,roles,labelKo)=>{const id=`form.${lemma}.${suffix}`;lex.formIds.push(id);data.forms.push({id,formId:id,lexemeId:lex.id,surface,grammaticalFeatures:features,allowedRoleCandidates:roles,runtimeReady:true,labelKo,requiredCapabilityIds:['cap.present.basic']});};
  if(pos==='FUNCTION')form('base',lemma,{},['CONJUNCTION'],'연결어');
  else {
   const [past,pp]=({think:['thought','thought'],know:['knew','known'],say:['said','said']})[lemma];
   form('present',lemma,{tense:'PRESENT',person:null,number:'NON_3_SINGULAR'},['FINITE_VERB'],'현재 · 기본');form('third',lemma+'s',{tense:'PRESENT',person:3,number:'SINGULAR'},['FINITE_VERB'],'현재 · 3인칭 단수');
   form('past',past,{tense:'PAST'},['FINITE_VERB'],'과거');form('pp',pp,{tense:'PAST_PARTICIPLE'},['PARTICIPLE'],'과거분사 · p.p.');form('ing',lemma+'ing',{tense:'PRESENT_PARTICIPLE'},['PARTICIPLE'],'-ing형');
  }
 };
 data.frames.push({id:'frame.svo.content',schoolFrameId:'frame.svo',tag:'FRAME.SVO',labelKo:'3형식 · 내용절 목적어',requiredSlots:['SUBJECT','FINITE_VERB','CONTENT_CLAUSE'],supportedAdjuncts:['ADVERB','PP'],requiredCapabilityIds:['cap.present.basic'],runtimeReady:true});
 for(const [lemma,gloss]of [['and','그리고'],['but','그러나'],['or','또는']])add(lemma,'FUNCTION',gloss,'COMMON');
 for(const [lemma,gloss]of [['because','~이기 때문에'],['when','~할 때'],['if','만약 ~라면']])add(lemma,'FUNCTION',gloss,'UNCOMMON');
 add('think','VERB','생각하다','COMMON',['frame.sv','frame.svo.content']);add('know','VERB','알다','COMMON',['frame.sv','frame.svo','frame.svo.content']);add('say','VERB','말하다','COMMON',['frame.svo','frame.svo.content']);
 for(const l of data.lexemes.filter(l=>l.lemma==='that')){l.usageNoteKo='지시 한정사·대명사·관계절 연결·내용절 연결을 실제 문장 구조로 구분합니다.';for(const id of l.senseIds){const sense=data.senses.find(s=>s.id===id);sense.usageNoteKo=l.usageNoteKo;}}
 data.capabilities=data.capabilities.map(c=>c.id==='cap.coordination'?{...c,runtimeReady:true}:c);data.capabilities.push({id:'cap.clauseLink',runtimeReady:true});
 data.morphologies=data.lexemes.map(l=>({id:l.morphologyId,lexemeId:l.id,formIds:[...l.formIds]}));
 for(const [rows,key]of [['lexemes','lexemeById'],['senses','senseById'],['frames','frameById'],['forms','formById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=Object.fromEntries(data[rows].map(x=>[x.id,x]));
 data.cardDefinitions=data.cards;
 return data;
}
