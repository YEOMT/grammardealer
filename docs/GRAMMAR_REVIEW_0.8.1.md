# 0.8.1 문법·DB·교육 감사

이 표는 현재 지원 범위의 실행 기록이다. 모든 영어 문장이나 무한한 카드 조합을 검사한 결과가 아니다. 기대 JSON은 production 정답 표로 사용하지 않았다.

## 수정 전후와 판단 범위

| 사례 | 수정 전 독립 실행 | 수정 후 / 판단 | 원인과 근거 |
|---|---|---|---|
| they environments that will be thinking knew live | VALID, 주격+목적격 근거 및 인장 해제 | INVALID_CORE, 문형·콤보·인장 없음 | 인칭대명사 they에 생략 목적격 관계절을 붙인 잘못된 분석. 텍스트와 이전 0.8 production 학습 기록의 실제 카드/형태 snapshot을 각각 재현했다. |
| I you know run. ↔ The people you know run. | 전자가 허위 정상으로 성립 | 전자 INVALID_CORE / 후자 VALID | 생략 목적격 관계절의 선행사 제약. 명사 선행사의 정상 경로는 보존한다. |
| they that were living environments will know think | 자동 원정의 수정 중 엔진 VALID | INVALID_CORE, 두 관계절 해제 근거 없음 | NP 위치의 비정형 절을 등록 명사 어휘처럼 관계절 선행사로 승격한 경로. 정상 동명사와 내부 명사 관계절은 유지한다. |
| I need more help. | INVALID_CORE | VALID, OBJECT 명사 ‘도움’ | 기존 동사 카드의 기본형에 검수된 MASS 명사 용법을 연결했다. QUANTIFIER_MORE는 비교 콤보가 아니다. |
| I help you. | VALID / frame.svo | 동일 판정·점수 | 기존 동사 형태와 Frame을 보존한다. |
| I need a help. | 명사 용법 없음 | VALID_WITH_ISSUES, ARTICLE_COUNTABILITY_MISMATCH | 기존 가산성 경고 정책을 사용하며 임의 0피해 정책을 추가하지 않는다. |
| I need more helps/helped. | 명사 용법 없음 | INVALID_CORE | 동사 활용형을 일괄 명사화하지 않는다. |
| Helping you is good. / I am helping you. / I have helped you. | 기존 지원 | VALID 유지 | 동명사·진행·완료와 명사 help 용법은 구별한다. |
| She is more than the problem. | INVALID_CORE, 비교 hit 없음 | 그대로 유지 | 현재 비교 parser가 지원하는 형용사/부사 정도 비교와 다른 nominal more-than-NP 범위. 엔진 거부를 영어 자체의 비문 판정으로 확대하지 않으며 의미 해석의 정오는 미확정이다. 새 통과 예외를 넣지 않았다. |

reported-relative-snapshot.json에는 실제 제출의 they.subject / environment.plural / that.base / will.base / be.base / think.ing / know.past / live.present와 물리 ID가 남아 있다. 당시 seed의 전체 원정을 동일 UI로 다시 만들었다는 주장이 아니라, 당시 저장된 **제출 snapshot의 독립 재분석**이다. 별도 지정 Controller 검사는 현재 제출의 카드·턴 소모, 0 HP 피해, 인장 유지와 중복 FINISH 무변화를 확인한다.

이전 0.8에서 이미 정산한 잘못된 인장 영수증도 저장으로 남을 수 있다. 당시 판정 재생은 인장 및 잿불룡 비늘 해제 영수증 검증에만 사용한다. 신규 0.8.1 영수증은 patch marker 필수이며 marker 삭제로 과거 parser를 선택할 수 없다. 기존 피해/보상을 취소하거나 다시 지급하지 않는다.

## 실제 회귀 범위

수정 전에 독립 포착한 306개 물리 snapshot의 status/mainFrameId/grammarHits/issue code/consumedCardIds를 수정 후 대조했다. 변경 0건이며 신고 문장은 이 보존 목록과 분리한 교정 대상이다.

| 이전 기대 사례 파일 | 이번 동일 입력 재검사 수 |
|---|---:|
| `v08/03_Grammar_Cases_0.8.json` | 88 |
| `v07/04_Grammar_Cases_0.7.json` | 73 |
| `v061-03_Grammar_Cases_0.6.1.json` | 45 |
| `v06-04_grammar_cases_0.6.json` | 32 |
| `v04-grammar-expectations.json` | 68 |

