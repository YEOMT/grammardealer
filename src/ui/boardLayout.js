import {button,el} from './dom.js';
/** Presentation geometry only: physical cards, never transformed ghosts or game state. */
export function boardRows(width, cardWidth, gap, count) {
 const columns=Math.max(1,Math.floor((width+gap)/(cardWidth+gap)));
 return {columns,rows:count?Math.ceil(count/columns):0};
}
/** Fixed physical sequence chunks, independent of viewport/card count. */
export function sentenceRows(cards){return cards.length?[cards.slice(0,12),...(cards.length>12?[cards.slice(12)]:[])]:[];}
const MOBILE_COLUMNS = 8;
const MOBILE_GAP = 4;

/** Handheld CSS lays the physical cards out continuously across the desktop row wrappers. */
export function mobileBoardLayout({width, height, count}) {
  const rowSlots = Math.max(1, Math.min(count, MOBILE_COLUMNS));
  const lines = Math.ceil(count / MOBILE_COLUMNS);
  const fullSlot = (width - MOBILE_GAP * (MOBILE_COLUMNS - 1)) / MOBILE_COLUMNS;
  const availableSlot = (width - MOBILE_GAP * (rowSlots - 1)) / rowSlots;
  const cardWidth = Math.max(1, Math.min(Math.max(88, fullSlot), availableSlot));

  const formHeight = 24;
  const frame = 6;
  const rowGaps = MOBILE_GAP * Math.max(0, lines - 1);
  const availableBody = (height - rowGaps) / Math.max(1, lines) - formHeight - frame;
  const bodyHeight = Math.max(30, Math.min(34, availableBody));
  const cardHeight = bodyHeight + formHeight + frame;
  const overflow = lines * cardHeight + rowGaps > height + .5;
  return {columns: MOBILE_COLUMNS, rowSlots, lines, cardWidth, cardHeight, bodyHeight, formHeight, overflow};
}
export function observeBoard(zone){
 const cards=[...zone.children].filter(n=>n.classList.contains('word-card'));
 const words = cards.map(card => card.querySelector('.card-word')).filter(Boolean);
 cards.forEach((n,i)=>{n.dataset.absoluteIndex=String(i);});
 if(cards.length){zone.replaceChildren(...sentenceRows(cards).map(group=>{const row=document.createElement('div');row.className='sentence-row';row.append(...group);return row;}));}
 if(!cards.length){const grid=document.createElement('div');grid.className='empty-board-grid';grid.setAttribute('aria-hidden','true');for(let i=0;i<24;i++){const slot=document.createElement('span');slot.textContent='+';grid.append(slot);}zone.append(grid);}
 zone.dataset.columns='12';zone.dataset.rows=String(Math.ceil(cards.length/12));
 const scrollGroup = direction => {
   document.dispatchEvent(new Event('atlas:cancel-drag'));
   const rowStep = (cards[0]?.getBoundingClientRect().height ?? 0) + MOBILE_GAP;
   const visibleRows = Math.max(1, Math.floor((zone.clientHeight + MOBILE_GAP) / rowStep));
   zone.scrollTop += direction * visibleRows * rowStep;
   syncScroll();
 };
 const up=button('↑',()=>scrollGroup(-1),'quiet',{'aria-label':'문장 앞부분 보기'}),down=button('↓',()=>scrollGroup(1),'quiet',{'aria-label':'문장 뒷부분 보기'});
 const controls=el('div',{class:'board-scroll-controls',hidden:true},up,down);zone.after(controls);
 const syncScroll=()=>{up.disabled=zone.scrollTop<=1;down.disabled=zone.scrollTop+zone.clientHeight>=zone.scrollHeight-1;};zone.addEventListener('scroll',syncScroll,{passive:true});
 // Count is frozen for this render (including a submitted presentation snapshot).
 const update=()=>{
  zone.style.removeProperty('--board-scale');
  if(document.documentElement.dataset.handheld==='true'){
   const css = getComputedStyle(zone);
   const horizontalPadding = parseFloat(css.paddingLeft) + parseFloat(css.paddingRight);
   const height = zone.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
   const measure = () => mobileBoardLayout({width: zone.clientWidth - horizontalPadding, height, count: cards.length});
   let layout = measure();
   const hadScrollControls = !controls.hidden;
   controls.hidden = !layout.overflow;
   zone.dataset.mobileScrollControls = String(layout.overflow);
   if (hadScrollControls !== layout.overflow) layout = measure(); // The rail changes the content width.

   // clientWidth is rounded. Also cap at the fractional CSS content width so an eighth card
   // can never wrap just because the measured board width rounded up.
   const widthLimit = `calc((100% - ${(layout.rowSlots - 1) * MOBILE_GAP}px) / ${layout.rowSlots})`;
   zone.style.setProperty('--mobile-card-width', `min(${layout.cardWidth}px, ${widthLimit})`);
   zone.style.setProperty('--mobile-card-height', layout.cardHeight + 'px');
   zone.style.setProperty('--mobile-form-height', layout.formHeight + 'px');
   zone.dataset.mobileColumns = String(layout.columns);
   zone.dataset.mobileLines = String(layout.lines);
   zone.dataset.mobileOverflow = String(layout.overflow);
   // Fit only the words that exceed their tile, keeping the hand's font height.
   // Layout widths are independent of CSS scale. Finish all reads before writing.
   const wordScales = words.map(word => {
     const available = Math.max(1, word.parentElement.clientWidth - 2);
     return Math.min(1, available / Math.max(1, word.scrollWidth));
   });
   words.forEach((word, i) => word.style.setProperty('--mobile-word-fit', String(wordScales[i])));
   syncScroll();
   return;
  }
  controls.hidden=true;for(const key of ['mobileColumns','mobileLines','mobileOverflow','mobileScrollControls'])delete zone.dataset[key];
  for(const name of ['card-width','card-height','form-height'])zone.style.removeProperty('--mobile-'+name);
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
