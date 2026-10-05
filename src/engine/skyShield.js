import {SKY_SHIELD_BLOCK,SKY_SHIELD_BREAK} from '../data/stage4.js';
/** Original grammar evidence, independent of combo unlocks. No mutation or damage cap. */
export function skyShieldReleaseHits(analysis){
 if(!['VALID','VALID_WITH_ISSUES'].includes(analysis?.status))return [];
 return (analysis.grammarHits??[]).filter(h=>h.tag==='LINK.CLAUSE'&&h.connectorRole==='CLAUSE'&&['VALID','RECOVERED'].includes(h.validity)&&h.connectorCardIds?.length>0);
}
export function skyShieldEvent(analysis,score,boss){
 const hits=skyShieldReleaseHits(analysis),releases=hits.length>0,after=structuredClone(boss);if(releases)after.active=false;
 return {phase:'BOSS',sourceType:'BOSS',sourceId:releases?'boss.skyShield.release':'boss.skyShield.reduce',labelKo:releases?SKY_SHIELD_BREAK:SKY_SHIELD_BLOCK,operation:releases?'SET':'MULTIPLY',operand:releases?score:{num:1,den:2},evidenceRefs:hits.map(h=>h.id),highlightCardIds:[...new Set(hits.flatMap(h=>h.connectorCardIds))],bossStateBefore:structuredClone(boss),bossStateAfter:after};
}
export function validateSkyShield(enemy){const b=enemy.bossMechanic;if(!b||b.id!=='CLAUSE_LINK_SHIELD'||typeof b.active!=='boolean'||b.multiplier?.num!==1||b.multiplier?.den!==2)throw Error('연결 보호막 정의가 잘못되었습니다.');return true;}
