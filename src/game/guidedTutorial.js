import {clone} from '../contracts.js';
import {registry} from '../data/language/index.js';
import {assertRng} from './rng.js';
import {createStream} from './rng.js';

export const GUIDED_VERSION='0.2.1';
export const TUTORIAL_CARDS=Object.freeze(['be','happy','run','really','small','good','i','he','very','fast','run','book','a','be','you','they','like','go','come','give','show','dog','cat','music','friend','the','in','with'].map(x=>`card.${x}`));
export const tutorialCardId=index=>`tutorial.021.${String(index).padStart(2,'0')}`;
export const isGuided=run=>run?.tutorialSession?.active===true;
export function installTutorial(run,previous=null){
 const parked=previous?.parked??Object.fromEntries(['activeCardIds','cardInstances','vocabulary','rng','openingFrames','stats'].map(key=>[key,clone(run[key])]));
 const attempt=(previous?.attempt??0)+1;
 run.tutorialSession={version:GUIDED_VERSION,active:true,attempt,sessionId:`${run.runId}:tutorial:${attempt}`,step:1,completedSteps:[],panel:null,selectedIds:[],attackId:null,attackCount:0,parked,drawStream:createStream(`${run.config.seed}:tutorial`)};
 run.activeCardIds=TUTORIAL_CARDS.map((_,i)=>tutorialCardId(i));
 run.cardInstances=Object.fromEntries(TUTORIAL_CARDS.map((cardDefId,i)=>{if(!registry.cardById[cardDefId])throw Error(`Missing tutorial card ${cardDefId}`);const instanceId=tutorialCardId(i);return[instanceId,{instanceId,cardDefId,polishLevel:0,specialEffectId:null}];}));
 run.vocabulary={...clone(parked.vocabulary),encounteredLexemeIds:[...new Set(TUTORIAL_CARDS.map(id=>registry.cardById[id].lexemeId))]};
 run.tutorial.visible=false;
}
export function tutorialPiles(run){return{handIds:run.activeCardIds.slice(0,6),drawIds:run.activeCardIds.slice(6),sentenceSlots:[],discardIds:[],openingTrace:{frameId:null,kind:'FIXED_GUIDED_0.2.1'}};}
export function restoreTutorialDeck(run){
 const t=run.tutorialSession;
 for(const[key,value]of Object.entries(t.parked))run[key]=clone(value);
 const c=run.combat;c.handIds=[];c.sentenceSlots=[];c.discardIds=[];c.drawIds=[...run.activeCardIds];
 t.active=false;t.step=32;t.completedSteps.push(31);delete t.parked;
}
const id=tutorialCardId;
const expectedActions={2:['ADD_CARD',0,0],3:['ADD_CARD',1,1],4:['RETURN_CARD',1],5:['ADD_CARD',1,1],9:['ADD_CARD',6,2],10:['REORDER_SENTENCE',6,0],22:['ADD_CARD',10,1]};
const ackSteps=new Set([1,6,13,18,19,30,31]);
export const tutorialPanel=step=>({14:'discard',15:'deck',16:'draw',17:'dictionary'})[step];
/** Pure guard. Every action, including UI-only evidence, identifies its current cue. */
export function guidedAllowed(run,cmd){
 if(!isGuided(run))return true;
 const t=run.tutorialSession,s=t.step,c=run.combat;
 if(cmd.type==='START_BATTLE')return run.status==='STAGE_INTRO';
 if(['TUTORIAL_RESTART','TUTORIAL_EXIT'].includes(cmd.type))return cmd.sessionId===t.sessionId&&cmd.confirmed===true;
 if(cmd.type==='FINISH_PRESENTATION')return cmd.attackId===t.attackId&&[12,29].includes(s);
 if(cmd.sessionId!==t.sessionId||cmd.cueId!==`T${String(s).padStart(2,'0')}`)return false;
 if(cmd.type==='TUTORIAL_ACK')return ackSteps.has(s);
 if([26,27,28].includes(s))return cmd.type==='TUTORIAL_GATE_ACK'&&cmd.attackId===t.attackId;
 if(tutorialPanel(s))return cmd.kind===tutorialPanel(s)&&(cmd.type==='TUTORIAL_PANEL_OPEN'?!t.panel:cmd.type==='TUTORIAL_PANEL_CLOSE'&&t.panel===cmd.kind);
 if(s===7)return cmd.type==='TUTORIAL_SELECT'&&cmd.cardId===id(2)&&c.handIds.includes(id(2));
 if(s===8)return cmd.type==='EXCHANGE'&&cmd.cardIds?.length===1&&cmd.cardIds[0]===id(2)&&t.selectedIds[0]===id(2);
 if(s===11||s===25)return cmd.type==='SUBMIT';
 if(s===20){const at=c.sentenceSlots.length;return cmd.type==='ADD_CARD'&&at<3&&cmd.cardId===id([7,8,9][at])&&(cmd.index??at)===at;}
 if(s===21)return cmd.type==='PREPARE';
 if(s===23)return cmd.type==='TUTORIAL_FORM_OPEN'&&cmd.cardId===id(10);
 if(s===24)return cmd.cardId===id(10)&&(cmd.type==='TUTORIAL_FORM_OPEN'||cmd.type==='SET_FORM'&&cmd.formId==='form.run.third');
 const action=expectedActions[s];return Boolean(action&&cmd.type===action[0]&&cmd.cardId===id(action[1])&&(action[2]===undefined||(cmd.index??c.sentenceSlots.length)===action[2]));
}
export function recordGuided(run,cmd){
 const t=run.tutorialSession;if(!t?.active)return;
 if(cmd.type==='TUTORIAL_PANEL_OPEN'){t.panel=cmd.kind;return;}
 if(cmd.type==='START_BATTLE'||cmd.type==='TUTORIAL_FORM_OPEN'&&t.step===24)return;
 if(cmd.type==='TUTORIAL_SELECT')t.selectedIds=[cmd.cardId];
 if(cmd.type==='EXCHANGE')t.selectedIds=[];
 if(cmd.type==='TUTORIAL_PANEL_CLOSE')t.panel=null;
 if(cmd.type==='SUBMIT'){t.attackId=run.combat.pendingAttackId;t.attackCount++;}
 if(t.step===20&&run.combat.sentenceSlots.length<3)return;
 t.completedSteps.push(t.step);t.step++;
}
export function tutorialCommand(run,command){const t=run.tutorialSession;return isGuided(run)?{...command,sessionId:t.sessionId,cueId:`T${String(t.step).padStart(2,'0')}`,expectedRevision:run.revision}:command;}

