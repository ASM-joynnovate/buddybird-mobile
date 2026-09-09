# BuddyBird 1.1.0 API, identity, policy, and deployment contracts

Baseline: Git commit `d5464b7` (marketing version 1.1.0). Written 2026-09-09. This is a clean-room compatibility specification. Every behavioral claim below is **inferred from baseline executable source/configuration**, not observed in a running 1.1.0 app and not validated against production servers. No original implementation, tests, architecture, translations, or conventions are included. Examples are synthetic. Runtime observation and server-side confirmation remain separate acceptance work.

## Network surface

The inspected mobile client has two custom HTTP operations: reference audio upload and capture ZIP upload. There is no custom REST read endpoint. Other server operations use native Firebase SDKs: anonymous authentication, Remote Config fetch/activation, create-only Firestore feedback, FCM registration, Analytics, and Crashlytics. Microsoft Clarity handles analytics/replay separately. A rewrite may expose Firebase reads/writes through Query-compatible async functions; do not invent additional REST endpoints.

The collection origin is supplied as `EXPO_PUBLIC_API_BASE_URL` and exposed as nonblank trimmed app configuration `apiBaseUrl`. The local ignored configuration currently points to `https://dev.buddybird.xyz`; a production origin was not verified. Remove trailing slashes before appending endpoint paths. Blank/missing origin disables uploads and must not delete queued files. No Authorization header or Firebase bearer token is attached to collection requests: identity is a multipart text field `firebase_anon_uid`. Preserve this wire contract unless separately coordinated with the server. Native fetch supplies the multipart boundary; do not manually set multipart Content-Type.

Both HTTP operations have a timeout covering the fetch **and response body read**. Network failures, abort/timeouts and unexpected status codes retain data and stop the current drain. Transport performs one attempt. Retries are owned by the persistent worker, so TanStack mutations must disable automatic retries for these operations. Caller cancellation in the new API should stop work and retain pending data; the baseline only exposes timeout cancellation. Disabling consent must prevent additional requests once the current request finishes; recheck the grant before each request, including split requests.

## Reference audio: POST /api/v1/words

Send exactly these multipart parts:

| Part | Type and meaning |
|---|---|
| `client_word_id` | Stable local library entry ID, e.g. `wentry-synthetic-01`; never mint a new ID merely because uploading |
| `firebase_anon_uid` | Current restored Firebase anonymous UID |
| `label` | Word label, truncated for transmission to 50 Unicode code points; preserve full local label |
| `device_platform` | `iOS` or `Android` |
| `device_os_version` | OS version or empty string, maximum 20 Unicode code points |
| `device_model` | Model name or empty string, maximum 30 Unicode code points |
| `audio_file` | Original reference audio file, with last URI path component as filename (ignore URI query); fallback filename `reference-audio.m4a` |

MIME mapping: m4a → `audio/x-m4a`, mp4 → `audio/mp4`, wav → `audio/wav`, mp3 → `audio/mpeg`, aac → `audio/aac`, otherwise `application/octet-stream`. The mobile contract assumes server content sniffing. Timeout is 30,000 ms. Baseline recordings have a 60-second upper bound.

Response decisions:

| Response | Required outcome |
|---|---|
| 2xx | Reference accepted. Response body is not needed. Keep the user's word and reference file. |
| 4xx | Report rejection, optionally read string `error_code` from JSON body, continue to next word. Keep word and file. |
| 5xx, transport failure, timeout, other status | Stop drain, retain all user data, retry only on the next worker trigger. |

A non-JSON or malformed 4xx body does not change status-based decisions. No exact enumeration of `error_code` was present in the inspected client. It refers to three file validation failures sharing HTTP 400; do not fabricate codes.

Only user-recorded words are sent; bundled presets are server-seeded. Oldest `createdAt` first; one request at a time. Missing/unreadable reference files skip upload without deleting words. Trigger on creation of that word, cold start (after restored/first acquired UID), and persisted consent change to granted. The baseline does not trigger word resends on foreground or network recovery. The baseline deliberately keeps no permanent successful/rejected word ledger and resends recorded words on future cold starts, including previous 4xx rejections. Preserving this behavior is necessary for server data recollection. Server idempotency by `(firebase_anon_uid, client_word_id)` is **asserted by baseline comments but not independently verified**. Multiple simultaneous triggers must not create concurrent drains.

