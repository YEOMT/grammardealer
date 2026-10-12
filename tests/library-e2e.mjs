process.env.SB_E2E_CAMPAIGN='0.9.0';
process.env.SB_EVIDENCE_DIR??='.local-validation/v09/production';
await import('./e2e.mjs');
