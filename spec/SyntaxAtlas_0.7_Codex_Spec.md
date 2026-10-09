# Syntax Atlas 0.7.0 통합 구현 명세
## 잿불 동굴 · 분사 수식/수동태/목적격보어 · 검은 먼지 · 잠든 잿불룡

**문서 버전:** 1.0 / 2026-10-09 한국시간  
**성격:** Codex 구현 계약과 검증 기대값. 실행 결과 보고서가 아니다.  
**정적으로 확인한 기준 main:** `e2a878640dc88bce12e62ad6041a59867e09ef92` — 0.6.1 PR #10 병합.  
**실제 구현 출발점:** 작업 시작 시 최신 `origin/main`. 위 SHA로 무조건 되돌리지 않는다.  
**작업 브랜치:** `codex/v0.7-ember-cave-participles-dust`  
**목표:** 새 0.7.0 원정에 Stage 7 추가. 7지역, 32전투, `STAGE7_END`.

---

# 0. 읽는 순서와 근거 구분

1. 현재 checkout의 `AGENTS.md`, `README.md`, `docs/PROJECT_HANDOFF.md`, `docs/ARCHITECTURE.md`, `docs/TEST_REPORT_0.6.1.md`를 읽는다.
2. 이 MD 전체와 `02`~`10` 부속 JSON을 읽는다. 외부 MD와 ZIP 내부 MD는 동일본이다.
3. **현재 사용자의 추가 지시 → 이 문서의 확정 계약 → 명시적인 구현 세칙 → 과거 명세** 순서로 적용한다.
4. 과거 source/deploy ZIP으로 현재 checkout을 덮어쓰지 않는다. 기존 미커밋 변경·다른 브랜치·원본 첨부는 보존한다.
5. JSON은 QA 기대값이다. 게임에 정답 문장 조회표로 넣거나, 파서 대신 문자열을 맞추거나, PASS 결과로 복사하지 않는다.
6. 이 문서의 **[합의]**, **[신규 초깃값]**, **[구현 세칙]**, **[보류]**를 구분한다. 새 숫자를 과거 사용자 확정값으로 표현하지 않는다.
7. 이번 작성은 소스 읽기·공식 문법 자료 대조·명세 정합성 점검이다. 0.7 엔진/브라우저를 실행한 것이 아니다. 실제 수정 전·후 실행은 Codex가 한다.

# 1. 업데이트의 목적과 고정 범위

## 1.1 합의한 핵심

- 지역은 **잿불 동굴**. 설원에서 지열 동굴로 내려가는 붉고 따뜻한 전환이다. 공포/지옥이 아니라 오래된 지하 생태계다.
- 일반전은 **분사 수식 → 수동태 → 사역·준사역 → 지각**, 보스는 **잠든 잿불룡**이다. 분사 두 종류는 7-1 한 전투로 묶는다.
- 새 WORD 카드를 대량 지급하지 않는다. **기존 동사·기존 -ing/과거분사(p.p.) 형태**로 사용 범위를 확장한다.
- 분사 수식은 명사 앞·뒤 모두 실제 구조로 인정한다. 수동태는 **be 계열 + p.p. + 수동 가능한 타동 용법**이 필요하다.
- 목적격보어는 동사별 허용표를 사용한다. `see + O + 원형/-ing/p.p.`는 모두 정식 지원한다.
- 일반전에는 **검은 먼지 2장**, 보스에는 **5장**을 전투 시작 한 번 섞는다. 전투 종료 시 사라지며 영구 덱에 남지 않는다.
- 먼지는 사용할 수 없고 조합대에 올릴 수 없지만 **교환으로 버릴 수 있다**. 버린 먼지는 재셔플되면 다시 뽑힐 수 있다.
- 보스의 **검댕 비늘**은 피해를 75% 줄인다(실제 피해 ×0.25). 올바른 -ing 또는 p.p. 사용 한 번으로 파괴하며 **그 공격부터 정상 피해**다. 이후 재생성하지 않는다.
- 진행/완료/동명사 같은 기존 문법으로도 비늘을 깰 수 있다. 새 문법은 지역 보너스로 유도하되 보스 공략을 한 가지로 강제하지 않는다.

## 1.2 이 문서가 정하는 구현 세칙/초깃값

- HP: **960 / 1,040 / 1,120 / 1,200 / 1,440**. 앞 단계의 고점만 따라 HP를 급격히 올리지 않는 출발값이다. 적정 난이도 검증 완료값이 아니다.
- 수동태 새 콤보 **×1.8**, Stage 7 지역 **×1.25**. 분사 수식은 기존 형용사 수식 점수, 분사 OC/사역·지각은 기존 5형식 배수 ×2.5를 쓴다. 별도 사역/지각 중복 배수는 없다.
- 첫 손패의 먼지 **최대 1장**. 실제 WORD witness를 보호한다. 이후 드로우의 먼지를 자동으로 피하게 만들지는 않는다.
- 먼지는 `cardKind=OBSTACLE`, `source=EMBER_CAVE`, `lifetime=BATTLE`로 정의한다. WORD/OPERATION을 위장하지 않는다.
- `want/need`의 검토 중이던 O+PP는 정식 목표에 포함한다. `like O+PP`도 같은 PP 보어 구현을 재사용해 인정한다([L06,L07]). 이것은 표준 문법 근거를 반영한 구현 세칙이며 모든 동사에 확대하는 규칙이 아니다.
- 수동문의 **표면 문형**과 **기저 타동 Frame**을 분리한다. 이것은 게임의 문형/룬 일관성을 위한 채점 표기 정책이다.
- 일반전 첫 손패에서 목표 문법 완성까지 강제하지 않는다. 실제 기본 문장 witness와 적절한 재료 선택의 기회를 보존한다.

## 1.3 변경하지 않는 것

- 기본 28장 덱과 frozen 0.4 생성기, 6턴·교환4·손패10·준비draw3·조합대16장. 룬이 늘린 실제 자원 한도도 보존.
- 0.6.1 운영 7종, 연마 최대+1, 기존 보급/탐색+1의 반복 사용. 재사용에 새 쿨다운/횟수 상한을 붙이지 않음.
- 운석 룬 **1.8/2.4, 2.2/2.8, 2.6/3.2** 및 나머지 기존 룬·점수 계수.
- Stage 1~6 HP, 골렘·문지기·스핑크스·사슴 기믹, Stage4 3택1 지급, 사슴 임시 탐색.
- 2·4·6스테이지의 상점 구성/운영1칸/가격·서비스와 기존 보상 외부 확률.
- 무보상 튜토리얼 스킵, 정상 실패 제출, AP-to gap, 조동사 사이 부사와 본동사 문형 인정, 동일 철자 형태 정책.
- 기존 저장의 종료 경계/덱/HP/룬값/보상/RNG/과거 기록.

## 1.4 명시적 보류

