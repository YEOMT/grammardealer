# 센텐스 발라트로 0.1.1 — Codex 프로젝트 인계

이 문서는 과거 Work 대화를 보지 못한 개발자를 위한 현재 구현 안내다. **이 인계본을 반영한 뒤에는 `YEOMT/grammardealer` 최신 main이 유일한 코드 기준**이다. 초기 설계에서 다시 생성하거나 0.1 ZIP으로 되돌리지 않는다. 0.1은 실제 플레이에서 정상 동작했고 사용자는 문장 조립 속도와 디자인에 만족했다. 0.1.1은 13개 플레이 피드백을 기존 코드에 통합한 패치다.

## 목적·기술·현재 콘텐츠

단어 카드를 물리 카드 단위로 조합하여 영어 문장의 구조로 공격한다. 문법 학습을 돕되, 범용 문법 검사기나 번역기는 아니다. 브라우저에서 전부 실행하는 Vanilla JavaScript + ES Modules + Vite 앱이다. 프레임워크, 서버, 로그인, 외부 AI API, 웹폰트 다운로드는 없다. Node 24/npm, Node 내장 테스트, Playwright Chromium을 사용한다.

여행자·난이도 1, 시작의 초원 Stage 1-1~1-3만 플레이 가능하다. 일반 적 91/156, 보스 286 HP. 지역은 기본 문형 ×1.25. 초원 종료는 `CONTENT_COMPLETE`이며 전체 스토리 클리어가 아니다. SVOO 등 후속 해금 ID는 기록되지만 다음 Stage를 실행하지 않는다. 향후 콘텐츠 metadata는 `src/data/roadmap.js`에만 있다.

## 가장 먼저 확인할 파일

| 파일 | 용도 |
|---|---|
| `AGENTS.md` | 변경 범위·검증·기술 유지 원칙 |
| `README.md` / `README_KO.md` | 설치·실행·플레이·배포 준비 |
| `spec/SentenceBalatro_0.1.1_Work_Patch_Prompt.md` | 이번 13개 변경 및 P01~P50 인수 조건 |
| `spec/00_START_HERE_KO.txt`, `01_WORK_SPEC_v0_1.md`, JSON seed/config/acceptance, FirstBuild | 보존된 초기 설계 근거; 변경사항은 0.1.1이 우선 |
| `docs/ARCHITECTURE.md` / `LANGUAGE_SCOPE.md` | 현재 모듈 책임과 지원 문법 경계 |
| `docs/PATCH_NOTES_0.1.1_KO.md` | 피드백별 구현 위치/동작 |
| `docs/TEST_REPORT.md`, `docs/evidence-0.1.1/` | 이번 실제 실행 결과와 캡처 |
| `docs/history/0.1/` | 과거 보고서. 이번 실행으로 재사용하지 말 것 |

## 핵심 실행 흐름

`src/main.js`는 페이지 라우팅, 설정/프로필, UI와 Controller 연결을 담당한다. `RunController`만 RunState를 커밋한다. UI는 명령을 보내고 복사된 상태를 그린다. deck/reward 함수는 Controller가 만든 제안 복사본만 수정한다. 상태는 직렬화 가능한 데이터이며 DOM/타이머/체크 Set을 넣지 않는다.

공격 확정 전에는 점수·맞음/틀림·역할 하이라이트를 보여주지 않는다. 첫 가이드 설명도 Grammar보다 앞의 guard다. 확인 후 snapshot → Grammar → Scoring → Rune → Stage로 계산한다. `AttackResolution`을 검증한 뒤 피해/턴/사용 카드/기록을 먼저 한 번 커밋하고 Presentation이 같은 `ScoreEvent.before/after`를 재생한다. `FINISH_PRESENTATION`은 타격을 재적용하지 않는다. 적 HP=0이면 마지막 턴에도 승리한다.

`VALID`/`VALID_WITH_ISSUES`만 공격한다. `INVALID_CORE`/`UNSUPPORTED`/`ENGINE_ERROR`는 카드/턴/교환/난수 상태를 보존한다. 오류를 정상 처리로 감추지 않는다. 문법 엔진은 카드 가격·룬·HP·한글 뜻을 읽지 않는다. 배수는 유리수로 저장하고 각 곱셈마다 내림한다.

## 반드시 보존할 정상 작동

