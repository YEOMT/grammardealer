// Curated basic validation only. No future forms, card supply, prices or combo packs are added.
// Sources and deliberately bounded senses: docs/VERB_FRAME_AUDIT_0.2.2.md.
export const VERB_EXTENSIONS = {
  develop:{svGloss:'발전하다, 발달하다',gloss:'~을 개발하다, 발전시키다'},
  feel:{svoGloss:'~을 느끼다',objectBare:true},
  make:{objectAdjective:true,objectNoun:true,objectBare:true},
  find:{objectAdjective:true,objectNoun:true},keep:{objectAdjective:true,objectNoun:true},
  want:{to:true,objectTo:true},need:{to:true,objectTo:true},like:{to:true,objectTo:true},
  help:{to:true,bare:true,objectTo:true,objectBare:true},see:{objectBare:true},have:{objectBare:true},
};
export function addLearningFrames(base) {
  const data=structuredClone(base),index=rows=>Object.fromEntries(rows.map(x=>[x.id,x]));
  const extraFrames=[['frame.svoc.adj','AP'],['frame.svoc.np','NP'],['frame.svoc.to','TO'],['frame.svoc.bare','BARE'],['frame.svo.to','TO'],['frame.svo.bare','BARE']].map(([id,complement])=>({id,requiredSlots:['SUBJECT','FINITE_VERB','COMPLEMENT'],supportedAdjuncts:['ADVERB','PP'],requiredCapabilityIds:['cap.present.basic'],runtimeReady:true,schoolFrameId:id.startsWith('frame.svoc')?'frame.svoc':'frame.svo',tag:id.startsWith('frame.svoc')?'FRAME.SVOC':'FRAME.SVO',comboImplemented:!id.startsWith('frame.svoc'),complement}));
  data.frames.push(...extraFrames);
  for(const lex of data.lexemes) {
    const extension=VERB_EXTENSIONS[lex.lemma];if(!extension)continue;
    const basic=data.senses.find(s=>s.id===lex.senseIds[0]);const extras=[];
    if(extension.svGloss)extras.push(['growth','frame.sv',extension.svGloss]);
    if(extension.svoGloss)extras.push(['perception','frame.svo',extension.svoGloss]);
    if(extension.gloss)basic.glossKo=extension.gloss;
    for(const [flag,frame] of [['objectAdjective','frame.svoc.adj'],['objectNoun','frame.svoc.np'],['objectTo','frame.svoc.to'],['objectBare','frame.svoc.bare'],['to','frame.svo.to'],['bare','frame.svo.bare']])if(extension[flag])extras.push([flag,frame,basic.glossKo]);
    for(const [name,frameId,glossKo] of extras){const id=`${lex.id}.sense.${name}`;lex.senseIds.push(id);lex.frameIds.push(frameId);data.senses.push({...structuredClone(basic),id,glossKo,frameBindings:[{frameId,runtimeReady:true,requiredCapabilityIds:['cap.present.basic']}],futureFrameBindings:[],curation:'LEARNING_0.2.2_REVIEW_DRAFT'});}
    lex.glossKo=[extension.svGloss,extension.gloss??extension.svoGloss??lex.glossKo].filter(Boolean).join(' / ');
  }
  data.version='0.2.2';data.validationScope='learning.0.2.2';
  data.lexemeById=index(data.lexemes);data.senseById=index(data.senses);data.frameById=index(data.frames);
  // All other rows are unchanged, but their indexes must point to this view's rows.
  for(const [rows,key] of [['forms','formById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=index(data[rows]);
  data.cardDefinitions=data.cards;
  return data;
}
