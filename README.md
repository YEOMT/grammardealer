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
