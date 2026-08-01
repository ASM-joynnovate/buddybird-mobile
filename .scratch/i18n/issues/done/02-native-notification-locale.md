# 네이티브 알림에 인앱 언어 전환 반영

Status: done

## 배경

프로필 탭 인앱 언어 전환(2026-07-16 도입) 이후, Android 포그라운드 알림(`AudioForegroundService` — `res/values(-en)/strings.xml`)은 **OS 로케일**을 따르므로 인앱 언어와 어긋날 수 있다. 예: 한국어 기기에서 앱을 English로 전환한 사용자는 앱은 영어, 세션 알림은 한국어("버디버드 학습 중")를 본다.

## 방향 후보

- 세션 시작 시 JS에서 현재 앱 로케일(또는 번역된 문자열)을 네이티브 모듈 파라미터로 전달 — 알림 채널명은 생성 후 변경 제한이 있으므로 제목/본문/액션만 우선
- 또는 `AppCompatDelegate.setApplicationLocales`(per-app language) 적용 검토 — expo 모듈 구조와의 정합 확인 필요

## 관련

- `docs/I18N.md` §4, `modules/session-audio-engine/android/.../AudioForegroundService.kt`
- BB-155 후속

## Comments

**2026-07-29 (BB-217)** — 첫 번째 방향 후보로 해결. `SessionAudioEngineStartInput`에 `notification`
필드를 추가해 JS가 `t()`로 해석한 제목·부제목을 `start()` 시점에 넘긴다. 회차 자리표시자
(`%{cycle}`·`%{total}`)만 네이티브가 갱신할 때마다 치환한다. Android·iOS 양쪽에 같은 문구가
필요해진 김에 처리했다 (iOS에는 애초에 문자열 리소스가 없었다).

남은 한계 두 가지:

- 알림 **채널 이름·설명**은 여전히 OS 로케일을 따른다. 서비스 `onCreate` 시점(세션 설정 도착 전)에
  필요하고 채널은 생성 후 표시명 변경이 제한되므로 `strings.xml`에 남겼다.
- 문구는 `start()` 시점에 고정된다. 세션 도중 언어를 바꾸면 다음 세션부터 반영된다.
