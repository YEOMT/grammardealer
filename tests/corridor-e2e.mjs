process.env.SB_E2E_CAMPAIGN='0.10.0';
process.env.SB_EVIDENCE_DIR??='.local-validation/v010/production-natural';
await import('./e2e.mjs');
