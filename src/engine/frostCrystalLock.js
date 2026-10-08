/** Pure post-region proposal. A marker hit is deliberately not required. */
export function resolveFrostCrystalLock(analysis,power,enemy,{attackId,submittedCards=[],temporaryCardMeta={}}={}){
 if(!Number.isSafeInteger(power)||power<0||typeof attackId!=='string'||!attackId)throw Error('Invalid frost attack context');
 validateFrostCrystalLock(enemy);const before=structuredClone(enemy.bossMechanic),after=structuredClone(before);
 if(after.appliedAttackIds.includes(attackId))return {bossStateAfter:after,brokenCrystalCount:0,eligibleFrostCardIds:[],enemyHpAfter:enemy.hp,actualHpLoss:0,preventedDamage:0,overkill:0,replayed:true};
 const excluded=new Set([...(analysis.excludedCardIds??[]),...(analysis.coverage?.unlicensedCardIds??[])]),covered=new Set(analysis.coverage?.consumedCardIds??[]);
 const eligible=power>0&&['VALID','VALID_WITH_ISSUES'].includes(analysis.status)?[...new Set(submittedCards.filter(c=>{const m=temporaryCardMeta[c.instanceId];return m?.source==='MIRROR_SNOWFIELD'&&m.battleId===enemy.id&&m.cardDefId===c.cardDefId&&m.crystalBearing===true&&covered.has(c.instanceId)&&!excluded.has(c.instanceId);}).map(c=>c.instanceId))]:[];
 const brokenCrystalCount=Math.min(after.crystalsRemaining,eligible.length);after.crystalsRemaining-=brokenCrystalCount;after.brokenCount+=brokenCrystalCount;after.appliedAttackIds.push(attackId);
 const floor=after.crystalsRemaining>0?1:0,enemyHpAfter=Math.max(floor,enemy.hp-power),actualHpLoss=enemy.hp-enemyHpAfter;
 const preventedDamage=after.crystalsRemaining>0?Math.max(0,power-actualHpLoss):0;after.totalPreventedDamage+=preventedDamage;
 return {bossStateAfter:after,brokenCrystalCount,eligibleFrostCardIds:eligible,enemyHpAfter,actualHpLoss,preventedDamage,overkill:after.crystalsRemaining>0?0:Math.max(0,power-enemy.hp),replayed:false};
}
export function validateFrostCrystalLock(enemy){
 const b=enemy?.bossMechanic,integer=n=>Number.isSafeInteger(n)&&n>=0;
 if(!b||b.id!=='FROST_CRYSTAL_LOCK'||b.crystalsMax!==5||!integer(b.crystalsRemaining)||b.crystalsRemaining>5||!integer(b.brokenCount)||b.brokenCount+b.crystalsRemaining!==5||!integer(b.totalPreventedDamage)||!Array.isArray(b.appliedAttackIds)||b.appliedAttackIds.some(id=>typeof id!=='string'||!id)||new Set(b.appliedAttackIds).size!==b.appliedAttackIds.length||b.crystalsRemaining>0&&enemy.hp<1)throw Error('Invalid frost crystal lock');
 return true;
}
