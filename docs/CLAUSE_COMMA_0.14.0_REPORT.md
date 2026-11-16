# 쉼표·분사구문 0.14.0 구현·검증 보고서

작성일: 2026-11-16. 최종 소스의 단위·데이터·빌드와 관련 브라우저 검사를 완료했다. 실행 범위와 실기기 미검증을 아래에 구분한다.

## 기준과 변경

- 기준: 작업 시작 시 확인한 `origin/main`의 `cc3b75da280aa93366fa75636c3c970d68621a2a`, 작업 브랜치 `codex/v0.14.0-clause-comma`.
- 명세: [본명세](../spec/v0.14.0/Syntax_Atlas_v0.14.0_Clause_Comma_Spec.md), [32개 인수 조건](../spec/v0.14.0/ACCEPTANCE.md), [설계 출처](../spec/v0.14.0/SOURCES.md). JSON은 `tests/fixtures/clause014/grammar-cases.json`의 기대 자료이며 결과 보고서가 아니다.
- 새 원정·언어·캠페인·기록 규칙만 0.14.0으로 구분한다. 기존 0.12.1 생성기와 경제·룬·HP 계약을 재사용하며 구원정·공격 영수증을 승격하거나 재채점하지 않는다. 총 50전투와 시작 WORD 28장은 유지한다.
- 쉼표는 별도 편집 상태와 스냅샷 `punctuation`으로 저장한다. WORD·덱·손패·문장 24단어 한도에 들어가지 않으며 15전투부터 제공한다. 실제 단어 카드 기준 앵커로 이동·교환·회수·저장·공격 정리를 처리한다.
- 문두 능동 ING / 수동 PP 분사구문은 실제 동사의 문형과 완전한 주절·실제 주어 연결을 검사한다. 근거 태그는 `CLAUSE.PARTICIPIAL.ACTIVE` / `CLAUSE.PARTICIPIAL.PASSIVE`; 편집 중 문법 정답을 제시하지 않는다.
- 43~47은 춤추는 광대 / 추방당한 왕자 / 망상의 순례자 / 후회의 기사 / 운명의 직조자다. HP 2500/2900/3300/3800/5000은 유지한다. 새 47에는 세 실, 구 47에는 예견을 적용한다. 48의 가능한 문법 후보에 두 분사구문을 추가하며 49의 주절시제 판정을 분리한다.

### 구현 판단과 초기값

- `src/data/clausePolicy.js`의 분사구문 각각 **×1.60**, 회복 가능한 쉼표 오류 **×0.90**은 명세 제안 초기값이다. 사용자 확정 난이도나 자연 플레이 검증값으로 보고하지 않는다.
- 쉼표 감점은 룬 뒤·지역/보스 앞에서 공격당 한 번 적용한다. 쉼표만 잘못된 경우 기본 단어 구조의 완성 가산과 완전 문장 룬 자격을 추가로 깎지 않는다. 잘못 끊긴 관계절·내용절·분사구문 자체의 새 보너스/공략 근거는 제외한다. 실제 표시 감소량은 정수 내림 결과다.
- 필수 실제 카드 예문 `Helped by you, I smiled.`의 `by`가 기존 카드 DB에 없었다. 새 0.14 레지스트리에만 일반 전치사 `card.by`와 형태·뜻을 추가하고 기존 `pack.passive` 공급 후보에 연결했다. 시작덱·보스 무료 지급에는 넣지 않았으며 이전 언어 DB에는 추가하지 않았다.
- G29 `Helped by I, she smiled.`은 기대 자료가 허용한 기존 진단 정책에 따라 `PRONOUN_CASE`의 `VALID_WITH_ISSUES`로 남긴다. 새 분사구문 보너스/세 실 근거는 없다. 이를 가짜 정상 성공이나 `INVALID_CORE` 검사 삭제로 처리하지 않았다.
- 문미 분사구문, 완료형 분사구문, 독립분사구문 등 이번 기본 범위 밖의 구조는 `UNSUPPORTED`로 구분한다. 영어 전체에서 틀렸다는 뜻이 아니다.

