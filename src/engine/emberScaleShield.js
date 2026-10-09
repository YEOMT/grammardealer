import {registryForVersion} from '../data/language/index.js';
import {analyzeSentence} from './grammar/index.js';
/** Pure original-analysis proposal; independent of combo unlocks and surface spelling. */
export function emberScaleEvent(analysis,power,before,{attackId,submittedCards}){
 const language=registryForVersion('0.7.0'),physical=new Map(submittedCards.map(c=>[c.instanceId,c]));
 const uses=power>0&&['VALID','VALID_WITH_ISSUES'].includes(analysis.status)?(analysis.formUses??[]).filter(u=>u.validity==='VALID'&&u.excludedCardIds.length===0&&['ING','PP'].includes(u.resolvedMorphology)&&language.cardById[physical.get(u.formCardId)?.cardDefId]&&language.senseById[u.sourceVerbSenseId]):[];
 const release=before.active&&uses.length>0,bossStateAfter=structuredClone(before);
 if(release)Object.assign(bossStateAfter,{active:false,releasedAttackId:attackId,releaseEvidence:structuredClone(uses)});
 return {phase:'BOSS',sourceType:'BOSS',sourceId:release?'boss.emberScale.release':'boss.emberScale.reduce',labelKo:release?'정상 분사 사용 · 검댕 비늘 해제':'검댕 비늘 · 피해 ×0.25',operation:release?'SET':'MULTIPLY',operand:release?power:{num:1,den:4},evidenceRefs:uses.map(u=>u.useId),highlightCardIds:[...new Set(uses.map(u=>u.formCardId))],bossStateBefore:before,bossStateAfter};
}
/** A released save must retain the genuine attack receipt from this six-turn battle. */
export function validateEmberReleaseReceipt(run){
 const b=run.combat?.enemyState.bossMechanic;if(b?.id!=='EMBER_SCALE_SHIELD'||b.active)return true;
 const receipt=run.stats.history.find(r=>r.attackId===b.releasedAttackId),fail=()=>{throw Error('Invalid ember release receipt');};
 if(!receipt||receipt.battleId!==run.combat.enemyState.id||receipt.preBossScore<=0||receipt.bossStateBefore?.active!==true||receipt.bossStateAfter?.active!==false||JSON.stringify(receipt.bossStateAfter)!==JSON.stringify(b))fail();
 const analysis=analyzeSentence(receipt.sentenceSnapshot,registryForVersion('0.7.0'));
 const event=emberScaleEvent(analysis,receipt.preBossScore,receipt.bossStateBefore,{attackId:receipt.attackId,submittedCards:receipt.cardScoringSnapshot});
 if(JSON.stringify(event.bossStateAfter)!==JSON.stringify(b))fail();return true;
}
export function validateEmberScale(enemy){
 const b=enemy.bossMechanic,fail=()=>{throw Error('Invalid ember scale shield');};
 if(b?.id!=='EMBER_SCALE_SHIELD'||typeof b.active!=='boolean'||!Array.isArray(b.releaseEvidence))fail();
 if(b.active?(b.releasedAttackId!==null||b.releaseEvidence.length!==0):(!b.releasedAttackId||!b.releaseEvidence.length))fail();
 if(!b.active&&b.releaseEvidence.some(u=>u.validity!=='VALID'||!['ING','PP'].includes(u.resolvedMorphology)||!u.formCardId||!u.sourceVerbSenseId||!Array.isArray(u.excludedCardIds)||u.excludedCardIds.length||!u.phraseCardIds?.includes(u.formCardId)))fail();
 return true;
}
