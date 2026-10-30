# Game Feel · Audio Stability 후속 패치

2026-10-30. 기준 `origin/main` **4ce13fb1ab5a8008639e04fd97891ff1dac150bd**, 브랜치 `codex/gamefeel-audio-stability`. 시작 작업 트리는 깨끗했고 이전 UI 패치는 main과 동일했다. 첨부 GameFeel_Audio_Stability ZIP 전체를 확인했다. 앱/원정 버전, 패키지·lockfile, 기존 에셋은 유지했다.

## 실제 원인과 변경

- 등록된 I / be(`form.be.was`) / a / clearly / big / student 사본으로 기존 `INVALID_CORE`, `MISSING_REQUIRED_COMPLEMENT`, 0위력을 재현했다. 최신 제출에만 `CLEARLY_AP_V1`을 적용한다. clearly를 degree로 만들지 않고 검수된 형용사 앞 용법만 허용하며 clearly→big→student 근거를 기록한다. 실제 지정 카드 공격은 정상 2형식, **192위력**이었다. 새 피해나 밸런스 계수를 만든 것이 아니다.
- 기존 버전 registry와 기록은 유지한다. 새 판정에 정책 표식을 남기고 보스 저장 receipt의 재검증은 당시 정책을 사용한다. 과거 기록을 새 성공으로 다시 쓰지 않는다.
- 이전 소스는 카드 편집마다 전투 root를 교체했다. 이제 같은 전투는 헤더·배경·몬스터 subtree와 observer를 유지하고 조합대/손패/변경 정보만 갱신한다. 컨트롤러 교체·전투 변경·튜토리얼 session 변경은 새 view다. 실제 앱 추가·회수·형태 선택에서 DOM identity와 대기 animation identity/진행시간을 확인했다.
- 기존 정상 공격은 복사본이 존재했고 재현 샘플에서도 CHARGE/LUNGE가 나타났다. 'PC에서 항상 누락'은 재현하지 못했다. 기존 집결은 축소 중심이고 기본 돌진 140ms였다는 소스 사실을 확인했다. 실제 카드 경계에서 복사본을 모아 몬스터의 그림 경계로 돌진시키며, 2배속에서도 집결 180ms·돌진 140ms 하한을 둔다. 원본 UI와 정산은 고정한다.
- 숫자의 가로 중심과 현재 효과를 분리했다. 실제 timeline 전부를 표시하고 감점은 붉은 주황, 방어 감소는 청회색 방패로 before→after·감소량·사유를 표시한다. 룬/콤보 광채·근거 카드 반응은 별도 FX이며 라이브 로그를 누적하지 않는다.
- 지역 변경 예약은 실제 지역 표시 뒤 3초, 이후 음원 준비 시 기존 1.5초 fade다. 준비 상점/같은 지역/빠른 전투 진입은 재생 위치와 예약을 유지한다. 이전 예약·늦은 load는 무효화한다. BGM 기준 0.8과 기존 SFX bus를 유지한다.
- trusted 탭/키 입력과 suspended/interrupted/closed 복구, bounded 초기화 재시도, 소리 패널을 연결했다. 기존 설정과 동일한 값이며 gain은 즉시 반영, 저장은 debounce/닫기 때 처리한다. 설정만으로 전투나 곡을 재시작하지 않는다.
- 실제 fullscreen capability/요청 실패에 따라 주소 복사·수동 복사·현재 화면 계속 안내를 제공한다. BASE_URL과 하위경로를 보존하고 debug query는 제거한다. 기존 전투 전 idle preview는 정상 동작하여 그대로 유지했다.

## 실행 결과

기존 `.local-tools` Node 24.19.0 / Playwright 1.51.1을 사용했다. 아래 최종 명령은 모두 종료 코드 **0**이다.

| 실행 | 결과 |
|---|---|
| `npm.cmd test` | **PASS 1,835 / 1,835**, FAIL/SKIP 0 |
| `npm.cmd run validate:data` | **PASS 3,112 checks** |
| `validateLanguageData(currentSubmissionRegistry)` | **PASS 3,112 checks**, 최신 제출 registry 별도 확인 |
| `npm.cmd run build` | **PASS**; 기존 단일 번들의 500kB 경고는 남음 (JS 약654kB) |
| `node tests/gamefeel-browser.mjs` | **PASS 10개 집중 묶음** |
| `node tests/gamefeel-recovery-browser.mjs` | **PASS 3개 보충 묶음** |
| 로컬 production `/grammardealer/` smoke | **PASS**; JS/CSS/배경/몬스터/BGM 요청, 소리 패널, 복사 주소. HTTP 오류/페이지 예외 0 |

