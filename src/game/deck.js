import {isOperation} from '../data/cardCatalog.js';
import { registry, campaign021Registry, campaign04Registry, formsForCard, lexemeForCard, createSentenceSnapshot } from '../data/language/index.js';
import { analyzeSentence } from '../engine/grammar/index.js';
import { createRng, createStream, pick, shuffle, weightedPick, assertStream } from './rng.js';
import { BALANCE } from '../data/balance.js';
import { assertCardConservation } from './invariants.js';

export const VOCABULARY_MODES = Object.freeze(['BEGINNER', 'STANDARD', 'ADVANCED', 'FREE']);
export const GENERATOR_VERSION = '0.1.1';
export const STARTER_SLOT_COUNTS = BALANCE.starter.slotCounts;
const WEIGHTS = {
  BEGINNER: { BEGINNER: 100 }, STANDARD: { BEGINNER: 40, STANDARD: 60 },
  ADVANCED: { BEGINNER: 20, STANDARD: 30, ADVANCED: 50 }, FREE: { BEGINNER: 1, STANDARD: 1, ADVANCED: 1 },
};
const BASIC_FRAMES = ['frame.sv', 'frame.svc.adj', 'frame.svc.np', 'frame.svo'];
const stableSort = values => [...values].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const slot = (id, form) => ({ cardInstanceId: id, selection: { formId: form.id || form.formId } });
const feature = (form, name) => form.grammaticalFeatures?.[name];
const getFrames = row => row.lexeme.frameIds || [];

function cardRows(ids, instances, language = registry) {
  return ids.filter(id=>!isOperation(instances[id],language.version)).map(id => {
    const card = instances[id];
    if (!card) throw new Error(`Unknown card instance: ${id}`);
    const lexeme = language.lexemeById[language.cardById[card.cardDefId]?.lexemeId];
    if (!lexeme) throw new Error(`Card is outside the content manifest: ${card.cardDefId}`);
    return { id, card, lexeme, forms: formsForCard(card,{registry:language}) };
  });
}

function hasUniqueCards(slots) { return new Set(slots.map(x => x.cardInstanceId)).size === slots.length; }
function* doubleObjects(objects, prefix) {
  for (const io of objects) {
    if (!hasUniqueCards([...prefix,...io.slots])) continue;
    for (const direct of objects) if (hasUniqueCards([...prefix,...io.slots,...direct.slots])) yield {slots:[...io.slots,...direct.slots]};
  }
}

function nounPhrases(rows, role, language = registry) {
  const result = [];
  const determiners = rows.filter(row => row.lexeme.pos === 'DETERMINER');
  for (const row of rows) {
    if (row.lexeme.pos === 'PRONOUN') {
      const wanted = role === 'SUBJECT' ? 'NOMINATIVE' : 'OBJECTIVE';
      const form = row.forms.find(f => feature(f, 'case') === wanted) || row.forms.find(f => (f.allowedRoleCandidates || []).includes(role));
      if (form) result.push({ slots: [slot(row.id, form)], head: row, form });
    }
    if (row.lexeme.pos !== 'NOUN') continue;
    const singular = row.forms.find(f => feature(f, 'number') !== 'PLURAL') || row.forms[0];
    const plural = row.forms.find(f => feature(f, 'number') === 'PLURAL');
    const senses = row.lexeme.senseIds.map(id => language.senseById[id]);
    const mass = senses.some(sense => sense?.countability === 'MASS' || sense?.countability === 'UNCOUNTABLE');
    if (plural) result.push({ slots: [slot(row.id, plural)], head: row, form: plural });
    if (mass) result.push({ slots: [slot(row.id, singular)], head: row, form: singular });
    for (const determiner of determiners) {
      if (mass && determiner.lexeme.lemma === 'a') continue;
      // Article agreement remains verified by the real parser, including sound exceptions.
      for (const article of determiner.forms) {
        result.push({ slots: [slot(determiner.id, article), slot(row.id, singular)], head: row, form: singular });
      }
    }
  }
  return result;
}

/**
 * Bounded short-path search for deck validation and offline QA. This is not gameplay advice.
 * Every returned path is passed through the SAME Grammar Engine as submitted attacks.
 * It never changes cards, RNG, or the live run, and never invents a physical card.
 * @param {string[]} availableIds
 * @param {Object<string,object>} cardInstances
 * @param {{perFrame?:number,maxChecks?:number,maxCards?:number,includeModifiers?:boolean}} options
 */
