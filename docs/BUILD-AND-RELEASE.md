# Build & Release

`buddybird-mobile`의 환경 분리·EAS 빌드·App Store/Play Store 출시에 대한 **단일 진실 소스(SSoT)**. 절차·명령어·트러블슈팅은 모두 본 문서에 모이며, 다른 docs/README/CLAUDE.md 에서는 본 문서로 링크만 건다.

---

## 1. 환경 개요

| 환경 | 목적 | 사용 시점 |
|---|---|---|
| `development` | 로컬 개발·디버깅 + 빠른 ad-hoc QA | 매일의 개발, 시뮬레이터 실행, EAS development client 빌드, ad-hoc 직원 QA (preview profile) |
| `staging` (CI) | **개발계 CI 배포** — staging 브랜치 push 시 자동 빌드 + Play internal track 자동 제출 | merge 즉시 사내 internal track 으로 출시되는 store-build (dev Firebase·dev 식별자) |
| `production` | 운영·심사·스토어 제출 | App Store/Play Store 제출. main release tag 자동 빌드 + 수동 promote |

- dev 와 prod 는 **Bundle ID / Android package / Firebase project / scheme / display name 까지 완전 분리**된다.
- 동일 시뮬레이터·실기기에 dev 와 prod 빌드가 **동시 설치** 가능하다.
- **staging 은 dev Firebase 를 공유** 한다 (`.dev` Bundle ID, `buddybird-dev` 프로젝트). 별개 Firebase 프로젝트로 격리하지 않는 것은 본 프로젝트 운영비/규모 trade-off 의 결과 — preview / staging 모두 같은 dev 환경 대상이며 distribution 방식(ad-hoc vs store)만 다르다.
- EAS profile 4종:
  - `development` — 매일의 개발용. `developmentClient: true`, Metro 연결로 hot reload·dev menu 사용. 개발자 본인이 받는 빌드.
  - `preview` — **ad-hoc QA** 빌드. `developmentClient: false`, `distribution: internal` (EAS Install Link 로 디바이스에 직접 설치). dev 식별자·dev Firebase. CI 무관 — 직원이 수동으로 `yarn eas:build:preview:all`.
  - `staging` — **개발계 CI 배포** 용. `distribution: store`, dev 식별자·dev Firebase. staging 브랜치 push 트리거로 자동 빌드되어 Play internal track 에 자동 제출. preview 와 분리된 독립 profile (extends 사용 X — distribution 충돌 방지).
  - `production` — App Store/Play Store 제출용. prod 식별자·prod Firebase. main release tag 트리거.

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
| EAS environment (env store) | `development` / `preview` (staging profile 도 `environment: "preview"` 명시로 preview env 공유 — 별도 staging env 미존재) | `production` |
| distribution | `internal` (dev/preview) / `store` (staging) | `store` |
| CI 트리거 | 없음 (수동) | staging 브랜치 push (staging profile) / `v*.*.*` tag (production profile) |

## 3. Firebase 프로젝트 구성

### 3.1 환경별 별도 프로젝트

| 환경 | Firebase project ID | iOS app Bundle ID | Android app package |
|---|---|---|---|
| dev | `buddybird-dev` | `com.joynnovate.buddybird.dev` | `com.joynnovate.buddybird.dev` |
| prod | `buddybird-9b84d` | `com.joynnovate.buddybird` | `com.joynnovate.buddybird` |

dev 와 prod 는 **별도 Firebase 프로젝트**이며 Analytics·Crashlytics·Firestore·Auth·Functions·quota·IAM 까지 모두 분리된다. 개발 중 발생하는 이벤트가 운영 대시보드를 오염시키지 않는다.

### 3.2 신규 환경/앱 추가 절차

1. Firebase Console 에서 새 프로젝트 생성 (예: `buddybird-staging`)
2. 해당 프로젝트에 iOS app (`com.joynnovate.buddybird.staging`) 과 Android app (`com.joynnovate.buddybird.staging`) 등록
3. Analytics ON, Crashlytics ON 확인
4. `GoogleService-Info.plist` (iOS), `google-services.json` (Android) 다운로드
5. `config/staging/firebase/` 디렉토리에 배치 (§4 규칙)
6. EAS env 에 file 변수 등록 (§5)
7. `app.config.ts` 의 `resolveAppVariant` / `BUNDLE_ID` / `IOS_GOOGLE_SERVICES_FILE` / `ANDROID_GOOGLE_SERVICES_FILE` 분기에 staging 케이스 추가
8. `eas.json` 에 staging build profile 추가

## 4. config 디렉토리 규칙

환경별 비밀 설정은 **`{repo_root}/config/{environment}/{service}/...`** 트리에 배치한다. 본 디렉토리는 `.gitignore` 된다.

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

