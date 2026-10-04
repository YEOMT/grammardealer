# 0.2 실제 구현·검증 보고

검증일: 2026-10-04, Asia/Seoul. 이 보고서는 이번 checkout에서 실행한 결과다. 기존 Work·0.1.1·소스 이관 보고서의 PASS를 새 실행 결과로 재사용하지 않았다.

## 기준과 환경

- 저장소 `YEOMT/grammardealer`, 브랜치 `codex/v0.2-stage2-svoo-shop`.
- 시작 시 fetch한 최신 main: `2fdafeba8c93435844eef2d7aec0f3e25509bde9`. 게시 전 재확인에서도 동일했다. 이 커밋의 소스와 최대 카드 수 수정 위에서 개발했다.
- 구현 commit: `805c0e1496d7a7f177aebf4c354362cc9c6bb82b`. 이 보고서·선별 증거는 별도 후속 commit으로 보존한다. 최종 브랜치 SHA는 PR의 head와 Git 기록에서 확인한다.
- 실제 source root는 현재 Git checkout의 `.`이다. 기존 인계 폴더·ZIP·`.baseline-backup`은 변경하지 않았다.
- Windows / Node `24.19.0` / npm `11.17.0` / Git `2.51.0.windows.1` / Vite `8.3.2` / Playwright `1.51.1` / Chromium `134.0.6998.35`.
- 실행 파일은 기존 `../.local-tools/node-v24.19.0-win-x64/{node.exe,npm.cmd}`, 브라우저는 `../.local-tools/playwright-browsers`를 재사용했다. Git은 기존 OS 설치를 사용했다. 시스템 PATH·Codex 런타임·의존성 버전을 변경하지 않았다.
- `package.json`과 lockfile 루트의 release version만 `0.2.0`으로 올렸다. lockfile의 의존성 버전·integrity는 시작 main과 같다. 하위 generator/tutorial/presentation 버전은 기능이 동일한 기존 분기를 유지한다.

## 명령과 종료 결과

아래 명령은 순차 실행했다. 원본 시간·종료 코드는 [summary.json](validation/v0.2/summary.json)에 있다. 원시 stdout/stderr와 중간 실패는 Git 제외 경로 `.local-validation/v02/`에 보존한다.

| 실제 명령 | 결과 | 확인 내용 |
| --- | --- | --- |
| 시작 main의 `npm.cmd test` | PASS / 0 | 207 pass, fail/skip 0 |
| 시작 main의 `npm.cmd run build` | PASS / 0 | 39 modules |
| `npm.cmd ci --offline` | PASS / 0 | 기존 npm cache와 lockfile로 설치, lockfile 재생성 없음 |
| `npm.cmd test` | PASS / 0 | 최종 273 pass, fail/skip 0. 1차 최종 실행 271 후 잘못된 보상/저장 입력 회귀 2개 추가하여 전체 재실행 |
| `npm.cmd run validate:data` | PASS / 0 | 2,311 checks; Lexeme119/active118, Form250/active188 |
| `npm.cmd run test:decks` | PASS / 0 | 네 어휘 모드 × 2,500 = 10,000 시작 덱·실제 첫패. repair/fallback 0 |
| `npm.cmd run test:runs` | PASS / 0 | 160 실제 Controller 원정: 완주40 / 패배120 / 기술 오류0 |
| `node tools/simulate-entry.js` | PASS / 0 | 네 모드 × 100 = 400 실제 초원→입장→구매→저장 복원·다음 드로우 |
| `npm.cmd run build` | PASS / 0 | 최종 43 modules, production `dist/` 생성. 마지막 테스트 도구 수정 후 재실행 |
| `npm.cmd run test:browser` | PASS / 0 | 기존 5개 스크립트와 새 항구 스크립트까지 전부 완료 |
| `npm.cmd run test:e2e` | PASS / 0 | 1366×768, 정상 효과, 실제 23공격·7전투 완주 |
| `npm.cmd run test:e2e` + 1024 환경 변수 | PASS / 0 | `SB_VIEWPORT={"width":1024,"height":768}`, `SB_EFFECTS_OFF=1`, 별도 증거 suffix. 실제 23공격·7전투, 로비 경유 상점 복원과 콘솔/리소스 오류 검사 추가 |

