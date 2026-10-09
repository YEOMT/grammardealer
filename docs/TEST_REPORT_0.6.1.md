# Syntax Atlas 0.6.1 실제 구현·검증

## 기준과 환경

작업 시작 fetch의 `origin/main`은 `79ab84ebe3a3240a558aecbd2898efdd8e179029`이며 0.6 PR #9가 병합된 상태였다. 시작 checkout은 clean이었다. `codex/v0.6.1-grammar-operations-polish`를 이 커밋에서 생성했다. 이전 브랜치·원본 ZIP·인계 소스를 보존한다.

전체 구현 계약은 `spec/0.6.1_GRAMMAR_OPERATIONS_POLISH.md`다. 외부 MD/ZIP 내부 MD SHA256은 `f15bf6bc27156640330d1b61bedef60ee49f935adb7bcb50af682f456c3682f2`로 같다. 첨부 JSON은 `tests/fixtures/v061-0*.json`에 기대값으로 보존한다. production에서 이 문장 목록을 읽지 않는다.

Windows x64, Node24.19.0, npm11.17.0, Git2.51.0.windows.2, Vite8.3.2, Playwright1.51.1. checkout 기준 `../.local-tools/node-v24.19.0-win-x64/`와 `../.local-tools/playwright-browsers/`를 재사용했다. 시스템 PATH·Codex 런타임·의존성 버전은 바꾸지 않았다. package/lock의 루트 게임 버전만 0.6.1로 변경했다.

기존 고정 출력·공개 증거 309개를 `.local-validation/v061/evidence-before/`에 백업했다. 이번 원본 로그/영상/진단은 `.local-validation/v061/`, 공개 선별 증거는 `docs/validation/v0.6.1/`에 둔다. 과거 실행 결과는 이번 결과로 사용하지 않는다.

## 변경 전 실제 재현

- `npm.cmd test`: 851/851 PASS, 실패·skip0, exit0. `validate:data`: 2,962 checks, exit0. `build`: exit0. 이번 작업에서 수정 전에 재실행한 baseline이다.
- 원래 0.6 registry/runes, 정상 생성한 원정 8개, 상점 8개, 보상 32개와 RNG를 변경 전에 JSON으로 포착했다. 문법 45개는 원래 분석 결과의 SHA256을 보존했다.
- `A room was too hard to show.`는 실제 기존 parser에서 INVALID_CORE/0점이었다. `is often giving`은 본동사 give의 4형식 대신 SVC로 분류됐다. 기존 운영 +1은 저장/연마에서 거부됐다. 재현 로그와 수정 후 결과는 각각 문법/운영 검토 문서에 구분한다.
- 비교할 원정·룬·연마 스냅샷이 없는 과거 8,618점은 재현 기대값으로 삼지 않는다.

## 실행 결과

| 실제 명령 | 상태 | 결과 |
|---|---|---|
| 변경 전 `npm.cmd test` | PASS | 851/851, 실패·skip0, exit0 |
| 최종 `npm.cmd test` | PASS | 1,047/1,047, 실패·skip0, exit0 |
| `npm.cmd run validate:data` | PASS | 2,962 checks, exit0 |
| `npm.cmd run build` | PASS | exit0, production 하위경로 빌드 |
| `npm.cmd run test:decks:snow` | PASS | 4모드 × 2,500 = 10,000 시작 덱/설원 첫패/빙정 partition, exit0 |
| `npm.cmd run test:browser:061` | PASS | Chromium52 + Firefox11 + WebKit11 = 74/캡처66 + 경계18/캡처4, exit0 |
| `node tests/polish-061-edges-browser.mjs` 후속 전체 | PASS | 실제 생성 보상 2건 추가 후 경계20/캡처5 전체 재실행, exit0 |
| `node tests/polish-061-main-edge-browser.mjs` | PASS | 실제 production loader/UI의 지정 저장으로 잠금·단일 정산·재로드3건/캡처2, exit0 |
| 실제 합성 배경 대비 검사 | PASS | 84/84, 작은 글자4.5/큰 글자3 기준 유지 |
| `npm.cmd run test:browser` | PASS | 14개 스크립트 / 291 checks, exit0 |
| `npm.cmd run test:browser:polish` | PASS | 핵심32 + Chromium UI17 = 49, exit0 |
| `npm.cmd run test:browser:cross` | PASS | Firefox46 + WebKit46 = 92, exit0 |
| `npm.cmd run test:e2e` / production 실제 UI | PASS | 실제27전투·60공격(무효1)·운영17회·51체크 기록·원본캡처60, exit0 |
| 설원6-1/6-2/6-3 실제 손패 학습 코스 | PASS | 각 전투에서 비교급/최상급/as~as 실제 제출. 일반 완주와 별도 evidence |

