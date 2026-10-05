# 0.3 교육 문구 검토

고정 설명은 src/data/grammarGuideData.js에서 관리한다. 아래 문구를 코드와 대조했고 내부 예문은 실제 Parser 회귀에서 사용한다. 학생 도감의 고정 예문 영역은 제거했다. 번역은 단어 사전에만 남기며 실제 문장·성분의 번역과 내부 상태 이름을 도감에 표시하지 않는다.

| 식별 | 표시 설명 | 검토 |
|---|---|---|
| TIME.PAST | 유한 동사의 과거형은 과거의 상황을 나타냅니다. 과거분사만으로 과거절이 되지는 않습니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| TIME.PROGRESSIVE | be + -ing는 해당 시간에 진행 중인 행동을 나타냅니다. 주어와 시간에 맞는 첫 동사 형태를 고릅니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| TIME.PERFECT | have + 과거분사는 기준 시점 이전의 행동과 그 시점의 관계를 나타냅니다. has/have는 현재, had는 과거가 기준입니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| TIME.FUTURE_WILL | will 뒤에는 동사 원형이 옵니다. will은 미래의 예상이나 의지 등을 나타낼 수 있습니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| FRAME.SV | 주어와 동사를 중심으로 이루어지며 목적어와 보어가 없는 문장입니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| FRAME.SVC | 보어가 주어의 상태나 정체를 설명합니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| FRAME.SVO | 목적어가 동사가 나타내는 행동이나 관계의 대상을 나타냅니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| FRAME.SVOO | 간접목적어는 보통 받는 대상이나 수혜자를, 직접목적어는 전달하거나 제공하는 대상을 나타냅니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| MODIFIER.ADJECTIVE | 형용사는 명사 앞에서 명사를 수식할 수 있습니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| MODIFIER.ADVERB | 부사는 허용된 위치에서 동사·형용사·부사를 수식합니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| PHRASE.PP | 전치사와 명사구가 함께 쓰여 위치나 대상 등의 관계를 나타냅니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| SUBJECT | 문장에서 말하는 대상을 나타냅니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| FINITE_VERB | 주어의 행동이나 상태를 나타냅니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| OBJECT | 동사가 나타내는 행동이나 관계의 대상을 나타냅니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| INDIRECT_OBJECT | 주거나 보여주거나 만들어 주는 행동에서 보통 받는 대상이나 수혜자를 나타냅니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| DIRECT_OBJECT | 그 행동에서 직접 전달하거나 제공하는 대상입니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| COMPLEMENT | 주어나 목적어가 어떤 상태인지 또는 무엇인지를 설명합니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| PP_OBJECT | 전치사와 함께 관계를 나타내는 명사구입니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| DATIVE | give/show/send는 to, make는 for를 사용한 대표 대응 표현도 만들 수 있습니다. 이때 to/for 뒤의 명사구는 전치사의 목적어입니다. | 코드 대조 완료 · 교사 검수 NOT RUN |
| LOCATION | 이 게임의 학교 문형 표기에서 be와 장소 표현은 위치·존재를 나타내는 1형식으로 표시합니다. | 코드 대조 완료 · 교사 검수 NOT RUN |

현재완료는 단순히 ‘완료했다’와 동일시하지 않고 기준 시점과의 관계로 설명한다. 진행은 be+-ing, 완료는 have+p.p., 미래는 will+원형이며 주절·관계절의 유한 동사구와 비정형 to절을 구분한다. 역할 범위는 분석의 실제 카드 ID로 구성한다.

과거 technology 교육 기록은 최신 언어로 읽기 전용 재검토한다. tests/v03-audit.test.js에서 상태 재분류·반복 멱등성과 이전 위력/누적 피해/문법 집계 보존을 검사했다. 구버전 원정의 실행 언어와 교육용 보기의 최신 해석을 혼동하지 않는다.

실제 교사 수업·학생 이해도·번역 자연스러움 전문가 검수는 NOT RUN. [동사구 설명 근거](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/verb-phrases).

시간 역할 레이블도 고정 데이터 TIME_ROLE_LABELS에서 읽는다: PAST=과거 계열, PRESENT=현재 계열, FUTURE=미래 계열, PROGRESSIVE=진행, PERFECT=완료, WILL=will 미래. 내부 식별자는 학생에게 표시하지 않으며 실제 분석이 제공한 동사구에만 붙인다.
