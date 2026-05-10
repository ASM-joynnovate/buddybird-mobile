import { useAudioPlayer } from 'expo-audio';
import { useCallback, useMemo, useState } from 'react';

import type { AudioPreviewState } from './audio-types';

interface UseAudioPreviewResult {
  canPreview: boolean;
  previewState: AudioPreviewState;
  playPreview: () => Promise<void>;
}

export function useAudioPreview(audioUri: string | null | undefined): UseAudioPreviewResult {
  const player = useAudioPlayer(audioUri ?? undefined);
  const [previewState, setPreviewState] = useState<AudioPreviewState>(audioUri ? 'ready' : 'disabled');
  const canPreview = Boolean(audioUri);

  const playPreview = useCallback(async (): Promise<void> => {
    if (!audioUri) {
      setPreviewState('disabled');
      return;
    }

    try {
      setPreviewState('playing');
      player.seekTo(0);
      player.play();
      setPreviewState('ready');
    } catch {
      setPreviewState('error');
    }
  }, [audioUri, player]);

  return useMemo(
    () => ({
      canPreview,
      playPreview,
      previewState: canPreview ? previewState : 'disabled',
    }),
    [canPreview, playPreview, previewState]
  );
}
