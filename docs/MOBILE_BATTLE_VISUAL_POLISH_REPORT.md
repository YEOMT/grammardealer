# 모바일 전투 UI 폴리싱 — 2026-11-26

시작 시 로컬 main 참조는 `ca43cb371c17e12669163da3cd7699406ddc941b`였으며, PR #41의 완료 작업 `408f977ed8b70ceceecfd71be3a3b68a1dac2d97`을 보존하여 `codex/mobile-battle-visual-polish`에서 이어서 작업했다. 원격 재확인으로 PR #41 병합을 확인했고, 최신 main `6a54a9f7d8f051b10e3c6c62f262f8bce4d307d3`과 기준 소스의 Git tree가 동일함을 비교한 뒤 개발 브랜치만 fast-forward했다. 시작 작업 트리는 깨끗했고 진행 중 수정도 그대로 보존했다. 사용자 모바일 시안은 비율·정렬 참고로만 사용했다.

## 변경

- 모바일 손패 정보행을 30→16px로 줄여 상단 무대에 14px를 확보했다. 실물 카드 88×76px, 폰트·품사색·선택 영역과 하단 8px는 유지했다.
- 지역 안내와 HP 패널의 폭·간격·대비, 조합대 테두리와 공격 버튼을 정돈했다. 몬스터·배경 에셋과 크기 안전 정책은 그대로다.
- 룬은 번호·보석·이름·레벨의 작은 행으로 표시한다. 번호 ↕ 버튼을 누르면 기존 순서 ▲▼/드래그 조작이 펼쳐지고, 이름은 기존 상세창을 연다. 봉인·잠금·희귀 운석 보석 표시를 유지했다.
- 버리기를 오른쪽 별도 공간에 두고 뽑을 카드·버린 카드와 페이지 화살표의 세로 중심을 맞췄다. 쉼표가 있는 손패도 같은 열 배분을 사용한다.

새 변경은 `src/ui/mobile.css`, `src/ui/commaTool.css`, `src/ui/runes.js`와 집중 검사·보고서·대표 증거뿐이다. 게임/문법/점수/덱/저장/RNG·오디오·에셋·package/lockfile·배포 workflow에는 변경이 없다. PC/태블릿은 기존 배치를 유지하며 앱/원정 버전도 바꾸지 않았다.

## 실측

동일한 실물 카드 지정 상태를 수정 전후 Chromium에서 비교했다. 자연 원정·실기기 결과가 아니다.

| 화면 | 상단 무대 전→후 | 손패 영역 전→후 | 카드 하단 여백 |
|---|---:|---:|---:|
| 844×390 / 가시390 | 109→123px | 107→93px | 8px |
| 844×390 / 가시310 | 60→74px | 107→93px | 8px |
| 667×375 / 가시295 | 54→68px | 107→93px | 8px |
| 태블릿1024×768 / 가시678 | 201.89px 동일 | 153px 동일 | 8px |
| PC1440×900 | 277px 동일 | 191px 동일 | 14px |

대표 PC/태블릿의 주요 패널·버튼·카드 경계와 폰트가 수정 전과 정확히 일치했다. 0/16/24장에서도 외곽 영역은 고정된다. 일반 휴대폰8열, 720px 미만6열 예외, PC/태블릿12열과 24단어 접근은 이전 작업 정책을 유지한다. 가시390에서는 룬3개가 동시에 보이며 가시310/295에서는 내부 스크롤로 나머지를 읽는다. 카드나 컨트롤을 축소해 모두 끼워 넣지는 않았다.

## 실행 결과

Node24.19.0/npm11.17.0 및 lockfile의 Playwright1.51.1 Chromium을 재사용했다. 브라우저는 로컬 Vite의 `http://127.0.0.1:5174/`에서 실행했다. 실행 로그는 `.local-validation/mobile-visual/`에 보존하며 고정 출력인 과거 Work timing/reward-distribution 증거는 실행 후 복원했다.

