// 세션 성능 저하 계측 (BB-285, PRD-0001 NFR-01) — 기준치 초과 시 session_perf_degraded 발행.
// 엔진 이벤트를 독립 구독(리스너 멀티캐스트)하고, AppState active + 엔진 running일 때만 측정한다 —
// 백그라운드 타이머 스로틀이 복귀 시 만드는 거대한 가짜 드리프트를 오탐하지 않기 위함.
// 업로드 동의 상태는 읽기만 한다 — 측정·발행을 게이트하지 않는다 (동의 거부 세션 = 대조군, 완료 조건 2).

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useAnalytics } from '@/features/analytics/analytics-context';
import {
  loadUploadConsent,
  type UploadConsentStatus,
} from '@/features/upload-consent/upload-consent-storage';
import { sessionAudioEngine, type SessionEngineSnapshot } from '@/modules/session-audio-engine';

import { isCaptureFlushInFlight } from '../follow-along-upload';
import {
  computeTickDriftMs,
  createThrottleState,
  isDegraded,
  SESSION_PERF_THRESHOLDS,
  shouldEmit,
  type SessionPerfKind,
} from '../session-perf-model';

interface UseSessionPerfInput {
  sessionId: string;
}

export function useSessionPerf({ sessionId }: UseSessionPerfInput): void {
  const { track } = useAnalytics();
  const [running, setRunning] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const throttleRef = useRef(createThrottleState());
  const lastObservedDelayRef = useRef<number | null | undefined>(undefined);
  // 동의 팝업은 학습 탭 진입 트리거라 세션 중 불변 — mount 시 1회 로드해 발행 경로를 동기로 유지.
  const consentRef = useRef<UploadConsentStatus>('unknown');

  useEffect(() => {
    throttleRef.current = createThrottleState();
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    loadUploadConsent()
      .then((record) => {
        if (!cancelled) consentRef.current = record.status;
      })
      .catch((error: unknown) => {
        console.warn('[training.sessionPerf]', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const emitDegraded = useCallback(
    (kind: SessionPerfKind, valueMs: number): void => {
      const verdict = shouldEmit(throttleRef.current, kind, Date.now());
      if (!verdict.emit) return;
      throttleRef.current = verdict.next;
      track({
        name: 'session_perf_degraded',
        params: {
          kind,
          value_ms: Math.round(valueMs),
          during_upload: isCaptureFlushInFlight(),
          session_id: sessionId,
          consent_status: consentRef.current,
        },
      });
    },
    [sessionId, track],
  );

  useEffect(() => {
    const apply = (snapshot: SessionEngineSnapshot): void => {
      if (snapshot.sessionId !== sessionId) return;
      setRunning(snapshot.state === 'running');
      // audio_delay: 네이티브가 확정한 의도→재생 시작 지연 (측정·running 게이트는 네이티브 소관).
      // 값 전이로만 판정한다 — 스케줄마다 네이티브가 필드를 리셋(undefined)하므로 재생 1회당 1판정.
      // Android는 미확정 구간에 null 값, iOS는 키 생략 — 둘 다 "값 없음"으로 취급한다.
      const delayMs = snapshot.lastPlaybackStartDelayMs;
      if (delayMs !== lastObservedDelayRef.current) {
        lastObservedDelayRef.current = delayMs;
        if (delayMs != null && isDegraded('audio_delay', delayMs)) emitDegraded('audio_delay', delayMs);
      }
    };
    const unsubscribers = [sessionAudioEngine.onStateChanged(apply), sessionAudioEngine.onProgress(apply)];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [emitDegraded, sessionId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppActive(nextState === 'active');
    });
    return () => subscription.remove();
  }, []);

  // ui_lag: interval 예상 tick 대비 실제 시각 드리프트 = JS 스레드 점유(zipSync 등) 직접 포착.
  // 게이트를 벗어나면 interval 해제 — 기준점도 함께 버려져 복귀 시 드리프트가 0부터 시작한다.
  useEffect(() => {
    if (!running || !appActive) return;
    let expectedAtMs = Date.now() + SESSION_PERF_THRESHOLDS.tickIntervalMs;
    const id = setInterval(() => {
      const nowMs = Date.now();
      const driftMs = computeTickDriftMs(expectedAtMs, nowMs);
      // 다음 기준점은 실제 시각 기준 — 밀린 tick의 지연이 다음 tick 드리프트로 이월되지 않게.
      expectedAtMs = nowMs + SESSION_PERF_THRESHOLDS.tickIntervalMs;
      if (isDegraded('ui_lag', driftMs)) emitDegraded('ui_lag', driftMs);
    }, SESSION_PERF_THRESHOLDS.tickIntervalMs);
    return () => clearInterval(id);
  }, [appActive, emitDegraded, running]);
}
