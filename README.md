## Syntax Atlas 0.7.0 · 잿불 동굴

새 원정은 7지역/32전투입니다. 기존 동사 형태로 분사 수식·수동태·동사별 목적격보어를 조합하고, 전투 한정 검은 먼지와 잠든 잿불룡의 검댕 비늘에 대응합니다. 기존 0.6.1 이하 저장은 원래 정책과 완료 경계를 유지합니다.

[변경 내역](docs/PATCH_NOTES_0.7_KO.md) · [실제 검증과 한계](docs/TEST_REPORT_0.7.md) · [123개 인수 조건](docs/ACCEPTANCE_0.7.md). 추가 명령은 `test:browser:ember`, `test:decks:ember`, `test:runs:ember`, `test:e2e:ember`입니다. `test:e2e`는 현재 production UI에서 버전을 고정한 0.6.1 초기 저장을 불러오는 호환 경로입니다. 새 0.7 원정은 `test:e2e:ember`에서 UI로 시작합니다.

아래는 이전 버전 기록입니다.

## Syntax Atlas 0.6.1 · Grammar & Operations Polish

27전투와 기존 자원을 유지하며 운영 7종/+1 연마, 보급·직접 탐색 재사용, 상점 운영 전용 칸, Stage 4 연결어 선택과 보스 빙정 탐색을 연결합니다. 새 언어 view의 AP-to 생략 목적어 연결/동사구 부사 판정, 새 운석 배율, 지역 테마와 빙정 가독성을 개선합니다. 0.6 이하 저장은 자동 업그레이드하지 않습니다.

[변경 내역](docs/PATCH_NOTES_0.6.1_KO.md) · [실제 검증과 한계](docs/TEST_REPORT_0.6.1.md) · [139개 인수 조건](docs/ACCEPTANCE_0.6.1.md). 기존 공식 명령에 집중 `npm run test:browser:061`을 추가했습니다. 지정 상태 검사와 실제 production 원정의 결과는 분리합니다. 아래는 이전 버전 기록입니다.

## Syntax Atlas 0.6.0 · 거울의 설원

새 0.6 원정은 총 27전투입니다. 비교급·최상급·as ~ as·too/enough, 전투 한정 빙정 WORD, 설원 입구의 세 번째 상점과 빙결핵 5개 보스를 추가합니다. 0.5.1 이하 원정은 원래 카드·HP·룬·RNG·완료 경계를 유지합니다.

[변경 내역](docs/PATCH_NOTES_0.6_KO.md) · [실제 검증과 한계](docs/TEST_REPORT_0.6.md) · [173개 인수 조건](docs/ACCEPTANCE_0.6.md). 새 문법은 해금 전에도 정답이며 비교 콤보는 해당 원정의 Stage 5 완료 후 열립니다. 일반 비교 단어의 정규 보상은 Stage 6 완료로 해금됩니다.

빙정은 손패에서 조합·교환·보급·탐색할 수 있습니다. 제출하면 깨지고 전투 종료 시 제거됩니다. 보스 결정은 양수 위력의 정상 공격에 실제 사용한 결정 대상 빙정 사본 수만큼 깨집니다. 비교 문장 다섯 종류나 단어 순서를 강제하지 않습니다. 결정이 남으면 HP 1을 보존하며 마지막 결정을 깨는 공격부터 처치할 수 있습니다.

검사: 기존 `npm test`, `npm run validate:data`, `npm run build`, 개발 서버의 `npm run test:browser`, production의 `npm run test:e2e`. 추가 `npm run test:decks:snow`, `npm run test:runs:snow`, `npm run test:browser:snow`. 자동 정책 완주율은 사람 승률이 아니며 지정 상태와 실제 UI 완주는 보고서에서 구분합니다. 내부 저장소 이름·DB·`/grammardealer/`는 그대로입니다. 이 브랜치의 push/PR은 공개 배포가 아닙니다.

아래는 이전 버전 기록입니다.

## Syntax Atlas 0.5.1 · Core Polish

기존 22전투를 유지하며 핵심 타격·오버킬·튜토리얼 스킵·교육/형태 UI를 정돈합니다. 새 원정에만 Stage 4/5 HP 초깃값을 적용하고 이전 저장은 당시 수치와 규칙을 유지합니다. [패치 내역](docs/PATCH_NOTES_0.5.1_KO.md) · [실제 검증 및 한계](docs/TEST_REPORT_0.5.1.md) · [89개 인수 조건](docs/ACCEPTANCE_0.5.1.md).

