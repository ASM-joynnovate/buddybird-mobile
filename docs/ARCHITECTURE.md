# Architecture

## Navigation (Expo Router file-based)

`app/_layout.tsx` is the root. It wraps everything in `I18nProvider → ProfileProvider → TrainingDataProvider → ThemeProvider`. The `RootNavigator` inside uses `Stack.Protected` to gate routes:

- `guard={!!profile}` → `(tabs)` (home, profile tab, session-setup)
- `guard={!profile}` → `(onboarding)` (welcome → profile → goals, 3 steps)

The onboarding group wraps its stack in `OnboardingDraftProvider` so draft state persists across the 3 steps.

## Feature modules (`features/`)

Domain logic lives here — no JSX. Each subdirectory follows the same pattern: `*-types.ts`, `*-storage.ts`, `*-context.tsx`, `*-validation.ts`.

| Module | Responsibility |
|--------|---------------|
| `profile/` | `ParrotProfile` CRUD, onboarding draft accumulation, species/goal options |
| `training/` | `TrainingWord`, `TrainingSession`, `AudioRecording` models and AsyncStorage |
| `audio/` | `useAudioRecording`, `useAudioPreview` hooks, pitch-transform config, file storage |
| `i18n/` | `useI18n()` hook, `t()` translations, locale persistence |

## Components (`components/`)

- `ui/` — generic primitives: `Card`, `Chip`, `FormField`, `PillButton`, `IconSymbol`
- `layout/PetScreen` — screen wrapper that applies standard padding/safe area
- `profile/` — `ParrotProfileCard`, `ProfileAvatarPicker`, `TrainingGoalCard`
- `audio/WaveformPlaceholder` — placeholder until real waveform is implemented

## Design system (`constants/theme.ts`)

Single source of truth for `PetHubColors`, `Colors` (light/dark), `Fonts`, `Spacing`, `Radii`, and `Typography`. Always import from here rather than hardcoding values.

## Path alias

`@/` maps to the project root (configured in `tsconfig.json`). Use `@/features/...`, `@/components/...`, `@/constants/...` everywhere.

## Local persistence

All data is stored locally via `@react-native-async-storage/async-storage`. There is no backend or cloud sync in scope.
