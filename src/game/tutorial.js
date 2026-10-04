export const TUTORIAL_VERSION='0.1.1';
export const TUTORIAL_ACTIONS=['overview','assembled','beForm','exchanged','prepared','explained','attacked'];
export function createTutorial(profile){return{tutorialVersion:TUTORIAL_VERSION,isIntroRun:!profile.firstRuneIntroSeen,visible:!profile.guideSeen,completed:false,skipped:false,actions:{},step:0};}
export function tutorialStep(t){return TUTORIAL_ACTIONS.findIndex(key=>!t?.actions?.[key]);}
/** Action evidence only. No cards, RNG or resources are supplied by the guide. */
export function recordTutorialAction(run,type,command){const t=run.tutorial;if(!t?.visible||t.tutorialVersion!==TUTORIAL_VERSION)return null;t.actions??={};
 if(type==='ACK_GUIDE_OVERVIEW')t.actions.overview=true;
 if(['ADD_CARD','SWAP_CARDS','REORDER_SENTENCE'].includes(type)&&run.combat.sentenceSlots.length>=3)t.actions.assembled=true;
 if(type==='SET_FORM'&&['form.be.am','form.be.is','form.be.are'].includes(command.formId))t.actions.beForm=true;
 if(type==='EXCHANGE')t.actions.exchanged=true;
 if(type==='PREPARE')t.actions.prepared=true;
 if(type==='ACK_ATTACK_GUIDE')t.actions.explained=true;
 if(type==='FINISH_PRESENTATION'){t.actions.attacked=true;t.visible=false;t.completed=TUTORIAL_ACTIONS.every(k=>t.actions[k]);t.skipped=!t.completed;t.endReason=t.completed?'COMPLETED':'ALTERNATIVE_PLAY';}
 if(type==='SKIP_GUIDE'){t.visible=false;t.skipped=true;t.completed=false;t.endReason='USER_SKIP';}
 t.step=Math.max(0,tutorialStep(t));return !t.visible?{type:t.completed?'GUIDE_COMPLETED':'GUIDE_SKIPPED',tutorialVersion:TUTORIAL_VERSION,actions:{...t.actions},reason:t.endReason}:null;
}
