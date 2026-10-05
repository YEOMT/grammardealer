import {addSkyLanguage} from './skyLanguage.js';
import {addTimeLanguage} from './timeLanguage.js';
import {addLearningFrames} from './learningFrames.js';
import { authoredLexemes } from './seed.js';

export const LANGUAGE_VERSION = '0.4.0';
const presentCapability = ['cap.present.basic'];
const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const index = (rows) => Object.fromEntries(rows.map(row => [row.id, row]));
export const frames = [
  { id: 'frame.sv', requiredSlots: ['SUBJECT','FINITE_VERB'], optionalComplements: [], supportedAdjuncts: ['ADVERB','PP','HOME_PLACE'], tag:'FRAME.SV', labelKo:'1형식' },
  { id: 'frame.svc.adj', requiredSlots: ['SUBJECT','FINITE_VERB','AP_COMPLEMENT'], optionalComplements: [], supportedAdjuncts: ['ADVERB','PP'], tag:'FRAME.SVC', labelKo:'2형식' },
  { id: 'frame.svc.np', requiredSlots: ['SUBJECT','FINITE_VERB','NP_COMPLEMENT'], optionalComplements: [], supportedAdjuncts: ['ADVERB','PP'], tag:'FRAME.SVC', labelKo:'2형식' },
  { id: 'frame.svo', requiredSlots: ['SUBJECT','FINITE_VERB','OBJECT'], optionalComplements: [], supportedAdjuncts: ['ADVERB','PP'], tag:'FRAME.SVO', labelKo:'3형식' },
  { id: 'frame.svoo', requiredSlots: ['SUBJECT','FINITE_VERB','INDIRECT_OBJECT','DIRECT_OBJECT'], optionalComplements: [], supportedAdjuncts: ['ADVERB','PP'], tag:'FRAME.SVOO', labelKo:'4형식', requiredCapabilityIds:['cap.present.basic','cap.svoo'] },
  { id: 'frame.beLocative', requiredSlots: ['SUBJECT','FINITE_VERB','LOCATION'], optionalComplements: [], supportedAdjuncts: ['ADVERB','PP'], schoolFrameId:'frame.sv', tag:'FRAME.SV', labelKo:'1형식 · 위치' },
].map(f => ({runtimeReady:true, requiredCapabilityIds:presentCapability,...f}));
export const capabilities = [
  {id:'cap.present.basic',runtimeReady:true},
  ...['past','progressive','perfect','passive','svoo','svoc','relative','infinitive','gerund','negative','question','coordination','comparison'].map(name=>({id:`cap.${name}`,runtimeReady:name==='svoo'})),
];
export const grammarTags = freeze({ 'FRAME.SV':'1형식', 'FRAME.SVC':'2형식', 'FRAME.SVO':'3형식', 'FRAME.SVOO':'4형식', 'MODIFIER.ADJECTIVE':'형용사 수식', 'MODIFIER.ADVERB':'부사 수식', 'PHRASE.PP':'전치사구' });
const dativePrepositions = {give:'to',show:'to',make:'for',send:'to'};
const massNouns = new Set(['music','food','water','time','homework','information','knowledge','culture','technology']);
const people = new Set(['friend','teacher','student','child','person']);
const places = new Set(['school','home','room','park','environment']);
const irregularPlural = { child:'children',person:'people' };
const third = { have:'has',do:'does',go:'goes' };
const past = {have:'had',do:'did',go:'went',come:'came',run:'ran',eat:'ate',read:'read',make:'made',give:'gave',see:'saw',feel:'felt',become:'became',take:'took',keep:'kept',find:'found',send:'sent'};
const ing = {be:'being',run:'running',have:'having',make:'making',give:'giving',come:'coming',become:'becoming',take:'taking',live:'living',create:'creating',improve:'improving',change:'changing'};
const futureVerbCapabilities = {
 give:['cap.svoo'],show:['cap.svoo'],make:['cap.svoo','cap.svoc'],read:['cap.svoo'],take:['cap.svoo'],keep:['cap.svoo','cap.svoc'],find:['cap.svoo','cap.svoc'],play:['cap.svoo'],have:['cap.svoc'],want:['cap.svoc'],need:['cap.svoc'],like:['cap.svoc'],see:['cap.svoc'],
};
const pronouns = {
 I:['I','me','my',1,'SINGULAR'],you:['you','you','your',2,'ANY'],he:['he','him','his',3,'SINGULAR'],
 she:['she','her','her',3,'SINGULAR'],it:['it','it','its',3,'SINGULAR'],we:['we','us','our',1,'PLURAL'],they:['they','them','their',3,'PLURAL'],
};
const adverbPolicies = {
 very:{degree:true,positions:[]}, really:{degree:true,positions:['PRE_VERB','AFTER_BE','END']},
 often:{positions:['FRONT','PRE_VERB','AFTER_BE','END']},always:{positions:['PRE_VERB','AFTER_BE']},
 sometimes:{positions:['FRONT','PRE_VERB','AFTER_BE','END']},usually:{positions:['FRONT','PRE_VERB','AFTER_BE','END']},
 fast:{positions:['END']},well:{positions:['END']},today:{positions:['FRONT','END']},now:{positions:['FRONT','END']},
 quickly:{positions:['FRONT','PRE_VERB','END']},slowly:{positions:['FRONT','PRE_VERB','END']},carefully:{positions:['FRONT','PRE_VERB','END']},
 clearly:{positions:['FRONT','PRE_VERB','AFTER_BE','END']},recently:{positions:[],requiredCapabilityIds:['cap.past','cap.perfect']},
};
export const forms = [];
export const senses = [];
export const lexemes = authoredLexemes.map(raw => {
 const runtimeReady = raw.lemma !== 'recently';
 const frameIds = raw.lemma === 'be' ? [...raw.frameIds,'frame.beLocative'] : [...raw.frameIds,...(dativePrepositions[raw.lemma]?['frame.svoo']:[])];
 const senseId = `${raw.id}.sense.basic`;
 const lex = {...raw,morphologyId:`morph.${raw.lemma.toLowerCase()}`,senseIds:[senseId],frameIds,formIds:[],runtimeReady};
 const lemma=raw.lemma;
 const add=(suffix,surface,features,roles,ready=true,labelKo='기본형',capabilityIds=presentCapability)=>{
  const id=`form.${lemma.toLowerCase()}.${suffix}`;
  forms.push({id,formId:id,lexemeId:lex.id,surface,grammaticalFeatures:features,allowedRoleCandidates:roles,runtimeReady:runtimeReady&&ready,labelKo,requiredCapabilityIds:capabilityIds});lex.formIds.push(id);
 };
 if(raw.pos==='VERB') {
  if(lemma==='be') {
   add('am','am',{tense:'PRESENT',person:1,number:'SINGULAR'},['FINITE_VERB'],true,'현재 · I');
   add('is','is',{tense:'PRESENT',person:3,number:'SINGULAR'},['FINITE_VERB'],true,'현재 · 3인칭 단수');
   add('are','are',{tense:'PRESENT',person:null,number:'NON_1_3_SINGULAR'},['FINITE_VERB'],true,'현재 · you/복수');
   add('base','be',{tense:'BASE',requiresConjugation:true},['UNSELECTED_BE'],true,'원형 · 활용 선택 필요');
   add('was','was',{tense:'PAST'},['FINITE_VERB'],false,'과거 · 후속',['cap.past']);
   add('were','were',{tense:'PAST'},['FINITE_VERB'],false,'과거 · 후속',['cap.past']);
  } else {
   const thirdSurface=third[lemma]??( /[^aeiou]y$/.test(lemma) ? lemma.slice(0,-1)+'ies' : /(?:s|x|z|ch|sh|o)$/.test(lemma) ? lemma+'es':lemma+'s');
   add('present',lemma,{tense:'PRESENT',person:null,number:'NON_3_SINGULAR'},['FINITE_VERB'],true,'현재 · 기본');
   add('third',thirdSurface,{tense:'PRESENT',person:3,number:'SINGULAR'},['FINITE_VERB'],true,'현재 · 3인칭 단수');
   const pastSurface=past[lemma]??(lemma.endsWith('e')?lemma+'d':/[^aeiou]y$/.test(lemma)?lemma.slice(0,-1)+'ied':lemma+'ed');
   add('past',pastSurface,{tense:'PAST'},['FINITE_VERB'],false,'과거 · 후속',['cap.past']);
  }
  add('ing',ing[lemma]??lemma+'ing',{tense:'PARTICIPLE'},['PARTICIPLE'],false,'-ing · 후속',['cap.progressive']);
 } else if(raw.pos==='NOUN') {
  const countability=massNouns.has(lemma)?'MASS':'COUNT';
  add('singular',lemma,{number:'SINGULAR',countability},lemma==='home'?['NOUN_HEAD','PLACE_ADVERB']:['NOUN_HEAD'],true,countability==='MASS'?'셀 수 없는 명사':'단수');
  if(countability==='COUNT')add('plural',irregularPlural[lemma]??(/[^aeiou]y$/.test(lemma)?lemma.slice(0,-1)+'ies':lemma+'s'),{number:'PLURAL',countability},['NOUN_HEAD'],true,'복수');
 } else if(raw.pos==='PRONOUN') {
  const [nom,obj,poss,person,number]=pronouns[lemma];
  add('subject',nom,{case:'NOMINATIVE',person,number},['NP_SUBJECT'],true,'주격');
  add('object',obj,{case:'OBJECTIVE',person,number},['NP_OBJECT'],true,'목적격');
  add('possessive',poss,{case:'POSSESSIVE_DETERMINER',person,number},lemma==='he'?['POSSESSIVE_DETERMINER','POSSESSIVE_NP']:['POSSESSIVE_DETERMINER'],true,'소유 한정형');
 } else if(lemma==='a') {
  add('a','a',{number:'SINGULAR',article:'INDEFINITE'},['DETERMINER'],true,'a');
  add('an','an',{number:'SINGULAR',article:'INDEFINITE'},['DETERMINER'],true,'an');
 } else {
  const roles = raw.pos==='ADJECTIVE'?['ADJECTIVE']:raw.pos==='ADVERB'?['ADVERB']:raw.pos==='PREPOSITION'||lemma==='to'?['PREPOSITION']:['DETERMINER',...(['this','that'].includes(lemma)?['DEMONSTRATIVE_NP']:[])];
  add('base',lemma,{...(['this','that'].includes(lemma)?{number:'SINGULAR'}:{})},roles,true,'기본형',runtimeReady?presentCapability:['cap.past','cap.perfect']);
 }
 lex.defaultFormId=lemma==='be'?'form.be.base':lex.formIds.find(id=>forms.find(f=>f.id===id).runtimeReady)??lex.formIds[0];
 const countability=raw.pos==='NOUN'?(massNouns.has(lemma)?'MASS':'COUNT'):null;
 const semanticTags=raw.pos==='NOUN'?[people.has(lemma)?'PERSON':['dog','cat'].includes(lemma)?'ANIMAL':places.has(lemma)?'PLACE':'THING']:[];
 const usageNoteKo=lemma==='recently'?'과거·완료 용법을 먼저 검증해야 하므로 0.1 덱/보상에서 제외.':lemma==='school'?'명사는 관사 필요. at/in/to school의 학교 활동 용법은 별도 허용.':lemma==='home'?'명사 집. go/come home, be home, at home의 장소 용법도 허용.':lemma==='to'?'현재는 전치사 to + 명사구만 지원. to부정사는 후속.':lemma==='that'?'현재는 단수 지시한정사와 지시대명사만 지원. 관계절은 후속.':raw.pos==='VERB'?`현재 지원: ${frameIds.filter(x=>x!=='frame.beLocative').map(x=>x==='frame.sv'?'1형식':x==='frame.svo'?'3형식':x==='frame.svoo'?'4형식':'2형식').filter((x,i,a)=>a.indexOf(x)===i).join(', ')}.`:raw.pos==='ADVERB'?`허용 위치: ${(adverbPolicies[lemma].degree?['형용사·정도 수식 가능한 부사 앞']:[]).concat(adverbPolicies[lemma].positions.map(p=>({FRONT:'문장 앞',PRE_VERB:'일반동사 앞',AFTER_BE:'be 뒤',END:'문장 끝'}[p]))).join(', ')}.`:'';
 senses.push({id:senseId,lexemeId:lex.id,glossKo:raw.glossKo,countability,referent:semanticTags[0]??null,semanticTags,
  frameBindings:frameIds.map(frameId=>({frameId,requiredCapabilityIds:frameId==='frame.svoo'?['cap.present.basic','cap.svoo']:presentCapability,runtimeReady,...(frameId==='frame.svoo'?{dativePreposition:dativePrepositions[lemma]}:{})})),
  requiredCapabilityIds:runtimeReady?presentCapability:['cap.past','cap.perfect'],runtimeReady,
  futureFrameBindings:(futureVerbCapabilities[lemma]??[]).map(capabilityId=>({frameId:capabilityId==='cap.svoo'?'frame.svoo':'frame.svoc',requiredCapabilityIds:[capabilityId],runtimeReady:false,allowedComplements:capabilityId==='cap.svoc'?(['make','find','keep'].includes(lemma)?['AP','NP']:['AP']):['NP','NP']})),
  adverbPolicy:adverbPolicies[lemma]??null,
  contextualBareRoles:lemma==='school'?[{role:'PP_OBJECT',prepositions:['at','in','to']}]:lemma==='home'?[{role:'PP_OBJECT',prepositions:['at']},{role:'PLACE_ADVERB',verbs:['go','come','be']}]:[],usageNoteKo,
  curation:'HANDOFF_116_MANUAL_AUTHORED_BASIC_SENSE',
 });
 lex.glossKo=raw.glossKo;lex.usageNoteKo=usageNoteKo;
 return lex;
});
const uncommon = new Set(['make','give','show','help','see','become','keep','find','create','develop','send']);
export const cardDefinitions = lexemes.map(lex => {
 const runtimeReady=lex.runtimeReady;
 const starterEligible=runtimeReady&&!lex.introducedVersion&&!['it','we','this','to','that'].includes(lex.lemma);
 const rarity=['to','that'].includes(lex.lemma)?'RARE':uncommon.has(lex.lemma)?'UNCOMMON':'COMMON';
 return {id:`card.${lex.lemma.toLowerCase()}`,lexemeId:lex.id,baseScore:10,rarity,displayCategory:lex.pos,
  availability:{runtimeReady,starterEligible,rewardWeight:runtimeReady&&!lex.tutorialOnly?1:0},runtimeReady,starterEligible,rewardWeight:runtimeReady&&!lex.tutorialOnly?1:0};
});
export const morphologies = lexemes.map(lex=>({id:lex.morphologyId,lexemeId:lex.id,formIds:[...lex.formIds]}));
export const campaign021Registry = freeze({version:'0.2.1',lexemes,forms,morphologies,senses,frames,cards:cardDefinitions,cardDefinitions,capabilities,grammarTags,
 lexemeById:index(lexemes),formById:index(forms),morphologyById:index(morphologies),senseById:index(senses),frameById:index(frames),cardById:index(cardDefinitions),
});
export const campaign022Registry = freeze(addLearningFrames(campaign021Registry));
export const campaign03Registry = freeze(addTimeLanguage(campaign022Registry));
export const campaign04Registry = freeze(addSkyLanguage(campaign03Registry));
export const registry = campaign04Registry;
export const languageRegistry = registry;

