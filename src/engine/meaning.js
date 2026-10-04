import {registry} from '../data/language/index.js';
import {KoreanSenseTemplates} from '../data/koreanSenseTemplates.js';
export const MEANING_VERSION='0.2.0';
export const MEANING_NOTE='게임은 문장 구조를 중심으로 점수를 계산합니다. 뜻과 자연스러움은 문맥에 따라 달라질 수 있어요.';
const particle=(word,withFinal,withoutFinal)=>{const code=word.charCodeAt(word.length-1)-0xac00;return word+(code>=0&&code<=11171&&code%28!==0?withFinal:withoutFinal);};
/** Read-only meaning aid. Grammar/scoring never import this module. */
export function meaningPreview(analysis,snapshot,templates=KoreanSenseTemplates){
 const unavailable={status:'UNAVAILABLE',textKo:'이전 기록: 해석 정보 없음',segments:[],noteKo:MEANING_NOTE,meaningVersion:MEANING_VERSION};
 try{if(!analysis||!Array.isArray(snapshot?.orderedTokens))return unavailable;
 const tokens=snapshot.orderedTokens,byId=new Map(tokens.map(t=>[t.cardInstanceId,t])),lex=t=>registry.lexemeById[t?.lexemeId],lemma=t=>lex(t)?.lemma,gloss=t=>`${t?.surface??'?'}: ${lex(t)?.glossKo??'등록된 뜻 없음'}`;
 const roles=analysis.resolvedTokenRoles??[],nodes=analysis.nodes??[],roleId=role=>roles.find(r=>r.role===role)?.cardInstanceId;
 const phrase=(id)=>{const node=nodes.find(n=>['NP','AP'].includes(n.type)&&n.headCardId===id);return (node?.cardIds??[id]).map(id=>byId.get(id)).filter(Boolean);};
 const subject=phrase(roleId('SUBJECT')),object=phrase(roleId('OBJECT')||roleId('COMPLEMENT')),indirect=phrase(roleId('INDIRECT_OBJECT')),direct=phrase(roleId('DIRECT_OBJECT')),verb=byId.get(analysis.clauses?.[0]?.verbCardId);
 const used=new Set([...subject,...object,...indirect,...direct,verb].filter(Boolean).map(t=>t.cardInstanceId)),modifiers=tokens.filter(t=>!used.has(t.cardInstanceId));
 const segments=[['주어',subject],['행동',verb?[verb]:[]],['간접목적어 IO',indirect],['직접목적어 DO',direct],['대상·상태',object],['수식',modifiers]].filter(([,ts])=>ts.length).map(([label,ts])=>({label,textKo:ts.map(gloss).join(' · '),cardIds:ts.map(t=>t.cardInstanceId)}));
 const partial=()=>({status:'PARTIAL_HINT',textKo:'이 문장은 단어별 뜻을 참고해 보세요.',segments:segments.length?segments:[{label:'단어',textKo:tokens.map(gloss).join(' · '),cardIds:tokens.map(t=>t.cardInstanceId)}],noteKo:MEANING_NOTE,meaningVersion:MEANING_VERSION});
 if(!['VALID','VALID_WITH_ISSUES'].includes(analysis.status)||!subject.length||!verb)return partial();
 // No unregistered role-playing sense is silently assigned to play.
 if(lemma(verb)==='play'||nodes.some(n=>n.type==='PP')||modifiers.length>1)return partial();
 const np=ts=>{let missing=false;const words=ts.map(t=>{const l=lex(t),key=l?.lemma,role=roles.find(r=>r.cardInstanceId===t.cardInstanceId)?.role;let value;if(role==='DETERMINER')value=templates.determiners?.[t.surface.toLowerCase()]??templates.determiners?.[key];else if(l?.pos==='ADJECTIVE')value=templates.adjectives?.[key]?.[1];else value=templates.nouns?.[key];if(value===undefined)missing=true;return value;}).filter(Boolean);return missing?null:words.join(' ');};
 const s=np(subject),adv=modifiers.length?templates.adverbs?.[lemma(modifiers[0])]:'',frame=analysis.clauses?.[0]?.internalFrameId??analysis.mainFrameId;
 if(!s||adv===undefined)return partial();let predicate;
 if(frame==='frame.sv')predicate=templates.verbs?.[lemma(verb)]?.sv;
 else if(frame==='frame.svoo'){
  // Recovered grammar is shown as components, never quietly translated into a perfect answer.
  if(analysis.status!=='VALID'||analysis.issues?.length)return partial();
  const io=np(indirect),objectText=np(direct),v=templates.verbs?.[lemma(verb)]?.svoo;
  if(io&&objectText&&v)predicate=`${io}에게 ${particle(objectText,'을','를')} ${v}`;
 }
 else if(frame==='frame.svo'){const o=np(object),v=templates.verbs?.[lemma(verb)]?.svo;if(o&&v)predicate=`${particle(o,'을','를')} ${v}`;}
 else if(frame==='frame.svc.adj'&&lemma(verb)==='be'&&object.length===1)predicate=templates.adjectives?.[lemma(object[0])]?.[0];
 else if(frame==='frame.svc.np'&&lemma(verb)==='be'){const o=np(object);if(o)predicate=particle(o,'이다','이다');}
 if(!predicate)return partial();
 return{status:'COMPLETE_HINT',textKo:`${particle(s,'은','는')} ${adv?adv+' ':''}${predicate}.`,segments,noteKo:MEANING_NOTE,meaningVersion:MEANING_VERSION};
 }catch{return {...unavailable,textKo:'뜻 참고를 구성하지 못했습니다. 원문의 문법 기록은 그대로 유지됩니다.'};}
}
export function learningSummary(resolution){return{meaning:meaningPreview(resolution.analysis,resolution.sentenceSnapshot),grammarStatus:resolution.analysis?.status??'UNKNOWN',issues:(resolution.analysis?.issues??[]).map(i=>({code:i.code,messageKo:i.messageKo??i.labelKo??i.code}))};}
