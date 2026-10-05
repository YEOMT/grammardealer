# 0.4 교육·언어 검토표

검토 대상은 `src/data/grammarGuideData.js`, `src/data/language/skyLanguage.js`, `src/engine/grammar/skyEvidence.js`, `src/engine/learningRecords.js`다. 고정 설명과 실제 제출의 구조 증거를 분리한다. JSON 사례는 QA 기대값이며 런타임 정답표가 아니다. 아래는 코드·사전 근거·자동 검사 검토이며 **교사 검수는 NOT RUN**이다.

| 항목 | 학생 설명 / 판정 정책 | 실제 확인 |
|---|---|---|
| 등위절 | 두 절은 대등하다. 왼쪽 절은 점수 기준일 뿐 오른쪽 절을 종속절로 부르지 않는다. | `v04-language`, `v04-score-shield`, `sky-islands-browser` |
| 단어·구 연결 | 명사구/형용사구/전치사구/부사구/공유 주어 동사구를 절 연결과 구분한다. | 양성·음성 쌍, PP/AdvP hold-out, 카드 전체 범위 |
| 부사절 | 이유·시간·조건 정보를 주절에 덧붙인다. 앞·뒤 배치를 지원한다. 단독 종속절은 이 게임의 독립 서술문 제출에서 미완성이다. | 68개 첨부 사례 및 추가 어휘 치환 |
| if | 일반 조건 표현이다. if 뒤 과거·will을 일괄 오류 처리하거나 모든 if를 가정법이라 부르지 않는다. | 실제 조건절 파싱, 문구 검토 |
| 내용 목적어절 | 허용 동사에서 절 전체가 O이고, 안쪽 S/V/O는 별도로 표시한다. | 명시 that / 생략 that / 중첩 목적어 UI |
| that | 지시어·관계절·내용절을 문장 구조로 구분한다. 같은 물리 카드를 두 연결 보너스에 중복 사용하지 않는다. | 역할 ID/범위와 음성 사례 |
| 점수 기준 | 독립 등위는 첫 번째 절, 부사절·내용절 결합은 바깥 주절. 완전문장 +30은 제출 전체에 한 번. | 타임라인 순서·계산 검사 |
| know 진행 | 기본 ‘알다’ Sense의 진행에는 형태/용법 안내와 -10. 해당 진행 증거만 제거한다. | 내부 다른 절의 진행과 연결 보너스 보존 |
| 문지기 | 실제 접속사로 정상 연결한 첫 공격부터 해제. 생략 that은 정상 영어·연결 점수지만 보호막 공략에는 접속사 카드가 필요하다. | 문법 정오와 적 공략을 분리한 16 산술 사례 |
| 실패 기록 | 미완성 제출은 0피해·실제 소모. 기술 실패는 무소모. 미완성 기록의 없는 점수 기준 절은 null로 저장한다. | production에서 발견한 직렬화 회귀 및 프로필 검사 |
| 사전/도감 | 단어 뜻은 내 덱/사전, 도감은 영어 원문·실제 역할·위력. 고정 예문 영역/번역/내부 상태값은 노출하지 않는다. | 브라우저 DOM 및 캡처 |

고정 `examples` 배열은 설명 검증용 데이터로만 유지한다. 학생 UI는 실제 제출 기록을 예문으로 사용한다. 과거 교육 재검토는 원래 점수·누적·해금·저장 문장을 바꾸지 않는 보기 계층이다.

## 동사·명사 검토

| 동사 | 이번에 등록한 기본 Sense/Frame | 형태 | 범위 제한 |
|---|---|---|---|
| think | SV, SVO(내용절) | think/thinks/thought/thought/thinking | think about 등 모든 사전 용법을 지원한다는 뜻은 아님 |
| know | SV, SVO(NP), SVO(내용절) | know/knows/knew/known/knowing | 기본 상태 Sense 진행 안내; 외부 NLP 의미 추정 없음 |
| say | SVO(NP), SVO(내용절) | say/says/said/said/saying | `say her that ...`에 임의 SVOO를 열지 않음 |
| 기존 동사 | 기존 0.3 Frame/Sense/형태 유지 | 0.3 버전 view 보존 | have/think를 동사명만으로 진행형 금지하지 않음 |
| 기존 명사 | 기존 0.3 가산성 유지 | technology/culture/time/food/room BOTH, information/homework MASS 유지 | 이번에 새 명사/가산성 정책 추가 없음 |

대표 분석은 해금/룬과 독립적이다. 배열·인덱스 등록 순서를 뒤집은 실제 파서 비교, 다중 Sense 회귀, 16장 복합 동사구와 접속절 검사를 수행한다. 작업량 90,000 / 깊이 6 / 후보 128의 유한 예산을 사용하며 초과는 기술 복구다. 일반 영어 전체나 의미 적절성까지 판정하는 엔진은 아니다.

## 검토 근거

- [Cambridge: subordinating conjunctions](https://dictionary.cambridge.org/grammar/british-grammar/conjunctions-subordinating): 절 사이 이유·시간·조건 관계.
- [Cambridge: that-clauses](https://dictionary.cambridge.org/de/grammatik/british-grammar/that-clauses): 동사 뒤 내용절과 that 생략.
- [Cambridge: conditionals](https://dictionary.cambridge.org/us/grammar/british-grammar/conditionals-if): if + will이 의지·정중함 등의 용법에서 가능함. 일괄 금지하지 않음.
- [British Council: stative verbs](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/stative-verbs): 상태와 활동 Sense에 따라 진행 용법이 달라짐.
- [Cambridge think](https://dictionary.cambridge.org/dictionary/english/think), [know](https://dictionary.cambridge.org/dictionary/english/know), [say](https://dictionary.cambridge.org/dictionary/english/say): 기본 용법·형태 검토.

외부 자료는 영어 설명의 근거다. 게임 HP·배수·확률의 근거는 `spec/0.4_SKY_ISLANDS.md`이며 사전에서 도출한 사실이 아니다.
