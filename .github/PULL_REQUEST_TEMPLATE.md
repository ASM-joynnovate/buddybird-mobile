<!--
PR title 형식: <type>(<scope>): <subject>
  - type: feat | fix | docs | chore | refactor | test | ci | perf | build | revert
  - subject: 소문자로 시작 (예: "feat: add onboarding screen")
  - breaking: 'feat!:' 또는 footer 'BREAKING CHANGE:' (semver major)
-->

## 목적
<!-- 1-2 줄. 이 PR이 해결하는 문제 또는 추가하는 가치. -->

## 변경 사항
<!-- 주요 변경을 bullet로. 파일 1:1 매핑보다는 논리 단위로. -->
-
-

## 정책/문서 영향
<!-- 해당되면 체크. docs 갱신이 필요한 경우 어떤 파일을 갱신했는지 명시. -->
- [ ] 새로운 정책/관례 도입 → `docs/POLICY-HISTORY.md` 갱신
- [ ] 빌드/배포 절차 변경 → `docs/BUILD-AND-RELEASE.md` 갱신
- [ ] 공통 모듈/토큰 추가 → `docs/SHARED-MODULES.md` 갱신
- [ ] 해당 사항 없음

## 검증
<!-- 로컬에서 통과했는지 확인하고 체크. -->
- [ ] `yarn lint` 통과
- [ ] `yarn typecheck` 통과
- [ ] iOS / Android 한 곳 이상에서 동작 확인 (해당 시)
- [ ] 스크린샷 또는 영상 첨부 (UI 변경 시)

## E2E (로컬 실행 결과)
<!--
E2E는 더 이상 PR CI 게이트가 아니다 (docs/CONVENTIONS.md §8.4). 앱 동작이 바뀌는 PR은
작성자가 로컬에서 smoke를 돌리고 결과를 여기에 붙인다. 문서·설정만 바뀐 PR은 "해당 없음 + 사유"로 둔다.
-->
- [ ] `yarn e2e:android:smoke` 로컬 통과 (앱 동작 변경 시) — 또는 해당 없음
- 결과:
<!-- maestro 요약(통과/실패 스텝)을 붙여넣거나, "해당 없음: 문서/설정만 변경" 처럼 사유를 남긴다. -->


## 추가 컨텍스트
<!-- 리뷰어가 알아두면 좋을 배경, 트레이드오프, 의도적으로 남긴 항목 등. -->
