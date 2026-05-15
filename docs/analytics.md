# Analytics 개발자 가이드

본 가이드는 PetHub Mobile에 도입된 Firebase Analytics + Crashlytics + Microsoft Clarity 통합 사용법을 설명합니다. 계획서: `~/.claude/plans/ancient-jingling-sunset.md`

## 1. 사전 준비 (사용자 작업)

1. Firebase 콘솔에서 프로젝트 생성 후 iOS/Android 앱 등록
   - iOS bundle ID / Android package: `com.joynnovate.pethub`
   - `GoogleService-Info.plist` 다운로드 → `pethub-mobile/GoogleService-Info.plist`
   - `google-services.json` 다운로드 → `pethub-mobile/google-services.json`
2. Microsoft Clarity 콘솔에서 모바일 프로젝트 생성 → Project ID 발급
   - `app.json`의 `expo.extra.clarityProjectId`에 값 입력
   - 또는 `.env`에 `EXPO_PUBLIC_CLARITY_PROJECT_ID` 설정
3. 패키지 설치
   ```bash
   cd pethub-mobile
   yarn install
   ```
4. Native 모듈을 위한 prebuild + dev build
   ```bash
   npx expo prebuild --clean
   eas build --profile development --platform ios     # 또는 android
   ```
   > **주의**: `@react-native-firebase/*`와 `@microsoft/react-native-clarity`는 native module이라 Expo Go에서 실행되지 않습니다. EAS Development Build 필수.

## 2. 코드에서 사용하기

### 2.1 이벤트 발송 (타입 안전)

```tsx
import { useAnalytics } from '@/features/analytics/analytics-context';

const { track } = useAnalytics();

track({
  name: 'word_recorded',
  params: {
    session_id: sessionId,
    word_id: word.id,
    word_name: word.name,
    attempt_number: 1,
    recording_duration_ms: 3200,
    audio_size_bytes: 51200,
    recording_method: 'voice',
  },
});
```

이벤트 정의는 `features/analytics/events.ts`의 `AnalyticsEvent` discriminated union에 모두 명시. 새로운 이벤트는 이 union에 먼저 추가해야 컴파일 통과.

### 2.2 화면 자동 추적

```tsx
import { useScreenTracking } from '@/features/analytics/use-screen-tracking';

useScreenTracking('session_active');
```

### 2.3 단어별 누적 메트릭 flush

세션 종료 시점(`training_session_completed` 또는 `training_session_abandoned`)에 반드시 함께 호출:

```tsx
const { flushSessionWordMetrics } = useAnalytics();

await flushSessionWordMetrics([
  { word_id, word_name, practice_duration_ms, recordings_count },
]);
```

## 3. 통합 위치 (현재 완료된 부분)

| 위치 | 이벤트 |
|---|---|
| `app/_layout.tsx` | `app_open` |
| `app/(onboarding)/_layout.tsx` | `onboarding_started` |
| `app/(onboarding)/index.tsx` | `onboarding_step_completed{welcome}` |
| `app/(onboarding)/profile.tsx` | `onboarding_step_completed{profile}` |
| `app/(onboarding)/goals.tsx` | `onboarding_step_completed{goals}` + `profile_created` + `onboarding_completed` |
| `features/profile/profile-context.tsx` | `setUserId`, user properties 자동 동기화 |
| `app/(tabs)/session-setup.tsx` | `training_session_started` |
| `app/session-active.tsx` | `training_session_completed` / `training_session_abandoned` + `flushSessionWordMetrics` |

## 4. 후속 통합 작업 (향후)

| 위치 | 이벤트 |
|---|---|
| `app/(tabs)/_layout.tsx` | `tab_switched` |
| `app/(tabs)/words.tsx` | `word_library_opened` |
| `components/words/word-create-modal.tsx` | `word_added`, `word_recording_started/finished` |
| `components/words/word-edit-modal.tsx` | `word_renamed`, `word_removed` |
| `features/audio/hooks/use-audio-recording.ts` | `word_recorded` |
| `features/training/hooks/use-active-session.ts` | `word_practice_started`, `word_practice_completed`, `recording_played` |

## 5. 검증 가이드

### Firebase DebugView
```bash
# iOS
xcrun simctl shell booted defaults write com.joynnovate.pethub /google/firebase/debug_mode -bool true
# Android
adb shell setprop debug.firebase.analytics.app com.joynnovate.pethub
```
Firebase Console > Analytics > DebugView에서 실시간 이벤트 확인.

### Clarity Live
[https://clarity.microsoft.com](https://clarity.microsoft.com) > Dashboard > Recordings.

### Crashlytics 검증
```ts
throw new Error('test crash');
```
- Firebase Console > Crashlytics에서 5~10분 내 도달 확인.

## 6. 개인정보 정책

- 사용자(보호자) PII는 절대 수집하지 않음 (이름/이메일/전화)
- 펫 메타데이터(이름/종/나이/단어)는 수집함 — `docs/privacy-policy.md` 참고
- iOS ATT 거부 시 모든 provider가 disabled로 전환됨 (`AnalyticsProvider` bootstrap 로직)
- 운영 정책 변경 시 `docs/privacy-policy.md`와 본 가이드를 함께 갱신
