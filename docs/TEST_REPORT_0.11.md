# 0.11 최종 3페이즈 · 실제 검증

기준은 작업 시작에 fetch한 `origin/main` `cb1958f66dda4e4cd320c7b03e661d7a8cb41cf4`다. 시작 작업 트리는 clean, 작업 브랜치는 `codex/v0.11-final-trilogy`다. 계약은 [원본 명세](../spec/v0.11/Syntax_Atlas_0.11_FinalBoss_Spec.md)와 [집중 검증 20묶음](../spec/v0.11/03_Focused_Verification.md)이다. 동봉 JSON과 패키지 자체검사는 실행 결과로 세지 않았다.

## 변경과 적용 값

새 0.11 원정만 47보상 → 최종 소개 → 마지막 상점 → Surface / Deep / Universal의 48~50전투 → `FINAL50_CLEAR`로 이어진다. 최종전 HP 5000/6000/10000, Surface 서로 다른 유형 두 층, Deep 서로 다른 공격형 룬 최대 두 번 봉인은 확정값이다. 생존 턴 종료 회복400, 해방×1.25, 시작 먼지4/5와 세부 선별 정책은 구현 초깃값이며 자연 난이도 검증 완료값이 아니다.

원정·저장은0.11.0이고 기존1~47의 언어·점수·룬·보상·상점 정책은0.10.2가 사용하는 계약을 상속한다. 28장/6턴/24장, 현재 전투 배치·품사색·골드·입장/상점 분리와 구버전 완료 경계를 유지한다. 최종전 저장은 첫 조작 전·페이즈 사이·완료 등 명세의 안전 지점이며 자유로운 전투 중 저장을 추가하지 않는다.

최고 위력과 같은 공격의 실제 선택형/문장 스냅샷을 즉시 보존한다. 48/49/50의 정산 근거가 있는 실제 완료만 플레이어별 로컬 Top20에 등록한다. 지정 덱 QA 최고 문장은 별도 표시하고 랭킹에서 제외한다. 기존 IndexedDB의 `profiles`/`slots` 트랜잭션으로 완료 원장·개인 최고·저장 순번·프로필을 함께 저장한다. 공용 서비스는 **미연결**이며 기기 내 기록은 외부 변조 검증을 보증하지 않는다.

## 실제 명령과 결과

Node24.19.0/npm11.17.0과 기존 Playwright1.51.1 환경을 재사용했다. 실행 경로는 작업 폴더의 `../.local-tools/`이며 전역 환경과 의존성 버전은 변경하지 않았다.

| 검사 | 결과 | 근거/범위 |
|---|---|---|
| `node --test tests/finale-records.test.js` | PASS, 15/15, exit0 | 최고 문장·동점·중복·21명·QA·어댑터·트랜잭션 완료/취소·불완전 저장 거부 |
| 새 문법/보스 집중 검사 | PASS | 최초 전체 실행에 포함된 mechanics42, controller9, campaign10, compatibility4. 아래 파일의 실제 assertion |
| `npm.cmd test` 최초 전체 실행 | FAIL, 1799/1801, exit1 | `.local-validation/v0101/v011-final-unit/command.log`; 구버전 fixture 범위 오류2건. 새 게임 규칙 assertion 실패와 구분 |
| `npm.cmd test` 수정 후 전체 실행 | PASS, 1803/1803, exit0 | `.local-validation/v0101/v011-final-unit-r2/`; 실패0·skip0 |
| `npm.cmd run validate:data` | PASS, 3112, exit0 | `.local-validation/v0101/v011-final-data/` |
| `npm.cmd run build` | PASS, exit0 | 최종 `.local-validation/v0101/v011-final-build-r2/`; 약630kB 청크 크기 경고는 남음 |
| `node tests/finale-production-assigned.mjs` | PASS, exit0 | PC1366×768 실제 공격5회·UI 확인6묶음, `.local-validation/v011/production-assigned-r3/` |
| 태블릿1180×820 새 상태/버튼 표시 | PASS | 위 production 검사에서 Surface/Deep 문구·조작부 화면 내 위치 확인 |
| `node tests/finale-record-storage-browser.mjs` | PASS, 6묶음, exit0 | `.local-validation/v011/record-storage-r2/`; 합성 완료 기록으로 실제 Chromium IndexedDB 재시작·중복·원자성 검증 |
| 최종 bundle 완료/랭킹 smoke | PASS, 2묶음, exit0 | `.local-validation/v011/final-bundle-smoke/`; 최종 JS/CSS200, 완료 저장 복귀·빈 랭킹 표시 |

최초 전체 검사에서 발견한 두 실패는 `v051-tutorial.test.js`의 현재 원정을 옛 버전으로만 바꾼 fixture와 `v081-help.test.js`의 신규 최종 지역까지 포함한 구0.8.1 지역 순회다. 과거 fixture에서 finale 필드를 제거하고 지역 범위를1~8로 고정했다. 기존37개 기대값·assertion·허용치를 유지했다. 두 파일 집중41검사 및 최종 전체 실행이 통과했다. 기존 legacy helper들도 같은 이유로 현재 NEW_RUN의 finale 필드를 옛 원정에 섞지 않게 조정했다.

