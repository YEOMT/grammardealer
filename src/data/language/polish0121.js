import {EXTRAPOSITION_PREDICATES} from './libraryLanguage.js';

/** New-run lexical policy; historical definitions, forms and supply remain immutable. */
export function addPolish0121(base) {
 const data=structuredClone(base);data.languagePolicyVersion='0.12.1';
 data.extrapositionPredicates={...EXTRAPOSITION_PREDICATES,good:['TO','THAT','FOR_TO','OF_TO'],bad:['TO','THAT','FOR_TO'],important:['TO','THAT','FOR_TO'],easy:['TO','FOR_TO'],hard:['TO','FOR_TO'],difficult:['TO','FOR_TO'],possible:['TO','THAT','FOR_TO'],necessary:['TO','THAT','FOR_TO'],clear:['THAT'],kind:['TO','OF_TO']};
 const lex=lemma=>data.lexemes.find(l=>l.lemma===lemma&&!l.secondaryOnly);
 const card=lemma=>data.cards.find(c=>c.id==='card.'+lemma);
 const sense=l=>data.senses.find(s=>s.id===l.senseIds[0]);
 function addLex(lemma,pos,gloss,band,note,{secondary=false}={}) {
  const id=`lex.${lemma}.${pos.toLowerCase()}`,sid=id+'.sense.basic';
  const l={id,lemma,pos,glossKo:gloss,vocabBand:band,runtimeReady:true,secondaryOnly:secondary,morphologyId:`morph.${lemma}.${pos.toLowerCase()}`,senseIds:[sid],frameIds:[],formIds:[],usageNoteKo:note};
  data.lexemes.push(l);data.senses.push({id:sid,lexemeId:id,glossKo:gloss,countability:null,semanticTags:[],frameBindings:[],futureFrameBindings:[],contextualBareRoles:[],runtimeReady:true,requiredCapabilityIds:['cap.present.basic'],usageNoteKo:note,curation:'POLISH_0.12.1_REVIEWED'});
  if(!secondary)data.cards.push({id:'card.'+lemma,lexemeId:id,cardKind:'WORD',displayCategory:pos,baseScore:10,rarity:'COMMON',runtimeReady:true,starterEligible:pos==='NOUN',rewardWeight:1,availability:{runtimeReady:true,starterEligible:pos==='NOUN',rewardWeight:1}});
  return l;
 }
 function form(l,suffix,surface,features,roles,label){const id=`form.${l.lemma}.${l.secondaryOnly?l.pos.toLowerCase()+'.':''}${suffix}`;l.formIds.push(id);l.defaultFormId??=id;data.forms.push({id,formId:id,lexemeId:l.id,surface,grammaticalFeatures:features,allowedRoleCandidates:roles,labelKo:label,runtimeReady:true,requiredCapabilityIds:['cap.present.basic']});}
 function verb(lemma,gloss,band,frames,forms,{secondary=false,note=gloss}={}){
  const l=addLex(lemma,'VERB',gloss,band,note,{secondary});l.frameIds=frames;
  sense(l).frameBindings=frames.map(frameId=>({frameId,runtimeReady:true,requiredCapabilityIds:['cap.present.basic'],...(frameId==='frame.svo'?{passiveAlternatives:[{frameId:'frame.sv',promotion:'DIRECT_OBJECT'}]}:{}),...(frameId==='frame.svo.content'?{requiresThat:true}:{}),...(frameId==='frame.svoo'?{dativePreposition:'to'}:{})}));
  const [third,past,pp,ing]=forms;
  form(l,'present',lemma,{tense:'PRESENT',number:'NON_3_SINGULAR',person:null},['FINITE_VERB'],'원형');
  form(l,'third',third,{tense:'PRESENT',number:'SINGULAR',person:3},['FINITE_VERB'],'현재 · 3인칭 단수');
  form(l,'past',past,{tense:'PAST'},['FINITE_VERB'],'과거');form(l,'pp',pp,{tense:'PAST_PARTICIPLE'},['PARTICIPLE'],'과거분사 · p.p.');form(l,'ing',ing,{tense:'PRESENT_PARTICIPLE'},['PARTICIPLE'],'-ing형');return l;
 }
 verb('smile','미소 짓다','STANDARD',['frame.sv'],['smiles','smiled','smiled','smiling'],{note:'목적어 없이 쓰는 1형식 동사입니다.'});
 verb('write','쓰다','STANDARD',['frame.sv','frame.svo','frame.svoo'],['writes','wrote','written','writing'],{note:'write / write a story / write you a story. 과거 wrote, 과거분사 written.'});
 for(const [lemma,gloss,band,third,past,ing]of [['solve','해결하다','STANDARD','solves','solved','solving'],['visit','방문하다','STANDARD','visits','visited','visiting'],['protect','보호하다','ADVANCED','protects','protected','protecting'],['discover','발견하다','ADVANCED','discovers','discovered','discovering']])verb(lemma,gloss,band,['frame.svo',...(lemma==='discover'?['frame.svo.content']:[])],[third,past,past,ing],{note:lemma==='discover'?'명사구 또는 that + 완전한 절을 목적어로 받습니다.':lemma==='visit'?'visit + 방문할 대상. 목적어 앞에 to를 붙이지 않습니다.':`${lemma} + 목적어. 진행·완료·수동의 실제 활용형을 사용합니다.`});
 function noun(lemma,gloss,band,{secondary=false}={}){const l=addLex(lemma,'NOUN',gloss,band,'가산 명사: 단수에는 한정사, 복수에는 -s를 사용합니다.',{secondary});l.relativeAntecedentClass='THING';Object.assign(sense(l),{countability:'COUNT',referent:'THING',semanticTags:['THING']});form(l,'singular',lemma,{number:'SINGULAR',countability:'COUNT'},['NOUN_HEAD'],'단수');form(l,'plural',lemma==='watch'?'watches':lemma+'s',{number:'PLURAL',countability:'COUNT'},['NOUN_HEAD'],'복수');return l;}
 for(const [lemma,gloss,band]of [['gift','선물','STANDARD'],['result','결과','ADVANCED'],['method','방법','ADVANCED']])noun(lemma,gloss,band);
 function link(lemma,l,label,description,examples){const c=card(lemma);c.secondaryLexemeIds=[...(c.secondaryLexemeIds??[]),l.id];c.dualUsage={label,description,examples};}
 link('answer',verb('answer','대답하다',lex('answer').vocabBand,['frame.sv','frame.svo'],['answers','answered','answered','answering'],{secondary:true}),'명·동','명사: 답(가산) / 동사: 대답하다',['I know the answer.','I answer you.']);
 link('watch',noun('watch','손목시계',lex('watch').vocabBand,{secondary:true}),'동·명','동사: 지켜보다 / 명사: 손목시계(가산)',['I watch you.','I have a watch.']);
 link('show',noun('show','공연',lex('show').vocabBand,{secondary:true}),'동·명','동사: 보여 주다 / 명사: 공연(가산)',['I show you a book.','I like the show.']);
 for(const [lemma,pos,gloss,note]of [['hard','ADVERB','열심히','동작의 노력 정도를 나타냅니다.'],['fast','ADJECTIVE','빠른','명사 수식과 보어로 사용합니다.'],['well','ADJECTIVE','건강한','be/feel 뒤 건강 상태를 나타내는 보어입니다. 명사 앞 수식으로 일반화하지 않습니다.']]){
  const primary=lex(lemma),l=addLex(lemma,pos,gloss,primary.vocabBand,note,{secondary:true});l.comparisonPolicy=structuredClone(primary.comparisonPolicy);
  if(pos==='ADVERB')sense(l).adverbPolicy={positions:['END']};if(lemma==='well')l.predicateVerbs=['be','feel'];
  for(const fid of primary.formIds){const f=data.forms.find(f=>f.id===fid);form(l,fid.split('.').at(-1),f.surface,{...f.grammaticalFeatures},[pos],f.labelKo);}
  link(lemma,l,'형·부',lemma==='hard'?'형용사: 어려운·단단한 / 부사: 열심히':lemma==='fast'?'형용사: 빠른 / 부사: 빠르게':'부사: 잘 / 형용사: 건강한(be/feel 뒤)',lemma==='hard'?['The work is hard.','I work hard.']:lemma==='fast'?['You are fast.','You run fast.']:['I am well.','I work well.']);
 }
 for(const c of data.cards)if(!base.cardById[c.id]&&data.lexemes.find(l=>l.id===c.lexemeId)?.pos==='VERB'){c.starterEligible=false;c.availability.starterEligible=false;}
 const fast=lex('fast');delete fast.tutorialOnly;card('fast').starterEligible=true;card('fast').rewardWeight=1;Object.assign(card('fast').availability,{starterEligible:true,rewardWeight:1});
 for(const lemma of ['notice','remember']){const l=lex(lemma);l.frameIds.push('frame.svo.content');sense(l).frameBindings.push({frameId:'frame.svo.content',runtimeReady:true,requiredCapabilityIds:['cap.present.basic'],requiresThat:true});l.usageNoteKo+=' that + 주어 + 동사로 완전한 내용절 목적어도 받습니다.';sense(l).usageNoteKo=l.usageNoteKo;}
 const too=lex('too');too.glossKo='지나치게, 또한';too.usageNoteKo='형용사·부사 앞: 지나치게. 절 끝: 또한(비교·정도 콤보 아님).';sense(too).usageNoteKo=too.usageNoteKo;sense(too).adverbPolicy={positions:['END'],additive:true};data.forms.find(f=>f.id===too.defaultFormId).allowedRoleCandidates.push('ADVERB');
 if(!lex('of')){const l=addLex('of','PREPOSITION','~의, ~가','CORE','kind/good of + 목적격·명사구 + to부정사에서 행동의 평가 대상을 이끕니다.');form(l,'base','of',{},['PREPOSITION'],'기본형');card('of').requiredUnlockId='pack.infinitive';card('of').availability.requiredUnlockId='pack.infinitive';}
 for(const lemma of ['look','room']){const c=card(lemma);c.starterEligible=false;c.rewardWeight=0;c.shopEligible=false;Object.assign(c.availability,{starterEligible:false,rewardWeight:0});}
 for(const [lemma,policy]of Object.entries(data.extrapositionPredicates)){const l=lex(lemma);l.usageNoteKo+=` 가주어 it: ${policy.join(' / ')} 허용.`;sense(l).usageNoteKo=l.usageNoteKo;}
 data.morphologies=data.lexemes.map(l=>({id:l.morphologyId,lexemeId:l.id,formIds:[...l.formIds]}));
 for(const [rows,key]of [['lexemes','lexemeById'],['forms','formById'],['senses','senseById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=Object.fromEntries(data[rows].map(x=>[x.id,x]));
 data.cardDefinitions=data.cards;return data;
}