// A small ordered content view keeps old saves' future draws and grammar scope stable.
const legacyUsageNote=entry=>entry.usageNoteKo?.replace(', 4형식.','.');
const legacyLexemes=lexemes.filter(l=>!l.introducedVersion).map(l=>({...l,frameIds:l.frameIds.filter(id=>id!=='frame.svoo'),usageNoteKo:legacyUsageNote(l)}));
const legacyLexemeIds=new Set(legacyLexemes.map(l=>l.id));
const legacySenses=senses.filter(s=>legacyLexemeIds.has(s.lexemeId)).map(s=>({...s,frameBindings:s.frameBindings.filter(b=>b.frameId!=='frame.svoo'),usageNoteKo:legacyUsageNote(s)}));
const legacyForms=forms.filter(f=>legacyLexemeIds.has(f.lexemeId));
const legacyCards=cardDefinitions.filter(c=>legacyLexemeIds.has(c.lexemeId));
const legacyMorphologies=morphologies.filter(m=>legacyLexemeIds.has(m.lexemeId));
const legacyFrames=frames.filter(f=>f.id!=='frame.svoo');
export const legacyRegistry=freeze({...campaign021Registry,version:'0.1.1',lexemes:legacyLexemes,senses:legacySenses,forms:legacyForms,cards:legacyCards,cardDefinitions:legacyCards,morphologies:legacyMorphologies,frames:legacyFrames,
 capabilities:capabilities.map(c=>c.id==='cap.svoo'?{...c,runtimeReady:false}:c),grammarTags:Object.fromEntries(Object.entries(grammarTags).filter(([id])=>id!=='FRAME.SVOO')),
 lexemeById:index(legacyLexemes),senseById:index(legacySenses),formById:index(legacyForms),cardById:index(legacyCards),morphologyById:index(legacyMorphologies),frameById:index(legacyFrames)});
