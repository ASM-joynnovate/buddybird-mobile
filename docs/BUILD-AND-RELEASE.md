---
type: spec
title: Build & Release
date: 2026-06-26
owner: caff1nepill
project: "[[buddybird]]"
---

# Build & Release

`buddybird-mobile`의 환경 분리, EAS 빌드, App Store/Play Store 출시, CI/CD 파이프라인의 단일 진실 소스(SSoT)다.
절차와 명령어와 트러블슈팅은 모두 이 문서에 모으며, 다른 docs와 README와 CLAUDE.md에서는 이 문서로 링크만 건다.

배포 모델은 단일 트렁크(trunk-based)다.
트렁크는 `main` 하나뿐이고, 환경(개발계/운영계)은 브랜치가 아니라 EAS profile/channel과 트리거로 가른다.
배경과 근거는 §12.2에 정리돼 있다.

---

## 1. 환경 개요

| 환경 | 목적 | 사용 시점 |
|---|---|---|
| `development` | 로컬 개발·디버깅 + 빠른 ad-hoc QA | 매일의 개발, 시뮬레이터 실행, EAS development client 빌드, ad-hoc 직원 QA (preview profile) |
| `staging` (CI) | 개발계 배포 (내부 테스터용 store-build) | `eas-staging.yml`을 수동 트리거하면 사내 internal track으로 출시 (dev Firebase·dev 식별자) |
| `production` | 운영·심사·스토어 제출 | App Store/Play Store 제출. `v*` 태그 push로 자동 빌드 + 수동 promote |

기본 원칙은 다음과 같다.

- dev와 prod는 Bundle ID, Android package, Firebase project, scheme, display name까지 완전히 분리된다.
- 같은 시뮬레이터나 실기기에 dev 빌드와 prod 빌드를 동시에 설치할 수 있다.
- staging은 dev Firebase를 공유한다 (`.dev` Bundle ID, `buddybird-dev` 프로젝트).
  별개 Firebase 프로젝트로 격리하지 않은 것은 운영비와 규모를 따진 결과다.
  preview와 staging 모두 같은 dev 환경을 대상으로 하며 distribution 방식(ad-hoc vs store)만 다르다.

EAS profile은 4종이다.

- **`development`**
  매일의 개발용. `developmentClient: true`, Metro 연결로 hot reload와 dev menu를 쓴다.
  개발자 본인이 받는 빌드다.

- **`preview`**
  ad-hoc QA 빌드. `developmentClient: false`, `distribution: internal` (EAS Install Link로 디바이스에 직접 설치).
  dev 식별자와 dev Firebase를 쓴다. CI와 무관하게 직원이 수동으로 `yarn eas:build:preview:all`을 실행한다.

- **`staging`**
  개발계 배포용. `distribution: store`, dev 식별자와 dev Firebase를 쓴다.
  `eas-staging.yml`을 수동 트리거하면 빌드되어 Play internal track과 TestFlight Internal에 자동 제출된다.
  preview와 분리된 독립 profile이다. (distribution 충돌을 막으려고 `extends`를 쓰지 않는다)

- **`production`**
  App Store/Play Store 제출용. prod 식별자와 prod Firebase를 쓴다.
  `v*` 태그 push가 빌드를 트리거한다.

## 2. 식별자 매핑 표

| 키 | development / staging (dev 환경) | production |
|---|---|---|
| App display name | `버디버드 (DEV)` | `버디버드` |
| iOS Bundle ID | `com.joynnovate.buddybird.dev` | `com.joynnovate.buddybird` |
| Android package | `com.joynnovate.buddybird.dev` | `com.joynnovate.buddybird` |
| URL scheme | `buddybird-dev` | `buddybird` |
| Firebase project | `buddybird-dev` | `buddybird-9b84d` |
| `process.env.APP_VARIANT` | `development` | `production` |
| `Constants.expoConfig.extra.appVariant` | `development` | `production` |
| EAS build profile (`eas.json`) | `development` (dev-client) / `preview` (ad-hoc) / `staging` (store, CI) | `production` |
| EAS channel | `development` / `preview` / `staging` | `production` |
| EAS environment (env store) | `development` / `preview` (staging profile도 `environment: "preview"` 명시로 preview env 공유) | `production` |
| distribution | `internal` (dev/preview) / `store` (staging) | `store` |
| App Store Connect `ascAppId` | `6784253530` (`.dev` 레코드, TestFlight Internal) | `6783652711` (운영 레코드, App Store) |
| CI 트리거 | `eas-staging.yml` workflow_dispatch (staging profile) | `v*` 태그 push (production profile) |

## 3. Firebase 프로젝트 구성

### 3.1 환경별 별도 프로젝트

| 환경 | Firebase project ID | iOS app Bundle ID | Android app package |
|---|---|---|---|
| dev | `buddybird-dev` | `com.joynnovate.buddybird.dev` | `com.joynnovate.buddybird.dev` |
| prod | `buddybird-9b84d` | `com.joynnovate.buddybird` | `com.joynnovate.buddybird` |

dev와 prod는 별도 Firebase 프로젝트이며, Analytics·Crashlytics·Firestore·Auth·Functions·quota·IAM까지 모두 분리된다.
개발 중 발생하는 이벤트가 운영 대시보드를 오염시키지 않는다.

### 3.2 신규 환경/앱 추가 절차

1. Firebase Console에서 새 프로젝트를 생성한다. (예: `buddybird-staging`)
2. 해당 프로젝트에 iOS app(`com.joynnovate.buddybird.staging`)과 Android app(`com.joynnovate.buddybird.staging`)을 등록한다.
3. Analytics와 Crashlytics가 켜져 있는지 확인한다.
4. `GoogleService-Info.plist`(iOS)와 `google-services.json`(Android)을 다운로드한다.
5. `config/staging/firebase/` 디렉토리에 배치한다. (§4 규칙)
6. EAS env에 file 변수를 등록한다. (§5)
7. `app.config.ts`의 `resolveAppVariant` / `BUNDLE_ID` / `IOS_GOOGLE_SERVICES_FILE` / `ANDROID_GOOGLE_SERVICES_FILE` 분기에 staging 케이스를 추가한다.
8. `eas.json`에 staging build profile을 추가한다.

### 3.3 Firebase Cloud Messaging

Cloud Messaging은 dev/prod Firebase 프로젝트 양쪽에서 각각 설정한다.

- **Android**
  각 Firebase Android app의 `google-services.json`이 FCM sender/project 정보를 포함한다.
  앱은 Android 13+ `POST_NOTIFICATIONS` 런타임 권한을 요청한다.

- **iOS**
  Firebase Console의 Project settings > Cloud Messaging에 APNs Authentication Key를 dev/prod 프로젝트 각각 업로드한다.
  `app.config.ts`는 `aps-environment`, `UIBackgroundModes: ['remote-notification']`, `GoogleService-Info.plist`를 prebuild 결과에 반영한다.
  JS root는 `getIsHeadless` guard를 먼저 실행해, background data-only launch에서 provider/effect side effect를 차단한다.

