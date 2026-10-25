const ENEMY_NAMES = Object.freeze({
  2:'꽃 달팽이',4:'선원 갈매기',6:'항해사 상어',9:'질주 중인 토끼',
  16:'메아리 하피',18:'황금 낙타',22:'소원의 황금 석상',23:'얼음 족제비',
  24:'펭귄 형제',26:'콜라곰',30:'흑요석 박쥐',31:'용암 대장장이',
  33:'청동 항아리',36:'안개 수호령',37:'고대 수호대장',42:'꿈의 도서관장',
  48:'서피스 스트럭처',49:'딥 스트럭처',50:'유니버셜 그래머'
});
export const enemyDisplayName = enemy => ENEMY_NAMES[enemy?.battleNumber] ?? enemy?.nameKo ?? '적';
export const stageDisplayName = stage => stage?.id === 'stage.final' ? '통사의 근원' : stage?.nameKo;
