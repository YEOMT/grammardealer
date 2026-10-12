import {LIBRARY_CONFIRMED,LIBRARY_INITIAL,LIBRARY_REWARD_PACK} from '../libraryPolicy.js';
/** Reviewed valency/lexical data. No full-sentence answers or scoring rules. */
export const EXTRAPOSITION_PREDICATES=Object.freeze({good:['TO','THAT'],important:['TO','THAT'],bad:['TO','THAT'],easy:['TO'],hard:['TO'],difficult:['TO']});
export function addLibraryLanguage(base){
 const data=structuredClone(base);data.version='0.9.0';data.validationScope='library.0.9';
 for(const [lemma,gloss,note]of [['what','~하는 것','선행사를 포함한 what절이 주어·목적어·보어 역할을 합니다.'],['whether','~인지 아닌지','검수된 동사 뒤에서 whether + 주어 + 동사의 간접의문문을 만듭니다.']]){
  if(data.lexemes.some(l=>l.lemma===lemma))throw Error('Duplicate library lexeme');
  const id=`lex.${lemma}.function`,fid=`form.${lemma}.base`,sid=id+'.sense.basic';
  data.lexemes.push({id,lemma,pos:'FUNCTION',glossKo:gloss,vocabBand:'CORE',introducedVersion:'0.9.0',runtimeReady:true,morphologyId:`morph.${lemma}`,senseIds:[sid],frameIds:[],formIds:[fid],defaultFormId:fid,usageNoteKo:note});
  data.senses.push({id:sid,lexemeId:id,glossKo:gloss,frameBindings:[],futureFrameBindings:[],contextualBareRoles:[],runtimeReady:true,requiredCapabilityIds:['cap.nominal'],usageNoteKo:note});
  data.forms.push({id:fid,formId:fid,lexemeId:id,surface:lemma,grammaticalFeatures:{},allowedRoleCandidates:['NOMINAL_MARKER'],runtimeReady:true,labelKo:'기본형',requiredCapabilityIds:['cap.nominal']});
  data.cards.push({id:`card.${lemma}`,cardKind:'WORD',lexemeId:id,baseScore:10,rarity:LIBRARY_INITIAL.newWordRarity,displayCategory:'FUNCTION',runtimeReady:true,starterEligible:false,rewardWeight:1,requiredUnlockId:LIBRARY_REWARD_PACK,availability:{runtimeReady:true,starterEligible:false,rewardWeight:1,requiredUnlockId:LIBRARY_REWARD_PACK}});
 }
 for(const card of data.cards){const lemma=data.lexemes.find(l=>l.id===card.lexemeId).lemma;if(LIBRARY_CONFIRMED.wordRarity[lemma])card.rarity=LIBRARY_CONFIRMED.wordRarity[lemma];}
 data.capabilities.push({id:'cap.nominal',runtimeReady:true},{id:'cap.extraposition',runtimeReady:true});
 data.morphologies=data.lexemes.map(l=>({id:l.morphologyId,lexemeId:l.id,formIds:[...l.formIds]}));
 for(const [rows,key]of [['lexemes','lexemeById'],['senses','senseById'],['frames','frameById'],['forms','formById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=Object.fromEntries(data[rows].map(x=>[x.id,x]));
 data.cardDefinitions=data.cards;return data;
}