Synthetic form:

```text
client_word_id=wentry-synthetic-01
firebase_anon_uid=synthetic-anonymous-uid
label=Hello
device_platform=iOS
device_os_version=18.5
device_model=iPhone
audio_file=(binary reference-synthetic.m4a; audio/x-m4a)
```

## Captures: POST /api/v1/captures

Send multipart text fields `firebase_anon_uid`, `device_platform`, `device_os_version`, `device_model` with identical identity/device rules. `metadata` is a JSON array encoded as text. `file` is a ZIP named `captures.zip`, MIME `application/zip`. Each metadata `file_name` must exactly match its ZIP entry, and only readable files actually included in the ZIP may be represented.

Metadata contract:

| Field | Meaning |
|---|---|
| `client_capture_id` | Stable capture ID, also the server response key |
| `client_word_id` | Preset: `preset-<presetKey>`; recorded word: original library entry ID. If neither mapping survives, retain the capture's original word ID rather than creating a replacement. |
| `client_session_id` | Stable session ID |
| `cycle` | Capture cycle number, preserve existing value |
| `phase` | `LE` for learning, `RE` for rest; no stress-care uploads |
| `captured_at` | Capture timestamp normalized to UTC ISO 8601 when parseable |
| `file_name` | Filename inside ZIP, generally `session-<sessionId>-<captureId>.wav` |
| `app_version` | Optional marketing version, max 12 Unicode code points |
| `parrot_species` | Optional capture-time species snapshot, max 50 Unicode code points |
| `parrot_birthdate` | Optional capture-time birth date, local calendar `YYYY-MM-DD` |

Metadata snapshots must not silently change after profile editing. Legacy captures missing server word ID and profile metadata receive a one-time persisted backfill before sending. Preset server IDs are independent of localized display labels. Unknown/deleted-word fallbacks may result in a null server join, but the original ID remains meaningful.

Batch ordering is oldest `capturedAt` first. Maximum 10 captures. Baseline limits source-file sum to 9 MiB to target server ZIP limit ≤10 MiB and uses DEFLATE level 2. An individually oversized capture is still sent alone for server judgment; do not let it permanently block the queue. Timeout is 60,000 ms. Temporary ZIPs may be deleted after any outcome; source recordings follow the outcome rules below. Leftover temporary ZIPs from killed processes can be removed before creating new batches.

Synthetic metadata and partial response:

```json
[
  {"client_capture_id":"capture-synthetic-a","client_word_id":"preset-default_hello","client_session_id":"session-synthetic-01","cycle":1,"phase":"LE","captured_at":"2026-09-09T00:00:00.000Z","file_name":"session-session-synthetic-01-capture-synthetic-a.wav","app_version":"1.1.0","parrot_species":"budgerigar","parrot_birthdate":"2025-01-02"},
  {"client_capture_id":"capture-synthetic-b","client_word_id":"wentry-synthetic-01","client_session_id":"session-synthetic-01","cycle":1,"phase":"RE","captured_at":"2026-09-09T00:01:00.000Z","file_name":"session-session-synthetic-01-capture-synthetic-b.wav"},
  {"client_capture_id":"capture-synthetic-c","client_word_id":"wentry-synthetic-01","client_session_id":"session-synthetic-01","cycle":1,"phase":"RE","captured_at":"2026-09-09T00:02:00.000Z","file_name":"session-session-synthetic-01-capture-synthetic-c.wav"}
]
```

```json
{"data":{"capture-synthetic-a":{"status":"success"},"capture-synthetic-b":{"status":"rejected"}}}
```

For that response, remove a and b from pending queue and delete their capture files; c stays pending with its file. Ignore response entries not actually sent. A rejection must be reported. Reference audio files are never removed by capture queue cleanup.

