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
  leaf-green: "#58CC02"
  green-edge: "#58A700"
  green-mist: "#E6F8D4"
  sun-yellow: "#FFC800"
  yellow-edge: "#E6A800"
  paper-white: "#ffffff"
  on-accent: "#ffffff"
  on-brand: "#F7F2EA"
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
  night-ground: "#000000"
  night-surface: "#121212"
  night-text: "#757575"
  night-faint: "#5a5a5a"
  night-track: "#252525"
  night-edge: "#373737"
  night-warn: "#a33030"
  night-learning: "#663c00"
  night-rest: "#0b4662"
  night-sleeping: "#464646"
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
    fontSize: "20px"
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
    height: "64px"
  button-primary-small:
    backgroundColor: "{colors.sunrise-orange}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 22px"
    height: "64px"
  button-blue:
    backgroundColor: "{colors.sky-blue}"
    textColor: "{colors.paper-white}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 22px"
    height: "64px"
  button-disabled:
    backgroundColor: "{colors.disabled-surface}"
    textColor: "{colors.disabled-gray}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 22px"
    height: "64px"
  text-button:
    textColor: "{colors.orange-edge}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "44px"
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
  tag:
    backgroundColor: "{colors.orange-selected}"
    textColor: "{colors.orange-edge}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  tag-blue:
    backgroundColor: "{colors.blue-mist}"
    textColor: "{colors.blue-edge}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  tag-muted:
    backgroundColor: "{colors.cloud-gray}"
    textColor: "{colors.muted-gray}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  count-badge:
    backgroundColor: "{colors.orange-selected}"
    textColor: "{colors.orange-edge}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "24px"
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
  grouped-list:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  list-row:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "8px 14px"
    height: "56px"
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
  offline-banner:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  night-end-button:
    backgroundColor: "{colors.night-ground}"
    textColor: "{colors.night-text}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "64px"
---

# Design System: BuddyBird

## Overview

**Creative North Star: "통통 튀는 장난감 버튼"**

버디버드의 화면은 유아용 장난감의 큼직한 버튼처럼 두껍고 단단하다.
눌리는 모든 요소는 아래쪽에 깔린 더 진한 색의 엣지로 두께를 드러내고, 누르면 면이 실제로 엣지 위로 내려앉는다.
그림자와 반투명 질감은 없다.
깊이는 색과 형태로만 말한다.

색은 밝은 흰 종이 위에 오렌지가 행동을 이끄는 구조다.
브랜드 레드는 마스코트 버디의 깃털색이며 스플래시와 몇몇 정체성 순간에만 등장한다.
블루는 휴식 구간, 퍼플은 축하의 보조색이고, 옐로는 세션 완료 축하에만 쓴다.
학습 완료 화면은 결과 항목마다 그린, 오렌지, 퍼플, 블루 중 한 벌을 준다.
서체는 한글과 영문 모두 Pretendard이며 굵기가 Bold 아래로 내려가지 않는다.

밀도는 한 손 조작을 전제로 넉넉하다.
버튼 높이 64px, 카드 안쪽 여백 16px, 화면 좌우 여백 24px, 콘텐츠 최대 폭 480px의 단일 컬럼이다.
주인공은 사용자의 앵무새다.
마스코트 버디는 로그인, 권한 안내, 학습 완료처럼 앱이 사용자에게 말을 거는 순간에만 나온다.

새장 앞에 두는 기기의 화면과 새를 비추는 실시간 영상 화면만 예외다.
세션 진행, 카메라 설치, 실시간 영상 화면은 가로 방향의 검은 바탕에 아주 어두운 글자와 선만 쓴다.
같은 엣지 구조와 Pretendard를 유지하되 밝기를 낮춰 새를 자극하지 않는다.

**Key Characteristics:**
- 엣지 기반 두께. 그림자 대신 아래쪽 색 엣지를 쓰고, 2px 테두리는 흰 면과 고른 ChoiceCard에만 보인다
- 오렌지가 모든 주 행동을 담당
- 브랜드 레드는 정체성 순간에만 등장
- 한글과 영문 모두 Pretendard
- continuous 코너와 알약형 칩과 태그
- 새장 앞 화면은 검은 바탕의 밤 팔레트
- 폭을 채우지 않는 버튼은 오른손 엄지가 닿는 행 오른쪽 끝
- 모든 동작은 시스템 Reduce Motion을 따름

## Colors

밝은 흰 바탕 위에 오렌지가 행동을, 레드가 정체성을, 블루가 휴식 구간을 맡는 팔레트다.
새장 앞 화면에는 같은 색을 어둡게 누른 밤 팔레트가 따로 있다.

### Primary
- **Sunrise Orange** (`{colors.sunrise-orange}`): 주 버튼, 선택된 탭, 선택된 칩, 체크된 CheckRow, 학습 구간, 따라 한 소리 표식, 학습 완료 화면의 재생 횟수 항목. 화면에서 행동을 요구하는 모든 곳
- **Orange Edge** (`{colors.orange-edge}`): 오렌지 면 아래에 깔리는 엣지. 오렌지 톤 Tag와 CountBadge의 글자, TextButton 글자, 필수 항목 caption
- **Orange Selected** (`{colors.orange-selected}`): 선택된 ChoiceCard의 면, 오렌지 톤 Tag와 CountBadge의 면, 강조된 소리 행의 면, 일러스트 자리의 바탕, 선택된 재생 횟수 칩의 면
- **Orange Mist** (`{colors.orange-mist}`): 재생 중 상태 배경처럼 오렌지 계열을 옅게 깔 때
- **Parrot Red** (`{colors.parrot-red}`): 마스코트 깃털색. 스플래시 배경과 로그인 화면 바탕처럼 정체성을 드러내는 순간과 인라인 오류 글자색에 사용