export function findPlayableSentences(availableIds, cardInstances, options = {}) {
  if (!Array.isArray(availableIds) || new Set(availableIds).size !== availableIds.length) throw new TypeError('Available card IDs must be unique');
  const { perFrame = 3, maxChecks = 512, maxCards = 16, includeModifiers = false, registry: language = registry, includeSvoo = false } = options;
  const frames = options.frames ?? (includeSvoo ? [...BASIC_FRAMES, 'frame.svoo'] : BASIC_FRAMES);
  if (!Number.isSafeInteger(perFrame) || perFrame < 1 || perFrame > 100 || !Number.isSafeInteger(maxChecks) || maxChecks < 1 || maxChecks > 10000) throw new RangeError('Invalid witness search budget');
  const rows = cardRows(availableIds, cardInstances, language);
  const subjects = nounPhrases(rows, 'SUBJECT', language);
  const objects = nounPhrases(rows, 'OBJECT', language);
  const verbs = rows.filter(row => row.lexeme.pos === 'VERB');
  const adjectives = rows.filter(row => row.lexeme.pos === 'ADJECTIVE');
  const results = [];
  const seen = new Set();
  let checks = 0;
  function consider(slots, expectedFrame) {
    if (!hasUniqueCards(slots) || slots.length > maxCards || checks >= maxChecks) return null;
    const key = slots.map(s => `${s.cardInstanceId}:${s.selection.formId}`).join('|');
    if (seen.has(key)) return null;
    seen.add(key);
    checks += 1;
    const snapshot = createSentenceSnapshot(slots, cardInstances, { sentenceId: `witness.${checks}`, languageVersion:language.version });
    const analysis = analyzeSentence(snapshot, language);
    if (analysis.status !== 'VALID' || (expectedFrame && analysis.mainFrameId !== expectedFrame)) return null;
    return { frameId: analysis.mainFrameId, slots, snapshot, analysis, text: snapshot.orderedTokens.map(t => t.surface).join(' ') };
  }
  for (const frame of frames) {
    let found = 0;
    const quota = Math.max(1, Math.floor(maxChecks / frames.length));
    const startChecks = checks;
    frameSearch: for (const subject of subjects) {
      for (const verb of verbs.filter(v => getFrames(v).includes(frame))) {
        const complementRows = frame === 'frame.svoo'
          ? doubleObjects(objects,[...subject.slots,slot(verb.id,verb.forms[0])])
          : frame === 'frame.sv' ? [null] : frame === 'frame.svc.adj'
          ? adjectives.map(row => ({ slots: [slot(row.id, row.forms[0])] })) : objects;
        for (const complement of complementRows) {
          for (const verbForm of verb.forms) {
            const candidate = consider([...subject.slots, slot(verb.id, verbForm), ...(complement?.slots || [])], frame);
            if (candidate) { results.push(candidate); found += 1; }
            if (found >= perFrame || checks - startChecks >= quota || checks >= maxChecks) break frameSearch;
          }
        }
      }
    }
  }
  if (includeModifiers && checks < maxChecks) {
    const bases = [...results];
    for (const base of bases) {
      const used = new Set(base.slots.map(s => s.cardInstanceId));
      const advs = rows.filter(row => row.lexeme.pos === 'ADVERB' && !used.has(row.id));
      const preps = rows.filter(row => ['PREPOSITION', 'FUNCTION'].includes(row.lexeme.pos) && !used.has(row.id));
      for (const adv of advs) {
        // Try legal positions; the parser rejects incompatible word-specific adjunct positions.
        for (let at = 0; at <= base.slots.length; at += 1) {
          const expanded = [...base.slots]; expanded.splice(at, 0, slot(adv.id, adv.forms[0]));
          const candidate = consider(expanded, base.frameId);
          if (candidate) results.push(candidate);
        }
      }
      for (const prep of preps) {
        for (const object of objects) {
          if (object.slots.some(s => used.has(s.cardInstanceId))) continue;
          const candidate = consider([...base.slots, slot(prep.id, prep.forms[0]), ...object.slots], base.frameId);
          if (candidate) { results.push(candidate); break; }
          if (checks >= maxChecks) break;
        }
      }
      if (checks >= maxChecks) break;
    }
  }
  return results;
}