- Stage 8 이후·전체48전투 최종전·새 난이도·새 캐릭터·새 서버/AI/번역.
- 새 WORD/새 운영 카드/새 룬. `by`, `hear`, `watch`, `let`, `get`, `open`, `break`, `understand` 등을 예문 때문에 추가하지 않는다.
- look 카드 삭제나 look/look at 분할. `look + 형용사`는 보존하고 전치사동사 전면 확장하지 않는다.
- **5번째 룬 슬롯**: 초기 roadmap에는 Stage6 후5슬롯이 있지만 현 main의 실행 정책은4다[R02]. 이번 지역 대화에서 추가 개방을 다시 결정하지 않았으므로 **이번에는 현행4를 유지**한다. roadmap의 미래 메타데이터를 실행기능으로 슬쩍 활성화하지 않는다.
- Stage7 새 상점, 추가 턴, 무료 정화/운영 카드, 매턴 먼지 생성.
- 본문에 없는 심화 예외는 정답/오답을 함부로 일반화하지 않는다. 현재 카드 풀로 만들 수 있는 기본 구조부터 정확히 구현한다.

# 2. 지역과 전투

| 전체/지역 전투 | 적 | 중점 | HP 초깃값 | 먼지 |
|---|---|---|---:|---:|
| 28 / 7-1 | 불씨 도롱뇽 🦎 | 현재·과거분사 수식 | 960 | 2 |
| 29 / 7-2 | 현무암 거북 🐢 | 수동태 | 1,040 | 2 |
| 30 / 7-3 | 화로 대장장이 정령 🔥 | 사역·준사역과 목적격보어 | 1,120 | 2 |
| 31 / 7-4 | 메아리 박쥐 🦇 | 지각동사와 목적격보어 | 1,200 | 2 |
| 32 / 7-5 | 잠든 잿불룡 🐉 | 종합·검댕 비늘 | 1,440 | 5 |

일반전은 별도 면역/갑옷이 없다. 지역 문법 없이 기존 빌드로 처치할 수 있다.

## 2.1 소개·진행

`0.7 Stage6 보스 승리 → 기존 보상 → Stage6 완료 → NEXT_STAGE → Stage7 소개/보스 예고 → ENTER_STAGE → 7-1`

- Stage6 승리 시 새 원정에 `pack.participles`, `pack.passive`, `pack.causativePerception`을 멱등적으로 부여한다. 기존 설원 보상 팩도 그대로 적용한다.
- Stage7 입장에 영구 카드를 주지 않는다. 현재 보유 카드가 부족하다고 동사/명사/운영을 새로 만들어 채우지 않는다.
- 소개 화면에 ‘전투 시작 시 검은 먼지가 덱에 섞입니다. 교환으로 버릴 수 있으며 전투가 끝나면 사라집니다.’와 보스 약점을 미리 공개한다.
- Stage7에 상점은 없다. 이전 Stage6 상점을 그대로 닫힌 이력으로 보존한다.
- 7-5 보스 처치: `STAGE7_CLEAR` 한 번 기록 → 보상 해결 → `CONTENT_COMPLETE / STAGE7_END`.
- 0.6.1 저장은 종전대로 Stage6에서 끝난다. 신규0.7만32전투이며 Stage7 완료는 전체 스토리 클리어가 아니다.

## 2.2 몬스터와 보스의 시각 역할

**불씨 도롱뇽:** 작은 주황빛 꼬리와 둥근 몸. ‘움직이는 생물/빛나는 무늬’ 인상. 실제 문법 구분은 데이터/판정이 담당하며 외형만으로 정답을 판단하지 않는다.

**현무암 거북:** 무겁고 검은 등껍질의 틈에 국소 용암빛. 수동태 공격을 하면 정상 점수 근거가 강조될 뿐, 일반전 피해에 별도 숨은 장막을 추가하지 않는다.

**화로 대장장이 정령:** 손만큼 작은 망치로 광석을 두드리는 불씨. 무언가를 만들고 하게 하는 이미지. make/have/help를 모두 ‘정확히 동일한 사역 뜻’으로 설명하지 않는다.

**메아리 박쥐:** 넓은 귀와 호박색 눈, 부드러운 회색 날개. 이미 있는 see/feel 카드로 지각을 다룬다. 박쥐라고 hear를 새로 지급하지 않는다.

**잠든 잿불룡:** 동굴 바닥에 몸을 둥글게 말고 있는 오래된 용. 검은 비늘 아래 금빛 열이 흐른다. 초기에 검댕 비늘이 덮여 있고, 해제 시 밝은 균열과 눈 뜨는 짧은 연출. 괴수 공포·점프스케어·전체 화면 난사 없음.

최종 그림은 별도 아트 작업이다. 이번엔 이모지/CSS fallback으로 완주 가능하게 만들고, `stage07.*` 자산ID와 선택적 로컬 경로만 마련한다.

# 3. 검은 먼지: 세 번째 카드 종류

## 3.1 정의

```text
cardDefId: card.obstacle.blackDust
cardKind: OBSTACLE
nameKo: 검은 먼지
source: EMBER_CAVE
lifetime: BATTLE
lexemeId / forms / POS / score / rarity / price: 없음
polishLevel: 0 고정
```

0점 WORD로 위장하지 않는다. 품사 FUNCTION도 아니다. 단어 사전·문장 분석·운석 유효카드 수에 들어갈 여지가 없어야 한다.

학생용 문구:

> 검은 먼지  
> 사용할 수 없습니다. 교환으로 버릴 수 있으며, 전투가 끝나면 사라집니다.

## 3.2 생성·보존식

- 현재 `activeCardIds`는 **영구 소유 카드만** 유지.
- 먼지의 실제 사본은 `cardInstances`와 전투의 `temporaryCardIds/temporaryCardMeta`에만 들어간다.
- ID 예시: `dust.<runId>.battle.<battleNumber>.<00..>`.
- `combat.dustSupplyTrace`에 최초 source/battle/사본ID/정의/초기먼지수와 opener 보정을 남긴다.
- 7-1~7-4는2사본, 7-5는5사본. **새 턴마다 추가 없음**.

전체 살아 있는 카드 영역은 현재 WORD/OPERATION/temporary 보존식에 맞춘다.

```text
영구 active IDs + 전투 temporary IDs
= DRAW + HAND + SENTENCE + DISCARD + EXHAUSTED + SHATTERED
(상호 배타적 물리 ID; 현재 전투에 존재하는 모든 종류의 사본)
```

종류별 허용 영역:

| 종류 | DRAW/HAND/DISCARD | SENTENCE | EXHAUSTED | SHATTERED |
|---|---|---|---|---|
| 영구 WORD | O | O | X | X |
| 영구 OPERATION | O | X | 정책에 따라 O | X |
| 빙정 WORD(Stage6) | O | O | X | 제출 후 O |
| 빙정 SEARCH(Stage6) | O | X | 사용 후 O | X |
| 검은 먼지(Stage7) | O | **X** | **X** | **X** |

먼지를 버리거나 뽑는 것으로 새 사본이 만들어지면 안 된다. 교환된 먼지는 사라지지 않고 discard에 실제로 남는다.

