import {button,toast} from './dom.js';

/** Viewport state belongs to the view only, never a run/save or its RNG. */
export function installViewport(win=window,doc=document){
 let frame=0;
 const update=()=>{frame=0;const vv=win.visualViewport;
  // Pinch zoom must zoom the existing layout instead of shrinking it again.
  if(!vv||Math.abs(vv.scale-1)<.02){
   const height=vv?.height??win.innerHeight;
   doc.documentElement.style.setProperty('--viewport-height',`${height}px`);
   doc.documentElement.dataset.shortViewport=String(height<430);
  }
  doc.dispatchEvent(new Event('atlas:viewport'));
 };
 const schedule=()=>{doc.dispatchEvent(new Event('atlas:cancel-drag'));if(!frame)frame=win.requestAnimationFrame(update);};
 win.addEventListener('resize',schedule);win.visualViewport?.addEventListener('resize',schedule);
 doc.addEventListener('fullscreenchange',schedule);update();
 return()=>{win.removeEventListener('resize',schedule);win.visualViewport?.removeEventListener('resize',schedule);doc.removeEventListener('fullscreenchange',schedule);if(frame)win.cancelAnimationFrame(frame);};
}
export function fullscreenButton(){
 const node=button('',async()=>{
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
   else toast('이 브라우저는 전체화면을 지원하지 않습니다. 브라우저 메뉴의 전체화면을 이용해 주세요.');
  }catch{toast('전체화면으로 전환하지 못했습니다. 브라우저 메뉴의 전체화면을 이용해 주세요.');}
  sync();
 },'quiet fullscreen-toggle',{'aria-label':'전체화면 전환'});
 const sync=()=>{const active=!!document.fullscreenElement;node.textContent=active?'전체화면 종료':'전체화면';node.setAttribute('aria-pressed',String(active));};
 sync();return node;
}
// A single delegated listener also updates buttons rendered after a transition.
export function syncFullscreenButtons(){
 const sync=()=>document.querySelectorAll('.fullscreen-toggle').forEach(n=>{const active=!!document.fullscreenElement;n.textContent=active?'전체화면 종료':'전체화면';n.setAttribute('aria-pressed',String(active));});
 document.addEventListener('fullscreenchange',sync);return()=>document.removeEventListener('fullscreenchange',sync);
}

/** One measured row on every viewport. Paging only changes visibility, never card IDs. */
export function cardPager(zone,{label,selected=()=>0,pageSize=10}={}){
 let page=0;const nav=document.createElement('div');nav.className='card-pager';
 const prev=button('‹',()=>{document.dispatchEvent(new Event('atlas:cancel-drag'));page--;update();},'quiet',{'aria-label':'이전 손패 페이지'}),next=button('›',()=>{document.dispatchEvent(new Event('atlas:cancel-drag'));page++;update();},'quiet',{'aria-label':'다음 손패 페이지'});
 const status=document.createElement('span');status.setAttribute('aria-live','polite');
 const row=document.createElement('div');row.className='hand-page-row';zone.before(row);row.append(prev,zone,next);
 nav.append(status);row.before(nav);
 const update=()=>{
  const cards=[...zone.querySelectorAll(':scope > .word-card')];
  const width=(cards[0]?parseFloat(getComputedStyle(cards[0]).width):82),gap=parseFloat(getComputedStyle(zone).columnGap)||5;
  const size=Math.max(1,Math.min(pageSize,Math.floor((zone.clientWidth+gap)/(width+gap)))),pages=Math.max(1,Math.ceil(cards.length/size));
  page=Math.max(0,Math.min(page,pages-1));
  cards.forEach((n,i)=>{n.hidden=i<page*size||i>=(page+1)*size;n.dataset.absoluteIndex=String(i);});
  zone.style.setProperty('--visible-cards',String(Math.min(size,cards.length)||1));
  status.textContent=`${label} ${page+1} / ${pages} · 전체 ${cards.length}장${selected()?` · 선택 ${selected()}장`:''}`;
  prev.disabled=page===0;next.disabled=page===pages-1;
 };
 const observer=new ResizeObserver(update);observer.observe(zone);
 document.addEventListener('atlas:viewport',update);update();
 return {update,cleanup(){observer.disconnect();document.removeEventListener('atlas:viewport',update);}};
}

/** Explicit small-screen shop pages; prices and inventory are never regenerated here. */
export function shopViewport(main){
 main.classList.add('responsive-shop');
 const zone=main.querySelector('.shop-inventory'),notices=document.createElement('details'),content=document.createElement('div'),summary=document.createElement('summary');
 notices.className='shop-notices';content.className='shop-notice-content';summary.textContent='입장 준비 · 보스 공략 · 장착 룬';
 content.append(...main.querySelectorAll(':scope > .shop-boss-hint,:scope > .shop-equipped,:scope > .entry-grant'));notices.append(summary,content);zone.before(notices);
 let page=0;const nav=document.createElement('nav'),status=document.createElement('span');nav.className='shop-pager';nav.setAttribute('aria-label','상점 상품 페이지');status.setAttribute('aria-live','polite');
 const prev=button('이전 상품',()=>{page--;update();},'quiet'),next=button('다음 상품',()=>{page++;update();},'quiet');nav.append(prev,status,next);zone.after(nav);
 const update=()=>{const items=[...zone.children],size=innerHeight<430||innerWidth<720?2:innerWidth<940?3:items.length,pages=Math.max(1,Math.ceil(items.length/size));page=Math.max(0,Math.min(page,pages-1));items.forEach((n,i)=>n.hidden=i<page*size||i>=(page+1)*size);zone.style.setProperty('--shop-columns',String(size));nav.hidden=pages===1;status.textContent=`상품 ${page+1}/${pages} · 전체 ${items.length}개`;prev.disabled=page===0;next.disabled=page===pages-1;};
 update();document.addEventListener('atlas:viewport',update);return()=>document.removeEventListener('atlas:viewport',update);
}
/** Keep regional rules available as an explicit expandable information panel. */
export function introViewport(main){
 main.classList.add('responsive-intro');const content=document.createElement('div'),details=document.createElement('details'),summary=document.createElement('summary');
 details.className='intro-details';content.className='intro-details-content';summary.textContent='지역 안내 · 전투 목록 · 보스 규칙';details.open=innerWidth>=940&&innerHeight>=700;
 const nodes=[...main.querySelectorAll(':scope > .boss-preview,:scope > .intro-encounters,:scope > .helper')];if(!nodes.length)return;nodes[0].before(details);content.append(...nodes);details.append(summary,content);
}