기본 문형·동사 Sense/Frame, 관사/수량/일치, 시제/복합 동사구, 비정형/수동/5형식, 접속사, 비교, 관계절/WH 및 콤보·보스 검증은 기존 전체 단위 테스트와 위 입력을 함께 사용한다. 21개 Frame을 각각 모든 조합으로 생성했다는 뜻은 아니다. 새 최소 대조 6쌍과 비정형 절/등록 명사 선행사 대조에는 관계절 자체 오류·남는 토큰·중첩·주격/목적격 역할·관계부사 완결성을 포함한다. 별개 관계절 둘은 허용하고 동일 노드 재사용은 해제 근거로 인정하지 않는다.

## 현재 DB 인벤토리와 추가 실행

143개의 물리 WORD 정의, 144 lexeme(활성143), 364 form(활성363), 186 sense, 21 frame. 새 물리 카드는 없고 help에만 보조 lexeme 한 개가 추가됐다. 모든 활성 lexeme의 연결 card/form/sense/frame을 목록화했다. 추가 기본 명사·형용사·동사/과거·분사 probe 156개에서 153 VALID, 3 VALID_WITH_ISSUES, ENGINE_ERROR 0이었다. 세 경고는 자동 probe의 `a answer / a idea / a environment` 관사 선택 오류이며 게임 버그로 분류하지 않는다. 아래 ‘probe 없음’은 이 추가 probe만 없다는 뜻이며 기존 전체 테스트 결과와 혼동하지 않는다.