## 3.3 첫 손패와 RNG

1. 기존의 실제 WORD 기반 opener/witness 탐색을 유지한다. 먼지와 운영을 WORD 문법 후보로 넣지 않는다.
2. 모든 실제 draw 대상 사본을 deck RNG로 섞는다. 먼지는 정상적으로 드로우 확률을 희석한다.
3. 첫 손패에 먼지가2장 이상이면, 초과분을 draw의 비먼지와 안정적인 swap으로 바꾼다. WORD witness는 건드리지 않는다.
4. 비먼지가 부족한 경계 fixture에서는 max1을 지키는 작은 손패로 시작하고 남은 먼지를 draw에 둔다. 가짜 대체 카드를 만들지 않는다.
5. 위치 보정에 RNG를 추가 소비하지 않고 trace에 기록한다. 최초 shuffle 외 reward/shop/encounter stream을 쓰지 않는다.
6. 이후 드로우에는 추가 먼지보정 없음. 기존 한도 clipping/재셔플/교환 정책 그대로다.
7. load는 저장된 위치를 복원할 뿐 재생성·재셔플·witness 재탐색을 실행하지 않는다.

`cardKind !== OPERATION → WORD`라는 기존 암묵 가정을 모두 점검한다. 새 code는 `cardKind === WORD`를 명시해야 한다. 특히 `operationResolution`의 기존 WORD 분기는 OPERATION만 제외하면 true인 형태이므로 그대로 두면 먼지가 탐색 후보가 된다[R04].

## 3.4 입력과 이동

- 클릭/드래그로 조합대 삽입, WORD와 맞교환, 형태 선택, 운영 사용 모두 UI와 Controller 양쪽에서 거절.
- 교환 체크는 정상 사용 가능. disabled 스타일이 체크버튼까지 막지 않는다.
- 교환 행동은 기존4회 제한·턴 무소모·선택 장수만큼 보충을 따른다.
- 준비는 기존대로 턴 소모·3장 드로우. 먼지 때문에 새 준비 규칙을 만들지 않는다.
- 손패가 먼지뿐이고 교환을 소진했더라도 앱은 응답해야 한다. 마지막 턴 넘기기/정상 패배 안내는 기존대로 된다.

## 3.5 운영 카드 상호작용

| 운영 | 먼지 처리 |
|---|---|
| 보급(+0/+1) | 정상 ALL 드로우이므로 먼지도 나옴. 먼지뿐이어도 카드 획득은 성공 |
| 직접 탐색(+0/+1) | WORD만 대상. 먼지 제외 |
| 품사 탐색4종 | WORD+해당 품사 필터. 먼지 제외 |
| 재활용(+0/+1) | discard ALL이므로 먼지도 무작위 대상 |

- 후보0이면 기존처럼 무소모. ‘먼지만 뽑혔다’는 결과를 코드 실패로 취소하거나 무료 재추첨하지 않는다.
- 보급/탐색+1은 효과 해결 뒤 source를discard에 넣는다. 효과 도중 자기자신을 뽑지 않되, 나중에 다시 뽑은 실제 사본은 재사용한다.
- 0.6.1의 새 command/effect 번호, 중복 정산 금지, 취소와 저장/입력 잠금을 보존한다.
- 먼지에는 점수/어휘/연마가 없다. 반면 운영 receipt의 실제 `drawnCardIds`와 `actualDrawCount`에는 먼지도 포함될 수 있다.

## 3.6 정리와 위조 방지

승리·패배·명시적 원정 종료/새 원정에서 해당 전투의 모든 먼지 사본을 정리한다. 실제 상태의 참조는 없애되, 사용 기록 검증에 필요한 사본 정의/source/생성 인덱스는 immutable 종료 명세 또는 영수증으로 남긴다.

**중요:** 현 `validateFrostCards`는 설원 외의 어떤 `.temporary` 사본도 거절한다[R03]. 이를 단순 삭제해서 임시 카드를 모두 허용하면 안 된다. 0.7에서만 source dispatcher 또는 source별 검증을 두고, 마지막에 orphan/범위/중복을 공통 검증한다. 0.6.1 validator/view는 보존한다.

거절할 저장: 영구 덱에 먼지ID, 먼지의 연마/영어형태, exhausted/shattered/조합대의 먼지, 다른 전투source, 공급수2/5 불일치, 중복 위치, 삭제해버린 사본, 존재하지 않는 사본을 영수증 전체에 끼워 넣은 변조.

# 4. 언어 DB: 기존 동사36종의 유한 확장

## 4.1 원칙

- 실제 export 기준 기본35종과 미래조동사will1종을 재확인한다. 앞선 대화의34종 표는 send/will 누락이 있었으므로 사용하지 않는다.
- 물리 WORD 정의는 그대로다. 활용 형태·Sense·FrameBinding·허용목적격보어·수동화 메타데이터만 새0.7 view에서 확장한다.
- `go/run`에 타동적 신의미를 무작정 붙이거나, look at/hear/watch/get/let을 추가해서 범위를 키우지 않는다.
- 어떤 구조를 이번 대표 OC 표에서 빼더라도 ‘영어에서 절대 불가능’이라고 사전에 적지 않는다. 명사 후치 분사처럼 **다른 정상 분석이 성립하면 인정**한다.
- 단어 제거가 필요하다는 결론이 나면 코드에서 먼저 삭제하지 말고, 이 문서의 범위 예외로 근거를 남긴다. 이번 기본 계약은 look 포함 기존 카드 보존이다.

기호: AP=형용사구, NP=명사구, BARE=동사원형, TO=to부정사, ING/PP=현재분사/과거분사 보어. 아래 표는 모든 영어 용례의 백과사전이 아니라 **이번 게임 지원 계약**이다.

