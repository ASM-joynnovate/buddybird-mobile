# Architecture and state ownership

Ignite's app directory contains the application entry, screens, shared components, Context, services, navigators, theme, translations, configuration and utility functions. Screen-specific forms and calculations live with their screens. The custom Expo module is under modules/session-audio-engine. Generated ios/android shell projects are reproducible outputs of app.config.ts and plugins, not product source.

| State | Owner | Persistence |
|---|---|---|
| Profile, current word/audio, historical snapshots, progress, captures, consent, local settings | MMKV; React Context observes the serialized document | buddybird.data.v1 in MMKV instance buddybird |
| Firebase identity, Remote Config, feedback request state | Native Firebase + TanStack Query | Firebase owns auth; Query cache is memory only |
| Running clock, phases, playback, recording, audio interruption, lock controls | Native SessionAudioEngine | Native capture manifest and checkpoint |
| Screen selections, modal visibility, form input | Screen state / Context | Only explicitly saved settings enter MMKV |
| Pending uploads and pending file cleanup | Single durable worker using shared API functions | MMKV queues + recording files |

A library word is the current original. Old training IDs map to it only through an explicit recorded library link. Equal labels never merge identities. Old sessions store their immutable audio/label snapshot and original IDs; unlinked old training words remain archived records. Updating a word changes the current original without changing historical media. Captures carry stable server IDs and capture-time profile metadata.

MMKV writes are synchronous. Every update reads the latest document, writes one serialized value and verifies exact readback. A caller must not ACK native ownership, clear recovery or delete media after a failed write. AppProvider observes MMKV directly instead of maintaining a second mutable copy. Server request results remain in Query; no Context duplicates them.

Migration reads only documented legacy namespaces from AsyncStorage, preserves their exact bytes in an immutable MMKV archive and leaves the original keys/files untouched. It validates current/historical records, prepares persistent copies of accessible profile photos, writes and rereads data, then writes the final migration marker. An interrupted migration retries from originals. A corrupt migrated record or failed migration blocks normal bootstrap with retry; it never becomes a new installation. Relative recording paths rebase onto the current app container. Missing old photos keep their original reference; they do not reset the profile.

Before native start, JS saves an immutable session draft containing the word and capture-time registration metadata. Native segments are persisted with an ingestion receipt before ACK. This receipt prevents replay from recreating a capture already uploaded while an ACK failed. Final reconciliation rereads native recovery and segments after ACK, covering a completion flush that happened while JS was waiting. History credits the exact session ID once, then native recovery is cleared. No process-death recovery restarts learning automatically.

If an old pending native capture has no surviving word/session context anywhere in the documented inputs, the app retains native ownership and blocks recovery rather than inventing a server identity. The acceptance report must record and resolve such real-world fixtures before release. The 500 MiB native storage ceiling stops capture/session execution with a recoverable storage error; it does not evict unuploaded files.

File cleanup uses a durable queue. A source is deleted only after upload disposition or explicit user deletion is saved and current words, historical snapshots, active session drafts, profile photos and remaining captures no longer refer to it. URI comparisons account for stable and stale-container forms. Native ACK never deletes a WAV.

## Adding a feature

For a new server read, add a plain async function and queryOptions in services/api, then consume useQuery in the screen. For a server action, consume useMutation and invalidate only affected query keys after success. Audio uploads go through the existing durable worker; never add a second retry loop or store request state in Context.

For a new saved local field, update AppData and its explicit migration/validation, add a fixture or fault check where loss is possible, and use updateData. For a native command, update the TypeScript contract and both platform implementations; verify state and persistence behavior before connecting UI.

Dependency-cruiser rejects cycles, service-to-UI dependencies, product-dependent utilities, native-to-app imports and AsyncStorage use outside migration. New tests are independent of all old product tests.
