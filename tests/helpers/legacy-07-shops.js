import {RunController} from './legacy-07-controller.js';
import {newProfile,validateRunState} from '../../src/services/localStore.js';
import {registryForVersion} from '../../src/data/language/index.js';
import {grantStage2Entry,createShop,closeShop} from '../../src/game/shop.js';
import {grantStage3Entry} from '../../src/game/timeCanyon.js';import {grantStage4Entry,getStage4EntryChoice} from '../../src/game/skyIslands.js';import {grantStage5Entry} from '../../src/game/wishDesert.js';import {grantStage6Entry} from '../../src/game/mirrorSnowfield.js';
import {createHash} from 'node:crypto';
export function legacyShops(){const out=[];for(let i=0;i<8;i++){const c=new RunController({profile:{...newProfile('legacy shops'),guidedTutorialCompletedVersion:'0.2.1'}});c.dispatch({type:'NEW_RUN',config:{seed:'waterways.legacy.shop.'+i}});const s=c.getState();s.runId='legacy.shop.fixture';s.economy.gold=100;
 for(const [stage,battle]of [[2,4],[3,8],[4,13],[5,18],[6,23]]){s.progress={stageId:'stage.0'+stage,roundIndex:0,battleNumber:battle,contentBoundary:null};s.status='STAGE_INTRO';if(stage===2)grantStage2Entry(s);if(stage===3)grantStage3Entry(s);if(stage===4){const choice=getStage4EntryChoice(s);grantStage4Entry(s,{connectorCardDefId:choice?'card.and':null});if(choice)s.entryChoice={...choice,pending:false,selectedCardDefId:'card.and'};}if(stage===5)grantStage5Entry(s);if(stage===6)grantStage6Entry(s);if([2,4,6].includes(stage)){createShop(s);s.status='SHOP';out.push({stage,seed:i,hash:createHash('sha256').update(JSON.stringify(s)).digest('hex')});closeShop(s,s.shop.shopId);}}
 }return out;}
