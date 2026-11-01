import {RunController as Current} from '../../src/game/runController.js';
import {LEARNING012_VERSIONS} from '../../src/contracts.js';
import {generateStarterDeck} from '../../src/game/deck.js';
import {campaignCards} from '../../src/data/cardCatalog.js';
/** Historical fixture only. Keep 0.12's generated cards/RNG, including the parked tutorial deck. */
export class RunController extends Current {
 dispatch(command){
  const result=super.dispatch(command);
  if(command.type==='NEW_RUN'&&result.ok){
   const s=this.getState(),d=generateStarterDeck({...s.config,version:LEARNING012_VERSIONS.generator});
   s.version='0.12.0';s.contentVersions=structuredClone(LEARNING012_VERSIONS);s.contentManifest.id='campaign.0.12';s.contentManifest.cardDefIds=campaignCards(s.version).filter(c=>c.runtimeReady).map(c=>c.id);
   const target=s.tutorialSession?.parked??s;
   for(const key of ['activeCardIds','cardInstances','vocabulary','rng'])target[key]=structuredClone(d[key]);
   if(target!==s)s.rng=structuredClone(d.rng);s.generationTrace=structuredClone(d.generationTrace);this._state=s;
  }
  return result;
 }
}
