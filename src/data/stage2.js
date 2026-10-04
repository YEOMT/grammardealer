import { deepFreeze } from '../contracts.js';

export const STAGE2_VEIL_HINT = '보호 장막: 일반 공격의 피해를 75% 줄입니다. 주절 4형식 공격을 한 번 맞히면, 그 공격부터 장막이 해제됩니다.';
export const STAGE2 = deepFreeze({
  id: 'stage.02', nameKo: '전달의 항구', focusFrames: ['frame.svoo'],
  regionLabelKo: '전달의 항구 · 4형식 ×1.25', regionMultiplier: { num: 5, den: 4 },
  theme: 'harbor', bossHintKo: STAGE2_VEIL_HINT,
  rounds: [
    { battleNumber: 4, id: 'battle.02.01', enemyId: 'enemy.stage2.01', nameKo: '부두 갈매기', emoji: '🐦', hp: 220, kind: 'NORMAL' },
    { battleNumber: 5, id: 'battle.02.02', enemyId: 'enemy.stage2.02', nameKo: '짐꾼 게', emoji: '🦀', hp: 300, kind: 'NORMAL' },
    { battleNumber: 6, id: 'battle.02.03', enemyId: 'enemy.stage2.03', nameKo: '파도 문어', emoji: '🐙', hp: 380, kind: 'NORMAL' },
    { battleNumber: 7, id: 'battle.02.04', enemyId: 'boss.stage2', nameKo: '항구 수문장', emoji: '🦑', hp: 640, kind: 'REGIONAL_BOSS',
      bossMechanic: { id: 'SVOO_VEIL', active: true, multiplier: { num: 1, den: 4 } } },
  ],
  bossNoHardGate: true, exitStatus: 'CONTENT_COMPLETE', contentBoundary: 'STAGE2_END',
  notStoryClear: true, nextStageImplemented: false,
});
