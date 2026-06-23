# 에러 보고를 단일 typed 인터페이스로 통합

Status: done
Type: refactor (scope: analytics)
Source: architecture review — 후보 3 (Worth exploring)

## What to build

에러 보고가 이름만 비슷한 두 모듈로 나뉘어 있고, 컨텍스트가 untyped다:

- `features/analytics/error-reporter.ts` — `reportError`, `registerErrorReporter` (수동/스코프별 보고)
- `features/analytics/error-reporting.ts` — `installGlobalErrorReporting` (전역 uncaught 핸들러)
- `reportError(error, context)`의 `context`는 `Record<string, string>` — 16개 caller가 `{ scope, screen_name?, is_fatal? }`를 자유 문자열로 전달. `scope` 오타가 런타임에만 드러난다.

이 슬라이스에서:
- 두 모듈을 하나로 병합하되 두 책임(수동 보고 / 전역 핸들러 설치)은 명확한 export로 유지한다.
- typed `ErrorContext`를 도입한다: `scope` 필수, `screen_name`·`is_fatal` 등은 알려진 optional 키. 키 오타가 컴파일 에러가 되도록.
- 16개 caller를 typed 컨텍스트로 이관(대부분 기계적). `scope` 명명 규칙(`<domain>.<method>`)은 CONVENTIONS §3.3 유지.

주의: `persist-keyed-store.ts`가 `reportError`를 import하므로 #01과 같은 파일을 스친다. 두 작업의 순서를 조율해 churn을 줄인다(하드 블록은 아님).

## Acceptance criteria

- [ ] 에러 보고가 단일 모듈로 통합되고, 수동 보고와 전역 핸들러 설치 책임이 명확히 분리된 export로 유지됨
- [ ] `ErrorContext` 타입 도입(`scope` 필수), 미지정 키 전달이 컴파일 에러
- [ ] 16개 caller가 typed 컨텍스트로 이관됨
- [ ] 전역 uncaught 핸들러 + Crashlytics fanout 동작 보존
- [ ] `docs/SHARED-MODULES.md`의 error-reporter 관련 행 갱신
- [ ] `yarn lint && yarn typecheck` 그린

## Blocked by

None - can start immediately (단, #01과 `persist-keyed-store.ts`를 공유하므로 순서 조율 권장)
