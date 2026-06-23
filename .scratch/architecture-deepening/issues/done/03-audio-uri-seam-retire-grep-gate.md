# §5 grep 게이트 폐기 + 오디오 URI 영속 문서 갱신

Status: done
Type: chore (scope: docs)
Source: architecture review — 후보 1 (Strong)

## What to build

모든 store가 심화된 seam을 경유하게 되어(#01, #02), "각 storage가 normalize/hydrate를 호출하는지"를 검사하던 CONVENTIONS §5 grep 게이트는 더 이상 필요 없다(invariant가 인터페이스로 강제됨). 게이트를 폐기하고 관련 문서를 새 구조에 맞춘다.

이 슬라이스에서:
- CONVENTIONS §5 의 normalize/hydrate 누락 검사 grep 게이트를 제거한다(코드/CI 양쪽에 존재하면 둘 다).
- CONVENTIONS §6 와 SHARED-MODULES §6.1 을 갱신: 변환은 이제 영속 seam이 소유하며, 호출자는 normalize/hydrate를 직접 호출하지 않음을 단정문으로 기술.
- 변경 이력을 `docs/POLICY-HISTORY.md`에 한 행 추가(또는 `/buddybird-policy-update` 호출).

## Acceptance criteria

- [ ] §5 의 오디오 URI normalize/hydrate 누락 grep 게이트가 제거됨(CI 게이트가 별도로 있었다면 함께)
- [ ] CONVENTIONS §6 와 SHARED-MODULES §6.1 이 "seam이 변환을 소유" 구조로 갱신됨
- [ ] `docs/POLICY-HISTORY.md`에 변경 이력 행 추가
- [ ] 다른 검증 grep(rgba/empty-catch/namespaced firebase 등)과 줄 수 예산 게이트는 그대로 유지됨

## Blocked by

- #01 (오디오 URI 영속 seam 심화 + word-library store 이관)
- #02 (training store 이관)
