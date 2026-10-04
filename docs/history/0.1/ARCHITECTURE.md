# 센텐스 발라트로 0.1 구조

새 Vanilla JavaScript ES Modules 프로젝트이며, Vite가 배포용 정적 파일을 생성한다. 런타임에 외부 API·AI·Firebase를 호출하지 않는다. 다섯 계산/연출 엔진을 분리하고, 실제 원정 상태의 커밋은 `RunController`만 수행한다.

## 실제 모듈

| 경로 | 책임 |
| --- | --- |
| `src/main.js` | 앱 초기화, 화면 전환, 프로필/저장과 UI 연결 |
| `src/contracts.js` | 공통 버전, 직렬화·정수·ID 검사, 값 복사/동결 |
| `src/data/language/seed.js` | 선별한 어휘 제작 데이터 |
| `src/data/language/index.js` | Lexeme/Form/Sense/Frame/Card 레지스트리, 현재 가능한 형태, 문장 스냅샷 작성 |
| `src/engine/grammar/index.js` / `parser.js` | 입력 검증, 제한된 구·절 파싱, 진단, 대표 분석 정규화 |
| `src/engine/scoring.js` / `numeric.js` | 실제 카드 기여·감점·완전 문장·문형·수식 점수, 안전 정수/유리수 계산 |
| `src/engine/runes.js` | 위→아래 공격 룬 계산, 입장 시 운영 규칙 스냅샷 |
| `src/engine/stage.js` | 공격 파이프라인 통합, 지역 배수·적 HP·오버킬, 상태 변경 제안 |
| `src/engine/presentation.js` | 확정 타임라인 재생, 카드·역할·룬 점등, 돌진/타격, 실패 시 최종 화면 수렴 |
| `src/game/runController.js` | 명령 검증, 원자적 상태 반영, 턴·승리·보상·다음 전투·완료 처리 |
| `src/game/deck.js` | 조건부 30장 덱, 실파서 경로 검사, 첫패, 드로우·교환·버리기 |
| `src/game/rewards.js` | 한 번 생성하는 보상, 동일 등급 후보, 연마/제거, 룬 중복·교체, 건너뛰기 |
| `src/game/rng.js` | 저장 가능한 시드 PRNG와 deck/reward/shop/encounter 분리 스트림 |
| `src/game/invariants.js` | 물리 카드의 네 영역 보존 및 자원 한도 검사 |
| `src/services/localStore.js` | IndexedDB 개인 프로필·3슬롯, 저장 지점/버전 검증, 중복 없는 실적 이벤트 |
| `src/services/audio.js` / `assets.js` | 자체 합성 효과음, 음량/음소거, 안정적 Asset ID와 이모지 fallback |
| `src/ui/*.js` / `styles.css` | DOM 표시·입력, 전투/보상/결과/샌드박스·모달, 반응형 배치 |

## 공격 계약

1. 편집 UI는 물리 카드 ID와 형태 선택만 변경한다. 편집 중에는 Grammar/Scoring으로 예상 결과를 만들지 않는다.
2. 제출 시 `SentenceSnapshot.orderedTokens`를 고정하고 Grammar를 호출한다. 모든 surface는 등록된 Lexeme/Form에서 검증한다.
3. Grammar는 `AnalysisResult`에 `nodes`, `clauses`, `resolvedTokenRoles`, `grammarHits`, `issues`, `coverage`, 진단 정보를 반환한다. 영어 분석에 카드 등급·연마·룬·HP가 들어가지 않는다.
4. `VALID` 또는 `VALID_WITH_ISSUES`에만 `resolveAttack`을 적용한다. Scoring → Rune → Stage 순서로 하나의 `scoreTimeline`을 만들고 `AttackResolution`을 반환한다.
5. Controller는 전투 ID·revision을 확인하여 피해, 카드 이동, 턴, 확정 공격 기록을 한 번 커밋한다. 이후 Presentation이 `enemyHpBefore → enemyHpAfter`와 확정 이벤트를 재생한다.
6. 연출 완료·중단·실패 후에는 `FINISH_PRESENTATION`으로 승리/패배/다음 턴을 결정한다. 마지막 턴의 처치는 승리가 우선이다.

`ScoreEvent`는 `before/after`, 연산·피연산자, 출처, 증거 참조, 실제 카드 ID, 한글 표시문을 가진다. UI는 점수·피해를 재계산하지 않는다. 각 배수는 `{num, den}`이며 곱셈마다 내림한다. 안전 정수 범위를 벗어난 값은 기술 오류로 거절한다.