신규 서비스(예: Sentry DSN file, Microsoft Clarity 별도 키파일 등) 도입 시 동일 트리 아래 `config/{env}/{service}/` 로 확장한다. 새 디렉토리를 만들 필요 없이 정책이 자동 적용된다.

**규칙**:
- 본 디렉토리에 들어가는 파일은 절대 commit 금지 (`.gitignore` 의 `/config/` 라인이 강제)
- 파일명은 Firebase 공식 파일명을 그대로 유지 (`GoogleService-Info.plist`, `google-services.json`) — `app.config.ts` 가 이 경로를 기대한다
- 환경별 디렉토리명은 `APP_VARIANT` 값과 일치 (`dev` 는 `development` 의 약식 — `app.config.ts` 의 fallback 경로 참고)
- **`.easignore` 가 EAS tarball 한정으로 `config/{env}/firebase/` 만 unignore** 한다. `config/{env}/android/` (keystore + `credentials.json`) 는 `.gitignore` · `.easignore` 양쪽 모두에서 제외된다. EAS Local build 의 PREBUILD 가 firebase config 를 디스크에서 직접 읽기 때문에 필요한 조치이며, 신규 service 디렉토리를 추가할 때는 `.easignore` 의 re-include 패턴도 함께 검토한다.

## 5. EAS Secret 운영

Firebase config 파일은 EAS Cloud 의 **file 형 environment variable** 로 업로드되어 빌드 시 자동 주입된다. 로컬에서는 `config/{env}/firebase/` 의 파일을, EAS Cloud 빌드에서는 EAS env 에 등록된 파일을 사용한다.

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

# preview 환경 (직원 internal testing — dev Firebase 사용)
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
# dev config 를 .env.local + config/ 로 동기화
eas env:pull development --environment development --path .env.local
```

`eas env:pull` 은 file 형 변수의 경우 파일을 디스크에 풀고 경로를 `.env.local` 에 기록한다. 자세한 동작은 EAS CLI 버전에 따라 다르므로, 가장 단순한 절차는 §6.4 의 **수동 배치** 이다.

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
#   (A) EAS 에서 풀기
eas env:pull development --environment development --path .env.local
#   (B) 수동 다운로드: Firebase Console → buddybird-dev → iOS/Android 앱 설정 → 파일 다운로드
#       → config/dev/firebase/GoogleService-Info.plist
#       → config/dev/firebase/google-services.json
#       prod 도 동일하게 config/prod/firebase/ 에 배치

# 5. 네이티브 디렉토리 생성 (dev 환경 기준)
yarn prebuild:dev

# 6. 시뮬레이터/에뮬레이터 실행
yarn ios:dev          # iOS 시뮬레이터
yarn android:dev      # Android 에뮬레이터
```

### 6.3 환경 전환

- dev 빌드를 prod 빌드로 바꾸려면 **반드시 `yarn prebuild:prod` 를 다시 돌린 뒤** `yarn ios:prod` / `yarn android:prod` 를 실행한다 (네이티브 디렉토리가 환경에 따라 달라지므로 재생성 필요).
- `prebuild` 는 `--clean` 으로 동작하므로 이전 환경의 네이티브 산출물이 깨끗하게 교체된다.
- Metro 만 단독으로 띄우려면 `yarn start:dev` / `yarn start:prod` 를 사용한다 (이미 prebuild + 네이티브 실행이 끝난 상태에서 JS 만 재로드할 때).

### 6.4 Firebase config 누락 시

`yarn prebuild:dev` 가 `googleServicesFile` not found 에러로 실패한다. §4 의 경로에 파일이 있는지 먼저 확인한다.

## 7. EAS 빌드 절차

EAS 빌드는 **Cloud 빌드** 와 **Local 빌드** 두 가지로 실행할 수 있다. 두 방식 모두 동일한 `eas.json` 의 build profile 과 EAS env 에 등록된 file 변수(`GOOGLE_SERVICES_INFO_PLIST`, `GOOGLE_SERVICES_JSON`) 를 사용한다. profile 의 `env.APP_VARIANT` 가 빌드 머신에 주입되어 `app.config.ts` 의 분기를 결정하고, file env 가 풀려서 `process.env.*` fallback 으로 흘러간다.

### 7.1 Cloud 빌드 (`eas build`)

EAS 빌드 머신에서 실행되며, credentials 와 환경변수는 EAS 가 관리한다. 본인 머신 자원이 거의 들지 않고 결과물을 internal URL/QR 로 받아간다.

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

