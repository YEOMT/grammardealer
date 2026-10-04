import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {registry} from '../src/data/language/index.js';

export function validateLanguageData(data=registry) {
 const groups=['lexemes','forms','morphologies','senses','frames','cards'];let checks=0;
 const check=(condition,message)=>{assert.ok(condition,message);checks++;};
 for(const group of groups){const ids=data[group].map(x=>x.id);check(new Set(ids).size===ids.length,`${group}: duplicate ID`);check(ids.every(id=>typeof id==='string'&&id.length>0),`${group}: invalid ID`);}
 for(const lex of data.lexemes) {
  check(Boolean(lex.glossKo),`${lex.id}: Korean gloss`);check(data.morphologyById[lex.morphologyId]?.lexemeId===lex.id,`${lex.id}: morphology reference`);
  check(lex.senseIds.length>0&&lex.senseIds.every(id=>data.senseById[id]?.lexemeId===lex.id),`${lex.id}: senses`);
  check(lex.formIds.length>0&&lex.formIds.every(id=>data.formById[id]?.lexemeId===lex.id),`${lex.id}: forms`);
  check(lex.formIds.includes(lex.defaultFormId),`${lex.id}: default form`);
  check(lex.frameIds.every(id=>Boolean(data.frameById[id])),`${lex.id}: frame references`);
  if(lex.runtimeReady)check(lex.formIds.some(id=>data.formById[id].runtimeReady),`${lex.id}: no runtime form`);
 }
 for(const form of data.forms){check(/^\S+$/.test(form.surface),`${form.id}: one card = one word`);check(form.allowedRoleCandidates.length>0,`${form.id}: no roles`);check(form.requiredCapabilityIds.every(id=>data.capabilities.some(c=>c.id===id)),`${form.id}: capability reference`);}
 for(const sense of data.senses){check(sense.frameBindings.every(binding=>data.frameById[binding.frameId]),`${sense.id}: frame binding`);if(sense.runtimeReady)check(sense.requiredCapabilityIds.every(id=>data.capabilities.some(c=>c.id===id&&c.runtimeReady)),`${sense.id}: active unimplemented capability`);}
 for(const card of data.cards){check(Boolean(data.lexemeById[card.lexemeId]),`${card.id}: lexeme`);check(card.baseScore===10,`${card.id}: vocabulary score bias`);check(['COMMON','UNCOMMON','RARE'].includes(card.rarity),`${card.id}: rarity`);check(card.availability.runtimeReady===data.lexemeById[card.lexemeId].runtimeReady,`${card.id}: readiness mismatch`);if(!card.runtimeReady)check(!card.starterEligible&&card.rewardWeight===0,`${card.id}: inactive pool leakage`);}
 for(const rarity of ['COMMON','UNCOMMON','RARE'])check(data.cards.some(c=>c.rarity===rarity&&c.runtimeReady&&c.rewardWeight>0),`Empty ${rarity} reward pool`);
 return {status:'PASS',checks,lexemes:data.lexemes.length,runtimeLexemes:data.lexemes.filter(l=>l.runtimeReady).length,forms:data.forms.length,activeForms:data.forms.filter(f=>f.runtimeReady).length,frames:data.frames.length,rarityCounts:Object.fromEntries(['COMMON','UNCOMMON','RARE'].map(r=>[r,data.cards.filter(c=>c.runtimeReady&&c.rarity===r).length])),excluded:[{lexemeId:'lex.recently.adverb',reasonKo:'현재형 초급 대표 용법으로 부적합. 과거/완료 pack 검증 전 덱·보상에서 제외.'}]};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])console.log(JSON.stringify(validateLanguageData(),null,2));