const allStarterCards = () => stableSort(campaign021Registry.cards.filter(card => (card.availability?.starterEligible ?? card.starterEligible) && (card.availability?.runtimeReady ?? card.runtimeReady)));

function selectCard(pool, counts, mode, stream, trace, role, distinct = false) {
  const candidates = pool.filter(card => (counts[card.lexemeId] || 0) < (distinct ? 1 : 2));
  if (!candidates.length) throw new Error(`No starter candidates for ${role}`);
  const requestedBand = weightedPick(stream, WEIGHTS[mode]);
  const lowerBands = requestedBand === 'ADVANCED' ? ['ADVANCED', 'STANDARD', 'BEGINNER', 'CORE']
    : requestedBand === 'STANDARD' ? ['STANDARD', 'BEGINNER', 'CORE'] : ['BEGINNER', 'CORE'];
  let selectedPool = [];
  let usedBand;
  for (const band of lowerBands) {
    selectedPool = candidates.filter(card => campaign04Registry.lexemeById[card.lexemeId].vocabBand === band);
    if (selectedPool.length) { usedBand = band; break; }
  }
  if (!selectedPool.length) throw new Error(`No same-role/common/lower band candidates for ${role}:${requestedBand}`);
  if (usedBand !== requestedBand) trace.bandFallbacks.push({ role, requestedBand, usedBand });
  const selected = pick(stream, selectedPool);
  counts[selected.lexemeId] = (counts[selected.lexemeId] || 0) + 1;
  return selected;
}

function buildSlotPlan(mode, stream, trace, version) {
  const pool = allStarterCards();
  const counts = {};
  const planned = [];
  const addFixed = (lemma, pos, role) => {
    const card = pool.find(card => { const lex = campaign04Registry.lexemeById[card.lexemeId]; return lex.lemma.toLowerCase() === lemma.toLowerCase() && lex.pos === pos; });
    if (!card) throw new Error(`Missing starter material ${lemma}`);
    counts[card.lexemeId] = (counts[card.lexemeId] || 0) + 1;
    planned.push({ card, role });
  };
  const choose = (role, filter, distinct = false) => {
    const card = selectCard(pool.filter(card => filter(campaign021Registry.lexemeById[card.lexemeId])), counts, mode, stream, trace, role, distinct);
    planned.push({ card, role });
  };
  for (let i = 0; i < STARTER_SLOT_COUNTS.NOUN; i += 1) choose('NOUN', lex => lex.pos === 'NOUN', i < 4);
  for (const lemma of [...BALANCE.starter.pronouns,pick(stream,BALANCE.starter.thirdPersonPronounChoices)]) addFixed(lemma, 'PRONOUN', 'PRONOUN');
  addFixed('be', 'VERB', 'BE'); addFixed('be', 'VERB', 'BE');
  for (let i = 0; i < 2; i += 1) choose('SV', lex => lex.pos === 'VERB' && lex.lemma !== 'be' && lex.frameIds.includes('frame.sv') && ['go','come','run','live'].includes(lex.lemma),true);
  if(version==='0.4.0')addFixed('have','VERB','HAVE');
  for (let i = 0; i < (version==='0.4.0'?2:3); i += 1) choose('SVO', lex => lex.pos === 'VERB' && lex.lemma !== 'be' && lex.frameIds.includes('frame.svo'));
  choose('MULTI', lex => lex.pos === 'VERB' && lex.lemma !== 'be' && lex.frameIds.filter(frame => BASIC_FRAMES.includes(frame)).length > 1);
  for (let i = 0; i < STARTER_SLOT_COUNTS.ADJECTIVE; i += 1) choose('ADJECTIVE', lex => lex.pos === 'ADJECTIVE', i < 3);
  choose('DEGREE_ADVERB', lex => lex.pos === 'ADVERB' && ['very', 'really'].includes(lex.lemma));
  choose('CLAUSE_ADVERB', lex => lex.pos === 'ADVERB' && !['very', 'really', 'recently'].includes(lex.lemma));
  addFixed('a', 'DETERMINER', 'DETERMINER'); addFixed('a', 'DETERMINER', 'DETERMINER'); addFixed('the', 'DETERMINER', 'DETERMINER');
  for (const lemma of shuffle(stream, ['in', 'on', 'at', 'with']).slice(0, 2)) addFixed(lemma, 'PREPOSITION', 'PREPOSITION');
  return planned;
}

