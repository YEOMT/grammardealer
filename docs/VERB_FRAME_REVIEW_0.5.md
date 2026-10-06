# 0.5 관련 동사 Frame 검토

검토일 2026-10-06. 최신 main의 0.4 Frame을 복제한 새 원정 view만 확장한다. 전체 사전 개편, 새 사역·지각 체계, 수동태 보너스는 범위 밖이다. 실제 교사 검수는 **NOT RUN**이다.

| 동사 | 0.4 보존 | 0.5 추가·보강 | 실제 양성/음성 근거 |
|---|---|---|---|
| want | NP, to, O+to | 전용 역할·full span·기본 SVOC 점수 자격 | G002/011/018–022/051–054; to reads는 제한 복구 |
| need | NP, to, O+to | GERUND binding의 `nonfiniteObjectGap`로 주어를 안쪽 대상에 연결 | G004/005/012/032/055; 일반 gerund에서 무제한 목적어 생략 금지 |
| like | NP, to, O+to | GERUND 목적어 | G027/028/038/048, 사본·진행·분사 구별 |
| enjoy | 없음 | NP / GERUND 목적어, 5개 Form(ing 하나) | G024/030/040/043/045–047; G056/057 핵심 실패 |
| finish | 없음 | NP / GERUND 목적어, 5개 Form(ing 하나) | G029 및 My teacher finishes reading stories; finish to read 실패 |
| help | NP, to, bare, O+to/O+bare | 기존 Frame을 준동사 내부에서도 재사용 | To help the children is important / I help you read books |
| make | NP, SVOO, O+AP/NP/bare | 기존 기본 SVOC를 점수 자격과 정확한 O/C로 연결 | G013/017, I make you read books |
| keep | NP, O+AP/NP | 기존 기본 SVOC 보존 | G015, I keep you a good friend |
| find | NP, O+AP/NP | 기존 기본 SVOC 보존 | G014, I find you a good teacher |
| see / have / feel | 기존 O+bare 경로 | 삭제하지 않고 기본5형식에 합류 | I see/have you read books / I feel you work |
| give / show / send | SVO / SVOO | 동명사 내부 관계절의 DO 공백도 실제 IO와 구분 | G016/045; books that you gave me |
| read / play / work / run 등 | 기존 등록된 SV/SVO와 시간 Form | 같은 Frame을 ING/to 안쪽에서 검사 | read의 SV를 삭제하지 않음; 필수 대상이 필요한 give는 I enjoy giving에서 실패 |
| be | AP/NP/위치/진행 VP | 명사적 준동사 S/C와 실제 진행 VP 구분 | G001/003/023/025/033/062/063 |

`frame.svo.gerund` 하나를 추가했다. need 특수 binding은 이 Frame의 `nonfiniteObjectGap:true`이며 별도 수동태 hit를 만들지 않는다. 기존 `frame.svoc.adj/np/to/bare` ID는 그대로이고 새 view에서만 `comboImplemented:true`다. 0.4 이하 registry·Frame·Form·카드 순서는 변경 전 golden으로 확인한다.

`hobby`는 COUNT 명사와 hobbies 복수, 활동을 이름 붙이는 ACTIVITY_NAME Sense다. 그 Sense는 be+ING 중의의 대표 분석에만 사용하며 다른 주어의 의미를 오답으로 배제하지 않는다. 기존 technology/culture/time/food/room BOTH 정책은 보존한다. G064의 a technology를 불가산으로 감점하지 않는다.

enjoy/finish/hobby는 COMMON, 보상 가능, starterEligible false다. 기존 want/need/like/to 희귀도는 유지한다. 모든 동사에 gerund Frame을 부여하지 않는다. 0.5 실제 검사 76개 및 기존 관련79개·golden3개 PASS 근거는 `NONFINITE_ROLE_REVIEW_0.5.md`, 최종 전체 검증은 `TEST_REPORT_0.5.md`를 참조한다.

근거: [British Council -ing forms](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/ing-forms) 본문의 enjoy/finish/like 및 명사·수식 역할, [Cambridge verb patterns](https://dictionary.cambridge.org/us/grammar/british-grammar/infinitive-verbs)의 동사별 결합, [Cambridge need 설명](https://dictionaryblog.cambridge.org/2024/03/06/avoiding-common-mistakes-with-verb-patterns-2/?amp=1)의 need + ing 의미, [Cambridge hobby](https://dictionary.cambridge.org/us/dictionary/english/hobby)의 COUNT 표기. 일부 명세의 비-US Cambridge 원주소는 도구 내부 오류가 있어 공식 도메인의 검색 결과·대체 공식 페이지로 확인했다. 이는 교사 검수나 자연스러운 모든 예문의 검증 완료를 뜻하지 않는다.