본인 머신에서 EAS 빌드 파이프라인 그대로 실행. EAS 크레딧 소모 없이 산출물을 만들고, 빌드 머신 내부 문제를 직접 디버깅할 수 있다. iOS 빌드는 macOS + Xcode + CocoaPods 가 필요하며, Android 빌드는 JDK 17 + Android SDK 가 필요하다.

| 명령 | 동작 |
|---|---|
| `yarn eas:build:local:dev:ios` | dev profile, iOS, 로컬 머신에서 빌드 |
| `yarn eas:build:local:dev:android` | dev profile, Android, 로컬 머신에서 빌드 |
| `yarn eas:build:local:preview:ios` | preview profile, iOS, 로컬 머신에서 빌드 |
| `yarn eas:build:local:preview:android` | preview profile, Android, 로컬 머신에서 빌드 |
| `yarn eas:build:local:prod:ios` | prod profile, iOS, 로컬 머신에서 빌드 |
| `yarn eas:build:local:prod:android` | prod profile, Android, 로컬 머신에서 빌드 |

산출물은 `*.ipa` (iOS), `*.aab` 또는 `*.apk` (Android) 형태로 프로젝트 루트 또는 출력 디렉토리에 떨어진다. EAS Cloud 의 `eas submit` 으로 store 에 올리거나, 직접 디바이스에 설치하여 검증할 수 있다.

> Local 빌드는 한 번에 한 플랫폼만 수행한다 (`--platform all` 미지원). iOS + Android 동시 빌드가 필요하면 §7.1 의 cloud 빌드를 사용한다.

> 빠른 개발 루프(시뮬레이터 hot reload)는 §6 의 `yarn ios:dev` / `yarn android:dev`(`expo run`) 가 더 빠르다. local EAS 빌드는 "배포 가능한 산출물" 이 필요할 때 사용한다.

#### Firebase config 의 cloud vs local 채널

| 채널 | 주입 방식 | 우선순위 |
|---|---|---|
| Cloud 빌드 | EAS env 의 file-type secret (`GOOGLE_SERVICES_INFO_PLIST` / `GOOGLE_SERVICES_JSON`) 이 빌드 머신에 자동 풀려 `process.env.*` 로 노출 | 1순위 (`app.config.ts` 의 `??` 분기에서 사용) |
| Local 빌드 | `.easignore` 가 tarball 에 `config/{env}/firebase/` 를 포함시켜 함께 업로드 → `app.config.ts` fallback 경로(`./config/{env}/firebase/...`)에서 직접 로드 | 2순위 (EAS env 가 없을 때 사용) |

Cloud 빌드에서도 `.easignore` 가 firebase config 를 tarball 에 포함시키지만, `app.config.ts` 가 `process.env.GOOGLE_SERVICES_JSON ?? './config/...'` 순서로 fallback 하므로 EAS env 가 항상 우선된다. 따라서 한 환경의 firebase config 가 다른 환경 빌드에 새어 들어가지 않는다.

신규 개발자의 로컬에 firebase config 가 누락된 상태에서 `yarn eas:build:local:*` 를 실행하면 §6.4 와 동일한 `googleServicesFile not found` 또는 PREBUILD `ENOENT` 에러로 실패한다. §6.2 의 4단계로 `config/{env}/firebase/` 에 먼저 배치한다.

#### Android Gradle JVM 메모리 (heap / metaspace)

Local Android 빌드는 `android/gradle.properties` 의 `org.gradle.jvmargs` 를 `plugins/withGradleJvmArgs.js` (config plugin) 가 prebuild 단계에서 **항상** `-Xmx6144m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8` 로 덮어쓴다. `app.config.ts` 의 `plugins` 배열에 등록되어 있으며, Cloud 빌드에도 동일하게 적용된다.

- **직접 편집 금지**: `android/` 는 prebuild 가 매번 재생성하므로 `android/gradle.properties` 직접 수정은 무의미하다. 메모리 값을 바꾸려면 `plugins/withGradleJvmArgs.js` 의 `JVMARGS_VALUE` 상수를 수정한다.
- **OOM 증상**: `Execution failed for task ':react-native-reanimated:configureCMakeRelWithDebInfo[*]'. > Java heap space` 가 발생하면 빌드 머신 RAM 부족이거나 다른 프로세스가 점유 중. 머신 메모리가 8GB 이하라면 `JVMARGS_VALUE` 의 `-Xmx` 를 `4096m` 까지 낮추고 다른 무거운 앱을 종료한다.
- **근거**: 기본값 `-Xmx2048m -XX:MaxMetaspaceSize=512m` 은 RN 0.81 + Reanimated 4.1 + Worklets + New Architecture + 4 ABI (arm64-v8a / armeabi-v7a / x86 / x86_64) CMake 동시 configure 워크로드를 감당하지 못한다.