## 실제 실행 기록

저장소에는 [실행 요약 JSON](clause-comma-0.14.0/execution-summary.json)을 함께 보존한다. 원본 로그와 중간 실패 증거는 `.local-validation/v014/`에 로컬 보존한다. 과거 버전의 실행 결과를 이번 결과에 합산하지 않았다.

| 실행 | 실제 명령 | 결과 / 종료 코드 | 근거 |
|---|---|---|---|
| 신규 언어 집중 검사 | `node --test tests/clause014-language.test.js` | PASS: 47, 실패 0 / 0 | 42개 명세 사례를 별개 실물 카드 사본으로 재구성; 정책·지문·감점·직렬화 포함 |
| 1차 전체 검사 | `npm.cmd test` | **FAIL: 전체 1,995 중 PASS 1,990 / FAIL 5 / 1** | `.local-validation/v014/integration-unit/result.json`, `command.log` |
| 관련 수정 후 집중 통합 | `node --test tests/clause-tool.test.js tests/clause014-language.test.js tests/clause-campaign014.test.js tests/device-input.test.js tests/polish0121.test.js tests/text-shop-flow.test.js` | PASS: 141, 실패/skip 0 / 0 | `.local-validation/v014/focused-integrated/result.json`, `command.log` |
| 수정 후 전체 검사 (by 메타데이터 수정 전) | `npm.cmd test` | PASS: 1,995/1,995 / 0 | `.local-validation/v014/final-unit/result.json`; 이후 메타데이터 수정 후 아래 최종 재실행과 구분 |
| 최초 신규 언어 데이터 검사 | `npm.cmd run validate:data` | **FAIL / 1** | `.local-validation/v014/final-data/result.json`; 신규 by의 capability 메타데이터 오류 |
| by 메타데이터 수정 후 집중 검사 | `node --test tests/clause014-language.test.js` | PASS: 47/47 / 0 | 새 레지스트리 데이터 검증 및 기존 예약 capability 비활성 보존 assertion 포함 |
| by 메타데이터 수정 후 데이터 검사 | `npm.cmd run validate:data` | PASS: 3,668 checks / 0 | 도구 실행 출력; 172 lexemes, 458 forms, 정책 0.14.0 |
| 최종 전체 검사 (by 수정 후) | `npm.cmd test` | PASS: 1,995 / 실패·skip 0 / 종료 0 | `.local-validation/v014/final-unit-2/result.json` |
| 최종 데이터 검사 | `npm.cmd run validate:data` | PASS: 3,668 / 종료 0 | `.local-validation/v014/final-data-2/result.json` |
| 최종 production 빌드 | `npm.cmd run build` | PASS / 종료 0 | `.local-validation/v014/final-build/result.json` |
| PC 쉼표·공격 | `node tests/comma-browser.mjs --section=pc-tool-and-actual-attacks` | PASS / 0 | `.local-validation/v014/browser-pc-3/result.json` |
| 모바일 조합대·취소 | `node tests/comma-browser.mjs --section=mobile-24-boundaries-and-cancellation` | PASS / 0 | `.local-validation/v014/browser-mobile-2/result.json` |
| 앵커·12열·전체화면 | `node tests/comma-browser.mjs --section=anchor-edit-and-pc-twelve --no-captures` | PASS / 0 | `.local-validation/v014/browser-anchor/result.json` |
| 지정 43~47→48 UI 경로 | `node tests/clause-campaign014-browser.mjs` | PASS: 7 정상 공격·5승리·마지막 상점·48 시작 / 0 | `.local-validation/v014/campaign-browser-final2/result.json` |
| 기존 카드·룬 입력 회귀 | `node tests/panorama-mobile-browser.mjs --section=card-rune-input --no-captures` | PASS / 0 | `.local-validation/v014/old-card-rune-command-final/result.json` |

