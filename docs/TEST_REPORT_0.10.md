# 0.10 실제 검증 보고서

## 기준과 구현

작업 시작에 fetch한 `origin/main`은 `db73c606784e1ba50e664224b404ccede7447591`이다. 시작 작업 트리는 clean이었고 기존 `codex/v0.9-dream-library`를 보존한 채 `codex/v0.10-star-corridor-foresight`에서 작업했다. 과거 ZIP으로 소스를 덮어쓰지 않았다. 계약은 `spec/v0.10/`이며 외부 MD와 ZIP 내부 명세의 동일 바이트를 확인했다. JSON은 `tests/fixtures/v010/`의 기대자료로만 사용한다.

- 새 0.10 원정만 47전투와 `STAGE10_END`. 별의 회랑은 야외 밤하늘·거대 기둥이며 43~47 전투만 추가한다.
- 기존 will의 would와 새 고급 can의 could는 같은 사본의 선택형이다. 실제 clause/VP/card ID로 조건·가정·과거완료·현재완료진행을 분석한다. 결과절을 주절로 삼고 같은 근거의 하위 배율만 대체한다.
- 5번째 입장 상점에서 can 후보를 연다. 일반전 빙정은 영구 활성 덱의 부족 사본만 공급하며 제출 시 소멸한다. 보스에는 무료 재료를 주지 않는다.
- 예견은 직전 정상 주절 1~5형식을 기억한다. 같은 문형은 0피해, 실제 가정법 쌍은 우회하면서 기억도 갱신한다. 순수 엔진 결과를 RunController가 한 번 정산한다.
- 새 원정 Stage7/8/9/10 NORMAL에만 저항 30/35/40/30%를 마지막에 한 번 적용한다. 저항 전/후 공격력·실제 HP 감소·초과 피해를 구분한다.
- 구0.9의 언어·수치·룬·상품·RNG와 42전투 완료 경계는 유지한다. 신규 5배율·지역 배율·일반전 저항은 명세의 **검증 초깃값**이며, HP는 **사용자 확정값**이다. 실패 seed에 맞춰 수치를 낮추지 않았다.

## 실행 환경과 재현

로컬 저장소 루트에서 실행했다. Node `v24.19.0`, npm `11.17.0`은 `../.local-tools/node-v24.19.0-win-x64/`, Git `2.51.0.windows.2`은 기존 설치본이다. Playwright `1.51.1`과 `../.local-tools/playwright-browsers/`를 재사용했다. Chromium `134.0.6998.35`, Firefox `135.0`, WebKit `18.4`. 설치·시스템 PATH·의존성 버전 변경 없음. package/lockfile 루트 버전만 0.10.0으로 올렸다.

`npm.cmd run dev -- --host 127.0.0.1 --port 5173`의 개발 서버에서 집중/기존 UI를 실행했다. Production 검사는 `dist`를 별도 로컬 서버의 `/grammardealer/`에서 제공했다. Windows 로컬 프록시 환경에는 Chromium의 direct-proxy 실행 인자만 추가했으며 assertion·정산·게임 저장을 바꾸지 않았다.

실제 명령/시간/종료 코드는 [commands.json](validation/v0.10/commands.json), 원본 로그·영상·실패 기록은 로컬 `.local-validation/v010/`에 보존한다. 고정 출력 `docs/evidence-*`, `timing.json`, `reward-distribution.json`은 이번 결과를 별도 보관한 뒤 이전 바이트로 복원했다. 과거 Work 및 0.9 PASS 수는 이번 결과가 아니다.

## 최종 실행 결과

| 실제 명령 | 종료 코드 | 결과 | 근거·범위 |
|---|---:|---|---|
| `npm.cmd test` | 0 | PASS | 1,593 PASS / 0 FAIL / 0 skip (`signoff-unit`) |
| `npm.cmd run validate:data` | 0 | PASS | 3,112 PASS; 147 lexemes / 369 forms (`release-data`) |
| `npm.cmd run build` | 0 | PASS | 109 modules; JS553.21KB / CSS66.54KB; 500KB 경고 (`signoff-build`) |
| `npm.cmd run test:browser` | 0 | PASS | 공식14개 스크립트 전체 종료 (`release-official-browser-recheck`) |
| `npm.cmd run test:browser:corridor` | 0 | PASS | 3엔진93검사 / 고유66PNG (`release-corridor-browser`) |
| `node tests/corridor-production-assigned.mjs` | 0 | PASS | 지정 상태 production5전투 /15PNG / JS·CSS200 / 개발 진단 없음 (`release-production-assigned`) |
| `npm.cmd run test:runs:corridor` | 0 | PASS | 3seed 실행 PASS, 3패배, 완주0 (`natural-controller`) |
| `node .local-validation/v010/natural-clean.mjs` | 0 | PASS | 고정19seed 실행 PASS, 19패배, 오류0, 완주0 (`natural-clean`) |
| `npm.cmd run test:e2e:corridor` | 1 | FAIL | QA_POLICY_DEFEAT: 7전투 HP74/턴0; 15검사 그룹과22PNG (`production-natural`) |
| `npm.cmd run test:e2e` | 0 | PASS | 구0.6.1 production27전투 완주; 실제60공격 /47검사 그룹 /58PNG (`legacy-production-e2e`) |