개발 서버는 이번 작업에서 시작한 Vite를 사용했고 검사 후 해당 PID만 종료했다. production E2E는 자체 정적 서버와 격리된 Playwright context를 만들고 종료했다. 실제 사용자의 프로필·공개 사이트 저장을 삭제하거나 가져오지 않았다.

## 브라우저와 실제 플레이

공식 browser는 `patch-input`, `patch-reward`, `patch-learning`, `patch-vfx`, `ui-browser`, `v02-ui-browser` 순서로 실행했다. 첫 네 묶음은 입력·혼합 보상·가이드/뜻 참고·읽기 시간/색상/중단 복구 회귀다. 기존 UI는 **41 checks / 25 captures**, 새 항구 UI는 **29 checks / 19 captures**를 이번 실행에서 직접 기록했다. 기존 41이라는 과거 숫자를 복사한 결과가 아니다.

새 UI 29개는 **합성 Controller/renderer 상태 검사**다. 상점 재화·룬 만석·전투 최대 카드 등 경계 상태를 주입한다. 실제 승률 또는 7전투 완주 증거로 사용하지 않는다. 1920×1080, 1366×768, 1180×820, 1024×768에서 손패10/14장·조합대16장 전체 연마+3 상태를 검사했다. 기존 삽입·맞교환·형태·버리기·touch 회귀도 유지했다.

최대 카드 검사에서 연마 배지가 추가되면 1366×768 문서 높이가 777px가 되는 새 경계를 발견했다. 문장 카드9장 이상이며 화면 높이820 이하인 경우 주변 세로 여백·적 행·점수 행을 조정했다. 카드·버튼·글꼴·연마 배지를 숨기거나 축소하지 않았다. 최종 8조합 모두 문서 높이가 viewport와 같고 조작부와 손패가 분리된다. 1366 손패14의 교환 버튼 하단766.19, 조작부 하단547.59 < 손패 시작555.59를 확인했다.

production 검사는 **합성 상태 없이 새 원정을 UI 클릭으로 진행**했다. 시드 `run-sequence.1`, 초급 어휘, 현재 손패의 합법 조합을 고르는 제한된 QA 정책이다. 저장된 실제 IndexedDB 상태의 읽기 전용 사본으로 다음 조작을 결정했으며 앱에 HP·돈·카드·승리를 주입하지 않았다. 다음을 실제 수행했다.

- `/nested/sentence-game/` 하위경로에서 JS/CSS를 로드하고 production에 개발 debug API가 없음을 확인.
- 초기 자원 로드 후 네트워크를 차단한 상태에서 초원3·항구4전투, 총23회 실제 공격.
- 초회 be/형태 선택·준비·선택 교환, 첫 룬과 고정 보상 저장 복원.
- 독립 초원 milestone → 항구 예고 → 입장 지급 → 실제 상점 구매 → 상점 저장 복원 → 동일한 첫 셔플·드로우.
- 실제 SVOO의 IO/DO 점등, 보스 장막 해제, 보스 보상과 `STAGE2_END`.
- 완료 슬롯 저장·재개, 도감 조회 무정산, 새 원정과 기존 가이드 플래그, sandbox/hash refresh/back.
- 1024 효과 감소 실행에서는 상점 수동 저장→로비→동일 슬롯 복원과 콘솔/failed request/HTTP 오류 없음까지 별도 assertion으로 확인.

구체적인 체크 목록은 [browser-results.json](validation/v0.2/browser-results.json), 대표 캡처의 성격은 [증거 안내](validation/v0.2/README.md)를 참조한다. Chromium touch는 실제 iPad Safari가 아니다. `/grammardealer/` 공개 사이트를 갱신하거나 공개 저장 데이터를 검증하지 않았다. 상대 base·hash 라우팅의 production 임의 하위경로 로딩을 검사했다.

## 시드 표본과 경제

