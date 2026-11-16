// Presentation-only feedback on the newly rendered physical card, never on a popup clone.
const pending=new WeakMap();
export function flashFormChange(root,id){
 const card=[...root.querySelectorAll('.combat-sentence .word-card')].find(n=>n.dataset.cardId===id);
 if(!card)return;
 clearTimeout(pending.get(root)?.timer);pending.get(root)?.card.classList.remove('form-changed');
 card.classList.add('form-changed');
 const timer=setTimeout(()=>{card.classList.remove('form-changed');pending.delete(root);},240);
 pending.set(root,{card,timer});
}
export function clearFormFeedback(root){const p=pending.get(root);if(p){clearTimeout(p.timer);p.card.classList.remove('form-changed');pending.delete(root);}}
