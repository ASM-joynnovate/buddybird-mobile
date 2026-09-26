# BuddyBird mobile

A fresh Ignite 11.5.0 / Expo 55 implementation of BuddyBird for iOS and Android. React Native 0.83.2, React 19.2, React Navigation, Zustand, MMKV, i18next, TanStack Query v5, react-native-audio-api and native fetch.

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

Use the existing dev/prod Firebase configuration and signing identity described in the build guide. Expo Go cannot run the native audio or Firebase modules. Web is outside this project.

## 폴더 책임

`yarn check:deps`가 아래 계층 규칙을 검사한다.

| 폴더 | 책임 |
| --- | --- |
| `app/config` | 환경값과 정책 값 |
| `app/types`, `app/types/apis` | 앱 타입, API 요청과 응답 스키마 |
| `app/utils` | 순수 함수와 시간, 크기 단위 |
| `app/lib` | API 전송, MMKV 저장소 어댑터, Query 클라이언트 |
| `app/apis` | 엔드포인트 함수, 지금은 목 서버를 부름 |
| `app/mocks` | 목 서버와 시드 데이터 |
| `app/stores` | zustand 스토어, 남겨야 하는 값은 MMKV에 저장 |
| `app/services` | Expo와 SDK를 쓰는 코드, 학습 엔진, 인증, 푸시, 분석, v1 데이터 이전 |
| `app/hooks/apis` | 쿼리 키와 쿼리, 뮤테이션 옵션 팩토리 |
| `app/hooks` | 여러 화면이 쓰는 훅 |
| `app/providers` | 인증 등 앱 전체를 감싸는 Provider |
| `app/components/ui` | 기본 UI 부품 |
| `app/components` | 여러 화면이 쓰는 컴포넌트 |
| `app/screens/<기능>` | 화면, 화면 부품, 화면 훅 |
| `app/navigators` | 루트 스택과 하단 탭 |
| `app/i18n` | 한국어와 영어 문구 |
| `app/theme` | 색, 글꼴, 모서리 값 |

컴포넌트 규칙 점검 결과는 `docs/component-audit.md`, API 호출 규칙은 `docs/api-client.md`, 저장 키는 `docs/mmkv-key-design.md`, 서버 요청 사항은 `docs/server-requests.md`에 있다.

## 미구현 자리

- 실서버 연결. 로그인을 포함한 모든 데이터가 `app/mocks/server.ts`로 동작하고, 실서버로 바꿀 때 `app/services/auth/client.ts`와 `app/apis/*.ts`의 함수 본문만 바꾼다
- 서버 리포트 API, 학습이 끝난 뒤의 모사 판정, 하트비트가 끊긴 세션의 자동 종료는 목 서버가 대신한다
- 오프라인 조회는 없고 연결 끊김 띠만 둔다
- 학습은 앱이 앞에 있을 때만 진행하고 백그라운드 재생은 없다

## Release
main에 머지된 conventional commit을 읽어 release-please가 `chore(main): release x.y.z` PR을 연다.
그 PR을 머지하면 태그와 GitHub Release가 생기고 Mobile release 워크플로우가 시작된다.
staging 빌드는 TestFlight와 Play 내부 테스트에 자동 제출되고, Android Maestro E2E가 병렬로 실행된다.
Actions의 Approve production release 잡을 승인하면 production 빌드가 App Store Connect와 Play 콘솔 draft에 제출된다.
심사 제출과 출시 버튼은 각 콘솔에서 직접 누른다.
같은 태그를 다시 빌드하려면 Mobile release 워크플로우를 Run workflow로 실행하고 태그를 입력한다.
