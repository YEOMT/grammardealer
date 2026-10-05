# 0.2.2 선별 실행 증거

2026-10-05 Chromium 134 / Playwright 1.51.1. 전체 로그와 캡처는 로컬 `.local-validation/v022/`에 보존하고 대표 화면만 공개한다. 과거 Work 증거를 재사용하지 않았다.

## 실제 production 플레이

`tests/e2e.mjs`, 시드 `run-sequence.1`, 실제 새 프로필의 UI 조작이다. 1024×768, 일반 전투부터 음소거·효과 감소, 초기 리소스 로드 이후 오프라인. 적 HP/카드/피해/재화 주입 없음. 합성 정책 결과와 분리한다.

| 캡처 | 확인 내용 |
|---|---|
| [actual-invalid-feedback.png](actual-invalid-feedback.png) | 일반 전투의 실제 손패 1장 실패, 지정 0피해 안내 |
| [actual-invalid-after-turn.png](actual-invalid-after-turn.png) | 턴 6→5, HP 그대로, 버린 카드·다음 드로우 |
| [sentence-codex.png](sentence-codex.png) | 완료 화면의 영어/문법/위력 도감 |
| [stage2-complete.png](stage2-complete.png) | 실습·상점·항구를 거친 7전투 완료 |

1366×768 일반 효과 실행도 같은 23회 실제 공격으로 완주했으며 원본은 로컬 `final/e2e/`에 있다. production 요약의 URL은 하위경로만 공개하고 사용자 절대 경로나 프로필 저장 데이터 전체를 포함하지 않는다.

## 합성 카드 배치 + 실제 Controller/UI

아래는 `tests/grammar-learning-browser.mjs`의 합법 카드 fixture다. 원하는 문장을 실제 UI로 조합하고 실제 파서/정산/연출/기록을 이용하지만 **자연스러운 드로우로 얻은 원정 완주 증거가 아니다**. 1366/1920/1024/1180 네 해상도에서 28개 검사·28개 캡처를 생성했다. 1180 터치는 Chromium 에뮬레이션이며 iPad Safari가 아니다.

| 캡처 | 확인 내용 |
|---|---|
| [1366-locked-svoo-record.png](1366-locked-svoo-record.png) | 미해금 정상 4형식 위력 70 |
| [1366-unlocked-svoo-record.png](1366-unlocked-svoo-record.png) | 해금 후 같은 문장 위력 140 |
| [1366-whole-io-do-record.png](1366-whole-io-do-record.png) | my friend 전체 IO / a book 전체 DO, 위력 160 |
| [1024-develop-dictionary.png](1024-develop-dictionary.png) | develop SV/SVO·뜻·형태·보유 수·연마 안내 |
| [1024-legacy-codex.png](1024-legacy-codex.png) | 합성 과거 오분류 증거 보정, 근거 없는 문자열은 이전 기록으로 보존 |

## 명령 및 요약 데이터

[run-summary.json](run-summary.json)은 실제 명령 기반 두 자동 정책 × 4모드 × 20시드의 160회 결과다. 완주 38/정상 패배 122/오류 0. 정상 패배도 전부 남겼다. 사람 승률이나 시드의 절대 가능성을 의미하지 않는다. [validation-summary.json](validation-summary.json)은 마지막 명령 종료 코드와 브라우저 범위를 요약한다.

자세한 기대값 변경·중간 실패·NOT RUN·P01~P72 대응은 [TEST_REPORT](../TEST_REPORT_0.2.2.md), 판정 및 중의성 한계는 [동사 검토표](../VERB_FRAME_AUDIT_0.2.2.md)를 따른다. 교육 문구는 교사 검수 전 초안이다.