## 8. App Store / Google Play 제출

### 8.1 사전 체크리스트

- [ ] 현재 브랜치가 `main` 또는 release 브랜치이며 최신
- [ ] `yarn lint && yarn typecheck` 그린
- [ ] CLAUDE.md 의 Hard Rules grep 0건 (rgba, empty catch, namespaced Firebase)
- [ ] 빌드 profile 이 `production` 이며 `APP_VARIANT=production` 임을 EAS 로그로 확인
- [ ] 버전 충돌 없음 — `eas.json` 의 `production.autoIncrement: true` 가 빌드 번호를 올린다
- [ ] dev 빌드가 실수로 prod 채널에 올라가지 않도록 명령어 재확인

### 8.2 빌드 + 제출

```bash
yarn eas:build:prod:all                 # iOS + Android 빌드
eas submit --profile production --platform ios       # App Store Connect
eas submit --profile production --platform android   # Google Play Console
```

`eas submit` 은 `eas.json` 의 `submit.production` 블록을 사용한다. dev/preview profile 은 submit profile 이 정의되지 않으므로 실수로 store 에 올라가지 않는다.

### 8.3 internal 직원 testing 빌드 (preview)

내부 직원이 EAS 내부 배포 링크로 앱을 설치해 **일반 사용자처럼** 동작을 확인하는 빌드. dev Firebase·dev Bundle ID(`com.joynnovate.buddybird.dev`) 를 사용하며 `developmentClient: false` 이므로 Metro 연결·hot reload·dev menu 가 모두 비활성화된다 (= 출시 빌드와 같은 실행 경험).

```bash
yarn eas:build:preview:ios       # iOS internal 배포 빌드
yarn eas:build:preview:android   # Android internal 배포 빌드
yarn eas:build:preview:all       # 둘 다 동시
```

EAS Build 가 완료되면 콘솔/대시보드에 internal 배포 링크(QR + URL) 가 표시된다. 직원에게 그 링크를 공유하면 iOS 는 Ad Hoc / TestFlight internal, Android 는 APK 직접 설치 흐름으로 설치된다. Firebase 이벤트·Crashlytics 는 모두 `buddybird-dev` 프로젝트로 들어간다.

> prod Firebase·prod Bundle ID 로의 출시 직전 sanity check 가 필요해지면, 그 시점에 별도 profile (예: `production-internal`) 을 추가하는 것을 검토한다. 현재는 `preview` = dev 환경 standalone 한 가지 의미로만 운영한다.

## 9. OTA / Update 채널

`expo-updates` 도입 시 사용. 현재는 OTA 미사용. 도입 시:

```bash
eas update --branch development --message "dev hotfix"
eas update --branch production  --message "prod hotfix"
```

브랜치명은 `eas.json` 의 `channel` 과 매칭된다. OTA 도입 시 본 섹션을 갱신할 것.

## 10. 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| `googleServicesFile not found` | `config/{env}/firebase/` 에 파일 미배치 | §6.2 의 4단계로 Firebase config 다운로드·배치 |
| `yarn eas:build:local:*` PREBUILD `ENOENT: ... build/config/{env}/firebase/google-services.json` | (1) `.easignore` 누락으로 tarball 에서 firebase config 가 빠짐, 또는 (2) 로컬에 파일 미배치 | (1) `.easignore` 존재 확인 — 누락 시 본 정책 위반. (2) §6.2 의 4단계로 `config/{env}/firebase/` 배치 |
| `Bundle ID 충돌` (시뮬레이터에서 dev/prod 가 동일 ID) | 이전 환경의 네이티브 디렉토리 재사용 | `yarn prebuild:dev` 또는 `yarn prebuild:prod` 로 `--clean` 재생성 |
| iOS Pod 에러 / RNFirebase static framework | Podfile 의 `$RNFirebaseAsStaticFramework = true` 누락 | `yarn prebuild:{env}` 재실행 (`plugins/withFirebaseStaticPodfile.js` 가 자동 주입) |
| Firebase 이벤트가 잘못된 프로젝트로 들어감 | googleServicesFile 경로 또는 EAS env 값 잘못 | `eas env:list <env> --include-sensitive` 로 등록 파일 확인. `app.config.ts` 의 `process.env.GOOGLE_SERVICES_*` 우선순위 점검 |
| `APP_VARIANT` 미설정 빌드 | 셸 변수 누락 | 모든 빌드 명령은 `yarn :dev` / `yarn :prod` 스크립트를 통해 실행. EAS 빌드는 `eas.json` 의 `env` 가 강제 |
| dev 빌드 이벤트가 prod Firebase 대시보드에 노출 | dev 가 prod googleServicesFile 사용 중 | `Constants.expoConfig.extra.appVariant` 와 Firebase project ID 가 일치하는지 in-app 로그로 확인 |
| Apple/Google 심사 거부 — Bundle ID/패키지명 변경 | prod Bundle ID 가 변경됨 | prod 의 Bundle ID 는 **절대 변경 금지** (`com.joynnovate.buddybird` 고정). dev 에만 `.dev` suffix |