141개 집중 통합 검사 안에 신규 언어 47개, 캠페인 8개, 도구 6개가 포함된다. 서로 다른 실행의 수를 더해 독립 검사 수처럼 표시하지 않는다.

1차 전체 실패 5건의 로그는 (1) 쉼표 오류가 기본 문형 자격까지 없애 post-rune `54 !== 108`, (2) Deep 주절시제 검사에서 실제 과제 ID `PRESENT_SIMPLE` 대신 `PRESENT` 사용, (3) 앱 버전 `'0.14.0' !== '0.13.1'`, (4) 구 0.12.1 공급 fixture의 원정 버전 `'0.14.0' !== '0.12.1'`, (5) 구 47 상점 경로 fixture가 새 세 실 보스를 생성해 `Assigned QA attack did not defeat boss`를 기록했다. 문법 근거 범위·검사 스키마와 fixture 정책을 수정한 뒤 집중 141개 및 전체 1,995개가 통과했다. 초기 실패 로그는 그대로 보존한다.

이어 실제 데이터 검사에서 `lex.by.preposition.sense.basic: active unimplemented capability`가 발생했다. 기존 `cap.passive`는 예약 상태이므로 전역 활성화하지 않았다. 신규 by의 sense/form 준비 메타데이터만 기존 활성 `cap.present.basic` 관례에 맞췄고, 실제 수동 문법 자격은 파서가 계속 검사한다. 해당 수정 뒤 언어 47개와 데이터 3,668 checks가 통과했다. 이후 최종 코드로 전체 1,995개·데이터 3,668개·빌드를 다시 실행해 모두 종료 코드0으로 완료했다.

기존 0.12.1 검사는 `tests/helpers/legacy-0121-controller.js`로 그 정책을 명시했다. `polish0121.test.js`, `helpers/waterways-state.js`, `helpers/shop-flow-state.js`의 구정책 fixture 선택을 고정한 것이며, 구 게임 기대값/HP/승리 assertion을 완화하지 않았다. `device-input.test.js`는 사용자 요청대로 새 앱·원정 0.14.0 및 기존 생성기 0.12.1을 함께 검사하도록 바꿨다.

## AC01~AC32 판정

PASS는 적힌 검사 범위에 한정한다. 지정 상태·합성 산술·브라우저 에뮬레이션을 자연 획득 원정 또는 실기기 검사로 확대하지 않는다. 이번에 수행하지 않은 범위는 NOT RUN으로 구분한다.

