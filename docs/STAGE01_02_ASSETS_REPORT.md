# 로비·Stage 1–2 에셋 및 전투 UI 적용

2026-10-29 · 기준 `origin/main` **7f17e9e3d61728d9c70cf483ab6d053b3b542acd** · 브랜치 `codex/stage01-02-assets-ui`. 시작 시 작업 트리는 clean, 이전 PR #23은 main에 병합된 상태였다.

## 변경

- 실제 손패 테두리 아래 간격을 **7px → 9px**로 보정했다. 카드 크기/폰트/페이지는 유지하고 바닥 높이 예산만 2px 늘렸다. safe-area는 한 번만 더하며 기존 버리기 4px 이동은 재가산하지 않았다.
- 로비와 두 지역 입장에는 배경만, 전투에는 고정 상단 무대 배경과 고정 몬스터 슬롯만 연결했다. 12×2/24장, 장수별 카드 배율, 중앙정렬·공격 복사본 FX를 보존한다.
- 7종 idle/hit은 공통 앵커·배율과 원본 비율을 사용한다. 실제 양수 피해의 IMPACT에서만 hit, 생존 시 idle 복귀, 격파는 hit 페이드다. 이미지 실패는 이모지/idle, 배경 실패는 기존 테마로 대체한다. view cleanup/세대 토큰/attack ID가 이전 응답과 중복 피격을 차단한다.
- 전역 AudioManager가 실제 MP3를 decode하여 반복한다. BGM은 기존 SFX master와 독립된 **0.8 × 사용자 조절값** 경로다. 사용자 조절값 기본100%, 기존 프로필에 없으면100%로 읽는다. SFX gain은 그대로다. 음소거·SFX cleanup은 BGM 위치를 초기화하지 않는다.
- 같은 지역의 보상/상점/재렌더/저장은 같은 소스를 유지한다. 새 항구 준비 상점은 초원 곡, 실제 항구 입장에서 항구 곡으로 약1.5초 선형 전환한다. Stage4/8 준비 선택과 구저장 흐름도 표시 맥락 해석에서 구분한다. 미등록 Stage3 이후는 무음이며 URL을 추측하지 않는다.
- 요청 epoch/abort/15초 로드 제한으로 오래된 응답을 무효화한다. 정상1소스, 전환 최대2소스이며 종료한 buffer/source는 해제한다. 게임 정산이나 진행은 이미지/오디오 콜백에 연결하지 않는다.

## 실제 파일 목록

사용자 ZIP에서 **22개 원본 바이트를 그대로** 복사했다. 재인코딩·크롭·업스케일 없음. 입력 SHA-256과 production HTTP 응답 SHA-256이 모두 일치한다. ZIP 자체는 커밋하지 않는다.

| 저장소 경로 (`public/assets/` 아래) | 원본 형식·치수/디코드 길이 |
|---|---|
| `lobby/background.png` | PNG RGB 1672×941 |
| `lobby/bgm.mp3` | ID3/MPEG Layer III · 168.20초 |
| `stages/stage-01/entry.png` | PNG RGB 1672×941 |
| `stages/stage-01/combat.png` | PNG RGB 2172×724 |
| `stages/stage-01/bgm.mp3` | ID3/MPEG Layer III · 144.28초 |
| `stages/stage-01/monsters/01_idle.png`, `01_hit.png` | 풀잎 슬라임 · PNG RGBA 1254×1254 |
| `stages/stage-01/monsters/02_idle.png`, `02_hit.png` | 꽃 달팽이 · PNG RGBA 1254×1254 |
| `stages/stage-01/monsters/03_idle.png`, `03_hit.png` | 초원 수호자 · PNG RGBA 1254×1254 |
| `stages/stage-02/entry.png` | PNG RGB 1672×941 |
| `stages/stage-02/combat.png` | PNG RGB 2172×724 |
| `stages/stage-02/bgm.mp3` | ID3/MPEG Layer III · 160.88초 |
| `stages/stage-02/monsters/04_idle.png`, `04_hit.png` | 선원 갈매기 · PNG RGBA 1254×1254 |
| `stages/stage-02/monsters/05_idle.png`, `05_hit.png` | 짐꾼 게 · PNG RGBA 1536×1024 |
| `stages/stage-02/monsters/06_idle.png`, `06_hit.png` | 항해사 상어 · PNG RGBA 1254×1254 |
| `stages/stage-02/monsters/07_idle.png`, `07_hit.png` | 항구 수문장 · PNG RGBA 1254×1254 |

모든 몬스터 쌍에 alpha가 있으며 쌍별 캔버스 크기가 동일하다. 짐꾼 게는 가로형/최대alpha254인 원본 그대로 표시한다. 음원은 브라우저에서 스테레오로 디코딩했으며 표시된 길이는 실제 디코드 결과다. 루프 구간을 임의로 자르지 않았다.

