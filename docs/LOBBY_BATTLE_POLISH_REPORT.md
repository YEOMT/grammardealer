# 로비·전투 후속 폴리싱 — 실제 결과

2026-10-29. 기준 `7964bf001506138de7d24afe3f7cbd7050ab66b9` (PR #24 병합), 시작 작업 트리 clean. 브랜치 `codex/lobby-battle-polish`.

## 변경

- 로비 전용 `lobby.css`: 청남색/청록 반투명 패널, 얇은 금색 경계, 금색 시작 버튼, 제목과 부분 음영. 좌측 소개/우측 설정과 모든 기존 입력·모달 유지. 새 프로필 클릭 후 재렌더된 이름 입력창에 포커스를 주도록 기존 끊어진 참조도 수정했다.
- 배경 하나를 기존 헤더+무대 두 grid 행 뒤에 배치했다. 상단 합계 높이와 중앙/손패 외곽 예산은 유지했다. 좌우 패널을 바깥으로 이동하고 HP 안쪽 여백은 PC 20×14px, 작은 창 16×10px로 조정했다.
- 몬스터 공통 배율 1→1.12, 발/중심 앵커와 idle/hit 공통 크기 유지. 돌진 FX 표적도 확대된 표시 영역을 읽는다.
- 라이브 계산 로그 DOM을 없애고 큰 누적 점수와 현재 효과/연산만 갱신한다. 확대 이펙트의 공간을 확보하고 overflow는 visible로 유지했다. 기존 전체 scoreTimeline과 공격 기록 표, 근거 카드/룬/입자는 그대로다.
- 손패 상단 padding 38→37px. 기존 하단 10px/버리기 4px는 재가산하지 않았다. 선택 카드는 3px 올려 3px 외곽 선택선을 포함한 하단을 일반 카드와 맞추며, 체크 버튼 키보드 포커스선은 내부에 표시한다. 카드 크기·폰트·dock 높이는 유지했다.
- 게임 데이터/문법/HP/룬/골드/저장/50전투, 상점 흐름, BGM 코드, package/lock/workflow 변경 없음.

## 실제 배경 교체

사용자 최신 `SyntaxAtlas_Assets/lobby/background.png` → `public/assets/lobby/background.png` 한 파일만 원본 바이트로 교체했다. PNG RGB 1672×941, 2,747,913 bytes.

- 이전 SHA256: `ba57df0eaa9a6bd3c7365cb729a8e33b4b7cb6edd60ebd295b2728ad0f7769d5`
- 신규 SHA256: `37596b3305ec1fa81e076b145c4ec8f86f697c3175aaae7d175629b1bec99dd2`

제공 폴더의 Stage 1/2 entry.png·combat.png 네 파일은 저장소와 해시가 같아 유지했다. 별도의 변경된 지역 원본은 없었다. BGM·몬스터·입력에 없는 파일·references 이미지는 복사/변경하지 않았다.

## 여섯 묶음 실제 확인

| 묶음 | 결과 및 범위 |
| --- | --- |
| 로비 | PASS — 이름/어휘/시드, 설정/기록/불러오기 접근, 실제 시작→입장→첫 전투. production의 기존 프로필 선택과 새 프로필 입력 포커스 확인 |
| 배경 | PASS — 한 장의 상단 레이어, 로딩 실패 시 외곽 유지. production `/grammardealer/`의 배경 5개 HTTP 200 및 원본 해시 일치 |
| 적 정보 | PASS — 실제 두 보스 초기화 상태에서 패널 충돌 없음, idle/hit 같은 rect·anchor, 장막 해제 전후 외곽 동일 |
| 점수 | PASS — 지정 카드의 실제 Controller 공격 `I run.` 위력/피해 130/130, `She will be giving me a kind book.` 647/132. 202/302개 표시 프레임에서 슬롯 넘침·라이브 로그 없음, 모든 이벤트 순서/중간값 및 공격 기록 전체 행 보존 |
| 손패/안정성 | PASS — 아래 대표 3화면, 빈 손패·14장 페이지·13/24장 조합대·선택/공격 전후 외곽 유지. 실제 항구 손패도 10px |
| 기본 회귀 | PASS — 단위 1,816개, 빌드, 직접 영향받는 기존 사막 점수 9개. 같은 지역 재렌더에서 BGM source startedAt 유지·소스 1개 |

| viewport (CSS px) | 표시 상태 | 카드/선택 윤곽 또는 빈 손패 예약선 아래 여백 |
| --- | --- | --- |
| 1366×768 | PC 창 | 10px |
| 1920×1080 | Chromium 실제 fullscreen API 활성 | 10px |
| 1180×820 | 대표 태블릿 가로 viewport | 10px |

가시 바닥은 visualViewport.offsetTop + height, 선택선은 outline-width + outline-offset를 포함했다. safe-area는 이 환경에서 0. 일반 PC 카드 87.484375×120px와 손패 dock 191px는 이전과 같다. 수정 전 일반 카드 여백 9px, 선택 카드 윤곽 여백 12px였다. 그림자 꼬리는 테두리 실측에서 제외한다.

## 명령·증거와 수정 과정

- `npm.cmd test`: exit 0, 1,816 PASS / 0 FAIL / 0 SKIP. `.local-validation/v0101/lobby-polish-final-unit/`. 고정 출력 timing/reward 원본은 실행 결과를 별도 보관한 뒤 복원했다.
- `npm.cmd run build`: exit 0. 이후 이름 포커스 1줄 UI 수정은 production 집중 검사와 빌드만 다시 확인했다. 최종 빌드 `.local-validation/v0101/lobby-polish-focus-build/` exit 0. 동일 단위 검사를 이유 없이 반복하지 않았다.
- `SB_POLISH_URL=http://127.0.0.1:5197/ node tests/lobby-polish-browser.mjs`: 최초 묶음 1/2/3/5 통과 후 점수 탄성 확대 2px 넘침 FAIL. 공간 수정 후 `SB_LOBBY_POLISH_FOCUS=score`로 묶음 4/6 PASS. 결과 각각 `.local-validation/lobby-polish/browser/`, `score-final/`에 보존. 실제 보스 초기화 추가 확인 `boss-check.json` PASS.
- `SB_V05_DEV_URL=http://127.0.0.1:5197/ node tests/desert-score-browser.mjs`: 최종 9 PASS, exit 0 (`legacy-score-clock/`). 과거 라이브 로그 기대값을 **동일 이벤트의 저장된 전체 기록 + 라이브 로그 없음**으로 바꿨다. 기존 위력 393/220, 배수/내림/피해/멱등성 assertion은 유지했다. 캡처 중 다음 이벤트로 넘어간 두 실패도 보존했고, 원래 타임라인의 정확한 시점으로 Playwright 테스트 시계를 진행시켜 해결했다. 게임 타이밍은 변경하지 않았다.
- production 검사: `.local-validation/lobby-polish/production.mjs`, exit 0. `production-final/result.json`. 첫 실행에서 발견한 새 프로필 포커스 실패는 수정 후 통과했다.

대표 캡처는 로컬 `.local-validation/lobby-polish/production-final/lobby.png`, `score-final/battle.png`, `score-final/score.png`, `browser/tablet.png`. 원본 로그/추가 캡처는 로컬에 보존하며 배포 파일에 넣지 않았다.

## 남은 범위

최종 집중 검사 실패 없음. 500kB 초과 번들 경고는 기존대로 남아 있다. 실기기/비영(非零) safe-area, 실제 청취, 전 브라우저, 자연 50전투/대량 seed는 **NOT RUN**. 색조·그림자 등의 미세 폴리싱은 사용자 피드백으로 남긴다. 지정 카드 검사와 자연 원정 완주는 구분한다. main 병합·Pages 설정 변경·공개 배포는 수행하지 않는다.
