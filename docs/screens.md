# Observed BuddyBird v1.1.0 iOS behavior

Source: a Release simulator executable built by the compatibility investigator from `d5464b7`, `com.joynnovate.buddybird.dev`, version 1.1.0 build 1. iPhone 17e, iOS 26.5, Korean system locale. Fresh app installation in a previously unused simulator. This document is based only on interactive observation and screenshots/accessibility output; it contains no baseline implementation details.

## Onboarding and photo

First launch opens the bird profile form directly. White background, orange primary action, rounded gray-bordered inputs/chips, mascot prompt at top. A large circular bird avatar with an orange plus opens the native iOS photo picker directly. The picker limits app access to chosen photos; no full-library permission prompt was observed. Selecting a sample image opens the native crop/confirmation screen with English `Choose Photo`, `Cancel`, `Choose`; choosing it displays a circular cropped avatar.

The form has name, species, and birthday. Name and species are required: pressing `시작하기` while empty displays inline errors for both, preserving the form. No photo error appeared. Species offers groups:

- Small: 사랑앵무(잉꼬), 왕관앵무, 모란앵무, 유리앵무.
- Medium: 코뉴어, 퀘이커, 카이큐, 목도리앵무, 세네갈앵무, 로리앵무.
- Large: 회색앵무, 뉴기니아앵무, 아마존앵무, 코카투, 금강앵무.

`직접 입력` replaces species chips with a text field and a `선택` toggle to return. Arbitrary test species `Observer Finch` was accepted. Birthday presents separate year/month/day wheels; initially displayed 2025, 9, 1 on 2026-09-09. This is one observed initial value, not a proven date-default formula. `모름` hides the wheels, displays reassurance that the birth date can be unknown, and becomes `선택`. Unknown birthday was accepted.

Test profile: name `Mango`, custom species `Observer Finch`, unknown birthday, simulator sample flower photo. `시작하기` enters the learning tab. An iOS notification permission prompt appears over an app audio-collection-consent dialog. Declining notifications proceeds. Audio consent explains collecting learning sounds to develop pronunciation learning, anonymous storage without account information, 180-day deletion, and equivalent service availability when refused. `거부` and `동의` are available; `거부` dismissed the dialog and allowed learning UI access.

Evidence: `01-first-launch.png`, `02-empty-profile.ax.json`, `03-photo-options.ax.json`, `04-photo-crop.ax.json`, `05-name-entered.png`, `06-custom-species.ax.json`, `08-unknown-birthday.ax.json`, `09-after-profile.png`, `10-audio-consent.png`.

## Initial learning tab

The app has three bottom tabs: 학습, 단어, 프로필. Learning initially shows four selectable word cards: 안녕 (selected), 사과, 사랑해, 다녀와. The introductory text says words repeat while the owner is away.

Duration choices are `짧게` 40 minutes (brief absence), `중간` 1 hour 20 minutes (short outing), `길게` 4 hours (longer absence/travel), and `직접 설정` initially showing 1 hour 20 minutes. Initial total is 1 hour 20 minutes, broken down into learning 40 minutes, rest 20 minutes, stress care 20 minutes. A `학습 시작` button appears below the breakdown; scrolling is needed to reach it on this device. This initial screen alone does not establish transition ordering or timing rules.

Evidence: `11-learning-home.png` and `.ax.json`.

## Explicit limits

All Android behavior and all physical-device audio/background behavior remain unobserved. Input length limits, birthday ranges, notification receiving, consent acceptance/withdrawal, and behaviors not documented above remain unobserved. Simulator captures do not verify microphone fidelity, call interruptions, lock-screen playback stability, VAD accuracy, or hours-long sessions.

## Profile, language, feedback

Profile displays the selected photo/name/species in an orange card; three summary cards show streak days, today's learning time, total learning time. Four achievement cards show streak, today, total, and a locked `Report / Coming soon` card. Initially all statistics are zero. Tapping the total-time summary did not navigate. Scrolling reaches the bottom just after the language and action buttons; no history list, consent settings, reset/delete-profile, or extra support links were visible in this state.

