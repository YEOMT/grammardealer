# Syntax Atlas 0.10.1 UI 후속 이전의 실제 검증

이 절은 UI Followup 반영 전 실행 기록이다. 아래의 최종/휴대전화 페이지 표현은 이 단계 당시의 결과이며 현재 UI 정책은 [후속 보고서](TEST_REPORT_0.10.1.md)가 대체한다.

검증일:2026-10-15. 기준은 작업 시작에 fetch한 `origin/main f09d4537b3bfa28d2736045944da363c8a04abfc`(0.10 병합)이다. 기존 checkout은 clean이었고 이전 브랜치/ZIP/증거를 보존했다. 작업 브랜치: `codex/v0.10.1-runes-responsive-gamefeel`. main/Pages 설정/공개 사이트를 변경하지 않았다.

## 변경 범위

- 새0.10.1에만 Stage2~5 HP19개와 골렘780/260×3 적용. S1/S6~10 HP·저항·28장·기존 자원·47전투/STAGE10_END 유지.
- 신규10룬(일반2/고급5/희귀3)과 획득 맥락 필터. **자수정 rune.gerund**는 기존 **토파즈 rune.svoo**와 별도 ID/레벨이다. 기존12룬 정의와 구버전 정책은 유지.
- 오류/해금 적격 근거와 기본 점수 배율 대체를 분리. 실제 VP/절/주절/물리 카드로 판정하며 신규 룬당1회, 장착 순서로 계산한다. parser/WORD DB는0100을 재사용한다.
- 실제 Fullscreen API, dvh/VisualViewport, 최대 카드 배치, 명시 카드/상품 페이지, 직접 사전·저장, 보조 정보 패널과 모달 내부 스크롤.
- 실제 근거 사본의 내부 wrapper 탄성, 의미 있는 양수 eventID의 누적 콤보, 등급/레벨 강도, 제한 입자 pool과 정리. 점수/RNG/피해는 연출에서 변경하지 않는다.
- 신규 룬 보상 저장의 버전별 lookup과 보스 receipt의 language registry alias를 보완했다. 구버전 데이터의 자동 업그레이드는 없다.

확정 HP/곱셈과 가산·시각 검증 초깃값, 복합용법/교육 설명은 [룬 검토](RUNE_REVIEW_0.10.1.md)를 따른다. 새 콘텐츠·최종보스·엔딩·승천·보류 룬·외부API/라이브러리는 추가하지 않았다. package/lockfile은 root version만0101로 변경했고 의존성 버전은 그대로다.

## 환경과 실제 명령

Windows NT10.0.26200, Node24.19.0/npm11.17.0(`../.local-tools/node-v24.19.0-win-x64/`), Git2.51.0.windows.2(`C:/Program Files/Git/cmd/git.exe`), Playwright1.51.1. Chromium134.0.6998.35/Firefox135.0/WebKit18.4. 기존 runtime/브라우저/lockfile 의존성을 재사용했다. 관리자 설치·시스템 PATH·Codex runtime 변경 없음.

Vite 개발 서버는127.0.0.1:5173, production은 테스트가 기동한 로컬 static server의 `/grammardealer/`를 사용했다. 네트워크 배포가 아니다. `NODE_OPTIONS=--import=./.local-validation/v010/local-browser-transport.mjs`는 로컬 브라우저의 direct proxy 연결을 위한 QA 실행 설정이다. wrapper가 과거 고정 출력물을 별도 실행 폴더로 복사한 뒤 원본을 복원한다. 이번 로그를 과거 증거에 덮어쓰지 않았다.

