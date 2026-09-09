# BuddyBird data and native compatibility contract

Reference release: v1.1.0, commit d5464b7. This is a new compatibility specification, derived by the authorized investigator from persisted field names, file locations, native input/output and external behavior. It contains no implementation to transplant. Examples are synthetic. Runtime observations on physical devices remain unverified.

## Migration boundary

The rewrite must preserve original AsyncStorage bytes and existing files. Only mark migration complete after writing and rereading the new store successfully. Missing data is distinct from malformed data. A malformed nonempty record must not become a fresh empty installation. Failure must block mutations, learning and upload and offer retry. The following describes accepted historical formats; the previous release's lossy fallback behavior is not a preservation requirement.

No overall schema/migration marker was found. `version: 1` occurs in library, training and feedback records, while optional fields evolved without increasing it. Values below are JSON encoded except explicitly marked raw strings.

| AsyncStorage key | Stored value |
|---|---|
| `@buddybird/parrot-profile` | Profile object; missing means onboarding incomplete |
| `@buddybird/wordLibrary` | `{version:1, entriesById:{[id]:word}, updatedAt:ISO}` |
| `@buddybird/training-store` | Training object described below |
| `@buddybird/follow-along-captures` | `{capturesById:{[id]:capture}}` |
| `@buddybird/locale` | Raw `ko` or `en` string |
| `@buddybird/analytics-consent` | Raw `unknown`, `granted`, `denied`, or `not_applicable` string |
| `@buddybird/analytics-word-metrics` | Map keyed by word ID, described below |
| `@buddybird/upload-consent` | `{status, decidedAt, noticeVersion}` |
| `@buddybird/feedback-prompt` | `{version:1,lastCountedDate,dayCount,thresholdIndex}` |
| `@buddybird/app-update` | `{dismissedVersion:string|null,lastCheckedAt:number|null}` |
| `@buddybird/fcm-registration` | `{token:string|null,authorizationStatus,updatedAt:ISO}` |
| `@buddybird/fcm-message-receipts` | Array of receipt objects |

Historical retired keys found in commit history:

- `@buddybird/analytics-installation-id`: raw UUID string. This was retired on adoption of Firebase anonymous UID. Preserve the old bytes for recovery, but never treat this UUID as the current Firebase UID.
- `@buddybird/word-upload-state`: `{[clientWordId]:{status:"uploaded"|"failed"}}`. This appeared during development and was removed before the final upload behavior. Presence in a public binary is unverified. Preserve bytes if present; do not use it to suppress v1.1.0-compatible word uploads.
- Earlier rebranding used `@pethub/parrot-profile`, `@pethub/training-store`, `@pethub/wordLibrary`, `@pethub/locale`, `@pethub/analytics-consent`, `@pethub/analytics-word-metrics`, `@pethub/analytics-installation-id`. Rebranding also changed app identity; whether these keys can coexist in released BuddyBird installations is unknown. Do not overwrite a current BuddyBird key with a namesake historical key. Retain all originals.

## Profile and locale

Profile required fields: `id`, `name`, `species`, `createdAt`, `updatedAt` strings; `birthDate` is `YYYY-MM-DD` or explicit null; optional `photoUri` string. Current IDs look like `parrot-<ISO timestamp>`, and existing IDs must remain unchanged.

Historical profile variants:

- `birthDate` absent and `ageMonths:number` present. Backfill birth date as the first day of the local calendar month containing `createdAt`, minus `ageMonths` months. Example: created `2026-06-20T12:00:00Z`, age 7 -> `2025-11-01` in Seoul.
- `birthDate:null` explicitly means unknown. Do not derive it from a leftover `ageMonths`.
- `species:"custom"` plus `customSpecies`: effective species is trimmed `customSpecies` when nonempty, otherwise `custom`.
- `species:"parakeet"` normalizes to `budgie`.
- Retired optional `trainingGoalIds` array contained `greet`, `fruit`, `name`, `leave`, `song`. Preserve as historical data; these are not v1.1.0 active features.

Species may be arbitrary user text, not only predefined identifiers. `photoUri` was the direct result URI from the OS image picker and was not consistently copied into a permanent photos directory. It may point into a cache or old absolute app container. Preserve accessible content and the original URI; missing images must not trigger profile reset. A real updated-install test is required to discover which historical photo paths remain accessible.