- **Client**
  `features/notifications/`가 FCM token을 AsyncStorage에만 저장한다.
  현재 phase에는 backend token upload/API가 없다.

- **Payload**
  foreground/background/opened message receipt는 `messageId`, `from`, `sentTime`, 수신 시각만 저장한다.
  notification body/data payload를 로컬에 영속화하지 않는다.

- **iOS background data-only payload**
  server payload는 `contentAvailable: true`, APNs `apns-push-type: background`, `apns-priority: 5`, `apns-topic`을 포함해야 한다.
  foreground local notification 표시, topic subscription, XMPP `sendMessage`는 현재 앱 범위 밖이다.

## 4. config 디렉토리 규칙

환경별 비밀 설정은 `{repo_root}/config/{environment}/{service}/...` 트리에 배치한다.
이 디렉토리는 `.gitignore`된다.

```
config/
├── dev/
│   ├── firebase/
│   │   ├── GoogleService-Info.plist
│   │   └── google-services.json
│   └── android/
│       ├── buddybird_dev_general.jks
│       └── credentials.json
└── prod/
    ├── firebase/
    │   ├── GoogleService-Info.plist
    │   └── google-services.json
    └── android/
        ├── buddybird_prod_general.jks
        └── credentials.json
```

신규 서비스(예: Sentry DSN file, Microsoft Clarity 별도 키파일)를 도입할 때도 같은 트리 아래 `config/{env}/{service}/`로 확장한다.
새 디렉토리를 만들 필요 없이 정책이 자동으로 적용된다.

규칙은 다음과 같다.

- 이 디렉토리에 들어가는 파일은 commit을 절대 금지한다. (`.gitignore`의 `/config/` 라인이 강제한다)
- 파일명은 Firebase 공식 파일명을 그대로 유지한다 (`GoogleService-Info.plist`, `google-services.json`).
  `app.config.ts`가 이 경로를 기대한다.
- 환경별 디렉토리명은 `APP_VARIANT` 값과 일치시킨다.
  `dev`는 `development`의 약식이다. (`app.config.ts`의 fallback 경로 참고)
- `.easignore`가 EAS tarball 한정으로 `config/{env}/firebase/`만 unignore한다.
  `config/{env}/android/`(keystore + `credentials.json`)는 `.gitignore`와 `.easignore` 양쪽에서 모두 제외된다.
  EAS Local build의 prebuild가 firebase config를 디스크에서 직접 읽기 때문에 필요한 조치다.
  신규 service 디렉토리를 추가할 때는 `.easignore`의 re-include 패턴도 함께 검토한다.

## 5. EAS Secret 운영

Firebase config 파일은 EAS Cloud의 file형 environment variable로 업로드되어 빌드 시 자동 주입된다.
로컬에서는 `config/{env}/firebase/`의 파일을, EAS Cloud 빌드에서는 EAS env에 등록된 파일을 사용한다.

### 5.1 등록 (관리자 최초 1회)

```bash
# dev 환경
eas env:create \
  --environment development \
  --name GOOGLE_SERVICES_INFO_PLIST \
  --type file \
  --value ./config/dev/firebase/GoogleService-Info.plist \
  --visibility sensitive

eas env:create \
  --environment development \
  --name GOOGLE_SERVICES_JSON \
  --type file \
  --value ./config/dev/firebase/google-services.json \
  --visibility sensitive

# prod 환경
eas env:create \
  --environment production \
  --name GOOGLE_SERVICES_INFO_PLIST \
  --type file \
  --value ./config/prod/firebase/GoogleService-Info.plist \
  --visibility sensitive

eas env:create \
  --environment production \
  --name GOOGLE_SERVICES_JSON \
  --type file \
  --value ./config/prod/firebase/google-services.json \
  --visibility sensitive

# preview 환경 (직원 internal testing, dev Firebase 사용)
eas env:create \
  --environment preview \
  --name GOOGLE_SERVICES_INFO_PLIST \
  --type file \
  --value ./config/dev/firebase/GoogleService-Info.plist \
  --visibility sensitive

eas env:create \
  --environment preview \
  --name GOOGLE_SERVICES_JSON \
  --type file \
  --value ./config/dev/firebase/google-services.json \
  --visibility sensitive
```

### 5.2 조회

```bash
eas env:list development --include-sensitive --format long
eas env:list production  --include-sensitive --format long
eas env:list preview     --include-sensitive --format long
```

### 5.3 갱신·삭제

```bash
eas env:update <env-id> --value ./new/path.plist
eas env:delete <env-id>
```

### 5.4 로컬 동기화 (신규 개발자)

```bash
# dev config를 .env.local + config/로 동기화
eas env:pull development --environment development --path .env.local
```

`eas env:pull`은 file형 변수의 경우 파일을 디스크에 풀고 경로를 `.env.local`에 기록한다.
동작은 EAS CLI 버전에 따라 다르므로, 가장 단순한 절차는 §6.4의 수동 배치다.

## 6. 로컬 개발 빌드 절차

### 6.1 사전 요구사항

- Node.js, Yarn 4.x (이 저장소는 `yarn@4.14.1`)
- Expo CLI / EAS CLI 최신 (`yarn dlx eas-cli@latest --version`)
- iOS 빌드: Xcode 16+ / CocoaPods
- Android 빌드: JDK 17, Android SDK
- Apple Developer / Google Play Console 계정 (출시 시)

### 6.2 신규 개발자 온보딩 (step-by-step)

```bash
# 1. 저장소 클론
git clone <repo>
cd buddybird-mobile

# 2. 의존성 설치
yarn install

# 3. EAS 로그인 (joynnovate0410 organization 권한 필요)
eas login

# 4. Firebase config 받기 — 둘 중 하나
#   (A) EAS에서 풀기
eas env:pull development --environment development --path .env.local
#   (B) 수동 다운로드: Firebase Console → buddybird-dev → iOS/Android 앱 설정 → 파일 다운로드
#       → config/dev/firebase/GoogleService-Info.plist
#       → config/dev/firebase/google-services.json
#       prod도 동일하게 config/prod/firebase/에 배치

# 5. 네이티브 디렉토리 생성 (dev 환경 기준)
yarn prebuild:dev

# 6. 시뮬레이터/에뮬레이터 실행
yarn ios:dev          # iOS 시뮬레이터
yarn android:dev      # Android 에뮬레이터
```

### 6.3 환경 전환

- dev 빌드를 prod 빌드로 바꾸려면 반드시 `yarn prebuild:prod`를 다시 돌린 뒤 `yarn ios:prod` / `yarn android:prod`를 실행한다.
  네이티브 디렉토리가 환경에 따라 달라지므로 재생성이 필요하다.
- `prebuild`는 `--clean`으로 동작하므로 이전 환경의 네이티브 산출물이 깨끗하게 교체된다.
- Metro만 단독으로 띄우려면 `yarn start:dev` / `yarn start:prod`를 쓴다.
  (이미 prebuild와 네이티브 실행이 끝난 상태에서 JS만 재로드할 때)

### 6.4 Firebase config 누락 시