실제 브라우저에서 랭킹의 선택적 DOM 자식이 `false` 텍스트로 노출되는 문제를 발견해 `replaceChildren`에 넘기기 전에 빈 항목을 제외했다. 빈/등록된 랭킹 화면을 다시 검사했다. 최초 production 시도는 로컬 네트워크 권한 때문에 중단됐고, 다음 시도는 테스트 shadow에 실제 상점 UI commandId가 빠져 저장 비교에서 실패했다. 각각 환경 허용과 테스트의 실제 UI 영수증 반영으로 해결했으며 게임 판정·기대값은 바꾸지 않았다. 실패 로그도 보존했다.

production 연속 검증은 47전투 이전에 등록 WORD13장·기존 룬4종 Lv3를 지정했다. 이후 HP·덱·RNG·더미 직접 변경 없이 실제 클릭/형태 선택/교환/턴 넘기기/공격/상점 이동만 사용했다. Surface 관계절→본동사 have 두 층을 각각 해제했고 두 번째는 마지막 턴 처치였다. Deep 현재 단순 과제는 같은 공격에서 룬을 복구해 처치했다. 실제 위력은47:29904,48:15752/26956,49:33695,50:29904다. 집결/돌진/피격 단계와 실제 보이는 공격 카드 overlay, 저장·불러오기, QA 랭킹 제외를 확인했다. 첫9장 지정덱의 Deep 조립 실패는 별도 보존했고 같은 seed에서 시작 전 중복 WORD4장을 추가한13장으로 검증했다. 자연 덱 성장이나 승률 근거가 아니다.

production 경로 후 랭킹 DOM 수정만 포함해 다시 빌드했고 최종 bundle의 완료/빈 랭킹을 짧게 재검사했다. 전투 로직과 CSS는 두 빌드 사이에 변경되지 않았다. 실제 저장 랭킹 검사는 별도의 격리 브라우저에서 합성 완료 기록을 넣어 수행했으며, production QA 클리어를 실제 랭킹에 등록하지 않았다.

원본 로그/고정 출력은 로컬 검증 폴더에 보존하고, 과거 Work/기존 문서의 고정 증거 파일은 실행 래퍼가 복원한다. 이 문서에는 개인 절대 경로나 전체 파일 해시를 싣지 않는다.

## V01~V20

근거 약어: **M** [문법·순수 보스](../tests/finale-mechanics.test.js), **C** [지정 상태 Controller](../tests/finale-controller.test.js), **D** [버전·임시 카드](../tests/finale-campaign.test.js), **K** [기존 정책 호환](../tests/finale-compatibility.test.js), **R** [기록·저장 경계](../tests/finale-records.test.js). 모두 production 모듈을 호출한다. C의 카드 배치는 기존 사본을 지정한 검사이며 자연 손패 플레이 결과가 아니다.