단위 수는 최상위 test 개수이며 내부306문장 대조 등을 중복 가산하지 않았다. 144개 새 단위검사가 포함된다. 과거 버전 helper는 해당 저장의 실제 registry를 고정한다.

자연 production 시도와 구0.6.1 완주는 마지막 Stage3의 **0.10 전용** 보너스 보존 수정 전에 실행했다. 자연 production은 그 분기에 도달하기 전 Stage2에서 종료했고 구0.6.1 분기는 변경하지 않았다. 이후 최종 코드에서 전체 단위/데이터/빌드/공식 및 집중 브라우저/production 지정5전투를 재실행했다.

Production 지정 상태 검사는 43~47 각각의 준비된 덱·연마·룬을 불러와 실제 UI 형태 선택 → 제출 → 연출 → 보상 → 다음 전투/종료 → IndexedDB 저장을 비교했다. 다섯 전투를 독립 초기 상태로 시작했으며 자연 보상 47전투 완주가 아니다. 별도 Controller 검사에서는 지정 덱으로 43~47을 연속 정산했다.

## 초기 실패와 수정 근거

- 첫 전체 통합: 1,498 PASS / 2 FAIL. 새 선행 조건절 탐색이 구0.6 fingerprint를 바꾸던 회귀를 버전별 탐색 순서로 수정했다. 0.8.1 안내 검사는 기존 37전투 범위를 명시했다(기대값 37 유지).
- 기존 306문장을 새0.10에 비교해 `I am knowing that she works.`의 ASPECT_USAGE 우선순위 회귀를 발견했다. 기존 동사구 해석 우선순위를 보존하여 수정했고 306건 대조를 통과했다.
- 순수 저항 fixture의 수치 없는 `ELIGIBILITY_ONLY` 5개를 산술 입력으로 읽은 새 테스트 어댑터를 수정했다. 숫자·기대값은 바꾸지 않았다.
- 초기 브라우저 startup/debug watcher 실행이 실패·중단됐다. 로컬 증거 경로를 Vite watcher에서 제외하고 디버그 로그 재감시를 제거했다. 중단을 PASS로 바꾸지 않았다.
- can 사전 검사 fixture가 실제 만난 단어 기록을 누락했다. 실제 10-2 빙정 공급 경로를 사용해 수정했다. Firefox의 `hasTouch:true` 컨텍스트에서 mouse 이동이 PointerEvent를 발생시키지 않는 현상을 이벤트 로그로 재현했다. 데스크톱 드래그와 터치 에뮬레이션을 별도 컨텍스트에서 모두 검사한다.
- 공식 묶음의 역사적 0.3 골렘 UI 검사는 default0.10 분석과 0.3 채점을 섞었다. `I had played games`가 혼합 버전에서 234, 일관된 0.3에서 490임을 재현했다. 해당 테스트의 snapshot/분석 registry를 0.3으로 고정했다. `phaseBreak` assertion·기대값·기존 게임 수치는 유지했다.
- 최종 경계 감사에서 현재완료진행의 하위 TIME 태그 대체가 Stage3 지역 보너스까지 제거하던 회귀를 재현했다. Stage3 기존 자격에 해금된 실제 과거완료/현재완료진행 근거를 연결하고 타 지역으로 확장하지 않았다. 추가 회귀 검사를 넣어 단위/데이터/빌드/집중·공식 브라우저/production 지정 전투를 다시 실행했다.
- 이전 집중 실행은66회 촬영/63개PNG였다. 같은 현실 조건절 종류의 두 예문이 파일명을 공유한 것을 확인해 최종 실행부터 문장별 고유 파일명으로 보존한다. 검사 조건은 그대로다.
- 최종 공식 실행에서 하늘섬 connector-bridge 가시성 대기가 한 번 타임아웃됐다. 같은 조건의 단독 실행은18검사 PASS였고 이벤트 기록상 강조 지속은약279ms였다. 설치된 Playwright1.51.1의 선택자 대기는 최대500ms 간격이다. 기존 가시성 기준·30초 timeout·스크린샷·후속 assertion을 유지하며 이 대기만 `requestAnimationFrame` 주기로 검사하도록 수정했다. 당시 실패와 그 뒤 실행되지 않은 사막/설원은 로그에 보존하고 전체 묶음을 다시 실행했다.
- 버전 배지의 0.10.0 기대값, 구0.9/081 E2E helper의 버전 고정, 문법 JSON의 해석 차이는 [언어 검토](LANGUAGE_REVIEW_0.10.md)에 기록했다. 테스트 삭제/skip/허용 오차 완화는 없다.

## 자연 원정과 한계