추가 검사: 개발 서버에서 `npm run test:browser:polish`, `npm run test:browser:cross`. Playwright 1.51.1의 Chromium/Firefox/WebKit을 사용합니다. build 뒤 `npm run test:e2e`는 production 하위경로에서 튜토리얼 스킵 후 실제 UI 원정을 실행합니다. `SB_E2E_SEED=run-sequence.12`가 이번 완주 검증에 사용하는 시드입니다. 실제 실행 결과는 보고서가 기준입니다. `npm run package`는 Python3가 있는 환경의 로컬 ZIP 생성이며 공개 배포를 수행하지 않습니다.

아래 내용은 이전 릴리스 기록입니다.

## Syntax Atlas 0.5.0

소원의 사막까지 새 원정22전투. 기존 -ing 형태 한 개를 쓰며 제출 후 동명사·분사·진행 역할을 분석합니다. 스핑크스의 봉인 카드는 이번 턴 배치만 금지되고 교환할 수 있습니다. 기존 저장은 원래 버전 범위를 유지합니다. [변경 내역](docs/PATCH_NOTES_0.5_KO.md) · [실제 검증](docs/TEST_REPORT_0.5.md).

추가 QA: npm run test:decks:desert / npm run test:runs:desert. 기존 필수 test/data/build/browser/e2e 명령은 유지합니다. 아래0.4이하 설명은 이전 릴리스 기록입니다.

# Syntax Atlas 0.4.0 · 이음의 하늘섬

새 원정은 초원·항구·협곡·하늘섬의 총17전투입니다. 접속사·절 판정, 손패에서 사용하는 보급/탐색, 두 번째 상점을 추가했습니다. 기존0.3 저장은 원래12전투 범위를 유지합니다. 새28장 덱은 have 한 장을 고정하고 be/have/you/I를 고급으로 표시합니다.

[패치 내역](docs/PATCH_NOTES_0.4_KO.md) · [실제 검증](docs/TEST_REPORT_0.4.md) · [교육 검토](docs/EDUCATION_REVIEW_0.4.md) · [운영 카드 검토](docs/OPERATION_CARD_REVIEW_0.4.md)

개발: `npm ci`, `npm run dev`. 필수 검사: `npm test`, `npm run validate:data`, `npm run build`; 개발 서버 127.0.0.1:5173에서 `npm run test:browser`; 빌드 뒤 `npm run test:e2e`는 독립 production 서버의 `/grammardealer/`에서 실행합니다. `npm run test:decks:sky`는 새10,000개 시작덱, `npm run test:runs:sky`는 유한 QA 정책80원정입니다. Windows는 `npm.cmd`를 사용할 수 있습니다. Playwright1.51.1 Chromium이 필요합니다.

내부 패키지명·저장소·IndexedDB·공개 경로는 유지합니다. 브랜치/PR 검증과 main 병합·공개 배포는 별도입니다. 아래는 과거 버전 설명입니다.

# 0.3.0 · 시간의 협곡

새 원정에서 초원·항구·시간의 협곡의 총 12전투를 플레이합니다. 과거/진행/완료/will 미래, 순차 3부위 골렘, 장문 운석 룬을 추가했습니다. 시작 28장과 초원·항구 HP/첫 상점은 유지합니다. 기존 저장은 당시 제공 범위와 수치를 유지합니다.

변경: [패치 내역](docs/PATCH_NOTES_0.3_KO.md), 검증: [0.3 테스트 보고서](docs/TEST_REPORT_0.3.md). 개발 서버가 필요한 npm run test:browser에 협곡 검사를 포함하고 npm run test:runs:time은 80개 시간 공략 명령 원정을 실행합니다. 아래는 이전 버전 설명입니다.

## 0.2.2 grammar learning update

Latest main baseline: 50b4311 (merged 0.2.1). New runs consume a card submission and turn even when the core sentence is incomplete (zero damage). Grammar evidence is independent of unlocked combo bonuses. My Deck includes the word dictionary; the sentence codex preserves English, grammar evidence and actual power without generated translations. Older runs keep their rules. See [patch notes](docs/PATCH_NOTES_0.2.2_KO.md), [verb audit](docs/VERB_FRAME_AUDIT_0.2.2.md), [education review](docs/EDUCATION_REVIEW_0.2.2.md), and [actual test report](docs/TEST_REPORT_0.2.2.md).

