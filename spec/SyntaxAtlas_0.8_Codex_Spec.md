# Syntax Atlas 0.8.0 통합 구현 명세
## 고대의 수로도시 · 관계절 · 기본 의문문 판정 · 청동 수문장 「이중 연결 인장」

**문서 버전:** 1.0 / 2026-10-10 한국시간  
**문서 성격:** Codex 구현 계약 및 검증 기대값. 게임 실행 결과 보고서가 아니다.  
**읽기로 확인한 main:** `ca1675dbb9e546bf2b9442dba8cfc1077c7e12dd` — PR #11, 0.7.0 병합.  
**실제 구현 출발점:** 작업 시작 최신 `origin/main`. 위 SHA로 강제로 되돌리지 않는다.  
**작업 브랜치:** `codex/v0.8-ancient-waterways-relative-seal`  
**목표:** 신규 0.8.0 원정만 8지역·37전투·`CONTENT_COMPLETE / STAGE8_END`.

---

# 0. 읽기 순서와 변경 권한

1. 실제 checkout의 `AGENTS.md`, `README.md`, `docs/PROJECT_HANDOFF.md`, `docs/ARCHITECTURE.md`, 최신 0.7 보고서·인수 조건을 먼저 읽는다. 그 뒤 이 MD 전체와 부속 JSON을 읽는다.
2. **최신 사용자 지시 → 이 문서의 [확정] → [구현 세칙/초깃값] → 과거 명세** 순으로 적용한다. 과거 문서의 ‘주격과 목적격을 각각 다른 공격에서 누적’하는 보스안은 폐기됐다.
3. 기존 정상 게임을 재작성하지 않는다. Vanilla JS / ES Modules / Vite, `RunController` 단독 상태 커밋, Grammar → Scoring → Rune → Stage → Presentation 경계를 유지한다.
4. 현재 소스를 과거 ZIP·배포 bundle·다른 게임 코드로 교체하지 않는다. 미커밋 변경·원본 첨부·기존 브랜치·과거 증거 파일을 보존한다.
5. JSON은 테스트 기대값이다. production에 정답 문장 목록으로 넣거나, 문자열 일치로 채점하거나, 그대로 PASS 보고서로 복사하지 않는다.
6. 문법의 가능성과 콤보 해금은 분리한다. 정상 문장을 스테이지/보상 해금 여부 때문에 오답 처리하지 않는다. 반대로 구현하지 못한 구조를 `UNSUPPORTED → VALID`로 일괄 치환하지 않는다.
7. 이 문서의 HP·새 배수·새 카드 등급·일반 몬스터 이름 등은 [초깃값]이다. 사용자 확정 수치 또는 플레이 검증 완료값으로 표현하지 않는다.
8. 문서 작성자는 소스 일부·0.7 인계 명세·공식 문법 자료를 읽고 문서 자체의 참조와 산술을 검사했다. **0.8 게임 코드 수정, parser 실행, 실제 브라우저 검증은 하지 않았다.** 실행은 구현 단계에서 별도로 한다.

# 1. 확정한 설계와 제외 범위

## 1.1 [확정] 지역과 학습 흐름

- Stage 8은 **고대의 수로도시**다. 청동·석조·수로·작동하는 마법 장치가 중심인 고대 도시이며, 하늘섬·밀림·새 자연 지역으로 대체하지 않는다.
- 전투 순서: **8-1 주격 관계대명사 → 8-2 목적격 관계대명사와 생략 → 8-3 관계부사 → 8-4 관계절 활용 → 8-5 보스**.
- Stage 8 입장에는 **who / which / 받지 않기** 중 한 가지를 선택한다. Stage 8을 이유로 **that은 자동 지급하지 않는다**. 기존 Stage 4의 조건부 that 지급은 건드리지 않는다.
- whose는 이번 카드 풀과 학습 코스에서 제외한다. 선행사를 포함한 what과 Stage 9 명사절 코스도 이번 범위 밖이다.
- where/when은 8-3에서 **전투 한정 빙정 WORD**로 제공한다. 해당 카드로 기본 의문문·간접의문문을 만들면 올바르게 판정하고 정상 공격한다. 의문문/간접의문문의 전용 콤보는 후속이다.
- 일반전에서 목표 문법 사용은 유리하지만 필수 승리조건이 아니다.
- 보스는 다음 지역인 큰 보관소의 입구를 지키는 **말을 탄 청동 수문장 기사**다.

## 1.2 [확정] 최종 보스 기믹

**하나의 완전한 제출 문장 안에, 정상적인 주격 관계절과 목적격 관계절이 각각 하나 이상 있어야 이중 연결 인장이 해제된다.**

- 서로 다른 두 공격의 실적을 합산하지 않는다.
- 목적격 관계대명사의 정상 생략도 인정한다. 관계사 카드 두 장을 요구하는 조건이 아니다.
- 관계절은 실제로 별개인 두 노드여야 한다. 같은 노드·같은 분석 후보를 주격/목적격으로 이중 계산하지 않는다.
- 인장 유지 중에는 HP가 1 아래로 내려가지 않는다.
- 조건을 만족한 **그 공격부터** HP 보호가 해제되고 충분한 위력이면 바로 격파된다.
- 한 번 해제한 인장은 다시 잠기지 않는다. HP가 남았다면 이후 일반 문장으로 마무리할 수 있다.
- 추가 먼지·봉인·피해 반감·무료 운영·추가 턴·강제 공격 순서는 없다.

## 1.3 [구현 세칙/초깃값] 미정 세부사항의 기본값

- 일반 적 이름과 HP: 아래 3장 표. HP는 **1,280 / 1,360 / 1,440 / 1,520 / 1,600**.
- 새 관계절 점수는 **관계절 계열 ×2.0, 공격당 한 번**. 주격·목적격·관계부사를 각각 중복 곱하지 않는다. 지역 보너스는 ×1.25 한 번.
- 신규 일반 WORD는 **who / which / where 3종**, 고급(UNCOMMON). when은 기존 정의의 문법 역할만 확장한다.
- 입장 선택창은 한 번 제공한다. 이미 who/which가 있어도 선택은 선택일 뿐 자동 지급이 아니므로, 보유 장수를 표시하고 받지 않기를 허용한다. 최대 지급량은 어떤 경우에도 1장. 이것은 중복 보유 시 처리에 관한 구현 기본값이며, 과거에 확정된 숨은 지급 예외가 아니다.
- 8-3에는 영구 보유 여부와 무관하게 빙정 where 1장·when 1장. 최초 손패에는 둘 중 최소 1장을 기존 자리 안에서 보여준다. 나머지 전투에는 재지급하지 않는다.
- 새로운 일반 단어 보상 풀의 이번 원정 개방은 Stage 7 완료, 후속 원정에 대한 영구 후보 개방은 Stage 8 완료다. 콤보 팩과 단어 후보 팩은 분리한다.
- Stage 8은 **네 번째 상점**을 거친다. 룬2·WORD2·운영1, 연마1회·제거1회. 기존 가격과 확률을 재사용한다.

## 1.4 보존 / 하지 않는 것

- Stage 1~7 HP·진행·보상·룬·모든 기존 보스 규칙을 보존한다. 먼지는 Stage 7을 넘어오지 않는다.
- 기본 시작 덱28, 6턴, 교환4회, 첫패6, 기본 손패한도10, 준비draw3, 문장16장. 룬으로 늘어난 자원은 기존대로다.
- 운영7종·연마최대+1·보급/탐색+1 재사용·재활용·카드 보존·명령 멱등성 보존. 새 사용 횟수 상한/쿨다운 없음.
- 운석 1.8/2.4, 2.2/2.8, 2.6/3.2 및 다른 기존 룬값 보존. **새 룬이나 5번째 룬 슬롯은 추가하지 않는다. 현행4슬롯 유지.**
- that·to·동사 등의 기존 등급/지급 정책을 몰래 바꾸지 않는다. 예문 때문에 by/hear/open 등의 WORD를 새로 만들지 않는다.
- whose/whom/what/whether/why/how/not/can/would/wish를 새로 추가하지 않는다. 기존 코드에 이미 있는 단어는 삭제하지 않는다.
- 비제한적 관계절/쉼표 입력 UI, 직접 인용, 강조구문, 모든 의문문·간접화법의 전면 구현은 이번 필수 범위가 아니다. 의문문에 필요한 **기존 어휘의 기본 질문 판정**은 이번 필수 범위다.
- 게임 화면에서 판정 전에 정답·예상 점수·인장 충족 여부를 실시간 계산해 보여주지 않는다.
- 실제 의미의 자연스러움을 공격 감점이나 보스 조건에 역으로 쓰지 않는다.

