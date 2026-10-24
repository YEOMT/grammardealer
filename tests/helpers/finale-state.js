import {assignedCorridor,checked,assignPiles} from './corridor-state.js';
import {registryForVersion} from '../../src/data/language/index.js';
import {snapshotFromText} from '../../src/engine/grammar/index.js';
import {validateRunState} from '../../src/services/localStore.js';
export {checked,assignPiles};
export const FINALE_POWER_SENTENCE='I have read books and you have read books.';
export const FINALE_QA_RUNES=['rune.longSentence','rune.svo','rune.clauseLink','rune.presentPerfect'];

/** Fixed, registered, polished QA deck before battle47; never a natural campaign claim.
 * All entry/shop/attacks after this supplied starting state are the real controller.
 */
export function assignedFinale({seed='finale.assigned',extraWords=['be','run','good','like','that','to','want','if','will'],operations=false}={}){
 const registry=registryForVersion('0.11.0'),{c,slots}=assignedCorridor({version:'0.11.0',entry:true,seed,sentences:[FINALE_POWER_SENTENCE],words:extraWords,removeWords:registry.cards.map(d=>d.id.slice(5)),polish:3,runes:FINALE_QA_RUNES});
 const state=c.getState();state.config.qaFixture=true;state.tutorial.visible=false;
 if(operations)for(const [i,kind]of ['supply','search'].entries()){const id=`qa.finale.operation.${i}`;state.activeCardIds.push(id);state.cardInstances[id]={instanceId:id,cardDefId:`card.operation.${kind}`,polishLevel:1,specialEffectId:null};}
 c._state=state;checked(c,{type:'ENTER_STAGE'});checked(c,{type:'LEAVE_SHOP',shopId:c.getState().shop.shopId});
 const start=c.getState();for(const id of start.combat.temporaryCardIds??[])delete start.cardInstances[id];start.combat=null;start.progress={stageId:'stage.10',roundIndex:4,battleNumber:47,contentBoundary:null};c._beginBattle(start);c._state=start;
 validateRunState(start,registry);return {c,slots:slots[0],initialState:c.getState(),profile:c.getProfile()};
}
/** Designated-pile integration only; moves existing copies, never adds cards or changes HP. */
export function placeExistingText(c,text){
 const state=c.getState(),snapshot=snapshotFromText(text,{registry:registryForVersion(state.version)}),used=new Set(),slots=snapshot.orderedTokens.map(t=>{const id=state.activeCardIds.find(id=>!used.has(id)&&state.cardInstances[id].cardDefId===t.cardDefId);if(!id)throw Error('Missing assigned copy '+t.cardDefId);used.add(id);return {cardInstanceId:id,selection:{formId:t.selectionId}};});assignPiles(c,{sentence:slots});return slots;
}
export function placeTaskWitness(c,task=c.getState().combat.enemyState.bossMechanic.activeTask){
 const state=c.getState(),slots=task.witnessSlots.map((slot,i)=>{if(state.activeCardIds.includes(slot.cardInstanceId))return structuredClone(slot);const id=(state.combat.temporaryCardIds??[]).find(id=>!state.combat.shatteredTemporaryIds.includes(id)&&state.cardInstances[id].cardDefId===task.witnessCardDefIds[i]);if(!id)throw Error('Missing issued witness support');return {...structuredClone(slot),cardInstanceId:id};});assignPiles(c,{sentence:slots});return slots;
}
export function finish(c,resolution){return checked(c,{type:'FINISH_PRESENTATION',attackId:resolution.attackId});}
export function enterFinale(c){
 placeExistingText(c,FINALE_POWER_SENTENCE);const r=checked(c,{type:'SUBMIT'}).resolution;finish(c,r);
 checked(c,{type:'SKIP_REWARD',offerId:c.getState().reward.offerId});checked(c,{type:'NEXT_STAGE'});checked(c,{type:'ENTER_STAGE'});checked(c,{type:'LEAVE_SHOP',shopId:c.getState().shop.shopId});return r;
}