| HTTP/item outcome | Queue/file policy |
|---|---|
| Any 2xx with `data[id].status === 'success'` | Remove only that capture and file after persistent queue update succeeds. Emit success telemetry. |
| Any 2xx with item `rejected` | Remove only that capture and file, report server rejection. |
| Any 2xx missing ID, unknown item status, null/invalid JSON | Keep unresolved capture/file. If no item resolved, halt instead of retrying forever in the same drain. |
| Request 4xx, >1 sent item | Split the actual sent items into single-item requests. |
| Request 4xx, single sent item | Report and discard that rejected capture/file. |
| Request 5xx, no response, timeout, unexpected status | Retain queue and files; halt. |
| Local file absent | Remove stale queue entry only. |
| Existing file cannot be read | Baseline discards as unreadable; see preservation risk below before reproducing blindly. |

Progressing partial responses allow the drain to continue with remaining captures. Split requests must use identical metadata and identifiers. Server idempotency by `(firebase_anon_uid, client_capture_id)` is asserted by baseline comments, not independently verified.

Triggers: queue reaches 10; session ends (including persisted interrupted-session recovery); cold start after UID becomes available; inactive/background → active; disconnected → connected; consent successfully persisted as granted. Keep one capture drain at a time and coalesce triggers that arrive while busy. After a transient failure, suppress repeated accumulation-only retries until another trigger signals changed conditions; otherwise every captured sound causes repeated ZIP work while offline. If only accumulation triggers arrived during the failed request, they do not bypass that suppression. Reference upload and capture upload are independent; do not require a reference upload to succeed before preserving/sending captures.

## Identity and Firebase

The default native Firebase app owns authentication persistence. Read `currentUser.uid` and reuse any current user; call anonymous sign-in only if none exists. Coalesce concurrent anonymous sign-ins to avoid multiple UIDs. On startup, subscribe to auth changes; if first startup is offline, local app use is allowed, uploads remain gated, and foreground entry retries anonymous sign-in while UID remains absent. Feedback additionally ensures authentication before write. An app update must retain the same app ID, Firebase project and native auth persistence/keychain namespace. Do not transfer the UID into a new fabricated anonymous account or sign out during migration.

Firebase identity files are provided as approved portable configuration, copied from local ignored deployment configuration, not baseline Git (they were not versioned):

| Variant | App ID for iOS and Android | Firebase project |
|---|---|---|
| production | `com.joynnovate.buddybird` | `buddybird-9b84d` |
| development/staging | `com.joynnovate.buddybird.dev` | `buddybird-dev` |

Analytics user ID, Crashlytics user ID, Clarity custom user ID, collection multipart UID, and feedback `userId` all refer to this same native auth UID. Upload consent does not determine whether anonymous auth is initialized.

## Consent and telemetry

There are two separate decisions:

1. **Audio collection:** persisted status `unknown|granted|denied`, decision timestamp, notice version. Only `granted` plus a nonblank UID and collection origin permits uploads. Consent notice version is 1. Unknown or denied without decision time is prompted; denied is asked again only at a cold start ≥30 elapsed days later; granted is not prompted. Notice-version changes alone do not force a reprompt. Persist the decision before permitting uploads. Refusing does not disable recording, learning, or other local features. Capture generation/queueing is independent of upload consent.
2. **iOS tracking/analytics:** OS ATT status; request only while undetermined, treat unresolved result as denied. Android uses `not_applicable`. Collection allowed for granted/not_applicable, disabled for denied/unknown. This controls Firebase Analytics, Crashlytics, and Clarity capture. Preserve stored state but re-read OS state, which is authoritative.

Audio notice semantic commitments to preserve in newly written Korean/English copy: training sounds are collected to develop/improve parrot pronunciation learning; storage is anonymous without account information; recordings automatically deleted after 180 days; declining has no effect on service access. The 180-day server retention promise and anonymity wording are baseline UI policy claims, **not independently verified operational facts**. Confirm server retention before release. Feedback form separately warns against entering the guardian's personal information.

Prompt order is splash finished → update decision/prompt → audio consent → feedback. Forced updates remain blocking; audio consent requires agree or decline rather than dismissal. Feedback's periodic prompt must wait for consent resolution.

