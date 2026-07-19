# Architecture

## Navigation (Expo Router file-based)

`app/_layout.tsx` is the root. `components/app/app-providers.tsx` owns the global provider order: `SafeAreaProvider → AuthProvider → AnalyticsProvider → I18nProvider → ProfileProvider → TrainingDataProvider → WordLibraryProvider → ThemeProvider → FeedbackProvider`. `AnalyticsProvider` optionally subscribes to `AuthProvider`, `ProfileProvider` optionally subscribes to `AnalyticsProvider`, and `FeedbackProvider` consumes analytics and i18n; keep this order so those dependencies synchronize without a hard provider-order crash. The `RootNavigator` inside uses `Stack.Protected` to gate routes:

- `guard={!!profile}` → `(tabs)` (home, profile tab, session-setup)
- `guard={!profile}` → `(onboarding)` (welcome → profile → goals, 3 steps)

The onboarding group wraps its stack in `OnboardingDraftProvider` so draft state persists across the 3 steps.

## Feature modules (`features/`)

Domain logic lives here — no JSX. Each subdirectory follows the same pattern: `*-types.ts`, `*-storage.ts`, `*-context.tsx`, `*-validation.ts`.

| Module | Responsibility |
|--------|---------------|
| `auth/` | Firebase anonymous Auth uid ownership, eager sign-in, foreground retry, auth state subscription |
| `analytics/` | Firebase Analytics·Crashlytics·Microsoft Clarity fanout and Auth uid synchronization |
| `feedback/` | 접속일 기반 Prompt 스케줄, AsyncStorage 영속화, 공용 Auth uid를 포함한 Firestore create-only 제출 |
| `profile/` | `ParrotProfile` CRUD, onboarding draft accumulation, species/goal options |
| `training/` | `TrainingWord`, `TrainingSession`, `AudioRecording` models and AsyncStorage |
| `audio/` | `useAudioRecording`, `useAudioPreview` hooks, file storage |
| `i18n/` | `useI18n()` hook, `t()` translations, locale persistence |

## Components (`components/`)

- `ui/` — generic primitives: `Card`, `Chip`, `FormField`, `PillButton`, `IconSymbol`
- `layout/PetScreen` — screen wrapper that applies standard padding/safe area
- `profile/` — `ParrotProfileCard`, `ProfileAvatarPicker`, `TrainingGoalCard`
- `audio/WaveformPlaceholder` — placeholder until real waveform is implemented

## Design system (`constants/theme.ts`)

Single source of truth for `BuddyBirdColors`, `Colors` (light/dark), `Fonts`, `Spacing`, `Radii`, `Typography`, `Depth`, and `Motion`. Always import from here rather than hardcoding values.

The current visual direction follows `DESIGN.md`: bright white canvas, BuddyBird-owned Duolingo-inspired green/blue/yellow reward colors, bold rounded typography, dark high-contrast learning/word cards, physical pressed buttons, and reduced-motion-aware feedback.

## Path alias

`@/` maps to the project root (configured in `tsconfig.json`). Use `@/features/...`, `@/components/...`, `@/constants/...` everywhere.

## Local persistence

학습·프로필 데이터와 피드백 Prompt 스케줄은 `@react-native-async-storage/async-storage`에 저장한다.
Firebase Auth 세션은 네이티브 저장소에 위임하며, 사용자별 cloud sync는 아직 범위 밖이다.

Firebase 익명 Auth uid가 iOS·Android 사용자 식별자의 정본이다. 첫 실행이 오프라인이면 uid 없이 부팅하고 foreground 복귀 시 다시 로그인을 시도한다. 재설치·기기 변경 간 복구는 보장하지 않으며, 장기 보존이 필요해지면 `linkWithCredential` 계정 연동을 도입한다. web은 개발 편의용으로만 유지하며 Auth와 analytics를 보장하지 않는다.

운영 전 Firebase Console에서 익명 계정 30일 자동 정리가 꺼져 있는지 확인한다.