## 실제 검사 10묶음

| 묶음 | 결과·근거 |
|---|---|
| 1 원본 파일 | PASS · PNG 디코드/alpha/쌍 치수, MP3 헤더·실제 디코드, 22개 배포 해시 일치 |
| 2 로비 | PASS · 기존 조작·설정·시작, 로비 대표 캡처. 배경은 흐름 밖 레이어 |
| 3 입장·전투·7종 | PASS · 실제 14파일 로드 및 enemyId/이름, 두 입장/전투 캡처. 지정 상태 검사 |
| 4 하단·고정 구역 | PASS · 1366×768, 전체화면1920×1080, 1180×820 모두 **9px**, 안전영역0. 손패10/1/0 또는10/0, 빈 행 예약 포함 |
| 5 조합대·공격 | PASS · 0/5/6/9/10/11/12/13/24 경계, 단계별 배율, 외곽 차이0.8 CSSpx 미만. 실제 공격 중130/142/92프레임 비교 |
| 6 피격·격파·0피해 | PASS · 실제 Controller 지정 덱: 생존 피해81→idle, 격파 실제HP감소77→dead, 오류0→idle, 공격 각1회. 자연 승률 자료 아님 |
| 7 BGM 흐름 | PASS · 초원 보상→항구 준비상점→IndexedDB 저장/RESUME_RUN에서 동일 source 시작시각 유지. 항구 입장에서 stage.02로 전환 |
| 8 볼륨·재렌더 | PASS · 실제 AudioParam 0.8000000119(float32의0.8), 음소거0/해제시 위치 유지, rapid 요청≤2소스. 단위 검사에서 늦은 응답·오류 정리도 확인 |
| 9 fallback·저장 | PASS · 이미지 요청 차단 시 이모지/조작 유지, Stage3 요청 후 source0, 실제 IndexedDB 저장/재개, 모달·전체화면. 실기기는 아래 NOT RUN |
| 10 필수·배포 경로 | PASS · `npm.cmd test` **1816 PASS / 0 FAIL / 0 skip**, `npm.cmd run build` 종료0. production `/grammardealer/`에서22개 HTTP200·해시 일치, 실제 새 원정→첫 전투와 하단9px |

집중 명령: `node --test tests/presentation.test.js tests/scene-audio.test.js`에 해당하는 두 파일을 각각 실행(10+4 PASS), `node tests/scene-assets-browser.mjs` 및 `SB_ASSETS_FOCUS=remaining/music` 후속 검사. production은 로컬 `.local-validation/stage-assets/production.mjs`로 검사했다. 마지막 npm test/build는 최종 production 코드에서 각각 한 번 수행했다. 기존 assertion/기대값은 바꾸지 않았다.

초기 집중 검사 FAIL도 보존했다. 생존 fixture의 문장이 첫 적을 이미 처치하여 실제 두 번째 적으로 사례를 옮겼고, 새 검사 도구의 registry 누락/잘못된 RESTORE_RUN 명령을 실제 RESUME_RUN으로 보정했다. gain은 JS double0.8 대신 Web Audio float32 값으로 정확 비교했다. 게임 HP/점수/저장 검증을 완화하지 않았다. 통과한 배치/매핑은 후속 검사에서 반복하지 않았다.

증거는 `.local-validation/stage-assets/`의 `input-assets.json`, `browser/`(매핑·좌표), `browser-final/`(공격), `browser-music-verified/`(음악·저장), `production/`에 보존한다. 필수 로그는 `.local-validation/v0101/stage-assets-final-unit/`, `stage-assets-final-build/`에 있다. 이전 timing/reward 증거는 원본 복원했고 이번 출력은 별도 보관했다.

## 한계·인계

- NOT RUN: 실제 청취/음악적 루프 이음새, 실기기와 안전영역이 있는 기기, 전 브라우저 조합, 자연50전투/대량seed. 일반 정상/격파 공격은 실제 정산을 쓴 지정 덱 검사다. 준비 상점 시작점의 보스 승리는 기존 합성 fixture이며 자연 보스 처치 증거가 아니다.
- 미등록 Stage3 이후는 의도된 무음/기존 테마·이모지다. 원본 곡 끝의 무음·페이드 유무는 청취 후 사용자 피드백으로 조정한다. 기존 500kB 초과 JS 번들 경고가 남는다. 좁은 화면의 기존 가로 정책과 미세 시각 폴리싱은 확대하지 않았다.
- 게임 규칙·HP·문법·룬·보상·골드·50전투·RunState/DB·상점 흐름·lockfile·배포 workflow는 변경하지 않았다. 선택적 프로필 설정 `bgmVolume`만 추가했다.
- 개발 브랜치 push/PR만 수행한다. main 병합·자동 병합·Pages 설정 변경·공개 배포는 하지 않는다.
