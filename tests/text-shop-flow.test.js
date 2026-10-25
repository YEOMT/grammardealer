import test from 'node:test';
import assert from 'node:assert/strict';
import {RunController} from '../src/game/runController.js';
import {SHOP_FLOW_POLICY,isPreparedShopIntro} from '../src/game/shopFlow.js';
import {validateRunState,canSaveRun} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';
import {bossReward,checked,chooseEntry} from './helpers/shop-flow-state.js';
import {enemyDisplayName,stageDisplayName} from '../src/ui/displayText.js';
import {STAGE_BY_ID,getEncounter} from '../src/data/stages.js';
const validate=s=>assert.equal(validateRunState(s,registryForVersion(s.version)),true);
const restore=c=>{const s=c.getState();validate(s);assert.equal(canSaveRun(s),true);return new RunController({initialState:JSON.parse(JSON.stringify(s)),profile:c.getProfile()});};
for(const [stage,destination,battle]of [[1,'stage.02',4],[3,'stage.04',13],[5,'stage.06',23],[7,'stage.08',33],[9,'stage.10',43],[10,'stage.final',48]])test(`boss reward ${stage} -> shop -> introduction -> ${battle}; frozen goods/grants/RNG and reload`,()=>{
 const legacy=bossReward(stage),initial=legacy.getState(),current=structuredClone(initial);current.config.shopFlowPolicy=SHOP_FLOW_POLICY;
 let c=new RunController({initialState:current,profile:legacy.getProfile()});
 // This is a supplied victory boundary. Only subsequent transitions are under test.
 checked(legacy,{type:'SKIP_REWARD',offerId:initial.reward.offerId});assert.equal(legacy.getState().status,'STAGE_CLEAR');checked(legacy,{type:'NEXT_STAGE'});checked(legacy,{type:'ENTER_STAGE'});chooseEntry(legacy);
 checked(c,{type:'SKIP_REWARD',offerId:initial.reward.offerId});assert.equal(c.getState().progress.stageId,destination);
 if(c.getState().status==='STAGE_INTRO'){c=restore(c);chooseEntry(c);}
 assert.equal(c.getState().status,'SHOP');c=restore(c);
 const shop=c.getState(),old=legacy.getState();
 for(const key of ['shop','shopHistory','entryGrants','rng','activeCardIds','cardInstances','economy','eligibility'])assert.deepEqual(shop[key],old[key],key);
 const duplicate=c.dispatch({type:'SKIP_REWARD',offerId:initial.reward.offerId});assert.equal(duplicate.ok,false);assert.deepEqual(c.getState(),shop);
 checked(c,{type:'LEAVE_SHOP',shopId:shop.shop.shopId});assert.equal(isPreparedShopIntro(c.getState()),true);assert.equal(c.getState().combat,null);assert.deepEqual(c.getState().rng,shop.rng);c=restore(c);
 const intro=c.getState();assert.equal(c.dispatch({type:'LEAVE_SHOP',shopId:shop.shop.shopId}).ok,false);assert.deepEqual(c.getState(),intro);
 checked(c,{type:'ENTER_STAGE'});checked(legacy,{type:'LEAVE_SHOP',shopId:old.shop.shopId});validate(c.getState());
 assert.equal(c.getState().status,'BATTLE');assert.equal(c.getState().progress.battleNumber,battle);
 for(const key of ['combat','rng','shop','shopHistory','entryGrants','economy','activeCardIds','cardInstances'])assert.deepEqual(c.getState()[key],legacy.getState()[key],key);
 const started=c.getState();assert.equal(c.dispatch({type:'ENTER_STAGE'}).ok,false);assert.deepEqual(c.getState(),started);
});
test('ordinary non-shop boundaries retain stage clear and battle entry',()=>{
 for(const stage of [2,4,6,8]){const c=bossReward(stage),s=c.getState();s.config.shopFlowPolicy=SHOP_FLOW_POLICY;c._state=s;checked(c,{type:'SKIP_REWARD',offerId:s.reward.offerId});assert.equal(c.getState().status,'STAGE_CLEAR');checked(c,{type:'NEXT_STAGE'});checked(c,{type:'ENTER_STAGE'});assert.equal(c.getState().status,'BATTLE');}
});
test('display aliases change sixteen monsters plus final names, preserving encounters',()=>{
 const expected={2:'꽃 달팽이',4:'선원 갈매기',6:'항해사 상어',9:'질주 중인 토끼',16:'메아리 하피',18:'황금 낙타',22:'소원의 황금 석상',23:'얼음 족제비',24:'펭귄 형제',26:'콜라곰',30:'흑요석 박쥐',31:'용암 대장장이',33:'청동 항아리',36:'안개 수호령',37:'고대 수호대장',42:'꿈의 도서관장',48:'서피스 스트럭처',49:'딥 스트럭처',50:'유니버셜 그래머'};
 for(const stage of Object.values(STAGE_BY_ID))for(const [i,round]of stage.rounds.entries()){const enemy=getEncounter(stage.id,i,'0.11.0'),before=structuredClone(enemy);assert.equal(enemyDisplayName(enemy),expected[round.battleNumber]??round.nameKo);assert.deepEqual(enemy,before);}
 assert.equal(stageDisplayName(STAGE_BY_ID['stage.final']),'통사의 근원');
});
test('chosen victory reward and purchased item survive shop save/reload without duplication',()=>{
 const c=bossReward(1),s=c.getState();s.config.shopFlowPolicy=SHOP_FLOW_POLICY;c._state=s;
 const reward=s.reward.choices.find(x=>x.kind==='RUNE');assert.ok(reward);
 checked(c,{type:'CHOOSE_REWARD',offerId:s.reward.offerId,choiceId:reward.choiceId});
 assert.equal(c.getState().runes.orderedInstanceIds.length,1);
 const shop=c.getState(),item=shop.shop.inventory.find(x=>x.kind==='CARD'&&x.price<=shop.economy.gold);assert.ok(item);
 const cmd={type:'SHOP_BUY',shopId:shop.shop.shopId,itemId:item.itemId,expectedRevision:shop.revision,commandId:'qa.buy.once'};checked(c,cmd);
 const purchased=c.getState();assert.equal(purchased.economy.gold,shop.economy.gold-item.price);assert.equal(purchased.activeCardIds.length,shop.activeCardIds.length+1);
 const restored=restore(c);restored.dispatch(cmd);assert.deepEqual(restored.getState(),purchased);
 checked(restored,{type:'LEAVE_SHOP',shopId:shop.shop.shopId});const intro=restore(restored);checked(intro,{type:'ENTER_STAGE'});validate(intro.getState());
 assert.equal(intro.getState().runes.orderedInstanceIds.length,1);assert.equal(intro.getState().economy.gold,purchased.economy.gold);assert.deepEqual(intro.getState().shop.inventory,purchased.shop.inventory);
});
