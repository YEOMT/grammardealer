import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {registryForVersion} from '../src/data/language/index.js';
import {generateStarterDeck} from '../src/game/deck.js';
import {createRewardOffer} from '../src/game/rewards.js';
import {grantStage2Entry,createShop} from '../src/game/shop.js';
import {analyzeSentence} from '../src/engine/grammar/index.js';
import {resolveAttack} from '../src/engine/stage.js';
const golden=JSON.parse(fs.readFileSync(new URL('./fixtures/v05-legacy-040-golden.json',import.meta.url)));
test('0.5 immutable pre-change 0.4 registry, 8 starter decks and RNG remain identical',()=>{
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(registryForVersion('0.4.0'))).digest('hex'),golden.registryHash);
 for(const row of golden.decks)assert.deepEqual(generateStarterDeck(row.options),row.expected);
});
test('0.5 immutable pre-change 136 old rewards and 8 shops preserve candidates, history and RNG',()=>{
 for(const row of golden.rewards){const run=structuredClone(row.before);assert.deepEqual(createRewardOffer(run,row.profile),row.expected);assert.deepEqual(run,row.after);}
 for(const row of golden.shops){const run=structuredClone(row.before);grantStage2Entry(run);run.shop=createShop(run);assert.deepEqual(run,row.after);}
});
test('0.5 immutable old language analyses and full attack timelines preserve all 12 records',()=>{
 for(const row of golden.attacks){const input=structuredClone(row.input);input.analysis=analyzeSentence(input.sentenceSnapshot,registryForVersion('0.4.0'));assert.deepEqual(input.analysis,row.input.analysis,row.text);assert.deepEqual(resolveAttack(input),row.expected,row.text);}
});
