import test from 'node:test';
import assert from 'node:assert/strict';
import {playAttack} from '../src/engine/presentation.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {resolveAttack} from '../src/engine/stage.js';
import {STAGE2} from '../src/data/stages.js';

function harborAttack(){
  const sentenceSnapshot=snapshotFromText('I give my friend a good book');
  return resolveAttack({attackId:'v02.presentation',stage:STAGE2,sentenceSnapshot,analysis:analyzeSentence(sentenceSnapshot),
    cards:sentenceSnapshot.orderedTokens.map(token=>({instanceId:token.cardInstanceId,cardDefId:token.cardDefId,baseScore:10,polishLevel:0})),equippedRunes:[],
    enemy:{id:'v02.boss',stageId:'stage.02',kind:'REGIONAL_BOSS',hp:640,maxHp:640,bossMechanic:{id:'SVOO_VEIL',active:true,multiplier:{num:1,den:4}}}});
}

test('0.2 presentation: IO and DO whole NP ranges arrive only with the main-frame event',async()=>{
  const resolution=harborAttack(),calls=[];
  await playAttack(resolution,{highlight(ids,roles,nodes){calls.push({ids,roles,nodes});}}, {wait:()=>Promise.resolve()});
  const ranges=calls.filter(call=>call.nodes?.length);
  assert.equal(ranges.length,1);
  const io=ranges[0].nodes.find(node=>node.grammaticalRole==='INDIRECT_OBJECT'),direct=ranges[0].nodes.find(node=>node.grammaticalRole==='DIRECT_OBJECT');
  assert.equal(io.cardIds.length,2);assert.equal(direct.cardIds.length,3);
  assert.equal(ranges[0].roles.find(role=>role.role==='INDIRECT_OBJECT').cardInstanceId,io.headCardId);
  assert.equal(ranges[0].roles.find(role=>role.role==='DIRECT_OBJECT').cardInstanceId,direct.headCardId);
});

test('0.2 presentation: veil release event precedes impact but committed HP is shown only at impact',async()=>{
  const resolution=harborAttack(),before=structuredClone(resolution),events=[];
  let hp=640,veil=true;
  await playAttack(resolution,{
    begin(value){assert.equal(value.bossStateBefore.active,true);assert.equal(value.bossStateAfter.active,false);},
    onScore(event){assert.equal(hp,640);if(event.sourceId==='boss.svooVeil.release'){assert.equal(veil,true);veil=event.bossStateAfter.active;events.push('release');}},
    lunge(){assert.equal(veil,false);assert.equal(hp,640);events.push('lunge');},
    impact(value){assert.equal(veil,false);hp=value.hpAfter;events.push('impact');},
    finish(value){assert.equal(hp,value.enemyHpAfter);}
  },{wait:()=>Promise.resolve()});
  assert.deepEqual(events,['release','lunge','impact']);assert.deepEqual(resolution,before);
});

test('0.2 presentation: interrupted boss attack converges once without replaying release or damage',async()=>{
  const resolution=harborAttack(),abort=new AbortController();abort.abort();let impacts=0,finished=0;
  const result=await playAttack(resolution,{impact(){impacts++;},finish(value){finished++;assert.equal(value.bossStateAfter.active,false);}}, {signal:abort.signal});
  assert.equal(result.status,'FAST_FORWARDED');assert.equal(impacts,1);assert.equal(finished,1);
});
