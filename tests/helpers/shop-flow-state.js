import {assignSentence} from './waterways-state.js';
import {RunController} from '../../src/game/runController.js';
import {newProfile} from '../../src/services/localStore.js';
import {stageForRun} from '../../src/data/stages.js';
import {cleanupTemporaryCards} from '../../src/game/temporaryCards.js';
export function checked(c,command){const r=c.dispatch(command);if(!r.ok)throw Error(command.type+': '+r.message);return r;}
export function chooseEntry(c,city='NONE'){
 const s=c.getState();
 if(s.entryChoice?.pending)checked(c,{type:'CHOOSE_STAGE4_CONNECTOR',choiceId:s.entryChoice.choiceId,entryId:s.entryChoice.entryId,cardDefId:'card.and',expectedRevision:s.revision,commandId:'qa.entry.'+s.revision});
 if(s.waterwaysEntryChoice?.pending)checked(c,{type:'CHOOSE_STAGE8_WORD',offerId:s.waterwaysEntryChoice.offerId,choice:city,confirmNone:true,expectedRevision:s.revision,commandId:'qa.entry.'+s.revision});
}
/** Synthetic transition fixture: assigns boss victory, not an attack or natural play result. */
export function bossReward(stage){
 const c=new RunController({profile:{...newProfile('Shop flow QA'),guidedTutorialCompletedVersion:'0.2.1'}});
 checked(c,{type:'NEW_RUN',config:{seed:'shop.flow.focused'}});
 let s=c.getState();delete s.config.shopFlowPolicy;c._state=s;
 for(let n=1;n<=stage;n++){
  if(n===1)checked(c,{type:'START_BATTLE'});
  else{checked(c,{type:'NEXT_STAGE'});checked(c,{type:'ENTER_STAGE'});chooseEntry(c);if(c.getState().status==='SHOP')checked(c,{type:'LEAVE_SHOP',shopId:c.getState().shop.shopId});}
  s=c.getState();cleanupTemporaryCards(s);const rounds=stageForRun(s).rounds;
  s.progress.roundIndex=rounds.length-1;s.progress.battleNumber=rounds.at(-1).battleNumber;s.combat=null;c._beginBattle(s);
  const boss=s.combat.enemyState.bossMechanic;
  if(boss?.id==='TIME_GOLEM'){boss.activePhase=3;for(const phase of boss.phases){phase.hp=0;phase.broken=true;}}
  if(boss?.id==='FROST_CRYSTAL_LOCK'){boss.crystalsRemaining=0;boss.brokenCount=5;}
  // Assigned shield state is fixture setup, not evidence of a grammar attack.
  if(boss?.id==='DUAL_RELATIVE_SEAL')Object.assign(boss,{unlocked:true,appliedAttackIds:['qa.assigned'],unlockedByAttackId:'qa.assigned',unlockWitness:{sentenceId:'qa',subjectRelativeId:'s',objectRelativeId:'o',subjectEvidenceDigest:'s',objectEvidenceDigest:'o'}});
  if(n>=9){
   // Receipt-validated bosses use one real attack with an explicitly assigned QA deck.
   c._state=s;const ids=assignSentence(c,'I have read books and you have read books.');s=c.getState();
   for(const id of ids)s.cardInstances[id].polishLevel=3;
   s.runes.orderedInstanceIds=['qa.long','qa.svo','qa.link','qa.perfect'];s.runes.instances=Object.fromEntries(['rune.longSentence','rune.svo','rune.clauseLink','rune.presentPerfect'].map((runeId,i)=>[s.runes.orderedInstanceIds[i],{instanceId:s.runes.orderedInstanceIds[i],runeId,level:3}]));
   c._state=s;const attack=checked(c,{type:'SUBMIT'}).resolution;if(!attack.killed)throw Error('Assigned QA attack did not defeat boss');checked(c,{type:'FINISH_PRESENTATION',attackId:attack.attackId});s=c.getState();
  }else{s.combat.enemyState.hp=0;c._settleVictory(s);c._state=s;}
  if(n!==stage)checked(c,{type:'SKIP_REWARD',offerId:s.reward.offerId});
 }
 return c;
}
