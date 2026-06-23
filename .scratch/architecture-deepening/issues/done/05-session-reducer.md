# 세션 상태머신을 순수 sessionReducer로 추출

Status: done
Type: refactor (scope: training)
Source: architecture review — 후보 2 (Strong)

## What to build

세션 라이프사이클(idle → running/paused → rest → cycle 증가 → completed)이 어느 파일에도 단일하게 정의돼 있지 않다. 전이는 `features/training/hooks/use-active-session.ts`의 5개 effect와 `setTimeout(..., 980)` 매직 딜레이에 흩어져 있고, 완료 판정(`cycle >= totalCycles`)도 effect 내부에 숨어 있다.

이 슬라이스에서:
- 세션 상태 전이를 **순수 `sessionReducer`**(reducer(state, action) → state) 한 모듈로 추출한다. action 예: tick / pause / resume / advancePhase. reducer가 phase·cycle·완료 판정·합법 전이를 소유한다(불법 전이는 표현 불가능하게).
- `use-active-session`은 타이머를 돌려 reducer로 dispatch하고 파생값을 노출하는 얇은 hook으로 축소한다(#04의 cycle 파생 함수 소비).
- `980ms` 딜레이를 의미 있는 상수로 명명하고 한 곳에 둔다.
- reducer는 타이머 없이 단위 검증 가능해야 한다 — 인터페이스가 곧 테스트 표면.

## Acceptance criteria

- [ ] 순수 `sessionReducer`가 phase/cycle/완료 전이를 소유(React API·타이머 미사용)
- [ ] 불법 전이(예: idle에서 곧장 completed)가 타입/구조상 표현 불가능하거나 무시됨
- [ ] `use-active-session`이 타이머→dispatch + 파생값 노출로 축소되고 #04 파생 함수를 사용
- [ ] `980ms` 매직 넘버가 명명된 상수로 한 곳에 정의됨
- [ ] reducer가 타이머 없이 검증 가능(전이별 단위 검증 추가)
- [ ] `yarn lint && yarn typecheck` 그린, 세션 진행/일시정지/완료 동작 보존(수동 확인)

## Blocked by

- #04 (세션 cycle 파생 로직 단일화)