[명령 시각·종료 코드](validation/v0.6.1/commands.json), [빌드 해시](validation/v0.6.1/build-manifest.json)를 별도로 남긴다. 기존 851개 검사에 신규 196개 검사를 더한 1,047개이며 과거 PASS 숫자를 합산해 만든 결과가 아니다.

## 검증 수준과 실패 이력

순수 문법·산술, 지정 Controller 상태, 지정 상태 실제 UI(ASSIGNED), 실제 덱/RNG 자동 정책, production UI 원정은 서로 다른 수준이다. 지정 카드를 사용한 검사는 자연 획득·완주 증거가 아니다. 설원 6-1 비교급/6-2 최상급/6-3 as~as 학습 코스는 일반 27전투 완주와 별도 판정한다.

개발 중 새 legacy 검사의 첫 실행은 `validateRunState`에 필수 registry 인자를 주지 않아 1개 실패했다. 인자를 제공한 재실행은 legacy/meteor 37/37 PASS였다. 기대값이나 게임 규칙을 완화하지 않았다.

운영 변조 검사를 추가한 실행에서는 실제 제출로 깨진 빙정 사본을 DISCARD로 옮긴 저장이 허용되는 문제를 재현했다. 공격 영수증의 실제 소모 ID와 SHATTERED를 대조해 수정했다. 추가로 현재 사본과 사용 영수증의 연마/수명 불일치, cleanup 뒤 임시 사본의 정의 위조, 불완전한 새 manifest/옛 정책 태그, 없는 물리ID를 일관되게 끼워 넣은 영수증을 각각 실행으로 재현했다. 실제 reward REMOVE로 삭제된 사본은 정상으로 인정하면서 변조만 거절하도록 보강했다. 최종 운영·진행·저장 집중97개와 전체1,047개가 통과했다. 상세 실패 이력은 운영 수명 검토 문서와 실행 JSON에 보존한다.

통합 단위 첫 실행은 1,034개 중 14개 실패했다. 13개는 0.3 수치·시간 기대를 현재 기본 registry로 분석한 테스트 문제였고, 1개는 위 빙정 재활용 저장 변조 문제였다. 과거 검사를 실제 0.3 view에 고정하고 저장 검증을 수정했다. 기대값을 현재 운석 값으로 바꾸지 않았다.

집중 브라우저에서 실제 좁은 화면의 운영 이름/사용 버튼 공간 부족과 disabled 빙정 글자 대비4.465 문제를 재현했다. 사용/체크 목표44px와 글자 크기를 유지하며 화면 여백을 재배분하고, 대비 색상을 진하게 조정했다. 최종4해상도×10/14손패·16문장·4룬의8배치와 대비84개가 통과했다. QA fixture의 존재하지 않는 룬ID, 텍스트를 숨긴 배경 캡처의 잔여 글자/포커스 테두리 측정은 검사 도구 문제로 별도 수정했으며 기준을 낮추지 않았다.

집중 브라우저 첫 실행은 로컬 Vite 초기 탐색 20초 timeout으로 검사를 시작하지 못했다. 당시 게임 assertion은 실행되지 않았으며 서버 응답을 확인한 뒤 별도 실행 ID로 재시도했다.

## 테스트 변경 이유

기존 과거 버전 검사는 기대값을 바꾸는 대신 해당 버전 registry/manifest를 명시한다. `v03-language.test.js`와 `v03-score-boss.test.js`는 실제 0.3 언어를, 0.3/0.4/0.5/0.5.1/0.6 저장 helper는 원래 contentVersions와 정책을 사용한다. 새 기본 registry로 과거 규칙을 검사하는 혼동을 막기 위한 것이다. `sky-islands-browser.mjs`의 기존 0.4 지급/상점 검사는 실제 0.4 Controller helper를 사용한다. 새0.6.1 선택 UI는 별도 집중 검사에서 세 엔진으로 실행했다. 기존 assertion 삭제·skip·허용 오차 완화는 하지 않는다.

