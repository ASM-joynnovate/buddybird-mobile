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

### 2.1 영속 — `features/shared/`

| Export | 경로 | 시그니처 | 용도 |
|---|---|---|---|
| `persistKeyedStore` | `@/features/shared/persist-keyed-store` | `<T>({ key, scope, parse, fallback, recover?, serialize?, audioUriCollections? }) => { load(): Promise<T>; save(value: T): Promise<void> }` | AsyncStorage 단일 키 read/write seam. `getItem → JSON.parse → parse` 와 에러 처리(reportError + fallback)를 일원화. 도메인 storage 모듈은 `parse`(검증·hydration)·`fallback`·필요 시 `serialize`(정규화)만 주입. `fallback`은 미저장(키 없음) 기본값이며, `recover?`(손상·검증 실패 시 seam의 reportError 직후 호출) 미지정 시 손상 경로도 `fallback()`으로 복구 — `recover`에서 throw 하면 손상을 표면화(추가 reportError 없이 단일 보고 + throw, training-storage·profile-storage가 사용). 소비자: training-storage, word-library-storage, word-metrics-storage, profile-storage, fcm-storage(registration·receipts 키마다 인스턴스). `audioUriCollections`(컬렉션·필드 선언) 지정 시 오디오 URI normalize(save)/hydrate(load)를 seam이 자동 소유 |
| `AudioUriCollection` (type) | `@/features/shared/persist-keyed-store` | `{ collection: string; fields: readonly string[] }` | `persistKeyedStore`에 넘기는 오디오 URI 컬렉션 선언. `collection`은 `Record<string, entry>` 형태 필드명, `fields`는 각 entry의 오디오 URI 필드명 목록 |

## 3. Analytics — `features/analytics/`

| Export | 경로 | 시그니처 | 용도 |
|---|---|---|---|
| `useAnalytics` | `@/features/analytics/analytics-context` | `() => { track, setScreen, flushSessionWordMetrics }` | 이벤트 발송·스크린 설정·단어 메트릭 flush 진입점 |
| `AnalyticsProvider` | `@/features/analytics/analytics-context` | React Provider | root layout에서 한 번만 마운트 |
| `useScreenTracking` | `@/features/analytics/hooks/use-screen-tracking` | `(screenName: string, screenClass?: string) => { elapsedMs: () => number }` | 스크린 진입 자동 추적 + 체류 시간 측정 |
| `reportError` | `@/features/analytics/error-reporter` | `(error: unknown, context?: ErrorContext) => void` | fatal 에러 보고 (Crashlytics fanout). `context.scope` 필수 — 미지정 키는 컴파일 에러 |
| `registerErrorReporter` | `@/features/analytics/error-reporter` | `(client: AnalyticsClient) => () => void` | AnalyticsProvider가 reporter를 등록할 때 사용 |
| `installGlobalErrorReporting` | `@/features/analytics/error-reporter` | `({ client, getCurrentScreen? }: InstallErrorReportingOptions) => () => void` | 전역 uncaught 핸들러 + Hermes rejection 추적 설치 (AnalyticsProvider 전용) |
| `ErrorContext` (type) | `@/features/analytics/error-reporter` | `{ scope: string; screen_name?: string; is_fatal?: string }` | `reportError` 컨텍스트 — 알려진 키만 허용 |
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
| `Layout` | scale | 태블릿·웹 폭 제한 등 화면 레이아웃 치수 |
| `Typography` | preset | 텍스트 스타일 프리셋 |
| `Depth` | pressed/elevation | 3D button/card bottom depth 토큰 |
| `Motion` | duration | reduced-motion 처리와 함께 쓰는 motion duration 토큰 |
| `withAlpha` | helper | 6자리 hex 토큰에 alpha를 중앙 적용. 인라인 `rgba()` 대체 |
| `withAlphaOverCanvas` | helper | 3D ledge base 비침을 막기 위해 canvas 위 alpha tint를 불투명 hex로 계산 |
| `categoryColor` | map | 단어 카테고리(`인사`/`음식`/`이름`/`기타`)별 디자인 색상 |
| `categoryShadow` | map | 단어 카테고리별 3D ledge base 색상 |
| `categoryTint` | map | 단어 카테고리별 불투명 active tint. ledge base 색 비침 방지 |
| `categoryTintStrong` | map | 단어 관리 avatar/badge용 카테고리별 불투명 강조 tint |