`run-sequence.0`부터 `.19`까지 네 어휘 모드에 각각 두 정책을 적용했다. 성공한 seed만 다시 뽑지 않았다. **160건 모두**의 완료/패배 위치·공격/준비/교환·보스 해제·구매를 [seed-results.json](validation/v0.2/seed-results.json)에 기록한다.

| 정책 | 원정 | 완주 | 패배 | 기술 오류 | 첫 상점 도착 | 도착 재화 min/median/max | 장막 해제 |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| LEARNING | 80 | 40 | 40 | 0 | 80 | 18 / 19 / 22 | 68 |
| SV_ONLY | 80 | 0 | 80 | 0 | 68 | 15 / 17 / 20 | 0 |

LEARNING은 현재 손패에서 4형식을 우선하고, 교환 시 보이는 NP/수여 동사 재료를 남긴다. 남은 HP/턴에 비해 일반 공격이 부족하면 남은 합법 교환으로 SVOO를 찾는다. SV_ONLY는 SV만 공격한다. 둘 다 공개된 보상·가격만 사용하며 미래 덱·미공개 후보를 읽거나 탐색으로 게임 RNG를 소비하지 않는다. 제한된 탐색 및 탐욕적 자원 사용이므로 인간 승률이나 seed의 절대 가능성을 의미하지 않는다. LEARNING의40패는 모두7번째 보스이며, 68번 장막 해제 중28번은 이후 피해 부족으로 패배했다. SV_ONLY는2/3/4/5/6/7전투에서 각각3/9/7/19/14/28패였다.

첫 상점 구매 횟수는 LEARNING93건, SV_ONLY109건이며 실제 상품·가격은 각 원정 기록에 있다. 두 정책의 전체 첫 상점 도착148건과 별도 입장 표본400건을 혼합하지 않는다.

입장 표본은 `entry-sequence.0..99` × 네 모드다. **400/400 도착**, 초원 패배0·기술/정책 오류0·witness 부족0. 입장 지급0장10회/1장194회/2장196회, 재화18/20/23. 모두 실제 구매 후 두 번의 복원에서 동일한 다음 손패·RNG를 확인했다. [entry-results.json](validation/v0.2/entry-results.json)에 실패를 포함할 수 있는 전체 표본 형식을 보존했다.

Stage2 HP `220/300/380/640`과 명세 상점 가격은 바꾸지 않았다. 정석 정책으로 7전투 완주가 가능하고 실제 브라우저에서도 확인했지만, 초기값을 완성된 밸런스라고 주장하지 않는다. 큰 비SVOO 입력2560→장막640 처치는 합성 산술 규칙 검사이며 실제 그 빌드를 만든 증거가 아니다.

## 0.2 인수 조건 대조

아래는 이번 명세 P01~P30이다. 기존 테스트 안의 동명 P 번호는 과거 명세 번호일 수 있다. 모든 행의 PASS는 기재한 검사 범위이며, 모든 경계를 실물 기기에서 수동 플레이했다는 뜻이 아니다.