| 동사 | 기존 핵심 구조 | 목표 OC 형태 | 신규/점검 |
|---|---|---|---|
| be | SVC_AP, SVC_NP, SV_LOCATION, AUX_PROGRESSIVE | — | AUX_PASSIVE |
| have | SVO_POSSESSION, AUX_PERFECT, SVOC_BARE | BARE, ING, PP | SVOC_ING, SVOC_PP |
| do | SVO | — | 현행 유지·수동 적격 점검 |
| go | SV | — | 현행 유지·수동 적격 점검 |
| come | SV | — | 현행 유지·수동 적격 점검 |
| run | SV | — | 현행 유지·수동 적격 점검 |
| live | SV | — | 현행 유지·수동 적격 점검 |
| work | SV | — | 현행 유지·수동 적격 점검 |
| play | SV, SVO | — | 현행 유지·수동 적격 점검 |
| eat | SV, SVO | — | 현행 유지·수동 적격 점검 |
| read | SV, SVO | — | 현행 유지·수동 적격 점검 |
| like | SVO, SVO_TO, SVO_ING, SVOC_TO | TO, PP | SVOC_PP |
| want | SVO, SVO_TO, SVOC_TO | TO, PP | SVOC_PP |
| need | SVO, SVO_TO, SVO_ING_PASSIVE_MEANING, SVOC_TO | TO, PP | SVOC_PP |
| make | SVO, SVOO_FOR, SVOC_AP, SVOC_NP, SVOC_BARE | AP, NP, BARE | PASSIVE_CAUSATIVE_TO |
| give | SVO, SVOO_TO | — | 현행 유지·수동 적격 점검 |
| see | SVO, SVOC_BARE | BARE, ING, PP | SVOC_ING, SVOC_PP, PASSIVE_PERCEPTION_TO_ING |
| help | SV, SVO, SVO_BARE, SVO_TO, SVOC_BARE, SVOC_TO | BARE, TO | 현행 유지·수동 적격 점검 |
| feel | SVC_AP, SVO, SVOC_BARE | BARE, ING | SVOC_ING |
| become | SVC_AP, SVC_NP | — | 현행 유지·수동 적격 점검 |
| look | SVC_AP | — | 현행 유지·수동 적격 점검 |
| take | SVO | — | 현행 유지·수동 적격 점검 |
| keep | SVO, SVOC_AP, SVOC_NP_LEGACY | AP, NP_LEGACY, ING, PP | SVOC_ING, SVOC_PP, SVO_ING_CONTINUATION |
| find | SVO, SVOC_AP, SVOC_NP | AP, NP, ING, PP | SVOC_ING, SVOC_PP |
| show | SVO, SVOO_TO | — | 현행 유지·수동 적격 점검 |
| create | SVO | — | 현행 유지·수동 적격 점검 |
| improve | SV, SVO | — | 현행 유지·수동 적격 점검 |
| develop | SV, SVO | — | 현행 유지·수동 적격 점검 |
| change | SV, SVO | — | 현행 유지·수동 적격 점검 |
| send | SVO, SVOO_TO | — | 현행 유지·수동 적격 점검 |
| will | AUX_FUTURE | — | FUTURE_WITH_PASSIVE |
| think | SV, SVO_CONTENT | — | 현행 유지·수동 적격 점검 |
| know | SV, SVO, SVO_CONTENT | — | 현행 유지·수동 적격 점검 |
| say | SVO, SVO_CONTENT | — | 현행 유지·수동 적격 점검 |
| enjoy | SVO, SVO_ING | — | 현행 유지·수동 적격 점검 |
| finish | SVO, SVO_ING | — | 현행 유지·수동 적격 점검 |

자세한 `passivizableSourcePatterns`와 제한 설명은 `03_Verb_Forms_Audit_0.7.json`을 따른다.

## 4.2 중요한 분리

- have: 소유 SVO / 완료 AUX / 사역·경험 SVOC를 분리. 소유 have의 ‘목적어 존재’를 근거로 자동 수동화하지 않음.
- see: BARE/ING/PP 필수. 실제 PP 보어를 ‘수동의미지만 미지원’으로0점 처리하지 않는다[L01].
- make: AP/NP/BARE와4형식for 유지. 수동 make+to를 지원. 제한된 `make oneself understood`류는 새 재귀대명사/understand 카드까지 추가하지 않음[L03].
- find/keep: ING/PP 보어. 기존 NP 보어를 일괄 삭제하거나 모범 문법으로 과도하게 홍보하지 않음. 대표 범위는 AP/ING/PP 중심.
- want/need/like: O+PP가 실제 허용되는 기본 맥락을 일반PP 보어로 지원하되 **사역/지각동사라는 이름으로 잘못 분류하지 않음**[L06,L07].
- feel: 대표 BARE/ING를 정식 지원. 제한적인 PP 용법은 본문 범위 밖으로 두되 NP/형용사 상태 분석으로 정상인 사례를 억지로0점으로 만들지 않는다.
- help: BARE/TO 유지. O+ING/PP를 help의 직접 보어라고 일반화하지 않음. `I help the child running in the park.`의 running은 child 수식으로 정상일 수 있음[L05].

# 5. 분사 수식과 목적격보어

## 5.1 하나의 형태, 문장 위치의 실제 역할

- 기존 `-ing형`은 동명사/진행/현재분사/OC에 공유. 별도 카드나 사용자가 고르는 역할 모드를 만들지 않는다.
- 기존 `과거분사(p.p.)`는 완료/수동/수식/OC에서 공유. 과거형과 같은 철자라도 **실제 동사구/수식 역할**을 근거로 판정한다.
- 명사 앞·뒤를 모두 허용하되 내부 필수목적어와 범위는 확인한다.
- 예: `The running child is happy.`, `The child eating food is happy.`, `The finished homework is easy.`, `The picture made for you is beautiful.`
- p.p. 수식은 수동 또는 검수된 상태 용법이어야 한다. 모든 자동사의 PP를 아무 명사 앞에 놓는 규칙은 만들지 않는다.
- `I am gone.` 같은 검수된 상태 형용사 예외는 일반 수동태와 구분한다[L08]. 새로운 gone WORD를 추가하지 않고 기존 go 사본의 상태 해석 메타데이터를 사용한다.

## 5.2 구조 증거

각 분사 사용에 최소 다음을 남긴다(필드 이름은 기존 contract에 맞게 연결 가능).

```text
useId, formCardId, resolvedMorphology(ING|PP), function,
phraseCardIds, headCardId, targetNPId/targetHeadCardId,
parentClauseId, sourceVerbSenseId, validity, excludedCardIds
```

`function`은 NOUN_MODIFIER / OBJECT_COMPLEMENT / SUBJECT_COMPLEMENT / PROGRESSIVE / PERFECT / GERUND / PASSIVE 등 실제 분석을 구분한다. 기존 GrammarHit와 중복된 가짜 증거를 또 만들어 카드 수를 부풀리지 않는다.

## 5.3 목적격보어 분석

- `I see him running.`은 him과 running 사이의 술어 관계를 남긴다. 내부 -ing는 유한동사가 아니며 현재진행 시제 자체를 만들지 않는다.
- `I saw the food eaten.`은 see의 PP OC. be가 없으므로 이 구간만으로 VOICE.PASSIVE 콤보를 주지 않는다.
- `I saw her given a book.`은 PP 술어 give의 목적어 한 개가 남아 있는 경우다. 남은 book을 버리지 않는다.
- 하나의 문장이 NP 후치수식/SVOC로 중의적일 때 등록된 지각·유지·발견 동사의 **직접 술어 보어 분석**을 고정된 학교 문법 대표로 우선할 수 있다. 점수·룬·해금으로 선택하지 않는다.
- make O NP의 기존4형식/5형식 중의성 우선순위는 유지한다.
- 사역·지각·보조를 위한 태그는 실제 해당 governor+complement 범위가 있을 때만 생성한다. see로 시작했다고 모든3형식을 지각보어 콤보로 만들지 않는다.

# 6. 수동태

## 6.1 인식 계약

