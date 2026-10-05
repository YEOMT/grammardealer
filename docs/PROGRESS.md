## 0.3 구현·로컬 검증 완료

Base origin/main d6535b6c8c74132a34e7eb56f778ef0eedcd3b24 (0.2.2 PR #4). Branch codex/v0.3-time-canyon. 최초 상태는 clean. A 기준/golden → B 언어 → C 점수/룬 → D 진행/골렘 → E UI/연출 → F 저장/전체 검증 순서로 구현했다.

455 unit / 2489 data / build / 공식 browser 전체 / 10000 덱 PASS. 시간 자동80회는24완주·56정상패배·오류0, 과거160회는38완주·122정상패배·오류0이다. 실제 production1366일반·1024효과감소는 각각12전투/24공격으로 오프라인 저장까지 완료했다. 동일 프로필 구/신 슬롯의 배수/위력도 실제 IndexedDB/UI에서 확인했다. 합성 산술·지정 UI·명령 원정·실제 production은 TEST_REPORT_0.3.md에서 분리한다.

역사적 증거138개 원본 해시 복원. 사용자 확정 수치와 설계 초깃값은 변경하지 않았다. 물리 기기/다른 브라우저 엔진/교사/스피커 NOT RUN. 구현8700a11을 push하고 [PR #5](https://github.com/YEOMT/grammardealer/pull/5)를 생성했다. 후속 문서 커밋은 PR head를 따른다. main 병합·Pages 변경·공개 배포는 이 작업 범위 밖이다.

## 0.2.2 개발 완료

구현 커밋 `8b8c539`, [PR #4](https://github.com/YEOMT/grammardealer/pull/4). 개발 브랜치 push 및 PR 생성까지 완료했다. main/Pages/공개 사이트는 변경하지 않았다.

최신 main 50b4311에서 시작한 codex/v0.2.2-grammar-learning-integrity 브랜치다. 제출 정산·문법/콤보 분리·동사 Frame·덱 사전/도감과 과거 교육 증거 보정을 구현했다. unit 342, data 2,371, build, browser 전체, production 7전투, 덱 10,000, 명령 원정 160(38완주/122정상패배/오류0)을 실제 검증했다. 상세 P01~P72·중간 실패·NOT RUN은 TEST_REPORT_0.2.2.md에 있다. main 병합·공개 배포는 하지 않는다. 아래는 과거 기록이다.

## 0.2.1 개발 브랜치

필수 Stage 1-1 실습, 카드 체크 통합, 충돌/처치 연출, 새 초원 HP를 구현했다. 실제 실행 결과는 TEST_REPORT_0.2.1.md에 분리 기록한다. 이전 보고서의 통과 수는 재사용하지 않는다. main 병합·공개 배포는 별도 검토 단계다.

# 0.2 integration completed

Branch: `codex/v0.2-stage2-svoo-shop`.
Starting main: `2fdafeba8c93435844eef2d7aec0f3e25509bde9`.
Implementation commit: `805c0e1496d7a7f177aebf4c354362cc9c6bb82b`.

The six implementation stages are complete: versioned SVOO/Topaz/meaning, stage registry and veil, independent Stage 1 milestone, entry grants/shop/rewards, current/legacy storage and UI, full regression and actual production seven-battle play. Stage 2 HP and prices retain the specification's initial values. Reports and selected evidence are committed separately after the implementation.

Final local verification on 2026-10-04:

- `npm.cmd ci --offline`, full 273 unit tests, 2,311 data checks, 10,000 starter decks and production build: PASS.
- Two QA policies, 160 actual controller runs: 40 complete / 120 defeats / zero technical errors. Every failed seed is retained; this is not human win-rate evidence.
- 400 actual Stage 2 entries: no technical error, missing witness, duplicate or unnecessary grant; actual purchase/restore/next-draw matched.
- Entire official browser bundle: PASS; old UI 41 checks/25 captures, new synthetic UI 29 checks/19 captures. Four viewports, hand10/14, sentence16 all +3 fit without smaller cards/buttons/fonts.
- Production UI: 1366 normal effects and 1024 reduced effects, each 23 real attacks and all seven battles offline. Real shop purchase, shop→lobby→load, completion reload, SVOO/veil, profile idempotence and next expedition verified.
- Historical fixed evidence: 69 files restored with matching hashes. Raw new/intermediate evidence remains in ignored `.local-validation/v02/`.

[TEST_REPORT_0.2.md](TEST_REPORT_0.2.md) records exact commands, scope, policy failures, old-test context changes and NOT RUN items. [validation/v0.2](validation/v0.2/README.md) contains public summaries and selected captures. No local verification remains blocked. Real devices/other browser engines are NOT RUN.

Publication scope is this branch and a main-targeted PR only. The PR head/checks and final task report are the authority for remote publication status. Main, Pages settings and public deployment remain outside this task's changes. Review the seven-battle sequence before separately authorizing merge/deployment. Future work starts from then-current main while preserving any unmerged branch or uncommitted work.