| 어휘 / 주·보조 품사 | 실제 형태 ID 수 | Sense→Frame 등록 수 | 이번 추가 probe |
|---|---:|---:|---|
| be / VERB | 8 | 3 | 0 · 추가 probe 없음 |
| have / VERB | 5 | 4 | 3 · VALID |
| do / VERB | 5 | 1 | 3 · VALID |
| go / VERB | 5 | 1 | 3 · VALID |
| come / VERB | 5 | 1 | 3 · VALID |
| run / VERB | 5 | 1 | 3 · VALID |
| live / VERB | 5 | 1 | 3 · VALID |
| work / VERB | 5 | 1 | 3 · VALID |
| play / VERB | 5 | 2 | 3 · VALID |
| eat / VERB | 5 | 2 | 3 · VALID |
| read / VERB | 5 | 2 | 3 · VALID |
| like / VERB | 5 | 5 | 3 · VALID |
| want / VERB | 5 | 4 | 3 · VALID |
| need / VERB | 5 | 5 | 3 · VALID |
| make / VERB | 5 | 5 | 3 · VALID |
| give / VERB | 5 | 2 | 3 · VALID |
| see / VERB | 5 | 5 | 3 · VALID |
| help / VERB | 5 | 6 | 3 · VALID |
| feel / VERB | 5 | 4 | 3 · VALID |
| become / VERB | 5 | 2 | 0 · 추가 probe 없음 |
| look / VERB | 5 | 1 | 0 · 추가 probe 없음 |
| take / VERB | 5 | 1 | 3 · VALID |
| keep / VERB | 5 | 6 | 3 · VALID |
| find / VERB | 5 | 5 | 3 · VALID |
| show / VERB | 5 | 4 | 3 · VALID |
| create / VERB | 5 | 1 | 3 · VALID |
| improve / VERB | 5 | 2 | 3 · VALID |
| develop / VERB | 5 | 2 | 3 · VALID |
| change / VERB | 5 | 2 | 3 · VALID |
| friend / NOUN | 2 | 0 | 1 · VALID |
| teacher / NOUN | 2 | 0 | 1 · VALID |
| student / NOUN | 2 | 0 | 1 · VALID |
| child / NOUN | 2 | 0 | 1 · VALID |
| dog / NOUN | 2 | 0 | 1 · VALID |
| cat / NOUN | 2 | 0 | 1 · VALID |
| book / NOUN | 2 | 0 | 1 · VALID |
| school / NOUN | 2 | 0 | 1 · VALID |
| home / NOUN | 2 | 0 | 1 · VALID |
| room / NOUN | 2 | 0 | 1 · VALID |
| park / NOUN | 2 | 0 | 1 · VALID |
| game / NOUN | 2 | 0 | 1 · VALID |
| music / NOUN | 1 | 0 | 1 · VALID |
| food / NOUN | 2 | 0 | 1 · VALID |
| water / NOUN | 1 | 0 | 1 · VALID |
| day / NOUN | 2 | 0 | 1 · VALID |
| person / NOUN | 2 | 0 | 1 · VALID |
| question / NOUN | 2 | 0 | 1 · VALID |
| answer / NOUN | 2 | 0 | 1 · VALID_WITH_ISSUES |
| problem / NOUN | 2 | 0 | 1 · VALID |
| idea / NOUN | 2 | 0 | 1 · VALID_WITH_ISSUES |
| plan / NOUN | 2 | 0 | 1 · VALID |
| story / NOUN | 2 | 0 | 1 · VALID |
| time / NOUN | 2 | 0 | 1 · VALID |
| homework / NOUN | 1 | 0 | 1 · VALID |
| information / NOUN | 1 | 0 | 1 · VALID |
| knowledge / NOUN | 1 | 0 | 1 · VALID |
| decision / NOUN | 2 | 0 | 1 · VALID |
| culture / NOUN | 2 | 0 | 1 · VALID |
| technology / NOUN | 2 | 0 | 1 · VALID |
| environment / NOUN | 2 | 0 | 1 · VALID_WITH_ISSUES |
| good / ADJECTIVE | 3 | 0 | 1 · VALID |
| bad / ADJECTIVE | 3 | 0 | 1 · VALID |
| big / ADJECTIVE | 3 | 0 | 1 · VALID |
| small / ADJECTIVE | 3 | 0 | 1 · VALID |
| happy / ADJECTIVE | 3 | 0 | 1 · VALID |
| sad / ADJECTIVE | 3 | 0 | 1 · VALID |
| kind / ADJECTIVE | 3 | 0 | 1 · VALID |
| young / ADJECTIVE | 3 | 0 | 1 · VALID |
| old / ADJECTIVE | 3 | 0 | 1 · VALID |
| new / ADJECTIVE | 3 | 0 | 1 · VALID |
| easy / ADJECTIVE | 3 | 0 | 1 · VALID |
| hard / ADJECTIVE | 3 | 0 | 1 · VALID |
| tired / ADJECTIVE | 1 | 0 | 1 · VALID |
| interesting / ADJECTIVE | 1 | 0 | 1 · VALID |
| difficult / ADJECTIVE | 1 | 0 | 1 · VALID |
| beautiful / ADJECTIVE | 1 | 0 | 1 · VALID |
| ready / ADJECTIVE | 1 | 0 | 1 · VALID |
| useful / ADJECTIVE | 1 | 0 | 1 · VALID |
| safe / ADJECTIVE | 3 | 0 | 1 · VALID |
| strong / ADJECTIVE | 3 | 0 | 1 · VALID |
| important / ADJECTIVE | 1 | 0 | 1 · VALID |
| necessary / ADJECTIVE | 1 | 0 | 1 · VALID |
| possible / ADJECTIVE | 1 | 0 | 1 · VALID |
| different / ADJECTIVE | 1 | 0 | 1 · VALID |
| clear / ADJECTIVE | 3 | 0 | 1 · VALID |
| serious / ADJECTIVE | 1 | 0 | 1 · VALID |
| very / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| really / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| often / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| always / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| sometimes / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| well / ADVERB | 3 | 0 | 0 · 추가 probe 없음 |
| today / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| usually / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| quickly / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| slowly / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| carefully / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| now / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| clearly / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| I / PRONOUN | 3 | 0 | 0 · 추가 probe 없음 |
| you / PRONOUN | 3 | 0 | 0 · 추가 probe 없음 |
| he / PRONOUN | 3 | 0 | 0 · 추가 probe 없음 |
| she / PRONOUN | 3 | 0 | 0 · 추가 probe 없음 |
| it / PRONOUN | 3 | 0 | 0 · 추가 probe 없음 |
| we / PRONOUN | 3 | 0 | 0 · 추가 probe 없음 |
| they / PRONOUN | 3 | 0 | 0 · 추가 probe 없음 |
| a / DETERMINER | 2 | 0 | 0 · 추가 probe 없음 |
| the / DETERMINER | 1 | 0 | 0 · 추가 probe 없음 |
| this / DETERMINER | 1 | 0 | 0 · 추가 probe 없음 |
| in / PREPOSITION | 1 | 0 | 0 · 추가 probe 없음 |
| on / PREPOSITION | 1 | 0 | 0 · 추가 probe 없음 |
| at / PREPOSITION | 1 | 0 | 0 · 추가 probe 없음 |
| with / PREPOSITION | 1 | 0 | 0 · 추가 probe 없음 |
| to / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| that / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| fast / ADVERB | 3 | 0 | 0 · 추가 probe 없음 |
| send / VERB | 5 | 2 | 3 · VALID |
| for / PREPOSITION | 1 | 0 | 0 · 추가 probe 없음 |
| picture / NOUN | 2 | 0 | 1 · VALID |
| will / VERB | 1 | 0 | 0 · 추가 probe 없음 |
| and / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| but / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| or / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| because / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| when / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| if / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| think / VERB | 5 | 2 | 3 · VALID |
| know / VERB | 5 | 4 | 3 · VALID |
| say / VERB | 5 | 3 | 3 · VALID |
| enjoy / VERB | 5 | 2 | 3 · VALID |
| finish / VERB | 5 | 2 | 3 · VALID |
| hobby / NOUN | 2 | 0 | 1 · VALID |
| than / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| as / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| more / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| most / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| too / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| enough / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| twice / ADVERB | 1 | 0 | 0 · 추가 probe 없음 |
| who / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| which / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| where / FUNCTION | 1 | 0 | 0 · 추가 probe 없음 |
| help / NOUN (보조) | 1 | 0 | 1 · VALID |

