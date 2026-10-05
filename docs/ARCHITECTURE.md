## 0.4 추가 경계

- `skyLanguage`는 0.3을 복제한다. `cardCatalog`에서 WORD와 OPERATION을 구분하며 운영을 가짜 lexeme로 등록하지 않는다. `registryForVersion`과 원정 버전이 생성·언어·점수·상품 정책을 고른다.
- `operations`는 다섯 카드 영역/효과 영수증 제안만 만든다. 탐색 창은 일시적 선택 상태이고 취소는 원정/RNG/Undo를 바꾸지 않는다. RunController만 성공 거래를 커밋하고 효과 표시 중 입력을 잠근다. `operationHistory`를 런타임과 저장 검증에서 공유한다.
- 기존 parser의 NP/AP/PP/AdvP/VP를 확장한 유한 구·절 합성이다. `skyEvidence`는 절 parent/role/frame/finite/time/card coverage와 연결 역할을 만든다. 전체 입력을 소비한 실제 분석만 정답 후보이며 점수·룬·해금으로 대표 분석을 선택하지 않는다.
- scoring 순서는 카드 → 정확성 → 완전문장 → 기준 문형 → 시간 → 연결 → 기존 수식 → 룬 → 지역 → 보스다. `skyShield`는 원본 역할 증거를 사용한다. 생략 that의 점수와 실제 접속사 카드 공략을 구분한다.
- Stage4 입장 지급은 `skyIslands`, 두 상점 저장 계약은 `skyShopValidation`으로 분리했다. 첫 상점은 닫힌 history에 보존하고 새 shopId와 상품을 만든다. 서비스는 방문별, 유료 제거 횟수는 원정 전체다.
- presentation/operationPresentation은 확정 결과를 읽으며 피해·드로우·보상을 다시 계산하지 않는다. clause/connector 시각화는 제출 후에만 보인다. 학습 기록의 없는 점수 기준 절은 null로 직렬화하여 미완성 제출 후에도 프로필 저장이 이어진다.
- 해금 프로필과 진행 중 원정 baseline은 분리한다. 과거 도감의 교육 보기 재검토는 원래 집계와 점수를 유지한다. 고정 설명은 데이터이며 번역 API/서버/외부 AI는 없다.

## 0.3 추가 경계

- timeLanguage는 0.2.2 registry를 복제해 새 형태/가산성/will을 추가한다. registryForVersion과 run.version이 실행 정책을 선택하며 기존 registry를 변형하지 않는다.
- verbPhrase는 WILL → perfect HAVE → progressive BE → 본동사 순서를 기존 predicate 탐색에 연결한다. 기존 NP/AP/PP/관계절/to절과 작업량 한도를 재사용한다. 마지막 본동사 Frame, 첫 유한 동사 일치, VP 카드 범위·절 식별·시간 증거를 분리한다.
- Scoring은 +30/문형/시간 4효과를 유리수 순차 내림으로 적용한다. comboEligibility는 실제 분석을 보존한 채 효과 자격만 거른다. 룬은 순서대로 적용하고 운석은 contributingCardIds만 센다.
- timeGolem은 원본 시간 증거와 동결한 활성 부위 하나로 순수 제안을 만든다. phaseExcess와 actualHpLoss를 분리한다. RunController만 카드/턴/HP/부위/보상/프로필을 커밋한다. invariant와 저장 validator가 역순/불일치 부위를 거절한다.
- Presentation은 확정 resolution을 읽는다. 골렘 막대/HP/외형은 IMPACT에 함께 바뀌고 중간 파괴 읽기 시간을 둔다. finish/cancel은 게임 상태를 재정산하지 않는다.
- 룬 버튼·드래그·키보드는 REORDER_RUNES로 합류한다. 거래/실습/연출 중 잠금, scroll/blur/escape/cancel 정리를 공유한다. 시작 자원은 battle rules snapshot에 남으며 재정렬로 다시 지급하지 않는다.
- 새 learning record는 동사구 전체 V와 시간 역할, phaseExcess를 보존한다. 과거 교육 재검토는 집계를 재계산하지 않는 보기 계층이다.

## 0.2.2 추가 경계

Grammar는 원정 해금과 무관한 전체 입력 구조 증거를 만든다. 기존 NP/AP/PP를 재사용하는 제한된 relative/nonfinite 재귀와 전체 Sense 후보를 탐색하고 고정 우선순위로 한 분석을 선택한다. Scoring 전에 comboEligibility가 점수 자격을 고른다. 원래 분석과 scoreableHitIds를 함께 보존하며 잠긴 문형을 다른 문형으로 치환하지 않는다.

