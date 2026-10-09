# 0.6.1 production 실제 UI 증거

- 실제 명령: npm.cmd run test:e2e. seed57 / STANDARD / SB_E2E_SNOW_COURSE=1. exit0.
- 새 독립 브라우저 프로필에서 시작해 dist /grammardealer/의27전투를 실제 UI로 완료했다. 실제60공격(무효1포함), 운영17회,51체크 기록, 원본Playwright캡처60장이다.
- [실행 요약](production-summary.json), [실제 UI 동기화 명령](production-actions.json), [별도 학습 코스](production-course.json).
- 6-1비교급,6-2최상급,6-3as~as는 각각 해당 전투의 실제 손패와 제출 결과로 PASS다. 전체완주를 이 결과로 대신하지 않았다.
- 운영 구매·+1연마·사용은 완료 경로에서 확인했다. 같은 전투 동일 사본 재드로우/재사용은 이 경로에서 발생하지 않았다. 별도 재사용 경로 결과와 혼합하지 않는다.
- 학습3장 PNG는 원본실제녹화의687/727.5/761초 프레임을 그대로 추출했다. 합성화면이나 지정상태 캡처가 아니다. 표시된 문장은 자동정책 산출물이며 검수된 교육예문이 아니다.
- [실제 보스60초 클립](production-boss-actual-clip.webm)은 원본15분09.8초 녹화에서848초 이후를 stream-copy했다. 첫 피해·HP1잠금·중간 저장·마지막 결정과 처치를 포함한다. 원본50.7MB 영상과 전체로그는 로컬에 보존했다. Playwright 녹화에는 오디오 트랙이 없으므로 이 영상으로 소리 검증을 주장하지 않는다.
- 사슴 시작의 전투한정 탐색은 production-boss-opening-support.png, HP1은 production-boss-hp1.png, 마지막처치는 production-boss-last-kill.png, 완료복원은 production-complete-restored.png를 참조한다.
- 앞선2회는 sandbox loopback접근이 차단되어 게임에 진입하지 못한 환경실패다. 승인된 로컬 브라우저 접근으로 재실행한r3 결과만 PASS로 표시했다.

별도 자연 재사용 시도: [요약](production-reuse-summary.json), [명령·영수증](production-reuse-actions.json), [정제 로그](production-reuse.log). 실제 보급+1 한 사본을6·7전투에서 각각 다시 뽑아 두 번째로 사용했다. 부분 목표는 PASS다. 이후12전투 FUTURE/HP240/1턴/교환0에서 자동정책이 유한 다음 수를 찾지 못해 exit1로 중단했다. UI 상태는 BATTLE이며 DEFEAT라고 바꾸어 보고하지 않는다. 이 시도를 전체완주나27전투 학습코스 결과와 합산하지 않는다.
