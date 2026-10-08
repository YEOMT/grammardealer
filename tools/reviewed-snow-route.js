import {RunController} from '../src/game/runController.js';
import {registryForVersion,formsForCard} from '../src/data/language/index.js';
/** QA-only reviewed route for STANDARD/run-sequence.54 after the documented
 * reward/shop policy. It replays actual commands on a clone and fails closed if
 * any required physical card is absent. No state injection, expected-JSON answers,
 * damage replacement or production import. The UI must replay every returned move.
 */
export function reviewedSnowRoute(initial,profile){
 const c=new RunController({initialState:initial,profile}),registry=registryForVersion(initial.version),path=[];
 const command=x=>{const r=c.dispatch(x);if(!r.ok)throw Error('Reviewed route: '+r.message);return r;};
 function attack(text){const state=c.getState(),used=new Set(),slots=text.split(' ').map(word=>{
  for(const id of state.combat.handIds){if(used.has(id))continue;const form=formsForCard(state.cardInstances[id],{registry}).find(f=>f.surface.toLowerCase()===word.toLowerCase());if(form){used.add(id);return {cardInstanceId:id,selection:{formId:form.id}};}}
  throw Error('Reviewed route requires an actual hand card: '+word);
 });
 for(const s of slots){command({type:'ADD_CARD',cardId:s.cardInstanceId});command({type:'SET_FORM',cardId:s.cardInstanceId,formId:s.selection.formId});}
 const r=command({type:'SUBMIT'}).resolution;if(r.status!=='VALID')throw Error('Reviewed route must parse normally');
 path.push({type:'ATTACK',candidate:{slots,snapshot:r.sentenceSnapshot,analysis:r.analysis,text,power:r.finalPower},actual:{power:r.finalPower,crystals:r.frostCrystalResult.brokenCrystalCount,preventedDamage:r.preventedDamage,killed:r.killed}});
 command({type:'FINISH_PRESENTATION',attackId:r.attackId});}
 const prepare=()=>{command({type:'PREPARE'});path.push({type:'PREPARE'});};
 const exchange=keep=>{const s=c.getState(),cardIds=s.combat.handIds.filter(id=>!s.combat.temporaryCardMeta[id]?.crystalBearing&&!keep.includes(s.cardInstances[id].cardDefId));command({type:'EXCHANGE',cardIds});path.push({type:'EXCHANGE',cardIds});};
 attack('I became too strong');prepare();exchange([]);prepare();exchange(['card.be']);exchange(['card.be','card.friend']);exchange(['card.be','card.friend','card.student']);
 attack('more friends were as kind as students');attack('I will make enough ideas');
 if(c.getState().status!=='REWARD')throw Error('Reviewed route did not defeat the boss');
 return {status:'FOUND',kind:'REVIEWED_SEEDED_COMMAND_ROUTE_NOT_CURRENT_HAND_GREEDY_OR_HUMAN_WIN_RATE',path};
}
