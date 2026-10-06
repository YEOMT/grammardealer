import { SCORE_BALANCE, scoreBalanceForVersion } from '../data/balance.js';
import { safeInteger, scoreEvent } from './numeric.js';

export const BALANCE_VERSION = 'balance.0.2.0';
const ATTACKABLE = new Set(['VALID', 'VALID_WITH_ISSUES']);
const FRAME_LABELS = { 'frame.sv': '주절 · 1형식!', 'frame.svc.adj': '주절 · 2형식!', 'frame.svc.np': '주절 · 2형식!', 'frame.svo': '주절 · 3형식!', 'frame.svoo': '주절 · 4형식! ×2', 'frame.svoc':'주절 · 5형식!', 'frame.beLocative': '주절 · 1형식!' };

/** @param {object} analysis */
export function attackableAnalysis(analysis) { return Boolean(analysis && ATTACKABLE.has(analysis.status)); }

/** Snapshot normalization does not reach into gameplay state or language data. */
export function validateCardScoringSnapshot(cards, balance = SCORE_BALANCE) {
  if (!Array.isArray(cards) || !cards.length || cards.length > 16) throw new RangeError('Scoring requires 1..16 submitted cards');
  const ids = new Set();
  return cards.map((card) => {
    const instanceId = card.instanceId ?? card.cardInstanceId;
    if (typeof instanceId !== 'string' || !instanceId || ids.has(instanceId)) throw new TypeError('Duplicate or missing scoring card id');
    ids.add(instanceId);
    const polishLevel = safeInteger(card.polishLevel ?? 0, 'polishLevel', { min: 0 });
    if (polishLevel > balance.polishMax) throw new RangeError('polishLevel exceeds the v0.1 limit');
    const baseScore = safeInteger(card.baseScore ?? balance.baseCard, 'baseScore', { min: 0 });
    if (card.specialEffectId != null) throw new TypeError('Special card effects are not implemented in v0.1');
    return { ...card, instanceId, cardInstanceId: instanceId, baseScore, polishLevel, specialEffectId: null };
  });
}