## 11. Android Keystore 관리

Android keystore 와 그 메타데이터(password / alias) 는 **`config/{환경}/android/`** 디렉토리에 함께 보관한다. `.gitignore` 의 `/config/` 가 디렉토리째 무시하므로 commit 위험이 없다.

### 11.1 디렉토리 규칙

```
config/{env}/android/
├── buddybird_{env}_general.jks   # keystore 본체 (binary)
└── credentials.json              # path/keystorePassword/keyAlias/keyPassword
```

- `{env}` 는 `dev` 또는 `prod` (preview 는 dev 패키지명을 공유하므로 dev keystore 를 그대로 사용, 별도 디렉토리 없음 — §11.4 참고)
- 파일명 컨벤션: `buddybird_{env}_{group}.jks`. 일반 빌드용은 `general`, 향후 upload key 별도 분리가 필요해지면 `upload` 등으로 확장
- 절대 commit 금지 (`/config/` 가 강제)

### 11.2 `credentials.json` 형식

같은 디렉토리의 `credentials.json` 은 keystore 그룹별 메타데이터를 다음 형태로 보관한다:

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

- 최상위 키(`general`) 는 **keystore 그룹 이름**. 일반 빌드용 keystore 는 `general` 로 고정. 향후 그룹(예: `upload`) 이 추가되면 같은 객체에 키를 추가해 확장한다.
- `path` 는 `{root}` 를 저장소 루트 절대경로로 치환한 풀 경로. 상대경로 대신 풀 경로로 두는 이유는 빌드 도구·스크립트가 working directory 와 무관하게 keystore 를 찾을 수 있게 하기 위함이다.
- `keystorePassword`, `keyAlias`, `keyPassword` 는 EAS Cloud 에 등록된 값과 정확히 일치해야 한다. **빈 문자열로 commit 금지** — 본 문서는 placeholder 만 보여주며, 실제 값은 §11.3 절차로 받아 채워 넣는다.

새 환경(예: staging) 이 도입되면 동일 구조로 `config/staging/android/credentials.json` 을 만든다.

### 11.3 새 keystore 추가 / 환경 셋업 절차

1. (관리자 1회) EAS 에서 해당 패키지의 keystore 가 없으면 첫 빌드로 자동 생성되거나, `eas credentials --platform android --profile {profile}` 메뉴의 *Set up a new keystore* 로 생성.
2. (관리자) 같은 메뉴의 *Download credentials* 로 `keystore.jks` 와 EAS 가 만든 메타데이터를 받음. EAS 가 제공하는 `credentials.json` 의 password / alias 값을 기록.
3. 받은 파일을 `config/{env}/android/` 로 옮기고 파일명을 `buddybird_{env}_general.jks` 로 변경.
4. 같은 디렉토리에 §11.2 형식의 `credentials.json` 을 작성하고 EAS 에서 받은 값으로 채워 넣음. `path` 는 본인 머신의 저장소 루트 풀 경로로 치환.
5. `git status` 로 `config/` 가 무시되는지 확인.
6. (선택) 로컬 빌드(`yarn eas:build:local:{env}:android`) 가 동일 keystore 로 서명 성공하는지 검증.

팀원이 새로 합류하면 위 1~5 단계는 관리자가 1Password / 안전한 채널로 keystore 와 password 를 전달한 뒤, 받는 사람이 3~5 단계만 수행한다.

### 11.4 환경별 keystore 매핑

| Profile | Package name | 사용할 keystore | `config/.../android/` 위치 |
|---|---|---|---|
| `development` | `com.joynnovate.buddybird.dev` | dev 전용 keystore | `config/dev/android/buddybird_dev_general.jks` |
| `preview` | `com.joynnovate.buddybird.dev` | **dev keystore 공유** | `config/dev/android/buddybird_dev_general.jks` (별도 복사본 두지 않음) |
| `production` | `com.joynnovate.buddybird` | prod 전용 keystore | `config/prod/android/buddybird_prod_general.jks` |

`development` 와 `preview` 는 동일 패키지명(`com.joynnovate.buddybird.dev`)이므로 **같은 dev keystore 로 서명** 해야 동일 기기에서 업그레이드 설치가 가능하다. preview 빌드 시에도 `config/dev/android/` 의 파일을 그대로 사용하며, `config/preview/` 디렉토리는 만들지 않는다.

