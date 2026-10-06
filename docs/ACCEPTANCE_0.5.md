# 0.5 P001–P103 실제 검증 대응표

기준은 작업 시작 최신 origin/main `6d2907eddefafb1a909c6c803259ba26b408f104`이다. `tests/fixtures/v05-acceptance-expectations.json`의 103개 요구사항을 원문 그대로 옮겼다. 그 JSON의 NOT RUN 값은 기대사항이며 실행 증거가 아니다. 이 표의 PASS는 아래 명시한 실제 실행/코드 검토 범위만 의미한다. 요구사항 일부만 확인되면 NOT RUN으로 남기고 확인된 부분을 함께 적었다. 첫 회귀와 보상 UI 수정 후 두 번째 회귀를 완료했으나, 이어진 독립 검토에서 중첩 SVOC 대표 분석 문제를 발견했다. 수정 후 세 번째 최종 회귀(final3)에서 Node/data/build와 공식 browser를 모두 완료했다. 앞선 통과를 수정 후 최종 결과로 재사용하지 않으며 production 완주와 PR #7의 실제 증거도 반영했다.

## 근거 식별자

| 키 | 실제 검사 및 보존 증거 |
| --- | --- |
| L | `tests/v05-language.test.js`의 G001–G064는 실제 parser 실행. 역할/span/일치/예산/순서 독립 및 중첩 SVOC·NP·PP·등위 구조14사례 추가. `.local-validation/v05/language-composition-fix.log`: 새05 76 + 기존04 79 + 독립 legacy 3 =158 PASS/0 FAIL. 전체 정답 문자열/점수 우선순위로 판정하지 않음. |
| L04 | `tests/v05-legacy.test.js`의 독립 변경 전04 golden 3검사: registry·8덱/RNG,136보상/8상점,12문장 전체 공격 timeline. `.local-validation/v05/score-legacy-check.log` 및 F 전체725 검사에서 실제 PASS. golden을 새 결과에 맞춰 재생성하지 않음. |
| S | `tests/v05-scoring.test.js`의 `0.5 supplied independent arithmetic through real parser S001`–S022 및 추가4검사. `.local-validation/v05/post-activation-education-score.log`: 관련84 PASS,0 FAIL. 합성 산술이며 자연 플레이 증거가 아님. |
| C | `tests/v05-progression.test.js` 7검사. `.local-validation/v05/campaign-seal-agent-final.log`: C+B35 PASS. 지정 물리카드·연마를 사용하는 실제 Controller 경계 검사이며 자연원정/production UI 완주가 아님. |
| B | `tests/v05-seal.test.js`의 `0.5 seal B001`–B026, editing/forms/runes/undo와 동일 seed 추가2검사. C+B35 PASS. B fixture도 기대값을 실제 명령/함수에 대조함. |
| U | `tests/v05-education-ui.test.js` 고정 설명/동일 Form/로컬5자산 3검사 실제 PASS. 같은 파일의 모든 assertions 유지. |
| V | `tests/desert-browser.mjs` 후속 집중 실행 `.local-validation/v05/desert-service-regression/report.json` 및 `desert-service-regression.log`: 36 PASS/20캡처/errors0, `desert-ui.webm`. Assigned Sphinx·분석 결과·실제 입력·IndexedDB와 새 단어 보상 연마/제거·실제 앱 연마 확인·다음 전투를 구분해서 검사. |
| Vscore | `tests/desert-score-browser.mjs` 실제 실행 exit0(11:46:44.968–11:46:59.964 UTC), `.local-validation/v05/desert-score-browser-command.json` 및 `desert-score-browser-final/report.json`: 9 PASS/5캡처/errors0. 지정 물리카드의 실제 Controller 공격과 정상 속도 DOM 채점·정산을 관찰. |
| F | 첫 전체 검사 `.local-validation/v05/final/commands.json`: `npm.cmd test` 725/725, `validate:data` 2748, `build` 70 modules, 모두 exit0. 같은 폴더 `browser-command.json`/`browser.log`: 공식13스크립트 254 checks(기존225+새29), exit0. 보상 UI 수정 이전 실행이며 수정 후 최종 회귀를 대체하지 않음. |
| F2 | `.local-validation/v05/final2/commands.json`: Node725/data2748/build, 공식13 browser261 checks, 10000덱 모두 exit0. 뒤이은 중첩 SVOC 분석 문제 발견으로 원정80/production 이전 파이프라인 중단(`interruption.json`). 이 중단 이후 검사는 NOT RUN이며 final3가 새 최종 결과를 기록함. |
| F3 | `.local-validation/v05/final3/commands.json`: 최종 `npm.cmd test`726/726, `validate:data`2748, `build`70 modules, 공식 `test:browser`13스크립트261 checks(기존225+사막36), 모두 exit0. browser 종료 11:52:34.634 UTC. `.local-validation/v05/final3/test-browser.log` 및 `browser/desert/report.json` 사막36검사/20캡처/errors0. 원정·production은 별도 실행 기록으로 판정. |
| D | `.local-validation/v05/final3/decks.json`, 실제10000덱/witness/opener, 종료0. 공개 validation/v0.5/decks.json. |
| N | `.local-validation/v05/final3/runs/summary.json`, 실제80원정10완주/70정상패배/오류0, 종료0. 전체 명령은 개별 seed JSON, 공개 요약은 validation/v0.5/runs-summary.json. |

