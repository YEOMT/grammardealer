# Syntax Atlas 0.6 실제 구현·검증

## 기준과 환경

작업 시작 fetch의 `origin/main`은 `94aedf6610ddceacafca832e7554def5a4bc6a65`(0.5.1 PR #8 병합)였다. 시작 checkout은 clean, 작업 브랜치는 `codex/v0.6-mirror-snowfield-frost-cards`다. ZIP/외부 MD는 SHA256 `99F7506483539949E9F7D84296713C155F6198C4DA94633F0584541AB9CD0DC3`로 동일하며 원본을 보존했다. 전체 명세는 `spec/0.6_MIRROR_SNOWFIELD.md`, 첨부 기대 JSON은 `tests/fixtures/v06-0*.json`에 보존했다.

Windows x64, Node24.19.0, npm11.17.0, Git2.51.0.windows.2, Vite8.3.2, Playwright1.51.1. 런타임은 checkout 기준 `../.local-tools/node-v24.19.0-win-x64/`, 브라우저는 `../.local-tools/playwright-browsers/`를 재사용했다. Chromium134.0.6998.35/Firefox135/WebKit18.4. 시스템 PATH·Codex 런타임·의존성 버전을 변경하지 않았다. package/lock의 루트 프로젝트 버전만0.6.0이며 새 QA 스크립트는 package.json에 추가했다.

원본 고정 증거71개를 `.local-validation/v06/evidence-before/`에 백업했다. 이번 실행의 로그/원본 영상/실험은 `.local-validation/v06/`, 공개에 필요한 결과/선별 캡처는 `docs/validation/v0.6/`다. 이전0.5.1 보고서와 공개 증거는 과거 기록으로 보존한다. 기존767검사 baseline과 이번851검사는 서로 다른 실행이다.

## 실제 명령

| 명령 | 상태 | 실제 결과 |
|---|---|---|
| 변경 전 `npm.cmd test` | PASS | 767, exit0; 이전 버전 baseline |
| 최종 `npm.cmd test` | PASS | 851/851, 실패0·skip0, exit0 |
| `npm.cmd run validate:data` | PASS | 2,962 checks, exit0 |
| `npm.cmd run build` | PASS | exit0, Vite production |
| `npm.cmd run test:browser` | PASS | 공식14개 스크립트 전체291 checks, exit0 |
| `npm.cmd run test:browser:polish` | PASS | Chromium core32/UI17=49, exit0 |
| `npm.cmd run test:browser:cross` | PASS | Firefox46/WebKit46=92, exit0 |
| `npm.cmd run test:browser:snow` | PASS | Chromium17/Firefox6/WebKit6=29, 캡처19, exit0 |
| `npm.cmd run test:decks:desert` | PASS | 4모드×2,500=10,000 시작 덱, exit0 |
| `npm.cmd run test:decks:snow` | PASS | 10,000 시작 덱+설원 opener/빙정 partition, exit0 |
| `npm.cmd run test:runs:desert` | PASS | 80명령 원정, 완료10·패배70·기술 오류0, exit0 |
| `npm.cmd run test:runs:snow` | PASS(실행/불변 조건) | 80명령 원정, 완료0·패배80·기술 오류0, exit0. 완주 검사 PASS나 사람 승률이 아님 |
| `npm.cmd run test:e2e` | PASS | 최종 production 실제 UI27전투/62공격/32 checks, exit0; 오류0 |
| 실기기/교사/스피커 | NOT RUN | 실제 iPad·Android·Safari 기기, 교사 최종 검수, 스피커 청취 미실행 |

최종 게임 소스는 final3에서 고정했다. 최종 test/data/build와 전체 browser/E2E의 명령 및 종료 기록을 별도 JSON으로 보존한다. final2에서 실행한 10,000덱/80원정 이후 게임 변경은 도감의 두 형태 설명을 구체화한 표시 문자열뿐이다. 해당 문구는 final3 브라우저에서 확인한다.

커밋 직전 새로 작성한 텍스트의 CRLF를 저장소의 LF로 정리했다. 원본 명세/첨부 기대값은 바꾸지 않았다. 이후 `npm.cmd test` 851/851(실패·skip0)와 `npm.cmd run build`를 다시 실행해 모두 exit0을 확인했으며, 모든 dist 파일의 SHA256이 final3 production 완주 빌드와 동일했다. [추가 확인 기록](validation/v0.6/post-format-verification.json)을 별도로 보존한다.

## 검증 수준

1. **합성 산술**: G001–G032와 S001–S009를 실제 parser/score로 실행한다. S 결과는 순서대로287/395/386/323/462/376/420/126/131. B001–B015는 순수 보스 상태 제안 입력이다. JSON을 production 정답표로 불러오지 않는다.
2. **지정 상태**: 실제 물리 빙정 사본, Controller 명령, IndexedDB, DOM/드래그/형태/체크/연출을 검사한다. F001–F020, 세 상점의 누적 제거6→8→10, 손상 저장 거절, HP1와 마지막 결정의 동시 처치 등이다. 영구 카드 정의나 HP를 할당한 fixture는 자연 플레이로 주장하지 않는다.
3. **자동 명령 원정**: 제한된 현재 손패 탐색 정책이 실제 덱·RNG·드로우·교환·준비·운영·보상을 사용한다. 새80회는0완주/80패배다. 다단계 재료 보존에 약한 정책 결과이며 사람 승률이나 밸런스 합격으로 해석하지 않는다.
4. **검토 시드 경로**: STANDARD / `run-sequence.54`의 정상 원정을 진행한 상태에서 실제 카드만으로 보스 경로를 확인했다. 준비2회와 교환4회, 295위력/1결정 → 1068위력/3결정·HP1·차단84 → 744위력/1결정·격파다. 마지막은 수량 enough를 사용하는 정상 SVO이며 비교 hit가 없다. 이 경로는 `tools/reviewed-snow-route.js`에서 실제 Controller 명령으로 사전 재생하며 사본이 없거나 판정/처치가 다르면 실패한다. 게임 상태/피해를 대입하지 않는다. 일반 자동 정책 성공률과 분리한다.
5. **Production UI**: final3의 `/grammardealer/` production 빌드에서27전투/62공격/32검사를 완료했다. 페이지·콘솔·실패 요청·HTTP 오류는 모두0이다. 세 번째 상점의 구매/저장/로드와5개 설원 전투, 보스 첫패2빙정,1→3→1개 결정 파괴, HP1/차단84, 두 번의 보스 중간 저장 복원, 마지막 결정과 동시 처치, STAGE6_END 저장/복원 및 새 원정 재시작을 확인했다. 새 독립 프로필, 정상 실습 스킵, 실제 버튼/형태/카드/상점/보상/저장, 초기 자산 로딩 후 오프라인. 본격 실습40/126은 별도 guided-browser47검사에서 실제 진행했다. 명세§12.3은 정상 스킵을 허용하며 실습 완료와 스킵을 합쳐 한 원정이라고 주장하지 않는다.

이번 production 경로의 운영 카드 사용은0회다. 운영 카드는 지정 상태/공식 operations·desert·snow 브라우저와 자동 원정에서 별도 검사했다. 설원6-1~6-3의 모든 가이드 문형을 각각 빙정으로 제출하는 별도 production 학습 코스와 `more water`/`twice` 대체 처치의 production 재현은 NOT RUN이다. 자연 완주에서는6-4 enough, 보스 too/as×2/more/enough의 실제 제출을 확인했고, 비교 없는 대체 처치는 수량 enough로 확인했다. `more water`와 일반 twice는 실제 parser/Controller 및 지정 상태 브라우저에서 검증했다. 이 범위를 더 넓게 주장하지 않는다.

설원 지정 상태 캡처19개와 production 캡처46개를 생성했다. 공개 선별 캡처는 `validation/v0.6/assigned-*.png` 8개와 `production-*.png` 6개로 구분했다. 무음 보스 영상 `production-frost-boss.webm`은 실제 원본 녹화에서 HP1 잠금·마지막 결정 동시 처치 구간을 약70초로 자른 것이며 재구성 영상이 아니다. 전체 원본은 로컬에 보존했다. 파일별 범위는 [증거 안내](validation/v0.6/README.md)를 따른다.

## 구현 선택과 기존 동작 보존

Stage6 HP760/830/900/970/1280, 비교1.8/최상1.9/동등1.8/정도1.5/+20/지역1.25는 명세 초깃값 그대로다. 시작28장, Stage1–5 HP, 룬 고점·순서, 상점 가격, 보상 확률, 튜토리얼, 운영 카드, 골렘·스핑크스, DB/슬롯/base를 보존했다.

설원은 기존 opener witness 기능에 형용사 서술문 우선을 요청한다. 빙정 표지와 비교 재료가 멀리 떨어져 시도하기 어려운 상황을 줄이는 접근성 선택이다. 실제 소유 재료만 쓰며 없으면 기존 다른 문형 fallback을 따른다. 전체 deck shuffle 뒤 안정적 swap으로 핵심 빙정1장/보스2장+다음3창을 확보하며, witness를 가능한 한 보존한다. 카드 생성·고정 조합대·손패 제한 우회·보상/상점 RNG 변경은 없다. 새로운 설원에만 적용한다.

원본 main을 별도 archive로 읽어 독립 생성한0.5.1 registry hash,8개 시작 상태,40개 보상,8개 상점,7개 공격 golden을 현재 구현과 비교했다. 현재 결과로 과거 기대값을 재생성하지 않았다. 이전 원정의22전투 종료도 실제 Controller 지정 진행으로 확인했다.

## 실패 이력과 테스트 변경 이유

- 첫 공식 browser는 로비 버전을 `/0\.5/`로 고정한 옛 검사에서 실패했다. 표시하는 새 버전0.6만 갱신했다. 과거 지정 상태의 문법·점수 기대값은 유지한다.
- 기존 polish UI의 도감17항목 기대값은 새 네 항목이 더해져21로 갱신했다. 제목/설명 가독성 검사는 유지한다.
- 과거 버전용 테스트 helper가 최신 기본 버전 일부를 상속했다. `legacy-05/051`은 contentVersions/manifest/config 전체를 명시적으로 고정하고 기존 기대값을 보존했다.
- 빙정 라벨을 좁은 footer에 길게 넣으면 네 줄로 줄바꿈되고 대비가 부족했다. ‘빙정’과 ‘이번 전투 한정’을 단어/점수/체크를 가리지 않는 위치에 나눠 표시했다. 10/14장과3해상도 캡처로 확인했다.
- final2 공식 browser는 speed2의 짧은 HP1 안내를 expect의 느린 재시도 간격이 놓쳤다. 게임 판정/시간/문구를 바꾸지 않고 `requestAnimationFrame` 주기로 같은 정확한 문구를 관측한다. 후속 설원29검사는 통과했다. 타임아웃이나 예외를 무시하지 않는다.
- 첫 production 시도는 골렘 미래 부위에서 QA 도구가 `No finite QA move`로 중단했다. 2턴/빈 손패 공간이 남으면 합법적인 준비 후 마지막 턴 공격이 가능한데 조작 도구가 먼저 종료한 문제였다. 기존 Controller 정책처럼 마지막 준비 기회를 실행하도록 고쳤다. 첫 실행은 완주로 세지 않는다.
- S005 첨부 산술표의 +5 분류는 ADJECTIVE_ADD지만 실제 twice는 부사 수식이다. 최종462와 +5 수치는 일치한다. 생산 코드를 잘못된 분류에 맞춰 바꾸지 않았다.

## 남은 한계와 검토 순서

범용 자연어 분석기가 아니라 등록된 학교 문법 구성 요소와16장/작업량 한도 안에서 판정한다. 교사의 최종 어휘·교육 문구 검수는 아직 없다. 현재 자동 정책0/80완주와 보스 재료 보존 난도를 사용자 플레이로 추가 평가해야 한다. HP나 확정 배수를 자동 결과에 맞춰 낮추지 않았다.

사용자 검토는 새 프로필 실습/정상 스킵 → 기존5지역/두 상점 → 설원 소개/세 번째 상점 →5전투의 빙정 조합·교환·형태/드로우 → 사슴의 결정 수·HP1·중간 저장·마지막 결정 →STAGE6_END 순서다. 실제 시드 경로는 `run-sequence.54`/STANDARD이며 보상 선택도 결과 JSON의 명령을 따라야 같은 덱/RNG가 된다.

공개 문서는 상대 경로를 사용하며 원본 로그/영상과 시행착오 검색은 로컬에 보존한다. main 직접 push·merge·auto-merge·Pages 설정 변경·공개 배포는 하지 않는다. 기존 workflow는 PR에서는 검증/build만 하고 배포는 main 비PR로 제한되어 있어 수정하지 않았다.

## 원격 반영

구현 커밋 `41529ade69119ab09c3166a8a673d6b097ae58cf`를 `codex/v0.6-mirror-snowfield-frost-cards`에 push하고 [main 대상 PR #9](https://github.com/YEOMT/grammardealer/pull/9)를 생성했다. PR은 open이고 auto-merge는 꺼져 있다. push 직후 원격 main은 시작 SHA `94aedf6610ddceacafca832e7554def5a4bc6a65`와 같았다. GitHub 연결 도구의 PR 생성은 권한403으로 실패했으나, 기존 YEOMT Git 로그인의 인증정보를 메모리에서만 사용한 GitHub API 생성은 성공했다.

인수표 최종 집계는 PASS172 / FAIL0 / NOT RUN1(P171 실기기·교사·청취)이다. 개별 항목 PASS는 표에 적힌 검사 수준을 뜻한다. 별도 production 학습 코스 등 위에 명시한 추가 미검증 범위가 없어졌다는 뜻은 아니다. 로컬 검증 결과와 원격 CI 상태는 구분한다. 이번 작업에서 시작한 개발 서버와 브라우저는 종료했다.
