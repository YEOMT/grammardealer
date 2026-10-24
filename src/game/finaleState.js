import {hasFinaleCampaign} from '../data/campaignFeatures.js';
import {registryForVersion,createSentenceSnapshot} from '../data/language/index.js';
import {analyzeSentence} from '../engine/grammar/index.js';
import {comboEligibility} from '../engine/comboEligibility.js';
import {buildFinaleTaskPool,createSurfacePlan,createDeepTaskPlan,matchFinaleTask} from './finaleTasks.js';
import {chooseRuneSealTargets,resolveSurfaceTurnEnd} from '../engine/finale.js';
import {issueFinaleFrost} from './finaleCards.js';
import {buildBestAttackSnapshot,updateBestAttackSnapshot,validateBestAttackSnapshot,validateClearRecord,isRecordEligibleRun} from '../services/clearLeaderboard.js';

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=message=>{throw Error('Finale state: '+message);};
const equipped=run=>run.runes.orderedInstanceIds.map(id=>run.runes.instances[id]);

/** Called only inside a controller proposal, before the normal battle shuffle. */
export function prepareFinaleBattle(run,enemy){
 if(!hasFinaleCampaign(run)||run.progress.stageId!=='stage.final')return null;
 const f=run.finale;
 f.phaseIndex=run.progress.roundIndex;f.battleNumber=run.progress.battleNumber;
 const m=enemy.bossMechanic;
 if(m.id==='FINALE_UNIVERSAL')return null;
 const pool=buildFinaleTaskPool(run.activeCardIds,run.cardInstances,{registry:registryForVersion(run.version),comboEligibility:comboEligibility(run)});
 if(m.id==='FINALE_SURFACE'){
  const plan=createSurfacePlan(pool,run.rng.encounter);
  Object.assign(m,{taskPlan:plan.tasks,taskCursor:0,activeTask:plan.tasks[0],layersRemaining:2,appliedAttackIds:[],layerReceipts:[],turnEndReceipts:[]});
  f.fixedTaskPlan=structuredClone(plan);f.taskSearch=pool.search;
  return plan.dustCount;
 }
 const targets=chooseRuneSealTargets(f.runeContributions,equipped(run),{version:run.version}),plan=createDeepTaskPlan(pool,targets,run.rng.encounter);
 Object.assign(m,{orderedSealTargets:targets,taskPlan:plan.tasks,completedRuneSeals:0,sealedRuneInstanceId:targets[0]?.instanceId??null,activeTask:plan.tasks[0]??null,pendingNextRuneSeal:false,appliedAttackIds:[],releaseReceipts:[]});
 f.orderedSealTargets=structuredClone(targets);f.deepTaskPlan=structuredClone(plan);return null;
}
export function issueActiveFinaleFrost(run){
 const m=run.combat?.enemyState.bossMechanic;
 if(m?.id==='FINALE_SURFACE'&&m.activeTask?.supportCardDefId)return issueFinaleFrost(run,{layerIndex:m.taskCursor,cardDefId:m.activeTask.supportCardDefId});
 return null;
}
export function beginNextFinaleTurn(run){
 const m=run.combat?.enemyState.bossMechanic;
 if(m?.id==='FINALE_DEEP'&&m.pendingNextRuneSeal){const index=m.completedRuneSeals;m.sealedRuneInstanceId=m.orderedSealTargets[index].instanceId;m.activeTask=structuredClone(m.taskPlan[index]);m.pendingNextRuneSeal=false;}
}
/** Actual consumed turn. Animation completion never calls this. */
export function settleSurfaceTurnEnd(run,actionId){
 const c=run.combat,e=c.enemyState;if(e.bossMechanic?.id!=='FINALE_SURFACE')return null;
 const hp=e.hp,r=resolveSurfaceTurnEnd(e,{turnKey:`${e.id}:${c.turnIndex}`,actionId});
 e.hp=r.enemyHpAfter;e.bossMechanic=r.bossStateAfter;
 return {bossId:'FINALE_SURFACE',actionId,turnIndex:c.turnIndex,hpAfterAttack:hp,hpAfterTurnEnd:e.hp,actualHeal:r.actualHeal,killed:hp===0,suppressed:false};
}
export function recordFinaleAttack(run,resolution){
 if(!hasFinaleCampaign(run))return;
 const f=run.finale;
 for(const [id,value]of Object.entries(resolution.runeContributions??{}))f.runeContributions[id]=Math.max(f.runeContributions[id]??0,value);
 const candidate=buildBestAttackSnapshot({run,resolution,actionSequence:run.stats.attacks});
 f.bestAttackSnapshot=updateBestAttackSnapshot(f.bestAttackSnapshot,candidate);
 if(run.config.qaFixture)f.qaBestAttackSnapshot=updateBestAttackSnapshot(f.qaBestAttackSnapshot,buildBestAttackSnapshot({run,resolution,actionSequence:run.stats.attacks,allowQA:true}));
}

