import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {impactFeel,buildPresentationTimeline} from '../src/engine/presentation.js';
import {visibleForms,formLabel} from '../src/ui/formView.js';
import {GRAMMAR_DISPLAY} from '../src/data/grammarDisplay.js';
import {registryForVersion} from '../src/data/language/index.js';
import {snapshotFromText,analyzeSentence} from '../src/engine/grammar/index.js';
import {getEncounter} from '../src/data/stages.js';
import {stageForRun} from '../src/data/stages.js';
import {resolveAttack} from '../src/engine/stage.js';
import {packs} from './helpers/polish-baseline.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('./fixtures/v051-'+name,import.meta.url)));
for(const r of read('05_Core_Feel_Expectations.json').cases)test('0.5.1 finalized overkill policy '+r.id,()=>{
 const value={...r,visualBasis:{enemyMaxHp:r.enemyMaxHp}},before=structuredClone(value),feel=impactFeel(value);
 if(['BLOCKED','SMALL','LARGE','MASSIVE'].includes(r.expectedPolicy))assert.equal(feel.tier,r.expectedPolicy);else assert.ok(['LIGHT','HEAVY','OVERPOWER'].includes(feel.tier));
 assert.ok(feel.hitStop<=150&&feel.recoil<=22&&feel.shake<=8&&feel.settle<=450);assert.deepEqual(value,before);
 if(r.expectedPolicy==='MASSIVE')assert.deepEqual([feel.hitStop,feel.recoil,feel.shake],[150,22,8]);
});
test('0.5.1 all seventeen grammar headings use reviewed display order and concise copy only',()=>{
 assert.deepEqual(GRAMMAR_DISPLAY,read('04_Education_UI_Catalog.json').entries);assert.equal(GRAMMAR_DISPLAY.length,17);
 assert.deepEqual(GRAMMAR_DISPLAY.slice(0,5).map(g=>g.tag),['FRAME.SV','FRAME.SVC','FRAME.SVO','FRAME.SVOO','FRAME.SVOC']);
});
test('0.5.1 pronoun same-surface UI keeps old aliases and actual contextual analysis; verb tenses never merge',()=>{
 const registry=registryForVersion('0.5.0');
 for(const [lemma,count]of [['she',2],['you',2],['it',2],['I',3],['he',3]]){const w=registry.lexemes.find(w=>w.lemma===lemma),forms=w.formIds.map(id=>registry.formById[id]),before=structuredClone(forms),group=visibleForms(w.pos,forms);assert.equal(group.length,count);assert.deepEqual(forms,before);assert.equal(group.flatMap(g=>g.aliasFormIds).length,forms.length);}
 const she=registry.lexemes.find(w=>w.lemma==='she'),forms=she.formIds.map(id=>registry.formById[id]),her=visibleForms(she.pos,forms).find(f=>f.surface==='her');assert.equal(her.aliasFormIds.length,2);
 for(const text of ['I like her','I like her book'])for(const formId of her.aliasFormIds){const s=snapshotFromText(text,{registry});s.orderedTokens[2].selectionId=formId;assert.equal(analyzeSentence(s,registry).status,'VALID');}
 for(const lemma of ['read','have']){const w=registry.lexemes.find(w=>w.lemma===lemma),forms=w.formIds.map(id=>registry.formById[id]);assert.equal(visibleForms(w.pos,forms).length,forms.length);assert.equal(forms.filter(f=>f.id.endsWith('.ing')).length,1);assert.equal(formLabel(forms.find(f=>f.grammaticalFeatures.tense==='PAST_PARTICIPLE')),'과거분사(p.p.)');}
});
test('0.5.1 new HP view changes only late encounters; original 0.5 view stays frozen',()=>{
 for(const [i,row]of read('03_Configuration_Expectations.json').hp.entries()){assert.equal(getEncounter(row.stageId,i%5,'0.5.1').hp,row.newRunHp);assert.equal(getEncounter(row.stageId,i%5,'0.5.0').hp,row.legacyHp);}
 for(const [stage,n]of [['stage.01',3],['stage.02',4],['stage.03',5]])for(let i=0;i<n;i++)assert.deepEqual(getEncounter(stage,i,'0.5.1'),getEncounter(stage,i,'0.5.0'));
});
for(const row of read('09_Balance_Arithmetic_Expectations.json').cases)test('0.5.1 real parser and unchanged score arithmetic '+row.id,()=>{
 const registry=registryForVersion('0.5.1'),sentenceSnapshot=snapshotFromText(row.sentence,{registry}),analysis=analyzeSentence(sentenceSnapshot,registry),stageId=row.boss==='문지기'?'stage.04':'stage.05';
 const r=resolveAttack({sentenceSnapshot,analysis,cards:sentenceSnapshot.orderedTokens.map(t=>({instanceId:t.cardInstanceId,polishLevel:0})),equippedRunes:[],enemy:getEncounter(stageId,4,'0.5.1'),stage:stageForRun({version:'0.5.1',progress:{stageId}}),policyVersion:'0.5.1',comboEligibility:{version:'0.5.0',unlocks:packs}});
 assert.equal(r.finalPower,row.preservedExpectedPower);assert.equal(Math.ceil(row.newHp/r.finalPower),row.newSamePowerHits);assert.equal(r.finalPower*2,row.twoHitTotal);
 if(stageId==='stage.04')assert.equal(r.bossStateAfter.active,false);
});
