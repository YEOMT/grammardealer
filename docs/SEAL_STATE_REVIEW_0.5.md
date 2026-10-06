# 0.5 진행·봉인 상태 검토

검토일: 2026-10-06. 구현 기준: 작업 시작 `origin/main`의 0.4 소스. 수치 출처는 `spec/0.5_WISH_DESERT.md`이며 아래의 단위·지정 상태 검사는 자연 드로우 완주나 사람 승률 자료가 아니다. production UI와 전체 회귀의 최종 결과는 `TEST_REPORT_0.5.md`를 따른다.

## 진행과 기존 계약

- `stage5.js`의 전역 18~22번은 별길 낙타 520 → 금빛 전갈 560 → 별꽃 선인장 600 → 신기루 여우 640 → 소원의 스핑크스 840이다. HP는 명세의 구현 초깃값이다. 스핑크스에 피해 감쇠·문법 면역·최소 타격 횟수를 추가하지 않았다.
- 0.5의 `STAGE4_CLEAR`는 문지기 승리 확정 때 한 번 기록한다. 원정의 `pack.infinitive`, `pack.gerund`, `pack.svoc.basic` 해금을 먼저 적용한 뒤 기존 보상을 생성한다. 보상 이후 `STAGE_CLEAR → STAGE_INTRO → ENTER_STAGE → BATTLE`로 이어진다.
- Stage 5 입장은 실제 소유 WORD의 `to`, `want/need`, `like/enjoy/finish` 세 능력을 각각 확인한다. 없을 때만 `to`, `want`, `enjoy`를 최대 세 장 지급하며 ID·사유·vocabulary를 함께 기록한다. `need + ing`는 이 입문 보장의 대표가 아니다. RNG를 쓰거나 제거한 지급을 다시 만들지 않는다.
- 상점은 Stage 2·4의 두 번 그대로다. Stage 5는 두 번째 상점 기록을 보존하고 재방문하지 않는다. `STAGE5_CLEAR`와 최종 `STAGE5_END`는 전체 스토리 완료·새 룬 슬롯·새 난이도 해금으로 취급하지 않는다.
- 0.4 이하의 저장은 원래 종료 경계·언어·점수·상점·보상으로 실행한다. 기존 0.4 완료 사건의 시점도 유지한다. 새 0.5 원정만 명시적인 `stage4CompletedRunIds`에서 세 팩을 가져오며 최고 위력·닉네임·최고 지역 숫자로 추측하지 않는다. 이미 진행 중인 원정의 해금 snapshot은 다른 슬롯의 완료로 바뀌지 않는다.
- 시작 생성기는 검증된 `0.4.0`을 재사용한다. 시작 후보를 확인하는 어휘 참조도 frozen 0.4 view에 고정하여 새 Frame 추가가 28장 구성이나 RNG를 바꾸지 않게 했다. 언어·게임 버전과 생성기 버전은 구분된다.

## 봉인 거래

| 경계 | 실제 구현 |
|---|---|
| 상태 소유 | `RunController`만 현재 상태를 교체한다. `applyTurnHandSeal`은 controller가 복사한 제안 상태만 변경한다. |
| 호출 지점 | `_beginBattle`의 첫 손패 완성 후, `_advanceTurn`의 실제 3장 드로우 후. 일반 적에서는 아무것도 하지 않는다. |
| 후보 | `activeCardIds`의 소유 순서로 현재 HAND WORD를 필터링한다. DOM·로케일·임의 runId 정렬을 사용하지 않는다. 기존 조합대와 OPERATION을 제외한다. |
| 직전 회피 | 후보가 두 장 이상일 때 직전 봉인 물리 ID를 제외한다. 한 장만 있으면 같은 사본을 선택할 수 있다. |
| RNG | 후보가 있으면 기존 `pick(rng.encounter, candidates)` 한 번. 없으면 null·0회. deck/reward/shop 스트림을 사용하지 않는다. |
| 멱등성 | `<battle-id>:<turn-index>`가 이미 적용되었으면 상태와 RNG를 그대로 반환한다. |
| 배치 guard | `ADD_CARD`, `SWAP_CARDS` 공통 검사와 커밋 불변검사가 실제 ID를 차단한다. UI 클릭·키보드·드래그·맞교환은 이 명령을 사용한다. |
| 허용 행동 | 버리기 선택·교환·형태·룬·기존 조합대·보급·탐색. 이 중 어떤 것도 봉인을 재추첨하지 않는다. |
| 교환 뒤 | 봉인 ID가 DISCARD/DRAW로 옮겨도 해당 턴의 제한은 유지한다. 보급·재셔플·탐색으로 같은 사본이 HAND로 돌아와도 배치할 수 없다. 다른 사본은 허용한다. |
| Undo | 편집 기록에는 HAND와 문장 슬롯만 있다. 교환·운영·실제 턴 경계 뒤에는 해당 편집 기록을 지운다. PREPARE/EXCHANGE의 Undo 초기화는 제안 상태 커밋 성공 뒤에만 적용한다. |
| 종료 | 승리·마지막 준비 패배에는 다음 드로우/추첨이 없다. `isTurnSealed`는 실제 BATTLE·생존 적에만 활성이다. 다른 전투·새 원정에는 제한이 남지 않는다. |
| 기술 실패 | 드로우·봉인 뒤 고의 커밋 오류를 넣어 원래 카드·턴·네 RNG·Undo가 그대로임을 확인한다. |

