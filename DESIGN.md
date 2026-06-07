---
version: alpha
name: 버디버드 Mobile
description: Warm tropical mobile design system for an AI parrot speech-training coach, extracted from buddybird-handoff.zip.
colors:
  primary: "#1F3A3D"
  primary-soft: "#2D4A4D"
  secondary: "#2A9D8F"
  secondary-deep: "#1F7A6E"
  secondary-tint: "#DCEFEB"
  tertiary: "#F4A261"
  tertiary-deep: "#C97D3F"
  accent-coral: "#E76F51"
  accent-coral-deep: "#C25540"
  neutral: "#FAF6F0"
  neutral-deep: "#F1E9DD"
  surface: "#FFFFFF"
  surface-warm: "#FBF6EE"
  feather: "#FCEFD8"
  feather-deep: "#F5DEB6"
  leaf: "#6FAA9C"
  leaf-deep: "#4F8A7C"
  dark-bg: "#0F1A1B"
  session-mint: "#7DD3C0"
typography:
  display-onboarding:
    fontFamily: "Gowun Batang"
    fontSize: 34px
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: -0.015em
  display-screen-title:
    fontFamily: "Gowun Batang"
    fontSize: 30px
    fontWeight: 700
    letterSpacing: -0.01em
  display-screen-title-md:
    fontFamily: "Gowun Batang"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
  display-home-greeting:
    fontFamily: "Gowun Batang"
    fontSize: 26px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  display-card-title:
    fontFamily: "Gowun Batang"
    fontSize: 22px
    fontWeight: 700
  display-schedule-word:
    fontFamily: "Gowun Batang"
    fontSize: 17px
    fontWeight: 700
  display-session-word:
    fontFamily: "Gowun Batang"
    fontSize: 84px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.02em
  display-session-count:
    fontFamily: "Gowun Batang"
    fontSize: 64px
    fontWeight: 700
    lineHeight: 1
  body-md:
    fontFamily: "Pretendard"
    fontSize: 15px
    lineHeight: 1.55
  body-sm:
    fontFamily: "Pretendard"
    fontSize: 14px
  body-xs:
    fontFamily: "Pretendard"
    fontSize: 12px
  input-md:
    fontFamily: "Pretendard"
    fontSize: 15px
  button-md:
    fontFamily: "Pretendard"
    fontSize: 15px
    fontWeight: 600
    letterSpacing: -0.01em
  button-lg:
    fontFamily: "Pretendard"
    fontSize: 16px
    fontWeight: 600
    letterSpacing: -0.01em
  chip-md:
    fontFamily: "Pretendard"
    fontSize: 13px
    fontWeight: 500
    letterSpacing: -0.01em
  tab-label:
    fontFamily: "Pretendard"
    fontSize: 10px
    fontWeight: 600
    letterSpacing: -0.02em
  mono-label:
    fontFamily: "IBM Plex Mono"
    fontSize: 10px
    letterSpacing: 0.6em
  mono-meta:
    fontFamily: "IBM Plex Mono"
    fontSize: 11px
    letterSpacing: 0.6em
  mono-session:
    fontFamily: "IBM Plex Mono"
    fontSize: 11px
    letterSpacing: 0.8em
rounded:
  frequency-bar: 11px
  icon-square: 12px
  field: 14px
  list-item: 16px
  section-card: 18px
  card: 22px
  hero-card: 24px
  bottom-tab: 28px
  device-frame: 48px
  avatar-lg: 60px
  full: 999px
spacing:
  waveform-gap: 3px
  micro: 4px
  chip-gap: 6px
  tab-padding-y: 8px
  section-head-gap: 10px
  card-padding-sm: 14px
  field-padding-x: 16px
  button-padding-md: 18px
  section-y: 20px
  screen-x: 22px
  button-padding-lg: 22px
  screen-x-lg: 24px
  onboarding-hero-gap: 36px
  onboarding-bottom: 38px
  screen-bottom-tabs: 120px