Production does not expose the developer sandbox or debug state. Development mode retains them.

> 0.2.1 개발본: 고정 Stage 1-1 실습과 새 초원 HP 77/132/242를 적용합니다. 최신 변경·실제 검증은 [패치 노트](docs/PATCH_NOTES_0.2.1_KO.md)와 [검증 보고서](docs/TEST_REPORT_0.2.1.md)를 확인하세요. 아래 0.2 설명 중 변경된 부분은 이 후속 문서를 우선합니다. 공개 배포 여부와 구분합니다.

# 센텐스 발라트로 0.2

단어 카드를 조립해 영어 문장으로 공격하는 로컬 학습 카드 게임입니다. 여행자·난이도 1의 새 원정에서 시작의 초원 3전투와 전달의 항구 4전투, 총 7전투를 진행합니다. Vanilla JavaScript + ES Modules + Vite 구조이며 서버·외부 AI API를 사용하지 않습니다.

- 저장소: [YEOMT/grammardealer](https://github.com/YEOMT/grammardealer)
- 공개 주소: [Grammar Dealer](https://yeomt.github.io/grammardealer/)
- 이 문서는 개발 소스의 0.2.0을 설명합니다. 공개 사이트 반영 여부와 실제 검증 결과는 [0.2 테스트 보고서](docs/TEST_REPORT_0.2.md)를 확인하세요.
- 개발 기준은 작업 시작 시 fetch한 최신 `origin/main`입니다. 기존 소스 이관은 main에 반영되어 있으며 ZIP이나 배포 번들로 개발 소스를 대체하지 않습니다.

## 실행

Node.js 24 권장, 최소 버전은 `package.json`의 `>=22.12.0`입니다. 저장소 루트에서 기존 lockfile로 설치합니다. Windows에서 PowerShell의 npm 실행 방식이 제한되면 같은 명령의 `npm.cmd`를 사용하세요.

```sh
npm ci
npm run dev
```

개발 화면은 `http://localhost:5173/`입니다. production은 `npm run build` 후 `npm run preview`로 확인합니다. `dist/index.html`을 `file://`로 직접 열지 않습니다.

## 플레이 순서

1. 이름·어휘 모드·시드를 정하고 새 원정을 시작합니다. 기존 첫 전투 가이드와 첫 룬 선택이 이어집니다.
2. 시작의 초원 3전투를 진행합니다. 카드 본체는 조합, 별도 체크는 버리기 선택입니다. be의 am/is/are는 형태 메뉴에서 직접 고릅니다.
3. 초원 보스 보상 후 전달의 항구로 이동합니다. 4형식과 토파즈 룬 후보가 해금되며 보스의 보호 장막 공략을 미리 확인합니다.
4. 필요한 동사·to/for의 입장 준비 0~2장을 확인하고 첫 상점에서 카드·룬 구매, 연마·제거를 선택합니다. 상점을 나올 때 덱을 섞고 항구 첫 전투를 시작합니다.
5. 항구 일반전 3회와 보스전을 진행합니다. `She gives me a book.`처럼 주절 4형식을 한 번 맞히면 그 공격부터 보스 장막이 해제됩니다. `She gives a book to me.`는 3형식입니다.
6. 항구 보스 보상 후 `전달의 항구 완료 — 0.2 제공 구간을 모두 플레이했습니다.`에서 끝납니다. 전체 48전투 스토리 클리어는 아닙니다.

새 원정은 **28장**, 기본 **6턴·4교환·첫패 6장·이후 3장 드로우·손패 한도 10·조합대 16장**입니다. 보상·입장·구매 후 소유 덱은 늘어날 수 있습니다. 기본 처치 재화는 일반 2, 지역 보스 6에 처치 후 남은 턴 수를 더합니다. 공개된 혼합 보상 세 칸 중 한 개만 얻으며 연마·제거·룬 교체를 취소하면 그대로 돌아갑니다.

초원 HP는 `91/156/286`, 항구 HP는 `220/300/380/640`입니다. 기존 최대 카드 수 배치, 선택 버리기, 느려진 채점, 룬 색상 연출, 도감의 한글 뜻 참고를 유지합니다. 제출 전 정답·점수 미리보기는 없습니다.

## 문법·상점·저장

현재형 SV/SVC/SVO와 give/show/make/send의 SVOO를 지원합니다. 등록된 SVO+to/for 표현은 3형식이며 토파즈와 항구의 4형식 보너스를 받지 않습니다. 5형식·과거·부정사·관계절 등 범위 밖 문법은 `UNSUPPORTED`입니다. 한글 뜻 참고는 작은 검증 템플릿과 성분별 fallback이며 문법 판정·점수와 분리됩니다.

첫 상점은 룬 1칸·카드 2칸·연마·제거입니다. 카드 가격은 일반/고급/희귀 `6/10/14`, 룬은 `18/24/32`, 연마는 `8`, 첫 유료 제거는 `6`입니다. 연마와 제거는 각각 상점당 한 번이며 성공한 유료 제거마다 다음 가격이 2 증가합니다. 상품은 재표시·취소·저장 복원으로 재추첨되지 않습니다.

기존 IndexedDB `sentence-balatro-v0-1`의 프로필·수동 3슬롯을 유지합니다. 첫 조작 전 전투, 보상, 전투 사이, 지역 완료, 안정된 상점, 제공 구간 완료에서 저장할 수 있습니다. 상점 대상 선택·거래 중에는 저장하지 않습니다. 자동 원정 저장이나 클라우드 동기화는 없습니다. localhost와 공개 사이트는 origin이 달라 기록을 공유하지 않습니다.

**0.1.0/0.1.1 저장은 기존 초원 구간과 `STAGE1_END`를 유지합니다.** 이전 원정을 자동으로 7전투로 늘리지 않으며 카드·HP·공개 보상·룬·재화·RNG를 보존합니다. 같은 프로필로 새 0.2 원정을 시작하면 영구 기록과 이미 얻은 해금은 이어집니다.

## 검증

```sh
npm test
npm run validate:data
npm run test:decks
npm run test:runs
node tools/simulate-entry.js
npm run build
npm run test:e2e
```

`npm run test:browser`는 별도로 실행한 `npm run dev` 서버가 필요합니다. `test:e2e`는 production `dist/`를 자체 하위경로 서버에 올려 실제 UI로 진행합니다. Playwright 브라우저가 없다면 lockfile의 Playwright 버전에 맞춰 `npx playwright install chromium`을 사용합니다. 이미 준비된 환경은 재설치할 필요가 없습니다.

`test:decks`는 4어휘 모드 총 10,000 시작 덱, `test:runs`는 현재 손패를 사용하는 실제 Controller 명령, `simulate-entry`는 400개 고정 시드의 실제 초원 진행 후 입장을 검사합니다. 합성 UI 배치·단위 fixture와 실제 플레이 완료 증거를 구분합니다. 실행 수치, 실패, NOT RUN, 정책 한계는 [TEST_REPORT_0.2.md](docs/TEST_REPORT_0.2.md)를 따릅니다. Chromium touch emulation은 실제 iPad Safari 검사와 다릅니다.

## 개발·배포 경계

먼저 [AGENTS.md](AGENTS.md), [프로젝트 인계](docs/PROJECT_HANDOFF.md), [아키텍처](docs/ARCHITECTURE.md), [0.2 구현 명세](spec/SentenceBalatro_0.2_Codex_Implementation_Prompt.md)를 읽습니다. [0.2 변경 안내](docs/PATCH_NOTES_0.2_KO.md)와 [알려진 문제](docs/KNOWN_ISSUES.md)도 확인하세요. 과거 실행 기록은 별도 history·baseline 문서에 보존합니다.

소스는 저장소 루트, 빌드는 `dist/`입니다. Vite의 상대 `base: './'`와 hash routes를 유지합니다. `.github/workflows/deploy-pages.yml`의 PR 검사는 test/data/build를 수행하며 Pages 업로드·배포는 main의 비PR 실행과 성공한 build에만 연결됩니다. 개발 브랜치 push·PR 생성은 main 병합이나 공개 배포와 별개입니다. Pages 설정 변경·main 직접 push·자동 merge는 이번 개발 작업에 포함하지 않습니다.

Stage 3 이후, 48전투 완성, 다른 캐릭터·난이도, 서버·랭킹, PWA·오프라인 새 로드는 구현 범위 밖입니다. 필요한 자원을 한 번 로드한 뒤 네트워크를 차단한 플레이의 실제 검증 범위는 테스트 보고서를 확인하세요.
