# PC 전투 UI 폴리싱

2026-11-25 · 기준 `origin/main@13f84736551bc33e2589d82f5b00e865dc9c49f1` (PR #39 병합). 시작 작업 트리는 깨끗했다. 이전 브랜치를 보존하고 `codex/pc-battle-ui-polish`에서 작업했다.

## 변경 범위

- `src/ui/pcBattlePolish.css`와 `src/main.js`의 CSS import 한 줄로 구현했다. 휴대기기가 아닌 1200×720 이상 PC 전투에만 적용한다. 좁거나 짧은 PC 창·터치 태블릿·휴대폰은 기존 스타일을 사용한다.
- 헤더와 패널 면/테두리/음영을 정리하고, 높은 PC 창에서는 지역 보너스와 HP 패널을 몬스터 몸체 가까이 나란히 놓았다. 원본 배경·몬스터 scale/접지/안전 한도는 그대로다.
- 좌우 패널과 조합대 사이 간격, 제목/자원 숫자, 상태 메뉴와 세 행동 버튼을 정렬했다. 기존 다섯 기능 중 마지막 설정 버튼만 두 열 너비로 표시한다. 네 룬도 1280×720에서 효과와 순서 조작까지 보인다.
- 손패 카드 사이 간격과 중앙 정렬, 더미의 높이/중심, dock 테두리를 정리했다. 카드 너비·높이·영단어 폰트·품사색·희귀도·선택 조작은 그대로다.
- 앱/패키지 버전, 언어/점수/원정/저장 정책을 변경하지 않았다. 게임 엔진·데이터·카드 렌더러·몬스터·오디오·PWA·모바일 CSS·의존성/lockfile 변경 없음.

참고 시안은 비율·정렬·대비만 참고했다. 시안의 카드·숫자·문구·장식·이미지를 production에 복제하지 않았다.

## 실제 화면과 측정

Chromium의 격리 프로필에서 실제 카드/Controller/렌더러를 사용했다. 룬·장수·보스 등은 지정 상태이며 자연 원정 완주 증거가 아니다. 캡처를 직접 열어 가독성과 잘림을 확인했다.

| 화면 | 수정 전 | 수정 후 | 손패 카드 아래 여백 |
|---|---|---|---|
| 1920×1080 PC | [전](evidence-pc-battle-polish/before-1920x1080.png) | [후](evidence-pc-battle-polish/after-1920x1080.png) | 14 → 14 CSS px |
| 1440×900 PC | [전](evidence-pc-battle-polish/before-1440x900.png) | [후](evidence-pc-battle-polish/after-1440x900.png) | 14 → 14 CSS px |
| 1280×720 PC | [전](evidence-pc-battle-polish/before-1280x720.png) | [후](evidence-pc-battle-polish/after-1280x720.png) | 14 → 14 CSS px |
| 1024×768 터치 태블릿 에뮬레이션 | 기존 배치 | [동일](evidence-pc-battle-polish/portable-1024x768.png) | 14 → 14 CSS px |
| 844×390 터치 휴대폰 에뮬레이션 | 기존 배치 | [동일](evidence-pc-battle-polish/portable-844x390.png) | 8 → 8 CSS px |

[1280×720 보스·4룬](evidence-pc-battle-polish/boss-1280x720.png) · [전후 좌표/카드 치수/검사 근거](evidence-pc-battle-polish/measurements.json).

PC 손패와 더미의 세로 중심이 일치한다. 비교한 카드 너비·높이·단어 폰트와 몬스터 scale/발 기준은 전후 동일하다. 태블릿/휴대폰의 측정 영역과 카드 좌표도 전후 동일함을 assertion으로 확인했다. PC 0/2/12/13/24장, 모바일 셋째 줄 접근, 빈 손패에서도 바깥 구역은 고정된다. 기존 12열/8열과 24단어 한도를 유지했다.

## 검사

개발 서버 `npm.cmd run dev -- --port 5174 --strictPort`, 기존 폴더 내 Node 24.19.0/npm 11.17.0/Playwright 1.51.1 Chromium 환경을 재사용했다. 이번 실행의 원본 로그는 ignored `.local-validation/pc-polish/`에 보존하며, 과거 고정 evidence 파일은 백업·복원했다.

| 실제 명령 | 결과/종료 코드 |
|---|---|
| `npm.cmd test` | PASS / 0 · 2,026 tests, fail/skip/cancel 0 |
| `npm.cmd run build` | PASS / 0 · Vite 8.3.2, 172 modules |
| `node tests/pc-battle-polish-browser.mjs` | PASS / 0 · 최초 8묶음, 아래 경계 보완 후 10묶음 |
| `node tests/ui-feedback0141-browser.mjs --section=T3-insert-swap-cancel --no-captures` | PASS / 0 · INSERT/맞교환/취소/최대 장수 |
| `node tests/ui-feedback0141-browser.mjs --section=T4-form-and-committed-loss --no-captures` | PASS / 0 · 실제 형태 변경/감점 근거/공격 표시 |
| `node tests/ui-feedback0141-browser.mjs --section=T6-mobile-visible-area-and-comma --no-captures` | PASS / 0 · 모바일 24장/쉼표/가시 높이310px |

브라우저 명령은 `SB_BASE_URL=http://127.0.0.1:5174/`와 `PLAYWRIGHT_BROWSERS_PATH`를 사용했다. `SB_PC_OUT`/`SB_FEEDBACK_OUT`으로 기존 증거와 분리했다. 새 PC 검사의 `SB_PC_PHASE=before`는 수정 전 캡처/치수 수집 모드이며, 기본 모드는 최종 기능 검사다. 수정 전 JSON이 로컬에 있을 때만 추가 전후 동일성 비교를 수행한다.

[명령 종료/로그 해시](evidence-pc-battle-polish/commands.json). 빌드의 기존 500kB chunk 경고는 남아 있다(JS 751.94kB, gzip 228.61kB). 이번 CSS 추가는 게임 JS 크기를 바꾸지 않았다. 성능 리팩터링으로 작업 범위를 확대하지 않았다.

실제 제출 버튼을 통해 `I go`를 공격하고 카드 복사본 표시, HP 감소, 턴 1회 소모, scoreTimeline 중 고정 외곽, 상단 view 수명 보존을 확인했다. 14장 손패 페이지·선택 유지·회수 한도, 룬 순서, 초원/항구 보스의 몸체 안전 영역도 검사했다. 테스트 UI/fixture 버튼은 게임에 추가하지 않았다.

새 검사 초안은 모바일 17~24장용 내부 스크롤 레일의 30px 폭 예약까지 ‘외곽 변화’로 잡아 1회 실패했다. 기존 모바일 정책에 맞게 외곽 고정 검사와 내부 셋째 줄 접근 검사를 분리했다. 기존 assertion 삭제·skip·오차 완화와 게임 규칙 변경은 없다. 원본 실패 결과는 `.local-validation/pc-polish/new-check-correction.json`에 보존했다.

## 한계와 인계

### 좁은 PC 창 경계 보완

동일한 최신 main과 PR #40을 격리 체크아웃에서 재검토했다. 최초 1160px 적용점에서 새 열/간격이 가로 넘침을 늘리는 문제가 확인되어 세 media query의 최소 폭을 1200px로 맞췄다. 1160×720에서 document 폭은 기존 1166px → 최초 폴리싱 1178px, 1180×720에서는 1180px → 1186px였다. 1200px 미만은 원래 스타일을 사용하므로 이번 폴리싱이 추가한 넘침을 제거한다. **1160px에서 원래 main에 있던 6px 넘침은 그대로이며**, 공유 레이아웃 정책까지 변경하지 않는다.

- 1200×720을 기존 전체 배치·0/2/12/13/24장·빈 손패 검사에 추가해 통과했다. [경계 화면](evidence-pc-battle-polish/after-1200x720.png).
- 1159/1160/1180/1199px × 720/900px에서 폴리싱 CSS 활성/비활성의 실제 좌표·카드·몬스터 치수가 동일함을 검사했다. 이 검사는 과거 로컬 baseline 파일에 의존하지 않는다.
- 최종 브라우저 10묶음과 기존 T3/T4/T6이 종료 코드 0으로 통과했다. 재검사에는 원래 main의 before JSON도 사용해 요구된 PC 3종의 카드/몬스터와 휴대기기 전체 측정값의 동일성을 확인했다. [검사 요약](evidence-pc-battle-polish/boundary-recheck.json).
- 경계 보완 후 Node 24.19.0/npm 환경에서 `npm.cmd test`를 재실행해 2,026 PASS(실패/취소/skip 0, 종료 0), `npm.cmd run build`도 종료 0을 확인했다. 기존 500kB chunk 경고는 동일하다. 최종 로그는 격리 체크아웃의 `.local-validation/recheck/final-unit.log`와 `final-build.log`, 해시는 위 검사 요약에 보존했다.
- 필수 PC 3종의 스타일은 이 경계 보완 전후 동일하여 위 전후 캡처가 최종 구현에도 유효하다. 1200×720과 모바일 최종 캡처도 직접 열어 확인했다.

### 미검증 및 유지된 제한

- 실제 iPad/iPhone/Android 터치·청취, 이번 Safari/Firefox, 자연 50전투 완주는 **NOT RUN**이다. 에뮬레이션을 실기기 검증으로 보고하지 않는다.
- 언어/데이터 변경이 없어 `validate:data` 로컬 재실행은 **NOT RUN**이다. 관련 단위 회귀와 UI 검사에 집중했다.
- 기존 1280×720 최대 24장에서는 장수에 따른 카드 축소 정책을 유지한다. 카드 디자인/폰트를 바꾸는 추가 폴리싱은 하지 않았다.
- main 병합·자동 병합·Pages 설정 변경·공개 배포는 수행하지 않는다. 이번 PR은 검토용 개발 브랜치만 제공한다.
