import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

import { createInitialSchedulerState, THRESHOLDS } from './feedback-scheduler';
import type { PromptSchedulerState } from './feedback-types';

export const FEEDBACK_PROMPT_STORAGE_KEY = '@buddybird/feedback-prompt';

// 저장된 값을 필드별로 방어적으로 검증한다. 손상·부분 누락 시 기본값으로 안전 복구한다.
function parseSchedulerState(raw: unknown): PromptSchedulerState {
  if (!raw || typeof raw !== 'object') {
    return createInitialSchedulerState();
  }

  const record = raw as Record<string, unknown>;

  const lastCountedDate =
    typeof record.lastCountedDate === 'string' ? record.lastCountedDate : null;

  const dayCount =
    typeof record.dayCount === 'number' && Number.isFinite(record.dayCount) && record.dayCount >= 0
      ? Math.floor(record.dayCount)
      : 0;

  const rawIndex =
    typeof record.thresholdIndex === 'number' && Number.isFinite(record.thresholdIndex)
      ? Math.floor(record.thresholdIndex)
      : 0;
  const thresholdIndex = Math.min(Math.max(rawIndex, 0), THRESHOLDS.length - 1);

  return { version: 1, lastCountedDate, dayCount, thresholdIndex };
}

const store = persistKeyedStore<PromptSchedulerState>({
  key: FEEDBACK_PROMPT_STORAGE_KEY,
  scope: 'feedback.loadSchedulerState',
  parse: parseSchedulerState,
  fallback: createInitialSchedulerState,
});

export async function loadSchedulerState(): Promise<PromptSchedulerState> {
  return store.load();
}

export async function saveSchedulerState(state: PromptSchedulerState): Promise<void> {
  await store.save(state);
}