# 2. 실제 코드에서 확인한 통합 지점

다음은 baseline 읽기 결과이지 새 기능이 실행된 결과가 아니다. [R01~R08]

| 지점 | baseline 상태 | 0.8 작업 |
|---|---|---|
| `parser.js` 관계절 | that와 목적어 공백/생략 경로, `CLAUSE.RELATIVE`가 `comboImplemented:false` | who/which, 관계부사, 역할별 증거와 점수 자격 연결 |
| `skyEvidence.js` | 노드/절/VP/범위·gapRole/선행사 기반 일부 증거 | 별개 관계절을 열거하는 명시적인 `relativeClauses` 및 wh 절 증거 |
| `grammar/index.js` | fixture에 `?`가 있으면 `fixtureCapabilityId=cap.question`를 붙이고 미지원 반환 | 0.8 질문은 실제 구조로 판정. punctuation 유무와 runtime/fixture 경로 일치 |
| 버전 분기 | parser/evidence/scoring 등에 `version==='0.7.0'` 또는 버전 목록 | 0.8에서도 0.7 문법·먼지·운영을 재사용하도록 전수 점검. 단순 기본 fallback에 맡기지 않음 |
| `shop.js` | 상점 진입/직전 상점 가드가 2/4/6 기준 | 8과 네 번째 방문/이력/저장 추가, 앞선 상품/난수 불변 |
| `frostCards.js` | 설원 고정 공급표·빙결핵 메타데이터를 사용 | 8-3은 별도 source와 공급표, 같은 WORD 수명 재사용. 사슴 결정·무료 탐색은 복제하지 않음 |
| `temporaryCards` / `emberDust` | 0.7에서 임시 출처별 경계가 도입됨 | 새 도시 출처만 추가. 출처 검사·orphan 검사를 삭제하지 않음 |
| `comboEligibility.js` | 원래 분석과 점수용 hit를 분리 | 관계절 계열 자격 추가. wh 질문은 정상 분석되지만 전용 보너스 없음 |

수정 전 baseline 검사와 실제 예문 재현은 Codex가 실행한다. 기존 제한을 확인하지 않고 이미 정상인 모듈을 재작성하지 않는다.

# 3. 지역 데이터와 진행

| 전체 전투 | 지역 | 적 [새 이름] | 목표 | HP [초깃값] |
|---:|---|---|---|---:|
| 33 | 8-1 | 청동 교각병 | 주격 관계절 | 1,280 |
| 34 | 8-2 | 운하 수호상 | 목적격 관계절·생략 | 1,360 |
| 35 | 8-3 | 물시계 자동인형 | 관계부사 where/when | 1,440 |
| 36 | 8-4 | 회로 수호기사 | 관계절과 기존 시제/수동태 등의 결합 | 1,520 |
| 37 | 8-5 | 청동 수문장 | 단일 문장의 이중 관계절 | 1,600 |

일반전에는 문법별 면역·장막을 추가하지 않는다. 동일한 Stage8 지역 적격 집합을 사용하고, 라운드별 목표는 안내/QA/재료 설계에 사용한다. 8-4에 ‘두 관계절 필수’라는 승리조건을 추가하지 않는다.

## 3.1 전환 순서

`0.8 Stage7 보스 승리 → 기존 보상 해결 → STAGE7_CLEAR 화면 → NEXT_STAGE → Stage8 소개/보스 규칙 공개 → who/which/받지 않기 → 네 번째 상점 → 8-1`

- Stage7 처치 시 해당 0.8 원정의 관계절/관계부사 콤보 팩과 일반 새 단어 후보 팩을 멱등적으로 연다.
- 선택이 해결되기 전에 상점 RNG나 8-1 첫패를 생성하지 않는다.
- 8-3의 빙정은 8-3 전투 생성 때만 공급한다. Stage8 입장과 상점에는 넣지 않는다.
- 8-5 처치 시 `STAGE8_CLEAR` 사건을 한 번 기록한다. 마지막 보상 처리 뒤 `CONTENT_COMPLETE / STAGE8_END`로 끝난다.
- 프로필 highestCompletedStage=8은 가능하지만 전체 storyClear를 증가시키지 않는다. Stage9는 입구 연출/다음 목적지 설명뿐이며 실행 전투는 없다.

## 3.2 기존 원정 보존

0.7 저장은 32전투·STAGE7_END로 끝난다. 새 코드 로드만으로 Stage8을 붙이지 않는다. 신규0.8만37전투다. 기존 완료기록·최고점·해금·진행 중 HP·구입한 상품을 재계산하지 않는다.

# 4. 카드 정의·지급·후보 풀

## 4.1 who / which / where / when

- who, which, where는 새 WORD 정의. 표시 범주 FUNCTION, baseScore10, UNCOMMON, starterEligible=false. 관계사와 의문사라는 이유로 사본을 분리하지 않는다.
- when은 이미 있는 `card.when`을 재사용한다. 기존 시간 접속사, 지역 보상, 가격, Stage4의 분류와 연결어 탐색 취급을 보존한다.
- who/which/where의 role candidates는 단어별로 관계사/의문사/의문한정사 등 필요한 역할을 포함한다. 언어 capability도 실제 parser 구현과 함께 활성화하며, requiredCapabilityIds를 원정 콤보팩과 혼동하지 않는다. **역할 선택 팝업은 만들지 않는다.** 실제 순서와 구조로 판단한다.
- which는 관계대명사 외에 `Which book...`의 의문 한정사·지원되는 독립 의문대명사 역할을 갖는다. who는 의문 주어/목적어/보어 역할을 구분한다.
- 카드 몸체 색상은 FUNCTION의 기존 품사 계열. 임시 사본만 빙정의 옅은 푸른 바탕을 사용한다.
- 기존 ‘명사 탐색’의 품사 범위를 새 wh 기능어까지 자동 확장하지 않는다. 새 who/which/where는 범용 탐색의 WORD 후보에는 포함된다.
- **연결어 탐색의 기존 and/but/or/because/when/if/that 대상 집합은 그대로**다. who/which/where까지 조용히 확대하지 않는다. when은 종전처럼 대상이다.

## 4.2 Stage8 선택 거래

고정 선택 ID 예: `<runId>:stage.08:entry-choice`.

- WHO / WHICH / NONE 3가지가 한 번 제시된다. 고른 카드는 실제 영구 사본1장, polish0/specialEffect=null.
- 기존 보유 장수를 표시한다. NONE에는 재화/보상/턴 추가 없음.
- 선택이 아직 pending이면 저장 후 동일 offer로 복원한다. 선택 취소는 미확정 UI만 닫고 자동 지급하지 않는다.
- 선택 확정은 expectedRevision/offerId/commandId를 검사하고 카드 추가·vocabulary·entryGrants·resolved를 한 커밋으로 처리한다.
- 재접속·이전 화면·중복 클릭·상이한 두 명령ID로 재요청해도 2장을 지급하지 않는다.
- 이미 해결된 WHO 선택을 NONE 또는 WHICH로 바꾸어 상점/카드를 재생성하지 않는다.
- NONE도 entryGrants.applied=true인 정상 결과이며 상점에 진입한다.
- 그 후 관계사 제거/소모 여부를 이유로 무료 재지급하지 않는다.

### 보스 재료 경고

영구 덱에 주격 관계절 표지로 사용 가능한 who/which/that이 하나도 없는데 NONE을 고를 때:

> 현재 덱에는 주격 관계절에 사용할 관계대명사가 없습니다. 받지 않으면 다른 획득 기회가 필요합니다.

확인 후 선택은 허용한다. 이것은 어휘 보유 확인이지 정답 탐색/공략 가능성의 완전한 증명이 아니다. 해당 카드가 있어도 6턴 안의 실제 성공을 보장한다고 표시하지 않는다. 카드가 영구 덱에 없다는 경고를 이유로 원정 진행 버튼을 먹통으로 만들지는 않는다. 보스에서 관계사를 몰래 생성하지 않는다.

