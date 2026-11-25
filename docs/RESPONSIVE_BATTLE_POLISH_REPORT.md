# 반응형 전투 UI 폴리싱 — 2026-11-26

기준은 작업 시작 시 fetch한 `origin/main@ca43cb371c17e12669163da3cd7699406ddc941b`이다. PR #40과 후속 폭 보정 `0380b2f`를 포함하며, 시작 작업 트리는 깨끗했다. 브랜치는 `codex/responsive-battle-ui-polish`. 첨부 `Syntax_Atlas_Responsive_Battle_UI_Polish_Spec_20261125.txt`를 적용했다.

## 변경

- 태블릿의 점수 빈 공간·손패 상단 여백을 줄이고, 가시 높이에 따라 연속적으로 공간을 배분한다. 이름·HP는 고정하고 긴 보스 상태만 별도로 스크롤한다.
- 열 수는 안정적인 창 너비와 터치 입력으로 정한다. 정상 태블릿은 12열, 좁은 분할 창과 일반 휴대폰은 8열이다. **720px 미만은 명세 §6.1의 읽기 하한 예외로 6열**이다. 24단어 한도·순서는 그대로이며 마지막 행은 기존 스크롤/화살표로 접근한다. 높이 변화만으로 열 수·손패 페이지를 바꾸지 않는다.
- 실제 글꼴 폭을 측정·캐시하여 단어별 크기를 맞춘다. 가로 맞춤 하한 0.8은 조정 시작값이며, 불가능한 폭은 `data-word-fit-readable=false`로 구분한다. 폰트·철자·품사색은 유지한다.
- 체크(폰32/패드36px), 형태(폰28/패드30px), 버리기(폰30/패드32px), 룬 순서(30px)의 실제 누름 영역을 확보한다. 룬 아래에 내용이 남을 때만 화살표를 표시한다.
- 너비 변경 시 보던 손패 카드 ID를 가능한 한 같은 페이지에 유지한다. 드래그 복사본은 원본의 표시 기하를 복사하며 기존 좌표·offset·명령 경로를 유지한다.

변경은 `src/ui/`와 관련 검사·이 보고서에 한정했다. `src/game`, `src/engine`, `src/data`, `src/services`, package/lockfile, 앱·원정·언어·저장 정책, 에셋·오디오·배포 workflow는 변경하지 않았다. PC 폴리싱은 기존 `data-portable=false` 범위에 남아 있다.

## 실측 비교

동일한 실물 카드 지정 상태를 HEAD 아카이브와 수정본에서 비교했다. 자연 원정이나 실기기 결과가 아니다. 수정 전 자료는 진단 과정의 혼합 작업본이 아닌 `.local-validation/portable-polish/before-head/`의 고정 HEAD 실행이다.

| 조건 | 수정 전 | 수정 후 |
|---|---:|---:|
| 1024×768 / 가시678 — 상단 무대 | 55px | 201.89px |
| 1024 / 가시640→639 — 상단 무대 | 17→102px | 179.81→179.25px |
| 1024×600 / 가시510 — 앱 scrollHeight | 653px | 510px |
| 1024 / information·remember·necessary | 6.86 / 9.43 / 8.38px | 12 / 12 / 12px |
| 844×390 / 가시310 — 위 세 단어 | 10.66 / 14.66 / 13.03px | 12 / 12.9 / 13.8px, 8열 |
| 667×375 / 가시295 — 위 세 단어 | 8열 | 12 / 12.4 / 13.2px, 6열 |
| 대표 화면 손패 하단 | — | 선택 외곽 포함 8px |

1194×834→가시734, 915×412→가시312, 분할 창1008×432→가시352 및 높이700/678/650/640/639/620/복구도 검사했다. 실제 글자 경계가 카드 안에 있고, 기본 이름·HP·보너스·목표 문법·공격·턴 넘기기·버리기가 가시 영역에 있다. 골렘의 모바일 상태 스크롤은 32px이며 27px 높이의 마지막 부위를 읽을 수 있고 이름·HP 위치는 움직이지 않는다.

## 실제 실행

기존 폴더 내 Node24.19.0/npm11.17.0 및 lockfile의 Playwright1.51.1 Chromium을 사용했다. 브라우저 base는 `http://127.0.0.1:5174/`, 실행 증거는 `.local-validation/portable-polish/`에 별도 보존했다. 고정 출력인 과거 timing/reward-distribution 증거는 실행 뒤 원본으로 복원했다.

| 명령 | 종료 | 결과 |
|---|---:|---|
| `npm.cmd test` | 0 | 2,032 PASS, FAIL/SKIP 0 |
| `npm.cmd run build` | 0 | PASS; 기존 500kB chunk 경고 남음 |
| `node tests/portable-polish-browser.mjs` | 0 | A~E 집중 흐름 5 PASS |
| `node tests/portable-polish-browser.mjs --section=D` | 0 | 폰 손패·태블릿 조합대 드래그 복사본 기하 추가 확인 |
| `node tests/play-feedback015-browser.mjs --section=B-real-combat-first-tutorial --no-captures` | 0 | PC·모바일 실제 실습 조작, 28장 복원·보상 확인 |
| `node tests/play-feedback015-browser.mjs --section=F-motion-abort-speed-effects-viewport --no-captures` | 0 | 카드 이동 취소·속도·효과 감소·viewport 회귀 PASS |
| `node tests/ui-feedback0141-browser.mjs --section=T6-mobile-visible-area-and-comma --no-captures` | 0 | 쉼표·24단어·마지막 행 접근 PASS |

