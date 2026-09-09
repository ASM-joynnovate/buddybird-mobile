# BuddyBird mobile

A fresh Ignite 11.5.0 / Expo 55 implementation of BuddyBird for iOS and Android. React Native 0.83.2, React 19.2, React Navigation, React Context, MMKV, i18next, TanStack Query v5 and native fetch.

This branch is not a release until the [acceptance report](docs/acceptance.md) is complete. The original checkout and `main@d5464b7` remain unchanged.

- [Install and first build](docs/development.md)
- [Observed screens and flows](docs/screens.md)
- [Architecture and state ownership](docs/architecture.md)
- [Persisted/native compatibility](docs/data-native.md)
- [Server, consent and deployment contracts](docs/api-deployment.md)
- [TanStack Query and upload worker](docs/api-query.md)
- [Native engine](docs/native-engine.md)
- [Verification and release response](docs/acceptance.md)
- [Clean-room provenance](docs/provenance.md)

```sh
corepack enable
yarn install --immutable
cp .env.example .env
yarn prebuild
yarn ios
# or: yarn android
```

Use the existing dev/prod Firebase configuration and signing identity described in the build guide. Expo Go cannot run the custom native audio engine or Firebase modules. Web is outside this project.
