import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { RunController } from '../src/game/runController.js';
import { findPlayableSentences, VOCABULARY_MODES } from '../src/game/deck.js';
import { registry, registryForVersion, lexemeForCard } from '../src/data/language/index.js';
import { resolveAttack } from '../src/engine/stage.js';
import { assertRunInvariants } from '../src/game/invariants.js';
import {stageForRun} from '../src/data/stages.js';

const plainState = state => ({ battle: state.progress.battleNumber, turn: state.combat?.turnIndex, turnsRemaining: state.combat?.turnsRemaining,
  hp: state.combat?.enemyState.hp, hand: state.combat?.handIds.length, draw: state.combat?.drawIds.length, discard: state.combat?.discardIds.length,
  exchangesRemaining: state.combat?.exchangesRemaining, gold: state.economy.gold, status: state.status });

/** QA-only finite search. It reads present hand, never future draw order or openingTrace witnesses. */
export function rankPlayableCandidates(state,{policy='STANDARD'}={}) {
  const candidates = findPlayableSentences(state.combat.handIds, state.cardInstances, { perFrame: 4, maxChecks: state.version==='0.2.0'?1800:768, includeModifiers: true, includeSvoo:state.version==='0.2.0',registry:registryForVersion(state.version) });
  const scored = candidates.map(candidate => {
    const cards = candidate.slots.map(slot => {
      const instance = state.cardInstances[slot.cardInstanceId]; const definition = registry.cardById[instance.cardDefId];
      return { ...instance, baseScore: definition.baseScore, displayCategory: definition.displayCategory };
    });
    const resolution = resolveAttack({ analysis: candidate.analysis, cards, equippedRunes: state.runes.orderedInstanceIds.map(id => state.runes.instances[id]), enemy: state.combat.enemyState, sentenceSnapshot: candidate.snapshot,stage:stageForRun(state) });
    return { ...candidate, power: resolution.finalPower, lethal: resolution.killed };
  });
  return scored.filter(c=>policy!=='SV_ONLY'||c.frameId==='frame.sv').sort((a, b) => {
    if (a.lethal !== b.lethal) return a.lethal ? -1 : 1;
    if (a.lethal) return a.slots.length - b.slots.length || b.power - a.power;
    const preference=c=>policy==='LEARNING'&&state.progress.stageId==='stage.02'?(c.frameId==='frame.svoo'?1:0):policy==='SHORT'?(c.slots.length<=4?1:0):policy==='ADVERB'?(c.analysis.grammarHits.some(h=>h.tag==='MODIFIER.ADVERB')?1:0):0;
    if(preference(a)!==preference(b))return preference(b)-preference(a);
    return b.power / Math.sqrt(b.slots.length) - a.power / Math.sqrt(a.slots.length);
  });
}

export function exchangeSelection(state,{policy='STANDARD'}={}) {
  const rows = state.combat.handIds.map(id => ({ id, lexeme: lexemeForCard(state.cardInstances[id]) }));
  const keep = new Set();
  if(policy==='LEARNING'&&state.progress.stageId==='stage.02'){
    // Present visible pronouns/plural nouns can fill three distinct NPs; do not hoard
    // articles when the missing piece is a delivery verb. Never inspect draw order.
    const nounMaterial=[...rows.filter(row=>row.lexeme.pos==='PRONOUN'),...rows.filter(row=>row.lexeme.pos==='NOUN')].slice(0,3);
    const material=[...nounMaterial,rows.find(row=>row.lexeme.frameIds?.includes('frame.svoo'))].filter(Boolean);
    material.forEach(row=>keep.add(row.id));
    const excess=rows.filter(row=>!keep.has(row.id)).map(row=>row.id);
    return excess.length?excess.slice(0,4):rows.slice(-1).map(row=>row.id);
  }
  // Keep one plausible subject, verb, adjective/noun; discard lower-priority supporting material first.
  for (const pos of ['PRONOUN', 'VERB', 'NOUN', 'ADJECTIVE']) {
    const found = rows.find(row => row.lexeme.pos === pos);
    if (found) keep.add(found.id);
  }
  const candidates = rows.filter(row => !keep.has(row.id)).map(row => row.id);
  return candidates.length ? candidates.slice(0, 4) : rows.slice(-1).map(row => row.id);
}

