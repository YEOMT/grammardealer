import {registry as defaultRegistry,makeToken,createSentenceSnapshot} from '../../data/language/index.js';
import {parseSupportedClause} from './parser.js';
export const GRAMMAR_VERSION='0.2.2';
export const snapshotFromSlots=createSentenceSnapshot;

/** Development fixture conversion only. Unknown words stay explicitly unsupported.
 * This cannot bypass the same token/surface validation used in normal play.
 */
export function snapshotFromText(text,{sentenceId='fixture',prefix='fixture'}={}) {
 if(typeof text!=='string')throw new TypeError('Fixture text must be a string');
 const words=text.trim().replace(/[.!?]+$/,'').split(/\s+/).filter(Boolean);
 const orderedTokens=words.map((word,position)=>{
  const matches=defaultRegistry.forms.filter(f=>f.surface.toLowerCase()===word.toLowerCase());
  const lexemeIds=[...new Set(matches.map(f=>f.lexemeId))];
  const selected=matches.find(f=>f.runtimeReady)??matches[0];
  if(!selected||lexemeIds.length!==1)return {cardInstanceId:`${prefix}.${position}`,cardDefId:null,lexemeId:null,selectionId:null,surface:word,allowedFormCandidates:[],position,unsupportedFixture:true};
  const def=defaultRegistry.cards.find(c=>c.lexemeId===selected.lexemeId);
  return makeToken(`${prefix}.${position}`,def.id,selected.id,position);
 });
 return {schemaVersion:1,sentenceId,languageVersion:defaultRegistry.version,orderedTokens,...(/[?]/.test(text)?{fixtureCapabilityId:'cap.question'}:{})};
}
const fingerprint=(tokens)=>{
 let value=2166136261;
 for(const char of tokens.map(t=>`${t.cardInstanceId}:${t.lexemeId}:${t.selectionId}:${t.surface}`).join('|')){value^=char.charCodeAt(0);value=Math.imul(value,16777619);}
 return (value>>>0).toString(16).padStart(8,'0');
};
const emptyResult=(snapshot)=>({schemaVersion:1,grammarVersion:GRAMMAR_VERSION,inputFingerprint:fingerprint(snapshot?.orderedTokens??[]),
 status:'ENGINE_ERROR',rootNodeId:null,mainClauseId:null,mainFrameId:null,nodes:[],clauses:[],resolvedTokenRoles:[],grammarHits:[],hits:[],issues:[],evidenceMarks:[],ambiguities:[],
 coverage:{consumedCardIds:[],issueAffectedCardIds:[],unlicensedCardIds:[]},excludedCardIds:[],diagnostics:{},messageKo:''});
/** Pure, bounded analysis of registered current-tense card tokens.
 * @param {{schemaVersion:number,sentenceId:string,orderedTokens:Array}} snapshot
 * @param {object} languageRegistry Immutable language database, never scoring/game data.
 * @returns {object} AnalysisResult
 */
export function analyzeSentence(snapshot,languageRegistry=defaultRegistry) {
 let result;
 try {
  if(!snapshot||!Array.isArray(snapshot.orderedTokens))throw new TypeError('Malformed SentenceSnapshot');
  result={...emptyResult(snapshot),grammarVersion:languageRegistry.version??GRAMMAR_VERSION};
  if(snapshot.schemaVersion!==1)throw new TypeError('Unsupported snapshot schema');
  if(snapshot.orderedTokens.length>16)return {...result,status:'UNSUPPORTED',messageKo:'문장 카드 한도는 16장입니다.',diagnostics:{limit:'MAX_TOKENS',maximum:16}};
  const ids=new Set();
  const tokens=snapshot.orderedTokens.map((token,position)=>{
   if(typeof token.cardInstanceId!=='string'||!token.cardInstanceId||ids.has(token.cardInstanceId))throw new TypeError('Duplicate or absent physical card ID');ids.add(token.cardInstanceId);
   if(token.unsupportedFixture===true&&token.lexemeId===null)return {...token,unsupported:true};
   const def=languageRegistry.cardById[token.cardDefId];const lex=languageRegistry.lexemeById[token.lexemeId];
   if(!def||!lex||def.lexemeId!==lex.id)throw new TypeError('Unregistered card or mismatched lexeme');
   const selection=languageRegistry.formById[token.selectionId];
   if(!selection||selection.lexemeId!==lex.id||selection.surface.toLowerCase()!==String(token.surface).toLowerCase())throw new TypeError('Surface does not match its registered form');
   if(token.position!==position)throw new TypeError('Position must match the ordered token sequence');
   // Never trust a hidden selection ID to choose the syntactic role of a homograph.
   const candidates=lex.formIds.map(id=>languageRegistry.formById[id]).filter(f=>f.surface.toLowerCase()===selection.surface.toLowerCase());
   const active=candidates.filter(f=>f.runtimeReady);
   return {...token,lex,sense:languageRegistry.senseById[lex.senseIds.find(id=>id.endsWith('.sense.basic'))??[...lex.senseIds].sort()[0]],senses:[...lex.senseIds].sort().map(id=>languageRegistry.senseById[id]).filter(Boolean),forms:active,surface:selection.surface,unsupported:active.length===0,unsupportedCapabilityId:selection.requiredCapabilityIds?.[0]};
  });
  if(snapshot.fixtureCapabilityId||tokens.some(t=>t.unsupported))return {...result,status:'UNSUPPORTED',messageKo:'이 원정의 문법 범위에서는 아직 판정하지 않습니다.',diagnostics:{capabilityId:snapshot.fixtureCapabilityId??tokens.find(t=>t.unsupported)?.unsupportedCapabilityId??'cap.unregistered.lexeme'}};
  const parsed=parseSupportedClause(tokens,languageRegistry);
  result={...result,...parsed};
  result.hits=result.grammarHits;result.excludedCardIds=result.coverage.unlicensedCardIds;
  return result;
 } catch(error) {
  const base=result??emptyResult({orderedTokens:[]});
  if(error?.code==='ENGINE_LIMIT')return {...base,status:'UNSUPPORTED',messageKo:'문장 분석 한도에 도달했습니다. 문장을 짧게 나누어 주세요.',diagnostics:{limit:error.message}};
  return {...base,status:'ENGINE_ERROR',messageKo:'판정 처리에 문제가 생겼습니다. 카드와 턴은 그대로입니다.',diagnostics:{errorId:`grammar.${base.inputFingerprint}`,detail:String(error?.message??error)}};
 }
}
