import { matchFinaleTask } from '../game/finaleTasks.js';
import { applyRunes, validateEquippedRunes } from './runes.js';
import { runeForVersion } from '../data/runes.js';
import { safeInteger, multiplyFloor } from './numeric.js';
import { FINALE_INITIAL, FINALE_CONFIRMED } from '../data/finalePolicy.js';

export const FINALE_INITIAL_POLICY=Object.freeze({surfaceRegen:FINALE_INITIAL.surface.regenPerConsumedSurvivingTurn,deepRelease:FINALE_INITIAL.deep.unlockBonus,maxRuneSeals:FINALE_CONFIRMED.deep.maxRuneSeals});
const copy=value=>structuredClone(value);

/** Surface arithmetic is separate from structural evidence, and never caps displayed power. */
export function surfaceDamage({hp,power,layers,matched=false}){
 safeInteger(hp,'surface hp',{min:0});safeInteger(power,'surface power',{min:0});safeInteger(layers,'surface layers',{min:0});if(layers>2)throw Error('Invalid Surface layers');
 const layerBroken=layers>0&&power>0&&matched,layersAfter=layers-(layerBroken?1:0),locked=layersAfter>0;
 const actualHpLoss=Math.min(power,Math.max(0,hp-(locked?1:0))),enemyHpAfter=hp-actualHpLoss;
 return {layerBroken,layersAfter,finalPower:power,actualHpLoss,enemyHpAfter,preventedBySeal:locked?power-actualHpLoss:0,overkill:locked?0:Math.max(0,power-hp),killed:hp>0&&enemyHpAfter===0};
}

/** Pure proposal; caller commits once and presents the recorded evidence afterwards. */
export function resolveSurface(analysis,power,enemy,{attackId,comboEligibility=null,submittedCards=[]}={}){
 const before=enemy.bossMechanic;if(before?.id!=='FINALE_SURFACE'||!attackId)throw Error('Invalid Surface context');
 if((before.appliedAttackIds??[]).includes(attackId))throw Error('Duplicate Surface attack');
 const task=before.activeTask??before.taskPlan?.[before.taskCursor??0],evidence=power>0?matchFinaleTask(task,analysis,{comboEligibility,submittedCards}):null;
 const result=surfaceDamage({hp:enemy.hp,power,layers:before.layersRemaining,matched:!!evidence}),after=copy(before);
 after.appliedAttackIds=[...(after.appliedAttackIds??[]),attackId];after.layersRemaining=result.layersAfter;
 if(result.layerBroken){after.taskCursor=(after.taskCursor??0)+1;after.activeTask=after.taskPlan?.[after.taskCursor]??null;after.layerReceipts=[...(after.layerReceipts??[]),{attackId,taskIndex:after.taskCursor-1,taskType:task.type,target:task.target,evidenceRefs:evidence.evidenceRefs}];}
 return {...result,attackId,evidenceRefs:evidence?.evidenceRefs??[],highlightCardIds:evidence?.highlightCardIds??[],bossStateBefore:copy(before),bossStateAfter:after,labelKo:result.layerBroken?`방어막 해제 · ${result.layersAfter}겹 남음`:result.layersAfter?'방어막 · 체력 1 보호':'방어막 모두 해제'};
}

/** Called for an actual consumed, surviving turn only, with its stable turn/action key. */
export function resolveSurfaceTurnEnd(enemy,{turnKey,actionId}={}){
 const before=enemy.bossMechanic;if(before?.id!=='FINALE_SURFACE'||!turnKey||!actionId)throw Error('Invalid Surface turn end');
 const after=copy(before),receipts=after.turnEndReceipts??[];
 if(receipts.some(r=>r.turnKey===turnKey||r.actionId===actionId))return {actualHeal:0,enemyHpAfter:enemy.hp,bossStateAfter:after,duplicate:true};
 const actualHeal=enemy.hp>0?Math.min(FINALE_INITIAL_POLICY.surfaceRegen,Math.max(0,(enemy.maxHp??enemy.hpMax)-enemy.hp)):0;
 after.turnEndReceipts=[...receipts,{turnKey,actionId,hpBefore:enemy.hp,actualHeal,hpAfter:enemy.hp+actualHeal}];
 return {actualHeal,enemyHpAfter:enemy.hp+actualHeal,bossStateAfter:after,duplicate:false};
}

