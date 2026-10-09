import {RunController} from './legacy-05-controller.js';
import {newProfile,validateRunState} from '../../src/services/localStore.js';
import {registryForVersion} from '../../src/data/language/index.js';
import {campaignCards,cardKind} from '../../src/data/cardCatalog.js';
import {snapshotFromText} from '../../src/engine/grammar/index.js';
import {isTurnSealed} from '../../src/game/turnHandSeal.js';
export const act=(controller,command)=>{const r=controller.dispatch(command);if(!r.ok)throw Error(command.type+': '+r.message+' '+JSON.stringify(r.analysis?.diagnostics??''));return r;};
/** Assigned QA version while activation is staged; this never runs in production. */
export function newDesert(seed='desert.assigned',options={}){
 const c=new RunController({profile:{...newProfile('assigned desert boundary'),guidedTutorialCompletedVersion:'0.2.1',...options.profile},...options});
 act(c,{type:'NEW_RUN',config:{seed}});const s=c.getState();
 s.version='0.5.0';
 s.contentManifest={...s.contentManifest,id:'campaign.0.5',stageIds:['stage.01','stage.02','stage.03','stage.04','stage.05'],cardDefIds:campaignCards('0.5.0').filter(c=>c.runtimeReady).map(c=>c.id)};s.config.contentProfile='STAGE1_STAGE2_STAGE3_STAGE4_STAGE5';c._state=s;return c;
}
/** Assigned physical words and +3 only to test boundaries. Not natural play or a win-rate sample. */
export function assignedAttack(c,text){
 const s=c.getState(),tokens=snapshotFromText(text,{registry:registryForVersion(s.version)}).orderedTokens;
 const ids=s.activeCardIds.filter(id=>cardKind(s.cardInstances[id],s.version)==='WORD'&&!isTurnSealed(s,id)).slice(0,tokens.length);
 if(ids.length!==tokens.length)throw Error('Assigned QA sentence lacks physical cards');
 for(const [i,t]of tokens.entries()){s.cardInstances[ids[i]].cardDefId=t.cardDefId;s.cardInstances[ids[i]].polishLevel=3;}
 s.combat.sentenceSlots=ids.map((id,i)=>({cardInstanceId:id,selection:{formId:tokens[i].selectionId}}));s.combat.handIds=[];s.combat.discardIds=[];s.combat.drawIds=s.activeCardIds.filter(id=>!ids.includes(id)&&!s.combat.exhaustedIds.includes(id));s.combat.battleDirty=true;c._state=s;
 const r=act(c,{type:'SUBMIT'}).resolution;act(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});return r;
}
export function advanceAssigned(c,{stopAtBattle=null,stopStatus=null}={}){
 const battles=[],shops=[],states=[];
 for(let guard=0;guard<240;guard++){
  const s=c.getState();if(s.status==='CONTENT_COMPLETE'||s.status==='DEFEAT'||s.progress.battleNumber===stopAtBattle&&s.status===(stopStatus??'BATTLE'))return {state:s,battles,shops,states};
  if(s.status==='STAGE_INTRO')act(c,{type:s.progress.stageId==='stage.01'?'START_BATTLE':'ENTER_STAGE'});
  else if(s.status==='SHOP'){shops.push(structuredClone(s.shop));act(c,{type:'LEAVE_SHOP',shopId:s.shop.shopId});}
  else if(s.status==='BATTLE'){
   const phase=s.combat.enemyState.bossMechanic?.phases?.[s.combat.enemyState.bossMechanic.activePhase]?.id;
   const text=phase==='PAST'?'I had played games':phase==='PRESENT'?'I have played games':phase==='FUTURE'?'I will have played games':'I had played games and she will have played music';
   const r=assignedAttack(c,text);if(r.actualHpLoss<=0)throw Error('Assigned boundary attack did no damage');if(c.getState().status==='REWARD')battles.push(s.progress.battleNumber);
  }else if(s.status==='REWARD')act(c,{type:'SKIP_REWARD',offerId:s.reward.offerId});else act(c,{type:s.status==='STAGE_CLEAR'?'NEXT_STAGE':'NEXT_BATTLE'});
  validateRunState(c.getState(),registryForVersion(c.getState().version));states.push(c.getState());
 }throw Error('Assigned 22-boundary guard exceeded');
}
export function assignedSphinx(seed='desert.seal'){const c=newDesert(seed);advanceAssigned(c,{stopAtBattle:22});return c;}