### Secondary
- **Sky Blue** (`{colors.sky-blue}`): 휴식과 스트레스 케어 구간, 학습 완료 화면의 전체 누적 학습 시간 항목. blue 버튼 변형은 코드에 남아 있으나 v2 화면은 쓰지 않는다
- **Blue Edge** (`{colors.blue-edge}`): 블루 면의 엣지와 테두리, 블루 톤 Tag 글자
- **Blue Mist** (`{colors.blue-mist}`): 블루 톤 Tag 면, 선택된 전체 누적 시간 칩의 면

### Tertiary
- **Berry Purple** (`{colors.berry-purple}`): 축하 컨페티, 학습 완료 화면의 한 단어 누적 학습 시간 항목
- **Purple Edge** (`{colors.purple-edge}`): 퍼플 면의 엣지
- **Purple Mist** (`{colors.purple-mist}`): 선택된 단어 누적 시간 칩의 면
- **Leaf Green** (`{colors.leaf-green}`): 학습 완료 화면의 함께한 시간 항목
- **Green Edge** (`{colors.green-edge}`): 그린 면의 엣지
- **Green Mist** (`{colors.green-mist}`): 선택된 함께한 시간 칩의 면
- **Sun Yellow** (`{colors.sun-yellow}`)와 **Yellow Edge** (`{colors.yellow-edge}`): 세션 완료 축하에만 사용

### Neutral
- **Paper White** (`{colors.paper-white}`): 화면 배경, 카드 면, 다이얼로그 면, GroupedList 면
- **On Accent** (`{colors.on-accent}`): 오렌지, 블루, 레드, Ink 면 위의 글자와 아이콘
- **On Brand** (`{colors.on-brand}`): 스플래시와 로그인 화면의 Parrot Red 바탕 위 워드마크, 소개 문구, 건너뛰기와 뒤로 버튼. `onBrand` variant가 이 색을 쓴다
- **Ink** (`{colors.ink}`): 본문과 제목 글자색, 부재중 띠의 시각 글자와 커서, 오프라인 배너 면
- **Muted Gray** (`{colors.muted-gray}`): 보조 설명, 필드 라벨, 선택 항목 caption, 행 아이콘, 선택되지 않은 탭과 칩 글자, placeholder
- **Hairline Gray** (`{colors.hairline-gray}`): 중립 면의 테두리와 엣지, 목록 행 사이 2px 구분선, 부재중 띠의 활동 선, 꺼진 점, 탭 바 상단선
- **Cloud Gray** (`{colors.cloud-gray}`): 회색 톤 Tag와 CountBadge 면, 부재중 띠의 빈 막대, Skeleton과 Preparing 면, 사진 없는 앵무새 자리
- **Disabled Gray** (`{colors.disabled-gray}`)와 **Disabled Surface** (`{colors.disabled-surface}`): 비활성 버튼과 체크의 글자와 면. Disabled Gray는 수면 구간과 따라 하지 않은 소리 표식, 행 끝의 forward 화살표에도 쓴다
- **Alert Red** (`{colors.alert-red}`): 오류 상태의 입력창 테두리, danger 톤 면, 응급 표식, DotBadge, 읽지 않은 알림 수
- **Scrim** (`{colors.scrim}`): 다이얼로그 뒤의 어두운 막

### Night
새장 앞 화면 전용이다.
세션 진행, 카메라 설치, 실시간 영상 화면이 여기에 속한다.
`night.ts`가 낮 팔레트 값에 배율을 곱해 만든다.

- **Night Ground** (`{colors.night-ground}`): 화면 바탕과 종료 버튼 면
- **Night Surface** (`{colors.night-surface}`): 카메라 설치 화면의 안쪽 면
- **Night Text** (`{colors.night-text}`): 단어, 경과 시간, 링 안 글자, 종료 버튼 글자. 검은 바탕 대비 약 4.5:1
- **Night Faint** (`{colors.night-faint}`): 작은 라벨과 상태 아이콘. 검은 바탕 대비 약 3:1
- **Night Warn** (`{colors.night-warn}`): 끊긴 네트워크, 꺼진 마이크와 카메라 아이콘. 검은 바탕 대비 약 3:1
- **Night Edge** (`{colors.night-edge}`): 종료 버튼의 엣지와 테두리
- **Night Track** (`{colors.night-track}`): 지평선 링의 바탕 호
- **Night Learning**, **Night Rest**, **Night Sleeping** (`{colors.night-learning}`, `{colors.night-rest}`, `{colors.night-sleeping}`): 지평선 링의 진행 호. 구간색을 40%로 누른 값이며 대비가 3:1보다 낮으므로 구간 이름을 항상 글자로 함께 쓴다

### Category tints
카테고리마다 색, 엣지, tint, soft가 한 벌로 묶인다.
인사와 기타는 오렌지, 음식은 블루, 이름은 퍼플이다.
테마에 남아 있으나 v2 화면은 카테고리 색을 쓰지 않는다.

- 인사와 기타: `{colors.greeting-tint}`, `{colors.greeting-soft}`
- 음식: `{colors.food-tint}`, `{colors.food-soft}`
- 이름: `{colors.name-tint}`, `{colors.name-soft}`

