import {hasWaterwaysCampaign,hasSnowCampaign,hasPolishCampaign} from '../data/campaignFeatures.js';
import {cardDefinition,maxPolish} from '../data/cardCatalog.js';
import {runeForVersion} from '../data/runes.js';
const integer=n=>Number.isSafeInteger(n)&&n>=0;
export function validateSkyShops(run){
 const fail=()=>{throw Error('0.4 상점 방문·상품·서비스 기록이 잘못되었습니다.');};
 if(!Array.isArray(run.shopHistory)||run.shopHistory.length>(hasWaterwaysCampaign(run)?3:hasSnowCampaign(run)?2:1))fail();
 const history=run.shopHistory,current=run.shop;
 if(!current){if(history.length||run.status==='SHOP'||run.progress.battleNumber>3&&!(run.progress.stageId==='stage.02'&&run.status==='STAGE_INTRO'))fail();return true;}
 if(hasSnowCampaign(run)){const index=['stage.02','stage.04','stage.06',...(hasWaterwaysCampaign(run)?['stage.08']:[])].indexOf(current.stageId);const expected=run.progress.battleNumber<13?0:run.progress.battleNumber<23?1:run.progress.battleNumber<33||!hasWaterwaysCampaign(run)?2:3;const entering=run.status==='STAGE_INTRO'&&run.progress.roundIndex===0&&['stage.04','stage.06',...(hasWaterwaysCampaign(run)?['stage.08']:[])].includes(run.progress.stageId);if(index!==(entering?expected-1:expected))fail();if(index<0||history.length!==index||history.some((s,i)=>s.stageId!==['stage.02','stage.04','stage.06'][i]||!s.closed)||run.progress.battleNumber>=23&&run.status!=='STAGE_INTRO'&&index!==expected)fail();}
 else if(current.stageId==='stage.04'&&!['stage.04',...(['0.5.0','0.5.1'].includes(run.version)?['stage.05']:[])].includes(run.progress.stageId)||['stage.04',...(['0.5.0','0.5.1'].includes(run.version)?['stage.05']:[])].includes(run.progress.stageId)&&run.status!=='STAGE_INTRO'&&current.stageId!=='stage.04')fail();
 const third=current.stageId==='stage.06';if(third&&!hasSnowCampaign(run))fail();
 const second=current.stageId==='stage.04';
 if(!hasSnowCampaign(run)&&(second?(history.length!==1||history[0].stageId!=='stage.02'||!history[0].closed):history.length>0))fail();
 if((run.status==='SHOP')===current.closed)fail();
 let paid=0;
 for(const shop of [...history,current]){
  const two=['stage.04','stage.06','stage.08'].includes(shop.stageId),runes=two?2:1,cards=two?3:2;
  if(!['stage.02','stage.04',...(hasSnowCampaign(run)?['stage.06']:[]),...(hasWaterwaysCampaign(run)?['stage.08']:[])].includes(shop.stageId)||shop.shopId!==`shop.${run.runId}.${shop.stageId}`||shop.shopVersion!==(hasPolishCampaign(run)?'0.6.1':'0.4.0')||typeof shop.closed!=='boolean'||!run.entryGrants[shop.stageId]?.applied||shop.paidRemovalCountAtEntry!==paid)fail();
  if(!Array.isArray(shop.inventory)||shop.inventory.length!==runes+cards||new Set(shop.inventory.map(x=>x.itemId)).size!==shop.inventory.length)fail();
  let operationCount=0;const content=new Set();
  for(const [i,item]of shop.inventory.entries()){
   const kind=i<runes?'RUNE':'CARD',slot=i<runes?i:i-runes,def=kind==='CARD'?cardDefinition(item.cardDefId,run.version):runeForVersion(item.runeId,run.version),id=item.cardDefId??item.runeId;
   if(item.kind!==kind||item.itemId!==`${shop.shopId}.${kind.toLowerCase()}.${slot}`||!def?.runtimeReady||def.rarity!==item.rarity||typeof item.purchased!=='boolean'||content.has(id))fail();content.add(id);
   if(!run.contentManifest[kind==='CARD'?'cardDefIds':'runeIds'].includes(id))fail();
   if(item.price!==(kind==='CARD'?{COMMON:6,UNCOMMON:10,RARE:14}:{COMMON:18,UNCOMMON:24,RARE:32})[item.rarity])fail();
   if(kind==='RUNE'){if(id==='rune.svoo'&&![...run.eligibility.runOwnUnlocks,...run.eligibility.runStartUnlockBaseline].includes(id))fail();if(!integer(item.ownedLevel)||item.ownedLevel>2||item.offeredLevel!==item.ownedLevel+1)fail();}
   else if(slot===0&&(item.role!=='LOCAL_SYNTAX_RELEVANT'||def.cardKind==='OPERATION'))fail();
   if(hasPolishCampaign(run)&&kind==='CARD'&&((slot===cards-1)!==(def.cardKind==='OPERATION')||slot===cards-1&&item.role!=='DEDICATED_OPERATION'))fail();
   if(def.cardKind==='OPERATION')operationCount++;
  }
  if(hasPolishCampaign(run)?operationCount!==1:operationCount>1)fail();
  const polish=shop.services?.POLISH,remove=shop.services?.REMOVE;
  if(!polish||!remove||typeof polish.used!=='boolean'||typeof remove.used!=='boolean'||polish.price!==8||remove.price!==6+2*paid)fail();
  if(polish.used){
   if(!polish.targetCardInstanceId)fail();
   if(hasPolishCampaign(run)){
    const def=cardDefinition(polish.cardDefId,run.version);
    if(!def||!run.contentManifest.cardDefIds.includes(def.id)||!integer(polish.beforeLevel)||polish.afterLevel!==polish.beforeLevel+1||polish.afterLevel>maxPolish({cardDefId:def.id},run.version))fail();
    const live=run.cardInstances[polish.targetCardInstanceId];if(live&&(live.cardDefId!==def.id||live.polishLevel<polish.afterLevel))fail();
   }else if(cardDefinition(run.cardInstances[polish.targetCardInstanceId],run.version)?.cardKind==='OPERATION')fail();
  }
  if(remove.used){if(!remove.targetCardInstanceId)fail();paid++;}
 }
 if(run.economy.paidRemovalCount!==paid)fail();
 return true;
}
