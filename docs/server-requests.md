# 서버 요청 사항

앱은 아래 계약을 목 서버로 먼저 사용합니다.

## 새 계약

1. 익명 로그인과 계정 합치기. 합칠 때 닉네임과 사진은 기존 계정이 비어 있을 때만 익명 계정 값으로 채움
2. 리포트 API `GET /reports?period=day|week|month&start=YYYY-MM-DD`. 응답 모양은 [api-client.md의 리포트 계약](api-client.md#리포트-계약)과 같음
3. 하트비트 `summaries` 항목에 `learning_duration_ms` 추가
4. 세션 시작 요청에 끝나는 시각 `ends_at`과 세션별 수면 시간 `sleep: { sleep_at, wake_at }` 추가
5. 하트비트가 10분 동안 없거나 `ends_at`이 지난 세션을 서버가 끝내고 `ended_by`를 `server`로 기록
6. 학습이 끝난 뒤 모은 소리의 모사 여부를 판정해 `judgment.word_id`에 기록

## 확인이 필요한 것

- 푸시 토큰 종류. 앱은 `getDevicePushTokenAsync`로 받은 토큰을 보내므로 iOS는 APNs 토큰, Android는 FCM 토큰임. 서버가 두 종류를 모두 받는지, iOS도 FCM 토큰이 필요한지 확인 필요
- v1 데이터 이전의 `Idempotency-Key`. 앱은 `legacy-parrot-{v1 ID}`, `legacy-photo-{v1 ID}`, `legacy-word-{v1 ID}`, `legacy-recording-{v1 ID}` 형식의 고정 키를 사용함. 서버가 UUID가 아닌 키를 받는지, 키를 사용자별로 구분하는지, 4xx 응답을 재생하는 기간이 얼마인지 확인 필요
