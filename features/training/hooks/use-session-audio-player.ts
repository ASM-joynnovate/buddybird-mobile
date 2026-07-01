import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { reportError } from '@/features/analytics/error-reporter';
import { recordingFileExists } from '@/features/audio/audio-file-storage';
import { configurePlaybackAudioMode } from '@/features/audio/audio-mode';

import type { SessionStatus } from '../session-config';

interface UseSessionAudioPlayerInput {
  audioUri?: string | number;
  phase: 'learning' | 'rest';
  status: SessionStatus;
}

export interface UseSessionAudioPlayerResult {
  audioOn: boolean;
  // 재생 종료 후 다음 재생까지의 무음 갭(따라하기 구간) 동안 true. 이 구간에서만 VAD 녹음.
  inFollowGap: boolean;
}

// 세션 phase/status 에 반응하는 오디오 재생 lifecycle 을 단독 소유한다.
// - 학습(learning) phase + running 일 때만 재생, 그 외 일시정지
// - 재생 종료(didJustFinish) 후 무음 갭만큼 기다렸다가 다시 재생(루프 대체)
// - 언마운트 시 안전한 정지(이미 teardown 된 네이티브 플레이어 호출 방지)
export function useSessionAudioPlayer({
  audioUri,
  phase,
  status,
}: UseSessionAudioPlayerInput): UseSessionAudioPlayerResult {
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearSilenceTimer(): void {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  const sessionPlayer = useAudioPlayer(audioUri, { updateInterval: 100 });
  const sessionPlayerStatus = useAudioPlayerStatus(sessionPlayer);

  const [inFollowGap, setInFollowGap] = useState(false);

  const audioOn = status === 'running' && phase === 'learning' && sessionPlayerStatus.playing;

  useEffect(() => {
    if (!audioUri) return;
    // 번들 모듈 번호는 항상 접근 가능하므로 파일 존재 검사를 건너뛴다.
    // 시뮬레이터 클린 reinstall 등으로 파일이 사라진 경우 무음 진행. 크래시 방지.
    if (typeof audioUri === 'string' && !recordingFileExists(audioUri)) {
      reportError(new Error('녹음 파일을 찾을 수 없어 학습 오디오를 재생하지 않습니다.'), {
        scope: 'training.sessionPlayer.missingFile',
      });
      return;
    }
    let isCancelled = false;
    if (status === 'running' && phase === 'learning') {
      sessionPlayer.loop = false;
      configurePlaybackAudioMode()
        .then(() => sessionPlayer.seekTo(0))
        .then(() => {
          if (!isCancelled) sessionPlayer.play();
        })
        .catch((error: unknown) => {
          reportError(error, { scope: 'training.sessionPlayerSetup' });
          if (!isCancelled) sessionPlayer.play();
        });
    } else {
      clearSilenceTimer();
      sessionPlayer.pause();
    }
    return () => {
      isCancelled = true;
      clearSilenceTimer();
    };
  }, [phase, status, audioUri, sessionPlayer]);

  useEffect(() => {
    if (status !== 'running' || phase !== 'learning') return;
    if (!sessionPlayerStatus.didJustFinish) return;

    const rawDuration = sessionPlayerStatus.duration;
    const gapMs = typeof rawDuration === 'number' && rawDuration > 0 ? rawDuration * 1000 : 0;

    let isCancelled = false;
    clearSilenceTimer();
    // 재생이 방금 끝났고 다음 재생까지의 무음 갭(따라하기 구간)에 진입 → VAD 녹음 창을 연다.
    setInFollowGap(true);
    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;
      if (isCancelled) return;
      // 갭 종료 → VAD 창을 닫고, 갭 동안 recording 모드로 바뀌었을 수 있으니 playback 모드를 재확정한다.
      setInFollowGap(false);
      configurePlaybackAudioMode()
        .then(() => sessionPlayer.seekTo(0))
        .then(() => {
          if (!isCancelled) sessionPlayer.play();
        })
        .catch((error: unknown) => {
          reportError(error, { scope: 'training.sessionPlayer.gapReplay' });
          if (!isCancelled) sessionPlayer.play();
        });
    }, gapMs);
    // 타이머는 취소하지 않음 — didJustFinish는 한 사이클만 true이므로 타이머는 fire되어야 함.
    // isCancelled로 언마운트 후 해제된 네이티브 플레이어 호출만 방지.
    return () => {
      isCancelled = true;
    };
  }, [sessionPlayerStatus.didJustFinish, sessionPlayerStatus.duration, status, phase, sessionPlayer]);

  // running+learning 을 벗어나면(일시정지·정지·rest 전환 등) 갭 신호를 즉시 내린다.
  // 갭 타이머는 위 재생 effect / phase-status effect / 언마운트가 정리하지만, inFollowGap 은
  // 여기서 한곳에 모아 내려 VAD 녹음이 갭 밖으로 새는 것을 막는다(stuck-true 방지).
  useEffect(() => {
    if (!(status === 'running' && phase === 'learning')) setInFollowGap(false);
  }, [status, phase]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      try {
        sessionPlayer.pause();
      } catch (error: unknown) {
        // expo-audio player가 이미 teardown 상태일 수 있음. cleanup 단계라 복구 불필요.
        console.warn('[training.sessionPlayer.cleanup]', error);
      }
    };
  }, [sessionPlayer]);

  return { audioOn, inFollowGap };
}
