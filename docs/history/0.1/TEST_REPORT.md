# 센텐스 발라트로 0.1 검증 보고서

검증일: 2026-10-03 UTC. 구현 기준: 첨부 `work-handoff-0.1.0-r1`의 전체 명세·설정·룬·제작목록·138개 인수사례. 첨부 별도 MD와 ZIP 내부 명세의 동일성을 확인했다. 기존 DS 게임 코드를 열거나 기반으로 사용하지 않았다.

## 결과와 범위

새 Vanilla JS + ES Modules + Vite 프로젝트에서 실제 Sentence Sandbox와 여행자의 시작의 초원 3전투를 구현했다. 실제 배포 파일을 임의 하위 경로에서 실행하고, 초기 파일 로드 뒤 네트워크를 끊어 카드 조립·전투·보상·완료 상태 저장을 검증했다. 최종 상태는 `CONTENT_COMPLETE / STAGE1_END`이며 전체 스토리 완료 횟수는 증가하지 않는다.

| 검사 | 실제 결과 | 증거 |
| --- | --- | --- |
| 깨끗한 의존성 설치 | `npm ci` PASS | 고정 `package-lock.json` |
| 단위·엔진·통합·저장 검사 | **188/188 PASS**, 실패·생략 0 | `evidence/unit.tap` |
| 언어 데이터 참조·활성 범위 | **2,251 검사 PASS** | `evidence/data-validation.txt` |
| 지정 문법 사례 | **G01–G48 PASS**, 실제 Sandbox에서도 48개 상태 일치 | `evidence/gate-b-browser.json` |
| 수작업 점수 기대값 | **S01–S15 PASS** | `tests/scoring.test.js`, 최종 TAP |
| 새 문장·범위 경계 | 하드코딩 정답 조회 없이 실제 파서 검사 PASS | `tests/grammar.test.js`, `docs/LANGUAGE_SCOPE.md` |
| 시작 덱과 첫 손패 | 네 어휘 모드 각각 2,500개, **10,000/10,000 PASS** | `deck-validation.json` |
| 실제 행동 기반 원정 시뮬레이션 | 네 모드 × 네 seed, **16/16 CONTENT_COMPLETE**, 오류 0 | `run-simulation.json` |
| UI 조작·최대 카드 수 | **36개 검사 PASS**, 네 viewport, 21개 캡처 | `evidence/ui-browser.json` |
| 배포 빌드 | **PASS**, 35모듈, 외부 runtime 요청 없음 | `evidence/build.txt`, `evidence/production-browser*.json` |
| 네 화면 크기 배포 게임 완주 | 각 3전투·실제 공격 4회·오프라인 저장 | `evidence/production-browser*.json` |
| 저장 실패·깨진 슬롯 복구 | 실제 IndexedDB 트랜잭션 강제 중단과 잘못된 row 거절 PASS | `evidence/storage-fault-browser.json` |
| 최종 ZIP 구조·무결성 | 소스와 배포본 분리, 배포 ZIP 루트·상대자산·CRC 검사 | `evidence/release-validation.json` |

138개 인수사례는 **137 PASS, P12 1건 OUT OF SCOPE**다. 사례별 실제 테스트 이름과 증거는 `acceptance-results.json`에 기록한다. P12의 오프라인 재시작은 이번 범위 밖이다. 아래 실기기 미검증을 인수사례 통과 숫자에 숨기지 않는다.

## 실행 환경

- Linux x86_64, Node **24.19.0**, npm **11.9.0**, Vite **8.3.2**.
- Playwright **1.51.1**, headless Chromium **134.0.6998.35**.
- 1366×768, 1920×1080, 1024×768, 1180×820 viewport.
- 로컬 Noto CJK/Emoji 글꼴. 게임 runtime에는 외부 글꼴·CDN·AI API·Firebase·네트워크 데이터 의존성이 없다.
- 이 실행 환경에서는 Node 테스트 격리를 끄고 실제 개별 테스트를 실행했다. 의도적인 실패 canary로 실패 검출을 확인했으며, 최종 로그는 TAP reporter로 생성했다.

## 문법·점수·덱

제작목록 116개 중 현재 활성은 115개다. `recently`는 과거/완료 Pack 검증 전까지 제외했다. 전체 형태 243개, 활성 형태 182개, 내부 Frame 5개다. 미래 문법 메타데이터만 있다고 정상 분석이나 점수를 지급하지 않는다.