| 항목 | 결과 및 직접 근거 | 범위 |
| --- | --- | --- |
| P01 시작28·첫패 | PASS — deck/patch-input + 10,000덱 + E2E 초기 저장 | 단위·실제 명령·UI |
| P02 기본 자원·한도 | PASS — deck/behavior/scoring + 최대 카드8조합 | 단위·합성 UI |
| P03 새/레거시 종료 | PASS — v02-progression-storage, legacy run-sequences, 7전투 E2E | 단위·명령·UI |
| P04 독립 초원 milestone | PASS — v02-progression-storage P03/P04/P06, E2E 프로필 | 단위·UI |
| P05 실제 보스 구분 | PASS — stage2-shop stage registry, v02-progression-storage P05/P26 | 단위 |
| P06 전역2만 첫 룬 | PASS — stage2-shop global rewards, patch-rewards, E2E R02 | 단위·UI |
| P07 예고→지급→상점→셔플 | PASS — v02-progression-storage P07/P08/P22, entry400, E2E | 단위·명령·UI |
| P08 지급 멱등·0~2 | PASS — stage2-shop entry grants, entry400, 상점 복원 | 단위·명령·UI |
| P09 불필요한 지급 없음 | PASS — stage2-shop entry grants, entry400 | 단위·명령 |
| P10 제거 후 자동구제 없음 | PASS — stage2-shop entry does not fabricate/restore, patch-input | 단위 |
| P11 카드 구매 원자성 | PASS — stage2-shop, v02-progression-storage, SHOP_CARD_PURCHASE, E2E | 단위·합성/실제 UI |
| P12 룬 강화·교체·최대Lv | PASS — stage2-shop, 기존 rewards R07~R09, SHOP_RUNE_FULL_CANCEL | 단위·합성 UI |
| P13 취소·잔액 부족 무손실 | PASS — 위 거래 검사와 대상/룬 취소 UI | 단위·합성 UI |
| P14 서비스 각각1회 | PASS — stage2-shop, v02-progression-storage P14/P15/P17, UI 저장 | 단위·합성 UI |
| P15 무료 제거 가격 분리 | PASS — stage2-shop free reward removal | 단위 |
| P16 중복·오래된 요청 | PASS — v02-progression-storage P11/P13/P16, shop 중복/closed | 단위 |
| P17 상점 RNG 분리 | PASS — stage2-shop, v02-progression-storage, SHOP_INFORMATION_NO_MUTATION | 단위·합성 UI |
| P18 저장·다음 드로우 | PASS — v02-progression-storage P18/P23, entry400, E2E | 단위·명령·UI |
| P19 항구 혼합 보상 | PASS — stage2-shop global4~7 + 공유 patch-rewards 취소/중복/skip, E2E | 단위·UI |
| P20 전투 정산 멱등 | PASS — behavior C08, patch-rewards P36~P40, patch-economy, 항구 baseGold | 공통 단위·명령 |
| P21 마지막 행동 승리 | PASS — behavior sixth-turn kill/C02/C08, patch-rewards consumed=6 | 공통 단위 |
| P22 카드 보존·combat 종료 | PASS — v02-progression-storage P07/P08/P22, entry400, E2E | 단위·명령·UI |
| P23 SHOP/Stage2/변조 저장 | PASS — v02-progression-storage + storage 오류/transaction abort | 단위 |
| P24 기존 원정·프로필 | PASS — 기존 0.1 fixture, legacy72 후보/RNG, 명시적0.1.1 경계, 옛 도감 브라우저 | 단위·명령·UI |
| P25 가이드·실제 자격 분리 | PASS — v02-progression-storage P25, patch-learning/rewards, E2E 새 원정 | 단위·UI |
| P26 STAGE2_END·스토리 불변 | PASS — v02-progression-storage P05/P26, E2E 프로필 정산 | 단위·UI |
| P27 로비·완료 재개·새 원정 | PASS — E2E V02-P27의 상점→로비 복원/완료 복원, R04, U13 | 실제 UI |
| P28 비실전 무보상 | PASS — storage replay 멱등, presentation 입력 무변경, E2E 도감·sandbox 프로필 불변 | 단위·UI |
| P29 버전 일치 | PASS — UI version assertion + package/lockfile root/contracts/index 정적 대조 + build | 정적·UI·빌드 |
| P30 원격/배포 경계 | PASS — main SHA, workflow 무변경, branch만 push/PR. 실행 상태는 PR과 최종 작업 보고 참조 | Git·정적 감사 |

P19의 모든 취소 조합을 항구 production UI에서 반복한 것은 아니다. P20/P21의 턴별 경계는 공유 Controller 회귀를 사용하며 모든 항구 전투에 별도 합성 마지막 턴을 주입하지 않았다. P24는 보존 fixture와 버전별 회귀이며 사용자 본인의 브라우저 슬롯을 추출한 검사가 아니다. P28의 새 production 검사는 영구 프로필 무변경에 한정하고 재생의 원정 재화 무변경은 공통 단위 검사로 확인한다.

## 실패·수정·기대값 변경

