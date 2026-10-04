# BuddyBird API 호출 규칙

버디버드 백엔드를 호출하는 코드가 따르는 계층과 규칙을 정리합니다.
백엔드 계약은 `buddybird-api`의 `app/schemas/base.py`, `app/errors.py`, `app/middlewares.py`, `app/dependencies.py`를 기준으로 합니다.

## 계층

| 계층          | 위치                          | 역할                                                             |
| ------------- | ----------------------------- | ---------------------------------------------------------------- |
| 전송          | `app/lib/api.ts`              | base URL, 기본 헤더, 타임아웃, 봉투 검증, `ApiError` 변환        |
| 엔드포인트    | `app/apis/<domain>.ts`        | 경로와 본문 조립, zod로 `data` 검증, 타입이 붙은 값 반환         |
| 쿼리 키       | `app/hooks/apis/keys.ts`      | 계정 단위 계층형 키                                              |
| 옵션          | `app/hooks/apis/<domain>.ts`  | `queryOptions`, `infiniteQueryOptions`, `mutationOptions` 팩토리 |
| 화면과 서비스 | `app/screens`, `app/services` | `useQuery`, `useMutation`, `runMutation`으로 옵션을 실행         |

화면과 서비스는 `fetch`와 `apiRequest`를 직접 부르지 않습니다.
서버 응답은 TanStack Query 캐시에만 두고 Zustand나 MMKV에 복사하지 않습니다.

## 전송 계층이 처리하는 것

`apiRequest(path, schema, options)`는 아래를 모든 요청에 적용합니다.

- `X-BuddyBird-Client: mobile`과 `X-Device-Id`를 항상 붙입니다.
- Supabase 세션의 access token을 `Authorization`에 붙입니다. 세션이 없으면 서버 왕복 없이 401 `AUTH__INVALID_TOKEN`을 던집니다.
- `idempotencyKey`가 있으면 `Idempotency-Key`로 보냅니다.
- `json`은 JSON 본문과 `Content-Type`을 만들고, `body`에 FormData를 주면 `Content-Type`을 붙이지 않습니다.
- `query`의 `undefined` 값은 제외합니다. 서버는 모르는 키를 422로 거부합니다.
- 30초 타임아웃과 호출자의 `signal`을 함께 적용합니다.
- 성공 봉투 `{ message, data, meta }`를 검증한 뒤 `data`를 주어진 스키마로 검증해 `{ data, meta }`를 돌려줍니다.
- 실패는 `ApiError { status, code, message, requestId, body }`로 던집니다. 네트워크 실패는 `CLIENT__NETWORK`, 타임아웃은 `CLIENT__TIMEOUT`, 봉투나 `data` 검증 실패는 `CLIENT__INVALID_RESPONSE`입니다.
- `ApiError.retryable`은 상태가 0, 408, 429, 503일 때만 true입니다. 500은 재시도하지 않습니다.
- 500 이상과 검증 실패는 `reportError`로 보고하고 scope에 `X-Request-ID`를 남깁니다.

## 오류 처리

분기는 HTTP 상태가 아니라 `ApiError.code`로 합니다.
사용자 문구는 `apiErrorMessage(error, t)`가 `apiError.<code>` 번역 키를 찾고, 없으면 서버 `message`를 씁니다.

- 401은 `queryClient`의 캐시 콜백이 Supabase 로그아웃을 호출합니다. 로그인 mutation의 401은 AuthProvider가 직접 처리합니다.
- `DEVICE__NOT_REGISTERED`는 기기 재등록으로 처리합니다.
- `retryable`인 오류는 `queryClient` 기본값이 최대 2회 재시도합니다.
- `COMMON__IDEMPOTENCY_KEY_REQUIRED`는 클라이언트 버그이므로 사용자에게 재시도를 안내하지 않습니다.

## 엔드포인트별 요구 사항

| 엔드포인트                                            | 인증   | 추가 헤더                        | 비고                                                     |
| ----------------------------------------------------- | ------ | -------------------------------- | -------------------------------------------------------- |
| `POST /auth/login`                                    | Bearer |                                  | 본문 없이 보낼 수 있음                                   |
| `GET /users/me`, `PATCH /users/me`, `/users/me/photo` | Bearer |                                  | 멱등키 불필요                                            |
| `/users/me/settings/*`, `/users/me/consents` 쓰기     | Bearer | `Idempotency-Key`                |                                                          |
| `PUT /devices`                                        | Bearer | `Idempotency-Key`                | 기기 등록. 이후 `X-Device-Id`가 유효해짐                 |
| `/devices/me*`                                        | Bearer | `X-Device-Id`, `Idempotency-Key` | 미등록이면 `DEVICE__NOT_REGISTERED`                      |
| `/parrots*`, `/words*` 쓰기                           | Bearer | `Idempotency-Key`                |                                                          |
| `/sessions*` 쓰기                                     | Bearer | `X-Device-Id`, `Idempotency-Key` | 시작, heartbeat, 소리 업로드는 station 기기만            |
| `GET /sessions`, `GET /sessions/{id}/sounds`          | Bearer |                                  | 페이지네이션                                             |
| `POST /feedback`                                      | Bearer | `X-Device-Id`, `Idempotency-Key` | 등록된 기기가 필요. 앱 버전은 기기 정보에서 가져감       |
| `GET /notices`, `GET /notices/{id}`                   | Bearer |                                  | 페이지네이션, `is_read` 포함. 이 두 응답에만 ETag가 붙음 |
| `POST /notices/{id}/read`                             | Bearer | `Idempotency-Key`                | 이미 읽었어도 성공                                       |

