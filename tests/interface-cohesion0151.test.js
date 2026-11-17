import test from 'node:test';
import assert from 'node:assert/strict';
import {RunController} from '../src/game/runController.js';
import {newProfile,validateRunState} from '../src/services/localStore.js';
import {registryForVersion} from '../src/data/language/index.js';
import {SHOP_FLOW_POLICY} from '../src/game/shopFlow.js';
import {resolvePresentationRegion} from '../src/services/presentationRegion.js';
import {resolveMusicContext,createMusicDirector} from '../src/services/musicContext.js';
import {firstPreparationContext,createFirstPreparationGate} from '../src/ui/firstPreparation.js';
import {dictionaryForms} from '../src/ui/formView.js';
import {roundsForRun} from '../src/data/stages.js';
import {bossReward,checked,chooseEntry} from './helpers/shop-flow-state.js';

const fresh=()=>{const c=new RunController({profile:{...newProfile('Cohesion QA'),guidedTutorialCompletedVersion:'0.2.1'}});checked(c,{type:'NEW_RUN',config:{seed:'cohesion0151'}});return c;};
test('R2 six shop places and choice preparations agree with music without altering supply or legacy state',()=>{
 const pairs=[['02','01'],['04','03'],['06','05'],['08','07'],['10','09'],['final','10']];
 for(const [target,place]of pairs){const s=fresh().getState();s.status='SHOP';s.progress.stageId='stage.'+target;s.shop={stageId:'stage.'+target,closed:false};const before=structuredClone(s);assert.equal(resolvePresentationRegion(s),'stage.'+place);assert.equal(resolveMusicContext('#game',s),'stage.'+place);assert.deepEqual(s,before);
  const legacy=structuredClone(s);delete legacy.config.shopFlowPolicy;assert.equal(resolvePresentationRegion(legacy),'stage.'+target);
  s.status='STAGE_INTRO';if(target==='04')s.entryChoice={pending:true};if(target==='08')s.waterwaysEntryChoice={pending:true};
  if(['04','08'].includes(target))assert.equal(resolvePresentationRegion(s),'stage.'+place);
  s.shop.closed=true;s.combat=null;assert.equal(resolvePresentationRegion(s),'stage.'+target);
 }
 const calls=[],audio={setBgmAsset:(...args)=>calls.push(args)},d=createMusicDirector(audio),owner={};const s=fresh().getState();s.progress.stageId='stage.02';s.status='SHOP';s.shop={stageId:'stage.02',closed:false};
 d.sync('#game',s,owner);d.sync('#game',structuredClone(s),owner);assert.equal(calls.length,1);assert.equal(calls[0][0],'stage.01');s.status='STAGE_INTRO';s.shop.closed=true;s.combat=null;d.sync('#game',s,owner);d.sync('#game',s,owner);assert.equal(calls.length,2);assert.equal(calls[1][0],'stage.02');assert.equal(calls[1][2].sequential,true);
});
test('R2 all eleven first encounters are read-only; incomplete shops, choices and active saves never enter the gate',()=>{
 const base=fresh().getState();
 for(const stage of [...Array.from({length:10},(_,i)=>String(i+1).padStart(2,'0')),'final']){
  const s=structuredClone(base);s.progress.stageId='stage.'+stage;s.progress.roundIndex=0;s.combat=null;
  if(['02','04','06','08','10','final'].includes(stage)){assert.equal(firstPreparationContext(s),null);s.shop={stageId:s.progress.stageId,closed:true};}
  const before=structuredClone(s),p=firstPreparationContext(s);assert.equal(p.encounterIndex,0);assert.ok(p.key.endsWith(roundsForRun(s)[0].id));assert.equal(p.command,stage==='01'?'START_BATTLE':'ENTER_STAGE');assert.deepEqual(s,before);
  s.status='BATTLE';assert.equal(firstPreparationContext(s),null);s.status='BETWEEN_BATTLES';assert.equal(firstPreparationContext(s),null);
 }
 const guided=new RunController({profile:newProfile('Guided')});checked(guided,{type:'NEW_RUN',config:{seed:'guided'}});assert.equal(firstPreparationContext(guided.getState()),null);
 const legacy=structuredClone(base);delete legacy.config.shopFlowPolicy;assert.equal(firstPreparationContext(legacy),null);
});
test('R2 first preparation survives rereads, rejects stale owners/revisions, consumes once and starts exact original deck/RNG',()=>{
 const c=fresh(),initial=c.getState(),baseline=new RunController({initialState:structuredClone(initial),profile:c.getProfile()}),gate=createFirstPreparationGate();
 assert.ok(gate.open(c,initial));for(let i=0;i<3;i++){assert.ok(gate.current(c,c.getState()));assert.deepEqual(c.getState(),initial);}
 assert.equal(gate.take({},initial),null);gate.open(c,initial);assert.equal(gate.take(c,{...initial,revision:initial.revision+1}),null);
 gate.open(c,initial);const cmd=gate.take(c,initial);checked(c,cmd);assert.equal(gate.take(c,c.getState()),null);checked(baseline,{type:'START_BATTLE',expectedRevision:initial.revision});assert.deepEqual(c.getState(),baseline.getState());assert.equal(validateRunState(c.getState(),registryForVersion(c.getState().version)),true);
 const loaded=new RunController({initialState:c.getState(),profile:c.getProfile()});assert.equal(firstPreparationContext(loaded.getState()),null);
});
test('R2 actual shop and non-shop entry commands match the original controller after read-only preparation',()=>{
 for(const completed of [1,2,3,7,10]){
  const c=bossReward(completed),s=c.getState();s.config.shopFlowPolicy=SHOP_FLOW_POLICY;c._state=s;checked(c,{type:'SKIP_REWARD',offerId:s.reward.offerId});
  if(c.getState().status==='STAGE_CLEAR')checked(c,{type:'NEXT_STAGE'});
  if(c.getState().entryChoice?.pending||c.getState().waterwaysEntryChoice?.pending){assert.equal(firstPreparationContext(c.getState()),null);chooseEntry(c);}
  if(c.getState().status==='SHOP'){assert.equal(firstPreparationContext(c.getState()),null);checked(c,{type:'LEAVE_SHOP',shopId:c.getState().shop.shopId});}
  const before=c.getState(),plain=new RunController({initialState:before,profile:c.getProfile()}),gate=createFirstPreparationGate();assert.ok(gate.open(c,before));assert.deepEqual(c.getState(),before);checked(c,gate.take(c,before));checked(plain,{type:'ENTER_STAGE',expectedRevision:before.revision});assert.deepEqual(c.getState(),plain.getState());assert.equal(validateRunState(c.getState(),registryForVersion(c.getState().version)),true);
 }
});
test('R2 compact dictionary preserves irregular, noun/pronoun and dual roles without repeated uninflected headings',()=>{
 const r=registryForVersion('0.14.0'),format=lemma=>{const card=r.cards.find(c=>r.lexemeById[c.lexemeId].lemma===lemma),w=r.lexemeById[card.lexemeId],words=[w,...(card.secondaryLexemeIds??[]).map(id=>r.lexemeById[id])];return dictionaryForms(w,words.flatMap(w=>w.formIds.map(id=>r.formById[id])).filter(f=>f.runtimeReady));};
 assert.deepEqual(format('at'),[]);assert.deepEqual(format('clearly'),[]);
 for(const [lemma,surfaces]of [['be',['be','am','is','are','was','were','being','been']],['write',['write','wrote','written']],['a',['a','an']],['I',['I','me','my']],['change',['change','changes','changed','changing']]])for(const surface of surfaces)assert.ok(format(lemma).some(g=>g.surfaces.split(' · ').includes(surface)),lemma+': '+surface);
 const changed=format('change').filter(g=>g.surfaces.includes('changed'));assert.ok(changed.some(g=>g.label==='과거'));assert.ok(changed.some(g=>g.label==='p.p.'));
});