export function normalizedHits(analysis) {
  const seen = new Set();
  return (analysis.grammarHits ?? analysis.hits ?? []).filter((hit) => {
    if (!hit || !['VALID', 'RECOVERED'].includes(hit.validity)) return false;
    const key = hit.evidenceKey ?? `${hit.tag}:${[...(hit.cardIds ?? [])].sort().join(',')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mainFrameHit(analysis) {
  return normalizedHits(analysis).find((hit) => /^FRAME\.(SV|SVC|SVO|SVOO|SVOC)$/.test(hit.tag) && (!hit.scope || hit.scope === 'MAIN_CLAUSE')) ?? null;
}

/**
 * Grammar is the sole source of structural evidence. This engine only applies numerical policy.
 * @param {object} analysis A supported AnalysisResult
 * @param {object[]} cards Submitted card-scoring snapshots
 * @param {{attackId?:string,balance?:object}} options
 */
export function scoreAttack(analysis, cards, { attackId = 'attack.sandbox', balance = scoreBalanceForVersion(analysis.grammarVersion), eligibleAnalysis = analysis } = {}) {
  if (!attackableAnalysis(analysis)) throw new TypeError('Only supported, structurally valid analyses can score');
  const scoringCards = validateCardScoringSnapshot(cards, balance);
  const byId = new Map(scoringCards.map((card) => [card.instanceId, card]));
  const frameHit = (analysis.grammarHits??[]).find(h=>h.scope==='MAIN_CLAUSE')??mainFrameHit(analysis);
  const frameId = analysis.mainFrameId ?? frameHit?.frameId;
  const eligibleFrame=mainFrameHit(eligibleAnalysis);
  const frameMultiplier = eligibleFrame?balance.mainFrameMultipliers[frameId === 'frame.beLocative' ? 'frame.sv' : frameId]:null;
  if (!frameHit) throw new TypeError('An evidenced main frame is required');
  const hits = normalizedHits(eligibleAnalysis);
  const excluded = new Set(analysis.coverage?.unlicensedCardIds ?? analysis.excludedCardIds ?? []);
  for (const id of excluded) if (!byId.has(id)) throw new TypeError(`Unknown excluded card ${id}`);
  for (const hit of hits) for (const id of hit.cardIds ?? []) if (!byId.has(id)) throw new TypeError(`Unknown grammar evidence card ${id}`);
  const events = [];
  let score = 0;
  const emit = (details) => {
    const event = scoreEvent({ attackId, index: events.length, before: score, ...details });
    events.push(event); score = event.after;
  };
  const contribution = (card) => safeInteger(card.baseScore + card.polishLevel * balance.polishPerLevel, 'card contribution', { min: 0 });
  for (const card of scoringCards) emit({ phase: 'CARD_BASE', sourceType: 'CARD', sourceId: card.instanceId,
    labelKo: card.polishLevel ? `카드 점수 · 연마 +${card.polishLevel}` : '카드 점수', operation: 'ADD', operand: contribution(card),
    evidenceRefs: [card.instanceId], highlightCardIds: [card.instanceId] });
  for (const id of excluded) emit({ phase: 'ACCURACY', sourceType: 'GRAMMAR', sourceId: 'UNLICENSED_CARD',
    labelKo: '수식 역할을 확인하세요 · 카드 기여 제외', operation: 'ADD', operand: -contribution(byId.get(id)),
    evidenceRefs: (analysis.issues ?? []).filter((issue) => issue.cardIds?.includes(id)).map((issue) => issue.id), highlightCardIds: [id] });
  const causes = new Set();
  for (const issue of analysis.issues ?? []) {
    const cause = issue.causeId ?? `${issue.code}:${[...(issue.cardIds ?? [])].sort().join(',')}`;
    if (causes.has(cause)) continue;
    causes.add(cause);
    if ((issue.cardIds ?? []).some((id) => excluded.has(id))) continue;
    const penalty = balance.issuePenalties[issue.code] ?? (issue.code==='INFINITIVE_BASE_REQUIRED'?10:0);
    if (!penalty) continue;
    const messages = { INFINITIVE_BASE_REQUIRED:'동사 원형', BE_FORM_REQUIRED:'be동사 형태', SUBJECT_VERB_AGREEMENT: '주어-동사 일치', DETERMINER_REQUIRED: '한정사 필요', ARTICLE_FORM: 'a/an 형태',
      DETERMINER_NUMBER_AGREEMENT: '관사·명사 수 일치', ARTICLE_COUNTABILITY_MISMATCH: '셀 수 없는 명사의 관사', PRONOUN_CASE: '대명사 격' };
    emit({ phase: 'ACCURACY', sourceType: 'GRAMMAR', sourceId: issue.code, labelKo: `${messages[issue.code] ?? '정확성'} -${penalty}`,
      operation: 'ADD', operand: -penalty, evidenceRefs: [issue.id], highlightCardIds: issue.cardIds ?? [] });
  }
  if (score < 0) emit({ phase: 'ACCURACY', sourceType: 'SYSTEM', sourceId: 'ZERO_FLOOR', labelKo: '기본 점수 최저 0', operation: 'CLAMP_ZERO', operand: 0 });
  if (analysis.status === 'VALID' && !(analysis.issues ?? []).length && !excluded.size) emit({ phase: 'COMPLETE_BONUS', sourceType: 'GRAMMAR',
    sourceId: 'COMPLETE_SENTENCE', labelKo: '완전한 문장!', operation: 'ADD', operand: balance.completeBonus,
    evidenceRefs: [frameHit.id], highlightCardIds: scoringCards.map((card) => card.instanceId) });
  if(frameMultiplier)emit({ phase: 'MAIN_FRAME', sourceType: 'GRAMMAR', sourceId: frameHit.tag, labelKo: analysis.grammarVersion==='0.5.0'&&frameId==='frame.svoc'?`${FRAME_LABELS[frameId]} ×${frameMultiplier.num/frameMultiplier.den}`:['0.4.0','0.5.0'].includes(analysis.grammarVersion)&&analysis.clauses?.some(c=>c.parentClauseId===null&&c.role==='COORDINATE')?'첫 번째 절 · '+({'frame.sv':'1형식','frame.svc.adj':'2형식','frame.svc.np':'2형식','frame.svo':'3형식','frame.svoo':'4형식','frame.svoc':'5형식'})[frameId]:balance.completeBonus===30&&frameId==='frame.svoo'?'주절 · 4형식! ×2.2':FRAME_LABELS[frameId], operation: 'MULTIPLY',
    operand: frameMultiplier, evidenceRefs: [frameHit.id], highlightCardIds: frameHit.cardIds ?? [] });
  for(const[tag,operand]of Object.entries(balance.temporalMultipliers??{})){
    const evidence=hits.filter(h=>h.tag===tag);if(!evidence.length)continue;
    emit({phase:'CONSTRUCTIONS',sourceType:'GRAMMAR',sourceId:tag,labelKo:({'TIME.PAST':'과거','TIME.PROGRESSIVE':'진행','TIME.PERFECT':'완료','TIME.FUTURE_WILL':'will 미래'})[tag],operation:'MULTIPLY',operand,evidenceRefs:evidence.map(h=>h.id),highlightCardIds:[...new Set(evidence.flatMap(h=>h.cardIds))]});
  }
  // Only grammar-proven nominal/infinitival roles qualify; never count surface suffixes.
  for(const [tag,operand] of Object.entries(balance.nonfiniteMultipliers??{})){
    const evidence=hits.filter(h=>h.tag===tag&&h.validity==='VALID'&&h.bonusEligible!==false);if(!evidence.length)continue;
    emit({phase:'CONSTRUCTIONS',sourceType:'GRAMMAR',sourceId:tag,labelKo:`${tag==='CLAUSE.INFINITIVE'?'to부정사':'동명사'} ×${operand.num/operand.den}`,operation:'MULTIPLY',operand,evidenceRefs:evidence.map(h=>h.id),highlightCardIds:[...new Set(evidence.flatMap(h=>h.cardIds))]});
  }
  for(const [tag,operation,operand,labelKo]of [['LINK.CLAUSE','MULTIPLY',balance.clauseLinkMultiplier,'절 연결 ×1.6'],['LINK.PHRASE','ADD',balance.phraseLinkAdd,'단어·구 연결 +10']]){
    const evidence=hits.filter(h=>h.tag===tag);if(!evidence.length||!operand)continue;
    emit({phase:'LINKS',sourceType:'GRAMMAR',sourceId:tag,labelKo,operation,operand,evidenceRefs:evidence.map(h=>h.id),highlightCardIds:[...new Set(evidence.flatMap(h=>h.cardIds))],connectToCardIds:[...new Set(evidence.flatMap(h=>h.connectorCardIds??[]))]});
  }
  // Each physical adjective/adverb contributes once; PP contributes once per normalized structure.
  for (const [tag, amount, label] of [['MODIFIER.ADJECTIVE', balance.modifierAdds.PRENOMINAL_ADJECTIVE, '형용사 수식!'],
    ['MODIFIER.ADVERB', balance.modifierAdds.VALID_ADVERB_CARD, '부사 수식!']]) {
    const used = new Set();
    for (const hit of hits.filter((entry) => entry.tag === tag)) {
      for (const id of hit.modifierCardIds ?? hit.cardIds ?? []) {
        if (excluded.has(id) || used.has(id)) continue;
        used.add(id);
        emit({ phase: 'SIMPLE_MODIFIERS', sourceType: 'GRAMMAR', sourceId: tag, labelKo: label, operation: 'ADD', operand: amount,
          evidenceRefs: [hit.id], highlightCardIds: [id], connectToCardIds: hit.targetCardIds ?? [] });
      }
    }
  }
  for (const hit of hits.filter((entry) => entry.tag === 'PHRASE.PP')) {
    if ((hit.cardIds ?? []).some((id) => excluded.has(id))) continue;
    emit({ phase: 'SIMPLE_MODIFIERS', sourceType: 'GRAMMAR', sourceId: hit.tag, labelKo: '전치사구!', operation: 'ADD', operand: balance.modifierAdds.PP,
      evidenceRefs: [hit.id], highlightCardIds: hit.cardIds ?? [] });
  }
  return { schemaVersion: 1, balanceVersion: analysis.grammarVersion==='0.5.0'?'balance.0.5.0':analysis.grammarVersion==='0.4.0'?'balance.0.4.0':analysis.grammarVersion==='0.3.0'?'balance.0.3.0':BALANCE_VERSION, preRuneScore: score, events, scoreTimeline: events,
    contributingCardIds: scoringCards.map((card) => card.instanceId).filter((id) => !excluded.has(id)), excludedCardIds: [...excluded] };
}
