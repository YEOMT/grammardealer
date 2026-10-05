import {deepFreeze} from '../contracts.js';
export const SKY_SHIELD_HINT='연결의 보호막: 절을 잇는 접속사 공격으로 해제합니다.\n보호막이 남아 있으면 피해가 50%로 줄어듭니다.';
export const SKY_SHIELD_BLOCK='보호막에 피해가 반감되었습니다. 접속사로 절을 이어 보호막을 깨 보세요.';
export const SKY_SHIELD_BREAK='절이 이어지며 보호막이 깨집니다!';
// Spec implementation starting HP; the half-shield and permanent first-hit release are user-confirmed.
export const STAGE4=deepFreeze({id:'stage.04',nameKo:'이음의 하늘섬',theme:'sky',focusFrames:[],regionLabelKo:'이음의 하늘섬 · 절 연결 ×1.25',regionMultiplier:{num:5,den:4},bossHintKo:SKY_SHIELD_HINT,
 rounds:[['구름양','🐑',440,'and · 나란히 잇기'],['갈래바람 정령','🌬',480,'but / or · 대비와 선택'],['매듭뱀','🐍',520,'because / when / if · 절의 관계'],['메아리 새','🐦',560,'that · 생각과 말의 내용'],['하늘길의 문지기','🧙',640,'접속사로 절을 잇기']].map(([nameKo,emoji,hp,focusKo],i)=>({battleNumber:13+i,id:`battle.04.0${i+1}`,enemyId:i===4?'boss.stage4':`enemy.stage4.0${i+1}`,nameKo,emoji,hp,focusKo,kind:i===4?'REGIONAL_BOSS':'NORMAL',...(i===4?{bossMechanic:{id:'CLAUSE_LINK_SHIELD',active:true,multiplier:{num:1,den:2}}}:{})})),exitStatus:'CONTENT_COMPLETE',contentBoundary:'STAGE4_END',notStoryClear:true,nextStageImplemented:false});
