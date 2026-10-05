# 0.4 implementation ledger

Base: origin/main `db9f6ca508329b2306ef7a5a6916bb5ea404c418` (merged 0.3 PR #5). Branch: `codex/v0.4-sky-islands-operations`. Initial checkout was clean. The authoritative spec is `spec/0.4_SKY_ISLANDS.md`; fixture JSON files are expectations, never runtime answers or test results.

1. A — baseline and immutable legacy goldens. COMPLETE: 455 unit tests and production build passed before changes. Independently captured 0.3 starter decks, reward RNG, entry/shop and attacks. Historical evidence backed up locally.
2. B — versioned WORD/OPERATION definitions, five physical partitions, fixed-have starter policy, rarity and forms/branding. Separate foundation commit. The new campaign becomes the default only after progression integration, so intermediate foundations do not silently upgrade existing runs.
3. C — transactional operations, rewards/shop pools, cards and target UI, operation storage.
4. D — bounded constituent/clause parser, coordination and content clauses, reviewed language/education data.
5. E — score order, shield, Stage 4 and second shop, explicit 0.4 campaign activation.
6. F — browser/production 17-battle play, regression, P001–P117 evidence, review tables, documentation, branch push and PR.

The supplied HP, multipliers and probabilities remain the spec's initial values unless explicitly identified there as user-confirmed. No main merge, Pages configuration or public deployment is authorized. Intermediate failures and NOT RUN checks remain distinguishable from final results. Raw logs and duplicate captures stay in ignored `.local-validation/v04/`.

B verification: 460/460 unit tests, production build, assigned form-menu browser checks 4/4 and captures 4 passed. A test harness initially counted closing dialogs twice; awaiting actual removal fixed the harness without changing game assertions. New campaign activation remains scheduled for E.
