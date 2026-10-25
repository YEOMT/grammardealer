# 0.11 표시 문구·상점 순서 패치 결과

- 기준: 작업 시작 최신 `origin/main` = `b12a76183ed2e57baa2b28b334758e4f6266f67a` (PR #21 병합). 시작 작업 트리는 깨끗했으며 사용자 변경을 삭제하지 않았다.
- 브랜치: `codex/v0.11-text-shop-flow`.
- 계약: 사용자 제공 `Syntax_Atlas_0.11_Text_ShopFlow_Handoff.zip`의 Patch.md 및 START.txt.

## 적용

16개 몬스터 표시명과 최종 지역·세 보스 한글 표시를 UI 별칭으로 적용했다. #7 항구 수문장과 #35 물시계 자동인형은 그대로이며 #33은 청동 항아리다. 저장된 encounter의 원래 이름·ID·HP는 수정하지 않는다. 로비는 Syntax Atlas, 지정 소개 문장, FIFTY BATTLES/총 50전투를 표시한다.

새 원정만 `config.shopFlowPolicy = BOSS_REWARD_FIRST_V1`을 기록한다. #3/#12/#22/#32/#42/#47의 보상 확정 뒤 기존 다음 지역 상점 준비로 이동한다. Stage 4/8 선택은 상점 준비 화면에서 기존 선택 명령으로 처리한다. 상점 종료 후 지역 소개를 보여주고, 입장 버튼에서 첫 전투와 덱 셔플을 시작한다. 나머지 지역 경계와 #48→49→50은 기존 정책을 유지한다.

정책 필드가 없는 진행 중 저장(기존 0.11 포함)은 기존 지역 클리어→소개→상점→전투 순서를 유지한다. 상점 상품 생성·가격·입장 지급·보상 계산은 기존 코드를 재사용한다. 상점 이후 소개도 안전 저장 지점으로 허용했다. 문법·룬·HP·전투 수·UI 배치/CSS·이미지·의존성·lockfile·배포 workflow는 변경하지 않았다.

## 실제 실행 (2026-10-25)

| 검사 | 결과 |
| --- | --- |
| `node --test tests/text-shop-flow.test.js` | PASS, 9개 |
| `npm.cmd test` | PASS, 1,812개 / 실패 0 / skip 0, 종료 0 |
| `npm.cmd run build` | PASS, 종료 0. 500 kB 초과 번들 경고만 있음 |
| `node tests/text-shop-browser.mjs` | PASS, Chromium production `/grammardealer/`, 로비 + 4개 전환 경로, JS 오류 0 |
| `git diff --check` | PASS |

집중 검사는 여섯 상점 경계의 구/신 흐름 간 상품·가격·RNG·카드·입장 지급·골드 및 첫 전투 상태를 대조했다. 구매/보상 선택/중복 명령/상점 종료 중복/저장 재개도 검사했다. 기존 테스트 assertion은 변경하지 않았다. 역사적 fixture 두 곳은 새 원정의 정책 표식을 제거해 기존 저장 경계 검사를 그대로 유지한다.

브라우저는 지정 보스 보상 상태에서 실제 버튼을 눌러 #3→4, #12→13, #32→33, #47→48을 진행했다. Stage 4 연결어와 Stage 8 who 선택, 상점 종료 후 소개 화면 저장·불러오기, 첫 전투 진입을 확인했다. 1366×768 캡처 3장(로비, Stage 4 상점 준비, 최종 지역 소개)을 확인했다. 이는 지정 상태 전환 검증이며 자연 원정 완주 증거가 아니다.

로컬 증거: `.local-validation/v0101/text-shop-final-unit/`, `text-shop-final-build/`, `.local-validation/text-shop/production/`. 기존 고정 출력 `timing.json`, `reward-distribution.json`은 이번 결과를 별도 보존한 뒤 원본으로 복원했다. 원본 ZIP과 과거 증거를 보존했다.

## 범위와 한계

- NOT RUN: 전체 50전투 자연 완주, 대량 seed, 전체 브라우저/기기 조합, 독립 `validate:data` 명령. 이번 소규모 패치의 요청 범위 밖이다.
- 집중 구현 검증의 초기 실패는 지정 상태 fixture의 골렘 부위/보스 정산 기록 누락이었다. fixture를 유효하게 보완했고, 기록 검증 보스는 지정 QA 덱의 실제 공격으로 준비했다. 게임 판정이나 assertion을 완화하지 않았다.
- 남은 기능 실패 없음. 이미지·배경·몬스터 기믹 변경 없음. 전용 아트와 미세 폴리싱은 이번 범위 밖이다.
- branch push와 main 대상 PR만 수행한다. main 병합, 자동 병합, Pages 설정 변경, 공개 배포는 수행하지 않는다.