`프로필 편집 / Edit profile` opens the same photo/name/species/birthday form with a back action and `저장 / Save`; the bottom tabs are absent on that form. Changing species from custom text to the `코뉴어` chip and saving returns to Profile with the new species. Switching app language to English immediately translates interface and standard species (`코뉴어` → `Conure`) without changing the bird name/photo. English and Korean remain the language chip labels in both locales.

`Send feedback` opens an in-app modal with multiline text, a prompt to describe improvements/problems/features, a reminder not to include personal information, and Cancel/Send buttons. Empty Send is visibly disabled. Cancel returns to Profile. No feedback was submitted.

Evidence: `12-profile.png`, `13-profile-edit.ax.json`, `14-profile-species-preset.ax.json`, `16-profile-saved.ax.json`, `17-profile-english.png`, `18-feedback.png`, `43-total-time-tap.ax.json`, `44-profile-bottom.ax.json`.

## Word library and recording

The English word library contains two built-in Greeting words, `Hi` and `Hello`. These replace the four Korean presets in the visible catalog when the language changes; presets are not merely translated one-for-one. Each row has initial-letter badge, name, category badge, `Preset` indicator, and a circular orange preview button. Tapping a row body did not open a detail screen. Tapping preview did not navigate or show an error, but audible correctness was not independently verified.

A plus button opens word creation. Horizontal category chips filter All/Greeting/Food/Name/Other. The empty Food filter shows a bird symbol, `No words yet.`, and guidance to tap plus. Creation has a word text field, category chips (Greeting selected initially), a large quoted word preview (fallback `New word`), microphone button, recording status, Cancel, and `Add to training`. Empty submission was unavailable and did not change the screen.

Entering `Test Mango`, starting recording, and stopping records a test clip. The button becomes Stop while recording and status includes elapsed `m:ss`. No microphone permission dialog was observed in this simulator; this does not prove one is unnecessary on real devices. After stop, text says recording is complete and the same microphone button can rerecord. A review row with play control, `Listen to recording`, and `Original` appears. Tapping microphone again immediately starts a replacement recording, hides review during recording, and resets elapsed time. Stopping restores review. A ~1-second replacement clip was accepted. Selecting Name and `Add to training` returns to the word library.

The new `Test Mango` row appears after presets, shows Name / My recording, and adds a trash button. Tapping trash opens native confirmation `Delete "Test Mango"?` with Cancel/Delete. Cancel preserves the word. Tapping the custom row body did not open detail/edit. An existing-word rerecord action was not found; only rerecord-before-save was observed. The custom word is also available on the learning screen.

Evidence: `19-words-english.png`, `20-preset-detail.ax.json` (no navigation), `21-preset-preview.ax.json`, `22-add-word.png`, `23-empty-word-save.ax.json`, `24-microphone-permission.png` (actually already recording; no prompt), `25-word-recorded.png`, `26-rerecording.ax.json`, `27-rerecorded.ax.json`, `28-word-added.png`, `29-custom-word-row.ax.json`, `30-delete-confirm.png`, `31-empty-category.ax.json`, `32-learning-english.ax.json`.

## Custom duration and early session end

Choosing Custom expands a bordered inline duration panel with independent hour/minute scrolling wheels. First selection showed 0h25m even though the unselected Custom badge previously showed 1h20m. The selected value updates the badge and breakdown. Observed values:

| Total      | Learning   | Rest       | Stress care |
| ---------- | ---------- | ---------- | ----------- |
| 80 minutes | 40 minutes | 20 minutes | 20 minutes  |
| 25 minutes | 13 minutes | 7 minutes  | 5 minutes   |
| 14 minutes | 7 minutes  | 3m30s      | 3m30s       |
| 3 minutes  | 1m30s      | 45 seconds | 45 seconds  |
| 2 minutes  | 1 minute   | 30 seconds | 30 seconds  |
| 0 minutes  | 0 seconds  | 0 seconds  | 0 seconds   |

