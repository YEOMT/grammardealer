# 교육 문구 검토표

검수 가능한 고정 초안이다. 자동 fixture 검사를 교사 검수로 부르지 않는다. 데이터 원본은 src/data/grammarGuideData.js, 사전 어휘는 versioned registry다. 런타임 AI/번역 API 없음.

| 항목 | 고정 문구 | 고정 예문 | 실제 현재 파서 |
|---|---|---|---|
| FRAME.SV | 주어와 동사를 중심으로 이루어지며 목적어와 보어가 없는 문장입니다. | I run. | VALID / frame.sv |
| FRAME.SVC | 보어가 주어의 상태나 정체를 설명합니다. | I am happy. / I am a student. | VALID / frame.svc.adj; VALID / frame.svc.np |
| FRAME.SVO | 목적어가 동사가 나타내는 행동이나 관계의 대상을 나타냅니다. | I like books. | VALID / frame.svo |
| FRAME.SVOO | 간접목적어는 보통 받는 대상이나 수혜자를, 직접목적어는 전달하거나 제공하는 대상을 나타냅니다. | She gives me a book. | VALID / frame.svoo |
| MODIFIER.ADJECTIVE | 형용사는 명사 앞에서 명사를 수식할 수 있습니다. | I like the big dog. | VALID / frame.svo |
| MODIFIER.ADVERB | 부사는 허용된 위치에서 동사·형용사·부사를 수식합니다. | He runs very fast. | VALID / frame.sv |
| PHRASE.PP | 전치사와 명사구가 함께 쓰여 위치나 대상 등의 관계를 나타냅니다. | I am at school. | VALID / frame.sv |
| LOCATION | 이 게임의 학교 문형 표기에서 be와 장소 표현은 위치·존재를 나타내는 1형식으로 표시합니다. | I am at school. / He is in the room. | VALID / frame.sv; VALID / frame.sv |
| DATIVE | give/show/send는 to, make는 for를 사용한 대표 대응 표현도 만들 수 있습니다. 이때 to/for 뒤의 명사구는 전치사의 목적어입니다. | She gives a book to me. / She makes a game for me. | VALID / frame.svo; VALID / frame.svo |

| 역할 | 고정 설명 |
|---|---|
| 주어 S | 문장에서 말하는 대상을 나타냅니다. |
| 동사 V | 주어의 행동이나 상태를 나타냅니다. |
| 목적어 O | 동사가 나타내는 행동이나 관계의 대상을 나타냅니다. |
| 간접목적어 IO | 주거나 보여주거나 만들어 주는 행동에서 보통 받는 대상이나 수혜자를 나타냅니다. |
| 직접목적어 DO | 그 행동에서 직접 전달하거나 제공하는 대상입니다. |
| 보어 C | 주어나 목적어가 어떤 상태인지 또는 무엇인지를 설명합니다. |
| 전치사의 목적어 | 전치사와 함께 관계를 나타내는 명사구입니다. |

| 대명사 | 주격 | 목적격 | 소유 한정형 |
|---|---|---|---|
| I | 나(주어) | 나를/나에게 | 나의 |
| you | 너/여러분(주어) | 너를/너에게·여러분을/여러분에게 | 너의/여러분의 |
| he | 그(주어) | 그를/그에게 | 그의 |
| she | 그녀(주어) | 그녀를/그녀에게 | 그녀의 |
| it | 그것(주어) | 그것을/그것에게 | 그것의 |
| we | 우리(주어) | 우리를/우리에게 | 우리의 |
| they | 그들/그것들(주어) | 그들을/그들에게 | 그들의 |

학생 화면에는 위 내부 ID/판정 상태 열을 표시하지 않는다. IO=my friend, DO=a book 전체 범위, to me의 PP 목적어를 실제 node로 읽는다. IO=사람/DO=사물이라는 절대 규칙이나 단어의 한국어 조사에 의한 역할 판정은 없다.

실전 문장은 실제 입력을 고치지 않고 표시한다. 고정 예문은 별도 접기 영역에 출처를 표시한다. 완전한 문장 대표는 무오류 결과만 사용하고, 부분 오류·실패는 최근 제출에서 구분한다. 사용 횟수는 문법 누적 집계라고 명시한다.

이전 기록은 원래 집계·문장·점수를 그대로 보관하고 educationalReview 0.2.2를 한 번 덧붙인다. 토큰 증거가 있는 정상 문장만 현재 구조를 재검증하며 문자열만 남은 기록은 불확실한 이전 기록으로 보존한다. 재분배/재채점/해금/RNG 변경 없음.
