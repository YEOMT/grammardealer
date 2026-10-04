import test from 'node:test';import assert from 'node:assert/strict';
import {deepFreeze,requireInteger,requireId,assertSerializable} from '../src/contracts.js';
test('Gate A immutable serializable snapshot contracts',()=>{const a=deepFreeze({x:{y:1}});assert.throws(()=>{a.x.y=2});assert.throws(()=>requireInteger(Infinity,'power'));assert.throws(()=>requireId(''));assert.throws(()=>assertSerializable({bad:()=>1}));assert.equal(assertSerializable({ok:[1,'two',null]}),true);});
