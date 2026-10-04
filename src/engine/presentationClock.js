/** Active animation time only. Reading gates and hidden tutorial tabs spend no budget. */
export function presentationClock({document,signal,budget,onTimeout,now=()=>performance.now(),setInterval:every=globalThis.setInterval,clearInterval:stop=globalThis.clearInterval}={}){
 let elapsed=0,last=now(),paused=false,closed=false,waiters=[];
 const tick=()=>{const time=now(),delta=Math.max(0,time-last);last=time;if(!paused&&!document?.hidden)elapsed+=delta;
  for(const w of [...waiters])if(closed||elapsed>=w.until){waiters=waiters.filter(x=>x!==w);w.resolve();}
  if(!closed&&elapsed>budget){onTimeout?.();close();}
 };
 const interval=every(tick,16);
 const visibility=()=>{last=now();};document?.addEventListener?.('visibilitychange',visibility);
 const close=()=>{if(closed)return;closed=true;stop(interval);document?.removeEventListener?.('visibilitychange',visibility);signal?.removeEventListener('abort',close);for(const w of waiters)w.resolve();waiters=[];};
 signal?.addEventListener('abort',close,{once:true});
 return{wait(ms){return closed?Promise.resolve():new Promise(resolve=>waiters.push({until:elapsed+ms,resolve}));},pause(value){tick();paused=value;last=now();},close,get elapsed(){return elapsed;},get paused(){return paused;}};
}
