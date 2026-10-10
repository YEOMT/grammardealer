import {registryForVersion} from '../data/language/index.js';
import {analyzeSentence} from './grammar/index.js';
const okStatus=a=>['VALID','VALID_WITH_ISSUES'].includes(a?.status);
const digest=row=>{let h=2166136261;for(const c of JSON.stringify(row)){h=Math.imul(h^c.charCodeAt(0),16777619);}return (h>>>0).toString(16).padStart(8,'0');};
/** The single selected analysis graph is the only source; no past-attack role counters. */
export function relativeSealPair(analysis,submittedCards=[]){
 if(!okStatus(analysis)||analysis.grammarVersion!=='0.8.0')return null;
 const physical=new Set(submittedCards.map(c=>c.instanceId)),covered=new Set(analysis.coverage?.consumedCardIds??[]);
 if(physical.size!==submittedCards.length||physical.size!==covered.size||[...covered].some(id=>!physical.has(id)))return null;
 const rows=(analysis.relativeClauses??[]).filter(r=>{
  const node=analysis.nodes.find(n=>n.id===r.nodeId),clause=analysis.clauses.find(c=>c.id===r.childClauseId);
  return r.kind==='RELATIVE_PRONOUN'&&r.bonusEligible===true&&r.validity==='VALID'&&r.ownIssueIds?.length===0&&r.finiteVerbCardIds?.length>0&&node?.type==='RELATIVE_CLAUSE'&&node.children.includes(clause?.nodeId)&&clause.finite===true&&r.cardIds.every(id=>physical.has(id)&&covered.has(id))&&physical.has(r.antecedentHeadCardId)&&r.finiteVerbCardIds.every(id=>r.cardIds.includes(id))&&analysis.grammarHits.some(h=>h.relativeClauseId===r.id&&h.scopeNodeId===r.nodeId&&h.tag===`CLAUSE.RELATIVE.${r.relativeRole}`&&h.validity==='VALID'&&h.bonusEligible===true);
 });
 for(const s of rows.filter(r=>r.relativeRole==='SUBJECT'))for(const o of rows.filter(r=>r.relativeRole==='OBJECT'))if(s.nodeId!==o.nodeId&&s.childClauseId!==o.childClauseId&&s.rootSentenceId===o.rootSentenceId)return {sentenceId:s.rootSentenceId,subjectRelativeId:s.id,objectRelativeId:o.id,subjectEvidenceDigest:digest(s),objectEvidenceDigest:digest(o)};
 return null;
}
export function validateDualRelativeSeal(enemy){
 const b=enemy?.bossMechanic,integer=n=>Number.isSafeInteger(n)&&n>=0,fail=()=>{throw Error('Invalid dual relative seal');};
 if(b?.id!=='DUAL_RELATIVE_SEAL'||typeof b.unlocked!=='boolean'||!integer(b.totalPreventedDamage)||!Array.isArray(b.appliedAttackIds)||b.appliedAttackIds.some(id=>typeof id!=='string'||!id)||new Set(b.appliedAttackIds).size!==b.appliedAttackIds.length||!integer(enemy.hp)||!b.unlocked&&enemy.hp<1)fail();
 if('subjectDone'in b||'objectDone'in b)fail();
 if(!b.unlocked){if(b.unlockedByAttackId!==null||b.unlockWitness!==null)fail();}
 else if(!b.appliedAttackIds.includes(b.unlockedByAttackId)||!b.unlockWitness?.sentenceId||!b.unlockWitness.subjectRelativeId||!b.unlockWitness.objectRelativeId||b.unlockWitness.subjectRelativeId===b.unlockWitness.objectRelativeId||!b.unlockWitness.subjectEvidenceDigest||!b.unlockWitness.objectEvidenceDigest)fail();
 return true;
}
export function resolveDualRelativeSeal(analysis,power,enemy,{attackId,submittedCards=[]}={}){
 validateDualRelativeSeal(enemy);
 if(!Number.isSafeInteger(power)||power<0||typeof attackId!=='string'||!attackId)throw Error('Invalid relative seal attack');
 const after=structuredClone(enemy.bossMechanic);
 if(after.appliedAttackIds.includes(attackId))return {bossStateAfter:after,enemyHpAfter:enemy.hp,actualHpLoss:0,preventedDamage:0,overkill:0,replayed:true,unlockedNow:false};
 const witness=power>0?relativeSealPair(analysis,submittedCards):null,unlockedNow=!after.unlocked&&!!witness;
 if(unlockedNow)Object.assign(after,{unlocked:true,unlockedByAttackId:attackId,unlockWitness:witness});
 after.appliedAttackIds.push(attackId);
 const effective=okStatus(analysis)?power:0,enemyHpAfter=Math.max(after.unlocked?0:1,enemy.hp-effective),actualHpLoss=enemy.hp-enemyHpAfter;
 const preventedDamage=after.unlocked?0:Math.max(0,effective-actualHpLoss);after.totalPreventedDamage+=preventedDamage;
 return {bossStateAfter:after,enemyHpAfter,actualHpLoss,preventedDamage,overkill:after.unlocked?Math.max(0,effective-enemy.hp):0,replayed:false,unlockedNow};
}
/** Keep the unlocking submission independently of rolling UI history. No live-deck lookup. */
export function relativeSealReceipt(resolution){
 return Object.fromEntries(['attackId','runId','battleId','sentenceSnapshot','cardScoringSnapshot','preBossScore','enemyHpBefore','enemyHpAfter','bossStateBefore','bossStateAfter'].map(k=>[k,structuredClone(resolution[k])]));
}
export function validateRelativeSealReceipt(run){
 const c=run.combat,b=c?.enemyState.bossMechanic,r=c?.relativeSealUnlockReceipt,fail=()=>{throw Error('Invalid relative seal unlock receipt');};
 if(b?.id!=='DUAL_RELATIVE_SEAL'){if(r!==undefined)fail();return true;}
 validateDualRelativeSeal(c.enemyState);
 if(!b.unlocked){if(r!==undefined)fail();return true;}
 if(!r||r.runId!==run.runId||r.battleId!==c.enemyState.id||r.attackId!==b.unlockedByAttackId||r.sentenceSnapshot?.languageVersion!=='0.8.0'||r.preBossScore<=0||r.bossStateBefore?.unlocked!==false||r.bossStateAfter?.unlocked!==true)fail();
 const tokens=r.sentenceSnapshot.orderedTokens;
 if(!Array.isArray(r.cardScoringSnapshot)||r.cardScoringSnapshot.length!==tokens.length||r.cardScoringSnapshot.some((x,i)=>x.instanceId!==tokens[i].cardInstanceId||x.cardDefId!==tokens[i].cardDefId))fail();
 const analysis=analyzeSentence(r.sentenceSnapshot,registryForVersion('0.8.0'));
 const result=resolveDualRelativeSeal(analysis,r.preBossScore,{id:r.battleId,hp:r.enemyHpBefore,bossMechanic:r.bossStateBefore},{attackId:r.attackId,submittedCards:r.cardScoringSnapshot});
 if(!result.unlockedNow||result.enemyHpAfter!==r.enemyHpAfter||JSON.stringify(result.bossStateAfter)!==JSON.stringify(r.bossStateAfter)||JSON.stringify(result.bossStateAfter.unlockWitness)!==JSON.stringify(b.unlockWitness))fail();
 return true;
}