const campaign02Lexemes=lexemes.filter(l=>l.introducedVersion!=='0.2.1');
const campaign02Ids=new Set(campaign02Lexemes.map(l=>l.id));
const campaign02Rows={lexemes:campaign02Lexemes,forms:forms.filter(x=>campaign02Ids.has(x.lexemeId)),senses:senses.filter(x=>campaign02Ids.has(x.lexemeId)),morphologies:morphologies.filter(x=>campaign02Ids.has(x.lexemeId)),cards:cardDefinitions.filter(x=>campaign02Ids.has(x.lexemeId))};
export const campaign02Registry=freeze({...campaign021Registry,...campaign02Rows,version:'0.2.0',cardDefinitions:campaign02Rows.cards,lexemeById:index(campaign02Rows.lexemes),formById:index(campaign02Rows.forms),senseById:index(campaign02Rows.senses),morphologyById:index(campaign02Rows.morphologies),cardById:index(campaign02Rows.cards)});
export function registryForVersion(version) { return ['0.1.0','0.1.1'].includes(version)?legacyRegistry:version==='0.2.0'?campaign02Registry:version==='0.2.1'?campaign021Registry:version==='0.2.2'?campaign022Registry:version==='0.3.0'?campaign03Registry:version==='0.4.0'?campaign04Registry:registry; }

