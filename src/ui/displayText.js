const ENEMY_NAMES = Object.freeze({
  2:'꽃 달팽이',4:'선원 갈매기',6:'항해사 상어',9:'질주 중인 토끼',
  16:'메아리 하피',18:'황금 낙타',22:'소원의 황금 석상',23:'얼음 족제비',
  24:'펭귄 형제',26:'콜라곰',30:'흑요석 박쥐',31:'용암 대장장이',
  33:'청동 항아리',36:'안개 수호령',37:'고대 수호대장',42:'꿈의 도서관장',
  48:'서피스 스트럭처',49:'딥 스트럭처',50:'유니버셜 그래머'
});
export const enemyDisplayName = enemy => ENEMY_NAMES[enemy?.battleNumber] ?? enemy?.nameKo ?? '적';
export const stageDisplayName = stage => stage?.id === 'stage.final' ? '통사의 근원' : stage?.nameKo;

// Display translations keyed by the actual Korean alias, including legacy names.
// These never enter a run, encounter ID, reward or grammar policy.
const ENEMY_ENGLISH = Object.freeze({
 '풀잎 슬라임':'Leaf Slime','꽃 달팽이':'Flower Snail','초원 수호자':'Grassland Guardian',
 '선원 갈매기':'Sailor Gull','짐꾼 게':'Porter Crab','항해사 상어':'Navigator Shark','항구 수문장':'Harbor Gatekeeper',
 '고대의 거북이':'Ancient Turtle','질주 중인 토끼':'Racing Rabbit','사냥을 완료한 늑대':'Wolf After the Hunt','미래를 보는 독수리':'Future-Seer Eagle','시간의 골렘':'Time Golem',
 '구름양':'Cloud Sheep','갈래바람 정령':'Forked Wind Spirit','매듭뱀':'Knot Serpent','메아리 하피':'Echo Harpy','하늘길의 문지기':'Skyway Gatekeeper',
 '황금 낙타':'Golden Camel','금빛 전갈':'Golden Scorpion','별꽃 선인장':'Starflower Cactus','신기루 여우':'Mirage Fox','소원의 황금 석상':'Golden Statue of Wishes',
 '얼음 족제비':'Ice Weasel','펭귄 형제':'Penguin Brothers','눈꽃 정령':'Snowflake Spirit','콜라곰':'Cola Bear','거울뿔 사슴':'Mirror-Antler Deer',
 '불씨 도롱뇽':'Ember Salamander','현무암 거북':'Basalt Turtle','흑요석 박쥐':'Obsidian Bat','용암 대장장이':'Lava Blacksmith','잠든 잿불룡':'Sleeping Ember Dragon',
 '청동 항아리':'Bronze Jar','운하 수호상':'Canal Guardian Statue','물시계 자동인형':'Water Clock Automaton','안개 수호령':'Mist Guardian','고대 수호대장':'Ancient Guard Captain',
 '잉크 나비':'Ink Butterfly','올빼미 사서':'Owl Librarian','호기심 많은 요정':'Curious Fairy','속이 빈 인형':'Hollow Doll','꿈의 도서관장':'Dream Librarian',
 '춤추는 광대':'Dancing Jester','추방당한 왕자':'Exiled Prince','망상의 순례자':'Deluded Pilgrim','후회의 기사':'Knight of Regret','운명의 직조자':'Weaver of Fate',
 '갈림길의 광대':'Crossroads Jester','평행세계의 여행자':'Parallel World Traveler','과거의 순례자':'Pilgrim of the Past',
 '서피스 스트럭처':'Surface Structure','딥 스트럭처':'Deep Structure','유니버셜 그래머':'Universal Grammar'
});
export const enemyEnglishName = enemy => enemy?.nameEn || ENEMY_ENGLISH[enemyDisplayName(enemy)] || '';
