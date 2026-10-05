# 활성 동사 Sense·Frame 검토 (0.2.2)

현재 registry에서 runtimeReady VERB를 기계적으로 열거한 **30개**다. 교사 검수 완료라는 뜻이 아니다. 희귀 용법 전체를 보장하지 않는다. 양성/일치 오류 fixture는 tests/fixtures/verb-audit-cases.js에 독립적으로 작성했으며 전체 목록 일치와 실제 판정을 검사한다. 모든 동사를 SV 또는 SVOO로 일반화하지 않았다.

| 동사 | 주요 뜻 | 현재 제공 형태 | 0.2.1 Frame | 새 Sense | SV | SVC | SVO | SVOO | SVOC | 준동사 연결 | 명사절 | 정상 fixture / 실제 결과 | 형태 fixture / 실제 결과 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| be | 이다 | am/is/are/be | frame.svc.adj, frame.svc.np, frame.beLocative | 유지 | 위치·존재 기본 판정 | 기본 판정 | — | — | — | — | 범위 밖 | They are students → VALID | He are happy → VALID_WITH_ISSUES |
| have | 가지다 | have/has | frame.svo | objectBare | — | — | 기본 판정 | — | 판정만 · 전용 보너스 없음 | 판정만 · 전용 보너스 없음 | 범위 밖 | They have books → VALID | He have books → VALID_WITH_ISSUES |
| do | 하다 | do/does | frame.svo | 유지 | — | — | 기본 판정 | — | — | — | 범위 밖 | They do homework → VALID | He do homework → VALID_WITH_ISSUES |
| go | 가다 | go/goes | frame.sv | 유지 | 기본 판정 | — | — | — | — | — | 범위 밖 | They go home → VALID | He go home → VALID_WITH_ISSUES |
| come | 오다 | come/comes | frame.sv | 유지 | 기본 판정 | — | — | — | — | — | 범위 밖 | They come home → VALID | He come home → VALID_WITH_ISSUES |
| run | 달리다 | run/runs | frame.sv | 유지 | 기본 판정 | — | — | — | — | — | 범위 밖 | They run → VALID | He run → VALID_WITH_ISSUES |
| live | 살다 | live/lives | frame.sv | 유지 | 기본 판정 | — | — | — | — | — | 범위 밖 | They live → VALID | He live → VALID_WITH_ISSUES |
| work | 일하다 | work/works | frame.sv | 유지 | 기본 판정 | — | — | — | — | — | 범위 밖 | They work → VALID | He work → VALID_WITH_ISSUES |
| play | 놀다·경기하다 | play/plays | frame.sv, frame.svo | 유지 | 기본 판정 | — | 기본 판정 | — | — | — | 범위 밖 | They play games → VALID | He play games → VALID_WITH_ISSUES |
| eat | 먹다 | eat/eats | frame.sv, frame.svo | 유지 | 기본 판정 | — | 기본 판정 | — | — | — | 범위 밖 | They eat food → VALID | He eat food → VALID_WITH_ISSUES |
| read | 읽다 | read/reads | frame.sv, frame.svo | 유지 | 기본 판정 | — | 기본 판정 | — | — | — | 범위 밖 | They read books → VALID | He read books → VALID_WITH_ISSUES |
| like | 좋아하다 | like/likes | frame.svo | objectTo, to | — | — | 기본 판정 | — | 판정만 · 전용 보너스 없음 | 판정만 · 전용 보너스 없음 | 범위 밖 | They like books → VALID | He like books → VALID_WITH_ISSUES |
| want | 원하다 | want/wants | frame.svo | objectTo, to | — | — | 기본 판정 | — | 판정만 · 전용 보너스 없음 | 판정만 · 전용 보너스 없음 | 범위 밖 | They want books → VALID | He want books → VALID_WITH_ISSUES |
| need | 필요로 하다 | need/needs | frame.svo | objectTo, to | — | — | 기본 판정 | — | 판정만 · 전용 보너스 없음 | 판정만 · 전용 보너스 없음 | 범위 밖 | They need books → VALID | He need books → VALID_WITH_ISSUES |
| make | 만들다 | make/makes | frame.svo, frame.svoo | objectAdjective, objectNoun, objectBare | — | — | 기본 판정 | 기본 판정 | 판정만 · 전용 보너스 없음 | 판정만 · 전용 보너스 없음 | 범위 밖 | They make games → VALID | He make games → VALID_WITH_ISSUES |
| give | 주다 | give/gives | frame.svo, frame.svoo | 유지 | — | — | 기본 판정 | 기본 판정 | — | — | 범위 밖 | They give me books → VALID | He give me books → VALID_WITH_ISSUES |
| see | 보다 | see/sees | frame.svo | objectBare | — | — | 기본 판정 | — | 판정만 · 전용 보너스 없음 | 판정만 · 전용 보너스 없음 | 범위 밖 | They see the dog → VALID | He see the dog → VALID_WITH_ISSUES |
| help | 돕다 | help/helps | frame.sv, frame.svo | objectTo, objectBare, to, bare | 기본 판정 | — | 기본 판정 | — | 판정만 · 전용 보너스 없음 | 판정만 · 전용 보너스 없음 | 범위 밖 | They help her → VALID | He help her → VALID_WITH_ISSUES |
| feel | ~을 느끼다 | feel/feels | frame.svc.adj | perception, objectBare | — | 기본 판정 | 기본 판정 | — | 판정만 · 전용 보너스 없음 | 판정만 · 전용 보너스 없음 | 범위 밖 | They feel happy → VALID | He feel happy → VALID_WITH_ISSUES |
| become | 되다 | become/becomes | frame.svc.adj, frame.svc.np | 유지 | — | 기본 판정 | — | — | — | — | 범위 밖 | They become students → VALID | He become a student → VALID_WITH_ISSUES |
| look | 보이다 | look/looks | frame.svc.adj | 유지 | — | 기본 판정 | — | — | — | — | 범위 밖 | They look happy → VALID | He look happy → VALID_WITH_ISSUES |
| take | 가지고 가다 | take/takes | frame.svo | 유지 | — | — | 기본 판정 | — | — | — | 범위 밖 | They take books → VALID | He take books → VALID_WITH_ISSUES |
| keep | 유지하다 | keep/keeps | frame.svo | objectAdjective, objectNoun | — | — | 기본 판정 | — | 판정만 · 전용 보너스 없음 | — | 범위 밖 | They keep books → VALID | He keep books → VALID_WITH_ISSUES |
| find | 찾다 | find/finds | frame.svo | objectAdjective, objectNoun | — | — | 기본 판정 | — | 판정만 · 전용 보너스 없음 | — | 범위 밖 | They find books → VALID | He find books → VALID_WITH_ISSUES |
| show | 보여 주다 | show/shows | frame.svo, frame.svoo | 유지 | — | — | 기본 판정 | 기본 판정 | — | — | 범위 밖 | They show me books → VALID | He show me books → VALID_WITH_ISSUES |
| create | 창조하다 | create/creates | frame.svo | 유지 | — | — | 기본 판정 | — | — | — | 범위 밖 | They create games → VALID | He create games → VALID_WITH_ISSUES |
| improve | 나아지다·개선하다 | improve/improves | frame.sv, frame.svo | 유지 | 기본 판정 | — | 기본 판정 | — | — | — | 범위 밖 | They improve → VALID | He improve → VALID_WITH_ISSUES |
| develop | 발전하다, 발달하다 / ~을 개발하다, 발전시키다 | develop/develops | frame.svo | growth | 기본 판정 | — | 기본 판정 | — | — | — | 범위 밖 | They develop → VALID | He develop → VALID_WITH_ISSUES |
| change | 변하다·바꾸다 | change/changes | frame.sv, frame.svo | 유지 | 기본 판정 | — | 기본 판정 | — | — | — | 범위 밖 | They change → VALID | He change → VALID_WITH_ISSUES |
| send | 보내다 | send/sends | frame.svo, frame.svoo | 유지 | — | — | 기본 판정 | 기본 판정 | — | — | 범위 밖 | They send me books → VALID | He send me books → VALID_WITH_ISSUES |

