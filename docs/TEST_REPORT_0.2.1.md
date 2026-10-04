# 0.2.1 실제 구현·검증 보고

검증일 2026-10-05 (Asia/Seoul). 과거 Work/0.2 결과를 이번 결과로 재사용하지 않았다. 실행 중 발견한 실패도 아래에 보존한다.

## 기준·환경

- 작업 시작 시 fetch한 origin/main: `78999463640d834a6468a37eb2dd71831e721e84`. 원격 재확인에서도 동일했다. 브랜치 `codex/v0.2.1-guided-tutorial-feel`, source root `.` (실제 Git checkout).
- 시작 checkout은 clean이었다. 원본 ZIP/이전 인계 소스/`.baseline-backup`을 수정하지 않았다.
- Windows / Node 24.19.0 / npm 11.17.0 / Git 2.51.0.windows.2 / Vite 8.3.2 / Playwright 1.51.1 / Chromium 134.0.6998.35.
- 기존 `../.local-tools/node-v24.19.0-win-x64/{node.exe,npm.cmd}`, `../.local-tools/playwright-browsers`를 재사용했다. 시스템 PATH·관리자 설치·의존성 버전 변경 없음. package-lock의 앱 버전 두 곳만 0.2.1로 변경했다.
- 새 작업 시작 시 실제 baseline `npm test` 273 PASS, `npm run build` PASS. 로그는 `.local-validation/v021/baseline/`에 보존한다.

## 실제 실행

최종 집계는 검증 프로세스 종료 후 아래 표에 기록한다. 원본 stdout와 개발 중 실패는 `.local-validation/v021/`의 각 실행 폴더에 남아 있다. 웹에 공개하는 문서에는 사용자 절대 경로를 넣지 않는다.

| 실행 명령 | 결과 | 종료 코드 / 실제 결과 |
|---|---|---|
| npm.cmd test | PASS | 0 / 284 pass, 0 fail, 0 skip |
| npm.cmd run validate:data | PASS | 0 / 2327 checks, 120 lexemes, 251 forms |
| npm.cmd run build | PASS | 0 / index-C5Ii1oKn.css, index-BUOFDg6d.js |
| npm.cmd run test:decks | PASS | 0 / 10,000, repairs=0, fallback=0 |
| npm.cmd run test:browser | PASS | 0 / Phase B 3, C 4, D 4, E 8, legacy UI 41, Stage 2 UI 29, 새 실습 UI 47 |
| npm.cmd run test:e2e | PASS | 0 / 실제 22회 공격(실습 2), 총 7전투, /grammardealer/ |

최종 로그는 .local-validation/v021/final4/이며 10,000 덱 원본 로그는 final2/test-decks.log이다. 새 실습 브라우저 캡처 27개, 기존 최대 배치 UI 캡처 25개, Stage 2 fixture 캡처 19개를 이번에 재생성했다. 전체 캡처 대신 대표 7장·영상 2개를 공개 증거로 선별했다. 최종 production 실행에는 초기/보상/SHOP/완료 저장 재로드, 첫 룬, 오프라인 항구 완주, 4형식 장막 해제가 포함된다.

기존 고정 경로 증거 69개는 실행 결과를 별도 보관한 뒤 원본으로 복원했고 SHA-256 불일치 0개다. 기존 deck-validation.json도 백업 후 복원했다. 게임 소스는 의도적으로 수정했으므로 원본과 모두 동일하다고 주장하지 않는다.


테스트 기대값 변경은 다음으로 제한했다.

- fast 1개 추가에 따라 현재 lexeme 119→120, runtime 118→119, 기본 snapshot languageVersion 0.2.0→0.2.1. 이전 0.2 registry가 현재 registry와 같은 객체라는 가정은 전용 0.2 view 검증으로 바꿨다.
- 기존 자유 전투/이전 행동 가이드 검사에는 `tests/helpers/legacy-controller.js`로 **명시적인 0.2 원정 fixture**를 제공한다. 구체적 공격·저장·후보·배치 assertion은 유지했다. 기존 브라우저 입력/학습 묶음은 local main module의 Controller import만 이 fixture로 라우팅한다. 이 실행을 새 원정 실습 검증으로 세지 않는다.
- 새 mandatory 실습은 `guided-tutorial.test.js`, `guided-browser.mjs`, 실제 production `e2e.mjs`가 별도로 검사한다. 테스트 skip/삭제/오차 완화/강제 피해는 없다.
- QA 정책 시뮬레이터의 기본 0.2 캠페인 fixture도 명시했다. 기존 unit의 0.1.1/0.2 명령 완주와 production 새 0.2.1 완주는 구분한다.

## P01~P52

PASS는 아래 자동 검사 범위의 실제 결과다. 물리 기기나 주관적 음향 평가로 확대 해석하지 않는다. 복합 기대의 일부를 실행하지 못한 항목은 NOT RUN으로 두고 통과한 부분을 근거에 따로 적었다.

