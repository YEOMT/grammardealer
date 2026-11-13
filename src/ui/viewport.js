import {button} from './dom.js';
export {installViewport} from './visualViewport.js';
export {fullscreenButton, lobbyAddress, syncFullscreenButtons} from './immersive.js';

/** One measured row on every viewport. Paging only changes visibility, never card IDs. */
export function handPageWindow({count,width,cardWidth,gap=5,page=0,pageSize=10,mobile=false}){
 const size=Math.max(1,Math.min(pageSize,mobile?7:pageSize,Math.floor((width+gap)/(cardWidth+gap)))),pages=Math.max(1,Math.ceil(count/size));
 const current=Math.max(0,Math.min(page,pages-1));return {size,pages,page:current,start:current*size,end:Math.min(count,(current+1)*size)};
}
export function cardPager(zone,{label,selected=()=>0,pageSize=10,memory={page:0}}={}){
 const nav=document.createElement('div');nav.className='card-pager';
 const prev=button('‹',()=>{document.dispatchEvent(new Event('atlas:cancel-drag'));memory.page--;update();},'quiet',{'aria-label':'이전 손패 페이지'}),next=button('›',()=>{document.dispatchEvent(new Event('atlas:cancel-drag'));memory.page++;update();},'quiet',{'aria-label':'다음 손패 페이지'});
 const status=document.createElement('span');status.setAttribute('aria-live','polite');
 const row=document.createElement('div');row.className='hand-page-row';zone.before(row);row.append(prev,zone,next);
 nav.append(status);row.before(nav);
 const update=()=>{
  const cards=[...zone.querySelectorAll(':scope > .word-card')];
  const width=(cards[0]?parseFloat(getComputedStyle(cards[0]).width):82),gap=parseFloat(getComputedStyle(zone).columnGap)||5;
  const {size,pages,page,start,end}=handPageWindow({count:cards.length,width:zone.clientWidth,cardWidth:width,gap,page:memory.page,pageSize,mobile:document.documentElement.dataset.handheld==='true'});memory.page=page;
  cards.forEach((n,i)=>{n.hidden=i<start||i>=end;n.dataset.absoluteIndex=String(i);});
  zone.style.setProperty('--visible-cards',String(end-start||1));
  zone.dataset.page=String(page);zone.dataset.pageSize=String(size);
  status.textContent=`${label} ${page+1} / ${pages} · 전체 ${cards.length}장${selected()?` · 선택 ${selected()}장`:''}`;
  prev.disabled=page===0;next.disabled=page===pages-1;
 };
 // Paging reacts to committed renders and viewport changes, not animated content.
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(update):null;resize?.observe(zone);
 document.addEventListener('atlas:viewport',update);update();
 return {update,memory,cleanup(){resize?.disconnect();document.removeEventListener('atlas:viewport',update);}};
}

/** Explicit small-screen shop pages; prices and inventory are never regenerated here. */
export function shopViewport(main){
 main.classList.add('responsive-shop');
 const zone=main.querySelector('.shop-inventory'),notices=document.createElement('details'),content=document.createElement('div'),summary=document.createElement('summary');
 notices.className='shop-notices';content.className='shop-notice-content';summary.textContent='입장 준비 · 보스 공략 · 장착 룬';
 content.append(...main.querySelectorAll(':scope > .shop-boss-hint,:scope > .shop-equipped,:scope > .entry-grant'));notices.append(summary,content);zone.before(notices);
 let page=0;const nav=document.createElement('nav'),status=document.createElement('span');nav.className='shop-pager';nav.setAttribute('aria-label','상점 상품 페이지');status.setAttribute('aria-live','polite');
 const prev=button('이전 상품',()=>{page--;update();},'quiet'),next=button('다음 상품',()=>{page++;update();},'quiet');nav.append(prev,status,next);zone.after(nav);
 const update=()=>{
   const items = [...zone.children];
   const width = main.clientWidth;
   const compact = document.documentElement.dataset.shortViewport === 'true';
   const size = compact || width < 720 ? 2 : width < 940 ? 3 : Math.max(1,items.length);
   const pages = Math.max(1, Math.ceil(items.length / size));
   page = Math.max(0, Math.min(page, pages - 1));
   items.forEach((item,i) => { item.hidden = i < page * size || i >= (page + 1) * size; });
   zone.style.setProperty('--shop-columns',String(size));
   nav.hidden = pages === 1;
   status.textContent = `상품 ${page + 1}/${pages} · 전체 ${items.length}개`;
   prev.disabled = page === 0;
   next.disabled = page === pages - 1;
 };
 update();document.addEventListener('atlas:viewport',update);return()=>document.removeEventListener('atlas:viewport',update);
}
/** View-only region introduction; entry/choice/shop transitions remain controller-owned. */
export function introViewport(main){main.classList.add('responsive-intro');}