components:
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.card}"
    padding: 16px
  card-raised:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.card}"
    padding: 16px
  button-primary-md:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    height: 44px
    padding: "{spacing.button-padding-md}"
  button-primary-lg:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.button-lg}"
    rounded: "{rounded.full}"
    height: 54px
    padding: "{spacing.button-padding-lg}"
  button-teal-md:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    height: 44px
    padding: "{spacing.button-padding-md}"
  button-coral-md:
    backgroundColor: "{colors.accent-coral}"
    textColor: "{colors.surface}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    height: 44px
    padding: "{spacing.button-padding-md}"
  button-sun-md:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    height: 44px
    padding: "{spacing.button-padding-md}"
  button-ghost:
    backgroundColor: "TBD"
    textColor: "{colors.primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    height: 44px
    padding: "{spacing.button-padding-md}"
  chip-active:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    typography: "{typography.chip-md}"
    rounded: "{rounded.full}"
    height: 32px
    padding: 14px
  chip-inactive:
    backgroundColor: "TBD"
    textColor: "{colors.primary}"
    typography: "{typography.chip-md}"
    rounded: "{rounded.full}"
    height: 32px
    padding: 14px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.input-md}"
    rounded: "{rounded.field}"
    height: 48px
    padding: 16px
  bottom-tab:
    backgroundColor: "TBD"
    textColor: "{colors.secondary}"
    rounded: "{rounded.bottom-tab}"
    padding: 8px
  parrot-avatar-home:
    backgroundColor: "{colors.feather}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    size: 64px
  parrot-avatar-profile:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.avatar-lg}"
    size: 120px
  waveform:
    backgroundColor: "TBD"
    textColor: "TBD"
    rounded: 2px
    height: 56px
  frequency-band:
    backgroundColor: "TBD"
    textColor: "{colors.primary}"
    rounded: "{rounded.frequency-bar}"
    height: 22px
  session-play-button:
    backgroundColor: "{colors.feather}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    size: 78px
  record-button-idle:
    backgroundColor: "{colors.feather}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    size: 72px
  record-button-recording:
    backgroundColor: "{colors.accent-coral}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    size: 72px
  schedule-day-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.tab-label}"
    rounded: "{rounded.field}"
    height: 64px
  schedule-timeline-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.section-card}"
    padding: 14px
---

# 버디버드 Mobile Design

## Overview

버디버드 Mobile의 시각 정체성은 warm tropical coaching이다. 디자인은 보호자가 앵무새에게 말을 가르치는 반복 노동을 덜어주는 AI 코치처럼 보여야 하며, 차갑고 기술적인 분석 도구보다 따뜻한 반려동물 루틴 앱에 가까워야 한다.

추출된 prototype은 iPhone 402×874 프레임 안에서 온보딩, 앵무새 프로필, 홈 대시보드, 사운드 라이브러리, 학습 세션, 내 목소리, 스케줄을 연결한다. 모든 화면은 크림 배경, 열대색 포인트, 둥근 카드, waveform, frequency band를 반복해 “앵무새 음성 학습” 제품임을 즉시 전달한다.

구현 시 `DESIGN.md`의 YAML front matter 값을 우선한다. prototype에서 정확히 추출되지 않은 값은 `TBD`로 남겼으며, 임의 보정값을 만들지 않는다.

## Colors

색은 따뜻한 크림 바탕 위에 teal, sun, coral을 얹는 구조다. 색상 토큰은 `design.md` 스펙의 Color 타입에 맞추기 위해 hex로 추출된 값만 YAML에 넣었다. prototype에 등장한 `rgba(...)` 기반 muted/hairline 값은 hex 토큰으로 변환하지 않고 본문에 `TBD`로 기록한다.