공지 생성, 수정, 삭제, 사진과 피드백 목록은 백오피스 전용이라 앱이 부르지 않습니다.

## 쿼리 키

`apiKeys`는 `["api", <서버 user_id>, ...]`로 시작합니다.
계정이 바뀌면 접두사가 달라져 이전 계정의 캐시가 화면에 나오지 않습니다.
쓰기 성공 뒤에는 상위 키를 무효화해 하위 키까지 갱신합니다.

## 쓰기 요청과 Idempotency-Key

settings, consents, devices, parrots, words, sessions의 POST, PUT, PATCH, DELETE는 `Idempotency-Key`가 필수입니다.
키는 mutation 변수에 넣어 `mutationFn`이 `apiRequest`에 그대로 넘깁니다.
TanStack Query가 재시도하는 동안 변수가 유지되므로 같은 키로 재전송됩니다.

- 화면에서 바로 실행하는 mutation은 `mutate({ ...input, idempotencyKey: randomUUID() })`로 호출마다 새 키를 만듭니다.
- 전송 대기 데이터는 MMKV에 저장한 `change_id`를 키로 씁니다. 내용이 바뀌면 새 `change_id`를 발급합니다.
- 서버는 4xx 응답도 같은 키에 재생하므로, 입력을 고친 뒤에는 반드시 새 키로 보냅니다.

PATCH 본문은 `undefined` 키를 제거한 뒤 보냅니다.
키를 생략하면 유지, `null`을 보내면 비움이며 `null`은 서버가 허용한 필드에만 보냅니다.
빈 문자열은 보내지 않습니다.

## multipart 업로드

파일 파트에는 `uri`, `name`, `type`을 모두 넣습니다.
서버는 파일명 대신 파트의 `Content-Type`으로 형식을 판정합니다.
5MiB 제한과 허용 형식은 보내기 전에 검사합니다.
사진은 JPEG와 PNG, 녹음 샘플은 m4a, wav, mp3, 세션 소리는 wav만 허용됩니다.

## 미디어 URL

`photo.url`, `recordings[].url`, `audio.url`은 1시간 뒤 만료되는 presigned URL입니다.
`staleTime`을 그보다 훨씬 짧게 두고, URL을 저장하지 않습니다.

## 패턴별 예시

### 목록 조회

```ts
// app/apis/words.ts
const recordingSchema = z.object({
	id: z.uuid(),
	url: z.url(),
	created_at: z.iso.datetime({ offset: true }),
})
const wordSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	recordings: z.array(recordingSchema),
})

export type Word = z.infer<typeof wordSchema>

export async function fetchWords() {
	const { data } = await apiRequest("/api/v1/words", z.array(wordSchema))

	return data
}

// app/hooks/apis/words.ts
export const wordsQueryOptions = () =>
	queryOptions({ queryKey: apiKeys.words.all(), queryFn: fetchWords })

// 화면
const words = useQuery(wordsQueryOptions())
```

### 페이지네이션 목록

```ts
// app/apis/sessions.ts
export async function fetchSessions(page: number) {
	const { data, meta } = await apiRequest("/api/v1/sessions", z.array(sessionSchema), {
		query: { page, count_by_page: 20 },
	})

	return { data, meta: pageMetaSchema.parse(meta) }
}

// app/hooks/apis/sessions.ts
export const sessionsQueryOptions = () =>
	infiniteQueryOptions({
		queryKey: apiKeys.sessions.list(),
		queryFn: ({ pageParam }) => fetchSessions(pageParam),
		initialPageParam: 1,
		getNextPageParam: (last) => (last.meta.is_last ? undefined : last.meta.current_page + 1),
	})
```

### 쓰기 요청

```ts
// app/apis/parrots.ts
export type CreateParrotInput = { name: string; species: string; birthdate?: string }

export async function createParrot(input: CreateParrotInput, idempotencyKey: string) {
	const { data } = await apiRequest("/api/v1/parrots", parrotSchema, {
		method: "POST",
		json: input,
		idempotencyKey,
	})

	return data
}

// app/hooks/apis/parrots.ts
export const createParrotMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("parrots", "create"),
		mutationFn: ({
			input,
			idempotencyKey,
		}: {
			input: CreateParrotInput
			idempotencyKey: string
		}) => createParrot(input, idempotencyKey),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: apiKeys.parrots.all() }),
	})

// 화면
const { mutate } = useMutation(createParrotMutationOptions())
mutate({ input, idempotencyKey: randomUUID() })

// React 밖의 전송 서비스
await runMutation(createParrotMutationOptions(), { input, idempotencyKey: change.changeId })
```

### multipart 업로드

```ts
// app/apis/words.ts
type RecordingFile = { uri: string; name: string; type: "audio/m4a" | "audio/wav" | "audio/mpeg" }

export async function addWordRecording(
	wordId: string,
	file: RecordingFile,
	idempotencyKey: string,
) {
	const form = new FormData()

	form.append("file", file as unknown as Blob)

	const { data } = await apiRequest(`/api/v1/words/${wordId}/recordings`, wordSchema, {
		method: "POST",
		body: form,
		idempotencyKey,
		timeoutMs: 60_000,
	})

	return data
}
```

## 아직 없는 것

- 오프라인 조회용 Query 캐시 보관. `@tanstack/react-query-persist-client`와 MMKV persister를 계정별로 붙일 때 추가합니다.
- 기기 등록 호출. `client_device_id`는 `clientDeviceId()`가 만들지만 `PUT /devices`는 아직 부르지 않습니다.
- 항목 ID와 버전 충돌 처리. 백엔드에 `client_generated_id`와 `version_id`가 추가된 뒤 설계합니다.
