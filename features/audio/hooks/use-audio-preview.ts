import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { reportError } from '@/features/analytics/error-reporter';

import { recordingFileExists } from '../audio-file-storage';
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

// audioSource: string URI, number(require() 모듈), 또는 null/undefined(재생 불가)
export function useAudioPreview(
  audioSource: string | number | null | undefined,
  playbackRate: number,
  expectedDurationSeconds?: number,
): UseAudioPreviewResult {
  const isModule = typeof audioSource === 'number';
  // keepAudioSessionActive: expo-audio는 pause()·재생 완료 시 0.1초 뒤 iOS 오디오 세션을
  // 비활성화하는데, 이때 녹음 중인 recorder를 확인하지 않아 녹음 시작 직전 stopPreview()의
  // pause()가 실기기에서 진행 중인 녹음을 무음으로 만든다. 세션 활성화는 audio-mode.ts가 관리한다.
  const player = useAudioPlayer(null, { updateInterval: PLAYER_UPDATE_INTERVAL_MS, keepAudioSessionActive: true });
  const playerStatus = useAudioPlayerStatus(player);
  const playTokenRef = useRef(0);
  const loadedSourceRef = useRef<string | number | null>(null);
  const isDestroyedRef = useRef(false);
  // 번들 모듈은 항상 접근 가능하므로 fileExists 검사를 건너뛴다.
  const [fileExists, setFileExists] = useState<boolean>(() =>
    isModule ? true : (audioSource ? recordingFileExists(audioSource) : false),
  );
  const [previewState, setPreviewState] = useState<AudioPreviewState>(
    (isModule || (audioSource && fileExists)) ? 'ready' : 'disabled',
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const canPreview = isModule || (Boolean(audioSource) && fileExists);

  useEffect(() => {
    playTokenRef.current += 1;
    player.pause();
    player.loop = false;
    player.seekTo(0).catch((error: unknown) => {
      console.warn('[audio] seekTo failed (continuing):', error);
    });
    loadedSourceRef.current = null;

    if (isModule) {
      player.replace(audioSource as number);
      loadedSourceRef.current = audioSource;
      setFileExists(true);
      setElapsedSeconds(0);
      setPreviewState('ready');
      return;
    }

    const exists = audioSource ? recordingFileExists(audioSource) : false;
    setFileExists(exists);

    if (audioSource && exists) {
      player.replace({ uri: audioSource });
      loadedSourceRef.current = audioSource;
    }

    setElapsedSeconds(0);
    setPreviewState(audioSource && exists ? 'ready' : 'disabled');
  }, [audioSource, isModule, player]);

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
    return () => {
      isDestroyedRef.current = true;
    };
  }, []);

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
        player.seekTo(0).catch((error: unknown) => {
          console.warn('[audio] seekTo failed (continuing):', error);
        });
        setElapsedSeconds(0);
        setPreviewState('ready');
      }
    }, remainingMs);

    return () => clearTimeout(id);
  }, [expectedDurationSeconds, player, playerStatus.currentTime, playerStatus.duration, previewState]);

  const stopPreview = useCallback((): void => {
    if (isDestroyedRef.current) return;
    playTokenRef.current += 1;
    player.pause();
    player.seekTo(0).catch((error: unknown) => {
      console.warn('[audio] seekTo failed (continuing):', error);
    });
    setElapsedSeconds(0);
    setPreviewState(isModule || (audioSource && fileExists) ? 'ready' : 'disabled');
  }, [audioSource, fileExists, isModule, player]);

  const playPreview = useCallback(async (): Promise<void> => {
    if (!isModule && (!audioSource || !fileExists)) {
      setPreviewState('disabled');
      return;
    }
    try {
      const playToken = playTokenRef.current + 1;
      playTokenRef.current = playToken;

      await configurePlaybackAudioMode();
      if (playTokenRef.current !== playToken || isDestroyedRef.current) return;
      player.pause();
      if (loadedSourceRef.current !== audioSource) {
        if (isModule) {
          player.replace(audioSource as number);
        } else {
          player.replace({ uri: audioSource as string });
        }
        loadedSourceRef.current = audioSource;
      }
      player.loop = false;
      player.volume = 1;
      player.shouldCorrectPitch = false;
      player.setPlaybackRate(playbackRate);
      await player.seekTo(0);
      if (playTokenRef.current !== playToken || isDestroyedRef.current) return;
      player.play();
      setElapsedSeconds(0);
      setPreviewState('playing');

      setTimeout(() => {
        if (playTokenRef.current !== playToken) return;
        if (isDestroyedRef.current) return;
        const currentStatus = player.currentStatus;
        if (!currentStatus.playing && !currentStatus.isBuffering && !currentStatus.didJustFinish) {
          player.pause();
          player.seekTo(0).catch((error: unknown) => {
            console.warn('[audio] seekTo failed (continuing):', error);
          });
          setElapsedSeconds(0);
          setPreviewState('error');
        }
      }, PLAY_START_TIMEOUT_MS);
    } catch (error: unknown) {
      reportError(error, { scope: 'audio.playPreview' });
      setPreviewState('error');
    }
  }, [audioSource, fileExists, isModule, player, playbackRate]);

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
