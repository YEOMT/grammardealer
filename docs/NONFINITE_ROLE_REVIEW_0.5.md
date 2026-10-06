# 0.5 준동사 역할 검토

기준은 0.4 main `6d2907eddefafb1a909c6c803259ba26b408f104`다. 검토일 2026-10-06. 이 문서는 코드·명세·자동 검사를 대조한 기록이며 교사 실검수는 **NOT RUN**이다. 예문은 QA 재료이며 production 정답 목록이나 학생 고정 예문 화면이 아니다.

## 형태와 분석 경계

`desertLanguage`는 0.4 registry를 복제한다. 각 기존 동사의 `.ing` ID와 표기를 유지하고 `morphologicalForm: ING`, `-ing형` 라벨만 새 view에 준다. 새로운 역할별 Form/카드/모드는 없다. enjoy/finish의 새 동사도 ing 1개이며 will은 추가하지 않는다. interesting은 기존 ADJECTIVE다. 0.4 전체 registry는 변경 전 SHA-256과 동일한지 검사한다.

기존 NP/AP/PP/VP와 Frame을 재사용한 유한 합성이다. `NONFINITE_PHRASE`는 실제 카드 범위·head·function·interpretation·controller/antecedent 참조를 담는다. `analysis.nonfinitePhrases`는 저장 가능한 null을 사용하며 Form/영구 카드에는 문법 역할을 쓰지 않는다. `primaryScoringClauseId`는 바깥 유한 절이다.

| 실제 역할 | 등록 예문 | 확인 근거 |
|---|---|---|
| INFINITIVE / SUBJECT | To read books is good. | G001, 전체 to/read/books가 S, is가 주절 V |
| INFINITIVE / OBJECT | I want to read books. | G002, 바깥 O 전체와 안쪽 read의 books O 별도 |
| INFINITIVE / SUBJECT_COMPLEMENT | My plan is to help you. | G003, 보어 전체 span |
| INFINITIVE / NOUN_MODIFIER | I need a book to read. / a friend to play with | G004–005, OBJECT/PREPOSITION_OBJECT 공백과 실제 선행 NP 연결 |
| INFINITIVE / PURPOSE | I go to school to read books. / To help you, I read books. | G006–007, 전치사 to와 분리, 앞 목적도 실제 주절 보존 |
| INFINITIVE / ADJECTIVE_COMPLEMENT | I am happy to help you. / ready to read / It is easy to read books | G008–010, happy/ready/easy Sense 허용 목록 |
| INFINITIVE / OBJECT_COMPLEMENT | I want you to read books. | G011–012, you O / to read books OC 및 controller 연결 |
| GERUND / SUBJECT | Reading books is good. | G023, 동일 read.ing, 단일 구 3인칭 단수 |
| GERUND / OBJECT | I enjoy reading books. | G024, read의 내부 목적어 유지 |
| GERUND / SUBJECT_COMPLEMENT | My hobby is reading books. | G025, hobby 활동명사 Sense 대표 선택 |
| GERUND / PREPOSITION_OBJECT | I am good at reading books. | G026, at PP 전체와 GERUND 범위 분리 |
| PROGRESSIVE VP | I am reading books. | G033–036, 동일 read.ing이 유한 be VP에 속하며 GERUND 없음 |
| PARTICIPLE / NOUN_MODIFIER | The running dog is happy. / dog running in the park | G037–038, running 1장만 수식 +5, PP는 별도 기존 효과 |

## 대표 분석과 정확성

주어·목적어의 bare ING + 내부 목적어는 동명사 구조를 우선한다. 따라서 G053 `Reading books are good`를 ‘읽고 있는 책들’이라는 다른 뜻의 분사 명사구로 바꿔 오류를 숨기지 않고, 명세가 지정한 동명사 주어의 일치 오류를 유지한다. 관사 뒤의 `the running dog`는 명사 수식이다. 이는 점수와 무관한 교육용 대표 분석 정책이며 자연언어의 모든 중의적 의미를 구분한다는 뜻이 아니다. `hobby`의 ACTIVITY_NAME Sense는 be의 명사적 보어를 대표로 고르고 일반 행위 주체의 be + ING는 진행 VP를 고른다. 의미의 자연스러움 자체를 감점하지 않는다.

