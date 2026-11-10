import {button,el} from './dom.js';
/** Presentation geometry only: physical cards, never transformed ghosts or game state. */
export function boardRows(width, cardWidth, gap, count) {
 const columns=Math.max(1,Math.floor((width+gap)/(cardWidth+gap)));
 return {columns,rows:count?Math.ceil(count/columns):0};
}
/** Fixed physical sequence chunks, independent of viewport/card count. */
export function sentenceRows(cards){return cards.length?[cards.slice(0,12),...(cards.length>12?[cards.slice(12)]:[])]:[];}
/** Readable mobile geometry. A twelve-card group may wrap, never change its membership. */
export function mobileBoardLayout({width,height,count,longestWord=0}){
 const gap=4,formHeight=24,border=6,available=Math.max(1,width);
 // About 11px for long words in the existing Georgia face; the full form menu remains available.
 const readable=Math.max(52,Math.min(104,longestWord*.66*11+10));
 const columns=available>=12*readable+11*gap?12:6;
 const used=Math.min(columns,Math.max(1,count));
 const progress=(Math.min(12,Math.max(1,count))-1)/11;
 const cardWidth=Math.min(104-(104-Math.max(70,readable))*progress,(available-gap*(used-1))/used);
 const lines=count?sentenceRows(Array.from({length:count})).reduce((n,row)=>n+Math.ceil(row.length/columns),0):0;
 const bodyHeight=Math.max(32,Math.min(36-4*progress,(height-gap*Math.max(0,lines-1))/Math.max(1,lines)-formHeight-border));
 const cardHeight=bodyHeight+formHeight+border;
 return {columns,fallback:columns===6,cardWidth,bodyHeight,formHeight,cardHeight,wordSize:bodyHeight-20,lines,overflow:lines*cardHeight+Math.max(0,lines-1)*gap>height+.5};
}
export function observeBoard(zone){
 const cards=[...zone.children].filter(n=>n.classList.contains('word-card'));
 cards.forEach((n,i)=>{n.dataset.absoluteIndex=String(i);});
 if(cards.length){zone.replaceChildren(...sentenceRows(cards).map(group=>{const row=document.createElement('div');row.className='sentence-row';row.append(...group);return row;}));}
 if(!cards.length){const grid=document.createElement('div');grid.className='empty-board-grid';grid.setAttribute('aria-hidden','true');for(let i=0;i<24;i++){const slot=document.createElement('span');slot.textContent='+';grid.append(slot);}zone.append(grid);}
 zone.dataset.columns='12';zone.dataset.rows=String(Math.ceil(cards.length/12));
 const scrollGroup=direction=>{document.dispatchEvent(new Event('atlas:cancel-drag'));const group=zone.querySelector('.sentence-row');zone.scrollTop+=direction*((group?.getBoundingClientRect().height??zone.clientHeight)+4);syncScroll();};
 const up=button('↑',()=>scrollGroup(-1),'quiet',{'aria-label':'문장 앞부분 보기'}),down=button('↓',()=>scrollGroup(1),'quiet',{'aria-label':'문장 뒷부분 보기'});
 const controls=el('div',{class:'board-scroll-controls',hidden:true},up,down);zone.after(controls);
 const syncScroll=()=>{up.disabled=zone.scrollTop<=1;down.disabled=zone.scrollTop+zone.clientHeight>=zone.scrollHeight-1;};zone.addEventListener('scroll',syncScroll,{passive:true});
 // Count is frozen for this render (including a submitted presentation snapshot).
 const update=()=>{
  zone.style.removeProperty('--board-scale');
  if(document.documentElement.dataset.handheld==='true'){
   const css=getComputedStyle(zone),options={width:zone.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)+(zone.dataset.mobileScrollControls==='true'?30:0),height:zone.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom),count:cards.length,longestWord:Math.max(0,...cards.map(n=>n.querySelector('.card-word')?.textContent.length??0))};
   let layout=mobileBoardLayout(options);const showControls=layout.overflow;controls.hidden=!showControls;zone.dataset.mobileScrollControls=String(showControls);
   if(showControls)layout=mobileBoardLayout({...options,width:Math.max(1,options.width-30)});
   for(const [name,value]of Object.entries({'width':layout.cardWidth,'height':layout.cardHeight,'body':layout.bodyHeight}))zone.style.setProperty('--mobile-card-'+name,value+'px');
   zone.style.setProperty('--mobile-form-height',layout.formHeight+'px');zone.style.setProperty('--mobile-word-size',layout.wordSize+'px');zone.style.setProperty('--mobile-columns',String(layout.columns));
   zone.dataset.mobileColumns=String(layout.columns);zone.dataset.mobileFallback=String(layout.fallback);zone.dataset.mobileLines=String(layout.lines);zone.dataset.mobileOverflow=String(layout.overflow);
   syncScroll();
   return;
  }
  controls.hidden=true;for(const key of ['mobileColumns','mobileFallback','mobileLines','mobileOverflow','mobileScrollControls'])delete zone.dataset[key];
  for(const name of ['card-width','card-height','card-body','form-height','word-size','columns'])zone.style.removeProperty('--mobile-'+name);
  const css=getComputedStyle(zone),base=parseFloat(getComputedStyle(cards[0]??zone.querySelector('.empty-board-grid span')).width),height=parseFloat(getComputedStyle(zone.querySelector('.empty-board-grid')??zone).getPropertyValue('--board-body'))+parseFloat(css.getPropertyValue('--form-height'))+6;
  const count=cards.length,rows=Math.max(1,Math.ceil(count/12)),columns=Math.min(12,Math.max(1,count));
  const target=count<=5?1.25:count<=9?1.15:count<=11?1.06:1;
  const padding=parseFloat(css.paddingLeft)+parseFloat(css.paddingRight),gap=parseFloat(css.rowGap)||0;
  const scale=Math.min(target,(zone.clientWidth-padding-(columns-1)*4)/(columns*base),(zone.clientHeight-padding-(rows-1)*gap)/(rows*height));
  zone.style.setProperty('--board-scale',String(Math.max(.1,scale)));zone.dataset.sizeBand=String(target);
 };
 // Parent/rune-rail size can change without a window resize. No game callbacks are involved.
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(()=>{if(document.documentElement.dataset.handheld==='true')update();}):null;resize?.observe(zone);
 update();document.addEventListener('atlas:viewport',update);
 return ()=>{resize?.disconnect();document.removeEventListener('atlas:viewport',update);zone.removeEventListener('scroll',syncScroll);controls.remove();};
}
