# 사용 안내

이 ZIP은 진행 중인 0.10.1을 덮어쓰는 새 전체 명세가 아니라, **완료된 작업에 이어 붙이는 UI 후속 인계물**이다.

1. 정상 진행 중인 0.10.1 작업은 강제 중단하지 말고 먼저 완료 결과를 받는다.
2. 같은 개발 대화에 이 ZIP을 첨부하고 `01_FOLLOWUP_PROMPT_KO.md` 또는 START_PROMPT.txt 내용을 입력한다.
3. 아직 미병합이면 같은 작업 브랜치·PR에서 수정한다. 이미 배포됐다면 최신 main에서 다음 패치로 이어간다.
4. 기존 0.10.1의 HP·룬·게임 규칙은 보존한다. 이 ZIP은 실행 코드나 patch 파일이 아니다.
5. 충돌하는 UI 규칙은 02 대체표에서 명시한다. 신규 동명사 룬의 최종 이름은 자수정이다.
6. 캡처의 겉모습만 보지 말고 84개 조건·행 경계·입력·상태 전이까지 검증한다.

## 구성

- `00_START_HERE_KO.txt`: 이 안내.
- `01_FOLLOWUP_PROMPT_KO.md` / `*_START_PROMPT.txt`: 후속 개발 프롬프트.
- `*_Spec.md` / `.txt`: 전체 UI 후속 명세.
- `02_SUPERSESSION_MAP_KO.md`: 이전 계약과의 충돌 해소.
- `03_UI_ACCEPTANCE_KO.md`: 84개 인수 조건.
- `04_TEST_MATRIX_KO.md`: 검증 방법.
- `05_REPORT_TEMPLATE_KO.md`: 아직 실행하지 않은 보고서 양식.
- `data` / `fixtures`: 초기 NOT RUN 상태의 기대 조건.
- `manifest.json` / `verify_package.py`: 파일 무결성과 기대 자료의 내부 일관성 검사.

`python verify_package.py`는 이 패키지의 일관성만 확인한다. 게임 코드·화면·회전·실기기·성능을 검사하는 도구가 아니다.