실제 정상 `I go` 제출은 지정된 기존 전투에서 45피해(2500→2455), 턴·공격 각1회였다. 중복 FINISH_PRESENTATION은 거절되고 상태가 동일했다. 전체화면 실패 확인은 브라우저 API 거절을 지정한 검사이며 실기기 전체화면 성공 결과가 아니다.

기대값 변경 이유: 좁은 touch 창의 8열 분류, 28px 형태 버튼을 유지하기 위한 내부 스크롤, 720px 미만 6열 예외를 단위 검사에 반영했다. 기존 panorama 검사의 보스 상태 scroll 대상은 `.enemy-info`에서 `.enemy-mechanics`로 옮겼고 마지막 부위 접근·경계 assertion은 보존했다. 해당 옛 panorama 파일 전체는 이번에 재실행하지 않았으며, 새 집중 검사 E에서 현재 경로를 실행했다. 개발 중 발견한 clamp() 문자열 측정, HP 아래 기믹 공간 부족은 최종본에서 수정했다. 진단 실패 로그는 로컬에 남아 있다.

## AC 결과

PASS는 아래 자동화/지정 상태 범위에 한정한다. 실제 기기 결과로 해석하지 않는다.

| 조건 | 결과 | 근거 |
|---|---|---|
| AC01 | PASS | A: 태블릿12열·상태/룬·손패 |
| AC02 | PASS | A/E: 가시678 기본 HUD, 골렘 |
| AC03 | PASS | A: 650/640/639/620 연속 기하·앱 높이 |
| AC04 | PASS | A: 가시310 버튼·손패 실측 |
| AC05 | PASS | C: 좌우24/하단8 safe-area와 top6/left3 offset |
| AC06 | PASS | A: 세 긴 단어 실제 글꼴·경계, 좁은6열 예외 |
| AC07 | PASS | B: 1/8/9/12/16/24 실물 카드 순서 |
| AC08 | PASS | B/D/T6: 24단어+쉼표 마지막 형태 버튼 |
| AC09 | PASS | B: 손패0/1/10/14, 고정 영역·하단8px |
| AC10 | PASS | B/D: 선택과 배치 분리, 실제 탭·형태 조작 |
| AC11 | PASS | B/E: 실제 버튼 경계·탭 적중·상태 스크롤 |
| AC12 | PASS | B: 룬0/1/3, 상세·실제 순서 변경·잠금 유지 |
| AC13 | PASS | 기존 B 실습 검사: PC/844 화면의 실제 대상 조작 |
| AC14 | PASS | A/B/C: 높이 변경 전후 상태·선택·페이지 비교 |
| AC15 | PASS | D: 너비 전환 뒤 기존 카드 anchor·선택 |
| AC16 | PASS | D: 드래그 중 resize 취소 후 다음 탭 |
| AC17 | PASS | D/기존 F: 공격1회, 중복 완료 거절·이동 cleanup |
| AC18 | PASS | B/C/E: 형태·사전 검색/모의 키보드·설정·목표·닫기 |
| AC19 | PASS | A: 가시 높이 축소/복구·640 경계 측정 |
| AC20 | PASS | A/D: 1008px분할/667px/태블릿 분류 |
| AC21 | PASS | D: 지정 API 거절 뒤 현재 화면 조작 |
| AC22 | PASS | C: PC1440×900/1280×720 경계·12열·하단 |
| AC23 | PASS | 전체 단위 회귀, 상태/RNG 비교, 엔진·저장 무수정 |
| AC24 | PASS | 필수 test/build와 집중 검사, 아래 미실행 분리 |

**NOT RUN:** iPad/iPhone/Android 실제 터치·주소창·키보드·청취·전체화면, 전 브라우저 순회, 자연50전투 완주. 로컬 `validate:data` 및 전체 공식 browser 묶음은 이번 UI 범위에서 추가 실행하지 않았다. 극단적으로 더 좁거나 낮은 창은 기존 앱/내부 스크롤 fallback을 유지하며 이번 대표군 밖의 실측은 하지 않았다. 픽셀·색감 미세 조정은 사용자 피드백 대상으로 남긴다.

## 대표 화면과 증거

| 화면 | 수정 전 | 수정 후 |
|---|---|---|
| 태블릿 가시678 | [캡처](evidence-responsive-battle/tablet-before.png) | [캡처](evidence-responsive-battle/tablet-after.png) |
| 휴대폰 가시310 | [캡처](evidence-responsive-battle/phone-before.png) | [캡처](evidence-responsive-battle/phone-after.png) |

[667px / 6열](evidence-responsive-battle/narrow-after.png) · [실제 측정 결과](evidence-responsive-battle/measurements.json). 대표 5장은 실제로 열어 가독성·잘림을 확인했다.

main 병합·자동 병합·Pages 설정 변경·공개 배포는 수행하지 않는다. PR에서는 기존 workflow의 검증만 실행되고 배포 job은 제외된다.