## 4.3 후보 풀과 콤보 팩 [구현 세칙]

- Stage7 완료, 현재0.8 원정: `pack.relative`, `pack.relativeAdverb`, `pack.waterwaysWords.reward` 획득.
- who/which/where의 정규 보상·상점 eligibility는 `pack.waterwaysWords.reward`를 검사한다. Stage8 입장 선택과 임시 빙정은 해당 전용 공급 경로로 생성한다.
- Stage8 완료 프로필: 일반 카드 후보 팩만 영구 개방한다. 이후0.8 새 원정에서 이 카드들이 조기 선택 보상으로 등장할 수 있다. 자동 덱 추가는 없다.
- 관계절 콤보 팩은 이 버전에서 원정 진행 팩이다. 이전 프로필에 존재하더라도 시작 baseline만으로 조기 활성화하지 않는다. 기존 비교팩의 처리처럼 명시적으로 분리하며 다른 기존 팩의 정책을 바꾸지 않는다.
- 정상 관계절은 해금 전에도 정상 판정·기본 공격한다. 새 관계절 배수만 자격으로 거른다.
- where/when 의문문과 간접의문문의 전용 콤보 팩은 이번에 활성화하지 않는다. 정상 문형·기존 시제·룬에 의한 공격은 그대로 가능하다.

# 5. 관계절 문법 범위

## 5.1 허용 범위의 핵심

이번 기본 코스는 **한정적 관계절**이다. 아래 모든 유형은 실제 카드 배열로 조합 가능해야 한다. [L01,L02]

1. who/which/that 주격 관계절.
2. who/which/that 목적격 관계절.
3. 목적격 관계대명사의 정상 생략.
4. 명사 앞뒤의 주절 위치와 무관한 관계절 분석.
5. 별개의 병렬 부착 관계절과 최소 한 단계의 중첩 관계절.
6. 관계절 내부의 기존 진행·완료·수동태·목적격보어·수식/전치사구 재사용.
7. 현재 카드로 가능한 문장 끝 전치사 목적격 및 `in/at/with/to/for + which`의 검수된 기본 역할.
8. where/when 관계부사절. 장소/시간 연결이며 직접목적어 공백과 다르다.

기존 that 관계절 판정은 더 낮은 스테이지에서도 유지한다. 접속사 that·지시어 that을 관계대명사로 일괄 바꾸지 않는다.

## 5.2 주격과 목적격의 기준

| 예문 | 역할 |
|---|---|
| I like the child **who runs**. | child가 주절 목적어여도 who는 관계절 주어 |
| The child **I like** runs. | child가 주절 주어여도 생략 관계사는 like의 목적어 |
| The book **which was made** is good. | 수동 동사구의 문법적 주어 → SUBJECT |
| The book **I made** is good. | make의 직접목적어 공백 → OBJECT |
| The book **which I work with** is good. | with의 전치사 목적어 공백 → OBJECT/PREPOSITION_OBJECT |

행위자/피행위자 같은 의미 역할과 문법적 주어/목적격을 혼동하지 않는다. 보스 조건도 이 기준을 공유한다.

## 5.3 선행사와 공백의 증거

관계절마다 다음을 남긴다. 실제 API 이름은 어댑터로 맞출 수 있으나 정보는 빠뜨릴 수 없다.

```text
id, nodeId, childClauseId, parentClauseId, rootSentenceId
antecedentNodeId, antecedentHeadCardId
markerCardId|null, markerLemma|null, markerOmitted:boolean
kind: RELATIVE_PRONOUN | RELATIVE_ADVERB
relativeRole: SUBJECT | OBJECT | ADVERBIAL
objectRole: DIRECT_OBJECT | INDIRECT_OBJECT | PREPOSITION_OBJECT | null
adverbKind: PLACE | TIME | null
predicateHeadCardId, finiteVerbCardIds, gapGovernorNodeId
cardIds, markerCardIds, range
ownEssentialCardIds, ownIssueIds, validity, bonusEligible
```

- 선행사는 실제 입력의 명사구다. 없는 사람/사물을 상상해 보충하지 않는다.
- gap은 문법적 의존 관계이며 **새 카드가 아니다**. 실제 token 수·기본점수·운석 기여 장수에 추가하지 않는다.
- 목적격 생략은 markerCardId=null이어야 한다. 생략 that을 숨은 가상 사본으로 만들지 않는다.
- 관계절의 명사구/동사구가 소비한 원래 physical ID를 보존한다.
- 상대절 안의 수일치는 선행사의 수·인칭과 실제 유한 동사로 검사한다. 관계대명사를 항상3인칭 단수로 고정하지 않는다.
- `book which I made it`처럼 해당 목적어가 이미 채워진 경우 공백을 중복 부여하지 않는다.
- 명사 뒤의 분사구를 유한 관계절로 꾸미지 않는다. `the book made today`는 기존 분사 수식으로 처리한다.

## 5.4 단어의 결합 범위

who는 사람을 기본으로 하고, 기존 dog/cat처럼 반려동물로 쓰일 수 있는 명사의 검수된 허용도 둔다. which는 사물·동물, that은 기본 한정적 관계절의 사람·사물·동물에 사용한다. [L01]

이는 문장 전체의 의미를 점수화하는 것이 아니라 **관계사와 선행사의 명시적인 어휘 결합 제약**이다. 확실하지 않은 의미를 모델이 추측해 감점하지 않는다. `a running book` 등의 일반적인 의미 어색함은 기존처럼 문법/보스 감점 근거가 아니다.

분명한 결합 오류는 국소 issue로 기록하고, 그 관계절은 새 콤보/보스 자격을 갖지 않는다. 주절 구조까지 복구 가능하면 전부 INVALID_CORE로 무너뜨리지 않는다. 다른 정상 분석이 있으면 먼저 비교한다.

## 5.5 where / when의 구별

- `the school where I work`: 실제 학교 선행사와 PLACE 관계절.
- `the day when you came`: 실제 시간 선행사와 TIME 관계절.
- `the school which I like`: like가 요구하는 직접목적어이므로 which. 장소 명사라는 이유만으로 where로 대체하지 않는다.
- `I play when you come`: 명사를 수식하지 않는 기존 시간 부사절/절 연결. 관계부사 보너스를 주지 않는다.
- `I know when you come`: know가 받은 의문 내용절. 선행사를 생성하지 않으며 관계부사 보너스를 주지 않는다.

관계부사는 주어·직접목적어를 대신하는 표지로 일반화하지 않는다. `the room where I like`를 room=like의 목적어로 자동 복구하지 않는다. 기존 장소 be처럼 locative 성분을 요구하는 Frame에는 where의 실제 PLACE 의존을 연결할 수 있다.

## 5.6 복수 관계절과 대표 분석

다음을 모두 필수 지원한다.

> A child who runs likes a book I made.  
> A book which helps a child I like is good.  
> The child who likes a book I made runs.  
> The child who runs is happy and the book I made is good.

서로 다른 노드는 중첩될 수 있으므로 ‘범위가 겹치면 동일 관계절’이라는 규칙은 금지한다. 반대로 같은 관계절이 복사된 AST 경로·여러 후보에 존재한다고 서로 다른 두 개로 세지 않는다.

- 대표 분석은 기존의 문법적 우선순위를 확장한 고정 정책으로 정한다. **보스 조건·점수·룬·해금·최대 피해를 보고 분석을 선택하지 않는다.**
- 전체 입력을 소비하는 하나의 분석만 채점한다. 후보A의 SUBJECT와 후보B의 OBJECT를 합쳐 보스 조건을 만들지 않는다.
- 별개 주격/목적격 관계절을 파싱하는 데 필요한 합법적 중첩은 지원한다. 무한 재귀/카드 순열 검색은 하지 않는다.
- bounded work/candidate 한도를 지키되, 필수9~16장 예문이 한도 초과하는 결함을 ‘어려운 영어여서 어쩔 수 없음’으로 넘기지 않는다. 메모화 키에 필요한 gap/owner/question 역할을 포함해 실제 원인을 수정한다.
- 진짜 엔진 예산 초과는 무소모 기술 오류/안전 복귀이지 문법 오답0점이나 가짜VALID가 아니다.

