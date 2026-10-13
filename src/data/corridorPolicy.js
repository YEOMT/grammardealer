import {deepFreeze} from '../contracts.js';
export const CORRIDOR_PACK='pack.corridor';
export const CORRIDOR_CONFIRMED=deepFreeze({hp:[2500,2900,3300,3800,5000],frostMinimums:[{if:1,will:1},{if:1,will:1,can:1},{have:1},{if:1,will:1,have:2},{}]});
// Initial tuning from the handoff, not an empirically established difficulty target.
export const CORRIDOR_INITIAL=deepFreeze({multipliers:{'CORRIDOR.CONDITIONAL_REAL':{num:8,den:5},'CORRIDOR.UNREAL_PRESENT':{num:9,den:5},'CORRIDOR.PAST_PERFECT':{num:7,den:5},'CORRIDOR.UNREAL_PAST':{num:2,den:1},'CORRIDOR.PRESENT_PERFECT_PROGRESSIVE':{num:9,den:5}},regionMultiplier:{num:5,den:4},resistance:{'stage.07':{num:7,den:10},'stage.08':{num:13,den:20},'stage.09':{num:3,den:5},'stage.10':{num:7,den:10}}});
export const CORRIDOR_LABELS=deepFreeze({'CORRIDOR.CONDITIONAL_REAL':'현실 조건절','CORRIDOR.UNREAL_PRESENT':'가정법 과거','CORRIDOR.PAST_PERFECT':'과거완료','CORRIDOR.UNREAL_PAST':'가정법 과거완료','CORRIDOR.PRESENT_PERFECT_PROGRESSIVE':'현재완료진행'});
export const CORRIDOR_ENTRY_NOTICE='일반전에서는 부족한 핵심 재료를 빙정으로 지원합니다. 운명의 직조자전에는 지급되지 않으니, 상점과 카드 보상으로 덱을 준비하세요.';
