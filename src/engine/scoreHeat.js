// Display policy only: consumes committed integers; never feeds scoring or RNG.
export const SCORE_HEAT_THRESHOLDS=Object.freeze([100,300,600,1000,1500,2000,3000,4000,5000,6000,10000]);
export const SCORE_HEAT_SCALES=Object.freeze([1,1.06,1.13,1.22,1.32,1.41,1.50,1.60,1.69,1.78,1.88,2.02]);
export const scoreHeatTier=value=>SCORE_HEAT_THRESHOLDS.filter(n=>value>=n).length;
export function createScoreHeat(){
 let attackId=null,value=0,seen=new Set(),events=new Set();
 return {
  begin(id){if(id===attackId)return false;attackId=id;value=0;seen.clear();events.clear();return true;},
  apply(event){
   if(!Number.isSafeInteger(event.after)||event.after<0)throw Error('Invalid score heat value');
   if(events.has(event.eventId))return {value,tier:scoreHeatTier(value),burst:false,duplicate:true};
   events.add(event.eventId);const crossed=SCORE_HEAT_THRESHOLDS.filter(n=>n>event.before&&n<=event.after&&!seen.has(n));
   for(const n of SCORE_HEAT_THRESHOLDS)if(event.after>=n)seen.add(n);
   value=event.after;return {value,tier:scoreHeatTier(value),burst:crossed.length>0,crossed,delta:event.after-event.before};
  },
  reset(){attackId=null;value=0;seen.clear();events.clear();},
 };
}
