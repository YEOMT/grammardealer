# 0.6 인수 조건 실제 결과

PASS 172 / FAIL 0 / NOT RUN 1. 개별 실행 수준은 근거를 따른다.

첨부 JSON은 기대값으로 보존했다. 아래는 이번 실행과 코드 대조 결과이며 과거 PASS를 재사용하지 않는다. production의 정상 실습 스킵은 명세§12.3에 따른다. 실기기 및 추가 학습 코스의 미검사는 TEST_REPORT_0.6.md에서 별도로 명시한다.

| ID | 상태 | 요구사항 | 실제 근거 |
|---|---|---|---|
| P001 | PASS | 작업 시작 시점 최신 origin/main을 유일한 코드 기준으로 사용하고 시작 SHA와 clean/dirty 상태를 기록한다. | 기준·작업 전 읽기: TEST_REPORT_0.6.md; origin/main 94aedf6, clean checkout, 원본 명세 hash |
| P002 | PASS | AGENTS.md, README, PROJECT_HANDOFF, ARCHITECTURE, 0.5.1 테스트 보고서를 먼저 읽는다. | 기준·작업 전 읽기: TEST_REPORT_0.6.md; origin/main 94aedf6, clean checkout, 원본 명세 hash |
| P003 | PASS | 0.5.1의 22전투·언어·점수·룬·운영·봉인·튜토리얼·저장 계약을 보존한다. | tests/v06-legacy.test.js, v06-policies.test.js; 독립 원본 0.5.1 golden과 기존 전체 회귀 |
| P004 | PASS | 새 작업 브랜치는 codex/v0.6-mirror-snowfield-frost-cards로 생성한다. | Git 현재 브랜치 codex/v0.6-mirror-snowfield-frost-cards |
| P005 | PASS | 게임·저장 계약은 0.6.0으로 올리고 기존 0.1~0.5.1 저장 버전을 계속 읽는다. | tests/v06-legacy.test.js, v06-policies.test.js; 독립 원본 0.5.1 golden과 기존 전체 회귀 |
| P006 | PASS | 0.6의 언어·문법·밸런스·콤보·학습 기록·보상 정책은 별도 버전 view를 사용한다. | tests/v06-legacy.test.js, v06-policies.test.js; 독립 원본 0.5.1 golden과 기존 전체 회귀 |
| P007 | PASS | frozen 0.4 시작 덱 생성기, GUIDED_VERSION 0.2.1, 기존 룬 정의를 임의 변경하지 않는다. | tests/v06-legacy.test.js, v06-policies.test.js; 독립 원본 0.5.1 golden과 기존 전체 회귀 |
| P008 | PASS | 0.5.1 저장 원정은 Stage 5에서 끝나며 자동으로 Stage 6으로 연장되지 않는다. | tests/v06-legacy.test.js, v06-policies.test.js; 독립 원본 0.5.1 golden과 기존 전체 회귀 |
| P009 | PASS | 새 0.6 원정만 총 27전투와 STAGE6_END를 가진다. | contracts/stages/localStore 및 package diff 검토; v06-frost, v06-policies |
| P010 | PASS | IndexedDB 이름, 저장 슬롯 3개, base URL, 저장소 내부 호환 이름을 바꾸지 않는다. | contracts/stages/localStore 및 package diff 검토; v06-frost, v06-policies |
| P011 | PASS | 새 외부 API·서버·AI·프레임워크를 추가하지 않는다. | contracts/stages/localStore 및 package diff 검토; v06-frost, v06-policies |
| P012 | PASS | 새 아트·음악이 없어도 기존 이모지/CSS fallback으로 전체 기능이 완주 가능하다. | stage6.js / progression.js; v06-frost 공급·진행, snow-browser 소개/5결정 UI |
| P013 | PASS | Stage 5 보스 승리 시 0.6 원정에서만 STAGE5_CLEAR 이후 Stage 6 이동이 가능하다. | stage6.js / progression.js; v06-frost 공급·진행, snow-browser 소개/5결정 UI |
| P014 | PASS | Stage 5 보상 해결 뒤 STAGE_CLEAR가 되고 NEXT_STAGE로 Stage 6 소개 화면에 진입한다. | stage6.js / progression.js; v06-frost 공급·진행, snow-browser 소개/5결정 UI |
| P015 | PASS | Stage 6 진행은 23~27번째 전투로 고정한다. | stage6.js / progression.js; v06-frost 공급·진행, snow-browser 소개/5결정 UI |
| P016 | PASS | Stage 6 적 순서는 눈토끼→설원 늑대→눈꽃 정령→북극곰→거울뿔 사슴이다. | stage6.js / progression.js; v06-frost 공급·진행, snow-browser 소개/5결정 UI |
| P017 | PASS | Stage 6 HP 초깃값은 760/830/900/970/1280이다. | stage6.js / progression.js; v06-frost 공급·진행, snow-browser 소개/5결정 UI |
| P018 | PASS | Stage 6 소개 화면은 빙정 카드의 전투 한정 수명과 보스의 빙결핵 5개를 미리 공개한다. | stage6.js / progression.js; v06-frost 공급·진행, snow-browser 소개/5결정 UI |
| P019 | PASS | Stage 6 진입 시 세 번째 상점을 생성한다. | v06-policies: 실제 세 상점/6→8→10 제거/동결 상품; shop/rewards 변경 diff, 기존 보상 회귀 |
| P020 | PASS | 세 번째 상점은 별도 shopId·방문 이력·서비스 사용 상태를 가진다. | v06-policies: 실제 세 상점/6→8→10 제거/동결 상품; shop/rewards 변경 diff, 기존 보상 회귀 |
| P021 | PASS | 세 번째 상점은 룬 2개·카드 3개·연마 1회·제거 1회를 제공한다. | v06-policies: 실제 세 상점/6→8→10 제거/동결 상품; shop/rewards 변경 diff, 기존 보상 회귀 |
| P022 | PASS | 유료 제거 누적 가격은 앞선 상점에서 이어진다. | v06-policies: 실제 세 상점/6→8→10 제거/동결 상품; shop/rewards 변경 diff, 기존 보상 회귀 |
| P023 | PASS | 상점 생성·구매·닫기·저장·불러오기는 shop RNG를 재추첨하지 않는다. | v06-policies: 실제 세 상점/6→8→10 제거/동결 상품; shop/rewards 변경 diff, 기존 보상 회귀 |
| P024 | PASS | Stage 6 일반전과 보스 보상은 기존 혼합 3칸 확률표를 유지한다. | v06-policies: 실제 세 상점/6→8→10 제거/동결 상품; shop/rewards 변경 diff, 기존 보상 회귀; 확률표 불변, rewardVersion만 새06 경로 |
| P025 | PASS | Stage 6 보스 승리 시 STAGE6_CLEAR 사건을 정확히 한 번 기록한다. | v06-frost: 마지막 결정 실제 SUBMIT→보상→STAGE6_END, 프로필 최고6/중복 사건 회귀 |
| P026 | PASS | Stage 6 보스 보상 해결 뒤 CONTENT_COMPLETE/STAGE6_END가 된다. | v06-frost: 마지막 결정 실제 SUBMIT→보상→STAGE6_END, 프로필 최고6/중복 사건 회귀 |
| P027 | PASS | Stage 6은 전체 48전투 스토리 클리어로 기록되지 않는다. | v06-frost: 마지막 결정 실제 SUBMIT→보상→STAGE6_END, 프로필 최고6/중복 사건 회귀 |
| P028 | PASS | Stage 6 클리어 프로필의 highestCompletedStage는 6이 된다. | v06-frost: 마지막 결정 실제 SUBMIT→보상→STAGE6_END, 프로필 최고6/중복 사건 회귀 |
| P029 | PASS | Stage 6 완료 사건·보상·프로필 적용은 멱등적이다. | v06-frost: 마지막 결정 실제 SUBMIT→보상→STAGE6_END, 프로필 최고6/중복 사건 회귀 |
| P030 | PASS | 빙정 카드는 문법 엔진에 전달되는 cardKind WORD다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P031 | PASS | 빙정 카드는 운영 카드가 아니며 손패의 사용 버튼으로 발동하지 않는다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P032 | PASS | 빙정 카드 인스턴스는 activeCardIds 영구 덱에 들어가지 않는다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P033 | PASS | 전투 상태에는 temporaryCardIds와 shatteredTemporaryIds를 명시적으로 보존한다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P034 | PASS | 각 임시 인스턴스는 현재 battleId에 귀속되고 다른 전투로 이동할 수 없다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P035 | PASS | 빙정 카드는 손패·드로우·버린 카드·조합대에서 일반 WORD처럼 이동한다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P036 | PASS | 빙정 카드는 카드 클릭과 드래그로 조합대에 올릴 수 있다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P037 | PASS | 빙정 카드는 일반 카드와 같은 버리기 체크·교환 규칙을 사용한다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P038 | PASS | 탐색은 드로우 더미의 빙정 WORD를 선택할 수 있다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P039 | PASS | 보급은 기존 드로우·재셔플 규칙으로 빙정 카드를 뽑을 수 있다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P040 | PASS | 빙정 카드는 손패 한도와 문장 16장 한도에 정상 포함된다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P041 | PASS | 조합대에 올렸다가 회수하는 행동은 빙정 카드를 소비하지 않는다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P042 | PASS | 공격 확정에 제출된 빙정 카드는 문장 결과와 관계없이 shatteredTemporaryIds로 이동한다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P043 | PASS | 제출된 빙정 카드는 일반 discard로 들어가 다시 뽑히지 않는다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P044 | PASS | INVALID_CORE 제출에서도 빙정 카드는 깨지지만 보스 결정은 깨지지 않는다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P045 | PASS | VALID/VALID_WITH_ISSUES 공격에서 문법적으로 기여한 빙정 카드만 보스 결정 자격을 가진다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P046 | PASS | 교환으로 버린 빙정 카드는 깨지지 않고 정상 discard로 이동한다. | v06-frost F001–F018: 실제 물리 임시 WORD의 이동·교환·운영·제출/coverage; snow-browser 3엔진 |
| P047 | PASS | 전투 종료 시 손패·드로우·버림·조합대·깨진 영역의 모든 빙정 인스턴스를 정리한다. | v06-frost F017–F020/패배/변조 검사; frostCards partition, LocalStore 실제 IndexedDB 복원 |
| P048 | PASS | 전투 종료 뒤 빙정 인스턴스가 cardInstances나 다음 전투 pile에 남지 않는다. | v06-frost F017–F020/패배/변조 검사; frostCards partition, LocalStore 실제 IndexedDB 복원 |
| P049 | PASS | 빙정 단어의 lexeme는 원정 사전에 만난 단어로 남을 수 있으나 보유 카드 수에는 포함되지 않는다. | v06-frost F017–F020/패배/변조 검사; frostCards partition, LocalStore 실제 IndexedDB 복원 |
| P050 | PASS | 상점·보상·연마·제거 대상에는 현재 전투의 빙정 인스턴스가 나타나지 않는다. | v06-frost F017–F020/패배/변조 검사; frostCards partition, LocalStore 실제 IndexedDB 복원 |
| P051 | PASS | 빙정 인스턴스 ID는 runId·battleNumber·정렬된 index로 충돌 없이 결정한다. | v06-frost F017–F020/패배/변조 검사; frostCards partition, LocalStore 실제 IndexedDB 복원 |
| P052 | PASS | 빙정 공급은 reward/shop/encounter RNG를 오염시키지 않고 deck RNG와 명시적 배치 정책만 사용한다. | v06-frost F017–F020/패배/변조 검사; frostCards partition, LocalStore 실제 IndexedDB 복원 |
| P053 | PASS | 같은 시드·같은 행동은 같은 빙정 종류·인스턴스·초기 위치를 재현한다. | v06-frost F017–F020/패배/변조 검사; frostCards partition, LocalStore 실제 IndexedDB 복원 |
| P054 | PASS | 저장·불러오기는 이미 생성된 빙정과 pile 위치를 그대로 복원하고 다시 생성하지 않는다. | v06-frost F017–F020/패배/변조 검사; frostCards partition, LocalStore 실제 IndexedDB 복원 |
| P055 | PASS | 전투 시작 안전 저장에는 빙정 상태가 포함된다. | v06-frost F017–F020/패배/변조 검사; frostCards partition, LocalStore 실제 IndexedDB 복원 |
| P056 | PASS | 깨진 빙정이 있는 전투 중 안전 저장이 허용되는 경우 shattered 상태를 정확히 복원한다. | v06-frost F017–F020/패배/변조 검사; frostCards partition, LocalStore 실제 IndexedDB 복원 |
| P057 | PASS | 일반전 첫 손패에는 해당 전투 핵심 빙정이 최소 1장 보인다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P058 | PASS | 보스 첫 손패에는 결정 대상 빙정이 최소 2장 보인다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P059 | PASS | 보스의 첫 세 turnDraw 구간에는 가능한 한 각 1장 이상의 추가 빙정을 배치한다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P060 | PASS | 손패 한도 때문에 드로우가 잘린 경우 빙정에 별도 지연 드로우 크레딧을 만들지 않는다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P061 | PASS | 영구 카드 보존식과 임시 카드 보존식을 분리해 중복·유실·외부 ID를 거절한다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P062 | PASS | 6-1은 than과 more 임시 카드를 공급한다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P063 | PASS | 6-2는 most와 the 임시 카드를 공급한다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P064 | PASS | 6-3은 as 두 장과 twice 한 장을 공급한다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P065 | PASS | 6-4는 too·enough·to 임시 카드를 공급한다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P066 | PASS | 6-5는 than, as×2, more, most, too, enough, twice의 결정 대상 8장을 공급한다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P067 | PASS | 현재 덱에 비교·정도 문장을 만들 형용사/부사가 전혀 없으면 검수된 good 임시 지원 카드를 추가한다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P068 | PASS | 지원용 the/to/good 임시 카드는 보스 결정 대상 8장과 구분한다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P069 | PASS | 각 전투 공급 목록·지원 fallback·opening 보정은 trace에 기록한다. | v06-frost 공급 5전투 / v06-policies fallback·RNG; final2 snow-decks 10,000건 |
| P070 | PASS | 0.6 language registry는 0.5 registry를 복제해 확장하고 과거 view를 변형하지 않는다. | v06-policies 전수 형태/ID/원본 view 검사; COMPARISON_MORPHOLOGY_AUDIT_0.6.md; snow-browser 형태 메뉴 |
| P071 | PASS | than/as/more/most/too/enough/twice lexeme와 일반 WORD 정의를 등록한다. | v06-policies 전수 형태/ID/원본 view 검사; COMPARISON_MORPHOLOGY_AUDIT_0.6.md; snow-browser 형태 메뉴 |
| P072 | PASS | 신규 일반 카드 정의는 starterEligible=false다. | v06-policies 전수 형태/ID/원본 view 검사; COMPARISON_MORPHOLOGY_AUDIT_0.6.md; snow-browser 형태 메뉴 |
| P073 | PASS | 보상·상점용 신규 단어는 Stage 6 클리어 전에는 정규 카드 후보에서 제외한다. | v06-policies 전수 형태/ID/원본 view 검사; COMPARISON_MORPHOLOGY_AUDIT_0.6.md; snow-browser 형태 메뉴 |
| P074 | PASS | 임시 빙정 공급은 정규 보상 해금 여부와 무관하게 해당 cardDef을 인스턴스화할 수 있다. | v06-policies 전수 형태/ID/원본 view 검사; COMPARISON_MORPHOLOGY_AUDIT_0.6.md; snow-browser 형태 메뉴 |
| P075 | PASS | 형용사·부사의 비교 방식은 INFLECTED/PERIPHRASTIC/IRREGULAR/BOTH로 수동 검수한다. | v06-policies 전수 형태/ID/원본 view 검사; COMPARISON_MORPHOLOGY_AUDIT_0.6.md; snow-browser 형태 메뉴; non-degree 부사는 gradable=false, twice는 빈도/배수로만 사용 |
| P076 | PASS | 비교급·최상급 Form은 기존 형용사/부사 카드의 형태이며 별도 -er/-est 카드를 만들지 않는다. | v06-policies 전수 형태/ID/원본 view 검사; COMPARISON_MORPHOLOGY_AUDIT_0.6.md; snow-browser 형태 메뉴 |
| P077 | PASS | good→better→best, bad→worse→worst를 불규칙 형태로 지원한다. | v06-policies 전수 형태/ID/원본 view 검사; COMPARISON_MORPHOLOGY_AUDIT_0.6.md; snow-browser 형태 메뉴 |
| P078 | PASS | big→bigger→biggest, happy→happier→happiest 등 철자 변화를 수동 데이터로 검수한다. | v06-policies 전수 형태/ID/원본 view 검사; COMPARISON_MORPHOLOGY_AUDIT_0.6.md; snow-browser 형태 메뉴 |
| P079 | PASS | 긴 형용사·-ly 부사는 more/most 구조를 사용하고 잘못된 자동 -er/-est를 만들지 않는다. | v06-policies 전수 형태/ID/원본 view 검사; COMPARISON_MORPHOLOGY_AUDIT_0.6.md; snow-browser 형태 메뉴 |
| P080 | PASS | 형태 메뉴는 원급/비교급/최상급 그룹을 표시한다. | v06-policies 전수 형태/ID/원본 view 검사; COMPARISON_MORPHOLOGY_AUDIT_0.6.md; snow-browser 형태 메뉴 |
| P081 | PASS | 같은 surface의 다른 시제·정도 Form ID를 UI 편의 때문에 삭제하지 않는다. | v06-policies 전수 형태/ID/원본 view 검사; COMPARISON_MORPHOLOGY_AUDIT_0.6.md; snow-browser 형태 메뉴 |
| P082 | PASS | 비교급은 inflected comparative 또는 more+원급과 선택적인 than 기준을 분석한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P083 | PASS | 최상급은 the+-est 또는 the most+원급을 분석한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P084 | PASS | as ~ as는 두 개의 실제 as 카드와 원급 형용사/부사를 요구한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P085 | PASS | twice as ~ as는 as ~ as 구조 위에 배수 비교 증거를 추가한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P086 | PASS | too+형용사/부사와 형용사/부사+enough를 분석한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P087 | PASS | too/enough 뒤의 to부정사는 기존 Stage 5 비정형 구조를 재사용한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P088 | PASS | more+복수/불가산 명사와 most+복수/불가산 명사를 정상 수량 표현으로 분석한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P089 | PASS | 문장 끝 twice를 정상 부사로 분석한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P090 | PASS | more big, more better, most biggest 같은 이중 비교 표지는 정확성 이슈를 낸다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P091 | PASS | as 사이에는 비교급·최상급이 아니라 원급을 요구한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P092 | PASS | superlative의 검수된 학교 문법 범위에서 the 또는 허용 한정사를 확인한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P093 | PASS | 비교 기준은 명사구 또는 지원 가능한 완전한 절로 제한한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P094 | PASS | 의미상 비교 대상이 기묘하다는 이유로 문법 점수를 차단하지 않는다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P095 | PASS | 표면 문자열 존재만으로 비교·정도 문법 hit를 만들지 않는다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P096 | PASS | 각 hit는 실제 cardIds·markerIds·범위·parent clause를 보존한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P097 | PASS | 분석 후보 선택은 점수가 높은 분석이 아니라 고정된 학교 문법 우선순위를 사용한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P098 | PASS | 새 비교 구조가 없어도 기존 1~5형식·시제·접속사·준동사 문장이 회귀 없이 분석된다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P099 | PASS | 해금 전에도 구조상 올바른 비교 문장은 정답이며, 해금은 콤보 자격만 제어한다. | v06-language G001–G032 및 실제 marker/coverage/해금 검사; v06-policies well/최상급 부사; parser 고정 우선순위 |
| P100 | PASS | 비교급 콤보는 공격당 한 번 ×1.8이다. | v06-language S001–S009 실제 단계별 산술; 기존 scoring/rune golden 회귀, v06-legacy 독립 원본 공격 |
| P101 | PASS | 최상급 콤보는 공격당 한 번 ×1.9이다. | v06-language S001–S009 실제 단계별 산술; 기존 scoring/rune golden 회귀, v06-legacy 독립 원본 공격 |
| P102 | PASS | as ~ as 콤보는 공격당 한 번 ×1.8이다. | v06-language S001–S009 실제 단계별 산술; 기존 scoring/rune golden 회귀, v06-legacy 독립 원본 공격 |
| P103 | PASS | too/enough 정도 표현은 공격당 한 번 ×1.5다. | v06-language S001–S009 실제 단계별 산술; 기존 scoring/rune golden 회귀, v06-legacy 독립 원본 공격 |
| P104 | PASS | twice as ~ as는 ×1.8 이후 +20을 한 번 적용한다. | v06-language S001–S009 실제 단계별 산술; 기존 scoring/rune golden 회귀, v06-legacy 독립 원본 공격 |
| P105 | PASS | more/most 수량 표현과 문장 끝 twice는 정상 문법이지만 비교 콤보를 자동 지급하지 않는다. | v06-language S001–S009 실제 단계별 산술; 기존 scoring/rune golden 회귀, v06-legacy 독립 원본 공격 |
| P106 | PASS | Stage 6 지역 ×1.25는 실제 비교·정도 대상 hit가 있을 때만 한 번 적용한다. | v06-language S001–S009 실제 단계별 산술; 기존 scoring/rune golden 회귀, v06-legacy 독립 원본 공격 |
| P107 | PASS | 빙정 카드가 있다는 이유만으로 지역 배수나 비교 콤보를 주지 않는다. | v06-language S001–S009 실제 단계별 산술; 기존 scoring/rune golden 회귀, v06-legacy 독립 원본 공격 |
| P108 | PASS | 새 계산 순서는 기존 문형·시간·준동사 뒤, 연결·수식·룬·지역 앞에 비교/정도를 배치한다. | v06-language S001–S009 실제 단계별 산술; 기존 scoring/rune golden 회귀, v06-legacy 독립 원본 공격 |
| P109 | PASS | 모든 곱셈은 기존 정책처럼 단계마다 내림한다. | v06-language S001–S009 실제 단계별 산술; 기존 scoring/rune golden 회귀, v06-legacy 독립 원본 공격 |
| P110 | PASS | 기존 룬 순서·배율·긴 문장 룬·완전문장 보너스를 변경하지 않는다. | v06-language S001–S009 실제 단계별 산술; 기존 scoring/rune golden 회귀, v06-legacy 독립 원본 공격 |
| P111 | PASS | Stage 1~5의 기존 점수 golden을 0.6 구현으로 다시 생성해 맞추지 않는다. | v06-language S001–S009 실제 단계별 산술; 기존 scoring/rune golden 회귀, v06-legacy 독립 원본 공격 |
| P112 | PASS | 거울뿔 사슴은 bossMechanic FROST_CRYSTAL_LOCK과 빙결핵 5개를 가진다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P113 | PASS | 보스 상태는 crystalsMax=5, crystalsRemaining=5, brokenCount=0으로 시작한다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P114 | PASS | 결정 대상 빙정 카드 한 물리 사본은 최대 결정 한 개만 깨뜨린다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P115 | PASS | 한 공격에 결정 대상 빙정 2장을 정상 사용하면 결정 2개를 깬다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P116 | PASS | 비교 문법 hit가 없어도 완전한 다른 문장에서 more/most/too/enough/twice를 정상 사용하면 결정을 깰 수 있다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P117 | PASS | 영구 덱의 일반 more/as 카드는 빙정 인스턴스가 아니므로 결정을 깨뜨리지 않는다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P118 | PASS | INVALID_CORE 또는 최종 위력 0인 공격은 결정을 깨뜨리지 않는다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P119 | PASS | VALID_WITH_ISSUES라도 빙정 카드 자체가 unlicensed/excluded가 아니고 위력이 양수면 결정을 깰 수 있다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P120 | PASS | 결정 파괴 수는 남은 결정 수를 넘지 않는다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P121 | PASS | 결정이 남은 공격에서는 보스 HP가 최소 1에서 멈춘다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P122 | PASS | 결정 잠금으로 막힌 피해는 다음 공격으로 이월하지 않는다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P123 | PASS | 결정 잠금 중 overkill로 기록하지 않고 preventedDamage를 별도로 기록한다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P124 | PASS | 마지막 결정을 깨는 공격부터 HP 1 제한을 해제한다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P125 | PASS | 마지막 결정 공격의 위력이 충분하면 그 공격으로 보스를 격파한다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P126 | PASS | 결정이 모두 깨진 뒤에는 빙정 없는 기존 빌드 공격도 정상적으로 격파할 수 있다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P127 | PASS | 보스 결정 상태·파괴 attackId·preventedDamage는 저장·불러오기에서 보존된다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P128 | PASS | 동일 attackId를 재생해 결정을 두 번 깨거나 피해를 두 번 주지 않는다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P129 | PASS | 빙정 8장 중 5장만 정상 소비해도 공략 가능하며 특정 단어 순서를 강제하지 않는다. | v06-crystals B001–B015 순수 입력 + v06-frost 실제 parser/SUBMIT/저장/완료; FROST_CRYSTAL_BOSS_REVIEW_0.6.md; 지정 상태 및 검토 시드 경로에서 서로 다른 5사본, 특정 문법 hit를 요구하지 않음 |
| P130 | PASS | 빙정 WORD 카드는 일반 카드와 같은 크기·조작부를 유지한다. | snow-browser 실제 카드/체크/드래그/깨짐/HP1, 1280·1366·1920 × 손패10/14 캡처; 지정 상태 |
| P131 | PASS | 빙정 카드는 은은한 청백색 테두리와 ‘빙정 · 이번 전투 한정’ 표식을 가진다. | snow-browser 실제 카드/체크/드래그/깨짐/HP1, 1280·1366·1920 × 손패10/14 캡처; 지정 상태 |
| P132 | PASS | 빙정 디자인은 품사·단어·점수·버리기 체크를 가리지 않는다. | snow-browser 실제 카드/체크/드래그/깨짐/HP1, 1280·1366·1920 × 손패10/14 캡처; 지정 상태; 실제 14장 캡처에서 단어/점수/체크와 분리된 전투 한정 표기 확인 |
| P133 | PASS | 운영 카드와 빙정 WORD 카드의 디자인과 동작을 명확히 구분한다. | snow-browser 실제 카드/체크/드래그/깨짐/HP1, 1280·1366·1920 × 손패10/14 캡처; 지정 상태 |
| P134 | PASS | 조합대 고정 슬롯이나 미리 채워진 as/more 패턴을 만들지 않는다. | snow-browser 실제 카드/체크/드래그/깨짐/HP1, 1280·1366·1920 × 손패10/14 캡처; 지정 상태 |
| P135 | PASS | 빙정 카드 제출 시 깨짐 연출을 보여주되 상태 정산을 다시 계산하지 않는다. | snow-browser 실제 카드/체크/드래그/깨짐/HP1, 1280·1366·1920 × 손패10/14 캡처; 지정 상태 |
| P136 | PASS | 보스 화면에는 빙결핵 5개와 남은 개수가 항상 보인다. | snow-browser 실제 카드/체크/드래그/깨짐/HP1, 1280·1366·1920 × 손패10/14 캡처; 지정 상태 |
| P137 | PASS | 결정이 깨질 때 해당 개수만큼 시각 상태가 한 번 바뀐다. | snow-browser 실제 카드/체크/드래그/깨짐/HP1, 1280·1366·1920 × 손패10/14 캡처; 지정 상태 |
| P138 | PASS | HP 1 잠금 발생 시 이유를 짧고 명확하게 표시한다. | snow-browser 실제 카드/체크/드래그/깨짐/HP1, 1280·1366·1920 × 손패10/14 캡처; 지정 상태 |
| P139 | PASS | Stage 6 소개·보스 공략 모달은 핵심 규칙만 짧게 설명한다. | snow-browser 실제 카드/체크/드래그/깨짐/HP1, 1280·1366·1920 × 손패10/14 캡처; 지정 상태 |
| P140 | PASS | 도감에는 비교급(-er / more ~ than), 최상급(the -est / the most), 원급 비교(as ~ as), 정도 표현(too / enough)을 순서대로 추가한다. | snow-browser 고정 설명/임시 소유 수 검사 + 형태 메뉴; polish-ui 21항목, overlays/formView 코드 대조 |
| P141 | PASS | 새 도감 설명은 0.5.1의 ‘제목(형태)+짧은 설명’ 원칙을 지킨다. | snow-browser 고정 설명/임시 소유 수 검사 + 형태 메뉴; polish-ui 21항목, overlays/formView 코드 대조 |
| P142 | PASS | 사전의 허용 형태에는 비교급·최상급이 정확한 표기로 보인다. | snow-browser 고정 설명/임시 소유 수 검사 + 형태 메뉴; polish-ui 21항목, overlays/formView 코드 대조 |
| P143 | PASS | 현재 전투 덱/드로우/버림 화면은 빙정 카드를 표시하되 영구 보유 장수와 혼동시키지 않는다. | snow-browser 고정 설명/임시 소유 수 검사 + 형태 메뉴; polish-ui 21항목, overlays/formView 코드 대조 |
| P144 | PASS | STAGE5_CLEAR 시 현재 0.6 원정에 pack.comparison과 pack.degree를 부여한다. | v06-policies 해금/등급/상점 후보; v06-frost Stage6 프로필→새 원정 baseline/combo 분리; rewards/shop diff |
| P145 | PASS | 비교 구조는 팩이 없어도 문법적으로 유효하지만 점수 콤보는 팩으로 제어한다. | v06-policies 해금/등급/상점 후보; v06-frost Stage6 프로필→새 원정 baseline/combo 분리; rewards/shop diff |
| P146 | PASS | STAGE6_CLEAR 시 pack.snowWords.reward를 현재 원정과 프로필에 부여한다. | v06-policies 해금/등급/상점 후보; v06-frost Stage6 프로필→새 원정 baseline/combo 분리; rewards/shop diff |
| P147 | PASS | Stage 6 클리어 후 일반 as/than/too 카드는 COMMON 후보가 된다. | v06-policies 해금/등급/상점 후보; v06-frost Stage6 프로필→새 원정 baseline/combo 분리; rewards/shop diff |
| P148 | PASS | Stage 6 클리어 후 more/most/enough는 UNCOMMON 후보가 된다. | v06-policies 해금/등급/상점 후보; v06-frost Stage6 프로필→새 원정 baseline/combo 분리; rewards/shop diff |
| P149 | PASS | Stage 6 클리어 후 twice는 RARE 후보가 된다. | v06-policies 해금/등급/상점 후보; v06-frost Stage6 프로필→새 원정 baseline/combo 분리; rewards/shop diff |
| P150 | PASS | 신규 일반 카드의 reward/shop eligibility는 requiredUnlockId를 실제로 검사한다. | v06-policies 해금/등급/상점 후보; v06-frost Stage6 프로필→새 원정 baseline/combo 분리; rewards/shop diff |
| P151 | PASS | 과거 프로필에 Stage6 완료 기록이 없으면 새 단어 정규 보상이 조기에 나오지 않는다. | v06-policies 해금/등급/상점 후보; v06-frost Stage6 프로필→새 원정 baseline/combo 분리; rewards/shop diff |
| P152 | PASS | Stage6 완료 프로필의 새 0.6 원정에서는 조기 보상으로 새 단어를 얻을 수 있으나 비교 콤보는 Stage5_CLEAR 전까지 잠긴다. | v06-policies 해금/등급/상점 후보; v06-frost Stage6 프로필→새 원정 baseline/combo 분리; rewards/shop diff |
| P153 | PASS | 빙정 임시 공급은 보상·상점의 일반 카드 중복 필터나 가격 정책을 바꾸지 않는다. | v06-policies 해금/등급/상점 후보; v06-frost Stage6 프로필→새 원정 baseline/combo 분리; rewards/shop diff |
| P154 | PASS | 비교 형태 전수표와 교육 검토 문서를 작성한다. | COMPARISON_MORPHOLOGY_AUDIT_0.6.md / FROST_CARD_LIFECYCLE_REVIEW_0.6.md / FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P155 | PASS | 빙정 카드 수명·pile partition·저장 검토 문서를 작성한다. | COMPARISON_MORPHOLOGY_AUDIT_0.6.md / FROST_CARD_LIFECYCLE_REVIEW_0.6.md / FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P156 | PASS | 보스 결정 상태·HP floor·멱등성 검토 문서를 작성한다. | COMPARISON_MORPHOLOGY_AUDIT_0.6.md / FROST_CARD_LIFECYCLE_REVIEW_0.6.md / FROST_CRYSTAL_BOSS_REVIEW_0.6.md |
| P157 | PASS | 기존 npm test를 삭제·skip·완화하지 않고 모두 통과시킨다. | 최종 명령/종료 코드와 TEST_REPORT_0.6.md; assertions/skip 완화 없음 |
| P158 | PASS | npm run validate:data를 통과한다. | 최종 명령/종료 코드와 TEST_REPORT_0.6.md; assertions/skip 완화 없음 |
| P159 | PASS | npm run build를 통과한다. | 최종 명령/종료 코드와 TEST_REPORT_0.6.md; assertions/skip 완화 없음 |
| P160 | PASS | 기존 npm run test:browser 전체를 통과한다. | 공식14개 browser 전체 종료 및 Chromium/Firefox/WebKit 설원 보고서; 짧은 HP1 안내는 RAF 관측 |
| P161 | PASS | Stage 6 전용 browser script를 공식 test:browser에 추가한다. | package.json test:browser 마지막에 tests/snow-browser.mjs 추가; skip 없음 |
| P162 | PASS | Firefox·WebKit 핵심 smoke에서 빙정 조작과 보스 결정 UI를 확인한다. | 공식14개 browser 전체 종료 및 Chromium/Firefox/WebKit 설원 보고서; 짧은 HP1 안내는 RAF 관측 |
| P163 | PASS | 시작 덱 10,000건 검사는 28장 영구 덱 기준을 유지한다. | test:decks:desert 10,000 + test:decks:snow 10,000; 시작28장과 frost 별도 partition |
| P164 | PASS | Stage 6 자동 원정은 실제 Controller·RNG·드로우·교환·운영·빙정을 사용한다. | test:runs:snow final2: 실제 Controller/RNG 80원정, 오류0·완주0·패배80. 사람 승률 아님 |
| P165 | PASS | 자동 원정 완주율을 사람 승률로 보고하지 않는다. | test:runs:snow final2: 실제 Controller/RNG 80원정, 오류0·완주0·패배80. 사람 승률 아님 |
| P166 | PASS | production dist의 실제 UI로 튜토리얼 포함 27전투를 완주한다. | final3 production UI27전투/62공격/32checks, 정상 실습 스킵(명세§12.3 허용). 전체 실습40/126은 별도 guided-browser47검사. 같은 원정에서 둘을 수행했다고 주장하지 않음. |
| P167 | PASS | production 완주에서 세 번째 상점·각 빙정 전투·보스 5결정·저장 복원을 실제 클릭한다. | production-browser.json: 세 번째 상점/5개 설원 전투/5결정/HP1/중간·완료 저장복원 실제 클릭. 별도 모든 가이드 문형 production 학습 코스는 NOT RUN이며 TEST_REPORT에 구분. |
| P168 | PASS | 합성 산술·지정 상태·자동 원정·production UI 완주를 보고서에서 구분한다. | TEST_REPORT_0.6.md의 네 검증 수준; 독립 original051 golden, frost RNG 비교 |
| P169 | PASS | 빙정 opener 보정이 실제 난수 조작 범위를 넘어 보상·상점 결과를 바꾸지 않는지 확인한다. | TEST_REPORT_0.6.md의 네 검증 수준; 독립 original051 golden, frost RNG 비교 |
| P170 | PASS | 기존 0.5.1 golden registry/덱/보상/상점/공격을 보존한다. | TEST_REPORT_0.6.md의 네 검증 수준; 독립 original051 golden, frost RNG 비교 |
| P171 | NOT RUN | 실제 iPad/Android/Safari 실기기, 교사 최종 검수, 스피커 청취는 실행하지 않으면 NOT RUN으로 쓴다. | 실제 iPad/Android/Safari 기기, 교사 최종 검수, 스피커 청취는 이번에 수행하지 않음 |
| P172 | PASS | 완료 후 작업 브랜치를 push하고 main 대상 PR을 생성한다. | 개발 브랜치 push 완료: 구현 41529ade69119ab09c3166a8a673d6b097ae58cf; main 대상 PR https://github.com/YEOMT/grammardealer/pull/9 생성, open/auto_merge=null |
| P173 | PASS | main 직접 push·자동 merge·Pages 설정 변경·공개 배포를 하지 않는다. | main 직접 push/merge/auto-merge/Pages 설정 변경/공개 배포 없음; workflow 수정 없음 |
