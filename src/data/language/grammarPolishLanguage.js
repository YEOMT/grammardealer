/** Reviewed 0.6.1 grammar metadata. The source 0.6 view is never changed. */
export function addGrammarPolishLanguage(base) {
 const data=structuredClone(base);data.version='0.6.1';
 const auxiliaryAdverbs=new Set(['often','always','usually','sometimes','really','quickly','slowly','carefully','clearly']);
 for(const lex of data.lexemes){
  const senses=data.senses.filter(s=>s.lexemeId===lex.id);
  if(lex.pos==='ADVERB'&&auxiliaryAdverbs.has(lex.lemma))for(const sense of senses){
   sense.adverbPolicy={...sense.adverbPolicy,auxiliaryPositions:['AFTER_AUXILIARY']};
  }
  if(['easy','hard','difficult'].includes(lex.lemma)){
   for(const sense of senses)sense.subjectObjectInfinitive=true;
   const note='앞의 명사가 뒤의 to부정사의 대상이 될 수 있습니다.';
   lex.usageNoteKo=[lex.usageNoteKo,note].filter(Boolean).join(' ');
   for(const sense of senses)sense.usageNoteKo=[sense.usageNoteKo,note].filter(Boolean).join(' ');
  }
 }
 for(const [rows,key]of [['lexemes','lexemeById'],['senses','senseById'],['frames','frameById'],['forms','formById'],['cards','cardById'],['morphologies','morphologyById']])data[key]=Object.fromEntries(data[rows].map(x=>[x.id,x]));
 data.cardDefinitions=data.cards;return data;
}
