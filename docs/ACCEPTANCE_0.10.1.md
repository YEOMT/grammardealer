# 0.10.1 원래130조건 추적

원래 명세와 UI Followup을 분리한다. 기존 UI의 세로 플레이/조합대 페이지 예외는 SUPERSEDED이며 새84조건의 PASS로 세지 않는다. 기능 검증은 최종 단위/데이터로 다시 확인했다. 브라우저 근거의 실행 단계는 각 행과 [실제 보고서](TEST_REPORT_0.10.1.md)를 따른다.

집계: {'PASS': 118, 'FAIL': 4, 'NOT RUN': 5, 'SUPERSEDED': 3}

| ID | 조건 | 결과 | 실제 근거·한계 |
|---|---|---|---|
| A01 | 현재 main·HEAD·작업 트리·미커밋 상태를 기록하고 사용자의 기존 변경을 보존한다. | PASS | 시작 clean, origin/main f09d4537; 이전 브랜치/ZIP/실행 증거 보존. 이후 사용자 미커밋 변경을 삭제하지 않음. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| A02 | 새 원정의 버전은0.10.1이며 47전투/STAGE10_END를 유지한다. | PASS | 새 version0.10.1; 실제 마지막 턴 격파/보상/저장 STAGE10_END·47. 48전투 없음. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| A03 | 구0.10.0 이하 저장은 자기 HP·룬·확률·카드·RNG·완료 경계를 유지한다. | PASS | 구 manifest/runes/HP/registry/RNG 정책을 버전별 유지. 대표 저장·명령 회귀이며 모든 실사용 저장의 전수 검사는 아님. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| A04 | 시작 덱28·첫손패6·기본한도10·턴드로우3·교환4·턴6·문장16을 유지한다. | PASS | version/manifest/구버전 helper 및 범위 diff; U 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| A05 | 룬 슬롯의 기존 시작3→Stage3후4, 최대Lv.3과 동일ID 중복장착 금지를 유지한다. | PASS | version/manifest/구버전 helper 및 범위 diff; U 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| A06 | 최종보스3연전·엔딩·승천·신규캐릭터·자동정답·별도난이도를 추가하지 않는다. | PASS | version/manifest/구버전 helper 및 범위 diff; U 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| A07 | 보류한 룬을 구현하거나 과거 제안명을 별개 룬으로 중복 생성하지 않는다. | PASS | version/manifest/구버전 helper 및 범위 diff; U 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| A08 | 0.10.1의 기능 분기·manifest·언어·문법·채점·저장에 구버전 fallback 누락이 없다. | PASS | 언어/카드/문법은0100 registry 재사용, 정책0101. 보스 receipt는 실제 registry.version으로 검사. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| A09 | 버전을 소수/parseFloat로 비교하지 않으며0.1과0.10.1이 구분된다. | PASS | version/manifest/구버전 helper 및 범위 diff; U 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| A10 | 본명세의 확정값·가산/시각초깃값·최종명칭/복합용법 세부안을 보고서에서 구분한다. | PASS | 확정 HP/곱셈, 가산·시각 초기값, 복합 근거 및 자수정 최종 override를 RUNE_REVIEW에 구분. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| B01 | Stage2 HP는200/270/360/750으로 실제 encounter에 적용된다. | PASS | HP19개/신구 골렘/기존 보스 회귀; U, I, S, P 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| B02 | Stage3 일반전 HP는300/320/360/400이다. | PASS | HP19개/신구 골렘/기존 보스 회귀; U, I, S, P 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| B03 | 골렘 총HP780이며 각 부위 hp/maxHp가260/260/260이다. | PASS | 780 총HP·각260. 실제3공격은 활성부위260씩만 감소, 신구 저장 복원 및4번째룬 슬롯. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| B04 | Stage4 HP는500/530/570/600/1000이다. | PASS | HP19개/신구 골렘/기존 보스 회귀; U, I, S, P 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| B05 | Stage5 HP는640/680/740/800/1300이며 일률하향으로 치환하지 않는다. | PASS | HP19개/신구 골렘/기존 보스 회귀; U, I, S, P 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| B06 | Stage1·6~10 HP와 일반 저항30/35/40/30%는 이번에 바꾸지 않는다. | PASS | HP19개/신구 골렘/기존 보스 회귀; U, I, S, P 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| B07 | 항구75%감소/4형식해제와 하늘섬50%감소/절연결해제를 보존한다. | PASS | HP19개/신구 골렘/기존 보스 회귀; U, I, S, P 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| B08 | 골렘 순서·초과피해 미이월·마지막부위격파와 스핑크스봉인을 보존한다. | PASS | HP19개/신구 골렘/기존 보스 회귀; U, I, S, P 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| B09 | 사슴·잿불룡·청동수문장·도서관장·직조자 기믹과 무지원 원칙을 보존한다. | PASS | HP19개/신구 골렘/기존 보스 회귀; U, I, S, P 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| B10 | 골렘 신구버전 저장·UI 총/부위HP·최종타격이 서로 일치한다. | PASS | 신780/260×3·구840/280×3의 실제 Controller 공격과 별도 지정 UI 숫자를 대조. 자연 골렘 완주 증거로 확대하지 않음. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| C01 | 신규 일반2/고급5/희귀3의 정확한10종만 추가하고 기존 룬을 보존한다. | PASS | 신규10종×3레벨 및 기존12종 동일성; R, B 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| C02 | 화석은COMMON ADD_SCORE이며 +30/+50/+70 검증초깃값을 세레벨에 적용한다. | PASS | 신규10종×3레벨 및 기존12종 동일성; R, B 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| C03 | 석영은COMMON ADD_SCORE이며 +30/+50/+70 검증초깃값을 세레벨에 적용한다. | PASS | 신규10종×3레벨 및 기존12종 동일성; R, B 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| C04 | 가넷은주절5형식×1.7/2.4/3.2이다. | PASS | 신규10종×3레벨 및 기존12종 동일성; R, B 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| C05 | 백금·라피스는 각각현재완료·절연결×1.4/1.7/2.0이다. | PASS | 신규10종×3레벨 및 기존12종 동일성; R, B 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| C06 | 아쿠아마린·자수정는 각각to부정사·동명사×1.35/1.65/2.0이다. | PASS | 아쿠아마린/자수정 각각×1.35/1.65/2.0. 최신 이름 지시 우선. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| C07 | 흑요석은수동태×1.9/2.55/3.2, 아다만티움은수식관계절×2.1/2.8/3.6이다. | PASS | 신규10종×3레벨 및 기존12종 동일성; R, B 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| C08 | 미스릴은가정법과거×2.0/2.7/3.5이며 과거완료전용룬을 추가하지 않는다. | PASS | 신규10종×3레벨 및 기존12종 동일성; R, B 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| C09 | 기존4형식토파즈와 신규동명사자수정를 별도ID·효과·부제로 구분한다. | PASS | rune.svoo 토파즈와 rune.gerund 자수정을 동시에 소유·저장; 서로 다른 발동과 ID. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| C10 | 도감·상점·보상·장착·로그의 이름/등급/+또는×/세레벨 설명이 엔진 정의와 일치한다. | PASS | 신규10종×3레벨 및 기존12종 동일성; R, B 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| D01 | 화석은실제과거동사구를 확인하고 가정법had/were·비유한p.p.만으로 발동하지 않는다. | PASS | 오류·해금·VP/절/주절 근거 양성/음성; R 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| D02 | 석영은진행동사구에서만 발동하고 be보어/동명사/분사수식만으로 발동하지 않는다. | PASS | 오류·해금·VP/절/주절 근거 양성/음성; R 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| D03 | 가넷은실제주절5형식만 보며 문두if절이나종속절5형식으로 대신하지 않는다. | PASS | 오류·해금·VP/절/주절 근거 양성/음성; R 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| D04 | 백금은현재완료를 확인하고 본동사have·과거완료·would have만으로 발동하지 않는다. | PASS | 오류·해금·VP/절/주절 근거 양성/음성; R 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| D05 | 라피스는절연결만 인정하고 difficult and different 등 구연결은 제외한다. | PASS | 오류·해금·VP/절/주절 근거 양성/음성; R 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| D06 | 아쿠아마린은to부정사만, 자수정는명사역할동명사만 인정한다. | PASS | 오류·해금·VP/절/주절 근거 양성/음성; R 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| D07 | 흑요석은현재엔진의정상수동태를 확인하고 단순p.p.수식으로 발동하지 않는다. | PASS | 오류·해금·VP/절/주절 근거 양성/음성; R 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| D08 | 아다만티움은선행사수식주격/목적격관계절과 정상생략을 인정하고 what/간접의문/관계부사만은 제외한다. | PASS | G030 원문 boy는 DB에 없어 목표 NOT RUN. 미지원 감지와 teacher 대체 관계절 검사를 별도 기록; 다른 주격/목적격/생략/음성 사례 실행. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| D09 | 미스릴은UNREAL_PRESENT 실제쌍만 인정하고 단독could/현실조건/UNREAL_PAST는 제외한다. | PASS | 오류·해금·VP/절/주절 근거 양성/음성; R 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| D10 | 무효근거·미해금·ENGINE_ERROR·INVALID_CORE에 신규룬의 가짜 발동이 없다. | PASS | 오류·해금·VP/절/주절 근거 양성/음성; R 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| E01 | 신규룬은 해당근거가여럿이어도 룬별공격당1회만 적용한다. | PASS | 중복 배율 억제/장착순서/사본 근거/버림; R, Q, U 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| E02 | 가산/곱셈은 장착순서대로 계산하고 자동으로가산룬을앞으로정렬하지 않는다. | PASS | 중복 배율 억제/장착순서/사본 근거/버림; R, Q, U 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| E03 | 매곱셈버림·안전정수·실제피해·초과피해와 기존 채점단계를 유지한다. | PASS | 중복 배율 억제/장착순서/사본 근거/버림; R, Q, U 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| E04 | 정상실제과거진행의 화석+석영, 현재완료진행의 석영+백금 세부안이 각각1회로 검증된다. | PASS | 실제 과거진행과 현재완료진행 카드 조립·형태선택·제출 UI로도 각각 두 신규 룬을1회씩 확인. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| E05 | 수동태관계절의 흑요석+아다만티움 등 적법한 서로다른 룬시너지를 허용한다. | PASS | 중복 배율 억제/장착순서/사본 근거/버림; R, Q, U 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| E06 | 조건/가정절 라피스와 미스릴의 룬발동이 기본if연결배율을 중복 복원하지 않는다. | PASS | If I worked I would help you 실제UI: 라피스+미스릴, 원래 if 하위 배율 억제 유지. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| E07 | 현재완료진행의 기본완료×진행·가정법의하위시제 배율 중복억제를 보존한다. | PASS | 중복 배율 억제/장착순서/사본 근거/버림; R, Q, U 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| E08 | 관련되지않은다른절의유효근거는 문장전역boolean때문에 삭제되지 않는다. | PASS | 중복 배율 억제/장착순서/사본 근거/버림; R, Q, U 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| E09 | 동일철자다른사본·소멸빙정·손패카드가 제출근거ID로 혼입되지 않는다. | PASS | engine evidenceRefs/physical IDs와 실제 DOM highlight 집합 비교. 문자열 일괄매칭/생략 가짜 카드 없음. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| E10 | 기존사본별비취/철룬과 유틸리티 자원보정/순서변경 정책이 유지된다. | PASS | 중복 배율 억제/장착순서/사본 근거/버림; R, Q, U 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| F01 | 일반/고급 전체풀은Stage1부터 후보이며 후반문법/현재덱적합성으로제거하지 않는다. | PASS | 18맥락 fixture와 실제 후보 필터; Q 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| F02 | 일반전의 모든 룬추첨 경로에서 희귀는0이며 다이아몬드도 제외한다. | PASS | 18맥락 fixture와 실제 후보 필터; Q 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| F03 | 희귀룬중복획득/레벨업도 일반전에서 나오지 않는다. | PASS | 18맥락 fixture와 실제 후보 필터; Q 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| F04 | Stage1부터실제지역보스보상에서 희귀후보가 가능하며확정지급은하지 않는다. | PASS | 18맥락 fixture와 실제 후보 필터; Q 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| F05 | Stage2입장상점은희귀0이다. | PASS | 18맥락 fixture와 실제 후보 필터; Q 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| F06 | Stage4/6/8/10입장상점에는희귀가가능하며 Stage4를네번째상점으로오해하지 않는다. | PASS | 18맥락 fixture와 실제 후보 필터; Q 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| F07 | 새Stage1상점을 추가하지 않고 기존 상점 위치/개수를 보존한다. | PASS | 18맥락 fixture와 실제 후보 필터; Q 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| F08 | 초회1-1·1-2고정예외를보존하고 이후1-2전체풀/fallback에도희귀금지가적용된다. | PASS | 초회1-2 수정/호박/구리 고정, 이후2 BASIC+1전체풀·부족 fallback도 희귀 제외. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| F09 | 획득출처제한은신규희귀뿐아니라기존다이아몬드에도동일하게적용된다. | PASS | 18맥락 fixture와 실제 후보 필터; Q 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| F10 | 룬을획득해도 문법/카드팩이자동해금되지 않으며 조건설명이 명확하다. | PASS | 18맥락 fixture와 실제 후보 필터; Q 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| G01 | 허용된전체등급풀에서194:97:9,희귀금지시194:97을사용한다. | PASS | 실제 룬선택100,000회/혼합보상3,000개/고정offer; Q, I 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| G02 | 보상종류 RUNE가중치와등급추첨확률을분리하며 일반전희귀WORD정책은바꾸지 않는다. | PASS | 실제 룬선택100,000회/혼합보상3,000개/고정offer; Q, I 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| G03 | 같은등급내기존균등추첨과 한offer중복ID금지·최대레벨제외를보존한다. | PASS | 실제 룬선택100,000회/혼합보상3,000개/고정offer; Q, I 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| G04 | 후보소진시금지희귀로채우지않고유효타입재선택/상점빈칸을명시한다. | PASS | 후보 소진은 순수 선택기 fixture(실제18룬 슬롯 원정 아님). 금지 희귀 대체 없음, 상점 빈칸 trace. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| G05 | 고정seed분포검증에서맥락별등급/개별후보빈도와기대정규화를보고한다. | PASS | 5맥락 각20k 조건부 룬 선택, 별도로 일반/보스 혼합 각1500. 후보별 빈도와 기대 정규화 JSON 제출. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| G06 | 보상표시·닫기·대상취소·저장/로드는동일offer와RNG를보존한다. | PASS | 실제 룬선택100,000회/혼합보상3,000개/고정offer; Q, I 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| G07 | 룬교체취소/중복선택/잘못된offerId가무료업그레이드나재화중복을만들지않는다. | PASS | 실제 룬선택100,000회/혼합보상3,000개/고정offer; Q, I 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| G08 | 상점일반18/고급24/희귀32와카드/연마/제거가격을보존한다. | PASS | rune18/24/32 및 기존 카드/연마/제거 단위 회귀; 새 상점 가격 없음. 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| G09 | 이미공개된상품의가격·ownedLevel·offeredLevel이재렌더로달라지지 않는다. | PASS | 실제 룬선택100,000회/혼합보상3,000개/고정offer; Q, I 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| G10 | 구버전의후보/가격/추첨스트림은신규드롭필터의소급영향을받지 않는다. | PASS | 실제 룬선택100,000회/혼합보상3,000개/고정offer; Q, I 최종 followup-final-unit/data에서도 기능 회귀 실행.  |
| H01 | 로비·전투와설정에서전체화면진입/종료컨트롤에접근할수있다. | PASS | UI후속 이전 실행 근거: 실제 사용자 클릭 API와 거절/미지원 mock을 별도 기록; B, S  |
| H02 | 실제클릭/터치의사용자활성화에서만지원API를요청한다. | PASS | UI후속 이전 실행 근거: 실제 사용자 클릭 API와 거절/미지원 mock을 별도 기록; B, S  |
| H03 | 일반전투재렌더로교체되지않는루트를사용하며모달/FX도보인다. | PASS | UI후속 이전 실행 근거: documentElement 실제 fullscreen 상태에서 rerender·사전·형태·저장·보상 확인.  |
| H04 | API거절/미지원시게임을막지않고화면맞춤을유지한다. | PASS | UI후속 이전 실행 근거: 실제 사용자 클릭 API와 거절/미지원 mock을 별도 기록; B, S  |
| H05 | fullscreenchange·Esc·시스템종료후버튼문구/상태가실제DOM과일치한다. | PASS | UI후속 이전 실행 근거: fullscreenchange와 실제 exit API/버튼 상태 확인. 브라우저 밖 시스템 Esc/OS 제스처는 별도 실기기 미검증.  |
| H06 | 재로드후저장설정만으로가짜전체화면상태/자동재진입을만들지않는다. | PASS | UI후속 이전 실행 근거: 저장 스키마/설정에 fullscreen 상태 없음. 새 문서/production 로드는 실제 DOM 상태만 읽음.  |
| H07 | 전체화면진입/종료가카드·턴·HP·룬·RNG를변경하지않는다. | PASS | UI후속 이전 실행 근거: 실제 사용자 클릭 API와 거절/미지원 mock을 별도 기록; B, S  |
| H08 | 공격중전체화면전환시표시좌표/클린업만처리하고정산을반복하지않는다. | PASS | UI후속 이전 실행 근거: 실제 사용자 클릭 API와 거절/미지원 mock을 별도 기록; B, S  |
| H09 | 사전/형태/보상/저장모달을전체화면에서실제로열고닫아확인한다. | PASS | UI후속 이전 실행 근거: B: 사전·형태·저장 실제 API 안에서 개폐. S: 전체화면 보상3칸/상점/완료.  |
| H10 | 브라우저실제API검사와API mock단위검사·미지원검사를구분한다. | PASS | UI후속 이전 실행 근거: 실제 사용자 클릭 API와 거절/미지원 mock을 별도 기록; B, S  |
| I01 | PC일반크기와낮은높이노트북창에서필수전투조작의페이지스크롤이없다. | FAIL | 후속 대표3화면 PASS, stress740×360/667×320 최대16장 공간 부족. followup-browser.json 작은 가로창 실패를 숨기지 않음. |
| I02 | 태블릿가로에서주소창표시/숨김전후에도손패와행동버튼이잘리지않는다. | NOT RUN | UI후속 이전 실행 근거: 12크기·14손패/16조합/4룬 bounds 및 선택/페이지; B 실물 태블릿 주소창 표시/숨김 미검증. 동등 CSS 가시 높이 변경은 에뮬레이션으로 통과. |
| I03 | 태블릿세로에서도필수정보와모든카드접근이유지된다. | SUPERSEDED | UI Followup B02–B14/D01: 공통 폭·전체 문장 줄바꿈·휴대기기 가로 전용으로 대체. 원래 세로/조합대 페이지 예외는 현행 계약이 아님. |
| I04 | 모바일세로에940px고정최소너비가남지않고가로넘침이없다. | FAIL | 후속 대표3화면 PASS, stress740×360/667×320 최대16장 공간 부족. followup-browser.json 작은 가로창 실패를 숨기지 않음. |
| I05 | 모바일가로·낮은실제높이에서핵심조작을스크롤없이쓸수있다. | FAIL | 후속 대표3화면 PASS, stress740×360/667×320 최대16장 공간 부족. followup-browser.json 작은 가로창 실패를 숨기지 않음. |
| I06 | 최대손패14+조합대16+4룬상태에서기기별동시표시/명시적예외를검증한다. | SUPERSEDED | UI Followup B02–B14/D01: 공통 폭·전체 문장 줄바꿈·휴대기기 가로 전용으로 대체. 원래 세로/조합대 페이지 예외는 현행 계약이 아님. |
| I07 | overflow:hidden이나전역축소로잘림/읽기불가를숨기지않는다. | FAIL | 후속 대표3화면 PASS, stress740×360/667×320 최대16장 공간 부족. followup-browser.json 작은 가로창 실패를 숨기지 않음. |
| I08 | 축약/카드페이지가필요한작은화면은전체장수·순서·현재페이지를표시하고비보고누락이없다. | SUPERSEDED | UI Followup B02–B14/D01: 공통 폭·전체 문장 줄바꿈·휴대기기 가로 전용으로 대체. 원래 세로/조합대 페이지 예외는 현행 계약이 아님. |
| I09 | dvh/safe-area/VisualViewport와주소창·회전·분할창resize가안정적으로반영된다. | NOT RUN | UI후속 이전 실행 근거: 12크기·14손패/16조합/4룬 bounds 및 선택/페이지; B dvh/safe-area/VisualViewport/RAF 병합 구현과 resize 검사는 완료. 실제 노치·주소창·Split View 조합 NOT RUN. |
| I10 | 사용자의확대/핀치zoom을강제로취소하지않고100%무스크롤검사와확대접근성을구분한다. | NOT RUN | UI후속 이전 실행 근거: 12크기·14손패/16조합/4룬 bounds 및 선택/페이지; B viewport scale 변화 시 레이아웃 재축소하지 않는 코드 확인. 실제 사용자 핀치/확대 조작 접근성 NOT RUN. |
| J01 | 사전과저장/불러오기버튼은PC·태블릿·휴대전화에서쉽게열수있다. | PASS | 후속 DIRECT_FOUR_OVERLAYS 및 대표3화면 hit 검사. 사전/도감/내 덱/저장 직접 접근. stress 크기 최대 조합 상태의 패널 가림은 후속 C06 FAIL에 기록. |
| J02 | 긴사전/도감/기록의내부스크롤은동작하고닫기/검색이항상접근가능하다. | PASS | UI후속 이전 실행 근거: 보조화면/모달/사전/저장/형태/정렬; B, S, O, E  |
| J03 | 가상키보드가검색칸/닫기/취소를가리지않고닫힌후전투레이아웃이복구된다. | NOT RUN | UI후속 이전 실행 근거: 보조화면/모달/사전/저장/형태/정렬; B, S, O, E 검색/닫기와키보드 크기 viewport 축소·복구는 검사. 실제 OS 가상키보드 NOT RUN. |
| J04 | 저장3슬롯·덮어쓰기확인·불러오기취소/성공의기존행동과안전지점을유지한다. | PASS | UI후속 이전 실행 근거: 보조화면/모달/사전/저장/형태/정렬; B, S, O, E  |
| J05 | 사전사용/재시도에새감점·보상감소·자동정답/새힌트를추가하지않는다. | PASS | UI후속 이전 실행 근거: 보조화면/모달/사전/저장/형태/정렬; B, S, O, E  |
| J06 | 보상3칸·상점구매/제거/연마·지역소개/완료의핵심조작이잘리지않는다. | PASS | UI후속 이전 실행 근거: 상점 상품 모든 페이지 구매 버튼·서비스/나가기와 지역/완료의 viewport bounds. 자세한 지역 안내는 명시 펼침 패널.  |
| J07 | 형태선택과드래그/탭조립·맞교환·교환확정을기기별로검증한다. | NOT RUN | UI후속 이전 실행 근거: 보조화면/모달/사전/저장/형태/정렬; B, S, O, E PC pointer/keyboard, touch context 및 형태 UI는 검사. 실제 기기별 터치/맞교환 전체 조합 NOT RUN. |
| J08 | 회전/모달전환중드래그를취소해도가짜공격/교환이발생하지않는다. | PASS | UI후속 이전 실행 근거: 실제 pointer drag 중 모달을 열어 ghost 정리/상태 동일; resize cancellation 및 기존 scroll cancel 검사.  |
| J09 | help동·명좌상단·점수우상단·메탈릭등급/연마를신규레이아웃에서도보존한다. | PASS | UI후속 이전 실행 근거: 보조화면/모달/사전/저장/형태/정렬; B, S, O, E  |
| J10 | 좁은화면에서도룬등급/레벨/순서요약과정렬/상세기능을사용할수있다. | PASS | UI후속 이전 실행 근거: 보조화면/모달/사전/저장/형태/정렬; B, S, O, E  |
| K01 | 문법점수적용시정확한evidence카드집합에탄성반응이발생한다. | PASS | UI후속 이전 실행 근거: 물리 evidence ID, wrapper, 중복 방지,30회 실제 공격; R, Q, B, F  |
| K02 | 룬점수적용시그룬조건의근거카드만반응한다. | PASS | UI후속 이전 실행 근거: 물리 evidence ID, wrapper, 중복 방지,30회 실제 공격; R, Q, B, F  |
| K03 | 같은철자의다른손패사본이나무관한다른절을일괄흔들지않는다. | PASS | UI후속 이전 실행 근거: 물리 evidence ID, wrapper, 중복 방지,30회 실제 공격; R, Q, B, F  |
| K04 | 압축→작은오버슈트/들림→감쇠복귀로보이며카드순서/좌표계는변하지않는다. | PASS | UI후속 이전 실행 근거: 실제9콤보 공격 캡처·14초 원본 영상 발췌. 280ms/18ms≤90ms, 내부 wrapper만 변형.  |
| K05 | 시각wrapper를사용해선택/드래그/입력transform과충돌하지않는다. | PASS | UI후속 이전 실행 근거: 물리 evidence ID, wrapper, 중복 방지,30회 실제 공격; R, Q, B, F  |
| K06 | 다중카드stagger는타임라인안에서병렬적으로끝나고16배대기를추가하지않는다. | PASS | UI후속 이전 실행 근거: 물리 evidence ID, wrapper, 중복 방지,30회 실제 공격; R, Q, B, F  |
| K07 | RUNE_FLIGHT와SCORE의동일event에서이중spring/이중콤보를만들지않는다. | PASS | UI후속 이전 실행 근거: 실제eventID를 seen 집합으로1회 처리. flight는 예고이며 score에서만spring/count.  |
| K08 | 별개효과가같은카드를재사용하면해당다음event에서다시반응할수있다. | PASS | UI후속 이전 실행 근거: 물리 evidence ID, wrapper, 중복 방지,30회 실제 공격; R, Q, B, F  |
| K09 | 근거카드가숨겨진작은화면예외는요약피드백을주고전체보드무차별반응으로대신하지않는다. | PASS | UI후속 이전 실행 근거: 물리 evidence ID, wrapper, 중복 방지,30회 실제 공격; R, Q, B, F  |
| K10 | 근거가없는유틸리티/방어/final재표시에가짜제출카드를만들지않는다. | PASS | UI후속 이전 실행 근거: 물리 evidence ID, wrapper, 중복 방지,30회 실제 공격; R, Q, B, F  |
| L01 | 콤보이름·+/×수치·점수의글꼴/대비가개선되고긴문구와큰정수도읽힌다. | PASS | UI후속 이전 실행 근거: 정확 숫자/누적event/등급·레벨/감소효과/상한; Q, B, F  |
| L02 | 문구와점수모두누적에따라글로우/입자/반응이점진적으로강해진다. | PASS | UI후속 이전 실행 근거: 정확 숫자/누적event/등급·레벨/감소효과/상한; Q, B, F  |
| L03 | 실제양수문법/룬event만카운트하고cardbase·방어·final·flight는제외한다. | PASS | UI후속 이전 실행 근거: 정확 숫자/누적event/등급·레벨/감소효과/상한; Q, B, F  |
| L04 | 동일eventId재전달은카운트를증가시키지않고새공격에서는초기화한다. | PASS | UI후속 이전 실행 근거: 정확 숫자/누적event/등급·레벨/감소효과/상한; Q, B, F  |
| L05 | 일반<고급<희귀및Lv.1<2<3의시각차이를기존룬까지일관적용한다. | PASS | UI후속 이전 실행 근거: rarity1/1.15/1.35와level1/1.1/1.2를 기존/신규룬에 공유. glow와pulse/flight 강도 차이,scale1.12상한.  |
| L06 | 콤보이펙트와화려함이새점수배율/게임RNG/실제피해를바꾸지않는다. | PASS | UI후속 이전 실행 근거: 정확 숫자/누적event/등급·레벨/감소효과/상한; Q, B, F  |
| L07 | 예약영역과내외곽레이어로고콤보에서도글자/카드/버튼이밀리거나가려지지않는다. | PASS | UI후속 이전 실행 근거: 정확 숫자/누적event/등급·레벨/감소효과/상한; Q, B, F  |
| L08 | 기존읽기시간·속도1/1.5/2를유지하며효과마다불필요한추가대기를쌓지않는다. | PASS | UI후속 이전 실행 근거: 기존550/220/520ms와1/1.5/2 유지. 실제30공격에서 세 속도 사용, stagger는 단계 안 병렬.  |
| L09 | reducedMotion/effectsOff에서흔들림/입자없이정확한문구·수치·정적강조를제공한다. | PASS | UI후속 이전 실행 근거: effectsOff와reducedMotion은 별도 설정. 각각 실제UI 복구,30공격은 정상20/효과감소5/감소+OS모션5.  |
| L10 | 입자/글로우/스케일의상한과빠른전면섬광방지기준이검증된다. | PASS | UI후속 이전 실행 근거: 정확 숫자/누적event/등급·레벨/감소효과/상한; Q, B, F  |
| M01 | 전체단위/데이터검사/build와해당기존브라우저회귀를실행하고실제종료코드를남긴다. | PASS | 실제 종료코드/단위/자연 시도/지정 상태를 분리; U, Q, B, F, N, P, E  |
| M02 | 신규10룬세레벨·근거·드롭·HP·전체화면·GameFeel 테스트를추가한다. | PASS | 실제 종료코드/단위/자연 시도/지정 상태를 분리; U, Q, B, F, N, P, E  |
| M03 | 30회고콤보반복에서FX노드/animation/timer/RAF누수와입력잠김이없다. | PASS | 합법적 지정 상태30회: 실제 SUBMIT→전체timeline→FINISH. 매회9콤보, 중복 거부·입력 복귀·잔존 FX/animation 및 실제 timer/interval/RAF handle0. 자연30전투 아님.  |
| M04 | 동일기기·상태의효과전후frame구간/longtask/노드수성능을측정하고FPS를추정으로단정하지않는다. | PASS | 같은 Chromium/viewport의 실제 eventstream30회씩 renderer 재생. frame p50/p95/50·100ms초과/longtask/node 기록. 실물 FPS/입력 지연 보장 아님.  |
| M05 | 백그라운드·복귀·resize·전체화면·watchdog·중복완료에서도피해/보상/기억을한번만정산한다. | PASS | Controller exactly-once/기존 watchdog·visibility 회귀 + 새 fullscreen/resize/cancel 실제UI. 자연 OS 탭 전환 모든 조합의 실기기 검사는 아님.  |
| M06 | 합법적지정덱통합검사와자연보상원정의획득/소모턴/실패/완주증거를구분한다. | PASS | 지정 production43–47와 자연 Controller/production 시도를 별도 보고. 자연47완주는 미확보, 도달하지 않은 후반은 NOT RUN.  |
| M07 | 구0.10/0.9및대표구버전의카드·룬·상품·RNG·47/42경계를회귀검증한다. | PASS | 명시 legacy010/09 및 대표 legacy 저장·완료 경계/상품/RNG 단위, legacy061 production 경로. 옛 증거를 재사용하지 않음.  |
| M08 | 실물iPad/휴대전화와브라우저에뮬레이션결과를분리하고못한기기는NOT RUN으로쓴다. | PASS | Windows 데스크톱3엔진과 모바일 크기 에뮬레이션만. 실제iPad/iPhone/Android/nativeSafari는 NOT RUN.  |
| M09 | 체크리스트/명령/로그/스크린샷고유이름/성능/남은위험을실제실행증거로제출한다. | PASS | 실행 ID별 원본 로그/영상은 로컬 보존, 공개 선별 증거는 개인 경로 제거. 숫자는 이번 실행에서만 집계.  |
| M10 | 별도브랜치/PR까지만인계하며권한실패시로컬산출물을제공하고병합/배포성공을꾸미지않는다. | PASS | 구현 commit ca1391b를 별도 브랜치 push하고 Draft PR #16 생성·연결. main f09d4537 동일, autoMerge없음/mergedfalse. |
