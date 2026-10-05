# 0.3 명사 가산성 검토

활성 명사 32개 전수 검토. tests/v03-audit.test.js에서 a/an·bare·등록된 모든 복수형을 실제 Parser로 대조했다. BOTH는 해당 단어에만 적용한다. information/homework에 일괄 관사 예외를 만들지 않는다.

| 명사 | 이전 → 새 정책 | 등록 형태 | 판단 |
|---|---|---|---|
| friend | COUNT → COUNT | friend/friends | 단수 한정사·복수 구분 유지 |
| teacher | COUNT → COUNT | teacher/teachers | 단수 한정사·복수 구분 유지 |
| student | COUNT → COUNT | student/students | 단수 한정사·복수 구분 유지 |
| child | COUNT → COUNT | child/children | 단수 한정사·복수 구분 유지 |
| dog | COUNT → COUNT | dog/dogs | 단수 한정사·복수 구분 유지 |
| cat | COUNT → COUNT | cat/cats | 단수 한정사·복수 구분 유지 |
| book | COUNT → COUNT | book/books | 단수 한정사·복수 구분 유지 |
| school | COUNT → COUNT | school/schools | 단수 한정사·복수 구분 유지 |
| home | COUNT → COUNT | home/homes | 단수 한정사·복수 구분 유지 |
| room | COUNT → BOTH | room/rooms | 물질/개념과 개별 사례·종류 구분 |
| park | COUNT → COUNT | park/parks | 단수 한정사·복수 구분 유지 |
| game | COUNT → COUNT | game/games | 단수 한정사·복수 구분 유지 |
| music | MASS → MASS | music | 일반 의미의 MASS 유지 |
| food | MASS → BOTH | food/foods | 물질/개념과 개별 사례·종류 구분 |
| water | MASS → MASS | water | 일반 의미의 MASS 유지 |
| day | COUNT → COUNT | day/days | 단수 한정사·복수 구분 유지 |
| person | COUNT → COUNT | person/people | 단수 한정사·복수 구분 유지 |
| question | COUNT → COUNT | question/questions | 단수 한정사·복수 구분 유지 |
| answer | COUNT → COUNT | answer/answers | 단수 한정사·복수 구분 유지 |
| problem | COUNT → COUNT | problem/problems | 단수 한정사·복수 구분 유지 |
| idea | COUNT → COUNT | idea/ideas | 단수 한정사·복수 구분 유지 |
| plan | COUNT → COUNT | plan/plans | 단수 한정사·복수 구분 유지 |
| story | COUNT → COUNT | story/stories | 단수 한정사·복수 구분 유지 |
| time | MASS → BOTH | time/times | 물질/개념과 개별 사례·종류 구분 |
| homework | MASS → MASS | homework | 일반 의미의 MASS 유지 |
| information | MASS → MASS | information | 일반 의미의 MASS 유지 |
| knowledge | MASS → MASS | knowledge | 일반 의미의 MASS 유지 |
| decision | COUNT → COUNT | decision/decisions | 단수 한정사·복수 구분 유지 |
| culture | MASS → BOTH | culture/cultures | 물질/개념과 개별 사례·종류 구분 |
| technology | MASS → BOTH | technology/technologies | 물질/개념과 개별 사례·종류 구분 |
| environment | COUNT → COUNT | environment/environments | 단수 한정사·복수 구분 유지 |
| picture | COUNT → COUNT | picture/pictures | 단수 한정사·복수 구분 유지 |

technology는 기술 일반/개별 기술, culture는 문화 일반/개별 문화, time은 시간/경험한 한때·횟수, food는 음식 일반/종류, room은 공간/개별 방을 구분한다. a technologies는 여전히 수 일치 오류다. 원래 11단어 technology 사례는 companion G045 및 언어 검사에서 실제 분석한다.

school/home의 제한된 장소 bare 허용은 기존 Sense에 남긴다. water/music/knowledge의 전문·비유적 가산 용법, environment의 모든 사전 의미를 새로 넓히지 않았다. 이 표는 등록된 기본 Sense의 감사이며 영어의 모든 의미를 막는 교육 주장으로 사용하지 않는다.

근거: [Cambridge technology C/U](https://dictionary.cambridge.org/dictionary/english/technology), [Cambridge 가산/불가산 설명](https://dictionaryblog.cambridge.org/2018/03/21/countable-or-uncountable-and-why-it-matters/), [British Council information 및 일반 규칙](https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/nouns-countable-uncountable). 교사·전문 편집자 검수는 NOT RUN.
