# ProfileProvider → useAnalytics 순서 의존 명시화

Status: done
Type: refactor (scope: app)
Source: architecture review 2회차 — 후보 4 (Worth exploring)

## What to build

#07 이 의도적으로 범위 밖으로 남긴 후속. `ProfileProvider` 가 컴포넌트 body 에서 `useAnalytics()` 를 직접 읽어, `AnalyticsProvider` 가 반드시 바깥에 있어야만 동작한다. 이 순서는 타입이 아니라 `AppProviders` 의 **주석으로만** 강제되며, 재배열하면 런타임 크래시("useAnalytics must be used inside AnalyticsProvider")만 난다. provider 의존 매트릭스가 두 파일에 분산돼 있다.

이 숨은 의존을 명시적 계약으로 바꾼다. 접근(택1, 작은 것부터):
- (작게) `ProfileProvider` 의 analytics 동기화(`setUserId`/`setUserProperty`)를 effect 로 지연시켜 마운트 순서 결합을 끊는다.
- (크게) 의존을 역전 — analytics ready 시 profile sync 를 신호로 받는 이벤트 기반, 또는 `AppProviders` 가 순서를 타입으로 표현하는 합성 헬퍼.

본 슬라이스는 동작(부팅 시 userId/userProperty 동기화)을 보존하면서 순서 결합만 명시화/완화한다.

## Acceptance criteria

- [x] `ProfileProvider` 의 analytics 의존이 컴포넌트 body 직접 호출(`useAnalytics()`, throw)에서 optional 구독(`useOptionalAnalytics()`) + effect 게이팅으로 바뀌어, provider 마운트 순서에 대한 하드 크래시 결합이 완화됨
- [x] provider 순서 계약이 주석이 아닌 구조(optional read + effect 게이팅 + 순서 위반 시 dev warn)로 표현됨
- [x] 부팅 시 userId/userProperty 동기화 동작·타이밍 보존(effect deps `[analyticsReady, installationId, profile, setUserId, setUserProperty]` 원본과 동등 — 1:1 대조). 정상 순서에선 `useOptionalAnalytics()`가 항상 valid context 반환이라 analytics ready 전 sync 누락 없음
- [x] `yarn lint && yarn typecheck` 그린 (앱 부팅·온보딩 수동 확인은 사용자 검증 대기)

## Blocked by

None - can start immediately
