/** Presentation geometry only: physical cards, never transformed ghosts or game state. */
export function boardRows(width, cardWidth, gap, count) {
 const columns=Math.max(1,Math.floor((width+gap)/(cardWidth+gap)));
 return {columns,rows:count?Math.ceil(count/columns):0};
}
export function observeBoard(zone) {
 let frame=0;
 const update=()=>{
  frame=0;
  const css=getComputedStyle(zone), cards=[...zone.children].filter(n=>n.classList.contains('word-card'));
  const width=zone.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
  const size=parseFloat(css.getPropertyValue('--play-card-width'));
  const {columns,rows}=boardRows(width,size,parseFloat(css.columnGap)||0,cards.length);
  zone.dataset.columns=String(columns);zone.dataset.rows=String(rows);
  zone.dataset.density=rows>2?'dense':rows===2?'compact':'normal';
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 const observer=new ResizeObserver(schedule);observer.observe(zone);
 document.addEventListener('atlas:viewport',schedule);schedule();
 return ()=>{observer.disconnect();document.removeEventListener('atlas:viewport',schedule);if(frame)cancelAnimationFrame(frame);};
}
