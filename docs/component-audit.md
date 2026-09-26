# 컴포넌트 점검 결과

`app/` 아래 컴포넌트 파일을 컴포넌트 규칙 C1~C8로 점검한 결과입니다.
기준 시점은 7단계 구조 정리를 마친 뒤입니다.

## 규칙

| 번호 | 규칙                                                                 |
| ---- | -------------------------------------------------------------------- |
| C1   | 인자는 5개 이하이고 훅이 만든 값 묶음은 객체 하나로 받음             |
| C2   | 값과 콜백만 받고 `useQuery`와 `useMutation`을 부르지 않음            |
| C3   | `locale`과 `t`를 인자로 받지 않음                                    |
| C4   | 파일 하나에 컴포넌트 하나이고 파일 이름은 컴포넌트 이름의 kebab-case |
| C5   | 부품이 있으면 폴더로 묶고 `index.tsx`만 밖에서 가져감                |
| C6   | 인자는 `interface Props`로 정의                                      |
| C7   | 크기와 모양은 숫자 대신 이름으로 받음                                |
| C8   | 접근성 라벨 조합은 `utils/a11y.ts`의 `joinLabel` 사용                |

C1 예외는 `Button`, `Screen`, `PressableSurface`, `TextField`, `NavRow`, `CheckRow`, `SwitchRow`, `ScreenHeader`, `Sheet`, `AudioWaveform`입니다.
`*Screen.tsx` 화면 파일은 C2 대상이 아니며 쿼리 옵션 팩토리를 직접 실행합니다.
화면 파일 이름은 네비게이터에 등록하는 화면 이름을 그대로 쓰므로 C4의 kebab-case 조건에서 뺍니다.
접근성 라벨을 이어 붙이는 곳은 모두 `joinLabel`을 사용해 C8은 전체 충족입니다.

## 공용 UI