`ko` and `en` are app locale IDs. Changing locale does not change user words or their IDs. Korean preset keys lack a prefix; English preset keys start with `en-`.

## Word and audio data

A library word has required `id`, `label`, `tag`, `sourceType`, `audioUri`, `createdAt`, `updatedAt`. `sourceType` is `preset` or `recording`. Optional fields: `presetKey`, `transformedAudioUri`, `pitchProfileId`. Existing library IDs have the form `wentry-<ISO timestamp>-<random suffix>`. Preserve exact IDs including punctuation; the server sees these strings.

Tags: `greeting`, `food`, `name`, `etc`. Historical Korean tags map `인사` -> `greeting`, `음식` -> `food`, `이름` -> `name`, `기타` -> `etc`.

Asset compatibility:

| presetKey | Learning label | Asset |
|---|---|---|
| `hello` | 안녕 | `assets/audio/ko-kr/default_An-nyeong.m4a` |
| `apple` | 사과 | `assets/audio/ko-kr/default_Sa-gwa.m4a` |
| `saranghae` | 사랑해 | `assets/audio/ko-kr/default_Sa-rang-hae.m4a` |
| `bye` | 다녀와 | `assets/audio/ko-kr/default_Da-nyeo-wa.m4a` |
| `en-hi` | Hi | `assets/audio/en-us/default_hi.m4a` |
| `en-hello` | Hello | `assets/audio/en-us/default_hello.m4a` |

Preset `audioUri` strings may be `preset://안녕`, `preset://Hi`, etc. The URI suffix is not a reliable asset key: `presetKey` controls resolution. Existing presets retain their library IDs across locale changes; all six can coexist even when only one locale is visible. User recordings are visible in either locale. Presets are not user-deletable in v1.1.0.

Recordings:

- Base location: current app documents directory, `recordings/`.
- Stable URI: `recording://<relative-name>`. A relative name can include `session-captures/`; never reduce it to basename.
- User recording filename: `recording-<ISO with colon and dot replaced by hyphen>.<extension>`, normally m4a.
- Historical absolute `file://.../recordings/<relative-name>` paths may contain obsolete iOS container UUIDs. Resolve the `recordings/` suffix against the current documents directory when that is the known file lineage; never discard the original source merely because the old absolute path is stale.
- `transformedAudioUri`, `transformedUri`, and nested `pitchTransform.transformedUri` may exist from a retired pitch feature. Preserve these files and fields. Current learning no longer applies the historical pitch profile, but older transformed files are still user media.
- `pitchProfileId` may be `parrot-mvp-high`; historical nested `pitchTransform` holds `{profileId:"parrot-mvp-high",playbackRate:number,preservesPitch:boolean,transformedUri?:string,appliedAt:ISO}`.

## Training and history

Persisted training root:

`{version:1, wordsById, recordingsById, sessionsById, wordProgressByWordId, lastSessionSettings?, updatedAt}`.

Each training word holds `id,label,locale,sourceType,audioUri,createdAt,updatedAt` and optional `presetKey,transformedAudioUri,recordingId,pitchTransform,libraryEntryId`. Its ID is separate from the library ID, usually `word-<ISO>-<suffix>`. `libraryEntryId` links to the original/current library word. Historical rows may lack that link. Do not infer identity from a repeated label. Recorded originals can also have `recordingId` links into `recordingsById`.

Each recording holds `id,originalUri,createdAt,updatedAt` and optional `transformedUri,durationSeconds,pitchTransform`.

Session settings: `wordId,sourceType,totalDurationSeconds,learningDurationSeconds,restDurationSeconds`, optional `stressCareDurationSeconds,libraryEntryId`. All durations are seconds here; native commands use milliseconds. Missing stress-care duration means zero.

Session history adds `id,completedCycles,totalLearningSeconds,startedAt`, optional `endedAt`. Old session IDs can look like `session-<ISO>-<suffix>`; newer native sessions use `sess_<base36 epoch ms>_<10 random hex characters>`. Native recovery must reuse its exact `sessionId` as history ID. Multiple writes of an already credited ID must not increment progress or session counts again.

