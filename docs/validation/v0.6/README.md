# 0.6 실행 증거

이 폴더는 이번 0.6 구현에서 새로 실행한 결과다. 첨부 JSON 기대값이나 과거 Work 결과를 통과 기록으로 사용하지 않았다. 상세 범위와 실패 이력은 [검증 보고서](../../TEST_REPORT_0.6.md), P001–P173은 [인수표](../../ACCEPTANCE_0.6.md)를 따른다.

- `commands.json`: 실제 명령·시작/종료 시간·종료 코드. `browser-summary.json`: 공식 14개 스크립트, 291 checks.
- `production-browser.json`: final3 production `/grammardealer/`에서 실행한 27전투·62공격·32검사와 실제 조작 기록. `production-build-hashes.json`: 그 빌드의 SHA256.
- `snow-browser.json`: Chromium/Firefox/WebKit의 지정 상태 검사. 실제 원정 완주와 구분한다.
- `assigned-*.png`: 지정 상태 캡처 8개. `production-*.png`: 자연 진행 production 캡처 6개. 전체 설원 지정 상태 캡처 19개와 production 캡처 46개는 로컬 원본에 보존했다.
- `production-frost-boss.webm`: 같은 production 원본 녹화의 마지막 보스 구간. VP8 스트림을 재인코딩 없이 약 70초로 추출했다. 실제 HP 1 잠금과 마지막 결정 동시 처치를 포함한다. 무음이며 소리 검증 근거가 아니다.
- `snow-runs.json`: 현재 손패 탐색 정책의 실제 Controller 80원정. 완료 0·패배 80·기술 오류 0이며, 사람 승률이나 완주 PASS를 뜻하지 않는다. 검토 시드의 실제 UI 완주는 별도 결과다.
- `evidence-preservation.json`: 테스트가 덮어쓰는 기존 증거 71개를 원래 SHA256으로 복원한 기록. 과거 고정 출력 경로의 캡처를 이번 실행 증거로 인용하지 않는다.

원본 로그·전체 녹화·추가 캡처·실패한 탐색 실험은 ignored 경로 `.local-validation/v06/`에 보존했다. 실제 기기/교사 최종 검수/스피커 청취, 별도의 모든 가이드 문형 production 학습 경로는 NOT RUN이다.
