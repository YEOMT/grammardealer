# 청동 인장 검토 0.8

`relativeSealPair`는 현재 제출에서 선택한 단일 분석 그래프만 읽는다. 실제 제출 카드 집합과 coverage가 같아야 하며 두 관계절은 서로 다른 node/childClause ID, 같은 root sentence ID를 가져야 한다. 둘 다 유한 관계대명사 절이고 각각 SUBJECT/OBJECT이며 자체 오류가 없는 정상 근거여야 한다. 목적격 관계사 생략과 전치사 목적격을 인정한다. 질문 WH·관계부사·분사구·노드 복제·다른 후보 분석을 결합하지 않는다.

`resolveDualRelativeSeal`는 Grammar/Score/Rune/Region 뒤의 순수 resolver다. 정상 양수 위력의 같은 공격에서 조건을 확인한 후 HP를 계산한다. 잠금은 HP 1 바닥과 overkill 0, 잠금 피해는 preventedDamage로 별도 기록하며 이월하지 않는다. 해제 공격부터 HP 0이 가능하고 해제 후에는 영구 유지한다. 낮은 피해로 해제만 한 경우 남은 HP는 그대로 계산한다. 별도 피해 반감·추가 카드·시간 순서·추가 턴은 없다.

RunController는 공격 ID를 한 번만 커밋하고 `relativeSealUnlockReceipt`에 실제 unlocking snapshot, 카드 스냅샷, 당시 HP/보스 전후 상태를 보존한다. 일반 최근 공격 history가 교체돼도 이 receipt가 남는다. 저장 검증은 해당 언어의 실제 parser로 다시 분석하고 같은 두 절과 물리 ID의 digest 및 resolver 결과를 대조한다. 이는 로컬 데이터 일관성 검사이며 암호학적 부정행위 방지나 서버 인증은 아니다.

Presentation은 보스 상태나 피해를 재계산하지 않는다. 시작에는 이전 HP/인장을 보이고 IMPACT에 커밋된 결과를 표시한다. 취소·탭 비활성·중복 완료는 엔진 정산을 반복하지 않는다. UI에 영구 주격/목적격 진행 체크박스는 없다.

첨부 B001–B024는 **합성 HP/위력 산술 + 실제 parser 구조**로 실행하며 자연 원정과 구분한다. 별도 컨트롤러·저장 검사, 지정 상태 실제 UI, 자연 production 학습 경로의 증거는 [검증 보고](TEST_REPORT_0.8.md)를 따른다.
