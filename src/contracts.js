/** Public serializable contracts. Engine modules receive snapshots, never live RunState.
 * @typedef {'VALID'|'VALID_WITH_ISSUES'|'INVALID_CORE'|'UNSUPPORTED'|'ENGINE_ERROR'} AnalysisStatus
 * @typedef {{cardInstanceId:string,cardDefId:string,lexemeId:string,selectionId:string,surface:string,allowedFormCandidates:string[],position:number}} SentenceToken
 * @typedef {{schemaVersion:string,sentenceId:string,orderedTokens:SentenceToken[]}} SentenceSnapshot
 * @typedef {{tag:string,scope:string,cardIds:string[],validity:'VALID'|'RECOVERED',evidenceKey:string}} GrammarHit
 * @typedef {{schemaVersion:string,grammarVersion:string,inputFingerprint:string,status:AnalysisStatus,rootNodeId:string|null,mainClauseId:string|null,nodes:object[],clauses:object[],resolvedTokenRoles:object[],grammarHits:GrammarHit[],issues:object[],evidenceMarks:object[],ambiguities:object[],coverage:object,diagnostics:object}} AnalysisResult
 * @typedef {{instanceId:string,cardDefId:string,polishLevel:number,specialEffectId:null}} CardInstance
 * @typedef {{cardInstanceId:string,selection:string|null}} SentenceSlot
 * @typedef {{eventId:string,phase:string,sourceType:string,sourceId:string,operation:string,operand:number|{num:number,den:number},before:number,after:number,evidenceRefs:string[],highlightCardIds:string[],labelKo:string}} ScoreEvent
 * @typedef {{attackId:string,runId:string,battleId:string,expectedRevision:number,sentenceSnapshot:SentenceSnapshot,analysis:AnalysisResult,scoreTimeline:ScoreEvent[],finalPower:number,actualHpLoss:number,overkill:number,enemyHpBefore:number,enemyHpAfter:number,killed:boolean}} AttackResolution
 */
export const VERSIONS = Object.freeze({game:'0.1.1',save:'0.1.1',language:'0.1.1',grammar:'0.1.1',balance:'0.1.1',generator:'0.1.1',reward:'0.1.1',meaning:'0.1.1',tutorial:'0.1.1',runes:'0.1.0',presentation:'0.1.1'});
export const clone = value => structuredClone(value);
export function deepFreeze(value) {if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(deepFreeze);}return value;}
export function requireInteger(value,name,min=0,max=Number.MAX_SAFE_INTEGER) {if(!Number.isSafeInteger(value)||value<min||value>max)throw new TypeError(`${name}: invalid integer`);return value;}
export function requireId(value,name='id'){if(typeof value!=='string'||!value||value.length>200)throw new TypeError(`${name}: invalid ID`);return value;}
export function assertSerializable(value){const walk=x=>{if(x===null||typeof x==='string'||typeof x==='boolean')return;if(typeof x==='number'){if(!Number.isFinite(x))throw Error('Non-finite state');return;}if(Array.isArray(x)){x.forEach(walk);return;}if(x&&Object.getPrototypeOf(x)===Object.prototype){Object.values(x).forEach(walk);return;}throw Error('Non-serializable state');};walk(value);return true;}