새 INVALID_CORE 결과는 mainFrameId=null, scoreTimeline=[], finalPower=0, consumeTurn=true인 명시적 schema다. 룬/지역/보스/처치 계산에 들어가지 않는다. RunController는 분석과 profile event 제안까지 성공한 후 상태를 커밋한다. zeroReason은 INCOMPLETE_SENTENCE/ACCURACY_ZERO/BOSS_BLOCKED를 구분한다.

learningRecords는 영어 Snapshot·역할 범위·정확성·실제 효과·위력/피해를 기록한다. 완전한 문장 대표는 별도 firstComplete/bestComplete이며 부분 오류·실패는 최근 제출에 남는다. 교육용 재검증은 원 집계·경제·RNG를 바꾸지 않는 버전 1회 overlay다. 고정 문법 설명과 형태별 대명사 뜻은 grammarGuideData에 있다.

## 0.2.1 추가 경계

- guidedTutorial.js는 고정 28장, 보관한 일반 덱/RNG, 세션·시도·cue·revision 검증을 제공하고 커밋은 RunController만 수행한다. 두 공격은 기존 Grammar → Scoring → Stage 경로로 30/87을 계산한다. 완료 직전 정상 덱을 원자 복원한 다음 기존 보상 생성기를 호출한다.
- presentationClock.js는 활성 애니메이션 시간만 센다. 사용자 설명 gate와 숨겨진 탭 시간은 watchdog 예산에서 제외한다. guided 중단은 FINISH를 호출하지 않고 같은 확정 resolution 재생 또는 재시작/나가기를 제공한다. 공격 ID에는 실습 시도 번호를 포함한다.
- guidedCoach.js는 실제 DOM rect/ResizeObserver에 맞춰 안내를 배치한다. 카드 선택 체크는 본문과 분리된 44px footer 버튼이다. 충돌 강도는 finalPower/고정 최대 HP, 처치 여부와 독립적이다.
- 새 game/save/language/tutorial/presentation 계약은 0.2.1. grammar/balance/reward/meaning/runes와 shop schema는 0.2.0, generator는 0.1.1을 유지한다. registryForVersion은 0.2.0 view도 별도로 보존하여 fast가 이전 후보에 들어가지 않는다.
- 수동 저장은 실습 T01과 완료 후 기존 안전 지점만 허용한다. 진행 중 실습/gate는 저장할 수 없다. 시작 저장의 보관 덱·RNG는 로드 때 재생성하지 않는다.

# 센텐스 발라트로 0.2 구조

Vanilla JavaScript ES Modules + Vite 구조를 유지한다. 외부 API·AI·Firebase를 런타임에 호출하지 않는다. Grammar → Scoring → Rune → Stage → Presentation 경계를 유지하고 `RunController`만 실제 원정 상태를 커밋한다.

## 모듈과 소유권

| 경로 | 책임 |
| --- | --- |
| `src/main.js` | 초기화·화면 전환·개인 프로필·저장·UI 명령 연결 |
| `src/contracts.js` | 직렬화·버전·정수·ID·복사/동결 계약 |
| `src/data/language/{seed,index}.js` | Lexeme/Form/Sense/Frame/Card, 현재와 레거시 registry view, 문장 스냅샷 |
| `src/engine/grammar/{index,parser}.js` | 등록 형태·NP/PP 합성·전체 입력·오류/역할 증거·대표 분석 |
| `src/engine/{scoring,numeric}.js` | 실제 카드 기여·감점·문형/수식 점수·안전 정수와 유리수 |
| `src/data/runes.js`, `src/engine/runes.js` | 기본10+토파즈 정의·원정 자격·위→아래 적용·운영 규칙 스냅샷 |
| `src/data/{stage1,stage2,stages}.js` | 3+4 전투 데이터·버전별 지역 view·encounter·장막 초기 정의 |
| `src/engine/stage.js` | 룬 이후 지역/장막·HP·오버킬·상태 변경 제안 |
| `src/game/runController.js` | 명령/revision 검증·제안 복사본 커밋·정산·지역·상점·완료 |
| `src/game/deck.js` | 28장 시작 덱·실파서 witness·첫패·드로우·교환 |
| `src/game/rewards.js` | 버전별 고정 보상·현재 지역 후보·대상 선택·중복 방지 |
| `src/game/shop.js` | 항구 1회 입장 재료·고정 상점·원자적 구매/서비스 제안 |
| `src/game/{rng,invariants}.js` | 분리 시드 스트림·전투 카드 보존·자원 한도 |
| `src/services/localStore.js` | 기존 IndexedDB·수동3슬롯·저장 검증·개인 기록 멱등 사건 |
| `src/engine/meaning.js`, `src/data/koreanSenseTemplates.js` | 영어 분석을 읽는 작은 한글 참고; 점수로 역방향 의존 없음 |
| `src/game/tutorial.js`, `src/ui/tutorial.js` | 실제 성공 행동 안내·독립 재연습 |
| `src/engine/presentation.js` | 확정 이벤트의 숫자·문법/IO/DO·룬·장막·타격 재생 |
| `src/ui/{combat,progression,shop,overlays,sandbox}.js` | 화면과 모달·입력; 상태 변경/추첨/점수 계산은 Controller/엔진에 위임 |
| `src/services/{audio,assets}.js`, `src/ui/styles.css` | 합성 효과음·상대 자원/fallback·기존 반응형 배치 |

