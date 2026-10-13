# 0.10 구현 진행 기록

## 최신 체크포인트 — 2026-10-13 21:45 KST

- 구현과 최종 검증 완료. 단위 1,593 PASS / 0 FAIL / 0 skip, 데이터 3,112 PASS, build PASS. 공식 브라우저 14개 스크립트 전체 종료 코드 0.
- Stage 10 집중 검사는 Chromium·Firefox·WebKit 93 PASS, 고유 캡처 66장. Production의 지정 상태 43~47전투 5개 PASS와 캡처 15장을 확보했다. 실제 UI의 제출·보상·완료 저장을 검사했으며 자연 원정 완주와 구분한다.
- 구 0.6.1 production 27전투는 실제 60공격으로 완주했다. 새 0.10 자연 production은 7전투에서 정상 패배(종료 코드 1). Controller는 자원 실습 포함 3회와 실습 없는 고정 19회 모두 정상 패배했으며 최대 27전투에 도달했다. 자연 47전투와 후반 자연 학습 경로는 NOT RUN이다.
- 최종 공식 묶음에서 짧은 하늘섬 연결 강조 대기를 한 번 놓쳤다. 279ms 강조와 Playwright 선택자 대기의 최대 500ms 간격을 확인하고 해당 관찰만 프레임 단위로 변경했다. 가시성 assertion·시간 제한·스크린샷은 유지했으며 전체 묶음 재실행이 통과했다.
- 공개 보고서·110조건·언어 검토·대표 캡처를 작성했다. 기존 증거와 원본 ZIP은 보존했고 의존성 lock은 앱 버전 두 필드 외에 동일하다. 개인 절대 경로·인증정보 패턴 점검을 통과했다. 검증용 Vite 서버만 종료했다.
- 구현 커밋 `e1b0735`를 push하고 [Draft PR #15](https://github.com/YEOMT/grammardealer/pull/15)를 생성했다. main은 시작 SHA 그대로이고 auto-merge·Pages 설정·공개 사이트는 변경하지 않았다. 다음 개발자는 자연 보상 47전투 및 후반 학습 경로 검증 공백부터 확인한다. 수치 조정 없이 현재 증거와 QA 정책 한계를 먼저 구분한다.
- 상세 근거: [검증 보고서](TEST_REPORT_0.10.md), [110조건](ACCEPTANCE_0.10.md), [변경 목록](validation/v0.10/changed-files.txt). 아래는 당시 실패와 미실행 범위를 포함한 순차 기록이다.

- 기준: 최신 origin/main `db73c606784e1ba50e664224b404ccede7447591` (2026-10-13 fetch).
- 시작 작업 트리 clean. 이전 `codex/v0.9-dream-library` 보존. 소스 차이 없음.
- 작업 브랜치: `codex/v0.10-star-corridor-foresight`.
- 계약: `spec/v0.10/` 전체. 외부 MD와 ZIP MD 동일 바이트. JSON은 실행 전 기대자료.
- 기존 증거/추적 파일 해시: 로컬 `.local-validation/v010/`에 별도 보존. 이전 실행 결과는 이번 PASS가 아님.

## 완료 지점

1. AGENTS, 현재 인계·아키텍처·0.9 보고서와 0.10 계약 읽기, 최신 main 확인, 독립 브랜치 생성.
2. 수정 전 전체 단위검사 1,449 PASS. 실행 로그는 `.local-validation/v010/baseline-unit/`.
3. 새 modal/조건·가정/과거완료/현재완료진행 구조 분석과 같은 근거의 점수 중복 배제 구현. 실제 snapshot 신규 51 + 기존 문법 32 = 83 PASS (`grammar-second`).
4. Stage10 다섯 전투, 5번째 상점, 부족 영구 사본 기준 빙정, 47전투 종료, 예견·일반전 저항·저장 영수증 연결. UI 안내/도감/저항·기억 표시 추가.
5. 첫 통합 전체검사 1,498 PASS / 2 FAIL (`integration-first`). 구버전 선행 종속절 탐색 순서를 보존하여 0.6 분석 fingerprint 회귀 수정. 0.8.1 안내 검사를 해당 37전투에 고정(기대값 유지).
6. 집중 상태검사 첫 실행 143 PASS / 5 FAIL (`corridor-state-first`). 실패 5개는 수치 입력 없는 ELIGIBILITY_ONLY fixture를 산술 사례로 읽은 새 테스트 어댑터 문제. 분기 수정 후 재실행 예정. 실제 새 전투/예견/빙정/마지막 턴/종료·저장 검사와 구버전 fingerprint는 이 실행에서 통과.

## 다음 순서

추가 경계 검사 → 데이터/빌드 → 집중 브라우저와 production 지정 상태/자연 원정 → 최종 전체 회귀 → 실제 결과 및 110조건 기록 → commit/push/PR.

0.9 자연 42전투·Stage9 학습 경로는 당시 NOT RUN이며 이번 결과와 구분한다. 현재 0.10 브라우저/자연 47전투는 NOT RUN. main 병합·배포는 수행하지 않는다.

## 후속 검증 체크포인트 (2026-10-13)

- 상태 어댑터의 ELIGIBILITY_ONLY 분기를 고친 뒤 집중 상태/문법/구버전 199 PASS, 추가 경계 17 PASS.
- 새 엔진에 기존 306문장 해석을 대조하여 `I am knowing...` 우선순위 회귀를 발견·수정. 현재 문법 집중 52 PASS(306건 내부 대조 포함).
- 최종 단위 1,589 PASS, 데이터 3,112 PASS, build PASS. 의존성 버전 변경 없음. 번들 >500KB 경고는 남음.
- 브라우저 초기 startup/debug watcher 실행 중단 로그 보존. 안정된 첫 집중 묶음은 Chromium/Firefox/WebKit 78 PASS·63캡처.
- 추가 터치/드래그·사전 검사를 넣은 다음 실행은 80 checks 완료 후 FAIL. can을 fixture의 만난 단어에 등록하지 않은 사전 검사와 Firefox의 좌표 기반 드래그 미완료를 확인.
- 사전 검사를 실제 10-2 빙정 생성/단어 기록 경로로 변경. 드래그는 locator 안정화를 기다린 뒤 좌표를 얻도록 조정하여 재검증한다. 검사 조건/허용 오차/게임 규칙은 바꾸지 않는다.
- 다음: 집중 UI 재실행 → production 지정 5전투 → 기존 공식 브라우저 → 자연 Controller/production UI 시도 → 110조건·최종 보고서 → commit/push/Draft PR(자연47전투 미확보 시 한계 명시).


## 후속 점검 (2026-10-13 21:05 KST)

- 단위1,592 PASS, 공식 브라우저14개 스크립트 전체 PASS, Stage10 집중93 PASS(66회 촬영/63개 PNG), production 지정5전투 PASS.
- 구0.6.1 production27전투 실제 UI 완주 PASS(60공격, 완료 저장/개인기록 확인). 자연0.10 seed57은7전투 HP74에서 정상 패배; Controller3seed는7/12/12전투 종료. 47완주 미확보.
- 최종 경계 감사에서 `I have been reading books.`의 새 완료진행 배율이 하위 TIME 태그를 대체하면서 Stage3 기존 지역 보너스까지 없애는 회귀를 재현했다(구0.9 REGION1회, 새0.10 0회).
- Stage3의 기존 시간 자격에 해금된 신규 과거완료/현재완료진행 근거만 연결했다. 다른 지역/구버전 정책과 중복 배율 제거는 그대로다. 회귀 테스트 추가 후 최종 단위/빌드/브라우저 재실행 예정.
- 다음: 새 경계검사 → 전체 단위/데이터/build → Stage10 집중/production지정 → 공식브라우저 → 실습성 강제 자원소모 없는 고정19seed 자연시도 → 보고서/commit/push/Draft PR.
