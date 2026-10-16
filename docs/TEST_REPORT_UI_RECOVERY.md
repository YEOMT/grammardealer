# UI Recovery r2 · 0.10.2 실제 결과

2026-10-16. 시작 main `8df20b9a40ba5d12c1d10d9f63b35db5f9714347`에는 0.10.1/PR16이 이미 병합되어 있었다. 시작 작업 트리는 clean, 기존 브랜치·ZIP·증거는 보존했다. 작업 브랜치는 `codex/v0.10.2-ui-recovery-24-cards`. [이번 계약](../spec/ui-recovery-r2/Syntax_Atlas_UI_Recovery_Brief.md)이 이전 UI 지침보다 우선한다.

## 변경

- UI 커밋: `responsive.css`, `boardLayout.js`, `combat.js`, `ui/runes.js`. 높이에 따른 PC 로비 숨김과 조합대 flex 확장을 제거했다. 12장씩 두 줄의 고정 외곽과 독립 중앙정렬, 손패/조합대 공통 카드폭·영문 크기, PC 좌우 패널 및 좁은 창 상단 정보 배치, 중앙 점수/현재 효과를 복원했다. 2×2 룬 드래그의 행 선택과 실습 체크의 44px 클릭 영역도 확인·보정했다.
- 별도 24장 커밋: 새 `RECOVERY_VERSIONS`의 game/save/balance만 0.10.2. 이전 0.10.1 수치·콘텐츠 정책을 재사용하고 새 전투 rules snapshot만 24장이다. 파서와 scoring/rune snapshot의 물리 카드 수 상한을 버전별로 연결했다. 문법의 작업량 90,000·깊이6·후보128 제한은 그대로다.
- 각 게임 모듈의 명시적 버전 허용 목록에 0.10.2를 추가해 기존 보스/보상/상점/저장이 옛 정책으로 떨어지지 않게 했다. 관계절 보스의 저장 재판정도 실제 원정 registry를 사용한다. 카드 DB·HP·룬 배율·획득 비율·6턴·28장·47전투는 바꾸지 않았다.
- 다이아몬드는 기존 `>=10` 배율 그대로이며 **새 원정 설명만** 10~24장으로 표시한다. 구0.10.1 이하 저장/상품/RNG/설명/16장 제한을 새 정책으로 덮지 않는다. package/lockfile은 루트 버전만 변경, 의존성 변경 없음.
- 새 검사는 `ui-recovery.test.js`, `recovery-24.test.js`, `ui-recovery-browser.mjs`, `ui-recovery-production.mjs`. 기존 0.10.1 테스트 3개의 Controller import와 공용 fixture 선택을 역사적 0.10.1 helper로 고정했다. 기존 assertion/기대값 삭제·완화 없음.

## 실제 명령과 결과

Node24.19.0/npm11.17.0, 기존 로컬 런타임·Playwright1.51.1 Chromium134.0.6998.35 재사용. 다운로드·설치·시스템 PATH 변경 없음. 아래 명령은 저장소 루트 기준이며 개발 서버는 `npm.cmd run dev -- --host 127.0.0.1 --port 5173`이다.

| 명령/범위 | 결과 | 근거 |
|---|---|---|
| `npm.cmd test` UI 단계 | PASS, exit0 | 1,710 / 실패0 |
| `npm.cmd test` 24장/최종 코드 | PASS, exit0 | 1,718 / 실패0 / skip0 |
| `npm.cmd run validate:data` | PASS, exit0 | 3,112 checks |
| `npm.cmd run build` | PASS, exit0 | 117 modules; 기존 >500kB chunk 경고 유지 |
| `node --test tests/recovery-24.test.js` 초기 집중검사 | PASS, exit0 | 7검사; 마지막47전투 조건 추가 후 전체 회귀에 총8검사 포함 |
| `node tests/ui-recovery-browser.mjs` 대표 배치 부분 | 대표5 PASS, 작은 화면1 FAIL | 1920×900의3/12,1366×650의13/24,1180×820의24; 모두 손패14 |
| `SB_RECOVERY_FUNCTION_ONLY=1 node tests/ui-recovery-browser.mjs` | PASS, exit0 | 13검사,3캡처,실제UI공격2회(5/24장),영상 |
| `node tests/ui-recovery-production.mjs` | PASS, exit0 | production 신규실습 두공격40/126,저장,하위경로 3검사·10캡처·영상 |

브라우저 대표 배치는 `.local-validation/ui-recovery-r2/browser-functional-2/`의 실제 **배치 부분** 결과다. 그 실행 전체는 작은 화면 실패와 테스트의 guideHidden 측정 오류 때문에 exit1이었다. 조립 안내는 hidden 속성 대신 DOM에서 제거되는 실제 구현이므로 측정을 바로잡았고, 기능 부분만 별도 재실행하여 13 PASS를 얻었다. 초기 형태 ID/초원 입장 selector 오류도 테스트 도구 오류로 구분해 원본 로그를 보존했다. 실패한 전체 실행을 PASS로 바꾸지 않았다.

