# Syntax Atlas 0.7.0 실제 검증

## 기준과 범위

작업 시작 시 fetch한 `origin/main`은 `e2a878640dc88bce12e62ad6041a59867e09ef92`였고 작업 트리는 깨끗했습니다. `codex/v0.7-ember-cave-participles-dust`를 이 커밋에서 만들었습니다. 참고 SHA로 reset하거나 과거 ZIP의 소스로 덮어쓰지 않았습니다. 구현 계약 MD와 첨부 ZIP 내부 MD의 SHA-256은 `39b5d08d0d2a66e45d19797d6ca38f8b401a76c24989f4e5dbb4d945754cb416`로 같습니다.

첨부 QA JSON의 원래 `NOT_RUN`은 그대로 보존했습니다. 이 문서와 [P001–P123 인수표](ACCEPTANCE_0.7.md)만 이번 실행 결과입니다. 부속 self-check를 게임 테스트 결과로 집계하지 않았습니다. 기존 0.6.1 registry/초기 상태/보상/상점/문법/점수 golden은 **구현 전** 원래 코드에서 채취했고, 변경 후 기대값으로 재생성하지 않았습니다.

## 환경과 재현

Windows x64, Node `24.19.0`, npm `11.17.0`, Git `2.51.0.windows.2`, Vite `8.3.2`, Playwright `1.51.1`을 사용했습니다. 기존 `../.local-tools/node-v24.19.0-win-x64/{node.exe,npm.cmd}`와 `../.local-tools/playwright-browsers`를 재사용했습니다. Git은 `C:/Program Files/Git/cmd/git.exe`입니다. 의존성 재설치·업그레이드·시스템 PATH 변경은 없었습니다. 명령 실행 프로세스에만 PATH와 PLAYWRIGHT_BROWSERS_PATH를 설정했습니다.

검사 루트는 Git checkout `grammardealer/`입니다. 개발 UI는 `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort`, production UI는 E2E가 띄우고 종료하는 별도 로컬 정적 서버의 `/grammardealer/`입니다. 기존 브라우저 사용자 프로필과 공개 사이트를 사용하지 않았습니다.

|실제 실행 명령|최종 종료 코드|결과와 범위|
|---|---:|---|
|`npm.cmd test`|0|**PASS 1,187/1,187**, skip 0. 최초 원본 검사 1,047개와 구분. 마지막 실행 259,809ms.|
|`npm.cmd run validate:data`|0|**PASS 2,988 checks**. 140 lexemes/139 runtime, 360 forms/359 active, 19 frames.|
|`npm.cmd run build`|0|**PASS**, 88 modules. [산출물 SHA-256](validation/v0.7/build-manifest.json).|
|`npm.cmd run test:browser`|0|**PASS 291 checks / 185 captures**, 기존 공식 14개 스크립트 모두 완료.|
|`npm.cmd run test:browser:polish`|0|**PASS 49 checks**: Chromium core 32 + UI 17.|
|`npm.cmd run test:browser:cross`|0|**PASS 92 checks**: Firefox/WebKit 각각 core 32 + UI 14.|
|`npm.cmd run test:browser:061`|0|**PASS 94 checks**, 71 captures: 3브라우저 74 + 별도 경계 20.|
|`npm.cmd run test:browser:ember`|0|**PASS 117 checks / 117 captures**, Chromium/Firefox/WebKit 각각 39.|
|`node tools/simulate-ember-decks.js`|0|**PASS 10,000** 초기 덱/먼지 검사. 4모드 각 2,500. 승률 자료가 아님.|
|`npm.cmd run test:decks:snow`|0|**PASS 10,000** 기존 설원 초기 덱 검사.|
|`node tools/simulate-ember-runs.js`|0|실제 Controller 명령 32전투 완료. production UI 완주와 별도.|
|`SB_EMBER_COURSE=1 node tools/simulate-ember-runs.js`|0|실제 Controller 명령의 별도 목표 문법 경로 완료.|
|`SB_EMBER_COURSE=1 npm.cmd run test:e2e:ember`|0|**PASS 실제 production UI 32전투**, 71공격/16운영/51checks/75PNG.|
|`SB_E2E_SNOW_COURSE=1 npm.cmd run test:e2e`|0|**PASS 0.6.1 저장 production UI 27전투**, 60공격/17운영/52checks.|

