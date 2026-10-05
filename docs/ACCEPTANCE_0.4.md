# 0.4 P001–P117 실제 검사 대응표

기대사항 원문은 보존하고 이번 실행 증거를 별도로 기록했다. PASS의 범위는 아래 검사 방법에 한정된다. 지정 상태·합성 산술·명령 원정·production UI는 서로 대체하지 않는다. 원본 S003 산술 차이는 TEST_REPORT_0.4에 공개한다.

| ID | 결과 | 기대사항 | 실제 근거 / 방법 |
|---|---|---|---|
| P001 | PASS | 작업 시작 origin/main과 실제 0.3 포함 여부, dirty 보존, 독립 브랜치가 기록된다. | `docs/IMPLEMENTATION_PLAN_0.4.md` · `Git base db9f6ca / branch codex/v0.4-sky-islands-operations` — 작업 전 main/0.3/clean 확인, A 기준455검사, 별도브랜치 |
| P002 | PASS | 게임은 실제 총17전투를 제공하고 Stage4 끝은 STAGE4_END이며 전체스토리 클리어가 아니다. | `tests/v04-progression.test.js` · `tests/v04-foundation.test.js` · `tests/v04-boundaries.test.js` · `docs/validation/v0.4/production-browser.json` — 지정 경계+변경 전 golden+실습40/126+실제17 UI |
| P003 | PASS | Stage1/2/3 HP·배율·골렘3부위·실습40/126·드로우/교환/6턴/16장 한도를 보존한다. | `tests/v04-progression.test.js` · `tests/v04-foundation.test.js` · `tests/v04-boundaries.test.js` · `docs/validation/v0.4/production-browser.json` — 지정 경계+변경 전 golden+실습40/126+실제17 UI |
| P004 | PASS | Syntax Atlas/신택스 아틀라스 표시가 로비·전투·결과·탭·새안내에서 통일된다. | `tests/sky-foundation-browser.mjs` · `src/ui/lobby.js` · `src/ui/progression.js` · `index.html` — 실제 제목/로비 캡처 및 전투/결과 표시 검토 |
| P005 | PASS | 기존 저장소 URL/base/IndexedDB/프로필/카드 ID가 이름변경 때문에 바뀌지 않는다. | `vite.config.js` · `src/services/localStore.js` · `package.json` · `docs/PATCH_NOTES_0.4_KO.md` — 기준 main diff: base/DB/ID/의존성 보존, 범위 밖 기능 없음 |
| P006 | PASS | 외부 API·새 프레임워크·Stage5·대규모룬개편·운영강화·26장덱을 범위 밖으로 유지한다. | `vite.config.js` · `src/services/localStore.js` · `package.json` · `docs/PATCH_NOTES_0.4_KO.md` — 기준 main diff: base/DB/ID/의존성 보존, 범위 밖 기능 없음 |
| P007 | PASS | 현재/원형 전체폭, 과거 전체폭, p.p./-ing 마지막두칸이 실제형태메뉴에 반영된다. | `tests/sky-foundation-browser.mjs` · `tests/v04-language.test.js` · `tests/v03-language.test.js` — 3해상도 형태배치, be8형태 keyboard/touch, 실제 형태/동사구 회귀 |
| P008 | PASS | be의 표시만 원형으로 줄고 I be happy 형태오류와 will be 정상판정은 유지된다. | `tests/sky-foundation-browser.mjs` · `tests/v04-language.test.js` · `tests/v03-language.test.js` — 3해상도 형태배치, be8형태 keyboard/touch, 실제 형태/동사구 회귀 |
| P009 | PASS | be/am/is/are·was/were·been/being의 그룹과 클릭·키보드·터치선택이 정확하다. | `tests/sky-foundation-browser.mjs` · `tests/v04-language.test.js` · `tests/v03-language.test.js` — 3해상도 형태배치, be8형태 keyboard/touch, 실제 형태/동사구 회귀 |
| P010 | PASS | had/read 등 철자가 같은 과거/과거분사 선택의 실제 formId와 역할을 보존한다. | `tests/sky-foundation-browser.mjs` · `tests/v04-language.test.js` · `tests/v03-language.test.js` — 3해상도 형태배치, be8형태 keyboard/touch, 실제 형태/동사구 회귀 |
| P011 | PASS | 1024×768 가로에서 형태메뉴·하단행동·긴단어·스크롤이 잘리지 않는다. | `tests/sky-foundation-browser.mjs` · `tests/v04-language.test.js` · `tests/v03-language.test.js` — 3해상도 형태배치, be8형태 keyboard/touch, 실제 형태/동사구 회귀 |
| P012 | PASS | 새 시작덱은 품사6/4/8/3/2/3/2의28장 WORD만이며 운영·접속사는 없다. | `tests/v04-foundation.test.js` · `tools/simulate-sky-decks.js` · `docs/validation/v0.4/decks.json` — 28장/슬롯/4모드/사본상한/실제 witness 및10000덱 |
| P013 | PASS | 동사8장은 be2/SV2/have고정1/SVO2/MULTI1이고 기존 사본상한·다양성을 만족한다. | `tests/v04-foundation.test.js` · `tools/simulate-sky-decks.js` · `docs/validation/v0.4/decks.json` — 28장/슬롯/4모드/사본상한/실제 witness 및10000덱 |
| P014 | PASS | I/you/they와he또는she, a/a/the·전치사·부사역할이 보존된다. | `tests/v04-foundation.test.js` · `tools/simulate-sky-decks.js` · `docs/validation/v0.4/decks.json` — 28장/슬롯/4모드/사본상한/실제 witness 및10000덱 |
| P015 | PASS | 네 어휘모드 모두 have를 보장하면서 실제 1~3형식 first-hand witness가 성립한다. | `tests/v04-foundation.test.js` · `tools/simulate-sky-decks.js` · `docs/validation/v0.4/decks.json` — 28장/슬롯/4모드/사본상한/실제 witness 및10000덱 |
| P016 | PASS | be/have/you/I만 새0.4에서고급이며 base10·연마값·시작자격은 유지된다. | `tests/v04-foundation.test.js` · `tools/simulate-sky-decks.js` · `docs/validation/v0.4/decks.json` — 28장/슬롯/4모드/사본상한/실제 witness 및10000덱 |
| P017 | PASS | 첫 실습의 고정덱은 바뀌지 않고 완료후 새 have고정 정상28장과그RNG를 정확히 복원한다. | `tests/v04-boundaries.test.js` · `tests/e2e.mjs` — 실습 실제40/126, 주차된28장/RNG복원, productionUI |
| P018 | PASS | 옛0.3의 생성/상품희귀도/카드사본/저장RNG는 기존golden과 일치한다. | `tests/v04-foundation.test.js` · `tests/fixtures/v04-legacy-030-golden.json` — 변경 전에 캡처한0.3덱8/보상56/상점8/공격12 deepEqual |
| P019 | PASS | 보급/탐색 두종류가 각각고급/희귀로 정의되며 다른운영효과는 없다. | `tests/v04-foundation.test.js` · `tests/v04-operations.test.js` · `tests/sky-operations-browser.mjs` — 명시타입/무lexeme/가격, 모든조합입구/실제드래그거절 |
| P020 | PASS | OPERATION에 가짜lexeme·품사·단어base점수가 없고 WORD와 명시적으로 구분된다. | `tests/v04-foundation.test.js` · `tests/v04-operations.test.js` · `tests/sky-operations-browser.mjs` — 명시타입/무lexeme/가격, 모든조합입구/실제드래그거절 |
| P021 | PASS | 운영카드는 ADD/DRAG/SWAP/SET_FORM 모든입구에서 조합대에 들어갈수없다. | `tests/v04-foundation.test.js` · `tests/v04-operations.test.js` · `tests/sky-operations-browser.mjs` — 명시타입/무lexeme/가격, 모든조합입구/실제드래그거절 |
| P022 | PASS | 운영카드가 오염Snapshot에 들어가면 무소모무결성오류이며 조용히strip하지 않는다. | `tests/v04-boundaries.test.js` — 오염snapshot SUBMIT 무소모, 조용한strip없음 |
| P023 | PASS | 손패에서만 사용하고 전투편집외/공격연출/실습/상점/대상창중 사용은 막는다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P024 | PASS | 사용은 턴·교환·적HP·문장점수·문법실적·turnIndex/actionSequence를 바꾸지 않는다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P025 | PASS | 사용한 실제사본이 EXHAUSTED에1번만 남고 owned activeCardIds에서 삭제되지 않는다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P026 | PASS | 보급 사용시 본인을 먼저제외한제안상태에서 기존draw2를 수행해 자신을뽑지 않는다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P027 | PASS | 보급의 DRAW 부족시 기존DISCARD만 재셔플하고 EXHAUSTED·HAND·SENTENCE는 제외한다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P028 | PASS | 손패10/10에서스킬이빠진공간에1장, 9/10이면2장으로 실제한도를 준수한다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P029 | PASS | 받을카드가0이면보급소모없음,1이면실제1장과미리보기수치가일치한다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P030 | PASS | 보급으로다른운영카드를뽑아도각사본의사용1회와유한종료를보장한다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P031 | PASS | 탐색은 DRAW의WORD만보여주고 이름순정렬·연마별사본을 구분한다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P032 | PASS | 탐색은 DISCARD/HAND/SENTENCE/EXHAUSTED/미보유카드/운영을선택할수없다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P033 | PASS | 탐색후 나머지DRAW의상대순서·deckRNG가그대로이며 카드1장만이동한다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P034 | PASS | 탐색선택취소/목록재열기/빈대상은스킬·RNG·턴·undo를보존한다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P035 | PASS | 탐색stale revision/사라진target/다른전투click/중복확정을무소모또는멱등처리한다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P036 | PASS | 성공스킬은Undo로복원되지않고 실패/취소에서는이전편집Undo가보존된다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P037 | PASS | 스킬을교환으로버리면효과는없고기존교환1회·교환장수드로우가작동한다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P038 | PASS | 다음전투시모든미제거스킬사본이정상덱에복귀하고전투별사용완료상태가초기화된다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P039 | PASS | 다섯카드영역의배타성·완전성·종류제약을Controller와저장에서동일하게검사한다. | `tests/v04-operations.test.js` · `tests/v04-boundaries.test.js` · `src/game/operations.js` · `src/game/operationHistory.js` — 첨부14운영모델+실제controller 성공/실패/취소/RNG/카드보존/복귀/저장변조 검사 |
| P040 | PASS | 카드사용애니메이션skip/watchdog/hidden탭/리렌더후에도효과가1번만적용된다. | `tests/v04-boundaries.test.js` · `src/ui/operationPresentation.js` — 감소/abort/hidden/재표시/1700ms렌더정지 watchdog 후같은영수증1회정산 |
| P041 | PASS | 스킬은연마후보에서제외하고제거는가능하며무효강화비용/횟수소모가없다. | `tests/v04-operations.test.js` · `tests/sky-operations-browser.mjs` · `tests/sky-islands-browser.mjs` — 연마거절/제거/보상상점/다섯영역/사전/실제IndexedDB |
| P042 | PASS | 운영카드도draw/discard/내덱/보상/상점/저장/타입순회에서undefined나NOUN fallback없이작동한다. | `tests/v04-operations.test.js` · `tests/sky-operations-browser.mjs` · `tests/sky-islands-browser.mjs` — 연마거절/제거/보상상점/다섯영역/사전/실제IndexedDB |
| P043 | PASS | 흰색/은색테두리·무품사색·동일카드크기·운영/이름/효과/전투당1회 표시를확인한다. | `tests/sky-operations-browser.mjs` — 3해상도×10/14장,44px버튼,실제tap/설명/사용/취소/진입VFX; 물리기기·음향청취별도NOT RUN |
| P044 | PASS | 사용버튼·설명클릭·버리기체크영역이구분되고터치로실수발동/조합대이동이없다. | `tests/sky-operations-browser.mjs` — 3해상도×10/14장,44px버튼,실제tap/설명/사용/취소/진입VFX; 물리기기·음향청취별도NOT RUN |
| P045 | PASS | 사사삭사라짐과실제받은카드/개수표시가동기화되며감소효과/음소거를준수한다. | `tests/sky-operations-browser.mjs` — 3해상도×10/14장,44px버튼,실제tap/설명/사용/취소/진입VFX; 물리기기·음향청취별도NOT RUN |
| P046 | PASS | 기존50/10/5/15/10/10 및 보스0/10/10/25/5/50외부확률표를보존한다. | `tests/v04-operations.test.js` · `tests/v04-foundation.test.js` · `tests/rewards.test.js` · `src/game/rewards.js` · `src/game/operationPool.js` — 기존외부확률/golden보존,220시드운영후보두등급/최대1/보호슬롯,기존CARD스킵/멱등회귀 |
| P047 | PASS | 20%운영내부추첨은고급/희귀 GENERAL/WILDCARD에만적용되고팝업당최대1칸이다. | `tests/v04-operations.test.js` · `tests/v04-foundation.test.js` · `tests/rewards.test.js` · `src/game/rewards.js` · `src/game/operationPool.js` — 기존외부확률/golden보존,220시드운영후보두등급/최대1/보호슬롯,기존CARD스킵/멱등회귀 |
| P048 | PASS | 지역재료보호슬롯·첫일반카드보상·매원정첫룬예외가운영에대체되지않는다. | `tests/v04-operations.test.js` · `tests/v04-foundation.test.js` · `tests/rewards.test.js` · `src/game/rewards.js` · `src/game/operationPool.js` — 기존외부확률/golden보존,220시드운영후보두등급/최대1/보호슬롯,기존CARD스킵/멱등회귀 |
| P049 | PASS | 운영없는/타깃없는보상도항상유효3칸·취소복원·공개후고정을만족한다. | `tests/v04-operations.test.js` · `tests/v04-foundation.test.js` · `tests/rewards.test.js` · `src/game/rewards.js` · `src/game/operationPool.js` — 기존외부확률/golden보존,220시드운영후보두등급/최대1/보호슬롯,기존CARD스킵/멱등회귀 |
| P050 | PASS | CARD종류에운영이포함되었을때도skipGold+3과한번정산이유지된다. | `tests/v04-operations.test.js` · `tests/v04-foundation.test.js` · `tests/rewards.test.js` · `src/game/rewards.js` · `src/game/operationPool.js` — 기존외부확률/golden보존,220시드운영후보두등급/최대1/보호슬롯,기존CARD스킵/멱등회귀 |
| P051 | PASS | Stage2상품1룬/2카드,Stage4상품2룬/3카드가정상생성된다. | `tests/v04-progression.test.js` · `tests/v04-operations.test.js` · `tests/sky-islands-browser.mjs` · `tests/e2e.mjs` — 상점1/2재고/독립ID/서비스/유료제거6→8/가격/중복/실제구매복원 |
| P052 | PASS | 두상점은독립shop/itemID와서비스사용기록을갖고closed앞상점은재생성되지않는다. | `tests/v04-progression.test.js` · `tests/v04-operations.test.js` · `tests/sky-islands-browser.mjs` · `tests/e2e.mjs` — 상점1/2재고/독립ID/서비스/유료제거6→8/가격/중복/실제구매복원 |
| P053 | PASS | 각상점연마1/제거1회,누적유료제거가격,재화부족/취소/중복구매처리를확인한다. | `tests/v04-progression.test.js` · `tests/v04-operations.test.js` · `tests/sky-islands-browser.mjs` · `tests/e2e.mjs` — 상점1/2재고/독립ID/서비스/유료제거6→8/가격/중복/실제구매복원 |
| P054 | PASS | 보급10/탐색14,일반가격표유지,무효상품/옛snapshot희귀도불일치로구매가망가지지않는다. | `tests/v04-progression.test.js` · `tests/v04-operations.test.js` · `tests/sky-islands-browser.mjs` · `tests/e2e.mjs` — 상점1/2재고/독립ID/서비스/유료제거6→8/가격/중복/실제구매복원 |
| P055 | PASS | and/but/or/because/when/if·기존that·think/know/say가명시Frame/형태/뜻을갖는다. | `tests/v04-language.test.js` · `src/data/language/skyLanguage.js` — 첨부68파서사례+어휘치환+구병렬+전체coverage+대명사격/일치 |
| P056 | PASS | 신규단어는STARTER에서제외하되후보해금전정상기본문장판정이가능하다. | `tests/v04-language.test.js` · `src/data/language/skyLanguage.js` — 첨부68파서사례+어휘치환+구병렬+전체coverage+대명사격/일치 |
| P057 | PASS | 두독립절and/but/or가전체입력을소비하며각절Frame·역할·time증거를남긴다. | `tests/v04-language.test.js` · `src/data/language/skyLanguage.js` — 첨부68파서사례+어휘치환+구병렬+전체coverage+대명사격/일치 |
| P058 | PASS | You and I/He and she/복합명사주어의일치와대명사격을정확히다룬다. | `tests/v04-language.test.js` · `src/data/language/skyLanguage.js` — 첨부68파서사례+어휘치환+구병렬+전체coverage+대명사격/일치 |
| P059 | PASS | 목적어NP/AP/기본동사구병렬을정상으로받되독립절두개로허위표시하지않는다. | `tests/v04-language.test.js` · `src/data/language/skyLanguage.js` — 첨부68파서사례+어휘치환+구병렬+전체coverage+대명사격/일치 |
| P060 | PASS | 단어병렬의허용역할과부분구조실패를구분해쓰레기tail을점수에포함하지않는다. | `tests/v04-language.test.js` · `src/data/language/skyLanguage.js` — 첨부68파서사례+어휘치환+구병렬+전체coverage+대명사격/일치 |
| P061 | PASS | because/when/if의주절뒤·앞배치를모두지원하고내부동사구를실제로검사한다. | `tests/v04-language.test.js` · `src/data/language/skyLanguage.js` — 첨부68파서사례+어휘치환+구병렬+전체coverage+대명사격/일치 |
| P062 | PASS | 단독종속절/주어누락/접속사뒤핵심실패는실제소모0피해로끝난다. | `tests/v04-score-shield.test.js` · `tests/grammar-learning-browser.mjs` · `tests/e2e.mjs` — 실제핵심실패0피해와턴/카드소모,단독종속절/불완전뒷절파서검사 |
| P063 | PASS | 새if교안은일반조건과가정법을혼동하지않고if+will/과거를무조건오답으로단정하지않는다. | `docs/EDUCATION_REVIEW_0.4.md` · `tests/v04-language.test.js` · `src/data/grammarGuideData.js` — 고정교안검토+if실제파싱; Cambridge조건절자료. 교사검수NOT RUN |
| P064 | PASS | that-내용절이허용된동사에서정상이며절전체를목적어로표시한다. | `tests/v04-language.test.js` · `tests/sky-islands-browser.mjs` — that역할/생략/불허Frame/관계gap/시간중첩/등위3절/16장bounded실제파서 |
| P065 | PASS | 생략된that명사절도실제구조판정을거치고해금된연결보너스를받을수있다. | `tests/v04-language.test.js` · `tests/sky-islands-browser.mjs` — that역할/생략/불허Frame/관계gap/시간중첩/등위3절/16장bounded실제파서 |
| P066 | PASS | 지시that/관계that/접속that를역할로구분하고같은카드보너스를중복하지않는다. | `tests/v04-language.test.js` · `tests/sky-islands-browser.mjs` — that역할/생략/불허Frame/관계gap/시간중첩/등위3절/16장bounded실제파서 |
| P067 | PASS | that내용절의목적어누락을관계절gap으로구제하지않고불허동사에Frame을열지않는다. | `tests/v04-language.test.js` · `tests/sky-islands-browser.mjs` — that역할/생략/불허Frame/관계gap/시간중첩/등위3절/16장bounded실제파서 |
| P068 | PASS | 현재완료/과거/미래진행·관계절/준동사와새연결을혼합한필수예문을지원한다. | `tests/v04-language.test.js` · `tests/sky-islands-browser.mjs` — that역할/생략/불허Frame/관계gap/시간중첩/등위3절/16장bounded실제파서 |
| P069 | PASS | 등위3절·명사절+부사절·관계절+등위절을16장안에서bounded분석한다. | `tests/v04-language.test.js` · `tests/sky-islands-browser.mjs` — that역할/생략/불허Frame/관계gap/시간중첩/등위3절/16장bounded실제파서 |
| P070 | PASS | 동일형태/여러Sense/중의구조의대표분석이룬·해금·등록순서에의존하지않는다. | `tests/v04-language.test.js` · `tests/v04-score-shield.test.js` — 등록배열·인덱스순서역전deepEqual,미해금/해금원본분석동일 |
| P071 | PASS | known/knew/said/thought 등새형태를현재시제처럼오해하지않고know기본진행예외를점검한다. | `tests/v04-language.test.js` · `tests/v04-score-shield.test.js` · `tests/v04-boundaries.test.js` — 불규칙형태/know진행-10/구두점/16장/중복사본기술실패/holdout양음성 |
| P072 | PASS | 구두점은표시서식이고없다고감점하거나물리카드로추가하지않는다. | `tests/v04-language.test.js` · `tests/v04-score-shield.test.js` · `tests/v04-boundaries.test.js` — 불규칙형태/know진행-10/구두점/16장/중복사본기술실패/holdout양음성 |
| P073 | PASS | 실제범위초과/예외는무소모기술복구,지원필수사례는그상태에머물지않는다. | `tests/v04-language.test.js` · `tests/v04-score-shield.test.js` · `tests/v04-boundaries.test.js` — 불규칙형태/know진행-10/구두점/16장/중복사본기술실패/holdout양음성 |
| P074 | PASS | 어휘치환hold-out와양성/음성쌍을검사하여예문whitelist와무조건통과가없음을확인한다. | `tests/v04-language.test.js` · `tests/v04-score-shield.test.js` · `tests/v04-boundaries.test.js` — 불규칙형태/know진행-10/구두점/16장/중복사본기술실패/holdout양음성 |
| P075 | PASS | 새절/구보너스이외의0.3점수·시간·룬값과단계별FLOOR를정확히유지한다. | `tests/v04-score-shield.test.js` · `tests/v04-foundation.test.js` — 단계별정수타임라인/원본0.3공격golden/기준절/각효과1회/해금분리. S003원본395≠보존정책401 차이공개 |
| P076 | PASS | 완전문장보너스는제출전체에한번이며한절오류가있으면+30이없다. | `tests/v04-score-shield.test.js` · `tests/v04-foundation.test.js` — 단계별정수타임라인/원본0.3공격golden/기준절/각효과1회/해금분리. S003원본395≠보존정책401 차이공개 |
| P077 | PASS | 독립절등위는왼쪽첫절,종속/내용절은바깥주절을점수기준으로일관적용한다. | `tests/v04-score-shield.test.js` · `tests/v04-foundation.test.js` — 단계별정수타임라인/원본0.3공격golden/기준절/각효과1회/해금분리. S003원본395≠보존정책401 차이공개 |
| P078 | PASS | 두등위주절을전체1형식등으로교육오분류하지않고기준절라벨을명확히한다. | `tests/v04-score-shield.test.js` · `tests/v04-foundation.test.js` — 단계별정수타임라인/원본0.3공격golden/기준절/각효과1회/해금분리. S003원본395≠보존정책401 차이공개 |
| P079 | PASS | 연결x1.6·구+10은서로다른구조에만각1회,여러접속사/중복AST로무한중첩하지않는다. | `tests/v04-score-shield.test.js` · `tests/v04-foundation.test.js` — 단계별정수타임라인/원본0.3공격golden/기준절/각효과1회/해금분리. S003원본395≠보존정책401 차이공개 |
| P080 | PASS | 후속절문형배율·시간같은계열·modifiers·단어base중복계산이없다. | `tests/v04-score-shield.test.js` · `tests/v04-foundation.test.js` — 단계별정수타임라인/원본0.3공격golden/기준절/각효과1회/해금분리. S003원본395≠보존정책401 차이공개 |
| P081 | PASS | 새Pack잠김/해금에따른기본문장/효과만차이나고영어정오·Frame은동일하다. | `tests/v04-score-shield.test.js` · `tests/v04-foundation.test.js` — 단계별정수타임라인/원본0.3공격golden/기준절/각효과1회/해금분리. S003원본395≠보존정책401 차이공개 |
| P082 | PASS | 운영카드는어떤경로에서도base/철/비취/호박/운석단어수/문법실적에포함되지않는다. | `tests/v04-foundation.test.js` · `tests/v04-boundaries.test.js` · `tests/v04-operations.test.js` — 운영카드조합입구와오염snapshot거절; WORD만파서/점수기여 |
| P083 | PASS | Stage4지역x1.25는정상절연결에한번,단어병렬/관계that만으로발동하지않는다. | `tests/v04-score-shield.test.js` · `src/engine/skyShield.js` — 실제문법→점수→룬→지역→보호막 산술,320×2/360×2,생략that/관계/구차이,고점원킬 |
| P084 | PASS | 문지기의시작보호막은피해x0.5이며다른면역/구간cap/강제최소공격이없다. | `tests/v04-score-shield.test.js` · `src/engine/skyShield.js` — 실제문법→점수→룬→지역→보호막 산술,320×2/360×2,생략that/관계/구차이,고점원킬 |
| P085 | PASS | 유효접속사절공략첫공격부터감쇠없이해제되고이후비접속사공격에도재생하지않는다. | `tests/v04-score-shield.test.js` · `src/engine/skyShield.js` — 실제문법→점수→룬→지역→보호막 산술,320×2/360×2,생략that/관계/구차이,고점원킬 |
| P086 | PASS | 카드철자만접속사/지시that/관계that/구and는해제하지않는다. | `tests/v04-score-shield.test.js` · `src/engine/skyShield.js` — 실제문법→점수→룬→지역→보호막 산술,320×2/360×2,생략that/관계/구차이,고점원킬 |
| P087 | PASS | 생략that명사절은정상영어와연결점수로인정하지만실제접속사없는공격의보호막은유지된다. | `tests/v04-score-shield.test.js` · `src/engine/skyShield.js` — 실제문법→점수→룬→지역→보호막 산술,320×2/360×2,생략that/관계/구차이,고점원킬 |
| P088 | PASS | 작은오류가있는정상연결은부분감점후공략가능,핵심실패/기술오류는해제불가다. | `tests/v04-score-shield.test.js` · `src/engine/skyShield.js` — 실제문법→점수→룬→지역→보호막 산술,320×2/360×2,생략that/관계/구차이,고점원킬 |
| P089 | PASS | 7장SVC320두번과7장SVO360두번으로HP640을깎는독립산술을검사한다. | `tests/v04-score-shield.test.js` · `src/engine/skyShield.js` — 실제문법→점수→룬→지역→보호막 산술,320×2/360×2,생략that/관계/구차이,고점원킬 |
| P090 | PASS | 운석Lv1·좋은룬의한방공략을허용하고동적적HP상향/숨은피해cap이없다. | `tests/v04-score-shield.test.js` · `src/engine/skyShield.js` — 실제문법→점수→룬→지역→보호막 산술,320×2/360×2,생략that/관계/구차이,고점원킬 |
| P091 | PASS | 보스반감·문법실패·정확성0의안내와실제위력/피해/오버킬을구분한다. | `tests/sky-islands-browser.mjs` · `tests/e2e.mjs` · `tests/v04-score-shield.test.js` — 확정결과표시/abort수렴/초과피해·0피해이유/프로필1회기록 |
| P092 | PASS | 보호막이펙트·HP·처치/재화가revision/attackID당한번만반영된다. | `tests/sky-islands-browser.mjs` · `tests/e2e.mjs` · `tests/v04-score-shield.test.js` — 확정결과표시/abort수렴/초과피해·0피해이유/프로필1회기록 |
| P093 | PASS | 새연결문장안시간근거가골렘과맞지만한공격한부위·초과이월없음이보존된다. | `tests/v04-score-shield.test.js` · `tests/v04-progression.test.js` · `tests/e2e.mjs` — 연결문장과과거/미래증거,2000공격중활성240만처리,실제UI골렘3부위 |
| P094 | PASS | 마지막턴처치승리우선·비처치패배·0피해후정상드로우/소모가이전규칙대로다. | `tests/grammar-learning-browser.mjs` · `tests/v04-score-shield.test.js` · `tests/e2e.mjs` — 마지막실패턴패배/실제0피해후소모·드로우 및기존controller승리우선회귀 |
| P095 | PASS | 몬스터다섯이름/순서/지역테마/HP가명세와일치하고하늘섬이선형진행을유지한다. | `src/data/stage4.js` · `tests/v04-progression.test.js` · `tests/sky-islands-browser.mjs` · `tests/e2e.mjs` — 적5이름/HP검토+선형17경계+16입장보유조합/재지급거절+지역완료1회/STAGE4_END |
| P096 | PASS | Stage3완료4룬칸과새Pack→보스보상→Stage4예고→입장→상점→4-1이이어진다. | `src/data/stage4.js` · `tests/v04-progression.test.js` · `tests/sky-islands-browser.mjs` · `tests/e2e.mjs` — 적5이름/HP검토+선형17경계+16입장보유조합/재지급거절+지역완료1회/STAGE4_END |
| P097 | PASS | 없는and/부사절대표/내용동사대표/that만0~4장주고소유/사전이력을혼동하지않는다. | `src/data/stage4.js` · `tests/v04-progression.test.js` · `tests/sky-islands-browser.mjs` · `tests/e2e.mjs` — 적5이름/HP검토+선형17경계+16입장보유조합/재지급거절+지역완료1회/STAGE4_END |
| P098 | PASS | 입장재진입/로드/카드제거후자동지급이없고기존be/have/will공급이보존된다. | `src/data/stage4.js` · `tests/v04-progression.test.js` · `tests/sky-islands-browser.mjs` · `tests/e2e.mjs` — 적5이름/HP검토+선형17경계+16입장보유조합/재지급거절+지역완료1회/STAGE4_END |
| P099 | PASS | 일반4전투권장주제는강제조건이아니며다른문법/빌드도정상공략한다. | `src/data/stage4.js` · `tests/v04-progression.test.js` · `tests/sky-islands-browser.mjs` · `tests/e2e.mjs` — 적5이름/HP검토+선형17경계+16입장보유조합/재지급거절+지역완료1회/STAGE4_END |
| P100 | PASS | 4번째슬롯·상점/보상재화/Stage4클리어는중복정산없이기록되고전체클리어해금이없다. | `src/data/stage4.js` · `tests/v04-progression.test.js` · `tests/sky-islands-browser.mjs` · `tests/e2e.mjs` — 적5이름/HP검토+선형17경계+16입장보유조합/재지급거절+지역완료1회/STAGE4_END |
| P101 | PASS | 내덱WORD뜻/운영설명구역과DRAW/DISCARD/EXHAUSTED를안전하게조회한다. | `tests/sky-operations-browser.mjs` · `tests/sky-islands-browser.mjs` · `tests/grammar-learning-browser.mjs` — 사전/사용완료/구조그룹/내용절전체O+내부역할/내부ID·번역없는실제DOM |
| P102 | PASS | 도감의밝은영어·붉은피드백·번역제거·고정예문UI제거·내부코드숨김을보존한다. | `tests/sky-operations-browser.mjs` · `tests/sky-islands-browser.mjs` · `tests/grammar-learning-browser.mjs` — 사전/사용완료/구조그룹/내용절전체O+내부역할/내부ID·번역없는실제DOM |
| P103 | PASS | 명사절전체목적어·내부역할·두등위절의대등관계를실제증거로표시한다. | `tests/sky-operations-browser.mjs` · `tests/sky-islands-browser.mjs` · `tests/grammar-learning-browser.mjs` — 사전/사용완료/구조그룹/내용절전체O+내부역할/내부ID·번역없는실제DOM |
| P104 | PASS | 운영사용/실습/기술실패를문법정상예문·최고공격실적으로등록하지않는다. | `tests/v04-boundaries.test.js` · `tests/v04-score-shield.test.js` · `tests/guided-tutorial.test.js` — 운영/실습실적배제,실패후profile직렬화,기술실패무거래 |
| P105 | PASS | 새0.4SHOP2·고정보상·안전전투저장에운영사용완료·상품·해금·RNG가정확히복원된다. | `tests/sky-islands-browser.mjs` · `tests/v04-foundation.test.js` · `tests/v04-progression.test.js` · `tests/e2e.mjs` — 실제IndexedDB3버전슬롯SHOP2/EXHAUSTED/해금격리+구버전golden/원정경계회귀 |
| P106 | PASS | 옛0.1~0.3원정은원래언어·수치·희귀도·상품·HP·종료경계를유지한다. | `tests/sky-islands-browser.mjs` · `tests/v04-foundation.test.js` · `tests/v04-progression.test.js` · `tests/e2e.mjs` — 실제IndexedDB3버전슬롯SHOP2/EXHAUSTED/해금격리+구버전golden/원정경계회귀 |
| P107 | PASS | 시작덱변경은새0.4에만적용하고기존프로필·도감·튜토리얼완료기록을유지한다. | `tests/sky-islands-browser.mjs` · `tests/v04-foundation.test.js` · `tests/v04-progression.test.js` · `tests/e2e.mjs` — 실제IndexedDB3버전슬롯SHOP2/EXHAUSTED/해금격리+구버전golden/원정경계회귀 |
| P108 | PASS | 서로다른슬롯의신규해금·도감열람으로진행중원정의공개후보/RNG가변하지않는다. | `tests/sky-islands-browser.mjs` · `tests/v04-foundation.test.js` · `tests/v04-progression.test.js` · `tests/e2e.mjs` — 실제IndexedDB3버전슬롯SHOP2/EXHAUSTED/해금격리+구버전golden/원정경계회귀 |
| P109 | PASS | 형태메뉴/스킬/입력락/상점2/4룬/확장손패가데스크톱·태블릿가로캡처에서사용가능하다. | `tests/sky-foundation-browser.mjs` · `tests/sky-operations-browser.mjs` · `tests/sky-islands-browser.mjs` · `tests/ui-browser.mjs` — 1366×768/1280×800/1024×768,16조합/10·14손패/4룬/SHOP2/44px컨트롤 |
| P110 | PASS | 최종npm test/build/data검증과변경영역브라우저를실제실행하고경로·결과·미실행을기록한다. | `docs/validation/v0.4/commands.json` · `docs/TEST_REPORT_0.4.md` — 실제종료코드0인단위/데이터/build/공식browser/E2E,중간FAIL분리 |
| P111 | PASS | 새10,000seed시작덱검사와레거시golden은분리하고합성상태를실제원정으로보고하지않는다. | `docs/validation/v0.4/decks.json` · `tests/v04-foundation.test.js` — 새10000seed와독립0.3golden구분 |
| P112 | PASS | production17전투완주·상점2·골렘·문지기·새문법사용을실제UI에서검증한다. | `tests/e2e.mjs` · `docs/validation/v0.4/production-browser.json` — production1366일반효과/새프로필/37공격/17전투/2상점/골렘/연결/문지기/오프라인 |
| P113 | PASS | 스킬실제획득여부·사용·취소·회복검사를실제/합성별로구분하고조건부증거를남긴다. | `tests/sky-operations-browser.mjs` · `tests/v04-operations.test.js` · `docs/validation/v0.4/production-browser.json` — 해당자연완주운영사용0회. 보급/탐색/취소/재셔플/한도/복귀는별도지정상태실제UI·controller로검증 |
| P114 | PASS | 자동정석정책에운영/희귀룬필수전제를넣지않고사람승률처럼보고하지않는다. | `tools/sky-candidates.js` · `docs/validation/v0.4/runs-summary.json` — 현재보유카드만탐색한80명령원정7완주/73정상패배/기술오류0,사람승률아님 |
| P115 | NOT RUN | 교사검수·실제iPad/Android/스피커·OSquota미실행을NOT RUN으로명확히기록한다. | `docs/TEST_REPORT_0.4.md` · `docs/EDUCATION_REVIEW_0.4.md` — 교사·실제iPad/Android/스피커·OSquota는미실행 |
| P116 | PASS | 기존정상테스트를삭제/skip/약화해서통과시키지않고의도된변경과중간FAIL을남긴다. | `docs/TEST_REPORT_0.4.md` · `Git test diff` — 명세상새버전기대변경/legacy명시view/S003근거/중간실패보존; assertion삭제·skip없음 |
| P117 | PASS | 작업브랜치push/PR/검토표/캡처/남은문제를제출하고main직접병합/배포는하지않는다. | `https://github.com/YEOMT/grammardealer/pull/6` · `docs/PROGRESS.md` — 개발브랜치push 및 main대상 PR#6 생성, auto_merge=null; main기준db9f6ca/Pages설정/workflow미변경 |