봉인은 여섯 번째 카드 영역이 아니다. 실제 사본의 DRAW/HAND/SENTENCE/DISCARD/EXHAUSTED 보존 계약은 그대로 유지한다.

## 저장 검토

`enemyState.bossMechanic`에는 ID, 현재/직전 봉인 사본, 적용 턴, sequence, 마지막 턴 key, 작은 history만 저장한다. history는 최대 6턴이며 후보·선택·encounter cursor 전후를 남긴다. DOM, 타이머, Promise는 저장하지 않는다.

저장/커밋 검사는 실제 0.5 스핑크스 전투, 현재 턴, 연속 history, 후보의 소유 WORD 여부와 순서, 선택이 후보에 포함되는지, 정확한 RNG 소비, 동일 턴 중복·미래 턴·조합대 침입을 확인한다. 활성 봉인 ID가 HAND 밖의 DISCARD/DRAW에 있는 것은 정상이다. 전투가 끝난 뒤 보상으로 후보 카드를 제거한 경우에는 그 전투의 확정된 REMOVE receipt에 있는 정확한 ID만 은퇴한 기록으로 허용한다. 전투 중 모르는 ID·운영 카드 ID는 거절한다.

기존 안전 저장 정책을 늘리지 않았다. 첫 봉인 직후와 기존에 허용하던 빈 조합대 EDIT 안전 지점에서 선택·턴 key·encounter cursor를 함께 저장한다. 불러오기는 helper를 다시 호출하지 않는다. serializer roundtrip과 실제 IndexedDB UI 검사는 별개다.

## 실행 근거와 fixture 해석

- `tests/v05-seal.test.js`: B001~B026 각각에 실행 테스트가 있다. 첫 후보/RNG 다섯 사례는 실제 helper와 기존 RNG를 사용하는 지정 모델이다. 고정 실수 `draw`는 같은 선택 bucket을 내는 실제 seed로 대응한다. 나머지는 실제 Controller에 검증된 스핑크스 시작 상태·필요한 운영 사본을 지정해 명령을 수행한다.
- B016 등의 작은 계약 JSON은 `turn=2, turnsRemaining=4` 같은 추상 상태를 포함한다. 실제 6턴 Controller 검사는 유효한 턴 경계로 시작하고 **1턴 소모·0피해·실제 카드 소비·한 번의 다음 봉인**을 확인한다. JSON의 명명용 `w1`이나 임의 cursor 숫자를 실제 원정의 ID·cursor로 바꿨으며 원본 JSON을 수정하지 않았다.
- 추가 두 검사는 형태·룬·Undo·이전 callback과 이미 조합대에 둔 카드, 동일 seed/행동의 후보 위치와 RNG 재현을 확인한다.
- `tests/v05-progression.test.js`: 지정 물리 카드/+3·실제 Parser/Scoring/Controller로 22 경계·2상점·기존 골렘/문지기·최종 완료를 검사한다. HP를 낮추지 않았다. 입장 24 능력 조합, 지급 중복 ID 원자성, 손상 저장, 새 원정 해금 snapshot, 4모드 시작 구성, 기존 0.4 경계도 확인한다.
- 기존 `v04-progression`, `v04-boundaries`, `helpers/sky-state`는 `legacy-04-controller`를 사용해 원래 버전의 기대값을 유지한다. 기존 assertion을 삭제하거나 기대값을 22전투로 바꾸지 않았다.
- 개발 중 새 progression 테스트의 여분 괄호와 `rulesSnapshot` 기대 객체에 빠뜨린 기존 정책 필드를 바로잡았다. 게임 자원이나 기존 검사 기준의 변경이 아니다. 최초 실패 로그와 재실행 로그를 `.local-validation/v05/`에 보존한다.

별도 검사 없이 실제 기기·다른 브라우저 엔진·교사 검수가 완료되었다고 표시하지 않는다. UI 배치·실제 production 완주·네트워크 차단 지속 플레이의 결과는 최종 검증 보고서의 해당 증거를 참조한다.