브라우저 버전과 개별 검사명은 [Stage7 집중 결과](validation/v0.7/stage7-browser.json), [기존 브라우저 회귀](validation/v0.7/legacy-browser-regression.json)에 있습니다. Playwright WebKit 통과를 실제 Safari/iPad 검증으로 간주하지 않습니다.

## 증거 종류를 구분한 결과

### 합성 산술·지정 상태

- 문법 G001–G073은 실제 parser 분석입니다. 수동의 sourceFrame/표면Frame, 실제 ING/PP 역할/명사 대상 ID, 독립 형용사/과거형 구분을 추가 검사했습니다.
- 점수 S001–S013은 parser → scoring입니다. B001–B012는 **지정 위력 산술**, Q 역할 사례는 실제 parser → boss 판정입니다. 이것을 자연 전투나 학생 승률로 간주하지 않습니다.
- 먼지 공급/교환/재셔플/운영/종료/위조 저장과 보스 재정산은 지정 상태 검사입니다. Stage6→7 및 마지막 보상 경계의 단위 테스트에서는 HP를 지정했으며 자연 완주 증거와 분리합니다.
- 집중 UI는 실제 UI 클릭·형태 메뉴·IndexedDB·연출을 사용하지만 시작 카드/전투 상태는 **ASSIGNED**입니다. 운영 7종, 운영 미보유, 먼지만 남은 손패, 1024/1280/1366/1920 × 10/14손패 × 16문장 × 4룬을 검사했습니다.
- [파서 측정](validation/v0.7/parser-timing.json)은 5문장 각 30회, 최대 16장/work 827(한도 90,000)입니다. 해당 PC의 관측값이며 범용 성능 보장은 아닙니다. 먼지는 Controller에서 문장 진입 전에 거절합니다. 먼지 5장 손패에서 실제 배치 거절 30회의 평균은 0.81ms, 최대 2.85ms였고 상태가 그대로임을 대조했습니다.

### 실제 production UI

최종 build에서 새 0.7 원정을 UI로 시작하고 실습을 정상 스킵한 뒤 `run-sequence.57`/STANDARD/LEARNING 정책으로 32전투를 완료했습니다. 시작 덱·HP·보상·카드·점수를 주입하지 않았고 실제 폼 선택/교환/준비/운영/상점/공격/보상 버튼을 사용했습니다. 자동 정책은 공개된 실제 손패/상품/보상만 사용합니다. 초기 리소스를 받은 뒤 offline으로 플레이했고 JS/CSS 실패·console error·bad response는 0이었습니다. 정상 무효 제출 1회를 포함한 실제 공격은 71회입니다.

[최종 production 결과](validation/v0.7/production-final-learning-32.json) · [네 학습 경로의 실제 카드 ID/역할/점수 이벤트](validation/v0.7/stage7-learning-course.json)

|전투|실제 제출 예|검증한 목표|
|---|---|---|
|7-1|`a liked cat was young to times`|PP `NOUN_MODIFIER` + 실제 cat 대상 ID. 현재분사와 과거분사 중 하나를 쓰는 수식 목표.|
|7-2|`a person had been shown me`|완료 수동, 표면 SVO / 원래 SVOO, 실제 be/show 사본.|
|7-3|`they have you show books at him`|등록된 have 목적격보어의 CAUSATIVE.|
|7-4|`times see schools show him them`|등록된 see 목적격보어의 PERCEPTION.|

의미가 어색한 예도 실제 구조 판정은 허용한다는 계약을 적용했습니다. 이 자동 플레이 문장을 교과서 모범 예문으로 채택하지 않았습니다. 7-1 원시 보고서의 `expectedTag: PARTICIPLE.PRESENT`는 경로 표시명이며 실제 assertion은 **ING 또는 PP의 정상 NOUN_MODIFIER/대상 ID**를 요구합니다. 단순 진행형 태그만으로 통과시키지 않았습니다.

