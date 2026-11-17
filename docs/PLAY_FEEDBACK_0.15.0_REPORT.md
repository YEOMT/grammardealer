# 0.15.0 Play Feedback — 실제 구현·검사

2026-11-17. 기준은 작업 시작 시 fetch한 `origin/main@baefec39ef9a725a060d41c3977febca4517a4eb`(v0.14.2)이며 시작 작업 트리는 깨끗했다. 브랜치는 `codex/v0.15.0-play-feedback`. 원본 인계 ZIP과 이전 증거는 보존했다.

## 구현

- **직조자:** 새 원정에만 예견과 분사구문/가정법 두 실을 함께 적용한다. 예견 통과 → 실 해제 → HP 하한 → 피해 순서다. 가정법은 예견을 우회하며 두 실이 풀려도 예견은 남는다. 마지막 실 해제 공격으로 즉시 격파한다. 실제 parser 근거와 별도 영수증을 사용한다.
- **호환성:** 기본 run/language/save 계약은 0.14.0을 상속한다. `NEW_RUN`의 선택적 `playFeedbackPolicy`와 manifest를 일치 검증하고, 새 공격/클리어는 별도 `syntax-atlas.0.15.0` ruleset으로 보존한다. 정책 없는 구원정의 예견/세 실/기록은 재해석하거나 승격하지 않는다. HP·턴·배율·50전투·28장·경제·언어 데이터는 변경하지 않았다.
- **실습:** 새 세션은 실제 카드 이동·회수·교환·순서·형태·공격·턴 넘기기 중심의 명시적 순서다. 의무 메뉴 방문과 반복 점수 gate가 없다. 기존 40/126점과 정상 덱/RNG 복원, skip/restart/exit, 구세션 진행을 유지한다.
- **사전·형태:** 영어 옆 한글 뜻, 영어 아래 작은 품사. 사전의 희귀도/연마/보유 수를 숨기고 내 덱·카드 상세는 별도 관리 모드로 보존한다. 형태창의 반복 설명과 빈 그룹만 제거했다.
- **카드 이동:** 실제 커밋의 DISCARD/RESHUFFLE/DRAW 순서를 일회성 결과로 전달한다. 같은 사본 재드로우를 놓치지 않으며 재섞기에서 미공개 ID/순서를 표시하지 않는다. 복사본만 움직이고 중단 시 잠금/복사본을 정리한다. 초기 표시값은 총 약 480ms/배속(최대 600ms), 성공 강조 약 650ms이며 확정 게임 밸런스가 아니다.
- **상점·연마:** 성공한 실제 거래만 같은 상품 자리와 골드 전후 값으로 반응한다. 버전별 실제 점수/운영 효과를 공통 함수로 표시하며 강제 완료 모달을 제거했다. 가격·상품 RNG·상한·취소/실패 처리와 필요한 선택 확인은 유지한다.

주요 파일은 `data/playFeedbackPolicy`, `engine/fateThreads`, `game/clauseThreadsState/runController/guidedTutorial/deck`, `ui/cardMovement/transactionFeedback/cards/overlays/models/shop/guidedCoach`, `main.js`다. 패키지와 lockfile은 앱 버전 두 곳만 변경했으며 의존성 변경은 없다. 기존 배치 CSS·폰트·에셋·오디오·PWA·언어 registry는 수정하지 않았다.

## 실제 실행

Node 24.19.0 / npm 11.17.0, Playwright 1.51.1 / Chromium 134. 기존 작업 폴더의 `.local-tools`를 재사용했다. 명령은 checkout 루트에서 실행했다. 개발 서버는 `npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort`, 브라우저는 `SB_BASE_URL=http://127.0.0.1:5174/`를 사용했다.

| 실제 명령 | 종료 코드 | 결과 |
|---|---:|---|
| `npm.cmd test` | 0 | 2,021 PASS, 0 FAIL, 0 skipped |
| `npm.cmd run validate:data` | 0 | 3,668 checks PASS, 언어 정책 0.14.0 |
| `npm.cmd run build` | 0 | production build PASS, JS 751.82KB(gzip 228.37KB) |
| `node tests/play-feedback015-browser.mjs` | 0 | A~F 6묶음 PASS |
| `node tests/patch-reward-browser.mjs` | 0 | 기존 보상·연마 UI PASS |

최종 단위 실행은 17:57~18:02 KST, 데이터/빌드는 18:03 KST다. 이후 변경은 보고서/증거뿐이다. [명령·시간·로그 해시](evidence-play015/commands.json). Vite의 500KB 초과 번들 경고는 남으며 이번에 범위 밖 코드 분할을 하지 않았다.

