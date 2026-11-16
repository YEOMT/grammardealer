import {registryForVersion} from '../data/language/index.js';
import {analyzeSentence} from '../engine/grammar/index.js';
import {resolveAttack} from '../engine/stage.js';
import {initialClauseThreads} from '../engine/clauseThreads.js';
import {stageForRun} from '../data/stages.js';
import {comboEligibility} from '../engine/comboEligibility.js';

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const keys=['attackId','runId','battleId','sentenceSnapshot','cardScoringSnapshot','runeSnapshot','comboEligibility','status','preBossScore','finalPower','actualHpLoss','enemyHpBefore','enemyHpAfter','clauseThreadResult'];
/** Independent of the rolling codex history, with only replay inputs and outcomes. */
export function clauseThreadReceipt(resolution){return Object.fromEntries(keys.filter(k=>resolution[k]!==undefined).map(k=>[k,structuredClone(resolution[k])]));}

export function validateClauseThreadsRun(run){
 const c=run.combat;if(!c)return true;
 const expected=run.version==='0.14.0'&&run.progress.stageId==='stage.10'&&run.progress.roundIndex===4;
 const fail=()=>{throw Error('Invalid clause threads receipt chain');};
 if(!expected){if(c.enemyState.bossMechanic?.id==='FATE_CLAUSE_THREADS'||c.clauseThreadReceipts!==undefined||c.clauseThreadRuneBaseline!==undefined||c.clauseThreadCardBaseline!==undefined)fail();return true;}
 if(c.enemyState.maxHp!==5000||!Array.isArray(c.clauseThreadReceipts)||c.clauseThreadReceipts.length>c.rulesSnapshot.turnLimit||!c.clauseThreadRuneBaseline||!c.clauseThreadCardBaseline)fail();
 if(!c.settled&&Object.entries(c.clauseThreadRuneBaseline).some(([id,r])=>!same(r,run.runes?.instances?.[id])))fail();
 let boss=initialClauseThreads(),hp=5000;const seen=new Set(),registry=registryForVersion(run.version),eligibility=comboEligibility(run);
 for(const r of c.clauseThreadReceipts){
  if(!r.attackId||seen.has(r.attackId)||r.runId!==run.runId||r.battleId!==c.enemyState.id||r.enemyHpBefore!==hp||r.sentenceSnapshot?.languageVersion!=='0.14.0'||!same(r.comboEligibility,eligibility))fail();seen.add(r.attackId);
  const tokens=r.sentenceSnapshot.orderedTokens;
  if(!Array.isArray(r.cardScoringSnapshot)||r.cardScoringSnapshot.length!==tokens?.length||r.cardScoringSnapshot.some((card,i)=>{
   // A settled reward may legitimately polish/remove a card; replay its battle-start copy.
   const actual=c.clauseThreadCardBaseline[card.instanceId],live=run.cardInstances?.[card.instanceId],definition=registry.cardById[card.cardDefId];
   return card.instanceId!==tokens[i].cardInstanceId||card.cardDefId!==tokens[i].cardDefId||actual?.cardDefId!==card.cardDefId||actual.specialEffectId!==card.specialEffectId||card.baseScore!==definition?.baseScore||actual.polishLevel!==card.polishLevel||(!c.settled&&(!run.activeCardIds?.includes(card.instanceId)||live?.cardDefId!==actual.cardDefId||live?.polishLevel!==actual.polishLevel||live?.specialEffectId!==actual.specialEffectId));
  }))fail();
  if(!Array.isArray(r.runeSnapshot)||r.runeSnapshot.some(rune=>{const actual=c.clauseThreadRuneBaseline[rune.instanceId];return actual?.runeId!==rune.runeId||actual.level!==rune.level;}))fail();
  const analysis=analyzeSentence(r.sentenceSnapshot,registry),result=resolveAttack({analysis,cards:r.cardScoringSnapshot,equippedRunes:r.runeSnapshot,enemy:{...c.enemyState,hp,bossMechanic:boss},stage:stageForRun(run),attackId:r.attackId,runId:run.runId,battleId:r.battleId,sentenceSnapshot:r.sentenceSnapshot,policyVersion:run.version,comboEligibility:eligibility});
  for(const key of ['status','preBossScore','finalPower','actualHpLoss','enemyHpBefore','enemyHpAfter','clauseThreadResult'])if(!same(result[key],r[key]))fail();
  hp=result.enemyHpAfter;boss=result.bossStateAfter??boss;
 }
 if(hp!==c.enemyState.hp||!same(boss,c.enemyState.bossMechanic))fail();
 for(const r of run.stats.history.filter(r=>r.battleId===c.enemyState.id))if(!seen.has(r.attackId))fail();
 return true;
}