/** Persisted tasks are checked against their actual physical-copy parser witnesses. */
function validateTask(run,task){
 if(!task||!['FRAME','GRAMMAR','OWNED_VERB','TENSE'].includes(task.type)||!Array.isArray(task.witnessSlots)||task.witnessSlots.length>24||task.witnessSlots.length!==task.witnessCardDefIds?.length)fail('task witness');
 const cards=structuredClone(run.cardInstances);let missing=0;
 for(const [i,slot]of task.witnessSlots.entries()){
  const id=slot.cardInstanceId,definition=task.witnessCardDefIds[i];
  if(run.activeCardIds.includes(id)){if(cards[id]?.cardDefId!==definition)fail('witness owned copy');}
  else {if(!id.startsWith('finale.witness.support.')||definition!==task.supportCardDefId||++missing>1||['OWNED_VERB','TENSE'].includes(task.type))fail('witness support');cards[id]={instanceId:id,cardDefId:definition,polishLevel:0,specialEffectId:null};}
 }
 if(Boolean(missing)!==Boolean(task.supportCardDefId)||new Set(task.witnessSlots.map(s=>s.cardInstanceId)).size!==task.witnessSlots.length)fail('witness copies');
 const available=new Map();for(const id of run.activeCardIds){const def=run.cardInstances[id].cardDefId;available.set(def,(available.get(def)??0)+1);}
 const deficits=[];for(const def of task.witnessCardDefIds){const n=available.get(def)??0;if(n)available.set(def,n-1);else deficits.push(def);}
 if(!same(deficits,task.supportCardDefId?[task.supportCardDefId]:[]))fail('witness permanent deficit');
 const registry=registryForVersion(run.version),snapshot=createSentenceSnapshot(task.witnessSlots,cards,{languageVersion:registry.version}),analysis=analyzeSentence(snapshot,registry);
 if(analysis.status!=='VALID'||!matchFinaleTask(task,analysis,{comboEligibility:comboEligibility(run),submittedCards:snapshot.orderedTokens}))fail('unsupported task');
}