### Phase colors
세션 구간은 어디서나 같은 색을 가진다.
학습은 Sunrise Orange, 휴식과 스트레스 케어는 Sky Blue, 수면은 Disabled Gray다.
Tag에서는 각각 오렌지, 블루, 회색 톤이고 새장 앞 화면에서는 Night 진행 호 색이다.

### Metric colors
학습 완료 화면은 결과 항목마다 면색, 엣지색, 옅은 면색 한 벌을 준다.
함께한 시간은 Leaf Green, 재생 횟수는 Sunrise Orange, 한 단어의 누적 학습 시간은 Berry Purple, 모든 단어의 누적 학습 시간은 Sky Blue다.
말풍선의 숫자 상자와 날아가는 숫자는 면색과 엣지색을, 선택된 결과 칩은 옅은 면색과 면색 테두리를 쓴다.

### Named Rules
**The Red Is the Bird Rule.** Parrot Red는 마스코트와 같은 존재다. 버튼, 탭, 카드 강조에 쓰지 않는다. 바탕 전체에 쓰는 곳은 스플래시와 로그인 화면뿐이다. 새 용도를 추가하려면 정체성 순간인지 먼저 묻는다.

**The One Action Color Rule.** 화면에서 행동을 요구하는 요소는 Sunrise Orange만 쓴다. 블루 버튼은 오렌지 버튼과 나란히 놓여 보조 행동임을 드러낼 때만 쓴다.

**The Edge Pair Rule.** 색 있는 면은 항상 면색과 한 단계 진한 엣지색을 짝으로 가진다. 엣지 없는 오렌지 면은 없다.

**The Night Station Rule.** 새장 앞 화면은 Night 토큰만 쓴다. 흰 면, 낮 팔레트의 밝은 색, 마스코트를 두지 않는다. 글자는 검은 바탕 대비 약 4.5:1, 라벨과 아이콘은 약 3:1로 맞추고 그보다 밝게 올리지 않는다.

## Typography

**Display Font:** Pretendard Black
**Body Font:** Pretendard Bold
**Label/Mono Font:** Pretendard ExtraBold. Fredoka SemiBold는 스플래시 워드마크 전용

**Character:** 굵고 또렷하다. 가장 가는 무게가 Bold이고 제목은 Black이다. 한글과 영문 모두 Pretendard로 같은 무게를 낸다.

### Hierarchy
- **Display** (`{typography.display}`): 리포트의 총 시간, 학습 완료 화면 제목
- **Headline** (`{typography.headline}`): 화면 제목. Title 컴포넌트의 기본값이며 header 접근성 역할을 가진다. ScreenHeader의 기본 제목은 20px 26px 행간으로 줄이고 `large`일 때만 26px이다
- **Title** (`{typography.title}`): 섹션 제목, GroupedList 제목, 다이얼로그 제목, 단어 카드 이름
- **Body** (`{typography.body}`): 모든 본문 텍스트의 기본값. Copy 컴포넌트가 이 값을 가진다
- **Label** (`{typography.label}`): 입력 필드 라벨은 Muted Gray, 말풍선 본문과 목록 행 제목과 빈 상태 문구는 Ink, 22px 행간
- **Caption** (`{typography.caption}`): 목록 행의 caption과 탭 라벨은 11px. Tag, 부재중 띠의 시각과 범례, 새장 앞 화면 라벨은 13px, CountBadge와 단어 카드 태그는 12.5px, 칩은 13.5px
- **Button** (`{typography.button}`): 버튼 라벨. 영문은 대문자, 0.32px 자간. `size="small"` 버튼은 16px, TextButton은 15px
- **Timer** (`{typography.timer}`): 세션 경과 시간. 고정폭 숫자. 소리 행의 시각은 14px 고정폭
- **Wordmark** (`{typography.wordmark}`): 스플래시와 로그인 화면의 BuddyBird 워드마크에만 사용. 로그인 화면에서는 40px 48px 행간

세션 진행 화면의 구간 이름은 34px Black 40px 행간이다. 링 안의 세션 시간은 34px Black 고정폭이고 그 위에 15px ExtraBold 라벨이 붙는다.

앱은 시스템 글꼴 크기 조정을 끄고 있다.
레이아웃은 고정 크기를 전제로 짜여 있고, 좁은 화면에서는 `adjustsFontSizeToFit`으로 줄인다.

### Named Rules
**The One Face Rule.** UI 텍스트는 언어와 관계없이 Pretendard만 쓴다. 영문이라고 다른 서체로 바꾸지 않는다. 스플래시 워드마크의 Fredoka는 로고이므로 예외다.

**The Bold Floor Rule.** Pretendard Bold보다 가는 무게는 쓰지 않는다. Regular는 로드되어 있으나 본문도 Bold다.

## Layout

단일 컬럼이다.
Screen 컴포넌트가 상단과 좌우 safe area를 잡고, 콘텐츠는 좌우 24px 여백에 최대 폭 480px로 가운데 정렬한다.
상단 여백 20px, 하단은 safe area에 20px을 더한다.
Screen의 스크롤은 `alwaysBounceVertical={false}`라서 내용이 화면보다 짧으면 튕기지 않는다.
버튼과 폼 요소는 가로를 꽉 채우고, 폭을 채우는 주 버튼은 화면 맨 아래에 둔다.

