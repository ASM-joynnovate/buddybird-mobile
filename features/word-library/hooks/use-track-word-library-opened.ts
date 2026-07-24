import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { useAnalytics } from '@/features/analytics/analytics-context';
import { useWordLibrary } from '@/features/word-library/word-library-context';

// 라이브러리 탭 focus마다 word_library_opened 발화. hydration 완료 전에는 0 카운트
// 오발화를 막기 위해 보류하고, focus 중 hydration이 끝나면 그 시점에 1회 발화한다.
export function useTrackWordLibraryOpened(): void {
  const { track } = useAnalytics();
  const { entries, isHydrated } = useWordLibrary();

  // focus 중 단어 추가/삭제로 effect가 재발화하지 않도록 카운트는 ref로 읽는다.
  const countRef = useRef(entries.length);
  countRef.current = entries.length;

  useFocusEffect(
    useCallback(() => {
      if (!isHydrated) return;
      track({ name: 'word_library_opened', params: { total_words_count: countRef.current } });
    }, [isHydrated, track]),
  );
}
