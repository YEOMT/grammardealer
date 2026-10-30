/** Read-only presentation classification of committed events, never a scoring rule. */
export function scoreFeedback(event){
 const delta=event.after-event.before;
 const kind=delta<0?(['BOSS','RESISTANCE'].includes(event.phase)||event.sourceType==='BOSS'?'defense':event.sourceType==='GRAMMAR'&&event.phase==='ACCURACY'?'grammar-loss':'loss'):delta===0?'neutral':event.sourceType==='RUNE'?'rune':event.phase==='CARD_BASE'?'card':'combo';
 const amount=delta<0?`−${-delta}`:event.operation==='ADD'&&event.operand>0?`+${event.operand}`:event.operation==='MULTIPLY'&&event.operand?.den?`×${event.operand.num/event.operand.den}`:'';
 return {kind,delta,amount,color:({'grammar-loss':'#ff956d',defense:'#b1cbdd',loss:'#ddd0b6',neutral:'#c6d4ce',card:'#f5e6b6',combo:'#ffe3a0',rune:'#fff0ca'})[kind]};
}
