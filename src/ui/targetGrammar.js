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
 if(guide.bonus==='최종전 · 지역 배율 ×1')return '없음';
 const text=guide.bonus.replace(/^지역 (?:점수 )?보너스 · /,'');
 const match=text.match(/^(.*?) (×[\d.]+)$/);
 if(!match)return text;
 const target=guide.title==='운명의 직조자'&&match[1].includes('분사구문')?'분사구문·가정법':guide.title;
 const grammaticalTargets=['현재분사 분사구문','과거분사 분사구문','가정법 과거','가정법 과거완료','분사구문·가정법'];
 return grammaticalTargets.includes(target)?`${target} ${match[2]}`:text;
};
/** Static, versioned curriculum only; no parser, controller or edited-sentence access. */
export function openTargetGrammar(state){
 const g=battleLearningGuide(state),p=preparationGuide(state);
 const hint={'stage.02':STAGE2_VEIL_HINT,'stage.03':TIME_GOLEM_HINT,'stage.04':SKY_SHIELD_HINT,'stage.05':TURN_HAND_SEAL_HINT,'stage.06':FROST_HINT,'stage.07':EMBER_HINT,'stage.08':WATERWAYS_HINT}[state.progress.stageId];
 return modal('목표 문법',[
  el('div',{class:'target-heading'},el('h3',{text:p.targetLabel}),el('span',{class:'target-multiplier',text:'지역 점수 보너스 · '+regionBonusSummary(g)})),
  p.patternKo&&el('div',{class:'target-pattern'},...p.patternKo.split(' + ').map((text,i)=>el('span',{text:(i?'+ ':'')+text}))),
  p.meaningKo&&el('p',{class:'target-meaning',text:p.meaningKo}),
  p.example&&el('blockquote',{class:'target-example',text:p.example}),
  el('section',{class:'target-conditions'},el('h4',{text:'보너스 조건'}),el('p',{text:g.bonusHelp[1]??g.bonusHelp[0]}),
    el('details',{},el('summary',{text:'자세한 조건'}),...g.bonusHelp.filter((_,i)=>i!==1).map(text=>el('p',{text})),...(!g.boss&&g.detail?g.detail.split('\n').map(text=>el('p',{text})):[]))),
  g.boss?el('section',{class:'target-boss'},el('h4',{text:'보스 공략'}),...g.boss.map(text=>el('p',{text}))):hint&&el('details',{class:'target-boss-preview'},el('summary',{text:'지역 보스 미리보기'}),el('p',{text:hint}))
 ],{size:'grammar'});
}