Zero is selectable but shows `Set the session duration to at least 1 minute.` and disables the start action, whose accessibility label becomes `Choose a word and duration to start`. Minute scrolling changes in individual minutes. Maximum hour/minute values are not yet established.

Starting a 2-minute session with Hi selected enters the session screen directly. There is no startup confirmation or guidance in this observed state. Bottom navigation disappears. Top has a horizontal progress bar and End button. Cycle 1/1 appears above a large circular progress ring, headphone-wearing mascot, word, and current phase countdown (`00:59` shortly after start, corresponding to the 60-second learning phase). A waveform decoration and status pill show Playing/Waiting for next repeat. A wide Pause button is at the bottom.

Pause changes the status pill to Paused, changes the action to Resume, and freezes the displayed phase countdown. Pressing End while paused immediately returns to learning configuration without confirmation or summary. Custom2m persists. After about20 seconds of active learning followed by pause/end, Profile still displayed zero statistics; the cause/threshold is unverified and must not be treated as an intentional accounting rule.

Evidence: `33-custom-duration.png`, `34-custom-bottom.png`, `35-custom-smaller.ax.json`, `36-custom-smallest.ax.json`, `37-zero-duration.png`, `38-one-minute.ax.json` (actual resulting selection2m), `39-start-training.png`, `40-paused.png`, `41-end-confirm.png` (actual immediate return, no confirmation), `42-profile-after-session.png`.

## Suspected inconsistencies to resolve separately

- Unselected Custom initially displayed80m; first activation selected25m. Preserve the confirmed duration behavior, but do not infer that this discrepancy is a desired feature.
- A short early-ended session did not change aggregate statistics. Further runtime/accounting investigation is needed before classifying this as a bug or intentional minimum.
- Some native iOS photo confirmation labels remained English while the app/system language was Korean. This was visible platform UI, not a newly authored app translation.

## Natural session phase transitions (simulator)

A second2-minute session ran without pause. Observed sequence is60-second Learning →30-second Rest →30-second Stress care. Cycle1/1 remains throughout. Rest replaces the word with `Taking a break`, displays the rest countdown, and says new sounds are still recorded during the break. Stress care replaces that with `Stress care`, a care countdown, and text that soothing nature sounds are playing. End/Pause remain available in both phases. Optional remote audio collection was declined before these sessions; these observed phase messages describe local capture behavior and do not prove any upload.

Evidence: `46-second-session.ax.json`, timed capture `47-session-timed-01` (learning), `47-session-timed-02` and `03` (rest), `47-session-timed-04` (stress care), each with screenshot and accessibility JSON.

## Completion, restart, and denied microphone

Natural completion opens a full orange celebratory screen with a mascot/confetti, `Session complete!`, and a sentence that Mango listened to Hi for1minute. A white bottom panel shows streak1 and total time1minute, and Continue returns to the learning tab. Profile then shows streak1, today1minute, total1minute and matching achievement values. The completed2-minute session therefore contributes its1minute learning phase to displayed learning totals; rest/care are excluded. The earlier ~20-second early-ended session remains absent from those totals. No history or capture list appeared after completion.

A cold launch after changing microphone permission restored English, bird data, and the custom word. It reset visible learning configuration to the initial Medium80-minute choice. The iOS tracking permission dialog appeared on that cold launch, with Korean system prompt/copy; refusing it allowed continuing. The previous optional audio-collection consent did not reappear.

After explicitly denying microphone permission on the isolated baseline installation, tapping Record without a word entered did not record and displayed an inline error telling the user microphone permission was denied and to allow access in device settings before retrying. There was no automatic Settings navigation. The recording form remained usable and showed Cancel/Add to training. Changing the permission through `simctl privacy` had caused iOS to terminate the app; reopening it was necessary. This was controlled test setup, not an observed spontaneous crash.

Evidence: `47-session-timed-06.png` (completion), `48-profile-completed.png`, `50-cold-launch-persisted.ax.json`, `52-recording-denied.png`.