### 주요 muted 토큰

| 토큰 | 용도 |
|---|---|
| `BuddyBirdColors.kickerMuted` | kicker 텍스트 (라이트 surface) |
| `BuddyBirdColors.kickerMutedOnDark` | kicker 텍스트 (다크 surface) |
| `BuddyBirdColors.bodyMuted` | 본문 보조 텍스트 |
| `BuddyBirdColors.placeholderMuted` | placeholder / hint |
| `BuddyBirdColors.onDark` | 진한 surface 위 기본 텍스트 |
| `BuddyBirdColors.onDarkMuted` | 진한 surface 위 보조 텍스트 |
| `BuddyBirdColors.onDarkSubtle` | 진한 surface 위 border / placeholder |
| `BuddyBirdColors.onColorMuted` | 카테고리색 surface 위 보조 텍스트 |
| `BuddyBirdColors.onColorStrong` | 카테고리색 surface 위 강조 보조 텍스트 |
| `BuddyBirdColors.ledgeOnColorSoft` | 컬러 카드 위 흰 버튼의 단색 ledge base |
| `BuddyBirdColors.surfaceDark*` | 진한 중립 surface |
| `BuddyBirdColors.greenTint` | 호환용 alias. 새 디자인에서는 primary mango tint와 동일 |
| `BuddyBirdColors.blueTint` | rest/listening blue tint |

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
| `catStrongColors` | `@/features/training/session-words-mock` | `Record<string, string>` | 단어 카테고리 dark chip/card 배경색 |
| `DAILY_GOAL_SECONDS` | `@/features/training/training-model` | `number` (기본 600) | 오늘 학습 목표 초 |
| `calculateSessionXp` | `@/features/training/training-model` | `(totalLearningSeconds: number) => number` | 완료 학습 시간 기반 XP 산출 |
| `selectTrainingRewardSummary` | `@/features/training/training-model` | `(store: TrainingStore, now?: Date) => TrainingRewardSummary` | local sessions 기반 오늘 진행률·streak·XP 요약 |
| `deriveSessionCycles` | `@/features/training/session-cycle-model` | `({ totalSeconds, learnSecs, restSecs }) => { secsPerCycle, totalCycles, totalSessionSeconds, totalLearningSeconds, sessionMins }` | 세션 cycle 파생 단일 소스. 분 단위 호출부는 `mins * 60`을 `totalSeconds`로 넘김. `secsPerCycle<=0`이면 `totalCycles=1` |
| `sessionLearningSeconds` | `@/features/training/session-cycle-model` | `(totalCycles: number, learnSecs: number) => number` | 사이클 수 × 학습 초 = 총 학습 초 (진행 화면·완료 저장 공유) |
| `cycleProgressPercent` | `@/features/training/session-cycle-model` | `(cycle: number, totalCycles: number) => number` | 현재 사이클 기준 진행률(%) 반올림, `totalCycles<=0`이면 0 |
| `sessionReducer` | `@/features/training/session-reducer` | `(state: SessionState, action: SessionAction) => SessionState` | 세션 라이프사이클 순수 reducer. 불법 전이는 no-op. `use-active-session`이 타이머→dispatch로 소비 |
| `createInitialSessionState` | `@/features/training/session-reducer` | `({ learnSecs, restSecs, totalCycles }) => SessionState` | 초기 상태(`status:'running'`, `phase:'learning'`, `cycle:1`). 파라미터는 #04 `deriveSessionCycles` 결과 주입 |
| `SessionState` (interface) | `@/features/training/session-reducer` | `{ status, phase, cycle, phaseElapsed, learnSecs, restSecs, totalCycles }` | reducer 상태 — 전이 판정 파라미터를 state에 포함 |
| `SessionAction` (type) | `@/features/training/session-reducer` | `{ type: 'tick' \| 'togglePause' \| 'advancePhase' \| 'reset' }` | 세션 전이 액션 union |
| `TICK_INTERVAL_MS` / `PHASE_ADVANCE_DELAY_MS` | `@/features/training/session-reducer` | `number` (1000 / 980) | tick 간격·phase 전환 딜레이 상수 |

