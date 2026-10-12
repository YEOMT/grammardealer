# 0.9 인수 조건 실제 판정

원문90개는 spec에 보존한다. 아래 PASS는 명시한 검사/소스 범위의 결과이며 자연42전투 완주를 뜻하지 않는다. **AC-085/088은 NOT RUN(일부 하위 검증 완료)** 이며 이 때문에 PR은 Draft다. 상세 명령·횟수·실패 이력은 [검증 보고서](TEST_REPORT_0.9.md), 기계 판독 결과는 [실행 근거](validation/v0.9/summary.json)를 참조한다.

U: `tests/v09-library-grammar.test.js`, `tests/v09-library-state.test.js`와 전체 단위 묶음. B: `tests/library-browser.mjs`/공식 브라우저. P: `tests/library-production-assigned.mjs`. N: 실제 보상을 쓰는 `simulate-library-runs`/`library-e2e`이다. P/B의 지정 상태를 N의 성공으로 대체하지 않는다.

| ID | 조건 | 상태 | 실제 근거/한계 |
|---|---|---|---|
| AC-001 | 최신 실제 main·현재 브랜치·미커밋 변경을 확인하고 보존한다. | PASS | baseline-source.json의 clean/최신main SHA, 별도 개발 브랜치 |
| AC-002 | 0.8.1 소스·help 겸용·기존 정상 문법을 이전 버전으로 되돌리지 않는다. | PASS | 기존306사례를 새0.9 registry로 재판정; v081-help/이전 전체 회귀 |
| AC-003 | Stage 9 기본 명세와 동반 밸런스/UI 명세를 구분하여 함께 적용한다. | PASS | 두 원문 spec을 변경 없이 별도 보존; libraryPolicy의 확정/초기 상수 |
| AC-004 | 사용자 확정값과 검증용 초깃값을 코드·보고서에서 구분한다. | PASS | LIBRARY_CONFIRMED / LIBRARY_INITIAL, 패치 노트의 분리 표 |
| AC-005 | 프레임워크·외부 문법 AI·다른 DS 게임·새 서버를 도입하지 않는다. | PASS | package-lock 의존성 동일; 기존 Vanilla JS/RunController 구조 |
| AC-006 | 28장 덱·기본 턴·드로우·교환·문장 한도·기존 일반 적 수치를 보존한다. | PASS | v09-state 시작28장·be2/have·자원/일반HP 버전 비교 |
| AC-007 | 지역명 몽환의 대서고와 5개 확정 적 이름을 정확히 표시한다. | PASS | stage9.js, library-browser의 입장/5라운드 실제 렌더 |
| AC-008 | 라운드가 what → where/when → whether → 가주어 → 도서관장 순이다. | PASS | stage9.js rounds, 지정 5전투 controller/production 검사 |
| AC-009 | 새 0.9 원정이 38~42번째 전투로 Stage 9를 진행한다. | PASS | 지정 38~42 controller 및 production UI. 자연42완주와 구분 |
| AC-010 | Stage 8 보상 뒤 Stage 9로 정상 전환하며 새 상점·무료 영구 카드를 만들지 않는다. | PASS | v09-state Stage8 승리→소개→입장, activeCardIds/shop RNG 보존 |
| AC-011 | 9-5 승리·보상 뒤 STAGE9_END로 완료하며 Stage 10·승천·전체 스토리 클리어를 열지 않는다. | PASS | v09-state 마지막 턴 처치→보상→STAGE9_END; production 종료 저장 |
| AC-012 | 구버전 0.8.1 원정은 37전투/STAGE8_END와 기존 자기 버전 수치를 보존한다. | PASS | 버전 고정0.8.1 저장·37전투/HP·원래 룬/보상 계약 회귀 |
| AC-013 | 전투 수·지역 registry·profile·save validator·UI·학습코스의 버전 연결이 일치한다. | PASS | contracts/campaignFeatures/registry/localStore, 정확 복원·milestone 검사 |
| AC-014 | what절의 검수된 주어·목적어·보어 용법이 정상 판정된다. | PASS | 28개 grammar fixture의 what 주어/목적어/보어 |
| AC-015 | what절에서 이미 빈자리를 대신했는데 목적어를 중복 채운 오류에 목표 근거를 부여하지 않는다. | PASS | what 중복 목적어 fixture 및 실제 parser의 gap 관계 |
| AC-016 | what 명사절을 기존 수식 관계절 또는 여러 명사절로 중복 채점하지 않는다. | PASS | nominal what 중복/relativeClauses 제외 검사 |
| AC-017 | where/when 간접의문문과 검수된 지배 동사 문형이 연결된다. | PASS | libraryLanguage 등록WH Frame과 grammar fixture |
| AC-018 | 간접의문문의 내부 도치 오류를 목표 구문 정상으로 인정하지 않는다. | PASS | 내부 도치 fixture의 targetEvidence=0 |
| AC-019 | 동일 where/when의 관계부사절·시간 부사절 기존 지원은 보존하고 Stage 9 대상으로 혼동하지 않는다. | PASS | 기존306사례 + 관계부사/시간절 비대상 fixture |
| AC-020 | whether + 완전한 유한절을 지원하며 or not을 필수로 요구하지 않는다. | PASS | whether 정상 완전 유한절 두 사례 |
| AC-021 | whether절의 성분 누락·일치 오류를 근거 범위에 맞춰 처리한다. | PASS | 내부 일치 오류와 외부 부사 오류 대비 |
| AC-022 | It ~ to와 It ~ that을 모두 가주어·진주어로 지원한다. | PASS | It-to/that fixture와 세 브라우저 실제 카드 형태 제출 |
| AC-023 | 가주어에서 허용 술어와 실제 진주어 연결을 검증한다. | PASS | EXTRAPOSITION_PREDICATES 허용표; happy 등 비허용 대비 |
| AC-024 | 지시적 it·수식 관계절·강조구문 모양을 가주어로 포괄 인정하지 않는다. | PASS | 지시적 it/명사보어+관계절/내용 없는 it 비대상 fixture |
| AC-025 | 기존 정상 that 내용절 및 실제 지원된 생략형도 명사절 공략 대상에서 누락하지 않는다. | PASS | 기존that/생략 content fixture, 실제 CONTENT_CLAUSE 근거 |
| AC-026 | 단순 to부정사·동명사·관계절만으로 도서관장 회복을 저지하지 않는다. | PASS | 일반 nonfinite/relative 비대상 fixture |
| AC-027 | 목표 구문 자체의 INVALID/RECOVERED와 구문 밖 경미 오류를 구분한다. | PASS | What I need are water vs What she need is water 실제 재현·수정·브라우저 |
| AC-028 | 명사절/가주어의 미합의 독립 배율을 새로 곱하지 않으며 실제 지역 ×1.25는 한 번만 적용한다. | PASS | 지역 REGION 이벤트1회, 독립명사절 배율 없음 v09-state |
| AC-029 | 기존 정상 문법·룬·시제 등 별개 구조를 보존하고 정답/점수 사전 미리보기를 넣지 않는다. | PASS | 306기존문법/전체회귀, 제출 전 score 미표시 브라우저 |
| AC-030 | what/whether 신규 정의는 기존 카드 존재 여부를 확인하고 중복 생성하지 않는다. | PASS | libraryLanguage 두 카드 정의·데이터 ID 중복 검사 |
| AC-031 | 새 목표 카드가 9-1 보상 전에 해금되어 9-1~9-4에서 영구 획득 가능하다. | PASS | ENTER_STAGE 후보팩 해금 및 2,400개 실제 보상 후보 생성 |
| AC-032 | 필요 카드가 Stage 9 보스 격파 뒤에야 풀리는 순환 의존이 없다. | PASS | 9-1 이전 해금/보스 무지급, 후보에서what/whether 실제 확인 |
| AC-033 | 지역 관련 보상 슬롯에서 목표 연결어·등록된 명사절 문형을 고려하되 희귀도 추첨을 무시하지 않는다. | PASS | isStageRelevantCard의 실제 Frame/AP/marker; 등급 trace 검사 |
| AC-034 | 공개 보상 3칸·취소·건너뛰기·저장 복원·중복 정산 정책을 보존한다. | PASS | 기존보상/저장/멱등 회귀 + Stage9 공개 offer 복원 |
| AC-035 | 목표 카드 확정 지급·무료 구제 상점·자동 획득·강제 선택을 추가하지 않는다. | PASS | 입장 activeCardIds 불변, createRewardOffer 기존3칸 선택 유지 |
| AC-036 | 9-1 what, 9-2 where/when, 9-3 whether의 일반전 빙정이 지정된 초깃값으로 생성된다. | PASS | v09-state 라운드별 manifest/공급 수·출처 |
| AC-037 | 9-4 that 미보유 판단이 영구 덱 기준이며 손패에 없다는 이유로 중복 지급하지 않는다. | PASS | 9-4 permanentCardDefIds 검사: 소유하되 손패 없음 대비 |
| AC-038 | 9-4 it/to 보조 공급은 채택한 초기안과 일치하고 기존 be 등 완성 세트를 자동 지급하지 않는다. | PASS | 9-4 missing that/it/to만; 보유시0, be 자동 추가 없음 |
| AC-039 | 빙정 사본은 영구 activeCardIds·영구 덱 장수·영구 보상 소유에 포함되지 않는다. | PASS | activeCardIds 불변/temporary partition validator |
| AC-040 | 카드 이동·형태 변경·상세 열람은 빙정을 소모하지 않는다. | PASS | 일반 WORD 이동·형태 경로 재사용; shatter는 accepted SUBMIT만 |
| AC-041 | 교환은 기존 규칙을 따르며 즉시 소멸로 바뀌지 않는다. | PASS | EXCHANGE 기존 pile 이동; libraryFrost 사본/partition 검증 |
| AC-042 | 정상 처리된 공격 제출과 0피해 비문 제출에서 해당 빙정이 한 번 소멸한다. | PASS | INVALID_CORE 및 정상 제출 consumedTemporaryCardIds/중복 정산 |
| AC-043 | 엔진 오류·거절·stale 명령에서는 카드·턴·빙정이 보존된다. | PASS | stale revision/throwing analyzer 후 state deepEqual |
| AC-044 | 소멸한 빙정은 탐색·재활용·재순환·로드로 복귀하지 않는다. | PASS | 소멸 사본 pile 부재·정확 restore 및 history/manifest validator |
| AC-045 | 승패·전투 이동 시 남은 임시 카드가 정리되고 9-4 사본이 9-5로 넘어가지 않는다. | PASS | 실제5전투 후 cleanup, 보스 temporaryCardIds 없음 |
| AC-046 | 9-5에는 what/where/when/whether/that/it/to 및 공략 지원용 임시 운영 카드 공급이 없다. | PASS | v09-state/library-browser/production 보스 시작 임시 카드0 |
| AC-047 | 일반전 가시성 보정이 기본 문장 경로·손패 한도를 지키며 보스 공략 손패 강제 보정을 하지 않는다. | PASS | ensureLibraryFrostVisibility non-witness swap, draw/RNG추가 없음 |
| AC-048 | 기존 Stage 6·Stage 8 임시 카드 공급과 보스 기믹은 손상되지 않는다. | PASS | 기존전체 frost/waterways 회귀 및 공식 snow 29검사 |
| AC-049 | 도서관장의 시작·최대·표시 HP가 모두 3000이다. | PASS | stage9 확정3000 및 실제 production HP/저장 validator |
| AC-050 | 살아 있고 손상된 턴 종료에 최대 1000, 부족분까지만 회복한다. | PASS | 보스 순수계산 fixture + 실제 Controller·UI 회복 |
| AC-051 | 최대 HP에서는 0 회복이며 거짓 +1000 표시가 없다. | PASS | fullHP PREPARE receipt actualHeal=0; 표현 분기 |
| AC-052 | 유효한 명사절 또는 가주어·진주어 양수 피해 공격은 그 턴의 회복만 저지한다. | PASS | 실제 영구what 공격 suppression + 다음 PREPARE 회복 |
| AC-053 | 목표 카드 철자만으로 저지하지 않고 실제 문법 근거를 사용한다. | PASS | libraryTargetEvidence의 selected node/card/validity 검사 및 비대상 fixture |
| AC-054 | 목표 문법을 영구 카드로 사용하면 정상 저지되며 빙정 출신 여부를 요구하지 않는다. | PASS | 영구 카드 지정 UI 공격, temporary meta 없어도 suppression |
| AC-055 | 회복 저지 효과가 다음 턴으로 남거나 영구 해제되지 않는다. | PASS | 같은 Controller target attack→다음 PREPARE, suppression=false |
| AC-056 | 체력이 깎인 상태의 준비에도 회복 판정을 한 번 수행한다. | PASS | PREPARE command receipt1회/같은commandId 재실행거부 |
| AC-057 | 교환·운영 카드·편집·상세 보기 등 무턴 행동에는 회복하지 않는다. | PASS | 교환/편집/보급·탐색·재활용 및 duplicate FINISH_OPERATION 검사 |
| AC-058 | 0피해 비문 공격은 턴 소비 후 회복하며 무효 목표 근거로 저지하지 않는다. | PASS | 실제INVALID_CORE→0피해·회복·턴 차감 |
| AC-059 | HP0 공격은 목표 문법 여부와 관계없이 즉시 격파하고 회복하지 않는다. | PASS | 비대상 고위력 마지막턴 lethal: heal0/즉시승리 |
| AC-060 | 마지막 턴에 HP0이면 승리 우선이며 살아 있으면 턴 종료 처리 뒤 패배한다. | PASS | 순수계산+controller 마지막턴 승리/살아있는 패배 대비 |
| AC-061 | 새 HP1 보호·피해 감소막·종류 수집·네 문법 강제 조건을 만들지 않는다. | PASS | 보스mechanic은 회복뿐; 비대상 lethal 허용 검사 |
| AC-062 | 중복 공격 완료·watchdog·재렌더·중복 turnEndId가 회복을 반복하지 않는다. | PASS | 중복 FINISH/저장복원/연출cancel/effectsOff/reducedMotion 검사 |
| AC-063 | 회복은 RunController의 상태 정산이며 VFX가 상태를 독자적으로 변경하지 않는다. | PASS | resolveLibraryTurnEnd 순수 계산, SUBMIT/PREPARE controller만 커밋 |
| AC-064 | 실제 피해·실제 회복·턴 종료 HP와 점수·골드·통계가 서로 오염되지 않는다. | PASS | actualDamage/actualHeal/hpAfterTurnEnd 별도 receipt 및 stats 비교 |
| AC-065 | 몬스터별 정식 문법명·형태·한 줄 설명과 실제 지역 보너스가 표시된다. | PASS | battleLearningGuide 고정데이터, 5종 실제UI/지역×1.25 |
| AC-066 | 일반전 빙정 체험과 보스전 미지급을 보상 선택 전에 입장 안내에서 알린다. | PASS | 입장 문구 실제 렌더/카드보상 이전 경계 |
| AC-067 | 공격 시 점수/피드백, 다음 편집 시 학습 안내로 복귀한다. | PASS | library-browser 공격 전후 guide/score 표시 전환 |
| AC-068 | 손패 긴 설명을 다시 넣지 않고 임시/영구·상세·클릭/터치 조작을 구별한다. | PASS | 공유 카드 상세/빙정 식별, 공식 입력·터치 회귀 |
| AC-069 | 도서관장 피해→회복/저지 순서와 실제 숫자가 시각적으로 읽힌다. | PASS | 실제 IMPACT→TURN_END 순서·회복/저지 숫자 및 캡처 |
| AC-070 | 도감·학습코스가 같은 문법 엔진을 쓰며 연습 재료/보상을 원정에 넘기지 않는다. | PASS | 같은 parser 근거의 도감/지정 학습 제출; 별도production정답 엔진 없음 |
| AC-071 | 미제공 아트·BGM을 제작 완료로 보고하지 않고 기존 UI·크기·가독성을 보존한다. | PASS | 기존 emoji/theme fallback; 원화/BGM 미제공 명시. 4해상도×10/14장 |
| AC-072 | 0.9 Stage 1~8 보스 HP가 400/800/840/1200/1300/1600/1900/2200으로 적용된다. | PASS | getEncounter 새0.9 전보스HP/구081 값 분리 단언 |
| AC-073 | 골렘은 부위당 280이고 총 840이며 부위 순서·초과 피해 미이월은 유지된다. | PASS | 각280/9000공격도280만 처리/3부위 순서 검사 |
| AC-074 | 운석은 희귀 다이아몬드로 표시되고 동일 rune.longSentence ID·레벨·배율을 유지한다. | PASS | runeForVersion 같은ID/기존배율 및 새RARE/다이아몬드 |
| AC-075 | 룬 후보의 전체 등급 유효 조건에서 희귀 3%, 나머지 일반:고급 2:1 가중치가 적용된다. | PASS | 조건부 가중치194:97:9의 actual offer/shop trace |
| AC-076 | 보상/상점/초회 예외/중복/최대 레벨/후보 소진을 구분하여 실제 룬 출현 분포를 검증한다. | PASS | 2400 seed 보상·상점 분리 집계, maxed rare 제외/기존intro 회귀 |
| AC-077 | have/that은 희귀, to/make/help/be/want는 고급이며 실제 후보·가격·표시가 일치한다. | PASS | registry 등급·기본점수/offer/shop 실제희귀가격 검사 |
| AC-078 | 등급 변경 때문에 시작 덱의 have 정책·28장 구성이 달라지지 않고 help 보상 전용도 유지된다. | PASS | 28장/be2/have 고정·help 시작/상점 제외, reward 획득 경로 |
| AC-079 | 고급 은빛은 메탈릭·장식성 있게 보이며 희귀 금빛과 실제 플레이 크기에서 구별된다. | PASS | 실제1366 카드gallery 및 4해상도 세브라우저 은/금 캡처 |
| AC-080 | 고급·희귀 운영 카드에도 같은 등급 시각체계가 적용되고 기능/연마 한도는 그대로다. | PASS | 같은 rarity 스타일의 운영2등급gallery, 운영전체회귀 |
| AC-081 | help 동·명 배지가 왼쪽 위에 있고 오른쪽 점수·연마·상태·드래그 표시와 충돌하지 않는다. | PASS | help badge/score 실제bounds 비중첩 및 공유렌더러 |
| AC-082 | 다이아몬드의 희귀 외형·발동 빛이 숫자·읽기 시간·음소거·입력을 해치지 않는다. | PASS | 실제 룬 점수 이벤트/발동 pulse/음소거AudioManager·모션감소 |
| AC-083 | 정상/오류/비대상 문법 fixture를 실제 카드·형태로 실행하고 결과를 기록한다. | PASS | 패키지28문법사례+추가경계/306기존사례 실제 카드snapshot 실행 |
| AC-084 | 보스 순수 계산과 controller 전이 및 브라우저 동작을 별도로 검증한다. | PASS | pure arithmetic / controller / 3engine UI / production별도 보고 |
| AC-085 | 새 42전투 흐름과 구버전 저장·완료 지점·기존 Stage 6/8 기믹을 회귀 검사한다. | NOT RUN | 42연결/38~42지정/구08137검사는 별도. 자연42완주는 미확보 |
| AC-086 | npm test·데이터 검증·npm run build·관련 브라우저 검사를 실제 실행하고 미실행은 NOT RUN으로 보고한다. | PASS | 명령별 result/log SHA와 실제 결과는 TEST_REPORT_0.9 및 실행manifest |
| AC-087 | HP/카드/턴/룬을 주입한 합성 검증을 자연 원정 완주·승률로 보고하지 않는다. | PASS | 모든 지정 상태/연마3/Lv3 주입을 명시, 자연 정책 결과와 분리 |
| AC-088 | 보스 무지급 상태의 자연 보상 준비·총 소모 턴·실제 회복/저지·정상 패배를 구분해 보고한다. | NOT RUN | 자연 보상 자동원정은 Stage9 도달 전 정상패배. 보스준비·회복/저지 자연경로 미실행 |
| AC-089 | 새로 채택한 초기 수치와 사용자 확정값, 미완료 자산을 최종 보고에서 구분한다. | PASS | 패치노트/검증보고서 확정·초기·자산대기 표 |
| AC-090 | 브랜치 커밋·push·PR까지만 수행하고 main 병합·공개 배포를 자동 실행하지 않는다. | NOT RUN | 로컬 검증 완료 후 원격 commit/push/PR 기록으로 갱신 예정 |
