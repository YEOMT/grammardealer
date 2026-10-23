import test from 'node:test';
import assert from 'node:assert/strict';
import {assignedCorridor,assignPiles,checked} from './helpers/corridor-state.js';
import {assertCardConservation} from '../src/game/invariants.js';
import {RunController} from '../src/game/runController.js';

for(const [limit,space] of [[10,0],[10,2],[10,10],[14,2]])test(`quick UX: atomic rightmost return, hand ${limit}, free ${space}`,()=>{
 const {c,slots}=assignedCorridor({version:'0.10.2',sentences:['She is reading books.'],polish:3});
 const ids=slots[0].map(s=>s.cardInstanceId),state=c.getState();
 state.combat.rulesSnapshot.handLimit=limit;c._state=state;
 assignPiles(c,{sentence:slots[0],hand:state.activeCardIds.filter(id=>!ids.includes(id)).slice(0,limit-space)});
 const before=c.getState(),r=c.dispatch({type:'CLEAR_SENTENCE',commandId:'clear.once'});
 if(!space){assert.equal(r.ok,false);assert.equal(r.message,'손패에 빈자리가 없습니다');assert.deepEqual(c.getState(),before);return;}
 assert.equal(r.ok,true);const count=Math.min(space,ids.length),returned=ids.slice(-count).reverse(),after=c.getState();
 assert.deepEqual(r.returnedIds,returned);assert.deepEqual(after.combat.handIds,[...before.combat.handIds,...returned]);
 assert.deepEqual(after.combat.sentenceSlots,before.combat.sentenceSlots.slice(0,-count));
 for(const key of ['turnsRemaining','exchangesRemaining','turnIndex'])assert.equal(after.combat[key],before.combat[key]);
 for(const key of ['cardInstances','economy','rng','stats'])assert.deepEqual(after[key],before[key]);
 assertCardConservation(after.activeCardIds,after.combat);
 assert.equal(c.dispatch({type:'CLEAR_SENTENCE',commandId:'clear.once'}).ok,false);assert.deepEqual(c.getState(),after);
 for(const id of returned){checked(c,{type:'ADD_CARD',cardId:id});assert.deepEqual(c.getState().combat.sentenceSlots.at(-1).selection,before.combat.sentenceSlots.find(s=>s.cardInstanceId===id).selection);assert.equal(c.getHandSelection(id),null);}
});
test('quick UX: empty no-op, presentation lock, old save untouched',()=>{
 const {c,slots}=assignedCorridor({version:'0.10.1',sentences:['I read books.']});assignPiles(c,{sentence:[],hand:[]});
 const empty=c.getState();assert.equal(c.dispatch({type:'CLEAR_SENTENCE'}).ok,true);assert.deepEqual(c.getState(),empty);
 const restored=new RunController({initialState:JSON.parse(JSON.stringify(empty)),profile:c.getProfile()});assert.deepEqual(restored.getState(),empty);assert.equal(restored.getState().combat.rulesSnapshot.sentenceLimit,16);
 assignPiles(c,{sentence:slots[0]});checked(c,{type:'SUBMIT'});const presenting=c.getState();assert.equal(c.dispatch({type:'CLEAR_SENTENCE'}).ok,false);assert.deepEqual(c.getState(),presenting);
});