`yarn prebuild:dev`가 `googleServicesFile not found` 에러로 실패한다.
§4의 경로에 파일이 있는지 먼저 확인한다.

## 7. EAS 빌드 절차

EAS 빌드는 Cloud 빌드와 Local 빌드 두 가지로 실행할 수 있다.
두 방식 모두 같은 `eas.json`의 build profile과 EAS env에 등록된 file 변수(`GOOGLE_SERVICES_INFO_PLIST`, `GOOGLE_SERVICES_JSON`)를 사용한다.
profile의 `env.APP_VARIANT`가 빌드 머신에 주입되어 `app.config.ts`의 분기를 결정하고, file env가 풀려서 `process.env.*` fallback으로 흘러간다.

### 7.1 Cloud 빌드 (`eas build`)

EAS 빌드 머신에서 실행되며, credentials와 환경변수는 EAS가 관리한다.
본인 머신 자원이 거의 들지 않고, 결과물을 internal URL/QR로 받아간다.

| 명령 | 동작 |
|---|---|
| `yarn eas:build:dev:ios` | dev profile (dev-client), iOS 빌드 |
| `yarn eas:build:dev:android` | dev profile (dev-client), Android 빌드 |
| `yarn eas:build:dev:all` | dev profile (dev-client), iOS + Android 동시 빌드 |
| `yarn eas:build:preview:ios` | preview profile (직원 internal testing), iOS 빌드 |
| `yarn eas:build:preview:android` | preview profile (직원 internal testing), Android 빌드 |
| `yarn eas:build:preview:all` | preview profile (직원 internal testing), iOS + Android 동시 빌드 |
| `yarn eas:build:prod:ios` | prod profile, iOS 빌드 |
| `yarn eas:build:prod:android` | prod profile, Android 빌드 |
| `yarn eas:build:prod:all` | prod profile, iOS + Android 동시 빌드 |

### 7.2 Local 빌드 (`eas build --local`)

본인 머신에서 EAS 빌드 파이프라인을 그대로 실행한다.
EAS 크레딧을 소모하지 않고 산출물을 만들며, 빌드 머신 내부 문제를 직접 디버깅할 수 있다.
iOS 빌드는 macOS + Xcode + CocoaPods가 필요하고, Android 빌드는 JDK 17 + Android SDK가 필요하다.

| 명령 | 동작 |
|---|---|
| `yarn eas:build:local:dev:ios` | dev profile, iOS, 로컬 머신에서 빌드 |
| `yarn eas:build:local:dev:android` | dev profile, Android, 로컬 머신에서 빌드 |
| `yarn eas:build:local:preview:ios` | preview profile, iOS, 로컬 머신에서 빌드 |
| `yarn eas:build:local:preview:android` | preview profile, Android, 로컬 머신에서 빌드 |
| `yarn eas:build:local:prod:ios` | prod profile, iOS, 로컬 머신에서 빌드 |
| `yarn eas:build:local:prod:android` | prod profile, Android, 로컬 머신에서 빌드 |

산출물은 `*.ipa`(iOS), `*.aab` 또는 `*.apk`(Android) 형태로 프로젝트 루트나 출력 디렉토리에 떨어진다.
EAS Cloud의 `eas submit`으로 store에 올리거나, 직접 디바이스에 설치하여 검증할 수 있다.

Local 빌드는 한 번에 한 플랫폼만 수행한다. (`--platform all` 미지원)
iOS + Android 동시 빌드가 필요하면 §7.1의 cloud 빌드를 쓴다.

빠른 개발 루프(시뮬레이터 hot reload)는 §6의 `yarn ios:dev` / `yarn android:dev`(`expo run`)가 더 빠르다.
local EAS 빌드는 배포 가능한 산출물이 필요할 때 쓴다.

#### Firebase config의 cloud vs local 채널

| 채널 | 주입 방식 | 우선순위 |
|---|---|---|
| Cloud 빌드 | EAS env의 file-type secret(`GOOGLE_SERVICES_INFO_PLIST` / `GOOGLE_SERVICES_JSON`)이 빌드 머신에 자동 풀려 `process.env.*`로 노출 | 1순위 (`app.config.ts`의 `??` 분기에서 사용) |
| Local 빌드 | `.easignore`가 tarball에 `config/{env}/firebase/`를 포함시켜 함께 업로드 → `app.config.ts` fallback 경로(`./config/{env}/firebase/...`)에서 직접 로드 | 2순위 (EAS env가 없을 때 사용) |

Cloud 빌드에서도 `.easignore`가 firebase config를 tarball에 포함시키지만, `app.config.ts`가 `process.env.GOOGLE_SERVICES_JSON ?? './config/...'` 순서로 fallback하므로 EAS env가 항상 우선된다.
따라서 한 환경의 firebase config가 다른 환경 빌드에 새어 들어가지 않는다.

신규 개발자의 로컬에 firebase config가 누락된 상태에서 `yarn eas:build:local:*`를 실행하면, §6.4와 같은 `googleServicesFile not found` 또는 prebuild `ENOENT` 에러로 실패한다.
§6.2의 4단계로 `config/{env}/firebase/`에 먼저 배치한다.

#### Android Gradle JVM 메모리 (heap / metaspace)

Local Android 빌드는 `android/gradle.properties`의 `org.gradle.jvmargs`를 `plugins/withGradleJvmArgs.js`(config plugin)가 prebuild 단계에서 항상 `-Xmx6144m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8`로 덮어쓴다.
`app.config.ts`의 `plugins` 배열에 등록돼 있으며, Cloud 빌드에도 동일하게 적용된다.

- **직접 편집 금지**
  `android/`는 prebuild가 매번 재생성하므로 `android/gradle.properties` 직접 수정은 무의미하다.
  메모리 값을 바꾸려면 `plugins/withGradleJvmArgs.js`의 `JVMARGS_VALUE` 상수를 수정한다.

- **OOM 증상**
  `Execution failed for task ':react-native-reanimated:configureCMakeRelWithDebInfo[*]'. > Java heap space`가 발생하면 빌드 머신 RAM이 부족하거나 다른 프로세스가 점유 중이다.
  머신 메모리가 8GB 이하라면 `JVMARGS_VALUE`의 `-Xmx`를 `4096m`까지 낮추고 다른 무거운 앱을 종료한다.

- **근거**
  기본값 `-Xmx2048m -XX:MaxMetaspaceSize=512m`은 RN 0.81 + Reanimated 4.1 + Worklets + New Architecture + 4 ABI(arm64-v8a / armeabi-v7a / x86 / x86_64) CMake 동시 configure 워크로드를 감당하지 못한다.

## 8. App Store / Google Play 제출

### 8.1 사전 체크리스트

