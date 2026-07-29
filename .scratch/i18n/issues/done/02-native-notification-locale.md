# 네이티브 알림에 인앱 언어 전환 반영

Status: needs-triage

## 배경

프로필 탭 인앱 언어 전환(2026-07-16 도입) 이후, Android 포그라운드 알림(`AudioForegroundService` — `res/values(-en)/strings.xml`)은 **OS 로케일**을 따르므로 인앱 언어와 어긋날 수 있다. 예: 한국어 기기에서 앱을 English로 전환한 사용자는 앱은 영어, 세션 알림은 한국어("버디버드 학습 중")를 본다.

## 방향 후보

- 세션 시작 시 JS에서 현재 앱 로케일(또는 번역된 문자열)을 네이티브 모듈 파라미터로 전달 — 알림 채널명은 생성 후 변경 제한이 있으므로 제목/본문/액션만 우선
- 또는 `AppCompatDelegate.setApplicationLocales`(per-app language) 적용 검토 — expo 모듈 구조와의 정합 확인 필요

## 관련

- `docs/I18N.md` §4, `modules/session-audio-engine/android/.../AudioForegroundService.kt`
- BB-155 후속
