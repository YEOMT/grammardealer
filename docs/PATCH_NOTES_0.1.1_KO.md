# 0.1.1 — 13개 피드백별 패치 내역

기준: 사용자 제공 실제 0.1 소스와 `spec/SentenceBalatro_0.1.1_Work_Patch_Prompt.md`. 기존 시스템을 재작성하지 않았다. 아래 P 번호는 **13개 피드백 번호**이며 TEST_REPORT의 50개 인수 P 번호와 구분한다.

| 피드백 | 변경 전 → 변경 후 | 주요 수정 위치 | 검증·한계 |
|---|---|---|---|
| P01 점수 읽기 | 카드85/기타270ms 및 총압축 → 카드170/문법550/룬740ms. 새 1× SV 점수구간 1,250→2,540ms(2.032배), 최종위력420/모으기400/돌진200ms | `engine/presentation.js` | 속도 1/1.5/2, 효과 감소도 읽기 동일. 총시간+max(2초,35%) watchdog. 고연쇄 실제 종료 검사 |
| P02 콤보 증폭 | 같은 크기 pulse → 완전문장/문형/수식/공격룬 이벤트 누적으로 최대 4단계 scale·굵기·glow·국소이동 | `engine/presentation.js`, CSS | 카드 장수만으로 콤보 단계 상승 없음. 미지원 관계절 연쇄 없음 |
| P03 선택 후 버리기 | 교환 모드 선진입 → 독립 체크+버리기 1클릭. 본체 클릭·드래그는 기존 조합 | `ui/cards.js`, `ui/combat.js`, `main.js` | 3장 선택/자원, 회수/이동/메뉴/마우스·터치 취소/빠른 반복 검사 |
| P04 be 표시 | 첫 노출 자동 활용 → 손패/보상/덱/초기조합 원형 be, 형태 메뉴 am/is/are | `data/language/index.js`, `grammar/parser.js`, `data/balance.js` | I be happy: 진단 1회, -10, 완전보너스 제외. 정상 활용 점수 동일. advanced는 UNSUPPORTED |
| P05 튜토리얼 | 작은 배너/시작 시 guideSeen → 실제 성공 명령 기반 7단계 말풍선/spotlight, 제출 직전 설명 guard | `game/tutorial.js`, `ui/tutorial.js`, Controller/main | 실제 교환1+준비1 소모, 첫 타격 후 완료/대체플레이 건너뛰기 구분. 설정 재연습은 별도 Controller |
| P06 혼합 보상 | 팝업 전체 유형 추첨 → 각 슬롯 유형 추첨, 고정 3칸 중 1선택 | `game/rewards.js`, `ui/progression.js`, 저장 validator | 중복/불가능 pool 제거 trace, 연마/제거 대상취소, 룬 교체, 재로드 보존. R2 3룬/초회 R1 3일반 예외 |
| P07 뜻 참고 | 도감 영문만 → 첫/최고 기록에 작은 의미+기존 문법 요약 | `engine/meaning.js`, `data/koreanSenseTemplates.js`, `ui/overlays.js`, localStore | 검증된 SV/SVC/SVO만 문장형, play/PP/긴 수식/누락은 모든 성분 gloss. 영어·오류·점수 변경 없음 |
| P08 HP | 70/120/220 → 새 원정 91/156/286 | `data/stage1.js`, Controller/storage/UI | 1.30배 최종 기준값. legacy는 종전 HP. 로드 시 재곱셈 없음 |
| P09 연마 | 작은 단계 표기 → 일관된 뱃지 +1/+2/+3와 합계10/15/20/25, 상세 분해, 확정 결과 모달 | `ui/cards.js`, overlays/main/CSS, rewardEffect | 품사색·영단어 유지. 실제 카드 기여 중복 없음. 확인 후 다음 화면 |
| P10 룬 빛 | 단순 점등 → 데이터의 실제 색, 슬롯→점수의 짧은 곡선 light, 도착 후 event.after | `data/runes.js`, `engine/presentation.js`, combat/CSS | 루비/사파이어/고연쇄 캡처, 220ms flight. 운영 룬은 입장 glow만. 효과 감소는 이동 억제 |
| P11 턴 재화 | 기본 처치 재화만 → 기본2/2/6 + 처치 행동 뒤 남은 턴×1 | Controller `_settleVictory`, progression | 준비2+공격2 실제 카드 처치 +2, 마지막턴 +0, settlement ID 1회. skip 별도 |
| P12 덱·첫패 | 30장 → 28장 N6/P4/V8/A3/Adv2/Det3/Prep2, I/you/they+he 또는 she, 명확한 SV2종 | `game/deck.js`, balance, simulate-decks | 네 모드×2,500seed 실제 parser witness. 튜토리얼 be 경로도 같은6장, 일반 draw는 기존 난수 처리 |
| P13 사이드 폰트 | 작은 메뉴/룬 글씨 → 본문14, 룬이름14~15, 효과12~13px | `ui/styles.css` | 4해상도, 손패10/14·문장16·3룬. 영단어 font 규칙 유지. 확장손패 가로스크롤·룬패널 내부스크롤 |

## 저장·호환과 개발 인계

DB 이름/프로필/슬롯을 바꾸지 않았다. 실제 0.1 저장 fixture(초기/보상1/보상2/보상3/완료)를 그대로 받아 카드·HP·보상·폼·난수 보존을 검사했다. 기존 보상 화면은 “이전 버전 저장”으로 구분한다. 현재 없는 의미 정보는 옛 문장 그대로 “이전 기록: 해석 정보 없음”으로 표시한다.

원정 및 각 관련 버전은 `src/contracts.js`에 명시했다. 룬 수치 버전은 0.1.0 유지. GitHub용 문서·ignore·test/build/Pages workflow를 준비했으며 실제 원격 push/Actions/Pages 배포는 이번에 실행하지 않았다.

## 남은 한계

실제 iPad Safari는 NOT RUN. 이번 검증은 Linux Chromium과 touch emulation이다. SV_ONLY 자동 정책의 일부 패배를 포함한 실제 분포는 TEST_REPORT 참조. 의미 참고는 모든 어휘/문맥을 번역하지 않는다. Stage 2·새 문법·추가 캐릭터·서버/랭킹은 범위 밖이다. 지정되지 않은 밸런스를 추가 조정하지 않았다.
