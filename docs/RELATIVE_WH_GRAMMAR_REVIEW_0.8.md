# 관계절·WH·교육 문구 검토 0.8

검토 대상은 production parser/registry와 첨부 G001–G049/Q001–Q031/R001–R008이다. JSON은 테스트 입력/기대값에만 사용한다. production에 문장 정답 표를 넣지 않았다. 실제 개별 결과는 `tests/v08-grammar.test.js`와 최종 실행 로그를 따른다.

| 구조 | 실제 판정 경로 | 교육 표시/제약 |
|---|---|---|
| 주격 who/which/that | 선행사 NP를 실제 절의 subject gap에 연결, 해당 유한동사 일치 검사 | 주절의 S/O 위치와 독립; 수동도 주격 |
| 목적격·생략 | 실제 주어와 동사 Frame의 목적어 공백 | 생략 표시는 작은 라벨, 가상 that 카드 없음 |
| 전치사 목적격 | fronted which 또는 실제 말미 전치사의 목적어 gap | 전치사 카드를 소비, 관계부사와 구분 |
| where/when 관계절 | PLACE/TIME 선행사 + 정상 절 | 목적어 부족을 관계부사로 메우지 않음 |
| 직접 질문 | 실제 WH와 do/be/have/will, 실제 도치 주어와 본동사 | 질문 자체의 새 콤보 없음; 문형·시제는 유지 |
| 간접 질문 | 등록된 know/see/show/say WH Frame + 평서 어순 | that 내용절과 별도 역할, 가짜 LINK 보너스 없음 |
| 의문사 + to | 등록된 WH 보어 안의 실제 to·동사 원형 | 비유한 구조는 보스의 두 유한 관계절로 세지 않음 |
| 오류의 범위 | 관계절 자체 issue IDs를 별도 기록 | 주절의 작은 형태 오류와 정상 관계절 근거 분리 |

새 FUNCTION WORD는 who/which/where 3종이다. 기존 when·that·do 및 각 단어의 실제 form ID를 재사용한다. 새 질문 카드를 늘리거나 자동 동사를 삽입하지 않는다. 신규 학교 문형은 `frame.svo.wh`와 `frame.svoo.wh`이며 기존 언어 view를 복제한 0.8 registry에만 추가한다.

선행사 분류는 고정 어휘 데이터다. PERSON(friend/teacher/student/child/person/man/woman/boy/girl), ANIMAL(dog/cat), PLACE(school/home/room/park/environment), TIME(day/time/year/morning/night), 나머지 THING을 코드와 대조했다. who의 동물 용법과 어휘 분류는 이번 계약의 범위이며 모든 영어 문맥을 일반화한 NLP 판단이 아니다.

현재 registry의 실제 명사 33종을 모두 대조한 결과는 다음과 같다. 코드의 분류 후보 집합에만 있는 man/woman/boy/girl/year/morning/night는 현재 카드로 추가하지 않았다.

| 실제 활성 분류 | 수 | lemma |
|---|---:|---|
| PERSON | 5 | friend, teacher, student, child, person |
| ANIMAL | 2 | dog, cat |
| PLACE | 5 | school, home, room, park, environment |
| TIME | 2 | day, time |
| THING | 19 | book, game, music, food, water, question, answer, problem, idea, plan, story, homework, information, knowledge, decision, culture, technology, picture, hobby |

WH 내용절 동사는 know/see/say에 `frame.svo.wh`, show에 `frame.svo.wh`와 `frame.svoo.wh`를 등록했다. 기본 Sense의 기존 형태/어휘 정보를 복제하되 새 Frame을 별도 Sense로 한정한다. 다른 모든 동사에 WH 목적어를 무조건 허용하지 않는다. 일반 간접화법·자동 시제 역행은 추가하지 않았다.

도감의 새 고정 문구는 주격 관계절·목적격 관계절·관계부사절의 제목/형태/짧은 설명 3항목이다. 예문 영역이나 문장·성분 번역을 추가하지 않는다. 공격에서 실제 생성한 relativeClauses/questionClauses/embeddedQuestions와 physical ID를 기록하며 내부 상태값을 학생 문구로 노출하지 않는다. 원정 사전은 단어 뜻·형태·용법을 계속 제공한다.

외부 대조: [British Council 정의적 관계절](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/relative-clauses-defining-relative-clauses)은 사람/사물의 관계사, 장소·시간, 목적격 생략과 주격 생략 제한을 설명한다. [Question forms](https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/question-forms)의 질문 어순·do support와 [간접 질문 참고](https://downloads.bbc.co.uk/learningenglish/lowerintermediate/unit21/u21_6min_gram_indirect_questions.pdf)의 평서 어순을 대조했다. Cambridge 두 페이지는 이번 접근에서 403이므로 새 독립 확인을 완료했다고 하지 않는다.

현재 목적격 gap 경로는 명시 목적어의 재분석을 막기 위해 `it/this/that`을 SVOO의 간접목적어로 삼아 추가 gap을 만드는 분석을 제외한다. 이는 이번 기본 학교 문법 범위의 제한이다. 문맥에서 동물·사물을 받는 간접목적어까지 일반화한 전체 영어 판정으로 설명하지 않는다.

교사의 최종 교육 검수와 인간 학습 난이도 평가는 NOT_RUN이다. 자동 원정의 문장은 실제 카드·문법 엔진으로 제출되지만 의미상 자연스러운 모범 예문이나 추천 문장 목록이 아니다. 등록된 학교 문법과 제한된 깊이/작업량의 파서를 확장했으며 일반 영어 전체 지원은 아니다.
