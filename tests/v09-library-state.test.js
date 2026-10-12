import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {assignedLibrary,checked,assignPiles,place} from './helpers/library-state.js';
import {RunController} from '../src/game/runController.js';
import {registryForVersion} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {resolveLibraryTurnEnd,validateLibraryTurnEnds} from '../src/engine/libraryTurnEnd.js';
import {newProfile,validateRunState} from '../src/services/localStore.js';
import {getEncounter,stageForRun} from '../src/data/stages.js';
import {runeForVersion} from '../src/data/runes.js';
import {campaignBattleCount} from '../src/data/campaignFeatures.js';
import {eligibleRewardCards,createRewardOffer,isStageRelevantCard} from '../src/game/rewards.js';
import {LIBRARY_REWARD_PACK} from '../src/data/libraryPolicy.js';
import {resolveAttack} from '../src/engine/stage.js';
import {resolveTimeGolem} from '../src/engine/timeGolem.js';
import {buildPresentationTimeline,playAttack} from '../src/engine/presentation.js';
import {createRng} from '../src/game/rng.js';
import {createShop} from '../src/game/shop.js';
import {assignedWaterways,assignSentence,use} from './helpers/waterways-state.js';
const registry=registryForVersion('0.9.0'),analyze=text=>analyzeSentence(snapshotFromText(text,{registry}),registry),valid=c=>validateRunState(c.getState(),registry);
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/v09/Syntax_Atlas_0.9_Test_Fixtures.json',import.meta.url)));
for(const row of fixtures.boss.filter(r=>r.input.accepted&&['ATTACK','PREPARE'].includes(r.input.action)))test('0.9 pure arithmetic '+row.id,()=>{
 const x=row.input,e=row.expected,actualDamage=Math.min(x.hpBefore,x.damage),r=resolveLibraryTurnEnd({runId:'qa',battleId:'battle.09.05',turnIndex:7-x.turnsBefore,actionId:row.id,actionType:x.action,hpBefore:x.hpBefore,hpAfterAttack:x.hpBefore-actualDamage,actualDamage,analysis:x.validTargetStructure?analyze('I like what you make.'):analyze('I like books.')});
 for(const key of ['hpAfterAttack','actualDamage','actualHeal','hpAfterTurnEnd'])assert.equal(r[key],e[key]);assert.equal(r.suppressed,e.healSuppressed);assert.equal(r.killed,e.outcome==='VICTORY');
});
test('0.9 confirmed boss HP, golem single-phase excess and version isolation',()=>{
 const hp=[400,800,840,1200,1300,1600,1900,2200,3000];for(let i=1;i<=9;i++){const id='stage.0'+i,s=stageForRun({version:'0.9.0',progress:{stageId:id}}),r=getEncounter(id,s.rounds.length-1,'0.9.0');assert.equal(r.hp,hp[i-1]);if(i<9){assert.notEqual(r.hp,getEncounter(id,s.rounds.length-1,'0.8.1').hp);for(let j=0;j<s.rounds.length-1;j++)assert.equal(getEncounter(id,j,'0.9.0').hp,getEncounter(id,j,'0.8.1').hp);}}
 let enemy=getEncounter('stage.03',4,'0.9.0');assert.deepEqual(enemy.bossMechanic.phases.map(p=>[p.hp,p.maxHp]),[[280,280],[280,280],[280,280]]);
 for(const text of ['I worked.','I work.','I will work.']){const r=resolveTimeGolem(analyze(text),9000,enemy);assert.equal(r.actualHpLoss,280);assert.equal(r.phaseExcess,8720);enemy={...enemy,hp:r.enemyHpAfter,bossMechanic:r.bossStateAfter};}assert.equal(enemy.hp,0);
 assert.equal(campaignBattleCount('0.8.1'),37);assert.equal(campaignBattleCount('0.9.0'),42);assert.throws(()=>stageForRun({version:'0.8.1',progress:{stageId:'stage.09'}}));
});
test('0.9 new run still has 28 cards, two be, fixed have and reward-only help; definitions are versioned',()=>{
 const c=new RunController({profile:{...newProfile('starter QA'),guidedTutorialCompletedVersion:'0.2.1'}});checked(c,{type:'NEW_RUN',config:{seed:'library.deck'}});const s=c.getState(),defs=s.activeCardIds.map(id=>s.cardInstances[id].cardDefId);assert.equal(defs.length,28);assert.equal(defs.filter(id=>id==='card.be').length,2);assert.ok(defs.includes('card.have'));assert.ok(!defs.includes('card.help'));assert.equal(s.contentVersions.generator,'0.8.1');
 for(const [w,r]of Object.entries({have:'RARE',that:'RARE',to:'UNCOMMON',make:'UNCOMMON',help:'UNCOMMON',be:'UNCOMMON',want:'UNCOMMON'}))assert.equal(registry.cardById['card.'+w].rarity,r);
 const old=runeForVersion('rune.longSentence','0.8.1'),now=runeForVersion('rune.longSentence','0.9.0');assert.equal(now.nameKo,'다이아몬드 룬');assert.equal(now.rarity,'RARE');assert.equal(old.nameKo,'운석 룬');assert.equal(old.rarity,'UNCOMMON');assert.deepEqual(now.levelValues,old.levelValues);
});
for(let round=0;round<5;round++)test(`0.9 assigned round ${round+1} frost partition, real opener, load and cleanup`,()=>{
 const {c}=assignedLibrary({round});const s=c.getState(),expected=round===0?['card.what']:round===1?['card.where','card.when']:round===2?['card.whether']:round===3?['card.that','card.it','card.to'].filter(def=>!s.activeCardIds.some(id=>s.cardInstances[id].cardDefId===def)):[];
 assert.deepEqual((s.combat.temporaryCardIds??[]).map(id=>s.cardInstances[id].cardDefId),expected);assert.ok((s.combat.temporaryCardIds??[]).every(id=>!s.activeCardIds.includes(id)));assert.ok(s.combat.openingTrace.witnessSlots.every(slot=>s.combat.handIds.includes(slot.cardInstanceId)));assert.equal(valid(c),true);assert.deepEqual(new RunController({initialState:s,profile:c.getProfile()}).getState(),s);
 for(let i=0;i<6;i++)checked(c,{type:'PREPARE',confirmed:true});assert.equal(c.getState().status,'DEFEAT');assert.ok(!Object.values(c.getState().cardInstances).some(x=>x.temporary));assert.equal(valid(c),true);
});
test('0.9 conditional frost uses permanent ownership, including cards outside hand; 9-4 to 9-5 no support',()=>{
 const {c}=assignedLibrary({round:3,words:['that','it','to']});assert.equal(c.getState().combat.temporaryCardIds.length,0);assert.equal(valid(c),true);
 const s=c.getState();s.combat=null;s.progress={stageId:'stage.09',roundIndex:4,battleNumber:42,contentBoundary:null};c._beginBattle(s);c._state=s;assert.equal(s.combat.temporaryCardIds,undefined);assert.equal(s.combat.libraryFrostTrace,undefined);assert.ok(!Object.values(s.cardInstances).some(x=>x.temporary));assert.equal(valid(c),true);
});
test('0.9 entry unlocks reward cards before first reward, adds no permanent cards/shop and frozen offer restores',()=>{
 const {c}=assignedLibrary({round:0,entry:true});const before=c.getState();assert.ok(!eligibleRewardCards(before).some(c=>c.id==='card.what'));checked(c,{type:'ENTER_STAGE'});const s=c.getState();assert.deepEqual(s.activeCardIds,before.activeCardIds);assert.deepEqual(s.shop,before.shop);assert.ok(s.eligibility.runOwnUnlocks.includes(LIBRARY_REWARD_PACK));
 for(const id of ['card.what','card.whether']){const card=eligibleRewardCards(s).find(c=>c.id===id);assert.equal(card.rarity,'UNCOMMON');assert.equal(isStageRelevantCard(s,card),true);}
 const offer=createRewardOffer(s,c.getProfile()),rng=structuredClone(s.rng);assert.equal(offer.choices.length,3);assert.deepEqual(createRewardOffer(s,c.getProfile()),offer);assert.deepEqual(s.rng,rng);assert.equal(valid(c),true);
});
test('0.9 invalid frost submission shatters once; stale/error submissions preserve all resources',()=>{
 const {c}=assignedLibrary({round:0});const s=c.getState(),id=s.combat.temporaryCardIds[0];assignPiles(c,{hand:[id]});checked(c,{type:'ADD_CARD',cardId:id});const before=c.getState();assert.equal(c.dispatch({type:'SUBMIT',expectedRevision:before.revision-1}).ok,false);assert.deepEqual(c.getState(),before);
 c.analyzer=()=>{throw Error('controlled analyzer failure');};assert.equal(c.dispatch({type:'SUBMIT'}).ok,false);assert.deepEqual(c.getState(),before);c.analyzer=analyzeSentence;
 const r=checked(c,{type:'SUBMIT'});assert.equal(r.resolution.status,'INVALID_CORE');assert.deepEqual(c.getState().combat.shatteredTemporaryIds,[id]);checked(c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});const after=c.getState();assert.equal(after.combat.turnsRemaining,5);assert.equal(after.combat.drawIds.includes(id)||after.combat.discardIds.includes(id)||after.combat.handIds.includes(id),false);assert.equal(valid(c),true);assert.deepEqual(new RunController({initialState:after,profile:c.getProfile()}).getState(),after);
});
test('0.9 Controller target attack suppresses once, following preparation heals, duplicates and errors do not',async()=>{
 const {c,slots}=assignedLibrary({sentences:['I like what you make.']});place(c,slots[0]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.ok(r.actualHpLoss>0);assert.equal(r.turnEndReceipt.suppressed,true);assert.equal(r.turnEndReceipt.actualHeal,0);const hp=c.getState().combat.enemyState.hp;assert.equal(hp,3000-r.actualHpLoss);
 const view=[];await playAttack(r,{impact:()=>view.push('damage'),turnEnd:()=>view.push('turn-end')},{wait:()=>Promise.resolve(),document:null});assert.deepEqual(view,['damage','turn-end']);assert.equal(c.getState().combat.enemyState.hp,hp);
 checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});const after=c.getState();assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:r.attackId}).ok,false);assert.deepEqual(c.getState(),after);assert.equal(valid(c),true);
 const restored=new RunController({initialState:after,profile:c.getProfile()}),p=checked(restored,{type:'PREPARE',commandId:'prepare.once'});assert.equal(p.turnEndReceipt.actualHeal,Math.min(1000,3000-hp));assert.equal(p.turnEndReceipt.suppressed,false);const done=restored.getState();assert.equal(restored.dispatch({type:'PREPARE',commandId:'prepare.once'}).ok,false);assert.deepEqual(restored.getState(),done);assert.equal(done.stats.totalActualDamage,r.actualHpLoss);assert.equal(valid(restored),true);
 const forged=structuredClone(done);forged.combat.libraryTurnEnds[1].actualHeal++;assert.throws(()=>validateRunState(forged,registry));
});
test('0.9 preparation at full HP and exchange/edit consume no extra boss turn-end',()=>{
 const {c}=assignedLibrary();const s=c.getState(),id=s.combat.handIds.find(id=>!s.cardInstances[id].cardDefId.startsWith('card.operation.'));checked(c,{type:'ADD_CARD',cardId:id});checked(c,{type:'RETURN_CARD',cardId:id});checked(c,{type:'EXCHANGE',cardIds:[id]});assert.equal(c.getState().combat.libraryTurnEnds.length,0);const r=checked(c,{type:'PREPARE'});assert.equal(r.turnEndReceipt.actualHeal,0);assert.equal(c.getState().combat.enemyState.hp,3000);assert.equal(valid(c),true);
});
test('0.9 surviving invalid submission heals and final turn defeats only after the turn end',()=>{
 const {c,slots}=assignedLibrary({sentences:['I like what you make.','Whether']});place(c,slots[0]);const r=checked(c,{type:'SUBMIT'}).resolution;checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});place(c,slots[1]);const invalid=checked(c,{type:'SUBMIT'}).resolution;assert.equal(invalid.actualHpLoss,0);assert.equal(invalid.turnEndReceipt.suppressed,false);assert.ok(invalid.turnEndReceipt.actualHeal>0);assert.equal(buildPresentationTimeline(invalid).at(-1).kind,'TURN_END');checked(c,{type:'FINISH_PRESENTATION',attackId:invalid.attackId});for(let i=0;i<4;i++)checked(c,{type:'PREPARE',confirmed:true});assert.equal(c.getState().status,'DEFEAT');assert.equal(c.getState().combat.libraryTurnEnds.length,6);assert.equal(valid(c),true);
});
test('0.9 no new independent nominal multiplier; region applies once to valid evidence only',()=>{
 for(const text of ['I like what you make.','I think that you know whether I work.','I like books.']){
  const snapshot=snapshotFromText(text,{registry}),analysis=analyzeSentence(snapshot,registry),cards=snapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId,polishLevel:0,baseScore:10})),r=resolveAttack({analysis,cards,enemy:getEncounter('stage.09',0,'0.9.0'),stage:stageForRun({version:'0.9.0',progress:{stageId:'stage.09'}}),sentenceSnapshot:snapshot,policyVersion:'0.9.0'});
  assert.equal(r.accepted,true);assert.equal(r.scoreTimeline.filter(e=>e.phase==='REGION').length,text==='I like books.'?0:1);assert.ok(!r.scoreTimeline.some(e=>/NOMINAL|EXTRAPOSED/.test(e.sourceId)));
 }
});
test('0.9 final-turn non-target lethal attack wins before healing; final reward freezes and STAGE9_END saves',()=>{
 const {c,slots}=assignedLibrary({sentences:['I really like good books and you really like good books.'],polish:3,runes:['rune.longSentence','rune.svo','rune.perfectSentence','rune.polished']});
 for(let i=0;i<5;i++)checked(c,{type:'PREPARE'});place(c,slots[0]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.ok(r.finalPower>=3000);assert.equal(r.killed,true);assert.equal(r.turnEndReceipt.actualHeal,0);assert.equal(r.turnEndReceipt.suppressed,false);assert.equal(c.getState().combat.turnsRemaining,0);checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});assert.equal(c.getState().status,'REWARD');const s=c.getState();assert.equal(valid(c),true);const d=new RunController({initialState:s,profile:c.getProfile()});assert.deepEqual(d.getState(),s);
 checked(d,{type:'SKIP_REWARD',offerId:s.reward.offerId});const end=d.getState();assert.equal(end.status,'CONTENT_COMPLETE');assert.equal(end.progress.contentBoundary,'STAGE9_END');assert.equal(end.progress.battleNumber,42);assert.equal(d.getProfile().stage9CompletedRunIds.length,1);assert.equal(d.getProfile().storyClearCount,0);assert.equal(valid(d),true);assert.equal(d.dispatch({type:'NEXT_STAGE'}).ok,false);
});
test('0.9 Stage8 victory transitions to Stage9; immutable entry and old seal receipts survive',()=>{
 const c=assignedWaterways({version:'0.9.0',round:4});assignSentence(c,'A child who runs likes a book I made.');const s=c.getState();for(const slot of s.combat.sentenceSlots)s.cardInstances[slot.cardInstanceId].polishLevel=3;s.runes.orderedInstanceIds=['qa.d','qa.e'];s.runes.instances={'qa.d':{instanceId:'qa.d',runeId:'rune.longSentence',level:3},'qa.e':{instanceId:'qa.e',runeId:'rune.svo',level:3}};c._state=s;
 const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.killed,true);checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});checked(c,{type:'SKIP_REWARD',offerId:c.getState().reward.offerId});assert.equal(c.getState().status,'STAGE_CLEAR');assert.equal(valid(c),true);checked(c,{type:'NEXT_STAGE'});assert.equal(c.getState().progress.battleNumber,38);const before=c.getState();checked(c,{type:'ENTER_STAGE'});assert.deepEqual(c.getState().activeCardIds,before.activeCardIds);assert.deepEqual(c.getState().rng.shop,before.rng.shop);assert.equal(valid(c),true);
});
test('0.9 generated reward/shop grade distribution, price, depletion and legacy policy remain distinct',()=>{
 const {c}=assignedLibrary({round:0}),base=c.getState(),counts={COMMON:0,UNCOMMON:0,RARE:0},shops={COMMON:0,UNCOMMON:0,RARE:0},cards=new Set();let sampled=0;
 for(let seed=0;seed<2400;seed++){
  const s=structuredClone(base);s.rng=createRng('library.distribution.'+seed);s.reward=null;const offer=createRewardOffer(s,c.getProfile());const first=offer.trace.find(r=>r.kind==='RUNE_RARITY_DRAW');if(first){assert.deepEqual(first.weights,{COMMON:194,UNCOMMON:97,RARE:9});counts[first.rarity]++;sampled++;}for(const x of offer.choices)if(x.cardDefId)cards.add(x.cardDefId);
  s.combat=null;s.progress={stageId:'stage.08',roundIndex:0,battleNumber:33};s.shop=null;s.shopHistory=[];const shop=createShop(s),t=shop.trace.find(r=>r.kind==='RUNE_RARITY_DRAW');shops[t.rarity]++;assert.deepEqual(t.weights,{COMMON:194,UNCOMMON:97,RARE:9});for(const x of shop.inventory)if(x.runeId==='rune.longSentence'){assert.equal(x.rarity,'RARE');assert.equal(x.price,32);}for(const x of shop.inventory)if(x.cardDefId)assert.notEqual(x.cardDefId,'card.help');
 }
 assert.ok(cards.has('card.what')&&cards.has('card.whether'));assert.ok(sampled>500);for(const [rows,n]of [[counts,sampled],[shops,2400]]){assert.ok(rows.RARE/n>.015&&rows.RARE/n<.05,JSON.stringify(rows));assert.ok(rows.COMMON>rows.UNCOMMON*1.6&&rows.COMMON<rows.UNCOMMON*2.4);}
 const maxed=structuredClone(base);maxed.runes.orderedInstanceIds=['max'];maxed.runes.instances={max:{instanceId:'max',runeId:'rune.longSentence',level:3}};maxed.rng=createRng('library.maxed');const offer=createRewardOffer(maxed,c.getProfile());assert.ok(!offer.choices.some(c=>c.runeId==='rune.longSentence'));for(const t of offer.trace.filter(t=>t.kind==='RUNE_RARITY_DRAW'))assert.equal(t.weights.RARE,undefined);
 console.log('ACTUAL_GENERATED_RARITY_COUNTS',JSON.stringify({reward:{counts,sampled},shop:{counts:shops,sampled:2400},newPermanentCards:[...cards].filter(id=>['card.what','card.whether'].includes(id))}));
});

