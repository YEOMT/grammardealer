/** The one reviewed secondary lexeme is not a second card or a selectable mode. */
export function addHelpUsage(base) {
 const data=structuredClone(base),id='lex.help.noun',formId='form.help.noun.base',senseId=id+'.sense.basic';
 const lex={id,lemma:'help',pos:'NOUN',glossKo:'도움',vocabBand:'CORE',runtimeReady:true,secondaryOnly:true,relativeAntecedentClass:'THING',morphologyId:'morph.help.noun',senseIds:[senseId],frameIds:[],formIds:[formId],defaultFormId:formId,usageNoteKo:'불가산명사 도움. 기본형 help만 이 용법을 가집니다.'};
 const form={id:formId,formId,lexemeId:id,surface:'help',grammaticalFeatures:{number:'SINGULAR',countability:'MASS'},allowedRoleCandidates:['NOUN_HEAD'],runtimeReady:true,labelKo:'명사 · 도움',requiredCapabilityIds:['cap.present.basic']};
 const sense={id:senseId,lexemeId:id,glossKo:'도움',countability:'MASS',referent:'THING',semanticTags:['THING'],frameBindings:[],futureFrameBindings:[],contextualBareRoles:[],runtimeReady:true,requiredCapabilityIds:['cap.present.basic'],usageNoteKo:lex.usageNoteKo,curation:'HELP_DUAL_USAGE_0.8.1'};
 data.lexemes.push(lex);data.forms.push(form);data.senses.push(sense);data.morphologies.push({id:lex.morphologyId,lexemeId:id,formIds:[formId]});
 const card=data.cards.find(c=>c.id==='card.help');card.secondaryLexemeIds=[id];
 // Acquisition filters operate on the existing single physical definition.
 card.starterEligible=false;card.shopEligible=false;card.availability={...card.availability,starterEligible:false,shopEligible:false};
 for(const [rows,key]of [['lexemes','lexemeById'],['forms','formById'],['senses','senseById'],['morphologies','morphologyById'],['cards','cardById']])data[key]=Object.fromEntries(data[rows].map(x=>[x.id,x]));
 data.cardDefinitions=data.cards;return data;
}
