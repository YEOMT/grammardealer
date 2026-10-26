/** Presentation geometry only: physical cards, never transformed ghosts or game state. */
export function boardRows(width, cardWidth, gap, count) {
 const columns=Math.max(1,Math.floor((width+gap)/(cardWidth+gap)));
 return {columns,rows:count?Math.ceil(count/columns):0};
}
/** Fixed physical sequence chunks, independent of viewport/card count. */
export function sentenceRows(cards){return cards.length?[cards.slice(0,12),...(cards.length>12?[cards.slice(12)]:[])]:[];}
export function observeBoard(zone){
 const cards=[...zone.children].filter(n=>n.classList.contains('word-card'));
 cards.forEach((n,i)=>{n.dataset.absoluteIndex=String(i);});
 if(cards.length){zone.replaceChildren(...sentenceRows(cards).map(group=>{const row=document.createElement('div');row.className='sentence-row';row.append(...group);return row;}));}
 if(!cards.length){const grid=document.createElement('div');grid.className='empty-board-grid';grid.setAttribute('aria-hidden','true');for(let i=0;i<24;i++){const slot=document.createElement('span');slot.textContent='+';grid.append(slot);}zone.append(grid);}
 zone.dataset.columns='12';zone.dataset.rows=String(Math.ceil(cards.length/12));
 // Count is frozen for this render (including a submitted presentation snapshot).
 const update=()=>{
  zone.style.removeProperty('--board-scale');
  const css=getComputedStyle(zone),base=parseFloat(getComputedStyle(cards[0]??zone.querySelector('.empty-board-grid span')).width),height=parseFloat(getComputedStyle(zone.querySelector('.empty-board-grid')??zone).getPropertyValue('--board-body'))+parseFloat(css.getPropertyValue('--form-height'))+6;
  const count=cards.length,rows=Math.max(1,Math.ceil(count/12)),columns=Math.min(12,Math.max(1,count));
  const target=count<=5?1.25:count<=9?1.15:count<=11?1.06:1;
  const padding=parseFloat(css.paddingLeft)+parseFloat(css.paddingRight),gap=parseFloat(css.rowGap)||0;
  const scale=Math.min(target,(zone.clientWidth-padding-(columns-1)*4)/(columns*base),(zone.clientHeight-padding-(rows-1)*gap)/(rows*height));
  zone.style.setProperty('--board-scale',String(Math.max(.1,scale)));zone.dataset.sizeBand=String(target);
 };
 update();document.addEventListener('atlas:viewport',update);
 return ()=>document.removeEventListener('atlas:viewport',update);
}
