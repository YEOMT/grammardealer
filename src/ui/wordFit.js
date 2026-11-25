// Presentation-only fitting. Cache actual font measurements, never infer from letters.
const measurements=new Map(),fits=new Map();
let canvasContext;
export function clearWordFitCache(){measurements.clear();fits.clear();}
export function fitMeasuredWord({available,maxSize=22,minSize=12,minScale=.8,measure}){
 const width=Math.max(1,available),full=measure(maxSize);
 if(full<=width)return {size:maxSize,scale:1,readable:true,width:full};
 const natural=Math.min(maxSize,width/full*maxSize);
 let size=Math.max(minSize,Math.floor(natural*10)/10),measured=measure(size);
 let scale=Math.min(1,width/measured);
 if(scale<minScale){
  // Report the constrained result rather than silently claim the reading floor.
  size=Math.floor(size*scale/minScale*10)/10;
  measured=measure(size);scale=Math.min(1,width/measured);
 }
 return {size,scale:Math.max(minScale,scale),readable:size>=minSize,width:measured*Math.max(minScale,scale)};
}
export function applyMeasuredWordFit(word){
 const body=word.parentElement,style=getComputedStyle(word),bodyStyle=getComputedStyle(body);
 const available=Math.max(1,body.clientWidth-parseFloat(bodyStyle.paddingLeft)-parseFloat(bodyStyle.paddingRight)-.5);
 const text=word.textContent,font=`${style.fontStyle} ${style.fontWeight}`,family=style.fontFamily,spacing=parseFloat(style.letterSpacing)||0;
 const key=JSON.stringify([text,font,family,spacing,available]);
 let fit=fits.get(key);
 if(!fit){
  canvasContext??=word.ownerDocument.createElement('canvas').getContext('2d');
  const measure=size=>{
   const key=JSON.stringify([text,font,family,spacing,size]);
   if(measurements.has(key))return measurements.get(key);
   canvasContext.font=`${font} ${size}px ${family}`;
   const m=canvasContext.measureText(text),width=Math.max(m.width,(m.actualBoundingBoxLeft||0)+(m.actualBoundingBoxRight||0))+spacing*Math.max(0,text.length-1);
   measurements.set(key,width);return width;
  };
  fit=fitMeasuredWord({available,measure});fits.set(key,fit);
  if(fits.size>1500){fits.clear();measurements.clear();}
 }
 word.style.setProperty('--measured-word-size',fit.size+'px');
 word.style.setProperty('--measured-word-scale',String(fit.scale));
 word.dataset.wordFitReadable=String(fit.readable);
}
