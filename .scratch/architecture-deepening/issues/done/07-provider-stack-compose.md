# provider 스택을 AppProviders 모듈로 합성 + _layout 정리

Status: done
Type: refactor (scope: app)
Source: architecture review — 후보 4 (Worth exploring)

## What to build

`app/_layout.tsx`(237줄)가 폰트 로딩, 인라인 guard 모듈 3개, 라우팅, provider 스택 중첩을 한 파일에서 다룬다. provider 순서는 런타임에만 강제되는 암묵적 인터페이스다(`ProfileProvider`가 `useAnalytics()`를 읽어 `AnalyticsProvider`가 위에 있어야 함).

이 슬라이스에서:
- `_layout.tsx` 안의 인라인 컴포넌트 `FcmHeadlessGuard`, `AppOpenTracker`, `FcmRegistrationBootstrap`, `RootNavigator`를 각각 별도 모듈로 분리한다(`components/` 또는 `app/` 적절 위치).
- 순서가 있는 provider 스택을 단일 `AppProviders` 모듈로 합성한다 — 순서를 한 모듈이 소유. `_layout.tsx`는 `<AppProviders>{children}</AppProviders>` + 폰트/스플래시 정도의 composition-only로 축소.

범위 밖(별도·더 큰 작업): `ProfileProvider → useAnalytics` 숨은 의존 자체의 제거(analytics seam 역전)는 하지 않는다. 본 슬라이스는 순서를 한 곳에 모으되, 그 의존이 남아 있음을 `AppProviders` 모듈에 주석으로 명시한다.

## Acceptance criteria

- [ ] `FcmHeadlessGuard`/`AppOpenTracker`/`FcmRegistrationBootstrap`/`RootNavigator`가 각각 별도 모듈로 분리됨
- [ ] provider 순서가 단일 `AppProviders` 모듈에 정의되고, `_layout.tsx`는 그것을 렌더
- [ ] `app/_layout.tsx`가 composition-only 예산(≤200줄) 내로 축소됨
- [ ] `ProfileProvider → useAnalytics` 순서 의존이 `AppProviders`에 주석으로 명시됨
- [ ] 앱 부팅, 온보딩/탭 라우팅, FCM headless 가드, app-open 추적 동작 보존(수동 확인)
- [ ] `yarn lint && yarn typecheck` 그린

## Blocked by

None - can start immediately
