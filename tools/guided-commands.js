import {tutorialCommand,tutorialCardId as id} from '../src/game/guidedTutorial.js';
/** QA command-level replay of every real tutorial action. No card/damage/state injection. */
export function completeGuidedCommands(controller,dispatch){
 let steps=0;
 while(controller.getState().tutorialSession?.active){
  if(++steps>100)throw Error('Tutorial QA command budget');
  const s=controller.getState(),t=s.tutorialSession,n=t.step;let command;
  if([1,6,13,18,19,30,31].includes(n))command={type:'TUTORIAL_ACK'};
  else if([2,3,5,9,22].includes(n)){const [card,index]={2:[0,0],3:[1,1],5:[1,1],9:[6,2],22:[10,1]}[n];command={type:'ADD_CARD',cardId:id(card),index};}
  else if(n===4)command={type:'RETURN_CARD',cardId:id(1)};
  else if(n===7)command={type:'TUTORIAL_SELECT',cardId:id(2)};
  else if(n===8)command={type:'EXCHANGE',cardIds:[id(2)]};
  else if(n===10)command={type:'REORDER_SENTENCE',cardId:id(6),index:0};
  else if([11,25].includes(n))command={type:'SUBMIT'};
  else if([12,29].includes(n))command={type:'FINISH_PRESENTATION',attackId:t.attackId};
  else if(n>=14&&n<=17)command={type:t.panel?'TUTORIAL_PANEL_CLOSE':'TUTORIAL_PANEL_OPEN',kind:['discard','deck','draw','dictionary'][n-14]};
  else if(n===20)command={type:'ADD_CARD',cardId:id([7,8,9][s.combat.sentenceSlots.length])};
  else if(n===21)command={type:'PREPARE'};
  else if(n===23)command={type:'TUTORIAL_FORM_OPEN',cardId:id(10)};
  else if(n===24)command={type:'SET_FORM',cardId:id(10),formId:'form.run.third'};
  else if(n>=26&&n<=28)command={type:'TUTORIAL_GATE_ACK',attackId:t.attackId};
  else throw Error('Unknown tutorial QA cue '+n);
  dispatch(tutorialCommand(s,command));
 }
}
