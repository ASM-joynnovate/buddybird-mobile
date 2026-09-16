# BuddyBird mobile

A fresh Ignite 11.5.0 / Expo 55 implementation of BuddyBird for iOS and Android. React Native 0.83.2, React 19.2, React Navigation, React Context, MMKV, i18next, TanStack Query v5 and native fetch.

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