function instantiatePlan(plan) {
  const cardInstances = {};
  const activeCardIds = plan.map((entry, index) => {
    const instanceId = `starter.${String(index + 1).padStart(2, '0')}`;
    cardInstances[instanceId] = { instanceId, cardDefId: entry.card.id, polishLevel: 0, specialEffectId: null };
    return instanceId;
  });
  return { activeCardIds, cardInstances };
}

/** Check physical slots and actual parser-backed paths; coverage tags alone never suffice. */
export function validateStarterDeck(deck) {
  const rows = cardRows(deck.activeCardIds, deck.cardInstances);
  const counts = Object.fromEntries(Object.keys(STARTER_SLOT_COUNTS).map(key => [key, rows.filter(r => r.lexeme.pos === key).length]));
  const errors = [];
  if (rows.length !== BALANCE.combat.startingDeckSize || new Set(deck.activeCardIds).size !== BALANCE.combat.startingDeckSize) errors.push('PHYSICAL_CARD_COUNT');
  for (const [pos, expected] of Object.entries(STARTER_SLOT_COUNTS)) if (counts[pos] !== expected) errors.push(`SLOT_${pos}`);
  const copies = new Map(); rows.forEach(row => copies.set(row.lexeme.id, (copies.get(row.lexeme.id) || 0) + 1));
  if ([...copies.values()].some(n => n > 2)) errors.push('COPY_LIMIT');
  if (copies.size < 20) errors.push('DISTINCT_TOTAL');
  if (new Set(rows.filter(r => r.lexeme.pos === 'NOUN').map(r => r.lexeme.id)).size < 4) errors.push('DISTINCT_NOUN');
  if (new Set(rows.filter(r => r.lexeme.pos === 'ADJECTIVE').map(r => r.lexeme.id)).size < 3) errors.push('DISTINCT_ADJECTIVE');
  if (rows.filter(r => r.lexeme.lemma === 'be').length !== 2) errors.push('BE_COPIES');
  const lemmasFor = pos => rows.filter(r => r.lexeme.pos === pos).map(r => r.lexeme.lemma.toLowerCase()).sort();
  const pronouns=lemmasFor('PRONOUN');
  if(!['i','you','they'].every(x=>pronouns.includes(x))||pronouns.filter(x=>['he','she'].includes(x)).length!==1)errors.push('FIXED_PRONOUNS');
  if(new Set(rows.filter(r=>['go','come','run','live'].includes(r.lexeme.lemma)).map(r=>r.lexeme.id)).size<2)errors.push('DISTINCT_SV_VERBS');
  if (lemmasFor('DETERMINER').join('|') !== 'a|a|the') errors.push('FIXED_DETERMINERS');
  const prepositions = lemmasFor('PREPOSITION');
  if (new Set(prepositions).size !== 2 || prepositions.some(x => !['in', 'on', 'at', 'with'].includes(x))) errors.push('PREPOSITIONS');
  const adverbs = lemmasFor('ADVERB');
  if (adverbs.filter(x => ['very', 'really'].includes(x)).length !== 1) errors.push('ADVERB_ROLES');
  const witnesses = findPlayableSentences(deck.activeCardIds, deck.cardInstances, { perFrame: 1, registry:campaign021Registry });
  const found = new Set(witnesses.map(w => w.frameId));
  for (const frame of BASIC_FRAMES) if (!found.has(frame)) errors.push(`MISSING_${frame}`);
  return { valid: errors.length === 0, errors, counts, witnesses };
}

