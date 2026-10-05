최신 실행 보고서는 [0.4 테스트 보고서](TEST_REPORT_0.4.md)와 [P001–P117 대응표](ACCEPTANCE_0.4.md)를 참조한다. 아래는 0.1.1 당시 기록이며 유지한다.

# TEST_REPORT — 센텐스 발라트로 0.1.1

실행일: 2026-10-03 UTC. 기존 보고서의 PASS를 복사하지 않았다. baseline과 패치 이후 결과를 분리한다. 인수 P01~P50는 **50개 패치 인수 조건**이다. 13개 피드백 번호 및 초기 0.1의 Pxx와 혼동하지 않는다.

## 이번 실제 실행 결과

| 검사 | 새 실행 결과 | 명령·증거 |
|---|---|---|
| 수정 전 기준 | 188/188 PASS, build PASS, 로비/전투/교환 브라우저 PASS | `evidence-0.1.1/baseline-unit.tap`, `baseline-build.txt`, `baseline-browser.json` |
| 최종 자동 회귀 | **207/207 PASS**, FAIL0/SKIP0 | `npm test` → `evidence-0.1.1/final-unit.tap` |
| 데이터 | 2,251 검사 PASS; Lexeme116/active115, Form243/active183 | `npm run validate:data` → `final-data.txt` |
| 28장·첫패 | **4모드×2,500=10,000/10,000 PASS**, repair0/fallback0 | `npm run test:decks` → `final-decks.txt`, `docs/deck-validation.json` |
| 실제 명령 플레이 | **80회: 완주77/패배3/엔진·정책 오류0** | `node tools/simulate-runs.js` → `run-simulation.txt`, `run-simulation.json` |
| 입력 B | 체크3장, 본체 이동, 선택 정리, be 메뉴 PASS | `node tests/patch-input-browser.mjs` → `phase-b-browser.json` |
| 보상 C | 대상취소/고정후보/실제 IDB/실제 앱 연마결과 PASS | `node tests/patch-reward-browser.mjs` → `phase-c-browser.json` |
| 교육 D | 실제 형태/교환/준비/첫제출, 독립연습, 오프라인 뜻, 옛기록 PASS | `node tests/patch-learning-browser.mjs` → `phase-d-browser.json` |
| 연출 E | 루비/사파이어/고연쇄와 Abort/hidden/뷰오류/효과설정 PASS | `node tests/patch-vfx-browser.mjs` → `phase-e-browser.json` |
| UI | **41 checks PASS**, 4해상도·10/14손패·16문장·3룬·drag/touch | `node tests/ui-browser.mjs` → `ui-browser.json`, 25캡처 |
| production 실전 | 1366 정상효과 및 최종1024 효과감소·음소거, 각각 **실제6공격 3전투 완주** | `tests/e2e.mjs` → `production-browser.json`, `production-browser-1024-final.json` |
| 저장 오류 | native IDB abort/손상데이터 거절·복구 PASS | `node tests/storage-fault-browser.mjs` → `storage-fault-browser.json` |
| production build | PASS, 정적 assets 포함 | `npm run build` → `final-build.txt` |
| GitHub workflow | YAML·main/PR분기·test/build 순서·공식 action SHA 검사 PASS | `workflow-static-validation.json`, `workflow-action-refs.json` |
| 원격 GitHub/Pages | **NOT RUN** | clone/push/Actions/Pages 설정·공개 배포 확인을 수행하지 않음 |
| 릴리스 ZIP | **PASS** | `python3 tools/verify-release.py` → CRC/필수파일/source·dist byte 일치 |

브라우저 환경: Linux headless Chromium 134.0.6998.35 / Playwright 1.51.1. Node 24.19.0, Vite 8.3.2. 물리 iPad 테스트가 아닌 Chromium viewport·touch emulation이다. 1920×1080 / 1366×768 / 1180×820 / 1024×768을 검사했다. 배포 검증 서버는 `/nested/sentence-game/` 하위 경로를 사용했으며 build에 개발 read-only debug API가 없는 것도 확인했다.

## 읽기 시간·중단 복구

같은 `I run` AttackResolution의 점수구간은 구1× 1,250ms → 새1× 2,540ms, **2.032배**다. 카드170ms/문법550ms. 룬은 이동220+도착 후 읽기520=740ms. 최종위력 표시420ms, 모으기400ms, 돌진200ms. 효과 끄기/동작 줄이기도 동일 reading timeline이다.

