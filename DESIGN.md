---
name: BuddyBird
description: 반려인의 목소리로 앵무새에게 말을 가르치는 앱의 두껍고 만지고 싶은 장난감 버튼 시스템
colors:
  parrot-red: "#DB030F"
  sunrise-orange: "#ff9600"
  orange-edge: "#e07f00"
  orange-mist: "#FFE8CC"
  orange-selected: "#fff7eb"
  sky-blue: "#1cb0f6"
  blue-edge: "#1899d6"
  blue-mist: "#DDF4FF"
  berry-purple: "#ce82ff"
  purple-edge: "#A85FD6"
  purple-mist: "#F2E1FF"
  sun-yellow: "#FFC800"
  yellow-edge: "#E6A800"
  paper-white: "#ffffff"
  on-accent: "#ffffff"
  ink: "#3c3c3c"
  muted-gray: "#777777"
  hairline-gray: "#e5e5e5"
  cloud-gray: "#f7f7f7"
  disabled-gray: "#AFAFAF"
  disabled-surface: "#EBEBEB"
  alert-red: "#FF4B4B"
  scrim: "#00000066"
  greeting-tint: "#FFF7EB"
  greeting-soft: "#FFF2E0"
  food-tint: "#EDF9FE"
  food-soft: "#E4F6FE"
  name-tint: "#FBF5FF"
  name-soft: "#F9F0FF"
typography:
  display:
    fontFamily: "Pretendard-Black, Pretendard, sans-serif"
    fontSize: "34px"
    fontWeight: 900
    lineHeight: "40px"
  headline:
    fontFamily: "Pretendard-Black, Pretendard, sans-serif"
    fontSize: "26px"
    fontWeight: 900
    lineHeight: "32px"
  title:
    fontFamily: "Pretendard-Black, Pretendard, sans-serif"
    fontSize: "18px"
    fontWeight: 900
    lineHeight: "24px"
  body:
    fontFamily: "Pretendard-Bold, Pretendard, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: "21px"
  label:
    fontFamily: "Pretendard-ExtraBold, Pretendard, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    lineHeight: "22px"
  caption:
    fontFamily: "Pretendard-ExtraBold, Pretendard, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    lineHeight: "16px"
  button:
    fontFamily: "Pretendard-ExtraBold, Pretendard, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    letterSpacing: "0.32px"
  timer:
    fontFamily: "Pretendard-Black, Pretendard, sans-serif"
    fontSize: "22px"
    fontWeight: 900
    fontFeature: "tnum"
  wordmark:
    fontFamily: "Fredoka-SemiBold, Fredoka, sans-serif"
    fontWeight: 600
rounded:
  badge: "12px"
  field: "14px"
  control: "16px"
  card: "18px"
  hero: "20px"
  sheet: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  gutter: "24px"
components:
  button-primary:
    backgroundColor: "{colors.sunrise-orange}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 22px"
    height: "58px"
  button-primary-compact:
    backgroundColor: "{colors.sunrise-orange}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 22px"
    height: "58px"
  button-blue:
    backgroundColor: "{colors.sky-blue}"
    textColor: "{colors.paper-white}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 22px"
    height: "58px"
  button-disabled:
    backgroundColor: "{colors.disabled-surface}"
    textColor: "{colors.disabled-gray}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 22px"
    height: "58px"
  chip:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.muted-gray}"
    rounded: "{rounded.pill}"
    padding: "4px 14px"
    height: "32px"
  chip-selected:
    backgroundColor: "{colors.sunrise-orange}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.pill}"
    padding: "4px 14px"
    height: "32px"
  card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  choice-card-selected:
    backgroundColor: "{colors.orange-selected}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  text-field:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.field}"
    padding: "10px 16px"
    height: "50px"
  tab-selected:
    backgroundColor: "{colors.sunrise-orange}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "8px"
  dialog:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px 20px"
    width: "480px"
---

# Design System: BuddyBird

## Overview

**Creative North Star: "통통 튀는 장난감 버튼"**

버디버드의 화면은 유아용 장난감의 큼직한 버튼처럼 두껍고 단단하다.
눌리는 모든 요소는 2px 테두리와 아래쪽에 깔린 더 진한 색의 엣지로 두께를 드러내고, 누르면 면이 실제로 엣지 위로 내려앉는다.
그림자와 반투명 질감은 없다.
깊이는 색과 형태로만 말한다.

