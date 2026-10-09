/** Reviewed lexical bindings, not sentence answers. Earlier registries remain immutable.
 * A passive alternative belongs to a particular sense/frame, never to a p.p. spelling.
 */
const transitive = new Set(['do','play','eat','read','like','want','need','make','give','see','help','feel','take','keep','find','show','create','improve','develop','change','send','know','say','enjoy','finish']);
const complements = {have:['ing','pp'],see:['ing','pp'],feel:['ing'],find:['ing','pp'],keep:['ing','pp'],want:['pp'],need:['pp'],like:['pp']};
const passiveOC = {make:['adj','np','bare'],see:['bare','ing'],help:['to','bare'],keep:['adj','ing','pp'],find:['adj','np','ing','pp']};
const notes = {
 have:'목적어 뒤에 원형, -ing, p.p.를 둘 수 있습니다. have + 목적어 + p.p.는 완료 시제와 다릅니다.',
 see:'목적어 뒤 원형은 행동 전체, -ing는 진행 중인 모습, p.p.는 대상이 받는 동작을 나타낼 수 있습니다.',
 feel:'목적어 뒤 원형이나 -ing로 느껴지는 행동을 나타낼 수 있습니다.',
 make:'목적어 뒤 원형을 쓰는 사역 구조가 있습니다. 이 구조를 수동태로 바꾸면 to부정사를 씁니다.',
 help:'목적어 뒤 동사 원형과 to부정사를 모두 쓸 수 있습니다. 모든 -ing·p.p. 보어를 허용하는 동사는 아닙니다.',
 keep:'목적어 뒤 -ing나 p.p.로 지속되는 동작·상태를 나타낼 수 있습니다. keep -ing는 계속 ~하다입니다.',
 find:'목적어 뒤 형용사, 명사, -ing, p.p.로 발견한 상태나 행동을 나타낼 수 있습니다.',
 want:'목적어 뒤 to부정사나 p.p.를 쓸 수 있습니다. 욕구를 나타내며 사역 동사로 분류하지 않습니다.',
 need:'목적어 뒤 to부정사나 p.p.를 쓸 수 있습니다. need -ing의 대상 연결도 유지합니다.',
 like:'목적어 뒤 to부정사나 p.p.를 써 선호하는 행동·상태를 나타낼 수 있습니다.',
 go:'gone은 be 뒤에서 떠나 있는 상태를 나타낼 수 있습니다. go 자체의 수동태는 아닙니다.',
};
export function addEmberLanguage(base) {
 const data=structuredClone(base);data.version='0.7.0';data.validationScope='ember.0.7';
 for(const [id,schoolFrameId,tag] of [
  ['frame.svoc.ing','frame.svoc','FRAME.SVOC'],['frame.svoc.pp','frame.svoc','FRAME.SVOC'],
  ['frame.svc.to','frame.svc.adj','FRAME.SVC'],['frame.svc.ing','frame.svc.adj','FRAME.SVC'],['frame.svc.pp','frame.svc.adj','FRAME.SVC'],
 ])data.frames.push({id,schoolFrameId,tag,runtimeReady:true,comboImplemented:true,requiredCapabilityIds:['cap.present.basic'],requiredSlots:['SUBJECT','FINITE_VERB','COMPLEMENT'],supportedAdjuncts:['ADVERB','PP']});
 for(const lex of data.lexemes.filter(l=>l.pos==='VERB')){
  const basic=data.senses.find(s=>s.id===lex.senseIds[0]);
  for(const kind of [...(complements[lex.lemma]??[]),...(lex.lemma==='keep'?['gerund']:[])]){
   const frameId=kind==='gerund'?'frame.svo.gerund':`frame.svoc.${kind}`,id=`${lex.id}.sense.ember.${kind}`;
   lex.senseIds.push(id);if(!lex.frameIds.includes(frameId))lex.frameIds.push(frameId);
   data.senses.push({...structuredClone(basic),id,frameBindings:[{frameId,runtimeReady:true,requiredCapabilityIds:['cap.present.basic']}],futureFrameBindings:[],curation:'EMBER_0.7_REVIEWED'});
  }
  for(const sense of data.senses.filter(s=>s.lexemeId===lex.id))for(const binding of sense.frameBindings){
   const alternatives=[];
   if(binding.frameId==='frame.svo'&&transitive.has(lex.lemma))alternatives.push({frameId:'frame.sv',promotion:'DIRECT_OBJECT'});
   if(binding.frameId==='frame.svoo'&&['give','show','send','make'].includes(lex.lemma)){
    if(lex.lemma!=='make')alternatives.push({frameId:'frame.svo',promotion:'INDIRECT_OBJECT'});
    alternatives.push({frameId:'frame.sv',promotion:'DIRECT_OBJECT',requiredPreposition:binding.dativePreposition});
   }
   const kind=binding.frameId.startsWith('frame.svoc.')?binding.frameId.split('.').at(-1):null;
   if(kind&&passiveOC[lex.lemma]?.includes(kind))alternatives.push({frameId:`frame.svc.${kind==='bare'?'to':kind}`,promotion:'OBJECT'});
   if(alternatives.length)binding.passiveAlternatives=alternatives;
   if(kind){const construction=['make','have'].includes(lex.lemma)&&kind==='bare'?'CAUSATIVE':['see','feel'].includes(lex.lemma)?'PERCEPTION':lex.lemma==='help'&&['bare','to'].includes(kind)?'ASSISTANCE':null;if(construction)binding.construction=construction;}
  }
  if(lex.lemma==='go')lex.participleStateForms=['form.go.pp'];
  if(notes[lex.lemma]){lex.usageNoteKo=notes[lex.lemma];for(const sense of data.senses.filter(s=>s.lexemeId===lex.id))sense.usageNoteKo=notes[lex.lemma];}
 }
 for(const [rows,key]of [['lexemes','lexemeById'],['senses','senseById'],['frames','frameById'],['forms','formById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=Object.fromEntries(data[rows].map(x=>[x.id,x]));
 data.cardDefinitions=data.cards;return data;
}
