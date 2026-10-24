import {assignedFinale,checked} from './finale-state.js';
import {isTurnSealed} from '../../src/game/turnHandSeal.js';
import {matchFinaleTask} from '../../src/game/finaleTasks.js';
import {snapshotFromText,analyzeSentence} from '../../src/engine/grammar/index.js';
import {createSentenceSnapshot,registryForVersion} from '../../src/data/language/index.js';
import {resolveAttack} from '../../src/engine/stage.js';
import {stageForRun} from '../../src/data/stages.js';
import {comboEligibility} from '../../src/engine/comboEligibility.js';
/** Fixed legal assigned-deck QA plan. After the initial fixture every state change
 * is a public Controller command. No natural-campaign or real-ranking claim.
 * Pure candidate evaluations choose actions; only actual submitted resolutions are returned.
 */
export function buildFinaleUiPlan(){
const seed='finale.ui.1';
const {c,initialState,profile}=assignedFinale({seed,extraWords:['read','have','book','book']});
const transcript=[],attacks=[];
const command=cmd=>{const result=checked(c,cmd);transcript.push({command:cmd,...(result.resolution?{resolution:result.resolution}: {})});return result;};
function physical(text,{past=false}={}){
 const s=c.getState(),r=registryForVersion(s.version),used=new Set(),snap=snapshotFromText(text,{registry:r});
 return snap.orderedTokens.map((token,i)=>{
  const ids=[...s.activeCardIds,...(s.combat.temporaryCardIds??[])].filter(id=>!s.combat.shatteredTemporaryIds?.includes(id)&&s.cardInstances[id]?.cardDefId===token.cardDefId&&!used.has(id));
  const id=ids.find(id=>s.combat.handIds.includes(id)&&!isTurnSealed(s,id))??ids[0];if(!id)throw Error('missing '+token.cardDefId);used.add(id);
  return {cardInstanceId:id,selection:past&&token.lexemeId==='lex.read'&&i===1?'form.read.past':token.selectionId};
 });
}
function candidates(){
 const texts=[['I have read books and you have read books.'],['I read books and you have read books.'],['I read books and you have read books.',{past:true}],['I have books and you have read books.'],['Books are read and you have read books.'],['I have read books which you have read.'],['I have read books that you have read.']];
 const s=c.getState(),task=s.combat.enemyState.bossMechanic?.activeTask,reg=registryForVersion(s.version),list=[];
 for(const [text,options]of texts){try{list.push({slots:physical(text,options),text});}catch{}}
 if(task){try{const slots=task.witnessSlots.map((slot,i)=>{if(s.activeCardIds.includes(slot.cardInstanceId))return slot;const id=(s.combat.temporaryCardIds??[]).find(id=>!s.combat.shatteredTemporaryIds.includes(id)&&s.cardInstances[id].cardDefId===task.witnessCardDefIds[i]);if(!id)throw Error('missing support');return {...slot,cardInstanceId:id};});list.push({slots,text:'actual task witness'});}catch{}}
 return list.flatMap(({slots,text})=>{
  const snapshot=createSentenceSnapshot(slots,s.cardInstances,{languageVersion:reg.version}),analysis=analyzeSentence(snapshot,reg);if(analysis.status!=='VALID')return[];
  const cards=slots.map(slot=>({...s.cardInstances[slot.cardInstanceId],baseScore:10}));
  const matched=!task||!!matchFinaleTask(task,analysis,{comboEligibility:comboEligibility(s),submittedCards:snapshot.orderedTokens});
  const res=resolveAttack({attackId:'planner.candidate',runId:s.runId,battleId:s.combat.enemyState.id,expectedRevision:s.revision,sentenceSnapshot:snapshot,analysis,cards,equippedRunes:s.runes.orderedInstanceIds.map(id=>s.runes.instances[id]),enemy:s.combat.enemyState,temporaryCardMeta:s.combat.temporaryCardMeta??{},stage:stageForRun(s),policyVersion:s.version,comboEligibility:comboEligibility(s)});
  return[{slots,text,matched,power:res.finalPower}];
 }).sort((a,b)=>Number(b.matched)-Number(a.matched)||b.power-a.power||a.slots.length-b.slots.length);
}
function assemble(slots){
 for(let guard=0;guard<50;guard++){
  let s=c.getState();if(s.status!=='BATTLE')return false;
  for(const slot of slots){s=c.getState();if(!s.combat.sentenceSlots.some(x=>x.cardInstanceId===slot.cardInstanceId)){const used=new Set(slots.map(x=>x.cardInstanceId));const available=s.combat.handIds.find(id=>!used.has(id)&&!isTurnSealed(s,id)&&s.cardInstances[id].cardDefId===s.cardInstances[slot.cardInstanceId].cardDefId);if(available&&(!s.combat.handIds.includes(slot.cardInstanceId)||isTurnSealed(s,slot.cardInstanceId)))slot.cardInstanceId=available;}if(!s.combat.sentenceSlots.some(x=>x.cardInstanceId===slot.cardInstanceId)&&s.combat.handIds.includes(slot.cardInstanceId)&&!isTurnSealed(s,slot.cardInstanceId)){
   const index=slots.slice(0,slots.indexOf(slot)).filter(x=>s.combat.sentenceSlots.some(y=>y.cardInstanceId===x.cardInstanceId)).length;
   command({type:'ADD_CARD',cardId:slot.cardInstanceId,index});command({type:'SET_FORM',cardId:slot.cardInstanceId,formId:typeof slot.selection==='string'?slot.selection:slot.selection.formId});
  }}
  s=c.getState();if(s.combat.sentenceSlots.length===slots.length)return true;
  const desired=new Set(slots.map(x=>x.cardInstanceId)),irrelevant=s.combat.handIds.filter(id=>!desired.has(id));
  const missing=slots.filter(x=>!s.combat.sentenceSlots.some(y=>x.cardInstanceId===y.cardInstanceId));
  const waitingOnSeals=missing.every(x=>s.combat.handIds.includes(x.cardInstanceId)&&isTurnSealed(s,x.cardInstanceId));
  if(!waitingOnSeals&&s.combat.exchangesRemaining>0&&irrelevant.length){command({type:'EXCHANGE',cardIds:irrelevant});continue;}
  if(s.combat.turnsRemaining<=1)return false;
  command({type:'PREPARE'});
 }
 return false;
}
try{
 for(let n=0;n<25;n++){
  const s=c.getState();if(s.clearKind==='FINAL_CLEAR')break;
  if(s.status==='BATTLE'){
   const options=candidates(),target=options[0];if(!target)throw Error('no legal candidate');
   if(!assemble(target.slots))throw Error('cannot assemble battle'+s.progress.battleNumber+' turns'+c.getState().combat.turnsRemaining+' missing '+target.slots.filter(x=>!c.getState().combat.sentenceSlots.some(y=>x.cardInstanceId===y.cardInstanceId)).map(x=>x.cardInstanceId));
   const r=command({type:'SUBMIT'}).resolution;attacks.push({battle:s.progress.battleNumber,turn:c.getState().combat.turnIndex,finalPower:r.finalPower,killed:r.killed,surfaceBroken:r.surfaceResult?.layerBroken,deepReleased:r.deepRelease?.unsealedNow});command({type:'FINISH_PRESENTATION',attackId:r.attackId});
  }else if(s.status==='REWARD')command({type:'SKIP_REWARD',offerId:s.reward.offerId});
  else if(s.status==='STAGE_CLEAR')command({type:'NEXT_STAGE'});
  else if(s.status==='STAGE_INTRO')command({type:'ENTER_STAGE'});
  else if(s.status==='SHOP')command({type:'LEAVE_SHOP',shopId:s.shop.shopId});
  else if(s.status==='BETWEEN_BATTLES')command({type:'NEXT_BATTLE'});
  else throw Error(s.status);
 }
 const finalState=c.getState();if(finalState.clearKind!=='FINAL_CLEAR')throw Error('not clear');
 return {seed,evidenceKind:'FIXED_LEGAL_DECK_PUBLIC_CONTROLLER_COMMANDS',initialState,profile,transcript,attacks,finalState};
}catch(error){
 error.plan={seed,initialState,profile,transcript,attacks,finalState:c.getState()};
 throw error;
}
}
