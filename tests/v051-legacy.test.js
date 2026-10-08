import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {baseline05} from './helpers/polish-baseline.js';
import {RunController} from './helpers/legacy-051-controller.js';
import {validateRunState,newProfile} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';
import {hasDesertCampaign,campaignBattleCount} from '../src/data/campaignFeatures.js';
import {getEncounter} from '../src/data/stages.js';
import {comboEligibility} from '../src/engine/comboEligibility.js';
test('0.5.1 independent pre-edit 0.5 registry, eight decks/openers, rewards, shops and full resolutions unchanged',()=>{
 const old=JSON.parse(fs.readFileSync(new URL('./fixtures/v051-legacy-050-golden.json',import.meta.url)));
 assert.deepEqual(baseline05(),old);
});
test('0.5.1 loads original 0.5 late-stage saves, operations, boss boundaries without migration',()=>{
 for(const s of JSON.parse(fs.readFileSync(new URL('./fixtures/v051-legacy-050-states.json',import.meta.url)))){
  assert.equal(validateRunState(s,registryForVersion('0.5.0')),true);
  assert.deepEqual(new RunController({initialState:s}).getState(),s);
 }
 assert.equal(getEncounter('stage.04',4,'0.5.0').hp,640);assert.equal(getEncounter('stage.05',4,'0.5.0').hp,840);
});
test('0.5.1 routes all semantic policies to 0.5 and keeps 22 battles and starter resources',()=>{
 const c=new RunController({profile:{...newProfile('mapping'),guidedTutorialCompletedVersion:'0.2.1'}});
 assert.ok(c.dispatch({type:'NEW_RUN',config:{seed:'mapping'}}).ok);assert.ok(c.dispatch({type:'START_BATTLE'}).ok);
 const s=c.getState();assert.equal(s.version,'0.5.1');assert.equal(campaignBattleCount(s),22);assert.ok(hasDesertCampaign(s));
 assert.strictEqual(registryForVersion(s.version),registryForVersion('0.5.0'));assert.equal(comboEligibility(s).version,'0.5.0');
 assert.equal(s.activeCardIds.length,28);assert.equal(s.combat.enemyState.hp,77);assert.equal(s.combat.handIds.length,6);assert.equal(s.combat.turnsRemaining,6);assert.equal(s.combat.exchangesRemaining,4);
 assert.equal(validateRunState(s,registryForVersion(s.version)),true);
});