고연쇄 fixture(`I often read a useful book in the park` + 실제 발동3룬)는 점수구간7,600ms, 전체8,920ms, watchdog12,042ms로 실제 재생을 완료했다. 고정5초 제한으로 중간 종료되지 않았다. 각 rune flight의 실제 data 색과 다음 score callback 도착시각, event.after를 검사했다. Abort·visibilitychange·view fault에서 최종HP/aria-busy false/이펙트 제거를 확인했다. 피해의 중복 반영은 Controller 기존 멱등성 테스트가 별도 검증한다.

## 시뮬레이션 결과

각 정책에 4어휘모드×4seed, 총80회를 사용했다. 실제 현재 손패만 제한 검색하여 ADD/FORM/SUBMIT/EXCHANGE/PREPARE/REWARD/NEXT 명령을 실행했다. 적 HP 직접 변경, 카드 주입, 미래 드로우 열람, 미지원 문법 성공 처리 없음.

| 정책 | 완주/횟수 |
|---|---:|
| 기본 정석 STANDARD | 16/16 |
| 단문 우선 SHORT | 16/16 |
| 부사 우선 ADVERB | 16/16 |
| 연마·룬 우선 POLISHED | 16/16 |
| SV만 사용 SV_ONLY | 13/16 |

전체 평균: 공격6.8125회, 준비2.25회, 교환1.8125회, 최종재화18.7125, 공개 룬4.7625개. 완료 전투의 처치 후 남은 턴 평균3.0169. 공격수 분포 4:3/5:5/6:18/7:39/8:9/9:5/10:1. 준비/교환/재화/남은턴/룬 등장 전체 분포는 `run-simulation.json.metrics`에 있다. 초회 튜토리얼은 실제 be 경로·교환1·준비1·타격 브라우저 검증을 별도로 수행했다.

SV_ONLY 패배: STANDARD run-sequence.2(적HP85), ADVANCED run-sequence.3(87), FREE run-sequence.3(74). 정책의 제한 탐색/소모 선택을 포함한 결과이며, 해당 seed가 인간에게 불가능하다는 증거는 아니다. 지정 외 밸런스 변경으로 결과를 숨기지 않았다.

보상 분포는 raw 유형 draw와 제약 적용 후 슬롯별 수치를 `reward-distribution.json`에 분리했다. 일반/보스 각각 raw7,500회, 실제2,500offers×3slots. service 중복/카드고갈 등으로 이후 슬롯은 남은 가중치를 정규화하므로 최종 빈도를 순수 독립 확률로 보고하지 않는다.

## 인수 조건별 근거

모든 아래 PASS는 명시한 자동/브라우저/시뮬레이션 범위의 PASS다. 기기·OS·원격 환경에 대한 확장 보증이 아니다. 더 자세한 근거 경로는 `acceptance-0.1.1.json` 참조.

