# 0.2.2 실제 구현·검증 보고

검증일 2026-10-05 (Asia/Seoul). 명세의 P01~P72와 과거 보고서 수치는 실행 결과로 재사용하지 않았다.

## 기준과 환경

- 작업 시작 시 fetch한 origin/main: `50b4311eb07c7e8ce14dfa8142436af430ba7dea` (0.2.1 PR #3 병합). 0.2.1 커밋 ancestor, 동일 tree, 실제 실습·HP·연출 코드를 확인했다. 시작 checkout clean.
- 브랜치: `codex/v0.2.2-grammar-learning-integrity`. 실제 source root는 이 Git checkout의 `.`이다. ZIP이나 이전 소스로 덮어쓰지 않았다.
- Windows, Node 24.19.0, npm 11.17.0, Git 2.51.0.windows.2, Vite 8.3.2, Playwright 1.51.1, Chromium 134.0.6998.35.
- 기존 `../.local-tools/node-v24.19.0-win-x64/{node.exe,npm.cmd}`와 `../.local-tools/playwright-browsers` 재사용. 추가 설치·의존성 업데이트·시스템 PATH 변경 없음. lockfile은 앱 버전 두 곳만 0.2.2로 변경했다.
- 수정 전 baseline: npm test **284 PASS**, build **PASS**. 원본 로그 `.local-validation/v022/baseline/`.

## 실행 결과

검사는 증거 충돌을 피하여 순차 실행했다. `.local-validation/v022/final/`에 첫 전체 실행과 종료 결과를 보존했다. 마지막 교육 표시·예외 시 Undo 보존 보완 후 필수 test/validate/build 및 공식 browser 전체를 재실행한 최종 기록은 `final-complete/`다. 중간 `final-review/` 실패도 남겼다.

| 명령 | 결과 | 종료 / 실행 범위 |
|---|---|---|
| npm.cmd test | PASS | 0 / 342 tests, 0 fail, 0 skip |
| npm.cmd run validate:data | PASS | 0 / 2,371 checks; 120 lexemes, 119 runtime, 251 forms, 189 active |
| npm.cmd run build | PASS | 0 / production /grammardealer/ |
| npm.cmd run test:browser | PASS | 0 / Phase B 3, C 4, D 4, E 8; 배치 UI 41; Stage 2 UI 29; 실습 UI 47; 학습 UI 28 |
| npm.cmd run test:e2e | PASS | 0 / 7전투, 실제 공격 23회(실습 2 + 일반 유효 20 + 무효 1), 초기 로드 이후 오프라인 |
| npm.cmd run test:decks | PASS | 0 / 4모드 × 2,500 = 10,000; repair 0, fallback 0 |
| npm.cmd run test:runs | PASS | 0 / 160회: 완주 38, 정상 패배 122, 엔진/정책 오류 0 |

마지막 소스의 unit 342/validate 2,371/build 및 browser 전체 PASS. 학습 UI는 4해상도 × 7검사 = 28개, 캡처 28개다. 전체 UI 캡처는 배치 25, Stage 2 19, 실습 27과 별도로 집계한다. 최종 production 1024×768 효과 감소·음소거도 23회 실제 공격으로 7전투를 완주해 exit 0이다. 1366×768 일반 효과 첫 전체 E2E도 별도 로그와 캡처에 보존한다.

160회는 두 정책 × 네 어휘모드 × 고정 20시드다. LEARNING 38/80, SV_ONLY 0/80 완주. 패배한 최종 전투 번호는 2:1회, 3:2회, 4:6회, 5:21회, 6:22회, 7:70회다. 모두 적 HP가 남은 채 행동이 소진된 정상 DEFEAT이며 오류/강제 성공으로 바꾸지 않았다. 입력 오류는 0회다. 이 분포만으로 카드 운과 자동 정책의 한계를 인과적으로 분리하거나 사람 승률을 주장하지 않는다. 이전 해금 프로필의 산술은 단위/합성 UI로 별도 검증했다.

시작 덱은 main 원본을 읽어 생성한 독립 golden 40개(4모드 × 10시드)의 실제 카드·어휘·RNG·generationTrace 해시와 동일하다. 새 분석 증거의 역할/메타데이터가 달라지는 진단용 witnesses는 물리 덱 동등성에서 제외했고, 정상 문장 접근성은 기존 10,000 덱 검사로 따로 확인했다.

## 증거의 종류

- **실제 production UI**: `tests/e2e.mjs`, 시드 `run-sequence.1`, 새 프로필. 실습 30/87 → 실제 손패 0피해 제출 → 턴 후 저장/복원 → 첫 룬 → 초원 보스 → 상점 구매/저장/복원 → 항구 4전투/장막 → STAGE2_END. 화면 조작과 별도 Controller의 예상 상태를 대조하며 카드/적 HP/재화를 주입하지 않는다. 원격 사이트가 아닌 로컬 `/grammardealer/` 빌드다.
- **합성 상태 + 실제 Controller/UI**: `grammar-learning-browser.mjs`의 합법 카드 fixture로 지정 문장/마지막 턴/잠김·해금/사전/과거 기록을 반복한다. 이를 실제 원정 완주로 계산하지 않는다. 기존 최대 배치 및 Stage 2 UI fixture도 같은 구분이다.
- **실제 명령 시뮬레이션**: `test:runs`는 실습 완료 프로필로 새 0.2.2 정상 원정을 만들고 현재 손패만으로 교환·준비·보상·상점을 이용한다. 카드·HP·미래 드로우를 조작하지 않는다. 실습은 production 및 별도 실습 검사로 확인한다. 패배는 유한한 자동 정책의 결과이며 사람 승률이나 불가능한 시드라는 증거가 아니다.
- **단위/합성 산술**: 70/140/175/262, 장막 방어 0, 정확성 0, 자원 보존·버전별 저장·깊이 한도·동사 30개·교육 데이터. 합성 면역 보스는 실제 항구 보스라고 표시하지 않는다.
- 대표 캡처와 출처: [evidence-0.2.2](evidence-0.2.2/README.md). 원본 로그/전체 중복 캡처는 로컬에 보존한다.

## 변경된 기대값과 개발 중 실패

1. 0.2.2 일반 전투의 INVALID_CORE는 제출로 정산한다. 0.2.1 이전 원정의 무소모 거부 정책은 유지한다. 기술 오류·무결성·예산 초과는 무료 복구다.
2. 현재 snapshot 언어 버전은 0.2.2다. 과거 언어 범위 테스트는 명시적인 0.2 registry로 계속 검사한다. 구버전의 UNSUPPORTED를 최신 판정의 기대값으로 사용하지 않는다.
3. 전용 4형식 배율은 동결된 pack.svoo 자격을 따르며 잠긴 문장은 70/80이다. 현재 명세의 140/160/175/262 기대값을 그대로 검사한다.
4. 도감 번역 존재 assertion은 번역 부재·영어/문법/위력 증거로 변경했다. 접힌 과거 기록을 읽는 테스트는 실제 영역을 열도록 변경했다. 생산 빌드 debug/sandbox는 내부 상태가 노출되지 않는 것으로 검사한다.
5. E2E의 실습 이후 준비 한 번을 실제 무효 제출 한 번으로 바꾸어 새 거래 정책을 검증했다. 실습 내 준비/교환은 그대로다. HP·피해 주입이나 강제 승리, assertion 삭제/skip/오차 완화는 없다.
6. 개발 중 통합 실패: 남은 learningSummary 참조, 0.2.2 실습 버전 가드, 새/구 언어 기대 구분을 수정했다. 첫 브라우저 통합은 접힌 과거 기록의 텍스트를 읽다가 실패했고 실제 펼침 동작을 추가했다. 전체 덱 객체 비교는 새 진단 증거까지 포함해 실패했으며, 물리 상태 golden과 문장 접근성을 분리 검증했다. 해당 FAIL 로그를 `.local-validation/v022/`에 남겼다.
7. 마지막 검토에서 불완전 문장의 도감 설명을 지정 안내로 통일하고 be 위치/help 원형 안내를 연결했다. 프로필 처리 예외 뒤에도 Undo가 보존되는 검사와 커밋 이후 Undo 정리를 추가했다. 도중 소스 수정으로 Vite가 새로고침되어 중간 UI 검사가 `learningController is not defined`로 실패했다. 원인은 검증 실행 중 편집이며 가드/기대값을 바꾸지 않았다. 소스를 고정한 뒤 필수 test/validate/build와 공식 browser 전체를 다시 실행해 PASS했다.

## P01~P72 대응

`G`=grammar-learning.test.js, `L`=grammar-learning-browser.mjs, `E`=production e2e.mjs, `R`=기존 회귀(unit/browser/guided/stage/storage). PASS는 해당 자동 검사 범위의 결과다. 실제 기기·교사 검수로 확대 해석하지 않는다.

| ID | 결과 | 실제 근거 / 범위 |
|---|---|---|
| P01 | PASS | origin/main SHA·0.2.1 ancestor·실제 코드 확인, clean 별도 브랜치 |
| P02 | PASS | R/E: 실습·77/132/242·체크·타격·상점·토파즈·7전투 |
| P03 | PASS | G/R/L: 1~16장 입력 한도, 빈/중복/진행 상태 가드, 사전 점수 없음 |
| P04 | PASS | G/L: I book happy run 4장 DISCARD·턴 -1·교환 유지; E는 실제 단일 카드 실패 |
| P05 | PASS | G/E: +3; R의 공통 드로우/손패한도/재셔플 검사 |
| P06 | PASS | G/L: 마지막 턴 실패 후 패배, 추가 드로우 없음 |
| P07 | PASS | G: 제출/연출 후 Undo 거부 |
| P08 | PASS | G/R: command/revision/attackId와 FINISH 재호출 중복 방지 |
| P09 | PASS | G/L: 지정 실패 문구·보스 방어와 별개 |
| P10 | PASS | G: 연마3·완성/연마 룬·지역·보스에도 0, 처치/콤보 없음 |
| P11 | PASS | G/R: I be happy 30, He develop 등 감점 공격 |
| P12 | PASS | G: 위조 form·중복 카드·예외·실제 관계절 깊이 한도 rollback |
| P13 | PASS | G: 같은 분석을 지역·해금·룬과 분리 대조 |
| P14 | PASS | G: 등록된 SVOC/to/관계절 전체 구조 검증 후 양수 공격 |
| P15 | PASS | G: 남은 토큰·잘못된 to·목적어 중복 음성 사례; 코드 검토 |
| P16 | PASS | G/L: 잠긴 She gives me a book 70, 전용/지역 효과 없음 |
| P17 | PASS | G/L: 해금 시 140, Stage 1 재잠금 없음 |
| P18 | PASS | G/R/E: milestone 1회, 같은 원정 항구 해금 |
| P19 | PASS | G: 175/262 첫 장막 해제; E 실제 토파즈/장막 경로 |
| P20 | PASS | G/L: 잠긴 4형식에 SV/SVO 룬·잘못된 태그 없음 |
| P21 | PASS | G/R/E: 동결 자격·실제 hit 보관·프로필 변경/열람 재정산 없음 |
| P22 | PASS | G: 후반 전용 태그/배수 미발동, 입증된 기존 주절 효과만 |
| P23 | PASS | G: 활성 VERB 30개와 Audit fixture 목록 정확히 일치 |
| P24 | PASS | G/L: develop SV/SVO/3인칭, 사전 표시 |
| P25 | PASS | G: He develop 일치 감점·양수 위력 |
| P26 | PASS | G: 모든 대표 예문의 Sense 순서 뒤집기 동일 분석 |
| P27 | PASS | G: read/eat/help/improve/change SV/SVO 및 30개 양성/형태/비주어 음성 |
| P28 | PASS | G: like+NP+NP, give/want 무목적어, run+AP 반려 |
| P29 | PASS | G/L: 실제 Frame·runtime forms 기반 안내; 검토표 제공 |
| P30 | PASS | G: 네 대표 be 보어 문장 모두 SVC |
| P31 | PASS | G: I am happy at school SVC+PP |
| P32 | PASS | G: be 장소는 채택한 SV, I am 단독은 핵심 실패 |
| P33 | PASS | G/L: IO=my friend, DO=a book 전체 NP |
| P34 | PASS | G: give a book to me SVO+PP, IO·장막 해제 없음 |
| P35 | PASS | G: want/need/like+to 정상, to 전용 콤보 없음 |
| P36 | PASS | G: want+O+to, help+O+(to) 원형; 어휘별 Frame |
| P37 | PASS | G: see/make 원형 정상, 잘못된 to 삽입 핵심 실패 |
| P38 | PASS | G: make/find/keep 목적격보어; 미등록 clean 대신 기존 safe 사용 |
| P39 | PASS | G: that 주격/목적격 관계절, 실제 gap/antecedent 증거 |
| P40 | PASS | G: 목적격 생략 인정, 주격 생략·중복 it 반려 |
| P41 | PASS | G: to be BASE와 주절 미선택 be 감점 구분 |
| P42 | PASS | G: 복수 주어·다른 동사·명사 치환; 문장 whitelist 없음 |
| P43 | PASS | L/R: 보유 수·연마·뜻·형태·희귀도·점수 안내 |
| P44 | PASS | L/R: 제거 단어 만난 이력 유지, 현재 보유 0 |
| P45 | PASS | R/E: DRAW 정렬·DISCARD 순서·읽기 무소모·실습 사전 동작 |
| P46 | PASS | G: I/me/my 구분; 고정 7대명사 격별 뜻 표 |
| P47 | PASS | L/E: 프로필/종료 도감 영어·문법·실제 위력 표시 |
| P48 | PASS | L/E/R: 새/과거 도감·최근 기록에 번역/meaning tooltip 없음 |
| P49 | PASS | L/E: 내부 ID/상태 배제, production debug 경로 차단 |
| P50 | PASS | G/L: 고정 한국어 문법명·역할 설명 유지 |
| P51 | PASS | G/L: complete 예문 분리, 실패는 최근 제출에만 |
| P52 | PASS | L/E: 문법 누적 사용 명시, 새 날짜/단계/문장 횟수 생성 없음 |
| P53 | PASS | G: 고정 IO/DO/C/PP 데이터, 사람/사물 절대 규칙 없음 |
| P54 | PASS | G: 실제 parser NP/AP/PP 증거로 분류 |
| P55 | PASS | G/L: 증거 있는 과거 be 오분류 교육 보정, 역사 수치 동일 |
| P56 | PASS | G/L: 토큰 없는 I am 이전 기록 보존·모범에서 제외 |
| P57 | PASS | G/E: 교육 재검토 멱등·열람 후 프로필/보상/RNG 동일 |
| P58 | PASS | R/G/E: 실습 stats 0, sandbox 실전 미집계, 기술 실패 보존 |
| P59 | PASS | E/R: 새 0.2.2 SHOP·7전투·STAGE2_END |
| P60 | PASS | R/E: 동일 DB/3슬롯·0.1/0.2/0.2.1 view·카드/HP/상품/보상/RNG |
| P61 | PASS | G/R: 새 정책 0.2.2만; 옛 원정 자동 변환 없음 |
| P62 | PASS | G/E: 실패 후 안전 저장·상점/프로필 해금 exact restore |
| P63 | PASS | G/L/R: 실패 짧은0, 정상 콤보·강한 타격 유지 |
| P64 | PASS | G/L: 3가지 0원인, 마지막 턴 연출 후 패배 |
| P65 | PASS | E/guided: 실제 30/87·HP77·교환/준비·정상28장 복원 |
| P66 | PASS | guided/R: 확인 대기·hidden·중복·입력 잠금, watchdog 회귀 |
| P67 | PASS | 10,000 덱, 160개 명령 원정; 38완주/122정상패배/오류0 |
| P68 | PASS | E: production 실습→일반0→상점→항구완주·도감 |
| P69 | NOT RUN | 4해상도 Chromium UI/터치 에뮬레이션은 PASS. 실제 iPad Safari/Android는 미실행 |
| P70 | PASS | 마지막 필수 test/validate/build·공식 browser 전체 재실행; storage/E2E 별도 기록 |
| P71 | PASS | 기대 변경·중간 FAIL·NOT RUN·합성/실제 범위 분리 |
| P72 | PASS | 구현 커밋 8b8c539 push, main 대상 PR #4 생성·표·캡처 제출; merge/배포 없음 |

## 보존 및 한계

- 새 원정에만 제출/문법/콤보 정책 0.2.2를 적용한다. tutorial/presentation 계약 0.2.1, balance/rune/reward 계약 0.2.0, 초기 덱 생성 0.1.1을 유지한다. HP/장막/가격/보상 가중치·카드 공급·CSS 최대 배치·저장 DB 이름은 변경하지 않았다.
- 기본 판정은 등록된 현재형 Frame, to/원형 연결, that 관계절 및 목적격 생략에 한정한다. 구조 깊이/후보/작업량 한도가 있으며 초과는 무료 기술 복구다. 명사절·시제/수동/의문문·새 지역/룬은 범위 밖이다. clean 카드 추가 없이 safe로 치환한 점을 Audit에 명시했다.
- 교사·영문법 전문가의 수동 교육 문구 검수, 실제 iPad/Android/Safari/Firefox/WebKit, 실제 스피커 청취, OS 저장 quota 소진: **NOT RUN**. Chromium 터치나 자동 fixture를 대신했다고 주장하지 않는다.
- main 직접 push/merge/auto-merge·Pages 설정·공개 배포를 하지 않는다. 기존 workflow의 PR build와 main 전용 deploy 조건을 유지한다.

고정 출력 증거 112개와 이전 실습 증거 35개는 이번 결과를 `final-complete/fixed-output/` 및 `guided/`에 보존한 뒤 원본 백업으로 복원했다. SHA-256 불일치 0개. 원본 ZIP/인계 소스/`.baseline-backup`은 수정하지 않았다. 의도적인 게임/테스트/문서 변경은 Git diff에 남기며 원본 전체가 동일하다고 주장하지 않는다. 카드 정의·형태·형태소 행은 0.2.1 view와 deep equality도 통과했다.

원격 결과: 구현 커밋 `8b8c539bebe02f2273741b46732da03bbfec5ce9`를 개발 브랜치에 push했고 [PR #4](https://github.com/YEOMT/grammardealer/pull/4)를 생성했다. PR base는 시작 main과 같은 `50b4311`이다. 후속 문서 커밋은 이 URL·납품 결과만 기록한다. 원격 CI의 최신 상태는 PR Checks를 따른다. main 직접 push/merge/auto-merge·Pages 설정·공개 배포는 하지 않았다. 이번에 시작한 Vite 및 production 서버/브라우저를 종료했고 5173/4174에 검증 서버가 남아 있지 않음을 확인했다.