1. 실제 be 계열 AUX와 바로 연결되는 p.p. 본동사를 동사구에서 확인한다. 허용 부사는 사이에 올 수 있다.
2. 그 본동사에 등록된 **타동 Sense/Frame의 수동화 허용**이 있어야 한다.
3. 원래 목적어의 승격과 남은 목적어/보어/PP를 확인한다. 주어·목적어·be를 가정해 추가하지 않는다.
4. `have + p.p.`만 있으면 완료형이지 수동태가 아니다. `have + O + p.p.`도 그 자체로 be-passive는 아니다.
5. 독립 ADJECTIVE 카드 tired/interesting을 어미 때문에 수동/분사로 바꾸지 않는다.
6. `by`는 현 카드 풀에 없으며 필수가 아니다[R08]. 새 by 카드나 합성 by+사람 카드를 추가하지 않는다.

## 6.2 기본 결합

필수: `is/was eaten`, `is being eaten`, `has/had been eaten`, `will be eaten`, `will have been eaten`.

둘 이상의 be/have가 필요한 구조에서는 **실제 서로 다른 사본**이 있어야 한다. 하나의 카드에서 여러 표면 단어를 만들어내지 않는다. 기존 동사구의 bounded 탐색을 재사용하고 새 passive 경로 때문에 전역 후보한도를 무제한 확대하지 않는다.

`will have been being eaten` 같은 비중심 복합형을 핵심 학습·필수QA로 추가하지 않는다. 실제 구현이 지원하지 않는 한도를 정답인척하지 않는다. 기존에 지원된 시간·준동사 조합은 보존한다.

## 6.3 표면 문형과 sourceFrame

게임은 **분석된 수동문에 실제 남은 필수 성분**으로 문형 보너스를 고른다. 원래4형식동사라는 이유로 모든수동문에4형식을 지급하지 않는다.

| 수동문 | 실제 표면 요소 | 게임 schoolFrame | source 정보 |
|---|---|---|---|
| Food is eaten. | S+V | 1형식 | eat 타동 SVO |
| She is given a book. | S+V+O | 3형식 | give SVOO, 수혜자 승격 |
| A book is given to her. | S+V+(PP) | 1형식 | give 대상 승격, to PP |
| She is made happy. | S+V+C | 2형식 | make SVOC.AP |
| She is made a teacher. | S+V+C | 2형식 | make SVOC.NP |
| He was made to work. | S+V+C | 2형식 | make BARE→passive TO |
| He was seen running. | S+V+C | 2형식 | see+ING 수동 변환 |

이 표는 0.7의 교육·게임 표시 계약이다. `sourceFrameId`를 별도로 남겨 원형 문장 관계를 보존한다. 수동문의 문형 때문에 Stage2/골렘 규칙에 원래 없는 혜택을 부여하지 않는다.

## 6.4 오류와 복구

- 0.6.1의 ‘큰 문형과 작은 형태 오류 분리’를 유지한다. 복구 가능한 오류는 구조 hit를 보존할 수 있다.
- 잘못된 be/PP를 쓴 구간에는 정상 VOICE.PASSIVE 콤보나 정상 형태 사용의 보스 증거를 주지 않는다.
- 다른 독립된 정상 PP/ING 사용이 같은 문장 안에 있다면 그 근거는 유지한다. 한 곳의 오류로 전 문장의 모든 구조를 지우지 않는다.
- recoverable hit는 `RECOVERED` 또는 비적격으로 표기하고, `forbidScoreTags` fixture로 점수 제외를 확인한다.
- 핵심 구조 없는 WORD 제출은 기존대로0피해/턴·카드소모. 엔진 한도/예외는 기술오류로 무소모.

# 7. 점수와 해금

## 7.1 신규 효과는 최소화

| 효과 | 0.7 규칙 |
|---|---|
| 수동태 | 정상/해금된 VOICE.PASSIVE가 있으면 공격당1회 ×1.8 |
| 분사 명사 수식 | 기존 MODIFIER.ADJECTIVE 점수, 같은 카드 중복 제외 |
| 분사 목적격보어 | 기존5형식 ×2.5, 불필요한 동명사/형용사수식 자동 중첩 없음 |
| 사역·지각·준사역 | 실제 구조 표시 및 지역 적격. 별도 새 배수 없음 |
| Stage7 지역 | 적격 구조가1개 이상이면 공격당1회 ×1.25 |

분사 수식/OC가 수동 의미를 갖더라도 be-passive가 아니면 VOICE.PASSIVE를 주지 않는다. 반대로 **완료+수동**처럼 서로 다른 검증된 실제 구성은 기존 완료배수와 새 수동배수를 함께 받는다.

수순:

`카드 → 정확성 → 완전문장 → 주절 표면문형 → 시간 → 수동태 → 기존 준동사/비교/연결/수식 → 룬순서 → 지역1회 → 보스 → 최종위력`

같은 유형 히트의 횟수만큼 배수를 반복하지 않는다. 단계별 정수 내림을 유지한다.

## 7.2 지역 적격과 보스 해제를 구분

지역 적격: 정상 분사 명사수식, PP/ING OC, be-passive, 등록된 make/have 원형 사역, see/feel 지각보어, help O (to)원형.

**진행/완료/동명사만 쓴 문장은 Stage7 지역 보너스의 근거가 아니지만, 보스 비늘은 깰 수 있다.** 기존 빌드로 우회할 자유와 새 문법 학습 유도를 동시에 유지한다.

## 7.3 무룬·무연마 산술 예시

이 표는 새 수동/표면문형 세칙을 적용한 **기대값**이다. 실제 엔진을 실행한 결과가 아니다. 관련팩이 열린 Stage7 일반전 기준이며 세부 단계는 `07` JSON에 있다.

| 문장 | 기대위력 |
|---|---:|
| `Food is eaten.` | 175 |
| `Food was eaten.` | 208 |
| `Food has been eaten.` | 285 |
| `Food is being eaten.` | 265 |
| `She is given a book.` | 323 |
| `I see him running.` | 218 |
| `I have the food made.` | 250 |
| `I make him work.` | 218 |
| `I help him to work.` | 350 |
| `The running child is happy.` | 166 |
| `The finished homework is easy.` | 166 |
| `I am eating food.` | 163 |
| `I have eaten food.` | 176 |

예시가 실제 기존 수식 정책과 충돌하면 게임을 몰래 맞추거나 fixture를 조용히 바꾸지 말고 원인과 정책 선택을 기록한다. 최종계수는 이 문서가 승인한 범위만 적용한다.

# 8. 잠든 잿불룡 — 검댕 비늘

## 8.1 초기 상태

```text
bossMechanic.id = EMBER_SCALE_SHIELD
active = true
multiplier = 1/4
releasedByAttackId = null
releaseEvidence = []
```

## 8.2 해제 자격

- 원본 분석이 VALID 또는 구조가 성립하는 VALID_WITH_ISSUES.
- 보스 반감 적용 전 위력 >0.
- 실제 WORD 사본 중 하나 이상에 **올바른 -ing/PP 사용 증거**가 있음.
- 해당 근거 카드/동사구는 excluded/unlicensed/관련 형태 오류 상태가 아님.
- 기존 문법팩 해금 여부가 이 공략 판정의 조건은 아님. 점수 콤보와 보스 증거는 분리.