| ID | 결과 | 검증 내용·범위 |
|---|---|---|
| P01 | PASS | 같은 AttackResolution에서 새1×의 점수구간이 구1× 대비 약2배. 숫자/이벤트 순서 동일 |
| P02 | PASS | 고연쇄 타임라인이 5초를 넘어도 정상 완료. watchdog 중간종료 없음 |
| P03 | PASS | 효과끄기/동작줄이기에서도 문법명 읽는 시간이 줄지 않음 |
| P04 | PASS | 단문은 절제된 연출, 실제 다중룬/콤보는 단계적 증폭 |
| P05 | PASS | 루비/사파이어 등 각 색의 슬롯→문장 빛 이동 및 이벤트 after 표시 동기화 |
| P06 | PASS | 탭숨김·Abort·뷰오류에도 최종HP 표시 수렴, 잠금 해제, 이펙트노드 제거, 중복피해 없음 — Abort/뷰 오류/visibilitychange는 브라우저 harness의 명시적 fault 주입. 실제 OS 탭 복귀는 NOT RUN. |
| P07 | PASS | 체크3장→버리기1클릭→3장보충, 교환-1, 턴유지 |
| P08 | PASS | 본체클릭은 기존 조립, 체크는 선택, 형태버튼/드래그종료는 원치않는 추가클릭 없음 |
| P09 | PASS | 선택한 카드를 이동하면 선택ID가 손패와 일치. 선택해제/0장확정 자원소모 없음 |
| P10 | PASS | 태블릿 pointercancel/방향변경/빠른연속클릭 후 선택·드래그 잠금 잔류 없음 — Chromium CDP touch emulation과 pointercancel/resize. 실제 iPad 아님. |
| P11 | PASS | 양쪽 영역이 가득 차도 기존 맞교환·순서변경이 작동 — 최대 배치는 renderer fixture; 실제 카드 보존/맞교환은 기존 Controller 테스트로 별도 검사. |
| P12 | PASS | 손패·보상·덱·초기조합대의 be 표시는 be |
| P13 | PASS | be→am/is/are 선택 후 기존 정상문장 점수 동일 |
| P14 | PASS | I be happy는 완전문장보너스 없음. be형태진단 1개, 내부오류/과한 중복감점 없음 |
| P15 | PASS | 과거·to부정사 등 기존 미지원 범위를 be표시 수정 때문에 가짜 지원하지 않음 |
| P16 | PASS | 초회1-1에서 형태변경·선택후교환·준비·제출직전설명을 실제 수행 가능 |
| P17 | PASS | 가이드 대상을 미리 움직이거나 다른 합법문장을 조립해도 막힘 없음 |
| P18 | PASS | 가이드건너뛰기/완료/다시보기/구프로필의 완료값 구분; 보상중복 없음 — 다른 합법 공격은 미수행 단계를 완료로 표시하지 않고 ALTERNATIVE_PLAY 건너뛰기로 기록. |
| P19 | PASS | 도감에 현재형 SV/SVC/SVO의 검증된 한글 뜻 참고 표시 |
| P20 | PASS | 사용자 예문3개, 비유/의인화, play다의성에 확정적인 의미오답 배지 없음 |
| P21 | PASS | 해석템플릿 누락 시 성분별뜻 fallback; 도감/전투 정상동작 |
| P22 | PASS | 관사/일치 오류문장의 한국어 뜻이 표시되어도 영어원문·기존오류기록 유지 |
| P23 | PASS | 옛 기록/없는 의미버전/긴 단어·PP·부사반복에서 안전한 표시 |
| P24 | PASS | 네트워크 끊김 상태에서도 새 의미참고 작동, 외부번역요청 없음 — 이미 로드한 로컬 모듈의 네트워크 단절 동작. 오프라인 재로딩/PWA 보장은 아님. |
| P25 | PASS | 카드3칸, 카드2+연마, 카드+룬+제거 등 고정seed/fixture에서 정확히3칸 |
| P26 | PASS | 하나만 획득. 같은 offer 확정연타로 카드/룬/재화가 늘지 않음 |
| P27 | PASS | 연마선택→대상선택→취소→동일3후보로 복귀. 대상확정 때만+1 |
| P28 | PASS | 제거취소·위험경고 취소 시 상태보존, 최종확정 후 카드보존불변식 유지 |
| P29 | PASS | 룬중복레벨업/만석교체/교체취소/MAX제외 정상 |
| P30 | PASS | Stage1-2는 매원정3룬. 최초고정/이후기본중심랜덤 유지. 첫 튜토리얼1-1은3일반카드로 조기랜덤룬 방지 |
| P31 | PASS | 일반/보스 슬롯별 가중치 적용. 필터전 추첨과 필터후 실측분포를 별도 보고 — raw 7,500 draw 및 filter 후 2,500 offers×3slots를 일반/보스별 별도 기록. |
| P32 | PASS | 중복서비스/동일카드/불가능후보를 bounded 처리. 정상seed에서 빈칸 없음 |
| P33 | PASS | 저장/로드/대상취소/팝업재개로 후보 재추첨 없음 |
| P34 | PASS | 혼합보상 skip 규칙은 popup당1회. 선택별재화 합산 없음 |
| P35 | PASS | 새HP91/156/286 일치. 로드/상태진입 중복곱셈 없음 |
| P36 | PASS | 1~6번째 총행동 처치의 턴보너스가5/4/3/2/1/0 — 1~6 행동 수는 정산경계 fixture; 준비2+공격2는 HP 수정 없는 실제 명령 테스트. |
| P37 | PASS | 준비2+공격2 처치면+2. 마지막턴처치는 승리·보너스0 |
| P38 | PASS | 패배/무효공격/리플레이/중복정산에서 턴재화 지급 없음 |
| P39 | PASS | 연마 +1/+2/+3 표시가 모든 카드화면에서 일치; 실제점수 중복 없음 — 공통 wordCard 배지/합계와 기존 scoring level 회귀, 실제 앱 연마 결과 모달 검사. |
| P40 | PASS | 승리 정산→보상생성→보상선택/skip 순서와 표시재화 일치 |
| P41 | PASS | 새원정28장/품사수량/대명사조건/동사8장/be2/SV2종/기본문형 witness 검사 |
| P42 | PASS | 네 어휘모드×2,500seed 총10,000 시작덱·첫손패 검사. 모두 실제 파서 통과경로 |
| P43 | PASS | 첫튜토리얼6장에 SV 및 be활용경로. 없던 물리카드 생성 없음 |
| P44 | PASS | 일반 다음턴·교환은 시드 재현. 제거된 카드 자동구제 없음 |
| P45 | PASS | 1920×1080/1366×768/1180×820/1024×768, 손패10/14·조합대16·긴 룬문구 검사 — 손패10/14+문장16+3룬은 합성 capacity fixture로 시각 검증. |
| P46 | PASS | 카드 영단어 크기는 보존하고 좌우 메뉴는 커졌으며 잘림/화면전체zoom 없음 |
| P47 | PASS | 현재 네트워크 단절 플레이, 로컬저장3슬롯, 처음/최고기록과 새원정재시작 회귀 — 실제 production 3전투는 오프라인 UI 행동; 수동3슬롯/최초·최고/다시 시작 포함. |
| P48 | PASS | 구버전 저장카드를 억지28장으로 삭제하지 않음. 공개옛보상 재추첨 없음 — 코드 수정 전에 0.1 실행으로 확보한 실제 저장 표본을 재사용. 카드/HP/offer/explicit form deep equality. |
| P49 | PASS | 여러 seed의 기본정석·단문·부사·강화룬 경로로 실제 3전투 완주 시뮬레이션 — 80회 중77회완주/3회패배/엔진오류0. 모든 선택 승리 보장은 요구사항이 아님. |
| P50 | PASS | 소스·배포ZIP·명세버전·변경내역 일치. Stage2/전체스토리클리어 가짜활성 없음 — 최종 ZIP byte/CRC/필수파일 대조 PASS. 원격 배포는 NOT RUN. |

