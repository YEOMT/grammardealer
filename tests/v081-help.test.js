import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {registryForVersion,formsForCard} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {scoreAttack} from '../src/engine/scoring.js';
import {generateStarterDeck,findPlayableSentences} from '../src/game/deck.js';
import {RunController} from '../src/game/runController.js';
import {newProfile,validateRunState} from '../src/services/localStore.js';
import {createRewardOffer,eligibleRewardCards,resolveReward} from '../src/game/rewards.js';
import {createShop} from '../src/game/shop.js';
import {assignedWaterways,assignPiles,checked} from './helpers/waterways-state.js';
import {battleLearningGuide} from '../src/data/battleLearningGuide.js';
import {STAGE_BY_ID} from '../src/data/stages.js';
import {operationTargetIds} from '../src/game/operationResolution.js';
import {operationSpec} from '../src/data/operationSpec.js';
const registry=registryForVersion('0.8.1');
const analysis=text=>analyzeSentence(snapshotFromText(text,{registry}),registry);
for(const [text,status,pos]of [['I help you.','VALID','VERB'],['I need more help.','VALID','NOUN'],['I need help.','VALID','NOUN'],['I need a help.','VALID_WITH_ISSUES','NOUN'],['I need more helps.','INVALID_CORE',null],['I need more helped.','INVALID_CORE',null],['Helping you is good.','VALID','VERB'],['I am helping you.','VALID','VERB'],['I have helped you.','VALID','VERB']])test('0.8.1 help structural usage: '+text,()=>{
 const a=analysis(text);assert.equal(a.status,status);const roles=a.resolvedTokenRoles.filter(r=>r.selectedPos);if(pos)assert.ok(roles.some(r=>r.selectedPos===pos));
 assert.equal(a.grammarHits.some(h=>h.tag.startsWith('COMPARISON.')),false);
 if(text.includes('a help'))assert.ok(a.issues.some(i=>i.code==='ARTICLE_COUNTABILITY_MISMATCH'));
 if(pos){const snap=snapshotFromText(text,{registry}),cards=snap.orderedTokens.map(t=>({instanceId:t.cardInstanceId,polishLevel:0}));const scored=scoreAttack(a,cards);assert.equal(scored.events.filter(e=>e.phase==='CARD_BASE').length,cards.length);}
});
test('0.8.1 only help has a secondary lexeme; physical definition and verb forms remain unique',()=>{
 assert.deepEqual(registry.cards.filter(c=>c.secondaryLexemeIds?.length).map(c=>c.id),['card.help']);assert.equal(registry.cardById['card.help'].rarity,'UNCOMMON');
 const card={cardDefId:'card.help'};assert.deepEqual(formsForCard(card,{registry}).map(f=>f.id),formsForCard(card,{registry:registryForVersion('0.7.0')}).map(f=>f.id));assert.ok(!formsForCard(card,{registry}).some(f=>f.lexemeId==='lex.help.noun'));
 const current=analysis('I help you.'),old=analyzeSentence(snapshotFromText('I help you.',{registry}),registry,{historicalReceipt:true});const cards=snapshotFromText('I help you.',{registry}).orderedTokens.map(t=>({instanceId:t.cardInstanceId,polishLevel:0}));assert.deepEqual(scoreAttack(current,cards),scoreAttack(old,cards));
});
for(const [text,role]of [['Help is good.','SUBJECT'],['This is help.','COMPLEMENT'],['I gave him help.','DIRECT_OBJECT'],['I work with help.','PP_OBJECT'],['The help I need is good.','SUBJECT']])test('0.8.1 noun help keeps the registered NP role in '+text,()=>{
 const a=analysis(text);assert.equal(a.status,'VALID');assert.ok(a.resolvedTokenRoles.some(r=>r.selectedPos==='NOUN'&&r.role===role));assert.equal(a.coverage.consumedCardIds.length,snapshotFromText(text,{registry}).orderedTokens.length);assert.ok(!a.grammarHits.some(h=>h.tag.startsWith('COMPARISON.')));
});
test('0.8.1 actual generator excludes help in 120 seeds across all four vocabulary modes and keeps 28 cards',()=>{
 for(const vocabularyMode of ['BEGINNER','STANDARD','ADVANCED','FREE'])for(let i=0;i<30;i++){const d=generateStarterDeck({seed:'help.exclude.'+i,vocabularyMode,version:'0.8.1'});assert.equal(d.activeCardIds.length,28);assert.ok(!d.activeCardIds.some(id=>d.cardInstances[id].cardDefId==='card.help'));assert.ok(d.activeCardIds.some(id=>d.cardInstances[id].cardDefId==='card.have'));}
});
test('0.8.1 four actual shop generators exclude help; normal uncommon battle reward selects one physical copy',()=>{
 const base=assignedWaterways().getState();assert.equal(eligibleRewardCards(base).filter(c=>c.id==='card.help').length,1);
 for(const stage of [2,4,6,8])for(let seed=0;seed<20;seed++){const s=structuredClone(base);s.runId+='.'+seed;s.shop=null;s.combat=null;s.progress.stageId='stage.0'+stage;createShop(s);assert.ok(!s.shop.inventory.some(c=>c.cardDefId==='card.help'));}
 let acquired;
 for(let seed=0;seed<400&&!acquired;seed++){
  const c=new RunController({profile:{...newProfile('help reward'),guidedTutorialCompletedVersion:'0.2.1',firstRuneIntroSeen:true}});checked(c,{type:'NEW_RUN',config:{seed:'help.reward.'+seed}});checked(c,{type:'START_BATTLE'});const opening=c.getState();const candidate=findPlayableSentences(opening.combat.handIds,opening.cardInstances,{registry,includeModifiers:true})[0];if(!candidate)continue;
  for(const slot of candidate.slots){checked(c,{type:'ADD_CARD',cardId:slot.cardInstanceId});checked(c,{type:'SET_FORM',cardId:slot.cardInstanceId,formId:slot.selection.formId??slot.selection});}const attack=checked(c,{type:'SUBMIT'});checked(c,{type:'FINISH_PRESENTATION',attackId:attack.resolution.attackId});const s=c.getState();if(s.status!=='REWARD')continue;const choice=s.reward.choices.find(x=>x.cardDefId==='card.help');
  if(choice){const count=s.activeCardIds.length;assert.equal(choice.rarity,'UNCOMMON');checked(c,{type:'CHOOSE_REWARD',offerId:s.reward.offerId,choiceId:choice.choiceId});assert.equal(c.getState().activeCardIds.length,count+1);acquired=c.getState();}
 }
 assert.ok(acquired,'A real generated uncommon reward must expose help');
 const id=acquired.activeCardIds.find(id=>acquired.cardInstances[id].cardDefId==='card.help');const c=assignedWaterways();const s=c.getState();s.activeCardIds.push(id);s.cardInstances[id]=acquired.cardInstances[id];
 const tokens=snapshotFromText('I need more help.',{registry}).orderedTokens;const ids=tokens.map((t,i)=>i===3?id:s.activeCardIds[i]);tokens.slice(0,3).forEach((t,i)=>s.cardInstances[ids[i]].cardDefId=t.cardDefId);c._state=s;assignPiles(c,{hand:ids});
 for(const [i,cardId]of ids.entries()){checked(c,{type:'ADD_CARD',cardId});checked(c,{type:'SET_FORM',cardId,formId:tokens[i].selectionId});}const r=checked(c,{type:'SUBMIT'});assert.equal(r.resolution.status,'VALID');assert.ok(r.resolution.actualHpLoss>0);assert.equal(r.resolution.analysis.resolvedTokenRoles.find(x=>x.cardInstanceId===id).selectedPos,'NOUN');checked(c,{type:'FINISH_PRESENTATION',attackId:r.resolution.attackId});assert.equal(validateRunState(c.getState(),registry),true);
});
test('0.8.1 old help copy, polish, offered goods, RNG and state restore exactly while noun usage is available',()=>{
 const {state,profile}=JSON.parse(fs.readFileSync(new URL('./fixtures/v081/legacy08-help-save.json',import.meta.url)));const c=new RunController({initialState:state,profile});assert.deepEqual(c.getState(),state);assert.equal(validateRunState(state,registry),true);const help=Object.values(state.cardInstances).filter(c=>c.cardDefId==='card.help');assert.ok(help.some(c=>c.polishLevel===3));assert.equal(analysis('I need more help.').status,'VALID');
});
test('0.8.1 out-of-combat operation search still uses the primary verb POS only',()=>{
 const c=assignedWaterways({ownedWords:['help']}),s=c.getState(),id=s.activeCardIds.find(id=>s.cardInstances[id].cardDefId==='card.help');s.combat.drawIds=[id];
 for(const [kind,expected]of [['nounSearch',[]],['verbSearch',[id]],['search',[id]]])assert.deepEqual(operationTargetIds(s.combat,s.cardInstances,s.version,operationSpec('card.operation.'+kind,0,'PERMANENT',s.version)),expected);
});
test('0.8.1 all 37 fixed curriculum entries derive regional multipliers from the actual stage',()=>{
 let count=0;for(const stage of Object.values(STAGE_BY_ID).filter(s=>!['stage.09','stage.10'].includes(s.id)))for(let roundIndex=0;roundIndex<stage.rounds.length;roundIndex++){const guide=battleLearningGuide({version:'0.8.1',progress:{stageId:stage.id,roundIndex}});assert.ok(guide.title&&guide.pattern&&guide.description);assert.ok(guide.bonus.endsWith('×'+stage.regionMultiplier.num/stage.regionMultiplier.den));assert.ok(!guide.title.includes('to구'));count++;}assert.equal(count,37);
 for(const text of ['I have a book to read.','I went to the park to read.'])assert.equal(analysis(text).status,'VALID');
});
