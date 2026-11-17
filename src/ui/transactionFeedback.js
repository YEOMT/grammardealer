import {el} from './dom.js';
import {cardModel,polishPreview} from './models.js';

/** Called only for a successful, newly committed command. Nothing is persisted or replayed. */
export function showTransactionFeedback(root,before,after,result,command){
 if(!result.ok)return;
 const flash=node=>{if(!node)return;node.classList.add('purchase-feedback');setTimeout(()=>node.classList.remove('purchase-feedback'),700);};
 const spent=before.economy.gold-after.economy.gold;
 if(spent>0){const gold=root.querySelector('[data-shop-gold]');if(gold){const delta=el('small',{class:'gold-change',role:'status',text:`${before.economy.gold} → ${after.economy.gold} 골드 (−${spent})`});gold.style.visibility='hidden';gold.after(delta);flash(delta);setTimeout(()=>{delta.remove();gold.style.visibility='';},3200);}}
 if(command.type==='SHOP_BUY')flash([...root.querySelectorAll('[data-item-id]')].find(n=>n.dataset.itemId===command.itemId));
 if(result.rewardEffect?.kind==='POLISH'){
  const e=result.rewardEffect,model=cardModel({instanceId:e.cardInstanceId,cardDefId:e.cardDefId,polishLevel:e.beforeLevel},null,before.version);
  const note=el('div',{class:'polish-feedback purchase-feedback',role:'status',dataset:{polishedCardId:e.cardInstanceId},text:`${model.surface} · 연마 +${e.beforeLevel} → +${e.afterLevel} · ${polishPreview(model)}`});
  const host=root.querySelector('[data-service-kind="POLISH"]')??root.querySelector('main')??root;
  host.append(note);setTimeout(()=>note.remove(),4500);
  for(const n of root.querySelectorAll('[data-card-id]'))if(n.dataset.cardId===e.cardInstanceId)flash(n);
 }
}