## 단계 중 발견·수정한 사항

- HP/턴재화·새 보상/28장/읽기시간으로 바뀐 기존 기대값은 명세에 맞게 갱신했다. 기존 보상 유형 검사는 legacy0.1.0으로 보존하고 새 혼합 검사를 추가했다. 테스트 삭제로 통과 수를 늘리지 않았다.
- 첫 튜토리얼 버리기 설명이 손패 체크를 가리는 실제 브라우저 실패를 발견해 말풍선을 적 영역 옆으로 재배치했다. 이후 실제 전체 가이드 동작이 통과했다.
- dev 서버에서 오프라인 후 새 URL로 module import하던 검사 절차는 이미 로드한 로컬 모듈을 사용하도록 고쳤다. 오프라인 실행과 오프라인 최초 다운로드를 혼동하지 않았다.
- 고연쇄 2× fixture가 5초 미만이었던 검사는 1× 실제8.92초로 바꿔 watchdog 경계를 실제로 통과시켰다.
- 최종 패키징 전 화면/공격 스냅샷 버전 표기를 정리하고 npm test/build를 다시 실행했다.
- 옛 기록 브라우저 검사의 닫히는 모달/열린 모달 선택자 충돌을 `dialog[open]`으로 고쳐 재실행했다. 게임 데이터 문제는 아니었으며 최신 `phase-d-browser.json`에 옛 문자열 기록 표시 PASS가 포함된다.

## NOT RUN / OUT OF SCOPE

NOT RUN: 실제 iPad Safari 및 다른 브라우저/OS, 실제 디스크 quota 소진, 실제 OS background lifecycle, 원격 GitHub main 읽기/반영/CI/Pages 공개 URL 확인, 오프라인 최초 로드/PWA. 이전 전체 브라우저 스크립트 중 이번 목적과 겹치는 old standalone overlay/gate-b/presentation-browser는 최종 묶음에서 재실행하지 않았다. 해당 새 범위는 patch suite와 production e2e로 검증했으며 옛 로그를 새 PASS로 옮기지 않았다.

OUT OF SCOPE: Stage2, 전체48전투 스토리, 고급 문법/신규 캐릭터/서버·랭킹/상점 추가. 원본 설계 metadata가 있어도 구현으로 주장하지 않는다.

`docs/history/0.1/`는 이전 이력이다. 새 증거는 `docs/evidence-0.1.1/`, 최종 ZIP CRC/해시 대조 결과는 `release/release-validation.json` / `release/release-manifest.json`이다.