test('0.9 nominal catalog records actual structures independently of unlocks, once per accepted attack',()=>{
 const {c,slots}=assignedLibrary({sentences:['I like what you make.']});place(c,slots[0]);const r=checked(c,{type:'SUBMIT'}).resolution;
 checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});const profile=c.getProfile(),record=profile.nominalRecords.NOMINAL_WHAT;
 assert.equal(record.count,1);assert.equal(record.firstComplete.recordId,r.attackId);assert.equal(record.bestPower,r.finalPower);assert.equal(record.bestComplete.actualHpLoss,r.actualHpLoss);
 c.dispatch({type:'FINISH_PRESENTATION',attackId:r.attackId});assert.deepEqual(c.getProfile(),profile);
 const restored=new RunController({initialState:c.getState(),profile});assert.deepEqual(restored.getProfile().nominalRecords,profile.nominalRecords);
});

test('0.9 assigned five-battle integration uses real damage, rewards, frost cleanup and exact restored transitions',()=>{
 const sentences=['I really like what you really make today.','I really know where you really work today.','I really know whether you really like good books.','It is really good to read good books today.','I really like what you really make today.'];
 let {c,slots}=assignedLibrary({round:0,sentences,polish:3,runes:['rune.longSentence','rune.svo','rune.perfectSentence','rune.polished']});const permanent=c.getState().activeCardIds;
 for(let round=0;round<5;round++){
  const before=c.getState();assert.equal(before.progress.battleNumber,38+round);assert.deepEqual(before.activeCardIds,permanent);if(round===4)assert.equal(before.combat.temporaryCardIds?.length??0,0);
  place(c,slots[round]);const r=checked(c,{type:'SUBMIT'}).resolution;assert.equal(r.status,'VALID');assert.equal(r.killed,true);checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});assert.equal(c.getState().status,'REWARD');assert.equal(c.getState().combat.temporaryCardIds?.length??0,0);assert.equal(valid(c),true);
  checked(c,{type:'SKIP_REWARD',offerId:c.getState().reward.offerId});const save=c.getState();c=new RunController({initialState:save,profile:c.getProfile()});assert.deepEqual(c.getState(),save);if(round<4)checked(c,{type:'NEXT_BATTLE'});
 }
 assert.equal(c.getState().progress.contentBoundary,'STAGE9_END');assert.equal(c.getProfile().stage9CompletedRunIds.length,1);
});