- [ ] 현재 브랜치가 `main`이거나 release 브랜치이며 최신
- [ ] `yarn lint && yarn typecheck` 그린
- [ ] CLAUDE.md의 Hard Rules grep 0건 (rgba, empty catch, namespaced Firebase)
- [ ] 빌드 profile이 `production`이며 `APP_VARIANT=production`임을 EAS 로그로 확인
- [ ] 버전 충돌 없음 (`eas.json`의 `production.autoIncrement: true`가 빌드 번호를 올린다)
- [ ] dev 빌드가 실수로 prod 채널에 올라가지 않도록 명령어 재확인
- [ ] (iOS) `app.config.ts`의 `ios.config.usesNonExemptEncryption: false` 유지 (HTTPS/Firebase는 면제 암호화이므로 Missing Compliance 없이 Ready to Submit으로 진입)
- [ ] (iOS) `supportsTablet` 값에 맞는 스크린샷 준비 (iPhone 전용이면 iPhone 6.9"만, iPad 지원이면 iPad 13"도 필요)

### 8.2 빌드 + 제출

```bash
yarn eas:build:prod:all                              # iOS + Android 빌드
eas submit --profile production --platform ios       # App Store Connect
eas submit --profile production --platform android   # Google Play Console
```

`eas submit`은 `eas.json`의 `submit.production` 블록을 사용한다.
dev/preview profile은 submit profile이 정의되지 않으므로 실수로 store에 올라가지 않는다.

### 8.3 internal 직원 testing 빌드 (preview)

내부 직원이 EAS 내부 배포 링크로 앱을 설치해, 일반 사용자처럼 동작을 확인하는 빌드다.
dev Firebase와 dev Bundle ID(`com.joynnovate.buddybird.dev`)를 사용하며, `developmentClient: false`이므로 Metro 연결·hot reload·dev menu가 모두 비활성화된다. (= 출시 빌드와 같은 실행 경험)

```bash
yarn eas:build:preview:ios       # iOS internal 배포 빌드
yarn eas:build:preview:android   # Android internal 배포 빌드
yarn eas:build:preview:all       # 둘 다 동시
```

EAS Build가 완료되면 콘솔/대시보드에 internal 배포 링크(QR + URL)가 표시된다.
직원에게 그 링크를 공유하면 iOS는 Ad Hoc / TestFlight internal, Android는 APK 직접 설치 흐름으로 설치된다.
Firebase 이벤트와 Crashlytics는 모두 `buddybird-dev` 프로젝트로 들어간다.

prod Firebase와 prod Bundle ID로의 출시 직전 sanity check가 필요해지면, 그 시점에 별도 profile(예: `production-internal`)을 추가하는 것을 검토한다.
현재는 `preview`를 dev 환경 standalone 한 가지 의미로만 운영한다.

## 9. OTA / Update 채널

`expo-updates` 도입 시 사용한다. 현재는 OTA를 쓰지 않는다.

도입 시 다음과 같이 채널에 업데이트를 게시한다.

```bash
eas update --branch development --message "dev hotfix"
eas update --branch production  --message "prod hotfix"
```

브랜치명은 `eas.json`의 `channel`과 매칭된다.
OTA를 도입하면 이 섹션을 갱신한다.

## 10. 트러블슈팅 (빌드)

| 증상 | 원인 | 해결 |
|---|---|---|
| `googleServicesFile not found` | `config/{env}/firebase/`에 파일 미배치 | §6.2의 4단계로 Firebase config 다운로드·배치 |
| `yarn eas:build:local:*` PREBUILD `ENOENT: ... build/config/{env}/firebase/google-services.json` | (1) `.easignore` 누락으로 tarball에서 firebase config가 빠짐, 또는 (2) 로컬에 파일 미배치 | (1) `.easignore` 존재 확인, 누락 시 정책 위반. (2) §6.2의 4단계로 `config/{env}/firebase/` 배치 |
| Bundle ID 충돌 (시뮬레이터에서 dev/prod가 동일 ID) | 이전 환경의 네이티브 디렉토리 재사용 | `yarn prebuild:dev` 또는 `yarn prebuild:prod`로 `--clean` 재생성 |
| iOS Pod 에러 / RNFirebase static framework | Podfile의 `$RNFirebaseAsStaticFramework = true` 누락 | `yarn prebuild:{env}` 재실행 (`plugins/withFirebaseStaticPodfile.js`가 자동 주입) |
| Firebase 이벤트가 잘못된 프로젝트로 들어감 | googleServicesFile 경로 또는 EAS env 값 잘못 | `eas env:list <env> --include-sensitive`로 등록 파일 확인. `app.config.ts`의 `process.env.GOOGLE_SERVICES_*` 우선순위 점검 |
| `APP_VARIANT` 미설정 빌드 | 셸 변수 누락 | 모든 빌드 명령은 `yarn :dev` / `yarn :prod` 스크립트로 실행. EAS 빌드는 `eas.json`의 `env`가 강제 |
| dev 빌드 이벤트가 prod Firebase 대시보드에 노출 | dev가 prod googleServicesFile 사용 중 | `Constants.expoConfig.extra.appVariant`와 Firebase project ID가 일치하는지 in-app 로그로 확인 |
| Apple/Google 심사 거부 (Bundle ID/패키지명 변경) | prod Bundle ID가 변경됨 | prod의 Bundle ID는 절대 변경 금지(`com.joynnovate.buddybird` 고정). dev에만 `.dev` suffix |

## 11. Android Keystore 관리

Android keystore와 그 메타데이터(password / alias)는 `config/{환경}/android/` 디렉토리에 함께 보관한다.
`.gitignore`의 `/config/`가 디렉토리째 무시하므로 commit 위험이 없다.

### 11.1 디렉토리 규칙

```
config/{env}/android/
├── buddybird_{env}_general.jks   # keystore 본체 (binary)
└── credentials.json              # path/keystorePassword/keyAlias/keyPassword
```

- `{env}`는 `dev` 또는 `prod`다. (preview는 dev 패키지명을 공유하므로 dev keystore를 그대로 쓰며, 별도 디렉토리가 없다. §11.4 참고)
- 파일명 컨벤션은 `buddybird_{env}_{group}.jks`다.
  일반 빌드용은 `general`, 향후 upload key 별도 분리가 필요해지면 `upload` 등으로 확장한다.
- commit을 절대 금지한다. (`/config/`가 강제한다)

### 11.2 `credentials.json` 형식

같은 디렉토리의 `credentials.json`은 keystore 그룹별 메타데이터를 다음 형태로 보관한다.

```json
{
    "general": {
        "path": "{root}/config/dev/android/buddybird_dev_general.jks",
        "keystorePassword": "",
        "keyAlias": "",
        "keyPassword": ""
    }
}
```

- 최상위 키(`general`)는 keystore 그룹 이름이다.
  일반 빌드용 keystore는 `general`로 고정하며, 향후 그룹(예: `upload`)이 추가되면 같은 객체에 키를 추가해 확장한다.
- `path`는 `{root}`를 저장소 루트 절대경로로 치환한 풀 경로다.
  상대경로 대신 풀 경로로 두는 이유는, 빌드 도구와 스크립트가 working directory와 무관하게 keystore를 찾을 수 있게 하기 위함이다.