인정: 명사 분사수식, 분사OC, 진행, 완료의PP, 동명사, 수동태.  
검수된 동사PP의 상태형용사 용법(`I am gone.`)도 실제PP 사용으로 인정하되, 수동태 콤보는 주지 않는다.

불인정: 과거형made/read, 동사원형만 있는 make/see OC, ADJECTIVE 카드interesting/tired, 잘못 끼운형태.

부분오류 문장의 다른 정상절에 `food is eaten`이 있으면 그것으로 해제할 수 있다. 오류있는 진행구 하나만 있으면 그 구의-ing를 정상사용으로 세지 않는다.

## 8.3 피해 적용

```text
release = active AND positivePreBossPower AND hasQualifiedFormUse
activeAfter = active AND NOT release
finalPower = activeAfter ? floor(preBossPower / 4) : preBossPower
actualHpLoss = min(enemyHpBefore, finalPower)
```

- **해제 공격부터 정상피해**. 다음 공격까지 기다리지 않는다.
- 한번 해제하면 전투 끝까지 false. 매 턴 비늘 복구/먼지추가 없음.
- 별도 HP1잠금 없음. 비늘 미해제라도 preBossPower5760이면 HP1440을 바로 처치할 수 있다.
- finalPower가 반감으로0이 됐다면 ‘비늘에 피해가 막혔습니다’ 계열로 표시하고 비문법 문장이라고 안내하지 않는다.
- 외형은 IMPACT에 해제와HP감소를 함께 표시. 정산은 Controller가 이미1회커밋한다. 연출 재생이 다시 비늘/피해를 계산하지 않는다.
- 같은 attackId/commandId의 중복·지연콜백을 검증한다.

## 8.4 문구

예고: **검댕 비늘: 피해 75% 감소. 동사의 -ing형이나 과거분사를 올바르게 사용하면 깨집니다.**  
반감: **검댕 비늘에 피해가 줄었습니다.**  
해제: **검댕 비늘이 부서집니다!**

단문/고점/기존문법 우회 모두 가능해야 한다. 먼지5장과 비늘을 이유로 HP를 추가상향하거나 드로우운영 보유를 필수검사하지 않는다.

# 9. 화면·도감·자산

## 9.1 지역색

0.6.1 theme 계층을 사용한다. 새 CSS전역이 다른스테이지 배경을 덮지 않는다.

초깃값 예시: 짙은 자주 `#21191d`, 적갈 `#382125`, 국소 잿불 `#9c472f`의 낮은 투명도. 밝은 주황은 바닥/암벽 틈에만 쓴다. 패널은 기존 어두운 배경을 유지한다.

사막 그라데이션과 설원 빙정카드의 옅은푸른 바탕은 before/after비교 대상으로 보존한다. 최종배경이미지의 실패가 전투진행을 막지 않는다.

## 9.2 검은 먼지 카드

동일 크기/레이아웃, 짙은회색 바탕·회백색글자, 이름 **검은 먼지**, **방해 · 이번 전투 한정**. 단어 품사띠/문법형태/점수숫자/운영사용버튼 없음. 교환체크는44px로 유지한다.

BODY의 비활성은 교환체크까지 pointer-events:none으로 만들지 않는다. 키보드로 체크할 수 있고 이유설명을 읽을 수 있다.

불필요한 상시입자/애니메이션으로 렉을 늘리지 않는다. 먼지가 손에 들어올 때 짧은 가벼운흩날림은 가능하지만 필수상태정보는 정적표시로도 남아야 한다.

## 9.3 전투 정보/덱 보기

- 기본 전투 HUD에 현재 임시먼지 보유/총2또는5를 읽을 수 있는 간단한 표시.
- DRAW/DISCARD 모달에서 OBSTACLE도 실제 위치대로 표시. 사전 lexeme조회 함수를 먼지에 호출하지 않음.
- 영구보유덱 장수와 ‘이번전투 임시’ 장수를 구분. 먼지가 영구덱/어휘보유수를 늘리지 않음.
- 보스 약점 안내/지역배율/먼지설명이 기존 설원 문제처럼 겹치지 않게 레이아웃 검사.
- 공격편집 중 정답/예상점수/약점충족 자동preview는 추가하지 않는다.

## 9.4 도감의 최소 문구

기존1~5형식 맨위·Stage6→Stage7학습순서·선명한플레이어문장·짧은피드백 유지.

- **분사 수식(-ing / p.p. + 명사 · 명사 + 분사구)**  
  동사의 -ing형이나 과거분사가 명사를 설명합니다.
- **수동태(be + p.p.)**  
  주어가 어떤 행동을 받는 것을 표현합니다.
- **사역·준사역(V + O + 원형/to/p.p. 등)**  
  목적어가 하거나 받는 일을 나타내며, 동사마다 쓰는 형태가 다릅니다.
- **지각동사(V + O + 원형/-ing/p.p.)**  
  목적어의 행동이나 상태를 보고 느끼는 것을 표현합니다.

동사사전의팁은 `see + O + 원형/-ing/p.p.` 같은1줄. 위 도감 패턴이 모든사역동사에모든형태허용을뜻하지않게 개별사용팁으로 연결한다. 별도의분석유형 선택UI, 장문설명/고정예문/전체번역은 넣지 않는다.

# 10. 버전·저장·호환

권장 새 contentVersions는 `02` config에 있다. generator0.4.0·tutorial0.2.1·runes0.6.1·shop/reward0.6.1은 보존한다. **운영 효과/가격은 같아도 OBSTACLE 대상 가능성과영수증 schema가확장되므로0.7 operation검증경로**가필요하다.

- 새 0.7 language는 0.6.1을 복제하고 확장을 더한다. 과거 registry의 객체와 index를 변형하지 않는다.
- 기존 0.6.1의 27전투, 4룬 슬롯, 보상, 상점, 카드 수급, 수정 문법 golden을 보존한다.
- 새 0.7의 Stage 1~6에서도 이미 구현된 수동·분사 문장은 정상으로 인식한다. “아직 7단계가 아니다”라는 이유로 틀리다고 하지 않는다. 새 콤보만 팩 자격을 본다.
- 구버전의 lastAttack, 점수, 최고 기록을 새 계수로 재계산하지 않는다. 교육용 표시의 확장과 경제 정산을 분리한다.
- `contentManifest.cardDefIds`에 장애 정의를 알려도 보상·상점 후보에 들어가지 않도록 pool을 WORD/OPERATION 허용 목록으로 만든다.
- source 전용 검증과 공통 orphan 검증을 함께 사용한다. 이름만 바꾼 먼지·빙정 source 위조를 허용하지 않는다.
- 저장 실패 시 현재 게임과 기존 슬롯을 초기화하지 않고 명확한 오류를 보고한다.
- 종료 후 먼지를 참조한 과거 운영 영수증이 있어도 정상 종료 manifest로 검증할 수 있어야 한다. 참조가 없다고 옛 기록을 삭제하거나 모든 모르는 ID를 허용하지 않는다.


