import { registry, formsForCard, lexemeForCard } from '../data/language/index.js';
export function cardModel(instance, selection = null) {
  const card = registry.cardById[instance.cardDefId];
  const lexeme = lexemeForCard(instance);
  const forms = formsForCard(instance);
  const selectedId = selection?.formId || selection?.selectionId || selection;
  const form = registry.formById[selectedId] || forms.find(f => f.id === lexeme.defaultFormId) || forms[0];
  return { id: instance.instanceId, lexemeId: lexeme.id, surface: form?.surface || lexeme.lemma, pos: lexeme.pos, baseScore: card.baseScore, polish: instance.polishLevel || 0, rarity: card.rarity, glossKo: lexeme.glossKo, formId: form?.id, forms, lexeme, definition: card };
}
export function runeDescription(rune, level = 1) {
  const value = rune.levelValues[level-1];
  const amount = typeof value === 'object' ? `×${Number((value.num/value.den).toFixed(2))}` : `+${value}`;
  return `${rune.displayEffectSummaryKo || rune.conditionDescriptionKo} ${amount}`;
}