수작업 기대값 48개와 추가 독립 조합을 함께 검사했다. 실제 카드 형태·명사구·형용사구·부사·전치사구·주절 구조에서 SV/SVC/SVO를 만들고, 일치/관사/격 복구와 근거 없는 입력의 안전한 미지원 처리를 확인했다. 10종 룬의 레벨·순서·중복 물리 카드 처리, 각 곱셈 직후 내림, 연마 중복 합산 방지, 지역 배율, 초과 피해를 검사했다.

10,000개 seed에서 역할 수·고유 카드 수·복제 제한·실제 1/2/3형식 경로·최초 6장에 정상 경로를 확인했다. **덱 보정률 0%, 덱 전체 fallback률 0%**였다. 역할별 밴드 후보가 부족할 때의 허용된 어휘 밴드 fallback은 별도 `bandFallbacks`로 기록했다. 이 수치는 전체 인간 승률의 증명이 아니다. 동일 Parser를 이용한 생성 검사에는 수작업 문법 기대값 검사를 병행했다.

16개 원정 시뮬레이션은 현재 손패 안의 유한 후보를 검색하고 실제 Controller 명령을 사용한다. 실제 준비·교환·공격·보상 선택을 기록하며 미래 드로우를 열어보거나 HP를 수정하지 않는다. 각 원정은 건너뛰기 없이 처치 골드 총10을 받고 완료했다. 정책의 후보 탐색과 인간 전략은 다르다.

## 실제 브라우저 동작

배포 검사 URL 경로는 `/nested/sentence-game/`이다. 운영 빌드에 개발용 상태 접근 객체가 없음을 확인했다. 실제 UI로 프로필 생성 → 초기 저장 → 정확한 불러오기 → 사전 확인 → 오프라인 전환 → 카드 형태 조립 → 준비·교환 → 첫 카드 보상 → 매 원정 1-2의 고정 첫 룬 후보 → 보스 → 보상 → 완료 저장을 수행했다.

브라우저 자동 플레이의 다음 수 선택은 초기 수동 저장의 복사본에 같은 Controller를 실행하여 계산했다. 브라우저 내부에 카드·정답·피해·승리 상태를 주입하지 않았다. 실제 UI로 같은 명령을 수행하고 마지막 IndexedDB 상태를 대조했다. 개인 실적은 원정/공격 ID로 중복 반영되지 않으며, 도감 재열기와 Sandbox 활동도 실적을 늘리지 않았다.

네 viewport에 로비·편집·형태 메뉴·교환 선택·룬 선택·점수 연쇄·타격·결과·저장·도감 캡처를 남겼다. `ui-<width>-*.png`는 조작 검사, 일반 이름과 `-1920/-1024/-1180.png`는 배포 게임 캡처다. `ui-capacity-*-synthetic.png`는 **10장 손패+16장 조합대의 격리 배치 검사**이며 전투 완주 증거로 사용하지 않는다.

클릭/드래그 중복 처리, 카드 사이 삽입, pointercancel, 키보드 Enter/Escape, 손패가 가득 찼을 때 맞교환, 크기 변경 후 카드/형태 보존을 검사했다. Chromium의 실제 CDP touch 이벤트로 탭·드래그를 검사했지만 물리 태블릿 검사라고 주장하지 않는다. 1024 배포 원정은 2전투부터 음소거·효과 감소를 켠 채 보스와 완료까지 진행했다.

연출은 정산 결과를 표시하고 상태를 다시 계산하지 않는다. 타격 전 HP 보존, 타격 순간 표시 변경, 예외/탭 숨김/취소 시 최종 상태로 진행 및 입력 잠금 해제를 검사했다. 별도 연출 harness의 연결선·합성 공격은 **연출 샘플 · 실제 판정 아님**으로 표시한다.

## 성능 실측

| 측정 | 표본 | p50 | p95 | 측정 범위 |
| --- | --- | --- | --- | --- |
| 문법 계산 | 240회 | 0.034ms | 0.087ms | Node, 대표 2–16카드 입력, 애니메이션 제외 |
| 카드 클릭 피드백 | 50회 | 13.1ms | 14.3ms | 이벤트 capture부터 다음 rAF에서 카드 영역 변경 확인 |
| 드래그 완료 피드백 | 10회 | 13.9ms | 15.8ms | pointerup부터 다음 rAF의 실제 카드 변경 |
| 공격 제출 피드백 | 10회 | 12.8ms | 22.1ms | 클릭부터 다음 rAF의 실제 presentation-locked 표시 |