등록 목적어·보어 분석이 목적 부가어보다 먼저 선택된다. want + O + to를 SVO+목적으로 바꾸지 않는다. 읽다의 SV/SVO는 모두 보존하되 명사 후치 to에 필요한 공백은 실제 선행 명사와 연결한다. happy/ready/easy의 to 결합을 등록하며 모든 형용사 뒤 to를 자동 승인하지 않는다.

잘못된 `to reads`는 실제 선택형을 유지하고 INFINITIVE_BASE_REQUIRED 한 번, raw hit RECOVERED / bonusEligible false다. `He want to read books`의 바깥 일치 오류는 안쪽 정상 to hit를 지우지 않는다. enjoy의 필수 목적어가 성립하지 않는 `enjoy to read` / `enjoy read`는 INVALID_CORE다. 카드 삽입·Form 자동 교정은 없다.

## 시간·연결·안전 경계

- 비정형 VP의 finiteCardId는 null, temporalEvidenceEligible은 false다. to have read / being happy / having read 자체는 기존 TIME 효과나 골렘 조건을 생성하지 않는다.
- 안쪽에 실제 유한 관계절이 있으면 그 절의 시간은 유지한다. `I want to enjoy reading books that you gave me`는 실제 gave의 PAST 증거를 남긴다.
- shared to 및 gerund 동사구 등위는 LINK.PHRASE이며 가상 to 카드를 만들지 않는다. 실제 because/when 절은 기존 LINK.CLAUSE다.
- 16장, work 90,000, depth 6, 후보 128 한도를 유지한다. 비정형 depth 한도 초과는 UNSUPPORTED/ENGINE_LIMIT 기술 실패로 보고한다.
- 분사 raw tag는 특별 배수가 아니며 MODIFIER.ADJECTIVE의 modifierCardIds는 ING 1장이다. 후치 수식 내부 PP/관사를 각각 +5로 잘못 세지 않는다.

## 실행 증거

`tests/v05-language.test.js`: 원본 G001–G064 각각 status/frame/긍정·금지 tag/issue, 전체 카드 소비와 null 직렬화 검사 + 12개 형태/역할/참조/시간/오류/holdout/한도/순서 독립성 검사. 76/76 PASS(관련 재실행; 전체 회귀는 최종 TEST_REPORT 참조). `v04-language` + `v04-foundation` 79개, `v05-legacy` golden 3개를 합한 관련 최종 실행은 158/158 PASS. 최신 로그는 `.local-validation/v05/language-composition-fix.log`다. 초기 153개 및 역할 수정 154개 실행과 후속 검사를 구분한다. 기대 JSON을 변경하거나 문자열 lookup을 production에 넣지 않았다.

집중 UI 검사에서 `I want you to read books`의 구 전체는 목적격보어인데 내부 read 한 장까지 보어로 바꾸던 오류를 발견했다. 기존 SVOC helper의 head 재분류를 새 비정형 구에 적용하지 않도록 수정했다. 구는 OBJECT_COMPLEMENT, 내부 동사는 NONFINITE_VERB를 유지하며 to/bare/복합 VP 세 경로와 learning roleRanges 회귀를 추가했다. AP/NP 보어와 0.4 이하 분석은 그대로다.

후속 조합 검사에서는 `I want you to enjoy reading books`의 중간 SVOC wrapper가 자식의 기존 대표 분석 우선순위를 전달하지 않아 reading이 잘못된 대표 분사 경로로 선택되었다. 동일 원인은 준동사 주어·보어·PP와 절 연결 wrapper에도 있었다. 각 wrapper에 이미 계산한 자식 구조 우선순위를 합성해 전달하도록 고쳤다. 단어·숫자·Frame 순위 자체는 바꾸지 않았다. enjoy/finish 안쪽의 GERUND, 실제 the running dog의 PARTICIPLE, 비정형 to be reading의 비동명사/비유한시간을 함께 회귀했다. 후자는 잘못 붙던 동명사 보너스가 제거되므로 높은 점수를 고르는 규칙이 아니다.

영어 근거로 [British Council -ing forms](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/ing-forms)의 본문에서 명사·수식 사용과 내부 목적어/절 결합을 확인했다. 사전별 용어 체계 전체가 프로젝트의 학교문형·게임 점수 체계와 같다는 뜻은 아니다. 댓글은 교육 근거로 사용하지 않았다.
