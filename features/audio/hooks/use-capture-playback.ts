import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { reportError } from '@/features/analytics/error-reporter';

import { configurePlaybackAudioMode } from '../audio-mode';

// 캡처 디버그 화면 전용 재생 컨트롤러. 화면당 플레이어 하나를 공유해 한 번에 한 클립만 재생한다
// (다른 행/세그먼트를 누르면 이전 재생은 자동 정지). range 지정 시 endMs 도달 시점에 스스로 멈춘다.
export interface PlaybackRange {
  startMs: number;
  endMs: number;
}

export interface CapturePlaybackController {
  // 현재 재생 중인 클립 키(재생 중 아님 = null). 행/세그먼트가 자기 재생 상태를 비교하는 용도.
  activeKey: string | null;
  play: (key: string, uri: string, range?: PlaybackRange) => Promise<void>;
  stop: () => void;
}

const UPDATE_INTERVAL_MS = 50;

export function useCapturePlayback(): CapturePlaybackController {
  // keepAudioSessionActive: use-audio-preview.ts 와 같은 이유 — expo-audio의 pause() 지연
  // 세션 비활성화가 녹음 중인 recorder를 죽이지 않도록 앱 전 플레이어에서 끈다.
  const player = useAudioPlayer(null, { updateInterval: UPDATE_INTERVAL_MS, keepAudioSessionActive: true });
  const status = useAudioPlayerStatus(player);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const loadedUriRef = useRef<string | null>(null);
  const endMsRef = useRef<number | null>(null);
  const tokenRef = useRef(0);
  const isDestroyedRef = useRef(false);

  useEffect(() => {
    return () => {
      isDestroyedRef.current = true;
    };
  }, []);

  const stop = useCallback((): void => {
    if (isDestroyedRef.current) return;
    tokenRef.current += 1;
    endMsRef.current = null;
    setActiveKey(null);
    player.pause();
    player.seekTo(0).catch((error: unknown) => {
      console.warn('[audio.capturePlayback] seekTo failed (continuing):', error);
    });
  }, [player]);

  // range 끝 도달 / 자연 종료 / 실패 시 정지. currentTime 은 UPDATE_INTERVAL_MS 마다 갱신된다.
  useEffect(() => {
    if (activeKey === null) return;
    if (status.didJustFinish || status.playbackState === 'ended' || status.playbackState === 'failed') {
      stop();
      return;
    }
    const endMs = endMsRef.current;
    if (endMs !== null && status.currentTime * 1000 >= endMs) {
      stop();
    }
  }, [activeKey, status.currentTime, status.didJustFinish, status.playbackState, stop]);

  const play = useCallback(
    async (key: string, uri: string, range?: PlaybackRange): Promise<void> => {
      try {
        const token = tokenRef.current + 1;
        tokenRef.current = token;

        await configurePlaybackAudioMode();
        if (tokenRef.current !== token || isDestroyedRef.current) return;

        player.pause();
        if (loadedUriRef.current !== uri) {
          player.replace({ uri });
          loadedUriRef.current = uri;
        }
        player.loop = false;
        player.volume = 1;
        player.shouldCorrectPitch = false;
        player.setPlaybackRate(1);

        const startMs = range ? Math.max(0, range.startMs) : 0;
        endMsRef.current = range ? range.endMs : null;
        await player.seekTo(startMs / 1000);
        if (tokenRef.current !== token || isDestroyedRef.current) return;

        player.play();
        setActiveKey(key);
      } catch (error: unknown) {
        reportError(error, { scope: 'audio.capturePlayback.play' });
        setActiveKey(null);
      }
    },
    [player],
  );

  return useMemo(() => ({ activeKey, play, stop }), [activeKey, play, stop]);
}
