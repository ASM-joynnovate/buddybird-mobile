---
version: alpha
name: BuddyBird (Mango)
description: "A gamified, mascot-led design system for 버디버드 (BuddyBird) built around warm mango orange (#FF9600) — the brand color that doubles as the 'active / learning' feedback color, reinforced by the pet 망고 (a grey parrot) and the guide mascot 버디. Physically pressable 3D buttons, thick-outlined cards, a gamification top bar (streak / gems / hearts), rounded chunky type, and a friendly CSS-shape bird mascot give every surface a toy-like, rewarding feel. A supporting palette of blue (#1CB0F6 — rest / secondary), yellow (#FFC800 — reward), red (#FF4B4B — recording / hearts), and purple (#CE82FF — names / premium) drives streak, reward, and category accents. Korean-primary, set in Nunito + Pretendard with no thin weights anywhere — this system never whispers."

colors:
  primary: "#FF9600"
  on-primary: "#ffffff"
  primary-hover: "#E88900"
  primary-shadow: "#E07F00"
  secondary: "#1CB0F6"
  on-secondary: "#ffffff"
  secondary-shadow: "#1899D6"
  accent-yellow: "#FFC800"
  accent-yellow-shadow: "#E6A800"
  accent-red: "#FF4B4B"
  accent-red-shadow: "#E04343"
  accent-purple: "#CE82FF"
  accent-purple-shadow: "#A85FD6"
  ink: "#3C3C3C"
  ink-muted: "#777777"
  canvas: "#ffffff"
  surface-1: "#F7F7F7"
  surface-2: "#EBEBEB"
  border: "#E5E5E5"
  border-dark: "#D4D4D4"
  streak: "#FF9600"
  reward: "#FFC800"
  stage: "#DDF4FF"

typography:
  display:
    fontFamily: "Nunito, Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 26px
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: -0.01em
  heading:
    fontFamily: "Nunito, Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: 0
  body:
    fontFamily: "Nunito, Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0
  label:
    fontFamily: "Nunito, Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 800
    lineHeight: 1.4
    letterSpacing: 0.04em
    textTransform: uppercase
  button:
    fontFamily: "Nunito, Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 800
    letterSpacing: 0.02em
    textTransform: uppercase

spacing:
  base: 8px
  scale: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 34, 44, 54]

radius:
  sm: 10px
  md: 14px
  lg: 16px
  card: 18px
  xl: 22px
  sheet: 24px
  celebration: 28px
  frame: 48px
  pill: 9999px

shadows:
  button-sm: "0 4px 0 {shadowColor}"
  button-md: "0 6px 0 {shadowColor}"
  button-lg: "0 7px 0 {shadowColor}"
  button-pressed: "0 1px 0 {shadowColor}"
  card: "0 2px 0 #E5E5E5"
  card-selected: "0 3px 0 {accentColor}"
  recorder: "0 4px 0 {accentShadow}"
  tab-active: "0 3px 0 #E07F00"
  frame: "0 40px 80px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,0,0,0.10)"

motion:
  duration-press: 60ms
  duration-base: 200ms
  duration-bar: 500ms
  easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
  keyframes: [pulse, pop, bounce, float, confetti]
---

## 1. Visual Theme & Atmosphere
BuddyBird coaches a real parrot to speak by repeating the owner's recorded voice across learning/rest cycles. The design makes that utility feel like a toy: the primary CTA is a chunky button with a physical bottom shadow that depresses 5–6px on press; cards have thick 2px outlines and a soft bottom shadow; the mascot 버디 (a rounded bird built from CSS shapes) leads onboarding and reappears inside the learning ring and the completion celebration. The hero color is warm mango orange `#FF9600` — warmth is the brand. The app lives inside a 402×874 iPhone frame (dynamic island, status bar, home indicator) and is Korean-primary throughout.

## 2. Color System
Warm orange is BuddyBird's core identity — it is simultaneously the brand color and the "active / learning / correct" feedback color:
- **Primary orange**: `#FF9600` — CTAs, active tab, learning phase, onboarding accents, profile header, completion screen.
- **Orange shadow**: `#E07F00` — the 3D button/tab bottom shadow that gives elements physicality.
- **Blue**: `#1CB0F6` (shadow `#1899D6`) — secondary actions, **rest phase**, gems, secondary stats, 음식(food) category.
- **Yellow**: `#FFC800` (shadow `#E6A800`) — reward highlight (bolt), gold reward cards.
- **Red**: `#FF4B4B` (shadow `#E04343`) — **recording state**, destructive (delete), hearts/lives, stop.
- **Purple**: `#CE82FF` (shadow `#A85FD6`) — 이름(name) category, premium/master.
- **Streak**: `#FF9600` — same warm orange as primary (streak and brand collapse into one).
- **Ink** `#3C3C3C` / **muted** `#777777` for text; **canvas** white with `#F7F7F7` / `#EBEBEB` gray surface layers and `#E5E5E5` / `#D4D4D4` borders.
- **Stage** `#DDF4FF` — light blue *outside* the phone frame only (preview backdrop), never an app surface.