| ID | 확인 조건 | 실제 결과·근거 |
|---|---|---|
| V01 | 새50·구47/과거 경계,24장·기존 UI 정책 | PASS 단위: D/K의 기존1~47 정의·정책 동등성,28장/자원/RNG,구저장 왕복. UI 대표 화면은 V19 |
| V02 | 47보상→소개→고정 마지막 상점→48 | PASS C: 보상1회, 상점 복원/재진입 거부, 실제 진입 |
| V03 | 서로 다른 두 유형·가능 후보·고정 RNG | PASS M: 실제 문법 witness 후보, 중복 동사 제거, 동일 시드/다른 유형, 순수 pick. 대량 분포는 NOT RUN |
| V04 | 주절1~5·전치사구·종속절·동사/명사help/고아 구분 | PASS M: 등록 카드 snapshot과 실제 Grammar/매처 |
| V05 | 다섯 문법 목표 양성·음성 | PASS M: 수동/to/가주어/관계절/가정법, 비교·what·현실조건 음성 |
| V06 | 한 공격 한 층·HP1에서도 양수 공격 해제 | PASS M/C: 활성층만 감소, 중복 공격 거부, HP1 실제 피해0 분리 |
| V07 | 마지막층 즉시 처치·HP1·생존 턴 회복400 | PASS M/C: 산술 기대자료를 실제 함수로 계산, 공격/턴 넘기기·중복 회복 |
| V08 | 시작 먼지4/5·층당 지원1·영구 사본 부족·만패 | PASS D/C: 시작1회, 보유량 기준, 두 번째 지원 DRAW_TOP, 영구 카드 보존 |
| V09 | 먼지/빙정 공존·실패/거절/종료/복원 | PASS D/C/K: 무효 제출 소멸, 엔진 거절 무변경, 패배 정리, 운영 receipt/저장 검증 |
| V10 | 후속 배율 포함 룬 기여·자원 제외·최대2·0/1 | PASS M: 동일 순서의 룬 제외 재계산, 동률 순서, 대상0/1/2 |
| V11 | 가능한 주절 시제5종·would/가정법/종속절 음성 | PASS M: 실제 VP·소유 사본 witness, 보조동사 부족 후보 제외 |
| V12 | 같은 공격 룬 복구·×1.25·다음 턴 후속 봉인 | PASS M/C: 실제 두 번 해제, 원래 룬 조건 불일치 시 미발동, 이후 추가 없음 |
| V13 | 매턴 WORD 최대2·페이지 무관·같은 사본 유지 | PASS D/C:0/1/2/10장, 운영/조합대 제외, 실제 교환/재셔플/재드로우와 배치 거부 |
| V14 | 미해제 Deep 처치·Universal 방해 제거/새 자원 | PASS C: 고정 합법 덱 연속 진행, 보상 없음, 새6턴·HP10000·임시/봉인 정리 |
| V15 | 마지막 턴 승리·중복 콜백/정산 방지 | PASS C: 실제 마지막 턴 처치·중복 완료·턴 회복 무변경. 이번 숨김 탭/watchdog 경로는 NOT RUN |
| V16 | 최고 점수+실제 문장·12공격 초과·HP와 분리 | PASS R: deep copy·선택형·먼 과거 최고 보존·12000위력/200피해 구분 |
| V17 | 최종50만·QA 제외·플레이어 최고·동점·21명 | PASS R/C: 실제 완료 경계·동일clearId·동점 유지·20명 표시/순위 밖 보존·불완전 저장/QA 표식 거부 |
| V18 | 안전 복귀의 과제/봉인/임시/최고/상점 보존 | PASS C/D/K/R: 처음/페이즈 사이 상태 왕복, 같은 턴 봉인/RNG, 변경된 근거 거부. 브라우저 슬롯 복귀는 V19 |
| V19 | PC 지정 덱 실제 UI 연속 진행·태블릿 표시 | PASS [production UI](../tests/finale-production-assigned.mjs):47→상점→48~50→결과/저장 복귀, 공격5회와 집결/돌진/피격, 태블릿 가로2상태. 자연50완주는 NOT RUN |
| V20 | 로컬 실제 보존·공용 미연결·실패/동일ID 재시도 | PASS R + [실제 IndexedDB](../tests/finale-record-storage-browser.mjs):21명/Top20·개인 최고·동점·동일ID/동시 중복·reload·실제 tx abort rollback·HTML 문자 안전. 공용 운영은 미연결·NOT RUN |

## 남은 한계와 인계

- 자연 보상으로 성장한 전체50전투, 사람 승률, HP/회복/해방의 자연 난이도: **NOT RUN**. 지정 상태 산술/통합을 자연 완주로 해석하지 않는다.
- PC/태블릿은 Chromium viewport 검사다. 실기기·전 브라우저/해상도 전수 검사는 **NOT RUN**이며 이번 필수 범위가 아니다. 태블릿의 긴 상태 문구 줄바꿈 등 미세 디자인은 후속 폴리싱으로 남긴다.
- 공용 서버/인증/운영 검증: **미연결·NOT RUN**. 외부 계정·비용·배포를 만들지 않았다. 로컬 기록과 공용 운영 완료를 구분한다.
- 최종 보스 전용 아트: **미제공**. 기존 테마/아이콘 fallback이며 미세 연출·디자인은 사용자 플레이 피드백 대상으로 남긴다.
- 구현 커밋 `649ccfc138aa835f8538a31ea50a5a6677516971`을 `codex/v0.11-final-trilogy`로 push하고 [PR #21](https://github.com/YEOMT/grammardealer/pull/21)을 Ready for review로 생성했다. 생성 시 원격 main은 기준 SHA와 동일했다. main 직접 변경·자동 병합·Pages 설정 변경·공개 배포는 하지 않았다. GitHub CI 결과는 로컬 검사 결과와 별개다.

## 대표 화면과 재현

- [Surface PC](evidence-0.11/surface-pc.png), [QA 완료 화면](evidence-0.11/final-clear.png), [합성 기록의 실제 로컬 랭킹 UI](evidence-0.11/local-records.png)
- [간결한 실행 요약](evidence-0.11/summary.json). 원본 영상·세부 로그·태블릿 캡처는 로컬 `.local-validation/v011/`에 보존했다.
- production 재현: `npm run build` 후 `node tests/finale-production-assigned.mjs`. 스크립트가4191의 로컬 서버와 격리 Chromium을 시작·종료한다. 저장 재현은 `node tests/finale-record-storage-browser.mjs`(4192). `PLAYWRIGHT_BROWSERS_PATH`는 이미 준비한 브라우저 위치를 지정한다.
- 사용자 플레이 확인 순서: 새0.11 원정 →47보상/최종소개/마지막 상점 →Surface의 현재 과제·회복 →Deep 룬/손패 봉인 →Universal →클리어 최고 문장·이 기기 랭킹. 기존0.10.2 저장은47완료 경계를 유지한다.
- 변경 파일군: finale 정책/과제/순수 보스/Controller·저장 통합, 버전 상속 분기, 작은 상태/완료/랭킹 UI, 집중 검사·역사적 fixture 범위, 명세·인계 문서. package/lock은 앱 버전만0.11.0으로 올렸으며 의존성·workflow 변경은 없다.
