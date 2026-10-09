# 0.6.1 문법 판정 보완 검토

## 수정 전 실제 재현

작업 시작 main `79ab84ebe3a3240a558aecbd2898efdd8e179029`의 0.6.0 언어 view에서 첨부 G001–G045를 **게임 코드를 수정하기 전에 실제 실행**했다. 별도 산술/전투 입력은 등록된 물리 카드·기본 연마0·무룬·관련 팩 모두 활성으로 parser → score → stage를 호출했다. 자연 원정이나 브라우저 제출 기록으로 부르지 않는다.

| 실제 제출 문자열 | 수정 전 0.6.0 | 새 0.6.1의 같은 지정 입력 |
|---|---|---|
| A room was too hard to show. | INVALID_CORE, MISSING_REQUIRED_COMPLEMENT, 위력0, 턴 소비 | VALID, 주절 SVC, 과거·to부정사·too, 위력502 |
| A person be often giving you a beautiful environment with small problems. | VALID_WITH_ISSUES, BE_FORM_REQUIRED, 주절 SVC 명사보어 오분류, 항구 장막 유지, 위력67 | 같은 BE_FORM_REQUIRED를 유지하는 SVOO, 완전문장/진행 보너스 없음, 장막 해제, 위력333 |
| A person is often giving you a beautiful environment with small problems. | VALID지만 주절 SVC 명사보어 오분류, 장막 유지, 위력90 | VALID, 본동사 give의 SVOO와 진행, 장막 해제, 위력567 |

위 수치는 당시 사용자 원정의 재현 점수가 아니라 **이번에 명시한 지정 입력**의 결과다. 이전 관찰8618은 전체 룬·연마·상태가 없으므로 정답으로 고정하지 않는다. 16장 원문은 정상 복합문 회귀로만 검사했다.

`read`를 사용한 일부 예문은 수정 전에도 VALID였다. 그러나 해당 경로는 read의 자동사 사용을 택했고 바깥 주어와 생략 목적어의 구조 참조가 없었다. 이를 모두 “0점 버그를 재현했다”고 묶지 않는다. 원본45개 분석 전체는 로컬 `.local-validation/v061/grammar-baseline/`에 보존하며, 공개 요약은 [실행 결과](validation/v0.6.1/grammar-results.json), 회귀 지문은 `tests/fixtures/v061-legacy-grammar060.json`이다.

## 구현 경계

`grammarPolishLanguage.js`는 frozen 0.6 view를 복제하여 **0.6.1에만** 검수된 형용사·부사 정책을 추가한다. 새 단어, Form, 카드 정의는 만들지 않는다. parser·verbPhrase·skyEvidence의 새 처리도 이 언어 버전에서만 적용한다. 기존0.6 원정은 과거 판정까지 보존한다.

### 주어와 생략 목적어

- easy/hard/difficult의 AP+to와 검수된 gradable AP의 too/enough+to에서 실제 바깥 주어 NP를 전달한다. 기존 subject-control 후보는 별도로 남긴다.
- 실제 to·본동사·등록 valency가 필요하다. SVO의 직접목적어나 SVOO의 직접목적어만 연결하며 SVOO에서는 실제 간접목적어도 소비한다. 실제 전치사 카드가 있는 끝의 PP만 전치사 목적어 연결 후보를 만든다.
- `nonfinitePhrases`의 `gapRole`, `antecedentNodeId`, `governorNodeId`는 실제 주어와 AP를 가리킨다. 목적어 대상과 행위자를 혼동하지 않도록 이 후보의 `controllerNodeId`는 null이다. 카드/토큰을 추가하거나 앞 주어의 기본점수를 다시 세지 않는다.
- 바깥 주절은 계속 SVC다. `The book is easy to give you.`의 안쪽 give 구조가 주절을 SVOO로 바꾸지 않는다. 이미 채워진 목적어에 gap을 중복 추가하지 않는다.
- 교육용 대표 후보 선택은 구조의 고정 우선순위다. 점수·룬·보스·뜻을 읽어서 높은 점수 후보를 고르지 않는다.

### 조동사 사이 부사와 본동사

| 검수한 기존 부사 | 새 허용 위치 | 보존 사항 |
|---|---|---|
| often, always, usually, sometimes | 조동사 다음 | 원래 문장 앞/일반동사 앞/be 뒤/끝의 개별 정책 유지 |
| really | 조동사 다음 | 원래 정도 수식과 부사 역할 유지 |
| quickly, slowly, carefully, clearly | 조동사 다음 | 원래 허용 위치 유지 |