| 명령 | 종료 | 실제 결과 | 실행 ID |
|---|---:|---|---|
| `npm.cmd test` | 0 | PASS | `ship-unit` |
| `npm.cmd run validate:data` | 0 | PASS | `ship-data` |
| `npm.cmd run build` | 0 | PASS | `ship-build` |
| `npm.cmd run test:browser` | 0 | PASS | `ship-official-browser` |
| `npm.cmd run test:browser:0101` | 0 | PASS | `ship-cross-2` |
| `node tests/v0101-surfaces-browser.mjs` | 0 | PASS | `ship-surfaces` |
| `node tests/v0101-feel-browser.mjs` | 0 | PASS | `release-feel-3` |
| `npm.cmd run test:production:0101` | 0 | PASS | `ship-production-assigned` |
| `npm.cmd run test:e2e:0101` | 1 | FAIL | `ship-natural-ui` |
| `npm.cmd run test:e2e` | 0 | PASS | `ship-legacy-e2e` |
| `node tools/simulate-polish0101-runs.js` | 0 | PASS | `natural-controller` |
| `npm.cmd run test:runs:0101` | 0 | PASS | `ship-natural-clean` |
| `npm.cmd run test:browser:ember` | 0 | PASS | `ship-ember` |
| `npm.cmd run test:browser:waterways` | 1 | FAIL | `ship-waterways` |
| `npm.cmd run test:browser:library` | 0 | PASS | `ship-library` |
| `npm.cmd run test:browser:corridor` | 0 | PASS | `ship-corridor` |
| `npm.cmd test` | 0 | PASS | `final-text-unit` |
| `npm.cmd run validate:data` | 0 | PASS | `final-text-data` |
| `npm.cmd run build` | 0 | PASS | `final-text-build` |
| `npm.cmd run test:browser:0101` | 0 | PASS | `final-text-browser` |
| `npm.cmd run test:e2e:0101` | 1 | FAIL | `final-natural-ui` |
| `node tests/v0101-feel-browser.mjs` | 0 | PASS | `final-feel-clean` |
| `npm.cmd run test:browser:waterways` | 0 | PASS | `final-waterways` |
| `npm.cmd test` | 0 | PASS | `final-poststyle-unit` |

정확한 시작/종료 UTC·원본 log hash는 [commands.json](validation/v0.10.1/commands.json). `npm test` **1707 PASS/0 FAIL/0 skip**, 데이터 **3112 PASS**, build 성공. 500kB 초과 chunk 경고는 남아 있으며 임계값을 올려 숨기지 않았다.

## UI·연출

3엔진 집중 **109 checks / 60 captures**, 오류0. 이후 유틸리티3룬 안내 문구만 분리하고 Chromium 집중 **37 checks / 20 captures**를 다시 실행했다. 단위·데이터·빌드도 문구 수정 뒤 재실행했다. 초기3엔진/공식14스크립트/구버전 production/지정 production 비교 뒤 유틸리티 안내 문구와 수로도시 공략44px만 추가 수정했다. 해당 변경 뒤 최종 단위·데이터·빌드·Chromium·새 자연 production·30공격 및 수로도시 전체3엔진을 다시 검사했다. 기존 다른 검사 결과를 최종 바이너리의 재실행이라고 바꾸어 쓰지 않는다. 지정 보조화면 **10 checks / 18 captures**. 실제 Controller 공격 **30회**, 매회9콤보, speed1/1.5/2, 정상20·effectsOff5·effectsOff+reducedMotion5. 별도 집중 검사에서는 reducedMotion 단독도 실행했다. 최종30회에서 턴1회/피해정산1회·중복 완료 거부·입력복귀·잔존FX/animation0. 브라우저 page realm에서 실제 생성된 timeout/interval/RAF 핸들을 각각 추적했으며 매회 종료 후 세 종류 모두0이었다. Playwright 자체 utility realm polling은 포함하지 않는다.

후반 기존 집중 UI 회귀도 같은 개발 서버에서 실제 실행했다. 지정 상태 검사이며 자연 원정으로 세지 않는다.

| 검사 | checks | captures | 결과 |
|---|---:|---:|---|
| ship-ember | 117 | 117 | PASS |
| final-waterways | 159 | 117 | PASS |
| ship-library | 81 | 66 | PASS |
| ship-corridor | 93 | 66 | PASS |

PC/태블릿은14손패·16조합·4룬을 함께 표시한다. 작은 휴대전화/낮은 분할창은 전체 장수·현재 페이지·선택 장수·전체 문장 순서를 명시하고 카드 페이지를 사용한다. 좁은 PC의14손패는 두 줄이다. 상점은 작은 화면에 상품 페이지를 사용하고 모든 구매 후보 및 서비스·나가기의 viewport 접근성을 검사했다. 자세한 지역/보스/장착 정보는 명시 펼침 패널에서 읽는다.

