# 0.2 implementation plan

- Started 2026-10-04 (Asia/Seoul), branch `codex/v0.2-stage2-svoo-shop`.
- Fetched source baseline: `origin/main` = `2fdafeba8c93435844eef2d7aec0f3e25509bde9`. Working tree was clean. No older ZIP/source was copied over this checkout.
- Change specification: `spec/SentenceBalatro_0.2_Codex_Implementation_Prompt.md`, supplied by the user for implementation.
- Baseline on this exact main: `npm.cmd test` exit 0 (207 pass, 0 fail/skip); `npm.cmd run build` exit 0 (39 modules). Existing Node 24.19.0/npm 11.17.0/Playwright 1.51.1 reused; dependencies already installed from the unchanged lockfile.
- Baseline logs and preserved pre-run evidence: ignored `.local-validation/v02/`. Historical reports are not current test results.

## Integration sequence

1. Language/scoring: registered present SVOO for give/show/make/send, `for`, physical IO/DO NP roles, corresponding SVO PP metadata, Topaz and meaning fallback. Add an immutable version-selected language view for legacy runs.
2. Progression/boss: stage registry, independent Stage 1 milestone, Stage 2 normal rounds 4–6 and boss 7, one-time SVOO veil release, explicit old/new completion boundaries.
3. Entry/shop/reward: once-only 0–2 entry cards with a real bounded witness, fixed shop inventory using only shop RNG, atomic purchase/services, stage-aware mixed rewards.
4. Storage/UI: validate SHOP and Stage 2, preserve old profiles/slots/content pools, region preview and actual shop controls, synchronized IO/DO and veil presentation, 0.2 completion.
5. Verify: existing and new unit/data/deck/run checks, four-resolution UI regression, production subpath offline seven-battle UI play, seed/economy report, build, source review, branch push and PR.

## Preservation and ownership

Keep starter 28-card distribution, six turns/four exchanges/three-card draws, physical card conservation, separate selection discard and explicit be forms, mixed rewards, existing rune levels/order, tutorial actions, readable effects, main's maximum-card layout, local profile identity/DB/stores and manual three slots. Grammar/scoring/rune/stage engines remain pure; only RunController commits state.

New runs use 0.2 grammar and seven battles. Existing 0.1.0/0.1.1 runs retain their exact card/reward/RNG data, old active candidate view, and STAGE1_END. No global migration, automatic rescue, hidden dynamic HP, assertion deletion, or future runtime activation.

Stage 2 HP 220/300/380/640 and the specified shop prices are initial implementation values, not claimed balance results. Any adjustment needs measured evidence and a written reason.

Main, Pages settings, deploy workflow behavior, auto-merge and public deployment are outside this task's write scope. Only the development branch will be pushed. Completion, FAIL and NOT RUN will be recorded from actual execution in `docs/TEST_REPORT_0.2.md`.
