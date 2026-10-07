import {createHash} from 'node:crypto';
import {registryForVersion} from '../../src/data/language/index.js';
import {RunController} from '../../src/game/runController.js';
import {createRewardOffer} from '../../src/game/rewards.js';
import {createShop,grantStage2Entry} from '../../src/game/shop.js';
import {snapshotFromText,analyzeSentence} from '../../src/engine/grammar/index.js';
import {resolveAttack} from '../../src/engine/stage.js';
import {getEncounter,stageForRun} from '../../src/data/stages.js';
import {newProfile} from '../../src/services/localStore.js';
export const packs=['pack.svoo','pack.clauseLink','pack.time.past','pack.time.progressive','pack.time.perfect','pack.time.futureWill','pack.svoc.basic','pack.infinitive','pack.gerund'];
export function baseline05(){
 const language=registryForVersion('0.5.0'),hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
 const profile={...newProfile('baseline'),playerId:'baseline',version:'0.5.0',guidedTutorialCompletedVersion:'0.2.1',unlocks:packs};
 const decks=[],rewards=[],shops=[];
 for(const vocabularyMode of ['BEGINNER','STANDARD','ADVANCED','FREE'])for(const i of [0,1]){
  const c=new RunController({profile});c.dispatch({type:'NEW_RUN',config:{seed:`polish.baseline.${i}`,vocabularyMode}});
  const s=c.getState();s.runId='baseline';s.version='0.5.0';Object.assign(s.contentVersions,{game:'0.5.0',save:'0.5.0',presentation:'0.2.1'});
  c._state=s;c.dispatch({type:'START_BATTLE'});decks.push(c.getState());
  for(const stageId of ['stage.01','stage.02','stage.03','stage.04','stage.05']){
   const r=structuredClone(s);r.progress={stageId,roundIndex:0,battleNumber:({'stage.01':1,'stage.02':4,'stage.03':8,'stage.04':13,'stage.05':18})[stageId],contentBoundary:null};r.combat={enemyState:getEncounter(stageId,0,'0.5.0')};
   rewards.push({before:structuredClone(r),profile,expected:createRewardOffer(r,profile),after:r});
  }
  const shop=structuredClone(s);shop.status='STAGE_INTRO';shop.combat=null;shop.progress={stageId:'stage.02',roundIndex:0,battleNumber:4,contentBoundary:null};const before=structuredClone(shop);grantStage2Entry(shop);shop.shop=createShop(shop);shops.push({before,after:shop});
 }
 const attacks=['I run','I be happy','Reading books','I enjoy reading books','I want you to read a book','I wanted to enjoy reading books because she works','I read a book when she comes home','She had played games','She will be reading books','I read books and she plays games','I want you to read a good book'].map((text,i)=>{
  const sentenceSnapshot=snapshotFromText(text,{registry:language}),analysis=analyzeSentence(sentenceSnapshot,language),stage=stageForRun({version:'0.5.0',progress:{stageId:i===6?'stage.04':'stage.05'}});
  const input={attackId:'golden.'+i,runId:'baseline',battleId:'assigned',expectedRevision:0,sentenceSnapshot,analysis,cards:sentenceSnapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,polishLevel:0})),equippedRunes:[],enemy:{id:'assigned',hp:10000,maxHp:10000,kind:'NORMAL'},stage,policyVersion:'0.5.0',comboEligibility:{version:'0.5.0',unlocks:packs}};
  return {text,input,expected:resolveAttack(input)};
 });
 return {source:'2c03b2492b21f2bca27f10718e35bc4e291861bb',registryHash:hash(language),decks,rewards,shops,attacks};
}