색은 밝은 흰 종이 위에 오렌지가 행동을 이끄는 구조다.
브랜드 레드는 마스코트 버디의 깃털색이며 스플래시와 몇몇 정체성 순간에만 등장한다.
블루와 퍼플은 단어 카테고리와 통계의 보조색이고, 옐로는 세션 완료 축하에만 쓴다.
서체는 한글과 영문 모두 Pretendard이며 굵기가 Bold 아래로 내려가지 않는다.

밀도는 한 손 조작을 전제로 넉넉하다.
버튼 높이 58px, 카드 안쪽 여백 16px, 화면 좌우 여백 24px, 콘텐츠 최대 폭 480px의 단일 컬럼이다.
마스코트 버디가 온보딩과 세션 화면에서 떠다니거나 통통 튀며 앱의 성격을 대신 말한다.

**Key Characteristics:**
- 엣지 기반 두께. 그림자 대신 아래쪽 색 엣지와 2px 테두리
- 오렌지가 모든 주 행동을 담당
- 브랜드 레드는 정체성 순간에만 등장
- 한글과 영문 모두 Pretendard
- continuous 코너와 알약형 칩
- 모든 동작은 시스템 Reduce Motion을 따름

## Colors

밝은 흰 바탕 위에 오렌지가 행동을, 레드가 정체성을, 블루와 퍼플이 분류를 맡는 팔레트다.

### Primary
- **Sunrise Orange** (`{colors.sunrise-orange}`): 주 버튼, 선택된 탭, 선택된 칩, 학습 구간 링, 세션 완료 화면 배경. 화면에서 행동을 요구하는 모든 곳
- **Orange Edge** (`{colors.orange-edge}`): 오렌지 면 아래에 깔리는 엣지와 테두리. 세션 완료 화면의 통계 라벨 글자색
- **Orange Selected** (`{colors.orange-selected}`): 선택된 ChoiceCard의 면. 엣지는 Sunrise Orange
- **Orange Mist** (`{colors.orange-mist}`): 업적 배지와 재생 중 상태 배경처럼 오렌지 계열을 옅게 깔 때
- **Parrot Red** (`{colors.parrot-red}`): 마스코트 깃털색. 스플래시 배경처럼 정체성을 드러내는 순간과 인라인 오류 글자색에 사용

### Secondary
- **Sky Blue** (`{colors.sky-blue}`): 음식 카테고리, 휴식과 스트레스 케어 구간 링, 총 학습시간 통계, blue 버튼
- **Blue Edge** (`{colors.blue-edge}`): 블루 면의 엣지와 테두리
- **Blue Mist** (`{colors.blue-mist}`): 블루 계열 배지 배경

### Tertiary
- **Berry Purple** (`{colors.berry-purple}`): 이름 카테고리, 축하 컨페티
- **Purple Edge** (`{colors.purple-edge}`): 퍼플 면의 엣지
- **Purple Mist** (`{colors.purple-mist}`): 퍼플 계열 옅은 배경
- **Sun Yellow** (`{colors.sun-yellow}`)와 **Yellow Edge** (`{colors.yellow-edge}`): 세션 완료 축하에만 사용

### Neutral
- **Paper White** (`{colors.paper-white}`): 화면 배경, 카드 면, 다이얼로그 면
- **On Accent** (`{colors.on-accent}`): 오렌지, 블루, 레드 면 위의 글자와 아이콘
- **Ink** (`{colors.ink}`): 본문과 제목 글자색
- **Muted Gray** (`{colors.muted-gray}`): 보조 설명, 필드 라벨, 선택되지 않은 탭과 칩 글자, placeholder
- **Hairline Gray** (`{colors.hairline-gray}`): 중립 면의 테두리와 엣지, 진행 트랙, 탭 바 상단선, 링의 바탕 원
- **Cloud Gray** (`{colors.cloud-gray}`): 잠긴 업적 배지, 대기 상태 배경
- **Disabled Gray** (`{colors.disabled-gray}`)와 **Disabled Surface** (`{colors.disabled-surface}`): 비활성 버튼의 글자와 면
- **Alert Red** (`{colors.alert-red}`): 오류 상태의 입력창 테두리와 danger 톤 면
- **Scrim** (`{colors.scrim}`): 다이얼로그 뒤의 어두운 막

### Category tints
카테고리마다 색, 엣지, tint, soft가 한 벌로 묶인다.
인사와 기타는 오렌지, 음식은 블루, 이름은 퍼플이다.
tint는 선택된 단어 카드의 면이고 soft는 선택되지 않은 카드의 머리글자 배지 배경이다.

