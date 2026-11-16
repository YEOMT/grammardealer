import {deepFreeze} from '../contracts.js';
import {CORRIDOR_CONFIRMED,CORRIDOR_INITIAL,CORRIDOR_ENTRY_NOTICE} from './corridorPolicy.js';
export const FORESIGHT_HINT='직조자는 직전 공격의 주절 문형을 기억합니다. 같은 문형으로 다시 공격하면 피해를 줄 수 없습니다. 가정법 공격은 예견을 무시합니다.';
export const STAGE10=deepFreeze({id:'stage.10',nameKo:'별의 회랑',theme:'star-corridor',focusFrames:[],regionLabelKo:'별의 회랑 · 조건·가정·과거완료 ×1.25',regionMultiplier:CORRIDOR_INITIAL.regionMultiplier,bossHintKo:FORESIGHT_HINT,entryNoticeKo:CORRIDOR_ENTRY_NOTICE,
 rounds:[['갈림길의 광대','🃏','현실적인 조건절'],['평행세계의 여행자','🧳','가정법 과거'],['과거의 순례자','🕯️','과거완료'],['후회의 기사','⚔️','가정법 과거완료'],['운명의 직조자','🕸️','문형 전환 · 가정법']].map(([nameKo,emoji,focusKo],i)=>({id:`battle.10.0${i+1}`,battleNumber:43+i,enemyId:i===4?'boss.stage10':`enemy.stage10.0${i+1}`,nameKo,emoji,focusKo,hp:CORRIDOR_CONFIRMED.hp[i],kind:i===4?'REGIONAL_BOSS':'NORMAL',...(i===4?{bossMechanic:{id:'FATE_FORESIGHT',rememberedFrame:null,lastAttackId:null}}:{})})),exitStatus:'CONTENT_COMPLETE',contentBoundary:'STAGE10_END',notStoryClear:true,nextStageImplemented:false});

export const CLAUSE_THREADS_HINT='현재분사 분사구문으로 행동, 과거분사 분사구문으로 흔적, 가정법으로 가능성의 실을 풀어 주세요. 순서는 자유이며 남은 실이 있으면 체력 1을 보호합니다. 마지막 실을 푸는 공격부터 격파할 수 있습니다.';
export const CLAUSE_CORRIDOR_NOTICE='운명의 직조자전에는 빙정 지원이 없습니다. 상점과 보상으로 영구 덱의 두 분사구문과 가정법 재료를 준비하세요.';
export const STAGE10_CLAUSE=deepFreeze({...STAGE10,regionLabelKo:'별의 회랑 · 분사구문·조건·가정·과거완료 ×1.25',bossHintKo:CLAUSE_THREADS_HINT,entryNoticeKo:CLAUSE_CORRIDOR_NOTICE,exitStatus:'STAGE_CLEAR',nextStageImplemented:true,
 rounds:STAGE10.rounds.map((round,i)=>({...round,nameKo:['춤추는 광대','추방당한 왕자','망상의 순례자','후회의 기사','운명의 직조자'][i],emoji:['🃏','🤴','🕯️','⚔️','🕸️'][i],focusKo:['현재분사 분사구문','과거분사 분사구문','가정법 과거','가정법 과거완료','세 실 · 분사구문·가정법'][i],...(i===4?{bossMechanic:{id:'FATE_CLAUSE_THREADS',policyVersion:'0.14.0',threads:{ACTIVE:null,PASSIVE:null,COUNTERFACTUAL:null},appliedAttackIds:[]}}:{})}))});
