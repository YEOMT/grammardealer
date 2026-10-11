import {generateStarterDeck} from '../../src/game/deck.js';
/** Recreate only newly constructed historical test fixtures, never loaded saves or golden files. */
export function restore04Starter(s){
 const d=generateStarterDeck({...s.config,version:'0.4.0'});
 const keys=['activeCardIds','cardInstances','vocabulary','rng'];
 if(s.tutorialSession?.parked){for(const k of keys)s.tutorialSession.parked[k]=structuredClone(d[k]);s.rng=structuredClone(d.rng);}
 else for(const k of keys)s[k]=structuredClone(d[k]);
 s.generationTrace=structuredClone(d.generationTrace);
}
