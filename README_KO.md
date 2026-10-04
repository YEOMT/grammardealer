# 센텐스 발라트로 0.1.1

단어 카드를 조립해 영어 문장으로 공격하는 로컬 학습 카드 게임입니다. 여행자·난이도 1로 시작의 초원 3전투를 플레이할 수 있습니다. Vanilla JS + ES Modules + Vite로 구현했습니다.

- 저장소: <https://github.com/YEOMT/grammardealer>
- 배포 대상: <https://yeomt.github.io/grammardealer/>
- 현재 소스가 이후 개발의 기준입니다. 원격 `main` 반영 후에는 그 최신 소스를 기준으로 이어갑니다.
- 이번 인계는 소스/워크플로 준비입니다. 원격 push, Actions 실행, 실제 Pages 갱신은 수행하지 않았습니다.

## 실행

Node.js 24 권장(최소 22.12), npm을 설치하고 이 파일이 있는 폴더에서 실행합니다.

```sh
npm ci
npm run dev
```

개발 화면은 `http://localhost:5173/`. 배포 파일을 직접 더블클릭하는 `file://` 실행은 지원하지 않습니다.

```sh
npm test
npm run validate:data
npm run build
npm run preview
```

`npm test`는 기존·패치 테스트 전체를 실행합니다. Node 테스트 격리 비활성화는 이 환경에서 실제 개별 테스트 결과를 수집하기 위한 설정입니다. 테스트는 런타임 게임 상태에 연결되지 않습니다.

## 플레이

카드 본체 클릭/드래그는 조합, 작은 체크는 버리기 선택입니다. 선택 후 아래 버리기를 누르면 교환 1회를 쓰며 선택 수만큼 보충합니다. be는 원형으로 시작하며 형태 버튼에서 am/is/are를 고릅니다. 공격과 준비는 행동 턴을 사용합니다. 공격 확정 전에는 정답/점수 미리보기가 없습니다.

새 원정은 28장, 6턴, 기본 교환 4회입니다. 초원 HP는 91/156/286. 처치 재화는 기본 2/2/6에 처치 행동 이후 남은 턴 수를 더합니다. 보상은 고정된 세 후보 중 하나만 받습니다. 연마/제거는 대상 선택을 취소해 돌아갈 수 있습니다.

## 저장·지원 범위

브라우저 IndexedDB에 프로필 및 수동 3슬롯을 저장합니다. 첫 조작 전/보상/전투 사이/구간 완료에서 저장합니다. 새로고침은 수동 저장한 지점만 복원합니다. 이전 0.1 저장은 기존 카드·HP·보상을 유지합니다. 로컬 저장은 **origin별**이므로 localhost와 GitHub Pages의 기록은 공유되지 않습니다.

현재형 SV/SVC/SVO, 제한된 형용사·부사·전치사구를 판정합니다. 미구현 고급 문법은 `UNSUPPORTED`입니다. 한글 뜻 참고는 도감/공격 상세의 작은 로컬 모듈이며, 다의성·미등록 템플릿은 성분별 뜻으로 표시합니다. 의미 자연스러움으로 감점하지 않습니다.

Stage 2, 전체 48전투 스토리, 새 캐릭터, 서버/랭킹, 외부 AI 번역, PWA는 구현하지 않았습니다. 첫 로드 이후 네트워크가 끊겨도 플레이/저장은 가능하나 오프라인 새 로드·설치는 보장하지 않습니다.

## Codex 인계

먼저 [AGENTS.md](AGENTS.md), [PROJECT_HANDOFF](docs/PROJECT_HANDOFF.md), [ARCHITECTURE](docs/ARCHITECTURE.md)를 읽습니다. 패치 근거는 `spec/SentenceBalatro_0.1.1_Work_Patch_Prompt.md`, 실제 결과는 [TEST_REPORT](docs/TEST_REPORT.md), 항목별 변경은 [PATCH_NOTES](docs/PATCH_NOTES_0.1.1_KO.md)입니다. 과거 보고서는 `docs/history/0.1/`에 분리했습니다.

## GitHub Pages 자동 배포 준비

소스 ZIP의 `sentence-balatro/` **내용**을 저장소 루트에 반영합니다. 루트에 `package.json`, `src/`, `.github/workflows/`가 있어야 합니다. 저장소 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 설정합니다. `main` push는 테스트 → 데이터 검사 → production build → Pages 배포로 이어집니다. PR은 테스트/빌드만 수행합니다. 별도 토큰/서버/비밀키는 필요하지 않습니다.

`vite.config.js`의 `base: './'`를 유지하므로 `/grammardealer/` 및 정적 하위 경로에서 자원을 찾습니다. `dist/`와 `node_modules/`는 Git에 올리지 않습니다. 기존 배포 ZIP을 main 소스 대신 올리지 않습니다. 원격 기존 파일·충돌은 실제 저장소를 읽고 정리해야 하며, 이번 작업에서 원격 상태를 확인하거나 덮어쓰지는 않았습니다.

워크플로는 GitHub 공식 Pages 안내를 기준으로 작성하고 공식 action 태그의 commit을 고정했습니다. 근거: <https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages>. 원격 권한/환경 설정을 포함한 첫 배포 검사는 `NOT RUN`입니다.

## 추가 검증·패키징

```sh
npm run test:decks
npm run test:runs
npx playwright install chromium
npm run test:e2e
npm run test:browser
npm run package
python3 tools/verify-release.py
```

`test:e2e`는 먼저 만든 `dist/`를 자체 정적 서버로 검사합니다. `test:browser`는 별도 터미널의 `npm run dev`가 필요합니다. Chromium touch emulation을 사용하며 실제 iPad 검사를 대신했다고 주장하지 않습니다. 상세 실행법·검증 범위는 TEST_REPORT를 참고하세요.
