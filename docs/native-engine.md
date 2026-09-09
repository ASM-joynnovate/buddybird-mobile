# Native learning engine

The new `SessionAudioEngine` Expo module owns the active learning session on both platforms. Its TypeScript boundary is `modules/session-audio-engine/index.ts`. It emits direct `onStateChanged`, `onProgress`, `onSegmentCaptured`, and `onFailure` payloads. All commands return promises. The app must request microphone permission before `start` and resolve assets to readable local `file://` URLs.

The implementations use AVAudioEngine/AVAudioPlayer/AVAudioSession on iOS and AudioRecord/MediaPlayer/AudioManager with a foreground Service on Android. There is no JavaScript audio scheduler. iOS measures running time with `mach_continuous_time`; Android uses `SystemClock.elapsedRealtime`. Timers examine transitions every 250 ms and emit progress once per elapsed second. Paused and interrupted intervals freeze running time. Completion at an exact cycle boundary reports the last phase of the last completed cycle.

Learning repeats a complete target clip followed by a silent gap of the same duration. VAD runs only during that gap after the echo guard, or throughout rest. Each care phase selects a track once and resumes that file at the phase position after a pause. A care-track failure reports a recoverable failure while the session remains alive. A target or microphone failure ends the session with retained recovery.

The engine accepts 100 ms VAD windows, a strict `meter > threshold` onset, sustain/release/pre-roll/echo-guard tuning, and a segment ceiling. Defaults are exported as `defaultVAD`. WAV output is 16 kHz, mono signed little-endian PCM16. iOS converts the actual microphone input format through AVAudioConverter; Android requests 16 kHz MIC input. Speech offsets exclude the pre-roll and quiet release tail. Ceiling splits reset detection and never copy audio from a preceding WAV. No acoustic echo cancellation is assumed. Calibration intervals are bounded to 60 seconds; total and phase durations are bounded to one year and representable cycle counts. These bounds reject malformed bridge inputs before native arithmetic or allocation.

## Background and media controls

On iOS, the category is simultaneous play/record with default speaker and Bluetooth HFP. The microphone remains acquired during a user pause so lock-screen resume stays possible. New native files explicitly use protection until first user authentication, allowing ongoing capture and checkpoint writes after the screen locks. A phone interruption releases audio and freezes time; resumption occurs only when the OS permits and the user had been running. Route changes and media-services resets rebuild resources while preserving position and a user pause. The config plugin declares the audio background mode and microphone usage description.

Android uses a non-exported microphone/mediaPlayback foreground service and a partial wake lock while running. Pause releases the microphone, playback, wake lock, and focus while keeping media controls. Focus loss, transient loss, and duck requests freeze time; focus gain resumes interrupted sessions. The notification channel is `buddybird-training-session`, ID 4021. It exposes play/pause/stop and elapsed session time; dismissal and removing the app from recents stop the session. The service returns `START_NOT_STICKY`; stale notification actions cannot restore a dead session. Foreground-service permission/start failures are reported to the caller. API 24/25 use the compatible focus and service-start APIs.

## Durable native handoff

Both platforms write `recordings/session-captures/session-<sessionId>-<lowercase UUID>.wav` in the current documents/files directory. A new capture is committed in this order:

1. Write an atomic `.metadata.json` sidecar containing the capture's immutable native fields.
2. Write the complete WAV to `.<filename>.tmp`.
3. Atomically append and verify `pending-captures.json`.
4. Rename the temporary WAV to its final filename, then remove the sidecar.

`getUnstoredSegments()` reconciles sidecars, finalizes referenced temporary WAVs, and returns all outstanding sessions' segments. A malformed manifest or missing referenced file fails closed and remains available for diagnosis/retry. iOS reconstructs capture URIs from the current documents directory. Android honors readable historical absolute paths and otherwise resolves the known current capture directory. Segment IDs are the durable idempotency keys.

The app must persist each capture plus registration metadata and verify the write before `markSegmentsStored`. ACK removes manifest rows only; it never removes a WAV. The engine does not evict unuploaded captures. When the configured byte cap would be exceeded, recording/session execution stops with `storage-unavailable`, retaining every existing capture. Successful uploads and explicit user-media deletion remain application responsibilities.

The iOS recovery file remains `Application Support/session-audio-engine/pending-recovery.json`, with the historical `configuration` wrapper. Android continues using SharedPreferences `session-audio-engine`, key `pending-recovery`, with a top-level configuration and nested `snapshot`. The engine checkpoints every 15 running seconds and at state/phase transitions. Readers accept historical missing care and notification fields, preserve `recovery.word` as a label string, and require the original word ID/source type/start time. Future configurations may include immutable `recovery.wordSnapshot` data.

Cold recovery reports `completed` only for `duration-reached`; all other reasons and unfinished checkpoints report `failed`, with no target playing. Reading recovery never restarts audio. The app must hand off captures and durably save eligible history under the exact native session ID before `clearPendingRecovery(sessionId)`. A mismatch or active session cannot be cleared. Clearing a completed record leaves the live completed snapshot intact for the completion screen. New sessions are blocked until prior recovery is resolved; failed starts release active ownership.

## Verification

Run the native checks from the repository root:

```sh
bash test/native-check.sh
```

This compiles and executes the actual Foundation Swift core, then runs the actual Kotlin core with the Android Gradle unit-test task. Checks cover exact phase/cycle boundaries, strict VAD onset, release tails, ceiling offsets and no overlap, PCM WAV framing, current/historical recovery, missing required identity, matching recovery clear, interrupted WAV finalization, malformed-manifest retention, fractional monotonic timestamp serialization, and ACK without media deletion. `test/fixtures/native-persistence.json` contains synthetic compatibility fixtures, not data taken from a user installation.

Verification performed on the rewrite: Swift checks passed; Kotlin Gradle checks passed; the full iOS Release simulator build and Android module Kotlin compile passed. The final application build results are recorded in the repository acceptance report.

Physical acceptance is still required for microphone gain and resampling quality, echo calibration, Bluetooth/HFP and phone calls, route changes, locked-screen pause/resume, long learning sessions, low storage, service/process death, and an actual updated installation retaining media and native/Firebase storage. Synthetic tests and simulator builds do not establish those results. File-system crash tests exercise the handoff states in process; power loss and OS kill timing must also be tested on devices.

Platform references: [Apple AVAudioSession](https://developer.apple.com/documentation/avfaudio/avaudiosession), [Apple file protection](https://developer.apple.com/documentation/foundation/nsdata/writingoptions/completefileprotectionuntilfirstuserauthentication), [Android audio focus](https://developer.android.com/media/optimize/audio-focus), [Android foreground service types](https://developer.android.com/develop/background-work/services/fgs/service-types).

An iOS simulator regression exposed false recovery-write failures when JSONSerialization decoded a fractional monotonic timestamp as NSDecimalNumber. Comparing the decoded dictionary to the original NSNumber values rejected a successful write. Recovery durability now verifies the exact encoded bytes after rereading, matching the manifest verification. The disk-level Swift regression failed before this fix and passes afterward.
