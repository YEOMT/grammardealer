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
 // The shared CSS profile sizes both rows; no resize observer or animated layout loop.
 return ()=>{};
}
