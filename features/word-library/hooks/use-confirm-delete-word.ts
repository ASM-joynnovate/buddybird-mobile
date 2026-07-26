import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAnalytics } from '@/features/analytics/analytics-context';
import { reportError } from '@/features/analytics/error-reporter';
import { readWordLifetimeMetrics, removeWordMetrics } from '@/features/analytics/word-metrics-storage';
import { useI18n } from '@/features/i18n/i18n-context';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import type { WordEntry } from '@/features/word-library/word-library-types';

// 단어 삭제 확인 다이얼로그 → 확정 시 라이브러리에서 제거. 실패 시 에러 알림.
export function useConfirmDeleteWord(): (entry: WordEntry) => void {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { deleteEntry } = useWordLibrary();

  return useCallback(
    (entry: WordEntry) => {
      if (entry.sourceType === 'preset') return; // 프리셋은 삭제 불가 (UI 우회 방지)
      Alert.alert(t('wordEdit.confirmDelete', { label: entry.label }), undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('wordEdit.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              // 지표는 제거 전에 읽는다 — 삭제 성공 후에만 발화하므로 순서 보장 필요.
              // 읽기 실패는 비치명: 분석용 조회가 삭제 자체를 막으면 안 된다 (지표 0으로 발화).
              const metrics = await readWordLifetimeMetrics(entry.id).catch((error: unknown) => {
                console.warn('[words.readWordLifetimeMetrics]', error);
                return null;
              });
              await deleteEntry(entry.id);
              track({
                name: 'word_removed',
                params: {
                  word_id: entry.id,
                  word_name: entry.label,
                  lifetime_practice_count: metrics?.lifetime_practice_count ?? 0,
                  lifetime_practice_duration_ms: metrics?.lifetime_practice_duration_ms ?? 0,
                },
              });
              // orphan 지표 정리 실패는 비치명 — 삭제 자체는 성공했으므로 에러 알림을 띄우지 않는다.
              await removeWordMetrics(entry.id).catch((error: unknown) => {
                console.warn('[words.removeWordMetrics]', error);
              });
            })().catch((error: unknown) => {
              reportError(error, { scope: 'words.deleteEntry' });
              Alert.alert(t('wordEdit.deleteErrorTitle'), t('wordEdit.deleteErrorBody'));
            });
          },
        },
      ]);
    },
    [deleteEntry, t, track],
  );
}
