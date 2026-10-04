# v0.1.1 source migration and UI layout validation

## Source migration checkpoint — 2026-10-04

- Repository: `YEOMT/grammardealer`; working branch: `codex/source-migration-v0.1.1`.
- Base main: `16f3fb04194943541e7abf99903dce353cb1a41b`. Its history is retained; local backup tag: `backup/main-before-source-v0.1.1-20261004`.
- Source of truth for this initial import: the preserved local v0.1.1 handoff source. The source includes the approved `tests/ui-browser.mjs` `fileURLToPath` correction.
- Source files replace the five deployment-only root files on this development branch. Main is not changed. The manual build artifacts remain recoverable in the base commit and the local backup tag.
- Runtime source, data, package/lockfile, tests and fixtures, specifications, tools and the existing Pages workflow are retained. AGENTS clarifies the pre-merge source baseline and development from latest main after the source migration is merged.
- Generated outputs, duplicate screenshots, downloaded runtimes, caches and local environment dumps are excluded from Git. `docs/evidence-0.1.1/README.md` retains the output directory required by the tests. Original logs, ZIPs and backups remain in the local handoff workspace.
- The public baseline report has personal absolute paths replaced with relative references. Historical PASS results remain historical.

At this import checkpoint the browser suite is **known to fail**: the Windows path error is resolved, but the 1366×768 synthetic maximum-card fixture overlaps the controls and hand. The previous actual result was **11 completed UI check records / 5 screenshots**, then assertion failure. Unit tests (207), data validation (2,251), build and production E2E (6 attacks, three battles) passed in the preceding local execution; these are not yet new-checkout results.

The UI correction and its final verification will be recorded separately from this import commit.

## Deployment boundary

The existing workflow triggers build validation for main-targeted PRs. Uploading the Pages artifact and deploying both require `refs/heads/main` and a non-PR event; deployment also requires a successful build. A development-branch push does not trigger deployment. This migration does not change Pages settings, merge into main, enable auto-merge or publish a site.
