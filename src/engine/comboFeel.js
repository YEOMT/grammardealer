/** Visual progression only. Never participates in score or damage calculation. */
export function meaningfulComboEvent(e){
 if(!['GRAMMAR','RUNE'].includes(e.sourceType)||['CARD_BASE','ACCURACY','REGION','RESISTANCE','BOSS','FINAL'].includes(e.phase)||e.after<=e.before)return false;
 return e.operation==='ADD'&&(e.operand??e.after-e.before)>0||e.operation==='MULTIPLY'&&e.operand?.num>e.operand?.den;
}
export function comboFeel(count){
 const n=Math.max(0,Math.min(14,count)),tier=n>=12?5:n>=8?4:n>=5?3:n>=3?2:n>0?1:0;
 const anchors=[[0,0,0,1],[1,5,2,1.02],[3,8,4,1.035],[5,12,8,1.05],[8,18,12,1.065],[12,24,16,1.08],[14,24,16,1.08]];
 const hi=anchors.findIndex(a=>a[0]>=n),a=anchors[Math.max(0,hi-1)],b=anchors[hi],t=a===b?0:(n-a[0])/(b[0]-a[0]);
 const interpolate=i=>a[i]+(b[i]-a[i])*t;
 return {tier,progress:n/14,glow:interpolate(1),scale:interpolate(3),particles:Math.round(interpolate(2))};
}
export function runeFeel(rarity='COMMON',level=1){return ({COMMON:1,UNCOMMON:1.15,RARE:1.35}[rarity]??1)*([1,1.1,1.2][Math.max(0,Math.min(2,level-1))]);}