브라우저 6묶음: A 보스 지정 상태 / B 실제 앱 실습 클릭 / C 사전·형태·내 덱 / D 실제 교환·재섞기 표시 / E 상점 구매·연마 / F 전체화면·2배속·중단·효과 끄기. PC 1280×720, 태블릿 크기 1024×768, 휴대폰 크기 844×390 및 932×430을 Chromium에서 확인했다. 6묶음 PASS, pageerror 0, 캡처 4장. [실행 자료](evidence-play015/report.json)

보스 브라우저는 합법 카드/룬을 구성한 **지정 상태**다. 실제 Controller 판정은 첫 공격 위력 7846 → HP 1, 같은 주절 문형은 위력 0, 가정법 위력 7233 → HP 0이며 승리 정산은 1회였다. 자연 보상 원정의 승률이나 완주 결과가 아니다. 실습은 PC·휴대폰 크기의 실제 앱 UI에서 각각 완료했고 정상 28장/보상 5골드를 확인했다. 교환 표시에서는 DISCARD → RESHUFFLE → DRAW, 53개 좌표 표본의 구역 고정과 손패 페이지 유지를 확인했다.

인계 JSON B01~B12는 실제 실행한 **합성 산술** 검사다. B11의 복수 근거 조합도 산술 경계만 검사하며 자연 문장 발견으로 주장하지 않는다. 별도 검사에서 현재/과거분사 및 두 가정법을 실제 cardDef/form snapshot으로 재분석하고, 중복 단어마다 별도 instanceId를 사용했다.

## 인수 조건

PASS는 아래 자동화 범위에 한정한다. 물리 기기 사용성까지 통과했다는 뜻이 아니다.

| AC | 결과 | 실제 근거 |
|---|---|---|
| 01 | PASS | 선택적 새 정책, 구 예견/세 실, 정책 누락·영수증 위변조 거절 및 기존 저장 회귀 |
| 02 | PASS | 28장·50번째 전투·기존 HP/턴/언어/해금·최종전 회귀, 데이터 미변경 |
| 03 | PASS | 실제 분사구문 카드 판정 + 지정 상태 A의 같은 문형 차단 |
| 04 | PASS | 두 가정법 실물 snapshot 및 같은 문형 우회/기억 산술 |
| 05 | PASS | 현재/과거분사 각각 PARTICIPIAL 하나 해제 |
| 06 | PASS | 두 가정법 허용, 현실 조건·일반 과거완료·진행/수동 본절 제외 |
| 07 | PASS | B01~B12 순서·누적·차단·반복 및 실제 A |
| 08 | PASS | HP 1/실제 감소 0에서 해제, 마지막 공격 격파 |
| 09 | PASS | 해제 후 예견, 불성립·analyzer 오류·0위력·PREPARE 불변 |
| 10 | PASS | Controller 중복 명령 거절, 전용 영수증 재생/위변조/최근 기록 절단, 보상 1회 |
| 11 | PASS | 원정 정책별 준비/목표 안내와 준비 대상 Stage 10 상점 E |
| 12 | PASS | B 실제 실습을 의무 메뉴 없이 완료, 자발적 뽑을 카드 창 후 동일 단계 |
| 13 | PASS | B 카드·교환·순서·형태·공격·턴 넘기기, 단계별 고정 점수 40/126 |
| 14 | PASS | 새 순서에 점수 gate 없음, 두 실제 공격 FINISH 후 정상 완료 |
| 15 | PASS(자동화) | PC/휴대폰 가시 대상·페이지 접근, viewport cleanup. 실제 주소창/회전 터치는 NOT RUN |
| 16 | PASS | 완료/skip/restart/exit의 28장·parked RNG·통계, 구튜토리얼 단위 검사 |
| 17 | PASS | C 형태창 p.p./큰 버튼·빈 그룹 제거, 기존 입력 경로 보존 |
| 18 | PASS | C 영어/뜻 좌우, 품사 아래의 실제 DOM 좌표 |
| 19 | PASS | C 사전 관리 행 제거·검색·공개 단어, 기존 어휘 회귀 |
| 20 | PASS | C 내 덱 관리 수치, 공유 상세/연마 계산 함수 |
| 21 | PASS | 이동 collector 유무의 ID/더미/RNG 일치, 단일·복수 교환 |
| 22 | PASS | 실습 PREPARE의 기존 조합 유지, 포화/빈 더미/마지막 턴은 가짜 DRAW 없음 |
| 23 | PASS | 같은 사본 재드로우·중간 재섞기 순서, D 실제 비행 순서 |
| 24 | PASS | D 두 손패 페이지 선택·현재 페이지 유지, 쉼표는 WORD 더미 밖 |
| 25 | PASS | D 53개 표본에서 전투 구역 고정, 원본 이동 없이 복사본/전용 입력 소유 |
| 26 | PASS | 실패 명령 불변, F abort/viewport/fullscreen 후 복사본·잠금 정리 및 정산 1회 |
| 27 | PASS | 구매/교체/제거/상한 기존 검사와 E 실제 상점, 개발 설명만 축약 |
| 28 | PASS | E 성공 상품 동일 좌표·실제 골드 변화, 중복/부족 실패 불변 |
| 29 | PASS | WORD 실제 20→25·운영 재사용 효과, 보상 브라우저 10→15 및 상세 공통 계산 |
| 30 | PASS | E 비차단 실제 사본 연마, 기존 보상 브라우저, 상한/실패/중복 회귀 |
| 31 | PASS(범위 내) | 기존 기반 단위 회귀와 짧은 PC/태블릿/휴대폰 UI. 전체 실기기·청취는 NOT RUN |
| 32 | PASS | 명령/종료 코드·증거·실기기 미실행·원격 반영/배포를 분리 보고 |

