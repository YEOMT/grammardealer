import test from 'node:test';
import assert from 'node:assert/strict';
import {RunController} from '../src/game/runController.js';
import {newProfile,canSaveRun,validateRunState} from '../src/services/localStore.js';
import {registry,registryForVersion} from '../src/data/language/index.js';
import {getStage1Encounter} from '../src/data/stage1.js';
import {eligibleRewardCards} from '../src/game/rewards.js';
import {assertRunInvariants} from '../src/game/invariants.js';
import {tutorialCommand,tutorialCardId as id} from '../src/game/guidedTutorial.js';

export function newGuided(seed='guided.test',vocabularyMode='BEGINNER',profile=newProfile('실습 검사')){const c=new RunController({profile});assert.equal(c.dispatch({type:'NEW_RUN',config:{seed,vocabularyMode}}).ok,true);assert.equal(c.dispatch({type:'START_BATTLE'}).ok,true);return c;}
export function action(c,cmd){const r=c.dispatch(tutorialCommand(c.getState(),cmd));assert.equal(r.ok,true,`${cmd.type}: ${r.message}`);assertRunInvariants(c.getState(),registry);return r;}
export function firstAttack(c){
 action(c,{type:'TUTORIAL_ACK'});action(c,{type:'ADD_CARD',cardId:id(0)});action(c,{type:'ADD_CARD',cardId:id(1)});action(c,{type:'RETURN_CARD',cardId:id(1)});action(c,{type:'ADD_CARD',cardId:id(1)});action(c,{type:'TUTORIAL_ACK'});action(c,{type:'TUTORIAL_SELECT',cardId:id(2)});action(c,{type:'EXCHANGE',cardIds:[id(2)]});action(c,{type:'ADD_CARD',cardId:id(6)});action(c,{type:'REORDER_SENTENCE',cardId:id(6),index:0});return action(c,{type:'SUBMIT'}).resolution;
}
export function secondAttack(c){
 action(c,{type:'TUTORIAL_ACK'});
 for(const kind of ['discard','deck','draw','dictionary']){action(c,{type:'TUTORIAL_PANEL_OPEN',kind});action(c,{type:'TUTORIAL_PANEL_CLOSE',kind});}
 action(c,{type:'TUTORIAL_ACK'});action(c,{type:'TUTORIAL_ACK'});
 for(const i of [7,8,9])action(c,{type:'ADD_CARD',cardId:id(i)});
 action(c,{type:'PREPARE'});action(c,{type:'ADD_CARD',cardId:id(10),index:1});action(c,{type:'TUTORIAL_FORM_OPEN',cardId:id(10)});action(c,{type:'SET_FORM',cardId:id(10),formId:'form.run.third'});return action(c,{type:'SUBMIT'}).resolution;
}
test('0.2.1 actual guided cards, parser, two attacks, gates and atomic normal deck restoration',()=>{
 const c=newGuided(),start=c.getState(),parked=structuredClone(start.tutorialSession.parked);assert.equal(canSaveRun(start),true);assert.equal(validateRunState(start,registry),true);
 assert.deepEqual(start.combat.handIds.map(x=>start.cardInstances[x].cardDefId),['be','happy','run','really','small','good'].map(x=>'card.'+x));
 const r1=firstAttack(c);assert.equal(r1.finalPower,30);assert.equal(r1.analysis.status,'VALID_WITH_ISSUES');assert.deepEqual(r1.analysis.issues.map(i=>i.code),['BE_FORM_REQUIRED']);assert.equal(r1.enemyHpAfter,47);
 action(c,{type:'FINISH_PRESENTATION',attackId:r1.attackId});assert.equal(c.getState().tutorialSession.step,13);assert.equal(c.getState().combat.turnsRemaining,5);assert.equal(c.getState().combat.exchangesRemaining,0);assert.ok(c.getState().combat.discardIds.includes(id(2)));
 const r2=secondAttack(c);assert.equal(r2.finalPower,87);assert.equal(r2.actualHpLoss,47);assert.equal(r2.overkill,40);assert.equal(r2.analysis.status,'VALID');assert.equal(r2.analysis.mainFrameId,'frame.sv');assert.equal(c.getState().combat.turnsRemaining,3);
 assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:r2.attackId}).ok,false);assert.equal(canSaveRun(c.getState()),false);
 for(let i=0;i<3;i++)action(c,{type:'TUTORIAL_GATE_ACK',attackId:r2.attackId});
 action(c,{type:'FINISH_PRESENTATION',attackId:r2.attackId});assert.equal(c.getState().economy.gold,0);assert.equal(c.getProfile().guidedTutorialCompletedVersion,undefined);
 action(c,{type:'TUTORIAL_ACK'});action(c,{type:'TUTORIAL_ACK'});
 const end=c.getState();assert.equal(end.status,'REWARD');assert.equal(end.economy.gold,5);assert.deepEqual(end.activeCardIds,parked.activeCardIds);assert.deepEqual(end.cardInstances,parked.cardInstances);assert.deepEqual(end.rng.deck,parked.rng.deck);assert.equal(c.getProfile().guidedTutorialCompletedVersion,'0.2.1');assert.equal(end.stats.attacks,0);assert.equal(c.getProfile().bestAttack,0);assert.deepEqual(c.getProfile().grammarRecords,{});assert.equal(validateRunState(end,registry),true);
 const frozen=c.getState();assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:r2.attackId}).ok,false);assert.deepEqual(c.getState(),frozen);
 action(c,{type:'CHOOSE_REWARD',offerId:end.reward.offerId,choiceId:end.reward.choices.find(x=>x.kind==='CARD').choiceId});action(c,{type:'NEXT_BATTLE'});assert.equal(c.getState().combat.enemyState.hp,132);assert.equal(c.getState().combat.exchangesRemaining,4);assert.equal(c.getState().activeCardIds.length,29);
});
test('0.2.1 versioned HP and fast isolation retain previous campaign scopes',()=>{
 for(const [version,hps]of [['0.1.0',[70,120,220]],['0.1.1',[91,156,286]],['0.2.0',[91,156,286]],['0.2.1',[77,132,242]]])assert.deepEqual(hps.map((_,i)=>getStage1Encounter(i,version).hp),hps);
 assert.equal(registryForVersion('0.2.0').cardById['card.fast'],undefined);assert.equal(registry.cardById['card.fast'].starterEligible,false);assert.equal(eligibleRewardCards(newGuided().getState()).some(c=>c.id==='card.fast'),false);
});
test('0.2.1 mandatory policy, stale commands, replay profile and parked deck remain independent',()=>{
 const p=newProfile('old');p.guideSeen=true;p.tutorial={skipped:true};const c=newGuided('a','FREE',p),before=c.getState();
 for(const command of [{type:'SKIP_GUIDE'},{type:'PREPARE'},{type:'ADD_CARD',cardId:id(5)},{type:'TUTORIAL_ACK',sessionId:'old',cueId:'T01'}]){assert.equal(c.dispatch(command).ok,false);assert.deepEqual(c.getState(),before);}
 const ack=tutorialCommand(before,{type:'TUTORIAL_ACK'});assert.equal(c.dispatch(ack).ok,true);const after=c.getState();assert.equal(c.dispatch(ack).ok,false);assert.deepEqual(c.getState(),after);
 const parked=after.tutorialSession.parked;action(c,{type:'TUTORIAL_RESTART',confirmed:true});assert.deepEqual(c.getState().tutorialSession.parked,parked);assert.equal(c.getState().tutorialSession.step,1);assert.equal(c.getProfile().guidedTutorialCompletedVersion,undefined);
 p.guidedTutorialCompletedVersion='0.2.1';const done=newGuided('b','STANDARD',p);assert.equal(done.getState().tutorialSession,undefined);assert.equal(done.getState().combat.exchangesRemaining,4);
});
import {playAttack,impactFeel,buildPresentationTimeline} from '../src/engine/presentation.js';
import {presentationClock} from '../src/engine/presentationClock.js';
import {generateStarterDeck} from '../src/game/deck.js';
import {createShop} from '../src/game/shop.js';

