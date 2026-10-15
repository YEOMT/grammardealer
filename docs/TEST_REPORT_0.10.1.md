# Syntax Atlas 0.10.1 통합 패치 + UI Followup 실제 결과

기준 main: `f09d4537b3bfa28d2736045944da363c8a04abfc`. 브랜치: `codex/v0.10.1-runes-responsive-gamefeel`. 기존 미커밋0.10.1 구현을 보존해 후속 적용했다. 이전 단계의 실제 검증은 [별도 기록](TEST_REPORT_0.10.1_PRE_FOLLOWUP.md)이며 최종UI의 재실행 결과로 바꾸지 않았다. 원본ZIP/백업/기존증거는 보존했다.

## 구현 결과

- 새 원정 Stage2~5 확정HP19개/골렘260×3, 신규10룬과 획득 규칙 완료. 자수정 `rune.gerund`와 기존 토파즈 `rune.svoo`는 별개다. 확정곱셈과 검증초깃값 가산30/50/70·시각계수는 [룬 검토](RUNE_REVIEW_0.10.1.md)에 구분했다.
- 기존 문법/카드DB·보스·저항·28장·6턴·47전투/STAGE10_END·구버전HP/룬/상점/보상/RNG/저장 경계 유지. 상태커밋은 RunController만 담당한다.
- 공통 카드 폭82px(1650px이상96px), 영문max23px/동일긴단어fit. main의 확장손패82px 소스가 기준이며, 사용자가 정확한px을승인했다고 주장하지 않는다. 기존기본손패는clamp61~100px이었다. [소스근거](validation/v0.10.1/hand-baseline-source.txt).
- 카드 수로 가로폭/영문크기를 바꾸지 않고 실제안쪽폭으로 행수를 계산한다. 1/2/3+행별 세로여백만 압축한다. 조합대페이지/스크롤/숨김 제거. 작은화면 **손패만3장 명시페이지**를 유예하며 카드/선택상태 유지.
- 헤더 좌측브랜드/화면중앙Stage/우측전체화면→로비. PC좌우패널은보존, 낮은가로창만손패우측배치. 사전·도감·내덱·저장 직접버튼 유지.
- 휴대기기 세로방향 안내dialog+capture입력차단, screen방향기반판정, 명시적Fullscreen/landscape lock 및수동회전fallback. 키보드visualViewport를물리회전으로판정하지않는다. 실제mobileAPI는미검증이다.
- HTML안정Fullscreen root, 근거사본내부탄성/누적콤보/등급·레벨/입자상한과기존정산·타이밍을보존했다.

## 최종 코드 실제 검증

Windows / Node24.19.0 / npm11.17.0 / Playwright1.51.1. 기존 `../.local-tools/` 재사용; 의존성업데이트/시스템PATH변경없음. 브라우저는로컬Chromium134 headless이며 실제폰/태블릿이아니다.

| 명령 | 종료코드 | 결과 | 실행ID |
|---|---:|---|---|
| `npm.cmd test` | 0 | PASS | `followup-final-unit` |
| `npm.cmd run validate:data` | 0 | PASS | `followup-final-data` |
| `npm.cmd run build` | 0 | PASS | `followup-final-build` |
| `node tests/v0101-followup-browser.mjs` | 1 | FAIL | `followup-final-browser` |
| `npm.cmd run test:production:0101` | 0 | PASS | `followup-final-production` |

전체단위 **1709 PASS,0 FAIL,0 skip**, 데이터3112검사PASS, buildPASS(500kBchunk경고유지). 집중브라우저 **{'PASS': 18, 'FAIL': 2}**, 캡처6개, pageerror0. FAIL2건의 프로세스종료코드1을그대로유지했다. 나머지독립검사를계속했다. production `/grammardealer/`에서지정43–47전투5개 실제조립/형태/공격/보상/저장,JS/CSS요청을확인했다. **지정상태이며자연47완주가아니다.**

| 가시 viewport | 결과 | 열/행 | 공통 카드폭 | 페이지크기 |
|---|---|---|---:|---|
| 1366x768 | PASS | 11 / 2 | 82 | 1366×768 |
| 1024x650 | PASS | 8 / 2 | 82 | 1024×650 |
| 844x390 | PASS | 6 / 3 | 82 | 844×390 |
| 740x360 | FAIL | 5 / 4 | 82 | 740×378 |
| 667x320 | FAIL | 4 / 4 | 82 | 667×358 |

