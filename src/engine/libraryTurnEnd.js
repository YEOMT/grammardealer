import {registryForVersion} from '../data/language/index.js';
import {analyzeSentence} from './grammar/index.js';
import {libraryTargetEvidence} from './libraryEvidence.js';
import {LIBRARY_CONFIRMED} from '../data/libraryPolicy.js';
/** Pure receipt, calculated once on the controller's proposed state. Presentation only replays it. */
export function resolveLibraryTurnEnd({runId,battleId,turnIndex,actionId,actionType,hpBefore,hpAfterAttack,actualDamage=0,analysis=null}){
 if(!['ATTACK','PREPARE'].includes(actionType)||![hpBefore,hpAfterAttack,actualDamage].every(n=>Number.isSafeInteger(n)&&n>=0)||hpBefore>LIBRARY_CONFIRMED.bossHp||hpAfterAttack>hpBefore||hpBefore-hpAfterAttack!==actualDamage)throw Error('Invalid library turn-end input');
 const killed=hpAfterAttack===0,evidence=actionType==='ATTACK'&&actualDamage>0?libraryTargetEvidence(analysis):[],suppressed=!killed&&evidence.length>0;
 const actualHeal=killed||suppressed?0:Math.min(LIBRARY_CONFIRMED.healPerTurnEnd,LIBRARY_CONFIRMED.bossHp-hpAfterAttack);
 return {turnEndId:`${runId}:${battleId}:turn.${turnIndex}`,battleId,turnIndex,actionId,actionType,hpBefore,hpAfterAttack,hpAfterTurnEnd:hpAfterAttack+actualHeal,actualDamage,actualHeal,evidenceIds:evidence.map(n=>n.id),suppressed,killed};
}
export function validateLibraryTurnEnds(run){
 const c=run.combat,isBoss=['0.9.0','0.10.0','0.10.1'].includes(run.version)&&run.progress.stageId==='stage.09'&&run.progress.roundIndex===4;
 if(!c)return true;
 const fail=()=>{throw Error('Invalid library turn-end receipts');};
 if(!isBoss){if(c.libraryTurnEnds!==undefined||c.enemyState.bossMechanic?.id==='LIBRARY_REGENERATION')fail();return true;}
 if(c.enemyState.bossMechanic?.id!=='LIBRARY_REGENERATION'||c.enemyState.bossMechanic.healPerTurnEnd!==1000||c.enemyState.maxHp!==3000||!Array.isArray(c.libraryTurnEnds))fail();
 let hp=3000;
 for(const [i,r]of c.libraryTurnEnds.entries()){
  const attack=(run.stats.history??[]).find(a=>a.attackId===r.actionId);
  if(r.actionType==='ATTACK'&&(!attack||attack.battleId!==c.enemyState.id||attack.actualHpLoss!==r.actualDamage||attack.enemyHpBefore!==r.hpBefore||attack.enemyHpAfter!==r.hpAfterAttack))fail();
  const expected=resolveLibraryTurnEnd({runId:run.runId,battleId:c.enemyState.id,turnIndex:i+1,actionId:r.actionId,actionType:r.actionType,hpBefore:hp,hpAfterAttack:r.actionType==='PREPARE'?hp:attack.enemyHpAfter,actualDamage:r.actionType==='PREPARE'?0:attack.actualHpLoss,analysis:attack?analyzeSentence(attack.sentenceSnapshot,registryForVersion(run.version)):null});
  if(JSON.stringify(r)!==JSON.stringify(expected)||r.actionType==='ATTACK'&&JSON.stringify(attack.turnEndReceipt)!==JSON.stringify(r))fail();
  hp=r.hpAfterTurnEnd;
 }
 if(hp!==c.enemyState.hp||c.libraryTurnEnds.length!==c.rulesSnapshot.turnLimit-c.turnsRemaining||new Set(c.libraryTurnEnds.map(r=>r.actionId)).size!==c.libraryTurnEnds.length)fail();
 return true;
}
