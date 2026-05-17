# Shared Modules Registry

`buddybird-mobile`이 보유한 재사용 가능한 utility / hook / token의 단일 인덱스입니다. 신규 코드 작성 전 본 문서와 `constants/theme.ts`를 먼저 검색하세요. 동일 기능을 다시 작성하면 안 됩니다.

## 1. 사용 절차 (의무)

1. 본 문서를 검색하여 동일·유사 모듈이 있는지 확인
2. 없다면 `rg "<symbol>"` 로 코드베이스 검색
3. `constants/theme.ts` (색·spacing·radii) 검색
4. 그래도 없으면 신규 작성 → 작성 후 **즉시 본 문서에 행 추가**
5. 단일 caller만 있을 utility는 추출 금지. 2회 이상 중복일 때만 추출

## 2. ID & 날짜 — `features/shared/`

| Export | 경로 | 시그니처 | 용도 |
|---|---|---|---|
| `createSessionId` | `@/features/shared/ids` | `(): string` | 세션 ID 생성. 형식: `sess_<base36 ts>_<base36 rand>` |
| `diffDaysIso` | `@/features/shared/date-utils` | `(fromIso: string, toMs?: number) => number` | ISO 날짜 문자열로부터 경과 일수 (floor) |

## 3. Analytics — `features/analytics/`

| Export | 경로 | 시그니처 | 용도 |
|---|---|---|---|
| `useAnalytics` | `@/features/analytics/analytics-context` | `() => { track, setScreen, flushSessionWordMetrics }` | 이벤트 발송·스크린 설정·단어 메트릭 flush 진입점 |
| `AnalyticsProvider` | `@/features/analytics/analytics-context` | React Provider | root layout에서 한 번만 마운트 |
| `useScreenTracking` | `@/features/analytics/hooks/use-screen-tracking` | `(screenName: string, screenClass?: string) => { elapsedMs: () => number }` | 스크린 진입 자동 추적 + 체류 시간 측정 |
| `reportError` | `@/features/analytics/error-reporter` | `(error: unknown, context?: { scope: string; screen_name?: string; ... }) => void` | fatal 에러 보고 (Crashlytics fanout) |
| `registerErrorReporter` | `@/features/analytics/error-reporter` | `(client: AnalyticsClient) => () => void` | AnalyticsProvider가 reporter를 등록할 때 사용 |
| `reportProviderFailure` | `@/features/analytics/analytics-utils` | `(provider: string, op: string, error: unknown) => void` | provider별 fanout 실패 격리 로깅 |
| `clampEventName` | `@/features/analytics/events` | `(name: string) => string` | 이벤트 이름을 40자 이하로 절단 (Firebase 제약) |
| `toFirebaseParams` | `@/features/analytics/events` | `(params: AnalyticsParams) => Record<string, string \| number \| boolean>` | Firebase params 직렬화 |
| `AnalyticsEvent` (type) | `@/features/analytics/events` | discriminated union | **신규 이벤트는 이 union에 먼저 추가** |
| `AnalyticsEventName` (type) | `@/features/analytics/events` | `AnalyticsEvent['name']` | 이벤트 이름 타입 |
| `UserPropertyKey` (type) | `@/features/analytics/events` | union | 사용자 속성 키 |

## 4. 테마 토큰 — `constants/theme.ts`

| Export | 종류 | 비고 |
|---|---|---|
| `BuddyBirdColors` | brand color | 모든 BuddyBird 고유 색은 여기. 인라인 rgba 금지 |
| `Colors` | light/dark | `Colors.light.*` / `Colors.dark.*` |
| `Fonts` | platform | `Platform.select` 기반 |
| `Spacing` | scale | `xs`, `sm`, `md`, `lg`, `xl` 등 |
| `Radii` | scale | corner radius 일관 적용 |
| `Typography` | preset | 텍스트 스타일 프리셋 |

### 주요 muted 토큰

| 토큰 | 용도 |
|---|---|
| `BuddyBirdColors.kickerMuted` | kicker 텍스트 (라이트 surface) |
| `BuddyBirdColors.kickerMutedOnDark` | kicker 텍스트 (다크 surface) |
| `BuddyBirdColors.bodyMuted` | 본문 보조 텍스트 |
| `BuddyBirdColors.placeholderMuted` | placeholder / hint |

dark-surface 대응이 새로 필요하면 `*OnDark` 변형을 토큰으로 먼저 추가하세요.

## 5. 세션·트레이닝 설정 — `features/training/`

| Export | 경로 | 타입/시그니처 | 용도 |
|---|---|---|---|
| `STEP_SESSION_MINS` | `@/features/training/session-config` | `number` (기본 5) | 세션 총 길이(분) |
| `STEP_LEARN_SECS` | `@/features/training/session-config` | `number` (기본 10) | 학습 step 길이(초) |
| `STEP_REST_SECS` | `@/features/training/session-config` | `number` (기본 5) | 휴식 step 길이(초) |
| `PRESET_WORDS` | `@/features/training/session-config` | `readonly { key, word, cat }[]` | 프리셋 단어 목록 |
| `PresetWord` (type) | `@/features/training/session-config` | `typeof PRESET_WORDS[number]` | 프리셋 단어 항목 타입 |
| `SessionStatus` (type) | `@/features/training/session-config` | `'idle' \| 'running' \| 'paused' \| 'completed'` | 세션 상태 |
| `SessionMeta` (interface) | `@/features/training/session-config` | meta payload | 세션 시작 시 저장되는 메타 |