- 클릭/드래그/회수/삽입/순서변경/맞교환/형태 메뉴/되돌리기와 빠른 DOM 반응.
- 한 물리 카드 ID는 DRAW/HAND/SENTENCE/DISCARD 중 한 곳에만 있다. 조합대 최대 16장. 기본 손패 한도 10, 첫패 6, 이후 턴 +3, 기본 교환 4회, 행동 6턴.
- 체크는 별도 버리기 선택이다. 본체 클릭과 혼동하지 않는다. 체크만으로 RNG/턴을 쓰지 않는다. 성공 EXCHANGE는 선택 수만큼 교환하고 교환 횟수만 1 감소한다.
- be는 원형으로 보인다. 사용자가 am/is/are를 직접 고른다. `I be happy`는 `BE_FORM_REQUIRED` 1건·-10·완전문장 보너스 제외. 과거/부정사/진행형 활성화로 확장하지 않는다.
- 28장 품사 수량 N6/P4/V8/Adj3/Adv2/Det3/Prep2. I/you/they + seed에 따른 he 또는 she. be 2장과 서로 다른 명확한 SV 동사 최소 2종.
- 첫 6장은 실제 SV 경로를 가진다. 초회 가이드는 동일 6장에 실제 주어+be+형용사와 여분도 제공한다. 표시 순서는 섞인다. 이후 드로우에 카드를 몰래 생성하거나 제거한 카드를 복구하지 않는다.
- 보상은 공개 후 frozen offer. R1/R3의 각 3칸 유형별 가중치 추첨 후 한 개만 얻는다. 연마/제거는 두 단계. 취소로 RNG/대상/후보/돈을 바꾸지 않는다. R2는 3룬, 최초 수정/호박/구리 예외를 보존한다.
- 카드 기본 10 + 연마 단계당 5, 최대 +3. 연마 뱃지와 합계 10/15/20/25는 같은 모델이다. 10종 룬 효과/레벨별 수치는 원본 유지, 발동 순서는 위→아래.
- 기본 처치 재화 2/2/6 + 처치 행동 이후 남은 턴 ×1. 준비도 행동 수에 포함된다. settlement ID와 offer ID로 이중 지급을 막는다. skip은 카드 칸이 있으면 +3, 없으면 +2를 팝업당 한 번.
- 튜토리얼은 성공 명령을 기록한다. 시작 순간 guideSeen을 세우지 않는다. 완료/건너뛰기/다른 합법 공격을 구분한다. 설정의 재연습은 별도 Controller/profile이며 실제 원정/저장/실적과 연결하지 않는다.
- 도감은 영어 원문과 기존 문법 진단을 유지한다. 검증된 작은 한국어 템플릿만 문장형 뜻으로 구성한다. play 다의성/긴 수식/PP/누락은 성분별 뜻. 의미로 감점하거나 전체 의미 오답 배지를 만들지 않는다.
- 연출 속도 1/1.5/2×는 새 읽기 시간을 기준으로 한다. 카드170/문법550/룬740ms, 긴 연쇄를 고정 2초로 압축하지 않는다. watchdog은 예상 총시간+여유. 효과 감소/동작 줄이기는 숫자/문법 읽기를 건너뛰지 않는다.

## 저장·버전 호환

IndexedDB 이름은 `sentence-balatro-v0-1`, object store `profiles`, `slots`, DB version 1을 유지한다. `playerId`와 표시명은 별개다. 프로필별 수동 3슬롯. 첫 조작 전 전투/보상/전투 사이/구간 완료만 저장한다. IndexedDB transaction 완료 후 성공을 알린다. 자동 저장/클라우드 동기화는 없다.

새 원정 version 0.1.1에 `contentVersions`를 기록한다. 저장 포맷 validator는 0.1.0과 0.1.1을 받아들인다. 기존 원정은 카드 두 장을 지우지 않고 기존 HP·공개 보상·명시 형태·난수 위치를 그대로 유지한다. 레거시 원정은 이후 전투/보상/처치 골드도 레거시 분기를 유지한다. 새 프로필이 아닌 이전 프로필도 삭제하지 않는다. 옛 문장 기록은 새 해석 필드가 없어도 열린다.

seed만 같아서는 모든 버전의 결과가 같지 않다. 동일 버전·설정·선택·해금 기준에서 재현한다. RNG 스트림은 deck/reward/shop/encounter 분리. UI 열기/닫기·의미 참고·대상 취소는 RNG를 소비하지 않는다.

## 테스트·QA 인계

수정 후 `npm test`와 `npm run build` 필수. 변경 영역에 따라 `validate:data`, 10,000 seed 덱 검사, `test:runs`, 실제 브라우저 검사를 실행한다. 현재 실행 근거는 TEST_REPORT의 정확한 수치/명령을 따른다. 과거 PASS를 복사하지 않는다.

브라우저: `npm run test:e2e`는 production dist를 자체 하위경로 서버로 띄워 UI로 3전투, 오프라인, 3슬롯, 도감, 재시작을 검사한다. `npm run test:browser`는 localhost:5173 개발 서버가 필요하며 입력/혼합보상/학습/VFX/4해상도를 검사한다. `?debug=1`의 read-only 상태 조회는 개발 환경에서만 존재한다. build에는 이 API가 없다.

최대 카드 수/특정 보상/연출 fault는 명확히 표시한 synthetic fixture다. 완주 시뮬레이션은 실제 Controller 명령·현재 손패 검색만 쓰며 적 HP를 수정하지 않는다. SV_ONLY의 일부 패배는 보고서에 기록한다. 모든 선택/seed의 무조건 승리가 목표는 아니다. Chromium touch emulation은 실제 iPad Safari 실행이 아니다.

## GitHub로 이어가기

저장소 루트에 본 소스 폴더 내용을 반영한다. `.github/workflows/deploy-pages.yml`은 main push/수동 실행에서 test → 데이터 검사 → build → Pages artifact → deploy를 수행하도록 준비했다. PR은 검사만 한다. Pages source는 GitHub Actions여야 한다. production URL은 <https://yeomt.github.io/grammardealer/>. Vite 상대 base와 hash routes를 유지한다.

이번 작업은 원격 저장소를 clone/push/merge하거나 Pages 설정을 변경하지 않았다. 실제 원격 파일/브랜치 보호/Pages 환경은 확인하지 않았으며 원격 CI·배포는 NOT RUN이다. 소스 반영을 요청받으면 먼저 실제 main을 읽고 차이를 확인한 뒤 작업한다. `dist/`를 소스 대신 main에 넣지 않는다.

## 미구현·후속 경계

Stage2/4·5형식/관계절/과거·완료·수동태/새 캐릭터/서버·랭킹/상점 확장은 이번 범위 밖이다. roadmap이나 해금 ID만으로 fake 실행하지 않는다. 물리 iPad Safari·다른 브라우저 QA, 실제 Pages 첫 배포, 저장 export/import 같은 후속 작업은 별도 요청 후 수행한다. 자세한 한계는 KNOWN_ISSUES와 NEXT_STEPS에 있다.