Firebase receives event names capped at 40 characters and parameter names capped at 40. Strings cap at 100 characters, arrays become comma-joined strings capped at 100, null/undefined and nonfinite numbers are omitted. Baseline caps by JS UTF-16 slicing, unlike upload limits which count Unicode code points. Clarity receives the event name plus custom tags named `<event>.<param>`; arrays comma-join; null/undefined omitted. `screen_view` has `screen_name` and `screen_class` (default equal to name). Screen names: `onboarding_welcome`, `onboarding_profile`, `session_setup`, `words`, `profile`, `session_active`.

Clarity default project ID is `wre3hgbj48`, with configuration override `EXPO_PUBLIC_CLARITY_PROJECT_ID`. Clarity replay is paused throughout the active-session screen to avoid memory pressure, including after Clarity starts a new session while the screen remains mounted. Leaving that screen resumes replay only if analytics consent permits it. Other telemetry continues subject to analytics consent.

User property keys: `profile_age_days`, `parrot_name`, `parrot_species`, `parrot_age_months`, `total_words_registered`, `total_training_sessions`, `total_recording_duration_sec`, `locale`. Firebase properties are string/null; Crashlytics receives non-null attributes; Clarity receives non-null tags.

### Event payload contracts

These are the baseline declared telemetry schemas; some names may have no currently reachable emitter. Runtime verification must establish timing and reachability, rather than emitting every declared event artificially.

`?` means optional; `[]` means list before Firebase serialization. IDs and names retain their baseline meanings. All durations use milliseconds unless explicitly named seconds.

| Event | Fields |
|---|---|
| `app_open` | `cold_start:boolean` |
| `app_foreground` | none |
| `app_background` | `session_duration_ms:number` |
| `update_prompt_shown`, `update_prompt_accepted` | `latest_version:string, is_forced:boolean` |
| `update_prompt_dismissed` | `latest_version:string` |
| `onboarding_started` | none |
| `onboarding_step_completed` | `step:welcome|profile, duration_ms:number` |
| `onboarding_completed` | `total_duration_ms:number` |
| `onboarding_abandoned` | `last_step:welcome|profile, last_step_duration_ms:number` |
| `profile_created` | `parrot_name:string, parrot_species:string, parrot_age_months?:number` |
| `profile_updated` | `fields_changed:string[], parrot_name?:string, parrot_species?:string, parrot_age_months?:number` |
| `profile_deleted` | `parrot_name:string, lifetime_session_count:number` |
| `training_session_started` | `session_id:string, word_count:number, target_word_ids:string[], target_word_names:string[], profile_age_days:number, parrot_species:string, parrot_name:string` |
| `word_selected` | `session_id:string, word_id:string, word_name:string, source:list|recommendation|search` |
| `word_practice_started` | `session_id, word_id, word_name:string; attempt_number, cumulative_practice_count, cumulative_practice_duration_ms:number` |
| `word_recorded` | `session_id, word_id, word_name:string; attempt_number, recording_duration_ms, audio_size_bytes:number; recording_method:voice|upload` |
| `recording_played` | `session_id, word_id, word_name:string; play_count, playback_duration_ms:number` |
| `word_practice_completed` | `session_id, word_id, word_name:string; practice_duration_ms, recordings_count, replay_count:number` |
| `training_session_completed` | `session_id:string; total_duration_ms, words_practiced_count, words_recorded_count, words_skipped_count, total_recordings, avg_recording_duration_ms:number` |
| `training_session_abandoned` | `session_id:string; duration_ms, progress_percent:number; last_word_id, last_word_name:string|null` |
| `training_session_backgrounded` | `session_id:string, phase:learning|rest|stress-care, elapsed_seconds:number` |
| `follow_along_capture_created` | `client_capture_id, session_id, client_word_id:string; cycle:number; phase:learning|rest; audio_size_bytes, pending_count:number` |
| `capture_upload_succeeded` | `client_capture_id:string, latency_ms?:number, batch_size:number, is_retry_single:boolean` |
| `capture_upload_failed` | `client_capture_id:string, reason:server_reject|network_error|server_error, age_ms?:number, http_status?:number` |
| `capture_flush_aborted` | `reason:server_error|network_error|unreadable_response|exception, pending_count?:number, succeeded_before_abort:number, http_status?:number` |
| `capture_evicted_before_upload` | `client_capture_id:string, age_ms?:number, audio_size_bytes:number` |
| `session_perf_degraded` | `kind:audio_delay|ui_lag, value_ms:number, during_upload:boolean, session_id:string, consent_status:unknown|granted|denied` |
| `word_library_opened` | `total_words_count:number` |
| `word_library_filter_changed` | `from:string, to:string, visible_words_count:number` |
| `word_library_preview_played` | `word_id:string, word_name:string, source_type:preset|recording, action:play|stop` |
| `word_added` | `word_id:string, word_name:string, category:string|null, registration_method:text|voice_recording, recording_duration_ms?:number, audio_size_bytes?:number` |
| `word_recording_started` | `word_name:string` |
| `word_recording_finished` | `word_name:string, recording_duration_ms:number, retry_count:number` |
| `word_removed` | `word_id:string, word_name:string, lifetime_practice_count:number, lifetime_practice_duration_ms:number` |
| `word_lifetime_metrics` | `word_id:string, word_name:string, lifetime_practice_count:number, lifetime_practice_duration_ms:number, lifetime_recording_count:number, last_practiced_at_days_ago:number` |
| `tab_switched`, `language_changed` | `from:string, to:string` |
| `feedback_prompt_shown`, `feedback_prompt_dismissed` | `threshold:number` |
| `feedback_submitted` | `source:prompt|profile, message_length:number` |
| `app_error` | `error_code:string, screen_name:string|null` |

