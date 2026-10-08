# 0.6 빙결핵 보스 검토

`frostCrystalLock.js`는 Grammar/Score/Rune/Stage가 계산한 값을 받아 다음 보스 상태를 제안하는 순수 함수다. UI·RNG·재화 변경을 수행하지 않는다. `RunController`가 피해, 소비한 실제 사본, 영수증과 보상을 한 번 커밋한다.

대상은 실제 임시 than/as/as/more/most/too/enough/twice 사본이다. supportOnly인 the/to/good, 영구 일반 카드, 다른 전투 사본은 제외된다. 카드가 분석 coverage에 포함되고 unlicensed/excluded가 아니며, VALID 또는 VALID_WITH_ISSUES이고 위력이 양수이면 자격이 있다. 비교 hit 자체를 요구하지 않는다. 다른 카드의 정확성 이슈는 정상적인 수량 more나 빈도 twice의 자격을 막지 않는다.

1. 서로 다른 실제 대상 사본 수와 남은 결정 수 중 작은 값만큼 파괴한다.
2. 갱신한 남은 결정이 양수이면 `hpAfter = max(1, hpBefore - power)`다.
3. 잠금으로 막힌 부분은 `preventedDamage`이며 overkill은 0이다. 다음 공격에 이월하지 않는다.
4. 결정이 0이면 정상적인 HP/overkill 계산으로 돌아간다. 마지막 결정 공격 자체로 격파할 수 있다.
5. 같은 attackId가 이미 처리됐으면 추가 피해·결정 파괴가 0이다. 상태 영수증과 막힌 피해 누적값은 저장된다.

B001–B015는 순수 제안 함수의 지정 입력 검사다. 실제 문장과 물리 사본의 연결은 `v06-frost.test.js`에서 별도로 검사한다. INVALID_CORE 제출의 빙정 소비와 보스 결정 불변, 두 as 소비, 수량 more, 일반 twice, HP 1 정지 및 마지막 enough로 동시 격파를 분리한다. 이 지정 상태의 HP·카드 할당을 자연 플레이 증거로 사용하지 않는다.

Presentation은 확정된 `consumedTemporaryCardIds`, `bossStateBefore/After`, `preventedDamage`만 표시한다. 결정 수와 HP는 IMPACT에서 함께 바뀌고, 연출 종료/취소가 게임 정산을 다시 실행하지 않는다. 효과 감소와 OS reduce 경로의 기존 구분을 유지한다.
