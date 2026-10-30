# BuddyBird mobile

BuddyBird for iOS and Android, started from Ignite 11.5.0. Expo 57, React Native 0.86.3, React 19.2, React Navigation 7, zustand with MMKV persistence, TanStack Query v5 with native fetch, zod, i18next.

## How to start
```sh
corepack enable
yarn install --immutable
cp .env.example .env
yarn prebuild
yarn ios
# or: yarn android
```

`.env.hotupdater.example` lists the variables for Hot Updater commands such as `yarn hot-updater bundle`.

## Lint and format
```sh
yarn lint        # oxlint, type-aware rules included
yarn lint:fix
yarn format      # oxfmt, also sorts imports
yarn typecheck
yarn check:deps  # dependency-cruiser folder rules
yarn check       # all of the above and expo install --check
```

Install the Oxc editor plugin for on-save formatting: `oxc.oxc-vscode` for VS Code, or the Oxc plugin from the JetBrains Marketplace for WebStorm.

Put the dev and prod Firebase files in `config/dev/firebase` and `config/prod/firebase`. Expo Go cannot run the native modules this app uses, such as Firebase, MMKV, WebRTC, react-native-audio-api and the local `frame-capture` module. Web is outside this project.

## Release
staging OTA는 Staging OTA 워크플로우를 main에서 Run workflow로 실행한다.
네이티브 모듈이 마지막 staging 스토어 빌드와 다르면 OTA 배포가 실패한다. 이때 release-please PR을 병합해 staging 빌드를 TestFlight 및 Play 내부 테스트에 제출한다.
권한 문구처럼 네이티브 모듈과 관계없는 설정 변경은 OTA로 배포되고 다음 스토어 빌드에 포함된다.
JavaScript가 fingerprint에 들어가지 않는 네이티브 변경에 의존하기 시작하면 `hot-updater.config.ts`의 `fingerprint.nativeVersion`을 변경한다.
운영 OTA는 Production OTA 워크플로우를 main에서 Run workflow로 실행한다.
한 플랫폼의 배포만 실패했으면 `platform`에 그 플랫폼을 선택해 다시 실행한다.
로컬에서 스토어 빌드를 제출했으면 Record native fingerprint 워크플로우를 실행한다.
배포한 번들은 `.env.hotupdater`를 채운 뒤 `yarn hot-updater bundle disable <번들 ID>`로 비활성화한다.
