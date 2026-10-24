# PreBoss UI v2 — 0.10.4 (2026-10-24)

기준 main `056ee5e02f2658d939cdda9a61dcb884b74abb9b` (PR19 병합), 시작 작업 트리 clean. 브랜치 `codex/preboss-ui-polish`. [사용자 명세](../spec/preboss-ui/Syntax_Atlas_PreBoss_UI_Patch_v2.md).

- 손패 WORD 본문만 grid로 중앙정렬. 외곽 크기·글자 크기·조합대 유지. 하단은 기존 padding을 `max(8px, safe-area)`로 대체.
- 지역 입장은 기존 테마 배경·제목·한 줄 소개·하단 진행으로 단순화. 필수 무료 카드 선택은 진행 버튼의 선택창으로 유지하며 새 상태/방문을 만들지 않는다. 기존 `renderBetween` 전투 전 안내는 유지.
- 상점 상품 패널의 높이 늘이기 제거, 정보/가격/구매를 묶고 서비스와 하단 나가기 분리. 기존 상품·효과·가격은 그대로.
- UI·알림·오류의 화폐 이름을 골드로 통일. 과거 저장의 안내 문자열은 표시할 때만 변환. 내부 gold·계산·저장 구조는 그대로.
- 공통 `--pronoun`만 #3979BC로 변경. 명사 #6AA5D4 / 동사 #D56E65 / 한정사 #B09BC1 유지. 사전 품사 표식도 공통 변수를 참조한다. 카드/드래그/미리보기는 공통 품사 스타일을 그대로 사용한다.
- 앱/package 0.10.4, 원정/저장 정책 0.10.2 유지. lockfile 루트 버전 2곳만 변경, 의존성·게임 규칙·47전투 변경 없음.

## 실제 확인
| 실행 | 결과 |
|---|---|
| `npm.cmd test` | PASS 1723/1723, exit 0, 최종본 1회 (54.0초) |
| `npm.cmd run build` | PASS, exit 0, 최종본 1회. 117 modules, 500kB chunk 경고 유지 |
| `node tests/preboss-ui-browser.mjs` | 대표 UI 확인. PC 1366×768 / 태블릿 가로 1180×820 에뮬레이션, fullscreen 왕복, 손패 선택·페이지, 품사색·사전, 일반 입장 |
| `SB_SHOP_ONLY=1 node tests/preboss-ui-browser.mjs` | 최종 상점 구간 PASS, exit 0, 오류 0. 필수 연결어 선택/취소·재표시, 실제 저장 복원 성공, 구매·골드 차감 1회, 상품/RNG/지급 보존, 나가기/다음 전투 안내 |

총 8개 고유 UI 항목 확인(5개 앞 구간 + 보완 후 상점 3개). 지정 상태에서 실제 UI와 Controller를 사용했으며 자연 원정/실기기 결과가 아니다. 카드 외곽 높이 120px, 본문 중앙 오차 <1px, 하단 영역 8px을 측정했다. 구매 결과는 실제 표시 잔액과 일치하며 상품 재표시로 지급이나 RNG가 바뀌지 않았다.

처음 저장 복원 확인은 반환값을 명시적으로 검사하지 않아 성공 근거에서 제외했다. 좁은 후속 확인에서 테스트 지정 상태의 이전 지역 완료·상점 이력 누락이 발견됐고, 실제 이전 상점 생성/종료 이력을 갖추도록 **테스트만** 보완했다. 저장 validator/assertion을 완화하지 않았다. 수정한 상점 구간만 재실행했으며 UI 앞 구간과 전체 단위/빌드를 반복하지 않았다.

로컬 원본: `.local-validation/preboss-ui/`, `.local-validation/preboss-shop-final/`, `.local-validation/preboss-shop-complete/`, `.local-validation/v0101/preboss-final-unit/`, `.local-validation/v0101/preboss-final-build/`. 과거 timing/reward-distribution 증거는 이번 출력 보관 후 복원했다. `src/`의 남은 ‘재화’는 옛 문자열을 골드로 표시하는 변환 입력 1곳뿐이다.

[전투 PC](preboss-ui/battle-pc.png) · [지역 입장](preboss-ui/region-entry.png) · [상점 태블릿](preboss-ui/shop-tablet.png)

NOT RUN: 전체 원정, 다수 seed, 전체 browser 묶음/교차 브라우저/실물 기기, production UI 완주, 별도 데이터 검사·벤치마크. 도감 자체에는 별도 품사색 표현이 없어 새 품사 UI를 추가하지 않았다. 수로도시 선택창은 기존 콜백을 유지했지만 이번에 직접 실행하지 않았다. 기존 1160px 미만 가로 스크롤과 미세한 간격은 사용자 피드백 대상으로 남는다. main/auto-merge/Pages 설정/공개 배포는 변경하지 않는다.