**Category colors** map the content taxonomy onto the palette: 인사(greeting)=orange, 음식(food)=blue, 이름(name)=purple, 기타(other)=orange/streak. Selected tiles, chips, and filter pills tint to their category color at ~12–20% alpha for fills.

## 3. Typography
Nunito (Latin/numerals) paired with Pretendard (Korean) — both rounded and chunky, reading as friendly but grown-up. The stack is `Nunito, Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif`. Weight is the system's main expressive tool and it is always heavy: **700** body, **800** labels/buttons/chips, **900** headings/screen titles/big numbers. There are no thin weights. Screen titles run 26/900 with `-0.01em` tracking; section headers 18/900; values 18–24/900; body 13.5–15/700; uppercase labels 11–13/800 with `0.02–0.04em` letter-spacing. Buttons are uppercase 800 with `0.02em` tracking.

## 4. Components & Patterns
- **Button** — the signature 3D press CTA. Variants `primary`(orange) / `blue` / `yellow`(dark ink fg) / `red` / `white`(bordered, orange fg) / `ghost`(surface). Sizes sm/md/lg (h 40/52/58, lift 4/6/7px). Uppercase 800, 16px radius. On press: shadow collapses to ~1px and the face translates down. Disabled = flat gray, no lift.
- **Card** — white, 2px border, 18px radius, `0 2px 0 border` bottom shadow. Selected/active state swaps to a colored border + `0 3px 0 accent`.
- **Chip** — pill (radius 999), 2px border, 800/13.5; active fills to its color with a 2px colored bottom shadow. Used for species, categories, filters.
- **Tab bar** — 3 labeled tabs at the bottom: **학습**(dumbbell) / **단어**(book) / **프로필**(person). Active tab is a filled orange rounded rect with `0 3px 0 #E07F00`; inactive is muted gray. Labeled, not icon-only.
- **Gamification top bar** — streak(flame, orange) / gems(gem, blue) / hearts(heart, red), each icon + 800 value.
- **Mascot (버디)** — a friendly bird built entirely from rounded CSS shapes (body, belly, eyes, triangular beak, tuft); recolorable. Animated with `float` / `bounce`.
- **Speech bubble** — bordered bubble with a 45° tail; carries mascot dialogue in onboarding.
- **Progress ring** — circular SVG progress ring (rotated -90°, round caps, 1s dasharray transition). Center holds the mascot + current word + phase countdown during a running session.
- **Progress bar** — pill bar with an optional inner highlight "shine" stripe; 500ms width transition.
- **Waveform** — animated bar waveform; intensity follows audio-on/off with exponential smoothing. Used in the running session, the recorder, and edit sheets.
- **Path node** — circular path lesson node (done/current/locked, current has a pulse halo). Available in the kit for a future learning-path view (not used by the current 3-tab app).
- **Icon set** — bold rounded SVG icons (home, dumbbell, book, mic, person, flame, gem, heart, bolt, star, check, lock, crown, play, pause, plus, chevrons, close, sound, clock, wave, bell, gear, pencil, target, sparkle).
- **Form field / chip / input** — uppercase muted label + control; inputs are 50px tall, 14px radius, 2px border, 700/16.
- **Time wheel picker** — scroll-snap number wheels for custom session duration, with a single highlight bar spanning hour+minute columns.
- **Word picker** — single-select word grid with three layouts: `compact` (3-col dense, the app default), `all` (2-col), `slide` (paged horizontal). Wrapped in a **scroll-hint wrapper** (fade / peek "더 있어요" pill / scrollbar variants) to signal overflow.
- **Status bar** + dynamic island + home indicator — iOS chrome for the phone frame.

## 5. Screens & Flows
- **Onboarding** — `Welcome` (floating 버디 + speech bubble "안녕하세요! 저는 버디예요" + 시작하기) → `Profile` (pet 이름 / 종 chips + 직접입력 / 나이 slider).
- **학습 / Session** (the default route) — **setup**: word grid + time presets (짧게/중간/길게/직접 설정) + a 총/학습/휴식 breakdown card → **running**: top overall progress bar + 중단, a large **progress ring** countdown with the mascot and current word, a phase pill (학습=orange / 휴식=blue) + 사이클 N/총, and either a playing waveform (learning) or a rest message → **completion**: full-screen **orange** celebration with falling confetti, a bouncing 버디, "학습 완료! 🎉", and reward cards. This follows BuddyBird's learn→rest cycle model.
- **단어 / Words** — category filter chips + a list of words (initial-letter avatar in category color, source badge 내 녹음/프리셋, edit + play). `+` opens the voice recorder. Edit opens a bottom sheet (rename + category + re-record + delete confirm).
- **단어 녹음 / Voice** — a create flow with back button (no tab bar): label + category, a colored recorder card (mic → red recording → playback), then 학습에 추가.
- **프로필 / Profile** — orange header card (avatar + name + species·age), a 3-up stat row (streak / today / total), a rewards grid (locked tiles dimmed), and 프로필 편집 → edit screen.

