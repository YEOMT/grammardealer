import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {resolveFrostCrystalLock,validateFrostCrystalLock} from '../src/engine/frostCrystalLock.js';
import {STAGE6} from '../src/data/stage6.js';
const cases=JSON.parse(fs.readFileSync(new URL('./fixtures/v06-06_frost_crystal_boss_cases_0.6.json',import.meta.url))).cases;
for(const f of cases)test('0.6 '+f.id+' crystal proposal',()=>{
 const enemy=structuredClone(STAGE6.rounds[4]);enemy.hp=f.hpBefore??1280;enemy.bossMechanic.crystalsRemaining=f.crystalsBefore??5;enemy.bossMechanic.brokenCount=5-enemy.bossMechanic.crystalsRemaining;
 const n=f.eligibleFrostCount??1,cards=Array.from({length:n},(_,i)=>({instanceId:'ice.'+i,cardDefId:'card.more'})),meta=Object.fromEntries(cards.map(c=>[c.instanceId,{source:'MIRROR_SNOWFIELD',battleId:enemy.id,cardDefId:c.cardDefId,crystalBearing:true}]));
 const a={status:f.analysisStatus??'VALID',coverage:{consumedCardIds:cards.map(c=>c.instanceId),unlicensedCardIds:f.frostCardExcluded?cards.map(c=>c.instanceId):[]}};
 const context={attackId:f.id,submittedCards:cards,temporaryCardMeta:f.sourceCardKind==='PERMANENT_WORD'?{}:meta};
 const r=resolveFrostCrystalLock(a,f.power??100,enemy,context);
 if(f.expectedHpAfter!==undefined)assert.equal(r.enemyHpAfter,f.expectedHpAfter);
 if(f.expectedCrystalsAfter!==undefined)assert.equal(r.bossStateAfter.crystalsRemaining,f.expectedCrystalsAfter);
 if(f.expectedKilled!==undefined)assert.equal(r.enemyHpAfter===0,f.expectedKilled);
 if(f.expectedCrystalBreak!==undefined)assert.equal(r.brokenCrystalCount,f.expectedCrystalBreak);
 if(f.replaySameAttackId){const again=resolveFrostCrystalLock(a,100,{...enemy,hp:r.enemyHpAfter,bossMechanic:r.bossStateAfter},context);assert.equal(again.actualHpLoss,0);assert.equal(again.brokenCrystalCount,0);}
 if(f.saveLoad){const loaded=JSON.parse(JSON.stringify({...enemy,hp:r.enemyHpAfter,bossMechanic:r.bossStateAfter}));assert.equal(validateFrostCrystalLock(loaded),true);assert.deepEqual(loaded.bossMechanic,r.bossStateAfter);}
 if(r.bossStateAfter.crystalsRemaining>0)assert.equal(r.overkill,0);
});