/** Resolve a definition, instance, or definition ID to its registered Lexeme. */
export function lexemeForCard(card, registry=languageRegistry) {
 const def = typeof card==='string'?registry.cardById[card]:registry.cardById[card?.cardDefId??card?.id];
 if(!def)throw new TypeError('Unknown card definition');return registry.lexemeById[def.lexemeId];
}
/** Forms offered in play exclude reserved future tense/capability forms. */
export function formsForCard(card,{includeUnsupported=false,registry=languageRegistry}={}) {
 return lexemeForCard(card,registry).formIds.map(id=>registry.formById[id]).filter(f=>includeUnsupported||f.runtimeReady);
}
/** Build an immutable-value token; one token is exactly one physical card/word. */
export function makeToken(cardInstanceId,cardDefId,formId,position=0,registry=languageRegistry) {
 if(typeof cardInstanceId!=='string'||!cardInstanceId)throw new TypeError('Card instance ID required');
 const lex=lexemeForCard(cardDefId,registry);const selected=registry.formById[formId??lex.defaultFormId];
 if(!selected||selected.lexemeId!==lex.id)throw new TypeError('Form does not belong to card');
 return {cardInstanceId,cardDefId,lexemeId:lex.id,selectionId:selected.id,surface:selected.surface,
  allowedFormCandidates:lex.formIds.filter(id=>registry.formById[id].surface.toLowerCase()===selected.surface.toLowerCase()),position};
}
/** @param {Array<{cardInstanceId:string,selection?:{formId?:string}|string}>} slots */
export function createSentenceSnapshot(slots,cardInstances,{sentenceId='sentence',languageVersion=LANGUAGE_VERSION}={}) {
 if(!Array.isArray(slots))throw new TypeError('Sentence slots must be an array');
 const instances=Array.isArray(cardInstances)?Object.fromEntries(cardInstances.map(c=>[c.instanceId,c])):cardInstances;
 return {schemaVersion:1,sentenceId,languageVersion,orderedTokens:slots.map((slot,position)=>{
  const card=instances?.[slot.cardInstanceId];if(!card)throw new TypeError('Missing physical card');
  const formId=typeof slot.selection==='string'?slot.selection:slot.selection?.formId??slot.selection?.selectionId??slot.formId;
  return makeToken(slot.cardInstanceId,card.cardDefId,formId,position,registryForVersion(languageVersion));
 })};
}