## 공격 계약

1. 편집 UI는 물리 카드 ID와 선택 형태만 바꾼다. 제출 전 Grammar/Scoring을 사용해 정답·점수·역할을 미리 표시하지 않는다.
2. 제출 시 `SentenceSnapshot.orderedTokens`를 고정하고 원정 버전의 registry로 분석한다. surface는 등록된 Lexeme/Form과 일치해야 한다.
3. Grammar는 실제 ID에 연결된 nodes/clauses/roles/hits/issues/coverage를 반환한다. SVOO는 NP(IO)+NP(DO)를 합성하며 두 NP의 전체 범위와 head 역할을 기록한다.
4. `VALID`/`VALID_WITH_ISSUES`에만 카드/감점 → 완전문장 → 주절 문형 → 수식 → 룬 → 지역 → 보스 → 최종 순으로 계산한다. 의미 참고·가격·HP는 문법 판정에 들어가지 않는다.
5. Stage는 HP 및 장막 before/after와 `proposedStateEffects`를 반환한다. Controller는 공격 ID·revision·전투 ID를 확인해 피해·사용 카드·턴·장막·기록을 한 번 커밋한다.
6. Presentation은 같은 타임라인을 읽는다. 장막은 해제 이벤트에서, HP는 타격에서 표시한다. 종료/skip/watchdog은 표시를 final 상태로 수렴시키고 `FINISH_PRESENTATION`을 한 번 호출한다. 피해를 다시 적용하지 않는다.

`ScoreEvent`는 before/after·연산/피연산자·출처·증거·카드 ID·한글 표시문을 가진다. 배수는 `{num,den}`이며 단계마다 내림한다. 안전 정수 범위를 벗어나면 기술 오류로 거절한다. 최종위력·실제 HP 감소·오버킬을 구분한다.

Stage 1은 기본 1~3형식 ×1.25, Stage 2는 주절 SVOO ×1.25다. SVOO 자체는 ×2, 토파즈는 인정된 주절 SVOO에 한 번 ×1.5/×2/×2.5다. 항구 보스 `bossMechanic={id:'SVOO_VEIL',active,multiplier:{num:1,den:4}}`는 비SVOO를 감쇠하고 첫 SVOO부터 해제된다. 합성 면역은 명시적인 테스트 옵션이며 실제 적 데이터와 분리한다.

## 상태 전환과 카드 보존

새 원정의 지역 진행은 `BATTLE → REWARD → BETWEEN_BATTLES`를 기본으로 하며 초원 최종 보상 뒤 `STAGE_CLEAR → STAGE_INTRO(stage.02) → SHOP → BATTLE`로 연결한다. 항구 최종 보상 뒤에만 `CONTENT_COMPLETE/STAGE2_END`가 된다. 구버전 원정은 `STAGE1_END`로 종료한다.

`RunState`는 순수 직렬화 값이다. Controller는 current를 복사한 proposed state에 helper를 적용하고 불변 조건을 만족한 결과만 커밋한다. 무효 명령·취소·대상 선택 대기·엔진 실패는 실제 자원·RNG를 보존한다. UI 모달 상태·체크 Set·타이머는 RunState에 넣지 않는다.

전투 중 `activeCardIds`의 모든 카드는 DRAW/HAND/SENTENCE/DISCARD 중 정확히 한 곳에 있다. 형태 선택은 sentence slot에 저장하며 CardInstance의 영구 속성이 아니다. 지역 전환 때 기존 combat을 닫고 `combat=null`인 항구 소개/SHOP에서 입장·구매·제거를 수행한다. 상점 종료 때 변경된 전체 소유 덱으로 새 piles를 만든다.

공격 룬은 제출 시 순서·레벨을 스냅샷으로 사용한다. 운영 룬은 `_beginBattle`에서 한 번 `combat.rulesSnapshot`으로 계산한다. 전투 중 재배열은 손패·교환 자원을 다시 지급하지 않는다.

승리 정산은 원정/전투별 settlement ID, 보상은 offerId/choiceId, 상점은 shopId/itemId·purchased/used 및 Controller의 commandId/revision으로 중복을 막는다. Stage 1 milestone/해금은 새 원정 보스 보상 생성 전에 적용하며 프로필과 원정에 각각 멱등 반영한다. Stage 2 완료는 별도 기록이며 전체 스토리 클리어·다회차·난이도 해금을 발생시키지 않는다.

