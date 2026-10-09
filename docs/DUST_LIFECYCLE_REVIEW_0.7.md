# 검은 먼지 수명·저장 검토

| 경계 | 구현 및 검증 위치 |
|---|---|
| 생성 | `emberDust.createDustSupply`: 0.7 Stage7에서만 일반2/보스5, run/battle/index에 귀속한 ID. 중복 생성 거절. activeCardIds와 별도 partition. |
| 첫 패 | 기존 deck shuffle 후 안정적인 swap. WORD witness와 모든 사본을 보존하고 첫 패 먼지를 최대1로 제한. 대체 카드가 없는 합성 소형 덱에서는 짧은 패를 유지. RNG 추가 소비 없음. |
| 조작 | RunController ADD_CARD/SET_FORM/SWAP_CARDS/USE_OPERATION 거절. UI의 이동/드래그/형태/사용 대상에서도 제외. 교환 선택은 정상 비용과 실제 사본 이동을 사용. |
| 운영 | operationResolution의 ALL은 먼지를 포함. WORD 및 품사 필터는 명시적으로 WORD만 선택. 재사용 source는 효과 해결 후 discard. |
| 재셔플 | 일반 pile 순환을 그대로 사용. 먼지를 조용히 제거하거나 매 턴 새로 생성하지 않음. |
| 종료 | 승리·패배 시 HAND/DRAW/DISCARD와 instances에서 제거. 공급/정리 trace는 보존하여 종료 후 운영 영수증의 먼지 snapshot을 검증. |
| 저장 | temporaryCards dispatcher가 EMBER_CAVE와 MIRROR_SNOWFIELD를 분리. 수량/ID/source/pile/강화/위조를 검증하고 arbitrary temporary를 허용하지 않음. |
| 보스 | 원본 문법 formUses와 실제 제출 카드에서 정상 ING/PP를 확인. 상태 제안은 순수 함수, 커밋은 RunController. 저장의 해제 기록은 해당 공격 snapshot을 다시 분석해 대조. |
| UI | 영구 보유 수에 더하지 않음. 현재 전투 먼지 수는 별도 표시. 회색 바탕, 전투 한정/교환 가능 표시, 최소44px 선택 버튼. |

주요 실행 검사는 `tests/v07-dust.test.js`, `tests/v07-boundaries.test.js`, `tests/ember-browser.mjs`, `tools/simulate-ember-decks.js`입니다. 지정 상태의 카드 분포와 HP 경계는 ASSIGNED 검사이며 자연 원정 성공으로 집계하지 않습니다. 실제 명령 결과와 production UI 결과는 검증 보고서에서 별도로 집계합니다.
