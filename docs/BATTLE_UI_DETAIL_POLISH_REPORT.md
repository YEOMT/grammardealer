# 전투 UI 디테일 폴리싱 · 2026-10-30

기준: 작업 시작 최신 `origin/main` **210a957811224ff9b9abbbd7df07cb942e33adcd** (PR #25 병합). 시작 시 미커밋 변경 없음. 브랜치 `codex/battle-ui-detail-polish`.
계약: `Syntax_Atlas_Battle_UI_Detail_Polish_Handoff.zip`의 `SPEC.md`. 사용자 추가 지시가 우선하므로 Stage 1·2의 기존 전투 전 소개에만 idle 이미지를 적용했다.

## 변경

- 손패 내부 위 여백 37→33px. 손패 외곽·카드 크기·글꼴은 그대로이며 더미와 화살표는 같은 카드 행의 중심을 사용한다. 버리기 버튼의 기존 4px 조정은 유지했다.
- 실제 원본 idle/hit 쌍의 공통 투명 영역 경계를 표시 메타데이터로 기록했다. 슬라임 목표 배율은 기존 대비 1.65배, 다른 체형은 개별 조정했다. 기존 발 기준을 유지하고 짧은 창에서는 무대 높이·좌우 패널 사이에 맞춘다. 원본 PNG는 수정하지 않았다.
- 기능 버튼 간격·대비, 지역별 패널 면·얇은 경계·그림자, 룬 보조 정보와 비활성 공격 버튼의 가독성을 조정했다. 빈 조합대의 중복 장수·회수 문구를 제거했다.
- 기존 전투 전 소개의 Stage 1·2 몬스터는 같은 BASE_URL helper로 idle 이미지를 표시한다. 이미지 실패 시 이모지로 돌아가며, 다른 지역과 지역 입장 화면은 유지한다.

문법·점수·룬 계산·HP·카드/보상·상점·저장·BGM·로비·50전투 정책, package/lockfile, public 원본 및 workflow는 diff가 없다. 변경 production 파일은 `src/services/sceneAssets.js`, `src/ui/{combat,monsterArt,progression}.js`, `src/ui/responsive.css`다.

## 실제 검사

Node 24.19.0 / 기존 로컬 Playwright Chromium. 아래 결과는 이번 실행이다.

| 명령 | 종료 | 결과 |
|---|---:|---|
| `node tests/battle-detail-browser.mjs` | 0 | PASS · 명세의 6묶음 |
| `npm.cmd test` | 0 | PASS · 1,816 / 실패·skip 0 |
| `npm.cmd run build` | 0 | PASS · 기존 500KB 초과 청크 경고 유지 |

집중 브라우저 검사는 기존 물리 카드 fixture와 RunController/Presentation을 재사용했다. 새 원정 자연 완주가 아닌 **지정 상태 UI 검사**다.

| 묶음 | 결과 및 실제 근거 |
|---|---|
| 손패·더미 | PASS · 0/1/6/10장, 14장 중 마지막 페이지 4장. 구역 고정·실측 하단 간격·더미/화살표 중심 확인 |
| 손패 조작 | PASS · 실제 클릭으로 배치→회수→체크→버리기. 선택 외곽 포함 간격, 카드 소유 목록 보존 |
| 몬스터 | PASS · 슬라임/큰 항구 보스의 양쪽 원본 로드·공통 배율/앵커·패널 비침범. 실제 일반전 생존/처치와 초원 보스 처치: 실제 HP 감소 81/77/400, 각각 공격 1회 정산 |
| 조합대·공격 | PASS · 3/13/24장, 행별 가로 및 묶음 세로 중앙정렬. 실제 3공격 중 구역 고정, 라이브 점수 스크롤·누적 로그 없음 |
| 스타일 범위 | PASS · Stage 1·2 팔레트, 장착 룬, 변경 전 카드 CSS 대조. 로비/상점 표시 스모크 및 전투 전 소개→실제 NEXT_BATTLE 진행. Stage 3은 이모지 유지 |
| 화면 크기 | PASS · Chromium PC 1366×768, fullscreen API를 사용한 1920×1080, 태블릿 가로 viewport 1180×820. 핵심 버튼 잘림 없음 |

### 실제 경계 (CSS px)

| viewport | 손패 하단 여백 | 더미/화살표 중심 오차 |
|---|---:|---:|
| 1366×768 | **10→14** | 0 |
| 1920×1080 전체화면 | **14** | 0 |
| 1180×820 | **14** | 0 |

1366×768 변경 전후 손패 카드는 87.484375×120px이며 영어 글꼴도 동일하다. 헤더·무대·중앙 3열·점수·조합대·행동 버튼·손패 구역 좌표는 같다. 측정은 `visualViewport`와 보이는 실제 카드/선택 외곽 기준이며 이번 환경의 safe-area는 0이다. 그림자 아래 바탕은 캡처로 확인했다.

슬라임의 최종 scale은 넓은 화면 1.848 (=기존 1.12×1.65), 높이가 낮은 1366×768에서는 1.428이다. 큰 항구 보스는 각각 1.5/1.164다. 실제 캐릭터가 패널이나 헤더를 침범하지 않도록 제한한 결과이며 무대를 키우지 않았다.

### 기대값 변경과 실행 한계

- 기존 `lobby-polish-browser.mjs`와 `scene-assets-browser.mjs`의 하단 목표 8–10px은 이번 계약의 12–16px로 변경했다. 몬스터 충돌 검사는 투명 PNG 캔버스 대신 원본 쌍의 공통 가시 영역을 대조한다. 이미지 쌍 일치·패널 비침범 assertion은 유지했다.
- 기존 로비 검사 초기화를 `tests/helpers/combat-ui-browser.js`로 공유해 이번 짧은 6묶음 검사에서 사용했다. 과거 전체 브라우저 묶음은 이번에 재실행하지 않았다.
- 초기 검사 2회의 실패는 검사 준비 오류였다: HP77 적을 생존 예시로 지정했으나 실제 공격이 처치함, 과거 상점 fixture에 현행 보스 보상 후 상점 정책 누락. 기존 HP132 적을 생존 예시로 사용하고 fixture의 흐름을 명시했다. 게임 규칙이나 assertion을 바꾸어 성공시키지 않았다. 실패 로그도 로컬 보존했다.
- 실물 태블릿·nonzero safe-area·타 브라우저·50전투 자연 완주·실청취는 **NOT RUN**. 이번 범위 밖이며 미세한 색감·그림자는 사용자 플레이 피드백으로 후속 조정한다. 확인한 범위의 기능 실패는 없다.

## 로컬 증거와 인계

대표 4장: `.local-validation/battle-detail/before-pc.png`, `final-browser/after-pc.png`, `final-browser/after-tablet.png`, `final-browser/between-battle.png` (뒤의 세 경로도 같은 battle-detail 아래). 지정 상태 캡처다. 브라우저 좌표·결과는 `final-browser/result.json`에 보존했다.

단위/빌드 로그: `.local-validation/v0101/battle-detail-final-{unit,build}/`. 기존 timing/reward 증거는 이번 결과를 별도로 보관한 뒤 원래 바이트로 복원했다. 로그·중복 캡처·원본 ZIP은 commit하지 않는다.

개발 브랜치와 main 대상 PR로 인계한다. main 병합, Pages 설정 변경, 공개 배포는 수행하지 않는다.