## 입장·상점·후보 자격

`grantStage2Entry`는 현재 덱의 실제 SVOO binding을 보고 없으면 give, 선택된 대표 경로의 to/for가 없으면 그 연결 카드만 더한다. 지급은 `entryGrants['stage.02']`에 고정한다. 최대2장 후 bounded 실제 문법 witness를 검사하며 부족하면 경고한다. 이후 제거/거절·로드·재표시는 지급을 재실행하지 않는다.

`createShop`은 입장 처리 뒤 룬1+카드2와 가격을 저장한다. 지역 관련 카드1칸/전체 구현 풀1칸이며 같은 등급 안 fallback trace를 남긴다. 상품 추첨은 `rng.shop`만 쓴다. `buyShopItem`/`useShopService`는 전체 거래를 검증한 뒤 제안 복사본의 재화·instances·소유 목록·사전·구매/서비스 이력을 함께 바꾼다. `closeShop` 후에는 재방문하지 않는다.

기본10룬은 항상 후보이고 토파즈는 새0.2 원정의 `runStartUnlockBaseline ∪ runOwnUnlocks`에 실제 ID가 있어야 한다. runtimeReady와 최대레벨·manifest도 필터링한다. 공개된 보상/상점은 이후 해금으로 바뀌지 않는다. `registryForVersion`은 레거시 카드/언어 범위를 원래 순서로 제공하여 이후 보상의 후보와 RNG 사용을 보존한다.

## 저장·버전·난수

IndexedDB는 `sentence-balatro-v0-1`, version1, `profiles`/`slots`를 유지한다. 프로필 ID와 표시명은 분리하며 수동3슬롯의 transaction 완료 후 성공을 알린다. 새 원정 버전은0.2.0, 기존0.1.0/0.1.1은 원정 내용·완료 경계를 자동 확장하지 않는다.

안전 지점은 초기 전투·고정 보상·전투 사이·STAGE_CLEAR·안정된 SHOP·CONTENT_COMPLETE이다. 항구 소개 단계에서는 저장을 열지 않고 입장 후 SHOP에서 저장한다. 대상 모달/거래 중·공격 연출 중 저장하지 않는다. shop combat=null은 정상이다. 저장에는 manifest·입장 이력·상품/가격/구매·서비스 사용·paidRemovalCount·장막·RNG가 들어간다. 복원은 셔플·상품/보상 추첨을 반복하지 않는다.

`VERSIONS`는 game/save/language/grammar/balance/reward/meaning/runes를0.2.0으로 기록하고 동작이 유지된 generator/tutorial/presentation 계약은0.1.1을 유지한다. 단계별 version 문자열은 실제 관련 모듈이 보고하며 구버전 공격의 언어 context는 registry view에서 온다.

RNG는 `mulberry32-fnv1a-v1`의 deck/reward/shop/encounter 네 stream이며 state/cursor를 저장한다. runId는 식별자이고 seed에 섞지 않는다. 동일 버전·설정·초기 해금·선택·RNG에서 재현한다. UI/도감/취소/visual 효과는 게임 RNG를 소비하지 않는다.

## 검증과 변경 위치

수치 변경은 `data/balance.js`, 새 지역 HP는 `data/stage2.js`, 상점 가격은 `game/shop.js`의 `SHOP_BALANCE`에서 이뤄진다. 이번 항구 HP·가격은 명세 초깃값 그대로다. 어휘·Sense·형태를 늘릴 때는 실제 Parser 예문과 capability/레거시 검사를 함께 추가한다. 학생 UI와 Presentation은 계산값을 다시 만들지 않는다.

`tests/stage2-shop.test.js`, `tests/v02-progression-storage.test.js`, 새 언어·연출 테스트가 실제 모듈을 연결한다. 과거 main의 레거시 보상 golden fixture는72개 후보·RNG 사례를 고정한다. 10,000 시작 덱은 `simulate-decks`, 실제 명령 완주는 `simulate-runs`, 정상 초원 후 입장400시드는 `simulate-entry`가 담당한다. UI 합성 배치와 production 실제 7전투는 별도 브라우저 검사다. 정확한 실행 상태와 한계는 `TEST_REPORT_0.2.md`를 따른다.

`data/roadmap.js`의48전투·상점6회·미래 룬은 후속 메타데이터다. 활성 지역 registry에 미래 전투를 합치지 않는다. `.github/workflows/deploy-pages.yml`은 기존 main 비PR 배포 조건을 유지하며 이번 작업에서 Pages 설정이나 main을 변경하지 않는다.
