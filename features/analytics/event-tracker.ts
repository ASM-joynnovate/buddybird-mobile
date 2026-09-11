// React 밖에서 이벤트를 발행하는 경로. 업로드 파이프라인처럼 훅을 쓸 수 없는 순수 모듈이
// `useAnalytics()` 없이 발행하게 한다 — 등록 방식은 error-reporter 와 같다.

import type { AnalyticsClient } from './client';
import type { AnalyticsEvent } from './events';

type TrackerFn = (event: AnalyticsEvent) => void;

let activeTracker: TrackerFn | null = null;
const pendingEvents: AnalyticsEvent[] = [];

export function registerEventTracker(client: AnalyticsClient): () => void {
  const tracker: TrackerFn = (event) => {
    void client.logEvent(event);
  };
  activeTracker = tracker;
  for (const event of pendingEvents.splice(0)) tracker(event);
  return () => {
    if (activeTracker === tracker) {
      activeTracker = null;
    }
  };
}

/** provider 등록 전 이벤트도 보관하고 등록 시 공통 전송 대기열에 전달한다. */
export function trackEvent<E extends AnalyticsEvent>(event: E): void {
  if (activeTracker) {
    activeTracker(event);
  } else {
    pendingEvents.push(event);
  }
}
