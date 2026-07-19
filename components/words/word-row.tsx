import { useCallback } from 'react';

import { WordListItem } from '@/components/words/word-list-item';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { resolveAudioSource } from '@/features/audio/audio-source-resolver';
import { useAudioPreview } from '@/features/audio/hooks/use-audio-preview';
import { useI18n } from '@/features/i18n/i18n-context';
import type { WordEntry } from '@/features/word-library/word-library-types';

interface WordRowProps {
  entry: WordEntry;
  onEdit: (entry: WordEntry) => void;
  onBecameActive: (stopFn: () => void) => void;
}

export function WordRow({ entry, onEdit, onBecameActive }: WordRowProps) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { source: audioSource } = resolveAudioSource(entry);
  const { canPreview, previewState, playPreview, stopPreview } = useAudioPreview(audioSource, 1);
  const isPreset = entry.sourceType === 'preset';
  const sourceLabel = t(isPreset ? 'wordLibrary.sourcePreset' : 'wordLibrary.sourceRecording');

  const handlePlay = useCallback(() => {
    const isPlaying = previewState === 'playing';
    track({
      name: 'word_library_preview_played',
      params: {
        word_id: entry.id,
        word_name: entry.label,
        source_type: isPreset ? 'preset' : 'recording',
        action: isPlaying ? 'stop' : 'play',
      },
    });
    if (isPlaying) {
      stopPreview();
      return;
    }
    onBecameActive(stopPreview);
    void playPreview();
  }, [entry.id, entry.label, isPreset, onBecameActive, playPreview, previewState, stopPreview, track]);

  const handleEdit = useCallback(() => {
    onEdit(entry);
  }, [entry, onEdit]);

  return (
    <WordListItem
      canPreview={canPreview}
      isPlaying={previewState === 'playing'}
      isPreset={isPreset}
      label={entry.label}
      onEdit={handleEdit}
      onPlay={handlePlay}
      sourceLabel={sourceLabel}
      tag={entry.tag}
    />
  );
}
