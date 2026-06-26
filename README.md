# 버디버드 Mobile

Expo Router 기반의 BuddyBird 앵무새 음성 학습 코치 앱입니다. Phase 1은 최초 실행 온보딩, 단일 반려조 프로필 저장, 프로필 기반 홈 진입까지 구현합니다.

## 실행

```bash
yarn
yarn start
```

플랫폼별 실행:

```bash
yarn ios
yarn android
yarn web
```

환경별(dev/prod) 빌드 핵심 명령:

```bash
yarn start:dev          / yarn start:prod          # Metro (APP_VARIANT 분기)
yarn ios:dev            / yarn android:dev         # 로컬 dev 빌드 + 실행
yarn eas:build:dev:all  / yarn eas:build:prod:all  # EAS Cloud 빌드 (iOS+Android)
```

> EAS Secret 등록, 로컬 Firebase config 배치, Keystore·credentials.json 운영, App Store/Play Store 출시 등 전체 절차는 [`docs/BUILD-AND-RELEASE.md`](docs/BUILD-AND-RELEASE.md) 가 단일 출처입니다.

## 검증

```bash
yarn lint
yarn typecheck
```

## 배포 (단일 트렁크)

브랜치는 `main` 하나이며, 환경(개발계/운영계)은 브랜치가 아니라 트리거로 가릅니다.

- **통합**: `feat/*`(그 외 `fix/*`·`chore/*` 등) → `main` PR. squash merge 후 브랜치 삭제.
- **개발계**(내부 테스터): GitHub Actions에서 `eas-staging` 워크플로우를 수동 실행.
- **운영계**(스토어): `main`의 커밋에 `v*` 태그를 push.

### 개발계 배포 (내부 TestFlight / Play internal)

GitHub → Actions → "EAS Build & Submit (staging)" → Run workflow (branch: `main`).
또는 CLI로 실행합니다.

```bash
gh workflow run eas-staging.yml --ref main
```

staging 빌드 후 Android는 Play internal track, iOS는 TestFlight Internal에 자동 제출됩니다.
내부 테스터 전용이라 Beta App Review 없이 수 분 내 배포됩니다.

### 운영계 릴리스 (스토어)

1. `main`에서 버전을 bump하고 PR로 머지합니다.

   ```bash
   yarn release:bump patch        # 버그 수정만 / minor: 기능 포함 / major: breaking
   ```

2. 머지된 bump 커밋에 태그를 달아 push하면 운영 빌드가 자동 시작됩니다.

   ```bash
   git checkout main && git pull
   git tag "v$(node -p "require('./package.json').version")"
   git push origin "v$(node -p "require('./package.json').version")"
   ```

   태그 push가 `eas-production` 워크플로우를 트리거하여 Android + iOS를 빌드하고, 성공 시 GitHub Release를 자동 생성합니다.

3. 출시는 수동 게이트입니다.
   - **Android**: Play Console에서 production track으로 promote합니다.
   - **iOS**: 로컬에서 제출합니다. (절차는 [`docs/BUILD-AND-RELEASE.md`](docs/BUILD-AND-RELEASE.md) §12.6)

### 핫픽스

`main`에 미출시 작업이 없으면 `main`에서 바로 `fix(...)` + `yarn release:bump patch` 후 태그를 답니다.
미출시 작업이 섞여 있으면 직전 운영 태그에서 `release/x.y` 브랜치를 cut하여 거기서 고쳐 태그를 달고, `main`으로는 cherry-pick forward합니다. (머지백 금지)
상세는 [`docs/BUILD-AND-RELEASE.md`](docs/BUILD-AND-RELEASE.md) §12.7을 참조하세요.

> 환경 분리 구성, EAS Secret, Firebase config 배치, Keystore 운영, iOS App Store 제출 등 전체 절차와 트러블슈팅은 [`docs/BUILD-AND-RELEASE.md`](docs/BUILD-AND-RELEASE.md) 가 단일 출처입니다.

## Phase 1 범위

- 프로필이 없으면 온보딩을 건너뛸 수 없습니다.
- 온보딩은 welcome, profile, goals 3단계입니다.
- 이름, 종, 나이, 선택 사진, 학습 목표를 로컬에 단일 프로필로 저장합니다.
- 저장된 프로필이 있으면 다음 실행부터 홈으로 바로 진입합니다.
- 홈과 프로필 탭은 Phase 1-safe placeholder만 표시합니다.

## 아직 구현하지 않는 범위

- 오디오 녹음, 피치 변환, 미리듣기
- 세션 설정과 Active Session
- 학습 결과, 누적 단어 기록, 학습 성공 판정
- 다중 프로필 추가와 삭제
- analytics, i18n, 백엔드 동기화

## 수동 확인 체크리스트

1. 브라우저 또는 앱 저장소를 비운 뒤 실행합니다.
2. 첫 화면에서 온보딩 welcome이 보이는지 확인합니다.
3. 빈 이름 또는 빈 종으로 다음 단계 이동이 막히는지 확인합니다.
4. 기본 종과 직접입력 종 모두 저장되는지 확인합니다.
5. 목표를 하나 이상 선택하고 저장하면 홈으로 이동하는지 확인합니다.
6. 새로고침 후 온보딩을 건너뛰고 홈이 보이는지 확인합니다.
7. 프로필 탭에 단일 프로필 MVP 안내가 보이는지 확인합니다.
