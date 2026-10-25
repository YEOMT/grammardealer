import {el,button,modal} from './dom.js';
import {applyStageTheme} from './theme.js';
import {finaleTaskLabel} from '../game/finaleTasks.js';
import {runeForVersion} from '../data/runes.js';
import {FINALE_RULESET_ID,LOCAL_LEADERBOARD_LABEL,LOCAL_LEADERBOARD_NOTICE,MEMORY_LEADERBOARD_NOTICE} from '../services/clearLeaderboard.js';

/** Displays committed mechanics only; never evaluates the player's edited sentence. */
export function finaleStatusText(bossState,run){
  const m=bossState;if(!m)return '';
  if(m.id==='FINALE_SURFACE')return `${m.layersRemaining?`방어막 ${m.layersRemaining}겹 · ${finaleTaskLabel(m.activeTask)}`:'방어막 모두 해제'} · 생존 턴 종료 회복 +400`;
  if(m.id==='FINALE_DEEP'){
    const rune=run?.runes?.instances?.[m.sealedRuneInstanceId]??m.orderedSealTargets?.find(r=>r.instanceId===m.sealedRuneInstanceId);
    const name=rune?runeForVersion(rune.runeId,run?.version??'0.11.0')?.nameKo:'공격 룬';
    const count=m.orderedSealTargets?.length??0,progress=count?`해방 ${m.completedRuneSeals??0}/${count} · `:'';
    const active=m.sealedRuneInstanceId?`${name} 봉인 · 주절 ${finaleTaskLabel(m.activeTask)} → 해방 ×1.25`:m.pendingNextRuneSeal?'다음 턴에 다음 룬 봉인':'룬 봉인 없음';
    return `${progress}${active} · 매 턴 손패 단어 최대 2장 배치 봉인`;
  }
  if(m.id==='FINALE_UNIVERSAL')return '모든 방해 해제 · 문장의 위력으로 돌파하세요';
  return '';
}

function recordRow(record,rank){
  const best=record.bestAttackSnapshot;
  return el('details',{class:'finale-ranking-entry',dataset:{playerId:record.playerId,clearId:record.clearId}},
    el('summary',{},el('strong',{text:`${rank}  ${record.displayName}`}),el('span',{class:'finale-ranking-line',text:`${best.finalPower.toLocaleString()}점 · ${best.sentenceText}`})),
    el('p',{class:'finale-full-sentence',text:best.sentenceText}),el('small',{text:`달성 전투 ${best.battleNumber} / 50 · 실제 제출 문장`}));
}
export async function openClearLeaderboard(repository,{profile,memory=false}={}){
  const local=repository.mode==='LOCAL',sessionOnly=memory||repository.persistence==='MEMORY';
  const content=el('section',{class:'finale-leaderboard','aria-live':'polite'},el('p',{text:'클리어 기록을 읽는 중입니다.'}));
  const view=modal(local?LOCAL_LEADERBOARD_LABEL:'공용 클리어 랭킹',content,{wide:true});
  if(!local&&repository.connected===false){content.replaceChildren(el('p',{text:'공용 랭킹 미연결'}));return view;}
  try{
    const [entries,own]=await Promise.all([repository.listTop({rulesetId:FINALE_RULESET_ID,limit:20}),profile?.playerId?repository.getOwnBest({playerKey:profile.playerId,rulesetId:FINALE_RULESET_ID}):null]);
    const position=own?entries.findIndex(entry=>entry.playerId===own.playerId):-1;
    content.replaceChildren(...[
      el('p',{class:'helper',text:local?LOCAL_LEADERBOARD_NOTICE:'공용 서비스에서 제공하는 클리어 기록입니다.'}),
      sessionOnly&&el('p',{class:'helper finale-memory-notice',text:MEMORY_LEADERBOARD_NOTICE}),
      own&&el('p',{class:'finale-own-rank',text:position>=0?`클리어 완료 · 현재 ${position+1}위 · 개인 최고 ${own.bestAttackSnapshot.finalPower.toLocaleString()}점`:'클리어 완료 · 현재 Top20 밖'}),
      own&&position<0&&el('p',{class:'finale-full-sentence',text:`개인 최고 ${own.bestAttackSnapshot.finalPower.toLocaleString()}점 · ${own.bestAttackSnapshot.sentenceText}`}),
      entries.length?el('div',{class:'finale-ranking-list'},entries.map((entry,index)=>recordRow(entry,index+1))):el('p',{text:'아직 등록된 50전투 클리어 기록이 없습니다.'}),
      local&&el('small',{class:'helper',text:'기기 내 기록이며 외부 변조를 검증한 공용 기록이 아닙니다.'})].filter(Boolean));
  }catch(error){content.replaceChildren(el('p',{text:`클리어 기록을 읽지 못했습니다. ${error.message}`}));}
  return view;
}

export function renderFinalClear(root,state,{onLobby,onSaves,onLeaderboard}={}){
  applyStageTheme(state);
  const qa=state.config?.qaFixture===true,best=qa?state.finale?.qaBestAttackSnapshot:state.finale?.bestAttackSnapshot;
  const nav=el('header',{class:'topbar'},el('span',{class:'brand-small',text:'SYNTAX ATLAS'}),el('nav',{},onSaves&&button('저장',onSaves,'quiet'),onLobby&&button('로비',onLobby,'quiet')));
  root.replaceChildren(nav,el('main',{class:'result-page finale-clear'},
    el('span',{class:'eyebrow',text:'UNIVERSAL GRAMMAR DEFEATED'}),el('h1',{text:'원정 클리어 · 50 / 50'}),
    el('p',{text:'서피스 스트럭처 · 딥 스트럭처 · 유니버셜 그래머를 모두 넘어섰습니다.'}),
    qa&&el('p',{class:'finale-qa-notice',text:'지정 덱 QA · 랭킹 제외'}),
    el('section',{class:'panel finale-best-attack'},el('h2',{text:'이번 원정 최고의 한 문장'}),
      best?el('div',{},el('strong',{class:'finale-best-power',text:`${best.finalPower.toLocaleString()}점`}),el('p',{class:'finale-full-sentence',text:best.sentenceText}),el('small',{text:`달성 전투 ${best.battleNumber} / 50 · 최종 위력 기준`})):el('p',{text:'보존된 실제 최고 문장 기록이 없습니다.'})),
    el('p',{class:'helper',text:qa?'이 지정 상태의 결과는 개인 클리어 랭킹에 등록하지 않습니다.':'실제 최고 문장과 50전투 완료 기록을 이 기기의 클리어 랭킹에서 확인할 수 있습니다.'}),
    el('p',{class:'helper',text:'공용 랭킹 미연결'}),
    el('div',{class:'reward-footer'},onLeaderboard&&button(LOCAL_LEADERBOARD_LABEL,onLeaderboard,'primary',{id:'finale-leaderboard'}),onSaves&&button('완료 상태 저장',onSaves,'secondary',{id:'save-final-clear'}),onLobby&&button('로비로',onLobby,'secondary',{id:'finale-lobby'}))));
}
