# Syntax Adventure — 로컬 v0.1.1 검증 보고서

> 공개용 인계 기록: 개인 절대 경로는 상대 참조로 바꿨다. 아래 과거 실행의 raw 로그·캡처·환경 정보는 보존된 로컬 인계 소스에 남아 있으며 Git에 포함하지 않는다. 새 Git checkout의 진행 상태는 [SOURCE_MIGRATION_REPORT.md](SOURCE_MIGRATION_REPORT.md)를 따른다.

검증일: 2026-10-04, Asia/Seoul. 이번 Windows 재실행 결과만 본문의 PASS로 집계한다.

**결론: 이관 전에 해결할 차단 사항 있음.** Node/npm 준비, 기본 검사와 production 실전 E2E는 통과했다. 그러나 공식 `test:browser`가 Windows 스크린샷 파일 경로 처리 오류로 종료 코드 1을 반환했다. 게임 코드 실패로 확인된 것은 아니지만, 공식 검증 묶음 전체의 통과를 확인하기 전에는 소스 이관 준비 완료로 판정하지 않는다. 이번에는 테스트 도구도 수정하지 않았다.

## 1. 검증 기준과 보존 범위

- 작업 폴더: `..`
- 소스 루트: `../SentenceBalatro_0.1.1_source/sentence-balatro`
- `package.json`: `sentence-balatro`, **0.1.1**, Vanilla JS / ES Modules / Vite. 새 가칭은 Syntax Adventure이며 내부 식별자나 화면 제목은 변경하지 않았다.
- 저장소와 공개 주소는 계속 `YEOMT/grammardealer`, `https://yeomt.github.io/grammardealer/`이다. 이번 실행에서 원격 상태나 공개 사이트를 검증하지 않았다.
- 사용자 지시에 따라 최초 소스 이관 전에는 위 로컬 소스를 기준으로 삼았다. `AGENTS.md`의 최신 main 기준은 검증된 소스의 최초 이관·병합 이후 적용한다. 원격 배포 파일로 로컬 소스를 덮어쓰거나 번들에서 소스를 재구성하지 않았다.
- `spec/`의 역사적 0.1 설계와 `SentenceBalatro_0.1.1_Work_Patch_Prompt.md`를 구분했다. 과거 수치를 현재 구현에 되돌리지 않았다.
- 소스 루트, 작업 폴더와 확인한 상위 경로에 `.git`이 없어 현재 로컬 소스는 Git checkout이 아니다. Git 실행 파일은 사용 가능하다. Git init/commit/push/PR/merge/배포는 수행하지 않았다.

## 2. 개발환경 준비

실행 플랫폼은 `Microsoft Windows 10.0.26200`, win32 x64다. 시작 시 Codex에 포함된 Node v24.19.0은 실행 가능했으나, PATH 및 확인한 일반 설치 위치에서 npm/npm.cmd와 해당 번들의 npm CLI를 찾지 못했다. 따라서 단순히 `npm.ps1` 대신 `npm.cmd`를 호출하면 해결되는 상태는 아니었다.

`package.json`의 Node 조건은 `>=22.12.0`, `.github/workflows/deploy-pages.yml`의 Node 설정은 **24**다. 사용자 다운로드 승인 후, 기존 Work 실행과 버전을 맞춘 공식 **Node 24.19.0 LTS / npm 11.17.0 Windows ZIP**을 작업 폴더에 풀었다. 관리자 설치, 시스템 PATH 변경, Codex 런타임 수정, 광범위한 보안 설정 변경은 하지 않았다.

| 도구 | 실제 버전 | 실제 실행 경로 |
|---|---|---|
| 검증용 Node | v24.19.0 | `..\.local-tools\node-v24.19.0-win-x64\node.exe` |
| npm (PowerShell) | 11.17.0 | `..\.local-tools\node-v24.19.0-win-x64\npm.ps1` |
| npm.cmd | 11.17.0 | `..\.local-tools\node-v24.19.0-win-x64\npm.cmd` |
| Git | 2.51.0.windows.2 | `git.exe (PATH)` |
| 원래 발견한 Codex Node | v24.19.0 | `node.exe (original bundled runtime; not part of this repository)` |

준비 후 `node --version`, `npm --version`, `npm.cmd --version`, `git --version`을 실제 실행했다. 검증에는 명시적으로 `npm.cmd`를 사용했다. PATH 조정은 각 검증 프로세스에만 적용했으므로 새 터미널에서는 아래 설정이 필요하다.

