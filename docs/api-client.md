# BuddyBird API 호출 규칙

버디버드 백엔드를 호출하는 코드의 계층 및 규칙을 정리합니다.
백엔드 계약은 `buddybird-api`의 `app/schemas/base.py`, `app/errors.py`, `app/middlewares.py`, `app/dependencies.py`를 기준으로 합니다.

## 계층

| 계층 | 위치 | 역할 |
| --- | --- | --- |
| 전송 | `app/lib/api.ts` | base URL, 기본 헤더, 타임아웃, 응답 봉투 검사, `ApiError` 생성 |
| 요청 함수 | `app/apis/<도메인>.ts` | 경로 및 본문 조립, zod 스키마로 `data` 검사 |
| 응답 타입 | `app/types/apis/<도메인>.ts` | zod 스키마, 응답 타입, 요청 인자 타입 |
| 쿼리 키 | `app/hooks/apis/keys/<도메인>.ts` | 로그인한 사용자 ID로 시작하는 도메인별 키 |
| 조회 및 저장 Hook | `app/hooks/apis/<도메인>.ts` | `getXOptions` 및 `useGetX`, 저장 Hook |
| 화면 및 provider | `app/screens`, `app/providers` | Hook으로 조회 및 저장 실행 |

화면은 `fetch` 및 `apiRequest`를 직접 호출하지 않습니다.
서버 응답은 TanStack Query 캐시에만 두고 zustand 스토어나 MMKV에 복사하지 않습니다.

## 전송 계층

`apiRequest(path, schema, options)`는 모든 요청에 다음을 적용합니다.

- `X-BuddyBird-Client: mobile`, `X-Device-Id`, `Accept-Language`, `X-Timezone` 헤더를 붙입니다.
- Supabase 세션의 access token을 `Authorization`에 붙입니다. 로그인 전에 호출하는 앱 업데이트 조회만 `authorizationOmitted: true`로 생략합니다.
- `idempotencyKey`가 있으면 `Idempotency-Key` 헤더로 보냅니다.
- `json`은 JSON 본문 및 `Content-Type`을 만들고, `body`의 FormData에는 `Content-Type`을 붙이지 않습니다.
- `searchParams`의 `undefined` 값은 쿼리 문자열에서 제외합니다.
- 타임아웃은 기본 `API_TIMEOUT_MS` 30초이고, 호출한 쪽의 `signal`을 함께 적용합니다.
- 성공 봉투 `{ message, data, meta }`를 검사한 뒤 `data`를 받은 스키마로 검사하고 `{ data, meta }`를 반환합니다.

실패하면 `ApiError { status, code, message, requestId, body }` 예외가 발생합니다.

- 네트워크 실패는 `CLIENT__NETWORK`, 타임아웃은 `CLIENT__TIMEOUT`, 봉투나 `data` 검사 실패는 `CLIENT__INVALID_RESPONSE`입니다.
- 목록에 없는 서버 오류 코드는 `CLIENT__UNKNOWN_ERROR`입니다.
- `ApiError.retryable`은 상태가 0, 408, 429, 503일 때만 true입니다.
- 500 이상, `CLIENT__INVALID_RESPONSE`, `CLIENT__UNKNOWN_ERROR`는 `reportError`로 보고하고 scope에 `X-Request-ID`를 남깁니다.

## 오류 처리

분기는 HTTP 상태 대신 `ApiError.code`로 합니다.
사용자 문구는 `apiErrorMessage(error, t)`가 `apiError.<code>` 번역 키에서 찾고, `CLIENT__UNKNOWN_ERROR`면 서버 `message`를 사용합니다.

- 입력 필드와 관계없는 실패는 Toast로 표시합니다. 다이얼로그 안의 실패는 다이얼로그를 유지한 채 그 위에 Toast를 표시합니다.
- 401은 `queryClient`의 캐시 `onError`가 `setUnauthorizedHandler`로 등록한 로그아웃을 실행합니다. 로그인 mutation은 `meta.unauthorizedSignOutSkipped`으로 이 처리를 건너뜁니다.
- `DEVICE__NOT_REGISTERED`는 활동 기록 및 하트비트 요청에서 실패로 보고하지 않습니다.
- `retryable`인 오류는 `queryClient` 기본값이 조회 및 저장 모두 최대 2회 재시도합니다.
- `COMMON__IDEMPOTENCY_KEY_REQUIRED`는 클라이언트 버그이므로 사용자에게 재시도를 안내하지 않습니다.

## 엔드포인트

| 엔드포인트 | 멱등키 | 비고 |
| --- | --- | --- |
| `POST /auth/login`, `POST /auth/logout`, `DELETE /auth/withdrawal` | | |
| `GET /app-updates/{platform}` | | 로그인 전에 호출, `Authorization` 생략 |
| `GET /users/me`, `PATCH /users/me` | | |
| `PUT /users/me/blocks/{id}`, `DELETE /users/me/blocks/{id}` | 필요 | |
| `/users/me/settings/*` 쓰기, `POST /users/me/consents` | 필요 | |
| `GET /consents` | | |
| `GET /devices`, `PUT /devices` | `PUT`만 필요 | `PUT /devices`로 등록한 뒤 `X-Device-Id`가 유효해짐 |
| `PUT /devices/me/push-token`, `PUT /devices/me/activity`, `PATCH /devices/me`, `DELETE /devices/{id}` | 필요 | 등록하지 않은 기기는 `DEVICE__NOT_REGISTERED` |
| `/parrots*`, `/words*` 쓰기 | 필요 | |
| `GET /sessions`, `GET /sessions/{id}`, `GET /sessions/{id}/summary`, `GET /sessions/{id}/sounds`, `GET /sessions/{id}/events` | | 목록은 페이지네이션 |
| `POST /sessions`, `POST /sessions/{id}/finish`, `POST /sessions/{id}/heartbeat` | 필요 | |
| `GET /reports`, `GET /leaderboard` | | |
| `GET /feed` | | 피드는 페이지네이션 |
| `PUT /feed/{id}/like`, `DELETE /feed/{id}/like` | 필요 | |
| `GET /notifications`, `GET /notifications/{id}`, `GET /announcements`, `GET /announcements/{id}` | | 목록은 페이지네이션 |
| `POST /notifications/{id}/read`, `POST /notifications/read-all`, `POST /announcements/{id}/read` | 필요 | |
| `POST /feedback`, `POST /abuse-reports` | 필요 | |
| `POST /petcam/turn-credentials` | | |

