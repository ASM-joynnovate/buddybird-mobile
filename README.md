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

## 환경별 빌드 · 배포

환경 분리(dev/prod) 구성, Firebase config 배치, EAS Cloud 빌드, App Store/Play Store 출시 절차는 [`docs/BUILD-AND-RELEASE.md`](docs/BUILD-AND-RELEASE.md) 를 참조하세요. 빌드/배포 명령은 본 README 가 아닌 그쪽에서 단일하게 관리됩니다.

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