- `keystorePassword`, `keyAlias`, `keyPassword`는 EAS Cloud에 등록된 값과 정확히 일치해야 한다.
  빈 문자열로 commit하지 않는다. 이 문서는 placeholder만 보여주며, 실제 값은 §11.3 절차로 받아 채워 넣는다.

새 환경(예: staging)이 도입되면 동일 구조로 `config/staging/android/credentials.json`을 만든다.

### 11.3 새 keystore 추가 / 환경 셋업 절차

1. (관리자 1회) EAS에서 해당 패키지의 keystore가 없으면 첫 빌드로 자동 생성되거나, `eas credentials --platform android --profile {profile}` 메뉴의 *Set up a new keystore*로 생성한다.
2. (관리자) 같은 메뉴의 *Download credentials*로 `keystore.jks`와 EAS가 만든 메타데이터를 받는다.
   EAS가 제공하는 `credentials.json`의 password / alias 값을 기록한다.
3. 받은 파일을 `config/{env}/android/`로 옮기고 파일명을 `buddybird_{env}_general.jks`로 변경한다.
4. 같은 디렉토리에 §11.2 형식의 `credentials.json`을 작성하고 EAS에서 받은 값으로 채워 넣는다.
   `path`는 본인 머신의 저장소 루트 풀 경로로 치환한다.
5. `git status`로 `config/`가 무시되는지 확인한다.
6. (선택) 로컬 빌드(`yarn eas:build:local:{env}:android`)가 동일 keystore로 서명에 성공하는지 검증한다.

팀원이 새로 합류하면 위 1~5 단계는 관리자가 1Password나 안전한 채널로 keystore와 password를 전달한 뒤, 받는 사람이 3~5 단계만 수행한다.

### 11.4 환경별 keystore 매핑

| Profile | Package name | 사용할 keystore | `config/.../android/` 위치 |
|---|---|---|---|
| `development` | `com.joynnovate.buddybird.dev` | dev 전용 keystore | `config/dev/android/buddybird_dev_general.jks` |
| `preview` | `com.joynnovate.buddybird.dev` | dev keystore 공유 | `config/dev/android/buddybird_dev_general.jks` (별도 복사본 두지 않음) |
| `production` | `com.joynnovate.buddybird` | prod 전용 keystore | `config/prod/android/buddybird_prod_general.jks` |

`development`와 `preview`는 동일 패키지명(`com.joynnovate.buddybird.dev`)이므로 같은 dev keystore로 서명해야 동일 기기에서 업그레이드 설치가 가능하다.
preview 빌드 시에도 `config/dev/android/`의 파일을 그대로 사용하며, `config/preview/` 디렉토리는 만들지 않는다.

### 11.5 백업 정책

- **dev keystore**
  분실 시 EAS에서 재발급할 수 있다. 별도 백업 의무는 없다.

- **prod keystore**
  `config/prod/android/`의 사본 외에 1Password / GCS+versioning / S3+KMS 등 안전한 외부 저장소에도 반드시 백업한다.
  Play Store App Signing이 켜져 있어도 upload key 분실은 운영 부담이므로 백업을 권장한다.

- **`credentials.json`의 password**
  동일하게 백업 대상이다. keystore만 있고 password가 사라지면 쓸 수 없다.

## 12. CI/CD 자동화 파이프라인

### 12.1 브랜치 전략 (단일 트렁크)

트렁크는 `main` 하나다.
환경(개발계/운영계)은 브랜치가 아니라 트리거와 EAS profile/channel로 가른다.

- **`feat/*` (그 외 `fix/*`·`chore/*`·`refactor/*`·`docs/*`·`ci/*`) → `main`**
  유일한 통합 지점이다. PR-only이며 squash merge 후 브랜치를 삭제한다.
  단명 브랜치를 squash merge하는 것은 안전하다. (분기를 만들지 않는다)

- **개발계 (internal)**
  `eas-staging.yml`을 수동 트리거하면(`workflow_dispatch`) staging profile로 빌드되어 Play internal track과 TestFlight Internal에 자동 제출된다.
  브랜치 이동이 없다.

- **운영계 (production)**
  `main`의 커밋에 `git tag vX.Y.Z`를 push하면 `eas-production.yml`이 production profile로 자동 빌드한다.
  태그가 곧 운영 게이트다.

- **핫픽스**
  §12.7 절차를 따른다. back-merge cascade가 없다.

### 12.2 단일 트렁크로 전환한 배경

이전에는 `dev → staging → main` 3개 장수 브랜치를 PR merge로 promote하는 모델이었다.
`staging`과 `main`은 linear history를 강제했고, 그래서 promote PR이 squash로 merge됐다.

squash merge는 새 SHA를 가진 단일 커밋을 타깃에 만들고, 소스 브랜치의 원본 커밋을 조상으로 남기지 않는다.
그 결과 평행한 장수 브랜치의 merge-base가 갱신되지 않아, git이 두 브랜치를 분기한 것으로 본다.
매 릴리즈마다 `back-merge`와 `realign` 머지가 무한히 재발했고, `docs/POLICY-HISTORY.md`나 `version`처럼 같은 영역에 추가되는 파일에서 충돌이 집중됐다.

star가 많은 React Native 앱을 조사한 결과, 환경을 장수 브랜치로 두는 이 모델을 쓰는 곳은 없었다.
Bluesky와 Rocket.Chat은 단일 트렁크에 워크플로우 입력/채널로 환경을 가르고, Expensify와 Mattermost는 트렁크에서 cut한 디스포저블 release 브랜치 + cherry-pick forward를 쓴다.
Expo/EAS 공식 모델도 환경을 git 브랜치가 아니라 build profile + EAS channel로 분리한다.

따라서 단일 트렁크(`main`) + 태그 트리거로 전환했다.
`version`은 `main` 한 곳에만 존재하므로 개발계와 운영계 빌드가 자동으로 같은 버전을 공유하고, 평행 브랜치가 없으니 back-merge라는 개념 자체가 사라진다.

> 더 이른 이력
> conventional-commit 기반 자동 semver 도구(release-please)는 2026-06-07에 제거했다.
> `target-branch` 미지정 시 release PR이 default 브랜치로 생성되는 오작동, squash 본문 미파싱, 릴리즈당 main 머지 2회 같은 문제가 있었다.
> 수동 bump + 명시 트리거가 실무 표준이라 이에 정렬했다. (`docs/POLICY-HISTORY.md` 2026-06-07 행)

### 12.3 시멘틱 버전 정책 (수동 bump + 태그 게이트)

`version`(사용자 노출 X.Y.Z)과 `buildNumber`/`versionCode`(개발자용)는 분리해서 관리한다.

| 필드 | 누가 결정 | 어떻게 |
|---|---|---|
| `version` (X.Y.Z) | 개발자가 릴리즈 직전 명시적으로 bump | `yarn release:bump <patch\|minor\|major>` 커밋 후 `git tag vX.Y.Z` |
| `ios.buildNumber` / `android.versionCode` | EAS 자동 | `appVersionSource: remote` + `autoIncrement` (매 빌드 시 +1) |

bump 수준은 commit type을 자동 분석하지 않고, 누적 변경의 성격을 사람이 판단한다.

