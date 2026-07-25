# Analytics 개발자 가이드

본 가이드는 버디버드 Mobile에 도입된 Firebase Analytics + Crashlytics + Microsoft Clarity 통합 사용법을 설명합니다. 계획서: `~/.claude/plans/ancient-jingling-sunset.md`

## 1. 사전 준비 (사용자 작업)

Firebase 프로젝트 등록·config 파일 배치·prebuild·EAS Development Build 등 **빌드/배포 전반의 절차는 [`docs/BUILD-AND-RELEASE.md`](./BUILD-AND-RELEASE.md) 가 SSoT** 입니다. 본 가이드는 analytics 코드 사용법에만 집중합니다.

Microsoft Clarity 사용을 위한 추가 작업:

- Clarity 콘솔에서 모바일 프로젝트 생성 → Project ID 발급
- `app.config.ts`의 `extra.clarityProjectId` 에 값 입력
- 또는 `.env.local` 에 `EXPO_PUBLIC_CLARITY_PROJECT_ID` 설정

> **주의**: `@react-native-firebase/*` 와 `@microsoft/react-native-clarity` 는 native module 이라 Expo Go 에서 실행되지 않습니다. dynamic config + prebuild + EAS Development Build 가 필수이며, 절차는 BUILD-AND-RELEASE.md 참조.

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

## 정책 (Policies)

다음은 본 프로젝트의 analytics·crash·privacy 정책 단정문입니다. 위반 시 PR이 거부됩니다.

### 이벤트 grammar
- 이름은 `snake_case`, `<domain>_<action>` 패턴, **≤40 chars**
- 신규 이벤트는 `features/analytics/events.ts`의 `AnalyticsEvent` discriminated union에 **먼저 등록**한 뒤에만 `track()`에 전달 가능
- 직렬화는 `toFirebaseParams()`를 거치며, 이름 길이 안전망은 `clampEventName()`

### 스크린 트래킹 의무
- 매 스크린 컴포넌트 함수 상단에 `useScreenTracking('<screen_name>')` **한 번** 호출
- 인라인 `Date.now()` ref로 경과 시간 재구현 금지 — 훅이 반환하는 `elapsedMs()` 사용

### Firebase API
- **modular API v24만 사용** (`getAnalytics(app)`, `logEvent(analytics, …)`)
- namespaced `analytics().logEvent()` / `crashlytics().recordError()` **금지**
- 검증: `rg "analytics\(\)\.|crashlytics\(\)\." features/ app/` 0건

### 에러 보고 계약
- Fatal → `reportError(err, { scope: 'feature.method', screen_name?: '...' })`
- Non-fatal → `console.warn('[scope]', err)`
- Empty catch (`try {} catch {}`) **절대 금지**
- silent fallback 금지 — 사용자 영향이 있으면 surface
- AnalyticsClient는 `registerErrorReporter()`로 module-level reporter에 등록되어 cross-domain crash 보고 단일 진입점이 됨

### ATT (App Tracking Transparency)
- iOS에서 `expo-tracking-transparency` 동의를 받지 못하면 모든 provider 비활성
- 결정은 `AnalyticsProvider` bootstrap 단계에서 단 한 번
- 거부 시 `track()` 호출은 no-op (에러 throw 금지)

### Fanout isolation
- 각 provider 호출은 `Promise.all` + provider별 try/catch로 격리
- 한 provider 실패가 다른 provider를 막지 않음
- 실패는 `reportProviderFailure(name, op, err)`로 일관 로깅

### PII 정책
- **보호자(사용자) PII는 절대 수집 금지**: 이름, 이메일, 전화, 정확한 위치
- 펫 데이터는 허용: 이름, 종(species), 나이, 학습어 — 단 `docs/privacy-policy.md`와 동기화

### Clarity masking
- `maskingMode: 'Balanced'`
- 사용자 입력 필드는 mask

### Identity lifecycle
- iOS·Android의 정본 user id는 Firebase 익명 Auth uid이며, Firebase Analytics·Crashlytics·Microsoft Clarity에 동일하게 전달
- 앱 최초 실행 시 익명 로그인을 시도하고, 오프라인이라 uid를 얻지 못하면 user id 없이 수집을 시작
- 복원된 uid가 있으면 첫 `app_open` 전에 적용하고, 실행 중 uid를 확보하면 이후 이벤트부터 적용
- uid가 소실되면 Firebase Analytics·Crashlytics에는 `null`을 전달해 이전 식별자를 제거. Clarity SDK는 런타임 clear를 지원하지 않아 이전 식별자가 남을 수 있음
- profile은 user property만 설정하며 user id를 변경하지 않음
- web은 개발 편의용이며 Firebase Auth와 analytics 동작을 보장하지 않음

## 3. 통합 위치 (현재 완료된 부분)

| 위치 | 이벤트 |
|---|---|
| `app/_layout.tsx` | `app_open` |
| `app/(onboarding)/_layout.tsx` | `onboarding_started` |
| `app/(onboarding)/index.tsx` | `onboarding_step_completed{welcome}` |
| `app/(onboarding)/profile.tsx` | `onboarding_step_completed{profile}` |
| `app/(onboarding)/goals.tsx` | `onboarding_step_completed{goals}` + `profile_created` + `onboarding_completed` |
| `features/auth/auth-context.tsx` | eager 익명 로그인, uid 소유, foreground 재시도 |
| `features/analytics/analytics-context.tsx` | Auth uid를 analytics user id로 자동 동기화 |
| `features/profile/profile-context.tsx` | 펫 user properties 자동 동기화 |
| `app/(tabs)/session-setup.tsx` | `training_session_started` |
| `app/session-active.tsx` | `training_session_completed` / `training_session_abandoned` + `flushSessionWordMetrics` |

## 4. 후속 통합 작업 (향후)

| 위치 | 이벤트 |
|---|---|
| `app/(tabs)/_layout.tsx` | `tab_switched` |
| `app/(tabs)/words.tsx` | `word_library_opened` |
| `components/words/word-create-modal.tsx` | `word_added`, `word_recording_started/finished` |
| `features/word-library/hooks/use-confirm-delete-word.ts` | `word_removed` |
| `features/audio/hooks/use-audio-recording.ts` | `word_recorded` |
| `features/training/hooks/use-active-session.ts` | `word_practice_started`, `word_practice_completed`, `recording_played` |

## 5. 검증 가이드

### Firebase DebugView
```bash
# iOS
xcrun simctl shell booted defaults write com.joynnovate.buddybird /google/firebase/debug_mode -bool true
# Android
adb shell setprop debug.firebase.analytics.app com.joynnovate.buddybird
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
- 앱 실행 시 Firebase 익명 계정과 pseudonymous uid를 생성하며, 지원 플랫폼은 iOS·Android로 한정
- 운영 정책 변경 시 `docs/privacy-policy.md`와 본 가이드를 함께 갱신
