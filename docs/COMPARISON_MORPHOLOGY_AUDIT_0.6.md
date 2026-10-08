# 0.6 비교 형태·교육 문구 검토

아래 표는 실제 활성 lexeme/Form과 수동 정책의 전수 대조다. 영어/한국어 교육 문구의 최종 교사 승인은 NOT RUN이다. 기존 Form ID를 삭제하지 않고 degree 속성과 검수된 새 ID만 더한다. 긴 단어의 접미사를 자동 생성하지 않는다.

| 카드 | 품사 | 비교 정책 | 원급 | 비교급 | 최상급 | 제한 |
|---|---|---|---|---|---|---|
| good | ADJECTIVE | IRREGULAR | good | better | best |  |
| bad | ADJECTIVE | IRREGULAR | bad | worse | worst |  |
| big | ADJECTIVE | INFLECTED | big | bigger | biggest |  |
| small | ADJECTIVE | INFLECTED | small | smaller | smallest |  |
| happy | ADJECTIVE | INFLECTED | happy | happier | happiest |  |
| sad | ADJECTIVE | INFLECTED | sad | sadder | saddest |  |
| kind | ADJECTIVE | INFLECTED | kind | kinder | kindest |  |
| young | ADJECTIVE | INFLECTED | young | younger | youngest |  |
| old | ADJECTIVE | INFLECTED | old | older | oldest |  |
| new | ADJECTIVE | INFLECTED | new | newer | newest |  |
| easy | ADJECTIVE | INFLECTED | easy | easier | easiest |  |
| hard | ADJECTIVE | INFLECTED | hard | harder | hardest |  |
| tired | ADJECTIVE | PERIPHRASTIC | tired | more tired | most tired |  |
| interesting | ADJECTIVE | PERIPHRASTIC | interesting | more interesting | most interesting |  |
| difficult | ADJECTIVE | PERIPHRASTIC | difficult | more difficult | most difficult |  |
| beautiful | ADJECTIVE | PERIPHRASTIC | beautiful | more beautiful | most beautiful |  |
| ready | ADJECTIVE | PERIPHRASTIC | ready | more ready | most ready |  |
| useful | ADJECTIVE | PERIPHRASTIC | useful | more useful | most useful |  |
| safe | ADJECTIVE | INFLECTED | safe | safer | safest |  |
| strong | ADJECTIVE | INFLECTED | strong | stronger | strongest |  |
| important | ADJECTIVE | PERIPHRASTIC | important | more important | most important |  |
| necessary | ADJECTIVE | PERIPHRASTIC | necessary | more necessary | most necessary |  |
| possible | ADJECTIVE | PERIPHRASTIC | possible | more possible | most possible |  |
| different | ADJECTIVE | PERIPHRASTIC | different | more different | most different |  |
| clear | ADJECTIVE | INFLECTED | clear | clearer | clearest |  |
| serious | ADJECTIVE | PERIPHRASTIC | serious | more serious | most serious |  |
| very | ADVERB | 정도 비교 제외 | very | — | — | 빈도·정도 연산자 등: 새로운 비교 형태를 제공하지 않음 |
| really | ADVERB | 정도 비교 제외 | really | — | — | 빈도·정도 연산자 등: 새로운 비교 형태를 제공하지 않음 |
| often | ADVERB | PERIPHRASTIC | often | more often | most often |  |
| always | ADVERB | 정도 비교 제외 | always | — | — | 빈도·정도 연산자 등: 새로운 비교 형태를 제공하지 않음 |
| sometimes | ADVERB | 정도 비교 제외 | sometimes | — | — | 빈도·정도 연산자 등: 새로운 비교 형태를 제공하지 않음 |
| well | ADVERB | IRREGULAR | well | better | best |  |
| today | ADVERB | 정도 비교 제외 | today | — | — | 빈도·정도 연산자 등: 새로운 비교 형태를 제공하지 않음 |
| usually | ADVERB | 정도 비교 제외 | usually | — | — | 빈도·정도 연산자 등: 새로운 비교 형태를 제공하지 않음 |
| quickly | ADVERB | PERIPHRASTIC | quickly | more quickly | most quickly |  |
| slowly | ADVERB | PERIPHRASTIC | slowly | more slowly | most slowly |  |
| carefully | ADVERB | PERIPHRASTIC | carefully | more carefully | most carefully |  |
| now | ADVERB | 정도 비교 제외 | now | — | — | 빈도·정도 연산자 등: 새로운 비교 형태를 제공하지 않음 |
| clearly | ADVERB | PERIPHRASTIC | clearly | more clearly | most clearly |  |
| fast | ADVERB | INFLECTED | fast | faster | fastest |  |
| twice | ADVERB | 정도 비교 제외 | twice | — | — | 빈도·정도 연산자 등: 새로운 비교 형태를 제공하지 않음 |

비교 불가능한 very/not/always 등에는 새 형태를 만들지 않는다. 정책의 gradable=false가 허용된 일반 비교 방식과 별개로 사용을 차단한다. 신규 twice는 빈도 부사 또는 배수 표지로 사용하며 그 단어 자체의 비교급은 없다. `well`의 better/best와 `good`의 better/best는 별도 물리 카드·Form ID를 유지한다. 학교 문법 범위의 소유 한정사는 my/your/his/her/its/our/their를 기존 POSSESSIVE_DETERMINER 역할로 허용한다. 최상급 부사는 the 생략/사용을 허용한다.

| 교육 항목 | 표시와 구조 근거 | 점검 경계 |
|---|---|---|
| 비교급 | 비교급 또는 more+원급, 선택적인 than+NP/완전한 절 | more big, more better를 별도 이슈로 처리. 의미상 기묘함은 감점하지 않음 |
| 최상급 | the/소유 한정사 + 최상급 형용사 + 명사 | most students는 수량. 형용사와 부사의 한정사 조건을 구분 |
| 동등 비교 | 실제 as 두 사본 + 원급 + 기준 | as stronger as는 이슈. twice as ~ as는 별도 배수 증거 |
| 정도 | too는 앞, enough는 뒤. 뒤 to는 기존 비정형 구문 | enough time은 수량으로 분리. too/enough 같은 공격 배수 중복 없음 |
| 도감 | 네 제목+형태+짧은 설명. 실제 제출 영어/문법/위력 기록 | 고정 예문·문장 번역·내부 상태 문자열 없음 |
| 사전 | 각 lexeme의 허용 형태와 기존 한국어 단어 뜻 | 형태 메뉴는 원급/비교급/최상급 순서, 의미가 다른 ID 삭제 없음 |

G001–G032와 S001–S009의 JSON은 기대값이다. 실제 parser/score 호출은 v06-language.test.js에 있으며 실행 결과는 TEST_REPORT_0.6.md를 따른다. 부사 well의 물리 사본, 최상급 부사, 학교 문법 이슈, 해금 전 정답은 추가 정책 검사로 분리했다. S005의 +5는 실제 부사 twice 수식 이벤트다(첨부 산술표의 ADJECTIVE_ADD 표기와 분류만 다르며 최종 462는 동일).
