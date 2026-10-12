# 0.9 언어·교육 검토

검수 범위는 등록된 카드·Sense·Frame과 기존 유한절/준동사 파서다. 외부 번역·문법 API, 정답 문장 목록을 production에 추가하지 않았다. 아래는 구현 검토이며 교사/학생 실사용 검수는 NOT RUN이다.

| 구조 | 실제 데이터/파서 연결 | 경계 |
|---|---|---|
| what | card.what / form.what.base, 명사 자리의 내부 주어/목적어 gap | 주어·목적어·보어·검수된 직접목적어. 목적어 중복, 앞 명사 수식 관계절로 확대하지 않음 |
| where/when | 기존 WH 유한절, know/see/show/say의 frame.svo.wh, show의 frame.svoo.wh | 기존 직접의문문·관계부사·시간 부사절 유지. 간접절 도치/성분 누락을 공략 근거로 인정하지 않음 |
| whether | card.whether / form.whether.base, 위 검수된 WH Frame의 완전한 유한절 | or not은 필수 아님. whether to, 모든 or not 배치, 새 if 명사절은 추가하지 않음 |
| that/생략 | think/know/say의 기존 frame.svo.content | 기존 절 연결 점수 그대로, 새 명사절 이름으로 다시 곱하지 않음 |
| 가주어 to/that | 실제 it + finite be + 평가 AP + 내용 연결 | good/important/bad: to·that, easy/hard/difficult: to. 지시적 it·관계절·강조 모양 전체를 포괄 인정하지 않음 |
| help | 기존 동사 + MASS 명사, 동일 카드 ID/형태 | 새0.9에서도 I help you / I need more help 판정과 기본점수 한 번을 유지 |

모든 평가 형용사는 기존 DB에 존재한다. 새로운 WORD는 what/whether 둘뿐이며 기존 where/when/that/it/to와 동사를 재사용한다. 기본정답은 해금과 독립적이다. 해금은 새 목표 카드의 보상 경로를 연다.

선택된 constituent의 nominalStructures에는 nodeId, 실제 cardIds, 외부 역할, gap/marker, 해당 절 및 고유 오류 범위를 기록한다. 명사절 주어의 what 카드가 바깥 수 일치 오류의 기준점으로 재사용되더라도 내부 절 오류로 간주하지 않는다. 가주어의 it/finite be는 목표 구조 자체의 일부다. 실제 재현·교정은 locality-before-01 / locality-after-01 로그와 v09-library-grammar 검사가 입증한다.

| 교육 UI | 고정 데이터 | 구현 검토 |
|---|---|---|
| 9-1 | 관계대명사 what / what + 절 | 명사 역할과 내부 빈자리 설명 |
| 9-2 | 간접의문문 / where·when + S + V | 평서문 어순, 직접의문문·관계부사와 구별 |
| 9-3 | whether 명사절 / whether + S + V | 완전한 유한절, or not 선택 |
| 9-4 | 가주어·진주어 / It + be + AP + to/that | 평가 술어의 허용 범위와 뒤의 실제 내용 |
| 9-5 | 명사절·가주어의 그 턴 회복 저지 | 보스 미지급·최대1000·HP0 즉시 처치 |
| 문장 도감 | NOMINAL_GUIDE/NOMINAL_CATALOG | 실제 제출의 구조 사용·최초/최고 완성만 개인 기록. 새 점수 tag나 예시 업적을 만들지 않음 |

새 문법32검사에는 패키지28사례, 내부/외부 오류 대조, 중복 방지 및 기존306사례 대조가 포함된다. 부속 JSON의 초기 NOT RUN 표시나 문서 자체검사를 실행 증거로 사용하지 않는다. 실제 명령/상태는 검증 보고서를 참조한다.