# 6. 의문문·간접의문문: 콤보 없이 실제 지원

이 장은 미래 설계용 메타데이터가 아니라 **이번 버전의 필수 실행 범위**다. [L03,L04]

## 6.1 기본 직접 의문문

새로 공급하는 who/which/where/when 및 기존 be/do/have/will의 형태를 활용한다.

| 유형 | 필수 예문 |
|---|---|
| do-support | Where do you work? / Where does she live? / When did she come? |
| be 위치/보어 | Where is the book? / Who are you? |
| 진행 | Where are they working? |
| 완료 | Where have you worked? |
| 미래 | When will you come? |
| 수동 | When was the food made? |
| 의문 주어 | Who runs? / Which books help you? |
| 의문 목적어 | Who do you like? / Which book do you like? |
| 공통 기반 | Do you like music? |

- do/does/did 뒤 본동사는 원형. do의 주어 일치와 시제는 별도 확인한다.
- who/which가 의문 주어이면 목적어 질문의 do-support를 무조건 요구하지 않는다.
- 완료 have와 소유 have, 조동사 do와 일반동사 do를 구분한다.
- 의미상 필요한 목적어·보어·동사 형태를 생략하거나 만들어 넣지 않는다.
- 긍정문·등록된 기존 조동사 조합이 필수 범위다. 없는 not/can 등을 추가하며 부정문/모든 조동사 개발로 확장하지 않는다.

## 6.2 간접의문문

핵심은 기존 know의 기본 WH 내용절과, 현재 동사 Sense에서 검수된 see/show/say 등의 질문내용 목적어다. **that절을 받는 모든 동사에 WH절을 무조건 허용하지 않는다.** 실제 frame binding으로 관리한다.

> I know where you work.  
> I know when you will come.  
> I know where the book is.  
> I know who likes music.  
> I know who you like.  
> I know which book you made.  
> I see where you work.  
> She shows me where you work.

- 내부는 평서 어순이다. 의문 주어는 그 자리에서 주어 역할을 한다.
- `I know where do you work`를 정상으로 통과시키지 않는다.
- 과거 주절이라는 이유만으로 자동 시제 역행을 강제하지 않는다. 이번은 원문을 보고 간접화법으로 번역하는 과제가 아니다.
- show+IO+WH 내용절은 실제 4형식으로 분석할 수 있지만, 모든 동사에 IO를 덧붙이지 않는다.
- 기본적 `I know where/when to ...`, `I know who to help`, `I know which book to read`도 기존 to부정사 분석을 재사용해 판정한다. 별도의 WH-to 전용 배수는 없다. 새 where 카드의 일반적 사용 공백을 막기 위한 제한된 구현 세칙이다.
- 가주어/가목적어/선행사를 포함한 what 전체는 이번 코스가 아니다.

## 6.3 입력·증거·채점 계약

- 조합대의 실제 카드 순서로 질문을 판정한다. 물음표 카드, 숨은 be/do, 자동 문장 교정, ‘질문 모드’ 선택을 요구하지 않는다.
- 필요하면 제출 후 기록의 종결 기호를 `sentenceKind`에 따라 표시한다. 마침표/물음표는 점수·카드 수·공백 증거가 아니다.
- **동일한 배열에 대한 fixture 텍스트(물음표 유/무)와 실제 createSentenceSnapshot 분석은 같아야 한다.** baseline의 fixtureCapabilityId 조기 미지원 분기는 0.8 지원 질문에 적용하지 않는다. legacy 분기는 보존한다.
- 의문사 이동을 나타내는 내부 인덱스 view는 허용하지만 원본 tokens/physical IDs/선택형태/손패·조합대를 변형하지 않는다. 실제 카드의 순서를 조용히 평서문으로 바꾸지 않는다.
- 질문 동사구는 불연속한 원래 위치(조동사–주어–본동사)를 정확히 기록한다. 주어를 VP의 동사 카드로 세지 않는다.
- `questionClauses`/`embeddedQuestions`에 clauseId, 종류, 실제 whCardIds, subjectNodeId, predicate, 필수 공백/위치를 보존한다. 선행사와 연결된 `relativeClauses`와 자료형/역할을 구분한다.
- 주절 문형은 실제 역할에 기반한 기존 학교문형 정책으로 산출한다. 의문 목적어를 실제 WH 카드/NP로 확인해서 SVO를 판정하고 가상의 답변 명사로 채우지 않는다.
- 정상 질문은 카드점수·완전문장·주절 문형·기존 시제/수동/준동사·룬을 정상 적용한다.
- 질문 또는 간접의문문이라는 이유로 관계절·지역·새 명사절/절연결 배수를 자동 지급하지 않는다. 단 그 문장 **안에 별도로 실제 관계절이나 기존 and 연결이 있으면** 해당 실제 구조의 보너스는 가능하다.
- 학생 화면에 VALID/UNSUPPORTED/capability/‘향후 채점’ 같은 개발 메타 문구를 표시하지 않는다.

# 7. 점수와 해금

## 7.1 [초깃값] 관계절 계열 효과

| 효과 | 값 | 횟수 |
|---|---:|---|
| 관계절 계열(주격/목적격/관계부사) | ×2.0 | 공격당 한 번 |
| Stage8 지역 | ×1.25 | 공격당 한 번 |
| 이중 연결 추가 배수 | 없음 | — |
| 의문문·간접의문문 전용 효과 | 없음 | — |

- `CLAUSE.RELATIVE`와 하위 역할 태그를 둘 다 세어 ×2를 중복 적용하지 않는다.
- 정상 목적격 생략도 같은 관계절 효과다. 표지가 없다는 이유로 낮은 배수를 쓰지 않는다.
- 관계절이 2개 이상이면 모든 evidence를 저장/표시하지만 새 계열 배수는 한 번이다.
- new relative family는 기존 시간→수동→준동사→비교/정도 **뒤**, 절/구 연결→수식→룬→지역 **앞**에 둔다.
- 상대절 자체를 기존 `LINK.CLAUSE`로도 태깅하여 ×1.6을 덧주지 않는다. 실제 and/because/내용that 등 기존 연결 구조는 기존대로 별도 적용할 수 있다.
- 관계대명사를 형용사로도 +5 중복 채점하지 않는다. 관계절 내부의 실제 형용사/부사/PP 점수는 유지한다.
- 계산은 현재 유리수·단계별 내림·안전 정수 정책을 유지한다.

## 7.2 국소 오류와 콤보 적격

원래 분석의 완전성, 각 관계절의 정확성, 실제 콤보 해금을 따로 본다. 부속 문법 사례의 오류 예문은 표준 학교문법 범위의 구조 검사용이며, 모든 구어·방언에서 절대 불가능하다는 사전 설명으로 복사하지 않는다.

- 주절 `like→likes` 오류가 있어도 관계절 둘이 정상이고 전체가 복구 가능한 문장이면 두 관계절의 적격을 유지한다.
- 상대절 자체의 핵심 수일치·표지 적합성·필수 목적어/주어·동사구 활용 오류는 해당 상대절의 새 보너스/보스 자격을 제외한다.
- 문제 없는 다른 상대절은 남긴다. 한 hit의 전체 span이 다른 절을 포함한다는 이유만으로 주변 오류를 모두 상속하지 않는다.
- 필수 구조가 없는 문장은 기존 INVALID_CORE/0점/카드·턴 소비를 유지한다.
- 새로운 국소 관계사 결합/질문 활용 오류를 복구할 때 고정 감점은 [초깃값]10. 동일 원인 이중 감점 또는 unlicensed 카드 기여 제외와 불필요한 벌점 중복은 기존 정책대로 금지한다.

## 7.3 산술 기대값

무룬·무연마·완전 문장·필요한 팩 개방·일반 Stage8 적 기준. 자세한 단계는 `06_Score_Cases_0.8.json`에 있다. 이는 문서 산술 기대값이며 실제 parser/score 실행 PASS가 아니다.