새 production UI 도구는 0.6.1 운영 command ID, 선택 명령, 연마 구매와 실제 손패 비교 학습 정책을 지원한다. 기존0.6 보스 고정 경로는 원정 버전0.6에서만 사용한다. 원래 localhost 진입 실패를 catch의 IndexedDB SecurityError가 가리던 진단을 수정해 원래 오류와 저장 조회 오류를 각각 보존하고 exit1을 유지했다.

실기기 iPad/Android/Safari, 교사 최종 검수, 스피커 청취는 NOT RUN이다. Playwright WebKit 결과를 실제 Safari 기기 검증으로 표현하지 않는다.

## Production UI와 학습 코스

[실제 production 요약](validation/v0.6.1/production/production-summary.json), [실제 입력/상태 동기화 기록](validation/v0.6.1/production/production-actions.json), [개별 학습 코스](validation/v0.6.1/production/production-course.json)를 공개한다. `SB_E2E_SNOW_COURSE=1`, STANDARD, seed `run-sequence.57`로 실제 `dist`의 `/grammardealer/`를 새 격리 프로필에서 실행했다. 카드를 주입하지 않고 보상/상점/형태/교환/운영 버튼을 사용했다. 페이지·콘솔·리소스·HTTP 오류는 모두0이다. 초기 리소스 수신 뒤 오프라인 상태로 완료했다.

실제 상점에서 보급을 구매·+1연마하고, 운영 사용 뒤 원본 사본 위치/영수증/RNG를 수동 슬롯 저장·불러오기로 대조했다. Stage4 무료 연결어 선택, 세 상점, 골렘3부위, 스핑크스 봉인, 사슴 첫패의 임시 탐색, 비비교 빙정 소비·HP1잠금·마지막 결정 격파와 완료복원을 통과했다. 이 완주에서는 동일 전투의 같은 운영 사본 재사용이 발생하지 않았으므로 별도 자연 재사용 실행과 구분한다.

설원23/24/25전투에서 실제 손패로 제출한 비교급·최상급·동등비교 태그와 물리 카드ID를 각각 기록했다. 자동 정책 문장은 검수된 교육 예문이나 의미 자연스러움의 합격 자료가 아니다.

[대표 캡처와 실제 보스60초 무음 클립](validation/v0.6.1/production/README.md)을 제공한다. 클립은 실제 원본 영상의 일부이며 합성 연출이 아니다. 전체50.7MB 원본·전체60캡처·입력 로그는 로컬에 보존한다. 별도 지정 상태 UI의66캡처와 이60캡처를 혼합하지 않는다.

첫 두 production 시도는 loopback 접근 권한 문제로 게임 진입 전에 실패했다. 두 번째 실행에서 `ERR_NETWORK_ACCESS_DENIED`를 확인했으며 승인된 로컬 실행 환경에서 재시도한 세 번째 실행만 PASS다. 첫 실패를 덮던 IndexedDB 진단 오류는 원래 오류를 먼저 기록하고 재throw하도록 QA 도구만 수정했다.

## 사용자가 검토할 플레이 순서

1. 새0.6.1 원정을 시작해 기존28장/실습 완료 또는 무보상 스킵/첫 룬/혼합 보상을 확인한다.
2. 첫 상점의 운영 판매 한 칸과 연마 설명을 확인한다. 보급 또는 직접 탐색+1을 사용하고 버린 더미에 간 같은 사본을 실제로 다시 뽑아 재사용한다. 슬롯 저장·불러오기 뒤 위치와 이력을 확인한다.
3. Stage4 입장에서 직접 연결어가 없으면 and/but/because 중 하나를 고른다. 선택 전에 저장·복원해도 선택지와 지급이 중복되지 않는지 확인한다.
4. 획득한 카드로 AP-to gap 문장과 `is often giving`/`has often given`의 본동사 문형·형태 오류 표시를 확인한다. 카드가 없으면 자연 원정에 주입하지 않고 집중 UI 증거를 참고한다.
5. 설원6-1 비교급,6-2 최상급,6-3 as~as를 실제 카드로 제출한다. 사슴 첫 손패 임시 탐색의 전투 수명을 확인하고 빙정 WORD를 써서5핵→HP1→마지막핵 격파를 진행한다.