- 인사와 기타: `{colors.greeting-tint}`, `{colors.greeting-soft}`
- 음식: `{colors.food-tint}`, `{colors.food-soft}`
- 이름: `{colors.name-tint}`, `{colors.name-soft}`

### Named Rules
**The Red Is the Bird Rule.** Parrot Red는 마스코트와 같은 존재다. 버튼, 탭, 카드 강조에 쓰지 않는다. 새 용도를 추가하려면 정체성 순간인지 먼저 묻는다.

**The One Action Color Rule.** 화면에서 행동을 요구하는 요소는 Sunrise Orange만 쓴다. 블루 버튼은 오렌지 버튼과 나란히 놓여 보조 행동임을 드러낼 때만 쓴다.

**The Edge Pair Rule.** 색 있는 면은 항상 면색과 한 단계 진한 엣지색을 짝으로 가진다. 엣지 없는 오렌지 면은 없다.

## Typography

**Display Font:** Pretendard Black
**Body Font:** Pretendard Bold
**Label/Mono Font:** Pretendard ExtraBold. Fredoka SemiBold는 스플래시 워드마크 전용

**Character:** 굵고 또렷하다. 가장 가는 무게가 Bold이고 제목은 Black이다. 한글과 영문 모두 Pretendard로 같은 무게를 낸다.

### Hierarchy
- **Display** (`{typography.display}`): 세션 완료 화면의 축하 제목. 세션 링 안의 단어 제목은 30px Black
- **Headline** (`{typography.headline}`): 화면 제목. Title 컴포넌트의 기본값이며 header 접근성 역할을 가진다
- **Title** (`{typography.title}`): 섹션 제목과 다이얼로그 제목
- **Body** (`{typography.body}`): 모든 본문 텍스트의 기본값. Copy 컴포넌트가 이 값을 가진다
- **Label** (`{typography.label}`): 입력 필드 라벨은 Muted Gray, 말풍선 본문은 Ink, 22px 행간
- **Caption** (`{typography.caption}`): 통계 라벨, 탭 라벨은 11px, 단어 카드 라벨은 12.5px, 칩은 13.5px
- **Button** (`{typography.button}`): 버튼 라벨. 영문은 대문자, 0.32px 자간
- **Timer** (`{typography.timer}`): 세션 카운트다운. 고정폭 숫자
- **Wordmark** (`{typography.wordmark}`): 스플래시의 BuddyBird 워드마크에만 사용

앱은 시스템 글꼴 크기 조정을 끄고 있다.
레이아웃은 고정 크기를 전제로 짜여 있고, 좁은 화면에서는 `adjustsFontSizeToFit`으로 줄인다.

### Named Rules
**The One Face Rule.** UI 텍스트는 언어와 관계없이 Pretendard만 쓴다. 영문이라고 다른 서체로 바꾸지 않는다. 스플래시 워드마크의 Fredoka는 로고이므로 예외다.

**The Bold Floor Rule.** Pretendard Bold보다 가는 무게는 쓰지 않는다. Regular는 로드되어 있으나 본문도 Bold다.

## Layout

단일 컬럼이다.
Screen 컴포넌트가 상단과 좌우 safe area를 잡고, 콘텐츠는 좌우 24px 여백에 최대 폭 480px로 가운데 정렬한다.
상단 여백 20px, 하단은 safe area에 20px을 더한다.
버튼과 폼 요소는 가로를 꽉 채우되 온보딩의 주 버튼은 354px을 넘지 않는다.

- 섹션 간격은 20px, 섹션 제목 아래 10px
- 카드 안쪽 여백 16px, 프로필 카드는 20px, 다이얼로그는 세로 24px 가로 20px
- 가로 배치의 기본 간격은 8px, 나란한 행동 버튼은 12px, 통계 카드는 10px
- 통계와 업적 같은 격자는 `flexBasis` 140에서 160으로 줄바꿈하며 셀은 `flex: 1`과 `minWidth: 0`을 가진다
- 폭 360px 미만에서는 통계 숫자와 아이콘을 한 단계 줄인다
- 탭 바는 상단 2px 선, 위 여백 12px, 아래는 safe area와 30px 중 큰 값이며 각 탭은 최대 68px 정사각형이다
- 다이얼로그는 화면 가운데에 최대 폭 480px로 뜨고 안쪽 항목 간격은 12px, 제목과 본문과 푸터 간격은 20px

## Elevation & Depth

