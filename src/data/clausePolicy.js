/** Proposed v0.14 numerical starting values, separate from confirmed campaign HP. */
export const CLAUSE_VERSION = '0.14.0';
export const CLAUSE_INITIAL = Object.freeze({
  participialMultiplier: Object.freeze({num:8,den:5}),
  punctuationPenalty: Object.freeze({num:9,den:10}),
});
export const PARTICIPIAL_LABELS = Object.freeze({
  'CLAUSE.PARTICIPIAL.ACTIVE':'현재분사 분사구문',
  'CLAUSE.PARTICIPIAL.PASSIVE':'과거분사 분사구문',
});