Progress: `{wordId,totalTrainingSeconds,sessionCount,successMarkedAt?,updatedAt}` keyed by training word ID. `totalTrainingSeconds` is accumulated learning-phase time, not total wall time. `successMarkedAt` is an existing achievement marker; preserve it even though success marking UI may have changed.

When consolidating words, preserve history IDs, training word references, library references and frozen historical audio/label data. Library data is the current word record; old history must still identify its original word when the library entry was later edited or deleted. Absence of a reliable link is not permission to merge two different recordings.

Crediting behavior: naturally completed sessions count even if shorter than five minutes; manually ended/interrupted recovery counts only after at least 300 seconds of running elapsed time. Paused/interrupted wall time does not qualify. Learning credit at position is completed prior cycles' learning duration plus current phase learning elapsed, capped at the learning duration. Completion at an exact cycle boundary reports the final cycle/final phase, not a new empty cycle. Current streak uses local calendar days with credited learning, and today totals learning seconds by endedAt (startedAt if endedAt absent).

## Capture data and transfer identity

Capture required data: `id,sessionId,wordId,cycle,phase,capturedAt,uri,fileName,segments,sizeBytes`. `phase` is `learning` or `rest`. `segments` is an array of `{startMs,endMs}` measured inside the saved WAV. Optional immutable registration metadata: `clientWordId`, `parrotSpecies:string|null`, `parrotBirthdate:string|null`. Missing metadata denotes legacy data; explicit null means profile unknown at registration.

Historical variants:

- Missing `phase` means `learning`.
- Earlier captures contained `uploaded:boolean`; this flag is no longer active in v1.1.0 and the existence of a capture row now means pending upload. Preserve historical flag bytes, but do not silently drop its media during migration.
- Missing `clientWordId` is backfilled once: `preset-<presetKey>` when associated word has a preset key; otherwise associated word's `libraryEntryId`; otherwise the original `wordId`. Profile fields are snapshotted at this first backfill. Do not keep recomputing them after profile edits.
- Captures from the native engine use lowercase UUID `segmentId` as capture `id`, unlike older JS captures such as `cap_<base36 epoch ms>_<10 hex>`.

Queue semantics: every currently stored capture is pending. Successful uploads remove capture and its file. Rejected captures are removed under the server response rules. Network/server/transient or unparseable responses retain unresolved captures. At most 10 captures, oldest first, nominal total source size budget 9 MiB per ZIP; a single oversize capture can be sent alone for explicit server disposition. Full compatibility upload response rules belong in the API contract.

The v1.1.0 local cap is 500 MiB and oldest captures were evicted even if unuploaded. This is an explicit historical data-loss behavior and conflicts with an unconditional interpretation of 'preserve all unsent files'. Do not run eviction during migration. Product retention policy for new storage-pressure cases requires an explicit decision.

Flush opportunities: reaching 10 pending captures, session completion/recovery, app foreground, network reconnection, and upload consent becoming granted. Repeated accumulation triggers after a transient failure wait for another opportunity, preventing repeated ZIP assembly while offline. Only one capture request is active per worker. User words are a separate serialized stream: recording words only, oldest first; immediately on creation, all on cold start or consent granted. v1.1.0 has no persisted word-upload success marker and intentionally resends words, relying on server identity `(firebase_anon_uid, client_word_id)`. Uploads do not delete a user's reference recording.

## Consent, identity and ancillary state

Upload consent and analytics consent are independent. Upload record is `{status:"unknown"|"granted"|"denied",decidedAt:ISO|null,noticeVersion:number}`. Current notice version is 1. Unknown prompts at cold start; denied prompts again after 30 days; granted does not prompt. Notice version is recorded but is not itself a reprompt condition. Upload requires granted consent, a restored Firebase UID and a configured API base URL. Recheck this between requests.

Analytics consent is ATT-derived on iOS and `not_applicable` on Android. Collection is allowed only for `granted` or `not_applicable`. A saved string cannot override the current OS permission result.

Firebase anonymous UID lives in the native Firebase SDK's own persistence, not any listed AsyncStorage key. Retain Firebase app/project identity and existing bundle/package identity. Do not sign out, clear auth persistence, or create another anonymous user when `currentUser` already exists. Exact SDK storage internals were not inspected and must not be manually reconstructed.

Word metrics map entries: `{word_id,word_name,lifetime_practice_count,lifetime_practice_duration_ms,lifetime_recording_count,last_practiced_at_iso}`. Counts are nonnegative integers; duration is nonnegative finite milliseconds.

