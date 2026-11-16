import test from 'node:test';
import assert from 'node:assert/strict';
import {roundsForRun} from '../src/data/stages.js';
import {battleLearningGuide,preparationGuide} from '../src/data/battleLearningGuide.js';
import {regionBonusSummary} from '../src/ui/targetGrammar.js';
import {enemyDisplayName,enemyEnglishName} from '../src/ui/displayText.js';
test('display names cover every current and legacy encounter without changing Korean aliases',()=>{
 for(const version of ['0.14.0','0.12.1'])for(const stageId of [...Array.from({length:10},(_,i)=>'stage.'+String(i+1).padStart(2,'0')),'stage.final'])for(const enemy of roundsForRun({version,progress:{stageId}})){
  const before=JSON.stringify(enemy);assert.match(enemyEnglishName(enemy),/^[A-Za-z]/);assert.ok(enemyDisplayName(enemy));assert.equal(JSON.stringify(enemy),before);
 }
 assert.equal(enemyEnglishName({battleNumber:43,nameKo:'갈림길의 광대'}),'Crossroads Jester');assert.equal(enemyEnglishName({battleNumber:43,nameKo:'춤추는 광대'}),'Dancing Jester');
});
test('preparation meanings are interpretation templates, while target summary retains full bonus help',()=>{
 const run=(stageId,roundIndex)=>({version:'0.14.0',progress:{stageId,roundIndex}});
 const grass=preparationGuide(run('stage.01',2));assert.equal(grass.targetLabel,'1·2·3형식');assert.equal(grass.meaningKo,null);
 assert.equal(preparationGuide(run('stage.02',0)).meaningKo,'~에게 ~를 주다.');
 const expected=['현재분사 분사구문','과거분사 분사구문','가정법 과거','가정법 과거완료','분사구문·가정법'];
 for(let i=0;i<5;i++){const g=battleLearningGuide(run('stage.10',i));assert.equal(regionBonusSummary(g),expected[i]+' ×1.25');assert.match(g.bonusHelp.join(' '),/조건절·가정법·과거완료/);}
 assert.equal(regionBonusSummary(battleLearningGuide(run('stage.final',2))),'없음');
});