일반 자원 실습(의도적 오류 제출 포함)이 있는 Controller3seed는 `run-sequence.57`이7전투(HP74), `.17`과`.32`가12전투(HP280/FUTURE)에서 턴0으로 패배했다. 새0.10 production UI의`.57`도 같은7전투에서17공격·3준비·7교환 후 종료했다. 최종 덱33장, 재화20, 공격 최고303이며 page/console/resource 오류는 없었다. 명령 종료 코드1을 유지했다.

강제 오류 제출/자원 소모 실습을 끈 고정19seed(`.57`,`.17`,`.32`,`.0`~`.15`)도 추가 실행했다. 모두 정상 패배, 엔진/정책 예외0, 완주0이다. 도달 분포는7전투10개 /12전투6개 /17전투1개 /27전투2개. 가장 멀리 간`.2`는27전투 HP1·턴0(46공격/18준비/8교환),`.7`은27전투 HP667·턴0(65공격/27준비/33교환)이다. 카드·룬·보상·HP·숨은 드로우 순서를 주입하지 않았다. 새 저항이 적용되는 Stage7~10의 자연 소모 턴·난이도와 두 직조자 준비 경로는 **NOT RUN**이다.

추가 시도의 재현 인자는 공개 `tools/simulate-runs.js`의 `simulateRun({seed,vocabularyMode:'STANDARD',policy:'LEARNING',campaignVersion:'0.10.0',skipTutorial:true,invalidExercise:false,exerciseResources:false,maxCommands:6000})`이다. 위19seed를 순서대로 적용했다. [간결한 결과](validation/v0.10/natural-clean.json)와 원본 로컬 전체 행동 로그를 구분한다.

QA 정책의 정상 패배를 게임 엔진 예외나 사람 승률로 해석하지 않는다. 자연 보상으로 가정법 덱을 준비해 직조자를 공략하는 경로와 여러 문형을 교대하는 자연 47전투 완주는 **NOT RUN**이다. 지정 상태의 합법적 카드·엔진 검사와 일반 완주를 혼동하지 않는다.

원문 G011의 `here`, G031의 `young`은 카드 DB에 없다. 명세가 허용한 등록 어휘 `home`, `happy`로 동형 구조를 실행했다. 원본 그대로 두 사례는 NOT RUN이고 대체 사례는 PASS다. 물리 모바일 기기, 전용 원화·BGM은 미검증/미제공이며 CSS·기호 fallback을 사용한다. 빌드는 성공했으나 JS 번들 500KB 경고가 남는다. 이번에 별도로 실행하지 않은 이전 버전의 전용 E2E/집중 스크립트를 이번 PASS로 주장하지 않는다.

## 검토할 플레이 순서

1. 기존 0.9 저장을 불러와 카드/상품/RNG와 Stage9/42 종료를 확인한다. 새 0.10 원정은 별도로 시작한다.
2. 도서관장 보상 → Stage10 소개 → 입장 상점에서 can 등 후보와 가격·제거/연마·저장 재진입을 확인한다. can 획득은 보장되지 않는다.
3. 10-1 현실 조건절, 10-2 would/could, 10-3 had+p.p., 10-4 두 have 사본을 사용한다. 손패 미보유만으로 빙정이 추가되지 않는지 확인한다.
4. 직조자에서 SVO 반복 0피해 → SVC 전환 정상 피해 → 같은 문형의 정상 가정법 우회를 확인한다. 준비·교환·로드가 기억을 지우지 않는지 본다.
5. 47전투 마지막 타격과 보상·완료 저장을 확인한다. 48전투나 엔딩/승천은 없다.

## 변경 파일과 인계 상태

[변경 목록](validation/v0.10/changed-files.txt), [110조건](ACCEPTANCE_0.10.md), [패치 내역](PATCH_NOTES_0.10_KO.md), [진행 기록](IMPLEMENTATION_PROGRESS_0.10.md), [빌드 해시](validation/v0.10/build-manifest.json)를 함께 확인한다. 원본 누적 로그·중복 캡처·영상·node_modules·dist·로컬 런타임은 commit하지 않는다. 공개 증거는 경로·ANSI 색상·행 끝 공백을 정리한 선별 실행 로그·JSON 및 대표 캡처를 사용한다. 원본 로그 해시는 commands.json에 남기고 로컬 원본 바이트는 보존한다.

브랜치 `codex/v0.10-star-corridor-foresight`의 구현 커밋은 `e1b07354143185d45f01fc2d1e839254d27fd2e6`이다. 원격 push 및 [Draft PR #15](https://github.com/YEOMT/grammardealer/pull/15) 생성에 성공했다. 자연 47전투/후반 자연 준비 및 물리 기기 검수가 미확보이므로 Draft를 유지한다. 110조건 추적은 **108 PASS / 2 NOT RUN**이며 개별 PASS의 지정 상태·합성 범위를 각 행에 명시했다. 원문 그대로의 미등록 어휘 2사례는 별도 NOT RUN이다. PR 생성 후 원격 main은 시작 SHA 그대로이며 auto-merge는 꺼져 있다. main 직접 push/병합/Pages 설정 변경/공개 배포는 수행하지 않았다.
