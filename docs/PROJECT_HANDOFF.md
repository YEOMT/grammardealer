## 0.5 소원의 사막 인계

작업 시작 최신 origin/main은 6d2907eddefafb1a909c6c803259ba26b408f104(0.4 PR #6 병합)이고 미커밋 변경이 없었다. codex/v0.5-wish-desert-nonfinite-seal에서 확장했다. spec/0.5_WISH_DESERT.md가 이번 변경 근거이며 첨부 JSON은 기대값이다. 실제 결과는 TEST_REPORT_0.5.md와 ACCEPTANCE_0.5.md를 따른다.

새0.5 원정만 22전투다. 하늘섬 보스 승리 → STAGE4_CLEAR/세팩 해금 → 보상 → 사막 예고 → 부족한 to/want/enjoy 계열 최대3장 → 5전투 → STAGE5_END로 연결한다. 상점은 항구/하늘섬의 두 곳만 유지한다. 기본28장/자원/초원·항구·협곡·하늘섬HP/기존룬/실습40·126은 유지한다.

하나의 기존 ING Form을 쓰고 역할은 제출 전체 구조에서 판정한다. 기본5형식×2.5, 정상to/동명사각×1.4, 사막대상×1.25와 HP520/560/600/640/840은 명세의 구현 초깃값이다. 기존1~4형식/시간/연결/룬 배수는 바뀌지 않는다.

스핑크스는 실제 첫패/다음턴 드로우 뒤 HAND WORD 한 사본을 encounter stream으로 한 번 봉인한다. Controller 배치만 차단하고 체크·교환·보급·탐색은 허용한다. 교환된 같은 사본의 당턴 재획득에도 봉인은 유지한다. load/effect/Undo는 추첨하지 않는다. TURN_HAND_SEAL의 물리ID·turnKey·작은history를 원정과 함께 보존한다.

0.4 이하 저장은 원래 언어/수치/후보/RNG/종료 경계다. 생성기는 검증된0.4 규칙을 그대로 쓴다. v05-legacy-040-golden.json은 변경 전 실제0.4 독립 캡처로 다시 생성해 맞추지 않는다. 아래 내용은 각 버전의 당시 기록이다.

## 0.4 Syntax Atlas 인계

작업 시작 최신 origin/main `db9f6ca508329b2306ef7a5a6916bb5ea404c418`에 0.3 PR #5가 병합되어 있었고 checkout은 깨끗했다. 별도 `codex/v0.4-sky-islands-operations`에서 구현했다. `spec/0.4_SKY_ISLANDS.md`, `IMPLEMENTATION_PLAN_0.4.md`, `TEST_REPORT_0.4.md`, 교육·운영 검토표가 최신 기준이다. 과거 ZIP으로 소스를 대체하지 않았다.

새 0.4만 초원3+항구4+협곡5+하늘섬5=17전투다. 협곡 완료 보상 → 하늘섬 예고 → 없는 재료 최대4장 → 상점2 → 5전투 → STAGE4_END. 전체 스토리 완료가 아니다. 상점1은 1룬/2카드, 상점2는 2룬/3카드다. 운영은 손패에서 사용 후 EXHAUSTED에 남고 다음 전투 복귀한다. 연마는 불가하고 제거는 가능하다.

문법은 실제 구·절과 동사구 증거를 만든다. 연결 ×1.6 / 구 연결 +10 / 하늘섬 ×1.25는 명세 초깃값이다. 문지기 50% 보호막은 실제 접속사 절 연결 첫 공격부터 영구 해제하며 고점 원킬을 막지 않는다. 새 덱은28장 WORD, have 고정 슬롯과 be/have/you/I 고급을 반영한다. 실습40/126·기존 HP/자원/룬은 유지한다.

기존 0.1~0.3 원정은 원래 버전 view·카드·수치·상품·공개 보상·RNG·종료 경계를 사용한다. DB/저장소/base URL은 이름 변경과 무관하게 유지했다. `v04-legacy-030-golden.json`은 변경 전 독립 캡처이며 다시 생성해서 맞추면 안 된다. 아래 문단들은 해당 버전 당시 계약이다. main 병합·공개 배포는 별도 승인 사항이다.

## 0.3 시간의 협곡 인계

작업 시작 origin/main은 d6535b6c8c74132a34e7eb56f778ef0eedcd3b24이며 0.2.2 PR #4 병합과 깨끗한 checkout을 확인했다. 브랜치 codex/v0.3-time-canyon에서 구현한다. spec/0.3_TIME_CANYON.md, PATCH_NOTES_0.3_KO, TEST_REPORT_0.3, VERB_MORPHOLOGY_AUDIT_0.3, NOUN_COUNTABILITY_AUDIT_0.3, EDUCATION_REVIEW_0.3을 먼저 읽는다. 첨부 JSON은 기대값이며 통과 기록은 별도다.

새 0.3 원정은 초원3 + 항구4 + 협곡5 = 12전투다. Stage2 승리 사건에서 시간 4계열을 해금하고, 보상 뒤 협곡 예고 → 없는 be/have/will 0~3장 지급 → 첫 전투로 이어진다. 협곡에는 상점이 없다. 골렘은 과거/현재/미래 240씩 순서대로 처리하며 한 공격은 한 부위뿐이다. 마지막 부위 처치 후 4번째 룬 슬롯과 STAGE3_END가 열린다. 전체 스토리 완료는 아니다.

언어/점수/룬은 원정 버전으로 고른다. 기존 원정은 0.1/0.2의 언어·수치·덱·상점·보상·RNG·완료 경계를 유지한다. 새 실습은 40/126, 기존 저장 실습은 30/87이며 완료 정책은 0.2.1 그대로다. IndexedDB 이름과 3슬롯은 유지한다. 아래 문단들은 각 버전 당시 계약이다.

## 0.2.2 인계

기준은 작업 시작 시 최신 origin/main 50b4311이며 0.2.1 PR #3 병합을 확인했다. 새 브랜치는 codex/v0.2.2-grammar-learning-integrity. PATCH_PLAN_0.2.2 / PATCH_NOTES_0.2.2_KO / VERB_FRAME_AUDIT_0.2.2 / EDUCATION_REVIEW_0.2.2 / TEST_REPORT_0.2.2를 먼저 읽는다.

새 원정만 INVALID_CORE를 제출 거래로 정산한다. accepted는 영어 정답 여부가 아니라 거래 확정이다. 기술 오류는 무소모다. comboEligibility는 원정의 해금 합집합을 고정하고 실제 scoreableHitIds를 기록한다. registryForVersion의 0.2.1 view를 보존하며 초기 생성 Frame 후보는 이 view를 사용한다. 0.2.1 실습 완료 버전은 그대로 유지한다.

learningRecords와 grammarGuideData가 번역 없는 교육 기록을 담당한다. 과거 의미 모듈은 호환/레거시 순수 검사에 남아 있지만 새 기록 생성과 학생 도감은 호출하지 않는다. 이전 기록의 원데이터를 보존한 educationalReview만 추가한다. DOM 사전 별칭은 하나의 단어 데이터/보기로 연결한다. production의 sandbox/debug 진입은 닫고 개발 모드에 남긴다.

아래 0.2/0.2.1 문단은 당시 계약 설명이다. 새 정책과 실제 결과는 위 문서를 우선한다.

## 0.2.1 후속 인계 (현재 작업본)

이번 기준은 fetch한 origin/main 78999463640d834a6468a37eb2dd71831e721e84이며 codex/v0.2.1-guided-tutorial-feel에서 개발한다. 아래 0.2 설명은 이전 버전 기록이다. 최신 동작과 실행 증거는 PATCH_NOTES_0.2.1_KO.md / TEST_REPORT_0.2.1.md를 따른다. 새 원정 초원 HP는 77/132/242, 항구는 220/300/380/640이다. 새 실습 완료 플래그가 없는 프로필은 Stage 1-1에서 고정 물리 카드 실습을 진행한다. 구버전 guideSeen은 완료로 간주하지 않는다. 0.1.0/0.1.1/0.2.0 저장에는 이 실습과 HP 변경을 소급하지 않는다.

# 센텐스 발라트로 0.2 — Codex 프로젝트 인계

현재 개발 기준은 작업 시작 시 fetch한 `YEOMT/grammardealer` 최신 `origin/main`이다. 0.2 작업은 `2fdafeba8c93435844eef2d7aec0f3e25509bde9`에서 분기한 `codex/v0.2-stage2-svoo-shop`에서 시작했다. 이 main에는 기존 v0.1.1 소스 이관과 최대 카드 수 UI 수정이 이미 포함되어 있다. 과거 Work ZIP이나 배포 번들로 소스를 대체하지 않는다. 다음 작업도 당시 최신 main과 미커밋 변경을 먼저 확인한다.

## 현재 범위와 확인할 자료

브라우저에서 동작하는 Vanilla JavaScript ES Modules + Vite 학습 카드 게임이다. 문법 엔진·점수·룬·전투·연출을 분리하며 `RunController`만 실제 원정 상태를 커밋한다. 외부 AI, 서버, 계정·랭킹 시스템은 없다.

새 0.2 원정은 여행자·난이도 1, 시작의 초원 3전투와 전달의 항구 4전투를 제공한다. 초원 HP `91/156/286`은 그대로이며 항구 HP는 명세 초깃값 `220/300/380/640`이다. 첫 상점은 항구 입장에 한 번이다. 항구 보스 보상 후 `CONTENT_COMPLETE / STAGE2_END`로 끝나며 전체 스토리 클리어와 구분한다.

| 자료 | 현재 용도 |
| --- | --- |
| `AGENTS.md` | 모든 개발의 작업·보존·검증 규칙 |
| `README.md`, `README_KO.md` | 실행과 학생 플레이 순서 |
| `spec/SentenceBalatro_0.2_Codex_Implementation_Prompt.md` | 이번 신규 범위·보존 요구·P01~P30 |
| `docs/IMPLEMENTATION_PLAN_0.2.md` | 출발 기준과 변경·보존 계획 |
| `docs/ARCHITECTURE.md`, `docs/LANGUAGE_SCOPE.md` | 현재 코드 책임·지원 언어 |
| `docs/PATCH_NOTES_0.2_KO.md`, `docs/TEST_REPORT_0.2.md` | 새 기능·실제 실행 결과·미검증 범위 |
| `docs/KNOWN_ISSUES.md`, `docs/DECISIONS.md` | 한계와 구현 판단 |
| 기존 0.1/0.1.1 명세·history·baseline 보고서 | 당시 근거와 실행 증거; 이번 결과로 재사용하지 않음 |

0.1 설계 수치나 당시의 “Stage 1만 구현”을 현재 코드에 되돌려 적용하지 않는다. 문서보다 실제 코드·테스트와 새 명세를 함께 대조한다.

## 반드시 보존할 정상 동작

- 시작 덱은 28장: N6/P4/V8/Adj3/Adv2/Det3/Prep2. be 2장, 서로 다른 SV 동사 최소 2종, 실제 첫 손패 접근성을 유지한다. 이후 보상·입장·구매로 덱이 커질 수 있다.
- 기본 첫패 6, 손패 한도 10, 이후 드로우 3, 교환 4회, 행동 6턴, 조합대 16장. 운영 룬은 전투 시작 때 스냅샷으로 적용하며 재배열로 재지급하지 않는다.
- 카드 본체 클릭·드래그·삽입·회수·맞교환·형태 선택·Undo, 별도 체크 후 다중 버리기를 유지한다. be는 원형으로 놓고 사용자가 am/is/are를 고른다.
- 카드 점수는 기본 10 + 연마 단계 ×5, 연마 상한 +3이다. 기존 열 룬의 효과·수치·슬롯 순서·3레벨 상한은 바꾸지 않는다.
- 제출 전 정답·예상 점수·IO/DO·문장별 보스 충족 여부를 계산해 보여주지 않는다. 공개된 일반 문법 예시와 보스 규칙은 별개다.
- 혼합 세 칸 보상, 전역 2의 첫 룬 예외, 선택 취소, 카드/룬/서비스 중복 필터를 유지한다. skip은 카드 칸이 있으면 +3, 없으면 +2이며 팝업당 한 번이다.
- 기본 승리 재화는 일반 2·지역 보스 6, 남은 행동 턴 ×1을 한 번 정산한다. 마지막 행동으로 처치해도 승리가 우선이다.
- 첫 전투 가이드의 성공 행동 기록, 별도 연습 Controller, 개인 도감·설정·기록을 유지한다. 항구에서는 긴 조작 가이드를 반복하지 않는다.
- 최신 main의 최대 카드 수 배치와 글자 크기, 룬 패널/손패 스크롤, 느린 채점·룬 색 이동을 유지한다. 카드170ms·문법550ms·룬 flight220ms+read520ms와 watchdog의 읽기 시간 정책은 그대로다.

## 새 문법과 공격 흐름

현재형 SVOO는 give/show/make/send의 명시된 runtime Sense binding에서만 인식한다. IO와 DO는 여러 카드로 된 NP이며 실제 카드 ID를 중복 사용하지 않는다. give/show/send의 to, make의 for 대응 표현은 3형식이다. like/read 등 다른 동사를 cap.svoo 활성화만으로 함께 확장하지 않는다. 5형식·부정사·관계절·과거 등은 여전히 미지원이다.

`SentenceSnapshot → Grammar → Scoring → Rune → Stage/Boss → Controller 커밋 → Presentation` 순서다. `VALID`/`VALID_WITH_ISSUES`만 공격한다. 무효·미지원·엔진 오류는 자원·카드·RNG를 보존한다. Grammar는 룬·재화·적·한글 번역을 읽지 않는다.

4형식 기본 배율은 ×2, 항구 주절 4형식 지역 배율은 ×1.25이다. 토파즈 Lv1/2/3는 ×1.5/×2/×2.5이며 인정된 주절 SVOO에 공격당 한 번 적용한다. 각 배수는 유리수로 계산하고 단계마다 내림한다. SVO+to/for에는 토파즈나 항구 지역 보너스가 붙지 않는다.

항구 보스 장막은 활성 중 비SVOO 피해를 ×1/4로 줄인다. 작은 정확성 오류가 있어도 SVOO 뼈대가 인정되면 그 공격부터 해제된다. 해제는 추가 점수·재화를 주지 않고, 이후 모든 유효 문형이 정상 피해를 준다. 매우 큰 비SVOO도 돌파 가능하다. Stage 엔진이 장막 before/after와 이벤트를 반환하고 Controller가 한 번 커밋한다. UI는 해제 이벤트에서 장막, 타격에서 HP를 표시한다. 합성 면역 fixture를 실전 보스로 사용하지 않는다.

## 지역·상점·보상

새 원정의 전환은 다음과 같다.

`초원 보스 정산 → STAGE1_CLEAR milestone/해금 → 보스 보상 → STAGE_CLEAR → NEXT_STAGE → 항구 STAGE_INTRO → ENTER_STAGE → 입장 지급/고정 상품 → SHOP → LEAVE_SHOP → 항구 첫 전투`

Stage 1 milestone은 최종 콘텐츠 완료에 의존하지 않으며 보스 보상 생성 전에 `runOwnUnlocks`를 반영한다. 토파즈 해금은 후보 자격이며 무료 장착이 아니다. 기본 열 룬은 항상 허용하고 토파즈는 원정 시작 기준 또는 그 원정의 실제 해금이 필요하다. 다른 슬롯의 새 해금이 진행 중인 원정 후보를 소급 변경하지 않는다.

지역 전환에서 이전 `combat`을 닫는다. 입장·상점에서는 `combat=null` 상태로 소유 덱만 바꾸고, 상점 종료 후 처음 셔플한다. 전투 안에서는 모든 활성 카드가 DRAW/HAND/SENTENCE/DISCARD 중 정확히 한 곳에 있어야 한다.

`grantStage2Entry`는 runtime SVOO 동사가 없을 때 give 한 장, 대표 경로의 to 또는 for가 없을 때 연결 카드 한 장을 지급한다. 기록은 `entryGrants['stage.02']`이며 실제 bounded witness로 주어·IO·DO 경로를 확인한다. 부족하면 경고만 남기며 여러 장을 숨겨 지급하거나 제거 후 복구하지 않는다.

상점은 `shopId`와 세 상품·가격·구매 여부를 저장한다. 추첨은 `rng.shop`만 사용한다. 카드 가격 6/10/14, 룬 가격 18/24/32, 연마 8, 첫 유료 제거 6(성공 후 다음 가격 +2)은 명세 초깃값 그대로다. 연마와 제거는 각각 한 번이며 무료 보상 제거는 유료 제거 누적수에 영향을 주지 않는다. 교체 대상·제거 확인 전, 부족한 재화, 오래된 revision·commandId·itemId는 무손실로 거절한다.

보상은 전역 4~6 일반전, 7 보스전이다. `roundIndex===2`를 보스로 간주하지 않는다. 룬·카드·서비스를 세 칸에서 각각 뽑고 한 개를 얻는다. 현재 지역 관련 후보와 실제 적 종류를 사용한다.

## 저장·구버전 호환

IndexedDB 이름 `sentence-balatro-v0-1`, DB version 1, `profiles`/`slots`, 독립 `playerId`, 수동 3슬롯을 유지한다. 트랜잭션 완료 후에만 저장 성공을 표시한다. 원정 자동 저장·클라우드 동기화는 없다.

0.2 저장은 `contentVersions`, runtime `contentManifest`, Stage 2 진행, 입장 지급 이력, 상점 상품/가격/구매/서비스, 유료 제거 횟수, 장막 상태, 네 RNG를 포함한다. 초기 전투·보상·전투 사이·지역 완료·안정된 SHOP·구간 완료를 저장할 수 있다. 항구 소개 중에는 저장하지 않고 입장 처리 후 SHOP을 안전 지점으로 삼는다. 공격 연출 중에는 저장하지 않는다.

0.1.0/0.1.1 원정은 자동 확장하지 않는다. 기존 30/28장, HP, 명시 형태, 공개 보상, 강화·룬·재화·RNG를 유지하고 Stage 1의 `STAGE1_END`로 끝낸다. `registryForVersion`의 작은 레거시 view와 보상 분기가 앞으로 생성할 카드·룬 후보 및 순서도 보존한다. 미래 해금 ID를 삭제하지 않으며 새 프로필이나 새 identity로 바꾸지 않는다. 이전 프로필에서 새 0.2 원정을 시작하면 기존 도감·실적·실제 토파즈 해금을 이어받는다.

같은 seed가 모든 버전에서 같은 결과를 보장하지는 않는다. 동일 버전·설정·초기 해금·선택·RNG 상태에서 재현한다. 7전투 완료는 `storyClearCount`나 전체48전투 후속 난이도를 증가시키지 않는다. Stage 2 완료 기록은 별도 멱등 사건이며 `qualifiedRunIds`를 다시 늘리지 않는다.

## 검증과 원격 작업

`npm test`, `validate:data`, `test:decks`, `test:runs`, `node tools/simulate-entry.js`, `build`, `test:browser`, `test:e2e`의 현재 실행 방법은 README를 따른다. `test:browser`에는 별도 개발 서버가 필요하며 `test:e2e`는 production 하위경로 자체 서버를 쓴다. 현재 테스트 수·성공/실패·NOT RUN은 `TEST_REPORT_0.2.md`를 최종 근거로 삼는다. 실제 UI 완주, Controller 명령 완주, 합성 배치 fixture를 구분한다.

출발 main의 독립 참조로 만든 `tests/fixtures/legacy-reward-baseline-0.1.json`은 72개 레거시 보상/순서/RNG golden 사례다. `tools/simulate-entry.js`는 4모드×100개의 고정 seed에서 실제 초원을 진행한 뒤 입장과 상점 후 드로우를 검사한다. 특정 fixture HP를 낮춘 결과나 산술만으로 실제 완주를 주장하지 않는다.

소스는 Git 저장소 루트, 빌드는 `dist/`, 공개 경로는 `/grammardealer/`다. 기존 workflow는 PR에서 검증만 하며 main의 비PR 실행에서 성공한 build 이후에만 Pages를 배포한다. 0.2 작업 권한은 개발 브랜치 push와 PR 생성까지다. main 직접 push·merge·자동 merge·Pages 설정 변경·수동 공개 배포는 하지 않는다. 실제 원격 결과와 PR 주소는 최종 테스트/작업 보고를 확인한다.

## 후속 경계

Stage 3 이후 실제 전투, 총48전투 완성, 다른 캐릭터·난이도, 과거·완료·수동·관계절·5형식, 상점 추가 방문, 서버·랭킹, PWA는 미구현이다. roadmap의 48전투·상점6회·미래 해금 ID는 메타데이터로 보존한다. 실제 기기와 다른 브라우저 검증 한계는 `KNOWN_ISSUES.md`, 다음 작업은 `NEXT_STEPS.md`를 따른다.