실습 기존 helper의 44px assertion이 production에서 실패한 뒤, 게임 CSS의 실습 체크 영역을 복원해 **동일 helper를 변경 없이** 완료했다. 이전 Work/0.10.1의 테스트 횟수를 이번 실행 결과로 재사용하지 않았다. 전체 로그는 `.local-validation/v0101/recovery-*`, 캡처·영상은 `.local-validation/ui-recovery-r2/`에 있다. 고정 출력 `timing.json`, `reward-distribution.json`은 이번 결과를 별도 보관하고 원래 파일로 복원했다.

## 핵심10항목

| # | 상태 | 실제 근거 |
|---|---|---|
| 1 로비 | PASS | 1366×650, 기존 두 줄 소개·새 원정 버튼; production 캡처 |
| 2 공통 카드 | PASS | 실제 같은 단어 DOM의 너비/font-size 비교; 카드 수로 글자 축소 없음 |
| 3 12×2 | PASS | 3/12/13/24 행 길이·중심·외곽 검사, 물리 ID 순서 일치 |
| 4 최대 배치 | PASS(대표 PC/태블릿) | 1366×650 및1180×820의24+14, HP/보스 상태/행동 영역 |
| 5 패널 | PASS(대표) | 버튼 실제 hit-test, 룬 효과 가시성, 2×2 룬 포인터 드래그 |
| 6 실제 제출 | PASS | 등록 카드/Controller 실제5장·24장 제출, 점수·combo·근거ID·charge/lunge/impact 및 잔류효과0 |
| 7 전체화면/방향 | PASS(에뮬레이션) | Chromium 실제 HTML fullscreen 진입/종료·모달, 상태 동일; portable 회전 안내 테스트 |
| 8 편집/모달 | PASS | 12↔13 경계 포인터 드래그·be형태·회수, 사전/도감/저장 닫기, IndexedDB 정확복원 |
| 9 24/구저장 | PASS | 17·24 정상 문법/피해,25 transaction no-op,구0.10/0.10.1의16 유지·위조한도 거부,24 INVALID_CORE 정상0피해 정산 |
| 10 기존규칙 | PASS(회귀·지정상태) | 전47전투 HP·22룬 데이터 동등성, 실제 마지막턴47승리·STAGE10_END·중복정산 거부,전체 회귀 |

구조 검사·지정 상태와 자연 원정은 구분한다. 24장 UI 공격은 등록된 덱/손패를 **명시적으로 지정**하고 손패10장 이하 배치로 나누어 실제 카드 클릭·형태 선택·제출했다. 자연 보상으로24장을 준비한 원정 증거가 아니다. production은 상태 주입 없이 새 프로필·원정·필수 실습을 실제 UI로 진행했고 28장·재화5·0.10.2/한도24 저장을 읽어 확인했다. 두 JS/CSS 요청은 `/grammardealer/`에서200, 페이지 오류0이다.

## 캡처와 한계

- [production 로비](validation/ui-recovery-r2/lobby.png)
- [넓은 PC · 12장](validation/ui-recovery-r2/wide-pc.png)
- [PC 일반 창 · 24+14](validation/ui-recovery-r2/windowed-24.png)
- [태블릿 가로 · 24+14](validation/ui-recovery-r2/tablet-24.png)
- [실제24장 채점](validation/ui-recovery-r2/score-24.png)

**FAIL 유지:** 844×390 최대24장에서는 문서높이472px·가로846px로 공간이 부족하고 상단 정보와 조합대가 겹친다. 명세가 허용한 작은 화면 한계로 공개한다. 3행·조합대 페이지·숨김·전체축소로 통과 처리하지 않았다. 화면 여백·글로우/색감의 세부 취향은 사용자 피드백 후 조정한다.

**NOT RUN:** 실물 태블릿/휴대전화, 이번 패치의 Firefox/WebKit 재검사, 전체 `test:browser` 역사적 묶음, 자연47전투/자연24장 덱 구축. 이번 UI 계약의 필수범위는 대표 Chromium·직접 관련 기능·전체 unit/data/build이며 기존 완주 증거로 대체하지 않았다. 개발용 sandbox는 기존16장 진단 도구로 유지했다.

검토 순서: 로비 → 새 원정 실습 → 일반 전투 조합/형태/교환 → 사전·도감·저장 → 전체화면 왕복. 구버전 저장은 UI에 `16장`, 새 원정은 `24장`을 표시한다. main 병합·auto-merge·Pages 설정 변경·공개배포는 하지 않는다.
