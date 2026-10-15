import {deepFreeze} from '../contracts.js';

// Authored runtime definitions. QA fixtures are never imported by the game.
const multiply=(id,nameKo,rarity,condition,values,color)=>({id:`rune.${id}`,nameKo,rarity,
 group:'GRAMMAR',operation:'MULTIPLY_SCORE',levelValues:values.map(([num,den])=>({num,den})),
 conditionDescriptionKo:condition,displayEffectSummaryKo:condition,color,
 scope:'ONCE_PER_ATTACK',maxMatchesPerAttack:1,unlockRuleId:`unlock.rune.${id}`,
 unlockTextKo:'획득 가능 · 해당 문법 해금 후 발동',firstRuneBasicPoolEligible:false,
 runtimeReady:true,introducedVersion:'0.10.1'});
const add=(id,nameKo,condition,color)=>({...multiply(id,nameKo,'COMMON',condition,[],color),
 operation:'ADD_SCORE',levelValues:[30,50,70],valueStatus:'TUNING_INITIAL'});
export const NEW_POLISH_RUNES=deepFreeze([
 add('past','화석 룬','정상적인 실제 과거 동사구','#c7a981'),
 add('progressive','석영 룬','정상적인 진행 동사구','#dbbdde'),
 multiply('svoc','가넷 룬','UNCOMMON','주절 5형식',[[17,10],[12,5],[16,5]],'#c45271'),
 multiply('presentPerfect','백금 룬','UNCOMMON','현재완료 동사구',[[7,5],[17,10],[2,1]],'#e0ddd6'),
 multiply('clauseLink','라피스 룬','UNCOMMON','정상적인 절 연결',[[7,5],[17,10],[2,1]],'#6587db'),
 multiply('infinitive','아쿠아마린 룬','UNCOMMON','to부정사절',[[27,20],[33,20],[2,1]],'#75ddce'),
 multiply('gerund','자수정 룬','UNCOMMON','명사 역할의 동명사절',[[27,20],[33,20],[2,1]],'#b98be4'),
 multiply('passive','흑요석 룬','RARE','정상적인 수동태 동사구',[[19,10],[51,20],[16,5]],'#9b8ab4'),
 multiply('relative','아다만티움 룬','RARE','명사를 수식하는 주격·목적격 관계절',[[21,10],[14,5],[18,5]],'#a2d4db'),
 multiply('unrealPresent','미스릴 룬','RARE','정상적인 가정법 과거 조건·결과절',[[2,1],[27,10],[7,2]],'#b1c9f4'),
]);

/** A drop context controls acquisition only; activation still needs grammar unlocks. */
export function runeDropContext(run,{source='REWARD',stageId=run.progress.stageId}={}){
 const introduction=source==='INTRO'||source==='REWARD'&&run.progress.battleNumber===2;
 const kind=run.combat?.enemyState?.kind;
 const boss=kind?kind==='REGIONAL_BOSS':run.progress.roundIndex===({'stage.01':2,'stage.02':3}[stageId]??4);
 const rareAllowed=!introduction&&(source==='SHOP'?['stage.04','stage.06','stage.08','stage.10'].includes(stageId):boss);
 return {source:introduction?'INTRO':source,stageId,rareAllowed};
}
export function filterRuneDropPool(run,pool,context={}){
 if(run.version!=='0.10.1')return pool;
 const {rareAllowed}=runeDropContext(run,context);
 return pool.filter(r=>r.rarity!=='RARE'||rareAllowed);
}