그림자는 없다.
두께는 아래쪽에 깔린 엣지로 표현한다.
Surface 컴포넌트는 면 아래에 `depth`만큼 엣지색 판을 두고, 면에는 같은 색 2px 테두리를 두른다.
누르면 면이 60ms 동안 `depth - 1`만큼 내려가 엣지 위에 앉고, 손을 떼면 같은 시간에 돌아온다.
Reduce Motion이 켜져 있으면 면은 움직이지 않는다.

### Depth vocabulary
- **0**: 평평한 아이콘 버튼, 소셜 로그인 버튼, 비활성 버튼
- **2**: 카드, 칩, 선택되지 않은 ChoiceCard, 단어 카드
- **3**: 선택된 ChoiceCard, 선택된 탭
- **4**: 기본 Surface, 프로필 카드, 컴팩트 버튼
- **7**: 주 버튼

다이얼로그는 Scrim 위에 fade로 뜬다.

### Named Rules
**The Edge Rule.** 두께가 필요하면 엣지를 늘린다. `shadowColor`, `elevation`, 블러는 쓰지 않는다. 최근 로그인 태그에 남은 그림자 값은 확장하지 않는다.

**The Sit Down Rule.** 눌리는 요소는 색을 바꾸지 않고 자리에 앉는다. 눌림 피드백은 위치 변화이며 투명도 변화가 아니다.

## Shapes

모든 모서리는 `borderCurve: continuous`다.
컨트롤은 16px, 카드는 18px, 히어로 영역은 20px, 입력창은 14px이며 칩은 완전한 알약형이다.
세션 완료 화면의 흰 푸터는 위쪽 두 모서리만 28px로 시트처럼 올라온다.

반복되는 형태는 다음과 같다.

- 머리글자 배지: 34px 정사각형에 12px 코너, 카테고리 soft 색
- 라디오: 25px 원, 3px 테두리, 선택 시 오렌지 면에 흰 체크
- 선택 체크: 16px 원이 카드 오른쪽 위 6px 안쪽에 앉는다
- 업적 배지: 46px 정사각형에 9px 코너
- 프로필 사진: 폭 25%, 최대 80px의 원
- 세션 링: 252px 원, 18px 두께, 둥근 끝
- 진행 트랙: 14px 높이에 8px 코너
- 말풍선: 16px 코너, 16px 정사각형 꼬리가 45도 회전해 아래나 왼쪽으로 나온다

## Components

### Buttons
장난감 버튼처럼 두껍고, 누르면 내려앉는다.
- **Shape:** 컨트롤 코너 (`{rounded.control}`), 최소 높이 58px, 컴팩트 42px
- **Primary:** `{components.button-primary}`. 오렌지 면과 Orange Edge 엣지 7, 흰 글자. 아이콘은 26px, 컴팩트 20px
- **Secondary:** `{components.button-secondary}`. 흰 면에 Hairline Gray 2px 테두리와 엣지, Ink 글자
- **Blue:** `{components.button-blue}`. 오렌지 버튼 옆의 보조 행동
- **Disabled / Loading:** `{components.button-disabled}`. 엣지 0, Disabled Surface 면, Disabled Gray 글자. 로딩 중에는 아이콘 자리에 ActivityIndicator
- **Pressed:** 면이 엣지 위로 내려앉는다. 색 변화 없음
- **Icon button:** 48px 정사각형, 기본은 plain 톤에 엣지 0, `round`이면 알약형
- **Social login:** 엣지 0, 1px 테두리, 56px 높이. Google은 흰 면에 `#747775` 테두리, Kakao는 `#FEE500` 면, Apple은 시스템 버튼

### Chips
- **Style:** `{components.chip}`. 알약형, 흰 면에 Hairline Gray 엣지 2, Muted Gray ExtraBold 13.5px 글자
- **State:** 선택되면 `{components.chip-selected}`처럼 톤 색 면에 흰 글자. 톤은 Surface의 색 톤을 따른다

### Cards / Containers
- **Corner Style:** `{rounded.card}`. 단어 카드는 14px, 프로필 카드는 22px
- **Background:** `{components.card}`. 흰 면에 Hairline Gray 테두리. 프로필 카드는 오렌지 면에 흰 글자
- **Shadow Strategy:** 엣지 2. Elevation & Depth 참고
- **Border:** 2px, 엣지와 같은 색
- **Internal Padding:** 16px
- **ChoiceCard:** 단일 선택용 카드. 선택되면 `{components.choice-card-selected}`처럼 Orange Selected 면에 오렌지 엣지 3, 접근성 역할은 radio
- **Word card:** 최소 높이 84px, 머리글자 배지와 12.5px 라벨을 세로로 쌓는다. 선택되면 카테고리 tint 면과 카테고리 색 엣지, 오른쪽 위에 체크 원