집중 브라우저는 Chromium 자동화의 PC 1366×768 창모드/실제 fullscreen API 및 태블릿 1180×820 viewport다. 자연 원정이 아닌 **등록 카드 지정 상태**에서 정상/2배속/감점/항구 보스 방어 공격 4회를 정산했다. timeline 각각 12/12/13/7개를 전부 표시했고 중복 완료는 상태를 바꾸지 않았다. 가로 숫자 중심 오차 최대 0.008px, 공격 중 7개 주요 구역 경계 변화 0px, 태블릿 선택 카드 포함 실제 하단 간격 **14px**. 2배속 정상 공격의 집결/돌진/타격 표본은 9/7/2프레임으로 기록했다.

추가 지정 공격 3회는 실제 룬 4종/9콤보/21개 이벤트를 일반·효과 끄기·reducedMotion으로 처리했다. 각 FINISHED, 공격 1회 정산, FX 잔여 0. 탭 에뮬레이션에서 WebAudio running/SFX 요청, 실제 IndexedDB 슬롯 저장→앱 불러오기에서 HP77/6턴/6장 및 14px를 확인했다. 청취 검증은 아니다.

BGM 실제 buffer 검사: 준비 상점에서 이전 source 유지, 2.7초에도 이전 source 유지, 예약 후 약 **4.44초**에 항구 source 시작(3초 유예 + 로딩), fade 중 최대2개/종료 후1개. 로비 복귀는 이전 예약 취소. 단위 검사에서 정확한 3초 deadline과 복원/재시도/offset 보존을 별도로 확인했다.

## 기대값 정정과 실행 이력

- 기존 시간 검사는 모든 단계의 단순 배속 비례를 요구했다. 이번 가시성 하한에 맞춰 집결/돌진의 정확한 최소 시간을 검사하도록 정정했다. 이벤트 순서와 수치는 그대로 검사한다.
- 첫 전체 회귀는 **1,834 PASS / 1 FAIL**: 이전 언어 registry와 동일 객체라는 조건이 새 clearly 정책과 충돌했다. clearly 속성 외 모든 기존 필드/다른 sense의 동일성과 밸런스·룬·전투 정의 보존을 명시적으로 검사하도록 바꾼 후 전체 재실행이 1,835 PASS다. 실패를 삭제/skip하거나 허용오차를 넓히지 않았다.
- 초기 브라우저 계측의 별도 Vite HMR 모듈 참조, pointer-events:none FX에 대한 hit-test, 저장 fixture registry/접근성 selector 문제를 정정했다. 게임 오류로 보고하지 않는다.
- 보충 연출의 초기 실행에서 FAST_FORWARDED가 한 번 관찰됐으나 당시 사유는 수집하지 못했다. 진단 callback을 추가한 재실행은 세 경로 모두 FINISHED/예외0이었다. 원인을 추정해 재현된 게임 버그로 분류하지 않는다.

## 증거와 한계

원본/중간 실행 증거는 로컬 ignored `.local-validation/gamefeel-audio/`에, 필수 명령 로그는 `.local-validation/v0101/gamefeel-final-*`에 보존했다. 고정 출력 `timing.json`, `reward-distribution.json`은 이번 결과를 별도 보관한 뒤 기존 파일을 복원했다. 대표 캡처는 `check-03/pc-gather.png`, `pc-fullscreen-lunge.png`, `pc-penalty.png`, `tablet-sound.png` 4장이다. 마지막 소리 패널은 최종 production 빌드에서 캡처했다. 원본 BGM·PNG를 수정하거나 다시 만들지 않았다.

**NOT RUN:** 실제 패드/카카오톡의 청취·앱 전환 후 오디오 복귀·전체화면, 자연50전투 완주, 전 기기/브라우저 순회. 사용자가 확인할 것은 실제 소리, 다른 앱에서 복귀 후 재생, 인앱 전체화면/안내 세 가지다. 픽셀/색감 미세 조정은 후속 피드백으로 남긴다. UI/API 자동화 PASS를 실기기 성공으로 대체하지 않는다.

main 병합·Pages 설정 변경·공개 배포는 수행하지 않는다. 작업 브랜치와 main 대상 PR로 인계한다.
