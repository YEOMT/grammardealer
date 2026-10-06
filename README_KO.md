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

## 0.2.2 변경

새 원정은 문장 미완성도 카드·턴을 소모하여 피해 0으로 제출합니다. 문법과 콤보 해금은 분리하며, 사전은 단어 설명을, 도감은 번역 없는 영어·문법·실제 위력 기록을 제공합니다. 구버전 원정은 원래 규칙을 유지합니다. [패치 노트](docs/PATCH_NOTES_0.2.2_KO.md) · [동사 검토](docs/VERB_FRAME_AUDIT_0.2.2.md) · [교육 문구 검토](docs/EDUCATION_REVIEW_0.2.2.md) · [실제 검증](docs/TEST_REPORT_0.2.2.md).

> 0.2.1 개발본: 고정 Stage 1-1 실습과 새 초원 HP 77/132/242를 적용합니다. 최신 변경·실제 검증은 [패치 노트](docs/PATCH_NOTES_0.2.1_KO.md)와 [검증 보고서](docs/TEST_REPORT_0.2.1.md)를 확인하세요. 아래 0.2 설명 중 변경된 부분은 이 후속 문서를 우선합니다. 공개 배포 여부와 구분합니다.

# 센텐스 발라트로 0.2 — 한국어 안내

현재 실행·플레이·저장·개발 안내는 한국어로 작성된 [README.md](README.md)를 기준으로 합니다. 두 문서에 서로 다른 버전이나 배포 상태가 남지 않도록 이 파일은 안내 목차로 유지합니다.

- [설치와 실행](README.md#실행): Node 24 권장, 기존 lockfile의 `npm ci`, Windows의 `npm.cmd`.
- [플레이 순서](README.md#플레이-순서): 시작의 초원 3전투 → 항구 예고·입장 준비 → 첫 상점 → 전달의 항구 4전투.
- [문법·상점·저장](README.md#문법상점저장): 현재형 4형식, to/for의 3형식 구분, 토파즈, 수동 3슬롯, 구버전 원정 보존.
- [0.2 변경 안내](docs/PATCH_NOTES_0.2_KO.md): 새 기능과 유지한 조작·자원·채점·배치.
- [0.2 실제 검증](docs/TEST_REPORT_0.2.md): 실행 명령·PASS/FAIL/NOT RUN·합성과 실제 UI 플레이 구분.
- [Codex 프로젝트 인계](docs/PROJECT_HANDOFF.md): 최신 main 기반 개발, 코드 책임, 저장 호환성과 후속 경계.

저장소와 공개 주소는 각각 [YEOMT/grammardealer](https://github.com/YEOMT/grammardealer), [현재 공개 게임](https://yeomt.github.io/grammardealer/)입니다. 이 문서의 0.2 개발 소스가 공개 사이트에 배포되었다는 뜻은 아닙니다.
