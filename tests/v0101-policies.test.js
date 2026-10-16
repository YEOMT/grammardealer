import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {RunController} from './helpers/legacy-0101-controller.js';
import {newProfile,validateRunState} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';
import {runesForVersion} from '../src/data/runes.js';
import {runeRarityWeightsForVersion} from '../src/data/balance.js';
import {runeDropContext} from '../src/data/polish0101Runes.js';
import {eligibleRunes,chooseRune,createRewardOffer} from '../src/game/rewards.js';
import {grantStage2Entry,createShop} from '../src/game/shop.js';
import {createStream} from '../src/game/rng.js';
import {meaningfulComboEvent,comboFeel,runeFeel} from '../src/engine/comboFeel.js';
import {buildPresentationTimeline} from '../src/engine/presentation.js';
import {applyRunes} from '../src/engine/runes.js';
import {resolveNormalResistance} from '../src/engine/normalResistance.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {assignedCorridor,checked,place} from './helpers/corridor-state.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('./fixtures/v0101/fixtures/'+name,import.meta.url)));
const profile={...newProfile('0101 QA'),guidedTutorialCompletedVersion:'0.2.1',firstRuneIntroSeen:true};
const fresh=()=>{const c=new RunController({profile});assert.ok(c.dispatch({type:'NEW_RUN',config:{seed:'0101.drop'}}).ok);return c.getState();};
function contextRun(row){const run=fresh(),stageId='stage.'+String(row.stage).padStart(2,'0');run.progress={stageId,roundIndex:0,battleNumber:row.source==='LATER_R2_GENERAL_SLOT'?2:row.stage===1?3:43};run.combat={enemyState:{kind:row.source==='REGIONAL_BOSS_REWARD'?'REGIONAL_BOSS':'NORMAL'}};return run;}
for(const row of read('drop_cases.json').cases)test('0.10.1 assigned drop eligibility '+row.id,()=>{
 const run=contextRun(row),context={source:row.source==='SHOP'?'SHOP':row.source==='LATER_R2_GENERAL_SLOT'?'INTRO':'REWARD'};
 assert.equal(runeDropContext(run,context).rareAllowed,row.rareAllowed);
 const pool=eligibleRunes(run,context),weights=runeRarityWeightsForVersion(run.version);
 assert.deepEqual(Object.fromEntries(Object.keys(row.expectedWeights).map(k=>[k,pool.some(r=>r.rarity===k)?weights[k]:0])),row.expectedWeights);
 if(row.ownedRareLevel){run.runes.orderedInstanceIds=['rare'];run.runes.instances.rare={instanceId:'rare',runeId:'rune.relative',level:2};assert.equal(eligibleRunes(run,context).some(r=>r.id==='rune.relative'),row.sameRareUpgradeAllowed);}
 if(row.allAllowedRunesMaxLevel){
  // Pure candidate exhaustion, not a legal 18-slot gameplay state.
  run.runes.orderedInstanceIds=pool.map(r=>r.id);run.runes.instances=Object.fromEntries(pool.map(r=>[r.id,{instanceId:r.id,runeId:r.id,level:3}]));
  assert.equal(eligibleRunes(run,context).length,0);
  if(context.source==='SHOP'){run.combat=null;run.progress={stageId:'stage.02',roundIndex:0,battleNumber:4};grantStage2Entry(run);assert.equal(createShop(run).inventory.filter(x=>x.kind==='RUNE').length,0);}
  else{const offer=createRewardOffer(run,profile);assert.equal(offer.choices.some(c=>c.kind==='RUNE'),false);assert.ok(offer.trace.some(t=>t.excludedTypes?.includes('RUNE')));}
 }
});
test('0.10.1 all common/uncommon candidates early; original introductions and frozen offers',()=>{
 const run=fresh();assert.equal(eligibleRunes(run).length,18);assert.ok(eligibleRunes(run).some(r=>r.id==='rune.svoo'));assert.ok(!run.eligibility.runOwnUnlocks.length);
 run.progress.battleNumber=2;run.progress.roundIndex=1;
 const original=createRewardOffer(structuredClone(run),{...profile,firstRuneIntroSeen:false});assert.deepEqual(original.choices.map(x=>x.runeId),['rune.perfectSentence','rune.short','rune.discards']);
 const later=createRewardOffer(run,profile),before=structuredClone(run);assert.equal(later.choices.length,3);assert.ok(later.choices.slice(0,2).every(x=>x.role==='BASIC'));assert.ok(later.choices.every(x=>x.rarity!=='RARE'));assert.deepEqual(createRewardOffer(run,profile),later);assert.deepEqual(run,before);
});
test('0.10.1 conditional rune distributions: 20k actual selector calls per context; complete eligible pools',()=>{
 const reports=[];
 for(const [source,stage]of [['NORMAL_REWARD',1],['REGIONAL_BOSS_REWARD',1],['SHOP',2],['SHOP',4],['LATER_R2_GENERAL_SLOT',1]]){
  const run=contextRun({source,stage}),context={source:source==='SHOP'?'SHOP':source==='LATER_R2_GENERAL_SLOT'?'INTRO':'REWARD'},pool=eligibleRunes(run,context),counts={},grades={};run.rng.reward=createStream('0101.distribution.'+source+stage,'reward');
  for(let i=0;i<20000;i++){const picked=chooseRune(run,pool);counts[picked.id]=(counts[picked.id]??0)+1;grades[picked.rarity]=(grades[picked.rarity]??0)+1;}
  const rare=runeDropContext(run,context).rareAllowed;assert.equal(Object.keys(counts).length,pool.length);assert.ok(Math.abs(grades.COMMON/20000-(rare?194/300:2/3))<.02);assert.ok(Math.abs(grades.UNCOMMON/20000-(rare?97/300:1/3))<.02);assert.ok(rare?Math.abs(grades.RARE/20000-.03)<.01:!grades.RARE);
  for(const rarity of Object.keys(grades)){const candidates=pool.filter(r=>r.rarity===rarity),expected=grades[rarity]/candidates.length;for(const r of candidates)assert.ok(Math.abs(counts[r.id]-expected)<Math.max(25,expected*.3),r.id);}
  reports.push({source,stage,samples:20000,scope:'RUNE_SELECTOR_CONDITIONAL_NOT_REWARD_SCREEN',grades,counts});
 }
 if(process.env.SB_0101_OUT){fs.mkdirSync(process.env.SB_0101_OUT,{recursive:true});fs.writeFileSync(process.env.SB_0101_OUT+'/rune-distribution.json',JSON.stringify(reports,null,2));}
});
test('0.10.1 actual mixed rewards obey each source, independent of rare WORD cards',()=>{
 const totals=[];
 for(const boss of [false,true]){const run=fresh();run.progress={stageId:'stage.04',roundIndex:boss?4:0,battleNumber:boss?17:13};run.combat={enemyState:{kind:boss?'REGIONAL_BOSS':'NORMAL'}};const counts={runes:0,rareRunes:0,rareWords:0};
  for(let i=0;i<1500;i++){run.reward=null;const offer=createRewardOffer(run,profile);assert.equal(offer.choices.length,3);assert.equal(new Set(offer.choices.filter(x=>x.kind==='RUNE').map(x=>x.runeId)).size,offer.choices.filter(x=>x.kind==='RUNE').length);for(const choice of offer.choices){if(choice.kind==='RUNE'){counts.runes++;if(choice.rarity==='RARE')counts.rareRunes++;}if(choice.kind==='CARD'&&choice.rarity==='RARE')counts.rareWords++;}}
  assert.ok(counts.runes>0);assert.ok(boss?counts.rareRunes>0:counts.rareRunes===0);totals.push({boss,samples:1500,...counts});
 }
 if(process.env.SB_0101_OUT)fs.writeFileSync(process.env.SB_0101_OUT+'/mixed-reward-distribution.json',JSON.stringify(totals,null,2));
});
for(const row of read('presentation_cases.json').cases.filter(x=>x.event))test('0.10.1 pure visual combo '+row.id,()=>assert.equal(Number(meaningfulComboEvent(row.event)),row.expectedVisualComboIncrement));
test('0.10.1 duplicate event, flight and new attack visual counts; bounded continuous feel',()=>{
 const event={eventId:'a.1',phase:'RUNES',sourceType:'RUNE',operation:'ADD',operand:30,before:100,after:130};
 const r={scoreTimeline:[event,event],finalPower:130,enemyHpBefore:500,enemyHpAfter:370,actualHpLoss:130};
 const steps=buildPresentationTimeline(r);assert.deepEqual(steps.filter(s=>s.kind==='SCORE').map(s=>s.combo),[1,1]);assert.equal(steps.filter(s=>s.kind==='RUNE_FLIGHT').length,2);assert.equal(buildPresentationTimeline({...r,scoreTimeline:[]})[0].kind,'LOCK');
 for(let n=1;n<=30;n++){assert.ok(comboFeel(n).scale<=1.12);assert.ok(comboFeel(n).progress>=comboFeel(n-1).progress);}assert.equal(runeFeel('RARE',3),1.62);
});
test('0.10.1 S031–S034 ordered engine arithmetic and unchanged Stage8 resistance',()=>{
 const analysis=analyzeSentence(snapshotFromText('I work.')),cards=[{instanceId:'fixture.0'},{instanceId:'fixture.1'}],score={preRuneScore:100,events:[],contributingCardIds:cards.map(c=>c.instanceId),excludedCardIds:[]},evidence={eligible:true,cardIds:['fixture.1'],evidenceRefs:['synthetic']};
 for(const [ids,expected]of [[['rune.past','rune.sv'],208],[['rune.sv','rune.past'],190],[['rune.past','rune.progressive'],160]])assert.equal(applyRunes(analysis,score,ids.map(runeId=>({runeId,level:1})),cards,{version:'0.10.1',runeEvidence:{'rune.past':evidence,'rune.progressive':evidence}}).postRuneScore,expected);
 const r=resolveNormalResistance({version:'0.10.1',stageId:'stage.08',kind:'NORMAL',power:3000,hp:100});assert.deepEqual([r.finalPower,r.actualHpLoss,r.overkill],[1950,100,1850]);
});
test('0.10.1 assigned boss + save round trip: independent Topaz/Amethyst, foresight and exactly-once commit',()=>{
 const {c,slots}=assignedCorridor({version:'0.10.1',sentences:['I enjoy reading books.','I enjoy reading books.','If I worked I would help you.'],runes:['rune.svoo','rune.gerund','rune.clauseLink','rune.unrealPresent']});
 const before=c.getState();assert.equal(validateRunState(before,registryForVersion(before.version)),true);const restored=new RunController({initialState:before,profile:c.getProfile()});assert.deepEqual(restored.getState(),before);
 place(c,slots[0]);const first=checked(c,{type:'SUBMIT'}).resolution;assert.ok(first.actualHpLoss>0);assert.equal(first.scoreTimeline.filter(e=>e.sourceId==='rune.gerund').length,1);assert.equal(first.scoreTimeline.filter(e=>e.sourceId==='rune.svoo').length,0);checked(c,{type:'FINISH_PRESENTATION',attackId:first.attackId});
 place(c,slots[1]);const second=checked(c,{type:'SUBMIT'}).resolution;assert.equal(second.finalPower,0);assert.ok(second.scoreTimeline.some(e=>e.sourceId==='rune.gerund'));checked(c,{type:'FINISH_PRESENTATION',attackId:second.attackId});const after=c.getState();assert.equal(c.dispatch({type:'FINISH_PRESENTATION',attackId:second.attackId}).ok,false);assert.deepEqual(c.getState(),after);assert.equal(validateRunState(after,registryForVersion(after.version)),true);
 place(c,slots[2]);const third=checked(c,{type:'SUBMIT'}).resolution;assert.equal(third.foresightResult.bypassed,true);assert.equal(third.foresightResult.rememberedFrameAfter,'SVO');assert.ok(third.finalPower>0);
});
