import {operationSpec} from '../data/operationSpec.js';
import {cardDefinition,cardKind} from '../data/cardCatalog.js';
import { registryForVersion, formsForCard, lexemeForCard } from '../data/language/index.js';
import {describeRune} from '../engine/runes.js';
export function cardModel(instance, selection = null, version='0.3.0') {
  const registry=registryForVersion(version);
  const card = cardDefinition(instance,version);
  if(card.cardKind==='OBSTACLE')return {id:instance.instanceId,cardKind:'OBSTACLE',surface:card.nameKo,definition:card,temporary:instance.temporary,forms:[],polish:0,version};
  if(cardKind(instance,version)==='OPERATION'){
    const lifetime=instance.temporary?'BATTLE':'PERMANENT',polish=instance.polishLevel??0,spec=operationSpec(card.id,polish,lifetime,version);
    return {id:instance.instanceId,cardKind:'OPERATION',surface:instance.temporary?'빙정 탐색':card.nameKo,descriptionKo:card.descriptionKo,rarity:card.rarity,definition:card,polish,forms:[],temporary:instance.temporary,lifetime,version,operation:spec};
  }
  const lexeme = lexemeForCard(instance,registry);
  const forms = formsForCard(instance,{registry});
  const selectedId = selection?.formId || selection?.selectionId || selection;
  const form = registry.formById[selectedId] || forms.find(f => f.id === lexeme.defaultFormId) || forms[0];
  return { id: instance.instanceId, cardKind:'WORD', temporary:instance.temporary, lexemeId: lexeme.id, surface: form?.surface || lexeme.lemma, pos: lexeme.pos, baseScore: card.baseScore, polish: instance.polishLevel || 0, rarity: card.rarity, glossKo: lexeme.glossKo, formId: form?.id, forms, lexeme, definition: card };
}
export function runeDescription(rune, level = 1, version='0.3.0') {
  return describeRune(rune.id,level,version);
}

/** Display wording is derived from the same versioned effect as execution. */
export function operationText(model){
  const spec=model.operation;
  const count=spec.requestedCount;
  const effects={SUPPLY:`${count}장 뽑기`,SEARCH:`단어 ${count}장 선택`,NOUN_SEARCH:`명사·대명사 최대 ${count}장`,VERB_SEARCH:`동사 최대 ${count}장`,ADJECTIVE_SEARCH:`형용사 최대 ${count}장`,CONNECTOR_SEARCH:`연결어 최대 ${count}장`,RECYCLE:`버린 카드 무작위 ${count}장`};
  const effect=effects[spec.type];
  if(!effect)throw new Error('Unknown operation display type: '+spec.type);
  return {effect,limit:model.temporary?'이번 전투 한정':spec.afterUseDestination==='DISCARD'?'사용 후 버린 더미 · 다시 뽑아 재사용':'전투당 1회',polish:spec.polishMax?`연마 최대 +${spec.polishMax}`:'연마 불가'};
}
export function operationPolishPreview(model){
  const before=operationText(model),next={...model,polish:model.polish+1,operation:operationSpec(model.definition.id,model.polish+1,model.lifetime,model.version)};
  const after=operationText(next);
  return before.effect===after.effect?`${before.effect} · ${before.limit} → ${after.limit}`:`${before.effect} → ${after.effect} · ${after.limit}`;
}