| 사례 | 문장 | 보스 전 위력 |
|---|---|---:|
| S001 | `The child who runs is happy.` | 360 |
| S002 | `The book you made is good.` | 430 |
| S003 | `The book which I made is good.` | 480 |
| S004 | `A child who runs likes a book I made.` | 647 |
| S005 | `A child who runs likes a book that I made.` | 700 |
| S006 | `This is the school where I work.` | 400 |
| S007 | `I know when you will come.` | 194 |
| S008 | `Where do you work?` | 91 |
| S009 | `When did she come?` | 109 |
| S010 | `Which book do you like?` | 144 |
| S011 | `The book which was made is good.` | 862 |
| S012 | `The child I like runs.` | 260 |
| S013 | `I like the child who runs.` | 405 |
| S014 | `I like the day when you came.` | 540 |
| S015 | `The child who runs is happy and the book I made is good.` | 1,227 |
| S016 | `A child who runs likes a dog which plays.` | 540 |

현재 parser가 새로운 구조에 기존 수식 hit를 추가로 내는 경우, 기존 golden과 새 설계 근거를 비교하여 올바른 근거인지 확인한다. 이 표에 맞추려고 올바른 기존 점수를 삭제하지 않는다. 원래 기대와 다르면 차이·원인·선택한 정책을 명시하고 검증을 다시 한다.

# 8. 청동 수문장 — 이중 연결 인장

## 8.1 공략의 정의

한 번의 SUBMIT으로 만든 **하나의 완전한 문장 그래프**에서:

- 정상 주격 관계절 A가 하나 이상,
- 정상 목적격 관계절 B가 하나 이상,
- A와 B가 실제로 서로 다른 관계절 노드,
- 전체 공격이 VALID 또는 VALID_WITH_ISSUES이며 지역 후 위력 P>0

이면 인장을 해제한다.

목적격은 동사 목적어뿐 아니라 검수된 전치사 목적어 관계대명사도 포함한다. where/when은 ADVERBIAL이므로 OBJECT가 아니다. 주격/목적격은 같은 순서일 필요 없으며 동일 선행사를 수식하더라도 **실제 서로 다른 두 절이면** 인정한다. 중첩·실제 and 연결도 가능하다.

이전 공격에서 사용한 관계절 실적, 개인 도감, 해금팩, 카드 표면 철자는 해제 근거가 아니다.

## 8.2 대표 공략과 반례

| 입력/상황 | 인장 |
|---|---|
| A child who runs likes a book I made. | 해제 |
| A child who runs likes a book that I made. | 해제 |
| A book which helps a child I like is good. | 해제 |
| The child who likes a book I made runs. | 해제 |
| 주격 공격 뒤 다음 턴에 목적격 공격 | 유지 |
| 주격 관계절만 2개 | 유지 |
| 목적격 관계절만 2개 | 유지 |
| 주격 관계절 + where 관계부사절 | 유지 |
| 의문 주어 who + 의문 목적어 which만 존재 | 유지 |
| 같은 관계절을 두 분석에서 주격/목적격으로 중복 | 유지/변조 거절 |

의문문 안에 진짜 관계절 둘이 들어 있는 경우에는 실제 관계절 증거로 해제할 수 있다. 예: `Who likes the child who knows the book I made?` 의 맨 앞 Who는 공략 근거가 아니지만, 그 안의 who knows와 I made는 서로 다른 관계절이다.

## 8.3 상태·원자적 정산

권장 상태:

```text
id: DUAL_RELATIVE_SEAL
unlocked: boolean
unlockedByAttackId: string|null
unlockWitness: {sentenceId, subjectRelativeId, objectRelativeId,
                subjectEvidenceDigest, objectEvidenceDigest}|null
appliedAttackIds: unique string[]
totalPreventedDamage: nonnegative safe integer
```

**영구 `subjectDone/objectDone` 누적 플래그를 만들지 않는다.** 현재 공격에서의 일시적 진단값은 남길 수 있으나 다음 공격의 조건에 합산하지 않는다.

P=지역/룬 등 기존 계산을 마친 보스 전 위력, H=공격 전 현재 HP:

```text
qualified = 정상 공격이고 P>0이며 현재 문장에 정상인 별개 SUBJECT/OBJECT 쌍 존재
unlockedAfter = unlockedBefore OR qualified
floor = unlockedAfter ? 0 : 1
hpAfter = max(floor, H-P)
actualHpLoss = H-hpAfter
preventedDamage = unlockedAfter ? 0 : max(0, P-actualHpLoss)
overkill = unlockedAfter ? max(0, P-H) : 0
```

INVALID_CORE는 기존처럼 P=0 처리 경로를 따른다. 같은 attackId 재적용은 0추가변경이다. command/revision/battle 검증이 실패하면 카드·턴·RNG·인장 모두 무변경이다.

- 첫 공격에서 조건+충분한 위력을 만들면 즉시 원킬 가능.
- 조건은 달성했지만 HP가 남으면 해제 상태로 다음 턴 진행.
- 잠긴 상태에서도 HP1까지는 일반 피해를 받는다.
- 잠긴 HP1에 때려서 0피해가 난 것은 문법 오류가 아니라 `BOSS_BLOCKED`이다. 정상 점수 연쇄와 보호 이유를 따로 보여준다.
- 막힌 피해를 축적했다가 인장 해제 때 추가 적용하지 않는다.
- 인장 잠금 중 실제 처치/오버킬 연출을 재생하지 않는다.

## 8.4 저장과 증거 위조 방지

unlocked=true를 저장할 때는 같은 공격 영수증에 쌍의 근거가 있어야 한다. 과거 history의 두 공격을 합쳐 만든 witness는 거절한다. 카드들이 공격 후 discard에 있어도 기록은 해당 공격 snapshot/증거를 참조하며 현재 손패의 위치로 문장을 재구성하지 않는다.

수정 가능한 UI flags가 아니라 Controller가 커밋한 immutable receipt가 근거다. 존재하지 않는 clauseId/physicalId, 다른 전투의 unlock attack, SUBJECT 노드를 OBJECT로 바꾼 기록, 단일 nodeId를 두 번 쓴 witness, 보호 중 hp0, 해제 상태와 witness 불일치를 거절한다. 기존 history 보관 한도에만 의존해 합법적인 해제증거가 사라지지 않게 최저한의 해제 영수증을 별도 보존한다.

# 9. 8-3 빙정 WORD의 수명

## 9.1 명세

```text
source = ANCIENT_WATERWAYS
lifetime = BATTLE
stageId = stage.08
battleId = battle.08.03
cardKind = WORD
cardDefs = [card.where, card.when]
crystalBearing = false
supportOnly = true
polishLevel = 0
```

- 기존 영구 `card.when`과 임시 `card.when`은 정의를 공유하지만 실제 사본 ID와 소유권은 다르다.
- 같은 품사/형태/단어뜻을 써도 임시 lifetime은 문법 엔진의 정오 판정과 관계없다.
- 8-3 전투 시작 한 번, 덱 RNG의 정상 셔플에 섞는다. 첫 손패에 최소1장이 보이도록 안정적 swap만 수행한다. 별도 무료 draw는 없다.
- 기존 WORD witness를 보존한다. 빈자리/비보호 슬롯이 없으면 보정하지 못한 사실을 trace로 남기고 카드를 삭제하거나 handLimit을 넘기지 않는다.
- reward/shop/encounter RNG는 사용하지 않는다. load는 공급·셔플·위치 보정을 반복하지 않는다.
- 다른 Stage8 전투·상점·로비에 사본을 남기지 않는다.

## 9.2 이동 표

| 행동 | 결과 |
|---|---|
| 조합대 배치/회수 | 소비 없음 |
| 교환 | discard, 아직 사용 가능 |
| 보급/탐색/재활용 | 기존 WORD 및 실제 source pile 규칙 |
| 정상 관계부사 문장 제출 | SHATTERED |
| 정상 의문문/간접의문문 제출 | **동일하게 SHATTERED** |
| 정상 시간 접속사 when 사용 | 동일하게 SHATTERED, 기존 when 역할만 점수 |
| INVALID_CORE 제출 | SHATTERED 및 기존 턴 소모 |
| 기술 오류/stale transaction | 무소모·위치 유지 |
| 승리/패배/원정 종료 | 모든 남은 임시 사본과 상태 정리 |

