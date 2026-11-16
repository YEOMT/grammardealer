import {battleLearningGuide,preparationGuide} from '../data/battleLearningGuide.js';
import {STAGE2_VEIL_HINT} from '../data/stage2.js';
import {TIME_GOLEM_HINT} from '../data/stage3.js';
import {SKY_SHIELD_HINT} from '../data/stage4.js';
import {TURN_HAND_SEAL_HINT} from '../data/stage5.js';
import {FROST_HINT} from '../data/stage6.js';
import {EMBER_HINT} from '../data/stage7.js';
import {WATERWAYS_HINT} from '../data/stage8.js';
import {el,modal} from './dom.js';
export const regionBonusSummary=guide=>{
 const text=guide.bonus.replace(/^지역 보너스 · /,'').replace('최종전 · 지역 배율 ×1','추가 배율 없음');
 // Long enumerations stay complete in the help window; the summary keeps its real multiplier.
 const match=text.match(/^(.*?) (×[\d.]+)$/);
 return match&&match[1].length>14?`학습 구문 ${match[2]}`:text;
};
/** Static, versioned curriculum only; no parser, controller or edited-sentence access. */
export function openTargetGrammar(state){
 const g=battleLearningGuide(state),p=preparationGuide(state);
 const hint={'stage.02':STAGE2_VEIL_HINT,'stage.03':TIME_GOLEM_HINT,'stage.04':SKY_SHIELD_HINT,'stage.05':TURN_HAND_SEAL_HINT,'stage.06':FROST_HINT,'stage.07':EMBER_HINT,'stage.08':WATERWAYS_HINT}[state.progress.stageId];
 return modal('목표 문법',[
  el('h3',{text:'이번 전투: '+p.targetLabel}),
  ...[['형태',p.patternKo],['뜻',p.meaningKo],['예문',p.example]].filter(([,text])=>text).map(([label,text])=>el('p',{text:label+': '+text})),
  el('h3',{text:'지역 보너스'}),...g.bonusHelp.map(text=>el('p',{text})),
  ...(g.detail?[el('h3',{text:'추가 설명'}),...g.detail.split('\n').map(text=>el('p',{text}))]:[]),
  ...(g.boss?[el('h3',{text:'보스 공략'}),...g.boss.map(text=>el('p',{text}))]:[]),
  ...(hint?[el('h3',{text:'지역 공략 참고'}),el('p',{text:hint})]:[])
 ]);
}
