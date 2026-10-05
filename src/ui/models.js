import { registryForVersion, formsForCard, lexemeForCard } from '../data/language/index.js';
import {describeRune} from '../engine/runes.js';
export function cardModel(instance, selection = null, version='0.3.0') {
  const registry=registryForVersion(version);
  const card = registry.cardById[instance.cardDefId];
  const lexeme = lexemeForCard(instance,registry);
  const forms = formsForCard(instance,{registry});
  const selectedId = selection?.formId || selection?.selectionId || selection;
  const form = registry.formById[selectedId] || forms.find(f => f.id === lexeme.defaultFormId) || forms[0];
  return { id: instance.instanceId, lexemeId: lexeme.id, surface: form?.surface || lexeme.lemma, pos: lexeme.pos, baseScore: card.baseScore, polish: instance.polishLevel || 0, rarity: card.rarity, glossKo: lexeme.glossKo, formId: form?.id, forms, lexeme, definition: card };
}
export function runeDescription(rune, level = 1, version='0.3.0') {
  return describeRune(rune.id,level,version);
}
