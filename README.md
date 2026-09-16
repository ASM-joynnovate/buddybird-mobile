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

## Release
main에 머지된 conventional commit을 읽어 release-please가 `chore(main): release x.y.z` PR을 연다.
그 PR을 머지하면 태그와 GitHub Release가 생기고 Mobile release 워크플로우가 시작된다.
staging 빌드는 TestFlight와 Play 내부 테스트에 자동 제출되고, Android Maestro E2E가 병렬로 실행된다.
Actions의 Approve production release 잡을 승인하면 production 빌드가 App Store Connect와 Play 콘솔 draft에 제출된다.
심사 제출과 출시 버튼은 각 콘솔에서 직접 누른다.
같은 태그를 다시 빌드하려면 Mobile release 워크플로우를 Run workflow로 실행하고 태그를 입력한다.