A whole drain failure emits `capture_flush_aborted` once after settling, with successfully removed captures counted and pending_count sampled from persistent state; omit count if storage is unreadable. Item rejection emits `capture_upload_failed` with `server_reject`; include `http_status` only for single-item request 4xx, not item rejection in 2xx. Successful/rejected capture telemetry follows successful local queue removal. Unknown capture timestamp omits age/latency. Performance degradation thresholds are strictly >200 ms for audio-delay and UI-lag; UI samples every 100 ms; each kind limits emission to once per 5 seconds and 20 times per session. Audio consent is a cohort label, not the telemetry permission gate.

Uncaught errors and unhandled rejections report Crashlytics context `scope`, `screen_name?`, `is_fatal?`, and `app_error` with error name or `UnknownError`. Preserve existing platform error handler behavior after reporting. Operational errors may set only `scope`.

## Feedback

Firestore collection `feedback`, create a new document only, under the same default native Firebase app. Required document fields are:

```json
{"userId":"synthetic-anonymous-uid","message":"Please add another practice duration.","appVersion":"1.1.0","platform":"ios","locale":"en","createdAt":"<Firestore serverTimestamp sentinel>"}
```

`createdAt` is a server timestamp sentinel, not a client ISO string. `platform` is native `ios|android`; `locale` is `ko|en`. Ensure Firebase auth first, then require a UID. Trim message, reject empty input, max 1000 characters. Baseline comments assert Firestore Rules require authenticated UID == document `userId` and a 1000-character bound; rules themselves were not present in mobile code and were not verified. No server reads/updates/deletes by the mobile app were found.

Suppress duplicate presses while submitting. While submitting, disable text editing, submit, cancel, backdrop dismissal. Show inline error and retry without losing text; on success show thank-you state. Do not log message text in analytics, only trimmed length. Profile has permanent entry; periodic home prompt has `source:prompt`. The periodic prompt counts distinct local calendar active days, once per day on cold start/foreground. Thresholds are 3, then 5, then 7, then 10 forever. Dismissal or entering the form from the prompt resets day count to zero and advances the threshold, even if no submission follows. Opening directly from profile does not consume the periodic prompt. Opening/submitting the form must not stack duplicate prompts. Baseline submission has no automatic retry or custom timeout beyond Firebase SDK behavior.

## Updates

Firebase Remote Config keys: `latest_version` string, `min_supported_version` string, `release_notes` JSON text (`{"ko":["..."],"en":["..."]}`). Defaults: empty latest/minimum, `{}` notes. Trim versions; empty latest means no prompt. Keep only strings in supported note arrays; invalid notes produce empty notes. Notes choose current locale, then English, then empty list.