- ScreenHeader는 최소 높이 48px 한 줄이다. 뒤로 또는 닫기 버튼이 왼쪽, 제목이 남은 폭을 차지하고, 보조 행동과 도움말 버튼이 오른쪽에 모인다
- 도움말 버튼을 누르면 헤더 아래 오른쪽에 말풍선이 열린다
- 섹션 간격은 20px, 섹션 제목 아래 10px
- 카드 안쪽 여백 16px, 다이얼로그는 세로 24px 가로 20px
- 가로 배치의 기본 간격은 8px, 나란한 행동 버튼은 12px
- 나란한 카드는 셀마다 `flex: 1`과 `minWidth: 0`을 가진다
- 탭 바는 상단 2px 선, 아래는 safe area와 30px 중 큰 값이다. 탭은 홈, 단어, 리포트, 기록, 프로필 다섯 개다
- 다이얼로그는 화면 가운데에 최대 폭 480px로 뜨고 안쪽 항목 간격은 12px, 제목과 본문과 푸터 간격은 20px이다. 푸터의 두 버튼은 같은 폭으로 나란히 놓이고 확인이 오른쪽이다
- 오프라인 배너는 상단 safe area 4px 아래, 좌우 16px 안쪽에 떠 있다

새장 앞 화면은 가로 방향이다.
세션 진행 화면은 좌우 24px 여백에 왼쪽 위 안내 문구, 오른쪽 위 배터리 잔량을 둔다.
세로 방향에서는 화면 가운데에 구간 이름, 아래에 지평선 링과 링 폭의 종료 버튼을 둔다. 링 폭은 좌우 여백 안쪽 폭이고 최대 460px이다.
가로 방향에서는 화면을 좌우 반으로 나눈다. 왼쪽 가운데에 지름 240px 원형 링, 가운데에 높이의 절반인 2px 구분선, 오른쪽 가운데에 구간 이름, 오른쪽 아래에 폭을 채운 종료 버튼을 둔다.
종료 버튼은 높이 64px, 깊이 6이다.

학습 완료 화면은 기기 방향을 따른다.
세로 방향에서는 제목과 말풍선, 140px 버디를 위 16px 여백과 40px 간격으로 남은 높이 가운데에 모으고, 그 아래 16px 간격으로 결과 칩 격자를 둔다. 두 버튼은 화면 아래 footer에 놓인다.
가로 방향에서는 좌우 24px, 위 20px 여백에 두 열을 32px 간격으로 둔다. 왼쪽 280px 열의 세로 가운데에 말풍선과 96px 버디, 오른쪽 열 아래쪽에 제목과 결과 칩을 12px 간격으로 두고 그 아래 16px 간격으로 두 버튼을 둔다.
결과 칩 격자는 8px 간격이고 칩마다 40% 기준 폭에서 늘어나 한 줄에 둘씩 놓인다.

### Named Rules
**The Right Thumb Rule.** 폭을 채우지 않는 버튼과 아이콘 버튼은 행의 오른쪽 끝에 둔다. 오른손 엄지가 닿는 자리다. 뒤로 버튼만 왼쪽에 남고, 폭을 채우는 주 버튼은 아래에 둔다.

## Elevation & Depth

그림자는 없다.
두께는 아래쪽에 깔린 엣지로 표현한다.
Surface 컴포넌트는 면 아래에 `depth`만큼 엣지색 판을 두고, 면에 2px 테두리를 두른다.
흰 면과 고른 ChoiceCard는 테두리가 엣지와 같은 색으로 보이고, 오렌지 면과 비활성 면은 테두리가 면과 같은 색이라 보이지 않는다.
그래서 오렌지 버튼, 고른 칩, 고른 탭은 아래 두께만 드러나고, 흰 카드, secondary 버튼, 고른 ChoiceCard는 테두리를 가진다.
누르면 면이 60ms 동안 `depth - 1`만큼 내려가 엣지 위에 앉고, 손을 떼면 같은 시간에 돌아온다.
Reduce Motion이 켜져 있으면 면은 움직이지 않는다.

### Depth vocabulary
- **0**: 평평한 아이콘 버튼, TextButton, 목록 행, 소리 행, 부재중 띠 표식, 소셜 로그인 버튼, 비활성 버튼
- **2**: 카드, 칩, 학습 완료 결과 칩, 단어 카드, 앵무새 카드, 홈 상태 줄, 응급 카드
- **4**: 기본 Surface, 주 버튼, `size="small"` 버튼, 선택 여부와 관계없이 ChoiceCard
- **6**: 세션 진행 화면의 종료 버튼, 다이얼로그 안의 버튼
- **8**: 홈 화면의 학습 시작 버튼, 선택된 탭

Tag, CountBadge, 일러스트 자리, 오프라인 배너는 엣지 판이 없다.
누를 수 없는 표시 요소이기 때문이다.
Tag와 CountBadge는 2px 테두리만 가진다.

다이얼로그는 Scrim 위에 fade로 뜬다.

### Named Rules
**The Edge Rule.** 두께가 필요하면 엣지를 늘린다. `shadowColor`, `elevation`, 블러는 쓰지 않는다.

**The Sit Down Rule.** 눌리는 요소는 색을 바꾸지 않고 자리에 앉는다. 눌림 피드백은 위치 변화이며 투명도 변화가 아니다.

**The Flat Label Rule.** 누를 수 없는 태그와 배지에는 엣지 판을 주지 않는다. 두께는 누를 수 있다는 신호다.

## Shapes

모든 모서리는 `borderCurve: continuous`다.
컨트롤은 16px, 카드는 18px, 히어로 영역은 20px, 입력창은 14px이며 칩과 Tag와 CountBadge는 완전한 알약형이다.

반복되는 형태는 다음과 같다.