## 10.1 새 버전이 예전 기본 경로로 빠지는 회귀 방지

현재 코드에는 `version === '0.6.1'` 또는 버전 문자열 배열로 기능을 선택하는 곳이 있다. 새0.7을 하나의진입점만 변경하고 나머지를 놓치면 본동사 문법·운영 연마·운석·저장 정책이 이전 기본값으로 돌아갈 수 있다.

- `registryForVersion`, `scoreBalanceForVersion`, `runesForVersion`, `operationCardsForVersion`, `hasPolishCampaign/hasSnowCampaign/hasEmberCampaign`의 **명시적 지원 버전 관계**를 검사한다.
- 0.7은0.6.1의 기능을 포함하지만, 알 수 없는 임의 미래버전을 무조건 최신으로 허용하지 않는다.
- 렌더러, 사전, 샌드박스, 레거시 helper, 보상/상점/저장 validation도 실제 원정의 정책을 사용한다.
- 0.7의 새 문법/지역을 선택하더라도 운석은0.6.1 수치, 기존 운영의 효과/연마는0.6.1 계약이어야 한다.
- 실행형 불변식을 먼저 검사하고 UI 버전문자열만0.7로 바꿔 완료했다고 하지 않는다.

# 11. 코드 통합 지점

파일명은 권장이고, 기존 구조를 최대한 재사용한다.

| 영역 | 필요한 책임 |
|---|---|
| `data/stage7.js`, stages/campaignFeatures/contracts | 5전투/새정책/진행경계 |
| `data/language/emberLanguage.js` 또는 같은역할 | 기존36동사별PP/ING/수동허용데이터 |
| grammar parser/verbPhrase/skyEvidence | 분사수식·OC·수동·원본형태사용증거 |
| scoring/comboEligibility/runes | 수동배수·지역대상, 기존룬계수보존 |
| `game/emberCave.js`, `game/blackDust.js` | 입장팩/먼지생성·배치·정리 |
| cardCatalog/UI models | WORD/OPERATION/OBSTACLE 명시구별 |
| operations/operationResolution/operationHistory | ALL에먼지가능·WORD필터엄격·영수증보존 |
| deck/invariants/localStore/frostCards | 후보·보존식·source검증·저장경계 |
| `engine/emberScales.js` | 순수갑옷해제/피해제안 |
| RunController | 시작/행동/해제/승리/저장제안의유일커밋 |
| UI/theme/presentation/records | 잿불/먼지/비늘과실제문법표시 |

검은 먼지는 영어 단어가 아니므로 parser에 “먼지 문법”을 추가하는 것이 아니다. 파서 입력 전에 WORD만 통과시키고, 허용되지 않은 명령은 상태 불변으로 거절한다.

# 12. 구현 순서

1. baseline 실제재실행/기존golden보존/출발SHA기록.
2. 실제동사36개export와OC/수동가능표검수. 상태와데이터부터정의.
3. 분사수식·OC·수동VP를단위검사와동시에확장.
4. 표면문형·팩·수동점수·보스형태증거연결.
5. OBSTACLE타입·먼지수명·source검증·운영필터.
6. Stage7진행/보상/완료·임시정리·저장.
7. UI/비늘해제/잿불theme·작은화면.
8. 집중통합·교차브라우저·실제학습경로·32전투production.
9. 인수표/알려진문제/PR.

각 단계에서 작은 검사를 먼저 돌리고 공식 전체 검증은 최종에 묶는다. timeout이나 정책 탐색 실패를 해결하려고 게임 HP 변경이나 카드 주입으로 통과시키지 않는다.

# 13. 검증 계획

## 13.1 원래 명령과 신규 명령

현재 package에 있는 다음 명령을 유지·실행한다[R07]. 환경에 맞춰 Windows에서는 npm.cmd를 써도 된다.

```text
npm test
npm run validate:data
npm run build
npm run test:browser
npm run test:browser:polish
npm run test:browser:cross
npm run test:browser:061
npm run test:decks:snow
```

신규 권장:

```text
npm run test:browser:ember
npm run test:decks:ember
npm run test:e2e:ember
```

- `test:decks:ember`: 4어휘 모드 × 2,500의 새 덱·임시 먼지 partition·첫 손패 검사. 이는 사람 난이도나 승률 검사가 아니다.
- 기존 `test:e2e`의 0.6.1 호환 경로는 보존하고 신규 0.7 전체 경로를 별도로 선택할 수 있게 한다.
- 의존성·Playwright·Node·프레임워크를 임의 업그레이드하지 않는다. 원래 명령이 없다면 있는 척 PASS 처리하지 않고 새 명령이나 어댑터를 명시한다.

## 13.2 검증 수준

1. **순수 문법/산술:** 구조·역할·계수·오버킬.
2. **지정 상태 Controller/UI:** 정확한 사본과 특정 먼지 분포·보스 상태로 경계를 검사한다. ASSIGNED로 표시한다.
3. **실제 Controller 원정:** 정상 생성·RNG·상점·보상을 사용하는 유한 정책. 브라우저 완주와 별개다.
4. **실제 production UI:** dist의 `/grammardealer/`에서 처음부터 실제 클릭·형태·교환·보상·상점으로 32전투를 진행한다.
5. **실기기·교사 최종검수:** 실제 실행했을 때만 PASS. WebKit은 iPad Safari 실기기의 대체 증거가 아니다.

전체 32전투 성공만으로 교육 경로를 PASS 처리하지 않는다. `09`의 7-1 수식, 7-2 수동, 7-3 사역, 7-4 지각 구조를 실제 손패로 제출했는지 별도 기록한다. 같은 원정에서 충족해도 결과 파일은 구분한다.

목표 문법을 만들지 않고 룬 고점으로 해당 라운드를 깬 것은 일반 진행 PASS, 해당 학습 과정 NOT_RUN/미충족이다. 추가 패턴 전부를 한 자연 원정에 강제로 넣지 말고, 남은 용법은 지정 상태 UI로 분리한다.

## 13.3 꼭 볼 장면

- 먼지포함보급, 먼지가제외된탐색과품사탐색, 먼지가돌아오는재활용.
- 먼지교환후재셔플재등장, 보급+1동일사본재사용.
- 일반/보스의첫패먼지상한과영구덱불변.
- PP수식과see O PP, be-passive의서로다른피드백.
- made과거형/interesting형용사가비늘을깨지않는경계.
- 정상진행·완료우회비늘파괴, 해제그공격정상피해, 다음일반문장정상피해.
- 큰피해가갑옷을무시해처치하는경계와정리.
- 중간save/load의먼지/운영/비늘/RNG불변, 최종STAGE7_END복원.

## 13.4 자동 정책과 공정성