Feedback schedule: `lastCountedDate` is local YYYY-MM-DD or null; `dayCount` counts distinct launch days toward the current threshold; `thresholdIndex` advances after prompt action. Update `lastCheckedAt` uses epoch milliseconds. FCM authorization values: `not_determined`, `denied`, `authorized`, `provisional`, `ephemeral`. Receipt `{messageId:string|null,from:string|null,sentTime:number|null,source:"foreground"|"background"|"notification_opened",receivedAt:ISO}`; at most 20 newest receipts.

## Native session command contract

Commands and events may be reimplemented from scratch. These names and values describe the prior public boundary and must be represented in the new typed contract:

- Commands: start(input), pause(), resume(), stop(), getSnapshot(), getPendingRecovery(), clearPendingRecovery(sessionId), getUnstoredSegments(), markSegmentsStored(segmentIds).
- Events: state changed and progress (snapshot); captured segment; failure (`code,message,recoverable`).
- State values: idle, starting, running, paused, interrupted, completed, failed, stopping.
- Phases: learning, rest, stress-care.
- Failure codes: permission-denied, audio-source-unavailable, audio-route-unavailable, storage-unavailable, service-start-not-allowed, audio-engine-failed.

Start input: `sessionId,targetAudioUri,captureDirectoryUri,totalDurationMs,learningDurationMs,restDurationMs,stressCareDurationMs,stressCareAudioUris,maxPendingCaptureBytes,vad,recovery,notification`. Audio URIs at this boundary are local `file://` paths. Positive total and learning durations, nonnegative rest/care durations, existing readable source, writable capture directory, granted microphone are required. Positive care duration requires existing care assets. Starting same session ID while active returns its snapshot; starting another session while active fails. Failed start releases active ownership so another attempt can succeed.

`recovery` input: `wordId,word,sourceType,startedAt,libraryEntryId?`. `notification` input: `learningSubtitle,restSubtitle,stressCareSubtitle,pausedSubtitle`; strings are already in chosen app locale. `%{cycle}` and `%{total}` placeholders are substituted by native state. Title is the learning word.

Snapshot: `sessionId,state,elapsedRunningMs,cycle,phase,phaseElapsedMs,isTargetPlaying,savedAt`, optional/null `lastPlaybackStartDelayMs`. Cycle is 1-based. `savedAt` is ISO. Progress observation roughly once per elapsed second, internal transition check roughly every 250 ms. Running elapsed uses a continuous monotonic clock and is capped to total duration. Paused/interrupted intervals do not advance learning time. Recovery checkpoint interval is 15 seconds plus state and phase transitions; a killed process may only have the last checkpoint.

Learning repeatedly plays the entire target audio at normal rate, followed by a silence gap equal to that clip's duration. During the clip no VAD capture is allowed. After playback, an additional echo guard excludes the first 200 ms. Rest permits VAD capture throughout. Stress-care plays one randomly selected bundled track per phase entry and never captures. Within the same phase, pause/resume/interruption retains the chosen care track and resumes at phase elapsed position. Care playback error may leave care silent while keeping session alive. At natural completion the engine stops audio and retains a recovery record until JS commits history.

Presets are 2, 4 or 12 cycles of 600-second learning + 300-second rest + 300-second care (40, 80, 240 minutes). Short custom durations proportionally reduce care (at most a quarter cycle, up to 300 seconds); exact custom UI limits must be confirmed from running-app observation.

## Native VAD and recording contract

Output: 16,000 Hz mono little-endian signed PCM16 RIFF/WAVE. Processed metering windows are 100 ms (1,600 samples). RMS normalized from -60 dB floor to -10 dB ceiling and clamped to 0..1. Defaults: threshold 0.35; sustain 300 ms; release 500 ms; pre-roll 500 ms; echo-tail guard 200 ms; segment ceiling 10,000 ms. Native onset compares strictly greater than threshold; release compares less than or equal. Historical JS VAD used greater-than-or-equal onset: this difference is a bug candidate, not a requirement to reproduce.