/** Runs actual controller commands only. No generated damage, injected cards, or fixed winning hand. */
export function simulateRun({ seed, vocabularyMode = 'BEGINNER', exerciseResources = true, maxCommands = 900,policy='STANDARD',campaignVersion='0.2.0',stopAtShop=false } = {}) {
  let controller = new RunController();
  if(['POLISHED','SV_ONLY'].includes(policy))controller.setProfile({...controller.getProfile(),guideSeen:true,firstRuneIntroSeen:true});
  const actions = [];
  const rewards = [];
  const battles = [];
  const shops = [];
  let commands = 0;
  function command(input, detail = {}) {
    if (++commands > maxCommands) throw new Error('QA command budget exceeded');
    const before = controller.getState();
    if(input.type==='SUBMIT'&&before?.tutorial?.visible&&!before.tutorial.actions?.explained)controller.dispatch({type:'ACK_ATTACK_GUIDE'});
    const result = controller.dispatch(input);
    if (!result.ok) throw new Error(`${input.type}: ${result.message}`);
    const state = controller.getState(); assertRunInvariants(state, registry);
    if (!['ADD_CARD', 'SET_FORM'].includes(input.type)) actions.push({ action: input.type, ...(before ? { before: plainState(before) } : {}), after: plainState(state), ...detail });
    return result;
  }
  const started = performance.now();
  try {
    command({ type: 'NEW_RUN', config: { seed, vocabularyMode } });
    if(campaignVersion==='0.1.1'){
      // Explicit old-version regression fixture, never used for the new-campaign play report.
      const legacy=controller.getState();legacy.version='0.1.1';legacy.config.contentProfile='STAGE1_VERTICAL_SLICE';delete legacy.contentManifest;delete legacy.shop;delete legacy.entryGrants;delete legacy.milestoneIds;
      controller=new RunController({initialState:legacy,profile:controller.getProfile()});
    }
    command({ type: 'START_BATTLE' });
    let lastBattle = 0;
    let exercised = false;
    while (commands < maxCommands) {
      let state = controller.getState();
      if (['CONTENT_COMPLETE', 'DEFEAT'].includes(state.status)) break;
      if(state.status==='STAGE_CLEAR'){command({type:'NEXT_STAGE'});continue;}
      if(state.status==='STAGE_INTRO'){command({type:'ENTER_STAGE'});continue;}
      if(state.status==='SHOP'){
        const visit={gold:state.economy.gold,entryGrant:state.entryGrants['stage.02'],purchases:[]};shops.push(visit);
        if(stopAtShop)break;
        const desired=[...state.shop.inventory].sort((a,b)=>Number(b.runeId==='rune.svoo')-Number(a.runeId==='rune.svoo')||Number(b.kind==='RUNE')-Number(a.kind==='RUNE'));
        for(const item of desired){state=controller.getState();if(item.price>state.economy.gold)continue;
          if(item.kind==='RUNE'&&state.runes.orderedInstanceIds.length>=3&&!state.runes.orderedInstanceIds.some(id=>state.runes.instances[id].runeId===item.runeId))continue;
          command({type:'SHOP_BUY',shopId:state.shop.shopId,itemId:item.itemId});visit.purchases.push({id:item.runeId??item.cardDefId,price:item.price});
        }
        state=controller.getState();command({type:'LEAVE_SHOP',shopId:state.shop.shopId});continue;
      }
      if (state.status === 'BETWEEN_BATTLES') { command({ type: 'NEXT_BATTLE' }); continue; }
      if (state.status === 'REWARD') {
        const offer = state.reward;
        const available = offer.choices.filter(choice => !choice.disabled);
        const preferred=policy==='POLISHED'?available.find(c=>c.serviceKind==='POLISH')||available.find(c=>c.runeId==='rune.polished'):policy==='SHORT'||policy==='SV_ONLY'?available.find(c=>c.runeId==='rune.short'||c.runeId==='rune.sv'):policy==='ADVERB'?available.find(c=>c.runeId==='rune.adverbs'):null;
        const learningChoice=policy==='LEARNING'?available.find(c=>c.runeId==='rune.svoo')||available.find(c=>c.cardDefId&&registry.lexemeById[registry.cardById[c.cardDefId].lexemeId].frameIds.includes('frame.svoo')):null;
        const choice = learningChoice||preferred||available.find(c => c.runeId === 'rune.perfectSentence') || available.find(c=>c.kind!=='SERVICE'||c.serviceKind!=='REMOVE')||available[0];
        rewards.push({ battle: state.progress.battleNumber, type: offer.type, choices: offer.choices.map(c => c.runeId || c.cardDefId || c.serviceKind || c.cardInstanceId), chosen: choice?.runeId || choice?.cardDefId || choice?.serviceKind || choice?.cardInstanceId || 'SKIP', firstRuneIntro: offer.firstRuneIntro });
        if (choice) command({ type: 'CHOOSE_REWARD', offerId: offer.offerId, choiceId: choice.choiceId, confirmRemoval: true, replaceRuneInstanceId:choice.kind==='RUNE'&&state.runes.orderedInstanceIds.length===3&&!state.runes.orderedInstanceIds.some(id=>state.runes.instances[id].runeId===choice.runeId)?state.runes.orderedInstanceIds.at(-1):undefined, targetCardInstanceId:choice.targetCardIds?.find(id=>registry.lexemeById[registry.cardById[state.cardInstances[id].cardDefId].lexemeId].pos==='VERB')??choice.targetCardIds?.[0] });
        else command({ type: 'SKIP_REWARD', offerId: offer.offerId });
        continue;
      }
      if (state.status !== 'BATTLE') throw new Error(`Unexpected status ${state.status}`);
      if (lastBattle !== state.progress.battleNumber) {
        lastBattle = state.progress.battleNumber;
        battles.push({ battle: lastBattle, enemy: state.combat.enemyState.nameKo, startingHp: state.combat.enemyState.hp, openingHand: state.combat.handIds.map(id => state.cardInstances[id].cardDefId) });
      }
      if (exerciseResources && !exercised && state.progress.battleNumber === 2) {
        command({ type: 'PREPARE' }, { reason: 'Exercise real prepare and +3 draw without injected cards' });
        state = controller.getState();
        const candidate = rankPlayableCandidates(state,{policy})[0];
        const used = new Set(candidate?.slots.map(s => s.cardInstanceId) || []);
        const exchangeId = state.combat.handIds.find(id => !used.has(id));
        if (exchangeId) command({ type: 'EXCHANGE', cardIds: [exchangeId] }, { exchangedCount: 1, reason: 'Exercise one actual exchange, preserving the found current-hand candidate' });
        exercised = true;
        continue;
      }
      const candidate = rankPlayableCandidates(state,{policy})[0];
      if(policy==='LEARNING'&&state.progress.stageId==='stage.02'&&candidate?.frameId!=='frame.svoo'&&!candidate?.lethal&&state.combat.exchangesRemaining>0&&(!candidate||candidate.power*state.combat.turnsRemaining<state.combat.enemyState.hp)){
        const selected=exchangeSelection(state,{policy});command({type:'EXCHANGE',cardIds:selected},{exchangedCount:selected.length,reason:'Current visible hand cannot meet remaining HP at this pace; seek retained SVOO material'});continue;
      }
      if (candidate) {
        for (const slot of candidate.slots) {
          command({ type: 'ADD_CARD', cardId: slot.cardInstanceId });
          command({ type: 'SET_FORM', cardId: slot.cardInstanceId, formId: slot.selection.formId });
        }
        const submitted = command({ type: 'SUBMIT' }, { sentence: candidate.text, expectedPower: candidate.power, usedCardIds: candidate.slots.map(s => s.cardInstanceId) });
        if (submitted.resolution.finalPower !== candidate.power) throw new Error('QA score disagrees with actual submitted score');
        command({ type: 'FINISH_PRESENTATION', attackId: submitted.resolution.attackId }, { actualPower: submitted.resolution.finalPower, actualHpLoss: submitted.resolution.actualHpLoss });
        continue;
      }
      if (state.combat.handIds.length <= state.combat.rulesSnapshot.handLimit - 3 && state.combat.turnsRemaining > 2) {
        command({ type: 'PREPARE' }, { reason: 'No supported candidate within finite QA search; grow hand' });
      } else if (state.combat.exchangesRemaining > 0 && state.combat.handIds.length) {
        const selected = exchangeSelection(state,{policy});
        command({ type: 'EXCHANGE', cardIds: selected }, { exchangedCount: selected.length, reason: 'Finite QA search found no candidate; exchange supporting cards' });
      } else command({ type: 'PREPARE', confirmed: true }, { reason: 'QA search has no candidate/exchange path; advance remaining turn' });
    }
    const state = controller.getState();
    return { seed, vocabularyMode,policy, result: state.status, final: plainState(state), commands, durationMs: Math.round(performance.now() - started),
      stats: { attacks: state.stats.attacks, exchanges: state.stats.exchanges, runeAppearances:rewards.reduce((sum,r)=>sum+r.choices.filter(id=>id?.startsWith('rune.')).length,0),polishedCards:Object.values(state.cardInstances).filter(c=>c.polishLevel>0).length, preparations: state.stats.preparations, bestAttack: state.stats.bestAttack },
      contentBoundary: state.progress.contentBoundary, profileStage1Runs: controller.getProfile().qualifiedRunIds.length, storyClearCount: controller.getProfile().storyClearCount,
      bossVeilReleased:state.stats.history.some(r=>r.bossStateBefore?.active&&r.bossStateAfter?.active===false),...(stopAtShop?{checkpoint:state}:{}),shops,battles, rewards, actions };
  } catch (error) {
    return { seed, vocabularyMode,policy, result: 'ENGINE_OR_POLICY_ERROR', error: error.message, commands, durationMs: Math.round(performance.now() - started),shops,battles, rewards, actions };
  }
}

