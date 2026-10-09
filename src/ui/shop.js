import {applyStageTheme} from './theme.js';
import {canPolish} from '../data/cardCatalog.js';
import {FROST_HINT} from '../data/stage6.js';
import {SKY_SHIELD_HINT} from '../data/stage4.js';
import {runeView,bindRuneDrag} from './runes.js';
import { el, button, modal, confirmDialog } from './dom.js';
import { wordCard } from './cards.js';
import { cardModel, operationPolishPreview, runeDescription as describeRuneForUI } from './models.js';
import { RUNE_BY_ID } from '../data/runes.js';
import { HARBOR_BOSS_HINT } from './progression.js';

// This set controls only an entrance animation; the controller owns the persisted grant.
const displayedGrants=new Set();
let commandSerial=0;

/** Render a frozen shop. Opening/cancelling dialogs never dispatches a transaction. */
export function renderShop(root,state,{command,onDeck,onDictionary,onRecords,onSaves,onLobby}={}){
  applyStageTheme(state);
  const runeDescription=(r,l)=>describeRuneForUI(r,l,state.version);
  const shop=state.shop,snow=shop.stageId==='stage.06',sky=shop.stageId==='stage.04',gold=state.economy.gold,grant=state.entryGrants?.[shop.stageId];
  let pending=false;
  const orderRunes=(from,to)=>{if(pending||document.querySelector('dialog[open]'))return;const ids=[...state.runes.orderedInstanceIds];ids.splice(to,0,...ids.splice(from,1));command({type:'REORDER_RUNES',instanceIds:ids,expectedRevision:state.revision});};
  const transaction=async(type,fields)=>{
    if(pending)return;
    pending=true;
    try{return await command({type,shopId:shop.shopId,expectedRevision:state.revision,commandId:`shop.ui.${state.runId}.${state.revision}.${++commandSerial}`,...fields});}
    finally{pending=false;}
  };
  async function buy(item,options={}){
    const result=await transaction('SHOP_BUY',{itemId:item.itemId,...options});
    if(result?.needsReplacement)replacement(item);
  }
  function replacement(item){
    let view;
    view=modal('교체할 룬을 선택하세요',[
      el('p',{text:'구매는 교체 대상을 확정한 뒤 한 번만 처리합니다. 취소하면 룬·재화·상품이 그대로 유지됩니다.'}),
      el('div',{class:'reward-choices'},state.runes.orderedInstanceIds.map(id=>{
        const rune=state.runes.instances[id],def=RUNE_BY_ID[rune.runeId];
        return el('section',{class:'reward-choice',style:`--rune-color:${def.color}`},el('h3',{text:`${def.nameKo} Lv.${rune.level}`}),
          el('p',{text:runeDescription(def,rune.level)}),button('이 룬과 교체',()=>buy(item,{replaceRuneInstanceId:id}),'primary',{'aria-label':`${def.nameKo}와 교체`}));
      })),button('교체 취소',()=>view.close(),'secondary',{id:'cancel-shop-replacement'})],{wide:true});
  }
  async function service(kind,id,options={}){
    const result=await transaction('SHOP_SERVICE',{serviceKind:kind,targetCardInstanceId:id,...options});
    if(result?.needsConfirmation){
      let view;
      view=modal('카드 제거 확인',[el('p',{text:result.message}),
        button('취소',()=>{view.close();targets(kind);},'secondary'),
        button('확인하고 제거',()=>service(kind,id,{confirmRemoval:true}),'primary')]);
    }
  }
  function targets(kind){
    const polish=kind==='POLISH',ids=state.activeCardIds.filter(id=>!polish||canPolish(state.cardInstances[id],state.version));
    let view;
    view=modal(polish?'상점 · 연마할 카드 한 장 선택':'상점 · 제거할 카드 한 장 선택',[
      el('p',{text:polish?(['0.6.1','0.7.0'].includes(state.version)?'8 재화 · 단어 최대 +3, 영구 운영 최대 +1. 이 상점에서 한 번 사용할 수 있습니다.':'8 재화 · 한 카드 +1, 최대 +3. 이 상점에서 한 번 사용할 수 있습니다.'):'선택한 실제 카드 한 장을 제거합니다. 확정 전에는 재화와 서비스 횟수를 사용하지 않습니다.'}),
      el('div',{class:'reward-target-grid'},ids.map(id=>{
        const model=cardModel(state.cardInstances[id],null,state.version);
        return el('section',{class:'reward-target',dataset:{targetId:id}},wordCard(model,{readonly:true,compact:true}),polish&&model.cardKind==='OPERATION'&&el('p',{class:'operation-polish-preview',text:operationPolishPreview(model)}),
          button(polish?`+${model.polish} → +${model.polish+1}`:'이 카드 제거',()=>service(kind,id),'primary'));
      })),!ids.length&&el('p',{text:'현재 선택할 수 있는 카드가 없습니다.'}),
      button('대상 선택 취소 · 상점으로',()=>view.close(),'secondary',{id:'cancel-shop-target'})],{wide:true});
  }
  const inventory=shop.inventory.map(item=>{
    let detail;
    if(item.kind==='RUNE'){
      const def=RUNE_BY_ID[item.runeId],owned=state.runes.orderedInstanceIds.map(id=>state.runes.instances[id]).find(r=>r.runeId===item.runeId);
      const level=owned?.level??0,nextLevel=Math.min(3,level+1);
      detail=[el('div',{class:'reward-gem',text:'◆',style:`color:${def.color}`}),el('h2',{text:def.nameKo}),
        el('strong',{text:item.purchased?`구매한 룬 · Lv.${item.offeredLevel}`:level?`Lv.${level} → Lv.${nextLevel}`:'새 룬 · Lv.1'}),
        !item.purchased&&level>0&&el('small',{text:`현재: ${runeDescription(def,level)}`}),el('p',{text:`${item.purchased?'구매 효과':'획득 후'}: ${runeDescription(def,item.purchased?item.offeredLevel:nextLevel)}`})];
    }else{
      const model=cardModel({instanceId:`shop.preview.${item.itemId}`,cardDefId:item.cardDefId,polishLevel:0},null,state.version);
      detail=[wordCard(model,{readonly:true}),el('p',{text:item.role==='LOCAL_SYNTAX_RELEVANT'?(snow?'비교·정도에 사용할 단어 카드 한 장':sky?'절 연결에 사용할 단어 카드 한 장':'항구 문장에 사용할 단어 카드 한 장'):(model.cardKind==='OPERATION'?'손패에서 사용하는 운영 카드':'현재 지원하는 단어 카드 한 장')}),el('small',{text:model.descriptionKo??model.glossKo})];
    }
    return el('article',{class:'shop-item panel',dataset:{itemId:item.itemId,itemKind:item.kind,purchased:String(item.purchased)}},...detail,
      el('strong',{class:'shop-price',text:item.purchased?'구매 완료':`${item.price} 재화`}),
      button(item.purchased?'구매 완료':gold<item.price?'재화 부족':'구매',()=>buy(item),'primary',{disabled:item.purchased||gold<item.price,'aria-label':`${item.kind==='RUNE'?RUNE_BY_ID[item.runeId].nameKo:cardModel({instanceId:'preview',cardDefId:item.cardDefId},null,state.version).surface} 구매`}));
  });
  const services=Object.entries(shop.services).map(([kind,entry])=>el('article',{class:'shop-service panel',dataset:{serviceKind:kind}},
    el('div',{},el('h2',{text:kind==='POLISH'?'카드 연마':'카드 제거'}),el('p',{text:kind==='POLISH'?(['0.6.1','0.7.0'].includes(state.version)?'단어 최대 +3 · 영구 운영 최대 +1':'카드 한 장 +1 · 단계마다 +5점 · 최대 +3'):'실제 카드 한 장을 덱에서 제거'}),
      el('strong',{text:entry.used?'사용 완료 · 상점당 1회':`${entry.price} 재화 · 상점당 1회`})),
    button(entry.used?'사용 완료':gold<entry.price?'재화 부족':'대상 선택',()=>targets(kind),'secondary',{disabled:entry.used||gold<entry.price,'aria-label':`${kind==='POLISH'?'연마':'제거'} 대상 선택`})));
  const animateGrant=grant&&!displayedGrants.has(grant.entryGrantId);
  if(grant)displayedGrants.add(grant.entryGrantId);
  root.replaceChildren(el('header',{class:'topbar shop-topbar'},el('span',{class:'brand-small',text:'SYNTAX ATLAS'}),
    el('nav',{},button('내 덱',onDeck,'quiet'),button('단어 사전',onDictionary,'quiet'),button('도감',onRecords,'quiet'),button('저장',onSaves,'quiet'),button('로비',onLobby,'quiet'))),
    el('main',{class:'shop-page harbor-page'},
      el('header',{class:'shop-heading'},el('div',{},el('span',{class:'eyebrow',text:snow?'CHAPTER 06 · THIRD SHOP':sky?'CHAPTER 04 · SECOND SHOP':'CHAPTER 02 · FIRST SHOP'}),el('h1',{text:snow?'거울의 설원 · 세 번째 상점':sky?'이음의 하늘섬 · 두 번째 상점':'전달의 항구 · 첫 상점'})),
        el('div',{class:'shop-resources'},el('strong',{text:`${gold} 재화`,dataset:{shopGold:String(gold)}}),el('span',{text:`현재 덱 ${state.activeCardIds.length}장 · 룬 ${state.runes.orderedInstanceIds.length} / ${state.runes.slotLimit}`}))),
      el('details',{class:'shop-boss-hint'},el('summary',{text:snow?'거울뿔 사슴 · 빙결핵 5개':sky?'하늘길의 문지기 · 연결의 보호막':'항구 수문장 · 보호 장막 공략'}),el('p',{text:snow?FROST_HINT:sky?SKY_SHIELD_HINT:HARBOR_BOSS_HINT}),el('small',{text:snow?'일반 영구 카드는 결정을 깨지 않습니다. 특정 비교 문장 순서는 필요하지 않습니다.':sky?'단어·구 연결과 관계절은 연결의 보호막을 해제하지 않습니다.':'SVO+to/for는 3형식으로 장막을 해제하지 않습니다.'})),
      state.runes.orderedInstanceIds.length>0&&el('details',{class:'shop-equipped'},el('summary',{text:'현재 장착 룬 설명'}),
        el('div',{class:'shop-equipped-grid'},state.runes.orderedInstanceIds.map((id,index)=>runeView(state.runes.instances[id],{index,total:state.runes.orderedInstanceIds.length,version:state.version,onOrder:orderRunes})))),
      grant&&el('section',{class:`entry-grant ${animateGrant?'entry-grant-arriving':''}`,dataset:{entryGrantId:grant.entryGrantId}},
        el('div',{},el('strong',{text:snow?'전투 한정 빙정 공급 준비 완료':grant.cardInstanceIds.length?`입장 준비 완료 · ${grant.cardInstanceIds.length}장이 덱에 들어갔습니다`:'입장 준비 완료 · 필요한 동사와 연결 카드가 이미 있습니다'}),
          el('p',{text:snow?'빙정 WORD는 각 전투 시작에 임시 공급됩니다. 영구 덱은 늘어나지 않습니다.':'입장 지급은 이번 원정에서 한 번입니다. 상점을 나올 때 전체 덱을 섞습니다.'}),grant.warningKo&&el('p',{class:'entry-warning',text:grant.warningKo})),
        el('div',{class:'entry-grant-cards'},grant.cardInstanceIds.filter(id=>state.cardInstances[id]).map(id=>wordCard(cardModel(state.cardInstances[id],null,state.version),{readonly:true,compact:true})))),
      el('section',{class:'shop-inventory','aria-label':'고정된 상점 상품'},inventory),
      el('section',{class:'shop-services','aria-label':'상점 서비스'},services),
      el('footer',{class:'shop-footer'},el('p',{class:'helper',text:'상품은 다시 열어도 바뀌지 않습니다. 상점을 나가면 이번 방문은 끝납니다.'}),
        button('상점 나가기 · 첫 전투',()=>confirmDialog('상점을 나가시겠습니까?','이 방문은 끝나며 다시 돌아올 수 없습니다. 현재 덱을 섞고 '+(snow?'설원':sky?'하늘섬':'항구')+' 첫 전투를 시작합니다.','전투 시작',()=>transaction('LEAVE_SHOP',{})),'primary',{id:'leave-shop'}))));
  return bindRuneDrag(root.querySelector('.shop-equipped-grid')??root,orderRunes,{enabled:()=>!pending});
}