/** Resolve before applyRunes so the same successful attack can use its released rune. */
export function evaluateDeepRelease(analysis,preRuneScore,bossState,{attackId,comboEligibility=null,submittedCards=[]}={}){
 if(bossState?.id!=='FINALE_DEEP'||!attackId)throw Error('Invalid Deep context');safeInteger(preRuneScore,'pre-rune score',{min:0});
 if((bossState.appliedAttackIds??[]).includes(attackId))throw Error('Duplicate Deep attack');
 const after=copy(bossState),sealed=bossState.sealedRuneInstanceId??null,task=bossState.activeTask;
 const evidence=sealed&&preRuneScore>0?matchFinaleTask(task,analysis,{comboEligibility,submittedCards}):null,unsealedNow=!!evidence;
 after.appliedAttackIds=[...(after.appliedAttackIds??[]),attackId];
 if(unsealedNow){after.completedRuneSeals=(after.completedRuneSeals??0)+1;after.sealedRuneInstanceId=null;after.activeTask=null;after.pendingNextRuneSeal=after.completedRuneSeals<(after.orderedSealTargets??[]).length;after.releaseReceipts=[...(after.releaseReceipts??[]),{attackId,runeInstanceId:sealed,taskTarget:task.target,evidenceRefs:evidence.evidenceRefs}];}
 return {unsealedNow,releasedRuneInstanceId:unsealedNow?sealed:null,effectiveDisabledRuneIds:unsealedNow||!sealed?[]:[sealed],bonusEvent:unsealedNow?{phase:'BOSS',sourceType:'BOSS',sourceId:'boss.deep.release',labelKo:'룬 해방 ×1.25',operation:'MULTIPLY',operand:{...FINALE_INITIAL_POLICY.deepRelease},evidenceRefs:evidence.evidenceRefs,highlightCardIds:evidence.highlightCardIds}:null,bossStateAfter:after,evidenceRefs:evidence?.evidenceRefs??[],highlightCardIds:evidence?.highlightCardIds??[]};
}

export function deepReleasedPower(postRuneScore,release){return release?.unsealedNow?multiplyFloor(postRuneScore,FINALE_INITIAL_POLICY.deepRelease):postRuneScore;}

/** Leave-one-out calculation replays only the pure rune step, in identical slot order. */
export function measureRuneContributions(analysis,scoring,equippedRunes,cards,options={}){
 if(!['VALID','VALID_WITH_ISSUES'].includes(analysis?.status)||scoring.preRuneScore<=0)return {};
 const version=options.version??'0.10.2',runes=validateEquippedRunes(equippedRunes,{version}),all=applyRunes(analysis,scoring,runes,cards,{...options,version}).postRuneScore;
 const contributions={};
 for(const r of runes){const d=runeForVersion(r.runeId,version);if(!['ADD_SCORE','MULTIPLY_SCORE'].includes(d.operation)||d.group==='UTILITY')continue;const without=applyRunes(analysis,scoring,runes.filter(x=>x.instanceId!==r.instanceId),cards,{...options,version}).postRuneScore;contributions[r.instanceId]=Math.max(0,all-without);}
 return contributions;
}
export function chooseRuneSealTargets(contributions,equippedRunes,{version='0.10.2'}={}){
 return validateEquippedRunes(equippedRunes,{version}).filter(r=>{const d=runeForVersion(r.runeId,version);return ['ADD_SCORE','MULTIPLY_SCORE'].includes(d.operation)&&d.group!=='UTILITY'&&(contributions[r.instanceId]??0)>0;}).sort((a,b)=>(contributions[b.instanceId]-contributions[a.instanceId])||b.level-a.level||(a.runeId<b.runeId?-1:a.runeId>b.runeId?1:0)).slice(0,2);
}
