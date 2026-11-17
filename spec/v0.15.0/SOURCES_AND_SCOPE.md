# 출처와 결정 범위

## 우선순위

최신 사용자 승인 > 이번 통합 명세 > 최신 정상 작동 코드의 보존 계약 > 과거 제안.

이 문서는 사용자의 최근 승인 내용과 아래 소스 정적 확인에 근거한 **구현 명세**다. 실제 게임 실행·모바일 청취·게임 코드 테스트 결과가 아니다.

## 소스

### [S01] GitHub main
https://api.github.com/repos/YEOMT/grammardealer/branches/main

현재 기준 커밋·PR #37·0.14.2 병합 확인. 문서 작성 후 변할 수 있으므로 구현 시작 시 재확인한다.

### [S02] AGENTS.md
https://github.com/YEOMT/grammardealer/blob/baefec39ef9a725a060d41c3977febca4517a4eb/AGENTS.md

작업/검사/상태 소유/배포 원칙.

### [S03] guidedTutorial.js
https://github.com/YEOMT/grammardealer/blob/baefec39ef9a725a060d41c3977febca4517a4eb/src/game/guidedTutorial.js

고정 덱·단계 14~17 패널·26~28 gate·복원·검증 결합.

### [S04] guidedCoach.js
https://github.com/YEOMT/grammardealer/blob/baefec39ef9a725a060d41c3977febca4517a4eb/src/ui/guidedCoach.js

32단계 표시·고정 안내 선택자·말풍선/점수 확인.

### [S05] foresight.js
https://github.com/YEOMT/grammardealer/blob/baefec39ef9a725a060d41c3977febca4517a4eb/src/engine/foresight.js

과거 예견의 주절 기억·가정법 우회. 대화에서 동일 커밋 내용 확인.

### [S06] clauseThreads.js
https://github.com/YEOMT/grammardealer/blob/baefec39ef9a725a060d41c3977febca4517a4eb/src/engine/clauseThreads.js

현행 세 실·구조 근거·해제 뒤 HP보호.

### [S07] clauseThreadsState.js
https://github.com/YEOMT/grammardealer/blob/baefec39ef9a725a060d41c3977febca4517a4eb/src/game/clauseThreadsState.js

별도 보스 영수증과 전투 시작 기준 스냅샷 검증.

### [S08] overlays.js
https://github.com/YEOMT/grammardealer/blob/baefec39ef9a725a060d41c3977febca4517a4eb/src/ui/overlays.js

사전·내 덱 공유 경로, 뜻/품사·보유·희귀도·연마 표시.

### [S09] shop.js
https://github.com/YEOMT/grammardealer/blob/baefec39ef9a725a060d41c3977febca4517a4eb/src/ui/shop.js

고정 상품·거래 안전성·연마 선택·구매 완료·직조자 과거 안내.

### [S10] deck.js / runController.js
https://github.com/YEOMT/grammardealer/blob/baefec39ef9a725a060d41c3977febca4517a4eb/src/game/deck.js

실제 버리기→재섞기→드로우 및 카드 보존. PREPARE 동작은 runController.js도 대조한다.

### [S11] main.js
https://github.com/YEOMT/grammardealer/blob/baefec39ef9a725a060d41c3977febca4517a4eb/src/main.js

명령 성공 후 렌더, 공격·운영 연출, rewardEffect 확인 모달, guided overlay 분기.

## 명세 작성자의 구체화

v0.15.0 작업명, 새 정책 ID 제안, 모션 시간·사전 크기·간격은 구현 출발점이다. 사용자가 특정 숫자나 내부 ID를 정한 것으로 취급하지 않는다.

예견 판정 뒤 실 해제, HP1 보호와 예견0피해 구분, 새 정책을 새 원정에 적용하는 기준은 직전 제안과 사용자의 통합 승인에 따라 명시화했다.

## 미포함

새 문법·추가 어휘·HP/턴/배율 변경·대형 보스 완료판·새 공격 기록 시각화·pixelfx·클라우드 저장·서비스워커·전체 사전 접기형 재설계는 포함하지 않는다.
