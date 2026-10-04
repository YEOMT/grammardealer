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