이보다 앞선 일반 32전투 실행은 74공격/49checks/77PNG로 완료했지만 네 목표 문법 경로는 NOT_RUN이었습니다. [초기 일반 완주](validation/v0.7/production-initial-normal-32.json)는 최종 CSS/검증 경계 정리 전 빌드이며 최종 결과로 대체하지 않습니다.

기존 0.6.1 검사는 버전이 고정된 정상 첫 BATTLE 저장을 격리 프로필에 넣은 후 실제 UI로 이어갔습니다. 새 0.7 원정과 구분합니다. 최종 production build에서 27전투/STAGE6_END로 끝났고, [설원 6-1 비교급·6-2 최상급·6-3 동등비교 학습](validation/v0.7/legacy061-snow-learning.json)도 각각 PASS입니다. 일반 완주로 학습 코스를 대신하지 않았습니다.

원정 완료 뒤 완료 저장을 UI로 다시 불러와 STAGE7_END·32전투·공격 수를 대조했습니다. 세 상점만 사용했고 Stage7에는 상점이나 무료 영구 카드 지급이 없었습니다.

## 중간 실패와 검사 변경 이유

1. 일부 개발 서버 첫 navigation이 시간 초과했습니다. 초기 응답 지연으로 관측됐으며 원인이 확정된 게임 버그로 보고하지 않습니다. 서버 warm 상태에서 재실행했고 로그는 보존했습니다.
2. 병행 실행 중 기존 VFX/교차/시간의 협곡 검사에서 `FINISHED` 대신 watchdog의 `FAST_FORWARDED`가 관측됐습니다. assertion이나 watchdog 수치를 완화하지 않았습니다. 최종 단독 순차 실행에서는 14개 스크립트가 전부 통과했습니다. 개발 서버의 ignored 영상 파일 watch에 EBUSY도 관측됐으나 앞선 timing 실패의 원인으로 단정하지 않습니다.
3. 새 Stage7 검사에서 짧은 역할 표시 DOM을 늦게 읽어 실패했습니다. 실제 adapter의 highlight 호출 직후 보이는 DOM 역할/카드 ID를 관측해 저장하도록 QA만 수정했습니다. 화면 표시 검사를 끄거나 가짜 label을 넣지 않았습니다.
4. 기존 v02 검사에서 현재 로비 버전 기대를 `0.6`에서 정확한 `0.7.0 · Ember Cave`로 변경했습니다. CHARGE 도중 원격 DOM 읽기가 IMPACT 뒤로 밀린 관측 경쟁은 실제 adapter.charge 직후 phase/비늘/HP를 원자적으로 기록해 같은 조건을 검사합니다. 이전 버전 지정 fixture는 유지했습니다.
5. 기존 0.6.1 controller 테스트는 새 기본값 0.7의 NEW_RUN을 0.6.1 정책으로 명시한 호환 helper를 사용합니다. 기존 assertion/기대 수치를 새 값으로 바꾸지 않았습니다.
6. 첫 legacy production fixture는 저장 불가 STAGE_INTRO를 저장으로 넣어 올바르게 거절됐습니다. QA를 정상 START_BATTLE 이후 저장으로 고쳤으며 저장 허용 조건을 완화하지 않았습니다.
7. 초기 자동 정책은 명령 900개 한도에서 마지막 보스 HP 233을 남겼습니다. 제한을 2,000으로 정하고 실제 명령만으로 완료했습니다. 초기 학습 후보 정책은 수식 대상 없는 진행형 또는 필요한 보어를 확보하지 못했습니다. 실제 NOUN_MODIFIER 역할과 공개 보상 선택을 기준으로 정책을 개선했습니다. 이것을 불가능 시드·게임 버그·사람 승률로 해석하지 않습니다.
8. 신규 QA 작성 중 assertion API/fixture 필드명 오류도 수정했습니다. 원본 JSON 기대값, 기존 점수·자원·보스 기대값은 변경하지 않았습니다.