## 6. 오디오 — `features/audio/hooks/`

| Hook | 경로 | 핵심 반환 |
|---|---|---|
| `useRecordingSession` | `@/features/audio/hooks/use-recording-session` | `state`, `metering`, `file`, `elapsedSeconds`, `errorMessage`, `actions: { start, stop, reset }`, `playback`(신규 녹음 재생), `entryPlayback`(기존 entry 재생), `ui: { statusLabel, isRecording, canPlayback }` |
| `useAudioRecording` | `@/features/audio/hooks/use-audio-recording` | `requestAndStartRecording`, `stopRecording`, `resetRecording`, `isRecording`, `lifecycle`, `metering`, `recordingFile`, `elapsedSeconds`, `errorMessage` |
| `useAudioPreview` | `@/features/audio/hooks/use-audio-preview` | `playPreview`, `stopPreview`, `canPreview`, `previewState`, `elapsedSeconds` |

> 녹음+미리듣기 lifecycle 을 함께 쓰는 화면(단어 생성/편집 모달)은 `useAudioRecording` / `useAudioPreview` 를 직접 들고 명령형으로 조율하지 말고 **`useRecordingSession` seam 하나만 소비**하세요. seam 이 녹음 lifecycle·metering·파일 영속·상태→라벨 매핑·재생 상호 배타(신규 녹음 ↔ 신규 재생 ↔ 기존 entry 재생)를 소유합니다. 상태→라벨 매핑은 화면이 라벨 문자열·시간 포맷만 `statusLabels` 로 주입하고, 분기 판단은 seam 이 한 번만 합니다. 오디오 소스 정규화/preset 해석은 §6.0 `audio-source-resolver` 의 책임이며 seam 은 재구현하지 않습니다(신규 녹음은 절대 URI, 기존 entry 소스는 호출부가 해석해 넘김).
>
> 세 훅 모두 `elapsedSeconds`(또는 `playback.elapsedSeconds`)를 반환합니다. 인라인 `Date.now()`로 경과 시간을 재구현하지 마세요.

### 6.0 오디오 소스 해석 — `features/audio/audio-source-resolver.ts`

"오디오 소스를 어떻게 해석하나"의 single source of truth. 재생부는 자체적으로 `preset://` 를 판별하거나 preset 모듈을 재해석하지 않고 이 모듈만 소비합니다.

| Export | 시그니처 | 용도 |
|---|---|---|
| `resolveAudioSource` | `(input: AudioSourceInput) => ResolvedAudioSource` | 재생용 소스 해석. `preset://` → preset 모듈 번호(매핑 미스 시 null), 그 외 in-memory 절대 URI 는 그대로. `transformedAudioUri` 가 있으면 우선. `word-row`·`use-learning-setup` 이 소비. |
| `isPresetUri` | `(uri?: string) => boolean` | `preset://` URI 판별. `audio-file-storage` 의 normalize/exists 가 위임. |
| `PRESET_URI_PREFIX` | `'preset://'` | preset URI 접두사 상수. |
| `AudioSourceInput` (interface) | `{ audioUri: string; transformedAudioUri?: string; presetKey?: string }` | `resolveAudioSource` 입력 (WordEntry 구조 부분집합). |
| `ResolvedAudioSource` (interface) | `{ source: string \| number \| null; isPreset: boolean }` | 해석 결과. `source` 는 expo-audio 에 그대로 전달 가능. |

### 6.1 오디오 파일 저장 utility — `features/audio/audio-file-storage.ts`