운영 카드가 없는 집중 상태에서도 교환으로 먼지에 대응하고 정상 공격을 만들 수 있는 실제 경로를 확인한다. 지정 상태의 성공을 모든 원정이나 학생의 성공으로 일반화하지 않는다.

자동 정책이 “No finite QA move”를 보고하면 정책 한계·진행 중 상태·남은 자원을 그대로 남긴다. 그것만으로 불가능 시드·게임 패배·파서 오류라고 하지 않는다. 반대로 확인된 소프트락이나 카드 유실을 정상 패배로 숨기지 않는다.

운영 카드의 정상 순환이 강해지는 것은 허용된다. 복제·동일 명령 이중 효과·사용 중인 source의 즉시 자기 드로우·실제 규칙과 다른 무한 대기는 버그다.

# 14. 인수표와 증거

`08_Acceptance_0.7.json`: **P001~P123, 123개**. 각 행에 이번 실행의 PASS/FAIL/NOT_RUN과 증거 경로를 채운다. 이 인수 번호는 다른 버전의 P번호와 같지 않다.

부속수량:
- 동사표 36개
- 문법 기대 사례 73개
- 먼지·운영·저장 사례 43개
- 보스 산술 12개 + 형태 역할 18개
- 점수 사례 13개
- UI/경로 검증 묶음 12개

숫자를 채우기 위해 테스트를 삭제·skip하거나 허용 오차를 늘리지 않는다. 명세상 진짜 정책 변경이면 이전 기대·새 기대·이유를 분리한다. 이전 문법 golden과 신규 수동 분석의 변화를 혼동하지 않는다.

공개 저장소에는 실행 요약과 선별 캡처, 필요한 간단한 클립만 둔다. 기존 증거를 덮거나 거대한 개인 환경 덤프·전체 대형 로그를 커밋하지 않는다.

# 15. 최종 제출

- `PATCH_NOTES_0.7_KO.md`
- `TEST_REPORT_0.7.md`
- `ACCEPTANCE_0.7.md`
- `VERB_COMPLEMENT_PASSIVE_AUDIT_0.7.md`
- `DUST_LIFECYCLE_REVIEW_0.7.md`
- `docs/validation/v0.7/`의실행명령/요약·선별캡처·학습경로·실패이력
- 구현브랜치push + main대상PR

실제 완료이면 Ready for review PR을 만든다. Draft로 두었다면 이유와 남은 항목을 분명히 보고한다. **main 직접 push·자동 merge·Pages 설정 변경·승인 없는 공개 배포는 금지**한다.

# 16. 참고 근거와 제한

[합의]는 이 대화의 최신 사용자 결정이다. [R]은 확인한 저장소 자료이며 현재 구현의 근거다. [L]은 이번 또는 직전 검토에서 대조한 영어 규칙의 근거다. 문법 자료가 정해 준 것처럼 HP·먼지 개수·배수를 주장하지 않는다.

- [R01] **AGENTS.md** — 작업·검증·원격 변경 권한
  https://github.com/YEOMT/grammardealer/blob/e2a878640dc88bce12e62ad6041a59867e09ef92/AGENTS.md
- [R02] **RunController 0.6.1** — 27전투, 4룬 슬롯, 입장·승리·보상·임시카드 커밋
  https://github.com/YEOMT/grammardealer/blob/e2a878640dc88bce12e62ad6041a59867e09ef92/src/game/runController.js
- [R03] **frostCards.js** — 임시 WORD/OPERATION과 source 전용 검증 경계
  https://github.com/YEOMT/grammardealer/blob/e2a878640dc88bce12e62ad6041a59867e09ef92/src/game/frostCards.js
- [R04] **operationResolution.js** — ALL/WORD/품사 필터, 효과 뒤 source discard
  https://github.com/YEOMT/grammardealer/blob/e2a878640dc88bce12e62ad6041a59867e09ef92/src/game/operationResolution.js
- [R05] **balance.js** — 6턴·교환4·손패10·문장16, 현행 점수·보상
  https://github.com/YEOMT/grammardealer/blob/e2a878640dc88bce12e62ad6041a59867e09ef92/src/data/balance.js
- [R06] **contracts.js** — 정책 버전 분리와 직렬화 계약
  https://github.com/YEOMT/grammardealer/blob/e2a878640dc88bce12e62ad6041a59867e09ef92/src/contracts.js
- [R07] **package.json** — 현재 명령·의존성
  https://github.com/YEOMT/grammardealer/blob/e2a878640dc88bce12e62ad6041a59867e09ef92/package.json
- [R08] **seed.js** — 기존 어휘, send 포함, by 없음
  https://github.com/YEOMT/grammardealer/blob/e2a878640dc88bce12e62ad6041a59867e09ef92/src/data/language/seed.js
- [R09] **language/index + learningFrames + time/sky/desert/grammarPolishLanguage** — 언어 레지스트리의 누적 36동사 및 기존 활용; 구현자가 현재 export를 다시 전수 확인
  https://github.com/YEOMT/grammardealer/blob/e2a878640dc88bce12e62ad6041a59867e09ef92/src/data/language/index.js
- [L01] **Cambridge: See** — see + O + 원형/-ing/p.p.
  https://dictionary.cambridge.org/us/grammar/british-grammar/see
- [L02] **Cambridge: Have something done** — have O 원형/ING/PP, 완료와의 구별
  https://dictionary.cambridge.org/uk/grammar/british-grammar/have-something-done
- [L03] **Cambridge: Make** — make O AP/NP/BARE, for, 수동형 be made to
  https://dictionary.cambridge.org/grammar/british-grammar/make
- [L04] **Cambridge: Passive forms** — be + PP, 타동 용법, 이중 목적어, 연결동사 제외
  https://dictionary.cambridge.org/us/grammar/british-grammar/passive-forms
- [L05] **Cambridge: Help somebody (to) do** — help의 원형/to, 무조건 ING 허용 금지
  https://dictionary.cambridge.org/us/grammar/british-grammar/help-somebody-to-do
- [L06] **Cambridge: Verb patterns with and without objects** — 동사별 Object + ed절; find/need/want/like 및 제한된 feel
  https://dictionary.cambridge.org/us/grammar/british-grammar/transitive-and-intransitive-verbs
- [L07] **Cambridge: Want dictionary** — want O PP가 실제 허용됨
  https://dictionary.cambridge.org/us/dictionary/english/want
- [L08] **Cambridge: Gone** — gone의 형용사 상태 용법은 수동태와 별개
  https://dictionary.cambridge.org/us/dictionary/english/gone
- [L09] **Cambridge: Keep** — keep O AP/ING, keep ING 지속
  https://dictionary.cambridge.org/us/dictionary/english/keep

---

**완료의 뜻:** 문서를 복사하는 것이 아니라 실제 0.6.1 기반에 0.7을 통합하고, 정상 문법·카드 수명·전투 진행·저장·UI를 이번 실행으로 검증하는 것이다. 아직 실행하지 않은 항목은 NOT_RUN이다.