## 실패를 발견하고 수정한 범위

- 첫 전체 단위 실행은 **2011 PASS / 8 FAIL**(종료 1). 하나는 앱 버전 기대값, 일곱은 구튜토리얼 검사가 최신 NEW_RUN을 사용한 fixture 문제였다. 앱 표시 기대값만 0.15.0으로 바꾸고, 구단계/gate 검사는 명시적 구정책 fixture로 분리했다. 구 assertion은 유지했다.
- 첫 집중 브라우저는 A/B/C/F PASS, D/E FAIL. D는 1280px에서 카드 10장이 한 페이지에 들어가 두 페이지 전제를 충족하지 않은 검사 설정이었다. 1024px 두 페이지로 실제 확인했다. E는 골드 결과 행이 상품을 15px 미는 **구현 결함**이었다. 결과를 기존 골드 슬롯 안에 표시해 같은 좌표를 유지했고 재검사했다.
- 개발 중 새 단위 검사의 잘못된 운영 카드 ID와 완료 보상 생성까지 RNG가 불변이라는 기대를 바로잡았다. 완료는 parked deck/shop/encounter RNG를 복원하고 정상 보상 offer 생성만 reward RNG를 진행한다. 게임 RNG를 검사에 맞춰 바꾸지 않았다.
- 기존 브라우저의 강제 연마 완료 모달/ING 반복 설명/사전 보유 수 기대는 이번 명세의 삭제 요구에 맞췄다. 수치·카드·거래 assertion은 유지했다. 구 guided 브라우저는 구정책 저장으로 시작하도록 했으며 원래 gate 검사를 삭제하지 않았다.

전체 실행 로그는 무시 경로 `.local-validation/v015/`에 보존한다. 이전 `timing.json`/`reward-distribution.json`을 실행 전 백업하고 새 출력은 별도 보관한 뒤 원본을 복원했다. 공개 증거에는 개인 절대 경로나 원본 로그를 포함하지 않았다.

## 대표 화면과 남은 범위

- [직조자 지정 상태: 마지막 실 격파](evidence-play015/boss-two-threads.png)
- [휴대폰 크기 실제 실습](evidence-play015/mobile-tutorial.png)
- [태블릿 크기 사전](evidence-play015/dictionary-tablet.png)
- [상점 실제 구매·연마 피드백](evidence-play015/shop-polish.png)

**NOT RUN:** 물리 iPad/iPhone/Android의 터치·주소창·앱 전환·청취, 카카오톡/인앱, 교차 브라우저 전수, 50전투 자연 완주/승률, production 전체 원정. 기존 `test:browser` 전체 묶음과 별도 옛 guided/desert/grammar-learning 브라우저 전체는 이번에 실행하지 않았으며 최신 변경의 6묶음과 보상 검사를 실행했다. 해당 옛 검사 파일의 UI 기대 변경은 실행 결과와 구분한다. 480ms 이동과 짧은 강조의 미적 선호는 후속 사용자 피드백 대상으로 남긴다.

main 병합·자동 병합·Pages 설정 변경·공개 배포는 수행하지 않는다. 기존 workflow는 PR에서 test/data/build만 수행하고 Pages upload/deploy는 main 이벤트로 제한되어 있다.
