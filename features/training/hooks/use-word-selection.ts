import { useEffect, useState } from 'react';

import { useI18n } from '@/features/i18n/i18n-context';
import { useWordLibrary } from '@/features/word-library/word-library-context';

export function useWordSelection() {
  const { t } = useI18n();
  const { entries, isHydrated: isLibraryHydrated } = useWordLibrary();
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  useEffect(() => {
    if (entries.length === 0) {
      if (selectedEntryId !== null) setSelectedEntryId(null);
      return;
    }
    if (selectedEntryId === null || !entries.some((e) => e.id === selectedEntryId)) {
      setSelectedEntryId(entries[0].id);
    }
  }, [entries, selectedEntryId]);

  const pickerItems = entries.map((e) => ({
    id: e.id,
    label: e.label,
    tag: e.tag,
    presetKey: e.presetKey,
    audioUri: e.audioUri,
    sourceType: e.sourceType,
    sourceLabel: t(e.sourceType === 'preset' ? 'wordLibrary.sourcePreset' : 'wordLibrary.sourceRecording'),
  }));

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

  return { selectedEntryId, setSelectedEntryId, selectedEntry, pickerItems, isLibraryHydrated };
}
