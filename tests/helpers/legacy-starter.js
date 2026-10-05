import {generateStarterDeck} from '../../src/game/deck.js';
/** Reconstruct only the historical fixture's initial generator, never a loaded save. */
export function restoreLegacyStarter(s){
 const d=generateStarterDeck({...s.config,version:'0.1.1'});
 const keys=['activeCardIds','cardInstances','vocabulary','rng'];
 if(s.tutorialSession?.parked){for(const k of keys)s.tutorialSession.parked[k]=structuredClone(d[k]);s.rng=structuredClone(d.rng);}
 else for(const k of keys)s[k]=structuredClone(d[k]);
 s.generationTrace=structuredClone(d.generationTrace);s.contentVersions.generator='0.1.1';s.contentVersions.reward='0.2.0';
 s.eligibility.runStartUnlockBaseline=s.eligibility.runStartUnlockBaseline.filter(x=>x!=='pack.clauseLink');
 delete s.shopHistory;
}
