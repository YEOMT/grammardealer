import test from 'node:test';
import assert from 'node:assert/strict';
import {formMeaning,nonfiniteLabel,verbUsage,nonfiniteUsageNotes,GRAMMAR_GUIDE} from '../src/data/grammarGuideData.js';
import {registryForVersion} from '../src/data/language/index.js';
import {resolveAsset,assetUrl} from '../src/services/assets.js';

test('0.5 role-neutral form labels preserve the same legacy physical form and distinguish past / pp',()=>{
 const r=registryForVersion('0.4.0'),word=r.lexemes.find(w=>w.lemma==='read'),forms=word.formIds.map(id=>r.formById[id]),before=structuredClone(forms);
 const ing=forms.filter(f=>f.grammaticalFeatures.tense==='PRESENT_PARTICIPLE');
 assert.equal(ing.length,1);assert.equal(ing[0].id,'form.read.ing');assert.equal(formMeaning(word,ing[0]),'-ing형');
 const past=forms.find(f=>f.grammaticalFeatures.tense==='PAST'),pp=forms.find(f=>f.grammaticalFeatures.tense==='PAST_PARTICIPLE');
 assert.equal(past.surface,pp.surface);assert.notEqual(past.id,pp.id);assert.notEqual(formMeaning(word,past),formMeaning(word,pp));
 assert.deepEqual(forms,before);
});
test('0.5 submitted nonfinite labels distinguish full-phrase function without leaking internal enum names',()=>{
 assert.equal(nonfiniteLabel({interpretation:'GERUND',function:'PREPOSITION_OBJECT'}),'동명사 · 전치사의 목적어');
 assert.equal(nonfiniteLabel({interpretation:'PARTICIPLE',function:'NOUN_MODIFIER'}),'현재분사 · 명사 수식');
 assert.equal(nonfiniteLabel({interpretation:'INFINITIVE',function:'OBJECT_COMPLEMENT'}),'to부정사 · 목적격보어');
 assert.equal(nonfiniteLabel({interpretation:'UNKNOWN',function:'UNKNOWN'}),'');
 assert.match(verbUsage({frameIds:['frame.svo','frame.svo.gerund']}),/동명사/);
 assert.deepEqual(nonfiniteUsageNotes({lemma:'enjoy'}),['enjoy 뒤에는 동명사(-ing)를 씁니다.']);
 assert.equal(nonfiniteUsageNotes({lemma:'give'}).length,0);
 assert.doesNotMatch(GRAMMAR_GUIDE['TIME.PROGRESSIVE'].description,/언제나|항상/);
});
test('0.5 five desert asset slots resolve locally without remote requests',()=>{
 for(const id of ['enemy.stage5.01','enemy.stage5.02','enemy.stage5.03','enemy.stage5.04','boss.stage5']){
  assert.equal(resolveAsset(id).kind,'emoji');assert.equal(assetUrl(id),null);assert.ok(resolveAsset(id).labelKo.length>0);
 }
});
