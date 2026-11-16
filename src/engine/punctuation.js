import {CLAUSE_INITIAL} from '../data/clausePolicy.js';
import {scoreEvent} from './numeric.js';

/** Word-structure quality before the separate late punctuation adjustment. */
export function completeWordStructure(analysis) {
 if(analysis.languagePolicyVersion!=='0.14.0')return analysis.status==='VALID'&&!(analysis.issues??[]).length;
 return ['VALID','VALID_WITH_ISSUES'].includes(analysis.status)&&!(analysis.issues??[]).some(i=>!i.punctuation);
}

/** Exactly one recoverable punctuation adjustment, after runes and before region/boss. */
export function applyPunctuationPenalty(analysis,postRuneScore,{attackId='attack.sandbox',eventOffset=0}={}) {
 const issues=(analysis.punctuationIssues??[]).filter(i=>i.recoverable);
 if(analysis.languagePolicyVersion!=='0.14.0'||!['VALID','VALID_WITH_ISSUES'].includes(analysis.status)||!issues.length)return {postPunctuationScore:postRuneScore,events:[]};
 const event=scoreEvent({attackId,index:eventOffset,phase:'ACCURACY',sourceType:'GRAMMAR',sourceId:'PUNCTUATION.COMMA',labelKo:'쉼표 위치 오류',operation:'MULTIPLY',operand:CLAUSE_INITIAL.punctuationPenalty,before:postRuneScore,evidenceRefs:issues.map(i=>i.id),highlightCardIds:[...new Set(issues.flatMap(i=>i.cardIds))],reasonKo:issues.map(i=>i.messageKo).join(' ')});
 event.labelKo=`쉼표 위치 오류 · −${event.before-event.after}`;
 return {postPunctuationScore:event.after,events:[event]};
}