입력 측정은 실제 앱의 저장 복원·현재 카드 조립·공격 확정으로 수행했다. 근거는 `evidence/ui-feedback-browser.json`이다. headless 데스크톱의 소프트웨어 응답이며 물리 입력 장치·화면 표시 지연이나 저사양 실기기 성능 보장이 아니다. 연출 전체 시간과 즉시 피드백은 구분한다. 격리 연출의 정상 한 회는 약1.760초였다.

## 저장·오류 복구

실제 IndexedDB `put` 요청 성공 시점에는 저장 Promise가 아직 PENDING임을 확인했다. 그 직후 native transaction을 강제 abort하여 저장이 거절되고 기존 슬롯과 메모리 플레이가 보존됨을 확인했다. UI는 성공 표시를 하지 않고 오류와 재시도 버튼을 제공했으며, 재시도로 새 저장이 완료됐다.

미래 버전과 존재하지 않는 카드 ID를 가진 실제 저장 row를 직접 넣었을 때 불러오기는 거절됐고, 원래 row를 지우거나 현재 원정을 바꾸지 않았다. 깨진 슬롯을 정상 저장으로 복구하여 다시 불러오는 과정도 통과했다. **실제 저장 공간을 채운 quota exhaustion 및 물리 디스크 실패는 NOT RUN**이다.

AudioContext 거부·부재, 이미지 자산 fallback, 연출 callback 예외, 숨김/취소, 중복 공격/보상, 비정상 저장 데이터의 방어 경로는 단위/격리 브라우저 증거를 함께 사용했다. 모든 환경의 장애를 재현했다는 뜻은 아니다.

## 발견·수정한 문제

- Node 테스트 파일만 성공 표시되던 실행 환경을 실제 개별 검사 실행 방식으로 수정했다.
- 같은 표면형 대명사의 형태 메뉴를 Form ID와 주격/목적격 설명으로 구분했다.
- 1024 및 1366 화면에서 문장16장일 때 행동 버튼과 손패 영역이 겹치던 배치를 수정하고 네 viewport의 최대 카드 수 기하 검사를 추가했다.
- 카드 사이 빈 간격에 놓는 드래그를 해당 위치에 삽입하도록 수정했다.
- 초기 브라우저 검사에서 모달 닫기·같은 표면형·보상 화면의 설정 버튼을 찾던 테스트 선택자를 실제 화면 상태에 맞게 수정했다. 이는 게임 상태를 강제로 통과시킨 것이 아니다.

최종 실행 기준 알려진 재현 실패는 없다. 아래 환경 검증은 완료되지 않았다.

## NOT RUN / OUT OF SCOPE

| 구분 | 항목 |
| --- | --- |
| NOT RUN | 실제 iPad/Safari의 터치·회전·오디오 |
| NOT RUN | Firefox/WebKit 전체 회귀, 학교 실제 브라우저 정책 |
| NOT RUN | 저사양 기기 장시간 플레이·배터리·실제 입력 장치 지연 |
| NOT RUN | 실제 quota exhaustion·물리 디스크 실패 |
| NOT RUN | 사용자 계정의 GitHub Pages 실제 공개 게시 |
| OUT OF SCOPE | PWA·Service Worker·브라우저 종료 후 오프라인 재시작 |
| OUT OF SCOPE | Stage2~10·최종전·상점 실제 이용·미래 Pack·온라인 기능 |

## 재현 명령

```bash
npm ci
npm test
npm run validate:data
npm run test:decks
node tools/simulate-runs.js
npx playwright install chromium
npm run build
npm run test:e2e
node tests/presentation-browser.mjs
node tests/overlays-browser.mjs
node tests/storage-fault-browser.mjs
```

별도 터미널의 `npm run dev`가 실행된 상태에서 `node tests/gate-b.mjs`, `node tests/ui-browser.mjs`, `node tests/ui-feedback-browser.mjs`를 실행한다. 후자의 두 스크립트는 `SB_UI_URL`로 개발 서버 주소를 변경할 수 있다.

배포 E2E는 `SB_VIEWPORT='{"width":1024,"height":768}' SB_E2E_PORT=4176 SB_EVIDENCE_SUFFIX='-1024' SB_EFFECTS_OFF=1 node tests/e2e.mjs`처럼 화면·포트·증거 이름을 바꿔 재현한다. 1366 기본값 외 나머지는 1920×1080, 1180×820이다. 독립 검사의 로그가 실제 증거이며, 스크립트 존재만으로 PASS를 계산하지 않는다.

최종 빌드 뒤 `npm run package`, `python3 tools/verify-release.py`로 ZIP을 생성·검사한다. 이 작업에서 저장소나 공개 사이트를 생성하지 않았다.