전체화면은 documentElement 실제 API 성공과 거절/미지원 mock을 구분했다. 사전/형태/저장/보상 모달, 공격 중 전환, resize/취소/합성 hidden 이벤트의 정산 안전성을 검사했다. 실제 OS 키보드·주소창·핀치·iPad/iPhone/Android/native Safari는 **NOT RUN**이다. 데스크톱 WebKit을 iPad Safari라고 보고하지 않는다.

[PC](validation/v0.10.1/chromium-V001.png) · [휴대전화 최대 배치](validation/v0.10.1/chromium-V009.png) · [상점](validation/v0.10.1/390-shop.png) · [신규 룬 도감](validation/v0.10.1/chromium-rune-catalog.png) · [실제 고콤보 캡처](validation/v0.10.1/actual-high-combo-8.png) · [실제 연출14초 영상](validation/v0.10.1/actual-high-combo-speed1.webm).

동일 데스크톱 Chromium/1366×768에서 실제 확정 이벤트 stream을30회씩 렌더러 재생한 측정이다. 아래 표는 위의30회 Controller 공격과 별도 실험이며 사람의 승률이나 실기기60FPS 보장이 아니다. 실제 입력 지연 계측과 실물 고주사율/최저사양 성능은 NOT RUN이다. 고콤보 실제 영상은9단계까지이며14+ 상한은 순수단위/지정 event 검사로 확인했다.

| 효과 | frame표본 | p50 ms | p95 ms | >50/>100ms | longtask | 최대입자 | 종료입자/animation |
|---|---:|---:|---:|---|---:|---:|---|
| 끔 | 1112 | 16.70 | 16.80 | 0/0 | 0 | 0 | 0/0 |
| 켬 | 1093 | 16.70 | 16.80 | 0/0 | 0 | 48 | 0/0 |

## 획득 분포·자연 시도·production

순수 룬 선택기100,000회(맥락별20,000)와 별도 혼합 보상3,000개를 실행했다. 희귀 허용 맥락은194:97:9, 금지 맥락은194:97로 정규화한다. 이는 RUNE 칸의 조건부 분포이고 전체 보상 중 희귀 확률이 아니다. 후보별 횟수는 [분포 JSON](validation/v0.10.1/rune-distribution.json).

| 실제 후보 맥락 | 표본 | 일반 | 고급 | 희귀 |
|---|---:|---:|---:|---:|
| NORMAL_REWARD / S1 | 20000 | 13344 | 6656 | 0 |
| REGIONAL_BOSS_REWARD / S1 | 20000 | 12939 | 6471 | 590 |
| SHOP / S2 | 20000 | 13418 | 6582 | 0 |
| SHOP / S4 | 20000 | 12919 | 6454 | 627 |
| LATER_R2_GENERAL_SLOT / S1 | 20000 | 13226 | 6774 | 0 |

| 자연 Controller 정책 | seed | 종료 | 도달 전투 | 남은HP | 공격/준비/교환 |
|---|---|---|---:|---:|---|
| natural-controller | run-sequence.57 | DEFEAT | 7 | 24 | 17 / 3 / 7 |
| natural-controller | run-sequence.17 | DEFEAT | 12 | 260 | 24 / 9 / 13 |
| natural-controller | run-sequence.32 | DEFEAT | 7 | 264 | 16 / 4 / 7 |
| ship-natural-clean | run-sequence.19 | DEFEAT | 12 | 260 | 27 / 10 / 9 |
| ship-natural-clean | run-sequence.83 | DEFEAT | 7 | 32 | 15 / 3 / 6 |
| ship-natural-clean | run-sequence.99 | DEFEAT | 12 | 32 | 30 / 5 / 8 |

`natural-controller`는 기존 무효제출/준비/교환 연습을 포함한 정책, `ship-natural-clean`은 그 연습을 끈 별도 고정seed 정책이다. HP/턴/카드/가격을 바꾸거나 실패 seed를 숨기지 않았다. 새룬 조기획득/소모턴/실패와 공개 보상은 [자연 시도 요약](validation/v0.10.1/natural-controller-summary.json)에 있다. 정책 패배는 seed 불가능성이나 엔진 오류를 증명하지 않는다. 실제 Controller 자연 보상에서는 seed17이3전투 보스에서 흑요석, seed19가3전투에서 백금·5전투에서 가넷, seed83이6전투에서 아쿠아마린, seed99가3전투에서 라피스를 선택했다. 초기 획득이 문법 자동 해금이나 즉시 발동을 보장하지는 않는다.

