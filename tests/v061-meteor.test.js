import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyRunes,describeRune} from '../src/engine/runes.js';
import {runesForVersion} from '../src/data/runes.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {registryForVersion} from '../src/data/language/index.js';
const cases=JSON.parse(fs.readFileSync(new URL('./fixtures/v061-06_Score_Cases_0.6.1.json',import.meta.url))).cases;
for(const f of cases.filter(f=>Number(f.id.slice(1))<=32))test(`0.6.1 actual rune engine ${f.id}`,()=>{
 const count=f.submittedWordCards??f.contributingWords;
 const cards=Array.from({length:count},(_,i)=>({instanceId:`word.${i}`,cardDefId:'card.book',baseScore:10,polishLevel:0,...(i<(f.frostWordsIncluded??0)?{temporary:true}: {})}));
 const contributingCardIds=cards.slice(0,f.contributingWords).map(c=>c.instanceId);
 const analysis={status:'VALID',grammarVersion:f.version,grammarHits:[],nonfinitePhrases:f.gapReferences?[{gapRole:'DIRECT_OBJECT',antecedentCardIds:[cards[0].instanceId]}]:[]};
 const result=applyRunes(analysis,{preRuneScore:f.before,events:[],contributingCardIds,excludedCardIds:cards.slice(f.contributingWords).map(c=>c.instanceId)},[{runeId:'rune.longSentence',level:f.level}],cards,{version:f.version});
 assert.equal(result.postRuneScore,f.expected);assert.equal(result.runeEvents.length,f.expectedRuneEvents??1);
 if(f.operand){assert.deepEqual(result.runeEvents[0].operand,f.operand);assert.deepEqual(result.runeEvents[0].highlightCardIds,contributingCardIds);}
});
test('0.6.1 meteor description uses the same exact rational values as all three engine levels',()=>{
 for(const [level,short,long]of[[1,1.8,2.4],[2,2.2,2.8],[3,2.6,3.2]])assert.equal(describeRune('rune.longSentence',level,'0.6.1'),`유효 카드 5~9장 ×${short} / 10~16장 ×${long}`);
 const old=runesForVersion('0.6.0'),next=runesForVersion('0.6.1');assert.deepEqual(next.filter(x=>x.id!=='rune.longSentence'),old.filter(x=>x.id!=='rune.longSentence'));
});
test('0.6.1 S039 observed8618 is not an expected score without a full original snapshot',()=>{
 const f=cases.find(f=>f.id==='S039'),registry=registryForVersion('0.6.1'),snapshot=snapshotFromText(f.sentence,{registry}),analysis=analyzeSentence(snapshot,registry);
 assert.equal(snapshot.orderedTokens.length,f.expectedWordCount);assert.equal(analysis.status,'VALID');assert.equal(f.exactPowerExpected,null);
 assert.equal(new Set(analysis.coverage.consumedCardIds).size,16);
});
