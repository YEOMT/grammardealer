# 0.1.1 UI 캡처 안내

실제 게임 조작과 격리된 fixture를 구분한다. PNG는 `docs/evidence-0.1.1/`에 있다. 처음 기준 실행과 패치 이후 실행으로 직접 생성했으며 과거 보고서의 이미지를 새 결과로 복사하지 않았다.

| 장면 | 파일 | 성격 |
|---|---|---|
| 변경 전 로비/전투/교환 | before-lobby.png / before-combat.png / before-exchange.png | 실제0.1 새 기준 실행 |
| 체크 선택 손패 | after-select-first.png | 실제 원정 |
| be 형태 메뉴 | after-be-form-menu.png | 실제 원정 |
| 첫 공격 직전 설명 | tutorial-before-submit.png | 실제 형태변경/교환/준비 후, 아직 미커밋 |
| 혼합 보상·턴보너스 | mixed-reward-turn-bonus.png | 실제 생성기/Controller로 만든 격리 승리 fixture |
| 연마 대상·확정 결과 | polish-target.png / polish-confirmed-result.png | 대상은 fixture, 확정 모달은 실제 앱 저장 로드 후 처리 |
| 도감 의미 참고 | records-meaning.png / sentence-codex-1024-final.png | 실제 공격/오프라인 완주 기록 |
| 루비·사파이어·고연쇄 빛 이동 | ruby-rune-flight.png / sapphire-rune-flight.png / high-combo-rune-flight.png | 실제 분석·점수의 격리 renderer fixture, 이미지에 표시 |
| 기본 전체 화면 | ui-1366-edit.png / ui-1920-edit.png / ui-1180-edit.png / ui-1024-edit.png | 실제 원정 |
| 최대 16문장·10손패 | ui-capacity-1024-synthetic.png 및 다른 해상도 | UI capacity fixture |
| 최대 16문장·14손패·3룬 | capacity-14-1024.png 및 1180/1366/1920 | 확장 손패는 가로 스크롤, UI fixture |
| touch 가로 | ui-touch-1024.png | Chromium touch emulation, 실제 iPad 아님 |
| 3전투 완료 | stage1-complete.png / stage1-complete-1024-final.png | production 빌드 실제 오프라인6공격 완주 |
| 저장·첫 룬·효과 감소 | save-slot-1/2-1024-final.png / first-rune-choice-1024-final.png / muted-reduced-effects-1024-final.png | 실제 production UI |

위 원본 해상도 캡처를 직접 열어 확인한다. 실패 주입용 storage 화면은 자동 복구 검사용이며 실제 사용자 저장 손상 사례라는 뜻이 아니다.