- **primary (`#1F3A3D`)**: 깊은 청록 잉크다. 기본 텍스트, primary 버튼, 선택된 스케줄 날짜, 활성 앵무새 pill에 적용한다. 이유는 흑색보다 부드럽지만 충분히 선명해서 warm cream 배경에서 안정적인 대비를 만들기 때문이다.
- **primary-soft (`#2D4A4D`)**: prototype의 `ink-soft` 값이다. 보조 진한 텍스트나 primary보다 덜 강한 정보에 사용한다. 정확한 적용 컴포넌트는 prototype에서 제한적으로만 드러나므로 넓은 사용처는 TBD다.
- **secondary (`#2A9D8F`)**: BuddyBird의 학습/AI 활성 색이다. 활성 탭, teal 버튼, frequency band, 진행 표시, 학습 상태에 적용한다. 이유는 앵무새 훈련의 “집중·반응·AI 조정”을 대표하는 색으로 반복되기 때문이다.
- **secondary-deep (`#1F7A6E`)**: teal gradient의 깊은 끝값이다. 강조 텍스트와 hero card gradient 끝에 적용한다. `1–4 kHz 고주파` 같은 핵심 문구에 사용된 값이다.
- **secondary-tint (`#DCEFEB`)**: teal 정보의 밝은 배경이다. 진행 바 배경, 연결 상태 badge, 정보성 icon tile에 적용한다.
- **tertiary (`#F4A261`)**: sun accent다. 식사/시간/따뜻한 강조, badge, CTA 보조색, frequency 컨트롤에 적용한다. 이유는 학습 루틴의 시간성과 돌봄의 따뜻함을 나타내기 때문이다.
- **tertiary-deep (`#C97D3F`)**: sun 계열 icon/text의 진한 값이다. `food` icon tile이나 sun card 안의 대비 텍스트에 적용한다.
- **accent-coral (`#E76F51`)**: 녹음 중, 알림 dot, 강한 주의 표시의 색이다. 녹음 상태를 coral로 바꿔 idle 상태와 명확히 구분한다.
- **accent-coral-deep (`#C25540`)**: coral gradient의 깊은 끝값이다. coral tone thumbnail이나 강조 카드의 gradient 끝값으로 사용한다.
- **neutral (`#FAF6F0`)**: 앱의 기본 크림 배경이자 primary 버튼 위 텍스트다. 순백보다 부드러운 반려동물 제품의 정서를 만든다.
- **neutral-deep (`#F1E9DD`)**: 더 깊은 크림 배경이다. prototype의 stage/deep background에서 추출됐으며 앱 내부 구체 적용은 TBD다.
- **surface (`#FFFFFF`)**: 카드, 리스트, 입력 필드의 표면이다. warm background 위에서 정보 덩어리를 분리한다.
- **surface-warm (`#FBF6EE`)**: 따뜻한 surface 변형이다. prototype root token으로 추출됐지만 직접 적용 컴포넌트는 TBD다.
- **feather (`#FCEFD8`)**: 밝은 크림-노랑 강조다. parrot avatar 배경, session play button, icon tile, waveform highlight에 적용한다.
- **feather-deep (`#F5DEB6`)**: feather gradient 끝값이다. PhotoPlaceholder의 cream tone에 적용한다.
- **leaf (`#6FAA9C`)**: 안정·환경음 계열 색이다. 환경음, leaf decorative tone, 차분한 상태에 적용한다.
- **leaf-deep (`#4F8A7C`)**: leaf gradient 끝값이다. PhotoPlaceholder leaf tone의 깊이 표현에 적용한다.
- **dark-bg (`#0F1A1B`)**: 다크 모드와 몰입형 학습 세션의 배경이다. 세션 화면은 탭을 숨기고 이 색을 전체 배경으로 사용한다.
- **session-mint (`#7DD3C0`)**: 학습 세션 진행, 반응 감지, session waveform에 적용한다. 어두운 세션 배경 위에서 긍정적이고 명확한 피드백을 준다.
- **Muted/Hairline alpha colors (`TBD`)**: prototype에는 `rgba(31,58,61,0.62)`, `rgba(31,58,61,0.10)`, `rgba(31,58,61,0.06)` 등이 있다. `design.md` Color 토큰은 hex만 허용하므로 YAML 색 토큰으로는 `TBD` 처리한다. 구현에서는 해당 rgba를 style 값으로 직접 쓰거나 별도 opacity token 체계를 정의해야 한다.

## Typography

타이포그래피는 display serif, body sans, mono metadata의 3층 구조다. prototype에서 추출된 font family와 size만 토큰화했으며, 일부 line-height/weight가 명시되지 않은 항목은 본문에서 `TBD`로 남긴다.

