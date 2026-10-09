# 0.6.1 UI·지역 테마 검토

## 적용 범위

`ui/models.js`의 운영 표시 모델은 실행과 같은 `operationSpec`에서 획득 수·사용 후 목적지·연마 한도를 읽는다. 보급/탐색 +1은 획득 수를 늘리지 않고 재사용 이동을 표시한다. 신규 5종은 +1에서도 전투당 1회다. 상점과 혼합 보상 대상, 연마 전후 설명은 WORD의 점수 문구와 OPERATION의 효과 문구를 구분한다.

빙정 WORD/임시 탐색은 실제 카드 body와 footer 모두 옅은 푸른색이다. WORD의 품사 띠와 OPERATION의 운영/사용 표식은 별개이며, 임시 탐색은 `이번 전투 한정`과 연마 불가를 설명한다. 선택·초점·판정 강조는 바탕을 덮지 않는다. 드로우/버린 더미/사용 완료/직접 탐색의 실제 사본 표시도 공통 카드 렌더러를 쓴다.

`applyStageTheme`는 새 0.6.1 화면에 지역 ID를 설정하고, 로비 또는 구버전 화면에서 지운다. 지역 소개/전투/상점/완료는 같은 정적 배경 토큰을 읽는다. 별도 입력 레이어·이미지 요청·전체 화면 필터·반복 애니메이션은 추가하지 않았다.

## 사막 보존 기준

수정 전 최신 main에서 기존 `assignedSphinx('ui.desert.before')`를 실제 Chromium으로 렌더링하여 전투·소개 PNG와 계산된 gradient/패널 background/border를 보존했다. 이 상태는 UI 비교용 지정 상태이며 자연 원정이 아니다. 당시 원본 CSS와 PNG는 로컬 `.local-validation/v061/ui-baseline/`에 보존한다. 재현 가능한 계산 스타일 기준은 `tests/fixtures/v061-desert-theme-baseline.json`이다.

기존 `.desert-combat`, `.desert-page`, 사막 패널 색상 규칙은 수정하지 않았다. 새 지역 override에서 Stage 5를 제외했다. 이전 버전 원정도 기존 배경을 유지한다.

## 실제 실행 결과

이번 결과는 로컬 Vite의 **지정 물리 상태 + 실제 UI 입력/Controller/문법·점수·연출** 검사다. 합성 기대값을 PASS로 복사하지 않았다. 자연 원정이나 production 완주의 증거로 쓰지 않는다.

| 실행 | 결과 | 근거 |
|---|---|---|
| `node tests/polish-061-browser.mjs` | PASS, 종료 0 | Chromium 52검사/48캡처, Firefox 11/9, WebKit 11/9. 총 74검사·66캡처 |
| `node tests/polish-061-edges-browser.mjs` | PASS, 종료 0 | Chromium 지정 상태 20검사·5캡처 |
| 실제 합성 배경 픽셀 대비 | PASS, 종료 0 | 7상태 × 12표본 = 84표본, 최소 5.273:1 |
| 사막 before/after | PASS | 원본 계산 gradient와 전투/소개 패널 background·border가 정확히 일치 |
| 실제 iPad/Android/Safari·스피커 청취 | NOT RUN | Playwright WebKit 결과는 실제 Safari 기기 검증이 아님 |

`npm.cmd run test:browser:061`의 최종 묶음 실행은 2026-10-09 10:04:56~10:07:38 UTC에 종료 0으로 완료했다(74+18검사). 이후 COMMON 재활용 혼합 보상 UI 2건을 추가하고 확장된 경계 파일 전체 20건을 다시 실행해 종료 0을 확인했다. 두 실행은 [묶음 명령](validation/v0.6.1/ui-command.json), [확장 경계 명령](validation/v0.6.1/ui-edges-command.json)으로 구분한다.

브라우저 엔진은 Chromium 134.0.6998.35, Firefox 135.0, WebKit 18.4다. 원본 로그와 모든 PNG는 로컬 `.local-validation/v061/ui-final/`, `ui-edges-reward-final/`에 보존한다. 공개 증거는 [집중 결과](validation/v0.6.1/ui-results.json), [경계 검사](validation/v0.6.1/ui-edges-results.json), [대비 결과](validation/v0.6.1/ui-contrast-results.json), [실행 요약·실패 이력](validation/v0.6.1/ui-summary.json)에 있다. 대표 UI PNG 25장과 대비 입력 PNG 14장을 공개하고 나머지 중복 캡처는 로컬에 보존한다.

