import {button,el} from './dom.js';
import {applyMeasuredWordFit,clearWordFitCache} from './wordFit.js';
/** Presentation geometry only: physical cards, never transformed ghosts or game state. */
export function boardRows(width, cardWidth, gap, count) {
 const columns=Math.max(1,Math.floor((width+gap)/(cardWidth+gap)));
 return {columns,rows:count?Math.ceil(count/columns):0};
}
/** Fixed physical sequence chunks, independent of viewport/card count. */
export function sentenceRows(cards){return cards.length?[cards.slice(0,12),...(cards.length>12?[cards.slice(12)]:[])]:[];}
const MOBILE_COLUMNS = 8;
const MOBILE_GAP = 4;
/** Narrow touch windows trade a further internal row for readable physical words. */
export function handheldBoardColumns(layoutWidth){return layoutWidth<720?6:MOBILE_COLUMNS;}

/** Handheld CSS lays the physical cards out continuously across the desktop row wrappers. */
export function mobileBoardLayout({width, height, count, columns=MOBILE_COLUMNS, columnGap=MOBILE_GAP}) {
  const rowSlots = Math.max(1, Math.min(count, columns));
  const lines = Math.ceil(count / columns);
  const fullSlot = (width - columnGap * (columns - 1)) / columns;
  const availableSlot = (width - columnGap * (rowSlots - 1)) / rowSlots;
  const cardWidth = Math.max(1, Math.min(Math.max(88, fullSlot), availableSlot));

  const formHeight = 28;
  const frame = 6;
  const rowGaps = MOBILE_GAP * Math.max(0, lines - 1);
  const availableBody = (height - rowGaps) / Math.max(1, lines) - formHeight - frame;
  const bodyHeight = Math.max(30, Math.min(34, availableBody));
  const cardHeight = bodyHeight + formHeight + frame;
  const overflow = lines * cardHeight + rowGaps > height + .5;
  return {columns, rowSlots, lines, cardWidth, cardHeight, bodyHeight, formHeight, overflow};
}
export function observeBoard(zone){
 const cards=[...zone.children].filter(n=>n.classList.contains('word-card'));
 const shell=zone.closest('.responsive-battle'),hand=shell?.querySelector('.hand-cards');
 let disposed=false,frame=0;
 const fitWords=()=>{
  frame=0;if(disposed)return;
  const words=shell?.querySelectorAll('.word-card .card-word')??[];
  const portable=document.documentElement.dataset.portable==='true';
  for(const word of words){
   if(portable&&!word.closest('.word-card').hidden)applyMeasuredWordFit(word);
   else{word.style.removeProperty('--measured-word-size');word.style.removeProperty('--measured-word-scale');delete word.dataset.wordFitReadable;}
  }
 };
 const requestFit=()=>{if(!disposed&&!frame)frame=requestAnimationFrame(fitWords);};
 cards.forEach((n,i)=>{n.dataset.absoluteIndex=String(i);});
 if(cards.length){zone.replaceChildren(...sentenceRows(cards).map(group=>{const row=document.createElement('div');row.className='sentence-row';row.append(...group);return row;}));}
 if(!cards.length){const grid=document.createElement('div');grid.className='empty-board-grid';grid.setAttribute('aria-hidden','true');for(let i=0;i<24;i++){const slot=document.createElement('span');slot.textContent='+';grid.append(slot);}zone.append(grid);}
 zone.dataset.columns='12';zone.dataset.rows=String(Math.ceil(cards.length/12));
 const scrollGroup = direction => {
   document.dispatchEvent(new Event('atlas:cancel-drag'));
   const rowStep = (cards[0]?.getBoundingClientRect().height ?? 0) + MOBILE_GAP;
   const visibleRows = Math.max(1, Math.floor((zone.clientHeight + MOBILE_GAP) / rowStep));
   const current=direction>0?Math.floor(zone.scrollTop/rowStep):Math.ceil(zone.scrollTop/rowStep);
   zone.scrollTop = (current+direction*visibleRows)*rowStep;
   syncScroll();
 };
 const up=button('↑',()=>scrollGroup(-1),'quiet',{'aria-label':'문장 앞부분 보기'}),down=button('↓',()=>scrollGroup(1),'quiet',{'aria-label':'문장 뒷부분 보기'});
 const controls=el('div',{class:'board-scroll-controls',hidden:true},up,down);zone.after(controls);
 const syncScroll=()=>{up.disabled=zone.scrollTop<=1;down.disabled=zone.scrollTop+zone.clientHeight>=zone.scrollHeight-1;};zone.addEventListener('scroll',syncScroll,{passive:true});
 // Count is frozen for this render (including a submitted presentation snapshot).
 const update=()=>{
  zone.style.removeProperty('--board-scale');
  zone.querySelectorAll('.sentence-row').forEach(row=>row.style.removeProperty('--board-scale'));
  cards.forEach(card=>card.style.removeProperty('--mobile-card-width'));
  const commaSpace=parseFloat(getComputedStyle(zone).getPropertyValue('--comma-space'))||0;
  const hasComma=card=>card.classList.contains('comma-anchor-after')||card.classList.contains('comma-anchor-before');
  if(document.documentElement.dataset.handheld==='true'){
   const columns=handheldBoardColumns(document.documentElement.clientWidth||window.innerWidth);
   const css = getComputedStyle(zone);
   const horizontalPadding = parseFloat(css.paddingLeft) + parseFloat(css.paddingRight);
   const height = zone.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
   const columnGap = parseFloat(css.getPropertyValue('--sentence-column-gap')) || MOBILE_GAP;
   const measure = () => mobileBoardLayout({width: zone.clientWidth - horizontalPadding, height, count: cards.length, columns, columnGap});
   let layout = measure();
   const hadScrollControls = !controls.hidden;
   controls.hidden = !layout.overflow;
   zone.dataset.mobileScrollControls = String(layout.overflow);
   if (hadScrollControls !== layout.overflow) layout = measure(); // The rail changes the content width.

   // clientWidth is rounded. Also cap at the fractional CSS content width so a row's last card
   // can never wrap just because the measured board width rounded up.
   const widthLimit = `calc((100% - ${(layout.rowSlots - 1) * columnGap}px) / ${layout.rowSlots})`;
   zone.style.setProperty('--mobile-card-width', `min(${layout.cardWidth}px, ${widthLimit})`);
   // Reserve only the marked boundary, not another WORD slot or gaps in every row.
   for(let start=0;start<cards.length;start+=layout.columns){
    const group=cards.slice(start,start+layout.columns);
    if(group.some(hasComma))for(const card of group)card.style.setProperty('--mobile-card-width',`min(${layout.cardWidth}px, calc((100% - ${(group.length-1)*columnGap+commaSpace}px) / ${group.length}))`);
   }
   zone.style.setProperty('--mobile-card-height', layout.cardHeight + 'px');
   zone.style.setProperty('--mobile-form-height', layout.formHeight + 'px');
   zone.style.setProperty('--mobile-columns',String(layout.columns));
   zone.style.setProperty('--mobile-max-rows',String(Math.ceil(24/layout.columns)));
   zone.dataset.columns = String(layout.columns);
   zone.dataset.rows = String(layout.lines);
   zone.dataset.mobileColumns = String(layout.columns);
   zone.dataset.mobileLines = String(layout.lines);
   zone.dataset.mobileOverflow = String(layout.overflow);
   fitWords();
   syncScroll();
   return;
  }
  controls.hidden=true;for(const key of ['mobileColumns','mobileLines','mobileOverflow','mobileScrollControls'])delete zone.dataset[key];
  for(const name of ['card-width','card-height','form-height','columns','max-rows'])zone.style.removeProperty('--mobile-'+name);
  zone.dataset.columns='12';zone.dataset.rows=String(Math.ceil(cards.length/12));
  const portable=document.documentElement.dataset.portable==='true';
  if(portable&&!cards.length){zone.style.setProperty('--board-scale','1');fitWords();return;}
  const css=getComputedStyle(zone),base=parseFloat(getComputedStyle(cards[0]??zone.querySelector('.empty-board-grid span')).width),height=parseFloat(getComputedStyle(zone.querySelector('.empty-board-grid')??zone).getPropertyValue('--board-body'))+parseFloat(css.getPropertyValue('--form-height'))+6;
  const count=cards.length,rows=Math.max(1,Math.ceil(count/12)),columns=Math.min(12,Math.max(1,count));
  const target=count<=5?1.25:count<=9?1.15:count<=11?1.06:1;
  const padding=parseFloat(css.paddingLeft)+parseFloat(css.paddingRight),gap=parseFloat(css.rowGap)||0;
  const columnGap=parseFloat(css.getPropertyValue('--sentence-column-gap'))||4;
  // CSS custom properties may contain clamp()/calc(); measure their resolved boxes.
  const body=portable?parseFloat(getComputedStyle(cards[0].querySelector('.card-body')).height):0;
  const form=portable?parseFloat(getComputedStyle(cards[0].querySelector('.form-button')).height):0;
  // On tablets the touch control remains full height; only the word body scales.
  const heightScale=portable?(zone.clientHeight-padding-(rows-1)*gap-rows*(form+6))/(rows*body):(zone.clientHeight-padding-(rows-1)*gap)/(rows*height);
  const scale=Math.min(target,(zone.clientWidth-padding-(columns-1)*columnGap)/(columns*base),heightScale);
  zone.style.setProperty('--board-scale',String(Math.max(.1,scale)));zone.dataset.sizeBand=String(target);
  for(const row of zone.querySelectorAll('.sentence-row'))if([...row.children].some(hasComma)){
   const n=row.children.length;
   row.style.setProperty('--board-scale',String(Math.max(.1,Math.min(scale,(zone.clientWidth-padding-(n-1)*columnGap-commaSpace)/(n*base)))));
  }
  fitWords();
 };
 // Parent/rune-rail size can change without a window resize. No game callbacks are involved.
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(()=>{if(document.documentElement.dataset.portable==='true')update();}):null;resize?.observe(zone);if(hand)resize?.observe(hand);
 // Selection and paging may replace/show hand cards without changing the board.
 const handChanges=typeof MutationObserver==='function'?new MutationObserver(requestFit):null;
 if(hand)handChanges?.observe(hand,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
 const fontsChanged=()=>{clearWordFitCache();requestFit();};
 document.fonts?.addEventListener('loadingdone',fontsChanged);
 if(document.fonts?.status==='loading')document.fonts.ready.then(()=>{if(!disposed)fontsChanged();});
 update();document.addEventListener('atlas:viewport',update);
 return ()=>{disposed=true;cancelAnimationFrame(frame);resize?.disconnect();handChanges?.disconnect();document.fonts?.removeEventListener('loadingdone',fontsChanged);document.removeEventListener('atlas:viewport',update);zone.removeEventListener('scroll',syncScroll);controls.remove();};
}
