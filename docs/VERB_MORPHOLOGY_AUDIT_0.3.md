# 0.3 동사 형태·Frame 검토

기존 활성 30동사와 신규 조동사 will 1장을 구분한다. 아래는 실제 registry의 전수 목록이다. tests/v03-audit.test.js는 독립 작성한 30개 과거/-ing/p.p. 철자와 각 본동사 Frame의 과거·완료 문장을 실제 Parser로 검사한다. 0.2.2의 Sense/Frame은 유지하며, 마지막 본동사가 목적어/보어 요구를 결정한다. 교사 검수는 NOT RUN.

| 동사 | 원형/현재 | 과거 | -ing | p.p. | 기존 지원 Frame |
|---|---|---|---|---|---|
| be | am/is/are/be | was/were | being | been | frame.svc.adj, frame.svc.np, frame.beLocative |
| have | have/has | had | having | had | frame.svo, frame.svoc.bare |
| do | do/does | did | doing | done | frame.svo |
| go | go/goes | went | going | gone | frame.sv |
| come | come/comes | came | coming | come | frame.sv |
| run | run/runs | ran | running | run | frame.sv |
| live | live/lives | lived | living | lived | frame.sv |
| work | work/works | worked | working | worked | frame.sv |
| play | play/plays | played | playing | played | frame.sv, frame.svo |
| eat | eat/eats | ate | eating | eaten | frame.sv, frame.svo |
| read | read/reads | read | reading | read | frame.sv, frame.svo |
| like | like/likes | liked | liking | liked | frame.svo, frame.svoc.to, frame.svo.to |
| want | want/wants | wanted | wanting | wanted | frame.svo, frame.svoc.to, frame.svo.to |
| need | need/needs | needed | needing | needed | frame.svo, frame.svoc.to, frame.svo.to |
| make | make/makes | made | making | made | frame.svo, frame.svoo, frame.svoc.adj, frame.svoc.np, frame.svoc.bare |
| give | give/gives | gave | giving | given | frame.svo, frame.svoo |
| see | see/sees | saw | seeing | seen | frame.svo, frame.svoc.bare |
| help | help/helps | helped | helping | helped | frame.sv, frame.svo, frame.svoc.to, frame.svoc.bare, frame.svo.to, frame.svo.bare |
| feel | feel/feels | felt | feeling | felt | frame.svc.adj, frame.svo, frame.svoc.bare |
| become | become/becomes | became | becoming | become | frame.svc.adj, frame.svc.np |
| look | look/looks | looked | looking | looked | frame.svc.adj |
| take | take/takes | took | taking | taken | frame.svo |
| keep | keep/keeps | kept | keeping | kept | frame.svo, frame.svoc.adj, frame.svoc.np |
| find | find/finds | found | finding | found | frame.svo, frame.svoc.adj, frame.svoc.np |
| show | show/shows | showed | showing | shown | frame.svo, frame.svoo |
| create | create/creates | created | creating | created | frame.svo |
| improve | improve/improves | improved | improving | improved | frame.sv, frame.svo |
| develop | develop/develops | developed | developing | developed | frame.svo, frame.sv |
| change | change/changes | changed | changing | changed | frame.sv, frame.svo |
| send | send/sends | sent | sending | sent | frame.svo, frame.svoo |
| will | will |  | — | — | 조동사 전용 |

- likeing을 liking으로 수정. be의 was/were는 주어 수·인칭에 맞춰 판정하며 been/being은 독립 유한 동사가 아니다.
- read 단독은 명시적 과거 선택만 PAST, 기본 선택은 PRESENT다. have read의 read는 p.p.이다. played/had/run처럼 같은 표면의 합법 형태는 문맥으로 연결한다. 점수·룬·골렘 상태를 Parser에 넣지 않는다.
- will에는 3인칭/과거/분사를 추가하지 않았다. 본동사 Frame을 갖지 않으며 시작 덱에서는 제외한다.
- be/have는 본동사와 보조동사 분기를 함께 가진다. 사역/관계절/to절은 기존 작은 Parser를 재사용한다. 일반 수동태·비교·다른 조동사 확장은 이번 범위 밖이다.

근거: [British Council 불규칙 동사](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/irregular-verbs), [동사구](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/verb-phrases). 표의 Frame은 영어 전체 용법이 아니라 게임의 등록 범위다.
