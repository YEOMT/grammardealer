# 0.5.1 인수 조건 실제 결과

첨부89개 조건을 실제 코드·검사·캡처에 대응했다. 부속 자체검사 결과를 사용하지 않았다. 단위 assertion 개수와 이 조건 수는 다르다. 현재 PASS88/FAIL0/NOT RUN1(P089 원격 전달 전)이다. 교사·실기기·청취·실 브라우저 툴바 확대는 별도 NOT RUN이며 PASS에 합산하지 않는다. CSS zoom125%는 명시된 대체 검사다.

근거 파일은 [테스트 보고서](TEST_REPORT_0.5.1.md), [실행 명령](validation/v0.5.1/commands.json), [브라우저 요약](validation/v0.5.1/browser-summary.json), [교육 검토](EDUCATION_UI_REVIEW_0.5.1.md), [피드백 검토](CORE_FEEL_REVIEW_0.5.1.md)를 따른다. 아래 tests/src 경로는 저장소 상대 경로다.

| ID | 결과 | 요구사항 | 실제 근거 |
|---|---|---|---|
| P001 | PASS | 작업 시작 최신 origin/main·기준 SHA·미커밋 보존·별도 브랜치를 기록한다. | TEST_REPORT 기준 SHA/clean checkout; Git branch 확인 |
| P002 | PASS | 새 .5.1 원정은 Stage 1~5 총22전투/STAGE5_END이며 Stage6·스토리클리어를 추가하지 않는다. | production-browser.json: playedBattles1–22, STAGE5_END, storyClearCount0 |
| P003 | PASS | .5.1이 .5 언어·형태·점수·룬·운영·봉인 정책을 명시적으로 사용하고 옛 기본값으로 떨어지지 않는다. | v051-legacy.test: registry identity/explicit combo0.5; 전체767회귀 |
| P004 | PASS | 28장·have/be/대명사 구성·고급 희귀도·6/10/3/4/6/16 자원을 보존한다. | v051-legacy.test starter28/77/6/6/4; 기존 덱·전투 자원 회귀 |
| P005 | PASS | 공격 점수·룬 배율·지역·보상·상점 가격/서비스/turn bonus를 보존한다. | 변경 전 v051-legacy-050-golden; 상점·보상·resolveAttack 전체 동등 |
| P006 | PASS | 초반 연결어·쉬운 어휘·준비/교환후 한방 전략에 새로운 페널티/상한을 넣지 않는다. | grammar/scoring 데이터 diff 없음; production13–16의 합법적 한방 |
| P007 | PASS | 기존0.1~0.5 저장·공개 상품/보상·RNG·종료 경계가 유지된다. | 기존0.1–0.4 golden + v051-legacy05; v05-progression legacy helper |
| P008 | PASS | 원정 저장의 기존 .5 HP와 새 .5.1 HP가 분리되고 로드 시 재설정되지 않는다. | v051-polish HP표 / legacy05 원본 안전 저장 load 동등 |
| P009 | PASS | 구버전 same-surface Form ID·single ING·물리 카드 보존을 유지한다. | v051-polish pronoun aliases/verb ID 불변; 전체문법·카드 보존 회귀 |
| P010 | PASS | CORE와 DECORATIVE 경로가 분리되어 effectsOff만으로 핵심 모션이 사라지지 않는다. | core CORE_MATRIX0–3: effects/reduce 독립 경로 |
| P011 | PASS | 정상 motion의 effectsOff OFF/ON에서 실제 조립체 LUNGE 중간 이동과 가시영역을 각각 확인한다. | core CORE_MATRIX0/2: native rAF LUNGE 위치·opacity·가시성 |
| P012 | PASS | 정상 motion의 effectsOff OFF/ON에서 실제 적 피격/HP/오버킬 핵심 반동이 각각 보인다. | core CORE_MATRIX0/2: enemy recoil와 before/after HP |
| P013 | PASS | OS reduce OFF/ON과 효과 감소의 네 조합을 구별하고 reduce에서는 큰 이동/화면 shake 대신 비이동 피격을 표시한다. | core CORE_MATRIX0–3: reduce에서는 비이동 밝기, 실제 큰 transform 없음 |
| P014 | PASS | 효과 감소에서도 룬의 실제 발동 이름·배수·최소 슬롯 반응과 문법 역할 강조가 남는다. | core CORE_TEACHING_EFFECTS_OFF: 실제 엔진 역할·룬 사건, 이름/after/slot pulse |
| P015 | PASS | 음소거/음량0를 존중하고 효과 감소만으로 기본 타격음을 끄지 않는다. | presentation.test audio mute/volume0 + core actual audio call; 청취는 NOT RUN |
| P016 | PASS | WAAPI 없음 또는 예외를 실제로 유발한 검사에서 fallback 피드백과 입력 복구가 작동한다. | core CORE_MATRIX5/6: WAAPI undefined/throw 주입, fallback·정리 |
| P017 | PASS | 점수 단계의 HP는 before, IMPACT 이후는 after이며 피해/프로필/보상은 한 번만 적용된다. | presentation.test impact once/immutable; v02 VEIL_AND_HP_AT_IMPACT; production 완료 영수증 |
| P018 | PASS | 숨김·중단·오류·배속 뒤에 animation/rAF/listener/DOM 복제/잠금이 잔류하지 않는다. | 기존 patch-vfx abort/hidden/fault; core animations/clones/busy; UI GATE_SKIP26/27/28 |
| P019 | PASS | 강한 화면전체 반복 섬광이나 지속 흔들림을 도입하지 않는다. | presentation caps/단일 국소 밝기; core 프레임과 선별영상 검토 |
| P020 | PASS | 1366/1280/1024 가로 화면·16조합/14손패/4룬 지정 상태와 확대에서 가시성/클리핑을 확인한다. | core capacity1366/1280/1024와 CSS zoom125%, 16/14/4 + 기존 desert 최대배치; 툴바 확대는 별도 NOT RUN |
| P021 | PASS | 속도1/2와 기존 점수 읽기 시간을 보존하며 늘어난 효과 시간이 watchdog에 반영된다. | core speed1/2 actual frames; presentation timeline/watchdog unit; guided wait budget 회귀 |
| P022 | PASS | 확정 post-boss finalPower/actualHpLoss/overkill만 읽고 피해·경제를 다시 계산하지 않는다. | v051-polish V01–V20 resolution deep equality; post-boss input only |
| P023 | PASS | 정확히 HP만큼의 격파는 일반 격파, 실제 초과분>0인 격파만 초과 피해 표시를 한다. | V01–V20 exact-kill/overkill cases + core 실제 label 검사 |
| P024 | PASS | SMALL/LARGE/MASSIVE 초깃값과 정해진 threshold 경계를 결정론적으로 검사한다. | V01–V20 threshold 경계와 hitStop/recoil/shake 상한 |
| P025 | PASS | 남은 HP1의 작은 마무리 공격을 분모 효과만으로 대형 오버킬로 부풀리지 않는다. | V01–V20 HP1/최대HP 분모 사례 |
| P026 | PASS | 큰 위력을 보호막이 막아 actualHpLoss0이면 명중·오버킬·격파 VFX를 하지 않는다. | core actualHpLoss0 impact audio 없음; canyon wrong-time blocked 검사 |
| P027 | PASS | 초과 피해 텍스트가 실제 확정 overkill과 같고 추가 보너스처럼 표기하지 않는다. | core V01–V20 label = 확정 overkill, bonus 없음 |
| P028 | PASS | 골렘 앞 부위 파괴/phaseExcess에서 전체 보스 사망·오버킬 이월이 발생하지 않는다. | canyon 세 부위/phaseExcess 회귀; production PAST/PRESENT 실제 파괴·저장 |
| P029 | PASS | 골렘 마지막 부위, 문지기 해제 공격, 스핑크스 처치에 원래 결과와 일치하는 격파 표시를 한다. | canyon 마지막부위/Vfixture, v02 IMPACT, sky보호막 지정상태, production스핑크스 |
| P030 | PASS | 오버킬이 커져도 화면/적 반동과 지속시간은 명세 상한 내이며 다음 조작이 방해되지 않는다. | v051-polish caps + core clean animations/clones/input unlock |
| P031 | PASS | 오버킬 연출 변경 전후 같은 resolution의 수치·RNG·집계가 같다. | legacy05 baseline 동일; presentation resolution deep equality; E2E shadow/state equality |
| P032 | PASS | 학생 노출 실습 명칭을 튜토리얼로 통일하되 내부 ID/과거 증거는 유지한다. | guidedCoach/main/overlays/store 표시 문자열 대조; guided47/ui17 |
| P033 | PASS | 첫 안내에 시작/건너뛰기가 명확하고 처음 플레이어도 스킵할 수 있다. | polish UI SKIP_CANCEL/INITIAL_SKIP 캡처 |
| P034 | PASS | 스킵 확인 취소 시 카드/RNG/세션 진행이 바뀌지 않는다. | polish UI SKIP_CANCEL state exact; v051-tutorial confirmed:false |
| P035 | PASS | 초기 스킵은 parked28장·원래 RNG에서 일반 Stage1-1의 정상 첫패를 한 번 구성한다. | v051-tutorial9단계 normalized normal state exact; UI INITIAL_SKIP/production첫패 |
| P036 | PASS | 첫 튜토리얼 공격 뒤 스킵해도 HP/행동/교환은 일반 1-1 초기 상태로 복귀한다. | v051-tutorial step12/13, parked RNG/HP/resources exact |
| P037 | PASS | 준비·형태·score gate 이후 스킵도 같은 정상 덱/RNG/기록 정책을 만족한다. | v051-tutorial step26/27/28/30/31; actual UI GATE_SKIP26/27/28 |
| P038 | PASS | 스킵으로 1-2 이동·승리·재화·보상·문법사용/최고점 증가가 발생하지 않는다. | v051-tutorial stats/economy/reward/settlement/profile exact; production0gold/0attacks |
| P039 | PASS | 스킵된 프로필은 다음 새 원정에서 반복 강제되지 않고 완료 플래그는 위조하지 않는다. | v051-tutorial NEW_RUN no reinstall; production new-run no forced coach |
| P040 | PASS | 기존 완료 프로필은 버전/명칭 변경 때문에 재강제되지 않는다. | 기존 guided-completed profile 회귀; GUIDED_VERSION0.2.1 유지 |
| P041 | PASS | 스킵 중 stale FINISH_PRESENTATION/gate ACK/이중클릭이 새 전투를 바꾸지 않는다. | v051-tutorial duplicate/stale FINISH/gate ACK 거절; UI400ms 후 state exact |
| P042 | PASS | 스킵 후 고정 tutorial 카드/잠금/gate/선택/transform/pending 상태가 남지 않는다. | UI INITIAL_SKIP/GATE_SKIP normal28, no core clone/gate, IDB roundtrip |
| P043 | PASS | 정상 튜토리얼40/126 완료·일반 덱 복원·기존 보상 경로가 보존된다. | guided-browser47: 실제40/126, three viewports, gold5/normal28, profilecomplete |
| P044 | PASS | 다시 보기는 독립 상태이며 진행 중 원정/재화/해금/도감을 바꾸지 않는다. | polish UI REPLAY_ISOLATION; 기존 독립 practice controller 검사 |
| P045 | PASS | 완료·스킵·초기 튜토리얼·구버전 저장을 저장/로드하고 상태를 구분한다. | v051-tutorial skip canSave/load, 기존 guided/storage/legacy 검사 + actual IDB |
| P046 | PASS | 현재17개 문법이 고정 순서로 표시되고1~5형식은 맨 앞이다. | GRAMMAR_DISPLAY vs 고정17catalog; UI EDUCATION1366/1280/1024 |
| P047 | PASS | 문법 제목 바로 오른쪽 같은 heading에 괄호 형태를 표시한다. | UI grammar-heading same h3, spanpattern; 캡처3해상도 |
| P048 | PASS | 제목 크기/굵기/색이 설명과 분리되고 태블릿에서도 제목이 더 작지 않다. | UI computed heading≥20/description≥14; CSS22/17/15 hierarchy |
| P049 | PASS | 문법 설명은 검수한1~2문장으로 출력하며 긴 절 설명 일괄붙이기를 제거한다. | v051-polish catalog동등; overlays 긴 CLAUSE_GUIDE join 제거 diff |
| P050 | PASS | 절/완료 문구의 최소 정확성 보정과 사용자 원문 취지를 검토표에 구분한다. | EDUCATION_UI_REVIEW 절/완료 보정표; 교사검수와 구별 |
| P051 | PASS | 플레이어 영어는 선명한 흰색/볼드, 오류·조언은 적색+텍스트 표식으로 구분한다. | canyon typography exactwhite/red/feedback; UI ASSIGNED_LONG_RECORD white/bold≥18 |
| P052 | PASS | 사전의 뜻/품사/형태/보유/희귀도와 중요한 짧은 verb tip을 보존하고 공통 강의를 반복하지 않는다. | grammar-learning dictionary owned/encountered/removed; overlays importanttips 검토표 |
| P053 | PASS | 사전 가산성BOTH·to/for·enjoy-ing 등 실제 필요한 정보를 간소화 과정에서 삭제하지 않는다. | EDUCATION_UI_REVIEW BOTH/to/for/enjoy/finish 유지; data/lexeme 회귀 |
| P054 | PASS | 내문장/역할/위력/최근공격 상세 증거는 접근 가능하되 기본 항목에 장황하게 반복하지 않는다. | UI long record details actualexpand; learning28/sky nested/desert roles |
| P055 | PASS | 고정 학습 예문 패널·한국어 문장번역·개발용 상태값이 학생 도감에 다시 나타나지 않는다. | grammar-learning/canyon/sky/desert/production 도감 raw IDs·번역·고정 예문 없음 |
| P056 | PASS | 해금은 콤보 활성으로 표기하고 미해금 정상문장의 제출/판정을 막지 않는다. | progression 콤보 활성표시; learning locked SVOO real submit70 vs unlocked140 |
| P057 | PASS | 도감/사전 열기·검색·정렬·접기 전후 원정/프로필/RNG/당시 수치가 동일하다. | UI3sizes state/profile exact after open/search/close + production read-only codex |
| P058 | PASS | 세 가로 해상도와 긴 제목/내문장에서 잘림·가로넘침·작은 터치 타깃이 없다. | UI ASSIGNED_LONG_RECORD 78자/16카드 ×3sizes, summary≥44/font≥18/no horizontal overflow |
| P059 | PASS | 학생 표시가 과거분사(p.p.)로 통일되고 기계 Form ID와 실제 형태는 바뀌지 않는다. | v051-polish formLabel p.p.; cards/overlays visiblelabel, original FormID registrygolden |
| P060 | PASS | 현재/원형-과거-과거분사/-ing의3줄 배치와 be의 원형 표시를 유지한다. | 기존 sky form columns/be group, canyon GROUPED_FORMS, grammar registry 불변 |
| P061 | PASS | she 메뉴의 her는 하나이며 목적격/소유격을 따로 선택하게 하지 않는다. | UI HER_ALIASES two old selections -> one currentbutton |
| P062 | PASS | 같은 her UI 선택으로 목적격/소유격 문장 둘 다 실제 파서에서 올바르게 분석된다. | v051-polish I like her / I like her book with each saved alias 실제 VALID |
| P063 | PASS | you/it의 같은 철자 격 UI도 한 버튼이고 다른 your/its는 별개로 유지된다. | v051-polish you/it group count2 and all aliases retained |
| P064 | PASS | I/me/my, he/him/his 등 서로 다른 철자와 서로 다른 lexeme를 합치지 않는다. | v051-polish I/he count3, lexeme equality guard in formView |
| P065 | PASS | read/had 등 동사의 시간/과거분사 동일철자 그룹을 중복제거하지 않는다. | v051-polish read/have verbform count unchanged |
| P066 | PASS | 옛 her object/possessive selection 저장을 로드해 단일 current 버튼과 같은 정상 판정을 얻는다. | UI old object/possessive selection models + parser/store golden; no migration |
| P067 | PASS | -ing는 여전히 하나의 형태이고 동명사/분사/진행의 역할 선택 버튼을 만들지 않는다. | v051-polish single ING and existing nonfinite/verbphrase regression |
| P068 | PASS | 새 Stage4가520/570/620/680/760, Stage5가620/670/720/780/960의 초깃값을 사용한다. | v051-polish ten HP expectations; production-actions actual damage totals |
| P069 | PASS | Stage1~3 HP/골렘240×3과 공격/룬/교환/준비 자원을 변경하지 않는다. | v051-polish stage1–3 deepEqual; legacy baseline; golem240×3 regression |
| P070 | PASS | 문지기50%/첫 접속사절부터 영구해제, 스핑크스사본봉인 기믹은 같다. | 전체 skyShield/turnHandSeal tests; sky/desert browser; natural sphinx save/load |
| P071 | PASS | 기존 .5.0 진행/다음전투/저장이 원래640/840 보스HP를 유지한다. | legacy05 controller22 progression / saved originalstates + 640/840 getEncounter |
| P072 | PASS | 보스760/960에서 이전 두방 산술이 달라짐을 보고하며 배수로 몰래 보상하지 않는다. | v051-polish B01–B05 actual parser 3/3/2/3/2; TEST_REPORT 산술 설명 |
| P073 | PASS | 정확한 입력 기준 기존home 사례401과 기존437/537 등 점수를 보존한다. | v051-polish actual parser/score B03=401,B04=437,B05=537 |
| P074 | PASS | 새HP를 초과하는 합법적인 한방을 막는 상한/최소타격횟수가 없다. | production battles13–16 one-hit; original scoring no cap/min-hits diff |
| P075 | PASS | 후반HP 실제 행동 로그를 제시하고 미검증 수치를 학생 난이도 검증완료로 보고하지 않는다. | production-actions latebattle 실제 카드/피해/준비/교환/운영 기록, 학생난이도 NOT RUN |
| P076 | PASS | 실제 ZIP 내 DEPLOY_KO에 Syntax Atlas와 자동 버전이 표시된다. | package-check 실제 deploy ZIP DEPLOY_KO/version 검사 |
| P077 | PASS | 초원3전투/고정Stage수/옛소스이관/현재작업push여부 단정이 생성 본문에 없다. | package unit two versions neutraltext, actual DEPLOY_KO archive read |
| P078 | PASS | 임시 두 버전값에서 버전만 자동 변경되고 중립 안내가 유지된다. | package-release.test.py two temporary fake-dist versions; production과 구별 |
| P079 | PASS | 최종 build→package→ZIP열기에서 index/assets/.nojekyll/manifest 및 자산을 확인한다. | actual final3 build → package → archive manifest/index/assets/nojekyll hashes |
| P080 | PASS | 파일명prefix/소스루트/base URL/저장소명을 호환 유지하고 deploy ZIP에src/node_modules/.git가 없다. | package-check two ZIP paths/forbiddenroots/base and prefix |
| P081 | PASS | 패키징이 설치/원격push/merge/Pages설정변경/공개배포를 수행하지 않는다. | package-release.py 로컬 파일 API only; 원격작업 명령 별도 |
| P082 | PASS | Firefox/WebKit 핵심 smoke를 추가하고 엔진별 실행·플랫폼·binary버전·결과를 기록한다. | cross commands + Firefox/WebKit reports, platform/revision/browserVersion |
| P083 | PASS | 현재 lockfile/Playwright 버전을 유지하며 전역 브라우저/의존성을 임의 업그레이드하지 않는다. | package-lock diff rootversion only; Playwright1.51.1 locked |
| P084 | PASS | 타엔진 핵심 모션/reduce/입력/모달/운영/저장을 실제 검사하고 지정 상태 여부를 명시한다. | cross core32/UI14 per engine: motion/reduce/forms/drag/modals/supply/IndexedDB |
| P085 | PASS | Playwright WebKit이나 Chromium touch를 실 iPad Safari 검증으로 주장하지 않는다. | TEST_REPORT 실제 WindowsWebKit과 iPadSafari NOT RUN 분리 |
| P086 | PASS | 최종 npm test/data/build/기존browser 및 새polish/package검사를 같은 고정 소스로 실행한다. | final3 official/production + final4 corrected-probe polish/cross/test767/data2748/build + package-check; build hash 동일 |
| P087 | PASS | 실제production UI에서 스킵 경유22전투와 저장/원래보스들을 진행하고 정상튜토리얼은 별도 확인한다. | production UI skip22/51attacks, natural seals/2shops/golem saves; separate guided47 |
| P088 | PASS | 합성산술/지정상태/자동원정/production/교사·실기기를 구분하고 NOT RUN을 PASS에 합산하지 않는다. | TEST_REPORT 검증6층위; teacher/device/listening NOT RUN separate |
| P089 | NOT RUN | 기준golden/실패이력/이전증거를 보존하고 작업브랜치push/PR만 수행한다. | 기준 golden/기존71개 증거 복원 manifest; 원격 push/PR 결과는 별도 갱신 |
