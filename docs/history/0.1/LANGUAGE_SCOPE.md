# 0.1 언어 데이터와 판정 범위

구현 기준은 첨부 인계서의 §6–9, §15.2, §17–19 및 `04_LANGUAGE_SEED_MANIFEST_v0_1.json`, `05_ACCEPTANCE_CASES_v0_1.json`이다. 다른 DS 게임 소스는 사용하지 않았다. 어휘 Band는 인계서의 게임용 큐레이션을 그대로 사용하며 공식 CEFR/빈도 등급이라고 주장하지 않는다.

## 실제 작성한 데이터

- Lexeme 116개에 한국어 뜻, 품사, 어휘 Band, 형태 ID, 기본 Sense, FrameBinding, Capability, 용법 안내를 작성했다.
- 실제 덱·보상에서 사용 가능한 Lexeme는 115개다. `recently`는 `runtimeReady=false`이며 후보 가중치가 0이다. 단순 현재형 예문에 억지로 넣지 않고 과거·완료 Pack의 검증 이후 활성화하도록 남겼다. 다른 고급 Band 부사 `clearly`가 남아 있어 해당 Band의 부사 후보가 완전히 비지는 않는다.
- 243개 형태 중 182개가 현재 UI에서 선택 가능하다. 과거/-ing 등의 예약 형태는 일반 메뉴에 노출하지 않으며 fixture 입력 시 `UNSUPPORTED`다. `read`처럼 현재/과거 철자가 같은 경우에는 현재형으로 설명되는 정상 분석을 우선한다.
- 내부 Frame은 SV, SVC_ADJ, SVC_NP, SVO, beLocative 5개다. 실제 위치 표현을 가진 beLocative만 학교 문법의 SV로 정규화한다.
- 활성 보상 후보는 일반 103, 고급 10, 희귀 2개다. 고급 후보는 make/give/show/help/see/become/keep/find/create/develop이며, 모두 구현된 기본 용법을 가진다. 희귀 후보 to/that은 현재 지원 역할만 제공한다. 보상 등급·시작덱 자격은 CardDefinition에 있고 언어 점수·단계 조건으로 쓰지 않는다.
- 명사는 기본 Sense의 가산성을 사용한다. music/food/water/time/homework/information/knowledge/culture/technology는 이 버전에서 선별한 불가산 용법이다. 모든 파생 의미·전문 용법을 다루는 사전이 아니다.

## 실제 판정

`src/engine/grammar/parser.js`는 등록 형태 확인 → NP/AP/AdvP/PP 구성 → 동사 Sense의 FrameBinding 대조 → 일치·격·관사 검사 → 전체 카드 사용 확인 → 대표 분석 정규화 순서로 실행한다. 정답 문자열 목록, 정규식 한 줄 판정, 미리 작성한 점수, 외부 AI/API를 사용하지 않는다.

명사구에는 한정사/소유한정사, 기본 명사·대명사, 명사 앞 형용사와 정도 수식, 간단한 명사 후치 PP가 포함된다. 부사는 데이터에 명시된 대표 위치만 사용한다. very/really 반복 강조와 `very carefully`, `very quickly`, `very well` 같은 제한된 AdvP도 실제 카드별로 분석한다. `I very like dogs`의 very는 진단하되 카드·수식·룬 기여 대상에서 제외한다.

school은 at/in/to의 제한된 학교 활동 용법, home은 at home 및 go/come/be home만 따로 등록했다. 따라서 `I read school`, `I like home`의 단수 명사에 관사를 생략해도 자동 정상 처리하지 않는다.

같은 Lexeme·surface의 형태 후보는 registry에서 다시 얻는다. her의 목적격 메뉴 선택이 `Her book`을 틀리게 만들지 않으며, 소유한정형 메뉴 선택이 `I like her`를 틀리게 만들지 않는다. 다른 Lexeme로 자유롭게 품사를 바꾸지는 않는다.

전체 카드열을 설명하는 정상 후보가 먼저다. 정상 후보가 없을 때만 명시된 한정사·격·일치·very 오류의 부분 복구를 사용한다. 없는 be를 삽입하거나 목적어를 만들거나 카드를 재배열하지 않는다. PP의 부착 후보가 여럿이어도 대표 분석 하나와 실제 증거별 Hit만 출력한다.

## 안전한 경계

- 구조/표면형이 미지원 과거·진행·완료·관계절·to부정사·4/5형식 등의 예약 용법이면 `UNSUPPORTED`다. 후속 FrameBinding은 실행 불가 메타데이터일 뿐 현재 점수 근거가 아니다.
- 지원 기본 구조에서 동사/필수 목적어·보어/어순이 실패하면 `INVALID_CORE`다. 등록된 기본 의미·용법 밖의 모든 영어를 판정하는 범용 문법 검사기가 아니다.
- 데이터 참조 오류, 조작된 surface/form ID, 중복 실물 카드 ID, 내부 예외는 `ENGINE_ERROR`다. 미지원 문법으로 숨기지 않는다.
- 최대 16카드, 구성 후보 128개, 구조 재귀 깊이 4, 작업량 12,000으로 제한한다. 후보/작업량 한도에 걸리면 개발 진단에 제한명을 넣어 `UNSUPPORTED`로 반환한다. 전체 순열 탐색은 없다.
- Grammar는 점수·룬·강화·적 체력·DOM·서버를 읽지 않는다. 모든 Node/Hit/역할/범위는 실제 `cardInstanceId`에 연결된다.

## 공개 API

`src/data/language/index.js`

- `registry`: 동결된 lexemes/forms/morphologies/senses/frames/cards 배열 및 ID별 객체 인덱스.
- `lexemeForCard(cardDefId | CardInstance | CardDefinition)`
- `formsForCard(card, {includeUnsupported:false})`
- `makeToken(cardInstanceId, cardDefId, formId?, position=0)`
- `createSentenceSnapshot(sentenceSlots, cardInstances, {sentenceId})`

`src/engine/grammar/index.js`

- `analyzeSentence(snapshot, registry?)`: 명세의 AnalysisResult. `mainFrameId`, `hits`, `excludedCardIds`는 소비 모듈용 별칭이다.
- `snapshotFromSlots`: 위 createSentenceSnapshot과 같은 함수.
- `snapshotFromText(text, {sentenceId, prefix})`: 개발 fixture 편의 변환. 등록 표면형만 카드 ID로 바꾸며 모르는 단어는 `UNSUPPORTED` 표시를 남긴다. 실제 전투 입력은 Card ID 기반이다.

## 실행 검증

`node --test --test-isolation=none tests/grammar.test.js`로 86개 이름 있는 검사를 통과했다. 여기에는 필수 G01–G48 전체, 각 활성 Lexeme의 실제 사용 예, 동사별 동일 Frame을 다른 주어·명사·수식어로 바꾼 114개 생성 조합, 동형어, PP 중의성, 실제 카드 참조, 조작 입력, 16카드 한계 및 20개 추가 경계 입력이 포함된다. 생성문 검사는 수작업 기대값 48건을 대체하지 않는다.

`node tools/validate-data.js`는 ID·참조·Capability·형태·카드 풀 연결 등 2,251건을 검사한다. 이는 영어 전체의 정확성을 보증하는 수치가 아니다. 실제 실행 명령과 최종 통합 결과는 TEST_REPORT를 참조한다.
