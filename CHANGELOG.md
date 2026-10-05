## 0.2.2

New-campaign invalid-submission transactions, grammar/combo eligibility separation, curated multi-sense verb and basic-clause support, integrated deck dictionary, evidence-based untranslated sentence records. Legacy campaign pools/rules and 0.2.1 guided practice retained. See docs/PATCH_NOTES_0.2.2_KO.md and docs/TEST_REPORT_0.2.2.md for actual verification.

## 0.2.1 — 개발 브랜치 (미배포)

필수 Stage 1-1 실습, 확인 대기와 중단 복구, 카드 선택 체크 통합, 위력별 충돌/처치 연출을 추가했다. 새 초원 HP는 77/132/242이며 기존 저장의 HP/후보/RNG와 Stage 2·상점·룬 규칙을 보존한다. 실제 검증 결과와 제한은 docs/TEST_REPORT_0.2.1.md를 따른다.

# 변경 이력

## 0.2.0 — 개발 브랜치

최신 main `2fdafeba8c93435844eef2d7aec0f3e25509bde9`의 v0.1.1 정상 기능과 최대 카드 수 UI 수정을 보존하며 현재형 4형식·전달의 항구·첫 상점을 통합했다. 공개 배포 상태는 버전 제목으로 판단하지 않고 이번 테스트/원격 보고를 따른다.

- give/show/make/send의 실제 SVOO 분석, 여러 카드 IO/DO, 등록된 to/for 대응 3형식과 오류·미지원 범위 구분.
- 4형식 ×2, 토파즈 룬 Lv1/2/3 ×1.5/×2/×2.5, 항구 주절 4형식 ×1.25.
- 전달의 항구 4전투 HP 220/300/380/640과 한 번 해제되는 보스 장막. 새 원정은 총7전투 후 STAGE2_END.
- 초원 클리어 milestone과 최종 콘텐츠 완료 분리, 보스 보상 생성 전 실제 토파즈 후보 해금.
- runtime 경로에 따른 입장 준비 0~2장, 고정 상품 룬1/카드2, 실제 구매·룬 교체·연마·유료 제거.
- combat 없는 상점과 새 진행의 수동 저장, 기존 DB/프로필/3슬롯 유지. 0.1.0/0.1.1 원정은 기존 후보·RNG·STAGE1_END로 보존.
- IO/DO·룬·장막의 확정 이벤트 연출, 항구 도감·한글 참고와 새 화면. 기존 카드 조작·28장 시작 덱·전투 자원·읽기 시간·최대 카드 배치 유지.
- 새 문법·진행·상점·저장 회귀와 과거 main의72개 레거시 보상 golden 사례, 실제 명령 입장 검사 도구 추가.

항구 HP와 상점 가격은 이번 명세의 초깃값을 유지했다. 실제 검증 결과, 기대값 변경 근거, 실패·NOT RUN과 원격 반영은 `docs/TEST_REPORT_0.2.md`, 사용자 변경 안내는 `docs/PATCH_NOTES_0.2_KO.md`에 기록한다. 기존 history와 baseline 실행 기록은 보존한다.

## 0.1.1 — 2026-10-03

기존 0.1 실제 소스에 플레이 개선 패치를 통합했다.

- 읽을 수 있는 점수 템포와 동적 watchdog, 의미 있는 콤보 증폭, 실제 룬 색 빛 이동.
- 카드 본체 조립 유지 + 별도 체크 후 다중 버리기.
- be 원형 표시/수동 활용/단일 형태 진단.
- 실제 행동 기반 첫 전투 가이드와 독립 재연습.
- 항상 세 칸 혼합 보상, 연마/제거 대상 선택·취소·고정 후보 저장.
- 문장 도감의 한글 뜻 참고와 안전한 성분별 fallback.
- HP 91/156/286, 남은 행동 턴 재화, 강화 표기/획득 확인.
- 28장 덱·SV 두 동사·실제 첫 손패 문장 경로, 좌우 메뉴 가독성.
- 레거시 저장·188개 기존 테스트 범위 보존 및 신규 회귀 추가.
- AGENTS, README, 프로젝트 인계/구조 문서, GitHub Pages Actions 준비.

세부 변경과 실제 새 실행 결과는 `docs/PATCH_NOTES_0.1.1_KO.md`, `docs/TEST_REPORT.md`에 기록한다. 원격 push/배포는 수행하지 않았다.

## 0.1 — 보존된 기준

여행자로 시작의 초원 Stage 1 3전투를 완주하는 최초 버전. 구현 범위와 당시 검증은 `spec/` 및 `docs/history/0.1/` 참조. 초기 전체 소스와 실제 작업 폴더 일치를 확인한 후 0.1.1을 작업했다.