| Export | 시그니처 | 용도 |
|---|---|---|
| `persistRecordingFile` | `(sourceUri: string, nowIso: string) => Promise<StableRecordingFile>` | 녹음 직후 임시 파일을 `Paths.document/recordings/`로 복사하여 영구화. 반환은 절대 URI + fileName. |
| `normalizeAudioUriForStorage` | `(uri?: string) => string \| undefined` | seam이 AsyncStorage write 직전 내부 호출. 절대 `file://...recordings/<name>` → `recording://<name>`로 정규화. `preset://`(`isPresetUri` 위임)·이미 정규화된 URI는 pass-through. |
| `hydrateAudioUriFromStorage` | `(uri?: string) => string \| undefined` | seam이 AsyncStorage read 직후 내부 호출. `recording://<name>` → 현재 `Paths.document` 기준 절대 `file://` URI로 재구성. 비대상 URI는 pass-through. |
| `resolveRecordingUri` | `(fileName: string) => string` | fileName만 가지고 현재 documents 경로 기준 절대 URI 생성 (hydrate의 내부 helper, 외부에서도 사용 가능). |
| `recordingFileExists` | `(uri?: string \| null) => boolean` | 재생 직전 stale 메타데이터 가드. `preset://`(`isPresetUri` 위임)은 true, 절대/정규화 URI는 실제 파일 존재 검사. |
| `normalizeAudioUriFields` | `<T>(entry: T, fields: readonly string[]) => T` | entry 한 건의 선언된 필드만 `normalizeAudioUriForStorage`로 일괄 정규화 (save 경로). 변경 없으면 원본 참조 반환. `persistKeyedStore` seam이 사용. |
| `hydrateAudioUriFields` | `<T>(entry: T, fields: readonly string[]) => T` | entry 한 건의 선언된 필드만 `hydrateAudioUriFromStorage`로 일괄 복원 (load 경로). 변경 없으면 원본 참조 반환. `persistKeyedStore` seam이 사용. |

