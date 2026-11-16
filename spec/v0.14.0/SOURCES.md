# 근거·범위·결정 출처

## 1. 설계 결정의 출처

이번 대화의 사용자 결정이 제품 요구의 우선 근거다. 마지막 확정명은43춤추는광대/44추방당한왕자/45망상의순례자/46후회의기사다. 갈색쉼표·재사용·점수없음·손패한도제외, 분사구문두전투·가정법·보스공략,총전투수유지가핵심이다.

v0.14.0이라는작업명,×1.60/×0.90,편집앵커표현,세실의동시해제처리등은작업용기본안이다. 사용자확정숫자나외부문법규칙으로소개하지않는다.

## 2. 저장소 확인

기준커밋: `cc3b75da280aa93366fa75636c3c970d68621a2a`
확인한main은PR34의v0.13.1링크접속/가시영역개선병합이다. 배포된화면의현재상태·실기기동작을검증한것은아니다.

| ID | 소스 | 확인한 내용 |
|---|---|---|
| R1 | `AGENTS.md` | 현재소스보존,컨트롤러만상태커밋,필수테스트/빌드,미승인배포금지 |
| R2 | `src/data/stage10.js` | 기존43~47은현실조건/가정법과거/과거완료/가정법과거완료/예견보스 |
| R3 | `src/data/corridorPolicy.js` | HP2500/2900/3300/3800/5000,일반전빙정표,지역×1.25,보스빙정미지원 |
| R4 | `src/engine/foresight.js` | 기존예견의주절문형/가정법우회/공격영수증검증 |
| R5 | `src/engine/stage.js` | 지역/저항/보스순서,현재10지역현재완료진행제외,HP와위력분리 |
| R6 | `src/engine/finale.js` | 48의HP1보호및동일공격해제,49주절과제/룬기여경계 |

관련대화에서내용까지확인된동일기준파일: `src/data/stage4.js`, `stage7.js`, `battleLearningGuide.js`, `finalePolicy.js`, `src/engine/grammar/index.js`. 실제구현자는최신본을다시열어바뀐부분을반영한다. raw명칭에과거값이있을수있으므로표시명매핑을함께확인한다.

소스 기준 URL:
`https://github.com/YEOMT/grammardealer/tree/cc3b75da280aa93366fa75636c3c970d68621a2a`

## 3. 영어 문법의 외부 참고 — 학습 규칙 확인용

### W1. British Council — Participle clauses
https://learnenglish.britishcouncil.org/free-resources/grammar/c1/participle-clauses

이번기본범위에서분사부와주절주어의연결,분사형자체와시제의구별,능동/수동대표용법을확인했다. 실제영어에는완료형·독립구조등더넓은용법도있다. 본명세의‘문두기본형만필수’는게임구현범위이지영어전체의금지규칙이아니다.

### W2. Cambridge English Grammar Today — Conditionals
https://dictionary.cambridge.org/grammar/british-grammar/conditionals

조건절선행시쉼표와결과절선행시통상무쉼표인차이를확인했다. 이번검색의페이지요약은확인했으나본문직접열기는403응답이었다. 기존가정법형태의모든예외까지새로검증했다는뜻은아니다.

### W3. Purdue OWL — Commas: Quick Rules
https://owl.purdue.edu/owl/general_writing/punctuation/commas/index.html

문두도입부와등위절등의문장부호기준을참고했다. 이페이지도수사적예외가있음을언급한다. 게임에서미지원인나열·삽입을틀린영어라고단정하지않는다.

### W4. Purdue OWL — Run-ons, Comma Splices, Fused Sentences
https://owl.purdue.edu/owl/general_writing/punctuation/independent_and_dependent_clauses/runonsentences.html

쉼표만으로두독립절을이어기본학습용정상복문으로인정하는것을피하는근거다. 감점률·점수·보스조건은외부문법자료가정한값이아니라게임설계다.

## 4. 이번 확인의 한계

소스읽기와공개문법자료확인만수행했다. 게임코드수정,신규파서실행,실제예문제출,실기기청취/터치,자연50전투완주,게임빌드/배포는수행하지않았다. 패키지검사는파일구성·동일본문·정책/명칭일치·ZIP무결성에한정한다.
