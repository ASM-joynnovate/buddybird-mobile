# Development and first build

Use Node 22 or newer and Yarn 4.14.1. The verification machine used Node 24.18.0, Xcode 26.6 and Android SDK 36 with JDK 21. Expo 55 requires the new React Native architecture; this project pins RN 0.83.2 and React 19.2. iOS minimum remains 15.1; Android minimum is 24.

Install dependencies with `corepack enable` and `yarn install --immutable`. Copy .env.example to .env for local development. Keep the collection origin HTTPS; a blank origin disables upload while preserving local learning and pending files. Production origin must come from the existing release environment, not a guessed URL.

Restore the existing Firebase files into config/dev/firebase and config/prod/firebase (GoogleService-Info.plist and google-services.json). They are ignored by Git. Alternatively provide GOOGLE_SERVICES_INFO_PLIST and GOOGLE_SERVICES_JSON absolute file paths. APP_VARIANT=production selects com.joynnovate.buddybird and its existing production Firebase project; all other values select com.joynnovate.buddybird.dev. Do not substitute a dev project when a production build is failing.

`yarn prebuild` generates the native shells from the fresh Expo config and the new session-engine plugin. Then run `yarn ios` or `yarn android`; `yarn start` serves Metro for a development client. Expo Go is unsupported. For a local Android shell, set ANDROID_HOME to the installed SDK and use a compatible JDK. For iOS, install current CocoaPods specifications if Clarity's pinned pod is missing (`pod install --project-directory=ios --repo-update`).

Firebase pods use Expo's official forceStaticLinking setting because the initial Release compile reproduced non-modular React-header errors when they were frameworks. The exact configuration is in app.config.ts; no old workaround/plugin is imported. Permission text is authored in Korean and English under app/i18n/native.

## Checks

- `yarn check`: TypeScript, ESLint, new runnable TypeScript checks and dependency boundaries.
- `bash test/native-check.sh`: compile/run the actual Swift core and Kotlin native tests. Native directories must already be generated and Android dependencies installed.
- `yarn export:ios` and `yarn export:android`: JavaScript/asset bundles for both platforms.
- `maestro --device <dedicated-device-id> test .maestro`: principal flows on an explicit dedicated test installation. The smoke flow uses `clearState: true`; do not target the installation reserved for upgrade verification.
- iOS simulator Release: `xcodebuild -workspace ios/DEV.xcworkspace -scheme DEV -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO` for the default dev variant.
- Android: from android, `./gradlew :app:assembleDebug :session-audio-engine:testDebugUnitTest`. Local arm64 Release: `./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a`. Store signing remains a separate check.

Maestro 2.10 subtracts time since the last tap or input from a visibility wait, including time spent in earlier assertions. Set the explicit timeout to cover the whole interval after that action; the smoke flow uses 30 seconds for recording and session startup checks. See the [Maestro interaction deadline implementation](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.10.0/maestro-orchestra/src/main/java/maestro/orchestra/Orchestra.kt#L1767). The feedback step retries the real button and dialog assertion after iOS scroll deceleration.

Use dedicated simulators/emulators and synthetic profiles. Updated-install verification installs a new binary over v1.1.0 with the same application ID, preserving app data. Never uninstall or clear that test installation between baseline and update. A fresh installation cannot prove migration or Firebase identity continuity. Unsigned simulator builds can exercise UI but report missing keychain/APNs entitlements; use the existing signing identity on a device to verify native Firebase identity and push transport.

## Deployment and incidents

Existing EAS profiles and submit destinations remain in eas.json. EAS owns remote app build numbers and signing credentials. Production builds do not imply store submission. There is no new OTA channel/runtime configuration; user update prompts use Remote Config and the native stores.

Before release, complete every gate in acceptance.md, including both physical-device background/audio checks and server/credential confirmation. Keep the rewrite isolated until then. An update migration failure should retain original AsyncStorage, the MMKV legacy archive, recordings, native manifests and recovery records. Diagnose and ship a forward fix; never advise clearing app data, signing out, reinstalling, or rolling data backward. Stop rollout if user media/identity preservation fails. Remote Config can announce a required fixed binary, but does not repair local data by itself.