### 11.5 백업 정책

- **dev keystore** — 분실 시 EAS 에서 재발급 가능. 별도 백업 의무 없음.
- **prod keystore** — `config/prod/android/` 의 사본 외에 1Password / GCS+versioning / S3+KMS 등 안전한 외부 저장소에도 반드시 백업. Play Store App Signing 이 켜져 있어도 upload key 분실은 운영 부담이므로 백업 권장.
- `credentials.json` 의 password 도 동일하게 백업 대상 (keystore 만 있고 password 가 사라지면 사용 불가).

## 12. CI/CD 자동화 파이프라인

### 12.1 브랜치 ↔ 워크플로우 트리거 매핑

| 트리거 | 워크플로우 | 동작 |
|---|---|---|
| PR open/sync (모든 브랜치) | `.github/workflows/ci.yml` | lint + typecheck (Hard Rule 강제) |
| push `dev` / `staging` / `main` | `ci.yml` | lint + typecheck |
| push `staging` | `.github/workflows/eas-staging.yml` | EAS build (staging profile, Android) → submit (Play internal track) |
| push `main` | `.github/workflows/release-please.yml` | release PR 자동 생성/갱신 (semver bump + CHANGELOG) |
| tag `v*.*.*` (release PR merge 시 자동 생성) | `.github/workflows/eas-production.yml` | EAS build (production profile, Android). submit 없음 — 수동 promote |

> ⚠️ **1단계 (현재): Android only.** iOS 워크플로우는 Apple Developer Program 가입 후 활성화한다 (자세한 절차는 git history 의 plan `expo-eas-staging-steady-trinket` Phase 6 참고). 가입 시점에 워크플로우의 `--platform android` 를 `--platform all` 로 전환하고, EAS remote 의 iOS `buildNumber` 카운터를 `eas build:version:set --platform ios --profile {staging|production}` 으로 초기화한다 (`autoIncrement: true` 는 이미 iOS+Android 둘 다 증가시키므로 schema 변경 불필요).

### 12.2 시멘틱 버전 정책 (release-please 자동 bump)

`version` (사용자 노출 X.Y.Z) 와 `buildNumber`/`versionCode` (개발자용) 는 분리 관리:

| 필드 | 누가 결정 | 어떻게 |
|---|---|---|
| `version` (X.Y.Z) | **개발자가 commit message type 으로 의도 표현** → release-please 가 자동 계산 | conventional commits 누적분 분석 |
| `ios.buildNumber` / `android.versionCode` | EAS 자동 | `appVersionSource: remote` + `autoIncrement` — 매 빌드 시 +1 |

**Conventional Commit → semver bump 표**

| Commit 패턴 | bump | 예 |
|---|---|---|
| `fix(scope): ...` | **patch** | `fix(session): resolve preset audio` → 0.1.0 → 0.1.1 |
| `feat(scope): ...` | **minor** | `feat(profile): add parrot profiles` → 0.1.0 → 0.2.0 |
| `feat(scope)!: ...` 또는 commit footer `BREAKING CHANGE: ...` | **major** | pre-1.0 에서는 `bump-minor-pre-major: true` 로 인해 minor 만 증가. 1.0.0 진입은 수동 `Release-As` 만 |
| `chore:`, `docs:`, `style:`, `refactor:`, `test:`, `build:`, `ci:`, `perf:` | bump 없음 | CHANGELOG 에만 기록 가능 |

**pre-1.0 규칙** — `release-please-config.json` 의 `bump-minor-pre-major: true`:
- breaking change 도 1.0.0 으로 올라가지 않고 minor 만 증가
- 1.0.0 진입은 의도적으로만:
  ```bash
  git commit --allow-empty -m "chore: release 1.0.0" -m "Release-As: 1.0.0"
  git push origin main
  ```

**Hard Rule**: `package.json` / `.release-please-manifest.json` / `app.config.ts` 의 `version` 필드는 직접 편집 금지 — release-please 가 PR 로 관리한다. `app.config.ts` 는 `import pkg from './package.json'` 으로 단일 source 를 참조한다.

### 12.3 EAS Secret 표 (account scope)

| Secret 이름 | 타입 | 용도 |
|---|---|---|
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | file | Android submit (Play Console) |
| `GOOGLE_SERVICES_INFO_PLIST_DEV` / `_PROD` | file | (기존) Firebase iOS config |
| `GOOGLE_SERVICES_JSON_DEV` / `_PROD` | file | (기존) Firebase Android config |
| `ASC_API_KEY_P8` *(Phase 6)* | file | iOS submit (TestFlight/App Store) |
| `ASC_API_KEY_ID` *(Phase 6)* | string | iOS submit |
| `ASC_API_KEY_ISSUER_ID` *(Phase 6)* | string | iOS submit |

