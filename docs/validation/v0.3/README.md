# 0.3 검증 자료

이 폴더는 이번 재실행의 선별 증거다. 과거 Work 결과나 첨부 JSON 기대값을 실행 결과로 재사용하지 않았다. [전체 보고서](../../TEST_REPORT_0.3.md)와 [P001–P097 근거](ACCEPTANCE.md)를 먼저 읽는다.

- `production-1366.json`, `production-1024.json`: 실제 production UI 12전투, 초기 로드 이후 오프라인, 실습/상점/보상/골렘 부위별 저장과 완료 재로드. 시드17의 총24실제 공격.
- `actual-*.png`: 1024×768 최종 production 플레이에서 캡처한 실습·입장 예고·골렘·완료 화면.
- `canyon-browser.json`, `assigned-*.png`, `assigned-golem-effects.webm`: 지정 상태 UI와 실제 엔진 결과의 DOM 연출 검사. 카드/HP 시작 상태를 배정한 fixture이며 원정 완주 영상이 아니다. 영상에는 소리가 없다.
- 나머지 `*-browser.json`: 이번 공식 browser 묶음의 실제 보고서. 내부 캡처 목록 전체는 로컬 원본에서 보존하며 여기에는 중복 캡처를 싣지 않았다.
- `deck-validation.json`, `time-runs.json`, `legacy-runs-summary.json`: 덱·자동 명령 원정의 결과. 모든 정상 패배를 포함한다. 사람의 승률을 뜻하지 않는다.
- `performance.json`, `build-manifest.json`, `commands.json`, `preservation.json`: 실제 성능 관측·최종 빌드·종료 코드·과거 증거 보존 확인.
- `version-browser.json`: 같은 프로필의 실제 IndexedDB 2개 슬롯. 지정 카드의 실제 UI/Controller 계산과 버전별 툴팁 검사로, 실제 12전투와 구분한다.

전체 production 녹화와 모든 중간 실패/시드별 명령/중복 캡처는 ignored `.local-validation/v03/`에 남겼다. 1366 전체 영상은 `production-1366-seed17/production-play.webm`, 최종1024 전체 영상은 `production-1024-final/production-play.webm`이다. 공개 폴더에는 약2MB의 골렘 연출 fixture 영상만 선별했다.

물리 기기·브라우저 엔진 교차 검증·교사/학생·실제 스피커 청취는 NOT RUN이다. branch/PR 검토 자료이며 main 병합이나 공개 배포 결과가 아니다.