합성 면역 fixture는 `resolveAttack`의 명시적인 개발용 옵션으로만 사용할 수 있다. 현재 Stage 1 적 데이터에는 면역이나 추가 장막이 없고 플레이 흐름에서 fixture를 전달하지 않는다.

## 상태와 데이터 소유권

`RunState`는 순수 직렬화 값이다. `activeCardIds`의 각 카드는 DRAW/HAND/SENTENCE/DISCARD 중 정확히 한 곳에 존재한다. Sentence에 들어간 형태는 slot의 `selection`이며 `CardInstance`의 영구 속성이 아니다.

Controller는 제안 상태를 복사한 뒤 deck/reward helpers를 호출하고 invariant를 만족한 결과만 커밋한다. helpers가 받은 제안 복사본 외의 실제 상태를 변경하는 경로는 없다. 무효 명령·무효 문장·미지원 문장·엔진 오류는 실제 자원과 RNG를 보존한다.

공격용 룬은 제출 시 순서·레벨 스냅샷을 사용한다. 운영 룬은 `_beginBattle`의 `deriveCombatRules`에서 한 번 계산하여 `combat.rulesSnapshot`에 보관한다. 전투 도중 룬 재배열은 해당 손패·교환을 다시 지급하지 않는다.

승리 재화는 원정/전투별 settlement ID로 한 번 지급한다. 보상은 `offerId`와 `choiceId`를 검사하고, 해결된 offer에 재선택해도 중복 지급하지 않는다. 룬 교체 취소 및 제거 경고 확인 전에는 상태를 보존한다.

## 저장과 난수

IndexedDB 이름은 `sentence-balatro-v0-1`, object store는 `profiles`와 `slots`다. 프로필은 독립 `playerId`를 사용하며 표시명이 ID 역할을 하지 않는다. 원정 저장은 프로필별 1~3슬롯을 사용한다.

최초 행동 전 전투·고정 보상·전투 사이·`CONTENT_COMPLETE`만 원정 저장이 가능하다. 저장에는 카드/손패/형태/강화/룬/재화/offer/난수 위치/원정 해금 기준이 포함된다. 저장 복원에서 재셔플·보상 재추첨을 하지 않는다. IndexedDB 트랜잭션 완료 전에 저장 성공을 반환하지 않는다.

RNG는 `mulberry32-fnv1a-v1`이며 스트림별 state와 cursor를 기록한다. 원정 ID는 식별용이고 덱 seed를 바꾸지 않는다. 같은 결과 재현에는 seed뿐 아니라 설정·버전·해금 기준·사용자 선택도 같아야 한다.

## 변경 위치

- 수치: `src/data/balance.js`; 공격 수치 변경 시 `tests/scoring.test.js` 산술 기대값과 실제 파서 통합 검사를 함께 수정한다.
- 룬: `src/data/runes.js`와 `src/engine/runes.js`; 현재 활성 10종만 등록한다. 미래 항목을 실제 효과 없이 활성화하지 않는다.
- 적·지역: `src/data/stage1.js`; 적 최대 HP와 표시용 강도 기준이 같은 스냅샷에서 나온다.
- 어휘·형태·대표 용법: language 데이터와 Grammar; `runtimeReady`/capability와 실제 사용문 테스트를 갖춘 뒤 활성화한다.
- 그림/BGM: `src/services/assets.js`의 Asset ID와 `public/assets/`; 등록된 상대 경로를 resolver로 해석한다. 현재 필수 외부 그림·BGM은 없다.
- 화면/연출: UI와 Presentation; 결과 값 변경은 해당 엔진/Controller에서 수행한다.

`src/data/roadmap.js`는 후속 48전투·상점 6회·다른 룬의 메타데이터만 보존한다. 활성 플레이 데이터와 합치지 않는다. `CONTENT_COMPLETE`는 첫 지역의 콘텐츠 경계이며 전체 스토리 클리어와 구분한다.

## 검증 연결

`tests/`는 언어·산술·덱·명령·보상·저장·연출을 실제 모듈에 연결한다. 덱 10,000 seed 검사는 `tools/simulate-decks.js`, 실제 명령 기반 제한된 플레이 검사는 `tools/simulate-runs.js`로 실행한다. 브라우저와 시각적 검증은 별도 증거를 남긴다. 검증 범위와 PASS/FAIL/NOT RUN의 최종 근거는 `TEST_REPORT.md`에 둔다.