Use marketing version (`nativeApplicationVersion`, configuration version fallback). Comparison allows optional leading v/V, one to three integer components (missing minor/patch = 0), ignores prerelease/build suffixes, rejects malformed numeric cores. Invalid comparison means no prompt. If installed < minimum, forced update overrides prior dismissal. Otherwise installed < latest gives soft prompt unless that exact latest version was dismissed. Installed ≥ latest gives none.

Cold start fetches once after analytics setup. Background/inactive → active checks again at most every 6 hours, including after previous fetch failure. Native Remote Config cache interval is also 6 hours (0 in development). No blocking prompt on fetch failure. Record `lastCheckedAt` when fetch attempted. Soft dismissal persists the specific latest version; forced prompt cannot dismiss. Accepting opens store, closes soft prompt, leaves forced prompt displayed. Show-event deduplication is by currently shown latest version.

Store targets: iOS production app ID `6783652711`, development/staging `6784253530`; `itms-apps://apps.apple.com/app/id<id>` with HTTPS fallback. Android uses installed `applicationId` in `market://details?id=<id>`, HTTPS Play fallback.

## Push

FCM permission/token registration starts after a profile exists. iOS maps Firebase authorization states to `not_determined|denied|authorized|provisional|ephemeral`. Token retrieval occurs only for authorized/provisional. Android <API 33 behaves authorized; API 33+ requests POST_NOTIFICATIONS. Persist latest token, authorization state, and ISO update time. On token refresh persist token with current permission state.

Listen for foreground messages, background/headless messages, notification-open, and initial launch notification. Record receipt metadata only: message ID, from, sentTime, source (`foreground|background|notification_opened`), ISO receivedAt. Keep newest 20. No token upload endpoint, topic subscription, custom push action, or deep-link payload interpretation was found. iOS Firebase background headless launch must not mount normal interactive app and initiate normal bootstrap side effects. Android background message handler runs without UI. Preserve OS-delivered notifications and native push entitlements.

## Additional old storage keys to migrate

All values except analytics consent are JSON encoded in AsyncStorage. These are interface contracts, not a recommendation for new storage layout.

| Key | Example / shape |
|---|---|
| `@buddybird/analytics-consent` | plain text `unknown`, `granted`, `denied`, or `not_applicable` |
| `@buddybird/upload-consent` | `{"status":"granted","decidedAt":"2026-08-01T00:00:00.000Z","noticeVersion":1}` |
| `@buddybird/app-update` | `{"dismissedVersion":"1.2.0","lastCheckedAt":1788900000000}`; either field may be null |
| `@buddybird/feedback-prompt` | `{"version":1,"lastCountedDate":"2026-09-09","dayCount":2,"thresholdIndex":1}` |
| `@buddybird/fcm-registration` | `{"token":"synthetic-token","authorizationStatus":"authorized","updatedAt":"2026-09-09T00:00:00.000Z"}`; token may be null |
| `@buddybird/fcm-message-receipts` | JSON array of `{messageId:string|null,from:string|null,sentTime:number|null,source,receivedAt:string}` |

Do not copy baseline fallback-to-default error handling into migration: the rewrite plan requires preserving originals, write/read verification, a final completion marker, and blocking data mutation/training/upload on failed migration.

## Deployment compatibility

Production name `버디버드`, dev name `버디버드 (DEV)`; scheme `buddybird` / `buddybird-dev`. Expo slug `buddybird`, owner `joynnovate0410`, EAS project `f00b95df-f52f-4021-8543-47971d4fa55e`. App orientation portrait; supports iPad; automatic interface style. Branding assets are portable files. Splash color `#DB030F`; adaptive icon background `#E0010E`.

`APP_VARIANT=production` selects production; all other/default values development. Firebase override environment paths are `GOOGLE_SERVICES_INFO_PLIST` and `GOOGLE_SERVICES_JSON`; fallback portable paths are `config/dev/firebase/*` / `config/prod/firebase/*`. Never replace production identity with dev merely to get a build passing.

