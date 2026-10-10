import fs from 'node:fs';import {createHash} from 'node:crypto';
import {RunController} from './legacy-07-controller.js';
import {newProfile} from '../../src/services/localStore.js';
import {registryForVersion} from '../../src/data/language/index.js';
import {runesForVersion} from '../../src/data/runes.js';
import {createRewardOffer} from '../../src/game/rewards.js';
import {grantStage2Entry,createShop} from '../../src/game/shop.js';
import {getEncounter,stageForRun} from '../../src/data/stages.js';
import {snapshotFromText,analyzeSentence} from '../../src/engine/grammar/index.js';
import {resolveAttack} from '../../src/engine/stage.js';
export function captureLegacy07(){
const language=registryForVersion('0.7.0'),report={source:'ca1675dbb9e546bf2b9442dba8cfc1077c7e12dd',registryHash:createHash('sha256').update(JSON.stringify(language)).digest('hex'),runes:runesForVersion('0.7.0'),states:[],rewards:[],shops:[],attacks:[]};
for(let i=0;i<8;i++){const profile={...newProfile('legacy'),guidedTutorialCompletedVersion:'0.2.1'},c=new RunController({profile});c.dispatch({type:'NEW_RUN',config:{seed:'ember.legacy.'+i}});const s=c.getState();s.runId='legacy.fixture';report.states.push(structuredClone(s));
 for(const stageId of ['stage.01','stage.02','stage.03','stage.04','stage.05','stage.06','stage.07']){const r=structuredClone(s);r.progress={stageId,roundIndex:0,battleNumber:{'stage.01':1,'stage.02':4,'stage.03':8,'stage.04':13,'stage.05':18,'stage.06':23,'stage.07':28}[stageId],contentBoundary:null};r.combat={enemyState:getEncounter(stageId,0,'0.7.0')};const before=structuredClone(r),expected=createRewardOffer(r,profile);report.rewards.push({before,profile,expected,after:r});}
 s.progress={stageId:'stage.02',roundIndex:0,battleNumber:4,contentBoundary:null};const before=structuredClone(s);grantStage2Entry(s);s.shop=createShop(s);report.shops.push({before,after:s});
}
for(const text of ['I run.','I am happy.','I need books.','She gives me a book.','I will have read books.','A room was too hard to show.','I am often giving her a book.','I keep you happy.','She runs faster than him.']){const sentenceSnapshot=snapshotFromText(text,{registry:language}),analysis=analyzeSentence(sentenceSnapshot,language),input={sentenceSnapshot,analysis,cards:sentenceSnapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,cardDefId:t.cardDefId})),enemy:getEncounter('stage.06',4,'0.7.0'),stage:stageForRun({version:'0.7.0',progress:{stageId:'stage.06'}}),policyVersion:'0.7.0'};report.attacks.push({input,expected:resolveAttack(input)});}
return {source:report.source,registryHash:report.registryHash,runesHash:hash(report.runes),states:report.states.map(hash),rewards:report.rewards.map(x=>hash({expected:x.expected,after:x.after})),shops:report.shops.map(x=>hash(x.after)),attacks:report.attacks.map(x=>hash(x.expected))};
}
export const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