로그/원본 캡처는 저장소의 위 상대 경로로 로컬 보존한다. 공개 보고서는 개인 PC 절대 경로를 포함하지 않는다. 0.4 baseline583 PASS와 과거 Work 결과는 이번0.5 통과 수에 포함하지 않는다. 알려진 중간 실패는 지우지 않았다: 첫 통합 grammar-learning fixture 버전 불일치, 최대1366×768/손패14에서 조작부12px 넘침, 닫힌 dialog 제거를 기다리지 않은 도구 timing. 새 단어 보상 UI 버전 전달 누락은 수정 후 V의 실제36검사로 재검증했고 P052에 실패 이력과 함께 기록한다. 파일 반영과 Vite reload가 겹친 중첩 실행의6검사 후 중단도 `.local-validation/v05/desert-browser-version-routing/`에 별도 보존한다.

실기기 모바일/태블릿, Firefox/WebKit, 교사 실검수, 전체48전투는 **NOT RUN**이다. Chromium touch 에뮬레이션을 실기기로 표기하지 않는다. 제공 범위는22전투이며 합성 산술·지정 상태·명령 원정·production UI 완주는 서로 대체하지 않는다.

## 항목별 결과

| ID | 구분 | 명세 요구사항 | 결과 | 실제 근거 / 남은 범위 |
| --- | --- | --- | --- | --- |
| P001 | 기준·범위 | 최신 origin/main·0.4 포함·미커밋 보존·독립 브랜치와 AGENTS를 확인한다. | PASS | 기준 확인: PROGRESS.md 및 작업 시작 fetch 기록. origin/main 6d2907ed, 0.4 PR #6 반영, 깨끗한 시작 checkout과 별도 브랜치 확인. |
| P002 | 기준·범위 | Vanilla JS/기존모듈 유지, 과거ZIP·DS게임·외부AI/서버 재작성 없음. | PASS | git diff 구조 검토: 기존 Vanilla ES Modules, RunController/Grammar/Scoring/Presentation 유지. 외부 runtime 의존성 추가 없음. |
| P003 | 기준·범위 | 새0.5는 Stage1~5 22전투, Stage5 전역18~22, 완료는 STAGE5_END다. | PASS | C: assigned real-engine 22 boundaries — 실제 Controller 전이 22회, STAGE5_END. 지정 카드 진행이며 production 완주는 P098 별도. |
| P004 | 기준·범위 | Stage4 승리/보상/해금 사건이 한번 기록되고 Stage5로 연결된다. | PASS | C: Stage4 victory grants packs before frozen boss reward + 22 boundaries. 완료 사건/해금/중복 finish와 보상 연결 검사. |
| P005 | 기준·범위 | Stage5 상점 없음, 기존 Stage2·4 두상점/서비스이력 유지. | PASS | C: 22 boundaries / Stage5 enters directly without third shop. 기존 두 상점의 3·5상품과 history 검증. |
| P006 | 기준·범위 | 기존28장/6첫패/10한도/3드로우/4교환/6턴/16조합과4룬슬롯 진행 유지. | PASS | C: fresh starter reuses unchanged 0.4 generator, resources and no new-word candidates; 22 boundaries의 룬4슬롯. D: 4모드 10,000덱. |
| P007 | 기준·범위 | 0.4의 희귀도/have고정/실습/도감/타격/운영/모든기존보스 보존. | PASS | F3: 기존583검사를 포함한726 Node 검사 및 공식13 browser261 checks 통과. L04 golden·희귀도/have 고정·실습47·타격/운영14·골렘/하늘섬 회귀. |
| P008 | 단일형태·데이터 | 각 동사 ing형은 기존Form ID 한개이며 동명사/분사 복제선택지가 없다. | PASS | L: uses one existing ING form with neutral morphology. 모든 실제 동사 Form ID 1개·기존 surface·영구 interpretation 없음 검사. |
| P009 | 단일형태·데이터 | 문법용법은 Form/영구사본 아닌 제출분석노드에 저장한다. | PASS | L: uses one existing ING form + reference graph. interpretation/function은 실제 analysis.nonfinitePhrases; registry clone 전후 보존. |
| P010 | 단일형태·데이터 | 현재/원형·과거·pp/ing3줄 메뉴와 원형라벨 유지, 편집역할 미리보기 없음. | PASS | V: SINGLE_ING_THREE_ROW_MENU_1024/1280/1366; U: role-neutral form labels preserve the same legacy physical form. 편집 중 역할 판정 없음. |
| P011 | 단일형태·데이터 | reading 같은동일Form으로 동명사S/O/C/전치사O와 진행을 구분한다. | PASS | L: same reading form provides subject/object/complement/preposition object without leaking progressive; G023–G026/G033. V: 제출 후 4역할 표시. |
| P012 | 단일형태·데이터 | running 같은동일Form으로 현재분사 명사수식을 판정하되 GERUND/TIME.PROGRESSIVE를 중복하지 않는다. | PASS | L: G037/G038 및 same reading form…의 modifier 증거. S013은 분사수식만 +5, 거짓 GERUND/진행 없음. |
| P013 | 단일형태·데이터 | will의 ing생성·interesting형용사의 자동동명사 처리 없음. | PASS | L: uses one existing ING form… 및 G039. will.ing 부재, 고정 interesting의 자동 비정형 판정 없음. |
| P014 | 단일형태·데이터 | 새 enjoy/finish/hobby 실제 데이터·형태·Sense·countability와 정규 ID가 완비된다. | PASS | L: uses one existing ING form…의 새3종 정규 ID/COMMON/비시작후보 및 hobby COUNT/hobbies; G024/G025/G029. |
| P015 | 단일형태·데이터 | 기존0.4 registry/형태ID/순서/후보/과거저장 선택을 변형하지 않는다. | PASS | L04: immutable pre-change 0.4 registry, 8 starter decks and RNG remain identical + 136 rewards/8 shops. |
| P016 | 문법·증거 | 동명사 주어·목적어·보어·전치사목적어의 전체 span을 실제로 판정한다. | PASS | L: same reading form…은 실제 전체 cardIds [0,1]/[2,3]/[3,4]/[4,5]를 대조. V: 제출 후 역할6종. |
| P017 | 문법·증거 | 한 동명사구 주어의 단수일치와 정상 등위 주어를 구분한다. | PASS | L: G042/G053 및 form error recovery is local…에서 단일 동명사구 단수와 등위 주어 일치 구별. |
| P018 | 문법·증거 | be+ing 중의는 검수한 고정규칙으로 대표하되 가장높은점수로 고르지 않는다. | PASS | L: representative roles are deterministic when registry arrays/index order change; G025/G033. 점수/RNG로 대표 분석을 선택하지 않음. |
| P019 | 문법·증거 | to부정사 S/O/주격보어를 판정하고 바깥 유한동사를 보존한다. | PASS | L: G001–G003 + reference graph separates outer SVOC…에서 바깥 유한 동사/주어/주격보어 참조. |
| P020 | 문법·증거 | 명사뒤 to구의 목적어/전치사목적어 공백과 선행명사 증거가 맞는다. | PASS | L: G004/G005 + infinitive nominal, adjective, purpose and noun gap roles retain real physical spans; 실제 gapRole/antecedentNodeId. |
| P021 | 문법·증거 | 문장뒤/앞 목적to구를 인정하며 구두점만으로 실패하지 않는다. | PASS | L: G006/G007 + infinitive nominal…의 앞/뒤 PURPOSE 구. 구두점으로 실패하지 않는 실제 parser 사례. |
| P022 | 문법·증거 | 등록 형용사+to, 간단 가주어It+be+AP+to를 판정한다. | PASS | L: G008–G010 + registered valencies…의 미등록 strong to 거절. 고정 형용사 Frame 조건. |
| P023 | 문법·증거 | want/need O+to와 직접to를 SVOC/SVO로 정확하게 나눈다. | PASS | L: G002/G011/G012 및 reference graph…의 you O / to read books C / books 내부 O 구분. |
| P024 | 문법·증거 | make/find/keep 등 기존O+AP/NP, SVOO와 SVOC 경계를 유지한다. | PASS | L: G013–G017 + registered valencies…의 make/find/keep AP/NP·bare 사례. SVOO와 SVOC 구분. |
| P025 | 문법·증거 | enjoy/finish 요구패턴과 like의 양쪽용법·need특수ing를 데이터로 구분한다. | PASS | L: G024/G027–G032/G056/G057 + registered valencies reject malformed complements…; like 양쪽, need 수동 의미 특수 ing. |
| P026 | 문법·증거 | 모든동사 자동GERUND/SVOC 허용·가짜정답 문자열 조회·자동단어삽입 없음. | PASS | L: registered valencies…/compositional holdouts… 및 parser diff 검토. 임의 단어 대입·전체 span, JSON을 production 조회하지 않음. |
| P027 | 문법·증거 | 비정형 안쪽에서도 본동사의 필수목적어/보어·수식결합을 검증한다. | PASS | L: registered valencies…의 want to give/enjoy giving 필수 논항 누락 실패; G030·holdout 중첩 수식/목적어 검증. |
| P028 | 문법·증거 | 새 구 안의 시간·기존관계절·내용절·접속사 결합이 회귀하지 않는다. | PASS | L: G018–G022/G043–G047 + inner nonfinite auxiliaries… 및 compositional holdouts…; 실제 안쪽 유한 관계절 시간 증거 유지. |
| P029 | 문법·증거 | shared to/등위gerund구는 LINK.PHRASE, 실제유한절연결만 LINK.CLAUSE. | PASS | L: G040–G044 및 compositional holdouts…의 LINK.PHRASE/LINK.CLAUSE 구분. S: nonfinite families multiply once…. |
| P030 | 문법·증거 | 거듭된 ING/TO 예산은 유한이며 무한재귀·무제한경로탐색 없음. | PASS | L: repeated nested forms terminate within bounded work…은 작업량 <=90000·깊이 초과 UNSUPPORTED 확인. 무제한 탐색 없음. |
| P031 | 문법·증거 | 관사·일치·형태 복구와 핵심실패를 명세대로 구분해 원인당 한번 감점한다. | PASS | L: G051–G057 + form error recovery is local… 원인당 issue1회. S018/S019의 잘못된 부정사/바깥 일치 오류 실제 순차 산술. |
| P032 | 문법·증거 | 핵심실패0피해도 카드/턴소모·다음턴봉인, 기술실패만 무소모복구. | PASS | B016/B024 및 V ZERO_CORE_SUBMISSION_NEXT_TURN_SEAL_ONCE. 실제 실패 제출은 소모/새 봉인, commit 실패는 state/undo/RNG 롤백. |
| P033 | 문법·증거 | primaryScoringClauseId/보어/내부목적어/공백의 참조가 실제노드와 일치한다. | PASS | L: reference graph… / object-complement phrase does not relabel its inner verb… / infinitive nominal…; 실제 노드 span·controller·gap 참조. |
| P034 | 문법·증거 | 없는노드값 null/스키마 직렬화로 실패→성공→프로필저장이 유지된다. | PASS | L: G001–G064의 noUndefined 및 S: failed submission cannot be revived… 프로필 JSON roundtrip. 실패 후 정상 제출 기록 유지. |
| P035 | 점수·해금 | 기존 카드/연마/+30/1~4형식/시간/연결/룬숫자를 유지한다. | PASS | L04: immutable old language analyses and full attack timelines preserve all 12 records. S001–S022에서 새 효과 외 기존 operand 보존. |
| P036 | 점수·해금 | 5형식2.5는 기준주절에한번, 안쪽문형을 중복곱하지 않는다. | PASS | S001–S022 실제 parser 산술 + L reference graph; S: normal locked SVOC is an attack…에서 잠긴 경우 기본 공격. |
| P037 | 점수·해금 | 정상to1.4·동명사1.4는 계열별공격당한번, 서로다른정상계열은 결합 가능. | PASS | S: nonfinite families multiply once, after finite time and before clause linking; 중복 동명사 1회·to와 gerund 동시 계열 검증. |
| P038 | 점수·해금 | 같은ing출현에 gerund/진행/분사 중복보너스 없음. | PASS | L G025/G033/G037 및 동일 reading 역할 테스트; S013 분사만·S008 동명사·관련 시간 산술 분리. |
| P039 | 점수·해금 | 실제효과순서·매배수내림·안전정수·화면operand가 일치한다. | PASS | S001–S022 실제 순서/매배수 내림/안전정수 + Vscore: ×2.5 SVOC/×1.4 부정사/×1.4 동명사/×1.25 지역의 live DOM label·operand·before/after를 actual resolution과 대조(393/220 공격). 연출 중 상태 불변, 실제 FINISH 단1회 및 재렌더/중복finish 무중복. 9검사/5캡처는 지정 카드 연출이며 자연 완주 아님. |
| P040 | 점수·해금 | 작은오류로 복구된 잘못된to노드에는 정상to보너스를 주지 않는다. | PASS | L: form error recovery is local…의 RECOVERED/bonusEligible=false; S018 잘못된 to형태는 정상 부정사 보너스 제외, S019 바깥 일치 오류와 구분. |
| P041 | 점수·해금 | 지정역할 없는to/ing·핵심실패는 새룬/지역으로 점수를 부활시키지 않는다. | PASS | S: failed submission cannot be revived by added runes; failed then valid profile serializes. INVALID_CORE에 룬·지역 부활 없음. |
| P042 | 점수·해금 | Stage5 지역효과는 실제자격있는대상에만 한번, 분사단독/일반현재는 해당안됨. | PASS | S001–S022: regionApplied를 실제 timeline과 대조, 분사수식 S013/일반형 사례 제외. 지역 효과 최대1회. |
| P043 | 점수·해금 | Stage4승리때 세팩자격을 한번 부여하고 진행중다른슬롯의 해금을 소급하지 않는다. | PASS | C: Stage4 victory grants packs before frozen boss reward; new campaign imports only explicit Stage4 completion, never changes a loaded slot snapshot. |
| P044 | 점수·해금 | 미해금 정상문장도 기본공격, 기존 해금 프로필은 새원정초반 활용 가능. | PASS | S: normal locked SVOC… + C: new campaign imports only explicit Stage4 completion…; 기존 진행 슬롯과 새 원정 baseline 분리. |
| P045 | 점수·해금 | 비정형 to have pp/gerund는 그자체로 과거·현재진행 등 유한시간으로 점수·골렘공략에 기여하지 않는다. | PASS | S: inner nonfinite time cannot break past golem or release finite-clause sky shield + L: inner nonfinite auxiliaries…. |
| P046 | 점수·해금 | 하늘섬 보호막에 to/gerund만으로 해제하지 않는다. | PASS | S: inner nonfinite time…에서 실제 기존 하늘섬 bossStateAfter.active=true; to/gerund 단독 해제 없음. |
| P047 | 점수·해금 | 사막보스는 일반문장 정상피해, 신규갑옷/면역/상한 없음. | PASS | C: keeps 0.4 endpoint and encounter/rune/shop policies…와 S001–S022; 스핑크스 피해 계수/면역 추가 없음. |
| P048 | 입장·콘텐츠 | 사막은 별밤/황금모래, 적4종+스핑크스의 이름/순서/HP데이터가 있다. | PASS | C: keeps 0.4 endpoint…의 HP 520/560/600/640/840; V DESERT_FIVE_ENEMIES_NO_SHOP / desert-intro.png. 이름/순서/별밤 표시. |
| P049 | 입장·콘텐츠 | 입장 지급은 실제소유 to/want또는need/like또는enjoy또는finish 부족분만 최대3장. | PASS | C: entry checks every to / want-or-need / direct-gerund alternative… 24조합. 실제 소유 검사, 최대3장. |
| P050 | 입장·콘텐츠 | 지급ID/소유/vocab/사전이 원자적이고 반복진입/로드로 중복 안됨. | PASS | C: entry duplicate ID failure is atomic… + entry checks every…; grant trace/소유/사전 검증·중복 진입 무효. |
| P051 | 입장·콘텐츠 | 이후카드제거/봉인/손패부족을 이유로 자동재지급하지 않는다. | PASS | C: entry checks every…의 지급 후 제거·재진입 무재지급. 봉인/손패를 지급 조건으로 사용하지 않음. |
| P052 | 입장·콘텐츠 | 보상기본확률·세칸/취소/최대운영1칸과 상점규칙을 그대로 유지한다. | PASS | L04 보상/상점 golden PASS. 새 단어 보상 목록/연마 확인의 legacy cardModel 기본값 문제를 재현한 뒤 원정 버전 전달로 수정. V NEW_WORD_SERVICE_TARGETS_CANCEL_ENJOY/FINISH/HOBBY 및 NEW_WORD_MAIN_POLISH_CONFIRM_UNLOCK_*에서 실제 앱 대상/취소/확정·10→15/다음 전투 PASS. 새 카드 소유는 지정 fixture. |
| P053 | 입장·콘텐츠 | 신규3lexeme은보상사용가능·시작덱미포함, region relevance가 정상이다. | PASS | L: uses one existing ING form…의 새3종 비시작후보; C: keeps 0.4 endpoint…의 새 카드 보상 후보와 Stage5 relevance. |
| P054 | 입장·콘텐츠 | 밤사막placeholder/지역전환/기존assetsfallback에 오류 없고 외부런타임요청 없음. | PASS | U: five desert asset slots resolve locally without remote requests; V DESERT_FIVE_ENEMIES_NO_SHOP와 errors=[]; CSS/emoji 로컬 fallback. |
| P055 | 입장·콘텐츠 | 보스처치/마지막턴 우선순위·보상·STAGE5_CLEAR·종료사건이 각각 한번이다. | PASS | C: assigned real-engine 22 boundaries…의 완료 사건 단1회 + B017/B018 처치·턴소진 경계/무추첨. |
| P056 | 봉인·난수 | 첫손패 완성후 플레이어입력전에 WORD1장 봉인한다. | PASS | B001 + V FIRST_SEAL_EXACT_COPY_AND_RULE; 실제 초기 HAND 완료 직후 단일 사본 표시. |
| P057 | 봉인·난수 | 첫턴 및 각실제다음턴에만 한번 선택, lastAppliedTurnKey 중복차단. | PASS | B009/B016/B019 및 V PREPARE_NEXT_TURN_SEAL_ONCE/ZERO_CORE_SUBMISSION_NEXT_TURN_SEAL_ONCE. turnKey 멱등. |
| P058 | 봉인·난수 | 후보는HAND의WORD만, OPERATION/BOARD/DRAW/DISCARD/EXHAUSTED 제외. | PASS | B004 및 B editing/forms/runes/undo…의 kept board 제외; 실제 HAND WORD 후보만. |
| P059 | 봉인·난수 | 후보2장 이상이면 직전물리사본 제외, 같은단어다른사본은 가능. | PASS | B002/B011/B014 및 B identical seeds/actions…; 직전 물리 ID 제외, 같은 단어 다른 사본 허용. |
| P060 | 봉인·난수 | 후보1장이면 반복가능,0장이면 null/RNG소비0으로 정상 진행. | PASS | B003/B010; 한 후보 반복 허용, 후보0 null/cursor 불변 후 운영으로 중간 재추첨하지 않음. |
| P061 | 봉인·난수 | 후보있을때 encounter만1회소비, deck/reward/shop 상태와 알고리즘 미변경. | PASS | B001–B004/B010/B014/B019 + C fresh starter…; encounter만1회 또는0회, 기존 deck/reward/shop stream 유지. |
| P062 | 봉인·난수 | 공격/준비/실패제출 다음턴은 옛봉인만료→드로우→새봉인 순서. | PASS | B009/B016 및 V PREPARE…/ZERO_CORE…; 준비·제출 다음턴 드로우 후 새 선택. |
| P063 | 봉인·난수 | 교환/보급/탐색/편집/룬/모달/표시재생은 재추첨 안함. | PASS | B005/B006/B026 + B editing/forms/runes/undo…; V SUPPLY/SEARCH_CANCEL/FORM_MENU_SWAP_GUARD. 렌더는 isTurnSealed만 읽음. |
| P064 | 봉인·난수 | 교환으로 봉인카드를버리면 다른카드를 중간에 대체봉인하지 않는다. | PASS | B006 및 V SEALED_CHECK_EXCHANGE_ALLOWED_NO_RESEAL; 기존 ID는 DISCARD, 다른 카드로 대체하지 않음. |
| P065 | 봉인·난수 | 동일턴 동일사본재드로우/탐색복귀시 봉인 유지, 다음턴만료후는 구상태안묻음. | PASS | B007/B008/B009 + V ASSIGNED_DRAW_SEAL_REAL_SEARCH_RETURN_STILL_BLOCKED; 지정 DRAW 배치와 실제 SEARCH 복귀를 구분. |
| P066 | 봉인·난수 | 봉인은 ID별상태이며 단어정의/형태/연마/점수/소유수를 바꾸지 않는다. | PASS | B011/B012/B013/B editing/forms/runes/undo…; 정의 아닌 instanceId 상태, 불법 입력에 상태 전체 deepEqual. |
| P067 | 봉인·난수 | 다섯 카드영역 보존에 봉인을 여섯번째영역으로 추가하지 않는다. | PASS | B004/B021/B023 및 invariant/source 검토. 기존 HAND/BOARD/DRAW/DISCARD/EXHAUSTED 보존; seal은 bossMechanic 참조. |
| P068 | 봉인·난수 | 이미조합대에 놓아둔 WORD는 다음턴봉인후보가 아니다. | PASS | B editing/forms/runes/undo and stale callbacks never reroll; kept board is excluded on prepare. |
| P069 | 봉인·난수 | 처치/턴소진종료에는 다음드로우/추첨/RNG소비 없음. | PASS | B017/B018 처치·패배 실제 경계; 다음 draw/seal/RNG 소비 없음. |
| P070 | 봉인·난수 | 동일seed/동일행동의 사본선택/난수소비/history가 재현된다. | PASS | B identical seeds/actions choose owned indices and identical RNG independent of random run IDs; 4차례 실제 PREPARE. |
| P071 | 봉인 입력·운영·Undo | 봉인본문클릭/키보드/드래그 ADD_CARD를 Controller가 모두 거절한다. | PASS | B012 + V MOUSE_KEYBOARD_TOUCH_ADD_BLOCKED_NO_COST. 실제 mouse/Enter/Space/Chromium touch가 Controller 경유 거절. |
| P072 | 봉인 입력·운영·Undo | SWAP/카드몸통맞교환/메뉴대체경로를 Controller가 모두 거절한다. | PASS | B013 + V SEALED_BODY_SWAP_DRAG_BLOCKED/FORM_MENU_SWAP_GUARD. 모든 우회 경로 무변경. |
| P073 | 봉인 입력·운영·Undo | 불법배치는 무비용, 원래카드/핸드순서/board/selection/룬/RNG를 유지한다. | PASS | B012/B013 및 V 불법 ADD/SWAP 전후 RunState deepEqual; 비용·순서·선택·RNG 불변. |
| P074 | 봉인 입력·운영·Undo | 봉인선택체크·교환은 허용하며 opacity/overlay가 체크입력을 가리지 않는다. | PASS | V SEALED_CHECK_EXCHANGE_ALLOWED_NO_RESEAL/6 CAPACITY; 체크44px·label/word/footer 분리·실제 touch 교환. |
| P075 | 봉인 입력·운영·Undo | 표시후드래그취소/pointercancel/resize/blur로 카드와화면이 멈추지 않는다. | PASS | V SEALED_DRAG_CANCEL_RESIZE_BLUR_CLEANUP; drag ghost0, 실제 RunState 불변. 물리 모바일은 NOT RUN. |
| P076 | 봉인 입력·운영·Undo | 보급/탐색은 기존효과·한도·사용완료·다음전투복귀를 유지한다. | PASS | B005/B008 + V SUPPLY_PRESENTATION…/ASSIGNED_DRAW_SEAL… PASS. F sky-operations 14 checks 중 NEXT_BATTLE_REAL_UI_RETURN_ASSIGNED_BOUNDARY와 SUPPLY_RESHUFFLE_HAND_LIMIT_UI로 사용완료·한도·다음 전투 복귀 검사. |
| P077 | 봉인 입력·운영·Undo | 탐색취소는 상태/RNG/Undo/봉인불변, 봉인원본사본탐색가능해도 배치는차단. | PASS | B008/B026 + V SEARCH_CANCEL_SEAL_RNG_UNDO_UNCHANGED/ASSIGNED_DRAW_SEAL_REAL_SEARCH_RETURN_STILL_BLOCKED. |
| P078 | 봉인 입력·운영·Undo | 운영효과/교환후 Undo로 카드복제/봉인회피/재추첨이 생기지 않는다. | PASS | B editing/forms/runes/undo…/B026 및 운영 관련 Controller 거래 검증; 취소 무상태, 거래 후 Undo로 봉인 재추첨 없음. |
| P079 | 봉인 입력·운영·Undo | 기존조합대 편집/회수/정상공격은 봉인과무관하게 유지한다. | PASS | B editing/forms/runes/undo…의 board 유지·편집/회수; B016/B017 실제 제출·정산. V free card 실제 ADD. |
| P080 | 봉인 입력·운영·Undo | 오래된revision/다른battle명령·중복finish/중복운영이 봉인을 바꾸지 않는다. | PASS | B editing/forms/runes/undo and stale callbacks never reroll + C 22 boundaries의 중복 finish 거절. |
| P081 | 저장·표시·교육 | 구버전0.1~0.4의 언어/수치/상품/RNG/종료경계 golden을 보존한다. | PASS | F3 726 Node 검사에 기존01~04 원정/저장 회귀 포함. L04 독립 golden3종 및03 golden PASS. F3 sky-islands 실제 IndexedDB3슬롯/운영소진/RNG/해금 격리 PASS. 모든 가능한 저장 파일을 전수 검사했다는 뜻은 아님. |
| P082 | 저장·표시·교육 | 새0.5에서0.4지원의 정확한버전문자열때문에 운영/sky문법/실습이꺼지지 않는다. | PASS | F3: 현재 기본05 guided-browser47 checks에서 실제 실습 진행/완료. L 새05 sky문법 및 B/V 새05 운영 PASS. 기존04 테스트는 legacy helper로 별도 보존. |
| P083 | 저장·표시·교육 | 보스첫턴안전저장/로드가 선택사본/턴키/encountercursor를 그대로복원한다. | PASS | B020 roundtrip + V FIRST_TURN_UI_INDEXEDDB_SAVE_PAGE_RELOAD_LOAD_EXACT: 실제 UI 슬롯1 저장/페이지 reload/로드 전체 state deepEqual. |
| P084 | 저장·표시·교육 | 봉인ID가 DISCARD/DRAW에있는 정상상태와 잘못된ID/OPERATION/미래턴손상을 구분한다. | PASS | B021/B022/B023. DISCARD/DRAW는 정상, 없는 ID/OPERATION/미래턴/조합대는 fail closed. |
| P085 | 저장·표시·교육 | 허용안전저장 외 새중전투저장을 임의추가하지 않는다. roundtrip과실제UI검사구분. | PASS | canSaveRun diff는 기존04 safe 조건을05에 확장; C intro false/첫 battle true + B020 roundtrip + V 실제 첫턴 슬롯 구분. |
| P086 | 저장·표시·교육 | 보스종료/새원정/다른지역에 봉인표식·state가누출되지 않는다. | PASS | B025 + V NO_SEAL_UI_LEAK_IN_OTHER_BATTLE; 종료/새 전투는 isTurnSealed false·표식 없음. |
| P087 | 저장·표시·교육 | 봉인문구가 배치금지와교환가능을 설명하고 정확한봉인사본에반응한다. | PASS | V FIRST_SEAL_EXACT_COPY_AND_RULE/SEALED_CHECK_EXCHANGE_ALLOWED_NO_RESEAL; exact badge·교환 안내·손패 밖 상태. |
| P088 | 저장·표시·교육 | 형태/도감은 GERUND/PARTICIPLE/PROGRESSIVE 역할을 한글로 정확히 구분한다. | PASS | U 고정 한글 label + V SUBMITTED_ROLE_* 6종을 수정 후 재실행. role-16.png에서 바깥 you 목적어·전체 to read books 목적격보어·내부 read 비정형 동사구·books 내부 목적어 분리. 내부 read 오표시는 L 회귀와 V 재캡처로 수정 검증. |
| P089 | 저장·표시·교육 | 도감 고정예문UI·자동번역·내부VALID문구를 되살리지 않는다. | PASS | V SUBMITTED_ROLE_*는 VALID/내부 enum/node/뜻 참고/고정 학습 예문 미노출을 assertion. 고정 안내는 grammarGuideData 데이터. |
| P090 | 저장·표시·교육 | 교육문구와 example검토표가 있고 교사실검수 미실행을 솔직히 표시한다. | PASS | docs/EDUCATION_REVIEW_0.5.md에 실제 검토 예문·표시 근거·경계 및 교사 실검수 NOT RUN 명시. 교사의 검증 자체는 미실행. |
| P091 | 저장·표시·교육 | 분사수식과거짓진행/동명사오개념을 막는 회귀사례가 있다. | PASS | L G025/G033/G037/G038/G039 + U submitted nonfinite labels…; 분사/진행/동명사 동일 형태의 실제 역할 구별. |
| P092 | 저장·표시·교육 | 새실습40/126·3줄형태메뉴·4룬재정렬/체크UX가 보존된다. | PASS | F3 guided-browser/helpers 실제40/70/126 점수 gate, time-canyon 룬 ▲▼/드래그 및 sky4슬롯 배치 회귀 PASS. 사막36검사에서3줄메뉴/체크·B 재정렬 봉인 무변경 추가 확인. 모든4슬롯 조합의 전수 검사는 아님. |
| P093 | 실행·인계 | 최종npm test/data/build 결과와중간실패원인/고친범위를 보존한다. | PASS | F3 commands.json의 실제 최종 npm.cmd test 726/726(실패/skip0), validate:data2748, build70modules 모두 exit0. F/F2 통과와 F2 중첩 분석 발견 후 중단을 별도 기록하며, 중간 실패/수정 근거는 TEST_REPORT_0.5.md 및 원본 로그 보존. |
| P094 | 실행·인계 | 기존공식browser+새desert/seal을 실제실행, 미실행은NOT RUN. | PASS | F3 commands.json의 npm.cmd run test:browser exit0: 공식13스크립트261 checks(기존225+사막36), 마지막 사막36검사/20캡처/errors0 완료. Vscore9검사/5캡처는 별도 집중 실행이며 공식261에 중복 합산하지 않음. |
| P095 | 실행·인계 | 3해상도/손패10·14/조합16/룬4에서 봉인/버리기/공격/운영겹침없음. | PASS | V CAPACITY_1024_10/14,1280_10/14,1366_10/14를 후속36검사에서 다시 실행. 16조합·4룬·2운영·봉인/체크/공격/버리기 geometry assertion, 1366×768/14캡처 직접 확인. |
| P096 | 실행·인계 | 4모드총10000덱/첫패를 최종검사하고 기존golden과 구분한다. | PASS | D: actual generator 4모드 각2500, 총10000 PASS/failures0. 이전8덱 golden과 별개 실행, 승률 자료 아님. |
| P097 | 실행·인계 | 80명령원정의 승패·도달지역·기술오류/정책오류를 보고하고 사람승률로 부르지 않는다. | PASS | N: 실제 Controller80원정, 10완료/70패배/기술오류0; 명령·도달지역 summary 보존. 자동 정책이며 사람 승률 아님. |
| P098 | 실행·인계 | 최소1회 production실제UI22전투를 주입없이완주, seed/선택/명령/캡처를 보존한다. | PASS | final3/e2e/production-browser.json: 실제 dist /grammardealer/ STANDARD/run-sequence.13, 무주입22전투,49공격,516기록 명령,31checks,47고유PNG, 전체 영상. 실제 npm.cmd run test:e2e 종료0. |
| P099 | 실행·인계 | 자연원정운영사용유무와 지정상태운영+봉인검사를 구분한다. | PASS | 위 production 자연 획득 운영4회(13/16/18/21전투)와 exhausted 정확 저장복원. 지정 봉인/보급/탐색/같은사본 복귀는 browser-desert36검사 별도 근거로 명시. |
| P100 | 실행·인계 | 초기자원로드뒤오프라인계속플레이·프로필저장·콘솔/페이지오류·debug차단확인. | PASS | Production 초기 자원 로드 뒤 offline22전투/새원정/완료저장·복원, Stage1~5 각1회/profile/story0; page/console/error requests/400응답0, 외부runtime요청0, production debug query/hash 차단 PASS. |
| P101 | 실행·인계 | 실기기/미실행브라우저/교사검수/전체48전투는 미검증을 명확히 표시한다. | PASS | 이 보고서에 실기기/미실행 엔진/교사/48전투 모두 NOT RUN 명시. 이것은 미검증 공개 요건만 PASS이며 실제 검증 PASS가 아님. |
| P102 | 실행·인계 | 패치/인수/언어/봉인/교육/진행/알려진문제 인계를 제출한다. | PASS | PATCH_NOTES/TEST_REPORT/PROJECT_HANDOFF/ARCHITECTURE/LANGUAGE_SCOPE/DECISIONS/NEXT_STEPS/KNOWN_ISSUES/PROGRESS 및 언어·Frame·교육·봉인 검토표와 validation/v0.5 증거 작성. 과거71개 해시 복원. 실기기/교사/48전투 미검증을 분리. 원격 P103은 별도. |
| P103 | 실행·인계 | 브랜치push·PR까지만수행, main자동수정·merge·승인없는배포없음. | PASS | 개발 브랜치 codex/v0.5-wish-desert-nonfinite-seal을 push, 구현 커밋 f77eaf11852f95e9aed7bab1ebae1c2a9875c2db. main 대상 PR #7 생성(https://github.com/YEOMT/grammardealer/pull/7), open/ready, auto_merge=null. base main6d2907ed 그대로; workflow/main/Pages 설정 변경·merge·공개 배포 없음. |

실제 production·인계·원격 전달까지 완료했다.

최종 인수 항목 집계: **103 PASS / 0 FAIL / 0 NOT RUN**. P090/P101의 PASS는 교사·실기기·전체48전투의 **NOT RUN/범위 밖을 정확히 공개한 요건**이며 그 실검증 통과가 아니다. Production은49실제공격·22전투·47PNG이며 지정 상태/Node 정책을 대체 근거로 사용하지 않았다. [PR #7](https://github.com/YEOMT/grammardealer/pull/7).