/** Create a fresh 28-card deck. An optional RNG input is cloned; caller commits returned rng. */
export function generateStarterDeck({ seed = 'sentence', vocabularyMode = 'BEGINNER', rng, version = GENERATOR_VERSION } = {}) {
  if (!VOCABULARY_MODES.includes(vocabularyMode)) throw new RangeError('Unknown vocabulary mode');
  const nextRng = rng ? structuredClone(rng) : createRng(seed);
  const trace = { generatorVersion:version, policy: 'ROLE_SLOTS_THEN_BAND_V2', vocabularyMode, bandFallbacks: [], repairs: [], fallbackUsed: false, attemptLimit: 32, startCursor: nextRng.deck.cursor };
  let plan = buildSlotPlan(vocabularyMode, nextRng.deck, trace, version);
  let deck = instantiatePlan(plan);
  let validation = validateStarterDeck(deck);
  // Replace only a deficient role. Fixed pronouns/determiners/be are never rerolled.
  for (let attempt = 0; !validation.valid && attempt < trace.attemptLimit; attempt += 1) {
    const failed = validation.errors.find(error => error.startsWith('MISSING_'));
    if (!failed) break;
    const frame = failed.slice('MISSING_'.length);
    const targetRole = frame === 'frame.sv' ? 'SV' : frame === 'frame.svo' ? 'SVO' : frame === 'frame.svc.np' ? 'NOUN' : 'ADJECTIVE';
    const target = plan.findIndex(entry => entry.role === targetRole);
    if (target < 0) break;
    const counts = {};
    plan.forEach((entry, index) => { if (index !== target) counts[entry.card.lexemeId] = (counts[entry.card.lexemeId] || 0) + 1; });
    const candidates = allStarterCards().filter(card => {
      const lex = campaign04Registry.lexemeById[card.lexemeId];
      return ['ADJECTIVE', 'NOUN'].includes(targetRole) ? lex.pos === targetRole : lex.pos === 'VERB' && lex.frameIds.includes(frame);
    });
    const old = plan[target].card.id;
    plan[target] = { card: selectCard(candidates, counts, vocabularyMode, nextRng.deck, trace, targetRole, ['ADJECTIVE', 'NOUN'].includes(targetRole)), role: targetRole };
    trace.repairs.push({ attempt: attempt + 1, slotIndex: target, from: old, to: plan[target].card.id, reason: failed });
    deck = instantiatePlan(plan); validation = validateStarterDeck(deck);
  }
  if (!validation.valid) {
    trace.fallbackUsed = true;
    trace.fallbackReasons = [...validation.errors];
    // Same mode, independently seeded finite fallback, revalidated against current real language data.
    const fallbackStream = createStream(`validated-fallback-v1:${vocabularyMode}`);
    plan = buildSlotPlan(vocabularyMode, fallbackStream, trace, version);
    deck = instantiatePlan(plan); validation = validateStarterDeck(deck);
    trace.fallbackCursor = fallbackStream.cursor;
    if (!validation.valid) throw new Error(`Starter fallback failed validation: ${validation.errors.join(', ')}`);
  }
  trace.slotRoles = plan.map(entry => ({ cardDefId: entry.card.id, role: entry.role }));
  trace.endCursor = nextRng.deck.cursor;
  return { ...deck, rng: nextRng, vocabulary: { encounteredLexemeIds: [...new Set(plan.map(entry => entry.card.lexemeId))] }, generationTrace: trace, witnesses: validation.witnesses };
}

/**
 * Prepare a battle with a real witness subset, random fill, and shuffled hand order.
 * This consumes the provided proposed-state stream; no cards are added to the active deck.
 */
