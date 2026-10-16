import {CORRIDOR_INITIAL} from '../data/corridorPolicy.js';
import {safeInteger,multiplyFloor} from './numeric.js';
export function normalResistanceRatio(version,stageId,kind){return ['0.10.0','0.10.1','0.10.2'].includes(version)&&kind==='NORMAL'?CORRIDOR_INITIAL.resistance[stageId]??null:null;}
/** Last normal-enemy multiplier, after grammar, runes and region; never mutates HP. */
export function resolveNormalResistance({version,stageId,kind,power,hp}){
 safeInteger(power,'preResistancePower',{min:0});safeInteger(hp,'enemy hp',{min:0});
 const ratio=normalResistanceRatio(version,stageId,kind),postResistancePower=ratio?multiplyFloor(power,ratio):power;
 return {applied:!!ratio,ratio:ratio?{...ratio}:null,percent:ratio?Math.round(100*(ratio.den-ratio.num)/ratio.den):0,preResistancePower:power,postResistancePower,preventedByResistance:power-postResistancePower,finalPower:postResistancePower,actualHpLoss:Math.min(hp,postResistancePower),enemyHpAfter:Math.max(0,hp-postResistancePower),overkill:Math.max(0,postResistancePower-hp)};
}
