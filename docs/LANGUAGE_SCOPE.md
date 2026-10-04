# 0.2 언어 데이터와 판정 범위

기존 0.1.1의 현재형 판정과 카드 ID를 보존하고, 0.2 명세의 선별된 현재형 4형식만 추가했다. 영어 전체를 판정하는 범용 작문·번역 엔진이 아니다. 어휘 Band는 게임용 큐레이션이며 공식 CEFR/빈도 등급이 아니다.

## 데이터와 버전별 범위

- 현재 Lexeme 119개, 실행 가능한 Lexeme 118개, 형태 250개, 선택 가능한 형태 188개, 내부 Frame 6개다. `recently`는 계속 비활성이고 덱·보상 가중치가 0이다.
- 기존 116개 Lexeme와 Card/Form/Sense ID를 유지한다. `send`(UNCOMMON), `for`(COMMON)를 추가했다. 필수 사례의 `The book gives the dog a picture`를 개별 카드로 검증하기 위해 최소 명사 `picture`(COMMON)도 추가했다. 세 신규 카드는 모두 starterEligible=false여서 기존 28장 시작 덱 후보·품사 분포를 바꾸지 않는다.
- 현재 활성 카드 후보는 COMMON 105, UNCOMMON 11, RARE 2개다. 기존 give/show/make/to 등의 등급과 현재형은 보존한다. 등급·어휘 Band를 문법 점수나 의미 정오에 사용하지 않는다.
- 내부 Frame은 SV, SVC_ADJ, SVC_NP, SVO, beLocative, SVOO다. 위치 표현을 가진 beLocative는 기존대로 학교 문법 SV로 정규화한다.
- 기본 `registry`는 새 0.2 원정과 샌드박스 범위다. `registryForVersion('0.1.0' | '0.1.1')`은 동결된 `legacyRegistry`를 반환한다. 레거시 view는 기존 116개 Lexeme/243개 형태/5개 Frame과 후보 순서를 유지하며 send/for/picture와 활성 SVOO binding을 포함하지 않는다. 로드만으로 문법 범위나 미생성 보상 후보가 확장되지 않는다.
- `read`처럼 현재/과거 철자가 같은 형태는 기존 formId 정책에 따라 정상 현재형 분석을 유지한다. 과거 형태 ID만으로 미지원 시제를 활성화하지 않는다.

## 실제 파싱

`parser.js`는 등록 형태 확인 → NP/AP/AdvP/PP 합성 → Sense의 FrameBinding 대조 → 일치·격·관사 진단 → 전체 입력 소비 확인 → 대표 분석 정규화 순서로 실행한다. 정답 문자열 사전, AI/API, 카드 순열 탐색, 없는 단어 삽입, 입력 순서 교정을 사용하지 않는다.

기존 명사구·수식 규칙을 사용한다. 명사구는 한정사/소유한정사, 명사·대명사, 명사 앞 형용사와 정도 수식, 제한된 후치 PP를 포함한다. `very carefully`, `very quickly`, `very well` 같은 AdvP도 실제 카드별로 분석한다. `I very like dogs`의 잘못 쓰인 very는 기존대로 카드·수식·룬 기여에서 제외한다.

4형식은 `NP(S) + 현재 유한동사 + NP(IO) + NP(DO) + 허용 부사어`다. give/show/make/send 네 동사의 기본 Sense에만 SVOO binding을 활성화했다. IO/DO는 한 단어로 제한하지 않으며 `my friend`, `a very good book`도 실제 NP로 처리한다. 전체 NP 카드 범위는 `clauses[].indirectObjectNodeId/directObjectNodeId`와 해당 node에 있고, 각 head의 역할은 `INDIRECT_OBJECT`/`DIRECT_OBJECT`다. 기존 SVO의 `OBJECT`는 유지한다.

`give/show/send + DO + to + NP`, `make + DO + for + NP`는 학교 문법 SVO다. 등록된 대응 표현은 `structures[].kind === 'DATIVE_ALTERNATION'`의 비점수 metadata로 표현한다. PP Hit는 한 번만 출력한다. `give ... for ...` 같은 다른 정상 PP 용법은 전역 오류로 만들지 않으며, 등록된 TO 대응 표현이라는 metadata만 부여하지 않는다.

