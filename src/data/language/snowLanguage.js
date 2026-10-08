/** Reviewed forms, not a suffix generator. Frozen older registries remain untouched. */
export const SNOW_PACKS=['pack.comparison','pack.degree'];
export const SNOW_REWARD_PACK='pack.snowWords.reward';
export const COMPARISON_FORMS={
 good:['better','best'],bad:['worse','worst'],big:['bigger','biggest'],small:['smaller','smallest'],
 happy:['happier','happiest'],sad:['sadder','saddest'],kind:['kinder','kindest'],young:['younger','youngest'],
 old:['older','oldest'],new:['newer','newest'],easy:['easier','easiest'],hard:['harder','hardest'],
 safe:['safer','safest'],strong:['stronger','strongest'],clear:['clearer','clearest'],fast:['faster','fastest'],well:['better','best'],
};
const PERIPHRASTIC=new Set(['interesting','difficult','beautiful','important','necessary','possible','useful','different','serious','tired','ready','quickly','slowly','carefully','clearly','often']);
export function addSnowLanguage(base){
 const data=structuredClone(base);data.version='0.6.0';data.validationScope='snow.0.6';
 for(const lex of data.lexemes.filter(l=>['ADJECTIVE','ADVERB'].includes(l.pos))){
  const surfaces=COMPARISON_FORMS[lex.lemma],periphrastic=PERIPHRASTIC.has(lex.lemma);
  lex.comparisonPolicy={strategy:surfaces?(['good','bad','well'].includes(lex.lemma)?'IRREGULAR':'INFLECTED'):'PERIPHRASTIC',gradable:Boolean(surfaces||periphrastic),allowMore:periphrastic,allowMost:periphrastic};
  for(const id of lex.formIds){const form=data.forms.find(f=>f.id===id);form.grammaticalFeatures.degree='POSITIVE';}
  if(surfaces)for(const [i,degree]of ['COMPARATIVE','SUPERLATIVE'].entries()){
   const id=`form.${lex.lemma}.${degree.toLowerCase()}`;
   lex.formIds.push(id);lex.comparisonPolicy[i?'superlativeFormId':'comparativeFormId']=id;
   data.forms.push({id,formId:id,lexemeId:lex.id,surface:surfaces[i],grammaticalFeatures:{degree},allowedRoleCandidates:[lex.pos],runtimeReady:true,labelKo:i?'최상급':'비교급',requiredCapabilityIds:['cap.comparison']});
  }
 }
 for(const [lemma,gloss,rarity]of [['than','~보다','COMMON'],['as','~만큼','COMMON'],['more','더 많은·더','UNCOMMON'],['most','대부분의·가장','UNCOMMON'],['too','지나치게','COMMON'],['enough','충분한·충분히','UNCOMMON'],['twice','두 번·두 배','RARE']]){
  const pos=lemma==='twice'?'ADVERB':'FUNCTION',id=`lex.${lemma}.${pos.toLowerCase()}`,fid=`form.${lemma}.base`,sid=`${id}.sense.basic`;
  const lex={id,lemma,pos,glossKo:gloss,vocabBand:'CORE',introducedVersion:'0.6.0',runtimeReady:true,morphologyId:`morph.${lemma}`,senseIds:[sid],frameIds:[],formIds:[fid],defaultFormId:fid,usageNoteKo:({than:'비교급 뒤에서 비교 기준을 이끕니다.',as:'원급 형용사·부사를 as 두 장으로 감싸 비교합니다.',more:'more + 명사는 수량, more + 허용 형용사·부사는 비교를 나타냅니다.',most:'most + 명사는 수량, the most + 형용사는 최상급을 나타냅니다.',too:'too는 형용사·부사 앞에 놓습니다.',enough:'enough는 형용사·부사 뒤, 명사 앞에 놓습니다.',twice:'두 번의 빈도 또는 twice as ~ as의 두 배를 나타냅니다.'})[lemma]};
  data.lexemes.push(lex);data.senses.push({id:sid,lexemeId:id,glossKo:gloss,frameBindings:[],futureFrameBindings:[],contextualBareRoles:[],runtimeReady:true,requiredCapabilityIds:['cap.comparison'],usageNoteKo:lex.usageNoteKo,adverbPolicy:lemma==='twice'?{positions:['FRONT','END']}:null});
  data.forms.push({id:fid,formId:fid,lexemeId:id,surface:lemma,grammaticalFeatures:{},allowedRoleCandidates:lemma==='twice'?['ADVERB']:['COMPARISON_MARKER',...(['more','most','enough'].includes(lemma)?['DETERMINER']:[])],runtimeReady:true,labelKo:'기본형',requiredCapabilityIds:['cap.comparison']});
  data.cards.push({id:`card.${lemma}`,cardKind:'WORD',lexemeId:id,baseScore:10,rarity,displayCategory:pos,runtimeReady:true,starterEligible:false,rewardWeight:1,requiredUnlockId:SNOW_REWARD_PACK,availability:{runtimeReady:true,starterEligible:false,rewardWeight:1,requiredUnlockId:SNOW_REWARD_PACK}});
 }
 data.capabilities=data.capabilities.filter(c=>!['cap.comparison','cap.degree'].includes(c.id));data.capabilities.push({id:'cap.comparison',runtimeReady:true},{id:'cap.degree',runtimeReady:true});
 data.morphologies=data.lexemes.map(l=>({id:l.morphologyId,lexemeId:l.id,formIds:[...l.formIds]}));
 for(const [rows,key]of [['lexemes','lexemeById'],['senses','senseById'],['frames','frameById'],['forms','formById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=Object.fromEntries(data[rows].map(x=>[x.id,x]));
 data.cardDefinitions=data.cards;return data;
}
