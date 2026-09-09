# Acceptance and release status

Status: implementation, readability work, local builds and the recorded simulator checks are complete. **Not approved for merge or release; the full requested acceptance standard is not met.** This file distinguishes executable checks from simulator observation and physical-device evidence.

| Gate | Current evidence |
|---|---|
| Branch/isolation | refactor/ignite-rewrite created at d5464b7; original main index/worktree unchanged |
| Clean-room source | Independent exact-blob audit found zero identical product-code/test/document files and only 18 approved assets + eas.json matches. Deletion/status output exposed old file path names to implementers; strict no-tree-exposure was not fully met. See provenance.md |
| Baseline | Investigator built v1.1.0 dev iOS Release; observer verified bundle/version and principal Korean/English flows |
| Data/API checks | 37 new TypeScript checks passed; typecheck, ESLint and dependency-cruiser pass (98 modules, 283 dependencies, zero violations) |
| Native checks | Swift core/fault fixtures and Kotlin unit tests passed |
| iOS native build | Final Release simulator binary passed, with temporary probes removed. This is unsigned; Auth/FCM transport and signing continuity remain unverified |
| Android native build | Complete Debug and final arm64 Release builds passed; final Release Maestro smoke passed, including recorded-word native start/pause/end/delete |
| UI | Both platform smoke flows passed on final Release binaries. Each completed a two-minute learning/rest/care session, credited one learning minute and preserved it after relaunch. iOS feedback uses a bounded retry after scroll deceleration |
| Real updated installation | Installed over the baseline dev app on iPhone17e simulator without uninstall/clear. Independent 19 checks pass: 10 original storage values, all profile/library/training/history IDs and fields, consent, progress and four original media hashes preserved; durable photo matches. The final iOS UI also displays the preserved flower photo and recorded word. Android fixture-backed in-place update passed 28 checks, including pending native capture/recovery transfer and two repeat launches. Firebase UID remains unverified |
| Simulator background | Android kept the same PID through 16 seconds in the background; iOS kept the same PID for at least 37.405 seconds. Both continued through natural completion |
| Readability | TS/TSX, Swift and Kotlin use logical blank-line groups and descriptive names; 206 code imports converted to project aliases. ESLint enforces the TypeScript import and statement rules |
| Physical iOS and Android | No connected physical devices were available; phone/route/lock-screen/long-session/VAD/audio tests pending |
| Server and release | Production collection origin, server idempotency, Firestore rules, 180-day retention and signing continuity not independently verified |

## Required device matrix

For each platform, record device model, OS, binary build and outcome for background learning, locked-screen pause/resume/stop, phone interruption, headphones/Bluetooth routing, natural completion, manual short and eligible stop, process termination/recovery, long sessions, real recorded audio/VAD, storage pressure and offline/reconnect transfer. Repeat with Korean and English notification labels. A simulator cannot replace these rows.

For an updated v1.1.0 installation, preserve and compare profile/word/training/session/server IDs, consent, native Firebase UID, photographs, recordings (including old absolute paths and transformed audio), pending native captures/checkpoints and pending uploads. Include historical fixture shapes and failure between each write/ACK/clear step. Keep the original test data until final verification is reviewed.

Live server verification must use an authorized test environment and synthetic media. Check multipart fields, duplicate IDs, partial outcomes, oversized single capture, split rejection, cancellation and consent changes. Sending real feedback or push messages is not part of local automated checks. Store submission and merge remain conditional on all gates above.

## Evidence and interpretation

Machine-readable reports and selected screenshots from both platforms are in [evidence](evidence/checks.json), [iOS updated-install comparison](evidence/ios-update-independent.json), [Android updated-install comparison](evidence/android-update.json), and [source audit](evidence/provenance-audit.json). The same Android recording-to-session smoke reproduced the optional-field bridge failure before the fix and passed afterward. Startup smoke also caught and verified corrections for translation hook initialization and the iOS-only Firebase headless call.

The final Android APK passed the full recorded-word smoke and a two-minute preset session. Three consecutive stages covered start, sixteen seconds in the background, and rest/care/natural completion. The process ID stayed the same, the countdown advanced from 00:21 to 00:03, and exactly sixty learning seconds remained after relaunch. All stages passed. This is simulator evidence; physical microphone, lock-screen, route changes and long-session accuracy remain separate gates.

Unsigned iOS simulator logs report missing keychain/APNs entitlements. UI success does not establish successful Firebase Auth, FCM, remote configuration delivery or UID continuity. Validate those with the existing signing identity on device. No live feedback, push messages or captured media were sent by the verification flows.

Android migration used synthetic legacy storage and a seeded interrupted native record. Its additional 600-second learning credit proves recovery accounting; it was not a live ten-minute session. Baseline and updated export builds changed only the packaged manifest debuggability flag, leaving Release BuildConfig, JavaScript and native libraries intact. The exact final nondebuggable APK was then installed over that data and its profile/photo/statistics were checked.

iOS full smoke passed after a bounded retry of the real feedback button. The command receipt retains one failed first attempt inside that successful retry. Maestro visibility timeouts also include earlier assertion time since the last interaction; the final flow uses the verified cumulative deadline. No product behavior was changed to bypass those checks.
