import {assertSerializable,clone,requireId,requireInteger} from '../contracts.js';

export const FINALE_RULESET_ID='syntax-atlas.0.11.0';
export const LOCAL_LEADERBOARD_LABEL='이 기기의 클리어 랭킹';
export const LOCAL_LEADERBOARD_NOTICE='동일한 브라우저와 사이트의 프로필 기록만 표시합니다. 공용 랭킹은 연결되지 않았습니다.';
export const MEMORY_LEADERBOARD_NOTICE='이번 세션 기록 — 브라우저를 닫으면 사라질 수 있음';
const text=(value,name,max)=>{if(typeof value!=='string'||!value.trim()||value.length>max)throw Error(`${name} 정보가 잘못되었습니다.`);return value;};
const fields=(value,allowed,name)=>{if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).some(key=>!allowed.includes(key)))throw Error(`${name} 형식이 잘못되었습니다.`);};
export const isRecordEligibleRun=run=>run?.version==='0.11.0'&&!run.tutorialSession?.active&&!run.config?.qaFixture&&!run.config?.practice&&!run.config?.sandbox&&!run.qaFixture;
export const finaleClearId=(runId,rulesetId=FINALE_RULESET_ID)=>`${requireId(runId,'runId')}:${requireId(rulesetId,'rulesetId')}:FINAL50_CLEAR`;
export const clearStorageKey=clearId=>`finale:clear:${clearId}`;
export const bestStorageKey=(playerId,rulesetId)=>`finale:best:${JSON.stringify([playerId,rulesetId])}`;
export const FINALE_SEQUENCE_KEY='finale:sequence';

