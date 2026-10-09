# 0.7 동사·보어·수동 검토

실제 0.7 export의 35동사 + will = 36개입니다. 첫 view는 현재 저장소의 버전별 registry에서 해당 lexeme가 처음 존재하는 정책입니다. 원본 모듈은 seed/learningFrames/timeLanguage/skyLanguage/desertLanguage/grammarPolishLanguage이며 새 emberLanguage는 기존 정의를 복제해 binding만 확장합니다. 새 카드와 Form ID는 없습니다.

표는 실제 런타임을 추출했습니다. 기대 JSON을 production 사전으로 읽지 않습니다. `tests/v07-boundaries.test.js`에서 36개 누락, 기존 카드/형태 동일성, 보어 binding을 대조하고 `tests/v07-grammar.test.js`에서 73개 문장 구조를 실제 파서로 검증합니다.

|동사|첫 view|현재 문형|등록된 수동 source → surface|교육 참고|
|---|---|---|---|---|
|be|0.1.0|svc.adj, svc.np, beLocative|없음|현재 지원: 2형식.|
|have|0.1.0|svo, svoc.bare, svoc.ing, svoc.pp|없음|목적어 뒤에 원형, -ing, p.p.를 둘 수 있습니다. have + 목적어 + p.p.는 완료 시제와 다릅니다.|
|do|0.1.0|svo|svo → sv|현재 지원: 3형식.|
|go|0.1.0|sv|없음|gone은 be 뒤에서 떠나 있는 상태를 나타낼 수 있습니다. go 자체의 수동태는 아닙니다.|
|come|0.1.0|sv|없음|현재 지원: 1형식.|
|run|0.1.0|sv|없음|현재 지원: 1형식.|
|live|0.1.0|sv|없음|현재 지원: 1형식.|
|work|0.1.0|sv|없음|현재 지원: 1형식.|
|play|0.1.0|sv, svo|svo → sv|현재 지원: 1형식, 3형식.|
|eat|0.1.0|sv, svo|svo → sv|현재 지원: 1형식, 3형식.|
|read|0.1.0|sv, svo|svo → sv|현재 지원: 1형식, 3형식.|
|like|0.1.0|svo, svoc.to, svo.to, svo.gerund, svoc.pp|svo → sv|목적어 뒤 to부정사나 p.p.를 써 선호하는 행동·상태를 나타낼 수 있습니다.|
|want|0.1.0|svo, svoc.to, svo.to, svoc.pp|svo → sv|목적어 뒤 to부정사나 p.p.를 쓸 수 있습니다. 욕구를 나타내며 사역 동사로 분류하지 않습니다.|
|need|0.1.0|svo, svoc.to, svo.to, svo.gerund, svoc.pp|svo → sv|목적어 뒤 to부정사나 p.p.를 쓸 수 있습니다. need -ing의 대상 연결도 유지합니다.|
|make|0.1.0|svo, svoo, svoc.adj, svoc.np, svoc.bare|svo → sv; svoo → sv + for; svoc.adj → svc.adj; svoc.np → svc.np; svoc.bare → svc.to|목적어 뒤 원형을 쓰는 사역 구조가 있습니다. 이 구조를 수동태로 바꾸면 to부정사를 씁니다.|
|give|0.1.0|svo, svoo|svo → sv; svoo → svo; svoo → sv + to|현재 지원: 3형식, 4형식.|
|see|0.1.0|svo, svoc.bare, svoc.ing, svoc.pp|svo → sv; svoc.bare → svc.to; svoc.ing → svc.ing|목적어 뒤 원형은 행동 전체, -ing는 진행 중인 모습, p.p.는 대상이 받는 동작을 나타낼 수 있습니다.|
|help|0.1.0|sv, svo, svoc.to, svoc.bare, svo.to, svo.bare|svo → sv; svoc.to → svc.to; svoc.bare → svc.to|목적어 뒤 동사 원형과 to부정사를 모두 쓸 수 있습니다. 모든 -ing·p.p. 보어를 허용하는 동사는 아닙니다.|
|feel|0.1.0|svc.adj, svo, svoc.bare, svoc.ing|svo → sv|목적어 뒤 원형이나 -ing로 느껴지는 행동을 나타낼 수 있습니다.|
|become|0.1.0|svc.adj, svc.np|없음|현재 지원: 2형식.|
|look|0.1.0|svc.adj|없음|현재 지원: 2형식.|
|take|0.1.0|svo|svo → sv|현재 지원: 3형식.|
|keep|0.1.0|svo, svoc.adj, svoc.np, svoc.ing, svoc.pp, svo.gerund|svo → sv; svoc.adj → svc.adj; svoc.ing → svc.ing; svoc.pp → svc.pp|목적어 뒤 -ing나 p.p.로 지속되는 동작·상태를 나타낼 수 있습니다. keep -ing는 계속 ~하다입니다.|
|find|0.1.0|svo, svoc.adj, svoc.np, svoc.ing, svoc.pp|svo → sv; svoc.adj → svc.adj; svoc.np → svc.np; svoc.ing → svc.ing; svoc.pp → svc.pp|목적어 뒤 형용사, 명사, -ing, p.p.로 발견한 상태나 행동을 나타낼 수 있습니다.|
|show|0.1.0|svo, svoo|svo → sv; svoo → svo; svoo → sv + to|현재 지원: 3형식, 4형식.|
|create|0.1.0|svo|svo → sv|현재 지원: 3형식.|
|improve|0.1.0|sv, svo|svo → sv|현재 지원: 1형식, 3형식.|
|develop|0.1.0|svo, sv|svo → sv|현재 지원: 3형식.|
|change|0.1.0|sv, svo|svo → sv|현재 지원: 1형식, 3형식.|
|send|0.2.0|svo, svoo|svo → sv; svoo → svo; svoo → sv + to|현재 지원: 3형식, 4형식.|
|will|0.3.0||없음|will 뒤에는 동사 원형을 씁니다. 미래를 나타내는 조동사입니다.|
|think|0.4.0|sv, svo.content|없음|등록된 기본 뜻과 문형에서 판정합니다.|
|know|0.4.0|sv, svo, svo.content|svo → sv|등록된 기본 뜻과 문형에서 판정합니다.|
|say|0.4.0|svo, svo.content|svo → sv|등록된 기본 뜻과 문형에서 판정합니다.|
|enjoy|0.5.0|svo, svo.gerund|svo → sv|enjoy 뒤에는 동명사(-ing)를 씁니다. 명사 목적어도 사용할 수 있습니다.|
|finish|0.5.0|svo, svo.gerund|svo → sv|finish 뒤에는 명사나 동명사(-ing)를 씁니다.|

have의 소유 용법, be/become 및 SV 전용 용법은 일괄 수동화하지 않습니다. gone은 검수된 상태 AP이고 수동태가 아닙니다. feel PP를 일반 규칙으로 추가하지 않았다는 사실을 영어 전체의 금지 규칙으로 설명하지 않습니다. keep NP는 기존 등록을 보존하되 교육 기본 예문으로 확대하지 않습니다.

Cambridge 참고 URL은 첨부 명세에 보존했습니다. 이번 실행에서 웹 본문 접근은 403이어서 새 독립 문헌 검증을 PASS로 주장하지 않습니다. 구현 검수와 실제 교사의 최종 교육 검수는 별개이며 후자는 NOT_RUN입니다.
