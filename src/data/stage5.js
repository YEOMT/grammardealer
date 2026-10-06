import {deepFreeze} from '../contracts.js';
export const TURN_HAND_SEAL_HINT='매 턴 손패의 단어 카드 1장을 봉인합니다. 봉인된 카드는 이번 턴 조합대에 올릴 수 없지만, 교환할 수 있습니다.';
export const TURN_HAND_SEAL_BLOCK='이번 턴에는 봉인된 카드를 조합대에 올릴 수 없습니다. 교환하거나 다른 카드로 문장을 만들어 보세요.';
export const TURN_HAND_SEAL_LABEL='봉인 · 이번 턴 배치 불가';
// HP is the specification's implementation starting value, not a measured player balance claim.
export const STAGE5=deepFreeze({id:'stage.05',nameKo:'소원의 사막',theme:'desert',focusFrames:['frame.svoc'],regionLabelKo:'소원의 사막 · to부정사·동명사·5형식 ×1.25',regionMultiplier:{num:5,den:4},bossHintKo:TURN_HAND_SEAL_HINT,
 rounds:[['별길 낙타','🐪',520,'want / need + to · 행동을 문장 재료로'],['금빛 전갈','🦂',560,'명사 뒤 to구 · 목적을 설명하기'],['별꽃 선인장','🌵',600,'같은 -ing형 · 문장 속 명사 역할'],['신기루 여우','🦊',640,'목적어 + 목적격보어 · 기본 5형식'],['소원의 스핑크스','🗿',840,'손패 한 장의 봉인에 대응하기']].map(([nameKo,emoji,hp,focusKo],i)=>({battleNumber:18+i,id:`battle.05.0${i+1}`,enemyId:i===4?'boss.stage5':`enemy.stage5.0${i+1}`,nameKo,emoji,hp,focusKo,kind:i===4?'REGIONAL_BOSS':'NORMAL',...(i===4?{bossMechanic:{id:'TURN_HAND_SEAL'}}:{})})),exitStatus:'CONTENT_COMPLETE',contentBoundary:'STAGE5_END',notStoryClear:true,nextStageImplemented:false});