## 6. Spacing & Layout
Mobile-first, single column inside the 402px frame. Horizontal padding is typically 20–22px; screen top padding ~50px clears the status bar. Section rhythm is intentional rather than uniform — `0 20px 0` blocks stacked with 18–24px vertical gaps, content lists at 8–10px gaps. Tap targets are generous (buttons 40/52/58px tall; icon buttons 40–46px). Bottom scroll regions pad ~130px to clear the tab bar. The tab bar adds ~30px bottom safe-area padding for the home indicator.

## 7. Motion & Interaction
Game-like, reward-forward. The defining interaction is the **button press**: a 60ms transform that pushes the face into its shadow. The mascot floats and bounces; the current path/lesson node pulses; completion rains confetti and pops cards. Progress bars and rings animate width/dasharray over ~0.5–1s. The shared spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)` overshoots to feel bouncy. Waveforms run continuously while audio is "on," easing their amplitude rather than snapping.

## Rationale

**Orange as brand + active simultaneously** — `#FF9600` does double duty as the brand color and the "active / learning / in-progress" feedback color (the learning phase, the running ring, the completion screen). The conflation is deliberate: the user should associate the brand itself with the warm moment of their bird learning. The warmth also fits the pet (망고, a grey parrot named after the orange fruit) better than a cool color would.

**Physical button shadow as behavioral design** — The 5–7px bottom shadow on the primary CTA is a behavioral cue, not decoration. The button looks pressable; when it depresses on tap it returns tactile-like feedback that lowers resistance to starting a session. This makes a utility app (set up audio, walk away) feel like a toy.

**Heavy weights (700–900) as legibility and character** — Running body at 700 and titles/values at 900 keeps Korean (Pretendard) and Latin/numerals (Nunito) easy to parse at a glance — important for a glanceable "is my bird still learning?" app — while giving the whole system a confident, childlike-but-grown-up voice. No thin weights anywhere.

**Reward feedback is a first-class surface** — Because the real payoff (a bird slowly learning to speak) is invisible and delayed, the design treats reward feedback as a primary surface rather than a footnote: warm reward tokens are color-coded with an icon and a value, a persistent top bar keeps progress in view, and the session-complete moment is the visual peak. The design fixes only how rewards *look and feel* — which colors, shapes, and motion signal progress — and leaves the specific scoring and milestone rules to product.

**Full-screen celebration as peak-end execution** — The orange full-screen completion (confetti + bouncing 버디 + reward cards) applies the peak-end rule to a passive task: the owner mostly leaves the phone playing audio, so the *return* moment must be the most rewarding beat to drive the habit loop.

**Lean 3-tab app, extensible kit** — The component library ships extra affordances (a winding path node, hearts/gems) but the live app uses only what BuddyBird needs (학습 cycle, 단어 management, 프로필). Unused pieces stay in the kit as optional vocabulary rather than being forced into screens.

## Accessibility

### Contrast Ratios
- **Primary orange on white** (`#FF9600` on `#ffffff`): ≈ 2.1:1 — fails AA/AAA. Decorative / fill use only, never as a text color.
- **White on primary orange** (button face): ≈ 2.1:1 — also fails AA as small text; only acceptable on large bold (18px+ 800) button labels and always paired with the button's shadow/shape as a non-color cue.
- **Ink on white** (`#3C3C3C` on `#ffffff`): ≈ 10.1:1 — passes AA/AAA.
- **Muted on white** (`#777777` on `#ffffff`): ≈ 4.0:1 — fails AA for normal text (large text / 14px+ bold only).
- **Blue / red / purple fills** carry white (or dark-ink for yellow) text and, like orange, should be treated as large-bold-only for AA-equivalence.

### Minimum Requirements
- **Touch target**: 44×44px minimum; primary CTAs are 52–58px tall, icon buttons 40–46px.
- **Focus indicator**: use a 2px outline at 2px offset (blue `#1CB0F6`); supplement with the existing border/shadow so focus never relies on color alone (focus contrast on white ≈ 3.0:1).
- **State never by color alone**: learning/rest phases pair their orange/blue with a text pill (학습 / 휴식); recording pairs red with "녹음 중 · 0:02"; correct/complete pairs orange with "학습 완료". Category color is always backed by a text label.

### Motion
- Respect `prefers-reduced-motion: reduce`: suppress or replace with instant state — confetti, mascot float/bounce, node pulse, card pop, button press physics, and continuous waveform animation.
- The spring easing's overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`) must be disabled under reduced motion — overshoot can trigger vestibular discomfort.

### Notes
- The orange primary (`#FF9600`, ≈ 2.1:1 on white) must never be a text color — restrict it to filled buttons (white text on top), filled tabs, progress fills, and brand graphics, always with an added shape/shadow cue.
- Prefer `#3C3C3C` over `#777777` for any body-size secondary text; reserve muted gray for 14px+ bold or large labels.
- Waveform and ring animation convey "audio is playing" — always back them with the text/icon status pill so non-visual and reduced-motion users get the same signal.