| ID | 결과 | 범주 | 실행 근거 / 남은 범위 |
|---|---|---|---|
| P01 | PASS | 기준 | 기존 unit/golden 회귀 + production 7전투 |
| P02 | PASS | HP | guided unit 버전별 HP + 다음 전투 132 + production |
| P03 | PASS | HP | 기존 stage2/shop/rune 회귀; 가격·장막 수치 diff 없음 |
| P04 | PASS | 호환 | 기존 저장 회귀 및 버전별 encounter 표 |
| P05 | PASS | 정책 | 구 guideSeen/skip 프로필 unit |
| P06 | PASS | 정책 | 완료 프로필 unit + production 새 원정 + 별도 practice |
| P07 | PASS | 정책 | legacy-controller 저장/Stage 2 회귀 |
| P08 | PASS | 덱 | 4모드 동일 시드 일반 덱/RNG 직접 비교 |
| P09 | PASS | 덱 | 각 명령 후 assertRunInvariants; run A/B 분리 |
| P10 | PASS | 덱 | 고정 draw 실제 명령/브라우저 |
| P11 | PASS | 자원 | 교환/턴 unit와 브라우저; 다음 전투 교환 4 |
| P12 | PASS | 조작 | 1366 실제 pointer 드래그 및 카드 회수/재조합 |
| P13 | PASS | 조작 | 잘못된 명령·revision·중복 확인 unit |
| P14 | PASS | 조작 | 1024 Enter와 실제 삽입/재정렬 대체 버튼 |
| P15 | PASS | 문법 | 실제 resolveAttack 30; BE_FORM_REQUIRED 한 건 |
| P16 | PASS | 진행 | 실제 첫 공격 후 47 HP/5턴, T13 |
| P17 | PASS | 패널 | 네 실제 모달 열기/닫기 후 다음 단계 |
| P18 | PASS | 패널 | 빈 룬 안내와 두 공격 runeSnapshot 없음 |
| P19 | PASS | 준비 | 준비 전후 물리 카드 및 턴 unit/브라우저 |
| P20 | PASS | 형태 | 실제 form.run.third 메뉴 선택 |
| P21 | PASS | 문법 | VALID/SV/87 순수 엔진 결과 |
| P22 | PASS | 언어 | registry/pool 격리 + 10,000 덱 + shop unit |
| P23 | PASS | 계산 | Controller의 실제 순수 엔진 resolution 대조 |
| P24 | PASS | gate | 실제 이벤트 gate 40/60/87 DOM 확인 |
| P25 | PASS | gate | 각 gate 61초 fake clock; 별도 120초 clock 검사 |
| P26 | PASS | gate | clock hidden/visible + Chromium 합성 visibilitychange에서 상태 동일 |
| P27 | PASS | gate | attackId/cue/revision 중복·오래된 요청 거부 |
| P28 | PASS | gate | view exception/abort/stall timeout unit, 같은 결과 재생 경로 |
| P29 | PASS | 완료 | 47 실제 HP 감소·40 overkill·3턴·추가 draw 없음 |
| P30 | PASS | 완료 | T31 이전 완료 플래그 없음, 마지막 확인 후만 설정 |
| P31 | PASS | 정산 | 재화 5 및 FINISH/확인 중복 거부 |
| P32 | PASS | 덱 전환 | parked 덱 복원 뒤 보상 카드 29장 유지 |
| P33 | PASS | 덱 전환 | parked RNG/통계/사전 복원 deep equality |
| P34 | PASS | 기록 | bestAttack/grammarRecords/실습 통계 제외 |
| P35 | PASS | 룬 | 기존 첫 룬 회귀 + production 수정/호박/구리 첫 선택 |
| P36 | PASS | 재연습 | Phase D 별도 연습 화면에서 live state/profile 동일 |
| P37 | PASS | 복구 | 실제 gate 재시작 + attempt ID 분리 + clock cleanup unit |
| P38 | PASS | 저장 | production T01/보상 IndexedDB 동일 재로드 |
| P39 | PASS | 저장 | gate 저장 거부 unit + production SHOP 동일 재로드 |
| P40 | PASS | UI | 3해상도 39개 cue rect 비교, 대상 겹침 0 |
| P41 | PASS | UI | 실제 wheel 스크롤·resize·orientation 이벤트 후 DOM 좌표 비교; 물리 기기 회전은 별도 NOT RUN |
| P42 | PASS | UI | 44×44 체크, 본문 rect와 비중첩 + 기존 keyboard/touch UI |
| P43 | PASS | UI | 기존 본문/form/선택 분리 및 pointercancel 회귀 |
| P44 | PASS | UI | 기존 UI 4해상도 10/14손패·16조합대 검사 유지 |
| P45 | NOT RUN | VFX | 약/압도 실제 실습 영상, 강한 타격 엔진 fixture 영상·audio callback PASS; 실제 청취 NOT RUN |
| P46 | PASS | VFX | max HP 기준 LIGHT/HEAVY/OVERPOWER/BLOCKED unit |
| P47 | PASS | VFX | 반동은 sentence/enemy 부분에 한정, score/menu 고정 |
| P48 | PASS | VFX | 유한 퇴장 뒤 제거; T30 적 opacity 0, 후속 전투 렌더 정상 |
| P49 | PASS | 접근성 | 1024 reducedMotion + effectsOff/muted 실습 완료 |
| P50 | PASS | 회귀 | production 실습 포함 7전투 실제 완주 |
| P51 | PASS | 회귀 | legacy 입력/보상/상점 및 완료 프로필 새 원정 |
| P52 | NOT RUN | 제출 | PR 생성 이후 원격 결과를 기록한다. main/배포는 변경하지 않음 |


