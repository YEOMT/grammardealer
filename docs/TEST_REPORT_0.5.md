# Syntax Atlas 0.5.0 실제 검증 보고서

실행일은 2026-10-06, 소스 루트는 `grammardealer/`, 작업 브랜치는 `codex/v0.5-wish-desert-nonfinite-seal`이다. 작업 시작 최신 `origin/main`은 `6d2907eddefafb1a909c6c803259ba26b408f104`(0.4 PR #6 병합)이며 시작 checkout은 clean이었다. 첨부 ZIP 명세 전체를 읽고 8개 manifest hash를 확인했다. 원본 명세/JSON과 이번 실행 증거를 구분한다.

## 실제 실행 결과

| 실제 명령 | 종료 | 결과 | 범위 |
|---|---:|---|---|
| 기준 main `npm.cmd test` / `npm.cmd run build` | 0 / 0 | PASS | 이번 작업에서 변경 전583검사·production 빌드 재실행 |
| 최종 `npm.cmd test` | 0 | PASS | 726 tests; FAIL/skip/cancel 0 |
| `npm.cmd run validate:data` | 0 | PASS | 2748 checks;133 lexemes/132 active,319 forms/318 active,14 frames |
| `npm.cmd run build` | 0 | PASS |70 modules; CSS49.74kB/JS355.05kB, `/grammardealer/` |
| `npm.cmd run test:browser` | 0 | PASS | 공식13스크립트 전체,261 checks; 마지막 사막36/20캡처 |
| `node tests/desert-score-browser.mjs` | 0 | PASS | 지정 실제 공격의 live operand/멱등성9검사,5캡처 |
| `npm.cmd run test:decks:desert` | 0 | PASS | 네 모드 각2500, 총10,000덱/실제 witness/6장 opener, 오류0 |
| `npm.cmd run test:runs:desert` | 0 | PASS |80명령 원정:10완주/70정상패배/기술·정책 오류0 |
| `npm.cmd run test:e2e` | 0 | PASS | production22전투·49공격·516기록 명령·31checks·47고유PNG |

최종 source 실행 ID는 `.local-validation/v05/final3/`다. 이전 final/final2 성공을 최종 수정본 결과로 재사용하지 않았다. 상세 명령·UTC 시각·종료 코드와 중간 실패는 공개 증거 `validation/v0.5/` 및 아래 실패 이력을 따른다. [P001–P103 대응표](ACCEPTANCE_0.5.md)는 원본 기대 JSON과 별도다.

## 공식 브라우저와 자동 원정

| 실제 묶음 | checks | 캡처 | 해석 |
|---|---:|---:|---|
| 기존 입력/보상/학습/VFX B/C/D/E |3/4/4/8| 고정 경로 원본 별도 보존 | 실제 DOM 및 지정 보상/연출 |
| 기존 최대 카드 UI |41|25| 지정 최대 배치, 이번 재실행 |
| 항구/상점/저장 |29|19| 기존 지정 상태 |
| 실습 |47|27| 실제 안내 입력, 숨김은 합성 visibility event |
| 문법 학습 |28|28| 기존 판정·기록·배치 |
| 협곡 |23|18| 시간/골렘/룬 지정 상태 |
| 형태/브랜딩 |6|4|3해상도·키보드/Chromium touch |
| 운영 |14|12| 사용/취소/한도/재셔플/다음 전투 복귀 |
| 하늘섬 |18|13| 최대 배치/상점2/보호막/절/IndexedDB |
| 사막 |36|20| 봉인 입력/교환/운영/로드/역할/새 어휘 연마·제거·sandbox |
| 추가 live 채점 |9|5| 실제 Controller 공격의 새 표시 배율, 공식13개 묶음과 별도 |

사막 최대 배치는1024×768/1280×800/1366×768 각각 손패10·14, 조합16, 룬4다. 체크44px, 공격/손패/운영/봉인/공략 안내 겹침을 실제 bounding box와 화면으로 확인했다. 이 지정 상태는 자연 손패 획득 증거가 아니다. 공식 신규 사막의 화면에는 새 단어3종 실제 +1연마 확인과 다음 전투 입력도 포함한다.

자동 원정은 네 어휘 모드 각20개, `run-sequence.0`–`.19`, LEARNING 정책, 실제 실습 및 핵심 실패 제출·교환을 포함한다. BEGINNER2완주/18패배, STANDARD4/16, ADVANCED2/18, FREE2/18이다. 전투7에80개가 도달해61개, 전투12에61개가 도달해13개, 전투22에13개가 도달해10개가 통과했다. 사막18–21전투에는13개가 도달해 모두 통과했다. 모든 정상 패배와 분포는 `runs-summary.json`에 남기며 사람 승률이나 특정 seed 불가능성으로 해석하지 않는다. 한 seed를 완주했다고 전체 입력·덱 접근성을 증명하는 것도 아니다.

## Production UI

Chromium134 /1366×768 /STANDARD /`run-sequence.13` /LEARNING 후보 정책으로 실제 `dist/`의 `/grammardealer/`에서 22전투를 완주했다. 원정 카드·HP·피해·드로우를 주입하지 않았다. 49회 실제 공격은 실습2 + 일반 유효46 + 핵심 실패1이며 결과 화면의 일반 공격 집계47과 구분한다. 기록된516 Controller명령은 실습 helper·일반 저장/모달 탐색 입력의 전체 개수를 뜻하지 않는다. UI31검사, 고유PNG47장과 원본 전체 무음 영상을 보존했다.

실습40/126·28장 복귀 → 0피해 실제 제출/교환 → 첫 룬 → 두 상점의 구매·로비 왕복·RNG 동일 저장 → SVOO 장막 해제 → 골렘 세 부위/초과 이월 없음·중간 저장 → 실제 절 연결 문지기 해제 → 사막5전투 → 스핑크스 봉인/완료를 통과했다. 자연 획득 운영 사용은13/16/18/21전투의 **4회**였으며 사용 완료 상태를 실제 저장·복원했다. 지정 상태의 운영+봉인/탐색 재획득 검사는 별도 browser-desert 증거다.

스핑크스 첫 자연 손패에서 실제 봉인 카드의 배치를 클릭해 무소모 거절을 확인하고, 같은 사본·턴 key·전체 RNG가 안전 저장/불러오기 후 동일한지 비교했다. 완료 슬롯을 다시 불러와 Stage1~5 완료 사건 각1건·highestStage5·4룬 슬롯·storyClear0을 확인했다. 도감 열기/새 원정/production debug query·hash도 기록을 중복시키지 않았다.

초기 정적 자원 로드 뒤 네트워크를 끄고22전투/저장/새 원정을 진행했다. 페이지·콘솔 오류, 실패 요청,400이상 응답은 모두0이며 외부 runtime origin 요청이 없었다. 이는 최초 로드조차 없는 PWA 오프라인 설치 검증이 아니다. 기존 사용자 브라우저 프로필/공개 사이트 저장을 사용하거나 지우지 않았다.

QA 정책의 문장은 구조·명령 검증용이며 뜻의 자연스러움이나 교사가 승인한 학습 예문을 뜻하지 않는다. 모든 문장의 언어 용법을 이 한 완주로 검증했다고 주장하지 않는다. 실제 parser64기대+holdout,22독립 산술,지정 상태/화면 검사와 함께 해석한다.
## 환경과 증거 수준

Windows / Node24.19.0 / npm11.17.0 / Git2.51.0.windows.2 / Vite8.3.2 / Playwright1.51.1 / Chromium134.0.6998.35. Node/npm은 `../.local-tools/node-v24.19.0-win-x64/`, Playwright는 `../.local-tools/playwright-browsers/`를 재사용했다. PATH는 검사 프로세스에만 지정했다. 재설치·의존성 업그레이드·시스템 설정 변경은 하지 않았다. package-lock은 루트 앱 버전 두 곳만0.5.0이다.

1. 독립 산술: 첨부 S001–S022를 실제 Parser→Score→Rune→Stage로 검사한다. 가짜 grammar hit를 주입하지 않는다.
2. 지정 상태: seal B001–B026, 입장/완료 경계와 최대 카드 배치는 지정 카드/상태로 실제 Controller·DOM을 검사한다. 자연 드로우 완주가 아니다.
3. 자동 원정: 보이는 손패의 유한 후보와 실제 명령을 사용한다. 정상 패배는 기술 실패나 시드 불가능성의 증거가 아니며 결과를 사람 승률로 부르지 않는다.
4. production UI: 빌드된 `/grammardealer/`에서 실제 버튼·카드·보상·상점·저장 UI로 진행한다. 읽기 전용 shadow controller는 현재 UI 저장 상태와 일치하는 후보를 고를 뿐, 브라우저 카드/HP/RNG를 바꾸지 않는다. 전체 명령·네트워크 오류·콘솔·화면을 따로 기록한다.

원본 로그·전체 화면·전체 영상은 `.local-validation/v05/`에 남긴다. 공개 증거에는 상대 경로의 요약과 선별 화면/부분 무음 영상만 담는다. 기존 공식 스크립트의 내부 Pxx 번호와 0.5 인수 P001–P103은 별도 체계다.

## 중간 실패와 수정 근거

- 첫 통합689검사 중1실패: 실행 프로세스에 이전04기본 registry가 이미 import된 동안05교육 예문이 들어간 상태였다. 버전 활성화를 마친 새 프로세스의 관련84검사에서 통과했다. 기대 문법 수치는 바꾸지 않았다.
- 새 진행 검사 작성 중 여분 괄호/누락된 rulesSnapshot 정책 필드, UI 데이터 검사에서 실제 lexeme ID를 잘못 가정한 준비 코드 오류를 수정했다. 기존 검사를 삭제하지 않았다.
- 첫 사막 브라우저 최대 배치에서1366×768/손패14의 봉인·운영 카드 높이 때문에 교환부가12px넘쳤다. 손패 min-content 높이를 확보하고 편집 대기 공간과 상태 여백을 배분했다. 카드/버튼 크기, assertion, 오차를 바꾸지 않았다.
- 다음 사막 브라우저는 닫힌 dialog의 제거 완료 이전에 다음 메뉴를 검사해 중단됐다. 이벤트 완료를 기다리는 도구 수정 후 같은 조건의29검사/17캡처가 통과했다.
- 화면 검토에서 `I want you to read books`의 내부 read를 일반 COMPLEMENT로 덮던 분석 표기를 찾았다. 목적격보어 구 전체를 유지하면서 내부 NONFINITE_VERB를 보존하고 to/bare/복합 구와 학습 역할 회귀를 추가했다. 관련154검사가 통과했다.
- 독립 검토에서 새 enjoy/finish/hobby가 포함된 보상 연마/제거 목록과 연마 완료 화면이 legacy cardModel 기본값을 사용하던 버전 전달 누락을 발견했다. 실제 원정 버전을 전달하는 최소 수정과 새 카드 UI 회귀로 보완한다.
- 80원정 첫 요약의 `bossVeilReleased`는 마지막12개 공격 history만 보고 이전 보스 해제를 빠뜨렸다. 실제 FINISH 명령의 확정 resolution을 기록하도록 QA 지표만 고쳤고 전체80회를 새 폴더에서 재실행했다. 점수/보스/정책의 통과 조건을 바꾸지 않았다.

- 보상 UI 수정 제안 파일을 병렬 작업자가 교차 복사한 중간 실행은 Vite reload로 지정 상태가 사라져 6검사 뒤 중단됐다. 원본 로그와 빈 pageerror 배열을 보존했다. 파일 고정 후 36검사/20캡처는 종료0이며 게임 assertion을 완화하지 않았다.
- 새 live 배율 검사를 준비하며 `I want you to enjoy reading books`의 안쪽 동명사와 `I want you to be reading books`의 비정형 진행을 잘못 우선하던 조합 오류를 발견했다. SVOC/NP/PP/연결 절 wrapper가 자식의 기존 구조 우선순위를 전달하지 않던 원인이었다. 그 값을 보존하고 14개 중첩 동치/진행/실제 분사 회귀를 추가했다. 점수를 높이는 선택 규칙이 아니며 잘못 붙던 동명사 배수가 사라지는 사례도 있다. 관련158검사 후 최종 전체 검사를 다시 실행했다.
- 이 발견 당시 final2의 core725/data/build·공식261browser·10,000덱은 종료0이었다. 이후 자동 원정 실행을 소유한 프로세스만 중단했고 final2 production은 NOT RUN이다. 중단한 파이프라인 종료는 -1로 남겼다. final3은 수정된 소스로 별도 새 실행이다.
- `tests/desert-score-browser.mjs` 추가 실행은 실제 지정 카드 Controller 공격과 정상 속도 연출의 새 operand/단계별 floor/멱등성을 검사했다. 9 PASS, 5캡처, 오류0, 종료0이며 자연 완주로 세지 않는다.
기존0.4 테스트는 명시적 legacy helper로 원래 기대값을 유지했다. 새 로비 버전 표시 기대만0.4→0.5로 바꾸었고 production 경계는 새 목표22/STAGE5_END로 확장했다. 첨부JSON 원본의 문법64/점수22/봉인26 기대값은 바꾸지 않았다. 봉인 fixture의 추상ID/cursor/턴은 유효한 실제 Controller 경계에 대응시켰으며 지정 모델임을 봉인 검토표에 명시했다. skip·assertion 삭제·오차 확대·강제 처치·실패 종료코드 변조는 없다.

## 보존과 미검증

변경 전0.4 golden은 registry hash·8덱·136보상과RNG·8상점·12공격을 독립 캡처했다. 새 구현으로 재생성하지 않고 기존 데이터와 대조한다. 0.1~0.4 버전 회귀/저장 경계를 유지한다. 원본 ZIP·기존 백업과 이번 중간 실패 로그를 보존한다. 고정 출력의 과거 증거71개는 이번 결과를 final3/fixed-output에 별도 보관한 후 SHA25671/71 일치로 복원했다. 의도한 코드·테스트·문서 변경이 있으므로 원본 전체가 동일하다고 주장하지 않는다.

실제 iPad/Android/Safari/Firefox/WebKit, 스피커 청취, 교사 최종 검수, OS 강제 종료/실quota, Stage6~10/전체48전투는 NOT RUN 또는 제공 범위 밖이다. Chromium touch emulation·headless 무음 영상은 이를 대신하지 않는다. 새 HP와 배수는 명세 초깃값이며 난이도 검증 완료값이 아니다.

main·Pages 설정·공개 배포는 변경하지 않는다. 개발 브랜치 push와 main 대상 PR은 검증 결과·허용 범위 diff를 검토한 후 진행하며 원격 결과는 아래에 추가한다.