- 체크: CheckRow 오른쪽 끝의 28px 원, 3px Hairline Gray 테두리. 체크되면 테두리 없는 오렌지 면에 흰 16px 체크, 비활성이면 Disabled Surface로 채운다
- 목록 그룹: 18px 코너, 2px Hairline Gray 테두리 안에 행을 쌓고 행 사이를 2px 선으로 나눈다
- 프로필 사진: 폭 40%, 최대 110px의 원
- 앵무새 사진: 카드 안쪽 10px 여백에 16px 코너
- 지평선 링: 위쪽 반원, 16px 두께, 둥근 끝
- 부재중 띠 막대: 24px 높이에 8px 코너
- 부재중 띠 표식: 12px 원, 응급은 16px 원에 흰 2px 테두리, 누르는 자리는 28px
- 유사도 점: 7px 원 세 개, 3px 간격
- 페이지 점: 8px 원, 4px 간격, 현재 페이지는 20px 폭의 알약
- DotBadge: 8px Alert Red 원
- 말풍선: 16px 코너, 16px 정사각형 꼬리가 45도 회전해 아래나 왼쪽으로 나온다
- 컨페티 조각: 8px 폭 12px 높이, 아래쪽 4px 엣지
- 숫자 상자: 세로 방향 12px 코너, 가로 방향 8px 코너, 채워지는 면은 아래쪽 4px 엣지

## Components

### Buttons
장난감 버튼처럼 두껍고, 누르면 내려앉는다.
- **Shape:** 컨트롤 코너 (`{rounded.control}`), 최소 높이는 `size="medium"` 64px, `size="small"` 52px
- **Primary:** `{components.button-primary}`. 테두리 없는 오렌지 면과 Orange Edge 엣지 4, 흰 글자. 다이얼로그 안의 버튼은 엣지 6, 홈 화면의 학습 시작 버튼은 엣지 8이다. 아이콘은 `size="medium"` 26px, `size="small"` 20px
- **Secondary:** `{components.button-secondary}`. 흰 면에 Hairline Gray 2px 테두리와 엣지, Ink 글자
- **Blue:** `{components.button-blue}`. 오렌지 버튼 옆의 보조 행동
- **Disabled / Loading:** `{components.button-disabled}`. 엣지 0, Disabled Surface 면, Disabled Gray 글자. 로딩 중에는 아이콘 자리에 ActivityIndicator
- **Pressed:** 면이 엣지 위로 내려앉는다. 색 변화 없음
- **Icon button:** 48px 정사각형이고 기본은 plain 톤에 엣지 0이다. primary는 엣지 4인 오렌지 원이며 `shape="square"`를 넘기면 컨트롤 코너의 네모가 된다. 단어 목록의 단어 추가 버튼이 네모를 쓴다. 목록과 카드 안의 재생 버튼은 44px 오렌지 원에 흰 아이콘
- **TextButton:** `{components.text-button}`. 테두리와 엣지 없이 Orange Edge ExtraBold 15px 글자만 보인다. 건너뛰기처럼 약한 행동은 Muted Gray
- **Social login:** 엣지 0, 1px 테두리, 56px 높이. Google은 흰 면에 `#747775` 테두리, Kakao는 `#FEE500` 면, Apple은 시스템 버튼

### PressableSurface
눌리는 모든 요소의 바탕이다.
`onPress`는 눌린 지점의 좌표를 받는다.
부재중 띠는 이 좌표로 누른 시각을 계산한다.
`onLongPress`를 주면 500ms 길게 누르기가 탭보다 먼저 판정되고, 스크린 리더에는 longpress 동작이 추가된다.
소리 행은 길게 눌러 녹음을 공유한다.

### Chips
- **Style:** `{components.chip}`. 알약형, 흰 면에 Hairline Gray 엣지 2, Muted Gray ExtraBold 13.5px 글자
- **State:** 선택되면 `{components.chip-selected}`처럼 톤 색 면에 흰 글자. 톤은 Surface의 색 톤을 따른다

### Tags and badges
누를 수 없는 상태 표시다.
- **Tag:** `{components.tag}`, `{components.tag-blue}`, `{components.tag-muted}`. 알약형, 옅은 면에 진한 2px 테두리와 더 진한 ExtraBold 13px 글자, 한 줄로 자른다. 구간 상태와 분석 중 표시에 쓴다
- **CountBadge:** `{components.count-badge}`. 높이 24px, 최소 폭 26px 알약에 고정폭 숫자와 13px 아이콘. 연속 일수는 오렌지 톤, 읽지 않은 알림 수는 Alert Red 면에 흰 글자
- **DotBadge:** 새 항목을 알리는 8px Alert Red 점
- **PageDots:** 페이지가 둘 이상일 때만 보인다. 꺼진 점은 Hairline Gray, 현재 점은 오렌지이며 폭과 색이 250ms 동안 바뀐다. Reduce Motion에서는 바로 바뀐다

### Cards / Containers
- **Corner Style:** `{rounded.card}`
- **Background:** `{components.card}`. 흰 면에 Hairline Gray 테두리
- **Shadow Strategy:** 엣지 2. Elevation & Depth 참고
- **Border:** 2px, 엣지와 같은 색
- **Internal Padding:** 16px
- **ChoiceCard:** 단일 선택용 카드. 선택되면 `{components.choice-card-selected}`처럼 Orange Selected 면에 오렌지 엣지 4, 접근성 역할은 radio. 선택되지 않아도 엣지 4다
- **Word card:** 최소 높이 84px에 이름 18px Black 한 줄만 온다. 삭제 버튼과 재생 버튼은 카드 오른쪽 끝에 붙는다
- **Parrot card:** 홈의 주인공이다. 남은 세로 공간을 모두 차지하며 사진이 카드를 채우고 아래에 이름 22px과 종, 나이가 온다. 사진이 없으면 Cloud Gray 자리에 40px 사진 아이콘과 사진 추가 문구를 보인다