피드백 제출은 Cloud Firestore `feedback` 컬렉션에 `userId`, `message`, `appVersion`, `platform`,
`locale`, `createdAt`을 추가한다. dev/prod Firebase Console에 게시하는 Security Rules는 인증 uid와
`userId`의 일치 및 정확한 스키마를 검증하고 create만 허용하도록 구성한다. 규칙의 운영 정본과
실제 적용 상태는 Firebase Console에서 확인하며 레포에는 `firestore.rules`를 두지 않는다. 자세한
설정은 [`docs/feedback-backend.md`](./feedback-backend.md)를 따른다.

## 네이티브 설정

버디버드 Mobile은 native modules (`@react-native-firebase/*`, `@microsoft/react-native-clarity`, `expo-tracking-transparency`)에 의존하므로 **Expo Go에서 실행할 수 없습니다**. Dynamic config(`app.config.ts`)와 prebuild 기반으로 동작합니다.

### Firebase RNFirebase v24

- `@react-native-firebase/app`, `@react-native-firebase/analytics`, `@react-native-firebase/crashlytics`, `@react-native-firebase/messaging`는 `^24.0.0`, `@react-native-firebase/auth`, `@react-native-firebase/firestore`, `@react-native-firebase/remote-config`는 `24.0.0` 고정
- **modular API만 사용** (`getAnalytics(app)`, `logEvent(analytics, …)` 형태). namespaced `analytics().logEvent()` / `crashlytics().…` 금지
- 화면 추적은 `logEvent(analytics, 'screen_view', …)` — 사라진 `logScreenView` 금지
- Cloud Messaging은 `features/notifications/`에서 권한 요청, FCM token 로컬 저장, foreground/background/opened message receipt 저장을 담당합니다. 현재 backend token 업로드는 범위 밖입니다.

### 백그라운드 학습 오디오

- `modules/session-audio-engine/` 로컬 Expo 모듈이 세션 단조 시간, 구간 전환, 목표 음원 재생, 연속 마이크 입력, VAD/WAV 저장, 미처리 캡처 목록과 비정상 종료 복구 기록을 소유합니다.
- JS는 `SessionAudioEngine` API로 명령과 이벤트만 교환하며, 백그라운드 진행에 React lifecycle이나 JS timer를 사용하지 않습니다.
- iOS는 `UIBackgroundModes: ['audio']`와 `AVAudioSession.playAndRecord`를 사용합니다.
- Android는 `AudioForegroundService`를 `microphone|mediaPlayback` type으로 실행합니다. `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` 권한을 `app.config.ts`에서 유지합니다.
- Android service는 `START_NOT_STICKY`이며 알림의 종료 action이 JS 실행 여부와 관계없이 복구 기록을 확정하고 오디오 자원을 해제합니다.
- 상세 상태·파일·복구 계약과 실제 기기 검증 항목은 `docs/BACKGROUND-AUDIO-DESIGN.md`가 단일 출처입니다.

### Plugin

- `plugins/withFirebaseStaticPodfile.js`: iOS Podfile에 `use_frameworks! :linkage => :static`를 강제 (RNFirebase의 static linking 요구)
- `plugins/withGradleJvmArgs.js`: Android `gradle.properties` 의 `org.gradle.jvmargs` 를 `-Xmx6144m -XX:MaxMetaspaceSize=1024m …` 로 upsert (CMake + Kotlin + Worklets 병렬 빌드 OOM 방지). 상세는 `docs/BUILD-AND-RELEASE.md` §7.2.
- `plugins/withReactActivityInitGuards.js`: Expo dev launcher가 앱 로딩을 지연하는 동안 nullable인 React delegate에 `onUserLeaveHint`·key callback이 전달되어 발생하는 Android 시작 크래시를 방지합니다.
- `app.config.ts`의 `plugins`에 다음 등록 필수:
  - `@react-native-firebase/app`
  - `@react-native-firebase/crashlytics`
  - `@react-native-firebase/messaging`
  - `expo-build-properties` (`forceStaticLinking`에 `RNFBAuth`·`RNFBFirestore`를 포함한 RNFirebase Pod 등록)
  - `./plugins/withFirebaseStaticPodfile`
  - `./plugins/withGradleJvmArgs`
  - `./plugins/withReactActivityInitGuards`
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
