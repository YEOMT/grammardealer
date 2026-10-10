/** Reviewed lexical classes and valency, never complete sentence answers. */
export const WATERWAYS_PACKS=['pack.relative','pack.relativeAdverb'];
export const WATERWAYS_REWARD_PACK='pack.waterwaysWords.reward';
export function addWaterwaysLanguage(base){
 const data=structuredClone(base);data.version='0.8.0';data.validationScope='waterways.0.8';
 for(const [lemma,gloss,note]of [
  ['who','누구·~하는 사람','사람과 반려동물을 받는 관계사 또는 사람을 묻는 의문사입니다. 역할은 문장 안에서 정해집니다.'],
  ['which','어느·~하는 것','사물·동물을 받는 관계사 또는 선택을 묻는 의문사입니다. which 뒤에 명사를 둘 수도 있습니다.'],
  ['where','어디·~하는 곳','장소 선행사를 받는 관계부사 또는 장소를 묻는 의문사입니다. 직접목적어를 대신하지 않습니다.'],
 ]){
  const id=`lex.${lemma}.function`,fid=`form.${lemma}.base`,sid=`${id}.sense.basic`;
  data.lexemes.push({id,lemma,pos:'FUNCTION',glossKo:gloss,vocabBand:'CORE',introducedVersion:'0.8.0',runtimeReady:true,morphologyId:`morph.${lemma}`,senseIds:[sid],frameIds:[],formIds:[fid],defaultFormId:fid,usageNoteKo:note});
  data.senses.push({id:sid,lexemeId:id,glossKo:gloss,frameBindings:[],futureFrameBindings:[],contextualBareRoles:[],runtimeReady:true,requiredCapabilityIds:['cap.relative'],usageNoteKo:note});
  data.forms.push({id:fid,formId:fid,lexemeId:id,surface:lemma,grammaticalFeatures:{},allowedRoleCandidates:['RELATIVE_MARKER','QUESTION_MARKER'],runtimeReady:true,labelKo:'기본형',requiredCapabilityIds:['cap.relative']});
  data.cards.push({id:`card.${lemma}`,cardKind:'WORD',lexemeId:id,baseScore:10,rarity:'UNCOMMON',displayCategory:'FUNCTION',runtimeReady:true,starterEligible:false,rewardWeight:1,requiredUnlockId:WATERWAYS_REWARD_PACK,availability:{runtimeReady:true,starterEligible:false,rewardWeight:1,requiredUnlockId:WATERWAYS_REWARD_PACK}});
 }
 const people=new Set(['friend','teacher','student','child','person','man','woman','boy','girl']),animals=new Set(['dog','cat']);
 const places=new Set(['school','home','room','park','environment']),times=new Set(['day','time','year','morning','night']);
 for(const lex of data.lexemes){
  if(lex.pos==='NOUN')lex.relativeAntecedentClass=people.has(lex.lemma)?'PERSON':animals.has(lex.lemma)?'ANIMAL':places.has(lex.lemma)?'PLACE':times.has(lex.lemma)?'TIME':'THING';
  if(lex.pos==='VERB'&&['know','see','show','say'].includes(lex.lemma)){
   const basic=data.senses.find(s=>s.id===lex.senseIds[0]);
   for(const frameId of ['frame.svo.wh',...(lex.lemma==='show'?['frame.svoo.wh']:[])]){
    const id=`${lex.id}.sense.${frameId.split('.').slice(1).join('.')}`;
    lex.senseIds.push(id);lex.frameIds.push(frameId);
    data.senses.push({...structuredClone(basic),id,frameBindings:[{frameId,runtimeReady:true,requiredCapabilityIds:['cap.question']}],futureFrameBindings:[],curation:'WATERWAYS_WH_REVIEWED'});
   }
  }
 }
 for(const schoolFrameId of ['frame.svo','frame.svoo'])data.frames.push({id:`${schoolFrameId}.wh`,schoolFrameId,tag:schoolFrameId==='frame.svo'?'FRAME.SVO':'FRAME.SVOO',runtimeReady:true,comboImplemented:true,requiredCapabilityIds:['cap.question'],requiredSlots:['SUBJECT','FINITE_VERB','QUESTION_CONTENT'],supportedAdjuncts:['ADVERB','PP']});
 data.capabilities=data.capabilities.filter(c=>!['cap.relative','cap.relativeAdverb','cap.question'].includes(c.id));
 data.capabilities.push(...['cap.relative','cap.relativeAdverb','cap.question'].map(id=>({id,runtimeReady:true})));
 data.morphologies=data.lexemes.map(l=>({id:l.morphologyId,lexemeId:l.id,formIds:[...l.formIds]}));
 for(const [rows,key]of [['lexemes','lexemeById'],['senses','senseById'],['frames','frameById'],['forms','formById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=Object.fromEntries(data[rows].map(x=>[x.id,x]));
 data.cardDefinitions=data.cards;return data;
}