정상 전체 입력 분석이 우선이고, 정상 후보가 없을 때만 일치·관사·격 등 기존 작은 오류를 복구한다. SVOO 뼈대가 유지된 부분감점 문장도 `FRAME.SVOO`를 가진다. 생물/무생물이나 자연스러움은 정오 조건이 아니다. 두 번째 NP 뒤에 남은 명사구를 무시해 성공시키지 않는다.

## 미지원 범위와 한도

- make+목적어+형용사/원형 같은 5형식, to+동사의 부정사, 관계절, 과거·진행·완료·수동·부정·의문문은 계속 `UNSUPPORTED`다. read/take/keep/find/play의 예약 SVOO도 실행하지 않는다.
- 지원 기본 구조의 주어/동사/필수 목적어·보어/어순 실패는 `INVALID_CORE`다. 조작 surface/form ID, 미등록 카드 참조, 중복 물리 ID, 내부 예외는 `ENGINE_ERROR`다.
- 최대 16카드, 후보 128개, 구조 재귀 깊이 4, 작업량 12,000을 유지한다. 한도 초과는 제한명을 포함한 `UNSUPPORTED`다.
- 동일 surface 대명사는 등록 형태 후보를 다시 확인한다. 메뉴의 her 선택이 정상 목적격·소유한정사 분석을 강제 오답으로 만들지 않는다.
- school은 at/in/to의 학교 활동 용법, home은 at home 및 go/come/be home만 허용한다. 무관한 목적어 용법에 관사 생략을 일반화하지 않는다.
- Grammar는 룬·가격·지역·HP·한글 템플릿을 읽지 않는다. Node/Hit/역할/진단은 실제 `cardInstanceId`에 연결된다.

## 점수와 의미 참고

SVOO Hit는 한 번 출력하고 Scoring이 기본 ×2를 적용한다. SVO+to/for는 기존 ×1.5와 유효 PP +10만 받으며 대응 metadata의 가산은 없다. 토파즈는 주절 SVOO에 Lv1 ×1.5/Lv2 ×2/Lv3 ×2.5로 공격당 한 번 적용한다. 후보는 현재 원정의 실제 해금에 따르며 기존 열 종류 룬은 유지한다. 지역과 장막은 Stage 엔진이 담당한다.

`meaningPreview`는 기존 분석과 선택 형태를 읽는 별도 의미 참고다. 명확한 SVOO는 `S는 IO에게 DO를 준다/보여준다/보낸다/만들어 준다`를 구성한다. 소유한정사는 선택된 surface/역할을 따라 `my friend → 나의 친구`로 표시한다. PP·긴 수식·템플릿 누락·부분오류 SVOO는 성분별 gloss로 돌아간다. 오류를 조용히 교정한 완전한 뜻처럼 표시하지 않으며 뜻 참고 실패는 문법·점수·공격에 영향을 주지 않는다. 기존 기록과 한글 참고도 보존한다.

## 공개 API와 검증

`src/data/language/index.js`: `registry`, `legacyRegistry`, `registryForVersion(version)`, `lexemeForCard`, `formsForCard`, `makeToken`, `createSentenceSnapshot(slots, instances, {sentenceId, languageVersion})`. 스냅샷은 명시한 언어 context를 기록하며 실제 판정에 대응 registry를 전달한다.

`src/engine/grammar/index.js`: `analyzeSentence(snapshot, registry?)`, `snapshotFromSlots`, 개발 fixture용 `snapshotFromText`. 실제 전투 입력은 개별 카드와 형태 ID다.

`tests/grammar.test.js`는 기존 fixture/예약 문법 기대값을 레거시 context로 보존하고 현재 활성 어휘·Frame 조합도 검사한다. `tests/language-v0.2.test.js`는 개별 카드 ID의 필수 사례, 다중 카드 IO/DO, 부분오류, 미지원, PP 중복 방지, Stage2 산술 175/262/350/437, 레거시 후보 분리, 토파즈 해금과 의미 fallback을 검사한다. `tests/scoring.test.js`는 기존 열 종류를 포함한 열한 룬의 실제 효과·순서를 검사한다. 실제 명령·환경·전체 회귀·브라우저 결과는 `TEST_REPORT_0.2.md`를 따른다.