| 파일                                          | 결과                                                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `components/ui/audio-waveform/index.tsx`      | C1 예외, C7 위반으로 `height`와 `barCount`를 숫자로 받음                                                  |
| `components/ui/audio-waveform/wave-bar.tsx`   | C1 위반으로 인자 6개, C7 위반으로 `height`를 숫자로 받음                                                  |
| `components/ui/avatar.tsx`                    | 충족, 크기는 `medium`, `large`, `xlarge`                                                                  |
| `components/ui/button.tsx`                    | C1 예외, 나머지 충족                                                                                      |
| `components/ui/check-mark.tsx`                | 충족, 크기는 `small`, `medium`                                                                            |
| `components/ui/chip.tsx`                      | 충족, `style`과 `testID` 인자 제거                                                                        |
| `components/ui/dot-badge.tsx`                 | 충족, `ui/badge.tsx`에서 분리                                                                             |
| `components/ui/empty-state.tsx`               | 충족, `ui/states.tsx`에서 분리                                                                            |
| `components/ui/icon-button.tsx`               | C1 위반으로 인자 6개이며 계획서의 인자 정리 목록과 같음, `variant`와 `size`를 이름으로 받음               |
| `components/ui/icon.tsx`                      | C7 위반으로 `size`를 숫자로 받음                                                                          |
| `components/ui/inline-error.tsx`              | 충족                                                                                                      |
| `components/ui/page-dots.tsx`                 | 충족, `ui/badge.tsx`에서 분리                                                                             |
| `components/ui/play-button.tsx`               | 충족, 녹음 줄, 소리 줄, 단어 카드, 단어 선택의 재생 버튼을 합침                                           |
| `components/ui/profile-card.tsx`              | 충족, 앵무새 카드와 계정 카드를 합침                                                                      |
| `components/ui/rows/check-box.tsx`            | 충족                                                                                                      |
| `components/ui/rows/check-row.tsx`            | C1 예외, 나머지 충족                                                                                      |
| `components/ui/rows/grouped-list.tsx`         | 충족                                                                                                      |
| `components/ui/rows/nav-row.tsx`              | C1 예외, 나머지 충족                                                                                      |
| `components/ui/rows/picker-row.tsx`           | 충족, 줄을 누르면 시트가 열리는 선택기를 합침                                                             |
| `components/ui/rows/radio-row.tsx`            | 충족, 종 선택과 학습 시간 선택의 라디오 줄을 합침                                                         |
| `components/ui/rows/row-label.tsx`            | 충족                                                                                                      |
| `components/ui/rows/switch-row.tsx`           | C1 예외, 나머지 충족                                                                                      |
| `components/ui/screen-error.tsx`              | 충족, `ui/states.tsx`에서 분리                                                                            |
| `components/ui/screen-header.tsx`             | C1 예외, 나머지 충족                                                                                      |
| `components/ui/screen.tsx`                    | C1 예외, 나머지 충족                                                                                      |
| `components/ui/sheet/backdrop.tsx`            | 라이브러리 인자 타입을 그대로 받음                                                                        |
| `components/ui/sheet/index.tsx`               | C1 예외, 나머지 충족                                                                                      |
| `components/ui/skeleton.tsx`                  | C7 위반으로 `height`를 숫자로 받음                                                                        |
| `components/ui/speech-bubble/index.tsx`       | 충족                                                                                                      |
| `components/ui/speech-bubble/typed-text.tsx`  | 충족                                                                                                      |
| `components/ui/stat.tsx`                      | 충족, 완료 화면과 세션 상세의 숫자 표시를 합침                                                            |
| `components/ui/surface/card.tsx`              | C6 위반으로 `SurfaceProps`를 그대로 받음                                                                  |
| `components/ui/surface/choice-card.tsx`       | 충족                                                                                                      |
| `components/ui/surface/pressable-surface.tsx` | C1 예외, 나머지 충족                                                                                      |
| `components/ui/surface/surface.tsx`           | 표면 기본 부품이며 C1 위반으로 인자 6개와 `ViewProps`, C7 위반으로 `depth`와 `cornerRadius`를 숫자로 받음 |
| `components/ui/tag.tsx`                       | 충족                                                                                                      |
| `components/ui/text-button.tsx`               | 충족, `ui/header.tsx`에서 분리                                                                            |
| `components/ui/text-field.tsx`                | C1 예외, 나머지 충족                                                                                      |
| `components/ui/text/copy.tsx`                 | C6 위반으로 `TextProps`를 그대로 받음                                                                     |
| `components/ui/text/title.tsx`                | 충족                                                                                                      |
| `components/ui/wheel-picker/index.tsx`        | 충족, 생일, 수면 시각, 학습 시간의 바퀴 선택기를 합침                                                     |
| `components/ui/wheel-picker/wheel.tsx`        | 충족                                                                                                      |

## 공용 컴포넌트

