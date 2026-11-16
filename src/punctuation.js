/** A punctuation boundary is presentation/input data, never a physical card. */
export function validatePunctuation(punctuation,wordCount){
  if(!Array.isArray(punctuation)||punctuation.length>1)throw new TypeError('쉼표는 한 문장에 하나만 놓을 수 있습니다.');
  for(const mark of punctuation){
    if(!mark||Object.keys(mark).some(k=>!['kind','gapIndex'].includes(k))||mark.kind!=='COMMA'||!Number.isInteger(mark.gapIndex)||mark.gapIndex<0||mark.gapIndex>wordCount||wordCount===0)throw new TypeError('쉼표 경계가 올바르지 않습니다.');
  }
  return punctuation;
}
export function punctuationFromEditor(slots,editor){
  const comma=editor?.comma;
  if(!comma)return [];
  const gapIndex=comma.afterCardInstanceId===null?0:slots.findIndex(s=>s.cardInstanceId===comma.afterCardInstanceId)+1;
  if(comma.afterCardInstanceId!==null&&gapIndex===0)throw new TypeError('쉼표의 기준 카드가 없습니다.');
  return validatePunctuation([{kind:'COMMA',gapIndex}],slots.length);
}
export function formatSentence(snapshot){
  const tokens=snapshot?.orderedTokens??snapshot?.submittedTokens??[];
  const punctuation=snapshot?.punctuation??[];
  validatePunctuation(punctuation,tokens.length);
  const gap=punctuation[0]?.gapIndex;
  return tokens.map((t,i)=>`${i===0&&gap===0?', ':''}${t.surface}${gap===i+1?',':''}`).join(' ');
}
