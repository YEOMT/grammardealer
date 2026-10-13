import {assignedWaterways,checked,assignPiles} from './waterways-state.js';
import {snapshotFromText} from '../../src/engine/grammar/index.js';
import {registryForVersion} from '../../src/data/language/index.js';
import {validateRunState} from '../../src/services/localStore.js';
import {LIBRARY_REWARD_PACK} from '../../src/data/libraryPolicy.js';
export {checked,assignPiles};
/** Supplied-state QA only: every card exists before battle; real entry/shop/controller thereafter. */
export function assignedCorridor({round=4,seed='corridor.assigned',sentences=[],words=[],removeWords=[],polish=0,runes=[],entry=false}={}){
 const c=assignedWaterways({version:'0.10.0',seed}),s=c.getState(),registry=registryForVersion(s.version);
 s.progress={stageId:'stage.10',roundIndex:0,battleNumber:43,contentBoundary:null};s.combat=null;s.status='STAGE_INTRO';s.milestoneIds.push('STAGE8_CLEAR','STAGE9_CLEAR');s.eligibility.runOwnUnlocks.push(LIBRARY_REWARD_PACK);
 s.activeCardIds=s.activeCardIds.filter(id=>{if(!removeWords.includes(s.cardInstances[id].cardDefId.slice(5)))return true;delete s.cardInstances[id];return false;});
 let i=0;const add=cardDefId=>{const id=`qa.corridor.${i++}`;s.cardInstances[id]={instanceId:id,cardDefId,polishLevel:polish,specialEffectId:null};s.activeCardIds.push(id);return id;};
 const slots=sentences.map(text=>snapshotFromText(text,{registry}).orderedTokens.map(t=>({cardInstanceId:add(t.cardDefId),selection:t.selectionId})));
 words.forEach(w=>add('card.'+w));
 if(runes.length){s.runes.orderedInstanceIds=runes.map((r,i)=>'qa.corridor.rune.'+i);s.runes.instances=Object.fromEntries(runes.map((r,i)=>[s.runes.orderedInstanceIds[i],{instanceId:s.runes.orderedInstanceIds[i],runeId:r,level:3}]));}
 c._state=s;
 if(!entry){checked(c,{type:'ENTER_STAGE'});checked(c,{type:'LEAVE_SHOP',shopId:c.getState().shop.shopId});if(round){const next=c.getState();for(const id of next.combat.temporaryCardIds)delete next.cardInstances[id];next.combat=null;next.progress={stageId:'stage.10',roundIndex:round,battleNumber:43+round,contentBoundary:null};c._beginBattle(next);c._state=next;}}
 validateRunState(c.getState(),registry);return {c,slots};
}
export function place(c,slots){assignPiles(c,{sentence:slots});}
