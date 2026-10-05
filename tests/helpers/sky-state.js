import {RunController} from '../../src/game/runController.js';
import {newProfile} from '../../src/services/localStore.js';
import {campaignCards} from '../../src/data/cardCatalog.js';
import {generateStarterDeck} from '../../src/game/deck.js';
/** Assigned 0.4 fixtures while the staged integration has not yet enabled the new default campaign. */
export function skyController(seed='sky.fixture'){
 const profile={...newProfile('0.4 assigned fixture'),guidedTutorialCompletedVersion:'0.2.1'},c=new RunController({profile});
 const started=c.dispatch({type:'NEW_RUN',config:{seed}});if(!started.ok)throw Error(started.message);
 const s=c.getState();s.version='0.4.0';s.contentVersions={...s.contentVersions,game:'0.4.0',language:'0.4.0'};s.contentManifest.cardDefIds=campaignCards('0.4.0').filter(d=>d.runtimeReady).map(d=>d.id);
 const deck=generateStarterDeck({seed,version:'0.4.0'});for(const key of ['activeCardIds','cardInstances','rng','vocabulary','generationTrace'])s[key]=deck[key];
 c._state=s;const battle=c.dispatch({type:'START_BATTLE'});if(!battle.ok)throw Error(battle.message);return c;
}
export function operationCommand(c,sourceCardId,targetCardId){const s=c.getState();return {type:'USE_OPERATION',sourceCardId,targetCardId,expectedRevision:s.revision,battleId:s.combat.enemyState.id};}
export function giveOperation(c,kind='supply',id='operation.fixture'){
 const s=c.getState();s.cardInstances[id]={instanceId:id,cardDefId:`card.operation.${kind}`,polishLevel:0,specialEffectId:null};s.activeCardIds.push(id);s.combat.handIds.push(id);c._state=s;return id;
}
