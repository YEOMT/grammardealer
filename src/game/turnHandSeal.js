import {cardKind} from '../data/cardCatalog.js';
import {pick} from './rng.js';

const mechanicFor=run=>run?.combat?.enemyState?.bossMechanic;
const turnKey=run=>`${run.combat.enemyState.id}:${run.combat.turnIndex}`;
/** Read only; a completed encounter never leaves an active placement restriction. */
export function isTurnSealed(run,cardId){
 const m=mechanicFor(run);
 return run?.version==='0.5.0'&&run.status==='BATTLE'&&run.combat.enemyState.hp>0&&m?.id==='TURN_HAND_SEAL'&&m.sealedForTurnIndex===run.combat.turnIndex&&m.sealedCardId===cardId;
}
/** One proposal at the actual post-draw turn boundary; no UI/effect callback may call it. */
export function applyTurnHandSeal(run){
 const c=run.combat,m=mechanicFor(run);
 if(run.version!=='0.5.0'||m?.id!=='TURN_HAND_SEAL')return null;
 if(m.lastAppliedTurnKey===turnKey(run))return m;
 if(run.progress.stageId!=='stage.05'||run.progress.battleNumber!==22||c.enemyState.hp<=0||c.turnsRemaining<=0)throw Error('Seal outside a live Sphinx turn');
 const previousSealedCardId=m.sealedCardId??null;
 let candidateIds=run.activeCardIds.filter(id=>c.handIds.includes(id)&&cardKind(run.cardInstances[id],run.version)==='WORD');
 if(candidateIds.length>1)candidateIds=candidateIds.filter(id=>id!==previousSealedCardId);
 const encounterCursorBefore=run.rng.encounter.cursor,sealedCardId=candidateIds.length?pick(run.rng.encounter,candidateIds):null;
 const history=[...(m.history??[]),{turnIndex:c.turnIndex,selectedCardId:sealedCardId,candidateIds,encounterCursorBefore,encounterCursorAfter:run.rng.encounter.cursor}];
 if(history.length>c.rulesSnapshot.turnLimit)throw Error('Seal history exceeds battle turns');
 c.enemyState.bossMechanic={id:'TURN_HAND_SEAL',sealedCardId,sealedForTurnIndex:c.turnIndex,previousSealedCardId,sealSequence:history.length,lastAppliedTurnKey:turnKey(run),history};
 return c.enemyState.bossMechanic;
}
/** The seal is an ID restriction, never a sixth card pile. DISCARD/DRAW are legal locations. */
export function validateTurnHandSeal(run){
 const c=run.combat,m=mechanicFor(run);if(!c)return true;
 const sphinx=run.version==='0.5.0'&&run.progress.stageId==='stage.05'&&run.progress.battleNumber===22&&c.enemyState.id==='battle.05.05';
 const fail=()=>{throw Error('스핑크스의 턴별 봉인 기록이 잘못되었습니다.');};
 if(!sphinx){if(m?.id==='TURN_HAND_SEAL')fail();return true;}
 if(m?.id!=='TURN_HAND_SEAL'||!Array.isArray(m.history)||m.history.length!==c.turnIndex||m.sealSequence!==c.turnIndex||m.sealedForTurnIndex!==c.turnIndex||m.lastAppliedTurnKey!==turnKey(run)||m.history.length>c.rulesSnapshot.turnLimit)fail();
 // A resolved post-battle removal may retire a formerly sealed/candidate WORD; it is no longer active.
 const removedId=c.settled&&run.reward?.resolved&&run.reward.resolution?.kind==='REMOVE'?run.reward.resolution.cardInstanceId:null;
 const ownedWord=id=>id===removedId||typeof id==='string'&&run.activeCardIds.includes(id)&&run.cardInstances[id]&&cardKind(run.cardInstances[id],run.version)==='WORD';
 let previous=null,cursor=null;
 for(const [i,e]of m.history.entries()){
  if(e.turnIndex!==i+1||!Array.isArray(e.candidateIds)||new Set(e.candidateIds).size!==e.candidateIds.length||e.candidateIds.some(id=>!ownedWord(id)))fail();
  const order=e.candidateIds.filter(id=>id!==removedId).map(id=>run.activeCardIds.indexOf(id));if(order.some((n,j)=>j>0&&n<=order[j-1]))fail();
  if(e.candidateIds.length?(!ownedWord(e.selectedCardId)||!e.candidateIds.includes(e.selectedCardId)):e.selectedCardId!==null)fail();
  if(!Number.isSafeInteger(e.encounterCursorBefore)||e.encounterCursorBefore<0||e.encounterCursorAfter!==e.encounterCursorBefore+(e.candidateIds.length?1:0)||cursor!==null&&cursor!==e.encounterCursorBefore)fail();
  if(e.candidateIds.length>1&&e.candidateIds.includes(previous))fail();
  previous=e.selectedCardId;cursor=e.encounterCursorAfter;
 }
 if(m.sealedCardId!==previous||m.previousSealedCardId!==(m.history.at(-2)?.selectedCardId??null)||cursor!==run.rng.encounter.cursor)fail();
 if(m.sealedCardId!==null&&(!ownedWord(m.sealedCardId)||c.sentenceSlots.some(slot=>slot.cardInstanceId===m.sealedCardId)))fail();
 return true;
}
