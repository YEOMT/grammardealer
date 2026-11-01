# 기준 문장 — 0.12 후속 어휘·문법 폴리싱

이 파일은 개발 중 단위검사와 짧은 실전 확인을 위한 **기대 계약**이다. 실행 결과나 실제 게임 정답 목록이 아니다. 카드/형태 ID로 문장을 구성하고 같은 물리 카드의 표면형에 여러 역할 후보가 있는 경우를 실제 엔진으로 확인한다. 이미 있는 레지스트리 생성기를 사용하되 게임 판정 우회·문장 화이트리스트를 만들지 않는다.

**VALID**는 이 문서의 정상 문장에 대해 불필요한 감점 이슈 없이 완전한 문장으로 인정한다는 뜻이다. 기존 해금 전에는 문장 인정과 보너스 수령을 구분한다. 잘못된 문장의 결과는 기존 INVALID_CORE 또는 VALID_WITH_ISSUES 정책을 유지하되, 오류 없는 VALID/목표 구문 성공으로 만들지 않는다.

## 1. 기본 품사·겸용·too

| ID | 문장 | 핵심 기대 |
|---|---|---|
| L01 | The work is hard. | work 명사, hard 형용사 보어 |
| L02 | I work hard. | work 동사, hard 부사 |
| L03 | You are fast. | fast 형용사 보어 |
| L04 | You run fast. | fast 부사 |
| L05 | I am well. | well 건강 의미 형용사 |
| L06 | I work well. | well 부사 |
| L07 | I work harder. | harder 부사 비교형; 비교 대상 생략은 기존 규칙 유지 |
| L08 | You are faster than me. | fast 형용사 비교 |
| L09 | I work better. | well 비교형, good 카드와 자동 합치지 않음 |
| L10 | I know the answer. | answer 명사 |
| L11 | I answer you. | answer 동사 |
| L12 | I have a watch. | watch 명사 |
| L13 | I watch you. | watch 동사 |
| L14 | I like the show. | show 명사 |
| L15 | I show you a book. | show 기존 4형식 |
| L16 | She watches the watches. | 서로 다른 watch 사본; 동사3단/명사복수 |
| L17 | I watch the show. | watch 동사/show 명사, 대표 품사색과 판정 분리 |
| L18 | The book is too big. | 정도 too |
| L19 | I like you too. | 첨가 too, DEGREE.TOO 금지 |
| L20 | I run too fast. | degree too + 부사 |
| L21 | I run fast too. | additive too; fast는 부사 |

## 2. 비정형 목적어·내용절

| ID | 문장 | 핵심 기대 |
|---|---|---|
| L22 | I try to help you. | try + to 목적어 |
| L23 | I try working. | try + -ing 목적어 |
| L24 | I remember to help you. | remember + to |
| L25 | I remember helping you. | remember + -ing |
| L26 | I notice that she is tired. | notice 내용절 목적어, 관계절 아님 |
| L27 | I remember that you like music. | remember 내용절 |
| L28 | I discover that she is happy. | discover 내용절 |

## 3. 가주어·진주어 / for / of

| ID | 문장 | 핵심 기대 |
|---|---|---|
| L29 | It is possible to help you. | TO extraposition |
| L30 | It is possible that she will come. | THAT extraposition |
| L31 | It is necessary to work. | TO extraposition |
| L32 | It is necessary that we work. | THAT; 일반 복수 주어 절, 새 당위 가정법 불필요 |
| L33 | It is clear that she is happy. | clear THAT |
| L34 | It is easy for me to read the book. | FOR_TO, me와 read 연결 |
| L35 | It is hard for the student to solve the problem. | 명사구 의미상 주어 |
| L36 | It is possible for her to help you. | possible FOR_TO |
| L37 | It is necessary for us to work. | necessary FOR_TO |
| L38 | It is important for them to read the book. | 기존 important 확장 |
| L39 | It is kind of you to help me. | OF_TO, kind와 you의 평가 관계 |
| L40 | It was good of him to help us. | OF_TO, 주절 과거 보존 |
| L41 | It is good for you to run. | good FOR_TO; of만 허용하지 않음 |
| L42 | It is kind to help the child. | 기본 TO, 추가 of 강제 금지 |
| L43 | It is clear. | 일반 문장 가능, 가주어진주어 근거 없음 |

