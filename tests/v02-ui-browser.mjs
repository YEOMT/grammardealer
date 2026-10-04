/** Isolated renderer/controller fixtures. This is not the seven-battle production playthrough. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const base=process.env.SB_UI_URL||'http://127.0.0.1:5173/';
const evidence=path.resolve(process.env.SB_V02_EVIDENCE||'.local-validation/v02-ui');
await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={kind:'SYNTHETIC_UI_AND_CONTROLLER_FIXTURES_NOT_CAMPAIGN_COMPLETION',browser:browser.version(),checks:[],screenshots:[],errors:[]};
const check=(id,detail={})=>report.checks.push({id,status:'PASS',...detail});
const screenshot=async(page,name)=>{await page.screenshot({path:path.join(evidence,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);};
const state=page=>page.evaluate(()=>window.ui02.controller.getState());
try{
  const page=await browser.newPage({viewport:{width:1366,height:768}});
  page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto(base);await page.locator('#start-run').waitFor();
  assert.match(await page.locator('.version-badge').innerText(),/0\.2/);
  await page.evaluate(async()=>{
    const [{RunController},{newProfile,LocalStore},{renderIntro,renderStageClear,renderResult},{renderShop},{openDeck,openDictionary,openRecords,openSaves},{RUNE_BY_ID}]=await Promise.all([
      import('/tests/helpers/legacy-controller.js'),import('/src/services/localStore.js'),import('/src/ui/progression.js'),import('/src/ui/shop.js'),import('/src/ui/overlays.js'),import('/src/data/runes.js')]);
    const profile=newProfile('0.2 isolated UI fixture');profile.guideSeen=true;
    const initial=new RunController({profile});initial.dispatch({type:'NEW_RUN',config:{seed:'v02-ui-fixture'}});
    const source=initial.getState();source.progress={stageId:'stage.02',roundIndex:0,battleNumber:4,contentBoundary:null};source.economy.gold=100;
    source.eligibility.runOwnUnlocks=['pack.svoo','rune.svoo'];source.milestoneIds=['STAGE1_CLEAR'];
    const {registry}=await import('/src/data/language/index.js');
    const controller=new RunController({initialState:source,profile}),store=new LocalStore({registry});await store.init();await store.saveProfile(profile);
    const root=document.querySelector('#app'),noop=()=>{};
    window.ui02={controller,store,profile,commands:[],results:[],show:()=>{
      document.querySelectorAll('dialog').forEach(dialog=>dialog.close());
      const current=ui02.controller.getState();
      const command=async request=>{ui02.commands.push(request);const result=ui02.controller.dispatch(request);ui02.results.push(result);if(result.ok)ui02.show();return result;};
      const overlays={onDeck:()=>openDeck(ui02.controller.getState()),onDictionary:()=>openDictionary(ui02.controller.getState()),onRecords:()=>openRecords(profile,ui02.controller.getState()),onSaves:()=>openSaves({store,profile,state:ui02.controller.getState(),onLoad:loaded=>{ui02.controller=new RunController({initialState:loaded,profile});ui02.show();}}),onLobby:noop};
      if(current.status==='STAGE_INTRO')renderIntro(root,current,{...overlays,onStart:()=>command({type:'ENTER_STAGE'})});
      else if(current.status==='SHOP')renderShop(root,current,{command,...overlays});
      else if(current.status==='STAGE_CLEAR')renderStageClear(root,current,{...overlays,onNext:noop});
      else if(current.status==='CONTENT_COMPLETE')renderResult(root,current,{onNew:noop,onSaves:overlays.onSaves,onRecords:overlays.onRecords,onLobby:noop});
      const badge=document.createElement('aside');badge.className='fixture-label';badge.textContent='0.2 UI 합성 fixture · 실제 완주 아님';badge.style='position:fixed;bottom:0;left:0;background:#eee0a8;color:#173421;padding:4px;font-size:11px;z-index:30';root.append(badge);
    }};
    ui02.show();
    ui02.fillRunes=()=>{
      const s=ui02.controller.getState(),sale=s.shop.inventory.find(item=>item.kind==='RUNE');
      const ids=Object.keys(RUNE_BY_ID).filter(id=>id!==sale.runeId).slice(0,3);
      s.runes={slotLimit:3,orderedInstanceIds:ids.map((_,index)=>`ui02.rune.${index}`),instances:Object.fromEntries(ids.map((id,index)=>[`ui02.rune.${index}`,{instanceId:`ui02.rune.${index}`,runeId:id,level:1}]))};
      ui02.controller=new RunController({initialState:s,profile});ui02.show();
    };
  });
  assert.match(await page.locator('.boss-preview').innerText(),/75%.*4형식/s);
  assert.equal((await state(page)).combat,null);const beforeEntry=await state(page);
  await screenshot(page,'stage2-intro');await page.locator('#enter-stage').click();await page.locator('.shop-page').waitFor();
  let s=await state(page);assert.equal(s.status,'SHOP');assert.deepEqual(s.rng.deck,beforeEntry.rng.deck);assert.equal(s.combat,null);
  assert.ok(s.entryGrants['stage.02'].cardInstanceIds.length<=2);await screenshot(page,'shop-entry');
  check('STAGE2_PREVIEW_ENTRY_SHOP',{granted:s.entryGrants['stage.02'].cardInstanceIds.length});
  for(const [width,height]of [[1920,1080],[1366,768],[1180,820],[1024,768]]){
    await page.setViewportSize({width,height});await screenshot(page,`shop-${width}`);
    const g=await page.evaluate(()=>({scrollWidth:document.body.scrollWidth,width:innerWidth,items:document.querySelectorAll('.shop-item').length,serviceButtons:[...document.querySelectorAll('.shop-service button')].map(button=>button.getBoundingClientRect().height)}));
    assert.ok(g.scrollWidth<=width);assert.equal(g.items,3);assert.ok(g.serviceButtons.every(h=>h>=44));check(`SHOP_LAYOUT_${width}`,g);
  }
  const fixed=JSON.stringify(await state(page));
  for(const name of ['내 덱','단어 사전','도감']){
    await page.getByRole('button',{name,exact:true}).click();await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');await page.locator('dialog[open]').waitFor({state:'hidden'});assert.equal(JSON.stringify(await state(page)),fixed);
  }
  check('SHOP_INFORMATION_NO_MUTATION');
  for(const [width,height]of [[1180,820],[1024,768]]){
    await page.setViewportSize({width,height});
    for(const kind of ['연마','제거']){
      await page.getByRole('button',{name:`${kind} 대상 선택`,exact:true}).click();await page.locator('#cancel-shop-target').waitFor();await screenshot(page,`shop-${kind==='연마'?'polish':'remove'}-${width}`);
      await page.locator('.reward-target-grid .reward-target').last().scrollIntoViewIfNeeded();
      const g=await page.evaluate(()=>{const dialog=document.querySelector('dialog').getBoundingClientRect(),cancel=document.querySelector('#cancel-shop-target').getBoundingClientRect();return {dialogBottom:dialog.bottom,viewport:innerHeight,cancelBottom:cancel.bottom,targets:document.querySelectorAll('.reward-target').length};});
      assert.ok(g.dialogBottom<=height);assert.ok(g.targets>=28);await page.locator('#cancel-shop-target').click();assert.equal(JSON.stringify(await state(page)),fixed);check(`SHOP_${kind==='연마'?'POLISH':'REMOVE'}_CANCEL_${width}`,g);
    }
  }
  await page.evaluate(()=>ui02.fillRunes());const full=JSON.stringify(await state(page));
  await page.getByText('현재 장착 룬 설명',{exact:true}).click();assert.equal(await page.locator('.shop-equipped-grid section').count(),3);assert.equal(JSON.stringify(await state(page)),full);check('SHOP_EQUIPPED_RUNE_INFORMATION');
  await page.locator('.shop-item[data-item-kind=RUNE] button').click();await page.locator('#cancel-shop-replacement').waitFor();await screenshot(page,'shop-rune-replacement');await page.locator('#cancel-shop-replacement').click();assert.equal(JSON.stringify(await state(page)),full);check('SHOP_RUNE_FULL_CANCEL');
  s=await state(page);const item=s.shop.inventory.find(item=>item.kind==='CARD');
  await page.locator(`[data-item-id="${item.itemId}"] button`).click();let after=await state(page);assert.equal(after.economy.gold,s.economy.gold-item.price);assert.equal(after.activeCardIds.length,s.activeCardIds.length+1);assert.equal(after.shop.inventory.find(i=>i.itemId===item.itemId).purchased,true);check('SHOP_CARD_PURCHASE');
  await page.getByRole('button',{name:'연마 대상 선택',exact:true}).click();const target=await page.locator('.reward-target').first().getAttribute('data-target-id');await page.locator('.reward-target').first().getByRole('button').click();after=await state(page);assert.equal(after.cardInstances[target].polishLevel,1);assert.equal(after.shop.services.POLISH.used,true);check('SHOP_POLISH_COMMIT');
  await page.getByRole('button',{name:'제거 대상 선택',exact:true}).click();const removeTarget=await page.locator('.reward-target').last().getAttribute('data-target-id');await page.locator('.reward-target').last().getByRole('button').click();if(await page.getByRole('button',{name:'확인하고 제거',exact:true}).count())await page.getByRole('button',{name:'확인하고 제거',exact:true}).click();after=await state(page);assert.ok(!after.activeCardIds.includes(removeTarget));assert.equal(after.shop.services.REMOVE.used,true);check('SHOP_REMOVE_COMMIT');
  await page.getByRole('button',{name:'저장',exact:true}).click();await page.getByRole('button',{name:'슬롯 1 저장',exact:true}).waitFor();await page.getByRole('button',{name:'슬롯 1 저장',exact:true}).click();await page.waitForFunction(()=>document.querySelector('dialog')?.textContent.includes('슬롯 1에 저장했습니다.')||document.querySelector('dialog')?.textContent.includes('완료하지 못했습니다:'));assert.match(await page.locator('dialog').innerText(),/슬롯 1에 저장했습니다\./);const saved=JSON.stringify(await state(page));await page.getByRole('button',{name:'슬롯 1 불러오기',exact:true}).click();await page.locator('.shop-page').waitFor();assert.equal(JSON.stringify(await state(page)),saved);await screenshot(page,'shop-restored');check('SHOP_SAVE_LOAD');
  await page.evaluate(async()=>{
    const [{renderCombat},{createDOMPresentation,playAttack},{snapshotFromText,analyzeSentence},{resolveAttack},{STAGE2,getEncounter}]=await Promise.all([import('/src/ui/combat.js'),import('/src/engine/presentation.js'),import('/src/engine/grammar/index.js'),import('/src/engine/stage.js'),import('/src/data/stages.js')]);
    const command=ui02.controller.dispatch({type:'LEAVE_SHOP',shopId:ui02.controller.getState().shop.shopId});if(!command.ok)throw Error(command.message);
    const s=ui02.controller.getState(),snapshot=snapshotFromText('I give my friend a good book');s.progress={stageId:'stage.02',roundIndex:3,battleNumber:7,contentBoundary:null};s.tutorial.visible=false;
    s.cardInstances=Object.fromEntries(snapshot.orderedTokens.map(token=>[token.cardInstanceId,{instanceId:token.cardInstanceId,cardDefId:token.cardDefId,polishLevel:0,specialEffectId:null}]));s.activeCardIds=Object.keys(s.cardInstances);
    s.combat.sentenceSlots=snapshot.orderedTokens.map(token=>({cardInstanceId:token.cardInstanceId,selection:{formId:token.selectionId}}));s.combat.handIds=[];s.combat.drawIds=[];s.combat.discardIds=[];s.combat.enemyState={...getEncounter('stage.02',3),maxHp:640};
    s.runes={slotLimit:3,orderedInstanceIds:['ui02.topaz'],instances:{'ui02.topaz':{instanceId:'ui02.topaz',runeId:'rune.svoo',level:1}}};
    const resolution=resolveAttack({attackId:'ui02.presentation',stage:STAGE2,sentenceSnapshot:snapshot,analysis:analyzeSentence(snapshot),cards:Object.values(s.cardInstances).map(card=>({...card,baseScore:10})),equippedRunes:Object.values(s.runes.instances),enemy:s.combat.enemyState});
    const view=renderCombat(document.querySelector('#app'),s,{locked:true}),adapter=createDOMPresentation(view.element,{hpMax:640});view.beginPresentation();
    ui02.resolution=resolution;ui02.done=null;ui02.presentation=playAttack(resolution,adapter,{speed:1}).then(result=>ui02.done=result);
    const badge=document.createElement('aside');badge.textContent='0.2 연출 합성 fixture · 실제 공격 기록 아님';badge.style='position:fixed;bottom:0;left:0;padding:4px;background:#eee0a8;color:#173421';document.querySelector('#app').append(badge);
  });
  await page.setViewportSize({width:1366,height:768});
  await page.waitForFunction(()=>document.querySelectorAll('[data-argument-role=IO]').length===2);
  // Existing cards transition their shadows for 150ms; inspect the settled role colors.
  await page.waitForFunction(()=>{const card=document.querySelector('[data-argument-role=IO]');return card&&getComputedStyle(card).boxShadow.includes('122, 216, 235');});
  const argumentColors=await page.evaluate(()=>({io:getComputedStyle(document.querySelector('[data-argument-role=IO]')).boxShadow,direct:getComputedStyle(document.querySelector('[data-argument-role=DO]')).boxShadow,harbor:document.querySelector('.game-shell').classList.contains('harbor-combat')}));
  assert.match(argumentColors.io,/122, 216, 235/);assert.match(argumentColors.direct,/237, 172, 56/);assert.equal(argumentColors.harbor,true);
  assert.equal(await page.locator('[data-argument-role=DO]').count(),3);assert.equal(await page.locator('[data-presentation=boss-veil]').getAttribute('data-active'),'true');assert.equal(await page.locator('[data-presentation=hp]').innerText(),'640 / 640');await screenshot(page,'svoo-role-ranges');check('SVOO_IO_DO_RANGE_EVENT');
  await page.waitForFunction(()=>document.querySelector('.rune-flight[data-rune-id="rune.svoo"]'));await screenshot(page,'topaz-flight');check('TOPAZ_COLORED_FLIGHT');
  await page.waitForFunction(()=>document.querySelector('[data-presentation=boss-veil]')?.dataset.active==='false');assert.equal(await page.locator('[data-presentation=hp]').innerText(),'640 / 640');await screenshot(page,'veil-release-before-impact');check('VEIL_RELEASE_EVENT_HP_BEFORE_IMPACT');
  await page.waitForFunction(()=>ui02.done,{},{timeout:20000});s=await page.evaluate(()=>({done:ui02.done,result:ui02.resolution}));assert.equal(s.done.status,'FINISHED');assert.equal(await page.locator('[data-presentation=hp]').innerText(),`${s.result.enemyHpAfter} / 640`);await screenshot(page,'veil-impact');check('VEIL_IMPACT_FINAL_HP');
  for(const [width,height]of [[1920,1080],[1366,768],[1180,820],[1024,768]])for(const handSize of [10,14]){
    await page.setViewportSize({width,height});
    await page.evaluate(async handSize=>{
      const [{renderCombat},{getEncounter}]=await Promise.all([import('/src/ui/combat.js'),import('/src/data/stages.js')]);
      const s=ui02.controller.getState(),ids=s.activeCardIds;s.progress={stageId:'stage.02',roundIndex:3,battleNumber:7,contentBoundary:null};s.tutorial.visible=false;
      s.combat.enemyState={...getEncounter('stage.02',3),maxHp:640};s.combat.rulesSnapshot.handLimit=handSize;
      s.combat.sentenceSlots=ids.slice(0,16).map(cardInstanceId=>({cardInstanceId,selection:null}));s.combat.handIds=ids.slice(16,16+handSize);s.combat.drawIds=ids.slice(16+handSize);s.combat.discardIds=[];
      s.combat.sentenceSlots.forEach(slot=>{s.cardInstances[slot.cardInstanceId].polishLevel=3;});
      const runeIds=['rune.svc','rune.polished','rune.adverbs'];s.runes={slotLimit:3,orderedInstanceIds:runeIds,instances:Object.fromEntries(runeIds.map(id=>[id,{instanceId:id,runeId:id,level:3}]))};
      renderCombat(document.querySelector('#app'),s,{command:()=>{},openOverlay:()=>{}});
      const badge=document.createElement('aside');badge.textContent='항구 최대 카드 UI 합성 fixture';badge.style='position:fixed;top:0;left:0;background:#eee0a8;color:#173421;font-size:11px';document.querySelector('#app').append(badge);
    },handSize);
    const g=await page.evaluate(()=>({width:document.body.scrollWidth,height:document.body.scrollHeight,actionBottom:document.querySelector('.combat-actions').getBoundingClientRect().bottom,handTop:document.querySelector('.hand-section').getBoundingClientRect().top,exchangeBottom:document.querySelector('.exchange-row').getBoundingClientRect().bottom,handCards:document.querySelectorAll('.hand-cards .word-card').length,statusFont:getComputedStyle(document.querySelector('.status-nav button')).fontSize,runeFont:getComputedStyle(document.querySelector('.rune-effect')).fontSize}));
    if(g.height>height)await screenshot(page,`failed-capacity-${width}-${handSize}`);
    assert.equal(g.handCards,handSize);assert.ok(g.width<=width);assert.ok(g.height<=height,JSON.stringify({width,height,handSize,...g}));assert.ok(g.actionBottom<=g.handTop);assert.ok(g.exchangeBottom<=height);assert.equal(g.statusFont,'14px');assert.ok(parseFloat(g.runeFont)>=12);
    await page.locator('.hand-cards .word-card').last().scrollIntoViewIfNeeded();await page.locator('.rune-slot').last().scrollIntoViewIfNeeded();
    check(`HARBOR_CAPACITY_${width}_${handSize}`,g);if(handSize===14&&[1366,1024].includes(width))await screenshot(page,`harbor-capacity-${width}-hand14`);
  }
  await page.evaluate(()=>{const s=ui02.controller.getState();s.status='CONTENT_COMPLETE';s.progress={stageId:'stage.02',roundIndex:3,battleNumber:7,contentBoundary:'STAGE2_END'};ui02.controller.getState=()=>structuredClone(s);ui02.show();});
  assert.match(await page.locator('.result-page').innerText(),/전달의 항구 완료.*0\.2 제공 구간.*7전투/s);await screenshot(page,'stage2-complete-synthetic');check('STAGE2_COMPLETION_RENDER');
  assert.deepEqual(report.errors,[]);report.status='PASS';
}catch(error){report.status='FAIL';report.error=error.stack;throw error;}
finally{await writeFile(path.join(evidence,'v02-ui-browser.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({status:report.status,checks:report.checks.length,captures:report.screenshots.length}));}
