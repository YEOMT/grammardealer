/** Only the new language policy adds the required passive-agent support word. */
export function addClause014(base) {
 const data=structuredClone(base);
 Object.assign(data,{languagePolicyVersion:'0.14.0',participialAdjunctPolicy:true});
 Object.assign(data.grammarTags,{'CLAUSE.PARTICIPIAL.ACTIVE':'현재분사 분사구문','CLAUSE.PARTICIPIAL.PASSIVE':'과거분사 분사구문'});
 const id='lex.by.preposition',fid='form.by.base',sid=id+'.sense.basic';
 const note='수동태와 과거분사구문에서 by + 목적격·명사구로 행위자를 나타냅니다. 행위자 표시는 선택 사항입니다.';
 data.lexemes.push({id,lemma:'by',pos:'PREPOSITION',glossKo:'~에 의해',vocabBand:'CORE',introducedVersion:'0.14.0',runtimeReady:true,morphologyId:'morph.by',senseIds:[sid],frameIds:[],formIds:[fid],defaultFormId:fid,usageNoteKo:note});
 // Lexical readiness uses the existing live core capability. Passive structure
 // is checked by the parser; the historical cap.passive flag stays reserved.
 data.senses.push({id:sid,lexemeId:id,glossKo:'~에 의해',frameBindings:[],futureFrameBindings:[],contextualBareRoles:[],runtimeReady:true,requiredCapabilityIds:['cap.present.basic'],usageNoteKo:note});
 data.forms.push({id:fid,formId:fid,lexemeId:id,surface:'by',grammaticalFeatures:{},allowedRoleCandidates:['PREPOSITION'],runtimeReady:true,labelKo:'기본형',requiredCapabilityIds:['cap.present.basic']});
 data.cards.push({id:'card.by',cardKind:'WORD',lexemeId:id,baseScore:10,rarity:'COMMON',displayCategory:'PREPOSITION',runtimeReady:true,starterEligible:false,rewardWeight:1,requiredUnlockId:'pack.passive',availability:{runtimeReady:true,starterEligible:false,rewardWeight:1,requiredUnlockId:'pack.passive'}});
 data.morphologies.push({id:'morph.by',lexemeId:id,formIds:[fid]});
 for(const [rows,key]of [['lexemes','lexemeById'],['senses','senseById'],['forms','formById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=Object.fromEntries(data[rows].map(x=>[x.id,x]));
 data.cardDefinitions=data.cards;return data;
}
