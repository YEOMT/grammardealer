// At most the current and adjacent scene are retained. No game state, audio or RNG access.
const scenes=new Map(),requests=new Map();
function request(url){
 if(!url)return null;
 if(requests.has(url))return requests.get(url);
 const image=new Image(),record={url,status:'loading',promise:null};
 record.promise=new Promise(resolve=>{
  let settled=false;
  const finish=ok=>{if(settled)return;settled=true;image.onload=image.onerror=null;record.status=ok?'ready':'failed';resolve(ok);};
  image.onload=async()=>{
   try{await image.decode?.();}catch{/* Some browsers reject decode after a successful load. */}
   finish(image.naturalWidth>0&&image.naturalHeight>0);
  };
  image.onerror=()=>finish(false);image.decoding='async';image.src=url;
 });
 requests.set(url,record);return record;
}
export function prepareImages(key,urls){
 const cached=scenes.get(key);
 if(cached&&!Object.values(cached.assets).some(r=>r?.status==='failed')){
  scenes.delete(key);scenes.set(key,cached);return cached;
 }
 // Failure can retry on explicit scene entry, never on a timer or retained combat edit.
 if(cached)for(const r of Object.values(cached.assets))if(r?.status==='failed')requests.delete(r.url);
 const assets=Object.fromEntries(Object.entries(urls).map(([name,url])=>[name,request(url)]));
 let timer;
 const ready=Promise.all([assets.background?.promise,assets.idle?.promise]);
 const gate=Promise.race([ready,new Promise(resolve=>{timer=setTimeout(resolve,600);})]).finally(()=>clearTimeout(timer));
 const plan={assets,gate};scenes.delete(key);scenes.set(key,plan);
 while(scenes.size>2)scenes.delete(scenes.keys().next().value);
 const active=new Set([...scenes.values()].flatMap(p=>Object.values(p.assets).filter(Boolean).map(r=>r.url)));
 for(const url of requests.keys())if(!active.has(url))requests.delete(url);
 return plan;
}

/** A displayed image owns its callbacks. Decoded pixels never decide pose or life state. */
export function bindPreparedImage(img,record,onReady){
 if(!record)return()=>{};
 let alive=true,settled=false,decoding=false;
 const finish=ok=>{if(!alive||settled)return;settled=true;img.onload=img.onerror=null;onReady(ok);};
 const check=async()=>{
  if(!alive||settled||decoding||!img.complete||!img.naturalWidth)return;
  decoding=true;
  try{await img.decode?.();}catch{/* Use valid loaded intrinsic dimensions as fallback. */}
  finish(img.naturalWidth>0&&img.naturalHeight>0);
 };
 img.onload=check;img.onerror=()=>finish(false);img.src=record.url;
 record.promise.then(ok=>{if(!ok)finish(false);else check();});
 return()=>{alive=false;img.onload=img.onerror=null;};
}