A segment includes pre-roll and release tail audio; speech offsets exclude those portions. Both offsets are clamped to [0,durationMs]. Capturing is prohibited while paused/interrupted, during target playback or any stress-care phase. Stopping, phase transitions and audio interruption flush active speech. There is no automatic acoustic echo cancellation; keep the tuning fields exposed to allow device calibration. iOS accepts the hardware input rate and writes 16 kHz mono. Android requests 16 kHz mono MIC input. Actual gain, resampling quality and long-session reliability require physical-device measurements.

## Native persistent handoff files

Captures are saved under current documents `recordings/session-captures/`. Filename: `session-<sessionId>-<lowercase UUID>.wav`. A not-yet-finalized capture is `.<same filename>.tmp` in that directory. Native records the pending manifest before final rename; a referenced temporary file can therefore be finalized on next launch. An ACK removes only the native manifest entry; it must never delete the WAV now owned by persisted JS capture data.

Manifest paths:

- iOS: Application Support/session-audio-engine/pending-captures.json.
- Android: context.filesDir/session-audio-engine/pending-captures.json.
- Format on both: JSON array of `{segmentId,sessionId,uri,fileName,phase,cycle,capturedAt,durationMs,speechStartMs,speechEndMs}`.
- iOS reconstructs URI from current documents capture directory plus filename. Android historical manifest carries absolute URI. Updated-install tests must check Android path continuity.

The `segmentId` is the idempotency key. Persist JS capture plus metadata and verify success before ACK. Retrying the same segment must not create another capture or upload identity. Recover all sessions' outstanding segments; a lone capture may outlive its session recovery marker.

Recovery on iOS: Application Support/session-audio-engine/pending-recovery.json. JSON shape is `{configuration,elapsedRunningMs,cycle,phase,phaseElapsedMs,savedAt,reason?}`. `configuration` contains all start-input fields, but historical configurations can lack `notification`, `stressCareDurationMs`, `stressCareAudioUris`, and notification's `stressCareSubtitle`. Missing care duration means zero; missing tracks means empty. Missing reason means unfinished process termination.

Recovery on Android: SharedPreferences file name `session-audio-engine`, string key `pending-recovery`. JSON shape is `{sessionId,targetAudioUri,captureDirectoryUri,totalDurationMs,learningDurationMs,restDurationMs,stressCareDurationMs?,maxPendingCaptureBytes,recovery,snapshot,reason?}`. It does not store `vad`, care tracks or notification. Missing care duration means zero. `snapshot` has the snapshot fields above.

Recovery reason strings observed: `duration-reached`, `user-stopped`, `failure`, `task-removed`; null/absent indicates checkpoint before final disposition. Type declarations also allowed `interruption`, though interruption usually writes null. Accept the observed `task-removed` string even though the old JS type omitted it.

Cold recovery returns state completed only for reason duration-reached, otherwise failed, and always `isTargetPlaying:false`. The previous app does not restart learning automatically after process death. Save eligible history with exact native session ID, then delete only the matching recovery record. If saving or clearing fails, retry on next launch without duplicate history credit. Less-than-five-minute interrupted sessions may be uncredited, but their captures still require durable handoff before removing recovery context.

## Background, lock screen and interruption expectations

On iOS audio category is simultaneous playback/recording with default speaker and Bluetooth HFP support. During user pause, recording stops logically but the microphone and audio session remain acquired so locked-screen resume can work; the system orange microphone indicator may remain lit. Real phone interruption releases audio; on interruption end, previously running sessions resume only if OS permits. A previously user-paused session remains paused even if audio is reacquired. Resume failure remains recoverable via opening the app and retrying. Device connect/disconnect rebuilds audio while preserving elapsed time; self-induced category-change notices must not recursively rebuild. Media-services reset rebuilds audio resources without unpausing user-paused sessions.

Android requires RECORD_AUDIO, MODIFY_AUDIO_SETTINGS, FOREGROUND_SERVICE, FOREGROUND_SERVICE_MICROPHONE, FOREGROUND_SERVICE_MEDIA_PLAYBACK; foreground service type microphone|mediaPlayback. A paused session retains the service and lock-screen controls while releasing mic/playback/focus (mic indicator goes off). Focus loss, transient loss or duck request interrupts and freezes time; focus gain resumes an interrupted session. Service death while active marks failure. Removing app from recents ends the session, preserves recovery and stops the service; no sticky automatic restart. Starting a mic service from background may be refused and must report failure rather than crash.

