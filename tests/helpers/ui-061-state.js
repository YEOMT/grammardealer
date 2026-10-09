import {RunController} from './legacy-061-controller.js';
import {newProfile} from '../../src/services/localStore.js';
import {cardKind} from '../../src/data/cardCatalog.js';
import {registryForVersion} from '../../src/data/language/index.js';
import {snapshotFromText} from '../../src/engine/grammar/index.js';
import {cleanupFrost} from '../../src/game/frostCards.js';
export function assigned061(seed='061.assigned.ui'){
 const c=new RunController({profile:{...newProfile('0.6.1 ASSIGNED UI'),guidedTutorialCompletedVersion:'0.2.1'}});
 checked(c,{type:'NEW_RUN',config:{seed}});checked(c,{type:'START_BATTLE'});return c;
}
export function checked(c,command){const r=c.dispatch(command);if(!r.ok)throw Error(command.type+': '+r.message);return r;}
export function grantOperation(c,kind,level=0,id='ui.operation.'+kind){
 const s=c.getState();s.activeCardIds.push(id);s.cardInstances[id]={instanceId:id,cardDefId:'card.operation.'+kind,polishLevel:level,specialEffectId:null};s.combat.drawIds.push(id);c._state=s;return id;
}
export function assignPiles(c,{hand=[],draw=null,discard=[],sentence=[]}={}){
 const s=c.getState(),all=[...s.activeCardIds,...(s.combat.temporaryCardIds??[])],used=new Set([...hand,...discard,...sentence.map(x=>x.cardInstanceId),...(s.combat.exhaustedIds??[]),...(s.combat.shatteredTemporaryIds??[])]);
 s.combat.handIds=hand;s.combat.discardIds=discard;s.combat.sentenceSlots=sentence;s.combat.drawIds=draw??all.filter(id=>!used.has(id));s.combat.battleDirty=true;c._state=s;return s;
}
/** Assign only scene/physical cards for UI isolation; not campaign progression evidence. */
export function assignStage(c,stage=6,round=4){
 const s=c.getState();cleanupFrost(s);s.progress={stageId:'stage.0'+stage,roundIndex:round,battleNumber:[0,1,4,8,13,18,23][stage]+round,contentBoundary:null};s.combat=null;s.status='STAGE_INTRO';c._beginBattle(s);c._state=s;return c;
}
export function assignWords(c,text,{stage=null}={}){
 if(stage)assignStage(c,stage,stage===6?4:0);
 const s=c.getState(),tokens=snapshotFromText(text,{registry:registryForVersion(s.version)}).orderedTokens,used=new Set();
 const ids=tokens.map(t=>{let id=(s.combat.temporaryCardIds??[]).find(id=>!used.has(id)&&s.cardInstances[id].cardDefId===t.cardDefId&&!s.combat.shatteredTemporaryIds.includes(id));if(!id){id=s.activeCardIds.find(id=>!used.has(id)&&cardKind(s.cardInstances[id],s.version)==='WORD'&&!s.combat.exhaustedIds.includes(id));if(!id)throw Error('Assigned words need a physical source');s.cardInstances[id].cardDefId=t.cardDefId;}used.add(id);return id;});
 s.combat.handIds=ids;s.combat.sentenceSlots=[];s.combat.discardIds=[];s.combat.drawIds=[...s.activeCardIds,...(s.combat.temporaryCardIds??[])].filter(id=>!used.has(id)&&!s.combat.exhaustedIds.includes(id)&&!s.combat.shatteredTemporaryIds?.includes(id));c._state=s;return ids.map((id,i)=>({id,formId:tokens[i].selectionId,surface:tokens[i].surface}));
}
import {grantStage2Entry,createShop,closeShop} from '../../src/game/shop.js';
export function assignedStage4Choice(){
 const c=assigned061('061.ui.stage4.choice'),s=c.getState();s.combat=null;s.economy.gold=100;
 s.progress={stageId:'stage.02',roundIndex:0,battleNumber:4,contentBoundary:null};grantStage2Entry(s);createShop(s);s.status='SHOP';closeShop(s,s.shop.shopId);
 s.progress={stageId:'stage.04',roundIndex:0,battleNumber:13,contentBoundary:null};s.status='STAGE_INTRO';s.milestoneIds=['STAGE1_CLEAR','STAGE2_CLEAR','STAGE3_CLEAR'];s.eligibility.runOwnUnlocks=['pack.svoo','rune.svoo','pack.time.past','pack.time.progressive','pack.time.perfect','pack.time.futureWill','pack.clauseLink'];s.runes.slotLimit=4;
 for(const id of s.activeCardIds)if(['card.and','card.but','card.or','card.because','card.when','card.if'].includes(s.cardInstances[id].cardDefId))s.cardInstances[id].cardDefId='card.book';
 return new RunController({initialState:s,profile:c.getProfile()});
}