현재 상태 조회: `eas secret:list --scope account`.

### 12.4 GitHub Secret 표 (repo scope)

| Secret 이름 | 용도 |
|---|---|
| `EXPO_TOKEN` | EAS CLI 인증 (robot user 토큰) |

### 12.5 출시 절차

**개발계 (staging) — 자동 끝까지**
1. `feature/* → dev` PR merge (CI: lint + typecheck)
2. `dev → staging` PR merge → push 즉시 `eas-staging.yml` 자동 트리거
3. EAS build (staging profile, Android) → 자동 Play internal track 제출
4. 5~20분 후 Play Console internal track 에서 사내 사용자가 설치/검증

**운영계 (production) — 빌드 자동, 출시 수동 게이트**
1. `staging → main` PR merge → `release-please.yml` 이 release PR 자동 생성
2. release PR 머지 → tag `vX.Y.Z` 자동 생성 → `eas-production.yml` 자동 트리거
3. EAS build (production profile, Android) — submit 없음
4. **사람이 Play Console 에서 production track promote** (의도적 수동 게이트)

### 12.6 핫픽스 절차

운영 긴급 패치는 staging 우회:
1. `hotfix/*` 브랜치를 main 에서 분기
2. `fix(...)` 또는 `fix!:` (BREAKING) commit
3. `hotfix/* → main` PR (CODEOWNER review 필수)
4. release-please 가 patch bump → tag → 자동 production 빌드 → 수동 promote
5. **hotfix 머지 후 `main → staging` back-merge 의무** (staging 이 main 보다 뒤처지면 다음 staging 빌드가 회귀)

### 12.7 롤백 절차

| 환경 | 절차 |
|---|---|
| 운영 (Play Production) | Play Console 에서 이전 release 롤백 (EAS Build 와 무관, Play 콘솔 작업) |
| 개발 (staging) | `git revert` 후 staging push → 다음 빌드가 internal track 덮어씀 |
| 빌드 자체 | EAS Build 는 immutable — 새 빌드로 대체만 가능 |

### 12.8 자격증명 로테이션 (6~12 개월 주기)

| 자격증명 | 절차 |
|---|---|
| `ASC_API_KEY_P8` (Phase 6 이후) | 신규 키 발급 → `eas secret:create --force --scope account --name ASC_API_KEY_P8 --type file --value <path>` |
| Play service account | Google IAM 에서 키 회전 → 동일하게 `eas secret:create --force ...` 로 덮어쓰기 |
| `EXPO_TOKEN` | robot user 재발급 → GitHub repo secret 갱신 |

### 12.9 브랜치 보호 정책 (GitHub Rulesets)

GitHub Rulesets API (2023+ 신규 방식, legacy `branch protection` 후속) 로 구현. repository visibility 가 `public` 이거나 Pro/Team/Enterprise plan 이어야 사용 가능 — 본 repo 는 public.

3인 팀 운영 기준 정책 (PR 작성자 포함 최소 2명 합의):

| Branch | Ruleset 이름 | PR 강제 | `required_approving_review_count` | `require_code_owner_review` | `dismiss_stale_reviews_on_push` | Linear history | verify CI 통과 | bypass |
|---|---|---|---|---|---|---|---|---|
| `dev` | `dev-branch-protection` | ❌ | — | — | — | ❌ | ❌ (자동 트리거만, 통과 강제 X) | 없음 |
| `staging` | `staging-branch-protection` | ✅ | 1 (= author 포함 2명) | ❌ | ❌ | ✅ | ✅ | 없음 |
| `main` | `main-branch-protection` | ✅ | 1 (= author 포함 2명) | ❌ | ✅ (새 commit push 시 기존 approve 무효화) | ✅ | ✅ (+ `required_review_thread_resolution`) | 없음 |

모든 브랜치 공통: `deletion` 차단, `non_fast_forward` 차단 (force push 차단).

**`required_approving_review_count: 1` 동작** — GitHub 는 PR author 의 self-approve 를 카운트하지 않습니다. 따라서 `1` 설정은 **author + 다른 1명의 reviewer = 총 2명 합의** 를 의미합니다.

**`require_code_owner_review: false`** — CODEOWNERS 매칭 파일이 변경된 PR 이라도 일반 review 1명이면 통과. CODEOWNERS 파일은 유지하되 GitHub 의 auto-assign reviewer 용도로만 사용 (PR 만들 때 자동으로 reviewer 제안).