- **display-onboarding**: `Gowun Batang`, 34px, 700, line-height 1.18, letter-spacing -0.015em. 온보딩 첫 화면의 `앵무새와 더 깊이 대화하세요`에 적용한다. 감성적이고 editorial한 첫인상을 만들기 위해 사용한다.
- **display-screen-title**: `Gowun Batang`, 30px, 700, letter-spacing -0.01em. 라이브러리와 스케줄의 화면 타이틀에 적용한다. line-height는 prototype에서 이 토큰 단독 값으로 추출되지 않아 TBD다.
- **display-screen-title-md**: `Gowun Batang`, 28px, 700, line-height 1.2. 온보딩 프로필/목표, 내 목소리 화면 타이틀에 적용한다.
- **display-home-greeting**: `Gowun Batang`, 26px, 700, line-height 1.2, letter-spacing -0.01em. 홈 상단 인사말에 적용한다. 사용자가 앱을 열었을 때 현재 앵무새와 함께하는 느낌을 크게 보여준다.
- **display-card-title**: `Gowun Batang`, 22px, 700. 앵무새 카드 이름, 라이브러리 feature title, 단어 카드에 적용한다. line-height/letter-spacing은 구체 추출값이 없어 TBD다.
- **display-schedule-word**: `Gowun Batang`, 17px, 700. 스케줄 timeline 안의 단어 제목에 적용한다.
- **display-session-word**: `Gowun Batang`, 84px, 700, line-height 1, letter-spacing -0.02em. 몰입형 세션의 현재 학습 단어에만 적용한다. 한 단어가 화면의 주인공이 되어야 하기 때문이다.
- **display-session-count**: `Gowun Batang`, 64px, 700, line-height 1. 반복 횟수 progress center에 적용한다.
- **body-md**: `Pretendard`, 15px, line-height 1.55. 온보딩 설명문처럼 읽는 문장에 적용한다. font-weight는 prototype에서 명시되지 않아 TBD다.
- **body-sm**: `Pretendard`, 14px. 화면 설명, 보조 문구에 적용한다. line-height/font-weight는 TBD다.
- **body-xs**: `Pretendard`, 12px. 카드 안의 설명, 미세 상태 텍스트에 적용한다. line-height/font-weight는 TBD다.
- **input-md**: `Pretendard`, 15px. 프로필 입력 필드에 적용한다. height/spacing은 component token을 따른다.
- **button-md**: `Pretendard`, 15px, 600, letter-spacing -0.01em. 기본 pill button에 적용한다.
- **button-lg**: `Pretendard`, 16px, 600, letter-spacing -0.01em. 온보딩 CTA와 하단 주요 CTA에 적용한다.
- **chip-md**: `Pretendard`, 13px, 500, letter-spacing -0.01em. chip과 selector pill에 적용한다.
- **tab-label**: `Pretendard`, 10px, 600, letter-spacing -0.02em. 하단 탭 label에 적용한다.
- **mono-label**: `IBM Plex Mono`, 10px, letter-spacing 0.6em. `NOW PLAYING`, `WORD`, badge-style metadata에 적용한다. font-weight는 TBD다.
- **mono-meta**: `IBM Plex Mono`, 11px, letter-spacing 0.6em. 날짜, step indicator, screen kicker에 적용한다. font-weight는 TBD다.
- **mono-session**: `IBM Plex Mono`, 11px, letter-spacing 0.8em. 세션의 `SESSION`, `NOW LEARNING` 계열 라벨에 적용한다. font-weight는 TBD다.

## Layout

레이아웃은 모바일 full-screen scroll surface와 floating bottom tab을 전제로 한다. prototype은 402px 너비의 iOS 프레임에서 좌우 22–24px의 넉넉한 padding을 반복한다.

- **waveform-gap (3px)**: waveform bar 사이에 적용한다. 오디오 시각화를 촘촘하지만 읽을 수 있게 만든다.
- **micro (4px)**: section kicker와 title 사이 같은 아주 작은 간격에 적용한다.
- **chip-gap (6px)**: chip group, weekday strip, 작은 horizontal control 사이에 적용한다.
- **tab-padding-y (8px)**: 하단 탭 내부 padding과 작은 vertical grouping에 적용한다.
- **section-head-gap (10px)**: section header와 카드/list 사이에 적용한다.
- **card-padding-sm (14px)**: timeline card, stat card, 작은 banner 내부 padding에 적용한다.
- **field-padding-x (16px)**: 입력 필드와 기본 카드 내부 padding에 적용한다.
- **button-padding-md (18px)**: 44px 높이 button의 수평 padding에 적용한다.
- **section-y (20px)**: 라이브러리 feature card와 list, 스케줄 banner 등 주요 섹션 간격에 적용한다.
- **screen-x (22px)**: 홈, 라이브러리, 보이스, 스케줄의 기본 좌우 padding에 적용한다.
- **button-padding-lg (22px)**: 54px 높이 large CTA의 수평 padding에 적용한다.
- **screen-x-lg (24px)**: 온보딩 및 하단 CTA 영역의 좌우 padding에 적용한다.
- **onboarding-hero-gap (36px)**: 온보딩 hero graphic과 headline 사이에 적용한다.
- **onboarding-bottom (38px)**: 온보딩 하단 CTA의 bottom padding에 적용한다. 40px도 prototype에 등장하지만 대표값은 `38px`로 추출했다.
- **screen-bottom-tabs (120px)**: 하단 탭이 있는 scroll screen의 마지막 content padding에 적용한다. 탭바와 home indicator에 내용이 가려지지 않게 하기 위함이다.