빙정이 해독해야 할 열쇠나 추가 보스 결정이라는 의미는 없다. 8-3의 모든 정상 사용은 소비 규칙이 같고, 목적 문법을 안 썼다는 이유로 카드 수명을 달리하지 않는다.

## 9.3 공통 임시 카드 검증

현재0.7의 source dispatcher/temporaryCards를 확장하되, FROST와 DUST의 원래 검증은 그대로 유지한다. 도시를 허용하기 위해 ‘설원 외 임시 카드 전부 거절’ 검사를 그냥 삭제하지 않는다.

검증: 생성량2, source/battleId/definition/순번, 영구 activeCardIds와 교집합 없음, 각 사본이 정확히 한 pile, SHATTERED와 공격 영수증 일치, OPERATION/OBSTACLE 위조 없음, 종료 후 orphan 없음. 8-3 when/where와 Stage6 사슴의 crystalBearing은 서로 혼동할 수 없다.

# 10. 네 번째 상점과 경제

- 순서: 소개·보스 예고 → 입장 선택 확정 → Shop4 생성 → 출발 시 8-1 shuffle.
- 새 shopId는 stage.08. 직전 실제 상점은 stage.06이다. stage.07 상점을 새로 만들지 않는다.
- 룬2 + WORD2 + 운영1. 기존 첫상점 차별규칙은 그대로 두고 Stage4/6과 같은 후반 규모를 재사용한다.
- 운영1칸 판매 보장. 구매는 선택. 기존 운영7종과 등급/가격/전용 추첨정책을 그대로 사용한다.
- 연마/제거는 **각 방문당 1회씩**. 제거 누적 가격은 원정 전체 이전 횟수를 이어받는다.
- 카드 일반6/고급10/희귀14, 룬18/24/32, 연마8, 제거6+누적횟수×2의 현행 정책 보존. 실제 출발 main이 이 부분을 명시적 후속패치로 바꾸었다면 그 변경을 확인하고 충돌을 보고한다.
- 한번 생성한 inventory·서비스·가격·선택/구매·RNG는 저장·재입장 때 재추첨하지 않는다.
- 새 단어가 후보에 들어가는 것은 0.8의 명시적 후보 풀 변화다. 외부 보상 확률표를 바꾸거나 who/which를 추가 확정 상품으로 끼워 넣지 않는다.
- 과거 stage2/4/6 이력 크기 가드, 저장 validator, 방문별 서비스 UI가 네 번째 상점을 정상 처리해야 한다.

# 11. 화면·시각·교육 문구

## 11.1 하늘섬과 다른 도시

떠 있는 섬·구름 다리 대신 **석조 아치, 지면과 건물 속 운하, 청동 수문, 바닥에 새겨진 마력 회로**가 중심이다. 반쯤 폐허이지만 일부 장치가 작동한다. 자연이 주인공인 숲/밀림으로 바꾸지 않는다.

기본 팔레트는 어두운 청록·남색·낡은 청동, 국소적인 금빛/푸른 마력선. 화면 전체를 밝은 하늘색으로 칠하지 않는다. 기존 사막/설원/잿불 테마와 독립된 stage08 theme token을 추가한다.

- 청동 교각병: 석문 앞 작은 청동 갑주. 목표 문법을 모션으로 강제하지 않는다.
- 운하 수호상: 물가 기단의 낡은 석상. 무겁고 안정적인 실루엣.
- 물시계 자동인형: 청동 링과 푸른 수조가 맞물린 고대 장치. 시간/장소의 관계부사 분위기.
- 회로 수호기사: 걸어 다니는 마력 갑주. 8-5 기마 실루엣과 구분.
- 청동 수문장: 긴 창과 방패, 돌·청동 마갑을 입은 말. 뒤에 거대한 보관소 문. 품격 있는 고대 수호자이며 잔혹한 처치 연출은 없다.

새 이미지/BGM 제작은 별도다. 이번에는 이모지/CSS fallback과 asset ID가 있으면 기능 검증이 가능하다. 사전 artwork 파일을 상상해 참조하지 않는다.

## 11.2 보스 표시

상시 표시 문구:

> 이중 연결 인장  
> 한 문장에 주격 관계절과 목적격 관계절을 함께 완성하세요.  
> 목적격 관계대명사는 생략해도 됩니다.

‘주격 완료/목적격 완료’를 영구 체크하는 두 칸 UI는 금지한다. 다른 공격의 실적이 누적된다고 오해시키기 때문이다. 잠금/해제 상태가 본체다. 제출 후에는 **이번 공격에서 확인된 역할**만 일시 표시할 수 있다.

미달:
> 두 관계절을 같은 문장에 연결해야 합니다.

해제:
> 이중 연결 인장이 풀렸습니다!

HP1 보호:
> 인장이 남아 있어 체력이 1 아래로 내려가지 않습니다.

승리하면 기사가 창을 거두고 옆으로 비켜서며 두 마력 회로가 함께 켜져 보관소 문이 열린다. 이것은 victory presentation이며 실제 승리·보상 정산은 기존대로 한 번이다. 진입문 뒤에 서고를 예고하되 Stage9 gameplay를 시작하지 않는다.

## 11.3 제출 후 관계절 시각화

실제 기록을 읽어 선행사와 설명 절을 얇은 청동/푸른 마력선으로 연결한다. 주격/목적격은 색만으로 구별하지 않고 작은 역할 표기를 함께 둔다. 입력 도중의 정답 힌트는 아니다.

- 주격/목적격 두 관계절은 서로 다른 범위로 강조.
- 생략 목적격에는 ‘목적격 생략’ 작은 표식만. 숨은 that 카드 그림을 추가하지 않는다.
- 수동 주격을 목적격으로 표시하지 않는다.
- 의문사와 관계사는 같은 표면 단어여도 실제 제출 후 역할을 달리 표시.
- 연출은 엔진 결과를 읽기만 한다. finish/cancel/reduced motion/페이지 hidden으로 해제와 피해를 재계산하지 않는다.
- 정상 효과의 기존 문장 돌진·충돌·피격은 유지한다. OS reduced motion은 읽기 가능한 비이동 대체 표시로, 장식 효과 감소는 핵심 타격감 삭제로 처리하지 않는다.

## 11.4 도감·사전

0.5.1부터의 **제목(형태)+짧은 설명** 원칙, 실제 플레이어 문장 강조·피드백 색·스테이지별 정렬을 유지한다.

- **주격 관계절(명사 + who/which/that + 동사)**  
  앞의 명사가 관계절 안에서 주어 역할을 합니다.
- **목적격 관계절(명사 + 관계사 + 주어 + 동사)**  
  앞의 명사가 관계절 안에서 목적어 역할을 하며, 관계사는 생략할 수 있습니다.
- **관계부사(장소 + where / 시간 + when)**  
  앞의 장소나 시간을 뒤의 절로 설명합니다.

‘한정적 관계절의 목적격 생략’이라는 정확한 범위를 검수하되, 학생 화면을 장문의 예외 설명으로 채우지 않는다. 의문문은 사전/제출 기록에서 실제 역할을 알려주되 Stage8 전용 콤보가 열렸다고 표시하지 않는다. 고정 학습 예문 탭이나 문장 전체 자동 번역을 되살리지 않는다.

## 11.5 가독성·배치

- 도시 소개/상점/전투/보상/완료에 동일한 어두운 테마를 적용하고 다른 스테이지로 누출하지 않는다.
- 기존 10/14손패·16문장·4룬과 1024×768, 1280×800, 1366×768, 1920×1080을 확인한다.
- 인장 안내·지역배수·적 이름·HP·전략 버튼이 겹치지 않게 고정 흐름 레이아웃을 우선한다. 현재 설원의 상단 혼잡을 도시로 그대로 복사하지 않는다.
- 터치 목표44px와 기존 글자 크기를 줄여 억지로 맞추지 않는다. 가로 스크롤/여백 재배치를 사용한다.
- 빙정 WORD는 본문/하단의 옅은 청백색 바탕, 어두운 단어, ‘이번 전투 한정’이 선택/hover/disabled에서도 구별된다.

# 12. 저장·버전·프로필

