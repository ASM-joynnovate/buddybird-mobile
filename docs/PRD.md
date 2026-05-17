# PRD: 버디버드 (MVP)

## 1. Project Overview
앵무새 언어 학습을 돕기 위해 보호자의 반복 발화 부담을 줄여주는 **Active Session 기반 음성 트레이닝 서비스**입니다. 보호자의 음성을 앵무새가 발음하기 쉬운 음역대로 변환하여 '학습-휴식' 사이클로 반복 재생하고 훈련 이력을 관리합니다.

- **Target Platform**: iOS / Android (React Native via Expo)
- **Data Strategy**: No Backend (Local-only storage), GA4 & Clarity for analytics.

---

## 2. Core User Flow
1. **Onboarding**: 반려조 프로필(이름, 종류, 나이, 사진) 필수 입력 (1개 프로필만 지원).
2. **Setup**: 사전 정의 단어 선택 또는 직접 녹음 → 자동 피치 변환 적용.
3. **Configuration**: 총 세션 시간 및 학습/휴식 사이클(예: 15분 학습 / 5분 휴식) 설정.
4. **Active Session**: 앱 전면(Foreground)에서 고주파 변환 음성 및 휴식용 자연음 반복 재생.
5. **Completion**: 세션 통계 확인 및 '학습 성공' 수동 마킹 → 로컬 이력 저장.

---

## 3. Functional Requirements (MoSCoW)

### Must Have
* **Profile**: 단일 반려조 프로필 생성 및 편집 (강제 온보딩).
* **Audio Source**: 사전 정의 단어 리스트 제공 + 사용자 마이크 녹음 기능.
* **Audio Processing**: 녹음된 음성을 앵무새용 하이톤으로 **자동 피치 변환(Pitch Shift)**.
* **Session Engine**: 학습(반복 재생)과 휴식(자연음)이 교차되는 타이머 및 오디오 로직.
* **Local Storage**: `AsyncStorage` 또는 `SQLite`를 이용한 훈련 이력 및 누적 시간 관리.

### Should Have
* **Progress Dashboard**: 단어별 누적 학습 시간 및 최근 훈련 기록 요약.

### Won't Have (Scope Out)
* 다중 프로필 관리 및 클라우드 계정 동기화.
* 앱 종료 상태에서의 백그라운드 오디오 재생.
* AI를 이용한 앵무새 음성 자동 인식 및 학습 성공 판정.

---

## 4. Technical Specifications

### Tech Stack
- **Framework**: React Native (Expo ~54.0.33), Expo Router, TypeScript.
- **State/Storage**: React Context API, `expo-file-system`, `AsyncStorage`.
- **Audio**: `expo-av` (Recording & Playback).
- **Analytics**: `firebase-analytics`, `@microsoft/react-native-clarity`.
