# 근거와 작성 범위

## 1. 사용자 대화에서 확정한 계약

이 명세의 단어 선택·제거, 28장 시작 덱, 역할 확장 범위, 형태 라벨 삭제, 테스트 표지 제외, 타격 소실 수정, BGM 1초 쉼, 보스 약2배는 현재 대화의 사용자 결정이 우선이다. 문서의 0.12.1 번호·가격/공급 기본값·구체적인 최소 문형 표·초기 fade/안전여유는 구현을 위한 작성자의 제안이며 사용자 직접 확정값과 구분했다.

이전 업로드 `Syntax_Atlas_0.12_Followup_Form_Attack_BGM_Boss_v2.txt`의 실제 내용을 읽어 다섯 후속 항목을 통합했다. 본 명세가 그 파일의 중복 실행을 요구하는 것은 아니다.

## 2. 현재 소스 직접 확인 (2026-11-01)

저장소 기준 `61f02494888e8358161d53aba13631f0af143f71`.

- 브랜치/PR #28: `https://github.com/YEOMT/grammardealer/commit/61f02494888e8358161d53aba13631f0af143f71`
- `src/data/language/learning012.js`: try/remember to·gerund, watch/notice의 지각동사, plan/work/change 겸용 정의. 새 that절 목록은 별도 확장 필요성이 보인다.
- `src/data/language/libraryLanguage.js`: EXTRAPOSITION_PREDICATES의 기존 형용사 목록을 확인했다. possible/necessary/clear 추가와 for/of 연결은 이번 요구다.
- `src/engine/presentation.js`: atlas:viewport 처리의 visualSnapshot 초기화 경로를 확인했다. 사용자 간헐 소실의 실기기 원인으로 확정한 것은 아니다.
- `src/services/musicContext.js`: 기존 3000ms 지연/holdCurrentBgm 정책을 확인했다. 이번 순차 전환은 이를 대체한다.

원본 파일 링크의 공통 형식:
`https://github.com/YEOMT/grammardealer/blob/61f02494888e8358161d53aba13631f0af143f71/<위 경로>`

전체 소스 감사·실전 재현·빌드·자동 테스트를 수행했다고 주장하지 않는다. 실제 구현자는 작업 시점의 최신 파일과 관련 계약을 다시 확인한다.

## 3. 외부 문법 확인 — 사용자 결정과 별개의 언어 근거

아래는 이번 작성 시 검색/열람으로 확인한 공식 교육·사전 자료다. 일부 Cambridge 페이지는 직접 열기가403이어서 해당 공식 페이지의 검색 노출 내용으로 확인했다. 출처의 모든 문장이나 사전 전체를 검토했다는 뜻은 아니다. 아래 예문표는 저작자 작성 예문이며 원문의 장문 인용이 아니다.

### 형용사·부사
- Cambridge, Adverbs: forms — hard/fast의 동일 철자 형용사·부사.
  `https://dictionary.cambridge.org/uk/grammar/british-grammar/adverbs-forms`
- Cambridge, Hard — hard의 노력 부사 용법.
  `https://dictionary.cambridge.org/dictionary/english/hard`
- Cambridge, Well — 연결동사 뒤 건강 의미 형용사와 부사 구분.
  `https://dictionary.cambridge.org/grammar/british-grammar/well`
- Cambridge, Well dictionary — 형용사/부사 better/best.
  `https://dictionary.cambridge.org/us/dictionary/english/well?topic=good-better-and-best`

### too와 내용절
- Cambridge, Too — 정도 의미와 also의 첨가 의미 구분.
  `https://dictionary.cambridge.org/us/grammar/british-grammar/too-enough`
- Cambridge, Remember — that절, Cambridge Remember or remind — to/-ing 구분.
  `https://dictionary.cambridge.org/dictionary/english/remember`
  `https://dictionary.cambridge.org/grammar/british-grammar/remember-or-remind`
- Cambridge, Notice / Discover — 명시적인 that 내용절 용법.
  `https://dictionary.cambridge.org/dictionary/english/notice`
  `https://dictionary.cambridge.org/dictionary/english/discover`

### 가주어·진주어와 for/of
- British Council, to-infinitives — it+be+형용사, for와 of 선택의 교육용 설명.
  `https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/infinitives`
- Cambridge, Possible — to 및 that절 용법.
  `https://dictionary.cambridge.org/dictionary/english/possible`
- Cambridge, Necessary — for+목적격+to 용법.
  `https://dictionary.cambridge.org/dictionary/english/necessary`
- Cambridge, Clear — that절 용법.
  `https://dictionary.cambridge.org/dictionary/english/clear`

### 기타 대표 단어
- Cambridge, Watch / Show — 각각 손목시계, 공연이라는 명사 용법.
  `https://dictionary.cambridge.org/dictionary/english/watch`
  `https://dictionary.cambridge.org/dictionary/english/show`
- Cambridge, Write / Solve 및 Collins Write — 쓰다/해결하다, wrote/written 활용 확인.
  `https://dictionary.cambridge.org/us/dictionary/english/write`
  `https://dictionary.cambridge.org/dictionary/english/solve`
  `https://www.collinsdictionary.com/dictionary/english/write`

위 자료는 단어의 대표 문법적 가능성을 뒷받침한다. 게임의 모든 역할 태그·배율·희귀도·획득 정책은 본 명세의 설계 계약이며 사전 사실과 동일하지 않다. 검토 범위를 넘어선 사전의 모든 뜻을 자동 구현하지 않는다.