### 실제로 확인한 흐름

- 세 엔진에서 운영 구매·연마, 보급/직접 탐색 +1을 재활용으로 회수한 뒤 **동일 사본 재사용**, 수동 저장/불러오기의 정확한 상태 일치.
- Chromium에서 영구 7종 각각 +0/+1의 실제 획득 수와 이동 목적지가 공유 `operationSpec`과 일치. 사용 전후 공격·교환 자원 보존.
- 세 엔진에서 Stage 4의 무료 연결어 선택 대기 → 저장 → 로비 → 불러오기 → but 선택 → 상점. 대기 상태·지역 테마·한 번의 입장 지급 확인.
- 세 엔진에서 실제 Stage 6 보스 초기화의 손패 7장/임시 탐색 1장, 실제 탐색 대상의 빙정 표시, 사용 완료 이동, 영구 덱 수/빙결핵 5개 보존. 빙정 WORD의 포인터 드래그와 회수도 실행.
- 세 엔진에서 지정된 실제 사본으로 `A room was too hard to show.`와 `I am often giving you a book.`를 클릭·형태 메뉴로 조립하고 실제 엔진의 VALID/양수 피해/타격 연출을 확인.
- 1024×768, 1280×800, 1366×768, 1920×1080 각각 손패 10/14장·문장 16장·룬 4개. 조작부와 손패 비중첩, 페이지 가로/세로 넘침 없음, 운영 사용/선택 버튼 44px 이상, 운영 이름 잘림 없음. 폭이 모자라면 손패 내부를 가로 스크롤하며 카드나 버튼을 숨기지 않는다.
- Stage 1~6 전투/소개/완료, Stage 2/4/6 상점과 로비 초기화. 운석 Lv1 설명 1.8/2.4 확인. 예기치 않은 page/console/resource 오류 0, 런타임 요청 origin은 해당 로컬 서버 하나.

추가 20개 경계 검사는 손패 10장에서 운영 사용 후 1장 획득, 대상 없음의 사용 비활성/교환 허용, source 단독의 자기 대상 금지, 탐색 취소, 취소·준비 후 오래된 대상 클릭 거절, 중복 use/finish의 정산 불변, 상점 연마 취소를 확인했다. 기본/신규 일회 source 재사용 거절, 동일 정의의 서로 다른 사본 사용, 운영 후 Undo의 상태 불변도 확인했다. 4개 해상도 모두 손패를 실제로 스크롤해 마지막 운영 버튼의 44px 영역과 hit-test를 확인하고 체크/설명 버튼을 클릭했다. 네 번째 룬까지 세로 스크롤해 설명도 열었다. 실제 보상 생성기의 시드 탐색으로 얻은 COMMON 재활용 1장·보호 WORD 슬롯·운영 최대 1장 구성을 그대로 렌더링해 확인했다(자연 획득 주장 아님). 중단·hidden·예외는 **브라우저 내 실제 presenter 모듈에 주입한 지정 상태 검사**다. 실제 OS 탭 전환 또는 production main 경로의 장애 시험으로 확대해 해석하지 않는다.

### 대비 측정 방법과 한계

`tools/measure-ui-061-contrast.py`는 브라우저가 합성한 PNG를 읽는다. 실제 글자가 있는 PNG와 동일 위치의 글자만 투명 처리한 PNG를 비교하여 **글자 잉크가 놓인 위치의 배경 픽셀**을 측정한다. 포커스 테두리가 글자 요소 사각형에 걸친 부분은 글자 배경으로 간주하지 않는다. 작은 글자 4.5:1, 큰 글자 3:1 기준을 낮추지 않았다. 재현 입력은 [ui-contrast](validation/v0.6.1/ui-contrast/report.json)이며 다음 명령으로 다시 계산할 수 있다.

```text
python tools/measure-ui-061-contrast.py docs/validation/v0.6.1/ui-contrast
```

빙정 품사/점수/단어/기간/운영 이름/설명/횟수/버튼과 지역 제목·적 제목·손패 제목을 정상/선택/hover/focus/비활성/연출 강조/효과 감소 7상태에서 측정했다. 이는 **선정한 84개 텍스트 표본**에 대한 결과이며 모든 UI 경계의 3:1 또는 앱 전체 접근성 인증이 아니다. 운영 연출 중 production main 잠금은 아래 별도 검사로 실제 확인했다.

### 실패를 보존한 수정 과정

