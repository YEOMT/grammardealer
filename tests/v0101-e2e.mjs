process.env.SB_E2E_CAMPAIGN='0.10.1';
process.env.SB_EVIDENCE_DIR??='.local-validation/v0101/production-natural';
await import('./e2e.mjs');