### Inputs / Fields
- **Style:** `{components.text-field}`. 2px Hairline Gray 테두리, 14px 코너, 최소 높이 50px, Pretendard Bold 16px
- **Label:** 위에 Muted Gray ExtraBold 16px, 아래 여백 10px
- **Focus:** 별도 처리 없음. 시스템 커서만 보인다
- **Error:** 테두리가 Alert Red로 바뀌고 아래에 Parrot Red 15px 인라인 오류가 10px 간격으로 붙는다. 오류 텍스트는 alert 역할과 assertive live region을 가진다
- **Wheel picker:** 생년월일과 직접 설정 시간에 사용

### Navigation
- **Tab bar:** 흰 바탕, 상단 2px Hairline Gray 선. 각 탭이 정사각형 셀 안에 아이콘 25px과 11px ExtraBold 라벨을 세로로 쌓는다
- **Selected:** `{components.tab-selected}`. 오렌지 면에 엣지 3, 흰 아이콘과 글자
- **Unselected:** plain 톤에 엣지 0, Muted Gray
- **Icons:** iOS는 SF Symbols, Android는 Material Icons를 같은 이름표로 매핑한다. 기본 24px

### Dialog
- `{components.dialog}`. Scrim 위에 fade로 뜨고 가운데 정렬, 18px 코너, 제목은 Title 18px
- 본문은 스크롤되며 푸터에 버튼이 온다

### Mascot
버디는 헤드폰을 쓴 붉은 앵무새다.
온보딩에서 150px로 떠다니고, 세션 링 안에서 90px로 통통 튄다.
float는 1000ms 주기로 높이의 5%, bounce는 800ms 주기로 8%를 오르내리며 좌우 2도 기운다.
Reduce Motion에서는 정지한다.

### Session ring
세션 화면의 중심이다.
252px 원에 18px 두께의 Hairline Gray 바탕 원과, 학습 중에는 오렌지, 휴식과 케어 중에는 블루의 진행 원이 위에서 시계 방향으로 남은 시간에 맞춰 선형으로 줄어든다.
안에는 마스코트, 단어 또는 구간 이름 30px Black, 고정폭 타이머 22px이 세로로 쌓인다.

### Audio waveform
3px 간격의 세로 막대가 소리에 반응한다.
녹음 중에는 80ms, 반복 재생 애니메이션은 200ms 간격으로 높이가 바뀌며 최소 높이는 10%다.
막대 색은 문맥의 액센트를 받는다.

### Speech bubble
카드와 같은 흰 면과 Hairline Gray 테두리에 16px 코너, 안쪽 여백 세로 14px 가로 16px이다.
ExtraBold 16px 글자에 22px 행간이며 꼬리는 아래 또는 왼쪽으로 나온다.

## Do's and Don'ts

### Do:
- **Do** 눌리는 요소는 Surface 계열 컴포넌트로 만든다. 면색과 엣지색을 짝으로 주고 depth로 두께를 정한다
- **Do** 새 색 면을 추가하면 한 단계 진한 엣지색을 함께 정의한다
- **Do** 단일 선택은 ChoiceCard, 다중 필터는 Chip을 쓴다
- **Do** 모든 애니메이션에 `useReducedMotion`을 확인하고 정지 상태를 준비한다
- **Do** 버튼 라벨은 언어와 관계없이 Pretendard ExtraBold를 쓴다. 영문은 대문자
- **Do** 통계와 업적처럼 나란한 카드는 `flex: 1`과 `minWidth: 0`으로 어느 언어에서도 한 줄을 유지한다
- **Do** 오류 메시지는 Parrot Red 인라인 텍스트로 필드 바로 아래에 둔다

### Don't:
- **Don't** 그라데이션을 배경이나 버튼에 쓰지 않는다. 면은 단색이다
- **Don't** 확산 그림자, 블러, 반투명 유리 질감을 쓰지 않는다. 두께는 엣지로만 표현한다
- **Don't** Parrot Red를 버튼, 탭, 카드 강조에 쓰지 않는다
- **Don't** 한 화면에서 오렌지 외의 색으로 주 행동 버튼을 만들지 않는다
- **Don't** 눌림 피드백으로 투명도나 색 변화를 쓰지 않는다. 면이 내려앉는 것이 눌림이다
