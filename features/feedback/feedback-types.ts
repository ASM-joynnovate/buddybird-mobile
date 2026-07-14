/**
 * 피드백 폼이 열린 진입점. 팝업의 [피드백 남기기] 경로와 프로필 탭 상시 진입점을 구분해
 * analytics·리셋 정책에 반영한다(팝업 경로는 폼 진입 시 스케줄러를 전진시킨다).
 */
export type FeedbackSource = 'prompt' | 'profile';

/**
 * 피드백 팝업 스케줄러의 영속 상태(AsyncStorage). 순수 스케줄러 함수(`feedback-scheduler`)가
 * 이 값을 입력받아 다음 상태를 반환하고, storage 계층이 hydrate/persist 한다.
 */
export interface PromptSchedulerState {
  readonly version: 1;
  /** 마지막으로 카운트한 접속일. 로컬 'YYYY-MM-DD'. 미카운트면 null. */
  readonly lastCountedDate: string | null;
  /** 현재 임계값까지 누적된 접속일 수. 팝업에 반응하면 0으로 리셋. */
  readonly dayCount: number;
  /** THRESHOLDS 인덱스. 반응할 때마다 전진하며 마지막 값에서 고정. */
  readonly thresholdIndex: number;
}

/**
 * Firestore `feedback` 컬렉션에 기록하는 문서 페이로드. `userId`와 `createdAt`은 제출 계층이
 * Firebase Auth·`serverTimestamp()`로 채우므로 여기 포함하지 않는다. UI는 자유서술란에 보호자
 * 개인정보를 입력하지 말라고 안내한다.
 */
export interface FeedbackSubmission {
  readonly message: string;
  readonly appVersion: string;
  readonly platform: string;
  readonly locale: string;
}