`required_linear_history: true` 의 결과: PR 머지는 **squash** 또는 **rebase** 만 가능 (일반 merge commit 차단).

현재 적용 상태 조회:
```bash
gh api repos/<owner>/<repo>/rulesets --jq '.[] | {id, name, enforcement}'
gh api repos/<owner>/<repo>/rulesets/<id> --jq '{name, ref_includes: .conditions.ref_name.include, rules}'
```

핫픽스 시 임시 우회 (bypass_actors 가 비어있으므로 ruleset enforcement 토글로 처리):
```bash
gh api -X PATCH repos/<owner>/<repo>/rulesets/<main-ruleset-id> -f enforcement=evaluate
# ... hotfix 푸시/머지 ...
gh api -X PATCH repos/<owner>/<repo>/rulesets/<main-ruleset-id> -f enforcement=active
```

### 12.10 트러블슈팅 (CI/CD 한정)

| 증상 | 원인 | 해결 |
|---|---|---|
| `eas submit` 실패 (`BUILD_NOT_FOUND`) | `--latest` 와 빌드 완료 사이 race | 워크플로우가 이미 `eas build ... --wait` 후 submit 하므로 정상 발생 안 함. 발생 시 재실행 |
| buildNumber 충돌 (`The bundle version must be higher than ...`) | EAS remote 카운터가 스토어와 어긋남 | `eas build:version:set --platform android --profile <profile>` 로 카운터 정정 |
| release-please PR 안 만들어짐 | main 에 conventional commit 이 없거나 모두 `chore:` 만 누적 | `feat:` 또는 `fix:` commit 1개 필요 |
| Firebase config 미반영 | EAS Secret 갱신 후 기존 빌드는 자동 재반영 안 됨 | 다음 빌드에서 반영. 즉시 필요하면 재빌드 |

## 13. Hard Rules

본 환경 분리 정책에서 절대 위반 금지:

- **`APP_VARIANT` 미설정 시 `development` 로 fallback**. prod 빌드는 반드시 `APP_VARIANT=production` 또는 `eas.json` 의 production profile 을 통해 실행.
- **prod 의 Bundle ID/package 는 변경 금지** (`com.joynnovate.buddybird`). 변경 시 기존 사용자 업그레이드 경로 단절.
- **dev/preview profile 로 store 제출 금지**. `eas.json` 의 `submit.staging` 은 Play internal track 한정, `submit.production` 은 manual gate (`releaseStatus: draft`). CI 도 동일 제약 유지.
- **`config/`, `GoogleService-Info.plist`, `google-services.json` commit 금지** (`.gitignore` 가 강제). 단, `.easignore` 가 EAS tarball 한정으로 `config/{env}/firebase/` 만 unignore 한다 — §4, §7.2 참고.
- **Android keystore (`*.jks`) 와 `credentials.json` 은 `config/{env}/android/` 외부에 두지 않는다**. 다른 경로에 복사·이동 금지, commit 절대 금지, **EAS tarball 포함 금지** (`.easignore` 가 `**/*.jks`, `**/credentials.json`, `/config/{env}/android/` 를 명시적으로 재제외). preview 빌드는 `config/dev/android/` 의 dev keystore 를 그대로 참조한다 (별도 복사본 생성 금지).
- **Firebase 환경 분리 유지** — dev 빌드는 `buddybird-dev` 프로젝트만, prod 빌드는 `buddybird-9b84d` 프로젝트만 사용. 한 환경의 config 를 다른 환경에 임시로 끼워 넣지 말 것.
- **`docs/ARCHITECTURE.md`, `README.md`, `CLAUDE.md` 에 빌드/배포 명령을 직접 기재하지 않는다** — 모든 절차는 본 문서로 단일화. `rg -l "eas (env|build|submit)" docs/ README.md` 결과가 본 파일 1건만 매치되어야 한다.
- **`package.json` / `.release-please-manifest.json` / `app.config.ts` 의 `version` 필드 직접 편집 금지** — release-please 가 PR 로 관리. `app.config.ts` 는 `pkg.version` 으로 단일 source 참조.
- **`staging` / `main` 브랜치 직접 push 금지** — PR-only 보호 브랜치. 우회는 §12.6 핫픽스 절차로만.
- **`ios.buildNumber` / `android.versionCode` 를 `app.config.ts` 에 명시 금지** — EAS remote autoIncrement 가 관리 (`eas.json` `appVersionSource: remote` + profile `autoIncrement`).
- **Conventional commit type 정책 준수** — 출시될 변경에는 `feat:` (minor) / `fix:` (patch) / `feat!:` 또는 footer `BREAKING CHANGE:` (major) 의 정확한 type 필수. 잘못된 type → 잘못된 semver bump → 운영 출시 사고.
