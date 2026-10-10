# Syntax Atlas 0.8.0 실제 구현·검증

## 기준과 실행 환경

작업 시작 fetch한 최신 `origin/main`은 `ca1675dbb9e546bf2b9442dba8cfc1077c7e12dd`(0.7 PR #11 포함)였다. 시작 Git checkout은 clean이었고, 이 커밋에서 `codex/v0.8-ancient-waterways-relative-seal`을 만들었다. 과거 ZIP의 코드로 교체하거나 명세의 참고 SHA로 reset하지 않았다. AGENTS/README/PROJECT_HANDOFF/ARCHITECTURE/0.7 실제 보고를 먼저 대조했다.

구현 계약 MD와 ZIP 내부 MD는 SHA-256 `8c6d8d9e48c83a84c63290c35fc0e33ab8aab40b23b2cecb736f1927ce7b5181`로 동일하다. 계약은 `spec/SyntaxAtlas_0.8_Codex_Spec.md`, 변경하지 않은 QA 기대값은 `tests/fixtures/v08/02…09`에 보존했다. 부속 self-check와 원래 NOT_RUN을 실행 결과로 재사용하지 않았다.

검사 루트는 실제 Git checkout `grammardealer/`다. Windows x64, Node 24.19.0/npm 11.17.0/Git 2.51.0.windows.2/Vite 8.3.2/Playwright 1.51.1을 재사용했다. Node/npm은 `../.local-tools/node-v24.19.0-win-x64/`, 브라우저는 `../.local-tools/playwright-browsers/`, Git은 `C:/Program Files/Git/cmd/git.exe`다. 의존성 설치·업그레이드·시스템 PATH 변경 없이 해당 명령 프로세스의 환경변수만 설정했다. package/lockfile은 루트 버전 0.8.0과 scripts만 변경하고 의존성 항목은 보존했다.

개발 UI는 `npm.cmd run dev -- --host 127.0.0.1`의 로컬 5173, production은 E2E가 기동/종료하는 별도 정적 서버 `/grammardealer/`를 사용했다. 공개 사이트·실사용 브라우저 프로필은 사용하지 않았다.

## 구현과 구버전 경계

새 0.8 원정만 수로도시 5전투(33–37), 선택 WHO/WHICH/NONE → Shop4, 8-3 전용 where/when 빙정, STAGE8_END로 확장했다. 이전 버전 registry/정책/상품/RNG/종료 경계는 명시적 버전 분기로 유지한다. Stage1–7 HP·28장 시작 덱·턴/교환·기존 룬 수치·슬롯·상점 가격은 바꾸지 않았다. Stage8 HP 1280/1360/1440/1520/1600 및 새 배율·일반 적 이름은 명세의 **구현 초깃값**이며 사람 난이도 합격값이 아니다.

문법은 실제 NP/절/동사구/Frame을 확장했다. 관계절 내부 SUBJECT/OBJECT, 생략 목적격, 관계부사와 직접·간접 WH를 분리한다. 실제 카드 snapshot과 단일 선택 분석만 보스 근거가 된다. 새 문법의 정답은 해금에 종속되지 않으며 콤보 자격만 원정별로 제한한다. 새 질문 전용 배수/가상 카드/숨은 do·be/정답 문자열 표는 없다.

이중 연결 인장은 **같은 정상 제출의 별개 주격·목적격 유한 관계절**을 요구한다. 공격 간 누적 없음, 잠금 중 HP1/초과 피해 이월 없음, 조건을 만족한 공격부터 처치 가능, 해제 후 재잠금 없음이다. 해제 공격 snapshot/사본/분석 digest/정산 전후를 별도 영수증으로 보존하고 로드 때 재검증한다. 이는 로컬 저장의 일관성 검증이며 암호학적 부정행위 방지라고 주장하지 않는다.

## 독립 baseline과 한계

구현 전에 원본 0.7에서 npm test/data/build를 각각 exit0으로 실행했다. 또한 registry/runes, 8개 덱/초기 상태, 56개 보상, 8개 Stage2 상점, 9개 공격을 독립 포착해 변경 후 hash/구조를 대조했다. compact golden은 변경 후 기대값으로 다시 만들지 않았다.

**구현 전 완료 저장과 Stage4/6 상점 golden 포착은 빠져 있다.** Stage2/4/6의 24개 상점·원본 helper로 지정한 실제 완료 저장 1개·이전 문법 결과는 구현 후 시작 main을 `git archive`로 별도 복원한 원본 코드에서 추가 포착했다. 별도 완료 저장은 원본 0.7 엔진에서 지정 HP1/실제 PP 제출/보상 명령으로 만든 단위 회귀 fixture이며 자연 완주가 아니다. 이 검증과 뒤의 구버전 production 재실행은 유효한 회귀 증거지만, 구현 전 포착으로 소급하지 않는다. A003은 이 절차상 공백을 FAIL(부분 검증)로 기록한다. 소스/저장 손실이나 발견된 게임 실패를 뜻하지 않는다.

## 실제 명령

| 실제 명령 / 모드 | 마지막 종료 코드 | 결과 |
|---|---:|---|
| `npm.cmd run test:runs:waterways` · SB_WATERWAYS_COURSE=1 | 0 | PASS |
| `npm.cmd test` | 0 | PASS |
| `npm.cmd run validate:data` | 0 | PASS |
| `npm.cmd run build` | 0 | PASS |
| `npm.cmd run test:decks:waterways` | 0 | PASS |
| `npm.cmd run test:browser` | 0 | PASS |
| `npm.cmd run test:browser:polish` | 0 | PASS |
| `npm.cmd run test:browser:cross` | 1 | FAIL |
| `npm.cmd run test:browser:061` | 0 | PASS |
| `npm.cmd run test:browser:ember` | 0 | PASS |
| `npm.cmd run test:browser:waterways` | 0 | PASS |
| `node tests/waterways-entry-strategy-browser.mjs` | 0 | PASS |
| `npm.cmd run test:e2e` · 0.6.1 초기 저장 | 0 | PASS |
| `npm.cmd run test:e2e:ember` | 0 | PASS |
| `npm.cmd run test:e2e:waterways` · SB_WATERWAYS_COURSE=1 | 0 | PASS |

모든 결과는 이번 실행이다. 명령별 UTC 시각·종료 코드·원시 로그 SHA는 [commands.json](validation/v0.8/commands.json)에 있다. 최초 실패를 지우지 않고 후속 완료 결과와 구분했다. 원시 로그/전체 state/video는 `.local-validation/v08/`에 보존하고 개인 절대 경로가 있는 로그는 공개 저장소에 복사하지 않았다.

## 실행 수준별 증거

- **순수 parser/score**: 첨부 문법 88개와 추가 치환·국소 오류·물음표/실제 snapshot 동등성, 이전 0.7 73개 및 0.6.1 45개 기대값을 0.8 언어에서도 검사했다. score S001–S016은 실제 parser→score, boss B001–B024는 실제 분석에 지정 위력을 넣은 산술 검사다. 서로 다른 수준을 자연 플레이로 합산하지 않는다.
- **성능 관측**: 9–16카드의 정상 복합문 16개 ×25회, 총400회 측정. 최대 work851/한도90000, 관측 최대38.797ms였다. [원시 측정 요약](validation/v0.8/parser-timing.json)은 이 PC의 관측값이지 모든 기기 성능 보장이 아니다.
- **지정 Controller/UI**: WHO/WHICH/that-only NONE, pending/상점/빙정/HP1/해제 슬롯, 실제 카드/형태/제출, where/when의 관계부사·질문·간접질문·시간 접속사, 운영 사본 이동, 상대절 강조/IMPACT/취소, 위조 source/manifest/witness 거부를 검사했다. 시작 전투·카드는 지정했으며 자연 획득 증거와 구분한다.
- **시작 덱10,000건**: 4모드 각2500, 28장/기존 품사·witness/도시 빙정 보존·추가 RNG 없음 검사다. Stage8 승률 검사가 아니다.
- **실제 Controller 원정**: seed `run-sequence.57` STANDARD를 사용했다. 첫 일반 원정은37전투 완료했지만 학습 검증으로 사용하지 않았다. 첫 학습 정책은37전투를 끝내고도34/35/36의 목표를 놓쳤다(완주 PASS, 학습 FAIL). 이후 공개 보상 선택·보이는 실제 손패의 후보/교환/준비 정책을 보강했으며 게임 HP/턴/룬은 바꾸지 않았다. 최종 정책의 구체 결과는 [controller-campaigns.json](validation/v0.8/controller-campaigns.json)을 따른다.

전체 단위 검사 **1347 PASS**. Stage8 집중 UI는 3엔진 합계 **159 checks / 117 captures**, 입장 선택→실제 지급 사본→지정 보스 연결 보강은 **9 checks / 9 captures**였다. 입장 보강은 실제 선택/상점 UI 이후 보스 전투와 비관계사 단어를 지정한 검사이므로 자연 획득 완주로 부르지 않는다.

| production 캠페인 | 결과 | 전투 | 실제 공격 | 운영 사용 | 검사 | PNG |
|---|---|---:|---:|---:|---:|---:|
| 0.6.1 | PASS | 27 | 60 | 12 | 47 | 58 |
| 0.7.0 | PASS | 32 | 74 | 14 | 50 | 77 |
| 0.8.0 | PASS | 37 | 78 | 19 | 59 | 91 |

0.8 production 학습 목표: 33=PASS, 34=PASS, 35=PASS, 36=PASS, 37=PASS. 실제 제출 카드/형태·절 근거·위력은 [production 기록](validation/v0.8/production-waterways.json)의 `waterwaysLearningCourse`에 있다. `/grammardealer/` 리소스/오프라인/저장 슬롯/완료 기록을 확인했으며 이 실행에 외부 API를 사용하지 않았다.


production의 행동 선택 및 상세 parser/score 기록은 같은 실제 입력을 처리하는 shadow Controller에서 수집했다. 화면 카드·형태·제출·연출과 완료 경계를 실제로 조작하고, 상점/진행 중 전투의 실제 IndexedDB 슬롯과 RNG를 대조했다. 새 0.8 페이지에 카드·HP·RNG를 주입하지 않았다. 상세 JSON을 DOM 자체에서 읽은 결과라고 설명하지 않는다.

학습 코스의 자동 문장에는 의미가 어색한 조합이 있다. 실제 구조/카드/피해 검증용이며 학생 모범 예문·정답 목록으로 게시하지 않는다. 다른 시드의 일반 승률, 모든 변형의 자연 획득, 사람 조작/학습 효과는 증명하지 않는다.

선별 화면: [실제 Shop4](validation/v0.8/production-shop4.png), [실제 수로도시 전투](validation/v0.8/production-stage8-combat.png), [실제 빙정 제출 후](validation/v0.8/production-after-frost-submission.png), [실제37전투 완료·복원](validation/v0.8/production-stage8-complete.png), [지정 상태 관계절 강조](validation/v0.8/assigned-relative-pair.png), [지정 최대 카드 배치](validation/v0.8/assigned-capacity-1366.png). 파일별 출처/해시는 [capture provenance](validation/v0.8/capture-provenance.json), 로컬 무음 영상 경로/해시는 [video provenance](validation/v0.8/video-provenance.json)에 있다.

## 실패·수정·기대값 변경

1. 초기 localhost navigation 권한 거절/응답 지연은 UI 실행 전 실패다. 허용된 로컬 서버/브라우저 권한과 응답 확인 후 재실행했다. 게임 버그로 원인을 단정하지 않는다.
2. 신규 관계절 라벨이 다음 점수 이벤트 때 곧 지워지는 문제를 실제 UI에서 확인해 공격 종료까지 유지했다. Stage8의 43px 버튼은 최소44px로 수정했다. 오차 허용치를 완화하지 않았다.
3. 신규 UI harness가 `beginPresentation()`과 OS reduce 옵션 전달을 빠뜨린 것을 캡처에서 발견해 수정하고 점수 가시성 assertion을 추가했다. 앞선114 checks 결과를 최종 증거로 재사용하지 않는다.
4. 기존 로비 검사(`tests/v02-ui-browser.mjs`)는0.7 이름을 기대해 실패했다. 명세의 새0.8 버전명으로 기대값만 갱신했다. 0.7에서 미지원 미래값으로 쓰던0.8(`tests/v07-grammar.test.js`, `tests/ember-browser.mjs`)은 이제 지원 버전이므로99.0.0으로 교체했다. 미래 버전 거부/슬롯 보존 assertion을 유지했다. 기존 Ember 지정 상태 helper와 production E2E는 원래0.7 정책을 명시적으로 고정했다.
5. WebKit 기존 core 검사 최초 실행의 125% CSS zoom/최대 카드 장면에서 `FINISHED` 대신 `FAST_FORWARDED(timeout)`를 관측했다. 계획1780ms/watchdog3780ms, 관측8프레임/3653ms. 시간 제한·기대값·애니메이션 코드는 바꾸지 않았다. 재실행은 첫 기본 장면(effectsOn / OS reduceOff / speed1)에서도 15프레임·3569ms 관측 후 같은 timeout으로 실패했다. 시작 main ca1675d를 별도 소스 참조로 실행한 동일 검사에서도 같은 FAST_FORWARDED가 재현됐다. 원본 비교 첫 시도는 기존 개발 sandbox의 spec 파일 누락으로 화면 준비에서 실패해 core는 NOT_RUN이며, 원본 파일 보완 후 실제 타이밍 실패를 확인했다. 정확한 환경/도구/게임 시계 원인은 미확정이다. [비교 실행과 최소 후속 제안](validation/v0.8/webkit-timing-investigation.json)을 따르며 A110은 FAIL로 남긴다.

6. 진행 중인 production 검사에서 공용 로그의 Stage8 상점 안내가 `first shop`으로 찍힌 것을 발견했다. 실제 선택/상점/저장 assertion은 네 번째 상점을 확인한다. 이후 안내 문자열만 `fourth shop`으로 정정했으며 게임·검사 조건을 바꾸지 않았다. 해당 실행의 원시 로그와 선별 check description은 정정 전 문구로 보존한다. 이 문구 변경 뒤 전체 unit/data/build 및 남은 브라우저 회귀를 실행한다.

## 증거 보존·남은 범위·PR

원래 docs 536개를 독립 백업과 대조했다. 의도적으로 갱신한 인계·아키텍처·알려진 문제·다음 단계 4개를 제외한 532개는 원본 바이트로 보존했다. 이번 고정 경로 출력은 로컬에 먼저 별도 보관했다. 게임 변경/새 테스트/새 보고서를 원본으로 되돌리지 않았다. 일부 ignored 옛 기본 browser 출력 폴더는 재사용됐으므로 모든 과거 로컬 raw 파일이 불변이라고 주장하지 않는다. 선별 캡처와 provenance, build hash는 `docs/validation/v0.8/`에, 중복 영상·전체 상태·로그는 로컬에 남긴다.

- A118은 원본 docs 532개 보존과 이번 증거 제출은 확인했지만 일부 과거 ignored raw 출력 전체의 바이트 보존을 입증하지 못한 부분 FAIL이다. A003과 함께 기능 실행 결과와 분리해 기록한다.
- 실제 iPad/Android/Safari, 스피커 청취, 교사/학생 검수는 **NOT_RUN**이다. Playwright WebKit과 무음 영상은 별도로 표시했다.
- WHO 이외 선택이나 다른 시드의 자연37전투 전체, 모든 이전 지역 목표 학습 코스의 새 재실행은 **NOT_RUN**이다. 기존 버전 전체 회귀/일반 완주에서 해당 학습 코스 PASS를 추론하지 않는다.
- 문법은 등록된 단어/Frame과 bounded 학교 문법 범위다. 이 버전의 숫자는 구현 초깃값이다. 범위 밖 Stage9/새룬/추가 슬롯/질문 전용 콤보를 추가하지 않았다.
- 필수 결과와 조건별 수준은 [A001–A120](ACCEPTANCE_0.8.md), 변경 내역은 [패치 노트](PATCH_NOTES_0.8_KO.md), 언어/공급/보스/UI 검토표는 각각 별도 문서에 있다.

작업 브랜치 push를 완료하고 [main 대상 Draft PR #12](https://github.com/YEOMT/grammardealer/pull/12)를 생성했다. 구현 커밋은 `127936b363417dc4a89c883ea54bd7ad6a6e8b20`, 검증·보고 커밋은 `2f74c16de8217f93ded342f4b590204913116855`다. 이 문서의 PR 결과 기록은 후속 문서 커밋으로 반영한다. A110의 미해결 WebKit watchdog 실패와 A003/A118의 증거 절차상 공백 때문에 Ready for review로 전환하지 않았다. 원격 PR 생성 시 main은 시작 SHA 그대로였고 auto-merge는 꺼져 있다. main push/merge·Pages 설정 변경·공개 배포는 수행하지 않았다. 실제 원격 응답은 `validation/v0.8/pull-request.json`에 기록했다.

사용자 검토: 기존 실습/무보상 스킵 → Stage7 보상 → 수로도시 사전 안내/선택/Shop4 →33주격/34생략/35빙정/36기존 시제·수동과 결합 →37동일 문장 쌍/HP1/해제 → 완료 슬롯 복원 순서. main 병합·공개 배포는 별도 승인 대상이다.