No baseline `updates.url`, `runtimeVersion`, or runtime policy is configured. EAS channel names and the installed expo-updates dependency do not establish enabled OTA updates. Preserve the Remote Config → native-store update path; do not introduce fingerprint runtime/OTA routing without a separate decision.

EAS CLI minimum 18.13.1 and remote appVersionSource; Yarn 4.14.1; baseline CI uses Node 22. Development is internal development-client/channel development. Preview is internal/channel preview. Staging is store distribution/channel staging/EAS environment preview, development app identity, remote autoIncrement. Production uses production identity/channel production and autoIncrement. Preserve exported eas.json submit values and credentials references. Production signing material itself was not inspected/exported; remote EAS/signing identities must be reused. Baseline production build workflow did not automatically submit: actual store promotion/review was a manual release gate. No release submission was performed in this investigation.

Required environment/secret references for existing release infrastructure: `EXPO_TOKEN`, `GOOGLE_SERVICES_INFO_PLIST_DEV_BASE64`, `GOOGLE_SERVICES_JSON_DEV_BASE64`, production counterparts ending `_PROD_BASE64`, `PLAY_SERVICE_ACCOUNT_BASE64`, `ASC_API_KEY_P8_BASE64`, plus profile-specific public collection origin. Exported eas.json references temporary Play service-account and ASC key paths; those credential files are not included.

Native capabilities: iOS `aps-environment` matching development/production, background modes audio and remote-notification, microphone permission explanation, ATT permission explanation, standard HTTPS-only nonexempt-encryption flag false. Android RECORD_AUDIO, MODIFY_AUDIO_SETTINGS, POST_NOTIFICATIONS, FOREGROUND_SERVICE, FOREGROUND_SERVICE_MICROPHONE, FOREGROUND_SERVICE_MEDIA_PLAYBACK, AD_ID. Learning service is nonexported, foreground service type microphone|mediaPlayback and not stopped solely by task removal. iOS engine requires AVFoundation and MediaPlayer. Preserve lock-screen playback/remote controls separately through new engine implementation.

Baseline Firebase iOS linking used static frameworks and RNFirebase static-framework mode for App/Analytics/Auth/Crashlytics/Firestore/Messaging/RemoteConfig. Do not copy old plugins: establish Expo 55-compatible configuration from current official documentation and actual build errors. Existing source also contains Android dev-launcher delegate-null guards and a Gradle heap setting; these are historical compatibility workarounds, not app data/deployment contracts. Reproduce failure before adding new equivalents. Original image-picker patch and other code/config plugin implementations were not exported.

Firebase portable firebase.json enables auto Analytics/Crashlytics collection (debug Crashlytics disabled), but runtime then applies ATT consent. This startup ordering is a privacy-risk candidate requiring explicit review rather than blindly preserving initial auto-collection before consent.

## Artifacts and provenance

`portable/manifest.json` enumerates 24 approved copied files with SHA256: 18 image/font/audio assets from baseline Git, 4 locally supplied Firebase identity files, baseline eas.json and firebase.json. No original JS/TS/Swift/Kotlin product source or tests are in portable. Translation text is not exported.

No local prebuilt app matching v1.1.0 was found. Existing simulator/DerivedData/archive artifacts inspected by the runtime observer were older; Android local debug APK is dev 0.10.0. A separate investigator-only baseline archive at `/private/tmp/buddybird-baseline-d5464b7` was made directly from d5464b7 with matching separately cloned dependencies and local Firebase configuration. Its `BASELINE_PROVENANCE.json` records inputs. The isolated iOS Release build subsequently succeeded (0 errors, 13 warnings), with Info.plist confirming development app ID, version 1.1.0, build 1 and an embedded JS bundle. Artifact metadata is in `baseline-artifact.json`. Build required only a canonical `ENTRY_FILE` environment path to avoid the macOS `/tmp` alias mismatch; no product source was modified. The runtime observer must verify behavior independently. Never move this baseline product source into the rewrite.

## Unverified guarantees and risk candidates