| ID | 상태 | 실제 근거·한계 |
|---|---|---|
| AC01 | PASS | 최신 기준에서 별도 브랜치; 명시적 014 버전/레지스트리, 구 0121 저장 왕복 검사. |
| AC02 | PASS (집중) | 세 수준 28장 및 기존 공급·상점 집중 검사; 새 43~47/최종 HP 유지 검사. 자연 50전투는 NOT RUN. |
| AC03 | PASS (단위) | 14 미해금·15/16 해금, 이후 전투번호 조건과 도구 재초기화 검사. 15~50 매 전투 UI 순회는 NOT RUN. |
| AC04 | PASS | 별도 갈색 도구와 상아색 기호/쉼표 명칭; 카드 점수·희귀도·연마 없음. PC/모바일 캡처. |
| AC05 | PASS | 실제 카드·덱·RNG·손패·드로우·교환 값 불변, 점수용 WORD 스냅샷과 별도 punctuation 검사. |
| AC06 | PASS (브라우저) | PC 실제 pointer 배치·드래그·취소, 모바일 두 포인터 취소; 1개 제한과 이동/회수 단위 검사. |
| AC07 | PASS | 24개 별도 실물 WORD와 쉼표; 모바일 실제 8/8/8행·마지막 경계; 빈 조합대 배치 불가 검사. |
| AC08 | PASS (집중) | 제출·준비·새 전투 정리와 저장/복구, 도구 유지; 손패 페이지 독립 UI 검사. |
| AC09 | PASS | 쉼표 위치별 지문 차이, schema2 검증, 문자열·영수증·최고 문장에 실제 쉼표 보존. |
| AC10 | PASS | G01~G42 실제 카드 검사: 조건/부사절·등위절·분사구문, 쉼표만으로 독립절을 잇는 오류, 기존 무쉼표 회귀. |
| AC11 | PASS | 실제 ING 동사 목적어/보어·주절·주어 연결; 전용 `participialAdjuncts`와 카드 근거. |
| AC12 | PASS | 실제 PP·수동 문형·선택적 by 및 목적격 오류 검사; ING/PAST 철자만으로 인정하지 않음. |
| AC13 | PASS | 진행·동명사·명사수식·형용사·본절 수동태에서 신규 태그/보스 근거가 없는 사례 검사. |
| AC14 | PASS (집중) | 위치 오류/INVALID_CORE/UNSUPPORTED 구분; 정상·오류 제출 UI 경로. 편집 중 정답/점수 계산 미추가. |
| AC15 | PASS | adjunct를 유한절·주절시제로 만들지 않음; 분사구문+결과절 선행 가정법 및 Deep 과제 검사. |
| AC16 | PASS | 두 신규 태그 해금/공격당 1회, 카드/길이 가산 불변, 쉼표 자체 점수 없음. |
| AC17 | PASS (집중) | 별도 초기값 상수, 룬 뒤 1회 감점; PC 실제 공격 `108→97`, `−11`, 오류 사유 표시 근거. |
| AC18 | PASS (단위) | Stage10 새 분사구문 지역 자격·지역 이벤트 1회; 기존 현재완료진행 제외 경계 보존. |
| AC19 | PASS (단위·지정 UI) | 정확한 이름·HP·안내·지원표 및 예문의 실제 문법 검사. 실제 UI로 지정 43~46 연결 완료. |
| AC20 | PASS | 새 47 세 실과 구 0121 예견을 같은 검사에서 비교. |
| AC21 | PASS (단위) | 자유순서 누적, 두 정상 근거 동시 해제, 같은 목표/attackId 중복 방지. |
| AC22 | PASS (단위·지정 UI) | HP1에서 실 해제 및 0 실제 HP감소 유지, 마지막 실 공격의 HP1→0 즉시 승리. 7공격 브라우저에서 동일 경계 확인. |
| AC23 | PASS | 진행/수동 본절/과거완료/현실조건/쉼표 누락의 오해제 방지, 위력0과 실제 HP감소 구별. |
| AC24 | PASS (단위·지정 UI) | 실제 스냅샷으로 영수증 재계산; 쉼표·위력·카드·중복 위조 거부, 저장 왕복. 각 전환의 저장 상태 JSON 왕복과 3개 별도 영수증 확인. |
| AC25 | PASS (지정 덱) | 대표 BEGINNER/STANDARD/ADVANCED 28장 생성 후 실제 공급 가능한 if/will을 명시 배정한 덱에서 세 목표 witness 확인. 자연 획득 성공률은 NOT RUN. |
| AC26 | PASS | 실제 보유 사본의 유효 witness만 Surface 후보; 재료 부족 후보 제외·기존 두 과제/한 공격 한 층 검사. 쉼표는 지원카드가 아님. |
| AC27 | PASS (집중) | Deep 실제 주절 PRESENT_SIMPLE 확인 및 PP/ING의 과거·진행 오인 방지; Universal HP10000/순수 메커니즘 유지. 전체 최종 3전투 UI는 NOT RUN. |
| AC28 | PASS (PC/모바일 집중) | PC 실제 공격 FX 표본, 모바일 8열·24단어·손패 하단 8px·viewport 복구 확인. 태블릿 전체 및 실기기 오디오/PWA는 NOT RUN. |
| AC29 | PASS (집중) | 앵커 재정렬/맞교환/회수/부분 비우기/되돌리기, 모바일 줄경계·두 포인터 취소·viewport 유지. 실제 기기 회전은 NOT RUN. |
| AC30 | PASS (단위) | 구 0121 저장 내용 불변 왕복; 새 쉼표/규칙 기록 분리, 최고 문장 보존. 구 nominal 기록이 새 화면에 섞이지 않는 검사 추가. |
| AC31 | PASS | 최종 1,995 단위·3,668 데이터·build와 신규 브라우저 3묶음, 지정 43~48 흐름, 기존 카드/룬 입력 회귀 종료0. 자연 원정과 구분. |
| AC32 | PASS (인계 자료) | 32항목·초기값·대표3화면·제한과 재현 명령 기록. 원격 브랜치/PR 결과는 PR 설명과 최종 응답에 제시. main 병합·배포 미실행. |

