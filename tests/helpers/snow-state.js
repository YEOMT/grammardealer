import {RunController} from './legacy-060-controller.js';
import {newProfile} from '../../src/services/localStore.js';
import {registryForVersion} from '../../src/data/language/index.js';
import {snapshotFromText} from '../../src/engine/grammar/index.js';
import {act,advanceAssigned,assignedAttack} from './desert-state.js';
import {cleanupFrost} from '../../src/game/frostCards.js';
export {act};
export const snowLanguage=registryForVersion('0.6.0');
export function newSnow(seed='snow.assigned',options={}){const c=new RunController({profile:{...newProfile('Snow QA'),guidedTutorialCompletedVersion:'0.2.1',...options.profile}});act(c,{type:'NEW_RUN',config:{seed}});return c;}
/** Assigned stage boundary, no claim of natural play. */
export function assignedSnow(round=0,seed='snow.assigned'){
 const c=newSnow(seed);advanceAssigned(c,{stopAtBattle:22});
 // Existing assigned helper uses the real controller for all previous stages.
 while(c.getState().status==='BATTLE')assignedAttack(c,'I had played games and she will have played music');
 act(c,{type:'SKIP_REWARD',offerId:c.getState().reward.offerId});
 act(c,{type:'NEXT_STAGE'});act(c,{type:'ENTER_STAGE'});act(c,{type:'LEAVE_SHOP',shopId:c.getState().shop.shopId});
 if(round){const r=c.getState();cleanupFrost(r);r.progress.roundIndex=round;r.progress.battleNumber=23+round;r.combat=null;r.status='STAGE_INTRO';c._state=r;c._beginBattle(r);c._state=r;}
 return c;
}
/** Place existing permanent and supplied physical copies; fixture assigns only permanent definitions. */
export function placeAssigned(c,text,{polish=0,useFrost=true}={}){
 const s=c.getState(),tokens=snapshotFromText(text,{registry:snowLanguage}).orderedTokens,used=new Set();
 const slots=tokens.map(t=>{let id=useFrost?s.combat.temporaryCardIds.find(id=>!used.has(id)&&!s.combat.shatteredTemporaryIds.includes(id)&&s.cardInstances[id].cardDefId===t.cardDefId):null;
  if(!id){id=s.activeCardIds.find(id=>!used.has(id)&&!s.combat.exhaustedIds.includes(id));s.cardInstances[id].cardDefId=t.cardDefId;s.cardInstances[id].polishLevel=polish;}
  used.add(id);return {cardInstanceId:id,selection:{formId:t.selectionId}};});
 s.combat.sentenceSlots=slots;s.combat.handIds=[];s.combat.discardIds=[];s.combat.drawIds=[...s.activeCardIds,...s.combat.temporaryCardIds].filter(id=>!used.has(id)&&!s.combat.shatteredTemporaryIds.includes(id)&&!s.combat.exhaustedIds.includes(id));s.combat.battleDirty=true;c._state=s;return slots;
}