공식 [Node ZIP](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip)을 [공식 SHA256 목록](https://nodejs.org/dist/v24.19.0/SHASUMS256.txt)과 대조했다. 크기는 37,304,352 bytes, SHA256은 `57F71AB3652E797D84ACDDC79C81CC9FF1C6DDB2A1974CDB83F00FEE9BFF4C73`로 일치했다. ZIP과 체크섬은 `.local-tools/downloads/`에 보존했다.

`npm ci`는 기존 lockfile에 따라 18개 패키지를 설치했다. Vite **8.3.2**, Playwright **1.51.1**을 유지했고 npm install/upgrade나 lockfile 재생성은 하지 않았다. npm 캐시는 작업 폴더의 `.local-tools/npm-cache/`다. audit/fund 보고는 실행 환경에서만 껐다. `npm ci`에 출력된 npm 업그레이드 알림에 따라 업데이트하지 않았으며, 후속 명령에서는 업데이트 알림도 껐다. 취약점 감사는 이번 검증에 포함하지 않았다.

승인된 추가 다운로드로 lockfile의 Playwright 1.51.1 CLI를 사용해 Chromium **134.0.6998.35 / revision 1161**, 대응 headless shell, FFmpeg 1011, winldd 1007을 `.local-tools/playwright-browsers/`에 준비했다. 기본 Chromium 실행 경로는 `.local-tools/playwright-browsers/chromium-1161/chrome-win/chrome.exe`이고 기존 검사들은 headless 모드로 실행했다. 기존 브라우저 프로필을 사용하지 않았다.

근거: `codex-baseline/2026-10-04/environment.json`, `node-install.json`, `playwright-install-result.json`, `logs/browser-preflight.txt`.

## 3. 실제 실행 명령과 결과

아래 npm 명령의 작업 디렉터리는 모두 위 소스 루트다. 소요 시각과 종료 코드는 각 `*-result.json`, 출력은 `codex-baseline/2026-10-04/logs/`에 보존했다.

| 명령 / 검사 | 이번 결과 | 종료 코드 | 확인 내용 |
|---|---|---:|---|
| `npm.cmd ci` | PASS | 0 | 기존 lockfile 설치, 18 packages |
| `npm.cmd test` | PASS | 0 | **207/207**, fail 0 / skip 0 / cancelled 0 |
| `npm.cmd run validate:data` | PASS | 0 | **2,251 checks**, Lexeme 116 / 활성 115, Form 243 / 활성 183, frame 5 |
| `npm.cmd run build` | PASS | 0 | Vite 8.3.2, 39 modules, production dist 생성 |
| `node node_modules/playwright/cli.js install chromium` | PASS | 0 | 고정 Playwright 버전에 맞는 실행 환경 설치 |
| `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort` | PASS | 정상 기동 후 종료 | 공식 browser 검사용 localhost 서버; HTTP 200 확인 |
| `npm.cmd run test:browser` | **FAIL** | **1** | 입력 B / 보상 C / 교육 D / 연출 E 통과 후 ui-browser 첫 스크린샷에서 실패 |
| `npm.cmd run test:e2e` | PASS | 0 | production 1366×768 정상 효과, **실제 UI 공격 6회로 Stage 1의 세 전투 완주**, 14개 check 기록 |
| `node <작업폴더>/.local-tools/production-subpath-check.mjs <소스루트> <결과폴더>` | PASS | 0 | 정확한 `/grammardealer/` 경로 보충 검사 **5개**; 실제 UI 1회 공격 및 저장/불러오기 |

기본 검사는 19:29~19:31 KST, 공식 browser는 19:33:52~19:34:46, E2E는 19:34:46~19:36:12에 실행했다. 보충 검사는 19:35:33~19:35:47에 별도의 임시 origin으로 실행했다.

초기 진단 중 소스 루트가 아닌 상위 작업 폴더에서 `node tools/validate-data.js`를 한 번 호출하여 MODULE_NOT_FOUND가 발생했다. 작업 디렉터리를 바로잡은 독립 사전 검사와 위 npm 검사는 모두 PASS다. 이는 명령 호출 위치 오류이며 게임 실패가 아니다. Node ZIP의 첫 제한 네트워크 시도는 socket 권한 오류였고, 승인된 네트워크 실행으로 다운로드·체크섬 검증을 완료했다. 해결된 진단 오류를 공식 검사의 FAIL에 섞지 않았다.

### 공식 browser 실패 원인

`tests/ui-browser.mjs:10`은 스크린샷 경로에 `new URL(...).pathname`을 사용한다. 이번 Windows 경로에서는 드라이브 문자와 공백/한글 URL 인코딩이 파일 경로로 변환되지 않아 다음과 같은 잘못된 경로를 만들었다.

```text
ENOENT: open '<malformed-file-url-path>/ui-1366-lobby.png'
```

분류는 **테스트 도구의 Windows 경로 호환 문제**다. 브라우저 기동과 로비 진입 후 첫 캡처에서 중단되었으며 현재 `ui-browser` 결과는 **checks 0 / screenshots 0**이다. 과거 Work의 41 checks PASS를 이번 결과로 인정하지 않는다. 뒤의 해상도·capacity·drag/touch 검사는 **NOT RUN**이다.

최소 수정 제안은 `node:url`의 `fileURLToPath`로 해당 URL을 파일 경로로 변환하는 것이다. 게임 코드, assertion, 기대값을 바꿀 필요가 있다는 근거는 없다. **제안만 기록했으며 실제 파일은 수정하지 않았다.** 이후 승인된 별도 변경에서 경로 처리만 수정하고 공식 묶음 전체를 다시 실행해야 한다.

입력/보상/교육/연출의 네 단계는 이번에 실제 PASS했다. 이 묶음에는 UI 조작뿐 아니라 고정 fixture, 연출 fault 주입 등이 포함되므로 네 단계 통과를 실제 플레이 완주라고 표현하지 않는다. 현재 실행 증거는 `generated/docs/evidence-0.1.1/phase-b-browser.json`부터 `phase-e-browser.json`, 실패 증거는 같은 위치의 `ui-browser.json`과 `logs/test-browser.txt`다.

## 4. Production 및 실제 UI 검증 범위

공식 E2E는 원본 `tests/e2e.mjs`를 그대로 실행했다. 이 스크립트의 경로는 `/nested/sentence-game/`이며 `/grammardealer/`와 같다고 보고하지 않는다. `SB_EVIDENCE_SUFFIX=-codex-20261004`로 이번 출력을 구분했다. 실제 현재 손패를 바탕으로 선택을 예측하는 shadow Controller를 사용하지만, 브라우저의 게임 상태는 UI 조작으로 진행한다. 완주를 위해 HP를 줄이거나 카드를 주입하지 않았다.

| 항목 | 이번 결과와 범위 |
|---|---|
| production HTML / JS / CSS | PASS — 정확한 `/grammardealer/`의 HTML, JS, CSS 요청 모두 HTTP 200; 개발 debug API 없음 |
| 로비와 원정 시작 | PASS — 임시 프로필, seed `run-sequence.0`, 실제 새 원정 28장·첫 손패 6장 |
| 문장 조립과 공격 | PASS — 공식 E2E 실제 6회 공격; 보충 검사는 실제 1회 공격으로 91 HP 적 처치 후 REWARD 진입 |
| 보상 진행 | PASS — 공식 E2E에서 고정 보상 저장/불러오기, 첫 룬 crystal/amber/copper, 다음 전투 진행 |
| Stage 1 세 전투 | PASS — 공식 production `/nested/sentence-game/`, 초기 리소스 로드 후 네트워크 차단 상태에서 완주 |
| 정확한 `/grammardealer/`의 세 전투 완주 | NOT RUN — 이 경로의 보충 검사는 로딩·저장·1회 공격·hash refresh 범위 |
| 로컬 저장/불러오기 | PASS — 공식 E2E의 초기 상태, 보상 상태와 완료 상태 저장; 초기/보상 복원 검증. 보충 검사의 slot 1 UI 왕복은 RNG·카드 ID를 포함해 일치 |
| 프로필 기록 | PASS — 공격/완료 중복 반영 없음, 기록 조회·도감·연습이 원정/기록을 부당하게 바꾸지 않음 |
| 연출·라우팅 | PASS — 타격 전 HP 유지, 점수 미리보기 없음, hash 새로고침/뒤로가기; 검사 범위 내 pageerror/외부 runtime 요청 없음 |
| 1024×768 production 효과 감소·음소거 완주 | NOT RUN — 과거 Work 결과만 있음 |
| 실제 공개 사이트 | NOT RUN — 공개 주소 접속·배포·저장 데이터 작업 없음 |

공식 E2E 결과는 `generated/docs/evidence-0.1.1/production-browser-codex-20261004.json`이다. 정확한 하위경로 검사는 `production-subpath/production-subpath-check.json`과 PNG 5개, 재현용 보충 스크립트 `production-subpath-check.mjs`에 보존했다. 공식 테스트 파일은 변경하지 않았다.

모든 검사는 localhost의 새 비영구 Playwright context를 사용했다. 기존 사용자 브라우저나 공개 사이트의 IndexedDB/localStorage를 열거나 삭제하지 않았다. 저장 슬롯 검증은 이번 테스트에서 생성한 프로필에 한정한다. 기동한 테스트 서버와 브라우저는 검사 후 종료했다.

이번 fresh build의 `.nojekyll`, `index.html`, `assets/index-DxEhgGoB.css`, `assets/index-yJ9R6E63.js` **네 파일은 기존 로컬 `SentenceBalatro_0.1.1_deploy`의 대응 파일과 SHA256이 모두 일치**한다. 이는 로컬 보관 배포 산출물과의 대조이며 현재 원격 배포 확인은 아니다. 근거: `build-comparison.json`.

## 5. 과거 Work 증거와 이번 증거의 분리

기존 `docs/TEST_REPORT.md`, `docs/history/`, `docs/evidence-0.1.1/`의 결과는 과거 실행 기록이다. 그 문서의 “이번 실행”이라는 표현은 2026-10-03 UTC의 Work 실행을 뜻하며 이 보고서의 Windows 재실행을 뜻하지 않는다.

| 검사 | 과거 Work 기록 | 이번 Windows 재실행 |
|---|---|---|
| 단위/회귀 | 207 PASS | **207 PASS** |
| 데이터 | 2,251 PASS | **2,251 PASS** |
| 10,000 시작덱 검사 | PASS | 독립 `test:decks` **NOT RUN** |
| 80회 플레이 시뮬레이션 | 77 완주 / 3 패배 | 독립 `test:runs` **NOT RUN** |
| 공식 UI 행렬 | 41 checks PASS | **FAIL**, 첫 캡처에서 중단 / 0 checks |
| production E2E | 1366 및 1024 완주 | **1366 정상 효과 PASS**, 1024 별도 설정 NOT RUN |
| 별도 저장 장애 browser / 릴리스 ZIP 검사 | 과거 PASS 기록 있음 | 해당 독립 스크립트 **NOT RUN** |

실제 iPad/Android, Firefox/WebKit, OS 백그라운드 복귀/메모리 압박, 실제 quota 소진, 원격 GitHub Actions/Pages, 옛 standalone 브라우저 테스트는 이번에 **NOT RUN**이다. Node 회귀 내 포함된 검사를 실행한 것과 별도 대량 시뮬레이션·standalone 검사를 실행한 것을 혼동하지 않는다.

## 6. 기존 발견 사항과 연마 표현 정정

이번 실제 검증에서 새로 입증된 게임 코드 실패는 없다. 다음 기존 발견 사항은 미수정으로 유지한다.

- 공격 기록의 `languageVersion`: `src/engine/stage.js:62`의 구버전 fallback 표기 문제.
- 소유격의 한글 뜻 참고 및 `COMPLETE_HINT`: `src/engine/meaning.js`의 제한된 조립 규칙 문제. 의미 참고를 문법·점수 정답으로 사용하지 않는다.
- 전투 중 남은 턴 보너스의 사전 안내 누락: `src/ui/combat.js`; 실제 승리 정산의 턴 재화는 이번 공식 E2E에서 정상 확인했다.
- 공식 묶음 밖 옛 standalone 브라우저 테스트의 구버전 기대값. 해당 기대값에 맞추려고 현재 0.1.1을 되돌리지 않았다.

**“연마 +3”은 최대 연마 단계가 3이라는 뜻이다. 점수는 단계당 +5이므로 서로 다른 개념이다.** `src/data/balance.js`의 기본 카드 점수 10 / `polishPerLevel: 5` / `polishMax: 3`, `src/engine/scoring.js:66`의 `baseScore + polishLevel * polishPerLevel`, `src/game/rewards.js`의 1단계 증가 및 3단계 상한을 대조했다. 0.1.1 패치 명세의 +1/+2/+3 표시와 관련 회귀/보상 browser 검사도 이 의미다.

| 카드 표시 | 연마 단계 | 기본 10점 카드의 기여 점수 |
|---|---:|---:|
| 무연마 | 0 | 10 |
| +1 | 1 | 15 |
| +2 | 2 | 20 |
| +3 | 3 | 25 |

Iron 룬의 별도 가산 5/8/12는 룬 레벨에 따른 연마 카드당 효과이며, 위 연마 단계당 +5와 별개다. 앞선 인수인계의 “연마 +3”이 “3점 가산”처럼 읽힐 수 있는 표현을 이 보고서에서 정정한다. 게임 수치는 변경하지 않았다.

## 7. 파일 생성·복원과 무결성

검증 전에 기존 소스 **311개 파일 / 36,351,572 bytes**를 작업 폴더의 `.baseline-backup/2026-10-04-v0.1.1/original-source/`에 복사하고 SHA256을 대조했다. 원본 목록은 `manifest-before.json`에 보존했다. 기존 ZIP이나 별도 배포/인수인계/캡처 폴더를 수정하지 않았다.

테스트가 기존 증거를 덮어쓴 뒤 다음 순서로 처리했다.

1. 내용이 변경된 기존 증거 14개를 이번 `generated/`로 복사한 후 원본 백업에서 복원했다. `timing.json`, `reward-distribution.json`, 실패한 `ui-browser.json`도 포함한다.
2. 실제로 재작성되었지만 내용은 과거와 동일한 phase B/C/D JSON 3개도 이번 출력으로 보존하고 원본을 복원했다. 이번 실행 여부는 별도 실행 로그로 확인한다.
3. 이번 E2E에서 새 이름으로 생성한 13개 증거를 해시 대조 후 이번 `generated/`로 옮겼다. 기존 evidence 폴더에는 이번 결과를 섞어 남기지 않았다.

따라서 기존 증거 **17개 복원**, 새 증거 **13개 분리**, 이번 공식 검사 출력 **30개 보관**이다. 보충 검사의 JSON/PNG는 처음부터 별도 경로에 기록했다. `generated-files.json`, `preservation-result.json`에 세부 내역이 있다.

최종 대조에서 원래 311개 파일의 SHA256이 전부 일치한다. **src/게임 데이터/밸런스/저장 형식/패키지 버전/원래 tests/spec/tools/lockfile 변경 없음.** `package-lock.json` SHA256은 `515BE2E929790E48F2A4154AA10DA8A5436EF4CD0401865136AA7BDE49E8BD22`다. 최종 근거는 `final-integrity.json`이며, 이번 보고서·증거 파일 목록은 `new-report-files.json`에 기록했다.

이번에 새로 생긴 항목은 다음과 같다.

| 위치 | 용도 |
|---|---|
| 작업 폴더 `.local-tools/` | portable Node/npm, 다운로드 ZIP/체크섬, npm 캐시, Playwright 실행 파일, 보충 검증 스크립트 |
| 작업 폴더 `.baseline-backup/2026-10-04-v0.1.1/` | 기존 소스 및 Work 증거의 원본 보관 |
| 소스 루트 `node_modules/` | lockfile 기반 설치 |
| 소스 루트 `dist/` | 새 production build |
| `docs/codex-baseline/2026-10-04/` | 이번 로그/JSON/캡처, manifest·해시 대조, 재현용 보충 검사 사본 |
| `docs/CODEX_BASELINE_REPORT.md` | 이 보고서 |

환경 파일·node_modules·dist·백업은 이번 검증용 로컬 산출물이며, 향후 이관 시 소스와 구분해 검토해야 한다. 이번에는 Git 설정이나 ignore 파일도 수정하지 않았다.

## 8. 재현 조건과 다음 단계

아래는 **소스 루트**에서 사용하는 PowerShell 환경 설정이다. 시스템 환경 변수를 영구 변경하지 않는다.

```powershell
$taskNodeDir = (Resolve-Path '..\..\.local-tools\node-v24.19.0-win-x64').Path
$env:PATH = "$taskNodeDir;$env:PATH"
$env:npm_config_cache = (Resolve-Path '..\..\.local-tools\npm-cache').Path
$env:PLAYWRIGHT_BROWSERS_PATH = (Resolve-Path '..\..\.local-tools\playwright-browsers').Path
```

기본 명령은 `npm.cmd ci`, `npm.cmd test`, `npm.cmd run validate:data`, `npm.cmd run build`다. 공식 browser는 별도 프로세스의 위 Vite localhost 서버가 필요하며, E2E는 자체 production 서버를 기동한다. 검사 실행 전 기존 evidence를 다시 백업해야 한다. E2E의 `SB_EVIDENCE_SUFFIX`는 새 출력 구분에 도움이 되지만 다른 검사들의 고정 파일명 덮어쓰기를 막지 않는다.

보충 검사를 재현할 때는 위 환경에서 다음과 같이 작업 폴더의 helper에 절대 경로 인자를 전달한다. 결과 폴더는 재실행마다 별도로 정한다.

```powershell
$taskSourceRoot = (Get-Location).Path
$taskWorkspaceRoot = (Resolve-Path '..\..').Path
$taskResultDir = Join-Path $taskSourceRoot 'docs\codex-baseline\<새 실행 ID>\production-subpath'
node (Join-Path $taskWorkspaceRoot '.local-tools\production-subpath-check.mjs') $taskSourceRoot $taskResultDir
```

다음 단계는 테스트 도구의 Windows 경로 변환을 별도 허용 범위에서 최소 수정하고 공식 `test:browser` 전체를 다시 검증하는 것이다. 게임 기능이나 밸런스를 수정해야 한다는 결론은 이번 실패에서 나오지 않는다. 소스 이관은 그 검증 이후 별도 작업으로 수행하며, 공개 배포는 이번 범위에 포함하지 않는다.

**최종 판정: 이관 전에 해결할 차단 사항 있음 — 공식 browser 묶음의 Windows 실행 실패를 해결하고 미실행 UI 검사를 완료해야 한다.**

## 9. 후속: Windows 파일 경로 최소 수정 및 실제 재검증

실행 ID: **`2026-10-04-windows-path-fix-01`**, 2026-10-04 Asia/Seoul. 위 1~8절은 직전 baseline 당시의 결과로 그대로 보존했다. 이 절이 그 이후의 최신 결과이며, 과거 0 checks 경로 실패와 이번 11 checks 레이아웃 실패를 구분한다.

**Windows 파일 경로 오류는 수정되어 캡처 저장이 정상 진행됐다. 그러나 공식 UI 검사가 별도의 레이아웃 assertion에서 실패하여 전체 browser PASS에는 도달하지 못했다.** 허용 범위에 따라 게임 코드나 검사 기준을 수정하지 않고 나머지 독립 검증을 완료했다.

### 9.1 실제 수정과 환경

수정한 기존 테스트 도구는 **`tests/ui-browser.mjs` 한 파일**이다. `node:url` import 1줄과 screenshot 함수의 변환식 한 곳만 변경했다.

```diff
+import {fileURLToPath} from 'node:url';
-const path=new URL(`${name}.png`,evidence).pathname;
+const path=fileURLToPath(new URL(`${name}.png`,evidence));
```

출력은 그대로 `docs/evidence-0.1.1/<name>.png`다. 절대 경로 하드코딩, 드라이브 문자 잘라내기, 수동 URL decode, 프로젝트 전체 pathname 치환은 하지 않았다. Node fs가 직접 받는 URL과 HTTP 라우팅의 pathname은 유지했다. 공식 묶음과 E2E에서는 추가로 같은 유형의 경로 오류가 발견되지 않았다.

수정 전 전체 파일에 위 두 변경만 적용한 문자열이 수정 후 파일과 정확히 일치함을 확인했다. 줄바꿈, assertion, 기대값, 검사 조건, screenshot 옵션, 실패 시 예외 및 종료 코드 처리는 모두 유지했다. 전후 파일과 diff는 이번 결과 폴더의 `before/tests/ui-browser.mjs`, `ui-browser.after.mjs`, `ui-browser.diff`, `diff-verification.json`에 있다.

- 수정 전 SHA256: `A48F5332B64F5729A666A26E24B320A141B6753D24EA2AA8D770EBDB33742307`
- 수정 후 SHA256: `94E7AC71322D546E1BEFC8D16267BF0144CBF33849F2E1A548404F1667F3B5C8`

기존 `.local-tools`의 Node **24.19.0**, npm **11.17.0**, Playwright **1.51.1**, Chromium **134.0.6998.35**를 재사용했다. 설치·다운로드·업그레이드·시스템 PATH 변경은 없었다. `package.json`, `package-lock.json`, 저장소명, `/grammardealer/`, 내부 패키지명, IndexedDB 이름/형식도 그대로다.

### 9.2 실제 순차 실행 결과

모든 명령은 동일한 로컬 소스 루트에서 **순차 실행**했다. 실행 기록은 `docs/codex-baseline/2026-10-04-windows-path-fix-01/commands.json`, 개별 `*-result.json`, `logs/`에 있다. 재현용 실행 래퍼는 같은 폴더의 `run-validation.ps1`이다. 이 래퍼는 npm 종료 코드를 그대로 기록하고 browser 실패 이후에도 독립 E2E를 실행하며, 전체 종료 코드는 **1**이었다.

| 실제 명령 | KST 시작 → 종료 | 종료 코드 | 이번 결과 |
|---|---|---:|---|
| `npm.cmd test` | 19:57:22 → 19:58:15 | 0 | **PASS 207/207**, fail 0 / skip 0 / cancelled 0 |
| `npm.cmd run validate:data` | 19:58:15 → 19:58:17 | 0 | **PASS 2,251 checks** |
| `npm.cmd run build` | 19:58:17 → 19:58:21 | 0 | **PASS**, 39 modules |
| `npm.cmd run test:browser` | 19:58:23 → 19:59:27 | **1** | **FAIL** — B/C/D/E PASS, 마지막 UI 검사에서 새 assertion 실패 |
| `npm.cmd run test:e2e` | 19:59:27 → 20:00:54 | 0 | **PASS**, 14개 검사 기록 / 실제 UI 공격 6회 / Stage 1 세 전투 완주 |

공식 browser 전에 `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort`를 숨김 프로세스로 기동하여 HTTP 200을 확인했다. 이번에 시작한 PID 19788만 종료했다. E2E는 기존 스크립트가 별도 localhost production 서버와 새 비영구 browser context를 기동·종료했다. `SB_EVIDENCE_SUFFIX=-codex-windows-path-fix-01`로 E2E 파일명을 구분했다. 기존 사용자 프로필과 공개 사이트 저장소는 사용하거나 삭제하지 않았다.

### 9.3 마지막 UI 검사의 실제 도달 범위

이번 `ui-browser.json`과 stdout에 기록된 값은 **status FAIL / checks 11 / screenshots 5**다. checks는 통과한 검사 그룹의 기록 수이며 내부 assertion 총개수가 아니다. 과거 Work의 41 checks / 25 captures를 이번 결과로 재사용하지 않았다.

완료된 11개는 1366 로비·편집 배치, 편집 중 점수 미리보기 부재, 형태 메뉴, 교환 선택, 읽기 전용 더미, 클릭 응답 계측, 마우스 드래그, 카드 사이 삽입, pointercancel, 키보드 이동, resize 시 상태 보존이다. 실제 저장된 캡처는 `ui-1366-lobby.png`, `ui-1366-edit.png`, `ui-1366-form.png`, `ui-1366-exchange.png`, `ui-capacity-1366-synthetic.png` 다섯 개다.

그 뒤 `tests/ui-browser.mjs:39`에서 다음 assertion이 실패했다.

```text
AssertionError [ERR_ASSERTION]: 1366 capacity actions must not overlap hand
조건: capacityGeometry.actionBottom <= capacityGeometry.handTop + 1
```

재현 조건은 **Windows Chromium 134, 1366×768, seed `ui-layout-01`, 문장 16장 + 손패 10장 + Lv.3 룬 3개를 배치한 합성 renderCombat fixture**다. 파일 저장은 성공했으며 ENOENT가 아니다. 실패 캡처에서도 공격 버튼 하단이 손패 경계에 걸치는 것을 확인했다. 실제 원정에서 16장 문장을 만들어 완주한 결과로 해석하지 않는다.

따라서 공식 browser 명령 자체와 마지막 UI 스크립트까지 실행했으나, **마지막 UI 검사 전체 완료는 아님**이다. 최대 카드 배치의 나머지 해상도, 14장 손패 검사, 이후 viewport 입력/오류 검사, CDP touch 단계는 **NOT RUN**이다. 앞선 resize 상태 보존 PASS는 그 해상도의 전체 배치 PASS를 뜻하지 않는다.

### 9.4 추가 관찰과 최소 후속 수정 제안

공식 다섯 명령이 끝난 뒤 `node docs/codex-baseline/2026-10-04-windows-path-fix-01/capacity-diagnostic.mjs`를 한 번 실행했다(20:02:10~20:02:16 KST, 종료 0). 이는 새 임시 origin의 동일 구성 합성 renderer에서 DOM 좌표를 읽는 **별도 진단**이며, 공식 테스트의 조건을 바꾸거나 전체 검사를 PASS로 대체하지 않는다. 종료 0은 관찰 완료를 뜻한다.

폰트 준비와 두 프레임 이후 같은 화면을 3회 측정했고 모두 다음과 같았다.

| 관찰 항목 | 값 |
|---|---:|
| 조작 영역 하단 `actionBottom` | 547.59375 px |
| 손패 영역 상단 `handTop` | 546 px |
| 겹침 | **1.59375 px** |
| 원래 조건 `actionBottom <= handTop + 1` | **false** |
| `.combat-middle` 외곽 높이 / 내부 grid 행 높이 | 342 / 약 355.594 px |
| 문장 / 손패 카드 수 | 16 / 10 |

이 좌표는 별도 재현 진단의 측정값이다. 공식 실패 JSON은 좌표를 기록하지 않으므로 이 수치를 공식 실행이 직접 출력한 값이라고 주장하지 않는다. 근거는 `capacity-diagnostic.json`, `capacity-diagnostic.png`, 진단 스크립트와 로그다. 진단용 Vite 서버(5175)와 browser도 종료했다.

분류상 기존 경로 실패는 **테스트 도구 문제로 수정 완료**, 새 실패는 **기존 UI의 합성 최대 배치에서 관찰된 실제 레이아웃 assertion 실패**다. 코드상 한정된 중간행 세로 공간과 카드·조작부 최소 높이의 충돌이 원인 후보다. `src/ui/styles.css`의 viewport 높이 grid, 해당 폭의 중간행, 문장 flex 영역과 조작부 여백/높이가 관련된다. Windows 폰트 지표 차이의 기여 여부와 다른 OS 재현 여부는 확정하지 않았다.

최소 후속 수정 후보는 해당 폭에서 중간행·문장 영역의 세로 공간 배분을 조정하여 카드와 조작부의 실제 높이를 수용하는 CSS 변경이다. 정확한 속성·수치는 별도 허용 범위에서 결정해야 한다. **이번에는 src/CSS를 수정하거나 오차 허용치를 늘리지 않았다.** 후속 변경 시 원래 assertion을 유지한 채 4해상도와 10/14장 손패 fixture, 전체 공식 browser/E2E를 검증해야 한다.

### 9.5 E2E와 production 산출물

이번 공식 E2E는 **1366×768 / 정상 효과 / `/nested/sentence-game/`**에서 14개 검사 기록을 통과했다. 실제 현재 손패를 UI로 조립해 공격 6회로 세 전투를 완주했으며, 초기 리소스 로드 후 오프라인 진행, 보상 선택·고정 후보 복원, 저장/불러오기, 완료 기록의 중복 방지, hash 새로고침과 뒤로가기 등을 확인했다. 결과는 `generated/docs/evidence-0.1.1/production-browser-codex-windows-path-fix-01.json`이다.

새 build의 `.nojekyll`, `index.html`, CSS, JS 네 파일은 **직전 baseline build와 SHA256이 모두 동일**하다(`build-comparison.json`). 정확한 `/grammardealer/` 보충 검사는 이번 후속에서 다시 실행하지 않았으며, 4절의 직전 결과를 보존한다. 공개 Pages 접속·배포, 다른 OS, 실제 모바일 기기, 1024 production 효과 감소 E2E, 별도 옛 standalone 검사는 이번 후속에서도 **NOT RUN**이다.

### 9.6 파일 구분과 증거 보존

검사 시작 전에 원래 파일과 직전 baseline을 포함한 소스 루트 384개 파일의 manifest를 만들었다(`node_modules` 제외). 기존 evidence 98개, 수정 전 UI 도구와 보고서를 이번 폴더의 `before/`에 보관했다. 기존 `.baseline-backup`과 원본 ZIP에는 쓰지 않았다. `.baseline-backup` 안의 원본 311개도 원래 manifest와 대조하여 모두 동일함을 확인했다. 이것은 **백업의 무결성**이며 현재 소스 311개가 모두 동일하다는 뜻이 아니다.

공식 검사에서 새로 작성된 출력 **35개**를 이번 `generated/`에 보존했다. 고정 이름으로 덮어쓴 기존 파일 22개(그중 phase B/C/D JSON 3개는 같은 내용)와 새 suffix의 E2E 파일 13개다. 기존 evidence 폴더의 98개 파일은 실행 전 내용으로 복원했고, 새 suffix 파일 13개는 해시 확인 후 그 폴더에서 분리했다. 손대지 않은 과거 출력은 이번 generated 결과에서 제외했다. 수정한 `tests/ui-browser.mjs`는 복원하지 않았다.

| 구분 | 결과 |
|---|---|
| 의도적으로 수정한 기존 테스트 도구 | `tests/ui-browser.mjs` 1개, 위 두 변경만 유지 |
| 갱신한 보고서 | `docs/CODEX_BASELINE_REPORT.md`에 이 후속 절만 추가; 앞선 본문 보존 |
| 새 실행 증거와 보조 도구 | `docs/codex-baseline/2026-10-04-windows-path-fix-01/` 아래 로그·JSON·캡처·before 사본·diff·검증 래퍼·진단 스크립트 |
| 다시 생성한 dist | 기존 baseline과 내용 해시 동일 |
| 게임 소스·데이터·설정·package/lockfile·나머지 기존 테스트/명세 | 내용 변경 없음 |
| 직전 baseline 증거 | 변경 없음 |
| 허용 범위 밖 예상하지 못한 기존 파일 변경 | 없음 |

파일별 근거는 `manifest-before.json`, `generated-files.json`, `preservation-result.json`, `final-integrity.json`, `new-files.json`이다. 이번 source 비교는 의도된 UI 도구 및 보고서 변경을 별도로 기록한다. 과거 “원본 311개 모두 동일” 결론을 이번 소스에 적용하지 않는다.

### 9.7 최신 판정

**이관 전에 해결할 차단 사항 있음.** 승인된 Windows 파일 경로 최소 수정과 다섯 명령 재실행은 완료했다. 경로 오류는 해결됐지만 공식 browser 묶음이 최대 배치의 실제 assertion에서 종료 코드 1로 끝났으므로, UI 배치 문제의 별도 검토·수정 및 남은 공식 검사 완료가 필요하다.

languageVersion, 소유격 뜻 참고/COMPLETE_HINT, 턴 보너스 사전 안내 등 기존 발견 사항은 그대로 유지했다. Git init/commit/push/PR/merge, GitHub Pages 설정 변경, 공개 배포는 수행하지 않았다.

## 10. 후속: Git 개발 브랜치 이관과 UI 배치 수정

2026-10-04, `codex/source-migration-v0.1.1`에서 인계 소스를 이관한 뒤 UI 배치를 최소 수정했다. 이 절은 이전 1~9절의 실패 기록을 대체하거나 삭제하지 않는다. 원본 로컬 보고서와 증거도 보존했다.

이관 commit은 `d2d404b`이며, UI 변경은 별도 commit으로 구분한다. 게임 변경은 `src/ui/styles.css`의 콘텐츠 기반 세로 행 배분, 작은 높이의 행 간격, 기존 스크롤 룬 패널의 크기 계산 분리에 한정했다. 테스트 조건, 데이터, 문법·점수·전투·저장 규칙, package/lockfile은 변경하지 않았다.

최종 순차 실행은 `npm.cmd test` **207 PASS**, `validate:data` **2,251 PASS**, `build` **PASS**, `test:browser` **전체 PASS / 마지막 UI 41개 검사 기록·25개 캡처**, `test:e2e` **PASS / 실제 공격 6회·세 전투 완주**이며 종료 코드는 모두 0이다. 별도 4해상도×손패10/14의 8개 조합에서도 문서 높이·버튼 접근·룬/손패 스크롤을 확인했다.

전후 캡처, 실제 검사 범위, 공개용 결과와 미실행 항목은 [SOURCE_MIGRATION_REPORT.md](SOURCE_MIGRATION_REPORT.md)에 기록한다. UI 수정으로 build 해시가 달라지는 것은 정상이며, 기존 두 차례 검증의 원본 동일성 결론을 이 수정본에 적용하지 않는다.

요청된 로컬 검증 차단 사항은 해소되어 **개발 브랜치의 PR 검토 준비 완료**다. main 병합·Pages 설정 변경·공개 배포는 별도 승인 범위이며 이번에 수행하지 않는다.