원본 docs 499개를 사전 백업했고, 의도적으로 갱신한 인계/아키텍처 2개를 제외한 497개는 원래 해시로 복원·대조했습니다. 이번 고정 출력은 먼저 별도 폴더에 보존했습니다. 일부 ignored 임시 출력 폴더는 공식 스크립트가 재사용했으며, 모든 과거 임시 파일이 불변이라고 주장하지 않습니다. [보존 검사](validation/v0.7/preservation.json)와 [실행 명령/로그 해시](validation/v0.7/execution-results.json)를 참조하십시오.

원시 실행 로그/영상은 `.local-validation/v07/`에 남아 있습니다. 공개 증거에는 상대 경로·요약·해시·선별 캡처만 포함합니다. 중간 실패를 삭제하거나 마지막 PASS의 일부로 합산하지 않았습니다.

## 캡처와 영상

[출처/해시 목록](validation/v0.7/captures.json) · [최대 배치](validation/v0.7/assigned-maximum-layout.png) · [WebKit 작은 화면](validation/v0.7/assigned-webkit-small-layout.png) · [제출 후 분사 역할](validation/v0.7/assigned-participle-roles.png) · [수동 공격 후 실제 보상 화면](validation/v0.7/production-7-2-passive.png) · [비늘 해제](validation/v0.7/production-scale-release.png) · [32전투 완료](validation/v0.7/production-stage7-complete.png) · [완료 저장 복원](validation/v0.7/production-stage7-complete.png)

[production 보스 플레이 발췌 영상](validation/v0.7/production-ember-clip.webm): 전체 22분15초 원본 중 약 20:50 이후 85초를 stream copy한 800×448 영상입니다. 저장 대기/조립/연출/진행을 포함하며 음향 트랙은 없습니다. 7-1~7-4 PNG는 제출 후 결과 화면이며 문장·카드 ID 증거는 학습 경로 JSON에 있습니다. 전체 원본 약 68MB와 지정 상태 연출 영상은 로컬에 보존합니다. 스피커 청취 검증을 했다는 의미가 아닙니다.

## 보존·미검증·검토 순서

staged whitespace 검사에서 첨부 명세 MD의 원래 Markdown 줄바꿈 공백 13곳만 보고됐습니다. 첨부 계약의 바이트/해시 보존을 위해 그대로 두었고 나머지 staged 파일의 whitespace 검사는 통과했습니다.

package/lockfile의 프로젝트 버전은 0.7.0으로 바꿨지만 의존성 이름·버전·integrity는 그대로입니다. 기존 Pages workflow는 변경하지 않았고 PR에서는 검증만 수행합니다. main push/merge/auto-merge/Pages 설정/공개 배포를 실행하지 않았습니다.

실기기 iPad·Android·Safari, 교사 최종 검토, 실제 스피커 청취는 **NOT_RUN**입니다. 외부 문법 참고 페이지는 접근 시 HTTP 403으로 새 독립 대조가 되지 않았습니다. 첨부 계약과 동사별 데이터/실제 parser를 대조한 [동사 검토](VERB_COMPLEMENT_PASSIVE_AUDIT_0.7.md), [교육 문구 검토](EDUCATION_REVIEW_0.7.md), [먼지 수명 검토](DUST_LIFECYCLE_REVIEW_0.7.md)는 이 한계를 표시합니다. 데스크톱 자동 검증을 사람의 학습 난이도나 승률로 일반화하지 않습니다.

검토 순서: 기존 저장 불러오기 → 새 원정 실습/스킵 → 기존 세 상점·설원까지 진행 → Stage7 소개 → 먼지 교환/보급/WORD 탐색 차이 → 분사 수식/수동/사역/지각 → 완료·진행으로 비늘 우회 해제 → 마지막 보상/완료 저장 복원.

PR과 원격 반영은 [인수표 P123](ACCEPTANCE_0.7.md)에 실제 생성 후 기록합니다. Ready for review는 검토 가능 상태를 뜻하며 main 병합이나 공개 배포 승인을 대신하지 않습니다.
