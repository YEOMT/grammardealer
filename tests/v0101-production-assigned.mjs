process.env.SB_ASSIGNED_CAMPAIGN='0.10.1';
process.env.SB_CORRIDOR_PRODUCTION_OUT??='.local-validation/v0101/production-assigned';
await import('./corridor-production-assigned.mjs');
