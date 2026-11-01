/** A grammatical controller is not a physical card. Only parser-authored root imperatives qualify. */
export const isVerifiedImperative=clause=>clause?.role==='MAIN'&&clause.mood==='IMPERATIVE'&&clause.implicitSubject?.verified===true&&clause.implicitSubject.physical===false&&clause.implicitSubject.lemma==='you'&&!clause.subjectNodeId;
export const hasValidatedSubject=clause=>Boolean(clause?.subjectNodeId)||isVerifiedImperative(clause);
