import test from 'node:test';import assert from 'node:assert/strict';
import {RunController} from '../src/game/runController.js';import {newProfile,validateRunState,canSaveRun} from '../src/services/localStore.js';
import {registry} from '../src/data/language/index.js';import {snapshotFromText} from '../src/engine/grammar/index.js';import {grantStage4Entry} from '../src/game/skyIslands.js';
const act=(c,command)=>{const r=c.dispatch(command);assert.equal(r.ok,true,command.type+': '+r.message);return r;};
export function newSky(seed='sky.progression'){const c=new RunController({profile:{...newProfile('assigned 17-boundary'),guidedTutorialCompletedVersion:'0.2.1'}});act(c,{type:'NEW_RUN',config:{seed}});return c;}
export function assignedAttack(c,text){
 // Deliberately assigned physical words/+3 for boundary testing. Never reported as actual deck play.
 const s=c.getState(),tokens=snapshotFromText(text).orderedTokens,ids=s.activeCardIds.filter(id=>!s.cardInstances[id].cardDefId.startsWith('card.operation.')).slice(0,tokens.length);
 for(const[t,i]of tokens.map((t,i)=>[t,i])){s.cardInstances[ids[i]].cardDefId=t.cardDefId;s.cardInstances[ids[i]].polishLevel=3;}
 s.combat.sentenceSlots=ids.map((id,i)=>({cardInstanceId:id,selection:{formId:tokens[i].selectionId}}));s.combat.handIds=[];s.combat.discardIds=[];s.combat.drawIds=s.activeCardIds.filter(id=>!ids.includes(id));s.combat.battleDirty=true;c._state=s;
 const r=act(c,{type:'SUBMIT'}).resolution;act(c,{type:'FINISH_PRESENTATION',attackId:r.attackId});return r;
}
export function advanceAssigned(c,{stopShop2=false}={}){
 const snapshots=[],battles=[],shops=[];
 for(let guard=0;guard<150;guard++){
  let s=c.getState();if(['CONTENT_COMPLETE','DEFEAT'].includes(s.status))return {snapshots,battles,shops,state:s};
  if(s.status==='STAGE_INTRO'){act(c,{type:s.progress.stageId==='stage.01'?'START_BATTLE':'ENTER_STAGE'});}
  else if(s.status==='SHOP'){shops.push(structuredClone(s.shop));if(stopShop2&&s.progress.stageId==='stage.04')return {snapshots,battles,shops,state:s};act(c,{type:'LEAVE_SHOP',shopId:s.shop.shopId});}
  else if(s.status==='BATTLE'){
   const phase=s.combat.enemyState.bossMechanic?.phases?.[s.combat.enemyState.bossMechanic.activePhase]?.id;
   const text=phase==='PAST'?'I had played games':phase==='PRESENT'?'I have played games':phase==='FUTURE'?'I will have played games':'I had played games and she will have played music';
   const r=assignedAttack(c,text);if(c.getState().status==='REWARD')battles.push(s.progress.battleNumber);assert.ok(r.actualHpLoss>0);
  }else if(s.status==='REWARD')act(c,{type:'SKIP_REWARD',offerId:s.reward.offerId});else act(c,{type:s.status==='STAGE_CLEAR'?'NEXT_STAGE':'NEXT_BATTLE'});
  s=c.getState();assert.equal(validateRunState(s,registry),true,s.status+' '+s.progress.battleNumber);if(canSaveRun(s)){assert.deepEqual(new RunController({initialState:JSON.parse(JSON.stringify(s))}).getState(),s);snapshots.push(s);}
 }throw Error('assigned progression did not terminate');
}
test('0.4 assigned real engine attacks traverse 17 boundaries / two shops / three golem phases without changing enemy HP',()=>{
 const c=newSky(),r=advanceAssigned(c);assert.equal(r.state.status,'CONTENT_COMPLETE');assert.equal(r.state.progress.contentBoundary,'STAGE4_END');assert.deepEqual(r.battles,Array.from({length:17},(_,i)=>i+1));assert.deepEqual(r.shops.map(s=>[s.stageId,s.inventory.length]),[['stage.02',3],['stage.04',5]]);assert.equal(r.state.runes.slotLimit,4);assert.equal(r.state.shopHistory.length,1);assert.equal(c.getProfile().highestCompletedStage,4);assert.equal(c.getProfile().stage4CompletedRunIds.length,1);assert.equal(c.getProfile().storyClearCount,0);assert.ok(c.getProfile().unlocks.includes('pack.clauseLink'));const before=c.getState();assert.equal(c.dispatch({type:'SKIP_REWARD',offerId:before.reward.offerId}).ok,false);assert.deepEqual(c.getState(),before);
});
test('0.4 missing-only Stage4 grant all 16 capability combinations is idempotent without RNG use or regrant after removal',()=>{
 for(let mask=0;mask<16;mask++){const c=newSky(),s=c.getState();s.progress={stageId:'stage.04',roundIndex:0,battleNumber:13,contentBoundary:null};const defs=['card.and','card.when','card.know','card.that'];s.activeCardIds=s.activeCardIds.filter(id=>!['card.and','card.because','card.when','card.if','card.think','card.know','card.say','card.that'].includes(s.cardInstances[id].cardDefId));for(let i=0;i<4;i++)if(mask&(1<<i)){const id='owned.'+i;s.activeCardIds.push(id);s.cardInstances[id]={instanceId:id,cardDefId:defs[i],polishLevel:0,specialEffectId:null};}const rng=structuredClone(s.rng),grant=grantStage4Entry(s);assert.equal(grant.cardDefIds.length,4-defs.filter((_,i)=>mask&(1<<i)).length);assert.deepEqual(s.rng,rng);const frozen=structuredClone(s);grantStage4Entry(s);assert.deepEqual(s,frozen);s.activeCardIds=s.activeCardIds.filter(id=>!grant.cardInstanceIds.includes(id));grantStage4Entry(s);assert.ok(grant.cardInstanceIds.every(id=>!s.activeCardIds.includes(id)));}
});
test('0.4 second shop keeps first purchases, cumulative removal prices, fixed RNG and rejects malformed save records',()=>{
 const c=newSky('shop.chain');act(c,{type:'START_BATTLE'});
 while(c.getState().status!=='SHOP'){let s=c.getState();if(s.status==='BATTLE')assignedAttack(c,'I had played games and she will have played music');else if(s.status==='REWARD')act(c,{type:'SKIP_REWARD',offerId:s.reward.offerId});else act(c,{type:s.status==='STAGE_CLEAR'?'NEXT_STAGE':s.status==='STAGE_INTRO'?'ENTER_STAGE':'NEXT_BATTLE'});}
 let s=c.getState();const target=s.activeCardIds.at(-1);act(c,{type:'SHOP_SERVICE',shopId:s.shop.shopId,serviceKind:'REMOVE',targetCardInstanceId:target,confirmRemoval:true});assert.equal(c.getState().economy.paidRemovalCount,1);const first=structuredClone(c.getState().shop);act(c,{type:'LEAVE_SHOP',shopId:first.shopId});advanceAssigned(c,{stopShop2:true});s=c.getState();assert.deepEqual(s.shopHistory[0],{...first,closed:true});assert.equal(s.shop.services.REMOVE.price,8);assert.equal(s.shop.services.POLISH.used,false);assert.equal(canSaveRun(s),true);const loaded=new RunController({initialState:s}),rng=structuredClone(s.rng);assert.deepEqual(loaded.getState(),s);assert.equal(loaded.dispatch({type:'ENTER_STAGE'}).ok,false);assert.deepEqual(loaded.getState().rng,rng);
 const item=s.shop.inventory.find(x=>x.kind==='CARD');act(loaded,{type:'SHOP_BUY',shopId:s.shop.shopId,itemId:item.itemId});assert.equal(validateRunState(loaded.getState(),registry),true);assert.equal(loaded.dispatch({type:'SHOP_BUY',shopId:s.shop.shopId,itemId:item.itemId}).ok,false);
 for(const change of [s=>s.shopHistory=[],s=>s.shopHistory[0].closed=false,s=>s.shop.inventory[1].itemId=s.shop.inventory[0].itemId,s=>s.shop.services.REMOVE.price=6,s=>s.shop.stageId='stage.02',s=>s.entryGrants['stage.04'].cardDefIds=['card.will']]){const bad=structuredClone(s);change(bad);assert.throws(()=>validateRunState(bad,registry));}
});
