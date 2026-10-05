# 0.2.2 구현 계획

기준: 작업 시작 시 fetch한 origin/main `50b4311eb07c7e8ce14dfa8142436af430ba7dea` (PR #3 병합). 0.2.1 구현 commit의 ancestor 검사와 동일 tree, 실습/77·132·242 HP/타격 코드 확인. 시작 checkout clean. 브랜치 `codex/v0.2.2-grammar-learning-integrity`.

첨부 642줄 전체를 변경 명세로 읽었다. 문서의 P01~P72는 기대사항이며 실행 결과가 아니다. baseline npm test 284 PASS, build PASS; 원본 로그 `.local-validation/v022/baseline/`.

1. B: RunController와 stage에 새 버전의 제출 거래/0피해 결과를 추가. 무효 제출의 마지막 턴·카드·Undo·중복과 기술 실패 rollback부터 검사.
2. C: 기존 NP/AP/PP 파서에 전체 Sense 탐색, 검수된 Frame, 제한된 비정형 연결/관계절을 추가. 언어 데이터의 0.2.1 view를 보존. comboEligibility는 별도 순수 resolver로 원정 스냅샷을 사용.
3. D: 고정 grammarGuideData 및 단어 설명, 덱 사전 연결, 번역 없는 도감, 증거 기반 과거 교육 분류 보정. 실제 점수/집계/해금/RNG는 변경하지 않음.
4. E: 신규 단위 검사 후 전체 test/validate/build/decks/runs 및 브라우저/production 7전투. 기존 고정 출력 증거는 백업·복원. 실제 검사별 결과와 NOT RUN은 TEST_REPORT에 기록.

의도된 기대값 변경: 새 원정만 INVALID_CORE 제출 비용 발생; 잠긴 SVOO 전용 배율 없음; 등록된 SVOC/비정형/관계절은 실제 기본 판정; 도감 번역/내부 상태 제거. 구버전 fixture의 정산·후보/RNG 기대는 유지한다. 새 버전 문자열은 0.2.2, 실습 완료 계약은 0.2.1 유지. 의존성 변경 없음.

설계 경계: Grammar는 해금·룬·지역을 보지 않음. 유효 입력 전체를 소비하는 구조만 정상 판정. 교육용 동률 우선순위는 해금/룬과 무관하게 고정. 기술 실패를 오답으로 기록하지 않음. 일반 덱 생성 정책은 기존 view로 고정하여 Frame 확장이 초기 RNG를 바꾸지 않도록 검증.
