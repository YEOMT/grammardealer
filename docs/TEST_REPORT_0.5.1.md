# 0.5.1 실제 검증 보고서

## 기준과 실행 환경

작업 시작 최신 origin/main은 `2c03b2492b21f2bca27f10718e35bc4e291861bb`(0.5 PR #7 병합)이다. 시작 미커밋 변경은 없었고 별도 `codex/v0.5.1-core-polish`에서 구현했다. 원본 MD/ZIP 내부 명세의 SHA256은 모두 `EB82D974ECCC6DDAF368BEE843BC25712D33D950C9BE399D8231B93FB609F388`이다. 부속 자체검사 결과를 게임 PASS로 가져오지 않았다.

Windows x64, Node24.19.0, npm11.17.0, Git2.51.0, Vite8.3.2, Playwright1.51.1을 사용했다. Node/npm은 checkout의 `../.local-tools/node-v24.19.0-win-x64/`, 브라우저는 `../.local-tools/playwright-browsers/`다. 기존 lockfile 의존성·시스템 PATH·Codex 런타임을 변경하지 않았다. package/lockfile의 프로젝트 버전만0.5.1로 바뀌었다.

검증 서버는 이 작업에서 시작한 localhost5173 개발 서버와 E2E의 독립 localhost4174 `/grammardealer/` 정적 서버다. 검증용 새 브라우저 컨텍스트/프로필을 사용했으며 공개 사이트나 기존 사용자 저장을 지우지 않았다. Firefox135.0(build1475), WebKit18.4(build2140), Chromium134.0.6998.35(build1161) 바이너리는 같은 Playwright 버전용이다. WebKit은 Windows 엔진 검사이며 실제 Safari/iPad가 아니다.

## 실제 결과

게임 소스는 `.local-validation/v051/final3/`에서 고정했다. 공식 전체 browser와 실제 production22는 final3, 중심점 측정 도구를 바로잡은 polish/cross 및 최종 test/data/build는 final4다. 이 사이 게임 src는 바뀌지 않았다. 빌드 해시를 대조해 production 검증본과 최종 산출물이 같은지 확인한다. 종료된 명령과 엔진별 결과는 아래 표와 공개 `validation/v0.5.1/commands.json`을 따른다. 과거 0.5의726검사/261browser/49공격 수치는 이번 결과로 재사용하지 않는다.

| 실제 명령 | 결과 | 종료 코드 / 근거 |
|---|---|---|
| `npm.cmd test` | PASS 767 | 0, 단위·저장·기존 golden 포함 |
| `npm.cmd run validate:data` | PASS 2,748 | 0 |
| `npm.cmd run build` | PASS | 0, production 검증 빌드와 자산 해시 동일 |
| `npm.cmd run test:browser` | PASS 262 checks | 0, 공식 13개 스크립트 전체 완료; 정상 튜토리얼 47 checks/27 PNG 포함 |
| `npm.cmd run test:browser:polish` | PASS 49 checks | 0, Chromium core32/UI17, 22 PNG |
| `npm.cmd run test:browser:cross` | PASS 92 checks | 0, Firefox46/WebKit46, 각19 PNG |
| `npm.cmd run test:e2e` | PASS | 0, 실제 production UI22전투/51공격/운영5회/32 checks/39 PNG |
| `python tests/package-release.test.py` | PASS 1 test | 0, 임시 두 버전 fake-dist 검사 |
| `python tools/package-release.py` | PASS | 0, 실제 최종 production·source ZIP 생성 |
| `python .local-validation/v051/check-package.py` | PASS | 0, 두 ZIP 재개봉·manifest/자산/base/제외 경로 검사 |

Python 명령의 `python`은 아래에 설명한 기존 bundled 실행 파일을 뜻한다. 실행 시각·종료 코드는 [commands.json](validation/v0.5.1/commands.json), [package-commands.json](validation/v0.5.1/package-commands.json)에 기록했다. P001–P089의 결과는 별도 인수표이며 check 수를 재사용하지 않는다.

production 시드는 `run-sequence.12`, STANDARD/LEARNING이다. 콘솔·페이지·네트워크·자산 오류는0이다. 실제 문지기 전투는 보호막이 유지된 일반 공격 경로(550+206+4=760)를 검증했다. 접속사절 첫 공격의 영구 해제는 별도 실제 엔진/지정 상태 sky 검사이며, 자연 production 원정에서 그 경로까지 검증했다고 주장하지 않는다.

`npm test`는 단위·엔진·Controller·저장·golden 회귀다. 브라우저 check 수는 스크립트가 완료한 묶음 수이며 assertion 총수나 P001–P089 수와 다르다. 명령이 중단된 뒤 실행하지 못한 하위 스크립트는 당시 NOT RUN이다.

## 검증 층위

1. **변경 전 기준**: 이번 작업에서 .5.0 원본 npm test726/build를 실제 재실행했다. 별도05 registry/hash·8시드 덱/오프너/RNG·40보상·8상점·11공격과 후반 안전 저장 상태를 수정 전에 캡처했다. 기준 golden은 다시 생성하지 않았다. 기존0.1~0.4 golden과 테스트도 유지한다.
2. **합성 산술**: 실제 parser/engine으로 B01~B05 점수320/360/401/437/537을 검증했다. 새 보스 HP에서 동일 위력의 필요 공격 수는3/3/2/3/2다. 같은 문장을 두 번 실제로 뽑는다는 보장은 아니다. 배수나 최대 위력을 HP에 맞춰 바꾸지 않았다.
3. **지정 상태/확정 resolution**: CORE_MATRIX와 V01~V20은 실제 DOM/CSS/네이티브 rAF를 쓰지만 지정된 결과다. 16조합/14손패/4룬, 효과 감소/OS reduce, WAAPI 없음/예외, CSS zoom125%를 검사한다. 운영 카드 주입·과거 her 별칭·긴 문장 기록 모달도 지정 상태로 표기한다.
4. **명령 자동 원정**: 유한 후보 정책으로 seed를 탐색했다. 초기 QA 도구의 .5.1 운영 후보 누락을 수정한 뒤 run-sequence.12가 운영5회와 함께 완료됐다. 탐색 중 패배는 가능 시드나 학생 승률의 결론이 아니다. 피해/HP를 조작하지 않았으며 UI 완주와 구분한다.
5. **실제 production UI**: 신규 프로필에서 확인을 눌러 스킵하고 일반1-1부터22전투를 실제 버튼·카드·형태·교환·준비·보상·상점·운영으로 진행한다. 후보 선택은 QA 정책이 하고 명령 shadow는 동일성 확인용이다. 게임 상태 주입이나 강제 처치를 하지 않는다. 초기 자산 로딩 뒤 네트워크를 끄고 저장 복원, 골렘 단계, 스핑크스 자연 봉인, 완료 영수증을 확인한다. 정상 튜토리얼40/126은 별도 guided-browser에서 실제 진행한다.
6. **사람 검수**: 교사 최종 검수·학습자 난이도/이해도·스피커 청취·실 iPad/Android·브라우저 툴바 확대·OS 강제종료/실 quota는 NOT RUN이다. CSS zoom·Windows WebKit·자동 audio 호출을 이 증거로 대체하지 않는다.

## 실패 이력과 수정 이유

- 개발 중 스킵 검사는 프로필 교육 재검토가 unrelated 필드를 추가하는 문제와 SKIPPED 저장에 완료 전용 교환 규칙이 적용되는 문제를 발견했다. 스킵 사건은 별도 flag만 추가하고 SKIPPED 종료 상태를 따로 검증하게 수정했다. 게임 통계·카드·RNG·프로필 설정을 유지한다.
- 최초 데이터 실행 래퍼는 Windows 로그 파일명 `validate:data.log`의 콜론 때문에 npm을 실행하지 못했다. stale 종료값0은 PASS가 아니다. 원본과 정정 JSON을 보존했고 이후 `validate-data.log`로 실제2748검사를 실행했다.
- 초기 UI 도구는 검색창 Escape의 검색 취소 동작 및 닫히는 dialog까지 센 선택자 때문에 실패했다. 명시적 닫기와 열린 dialog 범위로 수정했다. 새 긴 문장 probe도 처음 입력이66자여서70자 이상 조건을 만족하지 않았다. 기준을 낮추지 않고 실제 parser VALID인78자/16카드 문장으로 바꿨다.
- `v02-ui-browser`는 장막이 점수 계산 중 먼저 해제되는 옛 기대값에서 실패했다. 명세§3의 ‘보스 외형과 HP는 IMPACT에서 함께 변경’에 맞춰 충돌 전 둘 다 before, 충돌 시 둘 다 after를 별도로 검사한다. HP/피해 기대값을 완화하지 않았다.
- `time-canyon-browser`는 옛 회백색/붉은색 RGB와 ‘형태 안내’를 기대했다. §6.6의 선명한 흰색, 새 부드러운 적색, ‘피드백’ 표식으로 정확한 값을 갱신했다. 글자 크기/굵기·문법·점수 검사는 유지한다.
- `grammar-learning-browser`의 동사마다 공통 ‘주어 + 동사’ 강의를 기대하는 검사를 §6.5에 따라 공통 강의 비반복 검사로 바꿨다. 뜻·허용 형태·보유/제거 기록·실제 develop 문법 회귀는 유지한다. 튜토리얼 다시 시작/다시 보기 선택자는 새 학생용 명칭을 따른다.
- .5 진행 테스트의 생성 Controller는 명시적 legacy05 helper로 고정했다. 역사적 HP640/840 기대값을 새HP로 덮어쓰지 않는다. E2E 기본 경로는 명세의 스킵으로 바꾸고 실제 검증 시드12를 사용한다. `SB_E2E_GUIDED=1`은 원래 정상 튜토리얼 경로다.
- Firefox는 sandbox 내 초기화가 멈췄으며 이 작업 소유 프로세스만 종료했다. 같은 검사 실행을 sandbox 밖에서 재시도했다. WebKit은 한글 경로의 native 영상 writer가 실패했다. 녹화를 끄지 않고 OS 임시 경로에 기록한 뒤 증거 폴더에 복사한다.
- 확대 좌표가 중복 적용되는 실제 공격체 오프셋과 WebKit2배속 짧은 돌진의 WAAPI pending 시작 지연을 발견했다. viewport→CSS 좌표 변환과 document timeline의 명시적 시작 시각으로 수정했다. duration/속도/피해는 유지하며 같은 중간 이동·가시성 assertion을 재실행한다.
- 이후 WebKit2배속의 또 다른 실패 프레임에는 실제11.8px 이동이 있었지만 축소 전 조립체의 상단과 축소 중 상단을 비교해5px 조건을 놓쳤다. 상단 대신 중심점으로 측정하여 축소만으로는 통과하지 못하게 했다. 이동5px/opacity/가시성 기준은 그대로이며 원본 rAF 좌표와 실패 로그를 보존했다. 게임 애니메이션 시간을 늘려 검사를 통과시키지 않았다.
- 최초 추가 ZIP 검사는 HTML 자산 경로가 절대 `/grammardealer/`로 시작한다고 가정해 실패했다. 기존 Vite 설정은 `base:'./'`이므로 검사 도구에서 실제 브라우저처럼 하위경로를 기준으로 URL을 해석하도록 바로잡고 ZIP 안 파일 존재를 다시 확인했다. 게임/base 설정은 변경하지 않았다.

최초 실패/중간 통과는 `.local-validation/v051/`의 baseline, final, final2, 개별 로그에 남는다. 예전 Work 보고서와 원본ZIP/기존 백업은 그대로다. 고정 출력71개는 이번 출력을 별도로 보관한 뒤 기존 SHA256으로 복원했다. timing.json의 이번 pre-edit 백업은 baseline 실행에서 생성된 파일이라 원래 manifest와 달랐다. 기존 v05 백업에서 원래 해시가 일치하는 파일을 찾아 복원했고, 이번 baseline timing도 보존했다. 공개 evidence-restoration.json에71개 검증과 복구 출처를 기록한다.

## 패키징·변경 범위·원격 전달

실제 package 검사는 최종 build 뒤 읽기 전용 bundled Python3.12.14의 실행 파일로 `tools/package-release.py`를 실행하고 두 ZIP을 다시 연다. 이 Windows PATH에는 python3 alias가 없어 `npm run package` alias 대신 동일 스크립트를 직접 호출한다. 런타임 파일을 수정/설치하지 않는다. 별도 Python unittest는 임시 fake-dist 두 버전 검증이며 production ZIP 검사와 구분한다. 파일명prefix, source의 `sentence-balatro/`, `/grammardealer/`는 유지한다. 패키징은 로컬 파일 생성만 한다.

소스·테스트·표시 데이터·버전 view·보고서·선별 증거를 변경했다. 언어 정의/파서/점수식·룬 데이터 배수·보상/상점 가격·구버전 golden·의존성 버전은 변경하지 않았다. `.local-tools`, node_modules, dist, release, 원본 로그/중복 영상, 임시 파일은 commit하지 않는다. 전체 원본이 동일하다는 주장은 하지 않는다.

구현 커밋 `0eadb113b52048eee8dd41ff93793a950ae8e3f1`을 작업 브랜치에 push하고 [PR #8](https://github.com/YEOMT/grammardealer/pull/8)을 생성했다. PR은 open/ready이며 autoMerge는 null이다. 생성 시 main은 기준 SHA `2c03b2492b21f2bca27f10718e35bc4e291861bb` 그대로였다. P089를 실제 원격 결과로 PASS로 갱신했으며 P001–P089는89 PASS/0 FAIL/0 NOT RUN이다. 별도로 명시한 사람·실기기 검사는 NOT RUN을 유지한다. main 직접 push·병합·Pages 설정 변경·공개 배포는 수행하지 않았다.

후속 검토 순서는 [패치 노트](PATCH_NOTES_0.5.1_KO.md), 전체 조건은 [인수 결과](ACCEPTANCE_0.5.1.md), 실제 행동은 [production-actions.json](validation/v0.5.1/production-actions.json)을 따른다.
