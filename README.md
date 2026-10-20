# BuddyBird mobile

A fresh Ignite 11.5.0 / Expo 57 implementation of BuddyBird for iOS and Android. React Native 0.86.3, React 19.2, React Navigation, React Context, MMKV, i18next, TanStack Query v5 and native fetch.

## How to start
```sh
corepack enable
yarn install --immutable
cp .env.example .env
yarn prebuild
yarn ios
# or: yarn android
```

## Lint and format
```sh
yarn lint      # oxlint, type-aware rules included
yarn lint:fix
yarn format    # oxfmt, also sorts imports
```

Install the Oxc editor plugin for on-save formatting: `oxc.oxc-vscode` for VS Code, or the Oxc plugin from the JetBrains Marketplace for WebStorm.

Use the existing dev/prod Firebase configuration and signing identity described in the build guide. Expo Go cannot run the custom native audio engine or Firebase modules. Web is outside this project.

## Release
main에 병합하면 Development deploy 워크플로우가 실행된다.
네이티브 변경이 없으면 개발 앱에 OTA가 배포되고, 있으면 staging 빌드가 TestFlight 및 Play 내부 테스트에 제출된다.
release-please PR은 스토어 릴리스가 필요할 때만 병합한다.
운영 OTA는 Production OTA 워크플로우를 Run workflow로 실행하고 릴리스 태그를 입력한 뒤 승인한다.
로컬에서 스토어 빌드를 제출했으면 Record native fingerprint 워크플로우를 실행한다.
배포한 번들은 `.env.hotupdater`를 채운 뒤 `yarn hot-updater bundle disable <번들 ID>`로 비활성화한다.
