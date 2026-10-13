import {CORRIDOR_PACK} from '../corridorPolicy.js';
/** Versioned morphology. Neither a sentence whitelist nor a grammar shortcut. */
export function addCorridorLanguage(base){
 const data=structuredClone(base);data.version='0.10.0';data.validationScope='corridor.0.10';
 const will=data.lexemes.find(l=>l.lemma==='will');
 const add=(lex,suffix,surface,labelKo)=>{const id=`form.${lex.lemma}.${suffix}`;data.forms.push({id,formId:id,lexemeId:lex.id,surface,grammaticalFeatures:{tense:'MODAL',modal:surface,auxiliary:true},allowedRoleCandidates:['FINITE_VERB','AUXILIARY'],runtimeReady:true,labelKo,requiredCapabilityIds:['cap.modal']});lex.formIds.push(id);};
 will.usageNoteKo='will은 미래, would는 문맥에 따라 가정·가능성 등을 나타냅니다. 뒤에는 원형을 쓰며 would만으로 가정법이 되지 않습니다.';
 add(will,'would','would','would · 가정·가능성');
 const can={id:'lex.can.verb',lemma:'can',pos:'VERB',glossKo:'~할 수 있다',vocabBand:'CORE',introducedVersion:'0.10.0',runtimeReady:true,morphologyId:'morph.can',senseIds:['lex.can.verb.sense.basic'],frameIds:[],formIds:[],defaultFormId:'form.can.base',usageNoteKo:'can/could 뒤에는 동사 원형을 씁니다. could는 과거 능력·가능성·가정 등 여러 용법이 있으며 그 형태만으로 과거·가정법 점수를 주지 않습니다.'};
 add(can,'base','can','can · 능력·가능성');add(can,'could','could','could · 능력·가능성·가정');data.lexemes.push(can);
 data.senses.push({id:can.senseIds[0],lexemeId:can.id,glossKo:can.glossKo,frameBindings:[],futureFrameBindings:[],contextualBareRoles:[],runtimeReady:true,requiredCapabilityIds:['cap.modal'],usageNoteKo:can.usageNoteKo});
 data.cards.push({id:'card.can',cardKind:'WORD',lexemeId:can.id,baseScore:10,rarity:'UNCOMMON',displayCategory:'VERB',runtimeReady:true,starterEligible:false,rewardWeight:1,requiredUnlockId:CORRIDOR_PACK,availability:{runtimeReady:true,starterEligible:false,rewardWeight:1,requiredUnlockId:CORRIDOR_PACK}});
 data.capabilities.push({id:'cap.modal',runtimeReady:true},{id:'cap.conditional',runtimeReady:true});
 data.morphologies=data.lexemes.map(l=>({id:l.morphologyId,lexemeId:l.id,formIds:[...l.formIds]}));
 for(const [rows,key]of [['lexemes','lexemeById'],['senses','senseById'],['frames','frameById'],['forms','formById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=Object.fromEntries(data[rows].map(x=>[x.id,x]));
 data.cardDefinitions=data.cards;return data;
}
