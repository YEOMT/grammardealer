import {deepFreeze} from '../contracts.js';
export const TIME_GOLEM_HINT='과거 → 현재 → 미래 순서로 공략하세요. 올바르게 연결된 유한 동사구의 시간이 활성 부위와 일치해야 합니다. 한 공격은 한 부위만 처리하며 초과 피해는 이월되지 않습니다.';
export const TIME_GOLEM_PHASES=['PAST','PRESENT','FUTURE'];
export const TIME_GOLEM_BREAKS=['과거의 갑옷이 부서집니다!','현재의 엔진이 멈춥니다!','미래의 신경이 끊어집니다!'];
export const STAGE3=deepFreeze({id:'stage.03',nameKo:'시간의 협곡',theme:'canyon',focusFrames:[],regionLabelKo:'시간의 협곡 · 시간 콤보 ×1.25',regionMultiplier:{num:5,den:4},bossHintKo:TIME_GOLEM_HINT,
 rounds:[['고대의 거북이','🐢',320,'과거'],['질주하는 토끼','🐇',360,'진행'],['사냥을 완료한 늑대','🐺',400,'현재완료'],['미래를 보는 독수리','🦅',440,'will 미래'],['시간의 골렘','🗿',720,'과거 → 현재 → 미래']].map(([nameKo,emoji,hp,focusKo],i)=>({battleNumber:8+i,id:`battle.03.0${i+1}`,enemyId:i===4?'boss.stage3':`enemy.stage3.0${i+1}`,nameKo,emoji,hp,focusKo,kind:i===4?'REGIONAL_BOSS':'NORMAL',...(i===4?{bossMechanic:{id:'TIME_GOLEM',activePhase:0,phaseOrder:[...TIME_GOLEM_PHASES],phases:TIME_GOLEM_PHASES.map(id=>({id,maxHp:240,hp:240,broken:false}))}}:{})})),
 exitStatus:'CONTENT_COMPLETE',contentBoundary:'STAGE3_END',notStoryClear:true,nextStageImplemented:false,
});
