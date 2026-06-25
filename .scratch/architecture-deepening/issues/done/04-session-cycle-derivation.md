# 세션 cycle 파생 로직 단일화 (prefactor)

Status: done
Type: refactor (scope: training)
Source: architecture review — 후보 2 (Strong)

## What to build

세션의 cycle 계산 공식이 여러 곳에 중복돼 있다. 동일한 `secsPerCycle = learnSecs + restSecs` / `totalCycles = Math.max(1, Math.floor(totalSeconds / secsPerCycle))` 가 3곳에 있고, 진행률·학습초가 2곳에서 재계산된다:

- `features/training/hooks/use-active-session.ts` (secsPerCycle / totalCycles)
- `features/training/hooks/use-learning-setup.ts` (secsPerCycle / totalCycles)
- `components/session/setup/cycle-summary.tsx` (secsPerCycle / cycles)
- `features/training/hooks/use-session-analytics.ts` (progress = cycle / totalCycles)
- `app/session-active.tsx` (totalLearningSeconds = totalCycles × learnSecs)

이 슬라이스는 후보 2의 prefactor다 — "make the change easy, then make the easy change". cycle 파생을 순수 함수 한 모듈로 추출(`features/training/`의 `*-model.ts` 컨벤션 따름)하고, 위 5개 호출부를 모두 그 함수로 교체한다. 입력은 `{ totalDurationSeconds | sessionMins, learnSecs, restSecs }`, 출력은 `{ secsPerCycle, totalCycles, ... }` + 진행률/학습초 helper. 동작은 완전히 동일해야 한다(반올림 규칙 포함).

`session-config.ts`의 프리셋 생성 로직(learn/rest 비율 산출)은 별개의 책임이므로 이 슬라이스 범위 밖이다 — 건드리지 않는다.

## Acceptance criteria

- [ ] cycle 파생 순수 함수가 한 모듈에 존재(React API 미사용, `*-model.ts` 컨벤션)
- [ ] 위 5개 호출부가 모두 해당 함수를 경유하며 인라인 공식이 제거됨
- [ ] 동일 입력에 대해 기존과 동일한 `totalCycles`/진행률/학습초 산출(반올림 포함)
- [ ] `docs/SHARED-MODULES.md`에 신규 export 행 추가
- [ ] `yarn lint && yarn typecheck` 그린, 세션 실행 시 cycle 수 동일(수동 확인)

## Blocked by

None - can start immediately
