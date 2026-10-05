# Syntax Atlas 0.4.0 실제 검증 보고서

이번 실행일은 2026-10-05다. 작업 시작 최신 origin/main은 `db9f6ca508329b2306ef7a5a6916bb5ea404c418`(0.3 PR #5 병합), 루트는 `grammardealer/`, 브랜치는 `codex/v0.4-sky-islands-operations`다. 시작 checkout은 clean이었다. 첨부 ZIP의 전체 명세를 `spec/0.4_SKY_ISLANDS.md`에 보존하고 JSON을 기대값 fixture로만 사용했다. 아래 PASS는 이번 실행이며 과거 Work 결과를 재사용하지 않았다.

## 최종 결과

| 실제 명령 | 종료 | 결과 | 범위 |
|---|---:|---|---|
| 기준 main `npm.cmd test` | 0 | PASS | 변경 전455 tests |
| 기준 main `npm.cmd run build` | 0 | PASS | 변경 전 production |
| 최종 `npm.cmd test` | 0 | PASS | 583 tests, FAIL/skip/cancel 0 |
| `npm.cmd run validate:data` | 0 | PASS | 2,669 checks,130 lexemes/129 active,307 forms/306 active,13 frames; OPERATION2종 별도 타입 검사 |
| `npm.cmd run build` | 0 | PASS | 65 modules, `/grammardealer/`; CSS46.58kB/JS325.56kB |
| `npm.cmd run test:browser` | 0 | PASS | 마지막 하늘섬까지 공식12개 스크립트 전부 완료; 아래 재실행 이력 포함 |
| `npm.cmd run test:e2e` | 0 | PASS | production 실제17전투,37공격,418입력 명령 기록,40캡처 |
| `npm.cmd run test:decks:sky` | 0 | PASS | 네 모드 각2,500, 총10,000 새 덱/실제 witness/6장 opener, 오류0 |
| `npm.cmd run test:runs:sky` | 0 | PASS | 실제 controller80원정:7완주/73정상패배/기술·정책 오류0 |

최종 명령·UTC 시각·종료 코드는 [commands.json](validation/v0.4/commands.json)에 중간 실패까지 남겼다. 최종 core 명령은 `.local-validation/v04/final2/`, 브라우저 최종 성공은 `.local-validation/v04/final-browser/`, 자동 원정은 `.local-validation/v04/sky-runs-refined/`다. 원본 로그와 전체 캡처/영상은 로컬에 보존하며, 공개 요약·선별 캡처는 [validation/v0.4](validation/v0.4/README.md)에 있다. 내부 검사 Pxx는 과거 스크립트의 식별자이며 0.4 인수117항목과 동일 번호 체계가 아니다. [P001–P117 대응표](ACCEPTANCE_0.4.md)가 이번 인수 기준이다.

## 환경

Windows / Node24.19.0 / npm11.17.0 / Git2.51.0.windows.2 / Vite8.3.2 / Playwright1.51.1 / Chromium134.0.6998.35. Node는 `../.local-tools/node-v24.19.0-win-x64/node.exe`, npm은 같은 폴더의 `npm.cmd`, Git은 `C:/Program Files/Git/cmd/git.exe`, 브라우저는 `../.local-tools/playwright-browsers/`다. 기존 환경을 재사용했고 PATH/PLAYWRIGHT_BROWSERS_PATH는 검사 프로세스에만 설정했다. 이번에 의존성을 재설치하거나 업그레이드하지 않았다. lockfile의 앱 루트 버전 두 곳만0.4.0으로 갱신했다.

## 브라우저 실제 실행

| 묶음 | checks | 캡처 | 구분 |
|---|---:|---:|---|
| 기존 입력/보상/학습/VFX B/C/D/E | 3/4/4/8 | 고정 증거 경로에 별도 보존 | 실제 DOM 및 지정 보상/타격 상태 |
| 기존 최대 카드 UI | 41 | 25 | 지정 상태, 과거41을 복사하지 않고 이번 재실행 |
| 항구/상점/저장 | 29 | 19 | 기존0.2 지정 상태 |
| 실습 | 47 | 27 | 실제 안내 입력, 숨김은 합성 visibility event |
| 문법 학습 | 28 | 28 | 4해상도 실제 입력/기록, 구버전 수치 fixture |
| 협곡 | 23 | 18 | 기존0.3 시간/골렘/룬/화면 지정 상태 |
| 새 형태/브랜딩 | 6 | 4 | 3해상도, be8형태 keyboard/Chromium touch |
| 운영 | 14 | 12 | 실제 UI 사용/취소/재셔플/한도/복귀; 카드·전투 경계는 지정 상태 |
| 하늘섬 | 18 | 13 | 3해상도×10/14손패×16조합×4룬,SHOP2/보호막/절/실제IndexedDB3슬롯 |

공식 묶음의 보고된 check는 합계225개이며 서로 다른 실행 문맥의 검사 수다. 별도 production은25 checks다. 1024×768/1280×800/1366×768에서 조작부와 손패가 겹치지 않고 가로 손패 스크롤·44px 운영 버튼/체크·형태 메뉴·SHOP2가 사용 가능했다. 하늘섬 보호막과 전략 버튼 겹침은 개발 중 배치 조정 후 직접 geometry 검사와 캡처로 확인했다.

## 증거 수준의 구분

1. **합성 산술**: 실제 parser→score→rune→stage→shield를 호출한16개 첨부 점수 사례와 추가 경계.7장 SVC320 두 번,7장 SVO360 두 번의 HP640 설계 산술, 강한 룬 원킬, 잠긴 pack/생략that/구·관계절/작은오류를 분리했다. 실제 덱에서 동일 카드를 공짜로 두 번 만들었다는 뜻이 아니다.
2. **지정 상태**: `v04-progression`은 실제 엔진과 controller로17개 경계/두 상점/골렘을 통과하지만 물리 단어와+3 연마를 지정한다. 적HP는 낮추지 않는다. 운영 UI도 지정한 실제 사본을 사용한다. 이것을 자연 원정 완주로 세지 않는다.
3. **자동 명령 원정**: 현재 보유 카드/공개 탐색 대상만 사용하는80회, 7완주/73정상패배/오류0. HP·카드·피해 조작 없이 실제 보상·상점·드로우/RNG·교환·준비를 사용한다. 운영/운석 획득을 필수 전제로 하지 않는다. 유한 정책이며 사람 승률이나 실패 시드 불가능성의 증거가 아니다. 최초 단순 정책의4완주/76패배도 별도 보존했다.
4. **실제 production UI**: `STANDARD`, seed `run-sequence.19`,1366×768,일반 효과. 새 프로필에서 실습 두 공격40/126 → 일반0피해 제출1회 → 정상 공격34회, 총37회. 실제 손패/형태/공격/보상/상점 구매/골렘3부위/접속사 공격/문지기 해제/17전투 완료를 클릭했다. shadow controller는 읽기 비교·행동 선택에만 사용하며 production에 상태/HP/카드를 주입하지 않는다.418개 명령과 seed/선택을 [production-browser.json](validation/v0.4/production-browser.json)에 남겼다.

production은 초기 JS/CSS 로드 뒤 네트워크를 차단했다. 두 상점에서 저장→로비→불러오기→동일 상품/RNG, 골렘 부위 저장, 완료 슬롯 복원, 각지역 완료1회/스토리클리어0, 도감 열람 비변경, 새 원정과 공개debug차단을 확인했다. 페이지·콘솔 오류/실패 리소스/외부 런타임 요청은0이다. offline은 이미 로드한 앱의 계속 플레이이며 PWA나 오프라인 새 로드 지원이라는 뜻은 아니다.

이 자연 완주에서 운영 사용은 **0회**였다. 자연 획득 운영 사용을 완료했다고 주장하지 않는다. 보급/탐색/취소/재셔플/10장 한도/다음 전투 복귀/사용완료 저장은 별도 지정 상태의 실제 UI와 controller 거래로 검증했다. QA 문장은 문법 구조 검사 자료이며 교사가 검수한 자연스러운 학습 예문이라는 뜻은 아니다.

## 중간 실패와 기대값 변경

- 초기 통합571개 중5실패, 이후574개 중1실패: 새 have 덱과 최신 버전 기본값이 과거0.2/0.3 fixture에 섞인 문제였다. 과거 테스트는 명시적 legacy controller/starter view로 분리해 당시 기대값을 유지했다. 새0.4 실습/정상 덱/RNG는 별도 검사를 추가했다. 새 교육 항목에는 기존 설명 검사의 실제 예문 데이터를 추가했으며 학생 UI 고정 예문을 되살리지 않았다.
- 첫 공식browser는 현재 로비 버전을0.3으로 기대하던 검사에서 중단됐다.0.4 브랜딩 명세에 따라 그 기대값만0.4로 바꿨다. 이후 검사는 당시 NOT RUN이었다.
- 첫production은 Stage1 완료 프로필0건으로 실패했다.10초 bounded poll에서도 실패하여 타이밍 문제가 아님을 확인했다. 핵심 실패 학습 기록의 새 `primaryScoringClauseId`가 undefined여서 개인 기록 저장이 거절된 개발 중 회귀였다. 없는 절은 null로 직렬화하고 실패→정상→완료 프로필 회귀를 추가했다. 수정 빌드의17전투 UI 완주는 두 번 성공했다. 최종 poll은 저장을 실제 확인하고 같은1건 기대값을 유지한다.
- 두 번째 공식browser 중 파일 줄바꿈 정리로 Vite가 자동 reload되어 `learningController is not defined`로 중단됐다.개발 서버13:10:13 UTC reload로그와 일치한다. 게임 assertion 실패가 아닌 검증 실행 간섭이었다. 파일을 고정한 최종 전체12스크립트는 종료0이다.
- **첨부 S003 불일치**: 원본 기대 JSON은395다. 기존0.3 `home` 장소 부사+5를 유지하면 연결316 → 기존수식321 → 지역401이다. 원본 JSON을 고치지 않고 독립0.3 분석 증거와 예외 이유를 검사에 기록했다. 원본 산술 그대로는15/16일치, S003은 불일치다. 최종583개 PASS는 보존 정책401을 명시한 검사를 포함하며 ‘첨부16개 원문 모두 일치’라는 뜻이 아니다.

assertion 삭제/skip/오차 확대/종료코드 조작은 하지 않았다. HP·룬·자원·보상 외부 확률을 낮추거나 올려 통과시키지 않았다. 새 설계값과 사용자 확정값은 [패치 내역](PATCH_NOTES_0.4_KO.md)에 구분했다.

## 보존·남은 범위

변경 전0.3 golden은 덱8·보상56/RNG·상점8·공격12를 독립 캡처해 그대로 비교했다. 구버전0.1~0.3 회귀와 저장 종료 경계 검사를 유지했다. 새10,000덱은 이 golden의 대체물이 아니다. 이전 증거138개는 이번 결과를 별도 보관한 뒤 SHA256138/138 일치로 복원했다. 원본ZIP/기존 백업을 변경하지 않았다. 새로운게임 코드·테스트·문서가 있으므로 원본 전체가 동일하다는 주장은 하지 않는다.

NOT RUN: 교사 검수, 실제iPad/Android/스피커, Safari/Firefox/WebKit, OS저장quota/프로세스강제종료,0.4의1024 전체17전투 production, 기존별도160/80 자동 정책의 이번 재실행. 해당 UI크기/구버전 정책은 이번 공식브라우저·단위·golden으로 검사했지만 이 미실행 항목의 PASS로 세지 않는다. Stage5/전체48전투/운영강화/외부API/새서버는 구현 범위 밖이다.

원격결과는 `PROGRESS.md`와 PR head를 따른다. 브랜치 push/PR만 승인 범위이며 main 직접 push·merge·auto-merge·Pages 설정·공개 배포는 수행하지 않는다. 기존 workflow의 PR에서는 검증/build만 실행하고 Pages upload/deploy는 main 비PR로 제한된 조건을 유지했다.