홈 요약은 서버 엔드포인트가 없습니다.
`apis/home.ts`의 `getHomeSummary`가 진행 중인 학습, 알림 첫 페이지, 공지 첫 페이지를 한 번에 조회해 합칩니다.

## 쿼리 키

쿼리 키는 `hooks/apis/keys/<도메인>.ts`에 도메인마다 둡니다.
모든 키는 `userKeyPrefix()`의 `['api', <로그인한 사용자 ID>]`로 시작합니다.
계정이 바뀌면 앞부분이 달라지므로 이전 계정의 캐시가 화면에 표시되지 않습니다.
저장 Hook의 `mutationKey`는 `apiKeys.mutation('words', 'create')`처럼 만듭니다.
쓰기가 성공하면 상위 키를 무효화해 하위 키까지 다시 조회합니다.

## 쓰기 요청 및 Idempotency-Key

위 엔드포인트 표에서 멱등키가 필요한 쓰기 요청은 `Idempotency-Key`를 보내야 합니다.
키는 mutation 변수에 넣고 요청 함수가 `apiRequest`에 그대로 넘깁니다.
TanStack Query가 재시도하는 동안 변수가 유지되므로 같은 키로 재전송됩니다.

- 화면에서 바로 실행하는 저장은 `useIdempotentMutation`이 `mutate`마다 새 키를 넣습니다.
- 여러 요청을 잇는 흐름의 첫 요청은 호출한 쪽이 만든 키를 넘겨, 재시도할 때 같은 키를 사용합니다.
- 서버는 4xx 응답도 같은 키에 재생하므로, 입력을 수정한 뒤에는 새 키로 보냅니다.

PATCH 본문에서 키를 빼면 유지, `null`을 보내면 비움입니다.
`null`은 서버가 허용한 필드에만 보내고 빈 문자열은 보내지 않습니다.

## 파일 업로드

파일은 업로드 주소를 먼저 받은 뒤 그 주소에 올립니다.

1. `apis/uploads.ts`의 `...Upload` 함수가 파일 크기 및 형식을 보내고 업로드 주소 `{ url, headers }`를 받습니다.
2. `putUploadFile`이 그 주소에 파일을 `PUT`으로 올립니다.
3. 녹음은 서버가 파일 처리를 마칠 때까지 단어를 다시 조회합니다.

| 대상 | 주소를 받는 함수 | 형식 |
| --- | --- | --- |
| 사용자 사진 | `putUserPhotoUpload` | JPEG, PNG |
| 앵무새 사진 | `putParrotPhotoUpload` | JPEG, PNG |
| 단어 녹음 | `postWordRecordingUpload` | `audio/mp4` |
| 학습 중 소리 | `postSessionSoundUpload` | `audio/wav` |
| 펫캠 사진 및 영상 | `postSessionPetcamEventUpload`, `postSessionPetcamVideoUpload` | |

사진 및 녹음은 보내기 전에 `MAX_UPLOAD_BYTES` 5MiB를 넘는지 검사합니다.

## 미디어 URL

사진, 녹음, 소리의 `url`은 만료 시간이 있는 presigned URL입니다.
URL은 저장하지 않고 조회 결과에서만 사용합니다.

## 패턴별 예시

### 조회

```ts
// app/apis/words.ts
export const getWordList = async (): Promise<Word[]> => {
	const { data: words } = await apiRequest('/api/v1/words', z.array(wordSchema));

	return words;
};

// app/hooks/apis/words.ts
export const getWordListOptions = () => queryOptions({ queryKey: wordKeys.all(), queryFn: getWordList });

export const useGetWordList = () => {
	return useSuspenseQuery(getWordListOptions());
};

// suspense 없이 조회하는 곳에서 사용
export const useGetWordListQuery = () => {
	return useQuery(getWordListOptions());
};

// 화면
const { data: wordListData } = useGetWordList();
```

### 페이지네이션 목록

```ts
// app/hooks/apis/announcements.ts
infiniteQueryOptions({
	queryKey: announcementKeys.list(),
	queryFn: ({ pageParam }) => getAnnouncementList({ page: pageParam }),
	initialPageParam: 1,
	getNextPageParam: nextPageNumber,
});
```

### 쓰기

```ts
// app/apis/words.ts
export const patchWord = async ({ id, data, idempotencyKey }: PatchWordParams): Promise<Word> => {
	const { data: word } = await apiRequest(`/api/v1/words/${id}`, wordSchema, {
		method: 'PATCH',
		json: data,
		idempotencyKey,
	});

	return word;
};

// app/hooks/apis/words.ts
export const useRenameWord = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('words', 'rename'),
		mutationFn: patchWord,
	});
};

// 화면
renameWord.mutate({ id, data: { name } }, { onSuccess: handleSaved });
```

## 아직 없는 것

- 오프라인 조회용 Query 캐시 보관
- 항목 ID 및 버전 충돌 처리
