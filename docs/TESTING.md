# Testing

`buddybird-mobile`의 unit 테스트 정책. 도입 결정: BB-283 (2026-08-02 사용자 승인) — 이전의 "MVP 단계 자동 테스트 미작성" 정책을 대체한다 (`docs/POLICY-HISTORY.md` 참조).

## 1. 러너

- jest-expo preset 기반 Jest — 실행은 `yarn test`
- jest 관련 devDependencies(`jest-expo`·`jest`·`@types/jest`)는 SDK 짝 버전 유지 — 추가·업그레이드는 `npx expo install`/`expo install --fix` 경유
- 테스트 파일 위치: `features/<domain>/__tests__/<module>.test.ts`. describe/it 이름은 영어

## 2. 범위

- **신규 순수 모듈(pure function 모듈)은 unit 테스트를 함께 작성한다** — BB-283 업로드 파이프라인(gate·batch·response·capture-meta·flush 오케스트레이터)이 최초 적용
- **기존 코드에 대한 소급 테스트 작성은 금지** — 해당 모듈을 실질 변경할 때만 추가
- I/O·네이티브 의존 코드는 unit 의무 대상이 아니다 — 수동 검증(README 체크리스트)·기기 검증에 의존. 오케스트레이터처럼 I/O 협력자를 mock 으로 격리할 수 있으면 시나리오 테스트는 권장
- 테스트가 존재하는 영역을 변경하면 커밋 전 `yarn test` green 의무 (`yarn lint`·`yarn typecheck` 와 동급)

## 3. CI

- CI `_verify.yml` 게이트 편입은 **별도 결정으로 이월** — 현재는 로컬(커밋 전) 검증만 의무
