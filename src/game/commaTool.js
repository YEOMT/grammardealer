import {punctuationFromEditor} from '../punctuation.js';

export const hasCommaPolicy=run=>run?.version==='0.14.0';
export const commaAvailable=run=>hasCommaPolicy(run)&&run.progress?.battleNumber>=15;
export function initializeCommaTool(run){
  if(!hasCommaPolicy(run)||!run.combat)return;
  run.combat.commaUnlocked=commaAvailable(run);
  run.combat.punctuation={comma:null};
}
/** Anchor removal is deterministic; reordering never corrects a chosen boundary. */
export function reconcileComma(combat){
  if(!combat?.punctuation)return;
  const comma=combat.punctuation.comma;
  if(comma&&(!combat.sentenceSlots.length||comma.afterCardInstanceId!==null&&!combat.sentenceSlots.some(s=>s.cardInstanceId===comma.afterCardInstanceId)))combat.punctuation.comma=null;
}
export function validateCommaTool(run){
  const c=run.combat;if(!c)return true;
  if(!hasCommaPolicy(run)){
    if(c.commaUnlocked!==undefined||c.punctuation!==undefined)throw Error('구원정에는 쉼표 정책을 추가할 수 없습니다.');
    return true;
  }
  if(c.commaUnlocked!==commaAvailable(run))throw Error('쉼표 해금 시점이 다릅니다.');
  const p=c.punctuation;
  if(!p||Object.keys(p).length!==1||!Object.hasOwn(p,'comma'))throw Error('문장부호 편집 상태가 없습니다.');
  if(p.comma!==null){
    if(!c.commaUnlocked||!p.comma||Object.keys(p.comma).length!==1||!Object.hasOwn(p.comma,'afterCardInstanceId')||(p.comma.afterCardInstanceId!==null&&typeof p.comma.afterCardInstanceId!=='string'))throw Error('쉼표 도구의 기준이 잘못되었습니다.');
    punctuationFromEditor(c.sentenceSlots,p);
  }
  return true;
}
