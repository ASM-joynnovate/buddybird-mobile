# 개인정보처리방침 (버디버드)

**최종 갱신일**: 2026-07-13

## 1. 수집하는 정보

버디버드는 더 나은 학습 경험 제공을 위해 다음 정보를 수집합니다.

### 1.1 자동 수집 (분석 도구)

| 항목 | 수집 도구 | 목적 |
|---|---|---|
| Firebase 익명 Auth uid | Firebase Authentication, Firebase Analytics, Firebase Crashlytics, Microsoft Clarity | 앱 사용자를 pseudonymous하게 식별하고 향후 사용자별 데이터 접근을 보호 (실명 등 직접 식별 정보 아님) |
| 앱 사용 이벤트 (화면 이동, 학습 세션, 단어 녹음 등) | Firebase Analytics | 기능 사용 패턴 분석 |
| 세션 리플레이 (탭/스와이프 동선) | Microsoft Clarity | 사용성 개선 |
| 크래시 로그 (스택 트레이스) | Firebase Crashlytics | 오류 진단 및 수정 |
| 앱 버전, OS 버전, 기기 모델, 언어 설정 | Firebase Analytics | 호환성 분석 |
| iOS 광고 식별자(IDFA) | Firebase Analytics | iOS ATT 동의 시에만 수집 |

### 1.2 사용자가 입력한 펫 정보

| 항목 | 비고 |
|---|---|
| 앵무새 이름 | 펫 메타데이터 (보호자 본인 정보 아님) |
| 앵무새 종(species) | 학습 패턴 분석에 활용 |
| 앵무새 나이(개월) | 학습 패턴 분석에 활용 |
| 학습 목표 | 학습 패턴 분석에 활용 |
| 학습한 단어 이름 / 녹음 시간 / 누적 학습 횟수 | 학습 효과 분석 |

### 1.3 수집하지 않는 정보

- 보호자(사용자) 본인의 실명, 이메일, 전화번호
- 정밀 위치 정보
- 연락처, 사진(앵무새 사진 제외, 디바이스 외부 전송 없음)

## 2. iOS App Tracking Transparency (ATT)

iOS 14.5 이상에서는 첫 실행 시 광고 식별자(IDFA) 수집 동의를 묻습니다. **거부하셔도 앱의 모든 기능을 정상 이용**할 수 있으며, 익명 분석 데이터 수집도 비활성화됩니다.

## 3. 데이터 보관 및 제3자 제공

- Firebase Analytics / Crashlytics: Google LLC가 미국 서버에 보관
- Firebase Authentication: 앱 실행 시 익명 계정과 uid를 생성하며 Google LLC가 보관
- Microsoft Clarity: Microsoft Corporation이 미국 서버에 보관
- 위 분석 서비스 외 제3자에게 정보를 판매하거나 제공하지 않습니다.

## 4. 사용자 권리

- 앱 삭제·재설치 또는 기기 변경 시 기존 익명 계정의 복구를 보장하지 않으며 새 uid가 생성될 수 있습니다.
- iOS는 설정 → 개인정보 보호 및 보안 → 추적에서 동의를 변경할 수 있습니다.

## 5. 문의

개인정보 처리에 관한 문의는 다음 경로로 부탁드립니다.
- 이메일: privacy@buddybird.example