### Lists
설정과 동의 화면의 기본 틀이다.
- **GroupedList:** `{components.grouped-list}`. 위에 Title 18px 제목, 아래에 2px 테두리 18px 코너 상자
- **Row:** `{components.list-row}`. 최소 높이 56px, 22px Muted Gray 아이콘, Label 제목과 13px Muted Gray 설명을 쌓는다
- **NavRow:** 오른쪽 끝에 값과 Disabled Gray forward 화살표. 새 항목이 있으면 DotBadge
- **SwitchRow:** 오른쪽 끝에 시스템 Switch. 켜지면 오렌지 트랙, 저장 중에는 오렌지 ActivityIndicator
- **CheckRow:** caption, 제목, 설명 순으로 쌓고 오른쪽 끝에 28px 원형 체크를 둔다. caption은 12px ExtraBold로 제목 위에 오며 필수 항목은 Orange Edge, 선택 항목은 Muted Gray다. 접근성 역할은 checkbox

### Inputs / Fields
- **Style:** `{components.text-field}`. 2px Hairline Gray 테두리, 14px 코너, 최소 높이 50px, Pretendard Bold 16px
- **Label:** 위에 Muted Gray ExtraBold 16px, 아래 여백 10px
- **Focus:** 별도 처리 없음. 시스템 커서만 보인다
- **Error:** 테두리가 Alert Red로 바뀌고 아래에 Parrot Red 15px 인라인 오류가 10px 간격으로 붙는다. 오류 텍스트는 alert 역할과 assertive live region을 가진다
- **Wheel picker:** 생년월일과 수면 시간에 사용

### Navigation
- **Tab bar:** 흰 바탕, 상단 2px Hairline Gray 선. 각 탭이 정사각형 셀 안에 아이콘 25px과 11px ExtraBold 라벨을 세로로 쌓는다
- **Selected:** `{components.tab-selected}`. 오렌지 면에 엣지 8, 흰 아이콘과 글자
- **Unselected:** plain 톤에 엣지 0, Muted Gray
- **Icons:** iOS는 SF Symbols, Android는 Material Icons를 같은 이름표로 매핑한다. 기본 24px
- **ScreenHeader:** Layout의 헤더 배치를 따른다. 도움말이 열리면 도움말 아이콘이 오렌지로 바뀐다

### Screen states
- **EmptyState:** 가운데 정렬, 선택적 일러스트, Label 16px Ink 문구, 폭을 채우는 주 버튼
- **ScreenError:** 32px Muted Gray 경고 아이콘, 문구, 오른쪽 끝의 `size="small"` secondary 다시 시도 버튼. polite live region
- **Skeleton:** Cloud Gray 18px 코너 막대를 10px 간격으로 쌓는다. 움직이지 않는다
- **Preparing:** Cloud Gray 카드 안의 14px Muted Gray 준비 중 문구
- **OfflineBanner:** `{components.offline-banner}`. 연결이 끊기면 위에 떠서 흰 18px 아이콘과 13.5px 문구를 보인다. 터치를 막지 않는다

### Dialog
- `{components.dialog}`. Scrim 위에 fade로 뜨고 가운데 정렬, 18px 코너, 제목은 Title 18px
- 본문은 스크롤되며 푸터에 깊이 6인 버튼이 온다
- **ConfirmDialog:** 취소는 secondary, 확인은 primary이고 두 버튼 모두 `size="small"`이다. 처리 중에는 닫히지 않고 확인 버튼이 로딩을 보이며 실패하면 인라인 오류가 붙는다
- **PermissionDialog:** 88px 마스코트와 권한이 필요한 이유를 가운데 보이고 닫기와 설정 열기 버튼을 둔다

### Mascot
버디는 헤드폰을 쓴 붉은 앵무새다.
권한 안내 다이얼로그와 학습 종료 다이얼로그 88px, 로그인 92px, 학습 완료 화면 세로 140px와 가로 96px에서 1000ms 주기로 높이의 5%를 오르내리며 좌우 2도 기운다.
로그인에서는 왼쪽 꼬리 말풍선이 옆에 붙는다.
학습 완료 화면에서는 아래 꼬리 말풍선 밑에 서고, 숫자 상자가 다 차면 크기의 12%만큼 180ms 동안 뛰어올랐다가 270ms 동안 내려온다.
빨간 바탕에 몸이 묻히지 않도록 버디는 항상 흰 면 위에 둔다.
홈에서는 상단 바의 34px 정지 이미지로만 나오고 본문은 앵무새 카드가 차지한다.
세션 진행 화면에서는 학습 종료 다이얼로그에만 나온다.
Reduce Motion에서는 정지한다.

