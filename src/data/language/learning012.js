/** Reviewed lexical extensions for new 0.12 runs. Never mutate a historical registry. */
export function addLearning012(base) {
  const data=structuredClone(base);
  data.languagePolicyVersion='0.12.0';
  data.imperativePolicy='POSITIVE_ROOT_V1';
  const index=()=>{
    for(const [rows,key] of [['lexemes','lexemeById'],['forms','formById'],['senses','senseById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=Object.fromEntries(data[rows].map(x=>[x.id,x]));
    data.cardDefinitions=data.cards;
  };
  function verb(lemma,gloss,donor,frames,note,{secondary=false,band='STANDARD'}={}) {
    const id=`lex.${lemma}.verb`,senseId=id+'.sense.basic',formIds=[];
    const lex={id,lemma,pos:'VERB',glossKo:gloss,vocabBand:band,runtimeReady:true,secondaryOnly:secondary,morphologyId:`morph.${lemma}.verb`,senseIds:[senseId],frameIds:frames.map(x=>typeof x==='string'?x:x.frameId),formIds,defaultFormId:`form.${lemma}.present`,usageNoteKo:note};
    const past=lemma==='plan'?'planned':lemma.endsWith('e')?lemma+'d':lemma==='try'?'tried':lemma+'ed';
    const ing=lemma==='plan'?'planning':lemma.endsWith('e')?lemma.slice(0,-1)+'ing':lemma+'ing';
    for(const [suffix,surface,features,roles,label] of [
      ['present',lemma,{tense:'PRESENT',number:'NON_3_SINGULAR',person:null},['FINITE_VERB'],'현재 · 기본'],
      ['third',lemma==='try'?'tries':lemma==='watch'?'watches':lemma+'s',{tense:'PRESENT',number:'SINGULAR',person:3},['FINITE_VERB'],'현재 · 3인칭 단수'],
      ['past',past,{tense:'PAST'},['FINITE_VERB'],'과거'],
      ['pp',past,{tense:'PAST_PARTICIPLE'},['PARTICIPLE'],'과거분사 · p.p.'],
      ['ing',ing,{tense:'PRESENT_PARTICIPLE'},['PARTICIPLE'],'-ing형'],
    ]){const fid=`form.${lemma}.${suffix}`;formIds.push(fid);data.forms.push({id:fid,formId:fid,lexemeId:id,surface,grammaticalFeatures:features,allowedRoleCandidates:roles,labelKo:label,runtimeReady:true,requiredCapabilityIds:['cap.present.basic'],...(suffix==='ing'?{morphologicalForm:'ING'}:{})});}
    data.lexemes.push(lex);
    data.senses.push({id:senseId,lexemeId:id,glossKo:gloss,countability:null,semanticTags:[],contextualBareRoles:[],futureFrameBindings:[],frameBindings:frames.map(f=>({frameId:typeof f==='string'?f:f.frameId,runtimeReady:true,requiredCapabilityIds:['cap.present.basic'],...(typeof f==='object'?f:{}),...(f==='frame.svo'?{passiveAlternatives:[{frameId:'frame.sv',promotion:'DIRECT_OBJECT'}]}:{})})),runtimeReady:true,requiredCapabilityIds:['cap.present.basic'],usageNoteKo:note,curation:'LEARNING_0.12_REVIEWED'});
    data.morphologies.push({id:lex.morphologyId,lexemeId:id,formIds:[...formIds]});
    if(!secondary){const original=data.cards.find(c=>c.id===`card.${donor}`);data.cards.push({...structuredClone(original),id:`card.${lemma}`,lexemeId:id,displayCategory:'VERB',acquisitionDonorId:original.id});}
    return lex;
  }
  const perception=kind=>({frameId:`frame.svoc.${kind}`,construction:'PERCEPTION'});
  verb('watch','지켜보다','see',['frame.svo',perception('bare'),perception('ing')],'watch + 목적어 + 원형은 행동 전체를, -ing는 진행 중인 모습을 지켜보는 용법입니다.');
  verb('notice','알아차리다','see',['frame.svo',perception('bare'),perception('ing')],'notice + 목적어 + 원형/-ing로 행동을 알아차립니다. see의 모든 보어를 그대로 허용하지 않습니다.',{band:'ADVANCED'});
  verb('allow','허용하다','want',['frame.svo',{frameId:'frame.svoc.to',passiveAlternatives:[{frameId:'frame.svc.to',promotion:'OBJECT'}]}],'allow + 목적어 + to부정사: ~가 …하도록 허용하다. 목적어 뒤 원형만은 쓰지 않습니다.',{band:'ADVANCED'});
  verb('try','시도하다, 시험하다','like',['frame.svo','frame.svo.to','frame.svo.gerund'],'try to는 하려고 노력하기, try -ing는 방법을 시험해 보기입니다. try + 목적어 + to는 이 용법에 포함하지 않습니다.');
  verb('remember','기억하다','like',['frame.svo','frame.svo.to','frame.svo.gerund'],'remember to는 해야 할 일을 기억하기, remember -ing는 이미 한 일을 기억하기입니다.',{band:'ADVANCED'});
  const plan=verb('plan','계획하다','like',['frame.svo','frame.svo.to'],'plan + 명사 또는 to부정사: ~을 계획하다 / ~할 계획이다.',{secondary:true});
  const planCard=data.cards.find(c=>c.id==='card.plan');planCard.secondaryLexemeIds=[plan.id];
  planCard.dualUsage={label:'명·동',description:'명사: 계획(가산) / 동사: 계획하다',examples:['I have a plan.','She plans the game.','I plan to work.']};
  function noun(lemma,countability,gloss,plural){
    const id=`lex.${lemma}.noun`,fid=`form.${lemma}.noun.singular`,sid=id+'.sense.basic';
    const formIds=[fid];data.forms.push({id:fid,formId:fid,lexemeId:id,surface:lemma,grammaticalFeatures:{number:'SINGULAR',countability},allowedRoleCandidates:['NOUN_HEAD'],runtimeReady:true,labelKo:countability==='MASS'?'명사 · 불가산':'명사 · 단수',requiredCapabilityIds:['cap.present.basic']});
    if(plural){const pid=`form.${lemma}.noun.plural`;formIds.push(pid);data.forms.push({...data.forms.at(-1),id:pid,formId:pid,surface:plural,grammaticalFeatures:{number:'PLURAL',countability},labelKo:'명사 · 복수'});}
    const lex={id,lemma,pos:'NOUN',glossKo:gloss,vocabBand:'CORE',runtimeReady:true,secondaryOnly:true,relativeAntecedentClass:'THING',morphologyId:`morph.${lemma}.noun`,senseIds:[sid],frameIds:[],formIds,defaultFormId:fid,usageNoteKo:lemma==='work'?'일·작업의 불가산 용법입니다. 작품을 뜻하는 가산 용법은 포함하지 않습니다.':'변화는 가산·불가산으로 쓸 수 있습니다.'};
    data.lexemes.push(lex);data.senses.push({id:sid,lexemeId:id,glossKo:gloss,countability,referent:'THING',semanticTags:['THING'],frameBindings:[],futureFrameBindings:[],contextualBareRoles:[],runtimeReady:true,requiredCapabilityIds:['cap.present.basic'],usageNoteKo:lex.usageNoteKo});data.morphologies.push({id:lex.morphologyId,lexemeId:id,formIds:[...formIds]});
    const card=data.cards.find(c=>c.id===`card.${lemma}`);card.secondaryLexemeIds=[id];card.dualUsage={label:'동·명',description:lemma==='work'?'동사: 일하다 / 명사: 일·작업(불가산)':'동사: 변하다·바꾸다 / 명사: 변화(가산·불가산)',examples:lemma==='work'?['I work.','I need work.']:['I change the plan.','I need a change.','I need changes.']};
  }
  noun('work','MASS','일, 작업');noun('change','BOTH','변화','changes');
  index();return data;
}