- Server idempotency, request file/type/size constraints, actual error-code enumeration, Firestore Rules, and 180-day retention require server contract confirmation. Mobile evidence is sufficient to preserve emitted wire shape but not prove server behavior.
- Treating an existing-but-unreadable capture as permanently missing can destroy recoverable audio. The rewrite's data-preservation requirement should favor retaining/reporting files on transient I/O failures; record any accepted behavioral change.
- A blanket single-item 4xx discard includes configuration/auth/proxy errors; validate collection origin and preserve evidence before applying that destructive branch. This is the inferred baseline policy, not proof that every 4xx is a bad clip.
- Consent UI originally changed visible state before persistence finished; new upload authorization must depend on durable consent and expose storage failure.
- FCM receipt persistence and feedback/update local state historically had permissive fallbacks. Migration must not silently reset them.
- Native real-device behaviors, actual bilingual screen parity, and store-signature continuity are not verified by this investigation.

## Evidence identifiers

The source-owning artifacts below are cited as immutable Git blob IDs to avoid transmitting the old source tree to implementation. They were inspected only by the compatibility investigator at d5464b7. No contents are reproduced. Firebase local identity file provenance is separately hashed in portable/manifest.json.

- Collection multipart fields and transport: `7629f5ac26535338f04eb5ed55b7fa0d01a8bcb4`, `1fb0dd10de2af302e10a3906d663265d48c9ecc5`, `18fbf8761737b6a4d433ceac587a6733d65d2e1f`, `3103637128db5fb79b0fca12715a3a142554d328`, `5733bcbad6e6e73f078fd635d993b3b209632d6d`.
- Collection responses and retry triggers: `c9f5c39613a21255600b156fa4b089fda19c315d`, `3f89efb4ed46f55d734cd988b10fb0eded741128`, `182221ba6fc6a24814527167ca1894e04041bc06`, `b7b6efdaa70b2f610f251ba3006f256bf971154c`, `ee8f8b03509ef543c5b4d7061b99d217ea10be29`, `3d7aa35d81ac03fabde13d4c1f9773c561df0540`.
- Identity and consent: `b87270b108c620e05b7850a99289264370c4883e`, `57678a3c33e7c5a932812be9c3d7e948c4ef1cdc`, `cbab110c20f401e6c5e1193073a553496189e7af`, `175102a330936bd44080cc242ad1e351af21f2f5`, `de3bb3b6e6cc46a32d525bba57b38b208f688d79`, `20391899bfcd45b988ebe6a0ea8a121647961ded`.
- Telemetry schemas and delivery: `e3282d89e678de827e32236512b2ff3c2f324efd`, `58f209f7b890806a89999da174fb810317247a81`, `65f8b3802604116015459288646864dd2a7295f9`, `e4ed189905dd6d9b87e4812741e0fa92d55f1c43`.
- Feedback: `0ae988ec5a01a407ecee64dcb23e6509ffd60acc`, `212305dddaccd6ccb717b74d792634d8eab95aa8`, `44e6007ac674d2537604727a062c331d5ac21251`, `7c25a8a23b6cc6720d77c5ccf316096ddd818588`.
- Remote update and store: `34456c662a8193b0faa838947070d6f36103816b`, `1d37b92968cf665ac4fae557344260e8607e4d97`, `0d9d0d3f9b6ee6fe9ac3b2c40267f9d361d13ef7`, `9ba2477db5d25375828c305da3cd0d088e1e27b3`, `8cd80cb65d1105194c8cbd831b0af8d1012a99e3`.
- Push: `64a8bd404d1f353eba0254ee93b348090bc6f6b0`, `da070bff0629c2374060041651e70cdd970e34d9`, `536b1ac0bbaf4bcdf7117b0849d357de428a6259`, `86fdb0ffb19e69d7d85166dadace114b9bb7ae10`.
- Deployment: `9a4d0ca1acdb40bc1000978fd3392e420c81fa9d`, `2b5ace35ad6fdd53fbc478b9915ee8de769bebd2`, `e88776e5b86f5e6ee9a0ab973187943cb48c81da`, `541ae524ed175ea20a4df2714995753f9f473718`, `2d0025a1a9d64c698409b40bae712976d96b0b15`.