대표1366×768,1024×650,844×390은최대16조합/14보유손패에서화면안조작PASS(모바일손패3장페이지). 740×360/667×320 최대16장은4행의물리적높이가부족하다. 카드가영역과버튼을침범하므로FAIL이다. 글자를축소하거나페이지로숨기지않았다. 이크기를임의로지원대상에서제외해PASS처리하지않았으며, 최소지원크기는추가제품검토항목이다.

실제 카드I 이동전후폭/글꼴/크기/굵기일치,0/1/8/9/16및행경계,DOM순서,행간pointer드래그/되돌리기,4직접모달,저장후준비/정확복원PASS. 기기정보·screen방향은명시mock으로세로gate·뒤submit차단·기존/새dialog위입력차단·가로복귀동일상태를확인했다. 실제공격중resize는신규과거/진행룬각1회·양수피해·event중복없음을확인했다.

[PC최대배치](validation/v0.10.1/chromium-followup-1366x768.png) · [태블릿](validation/v0.10.1/chromium-followup-1024x650.png) · [모바일가로](validation/v0.10.1/chromium-followup-844x390.png) · [740실패](validation/v0.10.1/chromium-followup-740x360.png) · [667실패](validation/v0.10.1/chromium-followup-667x320.png).

## 이전 단계 검사와 미검증 구분

UI후속전3엔진집중118checks/69captures PASS,실제30공격 PASS(속도1/1.5/2,효과끄기/동작줄이기,잔여timeout/interval/RAF0). [영상](validation/v0.10.1/actual-high-combo-speed1.webm)은그단계의무음14초발췌이며최종레이아웃영상이아니다. 원본전체는로컬보존한다. 공식14스크립트browser/잿불/수로/대서고/별의회랑/구버전production27완주도이전단계PASS. 이번후속은UI집중/production과최종전체단위만재실행했으며, 이미통과한게임규칙검사를브라우저별로반복하지않았다.

자연production seedrun-sequence.57은7전투/17공격후적HP24·턴0으로정책패배(종료1),페이지/콘솔/리소스오류0. 자연Controller6seed도정상패배였다. 자연47전투완주/후반자연준비는NOT RUN. 이전구버전27완주나지정43–47로대체하지않는다. G030원문boy는DB부재로NOT RUN,teacher대체양성은별도검사다.

실물iPad/iPhone/Android·OS키보드·노치·실제방향잠금/주소창·최종전체화면전조합·최종3엔진전수·모든봉인/빙정/폼/행경계조합은NOT RUN. 작은간격/색감/미세글로우는사용자플레이후후속폴리싱으로남긴다. stress최대배치FAIL과단순시각취향을구분한다.

## 계약·테스트 변경 및 인계

[원래130조건](ACCEPTANCE_0.10.1.md), [후속84조건](ACCEPTANCE_0.10.1_UI_FOLLOWUP.md)에실제근거/범위를기록했다. 원래I03/I06/I08의세로·조합대페이지예외는SUPERSEDED. 기존테스트파일/실패/assertion은삭제하지않았다. `test:browser:0101`의이전viewport/페이지기대는이전계약기록이며후속검증명령은 `node tests/v0101-followup-browser.mjs` 이다. FAIL을피하려고그검사를PASS로재기록하지않았다. 과거Work자료/self-check는이번검증근거가아니다.

실행원본은 `.local-validation/v0101/` 및 `.local-validation/v0101-followup/`; 공개선별증거는 `docs/validation/v0.10.1/`. 개인절대경로를제거했다. package/lockfile은root0.10.1버전만변경,의존성동일. workflow와Pages설정/공개사이트는변경하지않았다. [변경목록/보존감사](validation/v0.10.1/change-audit.json).

Draft PR로인계하며main병합/자동병합/배포는수행하지않는다. 사용자검토순서: 새원정실습/스킵→초원/항구룬획득→같은카드손패/조합대비교→긴문장줄바꿈/형태/드래그→사전/도감/저장→전체화면/기기가로회전→콤보연출/효과감소. 후반보스는지정상태증거와자연준비경로를분리하여검토한다.


## 원격 인계 완료

검증한 구현 commit: `ca1391b5148a23cfcd37ef685230305643d1093c`. 브랜치 push 및 [Draft PR #16](https://github.com/YEOMT/grammardealer/pull/16) 생성 완료. 이후 문서 인계 커밋은 소스/테스트/build를 변경하지 않는다. 원격 main은 기준 f09d4537 그대로이며 merge/auto-merge/Pages설정/공개배포는 수행하지 않았다. CI는 GitHub에서 별도로 실행되며 로컬 PASS와 구분한다.
