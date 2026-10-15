# v0.10.1 근거·결정·미결정 구분

작성일 2026-10-15. 사용자 대화가 이번 기능 범위의 최상위 근거다. 실제 소스는 현재 동작/연결 지점을 확인하기 위해 읽었으며, 전체 실행·성능·문법 파서를 재검증한 것은 아니다. 외부 문서는 브라우저 API와 접근성의 기술적 제약만 참고한다.

## 1. 사용자 최종 결정

- Stage2:200/270/360/750; Stage3:300/320/360/400/780(260×3); Stage4:500/530/570/600/1000; Stage5:640/680/740/800/1300.
- 신규 일반:화석(주석에서변경),석영(월장석에서변경),둘다가산.
- 신규 고급:가넷(5형식),백금(현재완료),라피스(절연결),아쿠아마린(to부정사),토파즈(동명사).
- 신규 희귀:흑요석(수동태),아다만티움(관계절),미스릴(가정법과거). 앞선 해당룬의배율채택;나머지보류.
- 일반/고급은Stage1부터획득후보,희귀는일반전보상제외·보스보상전용·Stage4상점부터후보.
- PC/태블릿/모바일원활한플레이,전체화면옵션,브라우저창으로위아래잘림개선,전투스크롤최소/제거.
- 룬·문법의근거카드탄성흔들림,콤보문구선명화,누적에따른문구/점수글로우/입자강화.
- 등급/레벨에따른룬발동연출차이.
- 실제학생이사전/저장·불러오기로Stage1을클리어했다는관찰. 새감점이나새학습모드는요청하지않음.

## 2. 미결정 부분에 대한 이번 문서의 명시적 기본안

1. 화석/석영의가산량: +30/+50/+70, **검증초깃값**.
2. 기존4형식토파즈와신규동명사토파즈: 독립ID유지,각각부제표기. **최종단독개명안아님**.
3. 희귀의맥락제한은바꾸되숫자194:97:9·상점가격은기존유지. 사용자가새숫자를정하지않았음.
4. Stage4상점은지역Stage4진입상점으로해석. Stage1새상점은추가하지않음.
5. 조기획득과문법해금은분리. 소유만으로문법을자동열지않음.
6. 복합구문룬시너지: 실제과거진행화석+석영,현재완료진행석영+백금,실제if연결라피스; 기본문법배율중복은금지. **이번구현세부계약**.
7. 모바일극소화면의명시적카드페이지/요약표시는가독성을위한예외안. PC/태블릿동시카드식별을기본으로유지.
8. 바운스280ms·글로우/입자/문구px·동시입자상한은실측전시각/성능초깃값.

이 항목을 ‘예전에 사용자가 직접 확정했다’고 보고하지 않는다. 원칙을 바꾸는 조정이 필요하면 명세 대비 차이로 보고한다.

## 3. 실제 저장소 근거

저장소 `YEOMT/grammardealer`, 기준커밋 `f09d4537b3bfa28d2736045944da363c8a04abfc`.

| 키 | 파일 | 직접 확인한 내용 |
|---|---|---|
| S01 | AGENTS.md | 기존소스보존,VanillaJS/Vite,시험/build,단일Controller,병합/배포별도승인 |
| S02 | src/data/runes.js | 기존4형식토파즈ID,수정룬,다이아몬드,버전별정의,3레벨 |
| S03 | src/engine/runes.js | 장착순서ADD/MULTIPLY,사본별기존효과,룬tooltip,기존3→4슬롯 |
| S04 | src/game/shop.js | 상점Stage2/4/6/8/10,룬가격18/24/32 |
| S05 | src/data/libraryPolicy.js |194:97:9등급가중치,0.9확정기존보스HP |
| S06 | src/engine/presentation.js | 확정이벤트재생,550ms문법/220+520ms룬,현재콤보집계 |
| S07 | src/ui/styles.css |100vh/710·730px최소높이/940px최소너비관련제약 |

소스 URL 패턴:
```
https://github.com/YEOMT/grammardealer/blob/f09d4537b3bfa28d2736045944da363c8a04abfc/<파일경로>
```

작업자는 최신checkout의rewards·parser/evidence·storage·render경로도다시확인해야한다. 위표는전체소스감사결과나수정완료목록이아니다. 원격브랜치/PR를생성하지않았으며이번산출물은문서패키지다.

## 4. 공식 외부 기술 문서

브라우저지원은변할수있으므로구현시다시확인한다. 특정iPad/iPhone모든버전에서API가작동한다고단정하지않는다.

**W01 — MDN Fullscreen API / requestFullscreen**
명시적사용자입력에서의요청,비동기성공/실패,실제fullscreen상태와이벤트를참고했다.
```
https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide
https://developer.mozilla.org/en-US/docs/Web/API/Element/fullscreenchange_event
```

**W02 — WebKit / MDN viewport 단위**
small/large/dynamic viewport와기존vh의차이를참고했다.
```
https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length
```

**W03 — MDN VisualViewport**
layoutviewport와실제visibleviewport의차이,키보드/핀치확대상황을참고했다.
```
https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
```

**W04 — W3C WCAG의 모션/섬광 관련 원칙**
장식모션을줄일수있게하고빠른반복섬광을피하는기준으로참고했다. 이문서가게임의WCAG전체적합성을인증하는것은아니다.
```
https://www.w3.org/TR/WCAG21/#animation-from-interactions
https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
```

## 5. 출처가 뒷받침하지 않는 주장

+30/+50/+70이최적가산량이라는실험결과,새룬의실제자연원정승률,모든휴대전화에서전체카드동시표시가능,3%가체감상최적희귀확률,새FX가모든기기에서60fps라는주장은현재근거가없다. 구현후측정할대상이다.
