import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { configurePlaybackAudioMode } from '../audio-mode';
import type { AudioPreviewState } from '../audio-types';

interface UseAudioPreviewResult {
  canPreview: boolean;
  elapsedSeconds: number;
  previewState: AudioPreviewState;
  playPreview: () => Promise<void>;
  stopPreview: () => void;
}

const PLAYER_UPDATE_INTERVAL_MS = 100;
const PLAY_START_TIMEOUT_MS = 1_500;
const COMPLETION_GRACE_MS = 750;
const MAX_PREVIEW_SECONDS = 60;

export function useAudioPreview(
  audioUri: string | null | undefined,
  playbackRate: number,
  expectedDurationSeconds?: number,
): UseAudioPreviewResult {
  const player = useAudioPlayer(null, { updateInterval: PLAYER_UPDATE_INTERVAL_MS });
  const playerStatus = useAudioPlayerStatus(player);
  const playTokenRef = useRef(0);
  const loadedUriRef = useRef<string | null>(null);
  const [previewState, setPreviewState] = useState<AudioPreviewState>(
    audioUri ? 'ready' : 'disabled',
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const canPreview = Boolean(audioUri);

  useEffect(() => {
    playTokenRef.current += 1;
    player.pause();
    player.loop = false;
    player.seekTo(0).catch(() => {});
    loadedUriRef.current = null;

    if (audioUri) {
      player.replace({ uri: audioUri });
      loadedUriRef.current = audioUri;
    }

    setElapsedSeconds(0);
    setPreviewState(audioUri ? 'ready' : 'disabled');
  }, [audioUri, player]);

  useEffect(() => {
    if (previewState !== 'playing') return;

    if (playerStatus.didJustFinish || playerStatus.playbackState === 'ended') {
      setElapsedSeconds(0);
      setPreviewState('ready');
      return;
    }

    if (playerStatus.playbackState === 'failed') {
      setElapsedSeconds(0);
      setPreviewState('error');
    }
  }, [playerStatus.didJustFinish, playerStatus.playbackState, previewState]);

  useEffect(() => {
    if (previewState !== 'playing') return;
    setElapsedSeconds(0);
    const id = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [previewState]);

  useEffect(() => {
    if (previewState !== 'playing') return;

    const durationSeconds = getPositiveDuration(playerStatus.duration)
      ?? getPositiveDuration(expectedDurationSeconds)
      ?? MAX_PREVIEW_SECONDS;
    const currentSeconds = Math.min(Math.max(playerStatus.currentTime, 0), durationSeconds);
    const remainingMs = Math.max(250, (durationSeconds - currentSeconds) * 1000 + COMPLETION_GRACE_MS);

    const id = setTimeout(() => {
      if (previewState === 'playing') {
        player.pause();
        player.seekTo(0).catch(() => {});
        setElapsedSeconds(0);
        setPreviewState('ready');
      }
    }, remainingMs);

    return () => clearTimeout(id);
  }, [expectedDurationSeconds, player, playerStatus.currentTime, playerStatus.duration, previewState]);

  const stopPreview = useCallback((): void => {
    playTokenRef.current += 1;
    player.pause();
    player.seekTo(0).catch(() => {});
    setElapsedSeconds(0);
    setPreviewState(audioUri ? 'ready' : 'disabled');
  }, [audioUri, player]);

  const playPreview = useCallback(async (): Promise<void> => {
    if (!audioUri) {
      setPreviewState('disabled');
      return;
    }
    try {
      const playToken = playTokenRef.current + 1;
      playTokenRef.current = playToken;

      await configurePlaybackAudioMode();
      if (playTokenRef.current !== playToken) return;
      player.pause();
      if (loadedUriRef.current !== audioUri) {
        player.replace({ uri: audioUri });
        loadedUriRef.current = audioUri;
      }
      player.loop = false;
      player.volume = 1;
      player.shouldCorrectPitch = false;
      player.setPlaybackRate(playbackRate);
      await player.seekTo(0);
      player.play();
      setElapsedSeconds(0);
      setPreviewState('playing');

      setTimeout(() => {
        if (playTokenRef.current !== playToken) return;
        const currentStatus = player.currentStatus;
        if (!currentStatus.playing && !currentStatus.isBuffering && !currentStatus.didJustFinish) {
          player.pause();
          player.seekTo(0).catch(() => {});
          setElapsedSeconds(0);
          setPreviewState('error');
        }
      }, PLAY_START_TIMEOUT_MS);
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

function getPositiveDuration(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}
