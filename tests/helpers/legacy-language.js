// Historical regression suites exercise the shared engines against the explicit
// 0.2.2 contract. Their expected arithmetic/unsupported forms remain unchanged.
import * as language from '../../src/data/language/index.js';
import * as grammar from '../../src/engine/grammar/index.js';
export const registry=language.registryForVersion('0.2.2');
export const legacyRegistry=language.legacyRegistry;
export const registryForVersion=language.registryForVersion;
export const analyzeSentence=(snapshot,data=registry)=>grammar.analyzeSentence(snapshot,data);
export const snapshotFromText=(text,options={})=>grammar.snapshotFromText(text,{registry,...options});
export const formsForCard=(card,options={})=>language.formsForCard(card,{registry,...options});
export const makeToken=(id,def,form,position=0)=>language.makeToken(id,def,form,position,registry);
export const createSentenceSnapshot=(slots,cards,options={})=>language.createSentenceSnapshot(slots,cards,{languageVersion:'0.2.2',...options});
export const lexemeForCard=card=>language.lexemeForCard(card,registry);
