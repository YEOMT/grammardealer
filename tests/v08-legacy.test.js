import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {captureLegacy07} from './helpers/legacy-07-baseline.js';
test('0.8 preserves independently captured pre-edit 0.7 registry/runes/8 decks/56 rewards/8 shops/9 attacks',()=>{
 const expected=JSON.parse(fs.readFileSync(new URL('./fixtures/v08/legacy-07-hashes.json',import.meta.url)));
 assert.deepEqual(captureLegacy07(),expected);
});

import {legacyShops} from './helpers/legacy-07-shops.js';
test('0.8 independent start-main archive: 24 legacy Stage2/4/6 shop states, RNG and grants unchanged',()=>{assert.deepEqual(legacyShops(),JSON.parse(fs.readFileSync(new URL('./fixtures/v08/legacy-07-shops-reference.json',import.meta.url))));});

import {RunController} from '../src/game/runController.js';
import {validateRunState} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';
test('0.8 restores original archived0.7 completed fixture unchanged and cannot extend it to Stage8',()=>{
 const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/v08/legacy-07-completed-reference.json',import.meta.url))),{run,profile}=fixture;
 assert.equal(validateRunState(run,registryForVersion('0.8.0')),true);const c=new RunController({initialState:run,profile});assert.deepEqual(c.getState(),run);assert.equal(c.getState().version,'0.7.0');assert.equal(c.getState().progress.contentBoundary,'STAGE7_END');assert.equal(c.dispatch({type:'NEXT_STAGE'}).ok,false);assert.deepEqual(c.getState(),run);assert.deepEqual(c.getProfile(),profile);
});