test('all vocabulary modes park the identical seeded normal deck; safe save reload ignores later profile completion',()=>{
 for(const vocabularyMode of ['BEGINNER','STANDARD','ADVANCED','FREE']){
  const c=newGuided('mode-preservation',vocabularyMode),start=c.getState(),normal=generateStarterDeck({seed:'mode-preservation',vocabularyMode});
  assert.deepEqual(start.tutorialSession.parked.activeCardIds,normal.activeCardIds);assert.deepEqual(start.tutorialSession.parked.cardInstances,normal.cardInstances);assert.deepEqual(start.tutorialSession.parked.rng,normal.rng);
  const p=c.getProfile();p.guidedTutorialCompletedVersion='0.2.1';const loaded=new RunController({profile:p,initialState:start});assert.deepEqual(loaded.getState(),start);assert.equal(loaded.getState().tutorialSession.active,true);
  const bad=structuredClone(start);bad.tutorialSession.parked.cardInstances[bad.tutorialSession.parked.activeCardIds[0]].cardDefId='card.fast';assert.throws(()=>validateRunState(bad,registry));
 }
});
test('active animation clock excludes 120 second explanation and hidden tab budgets and cleans listeners',async()=>{
 let time=0,tick,stopped=0,timeouts=0;const document=new EventTarget();document.hidden=false;
 const clock=presentationClock({document,budget:2000,now:()=>time,setInterval:f=>(tick=f,1),clearInterval:()=>stopped++,onTimeout:()=>timeouts++});
 clock.pause(true);time+=120000;tick();assert.equal(clock.elapsed,0);assert.equal(timeouts,0);
 clock.pause(false);document.hidden=true;time+=120000;tick();assert.equal(clock.elapsed,0);
 document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));const wait=clock.wait(100);time+=100;tick();await wait;assert.equal(clock.elapsed,100);
 time+=2100;tick();assert.equal(timeouts,1);assert.equal(stopped,1);clock.close();assert.equal(stopped,1);
});
test('semantic score gates survive long reading, reject stale acknowledgements, then finish exactly once',async()=>{
 const c=newGuided(),r1=firstAttack(c);action(c,{type:'FINISH_PRESENTATION',attackId:r1.attackId});const r=secondAttack(c),frozen=c.getState();let time=0,tick,hits=0,finishes=0;const cues=[];
 const result=await playAttack(r,{impact(){hits++;},finish(){finishes++;}},{guided:true,wait:async()=>{},clock:{now:()=>time,setInterval:f=>(tick=f,1),clearInterval:()=>{}},waitForGate:async gate=>{
  cues.push([gate.cueId,gate.value]);const before=c.getState();time+=61000;tick();assert.deepEqual(c.getState(),before);assert.equal(hits,0);assert.equal(finishes,0);
  const cmd=tutorialCommand(before,{type:'TUTORIAL_GATE_ACK',attackId:r.attackId});assert.equal(c.dispatch({...cmd,attackId:'stale'}).ok,false);assert.equal(c.dispatch(cmd).ok,true);const after=c.getState();assert.equal(c.dispatch(cmd).ok,false);assert.deepEqual(c.getState(),after);
 }});assert.equal(result.status,'FINISHED');assert.deepEqual(cues,[['T26',40],['T27',60],['T28',87]]);assert.equal(hits,1);assert.equal(finishes,1);action(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});assert.equal(c.getState().combat.enemyState.hp,frozen.combat.enemyState.hp);assert.equal(c.getState().economy.gold,0);
});
test('tutorial abort/view failure never fast-forwards impact or settlement; restart keeps seed and no reward',async()=>{
 for(const failure of ['abort','view-error']){
  const c=newGuided(),r=firstAttack(c),abort=new AbortController();let hits=0,finishes=0,cancel=0;
  const result=await playAttack(r,{onScore(){if(failure==='abort')abort.abort();else throw Error('view fault');},impact(){hits++;},finish(){finishes++;},cancel(){cancel++;}},{guided:true,signal:abort.signal,wait:async()=>{}});
  assert.equal(result.status,'INTERRUPTED');assert.equal(hits,0);assert.equal(finishes,0);assert.equal(cancel,1);const old=c.getState(),parked=old.tutorialSession.parked;action(c,{type:'TUTORIAL_RESTART',confirmed:true});assert.deepEqual(c.getState().tutorialSession.parked,parked);assert.equal(c.getState().combat.enemyState.hp,77);assert.equal(c.getState().economy.gold,0);assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:r.attackId}).ok,false);
 }
});
test('impact intensity uses stable max HP, zero is blocked, and reduced motion retains reading time',()=>{
 const base={finalPower:30,visualBasis:{intensityBaseline:77},killed:true,enemyHpBefore:1};assert.equal(impactFeel(base).tier,'LIGHT');assert.equal(impactFeel({...base,finalPower:60}).tier,'HEAVY');assert.equal(impactFeel({...base,finalPower:87}).tier,'OVERPOWER');assert.equal(impactFeel({...base,finalPower:0}).tier,'BLOCKED');
 const c=newGuided(),r=firstAttack(c);assert.deepEqual(buildPresentationTimeline(r,{effectsOff:true}),buildPresentationTimeline(r));
});
import {grantStage2Entry} from '../src/game/shop.js';
test('0.2.1 shop/save uses unchanged prices and excludes tutorial fast; old attack IDs cannot finish a restarted attempt',()=>{
 const p=newProfile('repeat');p.guidedTutorialCompletedVersion='0.2.1';const fresh=new RunController({profile:p});fresh.dispatch({type:'NEW_RUN',config:{seed:'shop-021'}});const fixture=fresh.getState();fixture.status='STAGE_CLEAR';fixture.progress.roundIndex=2;fixture.progress.battleNumber=3;fixture.milestoneIds=['STAGE1_CLEAR'];fixture.eligibility.runOwnUnlocks=['pack.svoo','rune.svoo'];
 // Explicit entry boundary fixture, not claimed as seven-battle UI play.
 fixture.progress={stageId:'stage.02',roundIndex:0,battleNumber:4,contentBoundary:null};fixture.status='STAGE_INTRO';const c=new RunController({initialState:fixture,profile:p});action(c,{type:'ENTER_STAGE'});const s=c.getState();assert.equal(s.shop.shopVersion,'0.2.0');assert.equal(validateRunState(s,registry),true);assert.equal(canSaveRun(s),true);assert.ok(s.shop.inventory.every(i=>i.cardDefId!=='card.fast'));assert.deepEqual(new RunController({initialState:s,profile:p}).getState(),s);action(c,{type:'LEAVE_SHOP',shopId:s.shop.shopId});assert.equal(c.getState().combat.enemyState.hp,220);
 const guided=newGuided(),first=firstAttack(guided);action(guided,{type:'TUTORIAL_RESTART',confirmed:true});const replay=firstAttack(guided);assert.notEqual(first.attackId,replay.attackId);const frozen=guided.getState();assert.equal(guided.dispatch({type:'FINISH_PRESENTATION',attackId:first.attackId}).ok,false);assert.deepEqual(guided.getState(),frozen);
});
test('a truly stalled guided animation times out without impact and releases its clock',async()=>{
 const c=newGuided(),r=firstAttack(c);let tick,time=0,hits=0,clean=0;
 const promise=playAttack(r,{impact(){hits++;}},{guided:true,wait:()=>new Promise(()=>{}),clock:{now:()=>time,setInterval:f=>(tick=f,1),clearInterval:()=>clean++}});
 await new Promise(resolve=>setImmediate(resolve));time=100000;tick();const result=await promise;assert.equal(result.status,'INTERRUPTED');assert.equal(result.reason,'timeout');assert.equal(hits,0);assert.equal(clean,1);
});
test('start save rejects forged presentation progress instead of bypassing future gates',()=>{
 const start=newGuided().getState();for(const key of ['attackCount','attackId','selectedIds','panel','drawStream']){const bad=structuredClone(start);bad.tutorialSession[key]={attackCount:2,attackId:'forged',selectedIds:[id(2)],panel:'draw',drawStream:{state:0,cursor:0}}[key];assert.throws(()=>validateRunState(bad,registry),key);}
});
