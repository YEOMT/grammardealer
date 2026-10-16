import {safeInteger} from './numeric.js';
import {analyzeSentence} from './grammar/index.js';
import {registryForVersion} from '../data/language/index.js';
import {scoreableAnalysis,comboEligibility} from './comboEligibility.js';
export const FRAME_KEYS=Object.freeze({ 'frame.sv':'SV','frame.beLocative':'SV','frame.svc.adj':'SVC','frame.svc.np':'SVC','frame.svo':'SVO','frame.svoo':'SVOO','frame.svoc':'SVOC'});
export const frameLabel=key=>({SV:'1형식',SVC:'2형식',SVO:'3형식',SVOO:'4형식',SVOC:'5형식'})[key]??'없음';
/** Pure arithmetic contract; callers must supply grammar-proven structural flags. */
export function foresightDecision({attackId,memory=null,frame=null,validMain=false,counterfactual=false,power,hp,action='SUBMIT'}){
 safeInteger(power,'preBossPower',{min:0});safeInteger(hp,'boss hp',{min:0});
 if(memory!==null&&!Object.values(FRAME_KEYS).includes(memory)||frame!==null&&!Object.values(FRAME_KEYS).includes(frame))throw Error('Invalid foresight frame');
 const effective=action==='SUBMIT'?power:0,eligible=validMain&&frame!==null&&effective>0,bypassed=eligible&&counterfactual,blocked=eligible&&!bypassed&&memory===frame,finalPower=blocked?0:effective;
 return {attackId,rememberedFrameBefore:memory,rememberedFrameAfter:eligible?frame:memory,validMain:eligible,bypassed,blocked,preBossPower:power,finalPower,actualHpLoss:Math.min(hp,finalPower),enemyHpAfter:Math.max(0,hp-finalPower),overkill:Math.max(0,finalPower-hp),killed:hp>0&&hp<=finalPower};
}
export function mainFrameEvidence(a){
 if(!['VALID','VALID_WITH_ISSUES'].includes(a?.status))return null;
 const c=a.clauses?.find(c=>c.id===a.mainClauseId),v=a.verbPhrases?.find(v=>v.clauseId===c?.id&&v.lexicalVerbCardId===c.verbCardId),key=FRAME_KEYS[c?.frameId];
 if(!key||!c.subjectNodeId||!v?.finiteCardId||!v.chainWellFormed||v.issueIds.length)return null;
 const required=key==='SVO'?[c.objectNodeId]:key==='SVOO'?[c.indirectObjectNodeId,c.directObjectNodeId]:key==='SVOC'?[c.objectNodeId,c.objectComplementNodeId]:key==='SVC'?[c.subjectComplementNodeId]:[];
 if(required.some(id=>!id)||!a.grammarHits.some(h=>h.scope==='MAIN_CLAUSE'&&h.frameId===c.frameId))return null;
 return {key,clauseId:c.id,verbPhraseId:v.id};
}
export function resolveForesight(analysis,power,enemy,{attackId,eligibleAnalysis=analysis}={}){
 const before=enemy.bossMechanic;if(before?.id!=='FATE_FORESIGHT'||before.lastAttackId===attackId)throw Error('Invalid or duplicate foresight attack');
 const main=mainFrameEvidence(analysis),evidence=main?(eligibleAnalysis.grammarHits??[]).filter(h=>['CORRIDOR.UNREAL_PRESENT','CORRIDOR.UNREAL_PAST'].includes(h.tag)&&h.validity==='VALID'&&h.resultClauseId===main.clauseId&&analysis.corridorStructures?.some(r=>r.id===h.corridorEvidenceId&&r.resultClauseId===main.clauseId)):[];
 const result=foresightDecision({attackId,memory:before.rememberedFrame,frame:main?.key??null,validMain:!!main,counterfactual:evidence.length>0,power,hp:enemy.hp});
 return {...result,evidenceRefs:evidence.map(h=>h.id),highlightCardIds:[...new Set(evidence.flatMap(h=>h.cardIds))],bossStateBefore:structuredClone(before),bossStateAfter:{...structuredClone(before),rememberedFrame:result.rememberedFrameAfter,lastAttackId:attackId},labelKo:result.blocked?'예견에 읽혔습니다 · 피해 0':result.bypassed?'가정법 · 예견 무시':`예견: ${frameLabel(result.rememberedFrameAfter)}`};
}
/** Rebuild memory/HP from this battle's actual immutable submissions (at most six). */
export function validateForesightRun(run){
 const c=run.combat;if(!c)return true;
 const expected=['0.10.0','0.10.1','0.10.2'].includes(run.version)&&run.progress.stageId==='stage.10'&&run.progress.roundIndex===4,fail=()=>{throw Error('Invalid foresight receipt chain');};
 if(!expected){if(c.enemyState.bossMechanic?.id==='FATE_FORESIGHT')fail();return true;}
 if(c.enemyState.maxHp!==5000||c.enemyState.bossMechanic?.id!=='FATE_FORESIGHT')fail();
 let boss={id:'FATE_FORESIGHT',rememberedFrame:null,lastAttackId:null},hp=5000;const seen=new Set();
 for(const r of [...run.stats.history].reverse().filter(r=>r.battleId===c.enemyState.id)){
  if(seen.has(r.attackId)||r.enemyHpBefore!==hp||r.sentenceSnapshot.languageVersion!==registryForVersion(run.version).version)fail();seen.add(r.attackId);
  const a=analyzeSentence(r.sentenceSnapshot,registryForVersion(run.version));
  if(a.status==='INVALID_CORE'){if(r.finalPower!==0||r.foresightResult)fail();continue;}
  const proposal=resolveForesight(a,r.preBossScore,{hp,bossMechanic:boss},{attackId:r.attackId,eligibleAnalysis:scoreableAnalysis(a,comboEligibility(run))});
  if(JSON.stringify(proposal)!==JSON.stringify(r.foresightResult)||r.finalPower!==proposal.finalPower||r.enemyHpAfter!==proposal.enemyHpAfter||r.actualHpLoss!==proposal.actualHpLoss)fail();
  hp=proposal.enemyHpAfter;boss=proposal.bossStateAfter;
 }
 if(hp!==c.enemyState.hp||JSON.stringify(boss)!==JSON.stringify(c.enemyState.bossMechanic))fail();return true;
}