export function createBattlePiles({ activeCardIds, cardInstances, stream, initialHand = 6, previousOpeningFrames = [], focusFrame = null, tutorial = false, registry: language = registry }) {
  if (!Number.isSafeInteger(initialHand) || initialHand < 1) throw new RangeError('Invalid initial hand size');
  assertStream(stream);
  const startCursor = stream.cursor;
  const randomizedIds = shuffle(stream, activeCardIds);
  const searchIds = focusFrame || tutorial ? [...randomizedIds.filter(id=>!isOperation(cardInstances[id],language.version)&&lexemeForCard(cardInstances[id],language).pos==='PRONOUN'),...randomizedIds.filter(id=>isOperation(cardInstances[id],language.version)||lexemeForCard(cardInstances[id],language).pos!=='PRONOUN')] : randomizedIds;
  const witnesses = findPlayableSentences(searchIds, cardInstances, { perFrame: 4, maxCards: initialHand, maxChecks: 768, registry: language });
  const availableFrames = BASIC_FRAMES.filter(frame => witnesses.some(w => w.frameId === frame));
  let candidates = availableFrames.filter(frame => !previousOpeningFrames.includes(frame));
  if (!candidates.length) candidates = availableFrames;
  const frame = focusFrame && availableFrames.includes(focusFrame) ? focusFrame : candidates.length ? pick(stream, candidates) : null;
  let eligible = witnesses.filter(w => w.frameId === frame);
  if(focusFrame==='frame.sv'&&eligible.some(w=>w.slots.length===2))eligible=eligible.filter(w=>w.slots.length===2);
  const witness = frame ? pick(stream, eligible) : null;
  let beWitness = null;
  if(tutorial){
    const beOptions=witnesses.filter(w=>w.frameId==='frame.svc.adj'&&w.slots.some(s=>lexemeForCard(cardInstances[s.cardInstanceId]).lemma==='be')&&new Set([...w.slots,...(witness?.slots??[])].map(s=>s.cardInstanceId)).size<=initialHand);
    if(!witness||!beOptions.length)throw Error('Tutorial opener needs real SV and be + adjective paths within the opening hand');
    beWitness=pick(stream,beOptions);
  }
  // A player may remove critical material at a later reward. Never secretly recreate removed cards.
  const requiredIds = [...new Set([...(witness?.slots??[]),...(beWitness?.slots??[])].map(s=>s.cardInstanceId))];
  const required = new Set(requiredIds);
  const fill = randomizedIds.filter(id => !required.has(id));
  const openingIds = [...requiredIds, ...fill.slice(0, Math.max(0, initialHand - requiredIds.length))];
  const handIds = shuffle(stream, openingIds);
  const inHand = new Set(handIds);
  const piles = { drawIds: randomizedIds.filter(id => !inHand.has(id)), handIds, sentenceSlots: [], discardIds: [] };
  assertCardConservation(activeCardIds, piles, cardInstances);
  return { ...piles, openingTrace: { policy: 'SEEDED_WITNESS_SUBSET_THEN_RANDOM_FILL', generatorVersion:GENERATOR_VERSION, startCursor, endCursor: stream.cursor, guaranteed: Boolean(witness), frameId: frame, witnessSlots: witness?.slots || [], beWitnessSlots:beWitness?.slots??[], focusFrame, reason: witness ? null : 'NO_SUPPORTED_PATH_IN_CURRENT_DECK' } };
}

/** Draw into a proposed state clone. Excess requested cards are not recorded as future credit. */
export function drawCards(piles, count, handLimit, stream) {
  if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(handLimit) || handLimit < 1) throw new RangeError('Invalid draw request');
  assertStream(stream);
  const actual = Math.min(count, Math.max(0, handLimit - piles.handIds.length));
  const drawn = [];
  for (let i = 0; i < actual; i += 1) {
    if (!piles.drawIds.length && piles.discardIds.length) {
      piles.drawIds = shuffle(stream, piles.discardIds);
      piles.discardIds = [];
    }
    if (!piles.drawIds.length) break;
    const id = piles.drawIds.shift();
    piles.handIds.push(id); drawn.push(id);
  }
  return drawn;
}

/** Validates before any mutation/RNG call. Invalid exchange leaves all input state untouched. */
export function exchangeCards(piles, selectedIds, handLimit, stream) {
  if (!Array.isArray(selectedIds) || !selectedIds.length || new Set(selectedIds).size !== selectedIds.length ||
      selectedIds.some(id => !piles.handIds.includes(id)) || !Number.isSafeInteger(piles.exchangesRemaining) || piles.exchangesRemaining <= 0) {
    return { ok: false, reason: 'INVALID_EXCHANGE', drawnIds: [] };
  }
  if (!Number.isSafeInteger(handLimit) || handLimit < 1) return { ok: false, reason: 'INVALID_HAND_LIMIT', drawnIds: [] };
  assertStream(stream);
  const selected = new Set(selectedIds);
  piles.handIds = piles.handIds.filter(id => !selected.has(id));
  piles.discardIds = [...selectedIds].reverse().concat(piles.discardIds);
  piles.exchangesRemaining -= 1;
  return { ok: true, drawnIds: drawCards(piles, selectedIds.length, handLimit, stream) };
}

/** Remove only submitted sentence cards; unplayed hand cards stay in hand. */
export function discardSentence(piles) {
  const ids = piles.sentenceSlots.map(s => s.cardInstanceId);
  piles.discardIds = [...ids].reverse().concat(piles.discardIds);
  piles.sentenceSlots = [];
  return ids;
}