| 실제 명령 | 종료 | 결과 |
|---|---:|---|
| `npm.cmd test` | 0 | 최종본 2,032 PASS; FAIL/SKIP 0 |
| `npm.cmd run build` | 0 | PASS; 기존 500kB chunk 경고 유지 |
| `node tests/mobile-visual-polish-browser.mjs` | 0 | A~D 4묶음 PASS |
| `node tests/mobile-visual-polish-browser.mjs --section=D` | 0 | 최종 순서 접근성·희귀 다이아몬드 표시 PASS |
| `node tests/mobile-visual-polish-browser.mjs --section=C` | 0 | 저장소에 포함한 baseline으로 정상 공격·PC/태블릿 비교 PASS |
| `node tests/portable-polish-browser.mjs --section=B` | 0 | 카드 입력·형태·페이지·룬 순서·손패 고정 PASS |
| `node tests/portable-polish-browser.mjs --section=E` | 0 | 보스 이름/HP 고정·마지막 기믹 접근 PASS |
| `node tests/ui-feedback0141-browser.mjs --section=T6-mobile-visible-area-and-comma --no-captures` | 0 | 쉼표·24단어·마지막 행 접근 PASS |
| `node tests/play-feedback015-browser.mjs --section=B-real-combat-first-tutorial --no-captures` | 0 | PC/모바일 실제 실습2공격·28장 복원·보상 PASS |
| `node tests/play-feedback015-browser.mjs --section=F-motion-abort-speed-effects-viewport --no-captures` | 0 | 이동 취소·배속·효과 감소·viewport PASS |

새 검사는 지정한 실물 카드와 실제 Controller로 배치·회수·선택·페이지·드래그 취소·공격 정산·룬 순서 변경을 확인한다. 공격 도중 가시 높이를 바꿔도 피해·턴·공격은 각각 한 번만 반영되고 표시 레이어가 정리된다. PC/모바일 실습은 기존 실제 UI 흐름을 실행했다.

검사 경로 변경: 기존 portable B에서 모바일 룬 조작부를 펼친 뒤 기존 30px 경계와 순서 변경 assertion을 실행하도록 수정했다. 검사 삭제·skip·허용오차 완화는 없다. 최초 실습 B는 step13 대기에서 시간 초과(종료1)였으며, 코드를 동결하고 동일 조건을 수정 없이 재실행해 통과했다. 최초 원인은 확정하지 않았고 실패 보고서도 로컬 `tutorial/`에 보존했다. 표시 검토에서 찾은 순번 접근성·희귀 보석 문제는 최종 D 검사로 확인했다.

## 화면

| 조건 | 수정 전 | 수정 후 |
|---|---|---|
| 844×390 | [전](evidence-mobile-battle-visual/before-844x390-visible390.png) | [후](evidence-mobile-battle-visual/after-844x390-visible390.png) |
| 가시310 | [전](evidence-mobile-battle-visual/before-844x390-visible310.png) | [후](evidence-mobile-battle-visual/after-844x390-visible310.png) |

[좁은667px](evidence-mobile-battle-visual/after-667x375-visible295.png) · [측정값](evidence-mobile-battle-visual/measurements.json). 대표5장을 실제로 열어 가독성·잘림을 확인했다.

**NOT RUN:** iPhone/iPad/Android 실기기 터치·청취·주소창·전체화면, 자연50전투 완주, 전체 browser 묶음과 전 브라우저 순회. 언어 데이터 무변경으로 로컬 `validate:data`는 추가 실행하지 않는다. 극단적인 창 크기와 미세 색감·간격은 후속 사용자 피드백 대상으로 남긴다.

main 병합·자동 병합·Pages 설정 변경·공개 배포는 수행하지 않는다. 새 PR은 이미 병합된 PR #41 위에 이번 모바일 폴리싱만 추가한다.
