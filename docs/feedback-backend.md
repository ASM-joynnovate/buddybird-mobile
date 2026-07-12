# 피드백 백엔드 설정 (Firebase 콘솔 — 레포 밖 작업)

인앱 피드백은 Cloud Firestore(create-only) + 익명 인증에 저장한다(→ [ADR-0001](adr/0001-feedback-store-firestore.md)).
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
- 앱은 피드백 제출 시점에만 익명 로그인(lazy)한다 → 익명 계정 수 = 실제 제출자 수(미미).

## 3. Security Rules 배포 (create-only)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /feedback/{doc} {
      allow create: if request.auth != null
                    && request.resource.data.message is string
                    && request.resource.data.message.size() > 0
                    && request.resource.data.message.size() < 2000;
      allow read, update, delete: if false;   // 클라이언트는 읽기/수정/삭제 불가
    }
  }
}
```

- 클라이언트는 create만 가능. 읽기는 콘솔에서 `feedback` 컬렉션을 직접 조회한다(필요 시
  BigQuery→Connected Sheets 익스텐션).

## 4. 저장되는 문서 필드

`features/feedback/feedback-submit.ts` 가 기록한다:

| 필드 | 값 |
|---|---|
| `message` | 사용자 자유서술 (trim, 1~1000자) |
| `appVersion` | `expo-application` `nativeApplicationVersion` |
| `platform` | `Platform.OS` (`ios`/`android`) |
| `locale` | 현재 앱 로케일 |
| `createdAt` | `serverTimestamp()` (서버가 채움) |

## 나중에 추가할 것 (v2)

- **App Check** (App Attest/Play Integrity) — 봇·스크립트가 익명으로 쓰는 걸 막는다. 먼저
  콘솔에서 지표를 지켜보고, 정상 트래픽이 잘 통과하는 걸 확인한 뒤 Firestore에 강제 적용을
  켠다(콘솔에서 언제든 껐다 켰다 가능).
- 개인정보를 서버에서 지우는 처리·욕설 필터·요청 횟수 제한 (Cloud Function이 필요하고 유료
  플랜 Blaze가 필요).
- 오래된 익명 계정 자동 정리(30일).
