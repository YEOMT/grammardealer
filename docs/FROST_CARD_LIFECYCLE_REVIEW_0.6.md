# 0.6 빙정 사본 수명과 저장 검토

`mirrorSnowfield.js`는 공급 목록, `frostCards.js`는 공급·가시성·파괴·정리·검증을 담당한다. 각 함수는 Controller가 소유한 다음 상태에만 적용된다. `RunController`가 상태를 커밋한다.

| 경계 | 실제 구현 |
|---|---|
| 공급 | runId/battleNumber/index로 ID 생성. `cardInstances`에는 생성하지만 `activeCardIds`에 넣지 않는다. `temporaryCardMeta`에 source/battleId/definition/결정 대상 여부를 고정한다. |
| 첫 손패 | 기존 deck stream shuffle 뒤 안정적인 swap. 가능하면 기존 문장 witness 외 카드를 먼저 바꾼다. 일반전 1장·보스 2장과 다음 세 draw 창을 보정하고 trace로 남긴다. |
| 이동 | 일반 WORD의 클릭·드래그·교환·재셔플·운영 draw를 그대로 쓴다. 손패/문장 한도를 소비한다. |
| 제출 | 판정이 INVALID_CORE여도 제출한 임시 사본을 `shatteredTemporaryIds`로 옮긴다. 일반 discard에는 넣지 않는다. 회수/교환은 파괴하지 않는다. |
| 종료 | 승리 보상 생성 전 또는 패배 커밋 전에 임시 사본과 모든 pile 참조를 제거한다. 파괴 이력과 공격 스냅샷은 기록이며 소유 사본이 아니다. |
| 저장 | 현재 partition과 RNG를 그대로 직렬화한다. 로드에서 공급·섞기·복구를 다시 실행하지 않는다. |

영구 카드는 기존 영역과 exhausted에, 임시 카드는 일반 영역 또는 shattered에 정확히 한 번 존재해야 한다. 두 집합의 겹침·ID 중복·정의/전투 불일치·누락·외부 사본을 검증에서 거절한다. 지원용 the/to/good은 임시 WORD지만 결정 대상이 아니다. 지원 good은 영구 덱에 정도 표현에 쓸 수 있는 형용사/부사가 없을 때만 추가한다.

빙정 단어는 원정 사전의 만난 단어로 남을 수 있다. 영구 보유 장수와 보상/연마/제거 서비스 대상은 `activeCardIds` 기준이다. draw/discard 화면에는 임시 표기와 영구 보유 수를 별도로 표시한다. 임시 사본이 있다는 이유로 보상 중복 필터나 가격을 바꾸지 않는다.

`v06-frost.test.js`는 F001–F020의 기대 내용을 실제 Controller/순수 pile 함수로 검사한다. `v06-policies.test.js`는 fallback·RNG·상점 경계를 추가 검사한다. 브라우저의 지정 상태 검사는 실제 카드 입력과 IndexedDB를 사용하지만 자연 원정 완주와 구분한다. 최종 종료 코드와 캡처는 TEST_REPORT를 따른다.

설원 접근성 선택: 새 Stage 6에서만 기존 createBattlePiles의 focusFrame을 frame.svc.adj로 요청한다. 현재 덱에 가능한 실제 문장 witness가 있으면 우선하고, 없으면 기존 다른 문형 fallback을 따른다. 이는 고정 문장/카드 생성이 아니며 조합대는 비어 있다. 이후 빙정 swap은 그 witness를 가능한 한 보존한다. Stage 1–5와 기존 원정은 이 경로에 들어가지 않는다. 비교 표지만 빨리 나오고 실제 형용사 서술 재료가 6턴 범위 밖에 남는 접근성 문제에 대한 구현 선택이며, 명세의 HP/피해/공급 수량을 변경하지 않는다.