## 6. 오디오 — `features/audio/hooks/`

| Hook | 경로 | 핵심 반환 |
|---|---|---|
| `useAudioRecording` | `@/features/audio/hooks/use-audio-recording` | `requestAndStartRecording`, `stopRecording`, `resetRecording`, `isRecording`, `lifecycle`, `metering`, `recordingFile`, `elapsedSeconds`, `errorMessage` |
| `useAudioPreview` | `@/features/audio/hooks/use-audio-preview` | `playPreview`, `stopPreview`, `canPreview`, `previewState`, `elapsedSeconds` |

> 두 훅 모두 `elapsedSeconds`를 반드시 반환합니다. 인라인 `Date.now()`로 경과 시간을 재구현하지 마세요.

### 6.1 오디오 파일 저장 utility — `features/audio/audio-file-storage.ts`

| Export | 시그니처 | 용도 |
|---|---|---|
| `persistRecordingFile` | `(sourceUri: string, nowIso: string) => Promise<StableRecordingFile>` | 녹음 직후 임시 파일을 `Paths.document/recordings/`로 복사하여 영구화. 반환은 절대 URI + fileName. |
| `normalizeAudioUriForStorage` | `(uri?: string) => string \| undefined` | AsyncStorage write 직전 호출. 절대 `file://...recordings/<name>` → `recording://<name>`로 정규화. `preset://`·이미 정규화된 URI는 pass-through. |
| `hydrateAudioUriFromStorage` | `(uri?: string) => string \| undefined` | AsyncStorage read 직후 호출. `recording://<name>` → 현재 `Paths.document` 기준 절대 `file://` URI로 재구성. 비대상 URI는 pass-through. |
| `resolveRecordingUri` | `(fileName: string) => string` | fileName만 가지고 현재 documents 경로 기준 절대 URI 생성 (hydrate의 내부 helper, 외부에서도 사용 가능). |
| `recordingFileExists` | `(uri?: string \| null) => boolean` | 재생 직전 stale 메타데이터 가드. `preset://`은 true, 절대/정규화 URI는 실제 파일 존재 검사. |

> 사용 의무: `features/word-library/word-library-storage.ts`, `features/training/training-storage.ts` 등 AsyncStorage 계층은 save 시 모든 audio URI 필드에 `normalizeAudioUriForStorage`, load 시 `hydrateAudioUriFromStorage`를 적용해야 합니다. UI/도메인 코드는 in-memory 절대 URI를 그대로 사용합니다 ([CONVENTIONS §6 참고](./CONVENTIONS.md#6-데이터-영구화-storage)).

## 7. 포맷터 — `features/shared/`

| Export | 경로 | 시그니처 | 용도 |
|---|---|---|---|
| `formatDurationSecs` | `@/features/shared/duration-format` | `(secs: number) => string` | 초 → 한국어 `X초` / `X분` (>=60 시 분 단위 반올림) |
| `formatDurationMins` | `@/features/shared/duration-format` | `(mins: number) => string` | 분 → 한국어 `X분` (<60) / `X시간` (정수) / `X시간 Y분` |

## 8. UI Primitive — `components/ui/`

| Export | 경로 | Props | 용도 |
|---|---|---|---|
| `WheelPicker` | `@/components/ui/wheel-picker` | `{ options: number[]; selected: number; onChange: (v: number) => void }` | 세로 스크롤 스냅 휠 숫자 선택기. iOS 스타일 시간/분 픽커 등에 사용 |
| `SelectableRowCard` | `@/components/ui/selectable-row-card` | `{ active, onPress, children, style? }` | 라디오 마크 포함 row 카드. 우측 RadioMark 자동 렌더 |
| `RadioMark` | `@/components/ui/radio-mark` | `{ active: boolean }` | 라디오 표시 도트 |

> **예외 기록**: `WheelPicker`는 등재 시점에 단일 caller(`session-preset-card.tsx`) 상태로 추출됨. 절차 §1-5(2회 이상 중복 시 추출) 예외. 사유: UI primitive로서 향후 다른 숫자 선택 surface 재사용 잠재력. 출처: `~/.claude/plans/hidden-scribbling-sunbeam.md`

## 9. 신규 shared 모듈 추가 절차

1. `rg "<symbol>"` 로 동일·유사 구현이 정말 없는지 확인
2. 신규 모듈은 다음 위치 중 하나에 둠
   - 도메인 무관 utility → `features/shared/<topic>.ts`
   - 도메인 특화 utility → `features/<domain>/<topic>.ts`
   - hook → `features/<domain>/hooks/use-<topic>.ts` (해당 도메인에 hook이 2개 이상일 때)
3. 본 문서의 적절한 표에 행 추가 (export · 경로 · 시그니처 · 용도)
4. 단일-caller utility는 추출 금지 — 2회 이상 중복일 때만
5. `docs/POLICY-HISTORY.md`에 도입 행 추가 (혹은 `/buddybird-policy-update` 호출)