| 파일                                             | 결과                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `components/app/app-runtime.tsx`                 | 충족                                                                                       |
| `components/app/app-splash/index.tsx`            | 충족                                                                                       |
| `components/app/app-splash/splash-eye.tsx`       | 충족, `offset`은 크기가 아닌 위치 값                                                       |
| `components/app/startup-screen.tsx`              | 충족                                                                                       |
| `components/buddy-says.tsx`                      | 충족                                                                                       |
| `components/consent-row.tsx`                     | 충족, 콜백을 `actions` 객체로 받음                                                         |
| `components/date-picker.tsx`                     | 충족, `BirthdayPicker`를 대신함                                                            |
| `components/dialogs/confirm-dialog.tsx`          | 충족, 문구는 `text` 객체로 받고 라벨 기본값이 있음, `busy`와 `error`는 `state` 객체로 받음 |
| `components/dialogs/dialog.tsx`                  | 충족                                                                                       |
| `components/dialogs/feedback-dialog.tsx`         | 충족, 저장은 `hooks/use-feedback-form.ts`로 옮김                                           |
| `components/dialogs/permission-dialog.tsx`       | C6 위반으로 `usePermission`의 `PermissionDialogState`를 그대로 받음                        |
| `components/dialogs/update-dialog.tsx`           | 충족, 업데이트 정보는 `decision` 객체로 받음                                               |
| `components/guide-pager.tsx`                     | 충족, 콜백을 `actions` 객체로 받음                                                         |
| `components/illustration.tsx`                    | C7 위반으로 `height`를 숫자로 받음                                                         |
| `components/mascot.tsx`                          | C7 위반으로 `size`를 숫자로 받음                                                           |
| `components/navigation/tab-bar.tsx`              | C6 위반으로 `BottomTabBarProps`를 그대로 받음                                              |
| `components/offline-banner.tsx`                  | 충족                                                                                       |
| `components/profile-form/photo.tsx`              | 충족                                                                                       |
| `components/profile-form/species-picker.tsx`     | 충족                                                                                       |
| `components/session/absence-strip/index.tsx`     | C1 위반으로 인자 10개                                                                      |
| `components/session/absence-strip/legend.tsx`    | 충족                                                                                       |
| `components/session/absence-strip/marker.tsx`    | 충족                                                                                       |
| `components/session/absence-strip/strip-row.tsx` | C1 위반으로 인자 11개                                                                      |
| `components/session/duration-picker.tsx`         | 충족                                                                                       |
| `components/session/sleep-time-editor.tsx`       | 충족, 설정과 홈의 취침과 기상 시각 편집을 합침                                             |
| `components/session/sound-row.tsx`               | 충족, 피드백 조회와 저장은 리포트 화면 훅으로 옮김                                         |
| `components/session/start-dialogs.tsx`           | 충족                                                                                       |
| `components/session/word-picker/index.tsx`       | 충족                                                                                       |
| `components/session/word-picker/word-choice.tsx` | 충족                                                                                       |
| `components/time-picker.tsx`                     | 충족                                                                                       |

## 앱 뼈대와 네비게이터

| 파일                                   | 결과                                         |
| -------------------------------------- | -------------------------------------------- |
| `app.tsx`                              | 충족, 앱 내용과 로그인 뒤 내용을 파일로 분리 |
| `app-content.tsx`                      | 충족                                         |
| `authenticated-content.tsx`            | 충족                                         |
| `navigators/app-navigator.tsx`         | 충족                                         |
| `navigators/main-tabs/index.tsx`       | 충족                                         |
| `navigators/main-tabs/home-tab.tsx`    | 충족                                         |
| `navigators/main-tabs/profile-tab.tsx` | 충족                                         |
| `navigators/main-tabs/report-tab.tsx`  | 충족                                         |
| `navigators/main-tabs/words-tab.tsx`   | 충족                                         |

## 화면 부품

| 파일                                                       | 결과                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| `screens/Entry/components/last-login-tag.tsx`              | 충족                                                          |
| `screens/Entry/components/oauth-button.tsx`                | 충족                                                          |
| `screens/Entry/components/parrot-editor-form.tsx`          | 충족, 앵무새 삭제는 `use-parrot-form.ts`로 옮김               |
| `screens/Home/components/notice-popup.tsx`                 | 충족                                                          |
| `screens/Home/components/notification-item.tsx`            | 충족, `locale` 인자 제거                                      |
| `screens/Profile/components/account-card.tsx`              | 충족                                                          |
| `screens/Profile/components/account-form.tsx`              | 충족                                                          |
| `screens/Profile/components/parrot-card.tsx`               | 충족                                                          |
| `screens/Report/components/event-row.tsx`                  | 충족, `timeline-row.tsx`에서 이름 변경                        |
| `screens/Report/components/report-header.tsx`              | 충족, `locale` 인자 제거                                      |
| `screens/Report/components/session-overview.tsx`           | 충족, 인자는 `record`, `timeline`, `selection`                |
| `screens/Report/components/session-row.tsx`                | 충족                                                          |
| `screens/Report/components/trend-chart.tsx`                | 충족, `locale` 인자 제거                                      |
| `screens/Report/components/word-bars.tsx`                  | 충족                                                          |
| `screens/Session/components/horizon-ring.tsx`              | 충족                                                          |
| `screens/Session/components/run-info.tsx`                  | 충족, `SessionRunScreen.tsx`에서 분리                         |
| `screens/Settings/components/account-actions.tsx`          | 충족                                                          |
| `screens/Settings/components/device-card.tsx`              | 충족, `locale` 인자 제거                                      |
| `screens/Settings/components/disconnect-device-dialog.tsx` | 충족, 저장은 `use-device-actions.ts`로 옮김                   |
| `screens/Settings/components/general-group.tsx`            | 충족                                                          |
| `screens/Settings/components/notification-group.tsx`       | 충족                                                          |
| `screens/Settings/components/permission-row.tsx`           | 충족, `PermissionsScreen.tsx`에서 분리                        |
| `screens/Settings/components/rename-device-dialog.tsx`     | 충족, 저장은 `use-device-actions.ts`로 옮김                   |
| `screens/Settings/components/support-group.tsx`            | 충족                                                          |
| `screens/Words/components/recording-row.tsx`               | 충족, 녹음 이름에 순서가 필요해 `first` 대신 `index`를 받음   |
| `screens/Words/components/recordings-section.tsx`          | 충족, 인자는 `draft`, `player`, `onDelete`, `onAdd`, `onHelp` |
| `screens/Words/components/word-card.tsx`                   | 충족, 내부 태그 대신 `ui/tag.tsx` 사용                        |

