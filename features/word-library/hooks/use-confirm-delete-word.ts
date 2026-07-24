import { useCallback } from 'react';
import { Alert } from 'react-native';

import { reportError } from '@/features/analytics/error-reporter';
import { useI18n } from '@/features/i18n/i18n-context';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import type { WordEntry } from '@/features/word-library/word-library-types';

// 단어 삭제 확인 다이얼로그 → 확정 시 라이브러리에서 제거. 실패 시 에러 알림.
export function useConfirmDeleteWord(): (entry: WordEntry) => void {
  const { t } = useI18n();
  const { deleteEntry } = useWordLibrary();

  return useCallback(
    (entry: WordEntry) => {
      Alert.alert(t('wordEdit.confirmDelete', { label: entry.label }), undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('wordEdit.delete'),
          style: 'destructive',
          onPress: () => {
            void deleteEntry(entry.id).catch((error: unknown) => {
              reportError(error, { scope: 'words.deleteEntry' });
              Alert.alert(t('wordEdit.deleteErrorTitle'), t('wordEdit.deleteErrorBody'));
            });
          },
        },
      ]);
    },
    [deleteEntry, t],
  );
}
