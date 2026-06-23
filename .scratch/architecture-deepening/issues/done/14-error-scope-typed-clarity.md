# ErrorContext.scope를 typed로 좁히기 + Clarity recordError 명시

Status: done
Type: refactor (scope: analytics)
Source: architecture review 2회차 — 후보 6 (Speculative)

## What to build

#06 이 `ErrorContext` 키 오타는 컴파일 에러로 막았지만 `scope` 값 자체는 자유 string 이라 `{ scope: 'typo' }` 가 통과하고, 로그 분석 시 scope 가 흩어진다. 전역 핸들러 scope `'global.uncaught'` 는 하드코딩돼 있다. 또 `clarity-provider` 의 `recordError` 가 조용히 no-op 인데, `reportError` 호출자는 모든 provider 도달을 가정한다.

두 가지를 정리한다:
- `scope` 를 제약된 타입(`<domain>` 또는 `<domain>.<method>` 형태의 string literal 패턴/도메인 union)으로 좁힌다. 과하게 경직되지 않는 선에서 — 도메인 prefix 정도만 강제해도 됨.
- provider 인터페이스에 에러 보고 지원 여부를 명시(예: `supportsErrorReporting`)하거나 Clarity 의 no-op 를 의도된 것으로 문서화해, "조용한 누락" 을 드러낸다.

낮은 friction 이라 동작 변경보다 타입·표면화 위주다.

## Acceptance criteria

- [ ] `ErrorContext.scope` 가 자유 string 보다 좁은 타입(도메인 prefix 등)으로 제약되어 오타/임의 scope 가 줄어듦
- [ ] 전역 핸들러의 scope 가 하드코딩 상수가 아니라 명명된 상수/주입으로 정리
- [ ] `clarity-provider.recordError` 의 no-op 가 인터페이스 차원에서 명시되거나 문서화됨(조용한 누락 제거)
- [ ] 기존 에러 보고/fanout 동작 보존
- [ ] `docs/SHARED-MODULES.md` 의 error-reporter 행 갱신, `yarn lint && yarn typecheck` 그린

## Blocked by

None - can start immediately