실기기 iPad/Android/Safari·교사 최종 검수·스피커 청취는 NOT RUN이다. 사람이 직접 조작한 난이도/승률/교육효과를 이번 자동 정책의 완주로 주장하지 않는다.

## 별도 자연 재사용 경로의 부분 통과와 중단

[재사용 실행](validation/v0.6.1/production/production-reuse-summary.json)은 `SB_E2E_OPERATION_REUSE=1`의 별도 실제 UI 경로다. 6·7전투에서 실제 구매·연마한 같은 보급+1 사본을 각 두 번째로 사용했다. 첫 효과 뒤 DISCARD, 두 번째 효과 전 HAND, 새 command/effect ID, source 즉시 자기 드로우 없음, 매회 정확한 슬롯 저장·복원을 확인했다. 재사용2회 자체는 PASS다.

이 별도 원정은12전투 FUTURE 부위 HP240, 남은1턴·교환0의 BATTLE 상태에서 자동 정책이 `No finite QA move`를 보고해 **전체 명령은 FAIL/exit1**로 끝났다. 게임 DEFEAT·게임 오류·27전투 완주로 바꾸어 보고하지 않는다. 사용자가 다른 행동을 찾을 수 있는지와 사람 승률은 검증하지 않았다. 성공한 앞의27전투/학습코스 경로와 이 중단 경로의 영수증을 섞지 않는다.

## 최종 보존·패키징 확인

브라우저 도구와 증거 정리 후 `npm.cmd test` 1,047/1,047, `validate:data` 2,962, `build`를 다시 실행해 모두 exit0이었다. 마지막 dist의4개 파일은 실제 production 완주에 사용한 빌드와 SHA256이 모두 같다.

원래 고정 출력309개는 이번 결과를 별도 로컬 폴더에 보존한 뒤 전부 원래 해시로 복원했다. [복원 기록](validation/v0.6.1/evidence-preservation.json)을 남긴다. 과거 ZIP/Work 증거/이전 final 결과 디렉터리는 새 결과로 대체하지 않는다. 테스트의 기존 기본 scratch 폴더는 백업한 원본 파일을 복원했으며 추가 생성된 ignored 파일은 남을 수 있다.

공개 변경은 게임·테스트·검토 문서·원본 기대 fixture·선별 증거다. `node_modules`, `dist`, `.local-tools`, `.baseline-backup`, 원본 실행 로그·대형 원본 영상·개인 환경 덤프는 커밋하지 않는다. 의존성 버전과 기존 Actions workflow는 변경하지 않았다. PR 이벤트는 검증만 실행하고 Pages upload/deploy는 main 조건에서만 실행되는 구성을 유지한다.

현재 설원 화면의 오른쪽 상단 빙정 설명/지역 배율 표시는 줄이 근접한다. 기본 main의 동일 markup/CSS 위치 규칙을 확인했으며 이 패치에서 해당 배치를 바꾸지 않았다. 수정 전 설원 화면 비교 재실행은 NOT RUN이므로 새로 재현한 구버전 오류라고 주장하지 않는다.

A043 후속은 별도 유효 저장을 격리 IndexedDB에 넣은 뒤 실제 production loader/UI로 진행했다. 운영 연출 중 과거 DOM 버튼의 중복 이벤트·저장·로비 버튼·hash 경로 이동을 시도해 잠금을 확인했고, 완료 후 실제 저장은 한 번의 USE+FINISH Controller 결과와 전체 상태/RNG가 같았다. 재로드해도 영수증은1개였다. 실제 앱 root경로의 지정 저장 검사이며 `/grammardealer/` 자연 완주 근거와 구분한다. 초기 연결 거부·preview 하위경로404·읽기 전용 카드에서 사용 버튼이 제거되는 정상 동작을 잘못 기대한 QA 실패는 보존했다. 게임 코드는 바꾸지 않았다.

검사 후 이번에 시작한 서버·브라우저만 종료했다. 개발서버 세션 종료 출력에는 로컬 원본 영상 파일 watcher의 EBUSY가 기록되어 세션 exit1이었다. 공식 브라우저와 production 검사 명령의 exit0·수집 오류0과 별도의 개발환경 정리 로그다.
