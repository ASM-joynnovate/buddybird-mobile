# 피드백 백엔드 설정 (Firebase 콘솔 — 레포 밖 작업)

인앱 피드백은 Firebase 익명 Auth uid와 함께 Cloud Firestore(create-only)에 저장한다
(→ [ADR-0001](adr/0001-feedback-store-firestore.md)).
아래는 레포에 담기지 않는 콘솔 작업이다. **전부 Spark 무료 플랜에서 동작하며 결제 계정이
불필요하다.** dev/prod 각 Firebase 프로젝트에 동일하게 적용한다.

## 1. Firestore 만들기

Firebase 콘솔 → **Databases & Storage → Firestore → 데이터베이스 만들기(Create database)**.

실제로 뜨는 순서 (2026-07 기준):

1. (에디션 선택 화면이 보이면) **Standard** 선택
2. **위치(location)** 선택
3. **보안 규칙 시작 모드** 선택 → **프로덕션(Production) 모드**로 만든다
4. 만들기

- **"Native 모드"를 따로 고르는 화면은 없다.** Firebase 콘솔에서 만들면 자동으로 Native
  모드다. (Native냐 Datastore냐 고르는 화면은 Google Cloud 콘솔에서만 나온다.)[^native]
- 시작 모드는 **프로덕션**으로 만든 뒤 아래 3번의 넣기 전용 규칙을 붙인다. 테스트 모드는 아무나
  읽고 쓸 수 있으니 쓰지 않는다.

[^native]: 출처: Firestore 퀵스타트 https://firebase.google.com/docs/firestore/quickstart · Native/Datastore 모드 선택 https://cloud.google.com/firestore/native/docs/firestore-or-datastore (둘 다 공식, 2026-07 확인).

## 2. 익명 인증 활성화

- Authentication → Sign-in method → **Anonymous** 활성화.
- 앱은 시작할 때 공용 `AuthProvider`에서 익명 uid 복원·로그인을 시도한다. 첫 실행이 오프라인이면
  uid 없이 부팅하고 foreground 복귀 시 재시도한다.
- 피드백 제출 직전에도 uid를 방어적으로 확인한다. uid를 얻지 못하면 문서를 쓰지 않고 재시도
  가능한 오류를 표시한다.
- dev(`buddybird-dev`)와 prod(`buddybird-9b84d`) 모두 익명 계정 **30일 자동 정리를 끈다.** uid를
  analytics와 향후 사용자별 데이터 접근에도 공통으로 사용하므로 자동 삭제하면 안 된다.

## 3. Security Rules 배포 (create-only)

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /feedback/{feedbackId} {
      allow create: if request.auth != null
                    && request.resource.data.keys().hasAll([
                      'userId',
                      'message',
                      'appVersion',
                      'platform',
                      'locale',
                      'createdAt'
                    ])
                    && request.resource.data.keys().hasOnly([
                      'userId',
                      'message',
                      'appVersion',
                      'platform',
                      'locale',
                      'createdAt'
                    ])
                    && request.resource.data.userId is string
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.message is string
                    && request.resource.data.message.trim().size() > 0
                    && request.resource.data.message.size() <= 1000
                    && request.resource.data.appVersion is string
                    && request.resource.data.appVersion.size() > 0
                    && request.resource.data.appVersion.size() <= 64
                    && request.resource.data.platform is string
                    && request.resource.data.platform in ['ios', 'android']
                    && request.resource.data.locale is string
                    && request.resource.data.locale.size() > 0
                    && request.resource.data.locale.size() <= 64
                    && request.resource.data.createdAt is timestamp
                    && request.resource.data.createdAt == request.time;

      allow read, update, delete: if false;
    }
  }
}
```

- Security Rules의 운영 정본은 Firebase Console이다. 레포에는 `firestore.rules`를 두지 않는다.
  위 규칙을 dev/prod 프로젝트에 동일하게 게시하고, 각 콘솔에서 실제 적용 상태를 확인한다.
- 클라이언트는 인증 uid와 같은 `userId`를 가진 정해진 스키마만 create할 수 있다. 읽기·수정·삭제는
  전부 거부한다. 운영자가 의견을 볼 때는 Firebase Console의 `feedback` 컬렉션을 사용한다.

### Rules Playground smoke check

dev와 prod에서 게시 전후로 다음 요청을 각각 빠르게 확인한다. 이 검사는 콘솔 규칙의 기본 동작을
확인하는 수동 smoke check이며, 회귀 테스트를 대체하지 않는다.

| 요청 | 기대 결과 |
|---|---|
| 인증 없음 | create 거부 |
| 인증 uid와 `userId` 불일치 | create 거부 |
| 필수 필드 누락 또는 허용하지 않은 필드 추가 | create 거부 |
| 공백뿐인 메시지, 1000자 초과 메시지 | create 거부 |
| `platform`이 `ios`·`android` 이외의 값 | create 거부 |
| 클라이언트가 임의 시각을 `createdAt`으로 전송 | create 거부 |
| 인증 uid와 `userId`가 같고 모든 필드가 유효함 | create 허용 |
| read·update·delete | 모두 거부 |

## 4. 저장되는 문서 필드

`features/feedback/feedback-submit.ts` 가 기록한다:

| 필드 | 값 |
|---|---|
| `userId` | 현재 Firebase 익명 Auth uid |
| `message` | 사용자 자유서술 (trim, 1~1000자) |
| `appVersion` | `expo-application` `nativeApplicationVersion` |
| `platform` | `Platform.OS` (`ios`/`android`) |
| `locale` | 현재 앱 로케일 |
| `createdAt` | `serverTimestamp()` (서버가 채움) |

`userId` 필드를 도입하기 전에 만든 테스트 문서에는 이 필드가 없을 수 있다. 새 규칙은 신규
문서에만 적용되며 기존 문서를 소급 변경하지 않는다.

## 나중에 추가할 것 (v2)

- **App Check** (App Attest/Play Integrity) — 봇·스크립트가 익명으로 쓰는 걸 막는다. 먼저
  콘솔에서 지표를 지켜보고, 정상 트래픽이 잘 통과하는 걸 확인한 뒤 Firestore에 강제 적용을
  켠다(콘솔에서 언제든 껐다 켰다 가능).
- 개인정보를 서버에서 지우는 처리·욕설 필터·요청 횟수 제한 (Cloud Function이 필요하고 유료
  플랜 Blaze가 필요).
