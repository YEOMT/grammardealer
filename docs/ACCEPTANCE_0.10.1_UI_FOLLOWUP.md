# UI Followup84 실제 결과

최신 사용자 우선순위에 따라 대표 PC·태블릿·모바일 가로 조작을 먼저 검증했다. 실기기/전수픽셀검사는 미실행이며, UI범위 밖 게임규칙은 최종 전체 단위검사로 검증했다. PASS는 행에 적힌 범위만 의미한다.

집계: {'PASS': 61, 'FAIL': 6, 'NOT RUN': 17}

| ID | 조건 | 결과 | 실제근거/한계 |
|---|---|---|---|
| A01 | 작업 시작 HEAD/브랜치/미커밋/PR·병합 상태를 기록한다. | PASS | 기준 main/branch/보존 감사 및 원격 인계 기록 |
| A02 | 완료된 0.10.1을 기준으로 이어가며, 원본 ZIP으로 코드를 되돌리거나 전면 재작성하지 않는다. | PASS | 동일 브랜치의 기존 미커밋0.10.1 보존; source diff |
| A03 | 미병합은 기존 브랜치 후속 수정, 배포본은 다음 패치 경로로 구분한다. | PASS | 현재 미병합 개발 브랜치에 후속 반영 |
| A04 | 세로 플레이·조합대 페이지 등 충돌한 기존 조건을 SUPERSEDED 및 새 조건 ID로 추적한다. | PASS | 원래130 I03/I06/I08 SUPERSEDED 및 후속 B/D 연결 |
| A05 | 확정 HP·룬·보상·턴·저항·47전투 경계에 추가 변경이 없다. | PASS | 최종 전체 단위/데이터, policy0101 수치 회귀 |
| A06 | 기존 사전, 안전 저장, 불러오기와 원정 버전 격리를 보존한다. | PASS | 전체 구버전 저장 단위 + FOLLOWUP_EXACT_SAVE_RESTORE |
| A07 | 신규 동명사는 자수정, 기존 4형식은 토파즈이며 ID와 효과가 합쳐지지 않는다. | PASS | rune.svoo/rune.gerund 별도 ID·수치·저장 단위/도감 |
| A08 | 전용 아트·새 팔레트·최종 보스·새 힌트·자동 정답을 추가하지 않는다. | PASS | 변경파일 및 dependency/범위 감사 |
| B01 | 사용자가 만족한 손패 기준선의 소스/치수와 선택 이유가 기록된다. | PASS | hand-baseline-source.txt: main 14장 손패82px를 기준으로 통일. 사용자가 승인한 절대치로 주장하지 않음 |
| B02 | 같은 뷰포트·같은 단어·같은 형태에서 손패와 조합대의 정지 카드 외곽 너비가 일치한다. | PASS | SAME_PHYSICAL_CARD_HAND_TO_BOARD 및3화면 MAXIMUM |
| B03 | 같은 조건에서 영어 글꼴·크기·굵기와 긴 단어의 가로 맞춤 규칙이 일치한다. | PASS | 동일 물리I 카드의 fontFamily/fontSize/fontWeight 실측; 공통 word fit CSS |
| B04 | 조합대 카드가 한 장이거나 적을 때 가로로 늘어나지 않는다. | PASS | ROW_BOUNDARY_1:82px 고정 |
| B05 | 카드 수 증가나 1→2행 전환이 공통 카드 너비·영어 크기를 바꾸지 않는다. | PASS | ROW_BOUNDARY_8/9/16 같은82px |
| B06 | 2→3행 이상 전환도 너비·영어 크기를 바꾸지 않는다. | PASS | 844×390 실제3행·82px 및 동일 공통 영문fit |
| B07 | 2행에서는 필요할 때만 여백/높이를 압축하고 텍스트/버튼을 가리지 않는다. | PASS | 1024×650 두 행 카드/조작 bounds·캡처 |
| B08 | 3행 이상은 추가로 세로 압축하되 정보·형태 조작의 실측 최소 높이를 지킨다. | FAIL | 3행844×390 PASS이나4행 stress 높이 부족 |
| B09 | 전역 scale/zoom, 카드·글자의 scaleY로 레이아웃을 맞추지 않는다. | PASS | 코드 감사: 전체 scale/zoom/scaleY 없음 |
| B10 | 최대 16장 전체가 순서대로 읽히며 페이지·스크롤·말줄임으로 조합대 카드를 숨기지 않는다. | FAIL | 740×360/667×320 최대16장 네 행이 영역 밖으로 넘침. 숨김/페이지 없음 |
| B11 | DOM 순서와 sentenceSlots 순서가 모든 행에서 같다. | PASS | ROW_BOUNDARY_* DOM ID=sentenceSlots |
| B12 | 행 경계를 넘는 삽입/이동/맞교환/삭제/되돌리기가 정확한 사본에 적용된다. | NOT RUN | 실제cross-row reorder/undo PASS. 모든swap/삭제/행끝조합 이번후속전수검사 NOT RUN |
| B13 | 긴 단어·선택형 변경·연마·빙정·봉인·겸용 표시가 같은 규격에서 읽힌다. | NOT RUN | 긴단어/형태 기본검사 및이전봉인/빙정회귀있음. 모든상태의새공통규격조합 NOT RUN |
| B14 | 최대 손패와 최대 조합대 상태에서도 핵심 버튼이 밀려나지 않는다. | FAIL | stress 최대16장과 손패3장 페이지 상태에서 조합대/조작부 겹침 |
| B15 | 행 계산은 드래그 잔상·삽입 미리보기·일시적 transform을 실카드로 세지 않는다. | PASS | boardRows/observeBoard: 직접 자식 word-card와 비변형clientWidth; 단위검사 |
| B16 | 작은 화면의 한계는 실제 수치로 보고하며, 검증할 화면 조건을 임의로 줄여 PASS 처리하지 않는다. | PASS | stress2크기 실제 부족 치수 및 FAIL 보존 |
| C01 | SYNTAX ATLAS가 헤더 왼쪽에 있다. | PASS | 대표5크기 header 실측·캡처 |
| C02 | 스테이지 단계/이름 그룹이 화면 전체의 중앙에 있다. | PASS | stage-path 중심=viewport중심 실측 |
| C03 | 헤더 오른쪽 전체화면 버튼이 로비 바로 왼쪽이다. | PASS | header-actions fullscreen/lobby DOM 및캡처 |
| C04 | 최장 스테이지명과 전체화면 종료 상태에서도 헤더 겹침/편향이 없다. | NOT RUN | 일반라벨 정렬실측. 최장명/전체화면종료/폰트로딩전후 전조합 NOT RUN |
| C05 | 사전·도감·저장·내 덱 버튼의 글자와 클릭 영역이 소속 패널 안에 들어온다. | PASS | 대표3크기 panel 버튼 실측·모서리hit; DIRECT_FOUR_OVERLAYS |
| C06 | 양쪽 패널의 전체 높이와 하단 버튼이 실제 가시 화면 안에 들어온다. | FAIL | stress4행 카드가패널/버튼에침범. 대표3화면PASS |
| C07 | 룬 이름·레벨·요약·정렬 컨트롤이 패널 밖으로 나오지 않는다. | PASS | 대표3크기 룬4개 이름/레벨/정렬 캡처 검토 |
| C08 | 도감/사전을 삭제·통합하지 않고 자주 쓰는 기능이 한 번에 열린다. | PASS | DIRECT_FOUR_OVERLAYS 실제 각각1click |
| C09 | 핵심 텍스트/버튼을 overflow:hidden이나 말줄임으로 감추지 않는다. | PASS | 조합대 페이지/overflow clip 제거, 메뉴 유지. stress 넘침은 FAIL |
| C10 | 패널의 좁은 폭, padding, 최소 콘텐츠 크기, 줄바꿈과 2열 경계를 함께 검증한다. | PASS | 1024×650 좁은 패널2열·긴 룬 이름 캡처 |
| C11 | 버튼 중심뿐 아니라 모서리 부근의 입력도 올바른 컨트롤에 전달된다. | FAIL | 대표3화면 모서리hitPASS, stress일부버튼hitfalse |
| C12 | 호버·포커스·선택·비활성 상태의 테두리와 문구가 잘리지 않는다. | NOT RUN | 모든 hover/focus/disabled 테두리 전수 NOT RUN |
| C13 | FX와 투명 오버레이가 패널 클릭·툴팁·저장 조작을 가로채지 않는다. | NOT RUN | 이전FX pointer-events:none 및현재공격. FX중모든패널hit 재검사 NOT RUN |
| C14 | PC의 정상 배치를 보존하고 좁은 화면의 재배치만 국소적으로 적용한다. | PASS | PC 좌우패널/중앙조합 유지, 낮은 가로창 손패 우측 배치 |
| D01 | 휴대전화·태블릿의 세로 상태에서는 실제 플레이를 제공하지 않고 회전 안내를 보여준다. | PASS | PORTRAIT_GATE_BLOCKS_COMMAND_DEVICE_MOCK: 실제dialog+합성휴대기기정보 |
| D02 | 지원 환경에서 명시적 입력 후 전체화면과 가로 방향 잠금 요청을 수행한다. | NOT RUN | 명시button의 fullscreen→orientation.lock 구현, 실제모바일API NOT RUN |
| D03 | 잠금 미지원·거절 시 직접 회전 안내가 나타나고 오류로 멈추지 않는다. | NOT RUN | catch/manual fallback구현. 실제 방향lock거절 브라우저 NOT RUN |
| D04 | 실제 가로가 되면 전체화면·방향 잠금 미지원이어도 플레이할 수 있다. | PASS | ROTATION_RESTORES_DIALOG_AND_EXACT_RUN: 방향값 mock 후 실제 입력복귀 |
| D05 | CSS 90도 회전으로 물리 방향 잠금 성공을 가장하지 않는다. | PASS | 코드 감사: CSS rotate90deg 없음 |
| D06 | 키보드·핀치 확대에 따른 VisualViewport 축소를 기기 회전으로 오판하지 않는다. | PASS | needsRotation 단위: screen 방향 우선, visualViewport 사용하지 않음 |
| D07 | PC의 좁은 창에 무조건 모바일·휴대기기 방향 제한을 적용하지 않는다. | PASS | NARROW_DESKTOP_NOT_GATED |
| D08 | 회전 안내 뒤의 터치·키보드·팝업 조작이 게임 명령으로 새어나가지 않는다. | PASS | 실제 capture guard로 submit.click 차단, GATE_ABOVE_EXISTING_AND_LATER_DIALOG |
| D09 | 회전 중 드래그를 안전 취소하고 문장·형태·선택과 정상 게임 상태를 복귀시킨다. | PASS | cancel-drag hook/기존 resize drag검사+후속 exact state 복귀; 실제물리회전 아님 |
| D10 | fullscreenchange와 실제 fullscreenElement에 버튼 상태가 일치한다. | NOT RUN | final-panels-cross-2 이전실제Fullscreen PASS. 새헤더에서실제API 재검사 NOT RUN |
| D11 | 모달·FX가 전체화면 루트 안에서 보이며 재렌더링 때문에 전체화면이 반복 해제되지 않는다. | NOT RUN | HTML 안정루트/이전모달전체화면 PASS. 새레이아웃 실제Fullscreen 재검사 NOT RUN |
| D12 | 연출 중 회전·종료에서도 공격·회복·보상은 한 번만 정산되고 입력 잠금이 남지 않는다. | NOT RUN | 공격중resize 정확정산 PASS. 실제회전+전체화면종료 조합 NOT RUN |
| E01 | 주소창을 표시한 가로 태블릿에서 조합대와 주요 조작이 잘리지 않는다. | NOT RUN | 1024×650 viewport 에뮬레이션 PASS. 실제태블릿주소창 NOT RUN |
| E02 | 전체화면 전후의 페이지 스크롤과 필수 요소의 가시 영역 포함 여부를 모두 검사한다. | NOT RUN | 대표3화면 일반창boundsPASS. 최종Fullscreen 전후 재검사 NOT RUN |
| E03 | 노치·안전 영역·DPR·주소창 변경에서 여백을 중복 차감하거나 컨트롤이 화면 밖으로 나가지 않는다. | NOT RUN | 실제노치/DPR/주소창 조합 NOT RUN |
| E04 | 사전·도감의 긴 내용은 모달 내부 스크롤로 읽으며 닫기·검색을 사용할 수 있다. | PASS | DIRECT_FOUR_OVERLAYS 및 기존모달 내부스크롤 구현 유지; 후속 사전/도감 열기닫기 |
| E05 | 저장 3슬롯·불러오기·확인·취소가 보이고 기존 안전 저장 규칙을 지킨다. | PASS | FOLLOWUP_EXACT_SAVE_RESTORE 실제 IndexedDB 슬롯1/준비/복원 |
| E06 | 키보드가 열려도 검색·닫기·취소가 보이며 닫은 뒤 게임으로 정상 복귀한다. | NOT RUN | 기존keyboard-sized dialog 에뮬레이션. 실제OS키보드 NOT RUN |
| E07 | 형태 선택창이 화면 밖에 붙거나 작은 카드의 클릭 영역을 막지 않는다. | PASS | SAME_PHYSICAL_CARD 이후 실제 형태창 개폐 |
| E08 | 보상 3칸·룬 교체·연마·제거 대상의 핵심 확인 버튼이 잘리지 않는다. | PASS | ship-surfaces10checks18captures; 이후 aux CSS 내용 그대로 유지 (후속 재실행 아님) |
| E09 | 상점·로비·지역 소개·완료 화면의 주요 행동을 가로 화면에서 사용할 수 있다. | PASS | ship-surfaces 실제 상점/로비/소개/완료. 후속은 aux CSS 변경없음 |
| E10 | 팝업 닫기·취소·뒤로가기 후 초점과 입력 허용 상태가 정상 복원된다. | PASS | 모달닫기·회전뒤 동일상태 복귀 및 실제공격입력 재사용 |
| E11 | 브라우저 확대·핀치 확대를 차단하거나 초기화하지 않고 100% 검증과 구분한다. | PASS | viewport scale!=1이면 기존 레이아웃 유지 코드 감사; 실물핀치 NOT RUN |
| E12 | 크기 변경·observer 갱신이 반복 루프를 만들거나 RunController를 재생성하지 않는다. | PASS | ResizeObserver 단발 RAF 병합/cleanup, followup 단위 및 실제 resize |
| F01 | 또잉 효과는 고정 슬롯의 내부 시각 반응이며 끝나면 정확한 규격으로 돌아온다. | PASS | 정적 외곽·내부 card-motion 유지, 이전30실제공격/후속공격 |
| F02 | 여러 줄에서도 이벤트 근거 cardInstanceId만 반응하고 다른 사본은 반응하지 않는다. | PASS | 실제highlightCardIds 매핑 유지 + 이전3엔진근거검사; 행은DOM사본순서일치 |
| F03 | 콤보명·수치와 누적 글로우·입자, 룬 등급·레벨 차이가 유지된다. | PASS | 신규10룬/등급·레벨/콤보 단위와 REAL_ATTACK_RESIZE_ONCE |
| F04 | 행 수·전체화면 변경 후 FX가 새 좌표를 사용하며 낡은 위치로 날아가지 않는다. | PASS | scoreEffects 실행 시 boundingRect, viewport clear; 실제공격중resize |
| F05 | 고콤보 연출이 글자·적 HP·패널·공격 버튼을 가리지 않고 페이지를 늘리지 않는다. | FAIL | 대표화면실제공격PASS;stress최대문장 가림 존재 |
| F06 | effectsOff·reducedMotion에서도 필수 텍스트·정적 피드백·판정이 유지된다. | PASS | final-feel-clean 정상20/off5/off+reduced5 실제정산동일. 후속필수텍스트 CSS보존 |
| F07 | 화면 크기 변경·재렌더링이 콤보 카운트·점수·HP·회복·보상을 중복 처리하지 않는다. | PASS | REAL_ATTACK_RESIZE_ONCE 및 Controller 멱등성 전체회귀 |
| F08 | 반복 공격·회전·팝업 후 잔여 transform·FX 노드·타이머·RAF 누수가 없다. | NOT RUN | 후속이전 final-feel-clean30회 잔여timeout/interval/RAF0 PASS. 새orientation+observer 반복30회 NOT RUN |
| G01 | 조합대 위 몬스터와 이름·HP·기믹의 기본 가시성 및 작은 이미지 교체 여지가 남는다. | PASS | 대표3화면 enemy 이름/HP/간단기믹 캡처 |
| G02 | 큰 고정 몬스터 무대·25% 비율 때문에 조합대 높이를 희생하지 않는다. | PASS | enemy32/64/86px 국소높이; 25% 고정무대 없음 |
| G03 | Stage 1~10의 기존 색상에서 글자·상태·버튼 대비를 검사한다. | NOT RUN | 기존각지역검사/테마코드보존. 최종Stage1~10 대비전수 NOT RUN |
| G04 | 전용 원화·해상도 확정·팔레트 전면 개편은 이번 구현 범위에서 제외한다. | PASS | 신규아트/팔레트 변경없음 diff |
| H01 | 본 패키지의 실측 뷰포트 목록과 실제 실행 브라우저·기기를 기록한다. | PASS | 보고서 명시5크기 Chromium; 실기기 아님 |
| H02 | 0·1·8·16장과 계산된 행 경계의 카드 수를 검사하고 결과를 연결한다. | PASS | 0/1/8/9/16,cols8 행 경계 + mobile3행 실측 |
| H03 | 동일 어휘·선택형의 손패→조합대 이동 전후 치수와 실제 글자 스타일을 기록한다. | PASS | SAME_PHYSICAL_CARD_HAND_TO_BOARD 실제이동전후 JSON |
| H04 | 수치상 넘침 여부뿐 아니라 실제 가시성·가림·클릭 가능성을 검사한다. | PASS | MAXIMUM 카드/버튼bounds와 elementFromPoint 모서리hit; 실패2건보존 |
| H05 | 최종 코드에서 프로젝트의 기존 단위·데이터·빌드와 관련 UI 회귀 검사를 다시 실행한다. | PASS | 최종unit/data/build 및followup browser/production 명령 |
| H06 | 실기기·에뮬레이션, 실제 API·mock, 지정 상태·자연 원정을 별도 표기한다. | PASS | 지정상태/실제Controller/자연정책/방향mock/실물NOT RUN 분리 |
| H07 | 미실행은 NOT RUN, 미충족은 FAIL로 보고하고 과거 PASS를 재사용하지 않는다. | PASS | FAIL stress/자연정책·NOT RUN 실물 그대로 기록 |
| H08 | 스크린샷·영상은 기기·상태·행 수별 고유 파일명과 최종 커밋 정보를 가진다. | PASS | 고유캡처파일+증거manifest 해시, 영상은후속이전단계로표시 |
| H09 | 아직 승인되지 않은 최소 지원 크기·세부 치수 변경은 추가 검토 항목으로 보고한다. | PASS | 82/96px은구현선택;740×360/667×320 미지원최소치로임의확정하지않음 |
| H10 | 수정 내역·구 조건 대체·검증 결과·미완료·브랜치·PR을 인계하며 자동 병합·배포하지 않는다. | NOT RUN | commit/push/PR 뒤갱신 |