export function validateFinaleRun(run,{verifyWitnesses=true}={}){
 if(!hasFinaleCampaign(run)){if(run.finale!==undefined)fail('legacy finale');return true;}
 const f=run.finale;if(f?.version!=='0.11.0'||f.bossPolicyVersion!=='0.11.0'||!Array.isArray(f.phaseClearReceipts)||f.phaseClearReceipts.length>3||!f.runeContributions||typeof f.runeContributions!=='object')fail('policy');
 for(const value of Object.values(f.runeContributions))if(!Number.isSafeInteger(value)||value<0)fail('contribution');
 for(const [i,r]of f.phaseClearReceipts.entries())if(r.runId!==run.runId||r.battleNumber!==48+i||r.settlementId!==`${run.runId}:${48+i}:VICTORY`||!run.settlementIds.includes(r.settlementId))fail('phase receipt');
 for(const name of ['bestAttackSnapshot','qaBestAttackSnapshot'])if(f[name]){validateBestAttackSnapshot(f[name]);if(f[name].runId!==run.runId||f[name].battleNumber>run.progress.battleNumber||f[name].finalPower>run.stats.bestAttack)fail('best attack reference');}
 if(run.config.qaFixture&&f.bestAttackSnapshot)fail('QA in real records');
 if(f.bestAttackSnapshot?.qaFixture||f.qaBestAttackSnapshot&&(!run.config.qaFixture||f.qaBestAttackSnapshot.qaFixture!==true))fail('mixed QA evidence');
 if(f.clearRecord){
  validateClearRecord(f.clearRecord);
  if(!isRecordEligibleRun(run)||run.status!=='CONTENT_COMPLETE'||run.clearKind!=='FINAL_CLEAR'||run.progress.contentBoundary!=='FINAL50_CLEAR'||f.clearRecord.runId!==run.runId||!same(f.clearRecord.bestAttackSnapshot,f.bestAttackSnapshot)||!same(f.clearRecord.completionEvidence.phaseClearReceipts,f.phaseClearReceipts))fail('clear record reference');
 }
 if(run.progress.stageId!=='stage.final'){if(f.phaseClearReceipts.length||f.phaseIndex!==undefined)fail('premature finale');return true;}
 if(!Array.from({length:10},(_,i)=>`STAGE${i+1}_CLEAR`).every(id=>run.milestoneIds.includes(id)))fail('missing prior milestones');
 const grant=run.entryGrants?.['stage.final'];if(grant&&(grant.entryGrantId!==`${run.runId}:stage.final.entry`||grant.applied!==true||grant.cardInstanceIds?.length!==0||grant.cardDefIds?.length!==0))fail('final entry');
 if(run.status!=='STAGE_INTRO'&&(!grant||f.shopReceipt?.shopId!==`shop.${run.runId}.stage.final`))fail('last shop');
 const c=run.combat;if(!c){if(f.phaseClearReceipts.length)fail('missing phase');return true;}
 const index=run.progress.roundIndex,m=c.enemyState.bossMechanic;
 if(f.phaseIndex!==index||f.battleNumber!==48+index||m?.id!==['FINALE_SURFACE','FINALE_DEEP','FINALE_UNIVERSAL'][index]||m.policyVersion!=='finale.0.11.0')fail('phase');
 const victories=index+(c.settled?1:0);if(f.phaseClearReceipts.length!==victories)fail('phase ordering');
 if(index===0){
  if(!Array.isArray(m.taskPlan)||m.taskPlan.length!==2||new Set(m.taskPlan.map(t=>t.type)).size!==2||m.taskPlan.some(t=>t.type==='TENSE')||!same(m.taskPlan,f.fixedTaskPlan?.tasks)||![0,1,2].includes(m.taskCursor)||m.layersRemaining!==2-m.taskCursor||!same(m.activeTask,m.taskPlan[m.taskCursor]??null)||m.layerReceipts?.length!==m.taskCursor)fail('surface layers');
  if(verifyWitnesses)m.taskPlan.forEach(t=>validateTask(run,t));
  if(c.finaleDustTrace?.count!==f.fixedTaskPlan.dustCount)fail('dust plan');
  for(const [i,r]of m.layerReceipts.entries()){const a=run.stats.history.find(a=>a.attackId===r.attackId);if(r.taskIndex!==i||!a?.surfaceResult?.layerBroken||a.surfaceResult.bossStateAfter.taskCursor!==i+1)fail('layer attack reference');}
  for(const r of c.finaleFrostTrace??[])if(m.taskPlan[r.layerIndex]?.supportCardDefId!==r.cardDefId||r.layerIndex>m.taskCursor)fail('frost task');
  let hp=5000;
  if(m.turnEndReceipts?.length!==c.rulesSnapshot.turnLimit-c.turnsRemaining)fail('turn receipt count');
  for(const [i,r]of m.turnEndReceipts.entries()){
   const a=run.stats.history.find(a=>a.attackId===r.actionId),before=a?a.enemyHpAfter:hp;
   if(r.turnKey!==`${c.enemyState.id}:${i+1}`||r.hpBefore!==before||a&&a.enemyHpBefore!==hp||!a&&!r.actionId.includes(':prepare.')||r.actualHeal!==(before>0?Math.min(400,5000-before):0)||r.hpAfter!==before+r.actualHeal)fail('turn recovery receipt');hp=r.hpAfter;
  }
  if(c.enemyState.hp!==hp)fail('surface HP history');
 }else if(index===1){
  if(!same(m.orderedSealTargets,f.orderedSealTargets)||m.orderedSealTargets?.length>2||new Set(m.orderedSealTargets.map(r=>r.instanceId)).size!==m.orderedSealTargets.length||!same(m.taskPlan,f.deepTaskPlan?.tasks)||m.taskPlan.length!==m.orderedSealTargets.length||!Number.isInteger(m.completedRuneSeals)||m.completedRuneSeals<0||m.completedRuneSeals>m.taskPlan.length||m.releaseReceipts?.length!==m.completedRuneSeals)fail('deep sequence');
  if(verifyWitnesses)m.taskPlan.forEach(t=>validateTask(run,t));
  if(!same(m.orderedSealTargets,chooseRuneSealTargets(f.runeContributions,equipped(run),{version:run.version})))fail('rune target contribution');
  for(const [i,r]of m.releaseReceipts.entries()){const a=run.stats.history.find(a=>a.attackId===r.attackId);if(r.runeInstanceId!==m.orderedSealTargets[i].instanceId||!a?.deepRelease?.unsealedNow)fail('rune release reference');}
  if(!c.settled&&run.status!=='DEFEAT'){const active=m.completedRuneSeals<m.taskPlan.length&&!m.pendingNextRuneSeal;if(m.sealedRuneInstanceId!==(active?m.orderedSealTargets[m.completedRuneSeals].instanceId:null)||!same(m.activeTask,active?m.taskPlan[m.completedRuneSeals]:null))fail('active rune seal');}
 }else if(m.layersRemaining!==undefined||m.sealedRuneInstanceId!==undefined||c.temporaryCardIds?.length)fail('interference in Universal');
 if(run.status==='CONTENT_COMPLETE'&&(run.clearKind!=='FINAL_CLEAR'||run.progress.contentBoundary!=='FINAL50_CLEAR'||f.phaseClearReceipts.length!==3||c.enemyState.hp!==0||isRecordEligibleRun(run)&&!f.clearRecord))fail('final clear');
 return true;
}
