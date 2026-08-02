import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { getCurrentUid, subscribeToUid } from '@/features/auth/auth-identity';
import { requestCaptureFlush } from '@/features/training/follow-along-upload';

/**
 * 캡처 업로드 트리거 ③(콜드 스타트·포그라운드 진입)·④(네트워크 미연결→연결 전환) 배선
 * (SPEC-0003). UI 없는 구독 전용 컴포넌트 — 게이트 판정은 flush 내부 소관이라 여기서는
 * 시점(edge) 감지만 한다. flush 는 fire-and-forget single-flight 라 중복 호출 안전.
 */
export function CaptureUploadBootstrap() {
  useEffect(() => {
    // auth-identity 가 웹 미지원 (auth-context 와 같은 가드). 웹은 게이트도 항상 닫힌다.
    if (Platform.OS === 'web') return;

    // 콜드 스타트 1회. 네이티브 uid 복원이 끝나기 전이면 게이트가 닫혀 있어 헛방이 되므로,
    // 그 경우엔 첫 uid 확보 시점으로 미뤄 재실행 직후 잔여 클립 업로드를 보장한다.
    let unsubscribeUid: (() => void) | null = null;
    if (getCurrentUid()) {
      requestCaptureFlush();
    } else {
      let fired = false;
      unsubscribeUid = subscribeToUid((uid) => {
        if (!uid || fired) return;
        fired = true;
        requestCaptureFlush();
      });
    }

    let appState = AppState.currentState;
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appState;
      appState = nextState;
      if (prevState.match(/inactive|background/) && nextState === 'active') requestCaptureFlush();
    });

    // NetInfo 는 구독 직후 현재 상태로 1회 콜백한다 — 이전 값이 null 이라 edge 로 치지 않는다
    // (앱 시작 시 이미 온라인인 경우는 위 콜드 스타트 호출이 담당).
    let wasConnected: boolean | null = null;
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const prevConnected = wasConnected;
      wasConnected = state.isConnected;
      if (prevConnected === false && state.isConnected === true) requestCaptureFlush();
    });

    return () => {
      unsubscribeUid?.();
      appStateSubscription.remove();
      unsubscribeNetInfo();
    };
  }, []);

  return null;
}