정확한 grid column, desktop breakpoint, tablet layout은 prototype에서 추출되지 않았다. 해당 값은 TBD다.

## Elevation & Depth

YAML front matter에는 `design.md` alpha schema상 elevation token 그룹이 없어 elevation 값을 넣지 않았다. 대신 prototype에서 확인된 shadow/depth 적용법만 본문에 기록한다.

- **기본 카드 depth**: 흰색 surface, 0.5px hairline, 아주 약한 shadow로 배경에서 분리한다. 정확한 web shadow는 `0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(31,58,61,0.04)`로 추출됐지만 YAML elevation token은 TBD다.
- **raised card depth**: 오늘의 학습 카드처럼 더 중요한 카드에는 `0 6px 20px rgba(31,58,61,0.08)` 계열 shadow를 적용한다. React Native의 iOS/Android shadow 매핑값은 TBD다.
- **hero gradient card depth**: 홈 앵무새 카드와 라이브러리 feature card는 `0 12px 30px` 계열의 컬러 shadow를 사용한다. 색은 카드의 주색(teal 또는 primary)에 맞춘다.
- **bottom tab depth**: 하단 탭은 blur/glass surface와 `0 8px 24px rgba(31,58,61,0.10)` shadow로 떠 있는 느낌을 만든다. React Native에서 blur dependency를 쓰지 않을 경우 대체 구현은 TBD다.
- **session depth**: 몰입형 세션 화면은 shadow보다 radial glow와 어두운 배경 대비로 깊이를 만든다.

## Shapes

형태 언어는 둥글고 유기적이다. 앵무새, 깃털, 사운드 파형이라는 소재에 맞춰 sharp corner를 피하고 대부분의 interactive element를 pill 또는 큰 radius card로 만든다.

- **frequency-bar (11px)**: 22px 높이 frequency bar의 반지름이다. 주파수 범위가 pill처럼 이어져 보여야 한다.
- **icon-square (12px)**: 38–44px 아이콘 tile 안의 작은 rounded square에 적용한다.
- **field (14px)**: 입력 필드와 weekday cell에 적용한다. 둥글지만 form 요소로서 과하게 부드럽지는 않다.
- **list-item (16px)**: track row, comparison row 같은 리스트 아이템에 적용한다.
- **section-card (18px)**: goal card, AI banner, schedule timeline card에 적용한다.
- **card (22px)**: 기본 Card primitive의 radius다.
- **hero-card (24px)**: 홈 앵무새 카드, 녹음 카드처럼 화면을 주도하는 큰 카드에 적용한다.
- **bottom-tab (28px)**: floating bottom navigation container에 적용한다.
- **device-frame (48px)**: prototype iPhone frame radius다. 실제 앱 내부 UI에는 직접 적용하지 않는다.
- **avatar-lg (60px)**: 120px profile avatar의 원형 radius다.
- **full (999px)**: pill button, chip, toggle, circular icon button, avatar에 적용한다.

Sharp corner 값은 prototype에서 추출되지 않았다. `rounded.none`은 TBD다.

## Components

Component token은 `design.md`가 허용하는 속성(`backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`)만 사용했다. Border, shadow, opacity, gradient, blur는 prototype에서 추출됐지만 현재 schema의 component token으로 직접 표현하기 어려워 본문에 적용법을 남긴다.