## 교육 문구 검토

| 범위 | 검토 내용 | 근거 |
|---|---|---|
| Stage1~8 총37개 | 고정 주제/형태/한 줄 설명과 지역 보너스 분리 | battleLearningGuide의 고정 데이터, 실제 stage.regionMultiplier 비교 단위 검사와 3브라우저 전 라운드 렌더 |
| Stage5-1 | to부정사의 명사적 용법, to + 원형 | 기존 parser 지원 범위 |
| Stage5-2 | 명사 수식과 행동 목적을 별도로 설명 | I have a book to read. / I went to the park to read. 실제 parser VALID, 상세 UI 검사 |
| Stage5-3/4 | 동명사와 S+V+O+C | 기존 하나의 ING 형태 및 개별 Frame 유지 |
| 시간 도감 | 과거시제 / 진행형 / 완료형 | 세 제목만 갱신, 기존 예문/카탈로그 나머지 값 보존 검사 |
| help | 동사 돕다 / 불가산명사 도움, 실제 선택은 제출 후 | 사전/상세/공격 기록과 실제 명사·동사 제출 |
| 운영·빙정·방해 | 긴 효과는 터치 상세, 실제 수명/예외 유지 | 운영 +1 보급/직접탐색은 재사용 규칙 때문에 ‘전투당1회’ 대신 정확한 한 줄 표시 |
| 보스 | 특징/행동/처치 세 줄, 예외는 기존 상세 | 사슴5핵·양수 피해·실제8빙정·영구/지원 제외·HP1 경계 회귀 |

편집 중 현재 카드의 정답·점수·성공 콤보는 평가하지 않는다. 명세에 없는 새 비교 예외, 사슴 정답 추천이나 핵 대상 ◆ 표시는 추가하지 않았다. 사람 대상 학습 효과와 다른 시드 전체의 난이도 평가는 NOT RUN이다.


추가 감사에서 발견한 비정형 절의 외부 관계절 결합은 현재 카드 DB에 등록된 명사 어휘를 임의 생성하지 않는 범위로 제한했다. 이 엔진의 지원 실패를 모든 영어 동명사 명사화의 불가능 주장으로 해석하지 않는다. `Living is good.`, `Living in the room I like is good.`, `The people that were living in rooms I know think.`, `The help I need is good.`는 실제 VALID이며, help의 주어/보어/직접목적어/전치사목적어/관계절 선행사 역할도 별도 검사했다.
