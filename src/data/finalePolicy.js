import {deepFreeze} from '../contracts.js';

// Authored runtime policy. The handoff JSON is verification material, not game logic.
export const FINALE_CONFIRMED=deepFreeze({
  version:'0.11.0',stageId:'stage.final',battleCount:50,existingBattleCount:47,
  phases:[
    {phaseId:'SURFACE',battleNumber:48,hp:5000,name:'Surface Structure',nameKo:'서피스 스트럭처',mechanicId:'FINALE_SURFACE'},
    {phaseId:'DEEP',battleNumber:49,hp:6000,name:'Deep Structure',nameKo:'딥 스트럭처',mechanicId:'FINALE_DEEP'},
    {phaseId:'UNIVERSAL',battleNumber:50,hp:10000,name:'Universal Grammar',nameKo:'유니버셜 그래머',mechanicId:'FINALE_UNIVERSAL'},
  ],
  surface:{layers:2,taskCategories:['FRAME','GRAMMAR','OWNED_VERB'],frames:['SV','SVC','SVO','SVOO','SVOC'],grammarGoals:['PASSIVE','INFINITIVE','EXTRAPOSITION','RELATIVE','COUNTERFACTUAL'],maxLayersBrokenPerAttack:1,survivalFloorWithLayers:1},
  deep:{maxRuneSeals:2,handWordSealsPerTurn:2,resourceRunesEligible:false},
  leaderboard:{topCount:20},
});
export const FINALE_INITIAL=deepFreeze({
  policyVersion:'finale.0.11.0',
  surface:{regenPerConsumedSurvivingTurn:400,dustCounts:[4,5],maxFrostPerTask:1,maxFrostPerPhase:2},
  deep:{tenseTargets:['PRESENT_SIMPLE','PAST_SIMPLE','PRESENT_PROGRESSIVE','PRESENT_PERFECT','FUTURE_WILL'],unlockBonus:{num:5,den:4}},
  finale:{baseTurnsPerPhase:6,regionMultiplier:{num:1,den:1},lastShopBeforeBattle:48},
});
export const STAGE_FINAL=deepFreeze({
  id:'stage.final',nameKo:'마지막 문법',theme:'finale',focusFrames:[],regionLabelKo:'최종전 · 지역 배율 ×1.0',regionMultiplier:{num:1,den:1},
  entryNoticeKo:'세 개의 구조를 넘어, 당신의 문장으로 원정을 완성하세요.',
  bossHintKo:'세 페이즈는 각각 새로운 전투 자원으로 시작합니다.',
  rounds:FINALE_CONFIRMED.phases.map((p,i)=>({id:`battle.final.0${i+1}`,battleNumber:p.battleNumber,enemyId:`boss.final.${p.phaseId.toLowerCase()}`,nameKo:p.name,nameEn:p.name,subtitleKo:p.nameKo,emoji:['🛡️','🔮','✨'][i],hp:p.hp,kind:'REGIONAL_BOSS',phaseId:p.phaseId,bossMechanic:{id:p.mechanicId,policyVersion:FINALE_INITIAL.policyVersion}})),
  exitStatus:'FINAL_CLEAR',contentBoundary:'FINAL50_CLEAR',notStoryClear:false,nextStageImplemented:false,
});