## 대표 화면·실행 한계

다음 3장만 저장소에 보존한다. 원본·중간 실패 캡처는 로컬 실행 폴더에 남긴다.

- [PC 쉼표/공격](clause-comma-0.14.0/pc-comma.png).
- [모바일 24단어+쉼표](clause-comma-0.14.0/mobile-24-comma.png): 844×390, 8열 3행, 손패 실제 하단 8px. 배치 검사용 카드 조합으로 문법 정답 예시가 아니다.
- [47 마지막 실 직전](clause-comma-0.14.0/47-before-last-thread.png): 행동·흔적 해제, HP1. 다음 실제 가정법 공격에서 1→0 격파.

`tests/clause-campaign014-browser.mjs`는 합법적인 실물 카드/연마/룬을 지정하고 각 제출 전 손패를 배정하는 짧은 UI 학습 경로다. 실제 조합·형태·쉼표·공격·연출·보상·다음 전투를 사용하더라도 자연 보상 원정·승률·production 50전투 완주 증거로 보고하지 않는다. 합성 HP1 경계 검사는 별도 단위 검사다. 이번 지정 UI에서도 HP5000→1, HP1에서 실제 피해0/흔적 해제, 마지막 가능성 해제/HP1→0을 확인했다. 보상 뒤 여섯 번째 상점의 상품·RNG 재렌더 불변, 입장과 48의 HP5000·6턴·서로 다른 두 과제까지 연결했다.

초기 캠페인 UI는 기존 fixture의 입장상점 정책으로 통과했으므로 새 정책 근거와 구분했다. 최신 NEW_RUN의 `BOSS_REWARD_FIRST_V1`을 가져온 최종 검사를 별도 실행했다. 중간 재시도는 소스 데이터 변경에 따른 Vite reload로 검사용 페이지 상태가 사라져 중단됐으며 통과로 세지 않았다. 로컬 브라우저의 첫 연결은 샌드박스 localhost 차단으로 실패했고, 허용된 로컬 접근에서 동일 입력 회귀를 통과했다. 이는 게임 assertion 실패와 구분한다.

**NOT RUN:** 자연 50전투 완주, 대량 seed/자연 공급 성공률, iOS/Android 실기기 터치·회전·청취, 카카오톡/인스타그램 실제 접속, 전 브라우저/기기 순회. 이번 범위의 완료 조건으로 확장하지 않는다. 미세한 간격·색감과 제안 배율 난도는 사용자 플레이 피드백으로 후속 확인한다.

빌드에 기존 단일 JS 번들의 500kB 초과 경고가 남는다(최종 minified JS 약734kB). 빌드는 성공했으며 이번 범위에서 번들 구조/경고 기준을 바꾸지 않았다. 의존성 버전·워크플로·에셋·BGM은 변경하지 않았다. lockfile은 앱 버전 두 필드만 변경했다.

## 원격 인계

- 작업 브랜치: `codex/v0.14.0-clause-comma`.
- 원격 인계 대상: [작업 브랜치](https://github.com/YEOMT/grammardealer/tree/codex/v0.14.0-clause-comma) → `main` PR. 커밋과 PR URL은 GitHub 변경 내역·최종 응답에서 확인한다.
- main 병합·자동 병합·Pages 설정 변경·공개 배포: **실행하지 않음**.