/** Stored tutorial starts are deterministic plain data, not a profile-dependent re-roll. */
export function validateTutorial(run){
 const t=run.tutorialSession;if(!t)return true;
 const fail=()=>{throw Error('잘못된 고정 실습 저장입니다.');};
 if(!['0.2.1','0.2.2','0.3.0','0.4.0'].includes(run.version)||t.version!==GUIDED_VERSION||!Number.isInteger(t.attempt)||t.attempt<1||t.sessionId!==`${run.runId}:tutorial:${t.attempt}`)fail();
 if(!t.active){if(t.step!==32||t.parked||run.activeCardIds.some(x=>x.startsWith('tutorial.021.')))fail();return true;}
 if(run.progress.battleNumber!==1||run.progress.stageId!=='stage.01'||!Number.isInteger(t.step)||t.step<1||t.step>31||run.runes.orderedInstanceIds.length||!t.parked)fail();
 if(run.activeCardIds.join('|')!==TUTORIAL_CARDS.map((_,i)=>id(i)).join('|'))fail();
 for(const [i,def]of TUTORIAL_CARDS.entries()){const card=run.cardInstances[id(i)];if(card?.cardDefId!==def||card.polishLevel!==0)fail();}
 const p=t.parked;if(p.activeCardIds.length!==28||new Set(p.activeCardIds).size!==28||p.activeCardIds.some(x=>!p.cardInstances[x]||TUTORIAL_CARDS.map((_,i)=>id(i)).includes(x)))fail();
 assertRng(p.rng);
 if(Object.keys(p.cardInstances).length!==28||p.activeCardIds.some(x=>{const c=p.cardInstances[x];return c.instanceId!==x||!registry.cardById[c.cardDefId]?.starterEligible||c.polishLevel!==0||c.specialEffectId!==null;}))fail();
 if(p.openingFrames.length||p.stats.attacks!==0||!Array.isArray(p.vocabulary.encounteredLexemeIds))fail();
 if(JSON.stringify(run.rng)!==JSON.stringify(p.rng))fail();
 if(!Array.isArray(t.completedSteps)||t.completedSteps.length!==t.step-1||t.completedSteps.some((x,i)=>x!==i+1))fail();
 if(t.step===1&&run.combat){if(t.attackCount!==0||t.attackId!==null||t.lastAttack||t.selectedIds?.length||t.panel!==null||JSON.stringify(t.drawStream)!==JSON.stringify(createStream(`${run.config.seed}:tutorial`)))fail();const expected=tutorialPiles(run);for(const key of ['handIds','drawIds','sentenceSlots','discardIds'])if(JSON.stringify(run.combat[key])!==JSON.stringify(expected[key]))fail();if(run.combat.enemyState.hp!==77||run.combat.turnsRemaining!==6||run.combat.exchangesRemaining!==1)fail();}
 return true;
}