- **card**: surface background, primary text, 22px radius, 16px padding. 정보 묶음의 기본 단위다. border는 prototype에서 `0.5px solid rgba(31,58,61,0.06)`로 추출됐지만 YAML color token으로는 TBD다.
- **card-raised**: card와 같은 기본값을 쓰되 depth만 다르다. shadow token은 TBD다.
- **button-primary-md / button-primary-lg**: primary background와 neutral text를 쓴다. 가장 중요한 행동(`시작하기`, `다음`, `학습에 추가`)에 적용한다. disabled/pressed 상태는 prototype에서 추출되지 않아 TBD다.
- **button-teal-md**: secondary background와 surface text를 쓴다. 학습/AI와 직접 관련된 secondary action에 적용한다.
- **button-coral-md**: coral background와 surface text를 쓴다. 녹음 중단/주의 상태처럼 강한 상태 변화에 적용한다.
- **button-sun-md**: sun background와 primary text를 쓴다. 따뜻한 강조 또는 시간/식사 맥락의 action에 적용한다.
- **button-ghost**: prototype의 inactive/ghost 배경은 `rgba(31,58,61,0.06)`로 추출됐지만 YAML Color 타입에 맞지 않아 backgroundColor는 `TBD`다. 구현에서는 이 rgba 값을 직접 쓰거나 alpha token 체계를 별도로 정한다.
- **chip-active**: secondary background, surface text, 32px height, full radius. 탭, 목표, 톤 선택의 활성 상태에 적용한다. sun/coral custom active chip은 component token으로 별도 추출되지 않아 TBD다.
- **chip-inactive**: inactive background는 `rgba(31,58,61,0.06)`로 추출됐으나 YAML에서는 `TBD`다. text는 primary를 유지한다.
- **input-field**: surface background, primary text, 48px height, 14px radius, 16px padding. 앵무새 이름과 직접입력 species에 적용한다.
- **bottom-tab**: rounded 28px, padding 8px. prototype 배경은 light/dark 모두 rgba + blur이므로 backgroundColor는 `TBD`다. 구현에서는 floating glass surface를 재현하되, dependency가 없다면 translucent solid로 대체한다.
- **parrot-avatar-home**: 64px circular feather surface. 홈 앵무새 card 안의 현재 앵무새 avatar에 적용한다.
- **parrot-avatar-profile**: 120px circular profile avatar. 프로필 등록 화면에 적용한다.
- **waveform**: height 56px, bar radius 2px. 색은 사용하는 맥락별로 secondary, tertiary, coral, feather, session-mint 중 하나를 주입한다. background/textColor는 단일 값으로 추출되지 않아 `TBD`다.
- **frequency-band**: 22px height, 11px radius. 0–8 kHz 축에서 활성 범위를 보여준다. background는 `rgba(31,58,61,0.08)`로 추출됐으나 YAML에서는 `TBD`다.
- **session-play-button**: 78px circular feather button. 세션 화면의 play/pause 중심 액션에 적용한다.
- **record-button-idle / record-button-recording**: 72px circular button. idle은 feather+mic, recording은 coral+stop square로 상태 변화를 즉시 보여준다.
- **schedule-day-selected**: 64px high selected weekday cell. primary background와 neutral text로 현재 날짜를 강조한다.
- **schedule-timeline-card**: surface background, primary text, 18px radius, 14px padding. 스케줄 항목의 기본 카드다. current 상태의 accent border와 shadow는 TBD다.

화면 컴포넌트 적용 요약:

- **Onboarding**: `display-onboarding`, `parrot-avatar-profile`, `button-primary-lg`, `chip-active`, `input-field`를 우선 사용한다.
- **Home**: `display-home-greeting`, `parrot-avatar-home`, `card`, `card-raised`, `waveform`, `chip-active`를 반복한다.
- **Library**: `display-screen-title`, `waveform`, `frequency-band`, `chip-active`, track row 형태의 `card`를 사용한다.
- **Session**: `dark-bg`, `session-mint`, `display-session-word`, `display-session-count`, `session-play-button`, `frequency-band`를 사용한다.
- **Voice**: `record-button-idle`, `record-button-recording`, `waveform`, `frequency-band`, `button-primary-lg`를 사용한다.
- **Schedule**: `schedule-day-selected`, `schedule-timeline-card`, `waveform`, `chip-active`를 사용한다.

## Do's and Don'ts

- Do use warm cream backgrounds (`neutral`) instead of pure gray app backgrounds.
- Do use `secondary` teal for learning intelligence, active navigation, progress, and AI-adjustment cues.
- Do reserve `accent-coral` for recording, unread/alert dots, and strong state change.
- Do keep waveform and frequency band visible wherever audio learning is being explained.
- Do use display typography for emotional headings and the currently learned word.
- Do use mono typography for timestamps, step labels, session labels, and technical frequency metadata.
- Do keep bottom-tab screens padded by `screen-bottom-tabs` so content is not hidden behind navigation.
- Don't invent missing state colors, hover styles, disabled styles, or responsive breakpoints; mark them `TBD` until extracted or designed.
- Don't convert extracted rgba values into guessed hex colors. Keep them as implementation notes or define a future alpha token system.
- Don't make the UI look like a default Expo template; maintain rounded cards, tropical palette, and audio visualization.
- Don't show smart speaker integration as a finished MVP feature unless product scope confirms it. Prototype includes it, but implementation status is TBD.
- Don't present real-time RVC or AED reaction detection as working behavior unless the actual implementation exists. Use demo/placeholder language or mark capability as TBD.