- 새 game/save/language/grammar/score/eligibility/progression 정책은 0.8.0으로 명시한다. 생성기는 frozen0.4, 튜토리얼은0.2.1, 운영/운석은0.6.1 정책을 재사용한다. 실제 contracts 구조에 맞춰 필드명은 조정하되 버전 근거를 숨기지 않는다.
- exact version 조건과 defaultRegistry 사용처를 점검한다. 0.8에서 수동태/분사/먼지/빙정/새 운영이 빠지는 것을 방지한다. 0.7 이하의 불변 view는 수정하지 않는다.
- 0.7의 이미 활성화된 기능을 다시 미지원으로 돌리지 않는다. 과거 정규 카드/형태 ID·저장 슬롯3·DB이름·base URL은 유지한다.
- 새 원정만 stage08/cardwho/which/where manifest가 있다. 옛 저장에 새 카드를 끼워 넣는 변조는 거절한다.
- Stage8 pending choice, Shop4 생성 전후, 구매/연마/제거 후, 8-3 사용/깨짐, 보스 HP1 잠금/해제 직후, 완료 저장을 실제로 복원한다.
- 원래 선택/상점/빙정 공급/보스 영수증·RNG를 복원하며 로드 중 재지급/재추첨/재채점하지 않는다.
- 인장 해제와 same-attack witness를 하나의 커밋에서 보존한다. 완료 이벤트는 복귀해도 한 번이다.
- 후속 프로필 해금이 진행 중 원정의 고정 baseline을 소급 변경하지 않는다.
- 새 WORD 후보 팩이 영구 해금되어도 신규 원정의 덱28장에 자동으로 카드를 넣지 않는다.

# 13. 구현 책임과 순서

권장 모듈은 방향 제시다. 기존 이름/경계를 재사용할 수 있으면 불필요한 새 계층을 만들지 않는다.

| 책임 | 예시 |
|---|---|
| 새 언어 view/when 역할 확장 | `data/language/waterwaysLanguage.js` |
| 관계절·질문 분석 | 기존 bounded parser + 필요한 작고 순수한 helper |
| 관계절 역할 증거 | `relativeEvidence` 및 기존 skyEvidence 통합 |
| Stage8·기본 수치 | `data/stage8.js`, 버전별 balance |
| 선택 지급/팩 | `game/ancientWaterways.js` |
| 8-3 임시 공급 | 별도 city source + 기존 temporary dispatcher |
| 보스 순수 제안 | `engine/dualRelativeSeal.js` |
| 실제 상태/보상 | 기존 RunController |
| 저장/영수증 | 기존 validator + source/인장 validator |
| UI/교육/테마 | 기존 cards/progression/shop/overlays/presentation/theme |

작업 순서:

1. baseline tests/build·정의/저장/보상/상점/공격 golden 확보.
2. 신규 어휘 및 기존 when 역할, 상대절 증거 계약.
3. 주격/목적격/생략/관계부사/이중 관계절 판정과 오류 경계.
4. 직접/간접의문문 및 do-support/WH-to 기본 판정. runtime/fixture 동일성.
5. 점수 자격/관계절×2와 기존 점수 회귀.
6. Stage8 진행·팩·입장 선택·Shop4.
7. 도시 빙정 출처/수명/저장.
8. 인장 순수 resolver·Controller 원자 정산·보스 저장.
9. UI·관계절 근거 연출·도감·테마.
10. 표적 테스트 → 전체 회귀 한 번 → production 및 학습 코스 → 보고/PR.

오래 걸리는 전체 suite를 같은 코드에 이유 없이 반복하지 않는다. 실패가 난 부분의 수정/재검증 이후 마지막 전체 실행을 고정하고, 그 뒤 코드가 바뀌면 영향 범위를 다시 명시한다.

# 14. 검증 계획

## 14.1 실행 수준을 분리

| 수준 | 증명할 수 있는 것 | 증명하지 못하는 것 |
|---|---|---|
| 문서 자체 검사 | JSON 참조/카드 장수/산술/ZIP 동일성 | 게임 구현·문법 실행 |
| 순수 parser/score/resolver | 구조·역할·계산·분기 | 자연 덱에서 재료 확보 |
| 지정 상태 실제 UI | 클릭·형태·피드백·저장 경계 | 자연 획득·일반 승률 |
| 실제 Controller 원정 | 정규 카드·보상·RNG·행동 경로 | 사람이 실제 조작했다는 증거 |
| production 실제 UI 원정 | 앱의 실제 카드 입력·전투·상점·저장·완주 | 모든 시드 승률·교육 효과 |
| 실제 학생·기기 | 실시한 대상/환경의 사용성 | 실시하지 않은 다른 환경 |

부속 문법의 기존 단어 예문은 구조 확인용이다. 의미가 어색한 문장이나 자동 정책 문장을 검수된 학생 모범 예문으로 게시하지 않는다.

모든 실행되지 않은 항목은 NOT_RUN. 부분 성공한 QA 원정이 나중에 정책 한계로 중단되면 **전체 명령 FAIL**과 **앞선 검증 부분 PASS**를 함께 기록한다. 정책 중단을 게임패배·시드 불가능·게임오류로 바꾸지 않는다.

## 14.2 수정 전 baseline

- npm test / validate:data / build를 새로 실행하고 시간·명령·exit code 기록.
- 0.7 registry/cards/forms/frames/runes, 실제 몇 시드의 덱·보상·상점/RNG·공격·완료저장을 독립 포착.
- 주요 G/Q 예문의 기존 결과를 기록해 ‘현재 되는 것’과 ‘새롭게 지원할 것’을 구분.
- 이전 PASS 개수·README 숫자를 이번 결과로 재사용하지 않음.

## 14.3 필수 집중 검사

- 부속 문법 사례 전부 + 서로 다른 기존 명사/동사 치환 사례. 정답 문장 문자열 hardcode 금지.
- 목적격 생략, 수동 주격, 주절/관계절 역할 교차, 이중 관계절 및 오류 locality.
- who/which/where/when의 RELATIVE/DIRECT_WH/EMBEDDED_WH/TEMPORAL_CONNECTOR 구분.
- 물음표 있는 helper와 실제 물리 카드 snapshot의 동등성. 중간 마침표로 두 별개 문장을 합쳐 하나의 보스 공격으로 검증하지 않음.
- 관계절 계열 배수는 한 번, 복수 관계절 근거는 전부 기록, 해금 전 정상 판정.
- 보스 현재 공격만 평가·마지막 인장 공격 처치·HP1 blocked·replay·변조.
- Stage8 선택/상점/빙정 전 경계 저장과 load 무추첨.
- Stage6 빙정/무료탐색/사슴, Stage7 먼지/잿불룡, 운영 재사용은 새 테스트와 별도로 회귀.

## 14.4 실제 Stage8 학습 코스

**37전투 완주만으로 이 코스를 PASS 처리하지 않는다.** 실제 원정에서 획득한 카드, 실제 손패·드로우·교환·운영을 사용해 다음을 제출한다.

| 전투 | 반드시 실제로 확인할 것 |
|---|---|
| 8-1 | 정상 주격 관계절, 관련 점수/피드백/실제 피해 |
| 8-2 | 정상 목적격 관계대명사 생략 문장, 관련 점수/피드백/실제 피해 |
| 8-3 | 제공된 실제 빙정 where 또는 when으로 관계부사 문장 및 사용 후 소멸 |
| 8-4 | 관계절 + 기존 진행/완료/수동태 중 적어도 하나의 결합 |
| 8-5 | 정상적인 **동일 한 문장의 주격+목적격**과 인장 해제/격파 |

- 단 하나의 자연 원정에서 모든 희귀변형/where와when/의문문까지 한꺼번에 수행하도록 강제하지 않는다.
- 자연 코스에서 미사용된 나머지 where/when/직접·간접 질문은 별도 지정 상태 UI에서 실제 사본·클릭·공격으로 검증한다. 이 증거를 자연 코스라고 부르지 않는다.
- who 선택 경로와 which 선택 경로, that만 보유하고 선택을 받지 않는 경로는 모두 parser·Controller·UI 검사로 확인한다. 자연 전체 완주는 최소1경로이고 나머지는 수준을 명시한다.
- 목표 문법 전에 적이 먼저 죽으면 해당 목표의 학습 검증은 실패/미실행이다. HP를 올리거나 조작해 성공으로 만들지 않는다. 다른 정상 시드/행동 경로를 쓰고 기록을 구분한다.
- 전투 번호·seed·선택/구매·공격문장·실제 physical IDs/form IDs·분석roles·score timeline·actualHP·인장witness·스크린샷·복원결과를 남긴다.

