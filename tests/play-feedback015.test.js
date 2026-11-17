import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fateDecision,resolveFateThreads,initialFateThreads} from '../src/engine/fateThreads.js';
import {PLAY_FEEDBACK_POLICY,PLAY_FEEDBACK_RULESET} from '../src/data/playFeedbackPolicy.js';
import {RunController} from '../src/game/runController.js';
import {newProfile,validateRunState} from '../src/services/localStore.js';
import {registryForVersion,createSentenceSnapshot} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {resolveAttack} from '../src/engine/stage.js';
import {stageForRun,getEncounter} from '../src/data/stages.js';
import {clauseThreadReceipt,validateClauseThreadsRun} from '../src/game/clauseThreadsState.js';
import {comboEligibility} from '../src/engine/comboEligibility.js';
import {tutorialCommand,tutorialCardId as id,COMBAT_FIRST_STEPS} from '../src/game/guidedTutorial.js';
import {drawCards,exchangeCards} from '../src/game/deck.js';
import {createStream} from '../src/game/rng.js';
import {assignedCorridor,assignPiles,checked} from './helpers/corridor-state.js';
import {cardModel,polishPreview} from '../src/ui/models.js';
import {battleLearningGuide,preparationGuide} from '../src/data/battleLearningGuide.js';
const registry=registryForVersion('0.14.0');
const cases=JSON.parse(readFileSync(new URL('./fixtures/play015/boss-cases.json',import.meta.url))).cases;
for(const c of cases)test(`0.15 synthetic arithmetic ${c.id}: ${c.description}`,()=>{
 const result=fateDecision({...c,evidence:{...(c.participle?{PARTICIPIAL:true}:{}),...(c.counterfactual?{COUNTERFACTUAL:true}:{})}});
 assert.deepEqual({blocked:result.blocked,memory:result.rememberedFrameAfter,unlocked:result.unlockedThreads,hpAfter:result.enemyHpAfter,finalPower:result.finalPower,actualHpLoss:result.actualHpLoss,killed:result.killed},c.expect);
});
function physical(text,name='physical'){
 const expected=snapshotFromText(text,{registry}),cards=expected.orderedTokens.map((t,i)=>({instanceId:`${name}.${i}`,cardDefId:t.cardDefId,polishLevel:0,specialEffectId:null}));
 assert.ok(cards.every(c=>registry.cardById[c.cardDefId]));
 const snapshot=createSentenceSnapshot(cards.map((c,i)=>({cardInstanceId:c.instanceId,selection:expected.orderedTokens[i].selectionId})),cards,{languageVersion:'0.14.0',punctuation:expected.punctuation});
 return {cards,snapshot,analysis:analyzeSentence(snapshot,registry)};
}
test('0.15 actual-card grammar distinguishes participial adjuncts, counterfactual and lookalikes',()=>{
 for(const [text,key]of [['Seeing you, I smiled.','PARTICIPIAL'],['Helped by you, I smiled.','PARTICIPIAL'],['If I had time, I would help you.','COUNTERFACTUAL'],['If I had seen you, I would have helped you.','COUNTERFACTUAL'],['I was seeing you.',null],['I was helped by you.',null],['I had seen you.',null],['If I see you, I will help you.',null]]){
  const {analysis}=physical(text),r=resolveFateThreads(analysis,100,{hp:5000,bossMechanic:initialFateThreads()},{attackId:text});
  assert.deepEqual(r.unlockedThreads,key?[key]:[],text);assert.equal(r.bypassed,key==='COUNTERFACTUAL',text);
 }
 const a=physical('Seeing you, I smiled.').analysis,b=initialFateThreads();b.rememberedFrame='SV';
 assert.equal(resolveFateThreads(a,200,{hp:1,bossMechanic:b},{attackId:'same'}).blocked,true);
 const r=resolveFateThreads(a,200,{hp:1,bossMechanic:initialFateThreads()},{attackId:'one'});
 assert.equal(r.actualHpLoss,0);assert.deepEqual(r.unlockedThreads,['PARTICIPIAL']);
 assert.throws(()=>resolveFateThreads(a,200,{hp:1,bossMechanic:r.bossStateAfter},{attackId:'one'}),/Duplicate/);
});
test('0.15 complete receipt replay survives history pruning and rejects altered policy, cards, memory, HP and duplicates',()=>{
 const run={version:'0.14.0',playFeedbackPolicy:PLAY_FEEDBACK_POLICY,contentManifest:{playFeedbackPolicy:PLAY_FEEDBACK_POLICY},runId:'receipt015',activeCardIds:[],cardInstances:{},runes:{instances:{}},progress:{stageId:'stage.10',roundIndex:4,battleNumber:47},eligibility:{runOwnUnlocks:['pack.participial.active','pack.participial.passive','pack.corridor','pack.time.past','pack.time.perfect'],runStartUnlockBaseline:[]},stats:{history:[]},combat:{rulesSnapshot:{turnLimit:6},clauseThreadReceipts:[],clauseThreadRuneBaseline:{},clauseThreadCardBaseline:{},enemyState:{id:'battle.10.05',kind:'REGIONAL_BOSS',hp:5000,maxHp:5000,bossMechanic:initialFateThreads()}}};
 for(const [i,text]of ['Seeing you, I smiled.','Helped by you, I smiled.','If I had time, I would help you.'].entries()){
  const {cards,snapshot,analysis}=physical(text,`receipt${i}`),r=resolveAttack({analysis,cards,enemy:run.combat.enemyState,stage:stageForRun(run),attackId:`receipt${i}`,runId:run.runId,battleId:'battle.10.05',sentenceSnapshot:snapshot,policyVersion:run.version,comboEligibility:comboEligibility(run)});
  for(const c of cards){run.activeCardIds.push(c.instanceId);run.cardInstances[c.instanceId]=c;run.combat.clauseThreadCardBaseline[c.instanceId]=structuredClone(c);}
  run.combat.enemyState.hp=r.enemyHpAfter;run.combat.enemyState.bossMechanic=r.bossStateAfter;run.combat.clauseThreadReceipts.push(clauseThreadReceipt(r));
  assert.equal(validateClauseThreadsRun(run),true);
 }
 assert.equal(run.combat.clauseThreadReceipts[1].finalPower,0);
 for(const change of [r=>delete r.playFeedbackPolicy,r=>r.combat.enemyState.hp--,r=>r.combat.enemyState.bossMechanic.rememberedFrame='SVOC',r=>r.combat.clauseThreadReceipts[0].sentenceSnapshot.punctuation=[],r=>r.combat.clauseThreadReceipts[0].cardScoringSnapshot[0].polishLevel=3,r=>r.combat.clauseThreadReceipts.push(r.combat.clauseThreadReceipts[0])]){const bad=structuredClone(run);change(bad);assert.throws(()=>validateClauseThreadsRun(bad));}
});
function start(guided=true){const c=new RunController({profile:{...newProfile('Play feedback QA'),...(guided?{}:{guidedTutorialCompletedVersion:'0.2.1'})}});checked(c,{type:'NEW_RUN',config:{seed:'play015'}});checked(c,{type:'START_BATTLE'});return c;}
const action=(c,cmd)=>checked(c,tutorialCommand(c.getState(),cmd));
function first(c){for(const cmd of [{type:'TUTORIAL_ACK'},{type:'ADD_CARD',cardId:id(0)},{type:'ADD_CARD',cardId:id(1)},{type:'RETURN_CARD',cardId:id(1)},{type:'ADD_CARD',cardId:id(1)},{type:'TUTORIAL_SELECT',cardId:id(2)},{type:'EXCHANGE',cardIds:[id(2)]},{type:'ADD_CARD',cardId:id(6)},{type:'REORDER_SENTENCE',cardId:id(6),index:0}])action(c,cmd);return action(c,{type:'SUBMIT'}).resolution;}
test('0.15 combat-first tutorial completes both real scores without panels or score gates and restores parked deck/RNG',()=>{
 const c=start(),initial=c.getState(),parked=initial.tutorialSession.parked;
 assert.equal(validateRunState(initial,registry),true);assert.equal(c.dispatch(tutorialCommand(initial,{type:'TUTORIAL_PANEL_OPEN',kind:'deck'})).ok,false);
 const a=first(c);assert.equal(a.finalPower,40);action(c,{type:'FINISH_PRESENTATION',attackId:a.attackId});action(c,{type:'TUTORIAL_ACK'});
 for(const i of [7,8,9])action(c,{type:'ADD_CARD',cardId:id(i)});
 const before=c.getState(),draw=action(c,{type:'PREPARE'});assert.deepEqual(c.getState().combat.sentenceSlots,before.combat.sentenceSlots);assert.ok(draw.cardMovement.events.every(e=>e.type!=='DISCARD'));
 action(c,{type:'ADD_CARD',cardId:id(10),index:1});action(c,{type:'TUTORIAL_FORM_OPEN',cardId:id(10)});action(c,{type:'SET_FORM',cardId:id(10),formId:'form.run.third'});
 const b=action(c,{type:'SUBMIT'}).resolution;assert.equal(b.finalPower,126);assert.equal(c.getState().tutorialSession.step,29);
 action(c,{type:'FINISH_PRESENTATION',attackId:b.attackId});assert.equal(c.getState().tutorialSession.step,31);
 assert.deepEqual(c.getState().tutorialSession.completedSteps,COMBAT_FIRST_STEPS.slice(0,-1));
 action(c,{type:'TUTORIAL_ACK'});const end=c.getState();assert.equal(end.status,'REWARD');assert.equal(end.economy.gold,5);
 for(const k of ['activeCardIds','cardInstances','stats'])assert.deepEqual(end[k],parked[k]);
 for(const k of ['deck','shop','encounter'])assert.deepEqual(end.rng[k],parked.rng[k]);
 assert.ok(end.rng.reward.cursor>parked.rng.reward.cursor,'normal victory creates one real reward offer');
 assert.equal(validateRunState(end,registry),true);assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:b.attackId}).ok,false);
 assert.deepEqual(c.getState(),end);
});
test('0.15 tutorial skip/restart/exit preserve normal deck and parked RNG',()=>{
 for(const type of ['SKIP_TUTORIAL','TUTORIAL_RESTART','TUTORIAL_EXIT']){
  const c=start(),parked=c.getState().tutorialSession.parked;first(c);
  const result=action(c,{type,confirmed:true,commandId:type});assert.equal(result.ok,true);const s=c.getState();
  assert.equal(s.economy.gold,0);assert.equal(s.stats.attacks,0);
  if(type==='TUTORIAL_RESTART'){assert.deepEqual(s.tutorialSession.parked,parked);assert.equal(s.tutorialSession.step,1);}
  else {assert.deepEqual(s.activeCardIds,parked.activeCardIds);assert.deepEqual(s.cardInstances,parked.cardInstances);if(type==='TUTORIAL_EXIT')assert.deepEqual(s.rng,parked.rng);}
  assert.equal(validateRunState(s,registry),true);
 }
});
test('0.15 movement records actual discard/reshuffle/same-copy redraw without changing RNG or piles',()=>{
 const source={handIds:['a','b'],drawIds:[],discardIds:[],sentenceSlots:[],exchangesRemaining:4};
 const a=structuredClone(source),b=structuredClone(source),sa=createStream('movement'),sb=structuredClone(sa),events=[];
 const r=exchangeCards(a,['a','b'],10,sa,events),plain=exchangeCards(b,['a','b'],10,sb);
 assert.deepEqual(r,plain);assert.deepEqual(a,b);assert.deepEqual(sa,sb);assert.deepEqual(events.map(e=>e.type),['DISCARD','RESHUFFLE','DRAW']);assert.equal(events[1].count,2);assert.equal(events[1].ids,undefined);assert.deepEqual(new Set(events[2].ids),new Set(['a','b']));
 const mixed={handIds:[],drawIds:['x'],discardIds:['y'],sentenceSlots:[]},log=[];assert.deepEqual(drawCards(mixed,3,10,createStream('x'),log),['x','y']);assert.deepEqual(log.map(e=>e.type),['DRAW','RESHUFFLE','DRAW']);
 for(const p of [{handIds:['a'],drawIds:['b'],discardIds:[]},{handIds:[],drawIds:[],discardIds:[]}]){const e=[];drawCards(p,2,1,createStream('no'),e);assert.deepEqual(e,[]);}
 const frozen=structuredClone(a),rng=structuredClone(sa),bad=[];assert.equal(exchangeCards(a,['missing'],10,sa,bad).ok,false);assert.deepEqual(a,frozen);assert.deepEqual(sa,rng);assert.deepEqual(bad,[]);
});
test('0.15 controller exchange command replay and last-turn prepare never draw or settle twice',()=>{
 const c=start(false),s=c.getState(),cmd={type:'EXCHANGE',cardIds:[s.combat.handIds[0]],commandId:'one',expectedRevision:s.revision};const r=checked(c,cmd),after=c.getState();
 assert.equal(r.cardMovement.beforeRevision,s.revision);assert.equal(r.cardMovement.afterRevision,after.revision);assert.equal(after.cardMovement,undefined);assert.equal(c.dispatch(cmd).ok,false);assert.deepEqual(c.getState(),after);
 const n=c.getState();n.combat.turnsRemaining=1;c._state=n;const p=checked(c,{type:'PREPARE',confirmed:true,commandId:'end'});assert.deepEqual(p.cardMovement.events,[]);assert.equal(c.getState().status,'DEFEAT');assert.deepEqual(c.getState().rng,n.rng);
});
test('0.15 new campaign preserves 50 battles, 28 cards, old mechanics and versioned boss guidance',()=>{
 const s=start(false).getState();assert.equal(s.version,'0.14.0');assert.equal(s.playFeedbackPolicy,PLAY_FEEDBACK_POLICY);assert.equal(s.activeCardIds.length,28);
 const target={...s,combat:null,progress:{stageId:'stage.10',roundIndex:4,battleNumber:47}};
 assert.equal(stageForRun(target).rounds[4].bossMechanic.id,'FATE_FORESIGHT_THREADS');assert.match(battleLearningGuide(target).boss.join(' '),/두 실/);assert.match(preparationGuide(target).noticeKo,/분사구문과 가정법/);
 assert.equal(getEncounter('stage.10',4,'0.14.0').bossMechanic.id,'FATE_CLAUSE_THREADS');assert.equal(getEncounter('stage.10',4,'0.12.1').bossMechanic.id,'FATE_FORESIGHT');assert.equal(getEncounter('stage.final',2,s.version).battleNumber,50);
 const original=s.rng;assert.deepEqual(target.rng,original);
 assert.equal(polishPreview(cardModel({instanceId:'p',cardDefId:'card.be',polishLevel:2},null,s.version)),'카드 점수 20 → 25');
 assert.match(polishPreview(cardModel({instanceId:'p',cardDefId:'card.operation.supply',polishLevel:0},null,s.version)),/재사용/);
});
test('0.15 assigned controller boss: real cards, zero defence, save replay, final release and exactly one reward',()=>{
 const sentences=['Seeing you, I helped the very kind student.','Helped by you, I helped the very kind student.','If I had time, I would help you.'];
 const {c,slots}=assignedCorridor({version:'0.14.0',sentences,polish:3,runes:['rune.perfectSentence','rune.longSentence','rune.svo','rune.past']});
 const s=c.getState();s.playFeedbackPolicy=PLAY_FEEDBACK_POLICY;s.contentManifest.playFeedbackPolicy=PLAY_FEEDBACK_POLICY;s.combat=null;c._beginBattle(s);c._state=s;
 assert.equal(validateRunState(s,registry),true);const rng=structuredClone(s.rng);
 let last;
 for(let i=0;i<3;i++){
  assignPiles(c,{sentence:slots[i]});const comma=snapshotFromText(sentences[i],{registry}).punctuation[0];
  checked(c,{type:'SET_COMMA',afterCardInstanceId:slots[i][comma.gapIndex-1].cardInstanceId});
  const a=checked(c,{type:'SUBMIT'}).resolution;
  if(i===0){assert.deepEqual(a.clauseThreadResult.unlockedThreads,['PARTICIPIAL']);assert.equal(a.enemyHpAfter,1);}
  if(i===1){assert.equal(a.clauseThreadResult.blocked,true);assert.equal(a.finalPower,0);assert.deepEqual(a.clauseThreadResult.unlockedThreads,[]);}
  if(i===2){assert.equal(a.killed,true);assert.equal(a.clauseThreadResult.bypassed,true);assert.deepEqual(a.clauseThreadResult.unlockedThreads,['COUNTERFACTUAL']);}
  checked(c,{type:'FINISH_PRESENTATION',attackId:a.attackId});assert.equal(validateRunState(c.getState(),registry),true);last=a;
 }
 const end=c.getState();assert.equal(end.status,'REWARD');assert.equal(end.settlementIds.filter(x=>x.endsWith(':47:VICTORY')).length,1);
 assert.equal(end.finale.bestAttackSnapshot.rulesetId,PLAY_FEEDBACK_RULESET);assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:last.attackId}).ok,false);assert.deepEqual(c.getState(),end);
 const loaded=new RunController({initialState:end,profile:c.getProfile()});assert.deepEqual(loaded.getState(),end);
 assert.deepEqual(end.rng.shop,rng.shop);assert.deepEqual(end.rng.encounter,rng.encounter);
});
test('0.15 invalid core, analyzer error and prepare cannot reset foresight or release threads',()=>{
 const {c,slots}=assignedCorridor({version:'0.14.0',sentences:['I help you.','you.']});
 const s=c.getState();s.playFeedbackPolicy=PLAY_FEEDBACK_POLICY;s.contentManifest.playFeedbackPolicy=PLAY_FEEDBACK_POLICY;s.combat=null;c._beginBattle(s);c._state=s;
 assignPiles(c,{sentence:slots[0]});const a=checked(c,{type:'SUBMIT'}).resolution;checked(c,{type:'FINISH_PRESENTATION',attackId:a.attackId});
 const memory=c.getState().combat.enemyState.bossMechanic.rememberedFrame,threads=c.getState().combat.enemyState.bossMechanic.threads;
 checked(c,{type:'PREPARE'});assert.equal(c.getState().combat.enemyState.bossMechanic.rememberedFrame,memory);
 assignPiles(c,{sentence:slots[1]});const invalid=checked(c,{type:'SUBMIT'}).resolution;assert.equal(invalid.status,'INVALID_CORE');assert.equal(invalid.finalPower,0);checked(c,{type:'FINISH_PRESENTATION',attackId:invalid.attackId});assert.deepEqual(c.getState().combat.enemyState.bossMechanic.threads,threads);assert.equal(c.getState().combat.enemyState.bossMechanic.rememberedFrame,memory);
 assignPiles(c,{sentence:slots[0]});const before=c.getState();c.analyzer=()=>{throw Error('deliberate analyzer failure');};assert.equal(c.dispatch({type:'SUBMIT'}).ok,false);assert.deepEqual(c.getState(),before);assert.equal(validateRunState(before,registry),true);
});
test('0.15 shop transactions preserve RNG, real copies and gold on failed or duplicate polish/purchase',()=>{
 const {c}=assignedCorridor({version:'0.14.0',entry:true});let s=c.getState();s.playFeedbackPolicy=PLAY_FEEDBACK_POLICY;s.contentManifest.playFeedbackPolicy=PLAY_FEEDBACK_POLICY;s.economy.gold=100;c._state=s;checked(c,{type:'ENTER_STAGE'});s=c.getState();
 const item=s.shop.inventory.find(i=>i.kind==='CARD'&&i.cardDefId.startsWith('card.operation.')),buy={type:'SHOP_BUY',shopId:s.shop.shopId,itemId:item.itemId,expectedRevision:s.revision,commandId:'shop.buy'};
 checked(c,buy);const bought=c.getState(),target=item.itemId+'.owned';assert.equal(bought.cardInstances[target].cardDefId,item.cardDefId);assert.deepEqual(bought.rng,s.rng);assert.equal(bought.economy.gold,s.economy.gold-item.price);assert.equal(c.dispatch(buy).ok,false);assert.deepEqual(c.getState(),bought);
 const polish={type:'SHOP_SERVICE',shopId:s.shop.shopId,serviceKind:'POLISH',targetCardInstanceId:target,expectedRevision:bought.revision,commandId:'shop.polish'},r=checked(c,polish),after=c.getState();
 assert.equal(r.rewardEffect.beforeOperation.polishLevel??0,0);assert.equal(after.cardInstances[target].polishLevel,1);assert.equal(after.economy.gold,bought.economy.gold-s.shop.services.POLISH.price);assert.deepEqual(after.rng,bought.rng);assert.equal(c.dispatch(polish).ok,false);assert.deepEqual(c.getState(),after);
 const fail={...polish,commandId:'used',expectedRevision:after.revision};assert.equal(c.dispatch(fail).ok,false);assert.deepEqual(c.getState(),after);
 const zero=structuredClone(after);zero.economy.gold=0;c._state=zero;assert.equal(c.dispatch({...buy,itemId:zero.shop.inventory.find(i=>!i.purchased).itemId,commandId:'insufficient',expectedRevision:zero.revision}).ok,false);assert.deepEqual(c.getState(),zero);
});
