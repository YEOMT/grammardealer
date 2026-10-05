# 0.4 운영 카드 검토표

| 항목 | 보급 | 탐색 |
|---|---|---|
| 정의 | OPERATION / 고급 / 10골드 | OPERATION / 희귀 / 14골드 |
| 효과 | 자신을 먼저 사용완료로 이동한 제안 상태에서 기존 draw 2 | DRAW의 WORD 사본 한 장 선택 |
| 비용 | 턴·교환·공격 수·HP 변화 없음 | 동일 |
| 사용 후 | EXHAUSTED, 소유 activeCardIds 유지, 다음 전투 복귀 | 동일 |
| 빈 대상 | 0장 받을 때 무소모 거절, 1장 가능 시 실제 1장 | 선택 가능한 WORD 없으면 무소모 거절 |
| 손패 한도 | 10/10이면 자신이 빠진 공간에 1장, 9/10이면 2장 | 자신이 빠진 공간에 선택 카드 1장 |
| 재셔플/RNG | 기존 DISCARD만 재셔플. 사용완료·손패·조합대 제외 | 나머지 DRAW 순서 및 deck RNG 불변 |
| UI | 같은 카드 크기, 은색 테두리, 설명/사용/버리기 분리 | 이름·연마 사본을 보여주는 선택창, 취소 가능 |

`game/operations.js`는 실제 상태에서 제안하고 `RunController`만 커밋한다. effectId/revision/battleId/source/target과 전후 카드·RNG 영수증을 남긴다. `operationHistory.js`와 저장 검증이 같은 계약을 확인한다. 연출은 확정 영수증을 읽으며 다시 드로우하지 않는다.

검토 및 회귀 근거:

- `v04-operations.test.js`: 첨부 14 모델 + 실제 controller 거래, 취소/오래된 revision/중복·카드 영역·순서·사용 후 복귀·연마 제외·제거·보상 후보.
- `v04-boundaries.test.js`: 오염 제출 무소모, 사용 중 profile/load/new-run 거절, 효과 감소·abort·숨김·재표시·watchdog 뒤 1회 정산, 변조 저장 거절.
- `sky-operations-browser.mjs`: 실제 DOM 클릭·Chromium touch, 설명/사용/체크 구별, 탐색 취소, 정확한 카드 이동, 최대 손패 배치, 내 덱·사용완료 보기.
- `sky-islands-browser.mjs`: 0.3/0.4 SHOP2/사용완료 원정을 실제 IndexedDB 3슬롯으로 보존하고 프로필 해금 변경 후 원정 고정값 불변.
- 자연 획득한 운영 카드의 production 사용 여부는 `TEST_REPORT_0.4.md`에서 별도로 보고한다. 지정 카드 fixture를 자연 획득으로 부르지 않는다.

운영 카드는 lexeme/POS/baseScore/formId가 없다. 조합대 ADD/드래그/SWAP/SET_FORM 입구를 막고, 오염 snapshot은 조용히 strip하지 않는다. 문법·룬 단어 수·도감 실적에 들어가지 않는다. 강화/반복 사용은 제공하지 않으며 무료 카드를 원정 중 생성하지 않는다.

외부 보상 확률 및 첫 카드·첫 룬·지역 보호 슬롯은 유지한다. 20%는 고급/희귀 GENERAL/WILDCARD의 내부 후보 분기이며 팝업당 최대 1개다. 모든 보상 슬롯의 20%라는 뜻이 아니다. 각 상점의 연마/제거 사용 기록은 독립적이고 유료 제거 가격 증가만 원정 전체에 누적한다.