Both platforms expose play/pause/stop and whole-session elapsed time on lock screen, with no seeking requirement. Android notification channel identity `buddybird-training-session`, notification ID 4021; silent low-importance public media notification, word title and phase/cycle subtitle. Notification dismissal ends the session. Android action names were `com.joynnovate.buddybird.sessionaudio.START`, `.STOP`, `.PAUSE`, `.RESUME`; preserving their identity avoids stale pending intent surprises across updates.

## Known uncertainty and acceptance tests

1. No device/app was launched by this investigator. Native assertions above derive from public command behavior and persistence reads; actual phone, Bluetooth, locked-screen and process-death behavior needs observation.
2. Migration must be tested with both current and historical synthetic fixtures, plus a real v1.1.0 updated install. Synthetic fixtures cannot prove preservation of Firebase UID, image picker cache paths, real audio files or native storage sandbox locations.
3. Historical pethub application identity and unpublished word-upload-state may never be present in supported installations. Preserve opaque originals if encountered and avoid making unsupported identity merges.
4. Previous release evicts unuploaded captures above 500 MiB, drops some malformed records, and can abandon pending captures of an uncredited short interrupted session. These are bug/data-loss candidates. The rewrite's preservation requirements take precedence; do not duplicate those losses.
5. Explicit release verification remains required for failure between file write/manifest write/rename, between JS save/ACK, and between history credit/recovery clear; partial upload responses; MMKV write/readback failure; and stale absolute iOS media paths.

## Final clarifications for implementation

The Expo native module name on both platforms is exactly `SessionAudioEngine`. Event names are exactly `onStateChanged`, `onProgress`, `onSegmentCaptured`, `onFailure`. Async command names are the camelCase names listed above. `onStateChanged` and `onProgress` payloads are direct snapshot objects (not wrapped in `{snapshot}`). `onSegmentCaptured` payload is a direct captured-segment object; `onFailure` is a direct failure object. Both implementations emitted `recoverable:false` on failure events even though some command rejections could be retried; this discrepancy is not a reason to prohibit a new recovery flow.

`recovery.word` is a plain display-label string, never a word object. `recovery.sourceType` is required, and its only valid values are `preset` or `recording`; the same two-value requirement applies to persisted word/session `sourceType`. Missing sourceType has no documented fallback. The only optional recovery field is `libraryEntryId`; missing `notification` and care fields are historical native configuration variants, not optional identity fields.

Legacy exported recovery does **not** contain a complete word snapshot: it has word ID, display label, source type, optional library entry ID and start time, but lacks presetKey, locale, tag, recordingId and audio reference. The on-disk native configuration additionally has `targetAudioUri`, but exported recovery omits it. Thus if both the relevant training word and current library entry are absent, the old public recovery output cannot reconstruct the original preset or complete recording identity. Preserve the partial snapshot and original IDs; do not synthesize a presetKey from the label. A rewrite may extend its own future recovery format with the needed immutable word/audio snapshot while keeping legacy records readable. The previous app expected the training word to exist before crediting history, and would retain recovery on that save failure.

Stress-care permitted assets: `assets/audio/stress-care/track-02.m4a`, `track-03.m4a`, `track-04.m4a`. Each is a five-minute track. Retain these bytes; choose once per care phase/cycle and resume within that same file after pause.

At the maximum segment length, speech offset semantics stay local to each WAV. `speechEndMs` is max(speechStartMs, durationMs minus below-threshold tail duration). Example: speech active with 200 ms pre-roll, 10,000 ms segment ceiling and no quiet tail gives `[speechStartMs:200,speechEndMs:10000]`; a 200 ms quiet tail when hitting that ceiling gives end 9800. Detection resets for the next segment. With continuous loud audio, the next 300 ms satisfy onset and form the initial audio of a separate segment whose speechStartMs is zero. There is no intentional cross-file overlap or copied previous WAV tail. At normal 500 ms release the tail remains in audio but lies after speechEndMs. Phase transition/stop can flush before the full release duration. Each segment's offsets must satisfy `0 <= speechStartMs <= speechEndMs <= durationMs`.

The supplied JSON fixtures have real key/field spelling but synthetic IDs, timestamps, tokens and file paths. Their files do not exist and they do not prove device migration.
