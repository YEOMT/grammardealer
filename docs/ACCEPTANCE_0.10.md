# 0.10 실제 인수 추적표

합성·지정 상태·자연 원정·브라우저 근거를 구분한다. 단위검사의 PASS는 자연47전투 완주나 모바일 실기 검증이 아니다. 기준 기대자료는 `spec/v0.10/03_ACCEPTANCE_KO.md`이며 부속 self-check 결과를 사용하지 않았다.

[명령·종료 코드](validation/v0.10/commands.json) · [단위 로그](validation/v0.10/unit.txt) · [브라우저](validation/v0.10/corridor-browser.json) · [production 지정 전투](validation/v0.10/production-assigned.json) · [자연 시도](validation/v0.10/natural-controller.json) · [보고서](TEST_REPORT_0.10.md)

개별 코드 근거: [문법](../tests/v010-corridor-grammar.test.js), [상태/순수 계산](../tests/v010-corridor-state.test.js), [경계/통합](../tests/v010-corridor-edges.test.js).

| ID | 항목 | 결과 | 실제 근거·범위 |
|---|---|---|---|
| A01 | 기준 소스 | PASS | 시작 main db73c606 · clean 확인 · 독립 브랜치 및 진행 기록 |
| A02 | 개발 버전 | PASS | package/version・campaignFeatures・lobby と production 起動 |
| A03 | 전투 수 | PASS | new-run manifest 47 + assigned 43–47 sequential; natural 47 completion is separate NOT RUN |
| A04 | 전투명 | PASS | stage10 data and focused/production battle headings |
| A05 | Stage 10 HP | PASS | new-run/assigned state assertions: 2500/2900/3300/3800/5000 |
| A06 | 지역 콘셉트 | PASS | stage10 CSS columns/night-sky and captures; dedicated art is not delivered |
| A07 | 최종전 제외 | PASS | 47-end/no NEXT_BATTLE and profile storyClearCount=0 |
| A08 | 덱·턴 보존 | PASS | new-run 28/6/16 assertions + existing resource regression |
| A09 | 0.9 보존 | PASS | all nine boss definitions equal 0.9 + existing boss/help/diamond regression |
| A10 | 범위 제한 | PASS | scope review + mixed/no-target grammar cases |
| B01 | will 형태 | PASS | physical forms test + actual browser selected would snapshot |
| B02 | can 형태 | PASS | UNCOMMON card.can/base/could + actual browser submission |
| B03 | 중복 카드 금지 | PASS | separate would/could card absent; duplicate physical snapshot rejected |
| B04 | 원형 요구 | PASS | G038–G043 malformed auxiliary tests |
| B05 | 완료 결과절 | PASS | physical snapshots and 10-4 two separate have frost submissions |
| B06 | 미래 오인정 | PASS | G033 and dedup test: no FUTURE_WILL for would |
| B07 | could 역할 | PASS | G031/G032 + actual boss standalone could does not bypass |
| B08 | 형태 범위 | PASS | formsForCard(card.can) exactly can/could |
| B09 | 시작 덱 제외 | PASS | new run 28 and can absent, generator 0.8.1 preserved |
| B10 | 등급·소유 | PASS | registry rarity/base score and existing WORD polish renderer |
| C01 | 현실 조건절 | PASS | G001 onward physical snapshots with will/can |
| C02 | 절 순서 | PASS | preposed/postposed cases; result main frame asserted |
| C03 | 가정법 과거 | PASS | if past/could + would/could actual parser cases |
| C04 | were 경계 | PASS | G011 uses home for absent here; ordinary I were keeps issue |
| C05 | 과거완료 | PASS | had+pp vs lexical I had a book; no forced when |
| C06 | 가정법 과거완료 | PASS | paired actual had/pp and would/could/have/pp |
| C07 | 현재완료진행 | PASS | have/has/been/ING and no separate round |
| C08 | 완료진행 오인정 | PASS | G035/36/42/43/45 target exclusions |
| C09 | 미지원과 오류 | PASS | G044 mixed pair does not gain UNREAL; no fake VALID override |
| C10 | 기존 절 보존 | PASS | 306 legacy interpretations in current 0.10 + full regression |
| D01 | 새 배율 | PASS | corridorPolicy INITIAL fractions and score events |
| D02 | 조건/연결 중복 | PASS | same connector ID LINK suppression test |
| D03 | 가정형 시제 | PASS | local COUNTERFACTUAL mood, no fake TIME past/future |
| D04 | 가정완료 포함관계 | PASS | same condition/result VP pair suppression receipt |
| D05 | 과거완료 중복 | PASS | PP same-VP TIME replacement; independent came kept |
| D06 | 현재완료진행 중복 | PASS | PPC replaces same VP PERFECT and PROGRESSIVE |
| D07 | 독립 근거 보존 | PASS | independent has-helped + and and actual past retained |
| D08 | 지역 보너스 | PASS | actual Stage10 target region exactly once; PPC-only excluded there; replaced temporal evidence retains only the existing Stage3 bonus |
| D09 | 해금 정책 | PASS | valid before unlock, profile corridor baseline excluded, PPC needs both packs |
| D10 | 정수·표시 일치 | PASS | multiplyFloor arithmetic and actual scoreTimeline/repeated-hit aggregation |
| E01 | 10-1 | PASS | pure supply fixtures + actual round1 deficit/hand/save |
| E02 | 10-2 | PASS | pure supply fixtures + actual round2 deficit/hand/save |
| E03 | 10-3 | PASS | pure supply fixtures + actual round3 deficit/hand/save |
| E04 | 10-4 | PASS | have 0/1/2/3 pure cases; actual four-frost 10-4 |
| E05 | 보스0 | PASS | actual round5 zero and 10-4 victory cleanup into boss |
| E06 | 소유 기준 | PASS | permanent active definitions; hand rearrangement does not grant |
| E07 | 1회 생성 | PASS | duplicate supply rejection, replay after save, frozen trace |
| E08 | 소멸 규칙 | PASS | actual invalid shatter, engine error/stale revision no spend; winning valid shatter |
| E09 | 분리·정리 | PASS | actual defeat cleanup and valid 10-4 victory/boss transition |
| E10 | 가시성 | PASS | all four opening witness cards retained, supported material visible, deterministic replay |
| F01 | 초기 상태 | PASS | actual 5000 initial no-memory positive hit |
| F02 | 동일 문형 | PASS | actual repeat SVO final0 and unchanged HP |
| F03 | 문형 전환 | PASS | actual five-frame sequence and alternating memory |
| F04 | 가정법 우회 | PASS | actual UNREAL present/past paired evidence bypass same frame |
| F05 | 거짓 우회 방지 | PASS | actual real-if/PP/PPC/lone modal/nominal-if no bypass |
| F06 | 키 정규화 | PASS | actual SVC adjective/noun, SVO content and all five frames |
| F07 | 기억 유지 | PASS | prepare/exchange/operation/edit and current-state restore |
| F08 | 실패 악용 방지 | PASS | invalid/error/malformed-main keep memory; structural predicate avoids status-only exclusion |
| F09 | 격파 우선 | PASS | actual final-turn >=5000 kill wins; blocked final turn loses |
| F10 | 멱등성 | PASS | duplicate finish rejected; VFX cancel/reduced/effects-off one history and one turn |
| G01 | S7 | PASS | R001 onward arithmetic + real stage07 NORMAL resolveAttack |
| G02 | S8 | PASS | actual stage08 NORMAL and 13/20 fraction |
| G03 | S9 | PASS | actual stage09 NORMAL and 3/5 fraction |
| G04 | S10 | PASS | actual stage10 controller and production UI 7/10 |
| G05 | 비대상 | PASS | R025–29 eligibility + old versions untouched and boss absent |
| G06 | 연산 순서 | PASS | actual scoreTimeline after rune/region, one RESISTANCE event |
| G07 | HP와 초과 | PASS | resolution pre/post/final/HP/overkill fields tested separately |
| G08 | 0과 소수 경계 | PASS | 0/1/101 and boundary arithmetic fixtures |
| G09 | 투명한 표시 | PASS | normal-resistance UI label and score event, focused captures |
| G10 | 고정 저항 | PASS | fixed ratio only; confirmed enemy HP unchanged |
| H01 | 입장 흐름 | PASS | actual assigned Stage9 kill→reward→intro10→shop43 |
| H02 | 입장 상점 | PASS | entry shop once, history4, can unlocked before stock |
| H03 | can 후보 | PASS | eligibleRewardCards before/after entry + stock shared eligible pool |
| H04 | 희귀도 보존 | PASS | existing0.9 rarity/price/distribution tests and unchanged policy aliases |
| H05 | 무료 구제 금지 | PASS | entry snapshot active IDs unchanged, grant arrays empty |
| H06 | 서비스·이력 | PASS | actual fifth-shop purchase/polish/removal commands + exact restored history, price/service regression |
| H07 | 공개 후보 고정 | PASS | fifth shop exact saved stock/RNG; existing offer cancel/load regression |
| H08 | 진행 정산 | PASS | assigned sequential43–47 rewards/defeat/duplicate commands |
| H09 | 완료 경계 | PASS | last victory reward once, STAGE10_END/no48/save |
| H10 | 무승리보장 | PASS | no guarantee slot/free boss material; natural QA defeat remains possible |
| I01 | 안내문 | PASS | fixed stage10 learning rows and focused real forms |
| I02 | 보스 설명 | PASS | exact three boss sentences + memory/blocked/bypass captures |
| I03 | 예상 정답 금지 | PASS | score hidden before submit; no new analysis preview |
| I04 | 형태조작 | PASS | separate desktop PointerEvent drag and emulated touch form/snapshot; physical device NOT RUN |
| I05 | 손패 정보 | PASS | four viewport ×10/14-hand and16-board geometry; can/frost common renderer |
| I06 | 피드백 전환 | PASS | actual presentation→learning guide return and recovery modes |
| I07 | 도감·실습 | PASS | five catalog tags, actual VP/form records and modal dictionary notes |
| I08 | 자료 구분 | PASS | all assigned reports explicitly classified; natural output separate |
| I09 | 자산 폴백 | PASS | CSS/emoji fallback with successful production JS/CSS requests |
| I10 | 가시성과 입력 | NOT RUN | desktop/resolution and emulated touch checked; physical mobile/device inspection NOT RUN |
| J01 | 0.9 완료 | PASS | version-pinned0.9 final-turn/end/save regression stays STAGE9_END42 |
| J02 | 0.9 진행 | PASS | old0.9 registry/will/rune/HP/resistance-free tests |
| J03 | 구버전 일반 | PASS | explicit version sets, previous versions full regression |
| J04 | 새 manifest | PASS | CORRIDOR_VERSIONS registry/manifest/entry/receipt validation |
| J05 | 안전 저장 | PASS | Stage9 pre-entry clear, fifth shop, battle, reward/end save + IndexedDB browser restore |
| J06 | RNG 결정론 | PASS | same safe state prepare/reload exact RNG and receipt replay |
| J07 | 카드 보존 | PASS | actual frost duplicate/orphan/shatter/cleanup and generic card invariants |
| J08 | 기존 보스 | PASS | all nine unchanged boss definitions + full old boss regression |
| J09 | 0.9 UI/기능 | PASS | focused help corner/diamond/operation rarity + legacy browser bundle |
| J10 | 연출 중복 | PASS | duplicate finish/stale revision + recovery browser tests |
| K01 | 문법 실제실행 | PASS | 48 actual physical snapshot cases; two missing-word substitutions disclosed |
| K02 | 계산 실제연결 | PASS | 29 resistance /18 foresight /13 supply expected fixtures run against real pure functions |
| K03 | 부정/경계 | PASS | negative grammar, local errors, all five frames, before/after unlock |
| K04 | 자연 원정 | NOT RUN | natural Controller and production attempts recorded; full47 completion NOT RUN if not reached |
| K05 | 합성 분리 | PASS | assigned cards/runes/scene setup explicitly separated from natural play |
| K06 | 필수명령 | PASS | command exit codes and exact final results in TEST_REPORT_0.10 |
| K07 | 브라우저 | PASS | focused three-engine UI and production resource tests separate from Controller |
| K08 | 추적 문서 | PASS | progress/report/language review and110 rows |
| K09 | 범위보고 | PASS | placeholder art/BGM, physical device and natural completion limits disclosed |
| K10 | 인계종료 | PASS | 구현 e1b0735 push + [Draft PR #15](https://github.com/YEOMT/grammardealer/pull/15); main SHA 불변, auto-merge 없음 |

K04: 정상 새 원정에서 목표 경계를 시도했으나 완주 증거는 미확보다. 실제 시도 결과를 보고서에 기록하며 지정 상태 승리로 대체하지 않는다. I10: 실제 PC 브라우저/터치 에뮬레이션까지이며 물리 모바일 기기 검수는 미실행. K10: push 및 Draft PR 생성 확인. 최종 추적 합계는 108 PASS / 2 NOT RUN이며 자연 완주나 물리 기기 검사를 대신하지 않는다.