## 14.5 production 전체 경로

최소1개 실제 dist `/grammardealer/`에서 새 프로필/정상 튜토리얼 또는 무보상 스킵 → 37전투 → Shop4 → 8-3 빙정 → 보스 동일문장 이중 관계절 → STAGE8_END → 저장/복원.

읽기 전용 shadow Controller로 행동 선택/동기화 비교는 가능하지만 페이지에 손패/HP/룬/카드/RNG를 주입하지 않는다. test-only API로 게임 결과를 바꾸지 않는다. 자연 성공 시드 선택은 허용하되 시드 탐색과 실패 이력을 밝히고 사람 승률로 해석하지 않는다.

이중 관계절 준비의 현실성을 보기 위해 현재 가진 카드·교환·준비를 실제 사용한 추적을 남긴다. 9장 예문이 문법적으로 가능하다는 사실을 6턴 내 자연 획득 보장으로 바꾸어 보고하지 않는다.

## 14.6 브라우저·검사 명령

실제 package scripts를 먼저 확인한다. 없는 명령을 실행했다고 쓰지 않는다.

기존 `npm test`, `npm run validate:data`, `npm run build`, 공식 browser/polish/cross/061/ember suite와 e2e를 보존한다. Stage8 표적 명령 예:

```text
npm run test:browser:waterways
npm run test:decks:waterways
npm run test:runs:waterways
```

- Chromium: 주요 Stage8 UI/실제 학습/전체 완주.
- Firefox/WebKit: 선택/Shop4/빙정/형태/질문제출/인장/저장 핵심 smoke.
- 시작 덱10,000건은 기존 품사/28장 계약 검사이며 Stage8 승률 검사가 아니다.
- 자동 원정은 제한된 수/시드로 재현 가능한 정책을 사용한다. 정책 완주0이라고 플레이어도 못 깬다고 판정하지 않는다.
- 실제 iPad/Android/Safari·스피커 청취·교사 검수는 실행했을 때만 PASS. Playwright WebKit과 구분한다.
- 최종 테스트/build/production에 사용한 build hash를 확인한다. 검증 후 코드 변경이 있으면 최종 증거 대상이 무엇인지 명시한다.

# 15. 인수·문서·PR 제출

부속 `09_Acceptance_0.8.json`의 항목별로 실제 PASS/FAIL/NOT_RUN, 실행 레벨, 명령/근거를 작성한다. 이 문서의 최초 NOT_RUN은 결과가 아니다.

필수 제출물:

- `PATCH_NOTES_0.8_KO.md`
- `TEST_REPORT_0.8.md`
- `ACCEPTANCE_0.8.md`
- `RELATIVE_WH_GRAMMAR_REVIEW_0.8.md`
- `WATERWAYS_SUPPLY_SAVE_REVIEW_0.8.md`
- `DUAL_RELATIVE_SEAL_REVIEW_0.8.md`
- `UI_THEME_REVIEW_0.8.md`
- `docs/validation/v0.8/`의 명령 exit code·build hash·선별 캡처·학습/완주/실패 요약

원시 대형 영상·매 단계 전체state dump는 로컬 ignored 경로에 보존하고 공개 저장소에 무조건 수십만 줄을 추가하지 않는다. 핵심 실제 입력/영수증·정산·근거를 추적할 수 있는 선별 요약은 유지한다. 개인 절대 경로와 환경 덤프는 커밋하지 않는다.

작업 브랜치 push 및 main 대상 PR까지만 한다. **main 직접 push·merge·auto-merge·Pages 설정 변경·공개 배포는 별도 승인 없이 하지 않는다.** 필수 검증을 마친 PR은 Ready for review로 제출하고, blocker로 Draft를 만들면 이유와 남은 항목을 명시한다. 테스트 성공과 공개 배포 성공을 혼동하지 않는다.

# 16. 근거 목록

사용자 대화의 최신 확정사항이 설계의 1차 근거다. 다음 자료는 기존 구현 확인 및 문법 규칙 확인에 사용했다. 새 HP/배수/등급/적 이름은 문헌의 사실이 아니라 본 명세의 구현 초깃값이다.

**[R01] main branch / PR #11 merge**  
https://github.com/YEOMT/grammardealer/commit/ca1675dbb9e546bf2b9442dba8cfc1077c7e12dd  
구분: CURRENT_CODE_READ. 관찰한 기준. 작업 시 다시 최신 main을 확인한다.

**[R02] AGENTS.md**  
https://github.com/YEOMT/grammardealer/blob/ca1675dbb9e546bf2b9442dba8cfc1077c7e12dd/AGENTS.md  
구분: CURRENT_CODE_READ. 현재 소스 보존·Controller·테스트·merge 권한

**[R03] parser.js relative clause path**  
https://github.com/YEOMT/grammardealer/blob/ca1675dbb9e546bf2b9442dba8cfc1077c7e12dd/src/engine/grammar/parser.js  
구분: CURRENT_CODE_READ. 기존 that/생략 경로와 버전 게이트

**[R04] grammar/index.js question fixture gate**  
https://github.com/YEOMT/grammardealer/blob/ca1675dbb9e546bf2b9442dba8cfc1077c7e12dd/src/engine/grammar/index.js  
구분: CURRENT_CODE_READ. 물음표 fixture의 cap.question 미지원 분기

**[R05] skyEvidence.js and comboEligibility.js**  
https://github.com/YEOMT/grammardealer/blob/ca1675dbb9e546bf2b9442dba8cfc1077c7e12dd/src/engine/grammar/skyEvidence.js  
구분: CURRENT_CODE_READ. 실제 절/노드/VP·gap·해금 분리

**[R06] shop.js**  
https://github.com/YEOMT/grammardealer/blob/ca1675dbb9e546bf2b9442dba8cfc1077c7e12dd/src/game/shop.js  
구분: CURRENT_CODE_READ. 2/4/6 상점 guard·운영 전용 칸·가격

**[R07] frostCards.js / 0.7 handoff**  
https://github.com/YEOMT/grammardealer/blob/ca1675dbb9e546bf2b9442dba8cfc1077c7e12dd/src/game/frostCards.js  
구분: CURRENT_CODE_READ. 설원 source 계약 및 별도 임시 카드 dispatcher와 통합 필요

**[R08] scoring.js / frostCrystalLock.js**  
https://github.com/YEOMT/grammardealer/blob/ca1675dbb9e546bf2b9442dba8cfc1077c7e12dd/src/engine/scoring.js  
구분: CURRENT_CODE_READ. 기존 단계별 점수와 순수 보스 resolver를 읽고 계약 수립

**[L01] Cambridge English Grammar Today — Relative pronouns**  
https://dictionary.cambridge.org/us/grammar/british-grammar/relative-pronouns/  
구분: EXTERNAL_GRAMMAR_VERIFICATION. who/which/that, 목적격 생략, 전치사 목적격, where/when

**[L02] Cambridge — Relative clauses: defining and non-defining**  
https://dictionary.cambridge.org/uk/grammar/british-grammar/relative-clauses-defining-and-non-defining  
구분: EXTERNAL_GRAMMAR_VERIFICATION. 관계절 내부의 주격/목적격, 중복 대명사 금지

**[L03] Cambridge — Questions: wh-questions**  
https://dictionary.cambridge.org/grammar/british-grammar/wh-questions  
구분: EXTERNAL_GRAMMAR_VERIFICATION. 조동사·do-support·의문 주어 예외·의문 어순

**[L04] Cambridge — Reported speech: indirect speech**  
https://dictionary.cambridge.org/grammar/british-grammar/reported-speech-indirect-speech  
구분: EXTERNAL_GRAMMAR_VERIFICATION. 간접의문문 평서 어순·기계적 시제 역행 금지

**[L05] British Council — Reported speech: questions**  
https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/reported-speech-questions  
구분: EXTERNAL_GRAMMAR_VERIFICATION. 질문 내용절 어순 확인. 간접화법 전면 도입 근거로 사용하지 않는다.