test('0.9 supply, direct search, recycling and duplicate operation completion never end the boss turn',()=>{
 const {c,slots}=assignedLibrary({sentences:['I like what you make.'],words:['operation.supply','operation.search','operation.recycle']});place(c,slots[0]);const r=checked(c,{type:'SUBMIT'}).resolution;checked(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});const before=c.getState(),operations=before.activeCardIds.filter(id=>before.cardInstances[id].cardDefId.startsWith('card.operation.'));
 assignPiles(c,{hand:operations,discard:slots[0].map(s=>s.cardInstanceId)});
 for(const source of operations){const state=c.getState(),search=state.cardInstances[source].cardDefId==='card.operation.search',target=search?state.combat.drawIds.find(id=>!state.cardInstances[id].cardDefId.startsWith('card.operation.')):undefined;const effect=use(c,source,target);const done=c.getState();c.dispatch({type:'FINISH_OPERATION',effectId:effect.effectId});assert.deepEqual(c.getState(),done);assert.equal(done.combat.enemyState.hp,before.combat.enemyState.hp);assert.deepEqual(done.combat.libraryTurnEnds,before.combat.libraryTurnEnds);assert.equal(done.combat.turnsRemaining,before.combat.turnsRemaining);assert.equal(valid(c),true);}
});
