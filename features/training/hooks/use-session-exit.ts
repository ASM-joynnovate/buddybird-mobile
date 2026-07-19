import { usePreventRemove } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

import type { SessionStatus } from '../session-config';

// 네이티브 세션이 마이크·재생을 붙들고 있는 상태.
const RUNNING_STATUSES: SessionStatus[] = ['starting', 'running', 'paused', 'interrupted'];

interface UseSessionExitOptions {
  status: SessionStatus;
  // 세션을 실제로 중단하는 부수효과만 수행한다(화면 이동은 이 훅이 책임진다).
  stopSession: () => void;
}

interface UseSessionExitResult {
  // 종료 버튼용. 확인 없이 바로 중단하고 화면을 벗어난다.
  exitWithStop: () => void;
  isConfirmVisible: boolean;
  // 계속 진행 = 학습 화면에 그대로 머문다.
  dismissConfirm: () => void;
}

// 백그라운드 재생은 홈으로 나가 자리를 비운 동안을 위한 것이지, 앱 안에서 뒤로 나가는 경우가 아니다.
// 뒤로가기를 그대로 통과시키면 네이티브 세션만 남아 화면 어디에도 보이지 않는 채로 마이크를 붙들기 때문에
// (그 상태에서는 단어 녹음도 막힌다) 종료할지 계속 진행할지 먼저 묻는다.
export function useSessionExit({ status, stopSession }: UseSessionExitOptions): UseSessionExitResult {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  // 중단을 결정한 뒤에는 가로채기를 끄고 다음 렌더에서 이동한다.
  // 같은 핸들러 안에서 곧바로 이동하면 아직 가로채기가 살아 있어 확인창이 다시 뜬다.
  const exitWithStop = useCallback((): void => {
    setIsConfirmVisible(false);
    stopSession();
    setIsExiting(true);
  }, [stopSession]);

  // 뒤로가기는 가로채기만 하고 이동 action 은 버린다 — 확인창을 띄운 채 학습 화면에 머문다.
  usePreventRemove(RUNNING_STATUSES.includes(status) && !isExiting, () => {
    setIsConfirmVisible(true);
  });

  // 확인창이 떠 있는 동안의 뒤로가기는 여기서 삼켜 "계속 진행" 과 같게 처리한다.
  // Modal 이 back 을 소비하리라 기대할 수 없다 — 실기기에서 이벤트가 그대로 통과해
  // 앱이 홈으로 빠져나가는 것을 확인했다.
  useEffect(() => {
    if (!isConfirmVisible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setIsConfirmVisible(false);
      return true;
    });
    return () => subscription.remove();
  }, [isConfirmVisible]);

  useEffect(() => {
    if (isExiting) router.back();
  }, [isExiting, router]);

  return { exitWithStop, isConfirmVisible, dismissConfirm: () => setIsConfirmVisible(false) };
}
