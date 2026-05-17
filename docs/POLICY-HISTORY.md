# Policy History

이 문서는 `pethub-mobile`에 도입·확정된 정책의 시간순 이력입니다. 각 행은 그 정책이 처음 코드/문서로 들어온 시점을 기록합니다. 정책이 신규 도입·변경되면 `.claude/skills/pethub-policy-update`가 본 문서 맨 아래에 행을 추가합니다.

## 1. 정책 도입 이력 (시간순)

| 날짜 | 출처 (plan / commit) | 도입 정책 | 영향 받은 docs / 모듈 |
|---|---|---|---|
| 2026-05-15 | plan `feat-add-analytics-tools-dev-sorted-minsky.md` · commits `c60e02d`, `025637a` | Firebase Analytics + Crashlytics + Microsoft Clarity 도입, `expo-tracking-transparency`로 ATT 게이트, `withFirebaseStaticPodfile` plugin, `firebase.json` 설정 | `package.json`, `app.json`, `plugins/`, `firebase.json`, `.gitignore` |
| 2026-05-15 | plan `ancient-jingling-sunset.md` · commits `daaed10`, `4741315`, `77162dd`, `97e13f8` | snake_case discriminated-union 이벤트 (`events.ts`), fanout AnalyticsClient + provider isolation, ATT 동의 게이트, identity/word-metrics storage, root layout 통합, 온보딩/세션 lifecycle 추적 | `features/analytics/`, `app/_layout.tsx`, `app/(onboarding)/*` |
| 2026-05-15 | plan `firebase-sequential-raccoon.md` · commits `f6fca3a`, `cdb3ac1` | Firebase modular API v22+ 의무화 — namespaced `analytics().logEvent()` 금지, `logScreenView` 대신 `logEvent('screen_view')` 사용 | `features/analytics/providers/`, `features/analytics/client.ts` |
| 2026-05-15 | plan `react-native-firebase-microsoft-react-na-shimmering-tarjan.md` · commit `c60e02d` | `@react-native-firebase/* ^24.0.0` 핀, Microsoft Clarity v4.6 정렬, iOS static linking 강제 | `package.json`, `plugins/withFirebaseStaticPodfile.js` |
| 2026-05-15 | plan `refactor-separate-file-responsibilities-elegant-quokka.md` · 다수 refactor commit | features 도메인별 파일 책임 분리 (`*-types.ts`, `*-storage.ts`, `*-context.tsx`, `*-validation.ts`, `*-model.ts`), 컴포넌트는 `components/<domain>/`로 이동, 스크린은 composition-only | `features/`, `components/`, `app/` |
| 2026-05-15 | plan `app-tabs-session-setup-tsx-abundant-tome.md` | 스크린 줄 수 예산 도입: 일반 스크린 ≤200, session-active ≤100, session-setup ≤80 | `app/(tabs)/session-setup.tsx`, `app/session-active.tsx` |
| 2026-05-15 | plan `bright-stirring-puffin.md` | session-active 라우트 분리, 세션 상태는 `features/training/`에 위임 | `app/session-active.tsx`, `features/training/` |
| 2026-05-15 | plan `feat-move-audio-record-session-refactor-humming-rivest.md` · commits `0a6b904`, `07e9d37`, `bfa3f8b` | 오디오 녹음·재생을 `features/audio/hooks/`로 통합, `elapsedSeconds`를 두 훅 모두에서 반환 의무화 | `features/audio/hooks/use-audio-recording.ts`, `use-audio-preview.ts` |
| 2026-05-15 | plan `zazzy-booping-sprout.md` · 5-track 병렬 리팩터 | (1) silent catch 제거 (2) 인라인 rgba → 토큰 (3) 공용 utils 추출 (`shared/ids`, `shared/date-utils`) (4) screen tracking hooks 폴더 이동 (5) provider failure 리포터 추출 | 다수 모듈, `constants/theme.ts`, `features/shared/`, `features/analytics/` |
| 2026-05-15 | commit `b1894f9` 이하 audio·training·word-library·words·i18n·profile refactor 시리즈 | empty catch 절대 금지 — non-fatal은 `console.warn('[scope]', err)`, fatal은 `reportError(err, { scope })` | `features/audio/`, `features/training/`, `features/word-library/`, `features/i18n/`, `features/profile/`, `components/words/` |
| 2026-05-15 | commits `9d39dae`, `4e2dff4`, `efe95e6`, `bef8ab3`, `ea78155` | 모든 인라인 `rgba()` 금지 → `PetHubColors`의 `kickerMuted` / `kickerMutedOnDark` / `bodyMuted` / `placeholderMuted` 토큰 사용, dark-surface는 `*OnDark` 변형 추가 | `constants/theme.ts`, `components/`, `app/` |
| 2026-05-15 | commits `8cc1875`, `d6dec81` | 공용 utility는 `features/shared/`에 단일 source of truth: `createSessionId`, `diffDaysIso` | `features/shared/ids.ts`, `features/shared/date-utils.ts` |
| 2026-05-15 | commits `21db373`, `5567795` | `useScreenTracking`은 `features/analytics/hooks/`에 두고, 반환값으로 `elapsedMs()` 제공 — 인라인 `Date.now()` ref 금지 | `features/analytics/hooks/use-screen-tracking.ts` |
| 2026-05-15 | commit `4c86152` | `Species` 모델 plain string 단순화 — `SpeciesId` enum / `customSpecies` 필드 제거, `isPresetSpeciesId`로 preset 판별 | `features/profile/` |
| 2026-05-15 | commit `f39f3ff` 및 reportError 시리즈 | `reportError(err, { scope: 'feature.method', screen_name? })`를 cross-domain crash 리포팅 단일 진입점으로 사용, AnalyticsClient는 module-level reporter로 등록 | `features/analytics/error-reporter.ts` |
| 2026-05-15 | commits `025627a`, `8c53cb7` | `google-services.json`, `GoogleService-Info.plist`, `/android/`, `/ios/`, `.firebaserc`, `.firebase/` 모두 gitignore — Firebase config는 절대 commit 금지 | `.gitignore` |
| 2026-05-15 | plan `bright-kindling-breeze.md` | post-merge 컨벤션 정리: dark-surface kicker 토큰 (`kickerMutedOnDark`) 의무화, 검증 grep 체크리스트 명문화 | `constants/theme.ts`, 검증 grep |
| 2026-05-16 | commit `2ee3a25` | analytics 누락 이벤트 채우기 + dev merge 이후 코드 정합성 정렬, screen tracking 빠진 스크린 보강 | `app/`, `features/analytics/` |
| 2026-05-16 | 본 정책 문서화 작업 (plan `lucky-wiggling-candle.md`) | `docs/CONVENTIONS.md` / `docs/SHARED-MODULES.md` / `docs/WORKFLOW.md` / `docs/POLICY-HISTORY.md` 신설, `CLAUDE.md`에 Project Rules + Hard Rules + 정책 변경 자동화 안내 추가, `.claude/skills/pethub-policy-update` 추가 | `CLAUDE.md`, `docs/`, `.claude/skills/` |
| 2026-05-16 | conversation `/pethub-policy-update` 호출 (base `cd54b26`) | 작업 시작 전 현재 브랜치의 upstream 대비 최신 여부를 반드시 확인하고, 뒤처져 있으면 사용자에게 명시적으로 알리도록 의무화 | `docs/WORKFLOW.md`, `CLAUDE.md` |
| 2026-05-17 | plan `~/.claude/plans/hidden-scribbling-sunbeam.md` | session-preset-card 인라인 `WheelPicker`를 `components/ui/wheel-picker.tsx`로, 한국어 시간 포맷터(`fmtMins`/`formatDuration`)를 `features/shared/duration-format.ts`(`formatDurationMins`/`formatDurationSecs`)로 분리. `WheelPicker`는 추출 시점에 단일 caller로, §1-5(2회 이상 중복 시 추출) 예외 — 사유: UI primitive 재사용 잠재력 | `components/ui/wheel-picker.tsx`, `features/shared/duration-format.ts`, `components/session/setup/session-preset-card.tsx`, `components/session/setup/cycle-summary.tsx`, `docs/SHARED-MODULES.md` |
| 2026-05-17 | plan `~/.claude/plans/atomic-plotting-sedgewick.md` | 오디오 URI 영구화 정책 도입: AsyncStorage에는 `recording://<fileName>` / `preset://<label>` 만 저장 (절대 `file://` URI 금지). storage 계층에서 `normalizeAudioUriForStorage` / `hydrateAudioUriFromStorage` 의무 적용, 재생 직전 `recordingFileExists`로 stale/missing 가드. 사유: iOS 컨테이너 UUID는 빌드/재설치 시 변경되어 절대 URI는 stale (Apple TN2406, expo#32788). 기존 v1 데이터(절대 URI)는 load 시 그대로 pass-through 후 다음 save에서 자동 정규화 | `features/audio/audio-file-storage.ts`, `features/word-library/word-library-storage.ts`, `features/training/training-storage.ts`, `features/audio/hooks/use-audio-preview.ts`, `features/training/hooks/use-active-session.ts`, `docs/CONVENTIONS.md` §6, `docs/SHARED-MODULES.md` §6.1 |

## 2. 정책 카테고리별 요약

### 2.1 Analytics
- 이벤트 정의: `features/analytics/events.ts`의 `AnalyticsEvent` discriminated union에 먼저 등록 후 사용
- 이벤트 이름: snake_case, ≤40 chars, `<domain>_<action>` 패턴, `clampEventName()`을 통해 길이 보장
- 스크린 트래킹: 매 스크린 함수 상단 `useScreenTracking('<screen_name>')` 한 번
- Firebase: modular API v24만 사용, namespaced `analytics().…` / `crashlytics().…` 금지
- ATT: iOS에서 거부 시 모든 provider 비활성, AnalyticsProvider bootstrap 단계에서 결정
- Fanout: 각 provider는 try/catch로 격리, 한 provider 실패가 다른 provider를 막지 않음
- Clarity masking: `maskingMode: 'Balanced'`, 사용자 입력 필드 mask
- userId lifecycle: `setUserId(profileId | null)` — profile 생성/삭제 시점에 호출
- PII: 보호자 이름·이메일·전화·정확한 위치 절대 수집 금지

### 2.2 에러 처리
- Fatal: `reportError(err, { scope: 'feature.method', screen_name?: '...' })`
- Non-fatal: `console.warn('[scope]', err)`
- Empty catch `try { } catch {}` 절대 금지
- Silent fallback 금지 — 사용자 영향 시 surface

### 2.3 파일·폴더·스타일
- features는 도메인 flat-file 패턴 (`*-types`, `*-storage`, `*-context`, `*-validation`, `*-model`, `*-config`)
- 훅 2개 이상이면 `features/<domain>/hooks/` 서브폴더
- 컴포넌트는 `components/ui` / `components/<domain>` / `components/<domain>/forms` / `components/session/{setup,running}`
- 스크린 줄 수: 일반 ≤200, session-active ≤100, session-setup ≤80
- JSX는 `app/`과 `components/`에만 — features는 JSX 금지
- 색·폰트·spacing·radii는 `constants/theme.ts`에서만, 인라인 rgba 금지
- dark-surface 대응 시 `*OnDark` 토큰 추가

### 2.4 재사용
- 신규 utility/hook/token 추가 전 `docs/SHARED-MODULES.md` + `constants/theme.ts` grep 의무
- 단일-caller utility 추출 금지, 2회 이상 중복 시에만 추출
- features 간 cross-domain import는 plan별 허용 규칙을 따름 (예: training → word-library 금지)

### 2.5 네이티브 설정
- `@react-native-firebase/* ^24.0.0` 핀 (modular API 전제)
- `plugins/withFirebaseStaticPodfile.js` + `app.json` plugin 등록 의무
- `firebase.json`: crashlytics 디버그 off, analytics auto-collection on
- Expo Go 사용 불가 → `eas build --profile development` 사용

### 2.6 커밋 디시플린
- Conventional commits 소문자: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf`, `ci`
- scope는 도메인 (`feat(analytics):`, `refactor(audio):`)
- 책임 단위 분리 (deps / config / feature / wiring을 각각의 커밋으로)
- 커밋 전 `yarn lint && yarn typecheck` 그린
- `--no-verify` 금지, try/catch 우회 금지, attribution 라인 금지 (전역 settings)

## 3. 갱신 규칙

- 본 문서는 정책이 신규 도입·변경되면 반드시 갱신
- 갱신은 `.claude/skills/pethub-policy-update`가 자동 수행 (수동 호출 또는 발화 트리거)
- 기존 행은 수정·삭제하지 않음. 정책이 폐기되면 새 행에 "deprecated: …"로 추가
