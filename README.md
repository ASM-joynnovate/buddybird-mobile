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

Use the existing dev/prod Firebase configuration and signing identity described in the build guide. Expo Go cannot run the custom native audio engine or Firebase modules. Web is outside this project.