초기 실행의 잘못된 룬 fixture ID, 탐색 취소 close 이벤트 대기 누락 등 도구 오류와 실제 최대 카드 배치 오류를 구분했다. 최대 카드에서 운영 버튼 폭 31px/이름 잘림/전체 높이 넘침을 재현하여 운영 카드 최소 폭과 0.6.1 세로 공간 배분을 수정했다. 초기 대비의 비활성 글자 4.465:1은 실제 CSS 문제여서 글자색을 더 어둡게 수정했다. 이전 HMR 서버에서 기록된 모듈 `ERR_ABORTED`도 실패로 보존하고 깨끗한 서버에서 최종 74개 검사를 다시 실행했다.

대비 도구는 자식 글자를 모두 숨기지 않거나 focus 테두리를 배경으로 세는 오류를 고쳤다. 추가 경계 도구는 빈 더미 교환의 즉시 재추첨 가능성, 비동기 dialog close, 탐색 중 준비 차단이라는 기존 정상 동작에 맞게 기대/대기 조건을 정정했다. 게임 기준·수치·허용 오차는 완화하지 않았다.

## 대표 캡처

[운영 연마 설명](validation/v0.6.1/ui/ASSIGNED-chromium-operation-polish-preview.png) · [무료 연결어 선택 복원](validation/v0.6.1/ui/ASSIGNED-chromium-stage4-pending-restored.png) · [빙정 탐색 첫 손패](validation/v0.6.1/ui/ASSIGNED-chromium-frost-support-opening.png) · [탐색 목록](validation/v0.6.1/ui/ASSIGNED-chromium-frost-search-list.png) · [사용 완료 영역](validation/v0.6.1/ui/ASSIGNED-chromium-frost-support-exhausted.png) · [1024 최대 배치](validation/v0.6.1/ui/ASSIGNED-chromium-capacity-1024-14.png) · [1366 최대 배치](validation/v0.6.1/ui/ASSIGNED-chromium-capacity-1366-14.png)

사막 [수정 전](validation/v0.6.1/ui/ASSIGNED-desert-combat-before.png) / [수정 후](validation/v0.6.1/ui/ASSIGNED-chromium-desert-combat-after.png). 모든 캡처는 지정 상태임을 파일명으로 표시한다.

설원 6-1~6-3 학습 경로와 production 자연 원정은 별도 검증 문서에서 다룬다. 본 검사로 해당 경로를 대신 PASS하지 않는다.

## A043 실제 production main 경계 검사

`node tests/polish-061-main-edge-browser.mjs`를 최종 dist의 로컬 preview 루트에서 실행하여 **3검사·2캡처 PASS, 종료 0**을 확인했다. 기록은 [실행 결과](validation/v0.6.1/ui-main-route-results.json)다. `/grammardealer/` 하위경로 완주 증거와는 별도이며, 이 검사의 URL은 `http://127.0.0.1:4176/`였다.

검증을 통과한 지정 원정·프로필을 새 브라우저 컨텍스트의 IndexedDB에 넣고, 이후 실제 배포 번들의 수동 불러오기와 UI만 사용했다. 개발 controller hook이나 production 상태 주입 함수를 추가하지 않았다. 실제 보급 +1 버튼을 클릭한 뒤 연출 중 동일한 이전 DOM 버튼에 중복 이벤트를 보내고, 잠긴 저장·로비 버튼을 클릭 시도하고 `#lobby` 이동도 요청했다. 사용 버튼은 읽기 전용 화면에서 제거되고 저장·로비는 비활성, 새 원정 버튼은 부재하며 route는 `#game`으로 유지되었다. 기존 저장 슬롯도 그대로였다.

완료 후 UI로 슬롯 2에 저장하고 **read-only IndexedDB 트랜잭션**으로 읽었다. 그 상태 전체가 같은 초기 원정에 Controller `USE_OPERATION` 한 번과 `FINISH_OPERATION` 한 번을 실행한 결과와 정확히 일치했다. RNG·runId·카드·턴·교환·영수증을 포함한 비교이며 영수증은 1개, 획득은 2장, source는 DISCARD다. 페이지를 다시 로드하여 실제 앱으로 슬롯 2를 불러온 뒤 추가 효과나 저장 변경이 없는 것도 확인했다. 예기치 않은 page/console/resource 오류는 0건이다.

초기 재시도의 연결 거절, preview의 잘못된 하위경로 URL, 읽기 전용 버튼 표현을 잘못 가정한 검사 실패는 로컬 원본 로그에 보존했다. 게임 코드를 바꾸지 않고 서버 URL과 검사 도구의 잘못된 가정만 정정했다.
