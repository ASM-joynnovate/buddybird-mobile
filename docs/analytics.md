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
  name: 'word_added',
  params: {
    word_id: entry.id,
    word_name: entry.label,
    category: 'greeting',
    registration_method: 'voice_recording',
    recording_duration_ms: 3200,
    audio_size_bytes: 51200,
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
- 신규 이벤트는 `features/analytics/events.ts`의 `AnalyticsEvent` discriminated union에 **먼저 등록**한 뒤에만 발행 가능
- 발행 경로는 둘뿐이다. 컴포넌트·훅은 `useAnalytics().track`, React 밖 순수 모듈은 `@/features/analytics/event-tracker`의 `trackEvent` (BB-284) — 훅을 쓰려고 계측 대상 모듈을 React에 묶지 않는다
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
| `components/onboarding/onboarding-profile-flow.tsx` | `onboarding_step_completed{profile}` + `profile_created` + `onboarding_completed` |
| `components/onboarding/onboarding-abandon-tracker.tsx` (`(onboarding)/_layout.tsx` 마운트) | `onboarding_abandoned` — background 도달 시에만, 온보딩 시도당 1회, 미디어 픽커 게이트 활성 중 제외 |
| `features/auth/auth-context.tsx` | eager 익명 로그인, uid 소유, foreground 재시도 |
| `features/analytics/analytics-context.tsx` | Auth uid를 analytics user id로 자동 동기화 |
| `features/profile/profile-context.tsx` | 펫 user properties 자동 동기화 + `profile_updated` (updateProfile 성공·변경 필드 diff 시) |
| `features/training/hooks/use-session-start.ts` | `training_session_started` |
| `app/session-active.tsx` | `training_session_completed` / `training_session_abandoned` + `flushSessionWordMetrics` |
| `app/(tabs)/words.tsx` | `word_library_opened` (focus마다, hydration 게이트 — `use-track-word-library-opened.ts`) |
| `components/words/word-create-modal.tsx` | `word_added`, `word_recording_started/finished` (lifecycle 전이 발화 — 자동 정지 포함) |
| `features/word-library/hooks/use-confirm-delete-word.ts` | `word_removed` (프리셋 삭제 시 미발화, orphan 지표 정리 포함) |
| `features/training/hooks/use-active-session.ts` | `word_practice_started`, `word_practice_completed`, `recording_played` |
| `features/training/follow-along-capture-storage.ts` | `follow_along_capture_created` (저장 성공 후), `capture_evicted_before_upload` (보관 상한 초과 시 지워지는 클립마다 1건) |
| `features/training/follow-along-upload.ts` | `capture_upload_succeeded`, `capture_upload_failed` (서버 거부 — 항목 `rejected` / 단건 4xx 폐기), `capture_flush_aborted` (flush 종료 지점 1곳에서만 발행) |
| `features/training/hooks/use-session-perf.ts` (`use-active-session.ts` 배선) | `session_perf_degraded` — 기준치·스로틀은 `session-perf-model.ts` `SESSION_PERF_THRESHOLDS`, 이벤트 정의 SSoT는 BB-285 티켓 |

### 측정 한계 (알려진 제약)

세션 이벤트 카운터는 JS 훅 로컬이라 네이티브 세션과 수명이 다르다. 완전한 해결은 세션 엔진 연동 확장이 필요해 보류하며, 지표 해석 시 다음을 감안한다:

- `word_practice_completed`의 `recordings_count`/`replay_count`: 세션 화면 remount(이탈 후 복귀, 앱 재실행) 시 복귀 후 구간만 집계. 백그라운드 중 캡처돼 `syncUnstoredSegments`로 복구된 세그먼트는 미포함. 반면 `practice_duration_ms`는 엔진의 전체 경과 시간.
- `recording_played`: 재생 도중 세션이 종료되면 마지막 재생 이벤트가 유실될 수 있고, 재생 중 백그라운드 전환 시 `playback_duration_ms`에 배경 갭이 포함될 수 있음.
- `word_recording_finished`의 `retry_count`: 성공적으로 완료된 녹음 기준 (에러·중단 경로의 재시도는 미집계, started/finished 쌍은 에러 경로에서 불균형).
- `recordings_count`의 정본은 `word_practice_completed`(실제 캡처 세그먼트 수). `word_lifetime_metrics`에 누적되는 `lifetime_recording_count`는 세션 flush의 `audioUri ? 1 : 0` 휴리스틱이라 정의가 다름.
- `session_perf_degraded`의 `audio_delay`: iOS는 실제 가청 시작이 아니라 스케줄 지연(의도→`play()` 디스패치) 근사 — Android(실제 재생 시작 관측)와 측정 범위가 다르므로 플랫폼 간 절대값 비교 금지. iOS ATT denied 시 analytics 자체가 비활성이라 iOS 대조군(동의 거부 코호트)에 편향 가능.
- iOS `audio_delay` **무신호 ≠ 정상**: iOS 측정 구간은 네이티브 큐 위의 동기 실행이라 통상 수십 ms 이내이고, 이 이벤트가 잡으려는 저하 원인(업로드 zipSync 등 JS 스레드 점유)은 이 구간에 원리적으로 잡히지 않는다. 대시보드의 iOS `audio_delay` 0건을 "iOS는 오디오 지연 없음"으로 읽지 말 것 — iOS 재생 지연 판단은 `ui_lag`·Android 코호트로 보완한다. 반대로 iOS에서 기준치 초과가 잡히면 오디오 지연이 아니라 네이티브 큐 정체(`flush()` 지연 등)의 신호로 해석한다.
- `session_perf_degraded`의 측정 구간은 kind별로 다름: `ui_lag`은 AppState active + 세션 running에서만(백그라운드 타이머 스로틀의 가짜 드리프트 차단), `audio_delay`는 네이티브 실측이라 백그라운드(포그라운드 서비스 재생 중) 발행 포함.

캡처 업로드 계측(BB-284)의 제약은 다음과 같다:

- `capture_upload_succeeded`의 `latency_ms`는 서버 저장 확인 시각이 아니라 클라이언트가 응답을 받은 시각 기준. 업로드 성공률(캡처 후 24시간)은 이 값으로 근사한다.
- 결말 없는 클립이 정상적으로 존재한다. 5xx·네트워크 오류는 클립을 큐에 남기므로 `capture_upload_failed`를 내지 않고 `capture_flush_aborted`로만 잡히며, 해당 클립은 대기로 집계한다 (PRD FR-04).
- `capture_flush_aborted`의 `pending_count`는 중단이 확정된 시점에 큐를 읽은 값이다. 스토리지 고장으로 읽지 못하면 키가 빠진다 — 0으로 단정하지 않는다.
- **한 클립이 `capture_evicted_before_upload`와 `capture_upload_succeeded`를 모두 받을 수 있다.** flush가 배치를 보내고 응답을 기다리는 동안(최대 60초) 클립은 큐에 남아 있는데, 그 사이 새 캡처가 상한 eviction을 돌리면 전송 중인 가장 오래된 클립이 지워진다. eviction이 실제로 도는 상황(대용량 백로그)이 곧 flush가 오래 도는 상황이라 확률이 낮지 않다. **집계 시 두 이벤트가 같은 `client_capture_id`로 공존하면 `capture_upload_succeeded`를 우선한다** — 서버에는 저장됐고 로컬 사본만 사라진 것이므로 유실이 아니다.
- 유실 경로 중 계측되는 것은 보관 상한 초과뿐이다. 로컬 오디오 파일이 사라져 배치에서 제외되는 클립은 이벤트를 내지 않는다.
- `follow_along_capture_created`는 캡처 스토어 저장에 성공한 뒤 발행하므로, 저장 자체가 실패한 캡처는 어떤 이벤트로도 남지 않는다.
- 손상된 레코드는 `capturedAt`이 빈 문자열로 살아남아(방어적 파싱) 경과 시간이 계산되지 않는다. 이때 `latency_ms`·`age_ms`는 발행 시점에 **키째 빠진다**(union에서도 선택 필드) — 값이 없는 것과 틀린 값이 섞이는 것 중 전자를 택했다. 이벤트 자체는 정상 발행되므로 건수 집계는 영향받지 않는다. 계산은 `elapsedMsSince`가 단일 출처이고, `toFirebaseParams`의 비유한 숫자 차단은 그 뒤를 받치는 안전망이다.

## 4. 후속 통합 작업 (향후)

| 위치 | 이벤트 |
|---|---|
| `app/(tabs)/_layout.tsx` | `tab_switched` |
| (재설계 필요) | `word_recorded` — BB-272에서 범위 제외. 파라미터(`session_id`·`attempt_number`)가 학습 세션 문맥인데 현행 앱에는 세션 중 사용자 녹음 플로우가 없어 배선 불가. 이벤트 재정의 별도 티켓에서 처리 |

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
