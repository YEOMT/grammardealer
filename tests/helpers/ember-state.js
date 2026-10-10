import {RunController} from './legacy-07-controller.js';
import {newProfile,validateRunState} from '../../src/services/localStore.js';
import {registryForVersion} from '../../src/data/language/index.js';
import {grantStage2Entry,createShop,closeShop} from '../../src/game/shop.js';
import {grantStage3Entry} from '../../src/game/timeCanyon.js';import {TIME_PACKS} from '../../src/data/language/timeLanguage.js';
import {grantStage4Entry,getStage4EntryChoice} from '../../src/game/skyIslands.js';
import {grantStage5Entry,DESERT_PACKS} from '../../src/game/wishDesert.js';
import {grantStage6Entry,SNOW_PACKS,SNOW_REWARD_PACK} from '../../src/game/mirrorSnowfield.js';
import {EMBER_PACKS} from '../../src/data/stage7.js';
export function checked(c,command){const r=c.dispatch(command);if(!r.ok)throw Error(command.type+': '+r.message);return r;}
/** Explicit assigned-state fixture; never claimed as campaign play. Entry/shop routines are real. */
export function assignedEmber({round=0,seed='ember.assigned',opening=0}={}){
 const c=new RunController({profile:{...newProfile('Ember assigned QA'),guidedTutorialCompletedVersion:'0.2.1'}});checked(c,{type:'NEW_RUN',config:{seed}});const s=c.getState();s.runId='qa.ember.'+seed;s.economy.gold=100;s.runes.slotLimit=4;
 s.milestoneIds=['STAGE1_CLEAR','STAGE2_CLEAR','STAGE3_CLEAR','STAGE4_CLEAR','STAGE5_CLEAR','STAGE6_CLEAR'];s.eligibility.runOwnUnlocks=['pack.svoo','rune.svoo','pack.clauseLink',...TIME_PACKS,...DESERT_PACKS,...SNOW_PACKS,SNOW_REWARD_PACK,...EMBER_PACKS];
 for(const [stage,battle]of [[2,4],[3,8],[4,13],[5,18],[6,23]]){
  s.progress={stageId:`stage.0${stage}`,roundIndex:0,battleNumber:battle,contentBoundary:null};s.status='STAGE_INTRO';
  if(stage===2)grantStage2Entry(s);if(stage===3)grantStage3Entry(s);if(stage===4){const choice=getStage4EntryChoice(s);grantStage4Entry(s,{connectorCardDefId:choice?'card.and':null});if(choice)s.entryChoice={...choice,pending:false,selectedCardDefId:'card.and'};}if(stage===5)grantStage5Entry(s);if(stage===6)grantStage6Entry(s);
  if([2,4,6].includes(stage)){createShop(s);s.status='SHOP';closeShop(s,s.shop.shopId);}
 }
 s.progress={stageId:'stage.07',roundIndex:round,battleNumber:28+round,contentBoundary:null};s.status='STAGE_INTRO';
 if(opening){s.runes.orderedInstanceIds=['qa.opening','qa.hand'];s.runes.instances={'qa.opening':{instanceId:'qa.opening',runeId:'rune.openingHand',level:opening},'qa.hand':{instanceId:'qa.hand',runeId:'rune.handSize',level:3}};}
 c._beginBattle(s);c._state=s;validateRunState(s,registryForVersion(s.version));return c;
}
export function assignPiles(c,{hand=[],draw=null,discard=[],sentence=[]}={}){const s=c.getState(),used=new Set([...hand,...discard,...sentence.map(x=>x.cardInstanceId),...s.combat.exhaustedIds,...s.combat.shatteredTemporaryIds]);Object.assign(s.combat,{handIds:hand,drawIds:draw??[...s.activeCardIds,...s.combat.temporaryCardIds].filter(id=>!used.has(id)),discardIds:discard,sentenceSlots:sentence,battleDirty:true});c._state=s;return s;}
export function grantOperation(c,kind,level=0){const s=c.getState(),id=`qa.operation.${kind}.${s.activeCardIds.length}`;s.activeCardIds.push(id);s.cardInstances[id]={instanceId:id,cardDefId:'card.operation.'+kind,polishLevel:level,specialEffectId:null};s.combat.drawIds.push(id);c._state=s;return id;}
export function use(c,sourceCardId,targetCardId){const s=c.getState(),command={type:'USE_OPERATION',sourceCardId,targetCardId,expectedRevision:s.revision,battleId:s.combat.enemyState.id,commandId:'qa.op.'+s.revision},r=checked(c,command);checked(c,{type:'FINISH_OPERATION',effectId:r.operationEffect.effectId});validateRunState(c.getState(),registryForVersion(s.version));return r.operationEffect;}