각 동사의 비주어 위치 '동사 books books books'는 정상으로 인정하지 않는 음성 fixture도 실행한다. 필수 성분 누락은 give/want/like/be, 잘못된 추가 목적어는 like, 잘못된 to 삽입은 see/make로 별도 검사한다. SV용 동사에 목적어가 없어도 정상인 것은 누락 오류로 만들지 않는다.

## 변경 근거와 한계

- develop의 발전/발달 SV Sense와 개발 SVO를 분리했다. [Cambridge develop](https://dictionary.cambridge.org/dictionary/english/develop). 직접 페이지 요청은 403이었고 검색 색인과 사용자 명세의 I/T 근거를 확인했다. 사전 전문을 읽었다고 주장하지 않는다.
- want/need/like의 to 및 object+to, help의 (object)+(to) 원형, make/see/feel/have의 object+원형은 [Cambridge verb patterns](https://dictionary.cambridge.org/uk/grammar/british-grammar/verb-patterns-verb-infinitive-or-verb-ing), [want](https://dictionary.cambridge.org/grammar/british-grammar/want), [help](https://dictionary.cambridge.org/grammar/british-grammar/help-somebody-to-do)를 근거로 등록했다. [have 사역](https://dictionary.cambridge.org/grammar/british-grammar/have-something-done)은 기존 보유 Sense와 기본 원형 연결을 별도 구조로 탐색한다.
- make/find/keep의 목적격보어는 [Cambridge Unit 28](https://www.cambridgeenglish.org/fr/Images/682580-advanced-grammar-in-use-4-sample.pdf), feel의 목적어 용법은 [Oxford feel](https://www.oxfordlearnersdictionaries.com/definition/english/feel_1)을 확인했다. 형태·품사에 의한 구조 분석이며 명사의 의미 자연스러움으로 점수를 바꾸지 않는다.
- 일반 자동/타동 경계는 [Cambridge transitive verbs](https://dictionary.cambridge.org/grammar/british-grammar/transitive-verbs), IO/DO는 [Objects](https://dictionary.cambridge.org/uk/grammar/british-grammar/objects), 관계사 생략은 [British Council defining relatives](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/relative-clauses-defining-relative-clauses)를 참조했다.
- 'clean' 카드가 없으므로 필수 keep+O+AP fixture는 'I keep the room safe'로 대체했다. 새 카드를 추가하지 않았다. interesting은 기존 카드다.
- make + NP + NP는 SVOO와 SVOC가 중의적일 수 있다. 오류 수가 적은 전체 분석 → 고정 school Frame 순서(기존 SVOO가 SVOC.NP보다 앞) → Sense ID 순으로 하나만 채택한다. 해금/룬/등록 순서를 우선순위에 넣지 않는다. 'She makes me a game'은 기존 SVOO, find+NP+NP는 등록된 SVOC로 분석한다.
- be 장소 PP는 이번 사용자 학교 문형 정책에서 위치·존재 SV다. 다른 문법 체계의 PP 보어 분석을 부정하지 않는다. 'I am'만으로 SV를 만들지 않는다.
- 현재형/16카드/작업량 12,000/후보 128/구조 깊이 4 안의 기본 판정이다. 제한된 that 관계절(관계절 내 중첩 깊이 2)과 목적격 생략을 지원한다. 명사절·과거/완료/수동/의문문·예약된 희귀 SVOO 등은 이번 활성 범위 밖이다. 기술적 분석 한도는 무료 복구 경로이며 정상 성공/학생 오답으로 기록하지 않는다.
- 기본 판정 전용 구조 자체의 배수·룬·Pack을 새로 열지 않는다. 입증된 주절 SVO와 일반 수식만 기존 자격대로 점수화한다. 토파즈는 활성 SVOO 콤보 증거가 있어야 한다.

0.1.0/0.1.1/0.2.0/0.2.1 registry view를 보존했다. 새 Frame은 현재 view에만 들어가며 카드/형태/가격/등급/보상 가중치는 동일하다. 초기 덱 생성은 0.2.1 Frame 후보를 사용한다.
