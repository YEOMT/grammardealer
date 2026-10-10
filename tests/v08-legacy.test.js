import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {captureLegacy07} from './helpers/legacy-07-baseline.js';
test('0.8 preserves independently captured pre-edit 0.7 registry/runes/8 decks/56 rewards/8 shops/9 attacks',()=>{
 const expected=JSON.parse(fs.readFileSync(new URL('./fixtures/v08/legacy-07-hashes.json',import.meta.url)));
 assert.deepEqual(captureLegacy07(),expected);
});

import {legacyShops} from './helpers/legacy-07-shops.js';
test('0.8 independent start-main archive: 24 legacy Stage2/4/6 shop states, RNG and grants unchanged',()=>{assert.deepEqual(legacyShops(),JSON.parse(fs.readFileSync(new URL('./fixtures/v08/legacy-07-shops-reference.json',import.meta.url))));});
