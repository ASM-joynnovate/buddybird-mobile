# 기기 저장값 설계

앱이 기기에 저장하는 값의 위치, 키, 형식, migrate 규칙을 정리합니다.

## 저장소

| 저장소 | 사용하는 곳 | 저장하는 값 |
| --- | --- | --- |
| MMKV 인스턴스 `buddybird.device` | `app/lib/storage.ts` | zustand persist 스토어 세 개 |
| SecureStore | `app/lib/supabase.ts` | Supabase 로그인 세션 |
| AsyncStorage | `app/services/migration` | v1 앱이 남긴 값, 읽기만 함 |

MMKV는 `react-native-mmkv` 4.3.2를 사용합니다.
서버 응답은 TanStack Query 캐시에만 두고 기기에 저장하지 않습니다.
Query 캐시도 기기에 보관하지 않습니다.

의존 규칙이 다음을 막습니다.

- `react-native-mmkv`는 `app/lib/storage.ts`만 가져옵니다.
- `@react-native-async-storage/async-storage`는 `app/services/migration`만 가져옵니다.

## MMKV 키

키 이름 및 버전은 `app/lib/storage.ts`의 `storeStorageKeys`에 모아 둡니다.

| 키 | 버전 | 스토어 | 저장하는 필드 |
| --- | --- | --- | --- |
| `device-settings` | 2 | `useDeviceSettingsStore` | `locale`, `analyticsConsent`, `updatePrompt`, `feedbackPrompt`, `onboardingCompleted`, `usageGuideSeen`, `petcamGuideSeen`, `pullToRefreshUsed`, `pullToRefreshHintShownScreens`, `legacyMigration`, `lastLoginProvider`, `clientDeviceId`, `splashShown` |
| `auth` | 1 | `useAuthStore` | `authUserId`, `isAnonymous`, `loginScreenSeen`, `loginProvider` |
| `account` | 3 | `useAccountStore` | `serverUserId` |

세 키 모두 기기 단위입니다.
로그아웃하면 auth의 `authUserId`, `isAnonymous`, `loginScreenSeen` 및 account의 `serverUserId`를 비웁니다.
`device-settings`는 로그아웃 및 다른 계정 로그인 뒤에도 유지합니다.

값은 zustand persist 형식 `{ state, version }`의 JSON 문자열입니다.
`partialize`가 위 표의 필드만 저장하고, `status`, `retryCount` 같은 실행 중 값은 저장하지 않습니다.

## 복원

`restoreOptions`가 저장값을 스토어별 zod 스키마로 검사한 뒤 초기값에 합칩니다.

| 키 | 스키마 |
| --- | --- |
| `device-settings` | `deviceSettingsSchema` |
| `auth` | `authSchema` |
| `account` | `accountSchema` |

검사에 실패하면 저장값을 버리고 초기값을 사용합니다.
실패 내용은 기록해 두고, 앱 시작 때 `services/bootstrap.ts`가 `takeRestoreErrors`로 가져가 보고합니다.
나중에 추가한 필드는 스키마의 `default`로 이전 저장값을 받습니다.

## migrate

필드를 옮기거나 형식을 변경하면 `storeStorageKeys`의 버전을 올리고 스토어의 `migrate`를 작성합니다.

### account v2에서 나눈 값

v2까지는 `account` 키 하나에 로그인 정보, 서버 사용자 ID, 마지막 로그인 방식, 기기 ID를 함께 저장했습니다.
현재는 세 키로 나눕니다.

| v2 필드 | 옮긴 곳 |
| --- | --- |
| `authUserId`, `isAnonymous`, `loginScreenSeen`, `loginProvider` | `auth` v1 |
| `serverUserId` | `account` v3 |
| `lastLoginProvider`, `clientDeviceId` | `device-settings` v2 |

account 스토어가 v3로 migrate하면 나머지 필드가 사라집니다.
그래서 `app/lib/storage.ts`는 스토어를 만들기 전에 `account` 키의 v2 저장값을 `accountV2`로 한 번 읽어 둡니다.

- auth 스토어는 `auth` 키가 비어 있으면 `accountV2`의 원래 문자열을 읽고, 이 값을 `authSchema`로 복원합니다.
- device-settings 스토어의 v1에서 v2로 가는 `migrate`가 `accountV2`에서 `lastLoginProvider`, `clientDeviceId`를 가져옵니다.
- account 스토어는 `serverUserId`만 남깁니다.

v2 저장값이 없거나 형식이 맞지 않으면 `accountV2`는 `null`이고 각 스토어는 초기값을 사용합니다.

## v1 앱 데이터

v1 앱은 AsyncStorage에 `@buddybird/`, `@pethub/`로 시작하는 키를 남겼습니다.
`app/services/migration/upload-legacy.ts`가 이 값을 읽기만 하고 지우지 않습니다.

- 설정 값 `locale`, `analytics-consent`, `app-update`, `feedback-prompt`는 한 번 읽어 `device-settings`에 넣습니다.
- 앵무새 정보 `parrot-profile`, 단어 및 녹음 `wordLibrary`는 서버에 올립니다.

진행 상태는 `device-settings`의 `legacyMigration`에 저장합니다.

| 필드 | 뜻 |
| --- | --- |
| `settingsImported` | 설정 값을 넣었는지 여부 |
| `uploadStatus` | `pending`, `started`, `finished` |
| `parrotId` | 서버에 만든 앵무새 ID |
| `photoUploaded` | 앵무새 사진 업로드 여부 |
| `wordProgress` | v1 단어별 서버 단어 ID 및 완료 여부 |
| `idempotencyKeys` | 요청 이름별 Idempotency-Key, 재시도할 때 같은 키 사용 |

## 키를 추가할 때

1. 기존 스토어에 필드를 추가하면 스키마에 `default`를 두고 버전은 유지합니다.
2. 필드 이름이나 형식을 변경하면 버전을 올리고 `migrate`를 작성합니다.
3. 새 스토어를 저장하면 `storeStorageKeys`에 이름 및 버전을 추가하고 `restoreOptions`에 스키마를 넘깁니다.
4. 서버에서 받은 값은 저장하지 않습니다.