현재 production 자연 시도: `FAIL` / `QA_POLICY_DEFEAT`. run-sequence.57은7전투에서17공격 후 적HP24/남은턴0으로 정상 패배했다. 페이지·콘솔·리소스 오류는0이다. 완료 assertion의 실패 종료코드1을 유지했으며 게임 엔진 오류나 완주 PASS로 바꾸지 않았다. 구버전 production 경로: `PASS`, 명시0.6.1 저장에서27전투·60회 실제 공격과 완료 저장/복원 성공. 지정 production43~47은 **5 전투 PASS**, 실제 카드 조합/형태/공격/보상/다음 전투/저장과JS/CSS200/304를 확인했다. 지정 저장을 불러온 결과이며 자연47전투 완주가 아니다.

**자연 보상47전투 완주와 도달하지 못한 후반 자연 준비·신규 룬 조합은 NOT RUN**이다. 단위·지정 상태·legacy 완주로 대체하지 않는다. G030 원문 boy 카드 부재로 목표 NOT RUN; 미지원 감지와 teacher 대체 양성은 별도다. 130항목의 항목별 범위는 [인수 조건](ACCEPTANCE_0.10.1.md).

## 회귀 검사 변경과 중간 실패

- 구 실습 브라우저의 `scrollY > 0` 전제: 새 viewport-fit 화면은 1366×600에서 페이지 스크롤이 필요하지 않다. 테스트 전용 spacer로 실제 스크롤을 만들고 기존 spotlight 정합 assertion을 그대로 유지했다. 결과 47검사 PASS.
- 1366×768 구 골렘: 추가된 phase block이 자동 grid 배치에서 tools를 다음 행으로 밀어 body822px로 넘침. 각 header column을 명시하고 룬 정렬의 기존36×40 최소 버튼을 복구했다. 골렘 23검사 PASS.
- 휴대전화 상점: 초기 가로 폭 검사만 통과했으나 실제 캡처가2608px 페이지였다. 상품 페이지와 전체 수, 고정 서비스·나가기, 입장/공략/룬 정보 패널로 보완했다. viewport 높이 및 모든 페이지 구매 버튼 가시성 assertion을 추가했다.
- 상점 서비스 목표 크기: 새 압축 CSS가 기존44px 기대를 위반. 충분한 높이에서는44px을 복구했다. v02 UI 30검사 PASS.
- 새 룬 획득 뒤 저장: 신규 ID를 구12룬 lookup에서 검사하던 문제를 실제 신규 보상 저장으로 재현. 버전별 lookup으로 수정하고 골렘/보상/최종47/상점 통합4검사 PASS.
- 교차 브라우저 중 소스 수정에 따른 Vite HMR reload: Firefox context 소멸. 해당 실행 FAIL을 보존했고 소스 고정 후3엔진103검사 PASS. HMR실패를 게임 오류로 분류하지 않는다.
- 신규30공격 검사 작성 오류: 공격 후 빈 조합대의 공격 버튼이 비활성인 것은 정상이다. 입력 복귀는 준비 버튼과 locked class 제거로 검사한다. 재렌더 직전 HP 막대 width transition과 공격 FX 누수를 구분하여 원래 앱의 재렌더 경계 이후 잔존 animation을 측정한다. 직전 transition 명세도 원본 JSON에 기록한다.

원본 실패 로그는 `.local-validation/v0101/`의 각 실행 ID에 보존한다. 최종 실행 결과와 분리한다. 어떤 기존 assertion도 삭제하거나 허용오차를 늘리지 않았다. 새 명세에 따라 변경된 버전 기대값, 명시적 정보 패널 열기, 역사적 controller/룬 manifest 고정은 TEST_REPORT에서 따로 설명한다.