| 누적 변경 | bump | 예 |
|---|---|---|
| 버그 수정만 | patch | 0.2.0 → 0.2.1 |
| 신규 기능 포함 | minor | 0.2.0 → 0.3.0 |
| breaking change 포함 | major (pre-1.0 동안은 minor로 처리) | — |

**pre-1.0 규칙**
breaking change도 1.0.0으로 올리지 않고 minor만 증가시킨다.
1.0.0 진입은 `yarn release:bump 1.0.0`으로 의도적으로만 한다.

**태그 게이트**
`git tag vX.Y.Z`를 push하는 것 자체가 운영 릴리즈 게이트다.
`package.json`과 태그를 비교하는 별도 job은 없다.

- `vX.Y.Z` 태그를 push하면 `eas-production.yml`이 트리거되어 verify → 운영 빌드 → GitHub Release(`--generate-notes`)를 생성한다.
- bump를 깜빡하고 같은 태그를 다시 달려고 하면 git이 기존 태그 push를 거부하므로, 중복 릴리즈가 원천 차단된다.

CHANGELOG.md 파일은 두지 않는다. 릴리즈 노트는 GitHub Releases가 단일 소스다.

**version 손편집 금지**
`package.json`과 `app.config.ts`의 `version` 필드는 손으로 직접 편집하지 않고, `yarn release:bump`(= `npm version --no-git-tag-version` wrapper)로만 변경한다.
`app.config.ts`는 `import pkg from './package.json'`으로 단일 source를 참조한다.

### 12.4 EAS Secret 표 (account scope)

| Secret 이름 | 타입 | 용도 |
|---|---|---|
| `GOOGLE_SERVICES_INFO_PLIST` (environment별) | file | Firebase iOS config, EAS Build 시 자동 주입 |
| `GOOGLE_SERVICES_JSON` (environment별) | file | Firebase Android config, EAS Build 시 자동 주입 |

현재 상태 조회는 `eas env:list <environment> --include-sensitive`로 한다.

iOS submit 자격증명은 EAS Secret을 쓰지 않는다.
staging CI는 GitHub Secret `ASC_API_KEY_P8_BASE64` + `eas.json` 평문(`ascApiKeyId`/`ascApiKeyIssuerId`/`ascAppId`)으로 처리하고, prod 로컬 submit은 EAS-managed credentials로 처리한다. (§12.5)

> EAS Secret의 한계
> file 타입 secret은 EAS Cloud builder 환경에서만 자동 주입된다.
> GitHub Actions runner에서 직접 실행되는 `eas submit` CLI는 EAS Secret에 접근할 수 없으므로, submit 자동화용 자격증명은 GitHub Secret으로 별도 관리한다. (§12.5의 `PLAY_SERVICE_ACCOUNT_BASE64` 패턴 참고)

### 12.5 GitHub Secret 표 (repo scope)

| Secret 이름 | 인코딩 | 용도 |
|---|---|---|
| `EXPO_TOKEN` | plain | EAS CLI 인증 (robot user 토큰) |
| `GOOGLE_SERVICES_INFO_PLIST_DEV_BASE64` / `_PROD_BASE64` | base64 | CI runner에서 config introspect용 Firebase iOS config. `eas-staging.yml`/`eas-production.yml`의 "Write Firebase config" step이 decode해 `config/{env}/firebase/`에 작성 |
| `GOOGLE_SERVICES_JSON_DEV_BASE64` / `_PROD_BASE64` | base64 | 위와 동일, Android config |
| `PLAY_SERVICE_ACCOUNT_BASE64` | base64 | Google Play submit용 service account JSON. `eas-staging.yml`의 "Write Play service account" step이 decode 후 `/tmp/play-service-account.json`으로 작성하면, `eas.json`의 `submit.staging.android.serviceAccountKeyPath`가 이 path를 참조 |
| `ASC_API_KEY_P8_BASE64` | base64 | iOS TestFlight submit용 App Store Connect API Key(.p8). `eas-staging.yml`의 "Write ASC API key" step이 decode 후 `/tmp/asc-api-key.p8`으로 작성하면, `eas.json`의 `submit.staging.ios.ascApiKeyPath`가 이 path를 참조 |
| `SLACK_WEBHOOK_URL` | plain | Slack Incoming Webhook URL. `_notify-slack.yml`이 빌드 시작·결과 알림 전송용으로 사용. 미설정 시 알림 step은 `continue-on-error`로 처리되고 빌드는 정상 진행 |

등록 명령(1회성, 자격증명 회전 시에도 동일)은 다음과 같다.

```bash
base64 -i <path-to-service-account.json> | gh secret set PLAY_SERVICE_ACCOUNT_BASE64 --repo <owner>/<repo>
base64 -i AuthKey_XXXX.p8 | gh secret set ASC_API_KEY_P8_BASE64 --repo <owner>/<repo>
```

EAS Submit의 `serviceAccountKeyPath`는 환경변수 interpolation을 지원하지 않으므로, CI 워크플로우에서 절대 path에 파일을 작성하는 방식이 표준이다.

> **선행 조건: service account 호스트 GCP 프로젝트의 Android Publisher API enable 필수**
> fastlane supply가 `androidpublisher.googleapis.com`을 호출하며, Google API enablement는 service account가 속한 host GCP 프로젝트 기준으로 검사된다. (Play Console의 IAM grant와 별개다)
> service account를 발급하거나 회전할 때 해당 프로젝트(현재 `buddybird-ops`, service account `eas-submit-bot@buddybird-ops.iam.gserviceaccount.com`)에서 Google Play Android Developer API를 enable해야 한다.
> 경로는 GCP Console → 해당 프로젝트 선택 → APIs & Services → Library → "Google Play Android Developer API" → Enable이다. (전파 1~5분)
> 누락 시 submit이 `PERMISSION_DENIED: ... API has not been used in project <number>`로 6회 재시도 후 실패한다. (트러블슈팅은 §12.12)

### 12.6 출시 절차

**개발계 (internal) — 수동 트리거**

1. `feat/* → main` PR을 merge한다. (CI: lint + typecheck + CodeQL)
2. 내부 검증이 필요하면 `eas-staging.yml`을 수동 실행한다. (GitHub Actions UI의 "Run workflow" 또는 `gh workflow run eas-staging.yml --ref main`)
3. EAS build(staging profile, Android+iOS) 후 Android는 Play internal track, iOS는 TestFlight Internal에 자동 제출된다. (내부 테스터 전용이라 Beta App Review 없음)
4. 5~20분 후 Play Console internal track / TestFlight에서 사내 사용자가 설치·검증한다.

**운영계 (production) — 빌드 자동, 출시 수동 게이트**

1. 릴리즈를 결정하면 `main`에서 `yarn release:bump <patch|minor|major>` 커밋을 PR로 머지한다.
2. bump 커밋이 `main`에 들어간 뒤 그 커밋에 태그를 달아 push한다.

   ```bash
   git checkout main && git pull
   git tag "v$(node -p "require('./package.json').version")"
   git push origin "v$(node -p "require('./package.json').version")"
   ```