허용된 ADVERB span만 지나가고 다음 실제 동사를 찾는다. today·명사·미등록 already를 무조건 건너뛰지 않는다. WILL → PERFECT HAVE → PROGRESSIVE BE → 본동사 순서와 **동사4개** 상한은 유지하며, 중간 부사를 동사 개수에 넣지 않는다.

`finiteIndex`, `lexicalIndex`, `verbCardIds`, `interveningAdverbCardIds`를 분리했다. often은 ADVERB 역할과 실제 사본당 +5 수식 한 번을 받는다. give의 IO·DO는 본동사 뒤의 실제 NP에서 분석한다.

`be often giving`은 BE_FORM_REQUIRED, `have give`는 AUXILIARY_FORM_REQUIRED로 복구하되 본동사 SVOO를 보존한다. 원래 카드 표면을 바꾸지 않고, 같은 원인 감점은 한 번이며 완전문장+30은 없다. 형태가 깨진 VP의 시간 증거만 제외한다. 별도 정상 완료절이나 올바른 was의 시간 증거는 다른 비정형 오류 때문에 사라지지 않는다.

항구 장막은 새0.6.1에서 점수 해금 후의 분석 대신 원본 주절의 SVOO hit와 실제 주어·본동사·IO·DO 참조를 검사한다. `pack.svoo`가 없어도 구조는 유지되지만 문형 점수 보너스는 없다. 종속절 give나 SVO+to PP는 이를 대신하지 않는다.

## 실제 검증

- `tests/v061-grammar.test.js`: 57 PASS. 첨부45문장, 필수 역할/범위/오류/원본 장막, 독립 합성 산술502/420/420/201, 부사+5 한 번, 등록 어휘 조합 holdout, 문법 데이터 순서를 뒤집은 결정성, 새 단어·Form 추가 없음, 기존0.6 분석45개 SHA256 동일을 검사했다.
- `tests/v061-grammar-controller.test.js`: 5 PASS. **ASSIGNED** 장면/기존 사본 정의를 만든 뒤 실제 SUBMIT/FINISH를 실행했다. 7장 gap 공격의502피해·빙정too 하나 파괴·한 턴 소비·영구 덱 보존·중복 명령 no-op, 미해금 SVOO 오류 제출의 장막 해제, 핵심 실패3종의0피해·카드/턴 소비를 확인했다. 원정 완주나 안전 저장 결과가 아니다.
- 위 두 파일의 집중 실행은62/62, 8개 문법 회귀 파일을 합친 실행은455/455, 모두 실패0·skip0·exit0이다. 원본 로그는 `.local-validation/v061/grammar/focused-second.log`, `regression-final.log`에 보존했다. 전체 필수 명령과 실제 브라우저 결과는 `TEST_REPORT_0.6.1.md`에서 별도로 기록한다.
- 사용자 gap 문장과 항구 문장을 브라우저에서 실제 형태 선택·제출하는 검사는 단위 검사와 구분한다. 설원6-1 비교급 →6-2 최상급 →6-3 as~as의 자연 손패 학습 코스를 위 검사로 대체하여 PASS하지 않는다.

초기 집중 검사의 G043 실패는 아직 연결되지 않았던 새 원본 장막 경로였다. 그 구현 후 통과했다. 추가 holdout의 tell/write는 게임에 없는 어휘여서 QA 입력 오류였으며, 등록된 create로 고쳤다. 이를 새 게임 어휘로 추가하지 않았다.

과거 `v03-language.test.js`는 0.3 기대값인데 최신 기본 registry를 읽고 있었다. 새 정책에서 `He have played games`/`They was running`의 깨진 VP 시간 증거를 제외하면서 충돌했다. 해당 과거 검사를 실제 `registryForVersion('0.3.0')`로 고정하여 기존55개 기대값/검사 조건을 그대로 보존했다. 새0.6.1의 달라진 정책은 새 검사에서 따로 확인한다.

## 미지원·교육 주의

이 변경은 등록된 valency와 학교 문법의 제한된 조합을 다루며 일반 영어 전체를 해석하는 NLP 엔진이 아니다. happy/ready 등 모든 형용사에 목적어 생략을 무차별 적용하지 않는다. 주어·유한동사·to·전치사를 자동 생성하지 않는다. 별도 가상 목적어 카드를 만들지 않으며, 뜻이 이상하다는 이유로 구조가 완전한 문장을 차단하지 않는다. 새 짧은 사전 문구는 “앞의 명사가 뒤의 to부정사의 대상이 될 수 있습니다.”이고 내부 gap/controller 용어를 학생 카드에 노출하지 않는다. 교사 최종 검수는 별도 미실행 범위다.