async function main() {
  const seeds = Array.from({length:20},(_,i)=>`run-sequence.${i}`);
  const started = performance.now();
  const runs = [];
  for(const policy of ['LEARNING','SV_ONLY'])for (const vocabularyMode of VOCABULARY_MODES) for (const seed of seeds) {
    const result = simulateRun({ seed, vocabularyMode,policy }); runs.push(result);
    process.stdout.write(`${policy} / ${vocabularyMode} / ${seed}: ${result.result} (${result.stats?.attacks ?? 0} attacks)${result.error ? ` ${result.error}` : ''}\n`);
  }
  const report = { generatedAt: new Date().toISOString(), command: 'node tools/simulate-runs.js', nodeVersion: process.version,
    status: runs.some(run => run.result === 'ENGINE_OR_POLICY_ERROR') ? 'FAIL' : 'PASS',
    totalRuns: runs.length, completed: runs.filter(run => run.result === 'CONTENT_COMPLETE').length, defeats: runs.filter(run => run.result === 'DEFEAT').length,
    errors: runs.filter(run => run.result === 'ENGINE_OR_POLICY_ERROR').length,
    durationMs: Math.round(performance.now() - started),
    policy: 'Two fixed QA policies use bounded current-hand search and prefer lethal few-card candidates. LEARNING prioritizes Stage 2 SVOO, retains visible NP/verb materials during exchanges, and seeks SVOO when ordinary damage cannot meet the remaining HP/turn pace. SV_ONLY submits only SV candidates. Public rewards prefer Topaz/SVOO verbs/crystal; public shops prefer affordable runes, then cards. Both exercise one prepare and one exchange in battle 2, without editing gameplay state or inspecting future draw order.',
    limitations: ['This is a QA play policy, not human victory-rate evidence.', 'A defeat can result from limited phrase search, greedy card use, or exchange strategy; it is not proof that the seed is impossible.', 'No live browser animation is exercised by this command-level simulation. Browser tests are reported separately.'], runs };
  const distribution=values=>({mean:values.reduce((a,b)=>a+b,0)/values.length,counts:values.reduce((a,v)=>(a[v]=(a[v]||0)+1,a),{})});
  report.metrics=Object.fromEntries(['attacks','preparations','exchanges','runeAppearances','polishedCards'].map(key=>[key,distribution(runs.map(r=>r.stats?.[key]??0))]));
  report.metrics.gold=distribution(runs.map(r=>r.final?.gold??0));report.metrics.remainingTurns=distribution(runs.flatMap(r=>r.actions.filter(a=>a.action==='FINISH_PRESENTATION'&&a.after.status==='REWARD').map(a=>a.after.turnsRemaining)));
  report.byPolicy=Object.fromEntries(['LEARNING','SV_ONLY'].map(p=>{const rows=runs.filter(r=>r.policy===p);return[p,{runs:rows.length,completed:rows.filter(r=>r.result==='CONTENT_COMPLETE').length,clearRate:rows.filter(r=>r.result==='CONTENT_COMPLETE').length/rows.length}];}));
  const shopGold=runs.flatMap(r=>r.shops.map(s=>s.gold)).sort((a,b)=>a-b);report.firstShopGold={count:shopGold.length,min:shopGold[0]??null,median:shopGold.length?shopGold[Math.floor(shopGold.length/2)]:null,max:shopGold.at(-1)??null};
  await fs.mkdir('docs', { recursive: true }); await fs.writeFile('docs/run-simulation.json', JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(`${report.status}: ${report.completed}/${report.totalRuns} complete, ${report.defeats} defeat, ${report.errors} errors\n`);
  if (report.errors) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
