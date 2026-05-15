import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AudioPreviewState } from '../audio-types';

interface UseAudioPreviewResult {
  canPreview: boolean;
  elapsedSeconds: number;
  previewState: AudioPreviewState;
  playPreview: () => Promise<void>;
  stopPreview: () => void;
}

export function useAudioPreview(
  audioUri: string | null | undefined,
  playbackRate: number,
): UseAudioPreviewResult {
  const player = useAudioPlayer(audioUri ?? undefined);
  const [previewState, setPreviewState] = useState<AudioPreviewState>(
    audioUri ? 'ready' : 'disabled',
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const canPreview = Boolean(audioUri);

  useEffect(() => {
    if (!audioUri) player.pause();
    setPreviewState(audioUri ? 'ready' : 'disabled');
  }, [audioUri, player]);

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish) setPreviewState('ready');
    });
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    if (previewState !== 'playing') return;
    setElapsedSeconds(0);
    const id = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [previewState]);

  const stopPreview = useCallback((): void => {
    player.pause();
    player.seekTo(0).catch(() => {});
    setPreviewState('ready');
  }, [player]);

  const playPreview = useCallback(async (): Promise<void> => {
    if (!audioUri) {
      setPreviewState('disabled');
      return;
    }
    try {
      player.shouldCorrectPitch = false;
      player.setPlaybackRate(playbackRate);
      await player.seekTo(0);
      player.play();
      setPreviewState('playing');
    } catch {
      setPreviewState('error');
    }
  }, [audioUri, player, playbackRate]);

  return useMemo(
    () => ({
      canPreview,
      elapsedSeconds,
      playPreview,
      stopPreview,
      previewState: canPreview ? previewState : 'disabled',
    }),
    [canPreview, elapsedSeconds, playPreview, stopPreview, previewState],
  );
}
