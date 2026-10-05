# 0.3 P001–P097 실제 검사 근거

첨부 JSON은 기대사항이다. 아래는 이번 실행 및 코드 대조의 결과다. 세부 실행 종류와 한계는 [검사 보고서](../../TEST_REPORT_0.3.md)를 따른다. 물리 기기·음향·교육 전문가 검수는 자동 검사 PASS에 포함하지 않는다. 항목별 집계는 PASS96 / FAIL0 / NOT RUN1(P096)이다. 각 PASS의 자동·지정 상태·코드 대조 범위는 실제 근거 열을 따른다.

| 항목 | 결과 | 기대사항 | 실제 근거 |
|---|---|---|---|
| P001 | PASS | 작업 시작 SHA·0.2.2 포함 여부·AGENTS 준수·별도 브랜치를 기록하고 사용자 변경을 보존한다. | Git base d6535b6, clean start, codex/v0.3-time-canyon; AGENTS/architecture read before editing |
| P002 | PASS | Stage1~3은 3+4+5=12전투이며 Stage3의 적 순서/이름이 사용자 확정안과 일치한다. | v03-progression + production playedBattles 1..12; stage3.js order and exact names |
| P003 | PASS | Stage1/2 정상 기능과 기존 HP77/132/242 및220/300/380/640을 보존한다. | legacy golden + stage2-shop/guided regressions; unchanged Stage1/2 HP |
| P004 | PASS | Stage2를 완료한 새0.3 원정은 Stage3로 이어지고, Stage2_END로 조기 종료하지 않는다. | production Stage2 milestone -> Stage3 preview -> battle8 |
| P005 | PASS | Stage3 입장 시 보스 예고→부족 카드 지급→첫 전투 순서이며 상점이 생기지 않는다. | v03-progression eight ownership states; production stage.03 preview, entry, no shop |
| P006 | PASS | Stage3 완료는 STAGE3_END/제공 구간 완료이고 전체48전투 완료·승천·다회차 보스를 해금하지 않는다. | v03-progression final reward skip -> STAGE3_END, highest3, storyClear0 |
| P007 | PASS | Stage2_CLEAR는 구간 종료와 분리되어 프로필/원정에서 한 번만 발생하고 시간4계열을 해금한다. | v03-progression and production milestones; controller emits Stage2_CLEAR before reward |
| P008 | PASS | 기존 Stage2 완료 실적의 해금 보완은 증거 기반·멱등이며 기존 원정 자격을 소급 변경하지 않는다. | v03-progression profile backfill requires stage2CompletedRunIds and preserves existing eligibility |
| P009 | PASS | 새0.3에서는 Stage1에도 지원 형태를 선택·판정 가능하고 미해금은 전용 효과만 제외한다. | v03-score-boss locked time; forms available from new run, bonus filtered independently |
| P010 | PASS | Stage3 최종 승리 뒤4슬롯, 그 전3슬롯, 새 원정3슬롯, 구버전3슬롯을 구분한다. | v03-progression last phase grants4, earlier boundaries reject4; freshrun3 |
| P011 | PASS | 실제 활성 동사 전체의 5형태와 불규칙형 감사표를 작성하고 신규 will과 기존 동사를 구분한다. | VERB_MORPHOLOGY_AUDIT_0.3 + v03-language/v03-audit all30 and will |
| P012 | PASS | was/were의 수·인칭, been/being/had/given/gone/eaten/taken/seen을 올바른 역할로 처리한다. | v03-language G cases + independent paradigm spellings; first finite agreement |
| P013 | PASS | played/had/read/run 등 동형 철자 때문에 정상 표면 문장이 잘못된 메뉴 선택만으로 오답이 되지 않는다. | v03-language G cases and verbPhrase surface-compatible link review |
| P014 | PASS | read의 명시적 현재/과거 선택과 기본현재 해석을 기록하고, 보스나 룬에 따라 시간해석을 바꾸지 않는다. | G cases explicit read selection; deterministic main VP regression |
| P015 | PASS | will은 단일 조동사 카드이며 wills/willed/would를 만들지 않는다. 초기 VERB 슬롯을 차지하지 않는다. | v03-language single will form and starterEligible false; 10000 deck checks |
| P016 | PASS | 8가지 be/have/will 보유 조합에서 실제 소유 기준으로 없는 카드만0~3장 지급한다. | v03-progression all8 owned combinations, exact missing count and IDs |
| P017 | PASS | 입장 지급은 사전 이력이나 손패 여부와 혼동하지 않고 재열기/로드/중복 명령 시 반복되지 않는다. | v03-progression once/RNG/no duplicate ENTER_STAGE + production saved entry |
| P018 | PASS | 입장 뒤 제거한 필수 카드를 보스나 단계 전환에서 다시 생성하지 않는다. | v03-progression removed entry instance deleted by real reward reducer; no later recreation |
| P019 | PASS | have/be 한 카드로 두 문장 위치를 점유하지 못하고 합법 복수 사본은 각각 사용한다. | v03-audit duplicate physical ID rejects; two distinct have instances valid |
| P020 | PASS | technology의 a technology/bare technology/technologies를 지원하고 a technologies와 수 불일치는 구분한다. | v03-language technology cases + v03-audit noun article/bare/plural suite |
| P021 | PASS | 실제 명사 전체 감사표를 작성하고 information/homework의 일반 MASS 규칙을 일괄 해제하지 않는다. | NOUN_COUNTABILITY_AUDIT_0.3 all32 + MASS checks for homework/information |
| P022 | PASS | 원래11단어 technology 피드백 사례를 실제 분석해 가산성 오감점만 제거하고 다른 문제는 근거로 구분한다. | technology-0.2.2.json versus technology-0.3.0.json actual11word analysis |
| P023 | PASS | 필수12형 모두 등록 카드·실제 Parser로 정상 분석하고 정답문자열 화이트리스트를 사용하지 않는다. | v03-language52 supplied grammar cases run on registered physical tokens |
| P024 | PASS | 동사구의 목적어/보어 요구는 본동사의 Frame을 따르고 보조 have/be 때문에 문형이 바뀌지 않는다. | v03-language main lexical head/relative traversal regression + Frame cases |
| P025 | PASS | I will be happy는2형식, I was running은1형식, have given+IO+DO는4형식이다. | v03-language actual SVC/SV/SVOO cases |
| P026 | PASS | have played=현재완료, had played=과거완료, will have played=미래완료를 서로 구분한다. | v03-audit 12 families + grammar cases independently assert family/aspects |
| P027 | PASS | 과거분사 하나를 과거 시간으로, -ing 하나를 진행형으로, will 문자열을 미래절로 오인하지 않는다. | v03-language incomplete/link/nonfinite cases + v03-score-boss rejects false keys |
| P028 | PASS | 과거/현재완료에 시간 부사나 두 번째 절을 강제하지 않는다. | v03-language independent past/perfect sentences without forced adverb or clause |
| P029 | PASS | 기존 관계절 안에도 새 동사구가 적용되며 주절/내포절 각각의 family와 실제 카드 범위를 보존한다. | v03-language relative clauses and main VP regression; real card ranges |
| P030 | PASS | 비정형 to절의 완료/진행은 정상 조립하되 독립 유한 시간 열쇠를 생성하지 않는다. | v03-language nonfinite to perfect/progressive; v03-score-boss no past key |
| P031 | PASS | be/have의 본동사 용법과 보조동사 용법을 구별하고 기존 develop SV/SVO를 보존한다. | v03-audit all30 past/perfect actual Frame sentences; grammar-learning develop regressions |
| P032 | PASS | 주어 일치만 틀린 명확한 시간 동사구는 부분감점하면서 해당 시간 증거를 유지한다. | v03-score-boss They was running remains PAST eligible with issue |
| P033 | PASS | 잘못된 auxiliary 링크는 완전문장 보너스와 그 링크의 시간 효과/골렘 열쇠를 받지 않는다. | v03-score-boss malformed links no COMPLETE/time bonuses; rejected key |
| P034 | PASS | I running/I will/I have been 등 핵심 불성립은 일반 전투에서0피해·카드/턴 소모한다. | v03-score-boss INVALID_CORE accepted0 and all physical cards discarded; production invalid UI cost |
| P035 | PASS | 원형 be 미선택의 부분감점은 유지하며 이를 CURRENT 열쇠로 무조건 인정하지 않는다. | v03-score-boss I be happy cannot hit PRESENT; legacy be regression |
| P036 | PASS | 같은 원인의 형태 오류가 여러 보조동사 이벤트에서 반복 감점되지 않는다. | v03-score-boss three malformed chains each exactly one AUXILIARY_FORM_REQUIRED deduction |
| P037 | PASS | Sense 순서/보스 활성부위/룬/지역을 바꿔도 문법 정오가 달라지지 않는다. | v03-audit same analysis across36 family/phase combinations; grammar-learning sense-order regression |
| P038 | PASS | 한도·데이터·코드 오류는 무소모 기술 복구이며 필수12형이 이 경로로 빠지면 미완료로 보고한다. | grammar-learning technical errors preserve state; bounded work/depth/candidate diagnostics and performance.json |
| P039 | PASS | 기본문장 +30 및 SV1.3/SVC1.6/SVO1.8/SVOO2.2를 새0.3에 적용한다. | v03-score-boss S01-S18 actual engines and arithmetic timeline |
| P040 | PASS | 루비/사파이어/에메랄드1.6/2.2/2.8, 토파즈1.7/2.4/3.2, 호박1.4/1.8/2.4가 정확하다. | v03-score-boss supplied table/Topaz levels; immutable versioned rune data audit |
| P041 | PASS | 카드10/연마+5/수정20·35·50/비취/철/운영 룬은 명시 범위 외에서 바뀌지 않는다. | legacy attack goldens and scoring/behavior rune regressions; unchanged unlisted values |
| P042 | PASS | 과거/진행/완료/미래 시간 효과는 각각 공격당1회이며 고정 순서와 유리수 내림을 사용한다. | v03-score-boss arithmetic timelines + time parser dedup hits; rational floor numeric module |
| P043 | PASS | 복합형의 실제 여러 특징은 발동하지만 같은 p.p./절/복합이름으로 보너스를 중복 생성하지 않는다. | v03-language compound/relative evidence + score timelines each time family once |
| P044 | PASS | 미해금 시간형과4형식은 정상 공격하고 잠긴 문형을SV로 위장하지 않는다. | v03-score-boss locked perfect126, no CONSTRUCTIONS/REGION; grammar-learning locked SVOO |
| P045 | PASS | 현재형 기본 공격은 골렘 CURRENT에는 통하지만 Stage3 지역보너스를 자동으로 받지 않는다. | v03-audit PRESENT target accepts basic current but no REGION without unlocked time hit |
| P046 | PASS | Stage3 지역보너스는 네 시간 표현 중 하나 이상일 때 한 번만 적용된다. | v03-score-boss Stage3 cases and locked filter; single REGION event from any time hit |
| P047 | PASS | 운석 Lv1의 유효카드4/5/9/10/16장 문턱은 무효/×2/×2/×3/×3이다. | v03-score-boss L01-L21 synthetic contributing-ID thresholds |
| P048 | PASS | 운석 Lv2/3의 두 문턱·높은구간 단독 적용을 검사한다. | v03-score-boss L01-L21 level2/3, one event for highest interval |
| P049 | PASS | 운석은 철자수/손패/부모자식노드/제외카드를 세지 않으며 같은 단어 별도 사본은 센다. | synthetic contributing/excluded-ID sets in L cases; real S11/S12 parser contribution |
| P050 | PASS | 핵심 실패는 운석/덧셈 룬/연마/지역과 무관하게0이고 부분 오류는 실제 감점 후 조건부 룬이 가능하다. | v03-score-boss invalids0; unchanged accuracy/partial-card scoring regressions |
| P051 | PASS | 기본11+운석만 활성, 최초 고정룬3개 유지, 운석은 이후 첫룬 전체풀 칸과 일반 보상/상점에서 가능하다. | v03-audit200 actual reward/shop seeds: twelfth rune, fixed3 and basic pool exclusion |
| P052 | PASS | 장착순서 변경의 실제 산술192/180 및 전체 표의 기대위력을 검사한다. | v03-score-boss S19/S20 synthetic preRune100 ->192/180; S01-S18 actual parser scores |
| P053 | PASS | 새 버프 때문에 정상 원킬이 가능해져도 기존HP를 자동 상향하거나 전역 피해상한을 만들지 않는다. | production real one-hit encounters and simulation power arrays; original HP preserved/no global cap |
| P054 | PASS | 골렘 최대HP는 세구간 합이며 각구간 초깃값/활성순서/잠금이 일치한다. | v03-progression valid/corrupt save boundaries + pure golem validation sum/order |
| P055 | PASS | 과거 단계에서 과거·과거진행·과거완료·과거완료진행이 모두 허용된다. | v03-audit 12 finite families against3 phases: all four PAST allowed |
| P056 | PASS | 현재 단계에서 일반현재·현재진행·현재완료·현재완료진행이 모두 허용된다. | v03-audit 12 finite families against3 phases: all four PRESENT allowed |
| P057 | PASS | 미래 단계에서 will·미래진행·미래완료·미래완료진행이 모두 허용된다. | v03-audit 12 finite families against3 phases: all four FUTURE allowed |
| P058 | PASS | 정상 관계절의 시간 증거도 포함하되 비정형절이나 남는 단어는 열쇠가 아니다. | v03-score-boss finite relative key vs nonfinite/malformed/unselected forms |
| P059 | PASS | 다른 계열 정상 문장은 실점수 계산 후 방어0피해·카드/턴소모·phase불변으로 처리한다. | v03-score-boss wrong family600 -> preBoss600/final0/no state change; production normal command costing |
| P060 | PASS | 핵심 실패/감점0/보스시간불일치/기술오류의 안내와 자원처리가 구분된다. | grammar-learning failure distinctions + WRONG_TIME_BLOCKED_NO_DAMAGE_SHAKE; invalid actual UI cost |
| P061 | PASS | 활성구간 잔여240에600위력은240만 감소하고 phaseExcess360은 다음구간으로 넘어가지 않는다. | pure golem assigned600: actual240, excess360, total480, overkill0 |
| P062 | PASS | 한 문장이 여러 시간계열을 포함해도 한 공격에서 하나의 phase만 처리한다. | pure proposal has one frozen active phase; relative/multiple-family cases use one phase |
| P063 | PASS | phase1/2 파괴는 중간부위만 변경하고 보스승리·재화·보상·milestone을 생성하지 않는다. | v03-progression phase1/2 no reward/gold; production phase checkpoint load |
| P064 | PASS | phase3 최종파괴에서만 killed=true이며 같은 공격/FINISH 반복으로 정산되지 않는다. | v03-progression final phase only kill/milestone4slots, duplicate FINISH no mutation |
| P065 | PASS | 마지막 행동에 세 번째 부위파괴는 승리, 첫/둘째만 파괴하고턴0이면 패배다. | v03-progression three last-action boundaries: phase1/2 DEFEAT, phase3 REWARD |
| P066 | PASS | 장막조건은 원본 시간증거로 판단하고 scoreable filter에서 사라진 evidence와 혼동하지 않는다. | v03-audit36 locked-bonus phase checks + v03-score-boss originalAnalysis evidence |
| P067 | PASS | 세 부위 문구·방어문구·현재필요계열이 정확하고 미래구간은 공격 전에 몰래 활성화되지 않는다. | canyon browser blocked label and three phase state bars; timeGolem fixed Korean messages |
| P068 | PASS | 3분할막대/전체HP/적외형이 충돌 시점에 같은 before/after로 갱신된다. | canyon browser IMPACT_PHASE_0..2 normal/reduced: before/after bars/opacity + production phase saves |
| P069 | PASS | 실제큰위력과실제HP감소·구간초과를 구분해 기록하고 초과분을누적피해/재화로 더하지 않는다. | v03-score-boss pure power/loss/excess; controller history and production real checkpoint comparisons |
| P070 | PASS | 룬 ▲▼를 직접 노출하고, 위에서 아래로 적용되는 순서와 현재 순번을 표시한다. | canyon browser visible indexed ▲▼; four viewport geometry; rune panel top-down instruction |
| P071 | PASS | 드래그·▲▼·키보드가 같은 REORDER_RUNES 명령을 사용하고, 취소하면 원래 순서가 유지된다. | canyon browser button/keyboard/drag insertion and scroll cancel; shared REORDER_RUNES |
| P072 | PASS | 드래그 핸들·버튼·설명 클릭이 중복 실행되지 않고 거래 모달과 공격 연출에서는 재정렬을 잠근다. | canyon browser info neutral and presentation-disabled buttons; rune modal/transaction guard code review |
| P073 | PASS | 순서 변경으로 턴·교환·RNG를 소모하거나 운영 룬의 시작 자원을 다시 지급하지 않는다. | v03-progression save order rules/RNG/economy equality; canyon scroll cancel/state equality |
| P074 | PASS | 플레이어 원문은 밝은 흰색·볼드·조금 큰 글씨, 피드백은 부드러운 적색과 레이블로 구분한다. | canyon browser exact #F5F7FA >=18px >=700 + #F0A0A5 and labeled feedback |
| P075 | PASS | 학생 도감의 고정 학습 예문 영역을 제거하고 내부 검수 예문과 테스트를 보존한다. | canyon CODEX_NO_FIXED_EXAMPLES + learning28 checks; grammarGuideData internal examples retained |
| P076 | PASS | 번역·VALID/UNSUPPORTED/capability·자동 정답이 도감·툴팁·최근 제출에 재등장하지 않는다. | learning browser28 + production end codex no translations/internal labels |
| P077 | PASS | 동사구 전체 V, IO/DO 명사구 범위, 시간 역할과 실제 위력을 분석 증거에서 표시한다. | learningRecords analysis-derived full VP/IO/DO and TIME_ROLE_LABELS; production real power records |
| P078 | PASS | 새 실습의 위력 40/126, 77HP, 교환·준비, 재화 5, 정상 28장과 RNG 복원이 일치한다. | guided-tutorial tests and actual production UI40/126, HP77, gold5, normal28/RNG restore |
| P079 | PASS | 실습 gate는 실제 이벤트 수치를 사용하고, 구버전 30/87 및 완료 프로필의 재강제 부재를 검사한다. | v03-progression old30/87 + guided browser real score gates40/70/126 and profile completion reuse |
| P080 | PASS | 확인·hidden 대기를 watchdog 소진으로 보지 않고 중복 ACK·재시작·복구 회귀를 유지한다. | guided47 browser checks + guided/patch-presentation tests: pause budget, duplicate ACK, recovery |
| P081 | PASS | 부위 파괴 연출을 finish가 즉시 취소하지 않고, 세 번째 부위를 파괴했을 때만 보스 전체가 퇴장한다. | canyon six real DOM presentation fixtures: phase1/2 avatar stays1, third opacity0, read phase retained |
| P082 | PASS | 효과 감소·음소거·탭 전환·재생 취소에서도 같은 게임 결과와 입력 잠금 복구를 유지한다. | canyon normal/reduced/cancel, guided synthetic visibility, production muted/reduced; real OS kill NOT RUN |
| P083 | PASS | 대표 네 해상도, 가로 터치, 긴 문장, 형태 메뉴, 상점·도감의 가림과 스크롤 충돌을 검사한다. | canyon8 max-card layouts4 resolutions + harbor/learning form/shop/modal scroll; touch emulation |
| P084 | PASS | 0.3의 manifest·stageId·12전투·새 상태를 검증하고 버전 분기 누락으로 Stage1-only가 되지 않는다. | v03-progression storage manifest3 + actual production12 completion |
| P085 | PASS | 구버전 원정의 점수·룬·언어·HP·카드·보상·상품·RNG·종료 경계를 보존한다. | independent base golden + fresh legacy160 + legacy reward/shop/storage/guided tests |
| P086 | PASS | 같은 프로필의 새 0.3 원정과 옛 0.2.2 슬롯에서 각각의 합법적인 수치를 표시하고 계산한다. | version-browser same profile actual IndexedDB slots old1.25/62 vs new1.4/113; assigned cards, real UI/controller |
| P087 | PASS | 골렘 부위를 파괴한 턴 경계에서 저장한 뒤, 해당 파괴 상태와 다음 잠금을 그대로 복원한다. | production actual PAST/PRESENT break offline save/load + controller storage |
| P088 | PASS | 위조된 부위 상태·역순 파괴·전체 HP 불일치·중복 카드·부당한 4슬롯 저장을 거절한다. | v03-progression corrupt phase/order/totalHP/4slot; existing duplicate-card storage tests |
| P089 | PASS | 로드·재표시·프로필 해금으로 입장 카드·상점·보상을 재지급하거나 재추첨하지 않는다. | production entry/shop/reward/completion save comparisons, duplicate commands; removal not regenerated |
| P090 | PASS | 가산성의 교육용 재검토는 과거 위력·업적·재화를 소급 변경하지 않고 반복 실행에도 동일하다. | v03-audit old technology readonly review, old numeric record unchanged, repeated profile review identical |
| P091 | PASS | 혼합 3칸 확률, 대상 선택 취소, 첫 룬, 가격, 강화·제거 각 1회, 승리 재화를 유지한다. | existing reward/input/shop tests and actual production mixed reward/first rune/shop purchase/gold |
| P092 | PASS | 최종 10,000개 덱과 과거 물리 덱·RNG golden을 검사하고 변경 또는 실패의 원인을 기록한다. | corrected-decks.log10000 both old and current openings; independent fourmode deck/RNG golden |
| P093 | PASS | 시간 공략 자동 정책 80원정의 완주·정상 패배·기술 실패 및 단계별 병목을 모두 보고한다. | final-time-runs summary80, all failures retained, futureAccess and perbattle metrics |
| P094 | PASS | production 12전투를 실제 UI로 완주하고 합성 fixture 시연과 구분한다. | production1366 seed17 and final1024: actual12 offline UI battles,24 attacks each; separate from fixtures |
| P095 | PASS | 첫 로드 이후 오프라인 플레이·저장과 필수 test/data/build/browser 결과를 보고한다. | final test455/data2489/build/browser exits0; production offline after initial assets no failed resource |
| P096 | NOT RUN | 실제 기기·교사 검수·스피커 등 실행하지 않은 검사는 NOT RUN으로 표시한다. | NOT RUN: physical iPad/Android, Safari/Firefox/WebKit, speaker listening, teacher/student review |
| P097 | PASS | 변경 내역·초깃값 조정·남은 문제·인수 조건 근거·PR 주소를 제출하고 자동 병합하지 않는다. | Feature branch 8700a11 pushed; [PR #5](https://github.com/YEOMT/grammardealer/pull/5), open, auto_merge=null; main unchanged, no deployment |
