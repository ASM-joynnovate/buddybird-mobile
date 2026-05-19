# Architecture

## Navigation (Expo Router file-based)

`app/_layout.tsx` is the root. It wraps everything in `I18nProvider → ProfileProvider → TrainingDataProvider → ThemeProvider`. The `RootNavigator` inside uses `Stack.Protected` to gate routes:

- `guard={!!profile}` → `(tabs)` (home, profile tab, session-setup)
- `guard={!profile}` → `(onboarding)` (welcome → profile → goals, 3 steps)

The onboarding group wraps its stack in `OnboardingDraftProvider` so draft state persists across the 3 steps.

## Feature modules (`features/`)

Domain logic lives here — no JSX. Each subdirectory follows the same pattern: `*-types.ts`, `*-storage.ts`, `*-context.tsx`, `*-validation.ts`.

| Module | Responsibility |
|--------|---------------|
| `profile/` | `ParrotProfile` CRUD, onboarding draft accumulation, species/goal options |
| `training/` | `TrainingWord`, `TrainingSession`, `AudioRecording` models and AsyncStorage |
| `audio/` | `useAudioRecording`, `useAudioPreview` hooks, pitch-transform config, file storage |
| `i18n/` | `useI18n()` hook, `t()` translations, locale persistence |

## Components (`components/`)

- `ui/` — generic primitives: `Card`, `Chip`, `FormField`, `PillButton`, `IconSymbol`
- `layout/PetScreen` — screen wrapper that applies standard padding/safe area
- `profile/` — `ParrotProfileCard`, `ProfileAvatarPicker`, `TrainingGoalCard`
- `audio/WaveformPlaceholder` — placeholder until real waveform is implemented

## Design system (`constants/theme.ts`)

Single source of truth for `BuddyBirdColors`, `Colors` (light/dark), `Fonts`, `Spacing`, `Radii`, and `Typography`. Always import from here rather than hardcoding values.

## Path alias

`@/` maps to the project root (configured in `tsconfig.json`). Use `@/features/...`, `@/components/...`, `@/constants/...` everywhere.

## Local persistence

All data is stored locally via `@react-native-async-storage/async-storage`. There is no backend or cloud sync in scope.

## 네이티브 설정

버디버드 Mobile은 native modules (`@react-native-firebase/*`, `@microsoft/react-native-clarity`, `expo-tracking-transparency`)에 의존하므로 **Expo Go에서 실행할 수 없습니다**. Dynamic config(`app.config.ts`)와 prebuild 기반으로 동작합니다.

### Firebase RNFirebase v24

- `@react-native-firebase/app`, `@react-native-firebase/analytics`, `@react-native-firebase/crashlytics` 모두 `^24.0.0` 고정
- **modular API만 사용** (`getAnalytics(app)`, `logEvent(analytics, …)` 형태). namespaced `analytics().logEvent()` / `crashlytics().…` 금지
- 화면 추적은 `logEvent(analytics, 'screen_view', …)` — 사라진 `logScreenView` 금지

### Plugin

- `plugins/withFirebaseStaticPodfile.js`: iOS Podfile에 `use_frameworks! :linkage => :static`를 강제 (RNFirebase의 static linking 요구)
- `app.config.ts`의 `plugins`에 다음 등록 필수:
  - `@react-native-firebase/app`
  - `@react-native-firebase/crashlytics`
  - `./plugins/withFirebaseStaticPodfile`
  - `expo-tracking-transparency` (ATT)

### 프로젝트 루트 `firebase.json`

```json
{
  "react-native": {
    "crashlytics_debug_enabled": false,
    "crashlytics_disable_auto_disabler": true,
    "crashlytics_auto_collection_enabled": true,
    "analytics_auto_collection_enabled": true
  }
}
```

### 환경 분리 (dev / prod)

dev 와 prod 는 **별도 Firebase 프로젝트** 와 별도 Bundle ID 로 분리됩니다. 한눈 매핑:

| 키 | development | production |
|---|---|---|
| App display name | `버디버드 (DEV)` | `버디버드` |
| iOS Bundle ID / Android package | `com.joynnovate.buddybird.dev` | `com.joynnovate.buddybird` |
| URL scheme | `buddybird-dev` | `buddybird` |
| Firebase project | `buddybird-dev` | `buddybird-9b84d` |

**자세한 절차 · 명령어 · 온보딩 · 트러블슈팅 · Hard Rules 는 [`docs/BUILD-AND-RELEASE.md`](./BUILD-AND-RELEASE.md) 참조**. ARCHITECTURE.md 는 구조와 원칙만 기술하며, 빌드/배포 명령은 본 문서에 두지 않습니다.

### config / `.gitignore` (커밋 금지)

```
/config/                    # 환경별 비밀 설정 (Firebase 등)
GoogleService-Info.plist
google-services.json
/android/
/ios/
.firebaserc
.firebase/
```

Firebase 콘솔에서 다운받은 config 파일은 **절대 commit하지 않습니다**. 환경별 배치 규칙은 BUILD-AND-RELEASE.md §4 참조.