## 개발 중 발견·수정한 실패

1. 처음의 기존 회귀 39건 실패는 새 mandatory 실습 진입과 예전 자유 전투 fixture의 충돌, 언어 자료 1개 추가의 기대값 차이였다. 기존 assertion을 느슨하게 하지 않고 캠페인 버전을 명시했다.
2. 첫 안내 배치 검사에서 카드 타깃과 말풍선이 겹쳤다. 말풍선 너비를 먼저 적용한 뒤 실제 높이를 읽고, 카드 영역까지 고려하여 위치를 고르게 수정했다. 출발점과 삽입 위치 표시도 실제 DOM rect를 사용한다.
3. 0.2.1 항구 진입에서 shop의 앱 버전 검사가 0.2.0만 허용했다. 지원 캠페인 판별을 공유하되 상점 schema·가격·후보 규칙은 바꾸지 않았다.
4. 처치 연출 후 T30 재렌더가 적을 다시 표시했다. HP 0의 적은 후속 안내에서도 퇴장 상태를 유지하도록 수정하고 브라우저 assertion을 추가했다.
5. `/grammardealer/` 확인의 첫 시도는 테스트 정적 서버가 기존 `/nested/sentence-game/`만 매핑하여 404로 실패했다. 서버에 prefix 인자를 추가해 실제 배포 하위경로로 검사한다. 게임의 Vite base나 공개 Pages는 바꾸지 않았다.
6. 저장된 T01의 위조된 attackCount/attackId/선택/패널/드로우 RNG가 이후 gate를 건너뛰게 만들지 않도록 시작 저장 검증을 강화했다. 재시작 공격 ID에는 attempt를 포함한다.

## 증거와 한계

- [실습 시작](evidence-0.2.1/1366-tutorial-start.png), [선택 체크](evidence-0.2.1/1366-discard-selected.png), [준비](evidence-0.2.1/1366-prepared.png), [실제 87 확인](evidence-0.2.1/1366-score-gate-28.png), [처치 후 남은 3턴](evidence-0.2.1/1366-overpower-defeat.png), [1024 확인 화면](evidence-0.2.1/1024-score-gate-26.png), [보상](evidence-0.2.1/1920-tutorial-reward.png).
- [실제 실습·재시작·약/압도 타격 녹화](evidence-0.2.1/tutorial-1366.webm). [강한 타격 엔진 fixture 녹화](evidence-0.2.1/heavy-fixture.webm)는 실제 원정 완주와 구분한다. Playwright 영상은 소리가 없다.
- [새 브라우저 검사 JSON](evidence-0.2.1/guided-browser.json)과 production 결과를 선별 보존한다. 누적 중복 캡처·도구·node_modules/dist·원본 로그는 commit하지 않는다.
- 60초 이상 확인 대기는 fake clock으로 검사했고, visibility는 clock와 Chromium의 합성 visibilitychange로 검사했다. OS가 탭 프로세스를 강제로 죽이는 상황, 실제 iPad/Android/Safari/Firefox/WebKit, 실제 스피커 청취는 NOT RUN이다.
- 기존 소유격 뜻 참고/COMPLETE_HINT 등 범위 밖 문제와 Stage 3 이후 미구현은 유지한다. 새 실습은 실제 점수 엔진을 사용하고 정상 원정의 기록으로 세지 않는다.

## 사용자가 확인할 순서

1. 새 로컬 프로필 → 새 원정 → 초원 입장. 카드 이동·교환·순서 변경 후 첫 공격 30, HP 47을 확인한다.
2. 네 정보 창을 열고 닫은 뒤 he/very/fast로 준비한다. 새 run을 삽입하고 메뉴에서 runs를 고른다.
3. 점수 40/60/87에서 각각 확인한다. 한 확인 창에서 오래 기다리거나 탭을 바꿔도 자동 타격하지 않아야 한다.
4. 처치 후 3턴/재화 5 → 마지막 모험 안내 → 정상 덱 보상을 확인한다. 다른 새 원정에서는 같은 프로필의 실습이 반복되지 않는다.
5. 1-2 첫 룬 → 초원 보스 → 항구 첫 상점에서 저장/불러오기 → 4형식으로 장막 해제 → 7전투 완료.
6. 설정 재연습 후 원래 덱·재화·기록이 바뀌지 않는지, 구 0.2 저장에는 실습과 HP 변경이 소급되지 않는지 확인한다.

## 원격 제출

아직 이 문서 작성 시점에는 원격 제출 전이다. PR 생성 후 주소와 commit을 후속 기록한다. main 직접 push·merge·auto-merge·Pages 설정 변경·공개 배포는 수행하지 않는다.