3. 태그 push로 `eas-production.yml`이 트리거되어 EAS build(production profile, Android+iOS)가 실행된다. (submit 없음)
4. 빌드가 성공하면 GitHub Release(`vX.Y.Z`, `--generate-notes`)가 자동 생성된다.
5. 사람이 Play Console에서 production track으로 promote한다. (의도적 수동 게이트)
6. iOS 운영 출시는 수동이며 CI로 자동화하지 않는다.
   로컬에서 `eas build --profile production --platform ios` → `eas submit --profile production --platform ios --latest` 후, App Store Connect에서 메타데이터·스크린샷(iPhone 6.9")·App Privacy 설문을 입력하고 Submit for Review한다.
   서명과 ASC 자격증명은 EAS-managed다.

### 12.7 핫픽스 절차

단일 트렁크이므로 back-merge cascade가 없다. 두 경우로 나뉜다.

**(A) `main`에 미출시 작업이 없을 때 (일반)**

트렁크에서 바로 고친다.

1. `main`에서 `fix(...)`(또는 `fix!:`) 커밋과 `yarn release:bump patch` 커밋을 PR로 머지한다.
2. 그 커밋에 `git tag vX.Y.Z`를 push하면 자동 production 빌드 → GitHub Release → 수동 promote로 이어진다.

**(B) `main`에 아직 출시 안 한 작업이 섞여 있을 때**

트렁크를 통째로 릴리즈할 수 없으므로 release 브랜치를 쓴다.

1. 직전 운영 태그에서 분기한다. (`git checkout -b release/x.y vX.Y.(Z-1)`)
2. release 브랜치에서 `fix(...)`와 `yarn release:bump patch` 후 `git tag vX.Y.Z`를 push하면 자동 빌드된다.
3. 수정 커밋을 `main`으로 cherry-pick forward한다. (`git cherry-pick <sha>`)
   release 브랜치를 `main`으로 머지백하지 않는다. 머지백이 promote-cascade 분기를 재발시키는 원인이다. (trunkbaseddevelopment.com "Branch for Release")
4. release 브랜치는 출시 안정화 후 삭제한다. (디스포저블)

### 12.8 롤백 절차

| 환경 | 절차 |
|---|---|
| 운영 (Play Production) | Play Console에서 이전 release로 롤백 (EAS Build와 무관한 Play 콘솔 작업) |
| 개발 (staging) | `git revert` 후 `eas-staging.yml`을 다시 트리거하면 다음 빌드가 internal track을 덮어씀 |
| 빌드 자체 | EAS Build는 immutable이라 새 빌드로 대체만 가능 |

### 12.9 자격증명 로테이션 (6~12개월 주기)

| 자격증명 | 절차 |
|---|---|
| `ASC_API_KEY_P8_BASE64` | 신규 키 발급 → `base64 -i AuthKey_XXXX.p8 \| gh secret set ASC_API_KEY_P8_BASE64 --repo <owner>/<repo>` |
| `PLAY_SERVICE_ACCOUNT_BASE64` | Google IAM에서 키 회전 → 동일하게 `gh secret set`으로 덮어쓰기 |
| `EXPO_TOKEN` | robot user 재발급 → GitHub repo secret 갱신 |

### 12.10 브랜치 보호 정책 (GitHub Rulesets)

GitHub Rulesets API(2023+ 신규 방식, legacy branch protection 후속)로 구현한다.
repository visibility가 `public`이거나 Pro/Team/Enterprise plan이어야 사용할 수 있다. (이 repo는 public)

단일 트렁크이므로 보호 대상은 `main` 하나다.
3인 팀 운영 기준은 PR 작성자 포함 최소 2명 합의다.

| Branch | Ruleset 이름 | PR 강제 | `required_approving_review_count` | `dismiss_stale_reviews_on_push` | Linear history | verify CI 통과 |
|---|---|---|---|---|---|---|
| `main` | `main-branch-protection` | ✅ | 1 (= author 포함 2명) | ✅ | ✅ | ✅ (+ `required_review_thread_resolution`) |

`main`은 `deletion`과 `non_fast_forward`(force push)를 차단한다.
태그(`v*`) push는 ruleset의 branch 패턴에 걸리지 않으므로 자동으로 허용되며, 이것이 운영 릴리즈 게이트다.
feature 브랜치는 squash merge 후 삭제하므로 linear history가 유지되고, 단명 브랜치 squash는 분기를 만들지 않는다.

**필수 status check 이름**

Ruleset의 required status checks에 등록할 컨텍스트 이름은 워크플로우 yaml에서 추정하지 않고, 한 번 실행한 뒤 실측한다.

| Branch | Required status checks |
|---|---|
| `main` | `Verify (lint + typecheck) / Verify (lint + typecheck)` · `PR Title (Semantic)` · `Auto Label` · `CodeQL Analyze (javascript-typescript)` |

실측 방법은 `gh api repos/<owner>/<repo>/commits/main/check-runs --jq '.check_runs[].name'`이다.

핫픽스 시 임시 우회가 필요하면 ruleset enforcement를 토글한다. (bypass_actors가 비어 있으므로)

```bash
gh api -X PATCH repos/<owner>/<repo>/rulesets/<main-ruleset-id> -f enforcement=evaluate
# ... hotfix 푸시/머지 ...
gh api -X PATCH repos/<owner>/<repo>/rulesets/<main-ruleset-id> -f enforcement=active
```

### 12.11 CI 워크플로우 구조 (reusable workflows)

검증과 알림 같은 공통 step은 `workflow_call` 전용 reusable workflow로 추출돼 있다.
각 step을 변경할 때 한 곳만 수정하면 호출하는 모든 워크플로우에 반영된다.

| Reusable | 역할 | 호출처 |
|---|---|---|
| `.github/workflows/_verify.yml` | install + `yarn lint` + `yarn typecheck` | `ci.yml` · `eas-staging.yml` · `eas-production.yml` |
| `.github/workflows/_notify-slack.yml` | Slack Incoming Webhook 전송 (started/success/failure/cancelled) | `eas-staging.yml` · `eas-production.yml` |

신규 검증 step(예: 새 lint 도구)은 `_verify.yml`에만 추가한다.
개별 워크플로우에 inline으로 검증 step을 추가하지 않는다. (동기화 누락 위험)

`_notify-slack.yml`의 send step은 `continue-on-error: true`다.
`SLACK_WEBHOOK_URL` 미등록이나 webhook 만료로 알림이 실패해도 호출 측 빌드는 fail로 처리되지 않는다.

전체 트리거 매핑은 다음과 같다.

| 트리거 | 워크플로우 | 동작 |
|---|---|---|
| PR open/sync (→ `main`) | `ci.yml` | reusable `_verify.yml` 호출 (lint + typecheck) |
| PR open/edit/sync | `pr-checks.yml` | PR title commitlint + auto labeler |
| PR (→ `main`) · push `main` · weekly Mon 04:00 UTC | `codeql.yml` | CodeQL JS/TS 보안 스캔 |
| push `main` | `ci.yml` | reusable `_verify.yml` 호출 |
| `workflow_dispatch` (개발계 빌드) | `eas-staging.yml` | verify → Slack 시작 → EAS build (staging profile, Android+iOS) → submit (Play internal + TestFlight Internal) → Slack 결과 |
| push tag `v*` (운영 릴리즈) | `eas-production.yml` | verify → Slack 시작 → EAS build (production profile, Android+iOS) → GitHub Release 생성 → Slack 결과 (submit 없음) |
| weekly Sun 03:00 KST | `cleanup-artifacts.yml` | 14일 초과 artifact 자동 삭제 |

### 12.12 트러블슈팅 (CI/CD)

| 증상 | 원인 | 해결 |
|---|---|---|
| `eas submit` 실패 (`BUILD_NOT_FOUND`) | `--latest`와 빌드 완료 사이 race | 워크플로우가 `eas build ... --wait` 후 submit하므로 정상 발생 안 함. 발생 시 재실행 |
| `eas submit` Android 실패 (`PERMISSION_DENIED: Google Play Android Developer API has not been used in project <number>`) | service account 호스트 GCP 프로젝트에 Android Publisher API 미활성화 (§12.5 선행 조건 누락) | GCP Console의 해당 프로젝트(현재 `buddybird-ops`)에서 `androidpublisher.googleapis.com` enable. 전파 1~5분 후 "Re-run failed jobs" |
| buildNumber 충돌 (`The bundle version must be higher than ...`) | EAS remote 카운터가 스토어와 어긋남 | `eas build:version:set --platform android --profile <profile>`로 카운터 정정 |
| tag를 push했는데 운영 빌드가 안 돎 | 태그 패턴 불일치(`v*` 아님) 또는 push 누락 | `git tag` 이름이 `vX.Y.Z`인지 확인, `git push origin <tag>` 재실행. 이미 존재하는 태그는 git이 거부하므로 새 version bump 필요 |
| Firebase config 미반영 | EAS Secret 갱신 후 기존 빌드는 자동 재반영 안 됨 | 다음 빌드에서 반영. 즉시 필요하면 재빌드 |

### 12.13 단일 트렁크 컷오버 (일회성)

3개 브랜치(dev/staging/main)에서 단일 트렁크(`main`)로의 전환은 한 번만 수행한다.
마지막 reconcile 이후로는 back-merge가 영구히 없다.
GitHub 측 작업(브랜치 삭제·ruleset·default branch)은 외부 상태 변경이므로 관리자가 직접 실행한다.

```bash
# 1. CI/CD 리팩토링 변경셋을 dev에 머지 (PR)
# 2. dev → main 마지막 reconcile (PR, 생애 마지막 promote)

# 3. default branch를 main으로 전환
gh repo edit <owner>/<repo> --default-branch main

# 4. 장수 환경 브랜치 삭제
git push origin --delete dev staging

# 5. 폐지된 ruleset 삭제 (id는 `gh api repos/<owner>/<repo>/rulesets`로 확인)
gh api -X DELETE repos/<owner>/<repo>/rulesets/<dev-ruleset-id>
gh api -X DELETE repos/<owner>/<repo>/rulesets/<staging-ruleset-id>
#    main-branch-protection ruleset은 유지 (§12.10, required checks 동일)
```

이후 모든 작업은 `feat/* → main` PR이며, 운영 출시는 `git tag v*`다.

## 13. Hard Rules

본 환경 분리·배포 정책에서 절대 위반을 금지한다.

- **`APP_VARIANT` 미설정 시 `development`로 fallback한다.**
  prod 빌드는 반드시 `APP_VARIANT=production` 또는 `eas.json`의 production profile을 통해 실행한다.

- **prod의 Bundle ID/package는 변경을 금지한다** (`com.joynnovate.buddybird`).
  변경하면 기존 사용자 업그레이드 경로가 끊긴다.

- **dev/preview profile로 store 제출을 금지한다.**
  `eas.json`의 `submit.staging`은 Play internal track 한정, `submit.production`은 manual gate(`releaseStatus: draft`)다. CI도 동일 제약을 유지한다.

- **`config/`, `GoogleService-Info.plist`, `google-services.json` commit을 금지한다.** (`.gitignore`가 강제)
  단, `.easignore`가 EAS tarball 한정으로 `config/{env}/firebase/`만 unignore한다. (§4, §7.2)

- **Android keystore(`*.jks`)와 `credentials.json`은 `config/{env}/android/` 외부에 두지 않는다.**
  다른 경로로 복사·이동 금지, commit 절대 금지, EAS tarball 포함 금지다. (`.easignore`가 `**/*.jks`, `**/credentials.json`, `/config/{env}/android/`를 명시적으로 재제외)
  preview 빌드는 `config/dev/android/`의 dev keystore를 그대로 참조한다. (별도 복사본 생성 금지)

- **Firebase 환경 분리를 유지한다.**
  dev 빌드는 `buddybird-dev` 프로젝트만, prod 빌드는 `buddybird-9b84d` 프로젝트만 쓴다. 한 환경의 config를 다른 환경에 임시로 끼워 넣지 않는다.

- **FCM payload에 보호자 PII를 금지한다.**
  이름·이메일·전화·정확한 위치를 notification title/body/data에 포함하지 않는다. client는 receipt metadata만 저장하고 payload 본문/data는 영속화하지 않는다.

- **`docs/ARCHITECTURE.md`, `README.md`, `CLAUDE.md`에 빌드/배포 명령을 직접 기재하지 않는다.**
  모든 절차는 본 문서로 단일화한다. `rg -l "eas (env|build|submit)" docs/ README.md` 결과가 본 파일 1건만 매치되어야 한다.

- **`package.json` / `app.config.ts`의 `version` 필드 손편집을 금지한다.**
  `yarn release:bump`로만 변경한다. (릴리즈 태그 직전, §12.3) `app.config.ts`는 `pkg.version`으로 단일 source를 참조한다.

- **`main` 브랜치 직접 push를 금지한다.**
  PR-only 보호 브랜치다. 단 운영 릴리즈 `git tag vX.Y.Z` push는 허용한다. (태그 = 운영 게이트, §12.10)

- **장수 환경 브랜치 부활을 금지한다.**
  환경(개발계/운영계)은 EAS profile/channel과 트리거로만 가른다. `dev`/`staging` 같은 평행 장수 브랜치를 다시 만들지 않는다. (squash promote → merge-base 분기 → back-merge 무한 재발, §12.2)

- **`ios.buildNumber` / `android.versionCode`를 `app.config.ts`에 명시하지 않는다.**
  EAS remote autoIncrement가 관리한다. (`eas.json` `appVersionSource: remote` + profile `autoIncrement`)

- **Conventional commit type 정책을 준수한다.**
  정확한 type이 필수다. type은 더 이상 semver를 자동 결정하지 않지만(§12.3 수동 bump), PR title gate(`PR Title (Semantic)`)와 히스토리 가독성·bump 수준 판단의 근거가 된다.
