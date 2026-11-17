# 근거와 제안의 구분

작성일: 2026-11-17. 아래는 실제로 조회한 고정 커밋 기준 소스다. 전체 소스를 실행한 검증이 아니라 관련 경로의 정적 확인이다. 구현 시 최신 파일을 다시 읽어라.

## S01. GitHub main 및 PR #38 병합
- 원문: https://api.github.com/repos/YEOMT/grammardealer/branches/main
- 확인 범위: 작성 시점 기준 SHA 확인. 배포/실기기 완료의 증거는 아니다.

## S02. AGENTS.md
- 원문: https://github.com/YEOMT/grammardealer/blob/d7d86e1f3e508e9b4beb31ec6deafdf440a2a0d1/AGENTS.md
- 확인 범위: 최신 checkout, 최소 변경, 테스트/빌드, 승인 없는 병합·배포 금지.

## S03. overlays.js
- 원문: https://github.com/YEOMT/grammardealer/blob/d7d86e1f3e508e9b4beb31ec6deafdf440a2a0d1/src/ui/overlays.js
- 확인 범위: 현재 `내 덱`이 사전의 관리모드와 연결된 중복 진입, 영어/뜻 DOM, 설정 행·즉시 적용, 기존 저장창. 이번 R2는 중복 메뉴를 제거하고 `사전` 단일 경로를 유지한다.

## S04. targetGrammar.js
- 원문: https://github.com/YEOMT/grammardealer/blob/d7d86e1f3e508e9b4beb31ec6deafdf440a2a0d1/src/ui/targetGrammar.js
- 확인 범위: 목표/형태/뜻/예문/보너스/공략을 문단으로 구성하는 현행 경로.

## S05. theme.js
- 원문: https://github.com/YEOMT/grammardealer/blob/d7d86e1f3e508e9b4beb31ec6deafdf440a2a0d1/src/ui/theme.js
- 확인 범위: 상점 테마가 shop.stageId에 연결됨.

## S06. musicContext.js
- 원문: https://github.com/YEOMT/grammardealer/blob/d7d86e1f3e508e9b4beb31ec6deafdf440a2a0d1/src/services/musicContext.js
- 확인 범위: 보스 뒤 상점과 선택 준비의 이전 지역 매핑, 기존 연속 BGM 처리.

## S07. runController.js
- 원문: https://github.com/YEOMT/grammardealer/blob/d7d86e1f3e508e9b4beb31ec6deafdf440a2a0d1/src/game/runController.js
- 확인 범위: _prepareEntry/ENTER_STAGE/LEAVE_SHOP/START_BATTLE/NEXT_BATTLE과 실제 지급·전투 생성. 현재 원정 policy 분리.

## S08. dom.js
- 원문: https://github.com/YEOMT/grammardealer/blob/d7d86e1f3e508e9b4beb31ec6deafdf440a2a0d1/src/ui/dom.js
- 확인 범위: 기존 modal의 wide 옵션, 새 모달 시 이전 모달 닫기, 초점 복귀.

## S09. localStore.js
- 원문: https://github.com/YEOMT/grammardealer/blob/d7d86e1f3e508e9b4beb31ec6deafdf440a2a0d1/src/services/localStore.js
- 확인 범위: 상점/상품/ID/가격과 저장 검증이 연결됨. 표시 ID를 바꿔서는 안 됨.

## U01~U03. 사용자 이미지
- U01 `image(9).png` → `reference/01_dictionary_before.png`: 영어/뜻/품사 정렬, 색상, 긴 검색 영역.
- U02 `image(10).png` → `reference/02_target_grammar_before.png`: 비슷한 크기의 문단, 과도한 가로폭, 보너스/공략 나열.
- U03 `image(20261117-095913).png` → `reference/03_settings_before.png`: 라벨과 입력의 큰 거리, 빈 공간, 설정 스크롤.
세 이미지는 사용자 제공 원본을 내용 변경 없이 복사했다. 새 시안/실제 패치 결과가 아니다.

## 확정 요청 및 설계 기본안
사용자가 논의한 화면 역할·상점 소속·첫 준비·팝업 컴팩트화는 이번 구현 요구로 묶었다. **R2에서 사용자는 R1의 `카드` 통합창/`내 덱·사전` 탭 제안을 명시적으로 취소하고, `내 덱` 메뉴 삭제/기존 `사전` 유지로 최종 정정했다.** 모달 시작 폭·글자 크기 범위·UI 준비 게이트의 구체적 선택은 이 명세에서 정한 구현 기본안이다. 현재 코드에 이미 구현되어 있다는 주장이 아니다.

문법/콘텐츠를 외부 일반 지식으로 추가하거나 기존 의미를 덮지 않는다. 현재 지원 registry·승인 예문·정책별 공략을 먼저 사용한다. 단어의 품사색은 실제 게임 팔레트가 원본이며 임의의 웹 디자인 예시 색상이 원본이 아니다.