초기 통합에서 레거시 SVOO 미지원 기대값과 새 rewardVersion validator가 충돌했다. 기존 기대값을 지우지 않고 원정 버전별 문법 view와 보상 validator를 연결했다. QA 정책의 Stage 인자가 빠진 상태에서 나온 중간 패배 결과는 최종 시드 표본으로 사용하지 않았다. 시뮬레이터를 실제 `stageForRun`에 연결하고 현재 손패 정책을 보완한 뒤 전체160건을 다시 실행했다. 실패 로그는 로컬에 보존한다.

최종 독립 감사에서 변조된 frozen Topaz 보상을 레거시/미해금 저장에 삽입할 수 있는 검증 누락을 발견했다. 취득 helper와 저장 validator가 실제 원정 자격·manifest를 검사하도록 고쳤다. 객체형 commandId, 유료 제거 사용 완료/누적0·가격4 저장도 거절한다. 실패 시 모든 상태/RNG 보존과 정상 해금 양성 대조를 추가했다. 최종 회귀에 미해결 assertion 실패는 없다.

의도적으로 바뀐 기존 테스트는 다음과 같다. 테스트 삭제·skip·오차 확대는 하지 않았다.

- `grammar.test.js`, `patch-input.test.js`: 옛 SVOO 미지원/경계 fixture에 `legacyRegistry`를 명시한다. 기존 기대값은 그대로다. 현재 grammar는 별도36개 새 사례와 생성 조합으로 검증한다.
- registry 수는119/118로 확장하고 옛116/115도 동시에 검사한다. 추가 카드는 send/for와 명세의 실제 문장에 필요한 picture이며 starterEligible=false다.
- `scoring.test.js`: 활성 룬10→11, 새 토파즈만 추가. 기존10종의 레벨값은 그대로 검사한다.
- `run-sequences.test.js`: Stage1_END 기대가 있는 기존 시드는 명시적0.1.1 캠페인으로 실행한다. 새0.2는 별도160원정과 E2E로7전투를 확인한다.
- `e2e.mjs`: 기존3전투 완료를7전투 완료로 확장하고 실제 상점·저장·장막·오프라인 검사를 추가한다. `test:browser`는 기존 묶음을 유지하고 항구 검사를 끝에 추가한다.

독립 코드 감사에서는 시작 main registry 전체와 legacyRegistry의 정의·배열 순서·인덱스를 deepEqual로 대조했다. 기존 전투 자원·시작 덱·어휘·보상·경제·기존 점수·열 룬·Stage1 전투 데이터도 동일했다. 72개의 레거시 미래 보상 golden은 후보와 RNG를 정확히 비교한다.

## 보존·미실행·후속

- 과거 보고서와 기존 evidence 고정 파일은 실행 전 백업하고 이번 출력은 새 폴더에 보관한 뒤 복원했다. 원시 증거의 개인 절대 경로·로그를 Git에 넣지 않았다. 공개 선별 자료는 `docs/validation/v0.2/`다.
- 게임 소스는 이번 명세 범위에서 변경했다. 문법/Stage2/상점/저장/UI/테스트·도구·현재 문서를 수정했으며, 기존 DB 이름·스토어·프로필 ID·수동3슬롯은 유지했다. 의존성 버전·workflow·Pages 설정은 변경하지 않았다.
- 실제 iPad Safari/Android/Firefox/WebKit, 물리 기기 성능, OS 수준 quota/디스크 고장, 공개 배포: **NOT RUN**. headless Chromium이나 transaction abort를 이 항목의 PASS로 바꾸지 않는다.
- 2560점 비SVOO 빌드의 실제 획득·플레이, 모든 전략/시드의 무조건 승리: 검증하지 않았으며 완성 조건으로 주장하지 않는다.
- 기존 소유격 한글 참고/COMPLETE_HINT, 옛 기록의 languageVersion 문자열, 턴 보너스 사전 안내 개선은 범위 밖으로 남긴다. Stage3 이후·48전투 전체·새 난이도·후속 문법은 미구현이다.
- 개발 브랜치와 PR은 검토용이다. main 병합·auto-merge·Pages 설정·공개 사이트 갱신은 하지 않는다. 검토 순서는 [패치 노트](PATCH_NOTES_0.2_KO.md)의 새 원정→초원→항구 소개/상점→저장 복원→4형식/장막→완료 재개를 따른다.