## 4. 신규 어휘·활용·기존 기능 접합

| ID | 문장 | 핵심 기대 |
|---|---|---|
| L44 | I smile. | smile SV |
| L45 | She smiles. | 3인칭 단수 |
| L46 | They smiled. | 과거 |
| L47 | Smile. | 기존 긍정 명령문 경로 |
| L48 | I write a story. | write SVO |
| L49 | I wrote a story. | 불규칙 과거 |
| L50 | I have written a story. | have + written 완료 |
| L51 | I write you a story. | write 수여4형식 |
| L52 | I solve the problem. | solve 타동사 |
| L53 | The problem was solved. | 새 타동사 수동태 |
| L54 | I visit the school. | visit 목적어, to 없이 정상 |
| L55 | I give you a gift. | gift 명사, give 기존4형식 |
| L56 | I protect the child. | protect 타동사 |
| L57 | I discovered a problem. | discover 과거 |
| L58 | I see the result. | result COUNT |
| L59 | I try the method. | method COUNT |
| L60 | I developed a new method. | 새 명사+기존 동사/형용사 |

60문장을 각각 실전에서 촬영하지 않는다. 주된 목적은 작은 레지스트리/파서 검사 묶음으로 역할·형태·근거를 확인하는 것이다. 대표 몇 개만 실제 UI 제출 경로에 연결한다. 오래된 프로필로 새 단어가 없어 실패한 결과와 최신 프로필 판정 실패를 혼동하지 않는다.

## 5. 최소 경계 검사

| ID | 입력/상황 | 기대 경계 |
|---|---|---|
| E01 | I smile a book. | 이번 smile SV 등록으로 SVO를 정상화하지 않음 |
| E02 | It is easy of me to read the book. | 이번 easy 의미에 OF_TO 성공 근거 금지 |
| E03 | It is kind of I to help you. | 목적격 오류 감지; 정상 OF_TO로 보상하지 않음 |
| E04 | It is possible for she to help you. | 목적격 오류 감지 |
| E05 | It is possible for her to helps you. | to 뒤 원형 위반 감지 |
| E06 | It is necessary for us. | 문맥상 일반 구조로 처리할 수는 있어도 진주어가 없으므로 extraposition 보너스 금지 |
| E07 | I remember that she happy. | 내용절 동사 누락을 정상 내용절로 보상하지 않음 |
| E08 | I try to working. | to + -ing 오류 감지 |
| E09 | I have writed a story. | 미등록/잘못된 활용; written으로 몰래 보정 금지 |
| E10 | Me too. | 이번 첨가 too만으로 독립 공격문 지원 확대 금지 |
| E11 | I have a watch. | 지각동사 룬 근거 생성 금지 |
| E12 | I like you too. | 정도/설원 효과 생성 금지 |
| E13 | I am well. | 부사 역할을 중복 계산하지 않음 |
| E14 | I watch the watch.에 같은 instanceId 2회 | 카드 보존 오류를 문법 겸용으로 우회하지 않음 |

E02 등은 이 패치의 대표 의미/지원 범위 계약이다. 미지원 용법과 모든 맥락에서의 영어 비문을 동일하게 안내하지 않는다. 심한 오류의 소비/0점 정책은 기존 엔진 계약을 임의 변경하지 않는다.

## 6. 언어 외 소수 경계

- 모드별 28장, be2/have1/make1/핵심3/go-or-run1. 신규 동사는 고정 슬롯을 교체하지 않음.
- 새로운 공급에서 look/room 제외, 기존 저장 look/room 그대로 재로드.
- for/of 구문에서 기존 Stage9 보너스와 도서관장 회복 저지 근거 연결. 전체 보스전을 자연 완주할 필요 없음.
- 현재 정상 공격을 2~3회 연속 실행하면서 한 번은 채점 중 viewport, 한 번은 빠른 배속으로 집결/돌진 확인.
- 일반 몬스터/초원 수호자/항구 수문장 크기와 피격을 같은 시나리오에 묶음.
- 구곡의 가청 종료 후 1초 BGM 쉼, 신곡 시작; 중간 효과음은 재생 가능. 화면 즉시 이동/로비 복귀에서 낡은 예약 취소.