## 화면

| 파일                                         | 결과         |
| -------------------------------------------- | ------------ |
| `screens/Entry/ConsentDetailScreen.tsx`      | C4와 C6 충족 |
| `screens/Entry/ConsentScreen.tsx`            | C4와 C6 충족 |
| `screens/Entry/LegacyUploadScreen.tsx`       | C4와 C6 충족 |
| `screens/Entry/LoginScreen.tsx`              | C4와 C6 충족 |
| `screens/Entry/ParrotEditorScreen.tsx`       | C4와 C6 충족 |
| `screens/Entry/PermissionRequestScreen.tsx`  | C4와 C6 충족 |
| `screens/Entry/UsageGuideScreen.tsx`         | C4와 C6 충족 |
| `screens/Home/HomeScreen.tsx`                | C4와 C6 충족 |
| `screens/Home/NoticeDetailScreen.tsx`        | C4와 C6 충족 |
| `screens/Home/NotificationsScreen.tsx`       | C4와 C6 충족 |
| `screens/Profile/AccountEditorScreen.tsx`    | C4와 C6 충족 |
| `screens/Profile/ProfileScreen.tsx`          | C4와 C6 충족 |
| `screens/Report/ReportScreen.tsx`            | C4와 C6 충족 |
| `screens/Report/SessionDetailScreen.tsx`     | C4와 C6 충족 |
| `screens/Session/SessionRunScreen.tsx`       | C4와 C6 충족 |
| `screens/Session/SessionSummaryScreen.tsx`   | C4와 C6 충족 |
| `screens/Settings/ConsentSettingsScreen.tsx` | C4와 C6 충족 |
| `screens/Settings/DevicesScreen.tsx`         | C4와 C6 충족 |
| `screens/Settings/NoticeListScreen.tsx`      | C4와 C6 충족 |
| `screens/Settings/PermissionsScreen.tsx`     | C4와 C6 충족 |
| `screens/Settings/SettingsScreen.tsx`        | C4와 C6 충족 |
| `screens/Words/RecorderScreen.tsx`           | C4와 C6 충족 |
| `screens/Words/RecordingGuideScreen.tsx`     | C4와 C6 충족 |
| `screens/Words/WordEditorScreen.tsx`         | C4와 C6 충족 |
| `screens/Words/WordListScreen.tsx`           | C4와 C6 충족 |

## 목 서버

| 파일              | 결과                                                            |
| ----------------- | --------------------------------------------------------------- |
| `mocks/server.ts` | 빈 줄 기준 확인, 역할이 다른 선언과 문장 사이에 빠진 빈 줄 없음 |
| `mocks/seed.ts`   | 빈 줄 기준 확인, 역할이 다른 선언과 문장 사이에 빠진 빈 줄 없음 |
