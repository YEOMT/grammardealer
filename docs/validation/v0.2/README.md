# 0.2 선별 실행 증거

2026-10-04에 새로 실행한 결과다. 상세 명령·환경·한계는 [TEST_REPORT_0.2](../../TEST_REPORT_0.2.md)를 따른다. 원시 로그와 중복 캡처는 로컬 `.local-validation/v02/`에 보관하고 이 폴더에는 검토에 필요한 자료만 선택했다. 실제 사용자 저장은 사용하지 않았다.

- `summary.json`: 실제 명령/시간/종료 코드, 검사 집계, production asset SHA256.
- `seed-results.json`: LEARNING/SV_ONLY의 160원정 전체. 실패 시드도 포함하며 사람이 플레이한 승률로 해석하지 않는다.
- `entry-results.json`: 실제 Controller로 초원을 통과한 400개의 입장/구매/복원/드로우 표본.
- `browser-results.json`: 기존·새 UI 검사와 두 production 7전투 검사의 개별 assertion. 과거 명세의 P 번호와 0.2의 P 번호는 구분한다.

`actual-*`는 production 빌드의 실제 새 원정이다. `fixture-*`는 테스트가 조성한 합성 UI 경계 상태이며 완주·경제·승률 증거가 아니다. 캡처의 재화100 등의 합성 값은 실제 플레이에 지급하지 않았다.

| 캡처 | 성격과 확인 내용 |
| --- | --- |
| [actual-stage2-preview](actual-stage2-preview.png) | 실제 초원 완료 뒤 항구 소개와 공개 보스 규칙 |
| [actual-shop-purchase](actual-shop-purchase.png) | 실제 입장 재료와 구매 후 고정 상점 |
| [actual-stage2-complete](actual-stage2-complete.png) | 실제23공격·7전투 완료, STAGE2_END |
| [actual-complete-restored](actual-complete-restored.png) | 위 완료 상태를 수동 슬롯에서 다시 불러옴 |
| [fixture-capacity-before](fixture-capacity-before.png) | 연마 배지가 있는16장·손패10장으로 재현한 수정 전1366 경계 |
| [fixture-capacity-1366](fixture-capacity-1366.png) | 수정 후 더 큰 손패14장·16장 모두+3,1366×768 |
| [fixture-capacity-1024](fixture-capacity-1024.png) | 같은 최대 상태1024×768 |
| [fixture-shop-polish](fixture-shop-polish.png) | 1024 연마 대상 선택·스크롤·취소 |
| [fixture-shop-remove](fixture-shop-remove.png) | 1024 제거 대상 선택·스크롤·취소 |
| [fixture-shop-rune-replacement](fixture-shop-rune-replacement.png) | 룬 만석 교체 대상과 취소 무손실 |
| [fixture-svoo-roles](fixture-svoo-roles.png) | 실제 파서/점수 결과를 재생한 IO/DO 전체 NP 점등 |
| [fixture-topaz-flight](fixture-topaz-flight.png) | 토파즈 색상 이동과 순서 |
| [fixture-veil-before-impact](fixture-veil-before-impact.png) | 장막은 해제됐지만 HP는 타격 전640을 유지 |

수정 전/후 캡처는 물리 카드가 모두 같은 상태인 이미지 비교 fixture가 아니다. 수정 전 손패10장 문제를 재현하고, 수정 후 손패10/14장 모두 기하 assertion으로 검사한 가운데14장 대표 캡처를 선택했다. 버튼이나 글자를 축소하거나 카드를 잘라 문제를 숨기지 않았다.
