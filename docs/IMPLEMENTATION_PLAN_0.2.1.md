# 0.2.1 implementation plan

Started 2026-10-05 Asia/Seoul from fetched origin/main `78999463640d834a6468a37eb2dd71831e721e84`, clean checkout. Branch: `codex/v0.2.1-guided-tutorial-feel`. Original source/ZIP and prior evidence remain preserved. Baseline: 273 unit tests PASS; build recorded in `.local-validation/v021/baseline/`.

Sequence: (A) baseline; (B) versioned grassland HP and fixed physical-card scenario/fast; (C) Controller guards, parked normal deck, completion and records; (D) targets, panels, explicit presentation gates and recovery; (E) integrated selection and impact/audio; (F) current/legacy storage, full regression, real tutorial and seven-battle UI, build and branch PR.

Preserve 0.2 stage/shop/rune/reward behavior and old saves. New tutorial completion is a separate profile flag; old guideSeen never implies it. General deck is generated once and parked. Tutorial only uses real moves, parser and scoring; no artificial damage or in-battle card creation. Tutorial user/hidden waits suspend animation watchdog budget. Interrupted display never silently completes instruction. Main/Pages/deployment are not changed.

Raw logs and backups: `.local-validation/v021/`. Final report will distinguish actual browser progress, synthetic boundary tests and NOT RUN.
