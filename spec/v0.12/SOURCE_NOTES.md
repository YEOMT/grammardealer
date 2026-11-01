# 0.12.0 근거·확인 범위

## 사용자 합의와 새 설계 제안

이 명세의 우선 근거는 이 대화에서 사용자가 최종 확정한 내용이다. 28장과 동사표, go/run, plan/work/change, 명령문 추가 배율 없음, 전투 준비 문구, 형태창과 버리기 조정, 점수 경계와 오버레이는 사용자 요청이다.

FREE 보존, go/run 동등확률, 신규 카드 등급의 기존 카드 참조, 구체적 픽셀·정착 배율·타이밍은 불명확한 부분을 크게 확장하지 않기 위한 구현 기본안이다. 본문에서 사용자 확정과 구분했다.

## 실제 조회한 저장소

2026-11-01 확인한 원격 main: `e0c68d83985605aa1ed950889e87da2df9c45aec`.
PR #27 병합 메시지는 `fix: 전투 화면 수명·점수 연출·오디오 복구 안정화`이다. 병합 메시지가 기기별 검증 결과를 뜻하지는 않는다.

이번 작성에서 GitHub 연결 도구로 실제 확인한 대표 경로:

| 경로 | 확인 범위 |
|---|---|
| branches/main | 확인 SHA와 병합 상태 |
| src/data/balance.js | 시작28장·기본 품사수·기존 생성 제약 |
| src/contracts.js | 기존 게임/저장0.11 및 하위 계약 상속 |
| src/game/runController.js | 시작 덱/튜토리얼/버전 분기·진행·상점/50전투 경계 |
| src/data/language/seed.js | plan의 기본 명사 등록, 명사 풀 |
| AGENTS.md | 실제 checkout 기준·기본 검사·단일 정산·배포 승인 규칙 |

같은 대화의 직전 소스 조회에서 확인한 deck, helpUsage, cards, formView, grammar parser, battleLearningGuide, stage/scoring, audio/presentation 구조도 설계 연결에 참고했다. 이번에 모든 파일을 다시 실행/전수 감사했다고 주장하지 않는다.

마운트된 직전 인계 문서 `Syntax_Atlas_GameFeel_Audio_Stability_Spec.md`를 읽어 기존 폴리싱 보존 요구와 구별했다. 과거 명세는 현재 소스를 대체하지 않는다.

커밋 고정 기준 주소:

```text
https://github.com/YEOMT/grammardealer/tree/e0c68d83985605aa1ed950889e87da2df9c45aec
```

## 언어 참고 — 원출처 문법/사전

아래 원출처 검색 결과/본문을 확인하여 검토 범위를 좁혔다. 일부 Cambridge 정규 URL 직접 열기는 403이 반환되었고, 열람 가능한 검색 색인의 원출처 본문으로 필요한 용법을 확인했다. 사전 전체 의미를 전부 구현하거나 그 뜻의 자연스러움을 자동 채점하라는 근거로 사용하지 않는다.

| 원출처 | 사용 범위 |
|---|---|
| Cambridge English Grammar Today, Hear, see, etc. + object + infinitive or -ing | see/watch/notice의 능동 지각 보어 원형·-ing |
| Cambridge English Grammar Today, Verb patterns: verb + infinitive or verb + -ing | like/try/remember의 보어와 의미 차이 |
| Cambridge English Grammar Today, Allow, permit or let? | allow의 목적어+to 및 허용 용법 구분 |
| Cambridge Dictionary, plan | 계획 명사·계획하다 동사, planned/planning |
| Cambridge English Grammar Today, Work (noun) | 일/작업의 불가산 용법과 작품 뜻의 별도 가산 용법 구분 |
| Cambridge Dictionary, change | 변화 명사의 가산/불가산, 변하다/바꾸다 동사 |
| Cambridge English Grammar Today, Imperative clauses | 일반 명령문의 원형·통상적 주어 생략 |
| British Council, Clause structure and verb patterns | 일반 절의 주어와 명령문의 예외 구분 |

```text
https://dictionary.cambridge.org/grammar/british-grammar/hear-see-etc-object-infinitive-or-ing
https://dictionary.cambridge.org/grammar/british-grammar/verb-patterns-verb-infinitive-or-verb-ing
https://dictionary.cambridge.org/grammar/british-grammar/allow-permit-or-let
https://dictionary.cambridge.org/dictionary/english/plan
https://dictionary.cambridge.org/grammar/british-grammar/work-noun
https://dictionary.cambridge.org/dictionary/english/change
https://dictionary.cambridge.org/uk/grammar/british-grammar/imperative
https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/clause-structure-verb-patterns
```

문법 참고 자료는 영어 용법 근거다. 명령문 채점·어휘 희귀도·보스 해제·score overlay 수치는 영어 문법 자료가 정해주는 것이 아니라 이 게임의 명시적 설계 계약이다.

## 이번 작성에서 하지 않은 일

게임 소스 수정, 게임 단위/브라우저 검사, 빌드, 28장 실제 seed 생성 실행, 물리 태블릿 청취, 새 배경/몬스터 제작, 원격 push/PR/배포는 하지 않았다. ZIP 안의 JSON fixture에는 실행 상태가 NOT_RUN으로 표시된다.
