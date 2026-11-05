# 근거와 해석 범위

작성일: 2026-11-05. 확인된 소스와 사용자의 지시, 이 명세의 설계안을 구분한다.
이 목록은 자료 확인 기록이며 게임 테스트 증거가 아니다.

## 사용자 지시에서 확정한 내용

이번 패치는 디자인을 손대지 않고 접속·터치 확대 방지 등 안정화에 한정한다. 현재 배치·카드·폰트·BGM 정책을 유지한다. 큰 검증 작업보다 빠른 구현과 실제 플레이 피드백을 우선한다.

## 저장소 소스 — 정적 확인

공통 ref: `cc802001556f88ec210a5d237ccb6c9fc9a26dd4`.

### R1. 기준 브랜치

`https://api.github.com/repos/YEOMT/grammardealer/branches/main`

작성 시 main은 위 SHA이며, PR #29의 0.12.1 통합 폴리싱 병합이다. 이 사실만으로 공개 Pages의 배포 완료나 실기기 정상 동작을 증명하지 않는다.

### R2. viewport와 전체화면

`https://github.com/YEOMT/grammardealer/blob/cc802001556f88ec210a5d237ccb6c9fc9a26dd4/src/ui/viewport.js`

확인 범위 1~48행. viewport 갱신과 드래그 취소 이벤트, 전체화면 지원/실패 처리, 주소 복사·현재 화면 계속 안내가 있다. 확대를 의도적으로 보존하던 기존 주석/처리를 새 입력 목표와 검토하되, 수동 확대를 강제로 초기화하라는 근거로 사용하지 않는다.

### R3. 카드 포인터 입력

`https://github.com/YEOMT/grammardealer/blob/cc802001556f88ec210a5d237ccb6c9fc9a26dd4/src/ui/cards.js`

확인 범위 59~120행. 한 active pointer, 8px 문턱, body ghost, 고정 이동 오프셋, pointerup의 저장 target 사용, 취소 listener가 확인된다. 멀티터치·fullscreen·최종 좌표는 재현 검토 대상이며 이 문서에서 실기기 버그로 단정하지 않았다.

### R4. AudioManager

`https://github.com/YEOMT/grammardealer/blob/cc802001556f88ec210a5d237ccb6c9fc9a26dd4/src/services/audio.js`

이번 추가 확인 범위 19~70행. 단일 context의 생성/재개, initializing guard, suspended/interrupted 처리, BGM 0.8×사용자 설정 경로가 있다. lifecycle과 BGM 순차 전환은 현재 구현을 작업자가 재확인하고 보존할 대상이다. 코드의 running 상태는 실제 청취 확인이 아니다.

### R5. 등록 자산

`https://github.com/YEOMT/grammardealer/blob/cc802001556f88ec210a5d237ccb6c9fc9a26dd4/src/services/sceneAssets.js`

확인 범위 1~22행. 로비·Stage 1·Stage 2 BGM 및 해당 지역 자산이 등록되어 있다. 미등록 후반 음악을 새로 제작하거나 다른 곡으로 채우라는 요구는 없다.

### R6. 기존 작은 화면 제한

`https://github.com/YEOMT/grammardealer/blob/cc802001556f88ec210a5d237ccb6c9fc9a26dd4/src/ui/responsive.css`

확인 범위 75~94행. 1,159px 이하 min-width:1160px과 내부 dialog scroller가 있다. 이번 범위에서는 해당 레이아웃을 재설계하지 않으며, 제스처 제한으로 기존 접근을 더 나쁘게 만들지 않는 조건만 둔다.

### R7. 저장소 작업 원칙

`https://github.com/YEOMT/grammardealer/blob/cc802001556f88ec210a5d237ccb6c9fc9a26dd4/AGENTS.md`

최신 소스 보존, Vanilla JS/ES Modules/Vite 유지, Controller 상태 권한, npm test/build 및 해당 UI 브라우저 검사, 미실행 NOT RUN, 별도 배포 승인 등을 확인했다.

## 웹 문서 — 기술적 제약 확인

### W1. MDN touch-action

`https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action`

none은 기본 pan/zoom을 막고, manipulation은 pinch를 허용한다. 조상과의 정책 조합 및 gesture 시작 시점이 중요하다. 영역 분리 설계의 근거이며 모든 브라우저에서의 실제 결과를 대신하지 않는다.

### W2. MDN Pointer Events

`https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events`

`https://developer.mozilla.org/en-US/docs/Web/API/Element/lostpointercapture_event`

pointer identity/capture/cancel/lost capture를 이용하는 입력 수명 관리의 근거다. 두 번째 손가락에 안전 취소하는 정책 자체는 이번 게임에 대한 설계안이다.

### W3. MDN 자동재생과 Web Audio

`https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay`

`https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices`

사용자 입력 기반 재생과 거부 시 재시도 필요성의 근거다. 무음의 원인을 정책 제한 하나로 단정하지 않는다.

### W4. MDN AudioContext 상태

`https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state`

중단/정지/폐쇄 상태를 구분하는 복구 설계의 근거다. 앱 전환·잠금 후의 실제 오디오 복구는 해당 환경에서 별도 확인한다.

### W5. MDN Fullscreen

`https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen`

사용자 동작에 의한 요청과 성공/실패 처리가 필요하다. 카카오톡 등 특정 앱 환경의 전체화면 가능 여부를 이 문서만으로 보장하지 않는다.

## 명세가 새로 정한 구현 기준

제스처 scope 분리, 다중 터치 중 카드 안전 취소, A~F 집중 확인, 0.12.2 앱 표시와 0.12.1 콘텐츠 계약 분리, 실패 시 기존 UI 재사용은 사용자 범위를 실현하기 위한 구현 지시다. 저장소에 이미 구현됐다는 사실 주장이 아니다.