/** Immutable evidence from this accepted attack, independent of the recent-12 cache. */
export function buildBestAttackSnapshot({run,resolution,actionSequence=run?.revision,rulesetId=FINALE_RULESET_ID,allowQA=false}){
  const qa=allowQA&&run?.version==='0.11.0'&&(run.config?.qaFixture===true||run.qaFixture===true)&&!run.tutorialSession?.active&&!run.config?.practice&&!run.config?.sandbox;
  if((!isRecordEligibleRun(run)&&!qa)||!resolution?.accepted||resolution.visualBasis?.synthetic||!['VALID','VALID_WITH_ISSUES'].includes(resolution.status??resolution.analysis?.status)||resolution.finalPower<=0)return null;
  const submittedTokens=resolution.sentenceSnapshot.orderedTokens.map((token,position)=>({cardDefId:token.cardDefId,lexemeId:token.lexemeId,selectedFormId:token.selectionId??token.selectedFormId,surface:token.surface,position}));
  const snapshot={rulesetId,campaignVersion:run.version,languageVersion:resolution.versions?.language??resolution.sentenceSnapshot.languageVersion,scorePolicyVersion:resolution.versions?.balance??run.versions?.balance??run.version,runId:run.runId,attackId:resolution.attackId,battleNumber:run.progress.battleNumber,stageId:run.progress.stageId,
    ...(resolution.phaseId?{phaseId:resolution.phaseId}:{}),finalPower:resolution.finalPower,actualHpLoss:resolution.actualHpLoss,overkill:resolution.overkill,
    ...(resolution.preventedDamage!==undefined?{preventedBySeal:resolution.preventedDamage}:{}),...(qa?{qaFixture:true}:{}),submittedTokens,sentenceText:submittedTokens.map(t=>t.surface).join(' '),recordedActionSequence:actionSequence};
  validateBestAttackSnapshot(snapshot);return clone(snapshot);
}
export function updateBestAttackSnapshot(previous,candidate){
  if(!candidate)return previous?clone(previous):null;
  validateBestAttackSnapshot(candidate);if(previous){validateBestAttackSnapshot(previous);if(previous.runId!==candidate.runId||previous.rulesetId!==candidate.rulesetId||Boolean(previous.qaFixture)!==Boolean(candidate.qaFixture))throw Error('최고 공격 기록의 원정이 다릅니다.');}
  return clone(!previous||candidate.finalPower>previous.finalPower?candidate:previous);
}
export function validateBestAttackSnapshot(snapshot){
  assertSerializable(snapshot);fields(snapshot,['rulesetId','campaignVersion','languageVersion','scorePolicyVersion','runId','attackId','battleNumber','stageId','phaseId','finalPower','actualHpLoss','overkill','preventedBySeal','submittedTokens','sentenceText','recordedActionSequence','qaFixture'],'최고 공격');
  for(const field of ['rulesetId','campaignVersion','languageVersion','scorePolicyVersion','runId','attackId','stageId'])requireId(snapshot[field],field);
  if(snapshot.campaignVersion!=='0.11.0')throw Error('클리어 기록의 원정 버전이 다릅니다.');
  if(snapshot.qaFixture!==undefined&&snapshot.qaFixture!==true)throw Error('QA 기록 구분이 잘못되었습니다.');
  if(snapshot.phaseId!==undefined)requireId(snapshot.phaseId,'phaseId');
  requireInteger(snapshot.battleNumber,'battleNumber',1,50);requireInteger(snapshot.recordedActionSequence,'recordedActionSequence',0);
  requireInteger(snapshot.finalPower,'finalPower',1);requireInteger(snapshot.actualHpLoss,'actualHpLoss',0,snapshot.finalPower);requireInteger(snapshot.overkill,'overkill',0,snapshot.finalPower);
  if(snapshot.preventedBySeal!==undefined)requireInteger(snapshot.preventedBySeal,'preventedBySeal',0,snapshot.finalPower);
  if(!Array.isArray(snapshot.submittedTokens)||snapshot.submittedTokens.length<1||snapshot.submittedTokens.length>24)throw Error('제출 카드 기록이 잘못되었습니다.');
  snapshot.submittedTokens.forEach((token,index)=>{fields(token,['cardDefId','lexemeId','selectedFormId','surface','position'],'제출 카드');for(const field of ['cardDefId','lexemeId','selectedFormId'])requireId(token[field],field);text(token.surface,'surface',100);if(token.position!==index)throw Error('제출 카드 순서가 잘못되었습니다.');});
  text(snapshot.sentenceText,'sentenceText',2423);if(snapshot.sentenceText!==snapshot.submittedTokens.map(t=>t.surface).join(' '))throw Error('점수와 실제 제출 문장이 일치하지 않습니다.');
  return true;
}
export function buildClearRecord({runId,playerId,displayName,rulesetId=FINALE_RULESET_ID,campaignVersion='0.11.0',bestAttackSnapshot,completionEvidence,eligible=false}){
  if(!eligible)return null;
  const record={clearId:finaleClearId(runId,rulesetId),runId,playerId,displayName,rulesetId,campaignVersion,bestAttackSnapshot:clone(bestAttackSnapshot),completionEvidence:clone(completionEvidence),verificationLevel:'LOCAL_UNVERIFIED'};
  validateClearRecord(record);return record;
}
export function validateClearRecord(record){
  assertSerializable(record);fields(record,['clearId','runId','playerId','displayName','rulesetId','campaignVersion','bestAttackSnapshot','completionEvidence','verificationLevel','storedSequence'],'클리어 기록');
  for(const field of ['runId','playerId','rulesetId','campaignVersion'])requireId(record[field],field);text(record.displayName,'displayName',30);
  if(record.campaignVersion!=='0.11.0'||record.clearId!==finaleClearId(record.runId,record.rulesetId)||record.verificationLevel!=='LOCAL_UNVERIFIED')throw Error('지원하지 않는 클리어 기록입니다.');
  validateBestAttackSnapshot(record.bestAttackSnapshot);if(record.bestAttackSnapshot.qaFixture)throw Error('지정 덱 QA 기록은 랭킹에 등록하지 않습니다.');if(record.bestAttackSnapshot.runId!==record.runId||record.bestAttackSnapshot.rulesetId!==record.rulesetId||record.bestAttackSnapshot.campaignVersion!==record.campaignVersion)throw Error('대표 공격과 클리어 원정이 다릅니다.');
  const evidence=record.completionEvidence,receipts=evidence?.phaseClearReceipts;
  fields(evidence,['boundary','phaseClearReceipts'],'클리어 근거');
  if(evidence?.boundary!=='FINAL50_CLEAR'||!Array.isArray(receipts)||receipts.length!==3)throw Error('최종 50전투 완료 근거가 없습니다.');
  receipts.forEach((receipt,index)=>{fields(receipt,['battleNumber','runId','settlementId'],'페이즈 정산');if(receipt.battleNumber!==48+index||receipt.runId!==record.runId||receipt.settlementId!==`${record.runId}:${48+index}:VICTORY`)throw Error('최종 페이즈 정산 근거가 잘못되었습니다.');});
  if(new Set(receipts.map(r=>r.settlementId)).size!==3)throw Error('최종 페이즈 정산이 중복되었습니다.');
  if(record.storedSequence!==undefined)requireInteger(record.storedSequence,'storedSequence',1);
  return true;
}
const compareRecords=(a,b)=>b.bestAttackSnapshot.finalPower-a.bestAttackSnapshot.finalPower||a.storedSequence-b.storedSequence||(a.clearId<b.clearId?-1:a.clearId>b.clearId?1:0);
export function topClearRecords(records,{rulesetId=FINALE_RULESET_ID,limit=20}={}){
  requireId(rulesetId,'rulesetId');requireInteger(limit,'limit',1,20);
  const best=new Map();for(const record of records){validateClearRecord(record);requireInteger(record.storedSequence,'storedSequence',1);if(record.rulesetId!==rulesetId)continue;const old=best.get(record.playerId);if(!old||compareRecords(record,old)<0)best.set(record.playerId,record);}
  return [...best.values()].sort(compareRecords).slice(0,limit).map(clone);
}
/** Persistence, not gameplay authority. Caller supplies an engine-produced record. */
export class LocalLeaderboardRepository{
  constructor(store,{profile}={}){this.mode='LOCAL';this.store=store;this.profile=profile;this.verificationLevel='LOCAL_UNVERIFIED';}
  listTop(options){return this.store.listClearTop(options);}
  getOwnBest(options){return this.store.getOwnClearBest(options);}
  upsertClear(clearRecord,{idempotencyKey=clearRecord.clearId,profile=this.profile}={}){if(idempotencyKey!==clearRecord.clearId)return Promise.reject(Error('클리어 재전송 키가 다릅니다.'));return this.store.saveFinaleClear(profile,clearRecord);}
}
/** Explicit session-only fallback; this is never described as public or durable. */
export class MemoryLeaderboardRepository{
  constructor(){this.mode='LOCAL';this.persistence='MEMORY';this.verificationLevel='LOCAL_UNVERIFIED';this.records=new Map();this.sequence=0;}
  async upsertClear(record,{idempotencyKey=record.clearId}={}){validateClearRecord(record);if(idempotencyKey!==record.clearId)throw Error('클리어 재전송 키가 다릅니다.');const old=this.records.get(record.clearId);if(old&&old.playerId!==record.playerId)throw Error('클리어 플레이어가 다릅니다.');if(!old)this.records.set(record.clearId,{...clone(record),storedSequence:++this.sequence});return {record:clone(this.records.get(record.clearId)),ownBest:await this.getOwnBest({playerKey:record.playerId,rulesetId:record.rulesetId}),duplicate:Boolean(old),mode:this.mode,persistence:this.persistence};}
  async listTop(options){return topClearRecords([...this.records.values()],options);}
  async getOwnBest({playerKey,rulesetId=FINALE_RULESET_ID}){requireId(playerKey,'playerKey');return topClearRecords([...this.records.values()].filter(r=>r.playerId===playerKey),{rulesetId,limit:1})[0]??null;}
  async listClears(playerId){return [...this.records.values()].filter(r=>r.playerId===playerId).map(clone);}
}
/** Optional transport is provided by an approved service; no endpoint or credentials ship here. */
export class RemoteLeaderboardRepository{
  constructor({transport=null}={}){this.mode='REMOTE';this.connected=Boolean(transport);this.transport=transport;}
  _call(method,...args){if(!this.transport||typeof this.transport[method]!=='function')return Promise.reject(Error('공용 랭킹 미연결'));return Promise.resolve().then(()=>this.transport[method](...args));}
  listTop(options){return this._call('listTop',options);}
  getOwnBest(options){return this._call('getOwnBest',options);}
  upsertClear(record,{idempotencyKey=record.clearId}={}){validateClearRecord(record);if(idempotencyKey!==record.clearId)return Promise.reject(Error('클리어 재전송 키가 다릅니다.'));return this._call('upsertClear',clone(record),{idempotencyKey});}
}
