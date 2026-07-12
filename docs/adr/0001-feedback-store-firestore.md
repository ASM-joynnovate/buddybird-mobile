---
status: accepted
date: 2026-07-12
---

# ADR-0001 — 피드백 저장소로 Cloud Firestore(넣기만 가능) 채택

## 배경

인앱 피드백에서 사용자가 쓴 의견을 저장할 곳이 필요하다. 백엔드/DB가 없는 Phase 1 상태이고,
저장소를 한번 정하면 그 위에 분석·읽기 도구가 쌓여서 나중에 바꾸기 어렵다. 후보는 (a) 직접
만든 백엔드 API, (b) Google Sheets(Apps Script), (c) Cloud Firestore, (d) Supabase 였다.

## 결정

**Cloud Firestore를 쓴다. 규칙은 "넣기(create)만 허용"으로 잠근다.** 앱은 의견을 보낼 때만
익명 로그인을 하고 `feedback` 컬렉션에 문서를 추가만 한다. 읽기·수정·삭제는 서버 규칙으로 모두
막는다. 저장된 의견은 Firebase 콘솔에서 본다.

## 왜 이렇게 정했나

- **앱에 비밀 키를 안 심는다.** Firestore 설정값은 공개해도 되는 값이고, 누가 무엇을 할 수
  있는지는 서버쪽 보안 규칙(Security Rules)이 정한다. 반면 Sheets에 직접 쓰려면 앱 안에
  꺼내 쓸 수 있는 쓰기 키를 심거나, 공개 Apps Script 주소(=직접 돌리는 작은 서버, 스팸에 약함)를
  둬야 한다.
- **이미 쓰던 스택이다.** RNFirebase(v24)를 이미 쓰고 있어서 패키지만 추가하면 된다(Supabase면
  두 번째 백엔드를 하나 더 얹는 셈). Firestore·Auth도 v24로 버전을 맞춰 함께 묶었다.
- **돈이 거의 안 든다.** 아래 무료 한도로 소규모 트래픽은 사실상 계속 공짜다. 전부 무료 플랜
  (Spark)에서 돌아가고 결제 수단 등록도 필요 없다.

### 확인한 무료 한도 (2026-07 공식 문서 기준)

- Firestore 무료 한도: **하루 쓰기 2만 건 / 읽기 5만 건 / 삭제 2만 건**, 저장 1 GiB, 월 전송
  10 GiB. 무료 플랜은 결제 수단이 필요 없고, 한도를 넘기면 그 제품이 그 달 남은 기간 동안
  **막힐 뿐 청구서는 안 온다**(자동 과금 아님).[^price][^plans][^quota]
- 익명 로그인: **5만 MAU까지 무료.**[^price]
- App Check: **무료.**[^price]

## 그래서 생기는 일 / 결정에 따른 조건

- v1에는 **App Check를 넣지 않는다.** 봇·스크립트가 익명으로 쓰레기 글을 넣는 건, 넣기만 허용
  규칙 + 익명 + "개인정보 쓰지 마세요" 안내로 최대한 줄인다. 스팸이 실제로 문제되면 그때
  App Check를 켠다(v2, 콘솔에서 언제든 껐다 켰다 가능).
- 개인정보를 서버에서 지우는 처리·욕설 필터·요청 제한은 **나중에(v2)** 넣는다(Cloud Function이
  필요하고 유료 플랜 Blaze가 필요함). v1은 폼의 "개인정보 쓰지 마세요" 안내로만 대응한다.
- Firestore 켜기·익명 로그인 켜기·보안 규칙 배포는 앱 코드 밖(Firebase 콘솔) 작업이다.
  절차는 `docs/feedback-backend.md` 참고.

## 스토어 평점 유도는 하지 않는다 (정책 관련)

이 기능은 **평점 요청이 아니라 제품 의견만** 받는다. "앱 마음에 드세요?" 같은 질문으로 만족한
사용자만 스토어 평점 페이지로 보내는 방식(리뷰 게이팅)은 애플·구글 모두 금지한다.[^google-review][^apple-guide]
우리는 스토어로 보내는 흐름 자체가 없어서 이 문제에 해당하지 않는다.

- 애플: App Store 심사 가이드라인 **3장(Business) 서문**이 "걸러낸(filtered)·조작한 리뷰"를
  금지한다. (참고로 계획서에 적혀 있던 "가이드라인 1.1.7"은 **틀린 인용**이다 — 1.1.7은 재난·테러
  등을 악용하는 콘텐츠에 대한 조항이라 리뷰와 무관하다.)[^apple-guide]
- 구글: In-App Review API 문서가 평점 버튼을 보이기 전이나 도중에 "앱 마음에 드세요?" 같은
  질문을 하지 말라고 명시한다.[^google-review]

## 출처

[^price]: Firebase Pricing — https://firebase.google.com/pricing (공식, 2026-07 확인). Firestore 하루 쓰기 20K/읽기 50K/삭제 20K, 저장 1 GiB; Auth 5만 MAU 무료; App Check 무료; "No payment method needed".
[^plans]: Firebase pricing plans — https://firebase.google.com/docs/projects/billing/firebase-pricing-plans (공식). "If you exceed the no-cost quota limit ... your project's usage of that specific product will be shut off for the remainder of that month."
[^quota]: Firestore Usage and limits — https://firebase.google.com/docs/firestore/quotas 및 https://cloud.google.com/firestore/pricing (공식). 무료 한도 수치 교차 확인.
[^apple-guide]: App Review Guidelines — https://developer.apple.com/app-store/review/guidelines/ (공식). 3장 서문의 리뷰 조작 금지. 1.1.7은 리뷰와 무관함을 본문에서 확인.
[^google-review]: Play In-App Reviews API — https://developer.android.com/guide/playcore/in-app-review (공식). "Your app shouldn't ask the user any questions before or while presenting the rating button or card ... (such as \"Do you like the app?\")".