### Login stage
스플래시가 끝난 뒤 이어지는 로그인 화면이다.
위쪽은 Parrot Red 바탕에 On Brand 워드마크와 16px ExtraBold 소개 문구를 두고, 아래쪽은 위 모서리 28px의 흰 시트에 버디와 말풍선, 소셜 로그인 버튼을 둔다.
최근 로그인 표시는 그림자 없는 Ink 면의 알약 태그다.
- **첫 등장:** 스플래시가 사라지는 동안에는 빨간 바탕만 보인다. 스플래시가 끝나면 버디가 있는 시트가 700ms 동안 올라오고 워드마크, 소개 문구, 말풍선, 헤더가 차례로 나타난다. 버디는 따로 튀어나오지 않고 시트와 함께 올라온다. 프로필에서 들어오면 등장 움직임 없이 완성된 화면을 보인다
- **떠오르는 단어:** 가르칠 예시 단어 다섯 개가 흰 알약 말풍선으로 1.2초 간격으로 시트 뒤에서 떠올라 6초 동안 흘러가며 사라지고 반복한다. 처음에 빠르게 오르다 천천히 흘러가는 감속 곡선을 쓴다. 떠오르는 높이는 소개 문구 아래 빈 높이에 맞추고 최대 200px이며, 빈 높이가 64px보다 작으면 단어를 띄우지 않는다. 가로 위치는 단어 영역 폭에서 단어 폭을 뺀 거리의 비율로 정해서 어느 화면 폭에서도 단어가 밖으로 나가지 않는다. 화면이 보이지 않거나, 앱이 백그라운드에 있거나, 로그인 중이면 멈춘다
- **로그인 중:** 버튼 자리를 같은 높이의 오렌지 ActivityIndicator와 진행 문구로 바꾼다. 빨간 바탕과 버디는 그대로 남는다
- **Reduce Motion:** 단어 세 개가 멈춘 채로 보이고 등장 움직임은 없다. 멈춘 단어는 왼쪽, 가운데 위, 오른쪽에 -4도, 3도, -2도로 기울어 놓인다

### Horizon ring
새장 앞 세션 진행 화면의 중심이다.
위쪽 반원 호가 16px 두께로 Night Track 바탕 위에 그려지고, 현재 구간의 Night 진행 호가 왼쪽 끝에서부터 구간 진행률만큼 채워진다.
호 안쪽 아래에 구간 이름 20px과 남은 시간 26px 고정폭이 Night Text로 쌓인다.
정보는 화면을 누를 때만 보이고 잠시 뒤 다시 숨는다.

### Absence strip
자리를 비운 동안의 하루를 한 줄로 읽게 하는 띠다.
세션 요약과 기록의 세션 상세에서 쓴다.
- 위에서부터 36px 높이의 Hairline Gray 2px 활동 선, 24px 구간 막대, 표식 줄이 8px 간격으로 쌓인다
- 구간 막대는 Cloud Gray 바탕 위에 Phase colors로 칠하고 3시간마다 4px Muted Gray 눈금을 단다
- 표식은 따라 한 소리가 오렌지, 그 밖의 소리가 Disabled Gray인 12px 원이고, 응급은 흰 테두리가 있는 16px Alert Red 원이다
- 현재 시각 커서는 3px Ink 세로 막대다
- 양 끝에 시작과 끝 시각을 13px로 달고, 진행 중이면 끝을 지금으로 쓴다
- 날짜가 바뀌면 날짜 라벨을 달고 줄을 나눈다
- 범례는 구간을 막대, 소리를 원으로 구분해 13px 글자와 함께 줄바꿈한다

### Sound row
녹음된 소리 한 건의 행이다.
- 최소 높이 60px, 엣지 0. 강조되면 Orange Selected 면에 2px 오렌지 테두리
- 왼쪽에 14px 고정폭 시각, 아래에 판정 단어 Tag와 유사도 점 세 개. 분석 전이면 회색 분석 중 Tag
- 소리를 들은 뒤에만 44px 맞음과 틀림 아이콘 버튼이 나온다. 맞음은 오렌지, 틀림은 Ink로 채워진다
- 오른쪽 끝에 44px 오렌지 원형 재생 버튼. 만료된 소리는 muted 톤으로 비활성
- 재생, 평가 저장, 공유 실패는 행 아래 인라인 오류로 알린다

### Guide pager and illustration
- **GuidePager:** 위에 PageDots와 오른쪽 끝 건너뛰기 TextButton, 가운데 260px 일러스트와 가운데 정렬 제목, 아래에 선택적 CheckRow와 폭을 채우는 다음 버튼
- **Illustration:** 최종 그림이 들어오기 전의 자리다. Orange Selected 면에 20px 코너, 가운데 마스코트, 오른쪽 아래 52px 흰 원에 Orange Edge 26px 아이콘을 둔다

### Celebration
학습 완료 화면이 열리면 Sun Yellow와 Berry Purple 컨페티 16조각이 한 번 떨어진다.
보는 사람의 휴대폰과 새장 앞 기기 모두 같은 학습 완료 화면에서 나온다.
조각마다 아래쪽에 자기 엣지색을 가지며 1800ms 동안 정해진 거리를 흔들리며 떨어지고 사라진다.
Reduce Motion에서는 나오지 않는다.