- 운영 카드의 사용 버튼44px과 체크 정렬을 복구했다. 좁은 PC의14장 두줄 손패는 각 행 안에서 기존1px 정렬 기준으로 검사하며 카드 접근성 조건은 유지했다.
- 휴대전화에 사전·저장 직접 버튼을 추가하고 실제 클릭/viewport 접근을 검사했다.
- WebKit의110ms 룬 비행을 비동기 visible polling으로 놓친 테스트 도구 타이밍 실패를 보존했다. 실제 adapter.flyRune 호출 직후 실제 flight 노드를 확인한 시점에 합성 hidden 이벤트를 주입하도록 동기화했다. assertion/타임라인/게임 로직은 바꾸지 않았고 최종3엔진109검사 PASS를 확인했다. 실제 OS 탭 전환으로 확대 보고하지 않는다.

- 최종 문구 감사에서 신규 공통 준비 안내가 기존 유틸리티3룬에도 공격 발동이라고 설명하는 오류를 확인했다. 자원 snapshot 설명만 분리하고 도감에서3개 실제 문구를 검사했다. 수치/자원 적용/문법 엔진 변경 없음. 이 문구 수정 뒤 단위·데이터·빌드·3엔진·지정 production을 별도로 재실행한다.

- 새 production 자연 경로6전투에서 저장 deepEqual이 operation.ui/operation.qa commandId만 달라 실패했다. E2E shadow의 기존 버전 allowlist에0.10.1이 빠진 테스트 도구 오류를 실제 로그로 확인했다. 같은 UI 명령 ID 구성에0.10.1만 추가하고 전체 상태 deepEqual assertion은 그대로 유지했다. 원래 실패를 보존하고 새 실행ID로 재실행한다. 게임 명령/정산은 변경하지 않았다.

- 추가 수로도시3엔진 회귀에서 공략 버튼26px이 기존44px 요구를 위반하는 CSS 회귀를 실제 재현했다. 정상 PC/태블릿 높이에서 해당 버튼의44px을 복구하고 전체 수로도시3엔진 검사를 다시 실행한다. 기존 assertion과 허용오차를 유지했다.

- 최종30공격 핸들 계측 첫 시도는 RAF1로 실패했다. 별도1회 호출 스택은 Playwright InjectedScript.builtinRequestAnimationFrame/next(대기 poll)를 확인했다. 검사 대기를 Node expect.poll로 이동했으며 잔존 timeout/interval/RAF0 assertion은 그대로 유지한다. 게임 연출을 끄거나 예외를 무시하지 않았다.
- 수로도시159검사 통과 후 캡처 직접 검토에서1024px 보조 nav15.31px/마지막 룬16.98px 패널 넘침을 발견했다. 별도DOM 좌표로 재현 후 열 최소너비·줄바꿈·룬 헤더와 조작부 간격을 조정했다. 기존 숫자 허용치는 유지하고12크기 보조패널 bounds/text overflow와3크기 legacy 최대룬 검사를 추가했다.


추가 기대 변경: 0.10 회귀는 명시 legacy010 controller, 역사적 fixture는12룬 manifest로 고정하여 최신22룬을 소급하지 않는다. v02 로비 배지는0101로 변경했고 상점 정보는 새 명시 패널을 먼저 연다. 운영 카드 footer는 새 두줄 배치의 각 행 안에서 기존1px 정렬 기준을 검사하며44px 버튼·카드 전체 가시성 assertion은 유지했다. G030 테스트 이름도 원문 NOT RUN 감지임을 표시했다.

## 인계 및 다음 검토

전체 기능 구현은 전용 브랜치에 있다. 실물기기 검증과 자연47완주가 남으므로 병합/배포 준비 완료로 단정하지 않고 **Draft PR**로 인계한다. 검토자는 새 원정의 실습/스킵 → 초원/항구의 룬 획득·발동 대기 설명 → 골렘260×3/슬롯4 → 사전·저장·형태/전체화면 → 작은 화면 카드/상품 페이지 → 실제 고콤보/효과 감소 순서로 확인할 수 있다. 후반 보스는 별도 지정 상태 증거와 자연 경로를 구분한다.

변경 파일 목록과 보존/의존성 감사는 [change-audit.json](validation/v0.10.1/change-audit.json)에 있다. 원격 인계 상태는 commit/push/PR 뒤 아래에 추가한다. main 직접 push/merge/auto-merge/Pages 변경/공개 배포는 수행하지 않는다.