> 사용 의무: `features/word-library/word-library-storage.ts`, `features/training/training-storage.ts` 등 AsyncStorage 계층은 `persistKeyedStore`의 `audioUriCollections`로 오디오 URI 컬렉션·필드를 선언해야 합니다. 필드명은 `.` 로 중첩 경로를 선언할 수 있습니다 (예: `pitchTransform.transformedUri`) — `PitchTransformMetadata.transformedUri` 같은 중첩 URI도 stale 없이 정규화/hydration 됩니다. `normalizeAudioUriForStorage` / `hydrateAudioUriFromStorage`는 seam이 자동 소유하므로 storage 모듈에서 직접 호출하지 않습니다. UI/도메인 코드는 in-memory 절대 URI를 그대로 사용합니다 ([CONVENTIONS §6 참고](./CONVENTIONS.md#6-데이터-영구화-storage)).

## 7. 포맷터 — `features/shared/`

| Export | 경로 | 시그니처 | 용도 |
|---|---|---|---|
| `formatDurationSecs` | `@/features/shared/duration-format` | `(secs: number) => string` | 초 → 한국어 `X초` / `X분` (>=60 시 분 단위 반올림) |
| `formatDurationMins` | `@/features/shared/duration-format` | `(mins: number) => string` | 분 → 한국어 `X분` (<60) / `X시간` (정수) / `X시간 Y분` |

## 8. Notifications — `features/notifications/`

| Export | 경로 | 시그니처 | 용도 |
|---|---|---|---|
| `ensureFcmRegistration` | `@/features/notifications/fcm-client` | `() => Promise<FcmRegistration>` | 알림 권한 요청 후 FCM token을 로컬 저장. backend 업로드는 아직 범위 밖 |
| `getFcmHeadlessLaunchStatus` | `@/features/notifications/fcm-client` | `() => Promise<boolean>` | iOS background FCM headless launch 여부 확인. headless면 root provider/effect 렌더 차단 |
| `subscribeToFcmMessages` | `@/features/notifications/fcm-client` | `() => () => void` | foreground/opened/token-refresh listener 등록 후 unsubscribe 반환 |
| `useFcmRegistration` | `@/features/notifications/hooks/use-fcm-registration` | `({ enabled }) => FcmRegistration \| null` | root layout에서 profile 존재 시 FCM bootstrap 수행 |
| `recordFcmMessageReceipt` | `@/features/notifications/fcm-storage` | `(message, source) => Promise<void>` | payload 본문/data 없이 messageId/from/sentTime metadata만 로컬 저장 |
| `loadFcmRegistration` | `@/features/notifications/fcm-storage` | `() => Promise<FcmRegistration \| null>` | 저장된 FCM registration 조회 |

## 9. UI Primitive — `components/ui/`

| Export | 경로 | Props | 용도 |
|---|---|---|---|
| `WheelPicker` | `@/components/ui/wheel-picker` | `{ options: number[]; selected: number; onChange: (v: number) => void }` | 세로 스크롤 스냅 휠 숫자 선택기. iOS 스타일 시간/분 픽커 등에 사용 |
| `Pressable3D`, `LedgeView` | `@/components/ui/ledge-surface` | `{ depth, baseStyle, faceStyle, ... }` | native shadow/elevation 없이 base+face 레이어로 단색 3D 턱 구현 |
| `SelectableRowCard` | `@/components/ui/selectable-row-card` | `{ active, onPress, children, radioPosition?, style? }` | 라디오 마크 포함 row 카드. 필요 시 좌/우 라디오 위치 선택 |
| `RadioMark` | `@/components/ui/radio-mark` | `{ active: boolean }` | 라디오 표시 도트 |
| `StrokeIcon` | `@/components/ui/stroke-icon` | `{ name, color, size?, strokeWidth? }` | bold rounded SVG 체크/chevron 아이콘. Material glyph가 너무 얇은 선택/힌트 표시에 사용 |
| `ProgressStrip` | `@/components/ui/progress-strip` | `{ label, valueLabel, progress }` | deterministic progress bar. 오늘 목표/세션 진행 등 |
| `RewardPill` | `@/components/ui/reward-pill` | `{ icon, label, tone? }` | streak/XP/phase 같은 icon+text 보상 상태 |
| `MascotReaction` | `@/components/ui/mascot-reaction` | `{ title, body?, mood?, style? }` | BuddyBird parrot reaction surface |
| `BuddyBird` | `@/components/mascot/buddy-bird` | `{ size?, color?, animation? }` | 재사용 가능한 버디 마스코트. reduce-motion에서 정적 렌더 |
| `SpeechBubble` | `@/components/ui/speech-bubble` | `{ children, pointer?, style? }` | 마스코트 대화 말풍선. 온보딩 등 코치 안내에 사용 |

## 9.1 접근성 Hook — `hooks/`

| Export | 경로 | 시그니처 | 용도 |
|---|---|---|---|
| `useReducedMotion` | `@/hooks/use-reduced-motion` | `(): boolean` | native reduce-motion 설정 구독. waveform/progress/celebration motion 억제 |

> **예외 기록**: `WheelPicker`는 등재 시점에 단일 caller(`session-preset-card.tsx`) 상태로 추출됨. 절차 §1-5(2회 이상 중복 시 추출) 예외. 사유: UI primitive로서 향후 다른 숫자 선택 surface 재사용 잠재력. 출처: `~/.claude/plans/hidden-scribbling-sunbeam.md`

## 10. 신규 shared 모듈 추가 절차

1. `rg "<symbol>"` 로 동일·유사 구현이 정말 없는지 확인
2. 신규 모듈은 다음 위치 중 하나에 둠
   - 도메인 무관 utility → `features/shared/<topic>.ts`
   - 도메인 특화 utility → `features/<domain>/<topic>.ts`
   - hook → `features/<domain>/hooks/use-<topic>.ts` (단일 hook이어도 `hooks/` 사용)
3. 본 문서의 적절한 표에 행 추가 (export · 경로 · 시그니처 · 용도)
4. 단일-caller utility는 추출 금지 — 2회 이상 중복일 때만
5. `docs/POLICY-HISTORY.md`에 도입 행 추가 (혹은 `/buddybird-policy-update` 호출)
