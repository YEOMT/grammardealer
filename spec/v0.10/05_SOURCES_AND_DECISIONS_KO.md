# 근거와 결정 이력

## 1. 자료의 역할

최신 사용자 대화가 이번 게임 설계의 근거다. 실제 저장소는 구현 접점을 확인하는 자료이지 새로운 기획을 자동 결정하는 자료가 아니다. 외부 문법 자료는 영어 구조 검수 참고이며 게임 배율·희귀도·보스·카드공급·난이도의 근거가 아니다.

이 패키지는 코드 감사를 완결하거나 테스트를 실행한 결과가 아니다. 작성 과정에서는 지정된 source 파일을 읽고 문서를 만들었으며, 별도로 패키지 내부의 파일·JSON·ID·산술 일관성만 검사한다.

## 2. 가장 최근 대화에서 적용할 결정

| 항목 | 적용 결정 | 대체/폐기한 안 |
|---|---|---|
| 장소 | 야외·우주풍 밤하늘·압도적인 기둥의 회랑 | 천문대 기획 |
| 학습순서 | 조건절/가정법과거/과거완료/가정법과거완료 | Iwish 전용 라운드, 복합문법 별도 라운드 |
| 일반 적 | 갈림길의 광대/평행세계의 여행자/과거의 순례자/후회의 기사 | 이전 동물/시계 이름 후보 |
| 체력 | 2500/2900/3300/3800/5000 | 일반HP미정, 보스4500안 |
| 예견 | 동일 주절 문형 피해0, 가정법우회 | 동일문형50%감소안 |
| 조동사 | will/would, 신규고급 can/could | would/could 별도카드 |
| 빙정 | 일반전 영구 미보유/부족분, 10-4 have최소2 | 매턴 보충·보스전 공짜 지원 |
| 완료진행 | 엔진콤보·사후안내만 | 독립 학습전 추가 |
| 일반 저항 | S7/8/9/10에30/35/40/30% 검증안 | 일반적 추가기믹 없음이라는 더 이른 제안 |
| 배율 | 기존과 비슷한1.4~2.0, 구체값은 검증 초깃값 | 고배율 일괄추가 |
| 후속 | 최종3전투는 Stage10후 별도 | 이번 버전에서50전투까지 강제완성 |

지역명 '별의 회랑', 내부 버전0.10.0, 세부 evidence ID, 해금 시점과 상태 필드, 상점 슬롯 재사용, 빙정 가시성의 구현 방식은 본명세에서 구분한 작업표기/구현세부안이다. 과거 원문의 명시적 수치 확정으로 과장하지 않는다.

## 3. 실제 읽은 저장소 근거

확인 main SHA: `db73c606784e1ba50e664224b404ccede7447591` (PR #14의 0.9 병합 상태).

- [S1: AGENTS.md](https://github.com/YEOMT/grammardealer/blob/db73c606784e1ba50e664224b404ccede7447591/AGENTS.md): 최신 실제 소스 보존, 기존 엔진 경계, 검증, PR/배포 분리.
- [S2: balance.js](https://github.com/YEOMT/grammardealer/blob/db73c606784e1ba50e664224b404ccede7447591/src/data/balance.js): 기존 시제/연결/수동/관계절 배율 및 버전별 룬 희귀도 정책.
- [S3: runController.js](https://github.com/YEOMT/grammardealer/blob/db73c606784e1ba50e664224b404ccede7447591/src/game/runController.js): 전투시작·임시카드·상태커밋·보상·기존보스 연결.
- [S4: verbPhrase.js](https://github.com/YEOMT/grammardealer/blob/db73c606784e1ba50e664224b404ccede7447591/src/engine/grammar/verbPhrase.js): 보조동사 연결·형태검증·현재 will 중심 처리.
- [S5: shop.js](https://github.com/YEOMT/grammardealer/blob/db73c606784e1ba50e664224b404ccede7447591/src/game/shop.js): 짝수 지역 상점·후반 재고·가격·서비스·후보생성.
- [S6: campaignFeatures.js](https://github.com/YEOMT/grammardealer/blob/db73c606784e1ba50e664224b404ccede7447591/src/data/campaignFeatures.js): 0.9의42전투와 기존 기능의 버전 분기.

실제 작업자는 최신 checkout에서 파일의 현재 전체 내용을 다시 확인한다. 본명세는 일부 경로를 읽은 관찰을 넘어 코드 상태/실행 결과를 보장하지 않는다.

## 4. 외부 문법 검수 참고(게임 규칙과 별개)

- British Council, [Conditionals: zero, first and second](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/conditionals-zero-first-second): 조건문 기본 형태와 가정적 상황.
- British Council, [Conditionals: third and mixed](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/conditionals-third-mixed): 과거완료를 포함하는 가정법과 혼합 가정법의 구분. 혼합 가정법을 이번 신규 필수로 삼는다는 뜻은 아니다.
- British Council, [Present perfect simple and continuous](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/present-perfect-simple-continuous): have/has been -ing와 다른 완료 형태의 구분.

대화의 예문 및 테스트 문장은 개발용 검증 입력이며 위 문헌의 예문을 대량 전재한 것이 아니다. can/could의 세부 용법·was/were 변이 등은 구현자가 어휘 정책과 교사 검수를 통해 확인해야 한다. 모든 영어의 가능성을 완전하게 판정한다는 주장을 하지 않는다.
