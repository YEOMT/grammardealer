/** View policy only: neither keyboard geometry nor a narrow desktop creates a phone. */
export function handheldLayout({touchPoints=0,coarse=false,mobile=false,width,height}){
 return touchPoints>0&&(coarse||mobile)&&Math.min(width,height)<=600&&Math.max(width,height)<=1000;
}
export function installDeviceLayout(win=window,doc=document){
 const query=win.matchMedia('(pointer: coarse)');
 const update=()=>{
  // A mobile browser can inflate innerWidth to the previous desktop content's minimum width.
  // The root client viewport breaks that layout/classification feedback loop on rotation.
  const width=doc.documentElement.clientWidth||win.innerWidth,height=doc.documentElement.clientHeight||win.innerHeight;
  const next=String(handheldLayout({touchPoints:win.navigator.maxTouchPoints,coarse:query.matches,mobile:/Android|iPhone|Mobile/i.test(win.navigator.userAgent),width,height}));
  if(doc.documentElement.dataset.handheld===next)return;
  doc.dispatchEvent(new Event('atlas:cancel-drag'));doc.documentElement.dataset.handheld=next;
  // Run after CSS changes; board/pager/FX keep their existing viewport lifecycle.
  win.requestAnimationFrame(()=>doc.dispatchEvent(new Event('atlas:viewport')));
 };
 update();win.addEventListener('resize',update);query.addEventListener?.('change',update);
 return()=>{win.removeEventListener('resize',update);query.removeEventListener?.('change',update);};
}