### Completion screen
세션이 끝나면 보는 학습 완료 화면이다.
- **제목:** 가운데 정렬로 34px Black 제목과 15px ExtraBold Muted Gray 고정폭 시간대를 4px 간격으로 쌓는다
- **말풍선:** 버디가 결과를 한 문장씩 말한다. 문장은 2.5초마다 다음으로 넘어가고 마지막 문장에서 멈춘다. 말풍선을 누르거나 왼쪽으로 밀면 다음 문장, 오른쪽으로 밀면 이전 문장으로 가며 직접 넘기면 자동 넘김이 멈춘다. 문장 글자는 세로 방향 18px, 가로 방향 16px ExtraBold이고 아래에 PageDots가 붙는다
- **숫자 상자:** 문장 가운데의 숫자다. Cloud Gray 면에 2px Hairline Gray 테두리와 Disabled Gray 숫자로 시작해 1.1초 동안 항목 면색이 왼쪽부터 차오르고, 면이 지나간 자리의 숫자는 흰색이 된다. 숫자는 세로 방향 28px, 가로 방향 22px Black 고정폭이다. 이미 찬 문장으로 돌아오면 다 찬 상태로 보인다
- **결과 칩:** 깊이 2, 16px 코너의 PressableSurface 칩을 2x2 격자로 둔다. 막대 없이 12px ExtraBold Muted Gray 라벨과 20px Black 고정폭 값만 보인다. 말풍선에 보이는 문장의 칩은 항목의 옅은 면색과 면색 테두리를 받고 접근성 selected 상태를 가진다. 칩을 누르면 말풍선이 그 문장으로 옮겨 간다. 단어가 없는 세션은 함께한 시간과 전체 누적 시간 두 칩만 보인다
- **값:** 이번 학습 칩은 처음부터 최종 값을 보인다. 누적 칩은 숫자가 내려앉기 전까지 학습 전 값을 보이고, 내려앉으면 + 배지가 튀어나오며 300ms 뒤 700ms 동안 값이 올라간다
- **숫자 이동:** 숫자 상자가 다 차면 같은 색 알약이 말풍선에서 칩 값 자리로 750ms 동안 위로 솟았다가 내려앉는다. 이어서 칩이 커졌다 돌아오고, 흰 빛줄기 SummaryGlint가 550ms 동안 지나가며 값이 튄다. 숫자 상자에도 같은 빛줄기가 지나가고 버디가 뛰어오른다
- **등장:** 제목과 버디는 popIn, 시간대와 말풍선과 새 문장은 riseIn으로 나타난다. popIn은 500ms 동안 0.4배에서 커지고 riseIn은 450ms 동안 16px 아래에서 떠오른다. 두 동작은 `summary-animations.ts`에 모여 있다
- **그리기 부담:** 숫자 상자, 날아가는 숫자, 칩의 애니메이션은 transform과 opacity만 움직인다. 올라가는 숫자는 한 번 올라가는 동안 최대 24번 다시 그린다
- **Reduce Motion:** 날아가는 숫자 없이 숫자 상자, 칩 값, 배지가 바로 최종 상태로 바뀐다
- **버튼:** 상세 보기 secondary와 홈 primary를 `size="small"`로 같은 폭에 나란히 둔다

### Audio waveform
3px 간격의 세로 막대가 소리에 반응한다.
녹음 중에는 80ms, 반복 재생 애니메이션은 200ms 간격으로 높이가 바뀌며 최소 높이는 10%다.
막대 색은 문맥의 액센트를 받는다.

### Speech bubble
카드와 같은 흰 면과 Hairline Gray 테두리에 16px 코너, 안쪽 여백 세로 14px 가로 16px이다.
ExtraBold 16px 글자에 22px 행간이며 꼬리는 아래 또는 왼쪽으로 나온다.
`contentStyle`로 안쪽 여백을 바꿀 수 있고, 문자열이 아닌 children은 그대로 그린다.
학습 완료 화면은 안쪽 여백을 세로 16px 가로 20px로 두고 문장, 숫자 상자, PageDots를 넣는다.

## Do's and Don'ts

### Do:
- **Do** 눌리는 요소는 Surface 계열 컴포넌트로 만든다. 면색과 엣지색을 짝으로 주고 depth로 두께를 정한다
- **Do** 새 색 면을 추가하면 한 단계 진한 엣지색을 함께 정의한다
- **Do** 단일 선택은 ChoiceCard, 다중 필터는 Chip, 누를 수 없는 상태 표시는 Tag를 쓴다
- **Do** 설정과 동의 목록은 GroupedList 안에 NavRow, SwitchRow, CheckRow로 쌓는다
- **Do** 폭을 채우지 않는 버튼과 아이콘 버튼은 행 오른쪽 끝에 둔다
- **Do** 세션 구간은 어디서나 학습 오렌지, 휴식 블루, 수면 회색으로 칠한다
- **Do** 새장 앞 화면은 Night 토큰으로만 칠하고 구간 이름을 글자로 함께 보인다
- **Do** 모든 애니메이션에 `useReducedMotion`을 확인하고 정지 상태를 준비한다
- **Do** 버튼 라벨은 언어와 관계없이 Pretendard ExtraBold를 쓴다. 영문은 대문자
- **Do** 나란한 카드는 `flex: 1`과 `minWidth: 0`으로 어느 언어에서도 한 줄을 유지한다
- **Do** 오류 메시지는 Parrot Red 인라인 텍스트로 필드나 행 바로 아래에 둔다

### Don't:
- **Don't** 그라데이션을 배경이나 버튼에 쓰지 않는다. 면은 단색이다
- **Don't** 확산 그림자, 블러, 반투명 유리 질감을 쓰지 않는다. 두께는 엣지로만 표현한다
- **Don't** Parrot Red를 버튼, 탭, 카드 강조에 쓰지 않는다
- **Don't** 한 화면에서 오렌지 외의 색으로 주 행동 버튼을 만들지 않는다
- **Don't** 눌림 피드백으로 투명도나 색 변화를 쓰지 않는다. 면이 내려앉는 것이 눌림이다
- **Don't** Tag와 배지에 엣지 판을 주지 않는다
- **Don't** 새장 앞 화면에 흰 면, 밝은 오렌지, 마스코트를 두지 않는다
- **Don't** 새장 앞 화면에 컨페티를 띄우지 않는다. 컨페티는 학습 완료 화면에서만 떨어진다
