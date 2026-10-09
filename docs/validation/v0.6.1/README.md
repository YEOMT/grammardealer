# 0.6.1 실행 증거 안내

- [명령·시각·종료 코드](commands.json), [실제 테스트 보고](../../TEST_REPORT_0.6.1.md), [A001–A139](../../ACCEPTANCE_0.6.1.md).
- `grammar-results.json`: 수정 전 재현/새 문법/옛 분석 보존. `operation-progression-results.json`: Controller·저장·운영 단위 실제 결과.
- `official-browser-results.json`, `official-polish-cross-results.json`: 기존 공식 검사를 이번 소스에서 다시 실행한 결과다. 과거 PASS를 복사하지 않았다.
- `ui-results.json`, `ui-edges-results.json`, `ui-summary.json`: ASSIGNED 실제 UI. 자연 획득 원정이나 실제 OS 탭 전환으로 부르지 않는다.
- `ui-contrast-results.json`: 실제 렌더링 글자 위치의 합성 픽셀 대비, 작은 글자4.5/큰 글자3. `ui-contrast/`의 before/after 원본을 참조한다.
- [production 실제 UI](production/README.md): 실제 dist/실제 카드27전투, 별도 설원3전투 학습 코스, 대표 PNG와 실제 무음 영상.
- `build-manifest.json`: production에 사용한 빌드의 해시. 원본 로그/대형 영상/나머지 캡처는 `.local-validation/v061/`에 로컬 보존한다.

Playwright Chromium/Firefox/WebKit 검사와 실제 iPad/Android/Safari 기기 검사는 서로 다르다. 문서의 JSON 기대값·산술·지정 상태·자동 정책·production UI 증거 수준을 섞지 않는다.
